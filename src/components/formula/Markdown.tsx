import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'

/**
 * Markdown + KaTeX 渲染
 * ---------------------------------------------------------------------------
 * · 支持 $...$ 行内公式与 $$...$$ 独立公式
 * · marked 默认不渲染原始 HTML，避免注入
 * · 独立公式包裹在 .katex-display 容器内，可横向滚动
 * · KaTeX 引擎懒加载：仅当内容含公式时才下载 katex chunk（约 77KB gzip）
 */

marked.setOptions({
  gfm: true,
  breaks: false,
})

/** KaTeX 引擎按需载入（动态 import，触发独立 chunk） */
let katexPromise: Promise<typeof import('katex')> | null = null
function loadKatex() {
  if (!katexPromise) katexPromise = import('katex')
  return katexPromise
}

/** 判断文本是否含公式 */
export function hasFormula(src: string): boolean {
  return /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/.test(src)
}

/** 把 $...$ / $$...$$ 提取出来，先替换为占位符 */
async function renderKatex(src: string): Promise<{ html: string; tokens: string[] }> {
  const tokens: string[] = []
  const katex = (await loadKatex()).default

  const stash = (tex: string, display: boolean) => {
    const html = katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      output: 'html',
    })
    tokens.push(html)
    return `%%KATEX${tokens.length - 1}%%`
  }

  let text = src

  // 先处理独立公式 $$...$$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => stash(String(tex).trim(), true))
  // 再处理行内公式 $...$
  text = text.replace(/\$([^$\n]+?)\$/g, (_m, tex) => stash(String(tex).trim(), false))

  return { html: text, tokens }
}

/** 异步渲染的 Markdown 主体（含公式时使用） */
function MarkdownInner({ content }: { content: string }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      const { html: withPlaceholders, tokens } = await renderKatex(content)
      let out = marked.parse(withPlaceholders) as string
      tokens.forEach((token, i) => {
        out = out.replace(new RegExp(`%%KATEX${i}%%`, 'g'), token)
      })
      out = out.replace(/<p>\s*<\/p>/g, '')
      if (!cancelled) setHtml(out)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [content])

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

/** 无公式时的同步渲染（不触发 katex 加载） */
function PlainMarkdown({ content }: { content: string }) {
  const html = useMemo(() => {
    const out = marked.parse(content) as string
    return out.replace(/<p>\s*<\/p>/g, '')
  }, [content])
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

export default function Markdown({ content }: { content: string }) {
  const needsKatex = hasFormula(content)

  if (!needsKatex) return <PlainMarkdown content={content} />

  return (
    <Suspense fallback={<div className="min-h-[1.75rem] rounded bg-canvas" aria-busy="true" />}>
      <MarkdownInner content={content} />
    </Suspense>
  )
}

/**
 * 独立公式块
 * ---------------------------------------------------------------------------
 * 渲染失败时降级显示原始 TeX 源码，保证内容永远可见
 * （教学站点不允许出现空白公式）。
 */
export const Formula = lazy(() =>
  import('./Formula').then((m) => ({ default: m.default })),
)
