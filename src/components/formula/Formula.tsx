import katex from 'katex'
import { useMemo } from 'react'

import 'katex/dist/katex.min.css'

/** 独立公式块（KaTeX display 模式），渲染失败时降级显示原始 TeX */
export default function Formula({ tex }: { tex: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: true,
        throwOnError: true,
        strict: false,
      })
    } catch {
      return `<code>${tex.replace(/[<>]/g, '')}</code>`
    }
  }, [tex])

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
