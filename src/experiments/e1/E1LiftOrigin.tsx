import { useMemo } from 'react'

/**
 * E1 · 升力从哪来
 * ---------------------------------------------------------------------------
 * 演示：翼型上下表面流速不同 → 压强差 → 升力。
 * 可调参数：迎角 α、相对风速 V。
 *
 * 教学要点（对应题库考点）：
 *   · 伯努利方程是"同一流线上"的能量守恒，不是"上表面快所以下面被吸"这么粗糙
 *   · 真正产生升力的是压力分布的积分，升力方向垂直于相对气流（不是垂直于弦线）
 *   · 迎角增大 → 上下表面流速差增大 → 压强差增大 → 升力增大（有上限）
 */

const RHO = 1.225 // kg/m³ 海平面标准大气

export default function E1LiftOrigin({ values }: { values: Record<string, number> }) {
  const alpha = values.alpha ?? 4
  const v = values.speed ?? 20

  // 简化的翼型速度模型：
  // 上表面增速幅度随迎角上升但受"回流"限制（迎角过大 → 流动分离 → 升力反而下降）
  const separationStall = 14 // 临界迎角（度）
  const stallFactor =
    alpha > separationStall
      ? Math.max(0, 1 - (alpha - separationStall) / 9) // 超过临界后急剧衰减
      : 1

  const cl = (0.08 + 0.11 * alpha) * stallFactor // 升力系数
  const q = 0.5 * RHO * v * v // 动压
  const area = 0.25 // 有效翼面积 m²（示意）
  const lift = cl * q * area // 升力 N

  // 上下表面流速（示意，比例夸张以便观察）
  const vUpper = v * (1 + 0.045 * alpha * stallFactor)
  const vLower = v * (1 - 0.028 * alpha)

  // 上下表面压强（伯努利：p + ½ρv² = const）
  const pUpper = 101325 - 0.5 * RHO * (vUpper * vUpper - v * v)
  const pLower = 101325 - 0.5 * RHO * (vLower * vLower - v * v)
  const dp = pLower - pUpper

  // 几何
  const chord = 260

  // 流线（示意：上下表面弯曲程度随迎角变化）
  const curves = useMemo(() => {
    const bend = alpha * 2.4
    const upper = `M 20 ${120 - bend * 0.5} Q ${chord * 0.3} ${48 - bend * 0.9} ${chord * 0.62} ${
      74 - bend * 0.55
    } Q ${chord * 0.85} ${88 - bend * 0.3} ${chord + 40} 96`
    const lower = `M 20 ${136 + bend * 0.4} Q ${chord * 0.35} ${154 + bend * 0.7} ${chord * 0.68} ${
      140 + bend * 0.5
    } Q ${chord * 0.88} ${130 + bend * 0.25} ${chord + 40} 118`
    return { upper, lower }
  }, [alpha, chord])

  const stalled = alpha > separationStall

  return (
    <div className="flex flex-col gap-4">
      {/* 仪表读数 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Readout label="迎角 α" value={alpha.toFixed(0)} unit="°" tone={stalled ? 'bad' : 'ok'} />
        <Readout label="相对风速 V" value={v.toFixed(0)} unit="m/s" />
        <Readout label="上表面流速" value={vUpper.toFixed(1)} unit="m/s" tone="info" />
        <Readout label="压强差 Δp" value={dp.toFixed(0)} unit="Pa" tone={dp > 0 ? 'ok' : 'bad'} />
      </div>

      {/* 主图 */}
      <svg
        viewBox="0 0 420 220"
        className="w-full"
        role="img"
        aria-label={`翼型在迎角 ${alpha} 度、相对风速 ${v} 米每秒条件下的流场示意，压强差 ${dp.toFixed(
          0,
        )} 帕`}
      >
        <defs>
          <linearGradient id="e1-upper" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4a90d9" />
            <stop offset="100%" stopColor="#0b3d91" />
          </linearGradient>
          <linearGradient id="e1-lower" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff9a6e" />
            <stop offset="100%" stopColor="#ff6b35" />
          </linearGradient>
          <marker id="e1-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 z" fill="#8ba8ff" />
          </marker>
          <marker
            id="e1-arrow-accent"
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,0 L7,3.5 L0,7 z" fill="#ff6b35" />
          </marker>
        </defs>

        {/* 背景网格（仪表盘质感） */}
        <g opacity="0.16">
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 26} x2="420" y2={i * 26} stroke="#8ba8ff" strokeWidth="0.6" />
          ))}
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`v${i}`} x1={i * 26} y1="0" x2={i * 26} y2="220" stroke="#8ba8ff" strokeWidth="0.6" />
          ))}
        </g>

        {/* 来流箭头 */}
        <g opacity="0.9">
          {[38, 66, 94].map((y) => (
            <line
              key={y}
              x1="4"
              y1={y}
              x2="42"
              y2={y}
              stroke="#8ba8ff"
              strokeWidth="1.6"
              markerEnd="url(#e1-arrow)"
            />
          ))}
          <text x="6" y="28" fill="#8ba8ff" fontSize="10" fontFamily="monospace">
            V = {v.toFixed(0)} m/s
          </text>
        </g>

        {/* 翼型 */}
        <g transform={`rotate(${-alpha} 130 108)`}>
          {/* 上下表面流线 */}
          <path
            d={curves.upper}
            fill="none"
            stroke="url(#e1-upper)"
            strokeWidth="2.2"
            strokeDasharray="6 4"
            className="animate-draw-line"
            style={{ ['--dash-len' as string]: '420' }}
          />
          <path
            d={curves.lower}
            fill="none"
            stroke="url(#e1-lower)"
            strokeWidth="2.2"
            strokeDasharray="6 4"
            className="animate-draw-line"
            style={{ ['--dash-len' as string]: '420' }}
          />

          {/* 翼型本体 */}
          <path
            d="M 62 128 Q 130 78 214 116 Q 150 152 62 128 Z"
            fill="#1d2f4d"
            stroke="#5f7fb5"
            strokeWidth="1.4"
          />
          {/* 弦线 */}
          <line x1="52" y1="128" x2="230" y2="128" stroke="#8ba8ff" strokeWidth="0.9" strokeDasharray="4 3" />
        </g>

        {/* 升力矢量 */}
        <g transform="translate(132,108)">
          <line
            x1="0"
            y1="26"
            x2="0"
            y2={26 - Math.max(14, lift * 1.6)}
            stroke="#ff6b35"
            strokeWidth="2.6"
            markerEnd="url(#e1-arrow-accent)"
          />
          <text
            x="8"
            y={18 - Math.max(14, lift * 1.6)}
            fill="#ff9a6e"
            fontSize="11"
            fontFamily="monospace"
          >
            L = {lift.toFixed(0)} N
          </text>
        </g>

        {/* 相对气流方向（垂直于弦线） */}
        <g transform={`rotate(${alpha} 132 108)`}>
          <line
            x1="132"
            y1="112"
            x2="132"
            y2="66"
            stroke="#4a90d9"
            strokeWidth="1.6"
            strokeDasharray="3 3"
            markerEnd="url(#e1-arrow)"
          />
        </g>

        {/* 失速提示 */}
        {stalled && (
          <g>
            <rect x="272" y="18" width="132" height="30" rx="6" fill="#3b1414" stroke="#c0342b" />
            <text x="284" y="37" fill="#ff8b82" fontSize="12" fontWeight="bold">
              流动分离 · 升力下降
            </text>
          </g>
        )}
      </svg>

      {/* 公式条 */}
      <div className="flex flex-col gap-1.5 rounded-md bg-[#16253c] px-4 py-3 font-mono text-xs text-panel-text">
        <p>
          <span className="text-ink-muted">动压</span> q = ½ρV² ={' '}
          <span className="text-[#8fd0ff]">{(0.5 * RHO * v * v).toFixed(0)}</span> Pa
        </p>
        <p>
          <span className="text-ink-muted">升力</span> L = C<sub>L</sub>·q·S ={' '}
          <span className="text-[#8fd0ff]">{lift.toFixed(0)}</span> N
          <span className="ml-2 text-ink-muted">C<sub>L</sub> = {cl.toFixed(3)}</span>
        </p>
        <p>
          <span className="text-ink-muted">伯努利</span> p + ½ρv² = const ⇒ 上表面 v↑ → p↓
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
  tone?: 'ok' | 'bad' | 'info'
}) {
  const color =
    tone === 'bad'
      ? 'text-[#ff8b82]'
      : tone === 'info'
        ? 'text-[#8fd0ff]'
        : 'text-[#7fe0b0]'

  return (
    <div className="rounded-md border border-panel-line bg-[#16253c] px-3 py-2">
      <p className="text-2xs uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={`tnum mt-0.5 text-lg font-bold leading-none ${color}`}>
        {value}
        {unit && <span className="ml-1 text-2xs font-normal text-ink-muted">{unit}</span>}
      </p>
    </div>
  )
}
