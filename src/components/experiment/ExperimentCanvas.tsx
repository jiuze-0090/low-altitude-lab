import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'

import type { Control, ExperimentNode } from '@/types/content'
import NodeFeed, { NodeContext } from '@/components/experiment/NodeFeed'
import type { FiredNode, SignalMap } from '@/components/experiment/NodeFeed'

/**
 * 参数写入通道
 * ---------------------------------------------------------------------------
 * 实验组件默认只读 values（滑块是唯一入口）。但「拖拽操纵杆」这类交互需要
 * 组件反向写回参数——否则画面动了、失速节点却不触发（信号读的是 values）。
 * 用 Context 暴露 setter，避免改动实验组件注册表契约（仍是 ({values}) => ReactNode）。
 */
type SetValue = (id: string, value: number) => void
const ValuesContext = createContext<SetValue | null>(null)

/** 组件内取参数写入器；不在画布内调用时抛错，避免静默失效 */
export function useExperimentValues(): SetValue {
  const setValue = useContext(ValuesContext)
  if (!setValue) throw new Error('useExperimentValues 必须在 ExperimentCanvas 内使用')
  return setValue
}

/**
 * 交互画布容器
 * ---------------------------------------------------------------------------
 * 负责：参数状态、可调控件的渲染与重置。
 * 具体的可视化由各实验组件通过 render 回调产出。
 *
 * 同时承担「节点通道」的中枢：
 *   给实验组件提供 NodeContext（它们用 useNodeSignal 上报物理状态），
 *   每帧比对上一帧快照，检测上升沿并把节点压进队列，
 *   由 NodeFeed 逐条展示。
 */
export default function ExperimentCanvas({
  controls,
  nodes = [],
  render,
}: {
  controls: Control[]
  /** 本实验的节点定义（signal → 说什么） */
  nodes?: ExperimentNode[]
  render: (values: Record<string, number>) => ReactNode
}) {
  const initial = useMemo(() => {
    const v: Record<string, number> = {}
    controls.forEach((c) => {
      v[c.id] = c.value
    })
    return v
  }, [controls])

  const [values, setValues] = useState<Record<string, number>>(initial)

  useEffect(() => {
    setValues(initial)
  }, [initial])

  /** 组件反向写参数：按控件声明的 min/max/step 夹取，越界值不进状态 */
  const setValue = useCallback<SetValue>(
    (id, raw) => {
      const c = controls.find((x) => x.id === id)
      if (!c || !Number.isFinite(raw)) return
      const clamped = Math.min(c.max, Math.max(c.min, raw))
      const stepped = c.step > 0 ? Math.round(clamped / c.step) * c.step : clamped
      const snapped = Number(stepped.toFixed(4))
      setValues((prev) => (prev[id] === snapped ? prev : { ...prev, [id]: snapped }))
    },
    [controls],
  )

  const dirty = controls.some((c) => values[c.id] !== c.value)

  /* ── 节点通道 ────────────────────────────────────────────────────── */

  /** 实验组件上报的当前物理状态（signal → 是否成立） */
  const signalsRef = useRef<SignalMap>({})
  const [queue, setQueue] = useState<FiredNode[]>([])

  /** signal → 节点定义 */
  const nodeMap = useMemo(() => {
    const m = new Map<string, ExperimentNode>()
    nodes.forEach((n) => m.set(n.signal, n))
    return m
  }, [nodes])

  /**
   * 上升沿检测放在这里，而不是父组件的 effect 里
   * ---------------------------------------------------------------------------
   * 原因：子组件（useNodeSignal）与父组件（检测）的 effect 执行顺序，
   * 在不同 React 版本 / 更新路径下并不总是"子先父后"。
   * 放在 report 内部，检测与写入发生在同一次调用里，不依赖任何顺序假设。
   *
   * 规则：
   *   · 该 signal 首次上报 → 只建立基线，不触发（避免初始参数恰在临界区就响）
   *   · 由假变真（上升沿）→ 触发一次
   *   · 持续为真 → 不重复触发（提示不会一直杵在画面上）
   *   · 退回为假后再越界 → 可以重新触发
   */
  const report = useCallback(
    (signal: string, active: boolean) => {
      const isFirst = !(signal in signalsRef.current)
      const prev = signalsRef.current[signal]
      signalsRef.current[signal] = active

      if (isFirst) return
      if (!active || prev === active) return

      const node = nodeMap.get(signal)
      if (!node) return

      setQueue((q) => (q.some((x) => x.id === node.id) ? q : [...q, { id: node.id, node }]))
    },
    [nodeMap],
  )

  /** Context 值必须稳定，否则子组件的 report 副作用会被反复触发 */
  const ctxValue = useMemo(() => ({ report }), [report])

  const dismiss = useCallback((id: string) => {
    setQueue((q) => q.filter((x) => x.id !== id))
  }, [])

  return (
    <div>
      <NodeContext.Provider value={ctxValue}>
        <ValuesContext.Provider value={setValue}>
          <div className="bg-panel">
            <div className="px-4 py-5 sm:px-6">{render(values)}</div>
          </div>
        </ValuesContext.Provider>
      </NodeContext.Provider>

      {controls.length > 0 && (
        <div className="border-t border-hairline bg-surface px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            {controls.map((c) => (
              <div key={c.id} className="flex min-w-[180px] flex-1 flex-col gap-1.5">
                <label
                  htmlFor={`ctl-${c.id}`}
                  className="flex items-baseline justify-between gap-2 text-xs font-medium text-ink-soft"
                >
                  <span>{c.label}</span>
                  <span className="tnum text-sm font-bold text-primary-ink">
                    {values[c.id].toFixed(c.precision ?? 0)}
                    {c.unit && <span className="ml-0.5 text-2xs text-ink-muted">{c.unit}</span>}
                  </span>
                </label>
                <input
                  id={`ctl-${c.id}`}
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={values[c.id]}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [c.id]: Number(e.target.value) }))
                  }
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-pill bg-hairline accent-[var(--c-primary)]"
                  aria-valuetext={`${values[c.id]} ${c.unit ?? ''}`}
                />
              </div>
            ))}

            {dirty && (
              <button
                type="button"
                onClick={() => {
                  setValues(initial)
                  // 复位 = 重来一遍：清掉已触发的提示，
                  // 否则参数已经回到初始值，提示却还停在旧状态上，说服力全无。
                  //
                  // 注意：**不要**清空 signalsRef。
                  // 信号表是上升沿检测的基线，清掉后「状态没变化的信号」
                  // 重新上报时会被当成首次上报（只建基线不触发），
                  // 导致复位后再次越界时那条提示再也不响。
                  // 复位后信号自然回落（true→false），
                  // 再次越界自然形成新的上升沿，不需要额外处理。
                  setQueue([])
                }}
                className="inline-flex items-center gap-1 self-end rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
              >
                <RotateCcw size={13} aria-hidden="true" />
                复位
              </button>
            )}
          </div>
        </div>
      )}

      {/* 节点提示：放在控制条下方，不遮挡画面与滑块 */}
      <NodeFeed queue={queue} onDismiss={dismiss} />
    </div>
  )
}
