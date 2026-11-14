import { useMemo } from 'react'

/**
 * M2 · 侧风修正（风三角）
 * ---------------------------------------------------------------------------
 * 演示：速度三角形（地速 = 空速 + 风速）、航向修正角 vs 漂移角的区别、
 *      侧风超过空速时航向修正失效的边界。
 *
 * 可调参数：风速 W、风向 θ（相对目标航向，0=正顶风 / 90=右侧风 / 180=正顺风）、
 *           空速 TAS。
 *
 * 教学要点（对应题库考点）：
 *   · 地速 = 空速 + 风速，矢量关系恒成立（1181/1477）
 *   · 航向修正角 WCA = arcsin(W_cross / TAS)（改变航向法）
 *   · 不修正时的漂移角 δ = arctan(W_cross / (TAS − W_head))，两者不是一回事
 *   · 修正航向会降低地速（把空速挪去抵消侧风）
 *   · |W_cross| > TAS 时无法修正，只能侧滑（923/860）
 *   · 气象风向指来向（566）
 */

const D = Math.PI / 180

interface Solution {
  /** 顶风分量（正 = 顶风，减小地速） */
  head: number
  /** 侧风分量（正 = 右侧风） */
  cross: number
  /** 航向修正角能否求解 */
  canCorrect: boolean
  /** 航向修正角（deg） */
  wca: number
  /** 改变航向法下的地速（沿目标航向），可为负 = 飞不过去 */
  gsCrab: number
  /** 不修正时航迹相对机头的偏角（deg） */
  drift: number
  /** 不修正时的地速模 */
  gsNoCrab: number
}

export function solveWind(W: number, thetaDeg: number, tas: number): Solution {
  const th = thetaDeg * D
  const head = W * Math.cos(th)
  const cross = W * Math.sin(th)
  const canCorrect = Math.abs(cross) <= tas
  const wca = canCorrect ? Math.asin(cross / tas) / D : 0
  const gsCrab = canCorrect ? Math.sqrt(tas * tas - cross * cross) - head : 0
  const along = tas - head
  const drift = Math.atan2(cross, along) / D
  const gsNoCrab = Math.hypot(along, cross)
  return { head, cross, canCorrect, wca, gsCrab, drift, gsNoCrab }
}

export default function M2WindCorrection({ values }: { values: Record<string, number> }) {
  const windSpeed = values.windSpeed ?? 10
  const windAngle = values.windAngle ?? 90
  const tas = values.tas ?? 20

  const s = useMemo(() => solveWind(windSpeed, windAngle, tas), [windSpeed, windAngle, tas])

  // ── 主图：速度三角形 ────────────────────────────────────────────────
  const OX = 170
  const OY = 192
  const SC = 1.9 // px per m/s

  /** 极坐标 → 屏幕坐标：以正上为 0°，顺时针（右偏）为正 */
  const polar = (aDeg: number, len: number) => ({
    x: OX + Math.sin(aDeg * D) * len,
    y: OY - Math.cos(aDeg * D) * len,
  })

  // 空速矢量方向 = 机头航向（修正后 = WCA；无法修正时 = 0，即不修正）
  const tasAngle = s.canCorrect ? s.wca : 0
  const A = polar(tasAngle, tas * SC) // 空速矢量末端
  const windAngleTo = windAngle + 180 // 风吹去的方向
  const B = {
    x: A.x + Math.sin(windAngleTo * D) * windSpeed * SC,
    y: A.y - Math.cos(windAngleTo * D) * windSpeed * SC,
  } // 地速矢量末端

  // 地速矢量：从 O 指向 B（修正构型下 B 恰在正上）
  const gsVecLen = Math.hypot(B.x - OX, B.y - OY)

  const windDesc =
    windAngle === 0
      ? '正顶风'
      : windAngle === 180 || windAngle === -180
        ? '正顺风'
        : windAngle === 90
          ? '正右风'
          : windAngle === -90
            ? '正左风'
            : windAngle > 0 && windAngle < 90
              ? `右前 ${windAngle}°`
              : windAngle > 90 && windAngle < 180
                ? `右后 ${180 - windAngle}°`
                : windAngle < 0 && windAngle > -90
                  ? `左前 ${-windAngle}°`
                  : `左后 ${180 + windAngle}°`

  return (
    <div className="flex flex-col gap-4">
      {/* 仪表读数 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Readout label="侧风分量" value={s.cross.toFixed(1)} unit="m/s" tone={Math.abs(s.cross) > tas ? 'bad' : 'info'} />
        <Readout label="顶风分量" value={s.head.toFixed(1)} unit="m/s" tone={s.head > 0 ? 'warn' : 'ok'} />
        <Readout
          label="航向修正角 WCA"
          value={s.canCorrect ? s.wca.toFixed(1) : '不可解'}
          unit={s.canCorrect ? '°' : undefined}
          tone={s.canCorrect ? 'ok' : 'bad'}
        />
        <Readout
          label="修正后地速"
          value={s.canCorrect ? s.gsCrab.toFixed(1) : '—'}
          unit={s.canCorrect ? 'm/s' : undefined}
          tone={s.canCorrect ? (s.gsCrab <= 0 ? 'bad' : 'ok') : 'bad'}
        />
        <Readout label="不修正漂移角 δ" value={s.drift.toFixed(1)} unit="°" tone="warn" />
        <Readout label="不修正地速" value={s.gsNoCrab.toFixed(1)} unit="m/s" tone="info" />
      </div>

      {/* 不可行提示 */}
      {!s.canCorrect && (
        <div
          role="alert"
          className="rounded-md border border-panel-bad bg-panel-raised px-4 py-3 text-sm text-panel-bad"
        >
          <strong className="font-bold">侧风 {Math.abs(s.cross).toFixed(1)} m/s 已超过空速 {tas} m/s</strong>
          <span className="ml-2 text-panel-text">
            航向修正角无解——你没有任何机头朝向能抵消这个侧风。固定翼上只能改用侧滑法（向侧风方向压杆 + 反扭舵）；
            无人机没有方向舵，只能靠电机差动配合坡度，且下降率会增大、目测容易偏低，要适当加油门修正。
          </span>
        </div>
      )}
      {s.canCorrect && s.gsCrab <= 0 && (
        <div
          role="alert"
          className="rounded-md border border-panel-warn bg-panel-raised px-4 py-3 text-sm text-panel-warn"
        >
          <strong className="font-bold">顶风过大，这个速度飞不到目标航向</strong>
          <span className="ml-2 text-panel-text">
            修正后沿目标航向的分量为 {s.gsCrab.toFixed(1)} m/s，已经在倒退。顶风风速接近或超过空速时，
            必须增速或改变航路。
          </span>
        </div>
      )}
      {s.canCorrect && s.gsCrab > 0 && s.gsCrab < tas * 0.2 && (
        <div
          role="alert"
          className="rounded-md border border-panel-warn bg-panel-raised px-4 py-3 text-sm text-panel-warn"
        >
          <strong className="font-bold">地速只剩 {s.gsCrab.toFixed(1)} m/s</strong>
          <span className="ml-2 text-panel-text">
            顶风已经吃掉绝大部分地速（空速 {tas} m/s 只换来 {s.gsCrab.toFixed(1)} m/s 的前进速度）。
            这时任何侧风修正都会让情况更糟——修正航向本身还要再削掉一部分地速。
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* ── 主图：速度三角形 ─────────────────────────────────────── */}
        <div className="rounded-md border border-panel-line bg-panel-raised p-3">
          <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
            速度三角形 · 地速 = 空速 + 风速
          </p>
          <svg
            viewBox="0 0 340 220"
            className="w-full"
            role="img"
            aria-label={`速度三角形。${windDesc}，风速 ${windSpeed} 米每秒，空速 ${tas} 米每秒。${
              s.canCorrect
                ? `航向修正角 ${s.wca.toFixed(1)} 度，修正后地速 ${s.gsCrab.toFixed(1)} 米每秒。`
                : '侧风超过空速，无法进行航向修正。'
            }`}
          >
            <defs>
              <marker id="m2-arrow-tas" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill="#8fd0ff" />
              </marker>
              <marker id="m2-arrow-wind" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill="#ffc46b" />
              </marker>
              <marker id="m2-arrow-gs" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill="#7fe0b0" />
              </marker>
            </defs>

            {/* 网格 */}
            <g opacity="0.16">
              {Array.from({ length: 6 }, (_, i) => (
                <line key={`gh${i}`} x1={OX - 120} y1={OY - i * 32} x2={OX + 120} y2={OY - i * 32} stroke="#8ba8ff" strokeWidth="0.5" />
              ))}
            </g>

            {/* 目标航向参考线 */}
            <line x1={OX} y1={OY} x2={OX} y2={OY - 178} stroke="#5f7fb5" strokeWidth="1" strokeDasharray="4 4" />
            <text x={OX + 6} y={OY - 172} fontSize="9" fill="#a8bcd6" fontFamily="monospace">
              目标航向（正北）
            </text>

            {/* 地速矢量（从 O 到 B） */}
            <line
              x1={OX}
              y1={OY}
              x2={B.x}
              y2={B.y}
              stroke="#7fe0b0"
              strokeWidth="2.4"
              markerEnd="url(#m2-arrow-gs)"
            />
            <text
              x={B.x + 8}
              y={B.y + 4}
              fontSize="9.5"
              fill="#7fe0b0"
              fontFamily="monospace"
              fontWeight="bold"
            >
              地速 {gsVecLen.toFixed(1)}
            </text>

            {/* 空速矢量（从 O 到 A） */}
            <line
              x1={OX}
              y1={OY}
              x2={A.x}
              y2={A.y}
              stroke="#8fd0ff"
              strokeWidth="2.4"
              markerEnd="url(#m2-arrow-tas)"
            />
            <text
              x={A.x + (A.x > OX ? 8 : -8)}
              y={A.y - 6}
              textAnchor={A.x > OX ? 'start' : 'end'}
              fontSize="9.5"
              fill="#8fd0ff"
              fontFamily="monospace"
              fontWeight="bold"
            >
              空速 {tas}
            </text>

            {/* 风矢量（从 A 到 B） */}
            {windSpeed > 0 && (
              <>
                <line
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke="#ffc46b"
                  strokeWidth="2.4"
                  markerEnd="url(#m2-arrow-wind)"
                />
                <text
                  x={(A.x + B.x) / 2 + (B.x - A.x >= 0 ? 8 : -8)}
                  y={(A.y + B.y) / 2 - 6}
                  textAnchor={B.x - A.x >= 0 ? 'start' : 'end'}
                  fontSize="9.5"
                  fill="#ffc46b"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  风 {windSpeed}
                </text>
              </>
            )}

            {/* 起点 */}
            <circle cx={OX} cy={OY} r="3" fill="#eaf1fa" />

            {/* 航向修正角弧（机头方向与目标航向之间） */}
            {s.canCorrect && Math.abs(s.wca) > 0.5 && (
              <>
                <path
                  d={arcPath(OX, OY, 34, 0, s.wca)}
                  fill="none"
                  stroke="#8fd0ff"
                  strokeWidth="1.4"
                />
                <text
                  x={OX + Math.sin(s.wca * D * 0.5) * 48}
                  y={OY - Math.cos(s.wca * D * 0.5) * 48 + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#8fd0ff"
                  fontFamily="monospace"
                >
                  WCA {s.wca.toFixed(1)}°
                </text>
              </>
            )}

            {/* 无法修正时：不修正构型的航迹角 */}
            {!s.canCorrect && (
              <>
                <path
                  d={arcPath(OX, OY, 34, 0, s.drift)}
                  fill="none"
                  stroke="#ffc46b"
                  strokeWidth="1.4"
                />
                <text
                  x={OX + Math.sin(s.drift * D * 0.5) * 50}
                  y={OY - Math.cos(s.drift * D * 0.5) * 50 + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#ffc46b"
                  fontFamily="monospace"
                >
                  漂移 {s.drift.toFixed(1)}°
                </text>
              </>
            )}

            {/* 风向标注 */}
            <text x={12} y={20} fontSize="9.5" fill="#a8bcd6" fontFamily="monospace">
              {windDesc}
            </text>
            <text x={12} y={34} fontSize="9" fill="#8ba8ff" fontFamily="monospace">
              蓝=空速 橙=风 绿=地速
            </text>
          </svg>
          <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
            三角形的闭合就是「地速 = 空速 + 风速」。把风矢量从空速末端接上，
            从起点直接连到终点就是地速——它必须落在目标航向上，否则就是没修正。
          </p>
        </div>

        {/* ── 副图：两种构型对比 ───────────────────────────────────── */}
        <div className="rounded-md border border-panel-line bg-panel-raised p-3">
          <p className="mb-1 text-2xs font-bold uppercase tracking-wider text-panel-muted">
            两种构型 · 机头 vs 航迹
          </p>
          <svg
            viewBox="0 0 340 150"
            className="w-full"
            role="img"
            aria-label={`两种修正方式对比。不修正时航迹偏 ${s.drift.toFixed(1)} 度；${
              s.canCorrect ? `改变航向法机头偏 ${s.wca.toFixed(1)} 度，航迹回到目标。` : '当前侧风过大，无法修正。'
            }`}
          >
            <defs>
              <marker id="m2-hd" markerWidth="6" markerHeight="6" refX="5" refY="2.5" orient="auto">
                <path d="M0,0 L5,2.5 L0,5 z" fill="#8fd0ff" />
              </marker>
              <marker id="m2-gs2" markerWidth="6" markerHeight="6" refX="5" refY="2.5" orient="auto">
                <path d="M0,0 L5,2.5 L0,5 z" fill="#7fe0b0" />
              </marker>
            </defs>

            {/* 左：不修正 */}
            <g transform="translate(85,120)">
              <text x="0" y="-92" textAnchor="middle" fontSize="9" fill="#ffc46b" fontFamily="monospace">
                不修正
              </text>
              <line x1="-34" y1="0" x2="34" y2="0" stroke="#5f7fb5" strokeWidth="0.8" opacity="0.5" />
              {/* 机头：正上 */}
              <line x1="0" y1="0" x2="0" y2="-34" stroke="#8fd0ff" strokeWidth="2" markerEnd="url(#m2-hd)" />
              <text x="-6" y="-38" fontSize="8" fill="#8fd0ff" fontFamily="monospace">
                机头
              </text>
              {/* 航迹：偏漂移角 */}
              {(() => {
                const a = s.drift
                const gx = Math.sin(a * D) * 46
                const gy = -Math.cos(a * D) * 46
                return (
                  <>
                    <line x1="0" y1="0" x2={gx} y2={gy} stroke="#7fe0b0" strokeWidth="2" markerEnd="url(#m2-gs2)" />
                    <path d={arcPath(0, 0, 22, 0, a)} fill="none" stroke="#ffc46b" strokeWidth="1.2" />
                    <text
                      x={Math.sin(a * D * 0.5) * 34}
                      y={-Math.cos(a * D * 0.5) * 34 + 4}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#ffc46b"
                      fontFamily="monospace"
                    >
                      δ {s.drift.toFixed(1)}°
                    </text>
                  </>
                )
              })()}
              <text x="0" y="16" textAnchor="middle" fontSize="8" fill="#a8bcd6" fontFamily="monospace">
                航迹跑偏
              </text>
            </g>

            {/* 分隔 */}
            <line x1="170" y1="16" x2="170" y2="134" stroke="#24374f" strokeWidth="1" />

            {/* 右：改变航向法 */}
            <g transform="translate(255,120)">
              <text x="0" y="-92" textAnchor="middle" fontSize="9" fill="#7fe0b0" fontFamily="monospace">
                改变航向法
              </text>
              <line x1="-34" y1="0" x2="34" y2="0" stroke="#5f7fb5" strokeWidth="0.8" opacity="0.5" />
              {/* 航迹：正上 */}
              <line x1="0" y1="0" x2="0" y2="-46" stroke="#7fe0b0" strokeWidth="2" markerEnd="url(#m2-gs2)" />
              <text x="6" y="-40" fontSize="8" fill="#7fe0b0" fontFamily="monospace">
                航迹
              </text>
              {/* 机头：偏 WCA */}
              {s.canCorrect && (
                <>
                  <line
                    x1="0"
                    y1="0"
                    x2={Math.sin(s.wca * D) * 34}
                    y2={-Math.cos(s.wca * D) * 34}
                    stroke="#8fd0ff"
                    strokeWidth="2"
                    markerEnd="url(#m2-hd)"
                  />
                  <path d={arcPath(0, 0, 22, 0, s.wca)} fill="none" stroke="#8fd0ff" strokeWidth="1.2" />
                  <text
                    x={Math.sin(s.wca * D * 0.5) * 34}
                    y={-Math.cos(s.wca * D * 0.5) * 34 + 4}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#8fd0ff"
                    fontFamily="monospace"
                  >
                    WCA {s.wca.toFixed(1)}°
                  </text>
                </>
              )}
              {!s.canCorrect && (
                <text x="0" y="-46" textAnchor="middle" fontSize="8" fill="#ff8b82" fontFamily="monospace">
                  无解
                </text>
              )}
              <text x="0" y="16" textAnchor="middle" fontSize="8" fill="#a8bcd6" fontFamily="monospace">
                航迹回正
              </text>
            </g>
          </svg>
          <p className="mt-1 text-2xs leading-relaxed text-panel-muted">
            <span className="text-panel-warn">两个角不一样</span>：
            左图是「什么都没做」时的漂移角 δ，右图是「扳回来」时的修正角 WCA。
            考试里最常错的就是把 δ 当成 WCA 用。
          </p>
        </div>
      </div>

      {/* 公式条 */}
      <div className="flex flex-col gap-1.5 rounded-md bg-panel-raised px-4 py-3 font-mono text-xs text-panel-text">
        <p>
          <span className="text-panel-muted">风分量</span> W_head = W·cosθ ={' '}
          <span className="text-panel-accent">{s.head.toFixed(1)}</span>，
          W_cross = W·sinθ = <span className="text-panel-accent">{s.cross.toFixed(1)}</span> m/s
          <span className="ml-2 text-panel-muted">{windDesc}，θ={windAngle}°</span>
        </p>
        <p>
          <span className="text-panel-muted">航向修正角</span> WCA = arcsin(W_cross/TAS) ={' '}
          <span className={s.canCorrect ? 'text-panel-ok' : 'text-panel-bad'}>
            {s.canCorrect ? `${s.wca.toFixed(2)}°` : '无解'}
          </span>
          <span className="ml-2 text-panel-muted">
            需 |W_cross| ≤ TAS（{tas}）
          </span>
        </p>
        <p>
          <span className="text-panel-muted">修正后地速</span> GS = √(TAS²−W_cross²)−W_head ={' '}
          <span className={s.gsCrab > 0 ? 'text-panel-ok' : 'text-panel-bad'}>
            {s.canCorrect ? `${s.gsCrab.toFixed(2)}` : '—'}
          </span>{' '}
          m/s
          <span className="ml-2 text-panel-muted">不修正时 = {s.gsNoCrab.toFixed(2)}</span>
        </p>
        <p>
          <span className="text-panel-muted">不修正漂移角</span> δ = arctan(W_cross/(TAS−W_head)) ={' '}
          <span className="text-panel-warn">{s.drift.toFixed(2)}°</span>
          <span className="ml-2 text-panel-muted">
            {s.canCorrect && Math.abs(s.wca - s.drift) > 0.3 ? '≠ WCA，别混用' : ''}
          </span>
        </p>
      </div>
    </div>
  )
}

/** 极坐标弧：以正上为 0°，顺时针为正 */
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = { x: cx + Math.sin(a0 * D) * r, y: cy - Math.cos(a0 * D) * r }
  const p1 = { x: cx + Math.sin(a1 * D) * r, y: cy - Math.cos(a1 * D) * r }
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  const sweep = a1 > a0 ? 1 : 0
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`
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
