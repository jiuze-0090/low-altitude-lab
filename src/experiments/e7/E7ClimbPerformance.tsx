import { useMemo } from 'react'

/**
 * E7 · 爬升率与航迹
 * ---------------------------------------------------------------------------
 * 演示：速度-高度性能包线（Vs / Vx / Vy / Vmax）随高度的变化，
 *      以及温度偏差通过密度高度对爬升率的侵蚀。
 *
 * 可调参数：真实高度、温度偏差、起飞重量、地速。
 *
 * 模型：
 *   ρ(h, ΔT) = p_ISA(h) / (R·(T_ISA(h) + ΔT))，密度高度 DA 满足 ρ_ISA(DA) = ρ
 *   T(ρ) = T_SL · ρ/ρ_0（转速不变时螺旋桨推力 ∝ ρ）
 *   D = q·S·(CD0 + CL²/(πAe))
 *   爬升率 R_c = (T − D)·V / W
 *
 * 教学要点（对应题库考点）：
 *   · 爬升角取决于剩余推力与重量（407）；高度升高爬升率减小（496）
 *   · Vx 增大、Vy 减小（464）；失速速度随载重与坡度增大（341 / 213）
 *   · 下滑角与升阻比互为倒数关系（193 / 247 / 196）
 */

const T0 = 288.15
const P0 = 1013.25
const LAPSE = 0.0065
const G = 9.80665
const R = 287.05
const K_EXP = G / (R * LAPSE)
const RHO0 = 1.225

const S_WING = 0.35
const AR = 7
const E_OSWALD = 0.8
const CD0 = 0.035
const CL_MAX = 1.5
const T_SL = 62 // 海平面全油门静推力 N

const isaPressure = (h: number) => P0 * Math.pow(1 - (LAPSE * h) / T0, K_EXP)
const isaTemp = (h: number) => T0 - LAPSE * h
const isaDensity = (h: number) =>
  ((P0 * 100) / (R * T0)) * Math.pow(1 - (LAPSE * h) / T0, K_EXP - 1)

function densityAt(h: number, dT: number) {
  return (isaPressure(h) * 100) / (R * (isaTemp(h) + dT))
}

function densityAltitude(rho: number) {
  let lo = -2000
  let hi = 8000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (isaDensity(mid) > rho) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * 可用推力随密度的衰减
 * ---------------------------------------------------------------------------
 * 发动机功率本身随密度下降（正常吸气式约 P ∝ σ^0.7），螺旋桨效率在高高度
 * 又会进一步下降，两者叠加后可用推力近似按 σ^1.2 衰减。
 * 这条指数正是 Vx 随高度增大、Vy 随高度减小的原因（题 464）。
 */
const THRUST_EXP = 1.2

function thrustAt(rho: number) {
  return T_SL * Math.pow(rho / RHO0, THRUST_EXP)
}

function dragAt(rho: number, v: number, W: number) {
  const q = 0.5 * rho * v * v
  const cl = W / (q * S_WING)
  const cd = CD0 + (cl * cl) / (Math.PI * AR * E_OSWALD)
  return { d: q * S_WING * cd, cl, cd }
}

export default function E7ClimbPerformance({ values }: { values: Record<string, number> }) {
  const alt = values.altitude ?? 0
  const dT = values.tempDev ?? 0
  const mass = values.mass ?? 12
  const v = values.speed ?? 22

  const W = mass * 9.81

  const current = useMemo(() => {
    const rho = densityAt(alt, dT)
    const da = densityAltitude(rho)
    const sigma = rho / isaDensity(alt)
    const T = thrustAt(rho)
    const { d, cl, cd } = dragAt(rho, v, W)
    const excess = T - d
    const climb = (excess * v) / W
    const vs = Math.sqrt((2 * W) / (rho * S_WING * CL_MAX))
    const vx = vs * Math.sqrt(3)
    const glide = Math.atan(d / W) * (180 / Math.PI)
    return { rho, da, sigma, T, d, cl, cd, excess, climb, vs, vx, glide }
  }, [alt, dT, mass, v, W])

  /** 速度-高度包线 */
  const envelope = useMemo(() => {
    const out: Array<{
      h: number
      vs: number
      vx: number
      vy: number
      vmax: number
    }> = []
    for (let h = 0; h <= 5000; h += 250) {
      const rho = densityAt(h, dT)
      const vs = Math.sqrt((2 * W) / (rho * S_WING * CL_MAX))
      let bestVy = vs
      let bestRc = -Infinity
      let bestVx = vs
      let bestRt = -Infinity
      let vmax = vs
      for (let sp = vs; sp <= 80; sp += 0.25) {
        const T = thrustAt(rho)
        const { d } = dragAt(rho, sp, W)
        const rt = T - d
        if (rt >= 0) vmax = sp
        if (rt > bestRt) {
          bestRt = rt
          bestVx = sp
        }
        const rc = (rt * sp) / W
        if (rc > bestRc) {
          bestRc = rc
          bestVy = sp
        }
      }
      out.push({ h, vs, vx: bestVx, vy: bestVy, vmax })
    }
    return out
  }, [dT, W])

  // ── 图表坐标 ────────────────────────────────────────────────────────
  const CX = 40
  const CY = 20
  const CW = 300
  const CH = 180
  const V_MAX = 80
  const H_MAX = 5000
  const xTo = (sp: number) => CX + (Math.min(sp, V_MAX) / V_MAX) * CW
  const yTo = (h: number) => CY + CH - (Math.min(h, H_MAX) / H_MAX) * CH

  const path = (key: 'vs' | 'vx' | 'vy' | 'vmax') =>
    envelope.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xTo(p[key]).toFixed(1)} ${yTo(p.h).toFixed(1)}`).join(' ')

  const pointX = xTo(v)
  const pointY = yTo(alt)
  const canClimb = current.excess > 0

  return (
    <div className="flex flex-col gap-4">
      {/* 仪表读数 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Readout
          label="密度高度 DA"
          value={current.da.toFixed(0)}
          unit="m"
          tone={current.da > alt + 300 ? 'bad' : current.da > alt + 100 ? 'warn' : 'ok'}
        />
        <Readout
          label="剩余推力 T − D"
          value={current.excess.toFixed(1)}
          unit="N"
          tone={canClimb ? 'ok' : 'bad'}
        />
        <Readout
          label="爬升率"
          value={current.climb.toFixed(1)}
          unit="m/s"
          tone={canClimb ? (current.climb < 2 ? 'warn' : 'info') : 'bad'}
        />
        <Readout
          label="失速速度 Vs"
          value={current.vs.toFixed(1)}
          unit="m/s"
          tone={v < current.vs ? 'bad' : 'ok'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* ── 性能包线图 ─────────────────────────────────────────── */}
        <div className="rounded-md border border-panel-line bg-panel-raised p-3">
          <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
            速度 - 高度 包线
          </p>
          <svg
            viewBox="0 0 360 236"
            className="w-full"
            role="img"
            aria-label={`速度高度包线图。当前高度 ${alt} 米，速度 ${v} 米每秒，爬升率 ${current.climb.toFixed(
              1,
            )} 米每秒。`}
          >
            <g opacity="0.18">
              {[0, 1000, 2000, 3000, 4000, 5000].map((h) => (
                <line
                  key={`h${h}`}
                  x1={CX}
                  y1={yTo(h)}
                  x2={CX + CW}
                  y2={yTo(h)}
                  stroke="#8ba8ff"
                  strokeWidth="0.6"
                />
              ))}
              {[0, 10, 20, 30, 40, 50, 60, 70].map((sp) => (
                <line
                  key={`v${sp}`}
                  x1={xTo(sp)}
                  y1={CY}
                  x2={xTo(sp)}
                  y2={CY + CH}
                  stroke="#8ba8ff"
                  strokeWidth="0.6"
                />
              ))}
            </g>

            {/* 坐标轴 */}
            <line x1={CX} y1={CY + CH} x2={CX + CW} y2={CY + CH} stroke="#5f7fb5" strokeWidth="1.2" />
            <line x1={CX} y1={CY} x2={CX} y2={CY + CH} stroke="#5f7fb5" strokeWidth="1.2" />
            <text x={CX + CW} y={CY + CH + 14} textAnchor="end" fontSize="9" fill="#a8bcd6" fontFamily="monospace">
              地速 V →
            </text>
            <text x={CX - 4} y={CY + 4} textAnchor="end" fontSize="9" fill="#a8bcd6" fontFamily="monospace">
              H
            </text>

            {/* 刻度 */}
            {[0, 20, 40, 60].map((sp) => (
              <text
                key={`tx${sp}`}
                x={xTo(sp)}
                y={CY + CH + 13}
                textAnchor="middle"
                fontSize="8"
                fill="#8fa8c9"
                fontFamily="monospace"
              >
                {sp}
              </text>
            ))}
            {[0, 1000, 3000, 5000].map((h) => (
              <text
                key={`ty${h}`}
                x={CX - 4}
                y={yTo(h) + 3}
                textAnchor="end"
                fontSize="8"
                fill="#8fa8c9"
                fontFamily="monospace"
              >
                {h}
              </text>
            ))}

            {/* 曲线 */}
            <path d={path('vmax')} fill="none" stroke="#4a90d9" strokeWidth="1.8" />
            <path d={path('vy')} fill="none" stroke="#ff9a6e" strokeWidth="2" />
            <path d={path('vx')} fill="none" stroke="#ffc46b" strokeWidth="1.6" strokeDasharray="4 3" />
            <path d={path('vs')} fill="none" stroke="#ff8b82" strokeWidth="1.8" />

            {/* 当前状态点 */}
            <line x1={pointX} y1={pointY} x2={pointX} y2={CY + CH} stroke="#ff6b35" strokeWidth="0.9" strokeDasharray="3 3" />
            <line x1={CX} y1={pointY} x2={pointX} y2={pointY} stroke="#ff6b35" strokeWidth="0.9" strokeDasharray="3 3" />
            <circle cx={pointX} cy={pointY} r="5" fill="#ff6b35" stroke="#ffffff" strokeWidth="1.4" />
            <text x={pointX + 8} y={pointY - 6} fontSize="9" fill="#ff9a6e" fontFamily="monospace">
              {v} m/s @ {alt} m
            </text>

            {/* 当前 Vy 标记 */}
            <circle
              cx={xTo(envelope.find((p) => p.h === Math.round(alt / 250) * 250)?.vy ?? 0)}
              cy={pointY}
              r="3.5"
              fill="#ff9a6e"
            />
          </svg>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            {[
              ['#ff8b82', 'Vs 失速速度'],
              ['#ffc46b', 'Vx 最佳爬升角'],
              ['#ff9a6e', 'Vy 最佳爬升率'],
              ['#4a90d9', 'Vmax 最大平飞'],
            ].map(([c, t]) => (
              <span key={t} className="flex items-center gap-1.5 text-2xs text-panel-muted">
                <span className="h-0.5 w-4 rounded" style={{ background: c }} aria-hidden="true" />
                {t}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-2xs leading-relaxed text-panel-muted">
            {canClimb ? (
              <>
                当前还有 <span className="text-panel-ok">{current.excess.toFixed(1)} N</span> 剩余推力，
                爬升率 <span className="text-panel-accent">{current.climb.toFixed(1)} m/s</span>。
                注意 Vy 随高度<span className="text-panel-warn">变小</span>、Vx 随高度变大（题 464）。
              </>
            ) : (
              <span className="text-panel-bad">
                剩余推力为负（{current.excess.toFixed(1)} N）——当前速度下
                <span className="text-panel-bad">爬不上去</span>。要么加速、要么减载、要么换高度。
              </span>
            )}
          </p>
        </div>

        {/* ── 数字面板 ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-panel-line bg-panel-raised p-3">
            <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-panel-muted">
              当前状态分解
            </p>
            <dl className="flex flex-col gap-2 font-mono text-xs">
              <Row label="空气密度 ρ" value={`${current.rho.toFixed(3)} kg/m³`} />
              <Row label="密度比 σ" value={current.sigma.toFixed(3)} />
              <Row
                label="密度高度 DA"
                value={`${current.da.toFixed(0)} m（实高 ${alt} m）`}
                tone={current.da > alt + 100 ? 'bad' : 'ok'}
              />
              <Row label="可用推力 T" value={`${current.T.toFixed(1)} N`} />
              <Row label="阻力 D" value={`${current.d.toFixed(1)} N`} />
              <Row label="升力系数 C_L" value={current.cl.toFixed(2)} />
              <Row label="剩余推力 T − D" value={`${current.excess.toFixed(1)} N`} tone={canClimb ? 'ok' : 'bad'} />
              <Row label="爬升率" value={`${current.climb.toFixed(1)} m/s`} tone={canClimb ? 'ok' : 'bad'} />
              <Row label="下滑角（同一速度）" value={`${current.glide.toFixed(1)}°`} />
            </dl>
          </div>

          <div className="rounded-md border border-panel-line bg-panel-raised p-3">
            <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
              高度对性能的影响（同一重量、同样的温度偏差）
            </p>
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="text-panel-muted">
                  <th className="py-1 text-left font-medium">高度</th>
                  <th className="py-1 text-right font-medium">Vs</th>
                  <th className="py-1 text-right font-medium">Vx</th>
                  <th className="py-1 text-right font-medium">Vy</th>
                  <th className="py-1 text-right font-medium">Vmax</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1000, 2000, 3000, 4000, 5000].map((h) => {
                  const row = envelope.find((p) => p.h === h)
                  if (!row) return null
                  return (
                    <tr key={h} className="border-t border-panel-line">
                      <td className="py-1 text-panel-muted">{h} m</td>
                      <td className="tnum py-1 text-right text-panel-text">{row.vs.toFixed(1)}</td>
                      <td className="tnum py-1 text-right text-panel-text">{row.vx.toFixed(1)}</td>
                      <td className="tnum py-1 text-right text-panel-text">{row.vy.toFixed(1)}</td>
                      <td className="tnum py-1 text-right text-panel-text">{row.vmax.toFixed(1)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="mt-2 text-2xs leading-relaxed text-panel-muted">
              单位 m/s。Vx 随高度增大、Vy 随高度减小（题 464）；
              温度偏差 {dT > 0 ? `+${dT}` : dT} ℃ 会把整张表往上推（密度高度升高）。
            </p>
          </div>
        </div>
      </div>

      {/* 公式条 */}
      <div className="flex flex-col gap-1.5 rounded-md bg-panel-raised px-4 py-3 font-mono text-xs text-panel-text">
        <p>
          <span className="text-panel-muted">密度</span> ρ = p/(RT) ={' '}
          <span className="text-panel-accent">{current.rho.toFixed(3)}</span> kg/m³
          <span className="ml-2 text-panel-muted">
            σ = {current.sigma.toFixed(3)}，密度高度 {current.da.toFixed(0)} m
          </span>
        </p>
        <p>
          <span className="text-panel-muted">可用推力</span> T = T_SL·σ^1.2 ={' '}
          <span className="text-panel-accent">{current.T.toFixed(1)}</span> N
          <span className="ml-2 text-panel-muted">海平面 {T_SL} N，随密度按 σ^1.2 衰减</span>
        </p>
        <p>
          <span className="text-panel-muted">阻力</span> D = q·S·(CD₀ + C_L²/(πAe)) ={' '}
          <span className="text-panel-accent">{current.d.toFixed(1)}</span> N
          <span className="ml-2 text-panel-muted">
            C_L = {current.cl.toFixed(2)}，C_D = {current.cd.toFixed(4)}
          </span>
        </p>
        <p>
          <span className="text-panel-muted">爬升率</span> R_c = (T − D)·V/W ={' '}
          <span className={canClimb ? 'text-panel-accent' : 'text-panel-bad'}>
            {current.climb.toFixed(1)}
          </span>{' '}
          m/s
          <span className="ml-2 text-panel-muted">
            {canClimb
              ? `爬升 1000 m 约需 ${(1000 / current.climb / 60).toFixed(1)} 分钟`
              : '当前状态无法爬升'}
          </span>
        </p>
        <p>
          <span className="text-panel-muted">失速速度</span> Vs = √(2W/ρSC_Lmax) ={' '}
          <span className="text-panel-warn">{current.vs.toFixed(1)}</span> m/s
          <span className="ml-2 text-panel-muted">
            Vx ≈ √3·Vs = {current.vx.toFixed(1)} m/s；当前 V = {v.toFixed(0)} m/s
            {v < current.vs ? '（低于失速速度！）' : ''}
          </span>
        </p>
        <p>
          <span className="text-panel-muted">下滑角</span> γ = arctan(D/L) ≈{' '}
          <span className="text-panel-accent">{current.glide.toFixed(1)}</span>°
          <span className="ml-2 text-panel-muted">
            升阻比越大 → 下滑角越小 → 滑得越远（题 193 / 196）
          </span>
        </p>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  tone = 'ok',
}: {
  label: string
  value: string
  tone?: 'ok' | 'bad'
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-panel-muted">{label}</dt>
      <dd className={tone === 'bad' ? 'text-panel-bad' : 'text-panel-text'}>{value}</dd>
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
