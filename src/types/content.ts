/**
 * 内容数据模型（Content Schema）
 * ---------------------------------------------------------------------------
 * 全站内容以 JSON 承载，Markdown 仅用于「原理讲解正文」字段。
 * 编译期由 src/content/index.ts 统一导入，构建后不依赖任何运行时请求。
 */

/** 单个实验的预测题（每个实验的核心机制：先猜 → 揭晓 → 归因） */
export interface Prediction {
  /** 题干 */
  prompt: string
  /** 选项 id 与文案 */
  options: Array<{
    id: string
    text: string
    /** 该选项是否正确 */
    correct: boolean
    /** 选错时的即时反馈（可选） */
    wrongHint?: string
  }>
  /** 揭晓后的归因说明（Markdown，支持 $KaTeX$） */
  attribution: string
  /** 这条原理在实操中对应什么（Markdown） */
  stickControl?: string
}

/** 实验可调参数 */
export interface Control {
  id: string
  label: string
  /** 单位，显示在数值旁 */
  unit?: string
  min: number
  max: number
  step: number
  value: number
  /** 数值精度（小数位） */
  precision?: number
}

/** 可打印速查卡条目 */
export interface CheatsheetRow {
  term: string
  value: string
  note?: string
}

/** 实验室（交互实验） */
export interface Experiment {
  /** 唯一 id，如 e1-lift */
  id: string
  /** 路由短名 */
  slug: string
  /** 标题 */
  title: string
  /** 一句话钩子（用于卡片与分享文案） */
  hook: string
  /** 所属章节 id */
  chapterId: string
  /** 关联知识点 id 列表 */
  knowledgePointIds: string[]
  /** 实验组件 key（src/experiments/<key>/index.tsx 的导出名） */
  component: string
  /** 预测题 */
  prediction: Prediction
  /** 可调参数（由实验组件消费） */
  controls: Control[]
  /** 原理讲解正文（Markdown） */
  principle: string
  /** 速查卡 */
  cheatsheet: {
    title: string
    rows: CheatsheetRow[]
  }
  /** 对应题库考点（题库编号 + 简述），用于"这在考试里怎么问" */
  examRefs: Array<{ code: string; gist: string }>
  /** 关联的实飞经验 */
  fieldNote?: string
  /** 预计耗时（分钟），用于列表页 */
  minutes: number
}

/** 知识点 */
export interface KnowledgePoint {
  id: string
  title: string
  chapterId: string
  /** 所属实验 id（一个知识点对应一个主实验） */
  experimentId?: string
  /** 简述 */
  summary: string
  /** 详细讲解（Markdown） */
  body: string
  /** 公式（KaTeX），可多条 */
  formulas?: string[]
  /** 高频考法 */
  examAngles?: string[]
  /** 这在你手上是哪根杆：把原理落回学员的操作动作 */
  onYourStick?: string
}

/** 章节 */
export interface Chapter {
  id: string
  /** 章节序号 */
  order: number
  title: string
  /** 章节导语 */
  intro: string
  /** 本章知识点 id */
  knowledgePointIds: string[]
  /** 本章实验 id */
  experimentIds: string[]
}

/** 全站元信息 */
export interface SiteMeta {
  title: string
  titleTemplate: string
  description: string
  /** 机构署名（简称） */
  org: string
  /** 机构主体全称（工商登记名称） */
  orgFull: string
  /** 备案号占位（备案后回填） */
  icp?: string
}
