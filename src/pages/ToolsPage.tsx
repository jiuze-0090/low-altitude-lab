import { useEffect, useMemo, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Calculator } from 'lucide-react'

import PageHeader from '@/components/ui/PageHeader'
import { siteMeta } from '@/content'
import { calculatorMeta } from '@/content/resources'

/**
 * 高频计算器
 * ---------------------------------------------------------------------------
 * 四个考试与实飞都绕不开的计算：密度高度、失速速度、风修正角、爬升率。
 * 口径与站内实验（E4/E7/M1/M2）完全一致，同一组参数在两处应当算出同一个数。
 */

/* ── 物理常量与共用函数 ─────────────────────────────────────────────── */

const T0 = 288.15
const P0 = 1013.25
const LAPSE = 0.0065
const G = 9.80665
const R = 287.05
const K_EXP = G / (R * LAPSE)
const RHO0 = 1.225

const isaPressure = (h: number) => P0 * Math.pow(1 - (LAPSE * h) / T0, K_EXP)
const isaTemp = (h: number) => T0 - LAPSE * h
const isaDensity = (h: number) =>
  ((P0 * 100) / (R * T0)) * Math.pow(1 - (LAPSE * h) / T0, K_EXP - 1)

function densityAltitude(rho: number) {
  let lo = -2000
  let hi = 8000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (isaDensity(mid) > rho) lo = mid
    else hi = mid
  }
  // 二分收敛后 lo/hi 会落在 0 两侧，差之毫厘即为 -0.5 m 级别；
  // 海平面标准密度时结果应为 0，归一化掉负零避免出现「-0m」。
  const h = (lo + hi) / 2
  return Math.abs(h) < 0.5 ? 0 : h
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/* ── 组件 ────────────────────────────────────────────────────────────── */

export default function ToolsPage() {
  useEffect(() => {
    document.title = siteMeta.titleTemplate.replace('%s', '高频计算器')
    const tag = document.querySelector('meta[name="description"]')
    if (tag)
      tag.setAttribute(
        'content',
        '密度高度、失速速度、风修正角、爬升率——四个高频计算器，口径与站内实验完全一致。',
      )
  }, [])

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="工具"
        title="高频计算器"
        description="四个考试与实飞都绕不开的计算。口径与站内实验完全一致——同一组参数，在计算器和实验里应当算出同一个数。"
      />

      <div className="shell flex flex-col gap-6 py-8 sm:py-10">
        {calculatorMeta.map((c) => {
          const Calc = CALC_COMPONENTS[c.id]
          return <Calc key={c.id} title={c.title} />
        })}

        <p className="border-t border-hairline pt-5 text-xs leading-relaxed text-ink-muted">
          计算器用于快速估算与自查，正式的性能计算以飞行手册与机务数据为准。
          推导过程见{' '}
          <Link to="/principles" className="text-primary-text underline underline-offset-2">
            原理目录
          </Link>{' '}
          与{' '}
          <Link to="/labs" className="text-primary-text underline underline-offset-2">
            实验室
          </Link>
          。
        </p>
      </div>
    </div>
  )
}

/* ── 通用输入 / 输出 ─────────────────────────────────────────────────── */

function Field({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
}: {
  label: string
  unit?: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between gap-2 text-xs font-medium text-ink-soft">
        <span>{label}</span>
        <span className="tnum text-sm font-bold text-primary-ink">
          {value}
          {unit && <span className="ml-0.5 text-2xs font-normal text-ink-muted">{unit}</span>}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-pill bg-hairline accent-[var(--c-primary)]"
      />
      {hint && <span className="text-2xs text-ink-muted">{hint}</span>}
    </label>
  )
}

function NumInput({
  label,
  unit,
  value,
  onChange,
  step = 1,
  hint,
}: {
  label: string
  unit?: string
  value: number
  onChange: (v: number) => void
  step?: number
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-soft">
        {label}
        {unit && <span className="ml-1 text-2xs text-ink-muted">({unit})</span>}
      </span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tnum rounded-md border border-hairline bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus-visible:shadow-focus"
      />
      {hint && <span className="text-2xs text-ink-muted">{hint}</span>}
    </label>
  )
}

function Result({
  label,
  value,
  unit,
  tone = 'ok',
}: {
  label: string
  value: string
  unit?: string
  tone?: 'ok' | 'bad' | 'warn' | 'info'
}) {
  const color =
    tone === 'bad'
      ? 'text-panel-bad'
      : tone === 'warn'
        ? 'text-panel-warn'
        : tone === 'info'
          ? 'text-panel-accent'
          : 'text-panel-ok'
  return (
    <div className="rounded-md border border-panel-line bg-panel-raised px-3 py-2">
      <p className="text-2xs uppercase tracking-wider text-panel-muted">{label}</p>
      <p className={`tnum mt-0.5 text-base font-bold leading-none ${color}`}>
        {value}
        {unit && <span className="ml-1 text-2xs font-normal text-panel-muted">{unit}</span>}
      </p>
    </div>
  )
}

function CalcShell({
  id,
  title,
  desc,
  inputs,
  results,
  note,
}: {
  id: string
  title: string
  desc: string
  inputs: ReactNode
  results: ReactNode
  note?: string
}) {
  return (
    <section id={id} className="card scroll-mt-32 overflow-hidden">
      <div className="flex items-start gap-3 border-b border-hairline bg-canvas px-5 py-4">
        <Calculator size={16} className="mt-0.5 shrink-0 text-primary-text" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink-muted">{desc}</p>
        </div>
      </div>
      <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-3.5">{inputs}</div>
        <div className="grid grid-cols-2 gap-2 self-start">{results}</div>
      </div>
      {note && (
        <p className="border-t border-hairline bg-canvas px-5 py-3 text-2xs leading-relaxed text-ink-muted">
          {note}
        </p>
      )}
    </section>
  )
}

/* ── 1. 密度高度 ─────────────────────────────────────────────────────── */

function DensityAltitudeCalc({ title }: { title: string }) {
  const [realAlt, setRealAlt] = useState(1200)
  const [fieldP, setFieldP] = useState(1013)
  const [qnh, setQnh] = useState(1013)
  const [tempDev, setTempDev] = useState(12)

  const m = useMemo(() => {
    const tGround = T0 + tempDev
    const tHere = T0 - LAPSE * realAlt + tempDev
    const pMeasured = fieldP * Math.pow(tHere / tGround, K_EXP)
    const hIndicated = (T0 / LAPSE) * (1 - Math.pow(pMeasured / qnh, 1 / K_EXP))
    const rhoReal = (pMeasured * 100) / (R * tHere)
    const rhoIsa = isaDensity(realAlt)
    const sigma = rhoReal / rhoIsa
    const da = densityAltitude(rhoReal)
    return {
      hIndicated,
      rhoReal,
      sigma,
      da,
      tasFactor: Math.sqrt(sigma),
      distFactor: 1 / sigma,
      climbFactor: sigma,
    }
  }, [realAlt, fieldP, qnh, tempDev])

  return (
    <CalcShell
      id="calc-da"
      title={title}
      desc="气压高度不等于真实高度，真实高度也不等于密度高度。高原高温时三者能差出上千米——性能计算必须用密度高度。"
      inputs={
        <>
          <NumInput label="真实高度" unit="m" value={realAlt} onChange={setRealAlt} step={10} />
          <NumInput label="当地海平面气压" unit="hPa" value={fieldP} onChange={setFieldP} step={1} />
          <NumInput label="高度表设定气压 QNH" unit="hPa" value={qnh} onChange={setQnh} step={1} />
          <Field
            label="温度偏差 ΔT（相对标准）"
            unit="℃"
            value={tempDev}
            onChange={setTempDev}
            min={-25}
            max={35}
            step={1}
          />
        </>
      }
      results={
        <>
          <Result label="高度表指示高度" value={m.hIndicated.toFixed(0)} unit="m" tone="info" />
          <Result label="真实高度" value={realAlt.toFixed(0)} unit="m" />
          <Result
            label="密度高度 DA"
            value={m.da.toFixed(0)}
            unit="m"
            tone={m.da > realAlt + 300 ? 'bad' : m.da > realAlt + 100 ? 'warn' : 'ok'}
          />
          <Result label="密度比 σ" value={m.sigma.toFixed(3)} />
          <Result label="真空速修正 ×√σ" value={m.tasFactor.toFixed(3)} unit="×" />
          <Result label="起降距离修正 ×1/σ" value={m.distFactor.toFixed(2)} unit="×" tone="warn" />
          <Result label="爬升率修正 ×σ" value={m.climbFactor.toFixed(3)} unit="×" tone="warn" />
          <Result label="空气密度 ρ" value={m.rhoReal.toFixed(3)} unit="kg/m³" />
        </>
      }
      note="高度表读数误差 = 指示高度 − 真实高度；密度高度与真实高度之差反映「冷空气沉、暖空气升」的实际影响。温度偏高时密度高度高于海拔，性能比按海拔算的更差。"
    />
  )
}

/* ── 2. 失速速度 ─────────────────────────────────────────────────────── */

function StallSpeedCalc({ title }: { title: string }) {
  const [mass, setMass] = useState(12)
  const [area, setArea] = useState(0.35)
  const [clmax, setClmax] = useState(1.5)
  const [alt, setAlt] = useState(0)
  const [bank, setBank] = useState(0)
  const [flap, setFlap] = useState(0)

  const m = useMemo(() => {
    const rho = isaDensity(alt)
    const cl = flap > 0 ? clmax * 1.25 : clmax
    const W = mass * G
    const vs = Math.sqrt((2 * W) / (rho * area * cl))
    const n = 1 / Math.cos((bank * Math.PI) / 180)
    const vsBank = vs * Math.sqrt(n)
    const altFactor = Math.sqrt(RHO0 / rho)
    return { rho, cl, vs, vsBank, n, altFactor }
  }, [mass, area, clmax, alt, bank, flap])

  return (
    <CalcShell
      id="calc-vs"
      title={title}
      desc="失速速度只由重量、密度、翼面积和最大升力系数决定——跟姿态无关，但跟坡度和襟翼有关。"
      inputs={
        <>
          <NumInput label="重量" unit="kg" value={mass} onChange={setMass} step={0.5} />
          <NumInput label="机翼参考面积 S" unit="m²" value={area} onChange={setArea} step={0.01} />
          <Field
            label="最大升力系数 C_Lmax"
            value={clmax}
            onChange={setClmax}
            min={0.8}
            max={2.2}
            step={0.05}
            hint="纯翼型约 1.4～1.6，放襟翼可到 1.8 以上"
          />
          <Field label="高度" unit="m" value={alt} onChange={setAlt} min={0} max={5000} step={100} />
          <Field label="转弯坡度" unit="°" value={bank} onChange={setBank} min={0} max={60} step={5} />
          <Field label="襟翼" unit="" value={flap} onChange={setFlap} min={0} max={1} step={1} hint="放下后 C_Lmax 按 1.25 倍估" />
        </>
      }
      results={
        <>
          <Result label="1 g 失速速度" value={m.vs.toFixed(1)} unit="m/s" tone="info" />
          <Result label={`${bank}° 坡度下失速速度`} value={m.vsBank.toFixed(1)} unit="m/s" tone="warn" />
          <Result label="载荷因子 n" value={m.n.toFixed(2)} />
          <Result label="空气密度 ρ" value={m.rho.toFixed(3)} unit="kg/m³" />
          <Result label="实际 C_Lmax" value={m.cl.toFixed(2)} />
          <Result
            label="高度修正系数"
            value={m.altFactor.toFixed(3)}
            unit="×"
          />
        </>
      }
      note="Vs = √(2W / ρSC_Lmax)。载重增加 → 失速速度增大（341）；坡度增大 → 载荷因子增大 → 失速速度增大（213）；放下襟翼 → 失速速度减小（183）；高度升高 → 密度下降 → 失速速度增大。"
    />
  )
}

/* ── 3. 风修正角 ─────────────────────────────────────────────────────── */

function WindCorrectionCalc({ title }: { title: string }) {
  const [tas, setTas] = useState(20)
  const [wind, setWind] = useState(10)
  const [theta, setTheta] = useState(90)

  const m = useMemo(() => {
    const rad = (theta * Math.PI) / 180
    const head = wind * Math.cos(rad)
    const cross = wind * Math.sin(rad)
    const solvable = Math.abs(cross) <= tas
    const wca = solvable ? Math.asin(cross / tas) * (180 / Math.PI) : null
    const gsCorrected = solvable
      ? Math.sqrt(Math.max(0, tas * tas - cross * cross)) - head
      : null
    const drift = Math.atan2(cross, tas - head) * (180 / Math.PI)
    const gsUncorrected = Math.sqrt(tas * tas + wind * wind)
    return { head, cross, solvable, wca, gsCorrected, drift, gsUncorrected }
  }, [tas, wind, theta])

  return (
    <CalcShell
      id="calc-wind"
      title={title}
      desc="机头该比航迹偏多少度？注意修正角和不修正时的漂移角是两个不同的量，长得像，别混。"
      inputs={
        <>
          <Field label="空速 TAS" unit="m/s" value={tas} onChange={setTas} min={8} max={50} step={1} />
          <Field label="风速" unit="m/s" value={wind} onChange={setWind} min={0} max={30} step={1} />
          <Field
            label="风向（相对目标航向）"
            unit="°"
            value={theta}
            onChange={setTheta}
            min={-180}
            max={180}
            step={5}
            hint="0° 正顶风，90° 右侧风，180° 正顺风"
          />
        </>
      }
      results={
        <>
          <Result label="顶风分量" value={m.head.toFixed(1)} unit="m/s" />
          <Result label="侧风分量" value={m.cross.toFixed(1)} unit="m/s" />
          <Result
            label="航向修正角 WCA"
            value={m.solvable ? m.wca!.toFixed(1) : '无解'}
            unit={m.solvable ? '°' : ''}
            tone={m.solvable ? 'info' : 'bad'}
          />
          <Result
            label="修正后地速"
            value={m.solvable ? m.gsCorrected!.toFixed(1) : '—'}
            unit={m.solvable ? 'm/s' : ''}
          />
          <Result label="不修正时漂移角" value={m.drift.toFixed(1)} unit="°" tone="warn" />
          <Result label="不修正时地速" value={m.gsUncorrected.toFixed(1)} unit="m/s" />
          <Result
            label="修正损失地速"
            value={
              m.solvable
                ? (m.gsUncorrected - m.gsCorrected!).toFixed(1)
                : '—'
            }
            unit={m.solvable ? 'm/s' : ''}
            tone="warn"
          />
          <Result label="修正方法" value={m.solvable ? '改变航向法' : '只能用侧滑法'} tone="info" />
        </>
      }
      note="WCA = arcsin(侧风分量 / 空速)。侧风分量大于空速时无解——没有任何航向能修正它，只能用侧滑法（固定翼）。修正航向会让地速下降，侧风着陆要提前减速。"
    />
  )
}

/* ── 4. 爬升率 ───────────────────────────────────────────────────────── */

function ClimbRateCalc({ title }: { title: string }) {
  const [alt, setAlt] = useState(0)
  const [tempDev, setTempDev] = useState(0)
  const [mass, setMass] = useState(12)
  const [v, setV] = useState(22)
  const [thrust, setThrust] = useState(62)

  const m = useMemo(() => {
    const rhoReal = (isaPressure(alt) * 100) / (R * (isaTemp(alt) + tempDev))
    const S = 0.35
    const AR = 7
    const CD0 = 0.035
    const W = mass * G
    const q = 0.5 * rhoReal * v * v
    const cl = W / (q * S)
    const cd = CD0 + (cl * cl) / (Math.PI * AR * 0.8)
    const d = q * S * cd
    const tAvail = thrust * (rhoReal / RHO0)
    const excess = tAvail - d
    const climb = (excess * v) / W
    const gamma = Math.asin(clamp(excess / W, -1, 1)) * (180 / Math.PI)
    const da = densityAltitude(rhoReal)
    const vs = Math.sqrt((2 * W) / (rhoReal * S * 1.5))
    return { rhoReal, cl, cd, d, tAvail, excess, climb, gamma, da, vs }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alt, tempDev, mass, v, thrust])

  return (
    <CalcShell
      id="calc-climb"
      title={title}
      desc="剩余推力除以重量。高度一升，空气一稀，推力掉得比阻力快，爬升率就往下走。"
      inputs={
        <>
          <Field label="高度" unit="m" value={alt} onChange={setAlt} min={0} max={5000} step={100} />
          <Field
            label="温度偏差 ΔT"
            unit="℃"
            value={tempDev}
            onChange={setTempDev}
            min={-20}
            max={30}
            step={1}
          />
          <NumInput label="重量" unit="kg" value={mass} onChange={setMass} step={0.5} />
          <Field label="地速" unit="m/s" value={v} onChange={setV} min={8} max={45} step={1} />
          <Field
            label="海平面全油门推力"
            unit="N"
            value={thrust}
            onChange={setThrust}
            min={20}
            max={140}
            step={1}
            hint="按机型手册填，模型里取 12 kg 机型约 62 N"
          />
        </>
      }
      results={
        <>
          <Result
            label="密度高度 DA"
            value={m.da.toFixed(0)}
            unit="m"
            tone={m.da > alt + 300 ? 'bad' : 'ok'}
          />
          <Result label="可用推力" value={m.tAvail.toFixed(1)} unit="N" />
          <Result label="阻力 D" value={m.d.toFixed(1)} unit="N" />
          <Result
            label="剩余推力 T − D"
            value={m.excess.toFixed(1)}
            unit="N"
            tone={m.excess > 0 ? 'ok' : 'bad'}
          />
          <Result
            label="爬升率"
            value={m.climb.toFixed(1)}
            unit="m/s"
            tone={m.excess > 0 ? 'info' : 'bad'}
          />
          <Result label="爬升角 γ" value={m.gamma.toFixed(1)} unit="°" />
          <Result label="当前 C_L" value={m.cl.toFixed(2)} />
          <Result
            label="失速速度 Vs"
            value={m.vs.toFixed(1)}
            unit="m/s"
            tone={v < m.vs ? 'bad' : 'ok'}
          />
        </>
      }
      note="爬升率 = (T − D)·V / W，爬升角 = arcsin((T − D)/W)（407）。注意：把速度调低，剩余推力会变大，但爬升率 = 剩余推力 × V / W 是乘 V 的——最优速度在两者之间。"
    />
  )
}

/* ── 计算器注册表 ─────────────────────────────────────────────────────── */

/**
 * calculatorMeta（src/content/resources.ts）是「本站有几个计算器」的唯一口径，
 * 这里只负责把 id 映射到组件，两者必须一一对应。
 */
const CALC_COMPONENTS: Record<string, ComponentType<{ title: string }>> = {
  'calc-da': DensityAltitudeCalc,
  'calc-vs': StallSpeedCalc,
  'calc-wind': WindCorrectionCalc,
  'calc-climb': ClimbRateCalc,
}
