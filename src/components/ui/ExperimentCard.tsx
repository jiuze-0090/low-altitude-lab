import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'

import type { Experiment } from '@/types/content'
import { chapterById } from '@/content'

/**
 * 实验卡片
 * ---------------------------------------------------------------------------
 * 每张卡片必须能回答两个问题：
 *   1. 我为什么要点它？（hook + 覆盖题数）
 *   2. 点进去会发生什么？（预测题数 + 耗时）
 */
export default function ExperimentCard({
  experiment,
  coveredQuestions = 0,
}: {
  experiment: Experiment
  coveredQuestions?: number
}) {
  const chapter = chapterById.get(experiment.chapterId)

  return (
    <Link
      to={`/labs/${experiment.slug}`}
      className="card group flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover focus-visible:shadow-focus"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {chapter && <span className="chip chip-neutral">{chapter.title}</span>}
          {coveredQuestions > 0 && (
            <span className="chip chip-primary">覆盖 {coveredQuestions} 道考点</span>
          )}
        </div>
        <span className="flex items-center gap-1 text-2xs text-ink-muted">
          <Clock size={11} aria-hidden="true" />
          {experiment.minutes} 分钟
        </span>
      </div>

      <h3 className="mt-3 text-lg font-bold leading-snug text-ink transition-colors group-hover:text-primary-text">
        {experiment.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
        {experiment.hook}
      </p>

      <div className="mt-4 flex items-center gap-1.5 border-t border-hairline pt-3.5 text-sm font-semibold text-primary-text">
        先猜一次
        <ArrowRight
          size={14}
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  )
}
