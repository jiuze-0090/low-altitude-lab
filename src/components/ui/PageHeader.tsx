import type { ReactNode } from 'react'

/** 页面头部（各页统一结构） */
export default function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <header className="band border-b border-hairline">
      <div className="shell py-8 sm:py-11">
        {eyebrow && (
          <p className="text-2xs font-bold uppercase tracking-[0.16em] text-accent-ink">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-soft">
            {description}
          </p>
        )}
        {children}
      </div>
    </header>
  )
}
