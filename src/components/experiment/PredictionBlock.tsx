import { useState } from 'react'
import { Check, X, Lightbulb, ArrowRight } from 'lucide-react'

import type { Prediction } from '@/types/content'
import Markdown, { InlineMd } from '@/components/formula/Markdown'

/**
 * 预测 → 揭晓 → 归因
 * ---------------------------------------------------------------------------
 * 全站核心交互机制。用户先在不知道答案的情况下做出选择，
 * 再揭晓正确结果并解释"为什么你猜错了"。
 * 这是本站与"调参数看变化"类科普站的根本差别。
 */
export default function PredictionBlock({
  prediction,
  /** 揭晓后是否展示"这在你手上是哪根杆" */
  showStickControl = true,
}: {
  prediction: Prediction
  showStickControl?: boolean
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const correctOption = prediction.options.find((o) => o.correct)
  const chosen = prediction.options.find((o) => o.id === selected)
  const isRight = !!chosen?.correct

  function handlePick(id: string) {
    if (revealed) return
    setSelected(id)
  }

  function handleReveal() {
    if (!selected) return
    setRevealed(true)
  }

  function handleReset() {
    setSelected(null)
    setRevealed(false)
  }

  return (
    <section
      aria-labelledby="prediction-heading"
      className="card overflow-hidden"
    >
      {/* ── 步骤 1：预测 ───────────────────────────────────────────── */}
      <div className="border-b border-hairline bg-primary-soft/40 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="chip chip-primary">第 1 步 · 先猜</span>
          {!revealed && <span className="text-2xs text-ink-muted">猜错才是这里的目的</span>}
        </div>
        <h2 id="prediction-heading" className="mt-3 text-lg font-bold text-ink">
          {prediction.prompt}
        </h2>
      </div>

      <div className="p-5 sm:p-6">
        {/* 选项 */}
        <fieldset>
          <legend className="sr-only">选择你认为正确的答案</legend>
          <ul className="flex flex-col gap-2.5">
            {prediction.options.map((opt) => {
              const picked = selected === opt.id
              const showAsCorrect = revealed && opt.correct
              const showAsWrong = revealed && picked && !opt.correct

              let cls =
                'flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-all duration-200'
              if (!revealed) {
                cls += picked
                  ? ' border-primary bg-primary-soft/60 shadow-focus'
                  : ' border-hairline bg-surface hover:border-border-strong hover:bg-canvas'
              } else if (showAsCorrect) {
                cls += ' border-ok bg-state-ok/10'
              } else if (showAsWrong) {
                cls += ' border-bad bg-state-bad/10'
              } else {
                cls += ' border-hairline bg-surface opacity-60'
              }

              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(opt.id)}
                    disabled={revealed}
                    aria-pressed={picked}
                    className={`${cls} focus-visible:shadow-focus disabled:cursor-default`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-2xs font-bold ${
                        showAsCorrect
                          ? 'border-ok bg-ok text-white'
                          : showAsWrong
                            ? 'border-bad bg-bad text-white'
                            : picked
                              ? 'border-primary bg-primary text-white'
                              : 'border-border-strong bg-surface'
                      }`}
                      aria-hidden="true"
                    >
                      {showAsCorrect ? (
                        <Check size={12} strokeWidth={3} />
                      ) : showAsWrong ? (
                        <X size={12} strokeWidth={3} />
                      ) : (
                        String.fromCharCode(65 + prediction.options.indexOf(opt))
                      )}
                    </span>

                    <span className="flex-1">
                      <span className="block text-[15px] leading-relaxed text-ink">
                        {opt.text}
                      </span>
                      {showAsWrong && opt.wrongHint && (
                        <span className="mt-1.5 block text-xs leading-relaxed text-bad">
                          <InlineMd text={opt.wrongHint} />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </fieldset>

        {/* 操作区 */}
        {!revealed ? (
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleReveal}
              disabled={!selected}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-hairline disabled:text-ink-muted"
            >
              揭晓答案
              <ArrowRight size={15} aria-hidden="true" />
            </button>
            {!selected && (
              <span className="text-xs text-ink-muted">先选一个再揭晓</span>
            )}
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-3">
            <span
              className={`chip ${isRight ? 'chip-neutral' : 'chip-accent'}`}
              style={
                isRight
                  ? { background: 'var(--c-ok-soft)', color: 'var(--c-ok)' }
                  : undefined
              }
            >
              {isRight ? '猜对了' : '猜错了'}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md px-2 py-1 text-xs font-medium text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
            >
              再猜一次
            </button>
          </div>
        )}

        {/* ── 步骤 2：揭晓 + 归因 ─────────────────────────────────── */}
        {revealed && (
          <div className="mt-6 animate-fade-up border-t border-hairline pt-6">
            <div className="flex items-center gap-2">
              <span className="chip chip-primary">第 2 步 · 揭晓</span>
              {!isRight && (
                <span className="text-2xs text-ink-muted">
                  正确答案是 {correctOption?.text}
                </span>
              )}
            </div>

            <div className="prose-lab mt-3">
              <Markdown content={prediction.attribution} />
            </div>

            {showStickControl && prediction.stickControl && (
              <div className="mt-5 rounded-md border border-accent/25 bg-accent-soft p-4">
                <div className="flex items-center gap-2 text-accent-ink">
                  <Lightbulb size={15} strokeWidth={2.2} aria-hidden="true" />
                  <span className="text-xs font-bold tracking-wide">这在你手上是哪根杆</span>
                </div>
                <div className="prose-lab mt-2 text-[15px]">
                  <Markdown content={prediction.stickControl} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
