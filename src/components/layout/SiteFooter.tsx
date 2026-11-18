import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, QrCode } from 'lucide-react'
import { siteMeta } from '@/content'
import BrandMark from '@/components/ui/BrandMark'

export default function SiteFooter() {
  const year = new Date().getFullYear()
  /** 公众号二维码图片未就位时自动降级为提示块：把图片丢进 public/images 即可自动生效 */
  const [qrMissing, setQrMissing] = useState(false)

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

        {/* 下一步：公众号（关系沉淀）为主，热线（报名咨询）为辅 */}
        <div className="mt-8 grid gap-5 border-t border-hairline pt-6 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-7">
          <div className="flex items-start gap-3">
            {siteMeta.gzhQr && !qrMissing ? (
              <a
                href={siteMeta.gzhQr}
                target="_blank"
                rel="noopener noreferrer"
                title="点击查看大图后扫码"
                className="shrink-0"
              >
                <img
                  src={siteMeta.gzhQr}
                  alt={`公众号 ${siteMeta.gzhName} 二维码`}
                  width={112}
                  height={112}
                  loading="lazy"
                  decoding="async"
                  onError={() => setQrMissing(true)}
                  className="h-28 w-28 rounded-md border border-hairline bg-white object-contain p-1"
                />
              </a>
            ) : (
              <span
                className="flex h-28 w-28 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface text-ink-muted"
                aria-hidden="true"
              >
                <QrCode size={32} />
              </span>
            )}
            <div>
              <p className="text-sm font-bold text-ink">公众号 · {siteMeta.gzhName}</p>
              <p className="mt-1 text-2xs leading-relaxed text-ink-muted">
                {qrMissing ? '二维码即将上线，先看每日一题' : '每日一题、备考干货，不刷屏'}
              </p>
              {!qrMissing && (
                <p className="mt-0.5 text-2xs leading-relaxed text-ink-muted">
                  点击二维码看大图再扫，或在微信里长按识别
                </p>
              )}
            </div>
          </div>

          <div className="text-2xs leading-relaxed text-ink-muted">
            <p>
              报名咨询：
              {siteMeta.hotline?.map((tel, i) => (
                <span key={tel}>
                  {i > 0 && ' / '}
                  <a href={`tel:${tel}`} className="font-semibold text-ink-soft hover:text-primary-text">
                    {tel}
                  </a>
                </span>
              ))}
            </p>
            <p className="mt-1.5">
              不知道自己能考到哪？先过一遍
              <Link to="/exam" className="mx-1 text-primary-text underline underline-offset-2">
                考点索引
              </Link>
              ，再看
              <Link to="/labs" className="mx-1 text-primary-text underline underline-offset-2">
                交互实验
              </Link>
              。
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-hairline pt-6 text-2xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteMeta.orgFull} · 本站为公益学习站点，内容用于备考辅助
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>报考条件与考试规则，以中国民用航空局及当地民航地区管理局最新公布为准</span>
            {siteMeta.icp && (
              <a
                href="https://beian.miit.gov.cn"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-text"
              >
                {siteMeta.icp}
              </a>
            )}
          </p>
        </div>
      </div>
    </footer>
  )
}
