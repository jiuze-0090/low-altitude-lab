import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import PageHeader from '@/components/ui/PageHeader'
import {
  authorities,
  airspaceSystems,
  beijingUavRules,
  controlUnits,
  controlledClasses,
  filingRules,
  flightLevels,
  type GuideTable,
  noFlyNotice,
  uavAirspace,
  uavClassNumbers,
  uavControlledScope,
  wxNumbers,
  altitudeRules,
} from '@/content/guides'
import { siteMeta } from '@/content'

/**
 * 规章速查卡
 * ---------------------------------------------------------------------------
 * 承载「不适合做交互、但必须查」的规章类考点。
 * 每条标注题库真实题号，便于回溯核对。
 */

const SECTIONS = [
  { id: 'altitude-scale', label: '高度标尺' },
  { id: 'airspace', label: '空域体系' },
  { id: 'controlled', label: '管制空域' },
  { id: 'uav', label: '无人机空域' },
  { id: 'units', label: '管制单位' },
  { id: 'filing', label: '申报与间隔' },
  { id: 'altitude', label: '高度基准' },
  { id: 'levels', label: '飞行高度' },
  { id: 'wx', label: '气象数字' },
  { id: 'uav-class', label: '无人机分类' },
  { id: 'authority', label: '立法主体' },
  { id: 'beijing', label: '北京新规' },
  { id: 'no-fly', label: '禁飞区通告' },
]

export default function GuidesPage() {
  useEffect(() => {
    document.title = siteMeta.titleTemplate.replace('%s', '规章速查卡')
    const tag = document.querySelector('meta[name="description"]')
    if (tag)
      tag.setAttribute(
        'content',
        '空域分类、管制空域四类、无人机适飞与隔离融合空域、飞行高度层基准、申报间隔、气象数字，以及北京新规与首都禁飞区通告——全部对照题库题号的速查表。',
      )
  }, [])

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="速查"
        title="规章速查卡"
        description="这一章的知识点是「背下来的」而不是「算出来的」，硬做成可调参数一定会失真。所以它做成一页可打印的速查表——每一条都标了题库题号，方便回溯核对。"
      >
        <div className="mt-5 flex flex-wrap gap-1.5">
          <Link
            to="/cheatsheets"
            className="rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-primary hover:text-primary-text"
          >
            原理速查卡（气动 / 稳定性 / 性能 / 公式）→
          </Link>
          <Link
            to="/exam"
            className="rounded-md border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-primary hover:text-primary-text"
          >
            考点索引（按题号检索）→
          </Link>
        </div>
      </PageHeader>

      {/* 锚点导航 */}
      <nav
        aria-label="速查卡分节导航"
        className="glass-bar sticky top-[var(--header-h)] z-40 border-b"
      >
        <div className="shell no-scrollbar flex gap-1 overflow-x-auto py-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-canvas hover:text-primary-text"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="shell flex flex-col gap-10 py-8 sm:py-10">
        {/* ── 高度标尺 ─────────────────────────────────────────────────── */}
        <section id="altitude-scale" className="scroll-mt-32">
          <SectionTitle
            title="一张图记完所有高度"
            desc="这些数字分别来自不同的规定，混在一起最容易错。把它们放到同一根轴上，位置关系比数字本身更好记。"
          />
          <div className="card mt-4 p-4 sm:p-5">
            <HeightScale />
          </div>
        </section>

        {/* ── 空域体系 ─────────────────────────────────────────────────── */}
        <section id="airspace" className="scroll-mt-32">
          <SectionTitle
            title="空域体系"
            desc="先把这三套体系的边界分清，再看细分。"
          />
          <div className="mt-4 flex flex-col gap-4">
            <TableView table={airspaceSystems} />
            <AirspaceTree />
          </div>
        </section>

        {/* ── 管制空域四类 ─────────────────────────────────────────────── */}
        <section id="controlled" className="scroll-mt-32">
          <SectionTitle title="管制空域四类" desc="每一类都是一个划定范围的三维空间。" />
          <div className="mt-4">
            <TableView table={controlledClasses} />
          </div>
        </section>

        {/* ── 无人机空域 ───────────────────────────────────────────────── */}
        <section id="uav" className="scroll-mt-32">
          <SectionTitle
            title="无人机的三类专属空域"
            desc="适飞、隔离、融合——决定你在哪能飞、飞多高、要什么执照。"
          />
          <div className="mt-4 flex flex-col gap-4">
            <TableView table={uavAirspace} />
            <div className="card p-5">
              <h3 className="text-sm font-bold text-ink">{uavControlledScope.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {uavControlledScope.summary}
              </p>
              <ul className="mt-3.5 grid gap-2 sm:grid-cols-2">
                {uavControlledScope.points.map((p) => (
                  <li
                    key={p.label}
                    className="flex items-start justify-between gap-3 rounded-md bg-canvas px-3 py-2.5"
                  >
                    <span className="text-sm font-semibold text-ink">{p.label}</span>
                    <span className="flex-1 text-sm text-ink-soft">{p.text}</span>
                    {p.ref && (
                      <span className="tnum shrink-0 text-2xs font-bold text-accent-ink">
                        {p.ref}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── 管制单位 ─────────────────────────────────────────────────── */}
        <section id="units" className="scroll-mt-32">
          <SectionTitle title="三个管制单位" desc="谁负责哪一段 airspace。" />
          <div className="mt-4">
            <TableView table={controlUnits} />
          </div>
        </section>

        {/* ── 申报与间隔 ───────────────────────────────────────────────── */}
        <section id="filing" className="scroll-mt-32">
          <SectionTitle
            title="申报、许可与间隔"
            desc="这一组的数字最多，但每一条都只有一句话能考——背熟了就是白送的分。"
          />
          <div className="mt-4">
            <TableView table={filingRules} />
          </div>
        </section>

        {/* ── 高度基准 ─────────────────────────────────────────────────── */}
        <section id="altitude" className="scroll-mt-32">
          <SectionTitle
            title="高度基准与高度层"
            desc="高度层不是按真高分的，是按 1013.25 hPa 气压平面分的。"
          />
          <div className="mt-4">
            <TableView table={altitudeRules} />
          </div>
        </section>

        {/* ── 飞行高度层次 ─────────────────────────────────────────────── */}
        <section id="levels" className="scroll-mt-32">
          <SectionTitle title="按真高划分的飞行高度" desc="这一组是按真高，和上一组不是一回事。" />
          <div className="mt-4">
            <TableView table={flightLevels} />
          </div>
        </section>

        {/* ── 气象数字 ─────────────────────────────────────────────────── */}
        <section id="wx" className="scroll-mt-32">
          <SectionTitle
            title="气象数字"
            desc="定义型的知识不适合做成交互，但数字必须记牢。"
          />
          <div className="mt-4">
            <TableView table={wxNumbers} />
          </div>
        </section>

        {/* ── 无人机分类 ───────────────────────────────────────────────── */}
        <section id="uav-class" className="scroll-mt-32">
          <SectionTitle title="无人机分类关键数字" desc="与空域规则配套使用。" />
          <div className="mt-4">
            <TableView table={uavClassNumbers} />
          </div>
        </section>

        {/* ── 立法主体 ─────────────────────────────────────────────────── */}
        <section id="authority" className="scroll-mt-32">
          <SectionTitle title="谁制定、谁实施" desc="最后一组，纯记忆。" />
          <div className="mt-4">
            <TableView table={authorities} />
          </div>
        </section>

        {/* ── 北京新规 ─────────────────────────────────────────────────── */}
        <section id="beijing" className="scroll-mt-32">
          <SectionTitle
            title="北京市无人驾驶航空器管理规定"
            desc="2026 年 11 月 15 日刚施行，题库已收录 24 题。考 CAAC 不考地方规定，但本地飞手和机构必须知道红线在哪。"
          />
          <div className="mt-4">
            <TableView table={beijingUavRules} />
          </div>
        </section>

        {/* ── 禁飞区通告 ───────────────────────────────────────────────── */}
        <section id="no-fly" className="scroll-mt-32">
          <SectionTitle
            title="禁飞区通告 A4484/26"
            desc="首都新设特别限制区 ZB (SR) 801，19 题。数字必须背死：代号、坐标、半径、垂直范围、有效期。"
          />
          <div className="mt-4">
            <TableView table={noFlyNotice} />
          </div>
        </section>
      </div>
    </div>
  )
}

/* ── 分节标题 ─────────────────────────────────────────────────────────── */

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {desc && <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-soft">{desc}</p>}
    </div>
  )
}

/* ── 通用表格 ─────────────────────────────────────────────────────────── */

function TableView({ table }: { table: GuideTable }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-hairline bg-canvas px-5 py-3.5">
        <h3 className="text-sm font-bold text-ink">{table.title}</h3>
        {table.subtitle && (
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink-soft">
            {table.subtitle}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline">
              {table.columns.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`px-5 py-2.5 text-2xs font-bold uppercase tracking-wider text-ink-muted ${
                    i === table.columns.length - 1 ? 'w-20 text-right' : ''
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-hairline last:border-b-0">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-5 py-3 align-top text-sm ${
                      ci === 0
                        ? 'font-semibold text-ink'
                        : ci === row.length - 1 && table.columns.length > 2
                          ? 'tnum whitespace-nowrap text-right text-xs font-bold text-accent-ink'
                          : 'text-ink-soft'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.note && (
        <p className="border-t border-hairline bg-canvas px-5 py-3 text-xs leading-relaxed text-ink-soft">
          {table.note}
        </p>
      )}
    </div>
  )
}

/* ── 空域分类树 ───────────────────────────────────────────────────────── */

function AirspaceTree() {
  const nodes = [
    { depth: 0, label: '民用空域', tone: 'root' },
    { depth: 1, label: '空中交通服务空域' },
    { depth: 2, label: '管制空域', tone: 'key' },
    { depth: 3, label: 'A 类 · 高空管制（6300 m 含以上）' },
    { depth: 3, label: 'B 类 · 中低空管制（6000 m 含以下至最低高度层以上）' },
    { depth: 3, label: 'C 类 · 进近管制（机场附近航路汇合处）' },
    { depth: 3, label: 'D 类 · 机场飞行空域' },
    { depth: 2, label: '非管制空域', tone: 'key' },
    { depth: 2, label: '特殊空域', tone: 'key' },
    { depth: 1, label: '飞行情报区' },
    { depth: 1, label: '空中禁区 / 限制区 / 危险区' },
  ]

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-ink">民用空域的结构</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        框内是「空中交通服务空域」的三个分支；管制空域再按服务类型分成 A/B/C/D 四类。
      </p>
      <ul className="mt-4 flex flex-col gap-1">
        {nodes.map((n, i) => (
          <li key={i} className="flex items-center gap-2" style={{ paddingLeft: n.depth * 18 }}>
            {n.depth > 0 && (
              <span
                aria-hidden="true"
                className="h-px w-3 shrink-0 bg-hairline"
                style={{ marginLeft: -18 }}
              />
            )}
            <span
              className={
                n.tone === 'root'
                  ? 'text-sm font-bold text-ink'
                  : n.tone === 'key'
                    ? 'rounded-md bg-primary-soft px-2 py-0.5 text-sm font-semibold text-primary-ink'
                    : 'text-sm text-ink-soft'
              }
            >
              {n.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── 高度标尺图 ───────────────────────────────────────────────────────── */

function HeightScale() {
  const H_MAX = 13000
  const y = (h: number) => 250 - (h / H_MAX) * 220

  const bands = [
    { from: 0, to: 120, fill: 'var(--c-scale-1)', stroke: 'var(--c-ok)', label: '超低空', sub: '真高 100 m 以下' },
    { from: 120, to: 1000, fill: 'var(--c-scale-2)', stroke: 'var(--c-primary-text)', label: '低空', sub: '100–1000 m' },
    { from: 1000, to: 6000, fill: 'var(--c-scale-3)', stroke: 'var(--c-primary-text)', label: '中空', sub: '1000–6000 m' },
    { from: 6000, to: 12000, fill: 'var(--c-scale-4)', stroke: 'var(--c-primary-text)', label: '高空', sub: '6000–12000 m' },
    { from: 12000, to: 13000, fill: 'var(--c-scale-5)', stroke: 'var(--c-text-soft)', label: '超高空', sub: '12000 m 以上' },
  ]

  const marks = [
    { h: 120, text: '真高 120 m', note: '微型/轻型/小型适飞空域上限 · 1715' },
    { h: 1000, text: '1000 m', note: '低空 / 中空 分界（真高）' },
    { h: 6000, text: '6000 m', note: '中空 / 高空 分界（真高）· 82 · 2003' },
    // 6300 m 与 6000 m 在标尺上仅隔约 5px，标注下移并加引线，避免压字
    { h: 6300, text: '6300 m', note: 'A 类高空管制空域下限 · 1555', shift: 26 },
    { h: 8400, text: '8400 m', note: '等待空域高度层间隔换挡点 · 1975' },
    { h: 12000, text: '12000 m', note: '高空上限 · 82' },
  ]

  return (
    <svg
      viewBox="0 0 360 280"
      className="w-full"
      role="img"
      aria-label="高度标尺：标出真高 120 米适飞上限、1000 米低空与中空分界、6000 米中空与高空分界、6300 米 A 类管制空域下限、8400 米等待空域高度层间隔换挡点、12000 米高空上限。"
    >
      {/* 高度带 */}
      {bands.map((b) => (
        <g key={b.label}>
          <rect
            x="52"
            y={y(b.to)}
            width="26"
            height={y(b.from) - y(b.to)}
            fill={b.fill}
            stroke={b.stroke}
            strokeWidth="0.8"
          />
          <text
            x="48"
            y={(y(b.from) + y(b.to)) / 2 + 3}
            textAnchor="end"
            fontSize="8"
            fill="var(--c-scale-ink)"
            fontWeight="bold"
          >
            {b.label}
          </text>
        </g>
      ))}

      {/* 主轴 */}
      <line x1="52" y1={y(0)} x2="52" y2={y(H_MAX)} stroke="var(--c-scale-ink)" strokeWidth="1" />
      <line x1="46" y1={y(0)} x2="78" y2={y(0)} stroke="var(--c-scale-ink)" strokeWidth="1.4" />
      <text x="44" y={y(0) + 3} textAnchor="end" fontSize="8" fill="var(--c-text-soft)" fontFamily="monospace">
        0
      </text>

      {/* 刻度标注 */}
      {marks.map((m) => {
        const shift = 'shift' in m ? (m.shift as number) : 0
        const ly = y(m.h)
        return (
          <g key={m.h}>
            <line x1="78" y1={ly} x2="96" y2={ly} stroke="var(--c-text-soft)" strokeWidth="0.9" />
            {shift > 0 && (
              <path
                d={`M 96 ${ly} L 104 ${ly + shift}`}
                fill="none"
                stroke="var(--c-text-soft)"
                strokeWidth="0.9"
              />
            )}
            <circle cx="52" cy={ly} r="2.2" fill="var(--c-accent)" />
            <text
              x={shift > 0 ? 106 : 100}
              y={ly - 2 + shift}
              fontSize="8.5"
              fill="var(--c-scale-ink)"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {m.text}
            </text>
            <text x={shift > 0 ? 106 : 100} y={ly + 8 + shift} fontSize="7.5" fill="var(--c-text-muted)">
              {m.note}
            </text>
          </g>
        )
      })}

      {/* 管制空域 A/B 分界说明 */}
      <line x1="44" y1={y(6000)} x2="44" y2={y(6300)} stroke="var(--c-accent-ink)" strokeWidth="1.6" />
      <text x="40" y={(y(6000) + y(6300)) / 2 + 3} textAnchor="end" fontSize="7" fill="var(--c-accent-ink)" fontFamily="monospace">
        A/B
      </text>
    </svg>
  )
}
