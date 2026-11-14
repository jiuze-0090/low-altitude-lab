/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── 语义色（映射 src/styles/tokens.css 中的 CSS 变量）────────────────
        primary: {
          DEFAULT: 'var(--c-primary)',
          strong: 'var(--c-primary-strong)',
          text: 'var(--c-primary-text)',
          soft: 'var(--c-primary-soft)',
          ink: 'var(--c-primary-ink)',
        },
        accent: {
          DEFAULT: 'var(--c-accent)',
          strong: 'var(--c-accent-strong)',
          soft: 'var(--c-accent-soft)',
          ink: 'var(--c-accent-ink)',
        },
        canvas: 'var(--c-bg)',
        surface: {
          DEFAULT: 'var(--c-surface)',
          '2': 'var(--c-surface-2)',
          hover: 'var(--c-surface-hover)',
        },
        band: 'var(--c-band)',
        elevated: 'var(--c-elevated)',
        // 仪表盘深底色阶 —— 深底上的文字/描边必须走这一组，
        // 直接用 ink.* 压在深底上对比度不足。
        panel: {
          DEFAULT: 'var(--c-panel)',
          raised: 'var(--c-panel-raised)',
          line: 'var(--c-panel-line)',
          text: 'var(--c-panel-text)',
          muted: 'var(--c-panel-muted)',
          accent: 'var(--c-panel-accent)',
          ok: 'var(--c-panel-ok)',
          warn: 'var(--c-panel-warn)',
          bad: 'var(--c-panel-bad)',
        },
        // 浅底上的仪表刻度（Hero 装饰、图表网格）
        gauge: {
          line: 'var(--c-gauge-line)',
          soft: 'var(--c-gauge-line-soft)',
          ink: 'var(--c-gauge-ink)',
        },
        ink: {
          DEFAULT: 'var(--c-text)',
          soft: 'var(--c-text-soft)',
          muted: 'var(--c-text-muted)',
        },
        hairline: 'var(--c-border)',
        state: {
          ok: 'var(--c-ok)',
          warn: 'var(--c-warn)',
          bad: 'var(--c-bad)',
          info: 'var(--c-info)',
        },
      },
      fontFamily: {
        sans: 'var(--f-sans)',
        mono: 'var(--f-mono)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px — 仪表盘刻度标签
        xs: ['0.75rem', { lineHeight: '1.125rem' }], // 12px
        sm: ['0.8125rem', { lineHeight: '1.25rem' }], // 13px
        base: ['0.9375rem', { lineHeight: '1.625rem' }], // 15px
        md: ['1rem', { lineHeight: '1.75rem' }], // 16px
        lg: ['1.125rem', { lineHeight: '1.625rem' }], // 18px
        xl: ['1.3125rem', { lineHeight: '1.875rem' }], // 21px
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }], // 26px
        '3xl': ['2rem', { lineHeight: '2.5rem' }], // 32px
        '4xl': ['2.625rem', { lineHeight: '3.125rem' }], // 42px
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        DEFAULT: 'var(--r-md)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        pill: 'var(--r-pill)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        panel: 'var(--shadow-panel)',
        focus: 'var(--shadow-focus)',
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      maxWidth: {
        prose: '68ch',
        shell: '1200px',
      },
      transitionTimingFunction: {
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'draw-line': {
          '0%': { strokeDashoffset: 'var(--dash-len, 1000)' },
          '100%': { strokeDashoffset: '0' },
        },
        'pulse-ring': {
          '0%': { opacity: '0.55', transform: 'scale(0.85)' },
          '70%': { opacity: '0', transform: 'scale(1.5)' },
          '100%': { opacity: '0', transform: 'scale(1.5)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s var(--ease-out) both',
        'draw-line': 'draw-line 1.2s var(--ease-out) both',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
}
