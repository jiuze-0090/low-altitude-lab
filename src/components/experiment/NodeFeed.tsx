import { createContext, useContext, useEffect, useMemo } from 'react'
import { X, Zap } from 'lucide-react'

import type { ExperimentNode } from '@/types/content'

/**
 * 节点通道（Node Channel）
 * ---------------------------------------------------------------------------
 * 实验室的第二条交互通道：
 *   第一条 = 拖参数看数字变（被动，用户自己找规律）
 *   第二条 = 跨过临界的那一刻，教员在旁边说一句话（主动，把规律递到手边）
 *
 * 机制：
 *   1. 实验组件在渲染后调用 useNodeSignal(signal, active) 上报物理状态；
 *   2. 画布在每次渲染后比对上一帧快照，检测「上升沿」（假 → 真）；
 *   3. 上升沿触发时把对应节点压入队列，NodeFeed 逐条展示；
 *   4. 队列里同一个节点只留一条，退出并再次越界可以重新触发。
 *
 * 为什么要「上升沿」而不是「状态为真就显示」：
 *   停在临界点不动时，提示会一直杵在画面上，反而挡住读数。
 *   越界的那一刻说一次，之后你继续拖它就闭嘴。
 *
 * 物理判据只写在实验组件里（useNodeSignal 的 active 参数），
 * 内容层只负责「说什么」——文案、教员口吻、挂哪个题号。
 * 这样不会出现「内容层抄了一份模型，两边口径漂移」的问题。
 */

/** 信号名 → 是否成立 */
export type SignalMap = Record<string, boolean>

interface NodeContextValue {
  /** 上报一个物理信号当前是否成立 */
  report: (signal: string, active: boolean) => void
}

export const NodeContext = createContext<NodeContextValue | null>(null)

/**
 * 实验组件内使用：上报物理状态
 * ---------------------------------------------------------------------------
 * 必须在组件顶层调用（hook 规则）。示例：
 *
 *   const stalled = alpha > critAlpha
 *   useNodeSignal('stall', stalled)
 *
 * 传进去的 active 必须是「由物理量算出来的结论」，
 * 不是「用户拖到了哪个位置」——否则触发时机与真实物理脱节。
 */
export function useNodeSignal(signal: string, active: boolean) {
  const ctx = useContext(NodeContext)

  useEffect(() => {
    ctx?.report(signal, active)
  }, [ctx, signal, active])
}

/** 已触发节点在队列中的条目 */
export interface FiredNode {
  /** 节点 id */
  id: string
  /** 节点定义 */
  node: ExperimentNode
}

/** 语气 → 强调色（面板深底上用 panel 系列色，三套主题下都可读） */
const TONE_COLOR: Record<NonNullable<ExperimentNode['tone']>, string> = {
  info: 'var(--c-panel-accent)',
  ok: 'var(--c-panel-ok)',
  warn: 'var(--c-panel-warn)',
  bad: 'var(--c-panel-bad)',
}

/**
 * 节点提示条
 * ---------------------------------------------------------------------------
 * 位置：实验面板内、控制条**下方**——不遮挡画面读数，也不遮挡公式区。
 * 为什么不做浮层：
 *   浮在画面上会挡住曲线标注与公式推演（E3 的公式条占满面板底部）；
 *   插在控制条上方会让滑块整体下移，用户拖到一半找不到手柄。
 *   放在控制条下方，滑块与读数都不动，只是面板变高一点。
 *
 * 一次只显示一条，关闭后自动接下一条。
 * aria-live=polite：读屏软件会念出新出现的提示，不打断当前操作。
 */
export default function NodeFeed({
  queue,
  onDismiss,
}: {
  queue: FiredNode[]
  onDismiss: (id: string) => void
}) {
  const current = queue[0]

  const style = useMemo(() => {
    if (!current) return null
    const color = TONE_COLOR[current.node.tone ?? 'info']
    return { borderLeftColor: color }
  }, [current])

  if (!current) return null

  return (
    <div className="border-t border-hairline bg-panel px-5 py-4" role="status" aria-live="polite">
      <div
        key={current.id}
        className="animate-fade-up rounded-md border border-l-[3px] border-panel-line bg-panel-raised px-4 py-3"
        style={style ?? undefined}
      >
        <div className="flex items-start gap-3">
          <Zap size={15} className="mt-0.5 shrink-0 text-panel-accent" aria-hidden="true" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xs font-bold text-panel-text">{current.node.title}</span>
              {current.node.examRef && (
                <span className="tnum rounded bg-panel px-1.5 py-0.5 text-2xs font-semibold text-panel-muted">
                  题 {current.node.examRef}
                </span>
              )}
              {queue.length > 1 && (
                <span className="text-2xs text-panel-muted">还有 {queue.length - 1} 条待看</span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-panel-muted">{current.node.say}</p>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(current.id)}
            className="-mr-1 -mt-1 shrink-0 rounded p-1 text-panel-muted transition-colors hover:bg-panel hover:text-panel-text"
            aria-label="关闭这条提示"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
