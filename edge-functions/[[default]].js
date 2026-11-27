/**
 * 修复软 404：Makers 默认自动识别 SPA，会把任意未命中路径回退到 index.html（200）。
 * edgeone.json 的 rewrites 删掉也关不掉平台层自动回退，故用 Edge Function 拦截。
 *
 * 官方行为：Edge Functions 路由与静态资源冲突时，静态资源优先。
 * 所以 52 个预渲染静态页、assets、robots.txt、sitemap.xml 都直接命中静态文件，
 * 只有真正不存在的路径才会落到这个函数 → 返回真 404。
 *
 * 不需要白名单：白名单会随新页面增加变成维护负担，静态优先已经天然划好了边界。
 */

const NOT_FOUND_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>页面不存在 · 低空原理实验室</title>
</head>
<body style="font-family:system-ui,sans-serif;max-width:640px;margin:15vh auto;padding:0 24px;color:#1a2540">
<h1 style="font-size:28px">404 · 页面不存在</h1>
<p>这个地址没有内容，可能是链接失效或输入有误。</p>
<p><a href="/" style="color:#2563eb">返回低空原理实验室首页</a></p>
</body>
</html>`

export default function onRequest() {
  return new Response(NOT_FOUND_HTML, {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'cache-control': 'no-store',
    },
  })
}
