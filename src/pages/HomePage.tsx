import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Target, Sprout, Printer } from 'lucide-react'

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
      {/* Hero — 浅色基调，深蓝只作强调，仪表质感靠线条而非压暗 */}
      <section className="band relative overflow-hidden border-b border-hairline">
        <GaugeGrid />
        <div className="shell relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-14">
          <div>
            <p className="text-2xs font-bold uppercase tracking-[0.2em] text-accent-ink">
              CAAC 理论备考 · 交互式原理
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-primary-ink sm:text-4xl">
              动手验过的原理，
              <br />
              才叫懂
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
              这里不讲题，只讲原理。每个实验都从一道预测题开始——你先给答案，
              再看自己错在哪，最后把这条原理落回你手上那根杆。
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/labs"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-3 text-sm font-bold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-strong"
              >
                进实验室
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link
                to="/principles"
                className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary-text"
              >
                浏览原理目录
              </Link>
            </div>

            {/* 三个承诺 */}
            <dl className="mt-9 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              <Promise
                icon={<Target size={14} aria-hidden="true" />}
                term="先猜后看"
                desc="亲手验过一遍，才算真的懂"
              />
              <Promise
                icon={<Sprout size={14} aria-hidden="true" />}
                term="落到实操"
                desc="每条原理标出这是你手上哪根杆"
              />
              <Promise
                icon={<Printer size={14} aria-hidden="true" />}
                term="带走一张卡"
                desc="实验结束导出 A4 速查卡"
              />
            </dl>

            {/* 机构署名 */}
            <p className="mt-9 flex items-center gap-2.5 text-2xs text-ink-muted">
              <span className="h-px w-7 shrink-0 bg-border-strong" aria-hidden="true" />
              <span>
                本站由 <span className="font-semibold text-ink-soft">{siteMeta.orgFull}</span> 建设并维护
              </span>
            </p>
          </div>

          {/* 仪表盘装饰 */}
          <ClusterDecor />
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
            className="shrink-0 text-sm font-semibold text-primary-text hover:underline"
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
                <h3 className="mt-2 text-md font-bold text-ink group-hover:text-primary-text">
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
        <section className="band border-t border-hairline">
          <div className="shell py-10 sm:py-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink">先试一个</h2>
                <p className="mt-1.5 text-sm text-ink-soft">
                  每个实验 3–11 分钟，猜错是正常的
                </p>
              </div>
              <Link to="/labs" className="shrink-0 text-sm font-semibold text-primary-text hover:underline">
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

/** 浅底仪表网格背景 */
function GaugeGrid() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
      viewBox="0 0 1200 520"
    >
      <g opacity="0.9">
        {Array.from({ length: 26 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={i * 48}
            y1="0"
            x2={i * 48}
            y2="520"
            stroke="var(--c-gauge-line-soft)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={i * 52}
            x2="1200"
            y2={i * 52}
            stroke="var(--c-gauge-line-soft)"
            strokeWidth="1"
          />
        ))}
      </g>
      {/* 右上角弧形刻度，增加仪表层次 */}
      <g stroke="var(--c-gauge-line)" strokeWidth="1.4" fill="none" opacity="0.75">
        <path d="M 780 520 A 420 420 0 0 1 1200 100" />
        <path d="M 860 520 A 340 340 0 0 1 1200 180" />
      </g>
      <g stroke="var(--c-gauge-line)" strokeWidth="1.4">
        {Array.from({ length: 11 }, (_, i) => {
          const a = (-90 + i * 7) * (Math.PI / 180)
          const r1 = 420
          const r2 = i % 5 === 0 ? 392 : 405
          const cx = 780
          const cy = 520
          return (
            <line
              key={i}
              x1={cx + r1 * Math.cos(a)}
              y1={cy + r1 * Math.sin(a)}
              x2={cx + r2 * Math.cos(a)}
              y2={cy + r2 * Math.sin(a)}
            />
          )
        })}
      </g>
    </svg>
  )
}

/** 右侧仪表簇装饰（浅底，纯矢量） */
function ClusterDecor() {
  return (
    <div className="relative hidden lg:block" aria-hidden="true">
      <svg viewBox="0 0 380 380" className="w-full">
        <defs>
          <linearGradient id="hero-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--c-decor-arc-1)" />
            <stop offset="100%" stopColor="var(--c-decor-arc-2)" />
          </linearGradient>
        </defs>

        {/* 外环刻度 */}
        <circle cx="190" cy="190" r="168" fill="var(--c-decor-face)" stroke="var(--c-gauge-line)" strokeWidth="1.4" />
        <g stroke="var(--c-gauge-line)" strokeWidth="1.6">
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i * 10) * (Math.PI / 180)
            const major = i % 3 === 0
            const r1 = 168
            const r2 = major ? 148 : 158
            return (
              <line
                key={i}
                x1={190 + r1 * Math.cos(a)}
                y1={190 + r1 * Math.sin(a)}
                x2={190 + r2 * Math.cos(a)}
                y2={190 + r2 * Math.sin(a)}
                stroke={major ? 'var(--c-gauge-ink)' : 'var(--c-gauge-line)'}
              />
            )
          })}
        </g>

        {/* 主刻度弧 */}
        <path
          d="M 60 262 A 150 150 0 1 1 320 262"
          fill="none"
          stroke="url(#hero-arc)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* 副刻度弧 */}
        <path
          d="M 96 268 A 112 112 0 1 1 284 268"
          fill="none"
          stroke="var(--c-gauge-line)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* 指针 */}
        <g transform="rotate(-38 190 190)">
          <path d="M 190 190 L 190 74 L 196 92 L 190 104 Z" fill="var(--c-accent)" />
        </g>
        <circle cx="190" cy="190" r="11" fill="var(--c-decor-hub)" />
        <circle cx="190" cy="190" r="4" fill="var(--c-decor-face)" />

        {/* 下方读数条 */}
        <rect x="96" y="286" width="188" height="34" rx="8" fill="var(--c-decor-readout-bg)" stroke="var(--c-gauge-line)" />
        <rect x="104" y="294" width="112" height="6" rx="3" fill="var(--c-primary)" opacity="0.85" />
        <rect x="104" y="304" width="66" height="6" rx="3" fill="var(--c-accent)" opacity="0.85" />
        <text x="272" y="308" textAnchor="end" fontSize="11" fontFamily="monospace" fill="var(--c-gauge-ink)">
          ALT 120m
        </text>
      </svg>
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
    <div className="rounded-md border border-hairline bg-surface px-4 py-3 shadow-card">
      <dt className="flex items-center gap-1.5 text-xs font-bold text-ink">
        <span className="text-accent-ink" aria-hidden="true">
          {icon}
        </span>
        {term}
      </dt>
      <dd className="mt-1 text-2xs leading-relaxed text-ink-muted">{desc}</dd>
    </div>
  )
}
