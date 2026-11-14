import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Gauge } from 'lucide-react'

import ThemeSwitcher from '@/components/ui/ThemeSwitcher'

const NAV = [
  { to: '/principles', label: '原理目录' },
  { to: '/labs', label: '实验室' },
  { to: '/guides', label: '速查卡' },
  { to: '/about', label: '关于' },
]

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // 移动端抽屉打开时锁定滚动
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={`glass-bar sticky top-0 z-50 border-b transition-colors duration-200 ${
        scrolled ? 'border-hairline' : 'border-transparent'
      }`}
      style={{ height: 'var(--header-h)' }}
    >
      <div className="shell flex h-full items-center justify-between gap-4">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-md focus-visible:shadow-focus"
          aria-label="低空原理实验室 首页"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white"
            aria-hidden="true"
          >
            <Gauge size={18} strokeWidth={2.2} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-ink">
              低空原理实验室
            </span>
            <span className="mt-0.5 hidden text-2xs font-medium tracking-[0.14em] text-ink-muted sm:block">
              LOW-ALTITUDE LAB
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-soft text-primary-ink'
                    : 'text-ink-soft hover:bg-surface-hover hover:text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? '关闭菜单' : '打开菜单'}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-hairline bg-elevated px-4 py-3 md:hidden"
          aria-label="移动端导航"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors ${
                      isActive ? 'bg-primary-soft text-primary-ink' : 'text-ink-soft'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
