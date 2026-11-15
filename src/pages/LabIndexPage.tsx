import { useEffect, useMemo } from 'react'

import { chapters, experiments, siteMeta } from '@/content'
import PageHeader from '@/components/ui/PageHeader'
import ExperimentCard from '@/components/ui/ExperimentCard'
import ResourceStrip from '@/components/ui/ResourceStrip'

export default function LabIndexPage() {
  useEffect(() => {
    document.title = siteMeta.titleTemplate.replace('%s', '实验室')
    const tag = document.querySelector('meta[name="description"]')
    if (tag)
      tag.setAttribute(
        'content',
        '每个实验都从一道预测题开始：先猜、再揭晓、再归因，最后带走一张可打印的 A4 速查卡。',
      )
  }, [])

  const grouped = useMemo(
    () =>
      chapters
        .map((ch) => ({
          chapter: ch,
          exps: experiments.filter((e) => e.chapterId === ch.id),
        }))
        .filter((g) => g.exps.length > 0),
    [experiments],
  )

  /** 时长范围从实验数据实时取，避免文案与实际耗时脱节 */
  const durationLabel = useMemo(() => {
    const mins = experiments.map((e) => e.minutes)
    if (mins.length === 0) return ''
    const lo = Math.min(...mins)
    const hi = Math.max(...mins)
    return lo === hi ? `${lo} 分钟` : `${lo}–${hi} 分钟`
  }, [experiments])

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="实验室"
        title="全部实验"
        description={`每个实验 ${durationLabel}。先做预测题，看自己错在哪，再把原理调参数看一遍，最后带走一张速查卡。`}
      />

      <div className="shell py-9 sm:py-11">
        <ResourceStrip />

        {grouped.length === 0 ? (
          <p className="rounded-md border border-dashed border-hairline bg-surface px-5 py-10 text-center text-sm text-ink-muted">
            实验正在准备中，第一批即将上线。
          </p>
        ) : (
          <div className="mt-9">
            {grouped.map(({ chapter, exps }) => (
              <section key={chapter.id} className="mb-11 last:mb-0" aria-labelledby={`lab-${chapter.id}`}>
                <div className="flex items-baseline gap-3">
                  <h2 id={`lab-${chapter.id}`} className="text-lg font-bold text-ink">
                    {chapter.title}
                  </h2>
                  <span className="chip chip-neutral">{exps.length} 个</span>
                </div>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {exps.map((exp) => (
                    <li key={exp.id}>
                      <ExperimentCard experiment={exp} showChapter={false} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
