import { marked } from 'marked'
import katex from 'katex'

/**
 * 预渲染静态正文渲染库
 * ---------------------------------------------------------------------------
 * 构建期在 Node 环境把内容数据里的 Markdown（含 $KaTeX$ 公式）同步渲染成 HTML。
 * 与客户端 Markdown.tsx 逻辑保持一致：先抽出公式，marked 渲染正文，再回填公式。
 *
 * 只在构建期被 prerender.ts 调用，不进入浏览器 bundle。
 */

marked.setOptions({ gfm: true, breaks: false })

/** HTML 文本转义，防止内容里的尖括号破坏静态 HTML */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 属性转义（比文本多转义单引号） */
export function attr(value: unknown): string {
  return esc(value).replace(/'/g, '&#39;')
}

/**
 * 正文用的行内文本：先转义，再把 **加粗** 转成 <strong>。
 * 与客户端 InlineMd 组件行为一致，保证预渲染 HTML 与 React 挂载后的视觉相同。
 * 注意顺序：必须先 esc 再替换，否则内容里的 < > 会变成真标签。
 */
export function escInline(value: unknown): string {
  return esc(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

/** meta description / JSON-LD 用的纯文本：去掉 Markdown 加粗标记，不留星号 */
export function plainText(value: unknown): string {
  return String(value ?? '').replace(/\*\*([^*]+)\*\*/g, '$1')
}

/** 判断文本是否含公式 */
function hasFormula(src: string): boolean {
  return /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/.test(src)
}

/**
 * 同步渲染 Markdown 正文（含公式）
 * ---------------------------------------------------------------------------
 * 公式先渲染成 KaTeX HTML 并占位，marked 处理完正文后回填，
 * 避免 marked 误处理公式里的反斜杠与特殊字符。
 */
export function renderMarkdown(src: string): string {
  if (!src || !src.trim()) return ''

  const tokens: string[] = []
  const stash = (tex: string, display: boolean): string => {
    let html: string
    try {
      html = katex.renderToString(tex.trim(), {
        displayMode: display,
        throwOnError: false,
        strict: false,
        // 必须与客户端 Markdown.tsx 一致用 'html'：
        // 'htmlAndMathml' 会额外输出 <math>（含 <annotation> 里的 TeX 源码），
        // 爬虫按纯文本提取时同一公式会被读三遍（MathML + HTML + TeX 源码），
        // 稀释正文、误导 AI 引用。'html' 只有一份视觉版，与真人看到的完全一致。
        output: 'html',
      })
    } catch {
      html = `<code>${esc(tex)}</code>`
    }
    tokens.push(html)
    return `%%PRERENDER_KATEX_${tokens.length - 1}%%`
  }

  let text = src
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => stash(String(tex), true))
  if (hasFormula(text)) {
    text = text.replace(/\$([^$\n]+?)\$/g, (_m, tex) => stash(String(tex), false))
  }

  let out = marked.parse(text) as string
  tokens.forEach((token, i) => {
    out = out.replace(new RegExp(`%%PRERENDER_KATEX_${i}%%`, 'g'), token)
  })
  // marked 对占位符独占一行的情况会包 <p>，公式块本身已是 display，去掉空 p
  out = out.replace(/<p>\s*<\/p>/g, '')
  return out
}

/** 去掉字符串首尾空白 */
export function trim(value: string | undefined | null): string {
  return (value ?? '').trim()
}
