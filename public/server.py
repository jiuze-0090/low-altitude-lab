"""
低空原理实验室 — 静态发布服务
------------------------------------------------------------------
用途：把 dist/ 产物连同本脚本一起上传到云端沙箱，用单端口对外提供站点。

为什么不用 `python3 -m http.server`：
    React Router 使用 history 模式，直接访问 /labs/lift-origin 这类子路径时，
    静态服务默认返回 404 页面。本脚本对「无扩展名的路径」回退到 index.html，
    对「带扩展名的路径」（/assets/*.js 等）保持真实 404，便于排查资源缺失。

约束：
    · 必须监听环境变量 PORT（云端沙箱注入），回退 3000
    · 必须绑定 0.0.0.0，否则反向代理无法访问
"""

import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "3000"))


class SPAHandler(SimpleHTTPRequestHandler):
    """静态文件服务 + SPA history 回退。"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _resolve(self):
        """返回 (真实存在的文件路径, 是否需要回退到 index.html)。"""
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            if os.path.exists(os.path.join(path, "index.html")):
                return path, False
            return path, True
        if os.path.exists(path):
            return path, False
        # 带扩展名 → 静态资源确实缺失，保持 404；否则视为前端路由
        if os.path.splitext(self.path)[1]:
            return path, False
        return path, True

    def do_GET(self):
        path, fallback = self._resolve()
        if fallback:
            self.path = "/index.html"
        return super().do_GET()

    def do_HEAD(self):
        path, fallback = self._resolve()
        if fallback:
            self.path = "/index.html"
        return super().do_HEAD()

    def end_headers(self):
        # 资源指纹化文件名，带 hash 的资产可长期缓存；HTML 不缓存
        self.send_header("Cache-Control", "no-cache" if self.path.endswith(".html")
                         else "public, max-age=31536000, immutable")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), SPAHandler)
    sys.stderr.write("serving %s on 0.0.0.0:%d\n" % (ROOT, PORT))
    sys.stderr.flush()
    server.serve_forever()
