import { useMemo, useState } from 'react'

/**
 * E6 · 多旋翼反扭矩与偏航
 * ---------------------------------------------------------------------------
 * 演示：四个电机的旋向与转速分配，如何决定偏航方向与偏航角速度；
 *      以及"偏航靠反扭矩、俯仰滚转靠拉力"这条最容易考的界线。
 *
 * 电机编号（X 型，从上方看）：
 *   M1 前左 顺时针(CW)   M2 前右 逆时针(CCW)
 *   M3 后左 逆时针(CCW)  M4 后右 顺时针(CW)
 * 顺逆必须左右交替，悬停时两组反扭矩两两平衡（题 740 / 704）。
 *
 * 可调参数：偏航杆量、油门。飞行模式用组件内按钮切换（手动差动 / 姿态模式）。
 */

const K_THRUST = 12.0 // 推力系数 N
const K_TORQUE = 0.09 // 反扭矩系数 N·m
const I_Z = 0.028 // 偏航转动惯量 kg·m²
const MAX_DELTA = 0.32 // 满杆时的转速差

const MOTORS = [
  { id: 'M1', name: '前左', x: 84, y: 74, cw: true },
  { id: 'M2', name: '前右', x: 236, y: 74, cw: false },
  { id: 'M3', name: '后左', x: 84, y: 226, cw: false },
  { id: 'M4', name: '后右', x: 236, y: 226, cw: true },
]

export default function E6MultirotorYaw({ values }: { values: Record<string, number> }) {
  const [mode, setMode] = useState<'manual' | 'attitude'>('manual')

  const yawStick = values.yaw ?? 0.3
  const throttle = values.throttle ?? 0.55

  const model = useMemo(() => {
    const delta = Math.abs(yawStick) * MAX_DELTA
    // 逆时针对角（M2 M3）为 CCW；偏航杆量为正 = 机头右偏 = 加速 CCW 组
    const ccwBase = yawStick > 0 ? throttle + delta : throttle - delta
    const cwBase = yawStick > 0 ? throttle - delta : throttle + delta

    const speeds: Record<string, number> = {
      M1: Math.max(0, cwBase),
      M2: Math.max(0, ccwBase),
      M3: Math.max(0, ccwBase),
      M4: Math.max(0, cwBase),
    }

    const thrust =
      K_THRUST * (speeds.M1 ** 2 + speeds.M2 ** 2 + speeds.M3 ** 2 + speeds.M4 ** 2)
    // 净偏航力矩：逆时针旋翼的反扭矩使机头右偏（与旋向相反）
    const yawTorque =
      K_TORQUE * (speeds.M2 ** 2 + speeds.M3 ** 2 - speeds.M1 ** 2 - speeds.M4 ** 2)
    const yawRate = (yawTorque / I_Z) * (180 / Math.PI) * 2.2
    const power =
      1.1 * (speeds.M1 ** 3 + speeds.M2 ** 3 + speeds.M3 ** 3 + speeds.M4 ** 3)

    // 姿态模式下飞控限幅偏航角速度
    const appliedRate =
      mode === 'attitude' ? Math.max(-90, Math.min(90, yawRate)) : yawRate

    // 悬停基准总推力（用于比较偏航时推力是否变化）
    const hoverThrust = K_THRUST * 4 * throttle ** 2

    return { speeds, thrust, yawTorque, yawRate: appliedRate, power, hoverThrust, delta }
  }, [yawStick, throttle, mode])

  const { speeds } = model
  const yawRight = model.yawTorque > 0
  const trimmed = Math.abs(yawStick) < 0.02

  return (
    <div className="flex flex-col gap-4">
      {/* 模式切换 */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex gap-1 rounded-md border border-panel-line bg-panel-raised p-1"
          role="tablist"
          aria-label="飞行模式"
        >
          {(
            [
              ['manual', '手动差动'],
              ['attitude', '姿态模式（航向保持）'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === id
                  ? 'bg-panel-accent text-[#0b1424]'
                  : 'text-panel-muted hover:bg-panel hover:text-panel-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-2xs leading-relaxed text-panel-muted">
          {mode === 'attitude'
            ? '飞控接管：松杆后自动修正回原航向，偏航角速度被限幅在 ±90°/s。'
            : '直接映射：松杆即回中，不保持航向——反扭矩的"手感"全在这一档。'}
        </p>
      </div>

      {/* 仪表读数 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Readout
          label="净偏航力矩"
          value={model.yawTorque.toFixed(3)}
          unit="N·m"
          tone={Math.abs(model.yawTorque) < 0.001 ? 'ok' : yawRight ? 'info' : 'warn'}
        />
        <Readout
          label="偏航角速度"
          value={model.yawRate.toFixed(0)}
          unit="°/s"
          tone={Math.abs(model.yawRate) < 1 ? 'ok' : yawRight ? 'info' : 'warn'}
        />
        <Readout
          label="总推力"
          value={model.thrust.toFixed(1)}
          unit="N"
          tone={
            Math.abs(model.thrust - model.hoverThrust) / model.hoverThrust < 0.12 ? 'ok' : 'warn'
          }
        />
        <Readout
          label="相对耗电"
          value={(model.power / (1.1 * 4 * throttle ** 3)).toFixed(2)}
          unit="×"
          tone={model.power / (1.1 * 4 * throttle ** 3) > 1.25 ? 'bad' : 'ok'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* ── 机架俯视 ──────────────────────────────────────────── */}
        <div className="rounded-md border border-panel-line bg-panel-raised p-3">
          <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
            电机转速分配与反扭矩
          </p>
          <svg
            viewBox="0 0 320 300"
            className="w-full"
            role="img"
            aria-label={`偏航杆量 ${yawStick.toFixed(2)}，机头${yawRight ? '右' : '左'}偏。`}
          >
            <defs>
              <marker id="e6-a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#8ba8ff" />
              </marker>
              <marker id="e6-b" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#4a90d9" />
              </marker>
              <marker id="e6-c" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#ff9a6e" />
              </marker>
            </defs>

            {/* 机身 */}
            <rect x="126" y="122" width="68" height="56" rx="12" fill="#1d2f4d" stroke="#5f7fb5" strokeWidth="1.4" />
            {/* 机头方向 */}
            <path d="M160 112 L168 126 L160 132 L152 126 Z" fill="#ffc46b" />
            <text x="160" y="106" textAnchor="middle" fontSize="9" fill="#ffc46b" fontFamily="monospace">
              机头
            </text>

            {/* 偏航箭头（绕立轴） */}
            <g>
              <path
                d={
                  yawRight
                    ? 'M 118 150 a 42 42 0 0 1 84 0'
                    : 'M 202 150 a 42 42 0 0 0 -84 0'
                }
                fill="none"
                stroke={Math.abs(model.yawTorque) < 0.001 ? '#5f7fb5' : '#ffc46b'}
                strokeWidth="2.4"
                markerEnd="url(#e6-a)"
              />
              <text
                x="160"
                y="196"
                textAnchor="middle"
                fontSize="9"
                fill="#ffc46b"
                fontFamily="monospace"
              >
                {trimmed ? '两两平衡 · 不偏航' : yawRight ? '机头右偏（俯视顺时针）' : '机头左偏'}
              </text>
            </g>

            {/* 电机 */}
            {MOTORS.map((m) => {
              const n = speeds[m.id]
              const r = 20
              const spin = m.cw ? 1 : -1
              const arcStart = m.cw ? -140 : 140
              const arcEnd = m.cw ? 140 : -140
              const active = Math.abs(n - throttle) > 0.01
              return (
                <g key={m.id}>
                  {/* 机臂（重画在上层） */}
                  <line
                    x1="160"
                    y1="150"
                    x2={m.x}
                    y2={m.y}
                    stroke="#3c5a8d"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* 电机圆 */}
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r={r}
                    fill={m.cw ? '#3a2b1f' : '#1f2f3a'}
                    stroke={m.cw ? '#ff9a6e' : '#4a90d9'}
                    strokeWidth={active ? 2.4 : 1.4}
                  />
                  {/* 旋向弧 */}
                  <path
                    d={`M ${m.x + r * Math.cos((arcStart * Math.PI) / 180)} ${
                      m.y + r * Math.sin((arcStart * Math.PI) / 180)
                    } A ${r - 5} ${r - 5} 0 1 ${spin} ${m.x + (r - 5) * Math.cos((arcEnd * Math.PI) / 180)} ${
                      m.y + (r - 5) * Math.sin((arcEnd * Math.PI) / 180)
                    }`}
                    fill="none"
                    stroke={m.cw ? '#ff9a6e' : '#4a90d9'}
                    strokeWidth="1.8"
                    markerEnd={m.cw ? 'url(#e6-c)' : 'url(#e6-b)'}
                  />
                  {/* 转速 */}
                  <text
                    x={m.x}
                    y={m.y + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#e8f0fb"
                    fontFamily="monospace"
                  >
                    {(n * 100).toFixed(0)}
                  </text>
                  {/* 标签 */}
                  <text
                    x={m.x}
                    y={m.y + r + 14}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="#a8bcd6"
                    fontFamily="monospace"
                  >
                    {m.id} {m.name}
                  </text>
                  <text
                    x={m.x}
                    y={m.y + r + 24}
                    textAnchor="middle"
                    fontSize="8"
                    fill={m.cw ? '#ff9a6e' : '#8ec5f0'}
                    fontFamily="monospace"
                  >
                    {m.cw ? '顺时针' : '逆时针'}
                  </text>
                  {/* 转速条 */}
                  <rect
                    x={m.x - 24}
                    y={m.y + r + 28}
                    width="48"
                    height="4"
                    rx="2"
                    fill="#16233c"
                  />
                  <rect
                    x={m.x - 24}
                    y={m.y + r + 28}
                    width={48 * Math.min(1, n)}
                    height="4"
                    rx="2"
                    fill={m.cw ? '#ff9a6e' : '#4a90d9'}
                  />
                </g>
              )
            })}
          </svg>

          <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
            数字 = 电机转速（%）。偏航杆量为正时，
            <span className="text-panel-accent">逆时针旋翼（M2、M3）加速</span>、
            <span className="text-panel-warn">顺时针旋翼（M1、M4）减速</span>——
            机身被拧得右偏，而加速的那组旋向和机头偏转方向<span className="text-panel-accent">相反</span>（题 460）。
          </p>
        </div>

        {/* ── 电机表 + 结论 ─────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-panel-line bg-panel-raised p-3">
            <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-panel-muted">
              转速分配表
            </p>
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="text-panel-muted">
                  <th className="py-1 text-left font-medium">电机</th>
                  <th className="py-1 text-left font-medium">位置</th>
                  <th className="py-1 text-left font-medium">旋向</th>
                  <th className="py-1 text-right font-medium">转速</th>
                  <th className="py-1 text-right font-medium">反扭矩</th>
                </tr>
              </thead>
              <tbody>
                {MOTORS.map((m) => (
                  <tr key={m.id} className="border-t border-panel-line">
                    <td className="py-1.5 text-panel-text">{m.id}</td>
                    <td className="py-1.5 text-panel-muted">{m.name}</td>
                    <td className="py-1.5" style={{ color: m.cw ? '#ff9a6e' : '#8ec5f0' }}>
                      {m.cw ? '顺 CW' : '逆 CCW'}
                    </td>
                    <td className="tnum py-1.5 text-right text-panel-text">
                      {(speeds[m.id] * 100).toFixed(0)}%
                    </td>
                    <td className="tnum py-1.5 text-right text-panel-muted">
                      {((m.cw ? -1 : 1) * (speeds[m.id] ** 2) * K_TORQUE).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-2xs leading-relaxed text-panel-muted">
              悬停的充要条件是：逆时针组的转速平方和 = 顺时针组的转速平方和（题 740）。
              现在两组差 {model.delta.toFixed(2)}，净差{' '}
              <span className="text-panel-accent">{model.yawTorque.toFixed(3)}</span> N·m。
            </p>
          </div>

          <div className="rounded-md border border-panel-line bg-panel-raised p-3">
            <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
              三条结论
            </p>
            <ul className="flex flex-col gap-2 text-2xs leading-relaxed text-panel-muted">
              <li>
                <span className="text-panel-ok">① 总推力</span>：偏航时平方和近似抵消，
                当前 <span className="text-panel-text">{model.thrust.toFixed(1)}</span> N，
                对比悬停基准 {model.hoverThrust.toFixed(1)} N——
                差值 {(((model.thrust - model.hoverThrust) / model.hoverThrust) * 100).toFixed(0)}%，
                所以偏航<span className="text-panel-text">基本不掉高度</span>。
              </li>
              <li>
                <span className="text-panel-ok">② 俯仰滚转 vs 偏航</span>：
                俯仰、滚转靠改变各旋翼<span className="text-panel-text">拉力</span>（题 739）；
                偏航靠改变各旋翼<span className="text-panel-text">反扭矩</span>（题 460）。
              </li>
              <li>
                <span className="text-panel-ok">③ 耗电</span>：功率 ∝ n³，
                相对同油门悬停为{' '}
                <span
                  className={
                    model.power / (1.1 * 4 * throttle ** 3) > 1.25 ? 'text-panel-bad' : 'text-panel-ok'
                  }
                >
                  {(model.power / (1.1 * 4 * throttle ** 3)).toFixed(2)}×
                </span>
                。偏航比悬停更费电——别用偏航代替平移。
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 公式条 */}
      <div className="flex flex-col gap-1.5 rounded-md bg-panel-raised px-4 py-3 font-mono text-xs text-panel-text">
        <p>
          <span className="text-panel-muted">总推力</span> T = k·Σn² ={' '}
          <span className="text-panel-accent">{model.thrust.toFixed(2)}</span> N
          <span className="ml-2 text-panel-muted">油门 {throttle.toFixed(2)}，悬停基准 {model.hoverThrust.toFixed(2)} N</span>
        </p>
        <p>
          <span className="text-panel-muted">净偏航力矩</span> M = k_q·[(n₂²+n₃²) − (n₁²+n₄²)] ={' '}
          <span className="text-panel-accent">{model.yawTorque.toFixed(4)}</span> N·m
          <span className="ml-2 text-panel-muted">正 = 机头右偏</span>
        </p>
        <p>
          <span className="text-panel-muted">偏航角速度</span> ψ̇ = M / I_z ={' '}
          <span className="text-panel-warn">{model.yawRate.toFixed(0)}</span> °/s
          <span className="ml-2 text-panel-muted">
            {mode === 'attitude' ? '姿态模式限幅 ±90°/s' : '手动模式不设限幅'}
          </span>
        </p>
        <p>
          <span className="text-panel-muted">推力与反扭矩</span> T ∝ n²D⁴，Q ∝ n²D⁵
          <span className="ml-2 text-panel-muted">功率 ∝ Σn³ = {model.power.toFixed(2)}（相对量）</span>
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
