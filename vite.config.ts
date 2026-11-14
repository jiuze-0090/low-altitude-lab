import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

import katexFontTrim from './vite/plugins/katex-font-trim'
import spaFallback from './vite/plugins/spa-fallback'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), katexFontTrim(), spaFallback()],
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
