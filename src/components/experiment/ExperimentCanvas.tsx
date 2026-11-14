import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'

import type { Control } from '@/types/content'

/**
 * 交互画布容器
 * ---------------------------------------------------------------------------
 * 负责：参数状态、可调控件的渲染与重置。
 * 具体的可视化由各实验组件通过 render 回调产出。
 */
export default function ExperimentCanvas({
  controls,
  render,
}: {
  controls: Control[]
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

  const dirty = controls.some((c) => values[c.id] !== c.value)

  return (
    <div>
      <div className="bg-panel">
        <div className="px-4 py-5 sm:px-6">{render(values)}</div>
      </div>

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
                onClick={() => setValues(initial)}
                className="inline-flex items-center gap-1 self-end rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
              >
                <RotateCcw size={13} aria-hidden="true" />
                复位
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
