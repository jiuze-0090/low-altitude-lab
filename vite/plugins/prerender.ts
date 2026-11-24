import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createServer, type Plugin } from 'vite'

import { attr, esc, escInline, plainText, renderMarkdown } from './prerender-lib'

const ORIGIN = 'https://lab.nbyteair.com'

/**
 * 构建期静态预渲染（SEO / GEO）
 * ---------------------------------------------------------------------------
 * 站点是 React SPA（CSR 空壳），AI 爬虫与多数搜索引擎不执行 JS，
 * 原始 HTML 里没有任何正文。本插件在 build 完成后：
 *
 *   1. 复用 sitemap 插件的做法，用内存 Vite 实例 SSR 加载内容模块，
 *      拿到 sitemapUrls() 与全部内容数据；
 *   2. 为每个路由生成一份带完整正文的静态 HTML，写入 dist/<path>/index.html；
 *      每页独立 title / description / canonical / og / JSON-LD；
 *   3. 静态正文放在 #root 内，React createRoot 挂载时自动清空替换——
 *      真人用户无感，爬虫/AI 读到全文。
 *
 * 关键点：URL 清单来自 sitemapUrls()，内容来自 src/content/——
 * 后续新增内容只要按规范写进 content，构建时会自动生成对应静态页，
 * 不需要改本插件。
 */
export default function prerender(): Plugin {
  let data: PrerenderData | null = null

  return {
    name: 'prerender',
    apply: 'build',

    async buildStart() {
      const root = process.cwd()
      const server = await createServer({
        configFile: false,
        root,
        logLevel: 'silent',
        server: { middlewareMode: true },
        resolve: { alias: { '@': join(root, 'src') } },
      })
      try {
        const mod = await server.ssrLoadModule('/src/content/index.ts')
        const cheats = await server.ssrLoadModule('/src/content/cheatsheets.ts')
        const guides = await server.ssrLoadModule('/src/content/guides.ts')
        const resources = await server.ssrLoadModule('/src/content/resources.ts')
        data = {
          siteMeta: mod.siteMeta,
          chapters: mod.chapters,
          knowledgePoints: mod.knowledgePoints,
          experiments: mod.experiments,
          chapterById: mod.chapterById,
          knowledgePointById: mod.knowledgePointById,
          experimentBySlug: mod.experimentBySlug,
          experimentById: mod.experimentById,
          urls: mod.sitemapUrls(),
          cheatsheetCards: cheats.cheatsheetCards,
          guideAnchors: guides.guideAnchors,
          calculatorMeta: resources.calculatorMeta,
        }
      } finally {
        await server.close()
      }
    },

    closeBundle() {
      if (!data) {
        this.warn('prerender：内容模块未取到，跳过静态预渲染')
        return
      }
      const dist = join(process.cwd(), 'dist')
      const templatePath = join(dist, 'index.html')
      if (!existsSync(templatePath)) {
        this.warn('prerender：dist/index.html 不存在，跳过')
        return
      }
      const template = readFileSync(templatePath, 'utf-8')

      let count = 0
      for (const entry of data.urls) {
        const page = buildPage(entry.path, data)
        if (!page) continue
        const html = applyTemplate(template, page)
        const outPath = join(dist, entry.path.replace(/^\//, ''), 'index.html')
        mkdirSync(dirname(outPath), { recursive: true })
        writeFileSync(outPath, html, 'utf-8')
        count++
      }
      this.info?.(`prerender：已生成 ${count} 个静态页（含完整正文 + 独立 head + JSON-LD）`)
    },
  }
}

/* -------------------------------------------------------------------------- */
/* 类型                                                                        */
/* -------------------------------------------------------------------------- */

type SitemapEntry = { path: string; changefreq: string; priority: string }

type PrerenderData = {
  siteMeta: Record<string, unknown>
  chapters: AnyObj[]
  knowledgePoints: AnyObj[]
  experiments: AnyObj[]
  chapterById: Map<string, AnyObj>
  knowledgePointById: Map<string, AnyObj>
  experimentBySlug: Map<string, AnyObj>
  experimentById: Map<string, AnyObj>
  urls: SitemapEntry[]
  cheatsheetCards: AnyObj[]
  guideAnchors: Record<string, string>
  calculatorMeta: AnyObj[]
}

type AnyObj = Record<string, any>

type Page = {
  path: string
  title: string
  description: string
  /** #root 内的静态正文 HTML */
  body: string
  /** JSON-LD 对象数组 */
  schema: AnyObj[]
}

/* -------------------------------------------------------------------------- */
/* 页面分发                                                                    */
/* -------------------------------------------------------------------------- */

function buildPage(path: string, d: PrerenderData): Page | null {
  const titleTpl = String(d.siteMeta.titleTemplate ?? '%s · 低空原理实验室')
  const t = (name: string) => titleTpl.replace('%s', name)
  const siteDesc = String(d.siteMeta.description ?? '')

  // 知识点页
  if (path.startsWith('/points/')) {
    const id = path.slice('/points/'.length)
    const kp = d.knowledgePointById.get(id)
    if (!kp) return null
    const chapter = d.chapterById.get(kp.chapterId)
    return knowledgePointPage(kp, chapter, d, t)
  }

  // 实验页
  if (path.startsWith('/labs/')) {
    const slug = path.slice('/labs/'.length)
    const exp = d.experimentBySlug.get(slug)
    if (!exp) return null
    const chapter = d.chapterById.get(exp.chapterId)
    return experimentPage(exp, chapter, d, t)
  }

  // 章节页
  if (path.startsWith('/principles/')) {
    const id = path.slice('/principles/'.length)
    const chapter = d.chapterById.get(id)
    if (!chapter) return null
    return chapterPage(chapter, d, t)
  }

  switch (path) {
    case '/':
      return homePage(d)
    case '/principles':
      return principlesPage(d, t)
    case '/labs':
      return labsPage(d, t)
    case '/guides':
      return guidesPage(d, t)
    case '/cheatsheets':
      return cheatsheetsPage(d, t)
    case '/exam':
      return examPage(d, t)
    case '/tools':
      return toolsPage(d, t)
    case '/about':
      return aboutPage(d, t)
    default:
      return null
  }
}

/* -------------------------------------------------------------------------- */
/* 站内导航                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * 页脚导航
 * ---------------------------------------------------------------------------
 * 预渲染正文原本是一个孤岛：知识点页 / 实验页 / 考点索引页里一个站内 <a> 都没有，
 * 百度蜘蛛抓到后没有任何路径能走到下一个页面，只能靠 sitemap 兜底，
 * 28 个知识点页面在索引里就是 28 个孤岛。
 *
 * 所有页面的静态正文都统一带上这组导航 → 至少保证「站内可达 + 权重能流动」。
 * 入口与 src/components/layout/SiteHeader.tsx 的 NAV 保持一致。
 */
const SITE_NAV: Array<{ to: string; label: string }> = [
  { to: '/', label: '首页' },
  { to: '/principles', label: '原理目录' },
  { to: '/labs', label: '实验室' },
  { to: '/guides', label: '速查' },
  { to: '/cheatsheets', label: '原理卡' },
  { to: '/exam', label: '考点' },
  { to: '/tools', label: '工具' },
  { to: '/about', label: '关于' },
]

function siteNavHtml(currentPath: string): string {
  const items = SITE_NAV.map((n) => {
    const isCur = n.to === currentPath
    return `<a href="${attr(n.to)}"${isCur ? ' aria-current="page"' : ''} style="${
      isCur
        ? 'font-weight:700;color:#1a2233;text-decoration:none'
        : 'color:#3b5bdb;text-decoration:none'
    }">${esc(n.label)}</a>`
  }).join('')
  return `<nav aria-label="站内导航" style="margin-top:40px;padding-top:20px;border-top:1px solid #e3e8f0;font-size:0.9rem"><a href="${attr(
    '/',
  )}" style="color:#3b5bdb;text-decoration:none;font-weight:700">低空原理实验室</a> · ${items}</nav>`
}

/* -------------------------------------------------------------------------- */
/* 各页正文                                                                    */
/* -------------------------------------------------------------------------- */

function pageShell(
  title: string,
  lead: string,
  content: string,
  extra = '',
  currentPath = '',
): string {
  return `
<div class="seo-static" style="max-width:820px;margin:0 auto;padding:32px 20px 64px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.75;color:#1a2233">
  <h1 style="font-size:1.9rem;line-height:1.3;margin:0 0 16px">${esc(title)}</h1>
  <p style="font-size:1.05rem;color:#44506a;margin:0 0 28px">${esc(lead)}</p>
  ${extra}
  <div class="seo-static-body">${content}</div>
  ${siteNavHtml(currentPath)}
</div>`.trim()
}

function breadcrumb(path: string, title: string): AnyObj {
  const segments = path.split('/').filter(Boolean)
  const items: AnyObj[] = [
    { '@type': 'ListItem', position: 1, name: '低空原理实验室', item: `${ORIGIN}/` },
  ]
  let cur = ''
  segments.forEach((seg, i) => {
    cur += `/${seg}`
    const last = i === segments.length - 1
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name: last ? title : decodeURIComponent(seg),
      ...(last ? {} : { item: `${ORIGIN}${cur}` }),
    })
  })
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }
}

function articleSchema(path: string, title: string, description: string): AnyObj {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${ORIGIN}${path}` },
    author: { '@type': 'Organization', name: '新字节航空' },
    publisher: {
      '@type': 'Organization',
      name: '山东新字节航空科技有限公司',
    },
    inLanguage: 'zh-CN',
  }
}

function orgSchema(): AnyObj {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '新字节航空',
    legalName: '山东新字节航空科技有限公司',
    url: ORIGIN,
    sameAs: ['https://www.nbyteair.com'],
  }
}

function homePage(d: PrerenderData): Page {
  const desc = String(d.siteMeta.description ?? '')
  const chapterLinks = d.chapters
    .map((c) => `<li><a href="/principles/${attr(c.id)}">${esc(c.title)}</a>：${esc(c.intro)}</li>`)
    .join('')
  const labLinks = d.experiments
    .map(
      (e) =>
        `<li><a href="/labs/${attr(e.slug)}">${esc(e.title)}</a>——${escInline(e.hook)}（约 ${esc(e.minutes)} 分钟）</li>`,
    )
    .join('')
  // 全部知识点直达链接：28 个知识点页从首页一跳可达，
  // 而不是必须先进章节页再进知识点（爬虫深度越浅，抓取越快）。
  const kpLinks = d.knowledgePoints
    .map(
      (k) =>
        `<li><a href="/points/${attr(k.id)}">${esc(k.title)}</a>：${escInline(k.summary)}</li>`,
    )
    .join('')
  const body = pageShell(
    String(d.siteMeta.title ?? '低空原理实验室'),
    desc,
    `<h2>六条原理主线</h2><ul>${chapterLinks}</ul>
     <h2>交互实验室</h2><p>共 ${d.experiments.length} 个动手实验，覆盖 ${d.knowledgePoints.length} 个知识点。预测 → 揭晓 → 归因，把抽象的力变成你手上的一根杆。</p><ul>${labLinks}</ul>
     <h2>全部知识点</h2><p>共 ${d.knowledgePoints.length} 条原理，每条都标出考法与对应操作。</p><ul>${kpLinks}</ul>`,
    '',
    '/',
  )
  return {
    path: '/',
    title: String(d.siteMeta.title ?? '低空原理实验室'),
    description: desc,
    body,
    schema: [orgSchema()],
  }
}

function principlesPage(d: PrerenderData, t: (s: string) => string): Page {
  const title = '原理目录'
  const desc = '从气动与飞行原理到起降与着陆，六条主线串起 CAAC 无人机驾驶员理论考试的核心知识点。每条原理都标出它在实操中对应哪根杆。'
  const list = d.chapters
    .map(
      (c, i) =>
        `<h2>${i + 1}. <a href="/principles/${attr(c.id)}">${esc(c.title)}</a></h2><p>${esc(c.intro)}</p><p>本章 ${c.knowledgePointIds?.length ?? 0} 个知识点，${c.experimentIds?.length ?? 0} 个交互实验。</p>`,
    )
    .join('')
  return {
    path: '/principles',
    title: t(title),
    description: desc,
    body: pageShell(title, desc, list, '', '/principles'),
    schema: [breadcrumb('/principles', title)],
  }
}

function chapterPage(chapter: AnyObj, d: PrerenderData, t: (s: string) => string): Page {
  const title = String(chapter.title ?? '')
  const intro = String(chapter.intro ?? '')
  const kps = (chapter.knowledgePointIds ?? [])
    .map((id: string) => d.knowledgePointById.get(id))
    .filter(Boolean)
    .map(
      (k: AnyObj) =>
        `<li><a href="/points/${attr(k.id)}">${esc(k.title)}</a>：${escInline(k.summary)}</li>`,
    )
    .join('')
  const exps = (chapter.experimentIds ?? [])
    .map((id: string) => d.experimentById.get(id))
    .filter(Boolean)
    .map(
      (e: AnyObj) =>
        `<li><a href="/labs/${attr(e.slug)}">${esc(e.title)}</a>——${escInline(e.hook)}</li>`,
    )
    .join('')
  return {
    path: `/principles/${chapter.id}`,
    title: t(title),
    description: intro,
    body: pageShell(
      title,
      intro,
      `<h2>本章知识点</h2><ul>${kps}</ul><h2>本章交互实验</h2><ul>${exps}</ul>`,
      '',
      `/principles/${chapter.id}`,
    ),
    schema: [articleSchema(`/principles/${chapter.id}`, title, intro), breadcrumb(`/principles/${chapter.id}`, title)],
  }
}

function knowledgePointPage(
  kp: AnyObj,
  chapter: AnyObj | undefined,
  d: PrerenderData,
  t: (s: string) => string,
): Page {
  const title = String(kp.title ?? '')
  const summary = String(kp.summary ?? '')
  const parts: string[] = []
  parts.push(`<h2>要点速览</h2><p>${escInline(summary)}</p>`)
  if (kp.body) parts.push(`<h2>原理详解</h2>${renderMarkdown(String(kp.body))}`)
  if (Array.isArray(kp.formulas) && kp.formulas.length) {
    parts.push(
      `<h2>核心公式</h2>${kp.formulas.map((f: string) => renderMarkdown(`$$${f}$$`)).join('')}`,
    )
  }
  if (kp.onYourStick) {
    parts.push(`<h2>这在你手上是哪根杆</h2>${renderMarkdown(String(kp.onYourStick))}`)
  }
  if (Array.isArray(kp.examAngles) && kp.examAngles.length) {
    parts.push(
      `<h2>高频考法</h2><ul>${kp.examAngles.map((a: string) => `<li>${esc(a)}</li>`).join('')}</ul>`,
    )
  }
  // 同章其他知识点：让爬虫能从任一知识点走到兄弟知识点，
  // 也给读者一条「这个原理在整章里处于什么位置」的路径。
  const siblings = ((chapter?.knowledgePointIds ?? []) as string[])
    .filter((id) => id !== kp.id)
    .map((id) => d.knowledgePointById.get(id))
    .filter(Boolean)
    .map(
      (k: AnyObj) =>
        `<li><a href="/points/${attr(k.id)}">${esc(k.title)}</a>：${escInline(k.summary)}</li>`,
    )
  if (siblings.length) {
    parts.push(`<h2>本章其他知识点</h2><ul>${siblings.join('')}</ul>`)
  }

  // 本章交互实验：知识点 ↔ 实验是双向关系，实验页也有反向链接
  const exps = ((chapter?.experimentIds ?? []) as string[])
    .map((id) => d.experimentById.get(id))
    .filter(Boolean)
    .map(
      (e: AnyObj) =>
        `<li><a href="/labs/${attr(e.slug)}">${esc(e.title)}</a>——${escInline(e.hook)}</li>`,
    )
  if (exps.length) {
    parts.push(`<h2>本章交互实验</h2><ul>${exps.join('')}</ul>`)
  }

  const lead = chapter
    ? `所属章节：${esc(chapter.title)}。${escInline(summary)}`
    : escInline(summary)
  return {
    path: `/points/${kp.id}`,
    title: t(title),
    description: plainText(summary),
    body: pageShell(title, lead, parts.join('\n'), '', `/points/${kp.id}`),
    schema: [
      articleSchema(`/points/${kp.id}`, title, plainText(summary)),
      breadcrumb(`/points/${kp.id}`, title),
    ],
  }
}

function experimentPage(
  exp: AnyObj,
  chapter: AnyObj | undefined,
  d: PrerenderData,
  t: (s: string) => string,
): Page {
  const title = String(exp.title ?? '')
  const hook = String(exp.hook ?? '')
  const parts: string[] = []
  if (exp.quickTake) {
    const qt = exp.quickTake
    parts.push(
      `<h2>30 秒速览</h2><p><strong>${esc(qt.conclusion)}</strong></p><ul>${(qt.points ?? [])
        .map((p: string) => `<li>${esc(p)}</li>`)
        .join('')}</ul>`,
    )
  }
  const pred = exp.prediction
  if (pred) {
    parts.push(`<h2>先猜一次</h2><p>${esc(pred.prompt)}</p>`)
    if (pred.attribution) {
      parts.push(`<h2>揭晓与归因</h2>${renderMarkdown(String(pred.attribution))}`)
    }
    if (pred.stickControl) {
      parts.push(`<h2>这在你手上是哪根杆</h2>${renderMarkdown(String(pred.stickControl))}`)
    }
  }
  if (exp.principle) {
    parts.push(`<h2>原理详解</h2>${renderMarkdown(String(exp.principle))}`)
  }
  if (exp.cheatsheet?.rows?.length) {
    parts.push(
      `<h2>速查卡 · ${esc(exp.cheatsheet.title)}</h2><table><thead><tr><th>术语</th><th>数值/结论</th><th>说明</th></tr></thead><tbody>${exp.cheatsheet.rows
        .map(
          (r: AnyObj) =>
            `<tr><td>${esc(r.term)}</td><td>${esc(r.value)}</td><td>${esc(r.note)}</td></tr>`,
        )
        .join('')}</tbody></table>`,
    )
  }
  if (Array.isArray(exp.examRefs) && exp.examRefs.length) {
    parts.push(
      `<h2>这在考试里怎么问</h2><ul>${exp.examRefs
        .map((r: AnyObj) => `<li>${esc(r.code)}：${escInline(r.gist)}</li>`)
        .join('')}</ul>`,
    )
  }
  if (Array.isArray(exp.fieldNotes) && exp.fieldNotes.length) {
    parts.push(
      `<h2>实飞经验</h2>${exp.fieldNotes.map((n: string) => renderMarkdown(String(n))).join('')}`,
    )
  } else if (exp.fieldNote) {
    parts.push(`<h2>实飞经验</h2>${renderMarkdown(String(exp.fieldNote))}`)
  }

  // 关联知识点：实验 → 知识点 的正向链接（知识点页有反向的「本章交互实验」）
  const kps = (Array.isArray(exp.knowledgePointIds) ? exp.knowledgePointIds : [])
    .map((id: string) => d.knowledgePointById.get(id))
    .filter(Boolean)
    .map(
      (k: AnyObj) =>
        `<li><a href="/points/${attr(k.id)}">${esc(k.title)}</a>：${escInline(k.summary)}</li>`,
    )
  if (kps.length) {
    parts.push(`<h2>关联知识点</h2><ul>${kps.join('')}</ul>`)
  }

  // 同章其他实验
  const siblings = ((chapter?.experimentIds ?? []) as string[])
    .filter((id) => id !== exp.id)
    .map((id) => d.experimentById.get(id))
    .filter(Boolean)
    .map(
      (e: AnyObj) =>
        `<li><a href="/labs/${attr(e.slug)}">${esc(e.title)}</a>——${escInline(e.hook)}</li>`,
    )
  if (siblings.length) {
    parts.push(`<h2>本章其他实验</h2><ul>${siblings.join('')}</ul>`)
  }

  const lead = chapter ? `所属章节：${esc(chapter.title)}。${escInline(hook)}` : escInline(hook)
  return {
    path: `/labs/${exp.slug}`,
    title: t(title),
    description: plainText(hook),
    body: pageShell(title, lead, parts.join('\n'), '', `/labs/${exp.slug}`),
    schema: [
      articleSchema(`/labs/${exp.slug}`, title, plainText(hook)),
      breadcrumb(`/labs/${exp.slug}`, title),
    ],
  }
}

function labsPage(d: PrerenderData, t: (s: string) => string): Page {
  const title = '实验室'
  const desc = '全部交互实验清单：预测、揭晓、归因，一步步把抽象的飞行原理变成你手上的一根杆。'
  const list = d.chapters
    .map((c) => {
      const exps = (c.experimentIds ?? [])
        .map((id: string) => d.experimentById.get(id))
        .filter(Boolean)
        .map((e: AnyObj) => `<li><a href="/labs/${attr(e.slug)}">${esc(e.title)}</a>——${escInline(e.hook)}</li>`)
        .join('')
      return exps ? `<h2>${esc(c.title)}</h2><ul>${exps}</ul>` : ''
    })
    .join('')
  return {
    path: '/labs',
    title: t(title),
    description: desc,
    body: pageShell(title, desc, list, '', '/labs'),
    schema: [breadcrumb('/labs', title)],
  }
}

function guidesPage(d: PrerenderData, t: (s: string) => string): Page {
  const title = '规章速查卡'
  const desc = '空域分类、飞行高度层、间隔、气象数字、无人机分类限值——CAAC 理论考试常考的规章数字速查。'
  const anchors = d.guideAnchors ?? {}
  const list = Object.entries(anchors)
    .map(([id, name]) => `<li><a href="/guides#${attr(id)}">${esc(name as string)}</a></li>`)
    .join('')
  return {
    path: '/guides',
    title: t(title),
    description: desc,
    body: pageShell(title, desc, `<h2>速查目录</h2><ul>${list}</ul><p>完整的规章数字表格请在页面内查看。</p>`, '', '/guides'),
    schema: [breadcrumb('/guides', title)],
  }
}

function cheatsheetsPage(d: PrerenderData, t: (s: string) => string): Page {
  const title = '原理速查卡'
  const desc = '气动、稳定性、多旋翼、飞行性能、常用公式——把飞行原理压成一张可打印的速查卡。'
  // 每张卡自带 links[]（指向对应实验），是现成的站内链接来源
  const cards = (d.cheatsheetCards ?? [])
    .map((c: AnyObj) => {
      const links = Array.isArray(c.links) ? c.links : []
      const linkHtml = links.length
        ? `<ul>${links
            .map(
              (l: AnyObj) =>
                `<li><a href="${attr(l.to)}">${esc(l.label)}</a></li>`,
            )
            .join('')}</ul>`
        : ''
      return `<h2>${esc(c.title)}</h2><p>${esc(c.subtitle ?? '')}</p><p>共 ${c.rows?.length ?? 0} 条速查项。</p>${linkHtml}`
    })
    .join('')
  return {
    path: '/cheatsheets',
    title: t(title),
    description: desc,
    body: pageShell(
      title,
      desc,
      cards || '<p>原理速查卡，可在页面内查看与打印。</p>',
      '',
      '/cheatsheets',
    ),
    schema: [breadcrumb('/cheatsheets', title)],
  }
}

function examPage(d: PrerenderData, t: (s: string) => string): Page {
  const title = '考点索引'
  const desc = '按章节汇总全部交互实验关联的题库考点编号，按题干或编号检索，快速定位原理对应的考题。'

  // 每个考点码 → 指向引用它的实验页。
  // 这一页是站内搜索价值最高的页面（131 条长尾词），
  // 原来只是一堆纯文本题号，爬虫抓不到任何路径 → 现在每个码都能跳到对应原理。
  const list = d.chapters
    .map((c) => {
      const exps = (c.experimentIds ?? [])
        .map((id: string) => d.experimentById.get(id))
        .filter(Boolean)
      const items = exps
        .map((e: AnyObj) => {
          const refs = (e.examRefs ?? []) as AnyObj[]
          if (!refs.length) return ''
          // 锚文本带 gist（考点摘要）而不是纯数字：
          // 纯数字锚文本对搜索引擎零语义，加上关键词才是可被检索的入口。
          const codes = refs
            .map(
              (r: AnyObj) =>
                `<a href="/labs/${attr(e.slug)}" title="${attr(r.gist ?? '')}">${esc(
                  r.code,
                )}：${escInline(r.gist ?? '')}</a>`,
            )
            .join('、')
          return `<li><a href="/labs/${attr(e.slug)}">${esc(e.title)}</a>：${codes}</li>`
        })
        .filter(Boolean)
        .join('')
      return items
        ? `<h2><a href="/principles/${attr(c.id)}">${esc(c.title)}</a></h2><ul>${items}</ul>`
        : ''
    })
    .join('')

  return {
    path: '/exam',
    title: t(title),
    description: desc,
    body: pageShell(title, desc, list, '', '/exam'),
    schema: [breadcrumb('/exam', title)],
  }
}

function toolsPage(d: PrerenderData, t: (s: string) => string): Page {
  const title = '高频计算器'
  const desc = '密度高度、失速速度、风修正角、爬升率——把常考的飞行性能计算做成随手可用的小工具。'
  const tools = (d.calculatorMeta ?? [])
    .map((m: AnyObj) => `<li>${esc(m.name ?? m.title)}：${esc(m.desc ?? m.description ?? '')}</li>`)
    .join('')
  return {
    path: '/tools',
    title: t(title),
    description: desc,
    body: pageShell(title, desc, `<h2>可用工具</h2><ul>${tools}</ul>`, '', '/tools'),
    schema: [breadcrumb('/tools', title)],
  }
}

function aboutPage(d: PrerenderData, t: (s: string) => string): Page {
  const title = '关于本站'
  const orgFull = String(d.siteMeta.orgFull ?? '')
  const desc = `${orgFull}旗下面向 CAAC 无人机驾驶员理论考试的公益学习站：动手验过的原理，才叫懂。`
  const hotlines = (d.siteMeta.hotline as string[]) ?? []
  const contact = hotlines.length ? `<h2>咨询方式</h2><p>招生热线：${hotlines.map((h) => esc(h)).join('、')}</p>` : ''
  return {
    path: '/about',
    title: t(title),
    description: desc,
    body: pageShell(
      title,
      desc,
      `<h2>我们是谁</h2><p>本站是${esc(orgFull)}（简称"${esc(d.siteMeta.org)}"）旗下面向 CAAC 无人机驾驶员理论考试的公益学习站点。</p>
       <h2>本站做什么</h2><p>把飞行原理讲清楚：每条原理都标注它在题库里的考法、在实操里对应的操作动作。预测 → 揭晓 → 归因，一步步把抽象的力变成你手上的一根杆。</p>${contact}`,
      '',
      '/about',
    ),
    schema: [orgSchema(), breadcrumb('/about', title)],
  }
}

/* -------------------------------------------------------------------------- */
/* 模板套用                                                                    */
/* -------------------------------------------------------------------------- */

function applyTemplate(template: string, page: Page): string {
  let html = template

  const titleTag = `<title>${esc(page.title)}</title>`
  html = html.replace(/<title>[\s\S]*?<\/title>/, titleTag)

  const descRe = /(<meta\s+name="description"\s+content=")[\s\S]*?("\s*\/>)/i
  if (descRe.test(html)) {
    html = html.replace(descRe, (_m, a, b) => `${a}${attr(page.description)}${b}`)
  } else {
    html = html.replace('</head>', `    <meta name="description" content="${attr(page.description)}" />\n  </head>`)
  }

  // 移除模板自带的 og / twitter 卡片标签（含多行写法），避免与本页注入的重复冲突
  html = html.replace(/<meta\s[^>]*property="og:[^"]*"[^>]*\/>/gis, '')
  html = html.replace(/<meta\s[^>]*name="twitter:card"[^>]*\/>/gis, '')

  const canonical = `<link rel="canonical" href="${ORIGIN}${page.path}" />`
  const ogTags = [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="低空原理实验室" />`,
    `<meta property="og:url" content="${ORIGIN}${page.path}" />`,
    `<meta property="og:title" content="${attr(page.title)}" />`,
    `<meta property="og:description" content="${attr(page.description)}" />`,
    `<meta property="og:image" content="${ORIGIN}/og-default.svg" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ')
  const jsonLd = page.schema
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`)
    .join('\n    ')
  const headInject = `    ${canonical}\n    ${ogTags}\n    ${jsonLd}\n  </head>`
  html = html.replace('</head>', headInject)

  // 静态正文放进 #root；React createRoot 挂载时自动清空替换，真人无感
  html = html.replace('<div id="root"></div>', `<div id="root">${page.body}</div>`)

  return html
}
