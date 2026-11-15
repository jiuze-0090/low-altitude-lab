import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import PageHeader from '@/components/ui/PageHeader'
import Formula from '@/components/formula/Formula'
import { cheatsheetCards, type CheatsheetCard } from '@/content/cheatsheets'
import { siteMeta } from '@/content'

/**
 * 原理速查卡
 * ---------------------------------------------------------------------------
 * 与「规章速查卡」(/guides) 的分工：
 *   · 规章速查卡 = 必须背下来的硬条目（空域、管制单位、申报间隔）
 *   · 原理速查卡 = 必须算出来的原理结论（气动、稳定性、多旋翼、性能、公式）
 *
 * 每张卡都可复制、可打印（A4 压缩版），条目全部标注题库题号。
 */
export default function CheatsheetsPage() {
  useEffect(() => {
    document.title = siteMeta.titleTemplate.replace('%s', '原理速查卡')
    const tag = document.querySelector('meta[name="description"]')
    if (tag)
      tag.setAttribute(
        'content',
        '气动基础、稳定性与操纵、多旋翼动力、飞行性能与航迹、常用公式——五张可打印的原理速查卡，每条都标了题库题号。',
      )
  }, [])

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="速查"
        title="原理速查卡"
        description="「规章速查卡」背的是硬条目，这一页背的是算出来的结论。五张卡覆盖气动、稳定性、多旋翼、性能与公式，每一条都标了题库题号，方便回溯核对。每张卡都能复制和打印。"
      >
        <nav aria-label="速查卡分节导航" className="mt-5 flex flex-wrap gap-1.5">
          {cheatsheetCards.map((c) => (
            <a
              key={c.id}
              href={`#card-${c.id}`}
              className="rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-primary hover:text-primary-text"
            >
              {c.title.replace('速查卡', '')}
            </a>
          ))}
          <Link
            to="/guides"
            className="rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-primary hover:text-primary-text"
          >
            规章速查卡 →
          </Link>
        </nav>
      </PageHeader>

      <div className="shell flex flex-col gap-8 py-8 sm:py-10">
        {cheatsheetCards.map((card) => (
          <CardSection key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}

function CardSection({ card }: { card: CheatsheetCard }) {
  return (
    <section id={`card-${card.id}`} className="scroll-mt-32">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-ink">{card.title}</h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-soft">
            {card.subtitle}
          </p>
        </div>
        {card.links && card.links.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2.5 py-1.5 text-2xs font-medium text-ink-muted transition-colors hover:border-primary hover:text-primary-text"
              >
                {l.label}
                <ArrowUpRight size={11} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {card.mnemonic && (
        <p className="mb-3 rounded-md border-l-2 border-accent bg-accent-soft/40 px-4 py-2.5 text-sm font-medium text-ink">
          {card.mnemonic}
        </p>
      )}

      <div className="card overflow-hidden print:shadow-none">
        {card.rows.length > 0 && (
          <div className="px-5 py-4">
            <dl className="flex flex-col">
              {card.rows.map((r) => (
                <div
                  key={r.term}
                  className="grid grid-cols-[minmax(6.5rem,auto)_1fr] gap-x-4 gap-y-1 border-b border-dashed border-hairline py-2.5 last:border-b-0 print:border-hairline"
                >
                  <dt className="text-sm font-semibold text-ink">{r.term}</dt>
                  <dd className="text-sm text-ink-soft">
                    <span className="tnum font-semibold text-primary-ink">{r.value}</span>
                    {r.note && (
                      <span className="ml-1.5 text-xs text-ink-muted">{r.note}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {card.formulas && card.formulas.length > 0 && (
          <div className="border-t border-hairline bg-canvas px-5 py-4">
            <div className="flex flex-col gap-4">
              {card.formulas.map((f) => (
                <div key={f.name} className="rounded-md border border-panel-line bg-panel-raised px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-panel-muted">
                    {f.name}
                  </p>
                  <div className="mt-1 overflow-x-auto text-sm text-panel-text">
                    <Formula tex={f.tex} />
                  </div>
                  <p className="mt-1 text-2xs leading-relaxed text-panel-muted">{f.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
