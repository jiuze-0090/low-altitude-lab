import type { CheatsheetRow } from '@/types/content'

/**
 * 原理速查卡内容
 * ---------------------------------------------------------------------------
 * 与 `guides.ts`（规章速查卡）的分工：
 *   · guides.ts  → 「背下来的」硬条目：空域、管制单位、申报间隔、气象数字
 *   · cheatsheets.ts → 「算出来的」原理结论：气动、稳定性、多旋翼、性能、公式
 *
 * 全部条目来自题库实测（2026-11-18 最终入库 1953 题），每条标注真实题号，
 * 便于回溯核对；题库未收录的条目不臆造题号。
 */

export interface FormulaRow {
  /** 公式名 */
  name: string
  /** KaTeX 表达式（不含 $$） */
  tex: string
  /** 变量含义与使用要点 */
  note: string
}

export interface CheatsheetCard {
  id: string
  title: string
  subtitle: string
  /** 一句话记忆口诀 */
  mnemonic: string
  /** 表格条目 */
  rows: CheatsheetRow[]
  /** 公式条目（可选） */
  formulas?: FormulaRow[]
  /** 关联链接 */
  links?: Array<{ label: string; to: string }>
}

/* ── 1. 气动基础 ─────────────────────────────────────────────────────── */

export const aeroCard: CheatsheetCard = {
  id: 'aero',
  title: '气动基础速查卡',
  subtitle: '升力从哪来、迎角到哪一步会崩、阻力为什么非绑不可。',
  mnemonic: '迎角管升力，失速看临界；阻力绑速度平方。',
  links: [
    { label: '实验 E1 升力从哪来', to: '/labs/lift-origin' },
    { label: '实验 E2 速度与升阻比', to: '/labs/speed-ratio' },
    { label: '实验 E3 迎角与失速', to: '/labs/alpha-stall' },
  ],
  rows: [
    { term: '动压', value: 'q = ½ρV²', note: '与速度平方成正比' },
    { term: '升力', value: 'L = C_L·q·S', note: '垂直于相对气流' },
    { term: '阻力', value: 'D = C_D·q·S', note: '与相对气流反向' },
    { term: '迎角定义', value: '机翼翼弦与相对气流的夹角', note: '不是与水平面的夹角（270）' },
    { term: '升力系数（线性段）', value: 'C_L ≈ 0.06 + 0.088α', note: 'α 以度计' },
    { term: '临界迎角', value: '约 14°～16°', note: '由翼型决定，不是常数' },
    { term: '失速直接原因', value: '迎角超过临界迎角', note: '不是"速度太小"（214）' },
    { term: '超过临界后', value: 'C_L 骤降，C_D 骤增', note: '268 / 332' },
    { term: '失速物理原因', value: '机翼上表面附面层大部分分离', note: '392' },
    { term: '常规布局失速', value: '机翼向上的力与尾翼向下的力都降低', note: '254' },
    { term: '失速改出', value: '立即推杆到底', note: '减小迎角 + 加油门（215）' },
    { term: '安全飞行原则', value: '最大升力系数与临界迎角以下的组合', note: '345' },
    { term: '会超临界的场景', value: '低速、高速、转弯', note: '三种都会（253）' },
    { term: '放下襟翼', value: 'C_L↑，临界迎角↓，失速速度↓', note: '382 / 183' },
    { term: '前缘结冰', value: 'C_L↓，临界迎角↓', note: '升力小于干净翼面（370）' },
    { term: '诱导阻力', value: '∝ C_L²，与翼载荷成反比', note: '354 / 357' },
    { term: '阻力随速度', value: '同迎角下速度翻倍 → 阻力约 4 倍', note: '184' },
    { term: '地面效应', value: '诱导阻力减小、升阻比提高', note: '219' },
    { term: '升阻比最大的意义', value: '下滑角最小、滑得最远', note: '196 / 194' },
  ],
}

/* ── 2. 稳定性与操纵 ─────────────────────────────────────────────────── */

export const stabilityCard: CheatsheetCard = {
  id: 'stability',
  title: '稳定性与操纵速查卡',
  subtitle: '焦点、重心、舵面三件事的账，以及它们之间的取舍。',
  mnemonic: '焦点在重心之后才稳；尾翼越大越稳，也越沉。',
  links: [
    { label: '实验 E4 重心与安定性', to: '/labs/cg-stability' },
    { label: '实验 E5 舵面与操纵', to: '/labs/control-surfaces' },
  ],
  rows: [
    { term: '平衡的定义', value: '所有外力平衡 + 所有外力矩平衡', note: '420' },
    { term: '焦点', value: '总空气动力作用线与纵轴的交点', note: '即全机压力中心（336）' },
    { term: '纵向稳定判据', value: '焦点在重心之后', note: '451' },
    { term: '机翼升力对重心', value: '下俯力矩', note: '作用线在重心之后（228）' },
    { term: '平尾对重心', value: '上仰力矩', note: '平尾负迎角产生下载（229）' },
    { term: '俯仰平衡力矩', value: '机翼力矩 + 水平尾翼力矩', note: '418' },
    { term: '重心靠前', value: '纵向安定性变强，操纵变沉', note: '230 / 445' },
    { term: '重心靠后', value: '纵向安定性减弱，操纵变灵敏', note: '231' },
    { term: '加大水平尾翼', value: '焦点后移 → 稳定性增加', note: '443' },
    { term: '静稳定裕度', value: '(焦点 − 重心) / 弦长', note: '越大越稳（258）' },
    { term: '正静安定性', value: '受扰后回到原平衡状态', note: '220' },
    { term: '负静安定性', value: '受扰后继续偏离', note: '221' },
    { term: '正 / 负动安定性', value: '振荡收敛 / 振荡发散', note: '222 / 223' },
    { term: '纵向安定性作用', value: '防止抬头过高或低头过低', note: '224' },
    { term: '配平', value: '配重一变就要重新配平', note: '258' },
    { term: '副翼', value: '绕纵轴 → 滚转', note: '187' },
    { term: '升降舵', value: '绕横轴 → 俯仰', note: '188' },
    { term: '方向舵', value: '绕立轴 → 偏航', note: '189' },
    { term: '右压副翼', value: '左翼升力大于右翼升力', note: '190' },
    { term: '推杆', value: '升降舵下偏 → 机头下俯 → 迎角减小', note: '191 → 转入下降（212）' },
    { term: '拉杆', value: '迎角增大', note: '192' },
    { term: '副翼转弯', value: '外侧机翼阻力大 → 逆偏转', note: '203 / 202' },
    { term: '修正逆偏转', value: '向转弯方向偏转方向舵', note: '204 / 205' },
    { term: '主操纵面', value: '副翼、升降舵、方向舵', note: '266 / 427' },
    { term: '辅助操纵面', value: '缝翼、襟翼、调整片', note: '267' },
    { term: '舵效与速度', value: '舵面力矩 ∝ 动压 ∝ V²', note: '低速时杆变沉' },
  ],
}

/* ── 3. 多旋翼动力 ───────────────────────────────────────────────────── */

export const multirotorCard: CheatsheetCard = {
  id: 'multirotor',
  title: '多旋翼动力速查卡',
  subtitle: '四个电机怎么配合出三个轴，以及反扭矩那个反直觉的方向。',
  mnemonic: '偏航靠对角线，加速的那组旋向和偏转方向相反。',
  links: [{ label: '实验 E6 反扭矩与偏航', to: '/labs/multirotor-yaw' }],
  rows: [
    { term: '多轴飞行器定义', value: '三个及以上旋翼轴的旋翼航空器', note: '757' },
    { term: '反扭矩效应', value: '机身向旋翼旋转的反方向偏转', note: '460' },
    { term: '悬停时的反扭矩', value: '旋翼两两互相平衡', note: '740' },
    { term: '八轴配置', value: '4 顺时针 + 4 逆时针', note: '704' },
    { term: '偏航靠什么', value: '改变各旋翼反扭矩', note: '460 / 740' },
    { term: '俯仰滚转靠什么', value: '改变各旋翼拉力', note: '739' },
    { term: '偏航怎么做', value: '对角两组电机差动', note: '不是左右差动' },
    { term: '偏航加速的那组', value: '旋向与机头偏转方向相反', note: '460' },
    { term: '偏航时总推力', value: '基本不变（平方和抵消）', note: '所以偏航不掉高度' },
    { term: '立轴上的运动', value: '偏航运动', note: '733' },
    { term: '多轴的操纵', value: '俯仰 / 滚转 / 偏航', note: '744' },
    { term: '多轴没有的操纵', value: '周期变距', note: '744' },
    { term: '反扭矩大小取决于', value: '电动机转速', note: '739' },
    { term: '掉转速的结果', value: '无自转下滑，直接坠落', note: '722' },
    { term: '直升机怎么平衡', value: '加装尾桨产生反向力矩', note: '476' },
    { term: '推力与转速', value: 'T ∝ ρ·n²·D⁴', note: '转速减半，推力只剩 1/4' },
    { term: '反扭矩与转速', value: 'Q ∝ ρ·n²·D⁵', note: '比推力多一个桨径因子' },
    { term: '偏航角速度', value: 'ψ̇ = M_yaw / I_z', note: '惯量越大转得越慢' },
    { term: '功率', value: 'P ∝ Σn³', note: '转速翻倍功率 8 倍' },
    { term: '桨盘载荷', value: '前飞时桨盘后倾 → 载荷↓', note: '所以顺风前飞省电' },
  ],
}

/* ── 4. 飞行性能与航迹 ───────────────────────────────────────────────── */

export const performanceCard: CheatsheetCard = {
  id: 'performance',
  title: '飞行性能与航迹速查卡',
  subtitle: '爬升率从哪来、为什么会掉、以及滑翔的那些"有利速度"。',
  mnemonic: '爬升靠剩余推力，滑翔靠升阻比；高原高温两头堵。',
  links: [{ label: '实验 E7 爬升率与航迹', to: '/labs/climb-performance' }],
  rows: [
    { term: '爬升角', value: 'γ = arcsin((T − D) / W)', note: '407' },
    { term: '爬升率', value: 'R_c = (T − D)·V / W', note: '剩余推力 ÷ 重量' },
    { term: '匀速爬升时的升力', value: 'L = W·cosγ < W', note: '274' },
    { term: '高度升高', value: 'ρ↓ → 推力↓ → 爬升率↓', note: '496' },
    { term: '起降距离', value: '高原更长', note: '496 / 410' },
    { term: 'Vx 与 Vy 随高度', value: 'Vx 增大，Vy 减小', note: '464' },
    { term: 'Vx 近似', value: 'Vx ≈ √3·Vs', note: '最佳爬升角速度' },
    { term: 'Vy 近似', value: '略小于 Vx', note: '最佳爬升率速度' },
    { term: '失速速度', value: 'Vs = √(2W / ρSC_Lmax)', note: '341' },
    { term: '载重增大', value: '失速速度增大', note: '341' },
    { term: '转弯坡度增大', value: '失速速度增大', note: '载荷因子（213）' },
    { term: '放下襟翼', value: '失速速度减小', note: '183' },
    { term: '下滑角', value: 'γ = arctan(1 / (L/D))', note: '193 / 247' },
    { term: '最大下滑距离', value: '用下滑有利速度', note: '194' },
    { term: '下滑有利速度', value: '升阻比最大、总阻力最小', note: '195 / 196' },
    { term: '全襟翼下降', value: '下降角大、速度小', note: '186' },
    { term: '密度高度', value: '高 + 温 → 密度高度高 → 性能差', note: 'ρ = p/(RT)' },
    { term: '爬升率过小', value: '柔和增大俯仰角', note: '652' },
    { term: '顺风对航程', value: '地速航程增加，空速航程不变', note: '' },
  ],
}

/* ── 5. 常用公式 ─────────────────────────────────────────────────────── */

export const formulaCard: CheatsheetCard = {
  id: 'formula',
  title: '常用公式速查卡',
  subtitle: '七个公式，覆盖气动、性能、侧风与多旋翼四类高频计算。',
  mnemonic: '先写清楚每个量的单位和参考系，再代数字。',
  links: [
    { label: '规章速查卡', to: '/guides' },
    { label: '考点索引', to: '/exam' },
  ],
  formulas: [
    {
      name: '动压',
      tex: 'q = \\tfrac{1}{2}\\rho V^2',
      note: 'ρ 空气密度 kg/m³；V 空速 m/s。阻力、升力、舵效全部正比于它。',
    },
    {
      name: '升力 / 阻力',
      tex: 'L = C_L\\, q S, \\qquad D = C_D\\, q S',
      note: 'S 参考面积 m²；C_L、C_D 为无量纲系数，随迎角与构型变化。',
    },
    {
      name: '失速速度',
      tex: 'V_s = \\sqrt{\\frac{2W}{\\rho\\, S\\, C_{L_{\\max}}}}',
      note: 'W = mg。载重↑、密度↓ → 失速速度↑；襟翼放下 C_Lmax↑ → 失速速度↓。',
    },
    {
      name: '爬升率',
      tex: 'R_c = \\frac{(T - D)\\,V}{W}, \\qquad \\gamma = \\arcsin\\frac{T - D}{W}',
      note: 'T 可用推力、D 阻力、V 速度。剩余推力为负 = 爬不上去。',
    },
    {
      name: '下滑角',
      tex: '\\tan\\gamma = \\frac{D}{L} = \\frac{1}{L/D}',
      note: '升阻比越大 → 下滑角越小 → 滑得越远。',
    },
    {
      name: '侧风修正角',
      tex: '\\mathrm{WCA} = \\arcsin\\frac{W_{\\times}}{V_{\\text{空速}}}, \\qquad V_{\\text{地}} = \\sqrt{V_{\\text{空速}}^2 - W_{\\times}^2} - W_{\\times\\text{顶}}',
      note: 'W_× 侧风分量、W_顶 顶风分量。W_× > V 时无解，只能用侧滑法。',
    },
    {
      name: '静稳定裕度',
      tex: '\\mathrm{SM} = \\frac{x_F - x_{CG}}{c} \\times 100\\%',
      note: 'x_F 焦点（压力中心）、x_CG 重心、c 弦长。焦点在重心之后为正。',
    },
    {
      name: '螺旋桨推力 / 反扭矩',
      tex: 'T \\propto \\rho\\, n^2 D^4, \\qquad Q \\propto \\rho\\, n^2 D^5',
      note: 'n 转速 r/s、D 桨径 m。反扭矩比推力多一个桨径因子，所以桨大反扭矩涨得更快。',
    },
    {
      name: '偏航角速度',
      tex: '\\dot\\psi = \\frac{M_{\\text{yaw}}}{I_z}',
      note: 'I_z 偏航转动惯量。机架越重、轴距越大，转得越慢。',
    },
    {
      name: '密度与密度高度',
      tex: '\\rho = \\frac{p}{R T}, \\qquad p = p_0\\left(1 - \\frac{L h}{T_0}\\right)^{g/(RL)}',
      note: 'R = 287.05 J/(kg·K)。密度高度 = 与当前密度相同的标准大气高度。',
    },
  ],
  rows: [
    { term: '风速分量', value: 'W_顶 = W·cosθ，W_侧 = W·sinθ', note: 'θ=0 正顶风，θ=90° 右侧风' },
    { term: '气象风向', value: "指风的来向", note: '566' },
    { term: '速度合成', value: '地速 = 空速 + 风速（矢量）', note: '1181 / 1477' },
    { term: '空速与地速关系', value: '逆风空速>地速，顺风空速<地速', note: '1291 / 1293' },
    { term: '单位速记', value: '1 kt = 0.5144 m/s，1 ft = 0.3048 m', note: '' },
    { term: '标准大气', value: 'T0 = 288.15 K，p0 = 1013.25 hPa', note: '海平面' },
    { term: '重力常数', value: 'g = 9.80665 m/s²', note: '' },
  ],
}

export const cheatsheetCards: CheatsheetCard[] = [
  aeroCard,
  stabilityCard,
  multirotorCard,
  performanceCard,
  formulaCard,
]
