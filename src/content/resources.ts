/**
 * 站点资源统计
 * ---------------------------------------------------------------------------
 * 入口页用它把「本站能挖出多少东西」一次说清，避免用户误以为站点是空的。
 * 数字全部从内容层实时统计，不写死常量 —— 以后加实验、加考点，这里自动跟着变。
 */

/** 四个高频计算器（id 与 ToolsPage 中渲染的组件一一对应） */
export const calculatorMeta = [
  { id: 'calc-da', title: '密度高度换算' },
  { id: 'calc-vs', title: '失速速度换算' },
  { id: 'calc-wind', title: '风修正角（风三角）' },
  { id: 'calc-climb', title: '爬升率估算' },
]

/** 去重后的题库考点数（同一题可能被多个实验引用） */
export function countExamPoints(examRefs: ReadonlyArray<{ code: string }>) {
  return new Set(examRefs.map((r) => r.code)).size
}
