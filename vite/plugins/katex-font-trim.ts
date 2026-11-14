import { readdirSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

/**
 * KaTeX 字体裁剪
 * ---------------------------------------------------------------------------
 * katex 的 CSS 默认引用了全部 59 个字体文件（woff / woff2 / ttf），合计约 1.2MB。
 * 构建后删除未被 CSS 引用的冗余格式（ttf / woff），仅保留 woff2，
 * 可将字体体积降到约 320KB。
 *
 * 原理：现代浏览器（Chrome / Edge / Safari / Firefox 近两年版本）均支持 woff2，
 * 且 woff2 已被所有主流浏览器支持超过十年，兼容性安全。
 */
export default function katexFontTrim(): Plugin {
  return {
    name: 'katex-font-trim',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const assetsDir = join(process.cwd(), 'dist', 'assets')
      let files: string[]
      try {
        files = readdirSync(assetsDir)
      } catch {
        return
      }

      let removed = 0
      let saved = 0

      for (const f of files) {
        if (!/\.(ttf|woff)$/i.test(f)) continue
        const p = join(assetsDir, f)
        saved += statSync(p).size
        unlinkSync(p)
        removed++
      }

      if (removed > 0) {
        this.info?.(`KaTeX 字体裁剪：移除 ${removed} 个冗余字体文件，节省 ${(saved / 1024).toFixed(0)}KB`)
      }
    },
  }
}
