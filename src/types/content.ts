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

/**
 * 实验节点：模型跨越某个物理阈值时触发的一次性反馈
 * ---------------------------------------------------------------------------
 * 这是「动手验过的原理」的第二条通道：
 *   第一条 = 拖参数看数字变（被动）
 *   第二条 = 跨过临界的那一刻，有人在你旁边说一句话（主动）
 *
 * 设计约束：
 *   1. `signal` 是实验组件用 useNodeSignal 上报的物理状态名，
 *      **物理判据只存在于组件里**（避免内容层复制一份模型导致口径漂移）。
 *   2. 内容层只负责「说什么」——文案、教员口吻、挂哪个题号。
 *   3. 上升沿触发：信号由假变真时响一次；用户退回去再越界会重新响。
 */
export interface ExperimentNode {
  /** 唯一 id */
  id: string
  /** 触发信号名，与实验组件上报的 signal 对应 */
  signal: string
  /** 节点标题（短） */
  title: string
  /** 教员口吻的一句话 */
  say: string
  /** 关联题库编号（真实题号，便于回溯核对） */
  examRef?: string
  /** 语气 */
  tone?: 'info' | 'ok' | 'warn' | 'bad'
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
  /** 30 秒速览：先给结论、再给要点，用于首页速览层（交互实验放在第二层） */
  quickTake?: {
    /** 一句话结论 */
    conclusion: string
    /** 2~3 条要点 */
    points: string[]
  }
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
  /**
   * 节点：跨越物理阈值时触发的教员提示
   * 触发信号由实验组件上报，判据不写在这里（见 ExperimentNode 注释）
   */
  nodes?: ExperimentNode[]
  /** 关联的实飞经验（单段，向后兼容旧内容） */
  fieldNote?: string
  /** 关联的实飞经验（多条，每条一段教员口吻） */
  fieldNotes?: string[]
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
  /** 招生热线（对外公开咨询用） */
  hotline?: string[]
  /** 公众号名称 */
  gzhName?: string
  /** 公众号二维码图片（放在 public 下，替换图片即可，不改代码） */
  gzhQr?: string
}
