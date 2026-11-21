import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, type Plugin } from 'vite'

const ORIGIN = 'https://lab.nbyteair.com'

type Entry = { path: string; changefreq: string; priority: string }

/**
 * 取仓库最后一次提交时间作为 lastmod
 * ---------------------------------------------------------------------------
 * 用构建时刻会让每次构建都声称"全站更新了"，百度会反复重抓；
 * 用内容实际改动的时间才准确。取不到（无 git 环境）就退回构建日。
 */
function lastModified(): string {
  try {
    const iso = execSync('git log -1 --format=%cI', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
    if (iso) return iso.slice(0, 10)
  } catch {
    // 没有 git 或命令失败，用构建日兜底
  }
  return new Date().toISOString().slice(0, 10)
}

/**
 * 构建期生成 sitemap.xml
 * ---------------------------------------------------------------------------
 * URL 清单直接取自 src/content/index.ts 的 sitemapUrls()——由内容数据推导，
 * 加了实验 / 知识点 / 章节，sitemap 自动跟着长，不会漏收新页面。
 *
 * robots.txt 早已声明 Sitemap 地址，但此前 dist 里并没有这个文件
 * （请求被 SPA 回退成 HTML），这个插件补上真实文件。
 */
export default function sitemap(): Plugin {
  let entries: Entry[] = []

  return {
    name: 'sitemap',
    apply: 'build',

    async buildStart() {
      const root = process.cwd()
      // 用一个内存态 Vite 实例加载内容模块：别名与 TS 编译都按项目配置走，
      // 不另写一套解析逻辑，避免与路由定义漂移。
      const server = await createServer({
        configFile: false,
        root,
        logLevel: 'silent',
        server: { middlewareMode: true },
        resolve: { alias: { '@': join(root, 'src') } },
      })
      try {
        const mod = await server.ssrLoadModule('/src/content/index.ts')
        entries = mod.sitemapUrls() as Entry[]
      } finally {
        await server.close()
      }
    },

    closeBundle() {
      if (entries.length === 0) {
        this.warn('sitemap：内容模块未取到 URL 清单，跳过生成')
        return
      }
      const lastmod = lastModified()
      const body = entries
        .map(
          (e) =>
            [
              '  <url>',
              `    <loc>${ORIGIN}${e.path}</loc>`,
              `    <lastmod>${lastmod}</lastmod>`,
              `    <changefreq>${e.changefreq}</changefreq>`,
              `    <priority>${e.priority}</priority>`,
              '  </url>',
            ].join('\n'),
        )
        .join('\n')

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
      writeFileSync(join(process.cwd(), 'dist', 'sitemap.xml'), xml, 'utf-8')
      this.info?.(`sitemap：已生成 dist/sitemap.xml（${entries.length} 条 URL）`)
    },
  }
}
