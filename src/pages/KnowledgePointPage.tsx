import { Suspense, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FlaskConical, Hand } from 'lucide-react'

import { knowledgePointById, knowledgePoints, experimentById, chapterById, siteMeta } from '@/content'
import Markdown, { Formula } from '@/components/formula/Markdown'

export default function KnowledgePointPage() {
  const { pointId } = useParams<{ pointId: string }>()
  const point = pointId ? knowledgePointById.get(pointId) : undefined

  useEffect(() => {
    if (!point) {
      document.title = siteMeta.titleTemplate.replace('%s', '知识点不存在')
      return
    }
    document.title = siteMeta.titleTemplate.replace('%s', point.title)
    const tag = document.querySelector('meta[name="description"]')
    if (tag) tag.setAttribute('content', point.summary)
  }, [point])

  if (!point) {
    return (
      <div className="shell py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">知识点不存在</h1>
        <Link to="/principles" className="mt-6 inline-block text-sm font-semibold text-primary-text hover:underline">
          返回原理目录
        </Link>
      </div>
    )
  }

  const chapter = chapterById.get(point.chapterId)
  const exp = point.experimentId ? experimentById.get(point.experimentId) : undefined

  // 前后篇：按 knowledgePoints 的数组顺序（即章节顺序）串读
  const order = knowledgePoints.map((p) => p.id)
  const idx = order.indexOf(point.id)
  const prev = idx > 0 ? knowledgePointById.get(order[idx - 1]) : undefined
  const next = idx >= 0 && idx < order.length - 1 ? knowledgePointById.get(order[idx + 1]) : undefined

  return (
    <div className="page-enter">
      <header className="band border-b border-hairline">
        <div className="shell py-8 sm:py-10">
          {chapter && (
            <Link
              to={`/principles/${chapter.id}`}
              className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-ink-muted transition-colors hover:text-primary-text"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              {chapter.title}
            </Link>
          )}
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {point.title}
          </h1>
          <p className="mt-2.5 max-w-prose text-[15px] leading-relaxed text-ink-soft">
            {point.summary}
          </p>
        </div>
      </header>

      <div className="shell py-8 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <div className="min-w-0 flex-1">
            <section className="card p-5 sm:p-7" aria-label="原理讲解">
              <div className="prose-lab">
                <Markdown content={point.body} />
              </div>
            </section>

            {point.formulas && point.formulas.length > 0 && (
              <section className="mt-6" aria-labelledby="formula-heading">
                <h2 id="formula-heading" className="text-sm font-bold text-ink">
                  关键公式
                </h2>
                <div className="mt-2.5 flex flex-col gap-2.5">
                  {point.formulas.map((f, i) => (
                    <Suspense
                      key={i}
                      fallback={<div className="h-16 rounded-md bg-canvas" aria-busy="true" />}
                    >
                      <Formula tex={f} />
                    </Suspense>
                  ))}
                </div>
              </section>
            )}

            {point.examAngles && point.examAngles.length > 0 && (
              <section className="mt-8" aria-labelledby="angle-heading">
                <h2 id="angle-heading" className="text-sm font-bold text-ink">
                  考试常怎么问
                </h2>
                <ul className="mt-2.5 flex flex-col gap-2">
                  {point.examAngles.map((a, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-hairline bg-surface px-4 py-3 text-sm leading-relaxed text-ink-soft"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {point.onYourStick && (
              <section className="mt-8" aria-labelledby="stick-heading">
                <h2 id="stick-heading" className="text-sm font-bold text-ink">
                  这在你手上是哪根杆
                </h2>
                <div className="mt-2.5 rounded-lg border border-hairline bg-accent-soft px-4 py-3.5">
                  <p className="flex gap-2.5 text-sm leading-relaxed text-ink">
                    <Hand size={15} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
                    <span>{point.onYourStick}</span>
                  </p>
                </div>
              </section>
            )}

            {(prev || next) && (
              <nav
                className="mt-10 grid grid-cols-1 gap-3 border-t border-hairline pt-6 sm:grid-cols-2"
                aria-label="知识点翻页"
              >
                {prev ? (
                  <Link to={`/points/${prev.id}`} className="card group p-4 transition-colors hover:border-border-strong">
                    <span className="flex items-center gap-1 text-2xs text-ink-muted">
                      <ArrowLeft size={11} aria-hidden="true" />
                      上一条
                    </span>
                    <span className="mt-1 block text-sm font-bold text-ink group-hover:text-primary-text">
                      {prev.title}
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
                {next && (
                  <Link
                    to={`/points/${next.id}`}
                    className="card group p-4 text-right transition-colors hover:border-border-strong"
                  >
                    <span className="flex items-center justify-end gap-1 text-2xs text-ink-muted">
                      下一条
                      <ArrowRight size={11} aria-hidden="true" />
                    </span>
                    <span className="mt-1 block text-sm font-bold text-ink group-hover:text-primary-text">
                      {next.title}
                    </span>
                  </Link>
                )}
              </nav>
            )}
          </div>

          {exp && (
            <aside className="w-full shrink-0 lg:w-[300px]">
              <div className="card p-5 lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
                <div className="flex items-center gap-2">
                  <FlaskConical size={15} className="text-accent-ink" aria-hidden="true" />
                  <h2 className="text-sm font-bold text-ink">动手试一次</h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{exp.hook}</p>
                <Link
                  to={`/labs/${exp.slug}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-strong"
                >
                  进入实验
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
