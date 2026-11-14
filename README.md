# 低空原理实验室

面向 CAAC 无人机驾驶员理论考试的交互式原理学习站。

**先猜错一次，再看懂它为什么错。** 每个实验从一道预测题开始 —— 先做选择，再揭晓答案并解释你为什么
这样想，最后把这条原理落回"这在你手上是哪根杆"。

## 技术栈

| 项 | 选型 |
|---|---|
| 框架 | Vite 5 + React 18 + TypeScript |
| 样式 | Tailwind CSS 3（设计 token 全部走 CSS 变量，见 `src/styles/tokens.css`） |
| 路由 | React Router 6（history 模式） |
| 公式 | KaTeX（按需懒加载） |
| 图表 | 原生 SVG 手写，无图表库 |
| 内容 | TS/JSON 静态导入，构建期打包，无运行时请求 |

**无后端、无数据库、无登录。** 产物为纯静态 `dist/`，可直接托管到 EdgeOne Pages / Cloudflare Pages。

## 本地开发

```bash
npm install
npm run dev        # http://127.0.0.1:5177
```

## 构建

```bash
npm run build      # 类型检查 + 构建 → dist/
npm run preview    # 本地预览产物
```

`npm run build` 会做两件事：

1. `tsc --noEmit` 类型检查（不通过则不产出）
2. `vite build` → `dist/`，并自动裁剪 KaTeX 的 40 个冗余字体文件（省约 798KB）

## 目录结构

```
src/
├── app/routes.tsx          路由表（全部页面路由在此）
├── components/
│   ├── layout/             Header / Footer / Layout 骨架
│   ├── ui/                 PageHeader / ExperimentCard / Cheatsheet
│   ├── formula/            Markdown（Markdown + KaTeX）/ Formula
│   └── experiment/         PredictionBlock（核心机制）/ ExperimentCanvas
├── content/
│   ├── index.ts            章节 / 知识点 / 实验的汇总入口
│   └── experiments/        每个实验一个文件
├── experiments/            交互实验组件（SVG 可视化）
├── pages/                  页面组件
├── styles/
│   ├── tokens.css          ★ 设计 token 唯一事实来源
│   └── index.css           全局样式与组件类
└── types/content.ts        内容数据模型
```

## 内容模型

新增一个实验 = 在 `src/content/experiments/` 加一个文件 + 在 `src/experiments/` 加一个可视化组件，
然后在 `src/content/index.ts` 注册。字段定义见 `src/types/content.ts`。

## 部署

### EdgeOne Pages

1. 控制台 → 创建项目 → 导入 Git 仓库（GitHub）
2. 构建设置：安装命令 `npm install`，构建命令 `npm run build`，输出目录 `dist`
3. 加速区域：**中国大陆可用区**（需域名已完成 ICP 备案）
4. 绑定自定义域名（如 `lab.nbyteair.com`）
5. HTTPS 配置 → 申请免费证书 → 开启强制 HTTPS

**SPA 回退规则**（history 路由必需）：

- 匹配：`(.*)`（排除静态资源）
- 重写：`/index.html`

### Cloudflare Pages

- 构建命令 `npm run build`，输出目录 `dist`
- 需要配置 SPA 回退：`_redirects` 文件内容为 `/* /index.html 200`

## 许可

本站为公益学习站点，内容用于备考辅助。
