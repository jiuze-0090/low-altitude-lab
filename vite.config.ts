import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

import katexFontTrim from './vite/plugins/katex-font-trim'
import spaFallback from './vite/plugins/spa-fallback'
import sitemap from './vite/plugins/sitemap'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), katexFontTrim(), spaFallback(), sitemap()],
  // 云端发布/预览：监听 0.0.0.0 并放行反代 Host，避免反向代理下被 host 校验拦截
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
    // 云端发布沙箱注入 PORT，直接读取，避免经 npm 传参时变量被吃掉
    port: Number(process.env.PORT) || 4173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Cloudflare Pages / EdgeOne Pages 均以 dist 为静态产物根目录
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 首屏预算：拆包后主 chunk 控制在 ~90KB gzip 以内
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-katex': ['katex'],
          'vendor-marked': ['marked'],
        },
      },
    },
  },
})
