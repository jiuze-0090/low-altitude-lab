import { Suspense, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FlaskConical } from 'lucide-react'

import { knowledgePointById, experimentById, chapterById, siteMeta } from '@/content'
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
        <Link to="/principles" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
          返回原理目录
        </Link>
      </div>
    )
  }

  const chapter = chapterById.get(point.chapterId)
  const exp = point.experimentId ? experimentById.get(point.experimentId) : undefined

  return (
    <div className="page-enter">
      <header className="border-b border-hairline bg-surface">
        <div className="shell py-8 sm:py-10">
          {chapter && (
            <Link
              to={`/principles/${chapter.id}`}
              className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-ink-muted transition-colors hover:text-primary"
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
