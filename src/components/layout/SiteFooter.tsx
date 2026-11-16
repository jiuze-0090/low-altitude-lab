import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { siteMeta } from '@/content'
import BrandMark from '@/components/ui/BrandMark'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="band mt-16 border-t border-hairline">
      <div className="shell py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <BrandMark className="h-5 w-5 text-ink" />
              <p className="text-sm font-bold text-ink">低空原理实验室</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              {siteMeta.description}
            </p>
          </div>

          <nav aria-label="页脚导航">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-xs text-ink-soft">
              <li>
                <Link to="/principles" className="hover:text-primary-text">
                  原理目录
                </Link>
              </li>
              <li>
                <Link to="/labs" className="hover:text-primary-text">
                  实验室
                </Link>
              </li>
              <li>
                <Link to="/cheatsheets" className="hover:text-primary-text">
                  原理速查卡
                </Link>
              </li>
              <li>
                <Link to="/exam" className="hover:text-primary-text">
                  考点索引
                </Link>
              </li>
              <li>
                <Link to="/tools" className="hover:text-primary-text">
                  高频计算器
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary-text">
                  关于本站
                </Link>
              </li>
              <li>
                <a href="mailto:hello@nbyteair.com" className="hover:text-primary-text">
                  联系我们
                </a>
              </li>
              <li>
                <a
                  href="https://www.nbyteair.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary-text"
                >
                  新字节航空官网
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-hairline pt-6 text-2xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteMeta.orgFull} · 本站为公益学习站点，内容用于备考辅助
          </p>
          {siteMeta.icp && (
            <p>
              <a
                href="https://beian.miit.gov.cn"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-text"
              >
                {siteMeta.icp}
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
