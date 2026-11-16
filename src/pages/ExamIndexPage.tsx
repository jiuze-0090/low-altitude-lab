import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, ArrowRight } from 'lucide-react'

import PageHeader from '@/components/ui/PageHeader'
import { experiments, chapters, siteMeta } from '@/content'

/**
 * 考点索引
 * ---------------------------------------------------------------------------
 * 把九个实验挂着的 examRefs 汇总成一张可检索的表。
 * 题号来自题库实测（all-questions-verified.csv，1979 题），
 * 每条都能点回它出自哪个实验，方便回去看推导过程。
 */
export default function ExamIndexPage() {
  const [q, setQ] = useState('')

  useEffect(() => {
    document.title = siteMeta.titleTemplate.replace('%s', '考点索引')
    const tag = document.querySelector('meta[name="description"]')
    if (tag)
      tag.setAttribute(
        'content',
        '按题号检索本站覆盖的 CAAC 理论考点，每条标注出处实验，可直接跳回推导过程。',
      )
  }, [])

  /** 汇总：按章节分组 */
  const grouped = useMemo(() => {
    const items = experiments.flatMap((e) =>
      e.examRefs.map((r) => ({
        code: r.code,
        gist: r.gist,
        experimentId: e.id,
        experimentTitle: e.title,
        slug: e.slug,
        chapterId: e.chapterId,
      })),
    )

    const keyword = q.trim().toLowerCase()
    const filtered = keyword
      ? items.filter(
          (i) =>
            i.code.toLowerCase().includes(keyword) ||
            i.gist.toLowerCase().includes(keyword) ||
            i.experimentTitle.toLowerCase().includes(keyword),
        )
      : items

    return chapters
      .map((c) => ({
        chapter: c,
        items: filtered
          .filter((i) => i.chapterId === c.id)
          .sort((a, b) => Number(a.code) - Number(b.code) || a.code.localeCompare(b.code)),
      }))
      .filter((g) => g.items.length > 0)
  }, [q])

  const total = experiments.reduce((n, e) => n + e.examRefs.length, 0)
  const shown = grouped.reduce((n, g) => n + g.items.length, 0)
  const uniqueCodes = new Set(
    experiments.flatMap((e) => e.examRefs.map((r) => r.code)),
  ).size

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="索引"
        title="考点索引"
        description={`本站九个实验共挂上 ${total} 条考点，去重后 ${uniqueCodes} 个题号。每条都标了出处，点一下就能跳回那个实验的推导过程。`}
      />

      <div className="shell py-8 sm:py-10">
        {/* 自测入口：这张表本身就是「想考但不确定自己能考多少」的答案 */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline bg-surface px-4 py-3">
          <p className="text-sm leading-relaxed text-ink-soft">
            想自测能考到哪？先把这 {total} 条考点过一遍，心里有个数，再去实验室动手验。
          </p>
          <Link
            to="/labs"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-strong"
          >
            进实验室
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        {/* 搜索 */}
        <div className="sticky top-[var(--header-h)] z-40 -mx-4 mb-6 border-b border-hairline bg-canvas/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-md sm:border sm:px-4">
          <div className="flex items-center gap-2">
            <Search size={15} className="shrink-0 text-ink-muted" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜题号或考点关键词，例如 220 / 安定性 / 失速"
              aria-label="搜索考点"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="rounded p-1 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                aria-label="清除搜索"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
            <span className="tnum shrink-0 text-2xs text-ink-muted">
              {shown} / {total}
            </span>
          </div>
        </div>

        {grouped.length === 0 && (
          <p className="py-12 text-center text-sm text-ink-soft">
            没有匹配「{q}」的考点，换个关键词试试。
          </p>
        )}

        <div className="flex flex-col gap-9">
          {grouped.map((g) => (
            <section key={g.chapter.id}>
              <div className="flex items-baseline gap-3">
                <h2 className="text-base font-bold text-ink">{g.chapter.title}</h2>
                <span className="text-2xs text-ink-muted">{g.items.length} 条</span>
              </div>
              <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink-muted">
                {g.chapter.intro}
              </p>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {g.items.map((i) => (
                  <li key={`${i.experimentId}-${i.code}-${i.gist}`}>
                    <Link
                      to={`/labs/${i.slug}`}
                      className="group flex items-start gap-3 rounded-md border border-hairline bg-surface px-3.5 py-2.5 transition-colors hover:border-primary"
                    >
                      <span className="tnum mt-px shrink-0 rounded bg-canvas px-1.5 py-0.5 text-2xs font-bold text-primary-ink">
                        {i.code}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs leading-relaxed text-ink">
                          {i.gist}
                        </span>
                        <span className="mt-0.5 block truncate text-2xs text-ink-muted group-hover:text-primary-text">
                          出自 · {i.experimentTitle}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-hairline pt-5 text-xs leading-relaxed text-ink-muted">
          题号取自题库实测文件（编号与题库一致）。同一题号可能出现在不同实验里——
          那说明它同时踩到两条原理，复习时两边都要过。
          全部 {experiments.length} 个实验见{' '}
          <Link to="/labs" className="text-primary-text underline underline-offset-2">
            实验室列表
          </Link>
          ，规章类硬条目见{' '}
          <Link to="/guides" className="text-primary-text underline underline-offset-2">
            规章速查卡
          </Link>
          。
        </p>
      </div>
    </div>
  )
}
