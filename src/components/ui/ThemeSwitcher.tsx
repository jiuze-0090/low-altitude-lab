import { useEffect, useRef, useState } from 'react'
import { Check, Palette } from 'lucide-react'

/**
 * 背景主题切换器
 * ---------------------------------------------------------------------------
 * · 三套主题：brand 品牌深空（默认）/ bright 明朗 / night 夜间护眼
 * · 选择写入 localStorage，首屏由 index.html 内的引导脚本先行应用，避免闪白
 * · 打印前临时切到 bright，保证 A4 速查卡是白底黑字
 */

export type ThemeId = 'brand' | 'bright' | 'night'

export const THEME_STORAGE_KEY = 'lab-theme'

export const THEMES: {
  id: ThemeId
  label: string
  desc: string
  /** 色板预览（画在方块里，一眼看出差异）*/
  swatch: [string, string, string]
}[] = [
  {
    id: 'brand',
    label: '品牌深空',
    desc: '深蓝紫光晕，与官网同源',
    swatch: ['#1b2d58', '#845aee', '#8cbcff'],
  },
  {
    id: 'bright',
    label: '明朗',
    desc: '冷调浅色，白天阅读最亮',
    swatch: ['#fbfcff', '#dfe5ee', '#0b3d91'],
  },
  {
    id: 'night',
    label: '夜间护眼',
    desc: '近黑低对比，长看不刺眼',
    swatch: ['#0a0c0f', '#1b1e24', '#8fb0d4'],
  },
]

export const DEFAULT_THEME: ThemeId = 'brand'

export function isThemeId(v: unknown): v is ThemeId {
  return v === 'brand' || v === 'bright' || v === 'night'
}

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', id === 'bright' ? '#f2f6fd' : id === 'night' ? '#0a0c0f' : '#0c1a38')
  }
}

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<ThemeId>(DEFAULT_THEME)
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // 首次挂载时同步一次（引导脚本已把属性写上，这里只做状态回填）
  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-theme')
    if (isThemeId(attr)) setCurrent(attr)
  }, [])

  // 点击外部 / Esc 关闭
  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // 打印前切浅色，打印后还原
  useEffect(() => {
    const before = () => {
      const attr = document.documentElement.getAttribute('data-theme')
      applyTheme('bright')
      document.documentElement.setAttribute('data-theme-before-print', attr ?? DEFAULT_THEME)
    }
    const after = () => {
      const attr = document.documentElement.getAttribute('data-theme-before-print')
      applyTheme(isThemeId(attr) ? attr : DEFAULT_THEME)
      document.documentElement.removeAttribute('data-theme-before-print')
    }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [])

  const pick = (id: ThemeId) => {
    applyTheme(id)
    setCurrent(id)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, id)
    } catch {
      /* 隐私模式下 localStorage 不可写，忽略即可 */
    }
    setOpen(false)
    btnRef.current?.focus()
  }

  const active = THEMES.find((t) => t.id === current) ?? THEMES[0]

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`更换背景主题，当前：${active.label}`}
        title={`更换背景主题 · 当前：${active.label}`}
        className="flex h-9 items-center gap-1.5 rounded-md border border-hairline bg-surface px-2.5 text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
      >
        <Palette size={16} strokeWidth={2} aria-hidden="true" />
        <span className="hidden text-xs font-medium sm:inline">{active.label}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="背景主题"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-lg border border-hairline bg-elevated p-1.5 shadow-card-hover"
        >
          {THEMES.map((t) => {
            const isActive = t.id === current
            return (
              <button
                key={t.id}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => pick(t.id)}
                className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                  isActive ? 'bg-primary-soft' : 'hover:bg-surface-hover'
                }`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 overflow-hidden rounded-md border border-hairline"
                  aria-hidden="true"
                >
                  {t.swatch.map((c, i) => (
                    <span key={i} className="h-full flex-1" style={{ background: c }} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[13px] font-semibold ${
                      isActive ? 'text-primary-ink' : 'text-ink'
                    }`}
                  >
                    {t.label}
                  </span>
                  <span className="mt-0.5 block text-2xs leading-snug text-ink-muted">
                    {t.desc}
                  </span>
                </span>
                {isActive && (
                  <span className="text-primary-ink" aria-hidden="true">
                    <Check size={15} strokeWidth={2.6} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
