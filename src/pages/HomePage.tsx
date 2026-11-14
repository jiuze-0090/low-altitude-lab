import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Target, Sprout } from 'lucide-react'

import { chapters, experiments, siteMeta } from '@/content'
import ExperimentCard from '@/components/ui/ExperimentCard'

export default function HomePage() {
  useEffect(() => {
    document.title = siteMeta.title
    const tag = document.querySelector('meta[name="description"]')
    if (tag) tag.setAttribute('content', siteMeta.description)
  }, [])

  const featured = useMemo(() => experiments.slice(0, 4), [experiments])

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline bg-panel">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
          aria-hidden="true"
          preserveAspectRatio="none"
          viewBox="0 0 1200 400"
        >
          {Array.from({ length: 26 }, (_, i) => (
            <line
              key={i}
              x1={i * 48}
              y1="0"
              x2={i * 48}
              y2="400"
              stroke="#8ba8ff"
              strokeWidth="0.6"
            />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * 50}
              x2="1200"
              y2={i * 50}
              stroke="#8ba8ff"
              strokeWidth="0.6"
            />
          ))}
        </svg>

        <div className="shell relative py-12 sm:py-16">
          <p className="text-2xs font-bold uppercase tracking-[0.2em] text-accent">
            CAAC 理论备考 · 交互式原理
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            先猜错一次，
            <br />
            再看懂它为什么错
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#b8c8de]">
            这里不讲题，只讲原理。每个实验都从一道预测题开始——你先给答案，
            再看自己错在哪，最后把这条原理落回你手上那根杆。
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/labs"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-3 text-sm font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
            >
              进实验室
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link
              to="/principles"
              className="inline-flex items-center gap-1.5 rounded-md border border-panel-line px-5 py-3 text-sm font-semibold text-panel-text transition-colors hover:bg-[#16253c]"
            >
              浏览原理目录
            </Link>
          </div>

          {/* 三个承诺 */}
          <dl className="mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            <Promise
              icon={<Target size={14} aria-hidden="true" />}
              term="先猜后看"
              desc="做错才看得懂——记忆留存更牢"
            />
            <Promise
              icon={<Sprout size={14} aria-hidden="true" />}
              term="落到实操"
              desc="每条原理标出这是你手上哪根杆"
            />
            <Promise
              icon={<ArrowRight size={14} aria-hidden="true" />}
              term="带走一张卡"
              desc="实验结束导出 A4 速查卡"
            />
          </dl>
        </div>
      </section>

      {/* 章节概览 */}
      <section className="shell py-10 sm:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">五条主线</h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              按一条线走完，比零散看二十个知识点有效
            </p>
          </div>
          <Link
            to="/principles"
            className="shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            全部目录
          </Link>
        </div>

        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((ch) => (
            <li key={ch.id}>
              <Link
                to={`/principles/${ch.id}`}
                className="card group flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover"
              >
                <span className="tnum text-2xs font-bold text-accent-ink">
                  {String(ch.order).padStart(2, '0')}
                </span>
                <h3 className="mt-2 text-md font-bold text-ink group-hover:text-primary">
                  {ch.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                  {ch.intro}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 精选实验 */}
      {featured.length > 0 && (
        <section className="border-t border-hairline bg-surface">
          <div className="shell py-10 sm:py-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink">先试一个</h2>
                <p className="mt-1.5 text-sm text-ink-soft">
                  每个实验 3–8 分钟，猜错是正常的
                </p>
              </div>
              <Link to="/labs" className="shrink-0 text-sm font-semibold text-primary hover:underline">
                全部 {experiments.length} 个
              </Link>
            </div>

            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((exp) => (
                <li key={exp.id}>
                  <ExperimentCard experiment={exp} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}

function Promise({
  icon,
  term,
  desc,
}: {
  icon: React.ReactNode
  term: string
  desc: string
}) {
  return (
    <div className="rounded-md border border-panel-line bg-[#16253c] px-4 py-3">
      <dt className="flex items-center gap-1.5 text-xs font-bold text-panel-text">
        <span className="text-accent" aria-hidden="true">
          {icon}
        </span>
        {term}
      </dt>
      <dd className="mt-1 text-2xs leading-relaxed text-ink-muted">{desc}</dd>
    </div>
  )
}
