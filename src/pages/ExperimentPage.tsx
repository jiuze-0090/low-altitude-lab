import { useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, Target } from 'lucide-react'

import { experiments, experimentBySlug, chapterById, siteMeta } from '@/content'
import PredictionBlock from '@/components/experiment/PredictionBlock'
import Cheatsheet from '@/components/ui/Cheatsheet'
import Markdown from '@/components/formula/Markdown'
import ExperimentCanvas from '@/components/experiment/ExperimentCanvas'
import { getExperimentComponent } from '@/experiments'

/** 每页独立 title / description */
function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title ? siteMeta.titleTemplate.replace('%s', title) : siteMeta.title
    const tag = document.querySelector('meta[name="description"]')
    if (tag) tag.setAttribute('content', description)
  }, [title, description])
}

export default function ExperimentPage() {
  const { slug } = useParams<{ slug: string }>()
  const experiment = slug ? experimentBySlug.get(slug) : undefined

  const meta = useMemo(() => {
    if (!experiment) {
      return { title: '实验不存在', description: '该实验室不存在或已下线。' }
    }
    return {
      title: experiment.title,
      description: `${experiment.hook} 动手验一遍，才算真的懂。`,
    }
  }, [experiment])

  usePageMeta(meta.title, meta.description)

  if (!experiment) {
    return (
      <div className="shell py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">没有找到这个实验</h1>
        <p className="mt-3 text-ink-soft">链接可能已经变更。</p>
        <Link
          to="/labs"
          className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong"
        >
          返回实验室列表
        </Link>
      </div>
    )
  }

  const chapter = chapterById.get(experiment.chapterId)
  const Canvas = getExperimentComponent(experiment.component)

  return (
    <article className="page-enter">
      {/* 页头 */}
      <header className="band border-b border-hairline">
        <div className="shell py-7 sm:py-9">
          <Link
            to="/labs"
            className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-ink-muted transition-colors hover:text-primary-text"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            全部实验室
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chapter && (
              <Link
                to={`/principles/${chapter.id}`}
                className="chip chip-neutral transition-colors hover:bg-primary-soft hover:text-primary-ink"
              >
                {chapter.title}
              </Link>
            )}
            <span className="chip chip-primary">约 {experiment.minutes} 分钟</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {experiment.title}
          </h1>
          <p className="mt-2.5 max-w-prose text-[15px] leading-relaxed text-ink-soft">
            {experiment.hook}
          </p>
        </div>
      </header>

      <div className="shell py-8 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          {/* 左栏：交互区 */}
          <div className="min-w-0 flex-1">
            {/* 交互画布 */}
            {Canvas && (
              <section className="card overflow-hidden" aria-label="交互实验区">
                <div className="flex items-center justify-between gap-3 border-b border-hairline bg-canvas px-5 py-3">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
                    交互演示
                  </span>
                  <span className="text-2xs text-ink-muted">拖动 / 调节参数看变化</span>
                </div>
                <ExperimentCanvas
                  controls={experiment.controls}
                  render={(values) => <Canvas values={values} />}
                />
              </section>
            )}

            {/* 预测 → 揭晓 → 归因 */}
            <div className="mt-8">
              <PredictionBlock prediction={experiment.prediction} />
            </div>

            {/* 原理讲解 */}
            <section className="card mt-8 p-5 sm:p-7" aria-labelledby="principle-heading">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-primary-text" aria-hidden="true" />
                <h2 id="principle-heading" className="text-sm font-bold text-ink">
                  原理拆解
                </h2>
              </div>
              <div className="prose-lab mt-3">
                <Markdown content={experiment.principle} />
              </div>
            </section>

            {/* 实飞经验 */}
            {experiment.fieldNote && (
              <section className="mt-6 rounded-md border border-hairline bg-canvas p-5">
                <h2 className="text-sm font-bold text-ink">实飞体感</h2>
                <div className="prose-lab mt-2">
                  <Markdown content={experiment.fieldNote} />
                </div>
              </section>
            )}
          </div>

          {/* 右栏：速查卡 + 考点 */}
          <aside className="flex w-full flex-col gap-5 lg:w-[320px] lg:shrink-0 lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
            <Cheatsheet
              title={experiment.cheatsheet.title}
              rows={experiment.cheatsheet.rows}
              experimentTitle={experiment.title}
            />

            {experiment.examRefs.length > 0 && (
              <section className="card p-5" aria-labelledby="exam-heading">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-accent-ink" aria-hidden="true" />
                  <h2 id="exam-heading" className="text-sm font-bold text-ink">
                    考试怎么问
                  </h2>
                </div>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {experiment.examRefs.map((ref) => (
                    <li key={ref.code} className="text-xs leading-relaxed text-ink-soft">
                      <span className="tnum mr-1.5 rounded bg-canvas px-1.5 py-0.5 text-2xs font-semibold text-ink-muted">
                        {ref.code}
                      </span>
                      {ref.gist}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </article>
  )
}

/** 供其它页面统计用 */
export { experiments }
