import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { chapterById, experiments, knowledgePoints, siteMeta } from '@/content'
import PageHeader from '@/components/ui/PageHeader'
import ExperimentCard from '@/components/ui/ExperimentCard'

export default function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const chapter = chapterId ? chapterById.get(chapterId) : undefined

  useEffect(() => {
    if (!chapter) {
      document.title = siteMeta.titleTemplate.replace('%s', '章节不存在')
      return
    }
    document.title = siteMeta.titleTemplate.replace('%s', chapter.title)
    const tag = document.querySelector('meta[name="description"]')
    if (tag) tag.setAttribute('content', chapter.intro)
  }, [chapter])

  if (!chapter) {
    return (
      <div className="shell py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">章节不存在</h1>
        <Link to="/principles" className="mt-6 inline-block text-sm font-semibold text-primary-text hover:underline">
          返回原理目录
        </Link>
      </div>
    )
  }

  const chPoints = knowledgePoints.filter((p) => p.chapterId === chapter.id)
  const chExps = experiments.filter((e) => e.chapterId === chapter.id)
  const prev = [...chapterById.values()].find((c) => c.order === chapter.order - 1)
  const next = [...chapterById.values()].find((c) => c.order === chapter.order + 1)

  return (
    <div className="page-enter">
      <PageHeader eyebrow={`第 ${chapter.order} 章`} title={chapter.title} description={chapter.intro}>
        <Link
          to="/principles"
          className="mt-5 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-ink-muted transition-colors hover:text-primary-text"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          原理目录
        </Link>
      </PageHeader>

      <div className="shell py-9 sm:py-11">
        {/* 知识点 */}
        {chPoints.length > 0 && (
          <section aria-labelledby="kp-heading">
            <h2 id="kp-heading" className="text-lg font-bold text-ink">
              本章知识点
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {chPoints.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/points/${p.id}`}
                    className="card group flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                  >
                    <h3 className="text-md font-bold text-ink group-hover:text-primary-text">
                      {p.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                      {p.summary}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 实验 */}
        {chExps.length > 0 && (
          <section className="mt-10" aria-labelledby="exp-heading">
            <h2 id="exp-heading" className="text-lg font-bold text-ink">
              本章实验
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              每个实验都从一道预测题开始，先猜再看。
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chExps.map((exp) => (
                <li key={exp.id}>
                  <ExperimentCard experiment={exp} showChapter={false} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 上下章导航 */}
        <nav
          className="mt-12 grid grid-cols-1 gap-3 border-t border-hairline pt-6 sm:grid-cols-2"
          aria-label="章节翻页"
        >
          {prev ? (
            <Link
              to={`/principles/${prev.id}`}
              className="card group p-4 transition-colors hover:border-border-strong"
            >
              <span className="flex items-center gap-1 text-2xs text-ink-muted">
                <ArrowLeft size={11} aria-hidden="true" />
                上一章
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
              to={`/principles/${next.id}`}
              className="card group p-4 text-right transition-colors hover:border-border-strong"
            >
              <span className="flex items-center justify-end gap-1 text-2xs text-ink-muted">
                下一章
                <ArrowRight size={11} aria-hidden="true" />
              </span>
              <span className="mt-1 block text-sm font-bold text-ink group-hover:text-primary-text">
                {next.title}
              </span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}
