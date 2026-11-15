import type { Chapter, Experiment, KnowledgePoint, SiteMeta } from '@/types/content'

import { e1LiftOrigin } from './experiments/e1-lift-origin'
import { e2SpeedRatio } from './experiments/e2-speed-ratio'
import { e3AlphaStall } from './experiments/e3-alpha-stall'
import { m1AltitudeLie } from './experiments/m1-altitude-lie'
import { m2WindCorrection } from './experiments/m2-wind-correction'

/**
 * 全站内容入口
 * ---------------------------------------------------------------------------
 * 内容以 JSON/TS 管理，构建期静态导入 → 产物为纯静态文件，无运行时请求。
 * 全部实验数据来自题库实测（2026-11 全量 1968 题）。
 */

export const siteMeta: SiteMeta = {
  title: '低空原理实验室',
  titleTemplate: '%s · 低空原理实验室',
  description:
    '面向无人机驾驶员理论考试的交互式原理学习站。动手验过的原理，才叫懂——每条原理都标上这在你手上是哪根杆。',
  org: '新字节航空',
  orgFull: '山东新字节航空科技有限公司',
}

export const chapters: Chapter[] = [
  {
    id: 'ch-aero',
    order: 1,
    title: '气动与飞行原理',
    intro: '空气为什么能托住飞机，飞行器为什么能操纵。这是最核心、也最该动手拧参数的一章。',
    knowledgePointIds: [],
    experimentIds: ['e1-lift-origin', 'e2-speed-ratio', 'e3-alpha-stall'],
  },
  {
    id: 'ch-stability',
    order: 2,
    title: '重量·平衡·安定性',
    intro: '力要平衡，飞机才不乱转。重心前移一寸，手上的杆量就变一个量级。',
    knowledgePointIds: [],
    experimentIds: [],
  },
  {
    id: 'ch-multirotor',
    order: 3,
    title: '多旋翼与动力系统',
    intro: '四个电机怎么配合出前进、后退和偏航。桨的反扭矩是最反直觉的一节。',
    knowledgePointIds: [],
    experimentIds: [],
  },
  {
    id: 'ch-env',
    order: 4,
    title: '气象与飞行环境',
    intro: '起飞前抬头看的那一眼。题库里占比最大的一章，也是最容易被做成"背定义"的一章。',
    knowledgePointIds: [],
    experimentIds: ['m2-wind-correction', 'm1-altitude-lie'],
  },
  {
    id: 'ch-performance',
    order: 5,
    title: '飞行性能与航迹',
    intro: '爬升有多快、航程能多远、失速速度是多少。把数字和手感对上。',
    knowledgePointIds: [],
    experimentIds: [],
  },
]

export const knowledgePoints: KnowledgePoint[] = []

export const experiments: Experiment[] = [
  e1LiftOrigin,
  e2SpeedRatio,
  e3AlphaStall,
  m1AltitudeLie,
  m2WindCorrection,
]

/** 反查表 */
export const experimentById = new Map(experiments.map((e) => [e.id, e]))
export const experimentBySlug = new Map(experiments.map((e) => [e.slug, e]))
export const chapterById = new Map(chapters.map((c) => [c.id, c]))
export const knowledgePointById = new Map(knowledgePoints.map((k) => [k.id, k]))

/** 首页 / 目录页用的实验数量统计 */
export const experimentCount = experiments.length
export const knowledgePointCount = knowledgePoints.length
