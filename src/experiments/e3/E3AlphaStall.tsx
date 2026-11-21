import { useMemo } from 'react'

import { useNodeSignal } from '@/components/experiment/NodeFeed'

/**
 * E3 · 迎角与失速
 * ---------------------------------------------------------------------------
 * 演示：C_L 曲线在临界迎角后骤降 + 上表面气流分离的流场变化。
 * 可调参数：迎角 α、空速 V、前缘结冰（0/1）。
 *
 * 教学要点（对应题库考点）：
 *   · 迎角 = 翼弦与相对气流夹角（270）
 *   · 超临界后 C_L 骤降、C_D 骤增（268/332）
 *   · 物理原因是上表面附面层大面积分离（392）
 *   · 前缘结冰让临界迎角提前、C_L 变小（370）
 *
 * 节点通道：把三个物理结论作为信号上报，
 * 跨过阈值时由内容层的 nodes[] 给出教员提示（见 e3-alpha-stall.ts）。
 */

const RHO = 1.225
const AREA = 0.25
const CL_SLOPE = 0.088

/** 干净翼型 */
function clClean(alpha: number): number {
  const a = Math.max(-6, Math.min(24, alpha))
  if (a <= 16) return 0.06 + a * CL_SLOPE
  return Math.max(0.42, 1.5 - (a - 16) * 0.3)
}

/**
 * 结冰翼型：前缘结冰使翼型变粗钝
 *   · 同一迎角下 C_L 更小（题 370）
 *   · 临界迎角提前到 11°
 */
function clIced(alpha: number): number {
  const a = Math.max(-6, Math.min(24, alpha))
  const crit = 11
  if (a <= crit) return 0.06 + a * 0.088 - a * 0.012
  return Math.max(0.38, 1.05 - (a - crit) * 0.22)
}

/** 阻力系数：失速后附加分离阻力 */
function cdOf(cl: number, alpha: number, crit: number): number {
  const base = 0.028 + (cl * cl) / (Math.PI * 7 * 0.85)
  if (alpha <= crit) return base
  return base + 0.06 + (alpha - crit) * 0.012
}

export default function E3AlphaStall({ values }: { values: Record<string, number> }) {
  const alpha = values.alpha ?? 4
  const v = values.speed ?? 18
  const iced = (values.ice ?? 0) >= 1

  const critAlpha = iced ? 11 : 16
  const stalled = alpha > critAlpha

  const cl = iced ? clIced(alpha) : clClean(alpha)
  const cd = iced ? cdOf(cl, alpha, critAlpha) + 0.015 : cdOf(cl, alpha, critAlpha)

  const q = 0.5 * RHO * v * v
  const lift = cl * q * AREA
  const drag = cd * q * AREA

  // 失速速度（由最大升力系数决定）
  const clMax = iced ? 1.05 : 1.5
  const weight = 1.5 * 9.81 // 示意重量 1.5 kg
  const vs = Math.sqrt((2 * weight) / (RHO * AREA * clMax))

  /* ── 节点通道：上报三个物理状态 ──────────────────────────────────── */
  useNodeSignal('stall', stalled)
  useNodeSignal('iced', iced)
  useNodeSignal('slow', v < vs)

  // ── C_L 曲线 ────────────────────────────────────────────────────────
  const CX = 46
  const CY = 168
  const CW = 236
  const CH = 132
  const ALPHA_MIN = -4
  const ALPHA_MAX = 24
  const CL_AX_MAX = 1.7

  const toX = (a: number) => CX + ((a - ALPHA_MIN) / (ALPHA_MAX - ALPHA_MIN)) * CW
  const toY = (c: number) => CY - (c / CL_AX_MAX) * CH

  const curve = useMemo(() => {
    const f = iced ? clIced : clClean
    const pts: string[] = []
    for (let a = ALPHA_MIN; a <= ALPHA_MAX; a += 0.2) {
      pts.push(`${pts.length === 0 ? 'M' : 'L'} ${toX(a).toFixed(1)} ${toY(f(a)).toFixed(1)}`)
    }
    return pts.join(' ')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iced])

  // 干净翼型参考曲线（对比用）
  const cleanCurve = useMemo(() => {
    const pts: string[] = []
    for (let a = ALPHA_MIN; a <= ALPHA_MAX; a += 0.2) {
      pts.push(`${pts.length === 0 ? 'M' : 'L'} ${toX(a).toFixed(1)} ${toY(clClean(a)).toFixed(1)}`)
    }
    return pts.join(' ')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const curX = toX(alpha)
  const curY = toY(cl)

  // ── 流场示意：迎角越大，上表面流线分离越明显 ──────────────────────────
  const bend = alpha * 2.2
  const separation = Math.max(0, Math.min(1, (alpha - (critAlpha - 3)) / 6))
  const upperPath = `M 20 ${118 - bend * 0.45} Q ${78} ${44 - bend * 0.85} ${162} ${
    70 - bend * 0.5
  } Q ${218} ${86 - bend * 0.25} ${300} 94`
  const lowerPath = `M 20 ${136 + bend * 0.35} Q ${86} ${154 + bend * 0.6} ${170} ${
    140 + bend * 0.45
  } Q ${232} ${130 + bend * 0.2} ${300} 116`

  return (
    <div className="flex flex-col gap-4">
      {/* 仪表读数 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Readout
          label="迎角 α"
          value={alpha.toFixed(1)}
          unit="°"
          tone={stalled ? 'bad' : 'ok'}
        />
        <Readout label="升力系数 C_L" value={cl.toFixed(3)} tone={stalled ? 'bad' : 'ok'} />
        <Readout
          label="阻力系数 C_D"
          value={cd.toFixed(3)}
          tone={stalled ? 'warn' : 'info'}
        />
        <Readout
          label="临界迎角"
          value={critAlpha.toFixed(0)}
          unit="°"
          tone={stalled ? 'bad' : 'ok'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* ── C_L 曲线 ──────────────────────────────────────────── */}
        <div className="rounded-md border border-panel-line bg-panel-raised p-3">
          <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
            升力系数曲线 C_L − α
          </p>
          <svg
            viewBox="0 0 300 200"
            className="w-full"
            role="img"
            aria-label={`升力系数随迎角变化曲线。当前迎角 ${alpha.toFixed(1)} 度，升力系数 ${cl.toFixed(
              3,
            )}，${stalled ? '已超过临界迎角，流动分离' : '未失速'}。`}
          >
            <g opacity="0.22">
              {Array.from({ length: 5 }, (_, i) => (
                <line
                  key={`gy${i}`}
                  x1={CX}
                  y1={CY - (i * CH) / 4}
                  x2={CX + CW}
                  y2={CY - (i * CH) / 4}
                  stroke="#8ba8ff"
                  strokeWidth="0.5"
                />
              ))}
              {Array.from({ length: 8 }, (_, i) => (
                <line
                  key={`gx${i}`}
                  x1={CX + (i * CW) / 7}
                  y1={CY}
                  x2={CX + (i * CW) / 7}
                  y2={CY - CH}
                  stroke="#8ba8ff"
                  strokeWidth="0.5"
                />
              ))}
            </g>

            {/* 坐标轴 */}
            <line x1={CX} y1={CY} x2={CX + CW} y2={CY} stroke="#5f7fb5" strokeWidth="1.2" />
            <line x1={CX} y1={CY} x2={CX} y2={CY - CH} stroke="#5f7fb5" strokeWidth="1.2" />
            <text x={CX + CW} y={CY + 15} textAnchor="end" fontSize="9" fill="#a8bcd6" fontFamily="monospace">
              α →
            </text>
            <text x={CX - 4} y={CY - CH + 3} textAnchor="end" fontSize="9" fill="#a8bcd6" fontFamily="monospace">
              C_L
            </text>

            {/* 迎角刻度 */}
            {[0, 4, 8, 12, 16, 20].map((a) => (
              <text
                key={a}
                x={toX(a)}
                y={CY + 13}
                textAnchor="middle"
                fontSize="8"
                fill="#8fa8c9"
                fontFamily="monospace"
              >
                {a}°
              </text>
            ))}

            {/* 干净翼型参考曲线 */}
            <path
              d={cleanCurve}
              fill="none"
              stroke="#5f7fb5"
              strokeWidth="1.4"
              strokeDasharray="4 3"
              opacity="0.75"
            />

            {/* 临界迎角竖线 */}
            <line
              x1={toX(critAlpha)}
              y1={CY - CH}
              x2={toX(critAlpha)}
              y2={CY}
              stroke="#ffc46b"
              strokeWidth="1.4"
              strokeDasharray="3 3"
            />
            <text
              x={toX(critAlpha)}
              y={CY - CH - 4}
              textAnchor="middle"
              fontSize="8.5"
              fill="#ffc46b"
              fontFamily="monospace"
            >
              临界 {critAlpha}°
            </text>

            {/* 当前曲线 */}
            <path
              d={curve}
              fill="none"
              stroke={iced ? '#ff8b82' : '#4a90d9'}
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* 当前点 */}
            <line x1={curX} y1={CY} x2={curX} y2={curY} stroke="#ff6b35" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx={curX} cy={curY} r="5" fill="#ff6b35" stroke="#ffffff" strokeWidth="1.4" />
            <text
              x={curX + 8}
              y={curY - 6}
              fontSize="9"
              fill="#ff9a6e"
              fontFamily="monospace"
            >
              C_L {cl.toFixed(2)}
            </text>
          </svg>
          <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
            {iced ? (
              <>
                <span className="text-panel-bad">红线 = 结冰翼型</span>：
                峰值更低，且临界迎角提前到 {critAlpha}°。虚线（灰蓝）是干净翼型作对比。
              </>
            ) : (
              <>
                灰蓝虚线是干净翼型参考。曲线在 <span className="text-panel-warn">16°</span> 后
                <span className="text-panel-bad">掉头向下</span>——这就是失速。
              </>
            )}
          </p>
        </div>

        {/* ── 流场示意 ─────────────────────────────────────────── */}
        <div className="rounded-md border border-panel-line bg-panel-raised p-3">
          <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
            上表面气流分离
          </p>
          <svg
            viewBox="0 0 320 200"
            className="w-full"
            role="img"
            aria-label={`迎角 ${alpha.toFixed(1)} 度时的机翼绕流示意${
              stalled ? '，上表面出现明显分离涡' : ''
            }`}
          >
            <g opacity="0.16">
              {Array.from({ length: 8 }, (_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 26} x2="320" y2={i * 26} stroke="#8ba8ff" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 13 }, (_, i) => (
                <line key={`v${i}`} x1={i * 26} y1="0" x2={i * 26} y2="200" stroke="#8ba8ff" strokeWidth="0.5" />
              ))}
            </g>

            {/* 来流 */}
            <g opacity="0.85">
              {[70, 100, 130].map((y) => (
                <line
                  key={y}
                  x1="6"
                  y1={y}
                  x2="42"
                  y2={y}
                  stroke="#8ba8ff"
                  strokeWidth="1.5"
                  markerEnd="url(#e3-arrow)"
                />
              ))}
            </g>
            <defs>
              <marker id="e3-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#8ba8ff" />
              </marker>
              <marker id="e3-arrow-accent" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#ff6b35" />
              </marker>
            </defs>

            <g transform={`rotate(${-alpha} 100 110)`}>
              {/* 上表面流线 */}
              <path
                d={upperPath}
                fill="none"
                stroke={separation > 0.35 ? '#ff8b82' : '#4a90d9'}
                strokeWidth="2.2"
                strokeDasharray="6 4"
              />
              {/* 下表面流线 */}
              <path
                d={lowerPath}
                fill="none"
                stroke="#ff9a6e"
                strokeWidth="2.2"
                strokeDasharray="6 4"
              />

              {/* 翼型本体（结冰时前缘加厚） */}
              <path
                d={
                  iced
                    ? "M 58 130 Q 130 76 218 116 Q 150 154 58 130 Z"
                    : "M 62 128 Q 130 78 214 116 Q 150 152 62 128 Z"
                }
                fill={iced ? '#4a3a3a' : '#1d2f4d'}
                stroke={iced ? '#c0342b' : '#5f7fb5'}
                strokeWidth="1.5"
              />
              {iced && (
                <path
                  d="M 62 128 Q 84 104 116 96 L 120 106 Q 92 114 72 134 Z"
                  fill="#c9e2f5"
                  opacity="0.85"
                />
              )}
              <line x1="50" y1="128" x2="228" y2="128" stroke="#8ba8ff" strokeWidth="0.9" strokeDasharray="4 3" />
            </g>

            {/* 分离涡 */}
            {separation > 0.35 && (
              <g opacity={Math.min(1, (separation - 0.35) * 2.2)}>
                {[0, 1, 2].map((i) => (
                  <path
                    key={i}
                    d={`M ${132 + i * 22} ${74 - bend * 0.3} q 14 -12 6 -24 q -6 -10 6 -16`}
                    fill="none"
                    stroke="#ff8b82"
                    strokeWidth="1.6"
                    opacity={0.9 - i * 0.22}
                  />
                ))}
                <text x="196" y="42" fontSize="10" fontWeight="bold" fill="#ff8b82">
                  气流分离
                </text>
              </g>
            )}

            {/* 升力矢量 */}
            <g transform="translate(112, 108)">
              <line
                x1="0"
                y1="24"
                x2="0"
                y2={24 - Math.max(12, lift * 1.4)}
                stroke={stalled ? '#c0342b' : '#ff6b35'}
                strokeWidth="2.6"
                markerEnd="url(#e3-arrow-accent)"
              />
              <text
                x="8"
                y={16 - Math.max(12, lift * 1.4)}
                fill={stalled ? '#ff8b82' : '#ff9a6e'}
                fontSize="10.5"
                fontFamily="monospace"
              >
                L = {lift.toFixed(1)} N
              </text>
            </g>
          </svg>
          <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
            {stalled ? (
              <span className="text-panel-bad">
                上表面附面层已大面积分离——升力掉下来，阻力涨上去。
              </span>
            ) : (
              '上表面气流仍贴着翼面走，附着流稳定。'
            )}
          </p>
        </div>
      </div>

      {/* 公式条 */}
      <div className="flex flex-col gap-1.5 rounded-md bg-panel-raised px-4 py-3 font-mono text-xs text-panel-text">
        <p>
          <span className="text-panel-muted">升力系数</span> C<sub>L</sub> ≈ 0.06 + 0.088α ={' '}
          <span className="text-panel-accent">{cl.toFixed(3)}</span>
          {stalled && <span className="ml-2 text-panel-bad">（已分离，实际值远低于线性外推）</span>}
        </p>
        <p>
          <span className="text-panel-muted">升力</span> L = C<sub>L</sub>·q·S ={' '}
          <span className="text-panel-accent">{lift.toFixed(1)}</span> N
          <span className="ml-2 text-panel-muted">q = {q.toFixed(0)} Pa</span>
        </p>
        <p>
          <span className="text-panel-muted">阻力</span> D = C<sub>D</sub>·q·S ={' '}
          <span className={stalled ? 'text-panel-bad' : 'text-panel-accent'}>{drag.toFixed(1)}</span> N
          {stalled && <span className="ml-2 text-panel-bad">（失速后阻力骤增）</span>}
        </p>
        <p>
          <span className="text-panel-muted">失速速度</span> V<sub>s</sub> = √(2W/ρSC<sub>Lmax</sub>) ={' '}
          <span className="text-panel-warn">{vs.toFixed(1)}</span> m/s
          <span className="ml-2 text-panel-muted">
            C_Lmax = {clMax.toFixed(2)}
            {iced ? '（结冰后下降）' : ''}
          </span>
        </p>
        <p>
          <span className="text-panel-muted">当前速度</span> V = {v.toFixed(0)} m/s
          <span className="ml-2 text-panel-muted">
            {v < vs ? '低于失速速度 → 慢速失速风险' : '高于失速速度'}
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
