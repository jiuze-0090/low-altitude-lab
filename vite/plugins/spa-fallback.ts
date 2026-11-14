import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

/**
 * SPA 回退兜底
 * ---------------------------------------------------------------------------
 * React Router 使用 history 模式，直接访问 /labs/lift-origin 这类子路径时，
 * 静态托管需要把请求回退到 index.html。
 *
 * · Cloudflare Pages：读取 public/_redirects 生效
 * · EdgeOne Pages：控制台配置重写规则；若未配置，此处生成 404.html 兜底
 *
 * 生成的 404.html 与 index.html 内容一致，仅在托管层未配置回退规则时生效。
 */
export default function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    apply: 'build',
    closeBundle() {
      const dist = join(process.cwd(), 'dist')
      const index = join(dist, 'index.html')
      const notFound = join(dist, '404.html')
      if (!existsSync(index)) return
      copyFileSync(index, notFound)
      this.info?.('SPA 回退：已生成 dist/404.html')
    },
  }
}
