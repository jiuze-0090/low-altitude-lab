import { useMemo, useState } from 'react'

/**
 * E8 · 侧风着陆
 * ---------------------------------------------------------------------------
 * 演示：侧风中修正偏流的两种方法，在同一组参数下各自付出什么代价。
 *
 * 可调参数：侧风分量、进近地速、拉平质量、载重。
 * 枚举：修正方式（不修正 / 侧滑法 / 改变航向法）—— 组件内状态，不进 controls。
 *
 * 模型（定性模型，假设无垂直风分量）：
 *   V_air = √(V_ground² + V_cross²)，偏流角 sinφ = V_cross / V_air
 *   L = W / cosβ（侧滑法，β 为侧滑角）→ 诱导阻力按 L² 涨 → 升阻比下降
 *   γ = arctan(D/L)，γ_touch = γ · k_flat（k_flat 由拉平质量决定）
 *   v_sink = V_ground · sin γ_touch
 *   接地载荷 n = 1 + v_sink² / (g · Δh)
 *   Vs 随坡度增大：Vs_bank = Vs / cosφ（题 213）
 *
 * 教学要点（对应题库考点）：
 *   · 侧滑法：压杆 + 反打舵，升力倾斜，诱导阻力大 → 下降率增大、接地重（860 / 861）
 *   · 改变航向法：机头指向侧风来向，升阻比不减小 → 接地轻（923）
 *   · 未修正偏流：接地前横向漂移 = V_cross × 3（接地点直接偏出跑道）
 *   · 拉平高要停杆或减小拉杆量，拉平低要适当增大拉杆量（849 / 851）
 */

const G = 9.80665
const RHO0 = 1.225
const S_WING = 0.35
const AR = 7
const E_OSWALD = 0.8
const CD0 = 0.035
const CL_MAX = 1.8 // 着陆襟翼放下后的最大升力系数
const CD_SIDE = 1.2 // 侧滑阻力系数：机体迎着侧风时的附加阻力（平板量级）
const DH = 0.3 // 机体与轮胎可压缩缓冲行程 m
const FIX_WINDOW = 3 // 接地前可用于修正偏流的时间 s

type Mode = 'none' | 'sideslip' | 'crab'

const MODES: Array<{ id: Mode; label: string; hint: string }> = [
  { id: 'none', label: '不修正偏流', hint: '带着偏流接地' },
  { id: 'sideslip', label: '侧滑法', hint: '压杆 + 反打舵' },
  { id: 'crab', label: '改变航向法', hint: '机头指向侧风来向' },
]

interface Outcome {
  /** 升力与重力的比（侧滑法 > 1） */
  liftRatio: number
  /** 升阻比 */
  ld: number
  /** 下滑角（相对水平） */
  gamma: number
  /** 接地垂直速度 m/s */
  sink: number
  /** 接地区载荷倍数 */
  load: number
  /** 接地前横向漂移 m */
  drift: number
  /** 距失速速度裕度 m/s */
  margin: number
  /** 失速速度（含坡度修正） */
  vs: number
}

export default function E8SidewindLanding({ values }: { values: Record<string, number> }) {
  const cross = values.crossWind ?? 5
  const vGround = values.approachSpeed ?? 45
  const flatQ = values.flatQuality ?? 70
  const mass = values.mass ?? 12
  const [mode, setMode] = useState<Mode>('sideslip')

  const model = useMemo(() => {
    const W = mass * G
    const vAir = Math.sqrt(vGround * vGround + cross * cross)
    const crab = Math.asin(Math.min(1, Math.abs(cross) / vAir)) // 偏流角 rad
    const q = 0.5 * RHO0 * vAir * vAir

    /** 单一修正方式下的结果 */
    const calc = (m: Mode): Outcome => {
      // 侧滑法与"不修正"都是机头对着跑道 → 相对气流与机身成侧滑角 β（=偏流角）；
      // 改变航向法把机头偏进风里 → 机体不侧滑。
      const slipping = m === 'none' || m === 'sideslip'
      const bank = slipping ? crab : 0
      const L = W / Math.cos(bank) // 升力需倾斜以平衡侧向力
      const cl = L / (q * S_WING)
      const cd = CD0 + (cl * cl) / (Math.PI * AR * E_OSWALD)
      const dAero = q * S_WING * cd
      // 侧滑阻力：机体迎风面积在横向气流上的分量，∝ sin²β —— 这是侧滑法的主项代价
      const dSide = slipping ? q * S_WING * CD_SIDE * Math.sin(bank) * Math.sin(bank) : 0
      const D = dAero + dSide
      const ld = L / D
      const gamma = Math.atan(D / L)

      // 拉平质量：完全没拉平 k=1，拉得漂亮 k≈0.25
      const kFlat = 1 - 0.75 * (flatQ / 100)
      const gammaTouch = gamma * kFlat
      const sink = vGround * Math.sin(gammaTouch)
      const load = 1 + (sink * sink) / (G * DH)

      // 未修正时，偏流一直带到接地
      const drift = m === 'none' ? Math.abs(cross) * FIX_WINDOW : 0

      // 失速速度：坡度增大 → 失速速度增大（题 213）
      const vs = Math.sqrt((2 * W) / (RHO0 * S_WING * CL_MAX)) / Math.cos(bank)
      const margin = vGround - vs

      return {
        liftRatio: L / W,
        ld,
        gamma: (gamma * 180) / Math.PI,
        sink,
        load,
        drift,
        margin,
        vs,
      }
    }

    const outcomes = {
      none: calc('none'),
      sideslip: calc('sideslip'),
      crab: calc('crab'),
    }

    return { W, vAir, crabDeg: (crab * 180) / Math.PI, outcomes, current: outcomes[mode] }
  }, [cross, vGround, flatQ, mass, mode])

  const { W, vAir, crabDeg, outcomes, current } = model

  // ── 俯视图几何 ──────────────────────────────────────────────────────
  const SCALE = 5.2 // m/px
  const CX = 150
  const CY = 50
  const trackLen = 84
  const planeLen = 46
  const driftPx = Math.min(150, current.drift / SCALE)

  // 俯视图里机头相对跑道的偏角
  const noseYaw = mode === 'crab' ? -crabDeg : 0
  const planeRad = (noseYaw * Math.PI) / 180
  const noseX = CX + (planeLen / 2) * Math.cos(planeRad)
  const noseY = CY + (planeLen / 2) * Math.sin(planeRad)
  const tailX = CX - (planeLen / 2) * Math.cos(planeRad)
  const tailY = CY - (planeLen / 2) * Math.sin(planeRad)

  return (
    <div className="flex flex-col gap-4">
      {/* 修正方式切换（枚举不进 controls，组件内状态） */}
      <div className="rounded-md border border-panel-line bg-panel-raised p-3">
        <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-panel-muted">
          偏流修正方式
        </p>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                mode === m.id
                  ? 'border-[#ff6b35] bg-[#ff6b35]/15 text-white'
                  : 'border-panel-line text-panel-muted hover:border-[#ff6b35]/50 hover:text-panel-text'
              }`}
              aria-pressed={mode === m.id}
            >
              <span className="block font-semibold">{m.label}</span>
              <span className="block text-2xs opacity-70">{m.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 读数 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Readout label="偏流角 φ" value={crabDeg.toFixed(1)} unit="°" tone="info" />
        <Readout
          label="接地垂直速度"
          value={current.sink.toFixed(2)}
          unit="m/s"
          tone={current.sink > 1.5 ? 'bad' : current.sink > 1 ? 'warn' : 'ok'}
        />
        <Readout
          label="接地载荷 n"
          value={current.load.toFixed(2)}
          unit="×自重"
          tone={current.load > 2.5 ? 'bad' : current.load > 1.8 ? 'warn' : 'ok'}
        />
        <Readout
          label="距失速裕度"
          value={current.margin.toFixed(1)}
          unit="m/s"
          tone={current.margin < 5 ? 'bad' : current.margin < 10 ? 'warn' : 'ok'}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* ── 俯视图 ───────────────────────────────────────────────── */}
        <div className="rounded-md border border-panel-line bg-panel-raised p-3">
          <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
            最后进近俯视 · 跑道修正
          </p>
          <svg
            viewBox="0 0 300 96"
            className="w-full"
            role="img"
            aria-label={`俯视图：侧风 ${cross} 米每秒，偏流角 ${crabDeg.toFixed(
              1,
            )} 度，当前采用${MODES.find((m) => m.id === mode)?.label}。`}
          >
            {/* 跑道 */}
            <rect x={20} y={CY - 15} width={260} height={30} rx="3" fill="#1b2b4a" stroke="#5f7fb5" strokeWidth="1" />
            {Array.from({ length: 9 }).map((_, i) => (
              <line
                key={i}
                x1={32 + i * 28}
                y1={CY}
                x2={48 + i * 28}
                y2={CY}
                stroke="#8fa8c9"
                strokeWidth="1.4"
                strokeDasharray="6 8"
              />
            ))}
            <text x={276} y={CY + 26} textAnchor="end" fontSize="7" fill="#8fa8c9" fontFamily="monospace">
              跑道中线
            </text>

            {/* 侧风箭头 */}
            <g stroke="#4a90d9" strokeWidth="1.6">
              <line x1={CX - 70} y1={16} x2={CX - 26} y2={16} />
              <path d={`M ${CX - 26} 16 l -7 -3.4 l 0 6.8 Z`} fill="#4a90d9" />
              <line x1={CX - 70} y1={24} x2={CX - 26} y2={24} />
              <path d={`M ${CX - 26} 24 l -7 -3.4 l 0 6.8 Z`} fill="#4a90d9" />
            </g>
            <text x={CX - 72} y={12} fontSize="8" fill="#4a90d9" fontFamily="monospace">
              侧风 {cross} m/s
            </text>

            {/* 航迹 */}
            <line
              x1={CX - trackLen / 2}
              y1={CY}
              x2={CX + trackLen / 2}
              y2={CY}
              stroke="#ff6b35"
              strokeWidth="1.6"
              strokeDasharray="5 3"
            />
            <text x={CX + trackLen / 2 + 4} y={CY + 3} fontSize="7.5" fill="#ff9a6e" fontFamily="monospace">
              航迹
            </text>

            {/* 机头相对航迹的偏角（只有改变航向法把机头偏出去） */}
            {mode === 'crab' && crabDeg > 0.5 && (
              <>
                <path
                  d={`M ${CX + 34} ${CY} A 34 34 0 0 0 ${CX + 34 * Math.cos(planeRad)} ${
                    CY + 34 * Math.sin(planeRad)
                  }`}
                  fill="none"
                  stroke="#ffc46b"
                  strokeWidth="1"
                />
                <text
                  x={CX + 38}
                  y={CY + 11}
                  fontSize="7.5"
                  fill="#ffc46b"
                  fontFamily="monospace"
                >
                  机头偏 {crabDeg.toFixed(0)}°
                </text>
              </>
            )}

            {/* 侧滑法的相对气流偏角 */}
            {mode === 'sideslip' && crabDeg > 0.5 && (
              <text
                x={CX - 40}
                y={CY + 30}
                fontSize="7.5"
                fill="#ff9a6e"
                fontFamily="monospace"
              >
                相对气流偏 {crabDeg.toFixed(0)}°（侧滑 β）
              </text>
            )}

            {/* 飞机 */}
            <g stroke="#e8eefc" strokeWidth="1.6" strokeLinecap="round">
              <line x1={tailX} y1={tailY} x2={noseX} y2={noseY} />
              <line
                x1={CX - 12 * Math.cos(planeRad)}
                y1={CY - 12 * Math.sin(planeRad)}
                x2={CX + 12 * Math.cos(planeRad)}
                y2={CY + 12 * Math.sin(planeRad)}
              />
              <line
                x1={CX - 12 * Math.cos(planeRad) - 6 * Math.sin(planeRad)}
                y1={CY - 12 * Math.sin(planeRad) + 6 * Math.cos(planeRad)}
                x2={CX + 12 * Math.cos(planeRad) - 6 * Math.sin(planeRad)}
                y2={CY + 12 * Math.sin(planeRad) + 6 * Math.cos(planeRad)}
              />
            </g>

            {/* 未修正时的漂移 */}
            {current.drift > 0 && (
              <>
                <line
                  x1={CX + trackLen / 2}
                  y1={CY}
                  x2={CX + trackLen / 2 + driftPx}
                  y2={CY}
                  stroke="#ff8b82"
                  strokeWidth="2"
                />
                <path
                  d={`M ${CX + trackLen / 2 + driftPx} ${CY} l -7 -3.4 l 0 6.8 Z`}
                  fill="#ff8b82"
                />
                <text
                  x={CX + trackLen / 2 + driftPx / 2}
                  y={CY - 8}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#ff8b82"
                  fontFamily="monospace"
                >
                  接地偏出 {current.drift.toFixed(0)} m
                </text>
              </>
            )}

            {/* 接地点 */}
            <circle cx={CX + trackLen / 2} cy={CY} r="4" fill="#ffc46b" stroke="#0b1224" strokeWidth="1" />
            <text
              x={CX + trackLen / 2}
              y={CY + 20}
              textAnchor="middle"
              fontSize="7.5"
              fill="#ffc46b"
              fontFamily="monospace"
            >
              接地点
            </text>
          </svg>

          <p className="mt-2 text-2xs leading-relaxed text-panel-muted">
            {mode === 'none' && (
              <>
                不修正偏流：飞机被风推着往侧风方向漂，接地前 3 秒横向漂移{' '}
                <span className="text-panel-bad">{current.drift.toFixed(0)} m</span>——
                侧风 {cross} m/s 时，偏差比一条跑道还宽。
                同时机头对着跑道、相对气流横向有分量，机体处在侧滑状态，阻力一样要吃。
              </>
            )}
            {mode === 'sideslip' && (
              <>
                侧滑法：机头对着跑道，压杆把偏流压住（接地点回到跑道上）。代价是两笔：
                机体侧滑带来的<span className="text-panel-warn">侧滑阻力</span>，
                以及升力倾斜到{' '}
                <span className="text-panel-warn">{current.liftRatio.toFixed(3)} 倍</span>去平衡侧向力。
                两者叠加 → 升阻比降到{' '}
                <span className="text-panel-warn">{current.ld.toFixed(2)}</span> → 下滑角{' '}
                <span className="text-panel-warn">{current.gamma.toFixed(2)}°</span> → 接地更重。
              </>
            )}
            {mode === 'crab' && (
              <>
                改变航向法：机头偏向侧风来向（偏流角 {crabDeg.toFixed(1)}°），机体不侧滑，
                升力不用倾斜，升阻比保持 <span className="text-panel-ok">{current.ld.toFixed(1)}</span>
                ，接地垂直速度只有 <span className="text-panel-ok">{current.sink.toFixed(2)} m/s</span>。
                代价是机头不正对跑道、且要靠方向舵压住航迹。
              </>
            )}
          </p>
        </div>

        {/* ── 三种方式对比 ───────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-panel-line bg-panel-raised p-3">
            <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-panel-muted">
              同一组参数，三种方式各付出什么
            </p>
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="text-panel-muted">
                  <th className="py-1 text-left font-medium">方式</th>
                  <th className="py-1 text-right font-medium">升阻比</th>
                  <th className="py-1 text-right font-medium">下滑角</th>
                  <th className="py-1 text-right font-medium">v_sink</th>
                  <th className="py-1 text-right font-medium">载荷</th>
                  <th className="py-1 text-right font-medium">偏移</th>
                </tr>
              </thead>
              <tbody>
                {MODES.map((m) => {
                  const o = outcomes[m.id]
                  const active = m.id === mode
                  return (
                    <tr
                      key={m.id}
                      className={`border-t border-panel-line ${active ? 'text-white' : 'text-panel-text'}`}
                    >
                      <td className="py-1">
                        <button
                          type="button"
                          onClick={() => setMode(m.id)}
                          className="text-left hover:underline"
                        >
                          {m.label}
                        </button>
                      </td>
                      <td className="tnum py-1 text-right">{o.ld.toFixed(2)}</td>
                      <td className="tnum py-1 text-right">{o.gamma.toFixed(2)}°</td>
                      <td
                        className={`tnum py-1 text-right ${
                          o.sink > 1.5 ? 'text-panel-bad' : o.sink > 1 ? 'text-panel-warn' : 'text-panel-ok'
                        }`}
                      >
                        {o.sink.toFixed(2)}
                      </td>
                      <td
                        className={`tnum py-1 text-right ${
                          o.load > 2.5 ? 'text-panel-bad' : o.load > 1.8 ? 'text-panel-warn' : 'text-panel-ok'
                        }`}
                      >
                        {o.load.toFixed(2)}
                      </td>
                      <td
                        className={`tnum py-1 text-right ${
                          o.drift > 0 ? 'text-panel-bad' : 'text-panel-ok'
                        }`}
                      >
                        {o.drift.toFixed(0)} m
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="mt-2 text-2xs leading-relaxed text-panel-muted">
              侧滑法与改变航向法的升阻比差在这里（题 923：改变航向法升阻比不减小）。
              侧滑法换来的是接地更重（题 861：下降率增大、目测容易低，要适当加油门）。
            </p>
          </div>

          <div className="rounded-md border border-panel-line bg-panel-raised p-3">
            <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-panel-muted">
              当前状态分解
            </p>
            <dl className="flex flex-col gap-2 font-mono text-xs">
              <Row label="空速 V_air" value={`${vAir.toFixed(1)} m/s`} />
              <Row label="偏流角 φ" value={`${crabDeg.toFixed(1)}°`} />
              <Row label="重量 W" value={`${W.toFixed(0)} N`} />
              <Row
                label="升力 / 重力"
                value={`${current.liftRatio.toFixed(3)}`}
                tone={current.liftRatio > 1.01 ? 'warn' : 'ok'}
              />
              <Row label="升阻比 L/D" value={`${current.ld.toFixed(2)}`} />
              <Row label="下滑角 γ" value={`${current.gamma.toFixed(2)}°`} />
              <Row
                label="接地垂直速度 v_sink"
                value={`${current.sink.toFixed(2)} m/s`}
                tone={current.sink > 1.5 ? 'bad' : 'ok'}
              />
              <Row
                label="接地载荷 n"
                value={`${current.load.toFixed(2)} ×自重`}
                tone={current.load > 2.5 ? 'bad' : 'ok'}
              />
              <Row
                label="失速速度 Vs"
                value={`${current.vs.toFixed(1)} m/s`}
                tone={current.margin < 5 ? 'bad' : 'ok'}
              />
              <Row
                label="距失速裕度"
                value={`${current.margin.toFixed(1)} m/s`}
                tone={current.margin < 5 ? 'bad' : 'ok'}
              />
            </dl>
          </div>
        </div>
      </div>

      {/* 结论条 */}
      <div className="rounded-md border border-panel-line bg-panel-raised px-4 py-3 text-2xs leading-relaxed text-panel-text">
        {current.load > 2.5 ? (
          <>
            <span className="text-panel-bad">接地偏重（n = {current.load.toFixed(2)}）。</span>
            当前方式下侧滑阻力把升阻比压到 <span className="text-panel-bad">{current.ld.toFixed(2)}</span>
            、升力被顶到 {current.liftRatio.toFixed(3)} 倍，垂直速度 {current.sink.toFixed(2)} m/s。
            要么换成改变航向法，要么把拉平质量提上去（现在 {flatQ}%）——
            拉平就是专门用来把这个数字压下来的。
          </>
        ) : current.load > 1.8 ? (
          <>
            <span className="text-panel-warn">接地偏重（n = {current.load.toFixed(2)}）。</span>
            属于可以接受但不轻松的范围。教员那句"拉平要柔和"说的就是这个：
            垂直速度每降 0.5 m/s，载荷就降一截。
          </>
        ) : (
          <>
            <span className="text-panel-ok">接地轻（n = {current.load.toFixed(2)}）。</span>
            垂直速度 {current.sink.toFixed(2)} m/s，机体和轮胎有足够余量吸收。
            注意这只是拉平做得好的时候——把拉平质量拉到 0 试试，同样的参数会变样。
          </>
        )}
        {current.margin < 8 && (
          <span className="text-panel-bad">
            {' '}
            另外距失速速度只有 {current.margin.toFixed(1)} m/s，坡度已经把失速速度顶高了（题 213），
            这时候方向舵的效能也在下降。
          </span>
        )}
      </div>

      {/* 公式条 */}
      <div className="flex flex-col gap-1.5 rounded-md bg-panel-raised px-4 py-3 font-mono text-xs text-panel-text">
        <p>
          <span className="text-panel-muted">偏流角</span> sinφ = V_cross / V_air ={' '}
          <span className="text-panel-accent">{crabDeg.toFixed(1)}°</span>
          <span className="ml-2 text-panel-muted">
            V_air = √({vGround}² + {cross}²) = {vAir.toFixed(1)} m/s
          </span>
        </p>
        <p>
          <span className="text-panel-muted">升力</span> L = W / cosβ ={' '}
          <span className="text-panel-accent">{(W * current.liftRatio).toFixed(0)}</span> N
          <span className="ml-2 text-panel-muted">
            W = {W.toFixed(0)} N，β = {mode === 'sideslip' ? crabDeg.toFixed(1) : '0'}°
          </span>
        </p>
        <p>
          <span className="text-panel-muted">下滑角</span> γ = arctan(D/L) ={' '}
          <span className="text-panel-accent">{current.gamma.toFixed(2)}°</span>
          <span className="ml-2 text-panel-muted">L/D = {current.ld.toFixed(2)}</span>
        </p>
        <p>
          <span className="text-panel-muted">接地垂直速度</span> v_sink = V_ground·sinγ_touch ={' '}
          <span className={current.sink > 1.5 ? 'text-panel-bad' : 'text-panel-ok'}>
            {current.sink.toFixed(2)}
          </span>{' '}
          m/s
          <span className="ml-2 text-panel-muted">
            γ_touch = γ × k_flat，k_flat = {(1 - 0.75 * (flatQ / 100)).toFixed(2)}（拉平质量 {flatQ}%）
          </span>
        </p>
        <p>
          <span className="text-panel-muted">接地载荷</span> n = 1 + v_sink²/(g·Δh) ={' '}
          <span className={current.load > 2.5 ? 'text-panel-bad' : 'text-panel-ok'}>
            {current.load.toFixed(2)}
          </span>
          <span className="ml-2 text-panel-muted">Δh = {DH} m</span>
        </p>
        <p>
          <span className="text-panel-muted">失速速度</span> Vs = √(2W/ρSC_Lmax) ={' '}
          <span className="text-panel-warn">{current.vs.toFixed(1)}</span> m/s
          <span className="ml-2 text-panel-muted">
            坡度修正 1/cosφ；当前地速 {vGround} m/s，裕度 {current.margin.toFixed(1)} m/s
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
  tone?: 'ok' | 'bad' | 'warn'
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-panel-muted">{label}</dt>
      <dd
        className={
          tone === 'bad' ? 'text-panel-bad' : tone === 'warn' ? 'text-panel-warn' : 'text-panel-text'
        }
      >
        {value}
      </dd>
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
