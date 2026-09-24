/**
 * evImpact 自由文本着色判定（纯函数，无副作用）。
 *
 * 数据侧 `PracticeOption.evImpact` 是给人读的自由文本，形态多样：
 *  - 数值型：'+0.5 BB/100' / '-1.5BB（失去偷盲机会）' / '-1.0 ante' / '0 BB/100' / '+$15'
 *  - 叙述型：'保护资金安全' / '+长期盈利' / '-学习速度' / '-信心' / '破产风险+200%'
 *
 * 旧实现 `evImpact.startsWith('+') ? success : danger` 会把 '0 BB/100'、'0'、'0BB'
 * 与所有叙述值一律判成红色（danger），属于视觉层面的伪精度。
 *
 * 判定口径（三态）：
 *  - 起始位置可解析出数值且严格为负 → negative（danger 陶土红）
 *  - 起始位置可解析出数值且 ≥ 0 → positive（success 苔藓绿，含 0「无损失」语义）
 *  - 无法在起始位置解析出数值 → neutral（ivory-muted 中性），不猜方向
 *
 * 只认「起始位置」的数值：'破产风险+200%' 中的 +200 语义为负（破产风险上升是坏事），
 * 叙述文本里夹带的数字无法靠符号判定好坏，一律走中性色比误标更诚实。
 */

export type EvImpactTone = 'positive' | 'negative' | 'neutral';

/** 起始处的可选符号 + 可选货币符号 + 数值（覆盖 '-0.5 BB/100' / '+$15' / '0BB'） */
const LEADING_QUANTITY = /^([+-]?)\s*\$?\s*(\d+(?:\.\d+)?)/;

/** 从 evImpact 自由文本解析起始数值；解析不出返回 null */
export function parseEvImpactNumber(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const match = LEADING_QUANTITY.exec(raw.trim());
  const digits = match?.[2];
  if (!digits) return null;
  const value = Number.parseFloat(digits);
  if (!Number.isFinite(value)) return null;
  return match?.[1] === '-' ? -value : value;
}

/** 判定 evImpact 的色彩语义三态（positive / negative / neutral） */
export function classifyEvImpact(raw: string | undefined | null): EvImpactTone {
  const value = parseEvImpactNumber(raw);
  if (value === null) return 'neutral';
  return value < 0 ? 'negative' : 'positive';
}

/** 三态 → 文字色类（全部走 CSS 变量 token，禁止硬编码颜色） */
export function evImpactToneClass(raw: string | undefined | null): string {
  switch (classifyEvImpact(raw)) {
    case 'negative':
      return 'text-[var(--danger)]';
    case 'positive':
      return 'text-[var(--success)]';
    default:
      return 'text-[var(--ivory-muted)]';
  }
}
