import { useMemo } from 'react'

/**
 * E2 · 速度与升阻比
 * ---------------------------------------------------------------------------
 * 演示：速度平方律 + 极曲线 + 诱导阻力占比。
 * 可调参数：空速 V、迎角 α、展弦比 AR。
 *
 * 教学要点（对应题库考点）：
 *   · 阻力/升力 ∝ V²，速度翻倍 → ×4；功率 ∝ V³ → ×8（184/338）
 *   · 升阻比 = C_L / C_D，与空速无关，随迎角变化（364）
 *   · 极曲线原点切线的切点才是最大升阻比点，且 C_L < C_Lmax（372）
 *   · 诱导阻力与展弦比有关、与翼型无关（357/360）
 */

const RHO = 1.225
const AREA = 0.25 // m²
const CD0 = 0.028 // 型阻 + 摩擦阻力
const E_OSWALD = 0.85

/** 升力系数随迎角变化：线性段 + 临界后骤降 */
function liftCoefficient(alpha: number): number {
  const a = Math.max(-6, Math.min(20, alpha))
  if (a <= 16) {
    // 0.06 偏置 + 每度 0.088，16° 时约 1.5
    return 0.06 + a * 0.088
  }
  // 超过临界迎角：流动分离，C_L 急剧下降
  return Math.max(0.42, 1.5 - (a - 16) * 0.3)
}

/** 诱导阻力系数 */
function inducedCd(cl: number, ar: number): number {
  return (cl * cl) / (Math.PI * ar * E_OSWALD)
}

export default function E2SpeedRatio({ values }: { values: Record<string, number> }) {
  const v = values.speed ?? 15
  const alpha = values.alpha ?? 4
  const ar = values.ar ?? 7

  const cl = liftCoefficient(alpha)
  const cd = CD0 + inducedCd(cl, ar)
  const ld = cl / cd

  const q = 0.5 * RHO * v * v
  const lift = cl * q * AREA
  const drag = cd * q * AREA
  const power = drag * v // 克服阻力所需的功率（W）

  const inducedRatio = inducedCd(cl, ar) / cd // 诱导阻力占比

  // ── 极曲线（画一整条，并标出当前点与两个关键点）─────────────────────
  const polar = useMemo(() => {
    const pts: Array<{ cl: number; cd: number }> = []
    for (let a = -4; a <= 20; a += 0.25) {
      const c = liftCoefficient(a)
      const d = CD0 + inducedCd(c, ar)
      pts.push({ cl: c, cd: d })
    }
    return pts
  }, [ar])

  /** 极曲线坐标映射（画布 300×210，左下原点） */
  const PX = 52
  const PY = 178
  const PW = 232
  const PH = 140
  const CL_MAX_AX = 1.7
  const CD_MAX_AX = 0.16

  const toXY = (c: number, d: number) => ({
    x: PX + (c / CL_MAX_AX) * PW,
    y: PY - (d / CD_MAX_AX) * PH,
  })

  const polarPath = useMemo(() => {
    return polar
      .map((p, i) => {
        const { x, y } = toXY(p.cl, p.cd)
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polar, ar])

  // ── 关键点：最大升阻比（原点切线）与最大升力系数 ─────────────────────
  const bestLd = useMemo(() => {
    let best = { ld: 0, cl: 0, cd: 0, alpha: 0 }
    for (let a = -4; a <= 20; a += 0.1) {
      const c = liftCoefficient(a)
      const d = CD0 + inducedCd(c, ar)
      const ratio = c / d
      if (ratio > best.ld) best = { ld: ratio, cl: c, cd: d, alpha: a }
    }
    return best
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ar])

  const clMaxPoint = useMemo(() => {
    let best = { cl: 0, cd: 0, alpha: 0 }
    for (let a = -4; a <= 20; a += 0.1) {
      const c = liftCoefficient(a)
      if (c > best.cl) best = { cl: c, cd: CD0 + inducedCd(c, ar), alpha: a }
    }
    return best
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ar])

  const cur = toXY(cl, cd)
  const bestXY = toXY(bestLd.cl, bestLd.cd)
  const clMaxXY = toXY(clMaxPoint.cl, clMaxPoint.cd)

  // 原点到最优点连线（最大升阻比方向）
  const origin = toXY(0, 0)

  // ── 速度刻度对比条（速度平方律可视化）────────────────────────────────
  const speedMarks = [5, 10, 15, 20, 25, 30, 40]

  return (
    <div className="flex flex-col gap-4">
      {/* 仪表读数 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Readout label="空速 V" value={v.toFixed(0)} unit="m/s" />
        <Readout label="迎角 α" value={alpha.toFixed(1)} unit="°" />
        <Readout
          label="升阻比 L/D"
          value={ld.toFixed(1)}
          tone={ld >= bestLd.ld * 0.97 ? 'ok' : 'info'}
        />
        <Readout
          label="诱导阻力占比"
          value={(inducedRatio * 100).toFixed(0)}
          unit="%"
          tone={inducedRatio > 0.5 ? 'warn' : 'ok'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* ── 极曲线 ─────────────────────────────────────────────── */}
        <div className="rounded-md border border-panel-line bg-panel-raised p-3">
          <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
            极曲线 · C_D 对 C_L
          </p>
          <svg
            viewBox="0 0 300 210"
            className="w-full"
            role="img"
            aria-label={`极曲线。当前升力系数 ${cl.toFixed(2)}，阻力系数 ${cd.toFixed(
              3,
            )}，升阻比 ${ld.toFixed(1)}。最大升阻比点位于升力系数 ${bestLd.cl.toFixed(
              2,
            )} 处，而最大升力系数点在其右侧 ${clMaxPoint.cl.toFixed(2)}。`}
          >
            <g opacity="0.22">
              {Array.from({ length: 5 }, (_, i) => (
                <line
                  key={`gx${i}`}
                  x1={PX}
                  y1={PY - (i * PH) / 4}
                  x2={PX + PW}
                  y2={PY - (i * PH) / 4}
                  stroke="#8ba8ff"
                  strokeWidth="0.5"
                />
              ))}
              {Array.from({ length: 6 }, (_, i) => (
                <line
                  key={`gy${i}`}
                  x1={PX + (i * PW) / 5}
                  y1={PY}
                  x2={PX + (i * PW) / 5}
                  y2={PY - PH}
                  stroke="#8ba8ff"
                  strokeWidth="0.5"
                />
              ))}
            </g>

            {/* 坐标轴 */}
            <line x1={PX} y1={PY} x2={PX + PW} y2={PY} stroke="#5f7fb5" strokeWidth="1.2" />
            <line x1={PX} y1={PY} x2={PX} y2={PY - PH} stroke="#5f7fb5" strokeWidth="1.2" />
            <text x={PX + PW} y={PY + 14} textAnchor="end" fontSize="9" fill="#a8bcd6" fontFamily="monospace">
              C_L →
            </text>
            <text x={PX - 4} y={PY - PH + 4} textAnchor="end" fontSize="9" fill="#a8bcd6" fontFamily="monospace">
              C_D
            </text>

            {/* 极曲线 */}
            <path d={polarPath} fill="none" stroke="#4a90d9" strokeWidth="2.2" strokeLinecap="round" />

            {/* 原点到最优点：最大升阻比方向 */}
            <line
              x1={origin.x}
              y1={origin.y}
              x2={bestXY.x}
              y2={bestXY.y}
              stroke="#7fe0b0"
              strokeWidth="1.4"
              strokeDasharray="4 3"
            />

            {/* 最大升阻比点 */}
            <circle cx={bestXY.x} cy={bestXY.y} r="4" fill="#7fe0b0" />
            <text
              x={bestXY.x}
              y={bestXY.y - 7}
              textAnchor="middle"
              fontSize="8.5"
              fill="#7fe0b0"
              fontFamily="monospace"
            >
              最大 L/D
            </text>

            {/* 最大升力系数点 */}
            <rect
              x={clMaxXY.x - 3.5}
              y={clMaxXY.y - 3.5}
              width="7"
              height="7"
              fill="none"
              stroke="#ffc46b"
              strokeWidth="1.6"
            />
            <text
              x={clMaxXY.x}
              y={clMaxXY.y + 14}
              textAnchor="middle"
              fontSize="8.5"
              fill="#ffc46b"
              fontFamily="monospace"
            >
              C_Lmax
            </text>

            {/* 当前点 */}
            <circle cx={cur.x} cy={cur.y} r="5" fill="#ff6b35" stroke="#ffffff" strokeWidth="1.4" />
          </svg>
          <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
            绿虚线 = 原点到曲线的切线方向（最大升阻比）；橙点 = 你当前的迎角。
            <span className="text-panel-warn">注意橙点在绿点左边</span>——
            升阻比最优的迎角，小于最大升力系数的迎角。
          </p>
        </div>

        {/* ── 速度平方律条形图 ─────────────────────────────────── */}
        <div className="rounded-md border border-panel-line bg-panel-raised p-3">
          <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-panel-muted">
            速度平方律 · 同一迎角下
          </p>
          <svg
            viewBox="0 0 220 210"
            className="w-full"
            role="img"
            aria-label={`不同空速下的升力、阻力与功率对比，当前空速 ${v} 米每秒`}
          >
            {speedMarks.map((s) => {
              const sq = s * s
              const maxSq = 40 * 40
              const hL = (sq / maxSq) * 150
              const hP = (Math.pow(s, 3) / Math.pow(40, 3)) * 150
              const x = 18 + speedMarks.indexOf(s) * 33
              const isCur = s === v
              return (
                <g key={s}>
                  {/* 升力/阻力条（∝V²） */}
                  <rect
                    x={x}
                    y={150 - hL}
                    width="12"
                    height={hL}
                    fill={isCur ? '#ff6b35' : '#4a90d9'}
                    rx="2"
                    opacity={isCur ? 1 : 0.65}
                  />
                  {/* 功率条（∝V³） */}
                  <rect
                    x={x + 14}
                    y={150 - hP}
                    width="12"
                    height={hP}
                    fill={isCur ? '#ffc46b' : '#2f6fd0'}
                    rx="2"
                    opacity={isCur ? 1 : 0.5}
                  />
                  <text
                    x={x + 13}
                    y="164"
                    textAnchor="middle"
                    fontSize="8"
                    fill={isCur ? '#eaf1fa' : '#a8bcd6'}
                    fontFamily="monospace"
                  >
                    {s}
                  </text>
                </g>
              )
            })}
            <line x1="12" y1="150" x2="212" y2="150" stroke="#5f7fb5" strokeWidth="1" />
            <text x="12" y="146" fontSize="8" fill="#a8bcd6" fontFamily="monospace">
              0
            </text>
            <text x="14" y="182" fontSize="8.5" fill="#4a90d9" fontFamily="monospace">
              ▮ 升力/阻力 (∝V²)
            </text>
            <text x="14" y="195" fontSize="8.5" fill="#ffc46b" fontFamily="monospace">
              ▮ 功率 (∝V³)
            </text>
          </svg>
          <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
            空速 <span className="tnum text-panel-text">{v}</span> m/s 时：
            升力 <span className="tnum text-panel-accent">{lift.toFixed(0)}</span> N、
            阻力 <span className="tnum text-panel-accent">{drag.toFixed(0)}</span> N、
            需功率 <span className="tnum text-panel-warn">{power.toFixed(0)}</span> W。
          </p>
        </div>
      </div>

      {/* 公式条 */}
      <div className="flex flex-col gap-1.5 rounded-md bg-panel-raised px-4 py-3 font-mono text-xs text-panel-text">
        <p>
          <span className="text-panel-muted">动压</span> q = ½ρV² ={' '}
          <span className="text-panel-accent">{q.toFixed(0)}</span> Pa
          <span className="ml-2 text-panel-muted">
            V={v} → 速度翻倍则 ×4
          </span>
        </p>
        <p>
          <span className="text-panel-muted">升阻比</span> L/D = C<sub>L</sub>/C<sub>D</sub> ={' '}
          <span className="text-panel-accent">
            {cl.toFixed(3)}/{cd.toFixed(4)}
          </span>{' '}
          = <span className="text-panel-ok">{ld.toFixed(2)}</span>
        </p>
        <p>
          <span className="text-panel-muted">诱导阻力</span> C<sub>Di</sub> = C<sub>L</sub>²/(π·AR·e) ={' '}
          <span className="text-panel-accent">{inducedCd(cl, ar).toFixed(4)}</span>
          <span className="ml-2 text-panel-muted">
            AR={ar}（与翼型无关）
          </span>
        </p>
        <p>
          <span className="text-panel-muted">最大升阻比</span> L/D<sub>max</sub> ={' '}
          <span className="text-panel-ok">{bestLd.ld.toFixed(2)}</span>
          <span className="ml-2 text-panel-muted">
            @ α={bestLd.alpha.toFixed(1)}°，而 C<sub>Lmax</sub> @ α=
            {clMaxPoint.alpha.toFixed(1)}°
          </span>
        </p>
      </div>
    </div>
  )
}

function Readout({
  label,
  value,
  unit,
  tone = 'ok',
}: {
  label: string
  value: string
  unit?: string
  tone?: 'ok' | 'bad' | 'info' | 'warn'
}) {
  const color =
    tone === 'bad'
      ? 'text-panel-bad'
      : tone === 'info'
        ? 'text-panel-accent'
        : tone === 'warn'
          ? 'text-panel-warn'
          : 'text-panel-ok'

  return (
    <div className="rounded-md border border-panel-line bg-panel-raised px-3 py-2">
      <p className="text-2xs uppercase tracking-wider text-panel-muted">{label}</p>
      <p className={`tnum mt-0.5 text-lg font-bold leading-none ${color}`}>
        {value}
        {unit && <span className="ml-1 text-2xs font-normal text-panel-muted">{unit}</span>}
      </p>
    </div>
  )
}
