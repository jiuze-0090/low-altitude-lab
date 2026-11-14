import { useMemo } from 'react'

/**
 * M1 · 高度表在骗你
 * ---------------------------------------------------------------------------
 * 演示：真实高度 / 气压高度 / 密度高度三条线的分离，以及气压-高度曲线上的
 *      「表读数点」与「真实点」错位。
 *
 * 可调参数：真实高度 H、当地海平面气压、表设定气压 Q_set、温度偏差 ΔT。
 *
 * 模型：国际标准大气 ISA（已与题库结论逐条对拍）
 *   p_ISA(h) = p0 · (1 − L·h/T0)^(g/R/L)
 *   p_real(H) = p_field · ((T0 − L·H + ΔT)/(T0 + ΔT))^(g/R/L)
 *   h_p = (T0/L)·[1 − (p_real/Q_set)^(1/(g/R/L))]
 *   密度高度 DA 满足 ρ_ISA(DA) = ρ_real
 *
 * 教学要点（对应题库考点）：
 *   · 冷空气 → 表指示偏高（500）；暖空气 → 表指示偏低
 *   · 保持气压高度飞向低压区 → 真实高度逐渐降低（499）
 *   · 密度与气压成正比、与气温成反比（497）
 *   · 气温高于标准 → 载重减小（495）；气压降低 → 起降距离增加、爬升率减小（496）
 *   · 实际密度大于标准 → 空气作用力与推力都增大（498）
 */

const T0 = 288.15 // K，标准大气海平面气温
const P0 = 1013.25 // hPa
const L = 0.0065 // K/m
const G = 9.80665
const R = 287.05
const K_EXP = G / (R * L) // 5.2559

const isaPressure = (h: number) => P0 * Math.pow(1 - (L * h) / T0, K_EXP)
const isaTemp = (h: number) => T0 - L * h
const isaDensity = (h: number) =>
  (P0 * 100) / (R * T0) * Math.pow(1 - (L * h) / T0, K_EXP - 1)

export default function M1AltitudeLie({ values }: { values: Record<string, number> }) {
  const realAlt = values.realAlt ?? 1000
  const fieldPressure = values.fieldPressure ?? 1013
  const qnh = values.qnh ?? 1013
  const tempDev = values.tempDev ?? 0

  const model = useMemo(() => {
    const tGround = T0 + tempDev
    const tHere = T0 - L * realAlt + tempDev
    const pMeasured = fieldPressure * Math.pow(tHere / tGround, K_EXP)

    const hIndicated = (T0 / L) * (1 - Math.pow(pMeasured / qnh, 1 / K_EXP))

    const rhoReal = (pMeasured * 100) / (R * tHere)
    const rhoIsa = isaDensity(realAlt)
    const sigma = rhoReal / rhoIsa

    // 密度高度：ρ_ISA(DA) = ρ_real（ρ 随高度递减 → 二分时比较方向相反）
    let lo = -2000
    let hi = 20000
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2
      if (isaDensity(mid) > rhoReal) lo = mid
      else hi = mid
    }
    const densityAlt = (lo + hi) / 2

    return {
      pMeasured,
      hIndicated,
      rhoReal,
      rhoIsa,
      sigma,
      densityAlt,
      tas: 20 / Math.sqrt(sigma),
      error: hIndicated - realAlt,
    }
  }, [realAlt, fieldPressure, qnh, tempDev])

  const error = model.error

  // ── 坐标 ────────────────────────────────────────────────────────────
  const H_MIN = -1500
  const H_MAX = 8000
  const yOf = (h: number) => 196 - ((h - H_MIN) / (H_MAX - H_MIN)) * 170

  const P_MIN = 450
  const P_MAX = 1070
  const xOf = (p: number) => 190 + ((p - P_MIN) / (P_MAX - P_MIN)) * 154

  const clampH = (h: number) => Math.max(H_MIN, Math.min(H_MAX, h))

  // 标准大气曲线（h: 0 → 6000）
  const isaCurve = useMemo(() => {
    const pts: string[] = []
    for (let h = 0; h <= 6000; h += 100) {
      const p = isaPressure(h)
      pts.push(`${xOf(p).toFixed(1)},${yOf(h).toFixed(1)}`)
    }
    return `M ${pts.join(' L ')}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 真实大气曲线（当前当地气压与温度偏差）
  const realCurve = useMemo(() => {
    const tGround = T0 + tempDev
    const pts: string[] = []
    for (let h = 0; h <= 6000; h += 100) {
      const p = fieldPressure * Math.pow((T0 - L * h + tempDev) / tGround, K_EXP)
      pts.push(`${xOf(p).toFixed(1)},${yOf(h).toFixed(1)}`)
    }
    return `M ${pts.join(' L ')}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldPressure, tempDev])

  // 两个标记点
  const realPoint = { x: xOf(model.pMeasured), y: yOf(realAlt) }
  const indPoint = { x: xOf(isaPressure(model.hIndicated)), y: yOf(model.hIndicated) }

  const coldSide = tempDev < 0

  return (
    <div className="flex flex-col gap-4">
      {/* 仪表读数 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Readout label="真实高度 H" value={realAlt.toFixed(0)} unit="m" tone="info" />
        <Readout
          label="气压高度指示"
          value={model.hIndicated.toFixed(0)}
          unit="m"
          tone={Math.abs(error) < 5 ? 'ok' : error > 0 ? 'bad' : 'warn'}
        />
        <Readout
          label="指示偏差"
          value={`${error >= 0 ? '+' : ''}${error.toFixed(0)}`}
          unit="m"
          tone={Math.abs(error) < 5 ? 'ok' : error > 0 ? 'bad' : 'warn'}
        />
        <Readout label="密度高度" value={model.densityAlt.toFixed(0)} unit="m" tone="info" />
        <Readout
          label="密度比 σ"
          value={model.sigma.toFixed(3)}
          tone={model.sigma < 0.99 ? 'warn' : model.sigma > 1.01 ? 'ok' : 'ok'}
        />
        <Readout label="20 m/s 指示→真空速" value={model.tas.toFixed(2)} unit="m/s" tone="info" />
      </div>

      {/* 结论提示 */}
      {Math.abs(error) >= 5 && (
        <div
          role="alert"
          className={`rounded-md border px-4 py-3 text-sm ${
            error > 0
              ? 'border-panel-bad bg-panel-raised text-panel-text'
              : 'border-panel-warn bg-panel-raised text-panel-text'
          }`}
        >
          <strong className={error > 0 ? 'text-panel-bad' : 'text-panel-warn'}>
            {error > 0
              ? `表比你高 ${error.toFixed(0)} m —— 你以为还高，实际比想的低`
              : `表比你低 ${Math.abs(error).toFixed(0)} m —— 你以为还低，实际比想的高`}
          </strong>
          <span className="ml-2">
            {coldSide
              ? '冷空气：空气密度大，同一实际高度上气压低于标准，表把偏低气压判读成更高高度。'
              : tempDev > 0
                ? '暖空气：空气密度小，同一实际高度上气压高于标准，表把偏高气压判读成更低高度——这个方向更危险。'
                : '温度无偏差时偏差来自气压设置：设定气压与当地气压不一致造成的。'}
          </span>
        </div>
      )}

      <div className="rounded-md border border-panel-line bg-panel-raised p-3">
        <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
          三个高度 · 气压-高度曲线
        </p>
        <svg
          viewBox="0 0 360 220"
          className="w-full"
          role="img"
          aria-label={`真实高度 ${realAlt} 米，气压高度指示 ${model.hIndicated.toFixed(0)} 米，密度高度 ${model.densityAlt.toFixed(0)} 米，密度比 ${model.sigma.toFixed(3)}。`}
        >
          {/* 高度刻度 */}
          {[0, 2000, 4000, 6000].map((h) => (
            <g key={`tk${h}`}>
              <line x1="24" y1={yOf(h)} x2="160" y2={yOf(h)} stroke="#24374f" strokeWidth="0.8" />
              <text x="22" y={yOf(h) + 3.5} textAnchor="end" fontSize="8" fill="#a8bcd6" fontFamily="monospace">
                {h}
              </text>
            </g>
          ))}
          <text x="22" y="196" textAnchor="end" fontSize="7.5" fill="#8ba8ff" fontFamily="monospace">
            m
          </text>

          {/* 地面 */}
          <line x1="24" y1={yOf(0)} x2="160" y2={yOf(0)} stroke="#5f7fb5" strokeWidth="1.4" />
          <text x="26" y={yOf(0) - 4} fontSize="8" fill="#a8bcd6" fontFamily="monospace">
            地面
          </text>

          {/* 三条高度线 */}
          <HeightLine y={yOf(clampH(realAlt))} color="#ff9b6b" label={`真实 ${realAlt.toFixed(0)}`} clipped={false} />
          <HeightLine
            y={yOf(clampH(model.hIndicated))}
            color="#8fd0ff"
            label={`气压 ${model.hIndicated.toFixed(0)}`}
            clipped={model.hIndicated < H_MIN || model.hIndicated > H_MAX}
          />
          <HeightLine
            y={yOf(clampH(model.densityAlt))}
            color="#7fe0b0"
            label={`密度 ${model.densityAlt.toFixed(0)}`}
            clipped={model.densityAlt < H_MIN || model.densityAlt > H_MAX}
          />

          {/* 分隔 */}
          <line x1="172" y1="18" x2="172" y2="202" stroke="#24374f" strokeWidth="1" />

          {/* 右半：气压-高度曲线 */}
          {/* 标准大气 */}
          <path d={isaCurve} fill="none" stroke="#5f7fb5" strokeWidth="1.6" strokeDasharray="5 3" />
          <text x="196" y="30" fontSize="8" fill="#8ba8ff" fontFamily="monospace">
            标准大气
          </text>

          {/* 真实大气 */}
          <path d={realCurve} fill="none" stroke="#ff9b6b" strokeWidth="2" />
          <text x="196" y="44" fontSize="8" fill="#ff9b6b" fontFamily="monospace">
            真实大气
          </text>

          {/* 设定气压竖线 */}
          <line
            x1={xOf(qnh)}
            y1={yOf(0)}
            x2={xOf(qnh)}
            y2={yOf(H_MAX)}
            stroke="#8fd0ff"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.65"
          />

          {/* 表读数点与真实点的错位连线 */}
          <line
            x1={indPoint.x}
            y1={indPoint.y}
            x2={realPoint.x}
            y2={realPoint.y}
            stroke={error >= 0 ? '#ff8b82' : '#ffc46b'}
            strokeWidth="1.6"
            strokeDasharray="4 3"
          />

          {/* 表读数点（标准曲线上） */}
          <circle cx={indPoint.x} cy={indPoint.y} r="4.5" fill="#8fd0ff" stroke="#0e1b2d" strokeWidth="1.2" />

          {/* 真实点（真实曲线上） */}
          <circle cx={realPoint.x} cy={realPoint.y} r="4.5" fill="#ff9b6b" stroke="#0e1b2d" strokeWidth="1.2" />

          {/* 错位标注 */}
          <text
            x={(indPoint.x + realPoint.x) / 2 + 6}
            y={(indPoint.y + realPoint.y) / 2 - 4}
            fontSize="8.5"
            fill={error >= 0 ? '#ff8b82' : '#ffc46b'}
            fontFamily="monospace"
            fontWeight="bold"
          >
            {error >= 0 ? '+' : ''}
            {error.toFixed(0)} m
          </text>

          {/* 图例 */}
          <text x="196" y="210" fontSize="7.5" fill="#a8bcd6" fontFamily="monospace">
            蓝点=表认为的高度 · 橙点=你的实际位置
          </text>
        </svg>
        <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
          右图是同一根高度轴上的气压-高度曲线。蓝点落在标准大气曲线上（表的世界），
          橙点落在真实大气曲线上（你的世界）。<span className="text-panel-bad">两点错开多少，就是表在骗你多少。</span>
        </p>
      </div>

      {/* 公式条 */}
      <div className="flex flex-col gap-1.5 rounded-md bg-panel-raised px-4 py-3 font-mono text-xs text-panel-text">
        <p>
          <span className="text-panel-muted">实测静压</span> p = p<sub>地面</sub>·((T₀−L·H+ΔT)/(T₀+ΔT))^5.2559 ={' '}
          <span className="text-panel-accent">{model.pMeasured.toFixed(1)}</span> hPa
          <span className="ml-2 text-panel-muted">
            标准大气同高度 {isaPressure(realAlt).toFixed(1)} hPa
          </span>
        </p>
        <p>
          <span className="text-panel-muted">气压高度</span> h<sub>p</sub> = (T₀/L)[1 − (p/Q<sub>set</sub>)^(1/5.2559)] ={' '}
          <span className="text-panel-accent">{model.hIndicated.toFixed(1)}</span> m
          <span className="ml-2 text-panel-muted">
            偏差 {error >= 0 ? '+' : ''}
            {error.toFixed(1)} m
          </span>
        </p>
        <p>
          <span className="text-panel-muted">当地气温</span> T = T₀ − L·H + ΔT ={' '}
          <span className="text-panel-accent">{(isaTemp(realAlt) + tempDev - 273.15).toFixed(1)}</span> ℃
          <span className="ml-2 text-panel-muted">
            标准大气同高度 {(isaTemp(realAlt) - 273.15).toFixed(1)} ℃
          </span>
        </p>
        <p>
          <span className="text-panel-muted">空气密度</span> ρ = p/(R·T) ={' '}
          <span className="text-panel-accent">{model.rhoReal.toFixed(4)}</span> kg/m³
          <span className="ml-2 text-panel-muted">
            标准 {model.rhoIsa.toFixed(4)}，σ = {model.sigma.toFixed(4)}
          </span>
        </p>
        <p>
          <span className="text-panel-muted">密度高度</span> DA ={' '}
          <span className="text-panel-accent">{model.densityAlt.toFixed(0)}</span> m
          <span className="ml-2 text-panel-muted">
            σ&lt;1 → 载重减小、爬升率下降（题 495/496）
          </span>
        </p>
      </div>
    </div>
  )
}

function HeightLine({
  y,
  color,
  label,
  clipped,
}: {
  y: number
  color: string
  label: string
  clipped: boolean
}) {
  return (
    <>
      <line x1="24" y1={y} x2="160" y2={y} stroke={color} strokeWidth="2.2" />
      <text
        x="162"
        y={y + 3.5}
        fontSize="8.5"
        fill={color}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {clipped ? '⇕ ' : ''}
        {label}
      </text>
    </>
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
