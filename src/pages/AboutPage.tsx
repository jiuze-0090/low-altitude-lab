import { useEffect } from 'react'
import { siteMeta } from '@/content'
import PageHeader from '@/components/ui/PageHeader'
import Markdown from '@/components/formula/Markdown'

const BODY = `
本站是**${siteMeta.orgFull}**（简称"${siteMeta.org}"）旗下面向 CAAC 无人机驾驶员理论考试的公益学习站点。

我们做这件事的起因很朴素：学飞行原理的时候，最难的从来不是"记不住公式"，
而是"不知道自己在记什么"。空气为什么能托住飞机？速度翻倍阻力涨多少？
重心往后挪一寸手上要多压多少杆量？这些问题如果只有文字答案，学完就忘。

所以本站换了个做法：**先让你猜**。

每个实验都以一道预测题开始。你在不知道答案的情况下做出选择，
然后才揭晓正确答案，并解释你为什么会这样想。
最后，这条原理会被翻译成一句"这在你手上是哪根杆"。

## 我们不做的事

- 不卖课，不做付费墙，全站免费公开
- 不堆题库，不做刷题海
- 不写成"教材"

## 原理的来源

本站的原理内容以 CAAC 无人机驾驶员理论考试的考纲为骨架，
逐条对照公开题库与现行法规整理，每条原理都标注对应的考法。
所有内容仅用于备考辅助，具体口径以官方教材与最新法规为准。

## 与机构的关系

本站由 **${siteMeta.orgFull}** 建设并维护，
该机构是位于潍坊的多旋翼无人机驾驶员执照培训与实训方，
持有民航局《民用无人驾驶航空器运营合格证》（UMOC-0-HQ-20250507079，经营种类含培训类）。
本站是机构教学内容的延伸，站内所有实验的实飞体感描述，
来自教员在真实训练中的观察记录。

如需课程咨询、实训报名或设备相关服务，请通过
[官网](https://www.nbyteair.com/) 联系招生与技术支持团队。
`

export default function AboutPage() {
  useEffect(() => {
    document.title = siteMeta.titleTemplate.replace('%s', '关于本站')
      const tag = document.querySelector('meta[name="description"]')
      if (tag)
        tag.setAttribute(
          'content',
          `低空原理实验室由${siteMeta.orgFull}建设并维护，是面向 CAAC 无人机驾驶员理论考试的公益交互式原理学习站。`,
        )
  }, [])

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="关于"
        title="关于本站"
        description="一个只做两件事的地方：把飞行原理讲清楚，用可交互的图演示原理。"
      />
      <div className="shell py-9 sm:py-11">
        <div className="card mx-auto max-w-prose p-5 sm:p-8">
          <div className="prose-lab">
            <Markdown content={BODY} />
          </div>
        </div>
      </div>
    </div>
  )
}
