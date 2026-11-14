import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { chapters, experiments, siteMeta } from '@/content'
import PageHeader from '@/components/ui/PageHeader'

export default function DirectoryPage() {
  useEffect(() => {
    document.title = siteMeta.titleTemplate.replace('%s', '原理目录')
    const tag = document.querySelector('meta[name="description"]')
    if (tag)
      tag.setAttribute(
        'content',
        '按气动原理、安定性、多旋翼、气象环境、飞行性能五条主线，系统理解无人机飞行原理。',
      )
  }, [])

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="目录"
        title="原理目录"
        description="五条主线，每条从「为什么」开始，到「这在你手上是哪根杆」结束。点进章节看知识点，点进实验室动手拧参数。"
      />

      <div className="shell py-8 sm:py-10">
        <ol className="flex flex-col gap-4">
          {chapters.map((ch) => {
            const chExps = experiments.filter((e) => e.chapterId === ch.id)
            return (
              <li key={ch.id} className="card overflow-hidden">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
                  <div className="flex items-start gap-3.5 sm:flex-1">
                    <span className="tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-sm font-bold text-primary-ink">
                      {String(ch.order).padStart(2, '0')}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-ink">
                        <Link to={`/principles/${ch.id}`} className="hover:text-primary">
                          {ch.title}
                        </Link>
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                        {ch.intro}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <span className="chip chip-neutral">{ch.knowledgePointIds.length} 个知识点</span>
                        <span className="chip chip-primary">{chExps.length} 个实验</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/principles/${ch.id}`}
                    className="inline-flex shrink-0 items-center gap-1 self-start rounded-md px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                  >
                    进入章节
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
