import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import Layout from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import DirectoryPage from '@/pages/DirectoryPage'
import ChapterPage from '@/pages/ChapterPage'
import KnowledgePointPage from '@/pages/KnowledgePointPage'
import LabIndexPage from '@/pages/LabIndexPage'
import ExperimentPage from '@/pages/ExperimentPage'
import GuidesPage from '@/pages/GuidesPage'
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
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
