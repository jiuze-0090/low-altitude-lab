import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import Layout from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import DirectoryPage from '@/pages/DirectoryPage'
import ChapterPage from '@/pages/ChapterPage'
import KnowledgePointPage from '@/pages/KnowledgePointPage'
import LabIndexPage from '@/pages/LabIndexPage'
import ExperimentPage from '@/pages/ExperimentPage'
import GuidesPage from '@/pages/GuidesPage'
import CheatsheetsPage from '@/pages/CheatsheetsPage'
import ExamIndexPage from '@/pages/ExamIndexPage'
import ToolsPage from '@/pages/ToolsPage'
import AboutPage from '@/pages/AboutPage'
import NotFoundPage from '@/pages/NotFoundPage'

/**
 * 路由表
 * ---------------------------------------------------------------------------
 * 采用 history 模式（需在 EdgeOne Pages 配置 SPA 回退规则）。
 *
 *  /                       首页（实验室清单 + 预测入口）
 *  /principles             原理目录（章节总览，锚点分段）
 *  /principles/:chapterId  章节页（知识点列表 + 本章实验）
 *  /points/:pointId        知识点页（原理讲解 + 公式 + 关联实验）
 *  /labs                   实验室列表（全部实验，按章分组）
 *  /labs/:slug             实验室页（预测 → 揭晓 → 归因 → 速查卡）
 *  /guides                 规章速查卡（空域 / 高度 / 间隔 / 气象数字）
 *  /cheatsheets            原理速查卡（气动 / 稳定性 / 多旋翼 / 性能 / 公式）
 *  /exam                   考点索引（全部实验挂着的题号，可检索）
 *  /tools                  高频计算器（密度高度 / 失速速度 / 风修正角 / 爬升率）
 *  /about                  关于页
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'principles', element: <DirectoryPage /> },
      { path: 'principles/:chapterId', element: <ChapterPage /> },
      { path: 'points/:pointId', element: <KnowledgePointPage /> },
      { path: 'labs', element: <LabIndexPage /> },
      { path: 'labs/:slug', element: <ExperimentPage /> },
      { path: 'guides', element: <GuidesPage /> },
      { path: 'cheatsheets', element: <CheatsheetsPage /> },
      { path: 'exam', element: <ExamIndexPage /> },
      { path: 'tools', element: <ToolsPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
