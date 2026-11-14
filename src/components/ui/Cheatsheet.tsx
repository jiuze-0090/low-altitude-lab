import { useState } from 'react'
import { Printer, Copy, Check } from 'lucide-react'

import type { CheatsheetRow } from '@/types/content'

/**
 * A4 速查卡
 * ---------------------------------------------------------------------------
 * 实验结束后导出的静态速查表。这是本站的分享物——
 * 用户分享的不是"我看了个科普"，是"我猜错了"。
 */
export default function Cheatsheet({
  title,
  rows,
  experimentTitle,
}: {
  title: string
  rows: CheatsheetRow[]
  experimentTitle?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = [
      `【${title}】`,
      ...rows.map((r) => `${r.term}：${r.value}${r.note ? `（${r.note}）` : ''}`),
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* 剪贴板不可用时静默降级 */
    }
  }

  return (
    <section className="card overflow-hidden print:border-0 print:shadow-none" aria-labelledby="cheatsheet-heading">
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-canvas px-5 py-3.5 print:bg-transparent">
        <div>
          <h2 id="cheatsheet-heading" className="text-sm font-bold text-ink">
            {title}
          </h2>
          {experimentTitle && (
            <p className="mt-0.5 text-2xs text-ink-muted">来自 · {experimentTitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1 print:hidden">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink"
          >
            {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
            {copied ? '已复制' : '复制'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <Printer size={13} aria-hidden="true" />
            打印
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        <dl className="flex flex-col">
          {rows.map((r) => (
            <div
              key={r.term}
              className="grid grid-cols-[minmax(5.5rem,auto)_1fr] gap-x-4 gap-y-1 border-b border-dashed border-hairline py-2.5 last:border-b-0 print:border-hairline"
            >
              <dt className="text-sm font-semibold text-ink">{r.term}</dt>
              <dd className="text-sm text-ink-soft">
                <span className="tnum font-semibold text-primary-ink">{r.value}</span>
                {r.note && <span className="ml-1.5 text-xs text-ink-muted">{r.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
