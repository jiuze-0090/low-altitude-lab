import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { cheatsheetCards } from '@/content/cheatsheets'
import { experiments, knowledgePoints } from '@/content'
import { calculatorMeta, countExamPoints } from '@/content/resources'

/**
 * 资源条
 * ---------------------------------------------------------------------------
 * 入口页顶部用一条数字带，把站内已有的重资产一次摊开：
 * 用户不用猜「这站有多少东西」，点数字直接跳到对应资产。
 * 数字来自内容层实时统计，不硬编码。
 */
export default function ResourceStrip() {
  const examRefs = experiments.flatMap((e) => e.examRefs)

  const items = [
    {
      to: '/labs',
      value: experiments.length,
      unit: '个',
      label: '交互实验',
      hint: '先猜一次，再看原理',
    },
    {
      to: '/principles',
      value: knowledgePoints.length,
      unit: '个',
      label: '知识点',
      hint: '六条主线串读',
    },
    {
      to: '/exam',
      value: countExamPoints(examRefs),
      unit: '条',
      label: '题库考点',
      hint: '每条挂真题号',
    },
    {
      to: '/cheatsheets',
      value: cheatsheetCards.length,
      unit: '张',
      label: '原理速查卡',
      hint: '可打印 A4',
    },
    {
      to: '/tools',
      value: calculatorMeta.length,
      unit: '个',
      label: '高频计算器',
      hint: '口径与实验一致',
    },
  ]

  return (
    <nav aria-label="站内资源速览">
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to}
              className="card group flex h-full flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover focus-visible:shadow-focus"
            >
              <span className="flex items-baseline gap-1">
                <span className="tnum text-2xl font-bold leading-none text-ink">{it.value}</span>
                <span className="text-xs font-medium text-ink-muted">{it.unit}</span>
              </span>
              <span className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary-text">
                {it.label}
                <ArrowRight
                  size={13}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </span>
              <span className="mt-0.5 text-2xs leading-relaxed text-ink-muted">{it.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
