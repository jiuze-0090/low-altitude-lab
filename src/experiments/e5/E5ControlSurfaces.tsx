import { useMemo, useState } from 'react'

/**
 * E5 · 舵面与操纵
 * ---------------------------------------------------------------------------
 * 演示：副翼 / 升降舵 / 方向舵 / 襟翼 四个面各自绕哪个轴转、产生什么力矩、
 *      带来什么副作用，以及舵面效能与动压（速度平方）的关系。
 *
 * 可调参数：舵偏角、空速、襟翼放下量。舵面选择与偏转方向用组件内按钮切换。
 *
 * 教学要点（对应题库考点）：
 *   · 副翼→滚转(纵轴)、升降舵→俯仰(横轴)、方向舵→偏航(立轴)（187/188/189）
 *   · 右压副翼 → 左翼升力大于右翼（190）
 *   · 推杆 → 升降舵下偏 → 尾部向上力 → 机头下俯 → 迎角减小（191），转入下降（212）
 *   · 副翼转弯外侧阻力大（203）→ 逆偏转（202）→ 向转弯方向偏方向舵（204/205）
 *   · 襟翼是增升装置（377），失速速度减小（183）
 */

const RHO = 1.225
const S_T = 0.08 // 舵面面积 m²
const CL_DELTA = 0.045 // 每度舵偏产生的升力系数增量

type SurfaceId = 'aileron' | 'elevator' | 'rudder' | 'flap'

const SURFACES: Array<{
  id: SurfaceId
  name: string
  axis: string
  motion: string
}> = [
  { id: 'aileron', name: '副翼', axis: '纵轴 oₓ', motion: '滚转' },
  { id: 'elevator', name: '升降舵', axis: '横轴 o_z', motion: '俯仰' },
  { id: 'rudder', name: '方向舵', axis: '立轴 o_y', motion: '偏航' },
  { id: 'flap', name: '襟翼', axis: '不产生力矩', motion: '改变翼型' },
]

export default function E5ControlSurfaces({ values }: { values: Record<string, number> }) {
  const [surface, setSurface] = useState<SurfaceId>('aileron')
  const [dir, setDir] = useState<1 | -1>(1) // 1 = 右滚 / 拉杆 / 右偏

  const deflection = values.deflection ?? 10
  const v = values.speed ?? 25
  const flapPct = values.flap ?? 0

  const q = 0.5 * RHO * v * v
  // 舵面力矩相对指数：∝ q·S·C_Lδ·δ（以最大值为 100 归一）
  const momentIndex = Math.min(100, (q * S_T * CL_DELTA * deflection) / 0.42 * 100)
  const effVs25 = (q / (0.5 * RHO * 625)) * 100 // 相对 25 m/s 的效能

  const info = SURFACES.find((s) => s.id === surface)!

  const metrics = useMemo(() => {
    const d = deflection * dir
    switch (surface) {
      case 'aileron':
        return [
          { label: '滚转方向', value: dir > 0 ? '右滚' : '左滚', unit: '', tone: 'info' as const },
          {
            label: '左翼升力',
            value: (100 + d * 1.6).toFixed(0),
            unit: '%',
            tone: 'ok' as const,
          },
          {
            label: '右翼升力',
            value: (100 - d * 1.6).toFixed(0),
            unit: '%',
            tone: 'warn' as const,
          },
          {
            label: '逆偏转',
            value: dir > 0 ? '偏左航向' : '偏右航向',
            unit: '',
            tone: 'bad' as const,
          },
        ]
      case 'elevator':
        return [
          { label: '俯仰', value: dir > 0 ? '拉杆抬头' : '推杆低头', unit: '', tone: 'info' as const },
          {
            label: '迎角变化',
            value: `${dir > 0 ? '+' : ''}${(d * 0.62).toFixed(1)}`,
            unit: '°',
            tone: dir > 0 ? 'warn' as const : 'ok' as const,
          },
          {
            label: '运动趋势',
            value: dir > 0 ? '转入爬升' : '转入下降',
            unit: '',
            tone: dir > 0 ? 'warn' as const : 'ok' as const,
          },
          {
            label: '速度趋势',
            value: dir > 0 ? '掉速（192）' : '增速（212）',
            unit: '',
            tone: 'info' as const,
          },
        ]
      case 'rudder':
        return [
          { label: '偏航', value: dir > 0 ? '机头右偏' : '机头左偏', unit: '', tone: 'info' as const },
          {
            label: '侧滑',
            value: dir > 0 ? '右侧滑' : '左侧滑',
            unit: '',
            tone: 'warn' as const,
          },
          {
            label: '转弯修正',
            value: dir > 0 ? '右转弯配右舵' : '左转弯配左舵',
            unit: '',
            tone: 'ok' as const,
          },
          {
            label: '协调转弯',
            value: '压杆 + 方向舵',
            unit: '',
            tone: 'info' as const,
          },
        ]
      default:
        return [
          { label: '襟翼位置', value: flapPct.toFixed(0), unit: '% 放下', tone: 'info' as const },
          {
            label: '升力系数 C_L',
            value: (0.9 + (flapPct / 100) * 0.7).toFixed(2),
            unit: '',
            tone: 'ok' as const,
          },
          {
            label: '失速速度',
            value: (20 / Math.sqrt(0.9 + (flapPct / 100) * 0.7)).toFixed(1),
            unit: 'm/s',
            tone: 'warn' as const,
          },
          {
            label: '下滑角',
            value: (Math.atan(1 / (10 - (flapPct / 100) * 3.4)) * (180 / Math.PI)).toFixed(1),
            unit: '°',
            tone: 'info' as const,
          },
        ]
    }
  }, [surface, deflection, dir, flapPct])

  // ── 几何常量 ────────────────────────────────────────────────────────
  const HINGE_Y = 114
  const AIL_R = { x0: 222, x1: 276 }
  const AIL_L = { x0: 44, x1: 98 }
  const ELE = { x0: 110, x1: 210, hingeY: 204 }
  const finShift = (deflection / 25) * 8 * dir

  const rightAilUp = surface === 'aileron' && dir > 0
  const leftAilDown = surface === 'aileron' && dir > 0

  return (
    <div className="flex flex-col gap-4">
      {/* 舵面选择 */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex flex-wrap gap-1 rounded-md border border-panel-line bg-panel-raised p-1"
          role="tablist"
          aria-label="选择操纵面"
        >
          {SURFACES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={surface === s.id}
              onClick={() => setSurface(s.id)}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                surface === s.id
                  ? 'bg-panel-accent text-[#0b1424]'
                  : 'text-panel-muted hover:bg-panel hover:text-panel-text'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {surface !== 'flap' && (
          <div className="inline-flex gap-1 rounded-md border border-panel-line bg-panel-raised p-1">
            <button
              type="button"
              onClick={() => setDir(1)}
              aria-pressed={dir === 1}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                dir === 1 ? 'bg-panel-accent text-[#0b1424]' : 'text-panel-muted hover:text-panel-text'
              }`}
            >
              {surface === 'aileron' ? '右滚' : surface === 'elevator' ? '拉杆' : '右偏'}
            </button>
            <button
              type="button"
              onClick={() => setDir(-1)}
              aria-pressed={dir === -1}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                dir === -1 ? 'bg-panel-accent text-[#0b1424]' : 'text-panel-muted hover:text-panel-text'
              }`}
            >
              {surface === 'aileron' ? '左滚' : surface === 'elevator' ? '推杆' : '左偏'}
            </button>
          </div>
        )}
      </div>

      {/* 仪表读数 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map((m) => (
          <Readout key={m.label} label={m.label} value={m.value} unit={m.unit} tone={m.tone} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* ── 俯视示意图 ────────────────────────────────────────── */}
        <div className="rounded-md border border-panel-line bg-panel-raised p-3">
          <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
            操纵面位置与力矩方向
          </p>
          <svg
            viewBox="0 0 320 268"
            className="w-full"
            role="img"
            aria-label={`${info.name} 偏转 ${deflection} 度，产生${info.motion}力矩，绕${info.axis}。`}
          >
            <defs>
              <marker id="e5-a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#8ba8ff" />
              </marker>
              <marker id="e5-b" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#4a90d9" />
              </marker>
              <marker id="e5-c" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#ff9a6e" />
              </marker>
              <marker id="e5-d" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#ff8b82" />
              </marker>
            </defs>

            {/* 机身 */}
            <path
              d="M160 20 C150 42 146 62 146 88 L148 196 C149 216 154 230 160 240 C166 230 171 216 172 196 L174 88 C174 62 170 42 160 20 Z"
              fill="#1d2f4d"
              stroke="#5f7fb5"
              strokeWidth="1.4"
            />
            {/* 座舱 */}
            <path d="M152 46 L168 46 L169 70 L151 70 Z" fill="#2a4470" stroke="#5f7fb5" strokeWidth="1" />
            {/* 相对气流 */}
            <line x1="160" y1="6" x2="160" y2="16" stroke="#8ba8ff" strokeWidth="1.4" markerEnd="url(#e5-a)" />

            {/* 主翼 */}
            <path d="M34 96 L146 96 L174 96 L286 96 L286 120 L174 120 L146 120 L34 120 Z" fill="#243a5e" stroke="#5f7fb5" strokeWidth="1.2" />

            {/* 襟翼（内侧） */}
            {flapPct > 0 && (
              <path
                d={`M102 ${HINGE_Y} L218 ${HINGE_Y} L218 ${120 + (flapPct / 100) * 9} L102 ${
                  120 + (flapPct / 100) * 9
                } Z`}
                fill="#3d6b52"
                stroke="#7fc9a0"
                strokeWidth="1.2"
              />
            )}

            {/* 副翼（右：x 222~276）*/}
            <g
              transform={
                surface === 'aileron'
                  ? `rotate(${rightAilUp ? -deflection : deflection} ${AIL_R.x0} ${HINGE_Y})`
                  : undefined
              }
            >
              <rect
                x={AIL_R.x0}
                y={HINGE_Y}
                width={AIL_R.x1 - AIL_R.x0}
                height="6"
                fill={surface === 'aileron' ? '#4a90d9' : '#2f4a72'}
                stroke="#8ec5f0"
                strokeWidth="1"
              />
            </g>

            {/* 副翼（左：x 44~98）*/}
            <g
              transform={
                surface === 'aileron'
                  ? `rotate(${leftAilDown ? deflection : -deflection} ${AIL_L.x1} ${HINGE_Y})`
                  : undefined
              }
            >
              <rect
                x={AIL_L.x0}
                y={HINGE_Y}
                width={AIL_L.x1 - AIL_L.x0}
                height="6"
                fill={surface === 'aileron' ? '#4a90d9' : '#2f4a72'}
                stroke="#8ec5f0"
                strokeWidth="1"
              />
            </g>

            {/* 水平尾翼 */}
            <path d="M104 196 L216 196 L216 210 L104 210 Z" fill="#243a5e" stroke="#5f7fb5" strokeWidth="1.1" />
            {/* 升降舵 */}
            <g
              transform={
                surface === 'elevator'
                  ? `rotate(${dir > 0 ? -deflection : deflection} ${ELE.x0} ${ELE.hingeY})`
                  : undefined
              }
            >
              <rect
                x={ELE.x0}
                y={ELE.hingeY}
                width={ELE.x1 - ELE.x0}
                height="6"
                fill={surface === 'elevator' ? '#4a90d9' : '#2f4a72'}
                stroke="#8ec5f0"
                strokeWidth="1"
              />
            </g>

            {/* 垂尾 + 方向舵 */}
            <path d="M152 224 L168 224 L160 244 Z" fill="#243a5e" stroke="#5f7fb5" strokeWidth="1.1" />
            {surface === 'rudder' && (
              <path
                d={`M${154 + finShift} 234 L${166 + finShift} 234 L166 244 L154 244 Z`}
                fill="#4a90d9"
                stroke="#8ec5f0"
                strokeWidth="1"
              />
            )}

            {/* 力矩示意 */}
            {surface === 'aileron' && (
              <g>
                {/* 左右翼升力不等 */}
                <line
                  x1={dir > 0 ? 60 : 260}
                  y1="104"
                  x2={dir > 0 ? 60 : 260}
                  y2={dir > 0 ? 56 : 152}
                  stroke={dir > 0 ? '#4a90d9' : '#ff9a6e'}
                  strokeWidth="2.6"
                  markerEnd={dir > 0 ? 'url(#e5-b)' : 'url(#e5-c)'}
                />
                <line
                  x1={dir > 0 ? 260 : 60}
                  y1="104"
                  x2={dir > 0 ? 260 : 60}
                  y2={dir > 0 ? 78 : 130}
                  stroke={dir > 0 ? '#ff9a6e' : '#4a90d9'}
                  strokeWidth="2.6"
                  markerEnd={dir > 0 ? 'url(#e5-c)' : 'url(#e5-b)'}
                />
                <text x="60" y="56" textAnchor="middle" fontSize="9" fill="#8ec5f0" fontFamily="monospace">
                  左翼升力大
                </text>
                <text x="260" y="56" textAnchor="middle" fontSize="9" fill="#ff9a6e" fontFamily="monospace">
                  右翼升力小
                </text>
                {/* 逆偏转 */}
                <path
                  d={`M 160 34 q ${dir > 0 ? -16 : 16} 6 ${dir > 0 ? -14 : 14} 18`}
                  fill="none"
                  stroke="#ff8b82"
                  strokeWidth="1.8"
                  markerEnd="url(#e5-d)"
                />
                <text x="160" y="30" textAnchor="middle" fontSize="8.5" fill="#ff8b82" fontFamily="monospace">
                  逆偏转
                </text>
              </g>
            )}

            {surface === 'elevator' && (
              <g>
                <path
                  d={`M 160 32 q ${dir > 0 ? 26 : -26} 10 ${dir > 0 ? 22 : -22} 26`}
                  fill="none"
                  stroke="#ffc46b"
                  strokeWidth="2"
                  markerEnd="url(#e5-a)"
                />
                <text
                  x="160"
                  y="26"
                  textAnchor="middle"
                  fontSize="9"
                  fill="#ffc46b"
                  fontFamily="monospace"
                >
                  {dir > 0 ? '抬头' : '低头'}
                </text>
                {/* 尾部下载 / 上力 */}
                <line
                  x1="160"
                  y1="212"
                  x2="160"
                  y2={dir > 0 ? 236 : 188}
                  stroke={dir > 0 ? '#ff9a6e' : '#4a90d9'}
                  strokeWidth="2.4"
                  markerEnd={dir > 0 ? 'url(#e5-c)' : 'url(#e5-b)'}
                />
                <text x="168" y="228" fontSize="8.5" fill="#a8bcd6" fontFamily="monospace">
                  {dir > 0 ? '尾部下压力' : '尾部上拉力'}
                </text>
              </g>
            )}

            {surface === 'rudder' && (
              <g>
                <path
                  d={`M 232 214 q 26 6 ${dir > 0 ? 22 : -22} 18`}
                  fill="none"
                  stroke="#ffc46b"
                  strokeWidth="2"
                  markerEnd="url(#e5-a)"
                />
                <text x="232" y="208" textAnchor="middle" fontSize="9" fill="#ffc46b" fontFamily="monospace">
                  {dir > 0 ? '机头右偏' : '机头左偏'}
                </text>
              </g>
            )}

            {surface === 'flap' && (
              <g>
                <line x1="160" y1="140" x2="160" y2="176" stroke="#7fc9a0" strokeWidth="2" markerEnd="url(#e5-b)" />
                <text x="166" y="164" fontSize="9" fill="#9ad8b4" fontFamily="monospace">
                  增升 + 增阻
                </text>
              </g>
            )}
          </svg>

          <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
            {info.name}绕
            <span className="text-panel-accent"> {info.axis} </span>
            产生
            <span className="text-panel-accent"> {info.motion} </span>
            力矩。俯视图只能看出平面内的效果，绕纵轴的滚转需要靠左右翼升力差来读。
          </p>
        </div>

        {/* ── 舵效与动压 ───────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-panel-line bg-panel-raised p-3">
            <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-panel-muted">
              舵面效能（∝ 动压 ∝ V²）
            </p>
            <svg viewBox="0 0 320 150" className="w-full" role="img" aria-label="舵面效能随速度变化曲线">
              <g opacity="0.22">
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={`gy${i}`}
                    x1="34"
                    y1={112 - i * 22}
                    x2="306"
                    y2={112 - i * 22}
                    stroke="#8ba8ff"
                    strokeWidth="0.5"
                  />
                ))}
              </g>
              <line x1="34" y1="112" x2="306" y2="112" stroke="#5f7fb5" strokeWidth="1.2" />
              <line x1="34" y1="112" x2="34" y2="24" stroke="#5f7fb5" strokeWidth="1.2" />
              <text x="306" y="126" textAnchor="end" fontSize="9" fill="#a8bcd6" fontFamily="monospace">
                V →
              </text>
              <text x="30" y="28" textAnchor="end" fontSize="9" fill="#a8bcd6" fontFamily="monospace">
                舵效
              </text>
              {[10, 20, 30, 40, 50].map((s) => (
                <text
                  key={s}
                  x={34 + ((s - 8) / 42) * 272}
                  y="126"
                  textAnchor="middle"
                  fontSize="8"
                  fill="#8fa8c9"
                  fontFamily="monospace"
                >
                  {s}
                </text>
              ))}
              <path
                d="M 34 112 Q 170 78 306 30"
                fill="none"
                stroke="#5f7fb5"
                strokeWidth="1.6"
                strokeDasharray="4 3"
              />
              <circle
                cx={34 + ((v - 8) / 42) * 272}
                cy={112 - Math.min(88, (q / 3000) * 88)}
                r="5"
                fill="#ff6b35"
                stroke="#ffffff"
                strokeWidth="1.4"
              />
              <text
                x={34 + ((v - 8) / 42) * 272}
                y={112 - Math.min(88, (q / 3000) * 88) - 10}
                textAnchor="middle"
                fontSize="9"
                fill="#ff9a6e"
                fontFamily="monospace"
              >
                {v} m/s
              </text>
            </svg>
            <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
              当前动压 q = <span className="text-panel-accent">{q.toFixed(0)}</span> Pa，
              舵效约为 25 m/s 时的{' '}
              <span className="text-panel-accent">{effVs25.toFixed(0)}%</span>。
              速度掉一半，舵效只剩四分之一——这就是低速时"杆变沉"的来源。
            </p>
          </div>

          <div className="rounded-md border border-panel-line bg-panel-raised p-3">
            <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
              舵面力矩指数
            </p>
            <div className="flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-pill bg-panel">
                <div
                  className="h-full rounded-pill bg-panel-accent transition-[width] duration-200"
                  style={{ width: `${momentIndex}%` }}
                />
              </div>
              <span className="tnum w-12 shrink-0 text-right text-sm font-bold text-panel-accent">
                {momentIndex.toFixed(0)}
              </span>
            </div>
            <p className="mt-1.5 text-2xs leading-relaxed text-panel-muted">
              舵面力矩 M = q · S_t · C_Lδ · δ，舵偏角 δ = {deflection}°，舵面面积 S_t = {S_T} m²。
            </p>
          </div>
        </div>
      </div>

      {/* 公式条 */}
      <div className="flex flex-col gap-1.5 rounded-md bg-panel-raised px-4 py-3 font-mono text-xs text-panel-text">
        <p>
          <span className="text-panel-muted">动压</span> q = ½ρV² = <span className="text-panel-accent">{q.toFixed(0)}</span> Pa
          <span className="ml-2 text-panel-muted">V = {v.toFixed(0)} m/s，ρ = {RHO} kg/m³</span>
        </p>
        <p>
          <span className="text-panel-muted">舵面力矩</span> M = q·S_t·C_Lδ·δ ={' '}
          <span className="text-panel-accent">{(q * S_T * CL_DELTA * deflection).toFixed(2)}</span> N·m
          <span className="ml-2 text-panel-muted">指数 {momentIndex.toFixed(0)} / 100</span>
        </p>
        {surface === 'aileron' && (
          <p>
            <span className="text-panel-muted">升力差</span> ΔL ={' '}
            <span className="text-panel-accent">
              {(deflection * dir * 1.6).toFixed(1)}
            </span>{' '}
            %
            <span className="ml-2 text-panel-muted">
              右压杆 → 左副翼下偏 / 右副翼上偏 → 左翼升力大于右翼（190）
            </span>
          </p>
        )}
        {surface === 'elevator' && (
          <p>
            <span className="text-panel-muted">迎角变化</span> Δα ={' '}
            <span className="text-panel-accent">{(deflection * dir * 0.62).toFixed(1)}</span>°
            <span className="ml-2 text-panel-muted">
              {dir > 0 ? '拉杆 → 升降舵上偏 → 尾部下压 → 抬头 → 迎角增大（192）' : '推杆 → 升降舵下偏 → 尾部上拉 → 低头 → 迎角减小（191）'}
            </span>
          </p>
        )}
        {surface === 'rudder' && (
          <p>
            <span className="text-panel-muted">偏航力矩</span> N ={' '}
            <span className="text-panel-accent">{(q * S_T * CL_DELTA * deflection).toFixed(2)}</span> N·m
            <span className="ml-2 text-panel-muted">
              机头偏转但航迹不变 → 侧滑；转弯中需与副翼配合（204/205）
            </span>
          </p>
        )}
        {surface === 'flap' && (
          <p>
            <span className="text-panel-muted">襟翼</span> 放下 {flapPct.toFixed(0)}%
            <span className="ml-2 text-panel-muted">
              C_L ↑、C_D ↑、临界迎角 ↓、失速速度 ↓、下滑角 ↑（377/183/186）
            </span>
          </p>
        )}
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
