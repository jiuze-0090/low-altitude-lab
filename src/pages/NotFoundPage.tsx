import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { siteMeta } from '@/content'

export default function NotFoundPage() {
  useEffect(() => {
    document.title = siteMeta.titleTemplate.replace('%s', '页面未找到')
  }, [])

  return (
    <div className="shell py-24 text-center">
      <p className="tnum text-5xl font-bold text-primary-soft">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">这个页面不在导航图上</h1>
      <p className="mt-3 text-sm text-ink-soft">链接可能已经变更，或者内容还在路上。</p>
      <div className="mt-7 flex justify-center gap-3">
        <Link
          to="/"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-strong"
        >
          回首页
        </Link>
        <Link
          to="/labs"
          className="rounded-md border border-hairline bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-canvas"
        >
          去实验室
        </Link>
      </div>
    </div>
  )
}
