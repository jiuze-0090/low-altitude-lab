import { useMemo } from 'react'

/**
 * E4 · 重心与安定性
 * ---------------------------------------------------------------------------
 * 演示：重心与"焦点（全机压力中心）"的相对位置，如何决定
 *      ① 纵向安定性（静稳定裕度）② 操纵灵敏度 ③ 俯仰配平所需的平尾下载
 *      ④ 配平状态下的失速速度与离失速的余量。
 *
 * 可调参数：重心位置（% MAC）、水平尾翼面积、起飞重量、空速。
 *
 * 教学要点（对应题库考点）：
 *   · 焦点在重心之后 → 纵向稳定（451）；重心靠前 → 安定性变强（230）
 *   · 机翼升力对重心 = 下俯力矩（228），平尾下载 = 上仰力矩（229）
 *   · 增大水平尾翼面积 → 焦点后移 → 静稳定性增加（443）、操纵性减弱（445）
 *   · 平衡 = 外力平衡 + 外力矩平衡（420）；配重一变就要重新配平（258）
 */

const RHO = 1.225
const S_WING = 0.35 // 机翼面积 m²
const MAC = 1.1 // 平均气动弦长 m
const L_T = 3.0 // 水平尾翼力臂 m
const CL_MAX = 1.5
const CL_ALPHA = 0.088 // 每度
const CLT_ALPHA = 3.5 // 每弧弦（平尾）
const ALPHA_CRIT = 16

/** 焦点（% MAC）：随水平尾翼面积增大而后移（题 443） */
const focusOf = (tailArea: number) => 36 + 137.5 * (tailArea - 0.08)

export default function E4CgStability({ values }: { values: Record<string, number> }) {
  const cg = values.cg ?? 18
  const tailArea = values.tailArea ?? 0.08
  const mass = values.mass ?? 12
  const v = values.speed ?? 25

  const model = useMemo(() => {
    const focus = focusOf(tailArea) // % MAC
    const stable = focus > cg
    const d = ((focus - cg) / 100) * MAC // 焦点到重心的纵向力臂 m
    const W = mass * 9.81
    const q = 0.5 * RHO * v * v
    const Td = stable ? (W * d) / L_T : 0 // 平尾下载 N
    const Lw = W + Td // 机翼承载 = 重量 + 下载
    const clW = Lw / (q * S_WING)
    const alpha = (clW - 0.06) / CL_ALPHA
    const clMargin = (CL_MAX - clW) / CL_MAX
    const vStall = Math.sqrt((2 * Lw) / (RHO * S_WING * CL_MAX))
    const clt = q * S_WING > 0 ? Td / (q * tailArea) : 0
    const alphaT = clt / CLT_ALPHA // rad
    const trimDeg = (alphaT / 0.85) * (180 / Math.PI)
    const sm = focus - cg // 静稳定裕度（% MAC）
    const handling = 100 / Math.max(sm, 2) // 操纵灵敏度（相对指数）
    return {
      focus,
      stable,
      d,
      W,
      q,
      Td,
      Lw,
      clW,
      alpha,
      clMargin,
      vStall,
      trimDeg,
      sm,
      handling,
      rearLimit: focus - 2,
    }
  }, [cg, tailArea, mass, v])

  const { focus, stable, sm } = model
  const alphaStalled = model.alpha > ALPHA_CRIT
  const marginWarn = model.clMargin < 0.15

  // ── 机身侧视坐标 ────────────────────────────────────────────────────
  const SCALE_X0 = 92 // MAC 0% 对应 px
  const SCALE_X1 = 252 // MAC 100% 对应 px
  const toPx = (macPct: number) => SCALE_X0 + (macPct / 100) * (SCALE_X1 - SCALE_X0)
  const focusPx = toPx(focus)
  const cgPx = toPx(cg)
  const tailPx = 320

  // ── 安定性标尺 ──────────────────────────────────────────────────────
  const GX0 = 24
  const GX1 = 336
  const gToPx = (macPct: number) => GX0 + ((macPct - 5) / 40) * (GX1 - GX0)

  return (
    <div className="flex flex-col gap-4">
      {/* 仪表读数 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Readout
          label="静稳定裕度"
          value={sm.toFixed(1)}
          unit="% MAC"
          tone={stable ? (sm < 4 ? 'warn' : 'ok') : 'bad'}
        />
        <Readout
          label="平尾下载 T_d"
          value={model.Td.toFixed(1)}
          unit="N"
          tone={stable ? 'info' : 'bad'}
        />
        <Readout
          label="配平舵偏角"
          value={model.trimDeg.toFixed(1)}
          unit="°"
          tone={model.trimDeg > 12 ? 'warn' : 'info'}
        />
        <Readout
          label="配平状态失速速度"
          value={model.vStall.toFixed(1)}
          unit="m/s"
          tone={v < model.vStall ? 'bad' : 'ok'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* ── 机身侧视：焦点 / 重心 / 力矩 ──────────────────────── */}
        <div className="rounded-md border border-panel-line bg-panel-raised p-3">
          <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
            重心与焦点的相对位置
          </p>
          <svg
            viewBox="0 0 360 224"
            className="w-full"
            role="img"
            aria-label={`重心位于 ${cg.toFixed(1)}% MAC，焦点位于 ${focus.toFixed(
              1,
            )}% MAC，${stable ? '纵向稳定' : '纵向不稳定'}，静稳定裕度 ${sm.toFixed(1)}% MAC。`}
          >
            <defs>
              <marker id="e4-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#8ba8ff" />
              </marker>
              <marker id="e4-arrow-up" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#4a90d9" />
              </marker>
              <marker id="e4-arrow-dn" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#ff9a6e" />
              </marker>
              <marker id="e4-arrow-mom" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="#ffc46b" />
              </marker>
            </defs>

            {/* 相对气流 */}
            <g opacity="0.8">
              {[64, 84, 104].map((y) => (
                <line
                  key={y}
                  x1="8"
                  y1={y}
                  x2="52"
                  y2={y}
                  stroke="#8ba8ff"
                  strokeWidth="1.4"
                  markerEnd="url(#e4-arrow)"
                />
              ))}
              <text x="10" y="52" fontSize="8.5" fill="#8fa8c9" fontFamily="monospace">
                相对气流
              </text>
            </g>

            {/* 机身 */}
            <path
              d="M 26 96 Q 40 84 74 84 L 246 86 Q 286 88 312 100 L 318 104 L 312 110 Q 286 114 246 114 L 74 114 Q 40 112 26 96 Z"
              fill="#1d2f4d"
              stroke="#5f7fb5"
              strokeWidth="1.4"
            />
            {/* 座舱 */}
            <path d="M 72 84 Q 92 74 112 74 L 118 86 L 72 86 Z" fill="#2a4470" stroke="#5f7fb5" strokeWidth="1" />
            {/* 主翼（1/4 弦线处 = 焦点）*/}
            <path d="M 96 108 L 168 108 L 176 116 L 92 116 Z" fill="#243a5e" stroke="#5f7fb5" strokeWidth="1.2" />
            {/* 平尾 */}
            <path d="M 292 104 L 330 100 L 330 106 L 292 108 Z" fill="#243a5e" stroke="#5f7fb5" strokeWidth="1.1" />
            {/* 垂尾 */}
            <path d="M 288 88 L 312 66 L 318 66 L 306 90 Z" fill="#243a5e" stroke="#5f7fb5" strokeWidth="1.1" />

            {/* 机翼升力箭头（作用线过焦点） */}
            <g>
              <line
                x1={focusPx}
                y1={112}
                x2={focusPx}
                y2={44}
                stroke="#4a90d9"
                strokeWidth="2.2"
                markerEnd="url(#e4-arrow-up)"
              />
              <text x={focusPx + 5} y={50} fontSize="9" fill="#8ec5f0" fontFamily="monospace">
                L
              </text>
            </g>

            {/* 下俯力矩弧（机翼升力 → 下俯，题 228）*/}
            <path
              d={`M ${focusPx + 4} 52 q 26 10 30 34`}
              fill="none"
              stroke="#ffc46b"
              strokeWidth="1.6"
              markerEnd="url(#e4-arrow-mom)"
            />
            <text x={focusPx + 36} y="86" fontSize="8.5" fill="#ffc46b" fontFamily="monospace">
              下俯
            </text>

            {/* 平尾下载箭头（作用线在重心之后 → 上仰，题 229）*/}
            <g>
              <line
                x1={tailPx - 18}
                y1={110}
                x2={tailPx - 18}
                y2={146}
                stroke="#ff9a6e"
                strokeWidth="2.2"
                markerEnd="url(#e4-arrow-dn)"
              />
              <text x={tailPx - 14} y="158" fontSize="9" fill="#ff9a6e" fontFamily="monospace">
                T_d
              </text>
            </g>

            {/* 上仰力矩弧 */}
            <path
              d={`M ${tailPx - 42} 150 q -24 -6 -28 -26`}
              fill="none"
              stroke="#ffc46b"
              strokeWidth="1.6"
              markerEnd="url(#e4-arrow-mom)"
            />
            <text x={tailPx - 74} y="150" fontSize="8.5" fill="#ffc46b" fontFamily="monospace">
              上仰
            </text>

            {/* 焦点标记 */}
            <g>
              <polygon
                points={`${focusPx - 5},78 ${focusPx + 5},78 ${focusPx},88`}
                fill="#ffc46b"
              />
              <line x1={focusPx} y1={78} x2={focusPx} y2={118} stroke="#ffc46b" strokeWidth="1.2" strokeDasharray="3 3" />
              <text x={focusPx - 8} y="70" textAnchor="end" fontSize="9" fill="#ffc46b" fontFamily="monospace">
                焦点 {focus.toFixed(1)}%
              </text>
            </g>

            {/* MAC 标尺 */}
            <g>
              <line x1={SCALE_X0} y1="182" x2={SCALE_X1} y2="182" stroke="#5f7fb5" strokeWidth="1.2" />
              {[0, 25, 50, 75, 100].map((t) => (
                <g key={t}>
                  <line
                    x1={toPx(t)}
                    y1="182"
                    x2={toPx(t)}
                    y2="188"
                    stroke="#5f7fb5"
                    strokeWidth="1"
                  />
                  <text
                    x={toPx(t)}
                    y="199"
                    textAnchor="middle"
                    fontSize="8"
                    fill="#8fa8c9"
                    fontFamily="monospace"
                  >
                    {t}%
                  </text>
                </g>
              ))}
              <text x={SCALE_X0 - 4} y="199" textAnchor="end" fontSize="8" fill="#8fa8c9" fontFamily="monospace">
                MAC
              </text>

              {/* 重心滑块 */}
              <g>
                <polygon
                  points={`${cgPx - 6},178 ${cgPx + 6},178 ${cgPx},166`}
                  fill={stable ? '#4a90d9' : '#ff8b82'}
                />
                <line x1={cgPx} y1="166" x2={cgPx} y2="118" stroke={stable ? '#4a90d9' : '#ff8b82'} strokeWidth="1.2" strokeDasharray="2 3" />
                <text
                  x={cgPx}
                  y="214"
                  textAnchor="middle"
                  fontSize="9.5"
                  fill={stable ? '#8ec5f0' : '#ff8b82'}
                  fontFamily="monospace"
                >
                  重心 {cg.toFixed(1)}%
                </text>
              </g>
            </g>
          </svg>

          <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
            {stable ? (
              <>
                焦点在重心<span className="text-panel-ok">之后</span> → 纵向稳定。
                机翼升力构成下俯力矩、平尾下载构成上仰力矩，两笔账配平。
              </>
            ) : (
              <span className="text-panel-bad">
                焦点跑到重心<span className="text-panel-bad">之前</span> → 纵向不稳定：
                机翼升力变成上仰力矩，受扰后继续偏离（负静安定性，题 221）。
              </span>
            )}
          </p>
        </div>

        {/* ── 安定性标尺 ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-panel-line bg-panel-raised p-3">
            <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-panel-muted">
              重心位置 · 稳定区与不稳定区
            </p>
            <svg
              viewBox="0 0 360 128"
              className="w-full"
              role="img"
              aria-label={`重心位置标尺。当前重心 ${cg.toFixed(1)}%，焦点 ${focus.toFixed(1)}%。`}
            >
              {/* 稳定区 */}
              <rect
                x={GX0}
                y="46"
                width={Math.max(0, gToPx(focus) - GX0)}
                height="22"
                fill="#2f6b47"
                opacity="0.55"
                rx="3"
              />
              {/* 不稳定区 */}
              <rect
                x={gToPx(focus)}
                y="46"
                width={Math.max(0, GX1 - gToPx(focus))}
                height="22"
                fill="#7a3230"
                opacity="0.55"
                rx="3"
              />
              {/* 坐标轴 */}
              <line x1={GX0} y1="68" x2={GX1} y2="68" stroke="#5f7fb5" strokeWidth="1" />

              {[5, 15, 25, 35, 45].map((t) => (
                <g key={t}>
                  <line x1={gToPx(t)} y1="68" x2={gToPx(t)} y2="73" stroke="#5f7fb5" strokeWidth="1" />
                  <text
                    x={gToPx(t)}
                    y="84"
                    textAnchor="middle"
                    fontSize="8"
                    fill="#8fa8c9"
                    fontFamily="monospace"
                  >
                    {t}%
                  </text>
                </g>
              ))}

              {/* 焦点线 */}
              <line
                x1={gToPx(focus)}
                y1="34"
                x2={gToPx(focus)}
                y2="74"
                stroke="#ffc46b"
                strokeWidth="1.6"
                strokeDasharray="4 3"
              />
              <text
                x={gToPx(focus)}
                y="28"
                textAnchor="middle"
                fontSize="9"
                fill="#ffc46b"
                fontFamily="monospace"
              >
                焦点 {focus.toFixed(1)}%
              </text>

              {/* 后限重心位置（焦点前移 2% MAC 作安全余量）*/}
              {model.rearLimit > 5 && (
                <>
                  <line
                    x1={gToPx(model.rearLimit)}
                    y1="40"
                    x2={gToPx(model.rearLimit)}
                    y2="74"
                    stroke="#ff9a6e"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={gToPx(model.rearLimit)}
                    y="100"
                    textAnchor="middle"
                    fontSize="8"
                    fill="#ff9a6e"
                    fontFamily="monospace"
                  >
                    后限
                  </text>
                </>
              )}

              {/* 当前重心 */}
              <g>
                <polygon
                  points={`${gToPx(cg) - 7},44 ${gToPx(cg) + 7},44 ${gToPx(cg)},28`}
                  fill={stable ? '#4a90d9' : '#ff8b82'}
                />
                <text
                  x={gToPx(cg)}
                  y="118"
                  textAnchor="middle"
                  fontSize="9.5"
                  fill={stable ? '#8ec5f0' : '#ff8b82'}
                  fontFamily="monospace"
                >
                  重心 {cg.toFixed(1)}%
                </text>
              </g>

              <text x={GX0 + 4} y="60" fontSize="9" fill="#cfe8d8" fontFamily="monospace">
                稳定区
              </text>
              <text x={GX1 - 4} y="60" textAnchor="end" fontSize="9" fill="#f3c9c4" fontFamily="monospace">
                不稳定区
              </text>
            </svg>
            <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
              尾翼面积 {tailArea.toFixed(3)} m² → 焦点 {focus.toFixed(1)}% MAC。
              尾翼做大，焦点后移，可用的重心范围变宽（题 443）。
            </p>
          </div>

          {/* 操纵灵敏度条 */}
          <div className="rounded-md border border-panel-line bg-panel-raised p-3">
            <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
              操纵灵敏度（相对指数）
            </p>
            <div className="flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-pill bg-panel">
                <div
                  className="h-full rounded-pill transition-[width] duration-200"
                  style={{
                    width: `${Math.min(100, (model.handling / 40) * 100)}%`,
                    background: model.handling > 25 ? '#ff8b82' : model.handling > 12 ? '#ffc46b' : '#4a90d9',
                  }}
                />
              </div>
              <span className="tnum w-12 shrink-0 text-right text-sm font-bold text-panel-accent">
                {model.handling.toFixed(1)}
              </span>
            </div>
            <p className="mt-1.5 text-2xs leading-relaxed text-panel-muted">
              裕度越大 → 安定性越强 → 杆量越沉（题 445）。
              当前裕度 {sm.toFixed(1)}% MAC，
              {model.handling > 25 ? '已经太灵敏，误操作风险高' : model.handling > 12 ? '手感偏灵敏' : '手感偏稳、偏沉'}。
            </p>
          </div>
        </div>
      </div>

      {/* 公式条 */}
      <div className="flex flex-col gap-1.5 rounded-md bg-panel-raised px-4 py-3 font-mono text-xs text-panel-text">
        <p>
          <span className="text-panel-muted">静稳定裕度</span> SM = (焦点 − 重心) ={' '}
          <span className={stable ? 'text-panel-accent' : 'text-panel-bad'}>
            {sm.toFixed(1)}% MAC
          </span>
          <span className="ml-2 text-panel-muted">
            {stable ? '焦点在重心之后 → 稳定' : '焦点在重心之前 → 不稳定'}
          </span>
        </p>
        <p>
          <span className="text-panel-muted">配平</span> T_d·l_t = (W + T_d)·d → T_d ={' '}
          <span className="text-panel-accent">{model.Td.toFixed(1)}</span> N
          <span className="ml-2 text-panel-muted">
            d = {model.d.toFixed(3)} m，W = {model.W.toFixed(0)} N
          </span>
        </p>
        <p>
          <span className="text-panel-muted">配平舵偏角</span> δ_e ={' '}
          <span className="text-panel-warn">{model.trimDeg.toFixed(1)}</span>°
          <span className="ml-2 text-panel-muted">
            平尾负迎角 {((model.trimDeg * 0.85)).toFixed(1)}°，下载 {model.Td.toFixed(1)} N
          </span>
        </p>
        <p>
          <span className="text-panel-muted">机翼承载</span> L_w = W + T_d ={' '}
          <span className="text-panel-accent">{model.Lw.toFixed(0)}</span> N
          <span className="ml-2 text-panel-muted">
            当前 C_L = {model.clW.toFixed(2)}，迎角 ≈ {model.alpha.toFixed(1)}°
          </span>
        </p>
        <p>
          <span className="text-panel-muted">配平状态失速速度</span> V_s = √(2L_w/ρSC_Lmax) ={' '}
          <span className="text-panel-warn">{model.vStall.toFixed(1)}</span> m/s
          <span className="ml-2 text-panel-muted">
            离失速余量 {(model.clMargin * 100).toFixed(0)}%
            {alphaStalled ? '（已超临界迎角）' : marginWarn ? '（余量偏小）' : ''}
          </span>
        </p>
        <p>
          <span className="text-panel-muted">当前空速</span> V = {v.toFixed(0)} m/s
          <span className="ml-2 text-panel-muted">
            {v < model.vStall ? '低于失速速度 → 慢速失速风险' : '高于失速速度'}
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
