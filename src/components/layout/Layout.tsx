import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

/**
 * 全站骨架
 * ---------------------------------------------------------------------------
 * · 跳转后回到顶部（锚点跳转除外）
 * · 每页独立 title / description 由各 Page 自行设置
 */
export default function Layout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return // 锚点跳转交给浏览器
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col">
      {/* 主题画布层（渐变背景，固定在视口底层） */}
      <div className="app-canvas" aria-hidden="true" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        跳到主要内容
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
