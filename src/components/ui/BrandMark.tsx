/**
 * 新字节航空品牌标志（单色版）
 * ---------------------------------------------------------------------------
 * 几何轮廓取自官方品牌素材逐像素矢量化结果：
 *   - 源图一：深蓝底白标（提取轮廓）
 *   - 源图二：白底双色标（核对配色）
 * 四块斜切色块呈对角分布：左上 + 右下 青绿，右上 + 左下 深蓝。
 *
 * 输出单色版本，填充使用 currentColor，随主题文字色自动适配
 * （brand 深空 / bright 明朗 / night 夜间护眼 三套主题通用）。
 *
 * 品牌标准色（需要双色版时取此值）：青绿 #26A69A、深蓝 #3A5E9F。
 */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80.5"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <g transform="translate(8 0)">
        {/* 右上 */}
        <path d="M38.2 6 L64 0 L64 13.3 L38.2 46 Z" />
        {/* 左上 */}
        <path d="M0 17.2 L2.6 15.5 L31.8 7.7 L0 48.5 Z" />
        {/* 右下 */}
        <path d="M33.5 71.7 L64 32.6 L64 62.7 Z" />
        {/* 左下 */}
        <path d="M0 67.9 L24.5 36.9 L24.5 73.9 L1.3 80.3 L0 79.5 Z" />
      </g>
    </svg>
  );
}
