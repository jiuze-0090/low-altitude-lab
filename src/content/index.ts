import type { Chapter, Experiment, KnowledgePoint, SiteMeta } from '@/types/content'

import { e1LiftOrigin } from './experiments/e1-lift-origin'
import { e2SpeedRatio } from './experiments/e2-speed-ratio'
import { e3AlphaStall } from './experiments/e3-alpha-stall'
import { e4CgStability } from './experiments/e4-cg-stability'
import { e5ControlSurfaces } from './experiments/e5-control-surfaces'
import { e6MultirotorYaw } from './experiments/e6-multirotor-yaw'
import { e7ClimbPerformance } from './experiments/e7-climb-performance'
import { m1AltitudeLie } from './experiments/m1-altitude-lie'
import { m2WindCorrection } from './experiments/m2-wind-correction'

import { aeroPoints } from './knowledge-points/aero'
import { stabilityPoints } from './knowledge-points/stability'
import { multirotorPoints } from './knowledge-points/multirotor'
import { envPoints } from './knowledge-points/env'
import { performancePoints } from './knowledge-points/performance'

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
  hotline: ['15610090090', '19806112859'],
  gzhName: '新字节航空',
  gzhQr: '/images/gzh-qrcode.png',
}

export const chapters: Chapter[] = [
  {
    id: 'ch-aero',
    order: 1,
    title: '气动与飞行原理',
    intro: '空气为什么能托住飞机，飞行器为什么能操纵。这是最核心、也最该动手拧参数的一章。',
    knowledgePointIds: [
      'kp-lift-equation',
      'kp-bernoulli-scope',
      'kp-lift-direction',
      'kp-drag-power',
      'kp-lift-drag-ratio',
      'kp-drag-decomposition',
      'kp-alpha-definition',
      'kp-critical-alpha-stall',
      'kp-stall-recovery',
      'kp-ice-contamination',
    ],
    experimentIds: ['e1-lift-origin', 'e2-speed-ratio', 'e3-alpha-stall'],
  },
  {
    id: 'ch-stability',
    order: 2,
    title: '重量·平衡·安定性',
    intro: '力要平衡，飞机才不乱转。重心前移一寸，手上的杆量就变一个量级。',
    knowledgePointIds: [
      'kp-weight-balance',
      'kp-static-stability',
      'kp-control-surfaces',
      'kp-trim-and-balance',
    ],
    experimentIds: ['e4-cg-stability', 'e5-control-surfaces'],
  },
  {
    id: 'ch-multirotor',
    order: 3,
    title: '多旋翼与动力系统',
    intro: '四个电机怎么配合出前进、后退和偏航。桨的反扭矩是最反直觉的一节。',
    knowledgePointIds: ['kp-multirotor-torque', 'kp-multirotor-prop-forces'],
    experimentIds: ['e6-multirotor-yaw'],
  },
  {
    id: 'ch-env',
    order: 4,
    title: '气象与飞行环境',
    intro: '起飞前抬头看的那一眼。题库里占比最大的一章，也是最容易被做成"背定义"的一章。',
    knowledgePointIds: [
      'kp-pressure-altitude',
      'kp-density-altitude',
      'kp-standard-atmosphere',
      'kp-wind-vector',
      'kp-wind-direction',
      'kp-crosswind-correction',
      'kp-wind-performance',
    ],
    experimentIds: ['m2-wind-correction', 'm1-altitude-lie'],
  },
  {
    id: 'ch-performance',
    order: 5,
    title: '飞行性能与航迹',
    intro: '爬升有多快、航程能多远、失速速度是多少。把数字和手感对上。',
    knowledgePointIds: ['kp-climb-performance', 'kp-glide-range'],
    experimentIds: ['e7-climb-performance'],
  },
]

/** 知识点（按章节顺序排列，前后篇导航依此串读）*/
export const knowledgePoints: KnowledgePoint[] = [
  ...aeroPoints,
  ...stabilityPoints,
  ...multirotorPoints,
  ...envPoints,
  ...performancePoints,
]

export const experiments: Experiment[] = [
  e1LiftOrigin,
  e2SpeedRatio,
  e3AlphaStall,
  e4CgStability,
  e5ControlSurfaces,
  e6MultirotorYaw,
  e7ClimbPerformance,
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

/** sitemap 条目 */
export type SitemapEntry = {
  path: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: string
}

/**
 * 构建期 sitemap 的 URL 清单
 * ---------------------------------------------------------------------------
 * 由 vite 插件通过 SSR 加载本模块取用——URL 直接从内容数据推导，
 * 不会出现"内容加了但 sitemap 漏加"的情况。
 */
export function sitemapUrls(): SitemapEntry[] {
  const staticPages: SitemapEntry[] = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/principles', changefreq: 'weekly', priority: '0.9' },
    { path: '/labs', changefreq: 'weekly', priority: '0.9' },
    { path: '/cheatsheets', changefreq: 'monthly', priority: '0.8' },
    { path: '/exam', changefreq: 'weekly', priority: '0.8' },
    { path: '/tools', changefreq: 'monthly', priority: '0.7' },
    { path: '/guides', changefreq: 'monthly', priority: '0.7' },
    { path: '/about', changefreq: 'monthly', priority: '0.5' },
  ]

  const chapterPages: SitemapEntry[] = chapters.map((c) => ({
    path: `/principles/${c.id}`,
    changefreq: 'monthly',
    priority: '0.8',
  }))

  const pointPages: SitemapEntry[] = knowledgePoints.map((k) => ({
    path: `/points/${k.id}`,
    changefreq: 'monthly',
    priority: '0.6',
  }))

  const labPages: SitemapEntry[] = experiments.map((e) => ({
    path: `/labs/${e.slug}`,
    changefreq: 'monthly',
    priority: '0.9',
  }))

  return [...staticPages, ...chapterPages, ...pointPages, ...labPages]
}
