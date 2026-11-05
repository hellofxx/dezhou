import type { TheorySection } from '../../../../../types';

// T5HU 富文本块（单挑）：只追加在各章 content 尾部，索引型 i18n key 的既有下标不变。
// 表头与单元格一律语言中立 token（数字 / 缩写 / 记号），同一份数据服务 zh 与 en。
const table = (content: string, headers: string[], rows: string[][]): TheorySection => ({
  type: 'text',
  content,
  data: { kind: 'table', headers, rows },
});

export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't5hu-gto-he': [
    table(
      '对抗类型与最优响应的对照：基线负责保底，剥削负责增益。四类可观测倾向都能被翻译成一个具体动作方向，而每一次翻译都要留出对手修正的余地。',
      ['opponent', 'best response', 'guarantee'],
      [
        ['unknown', 'baseline', '≥ game value'],
        ['over-folding', 'more bluff combos', 'baseline + gain'],
        ['under-bluffing', 'fold vs big bets', 'baseline + gain'],
        ['over-bluffing', 'call down wider', 'baseline + gain'],
      ],
    ),
  ],
  't5hu-frequency': [
    table(
      '同一尺度下的三个口径：MDF 与 Alpha 互补，两者相加恰为 100%；跟注所需权益永远低于 Alpha，因为跟注方还能赢下对手已经投进底池的那部分。',
      ['size (×P)', 'MDF', 'Alpha', 'call equity'],
      [
        ['1/4', '80.0%', '20.0%', '16.7%'],
        ['1/3', '75.0%', '25.0%', '20.0%'],
        ['1/2', '66.7%', '33.3%', '25.0%'],
        ['1', '50.0%', '50.0%', '33.3%'],
        ['2', '33.3%', '66.7%', '40.0%'],
      ],
    ),
  ],
  't5hu-node-locking': [
    table(
      '偏离增益表（底池 4BB、1/3 池下注）：观察到的弃牌率决定这一手诈唬的 EV。25% 是保本线，也是偏离的安全边界——低于这条线时同一手牌应当停止下注。',
      ['observed fold', 'bluff EV'],
      [
        ['15%', '−0.53BB'],
        ['25%', '0BB'],
        ['40%', '+0.80BB'],
        ['50%', '+1.34BB'],
        ['60%', '+1.87BB'],
      ],
    ),
  ],
  't5hu-preflop-equilibrium': [
    table(
      '翻前频率基线：每一行的 continue 都由后两列构成，raise 与 call 之外剩下的部分就是弃牌率。数字随对手与筹码深度移动，构成关系不变。',
      ['spot', 'continue', 'raise', 'call'],
      [
        ['SB open', '80%', '55-65%', '15-25%'],
        ['BB vs min-raise', '62%', '18%', '44%'],
        ['SB vs 3-bet', '37.5%', '8%', '29.5%'],
        ['BB vs 4-bet', '38.1%', '—', '38.1%'],
      ],
    ),
  ],
  't5hu-postflop-equilibrium': [
    table(
      'SPR 与几何尺度对照：三街版本用立方根、两街版本用平方根求解。SPR 越高，打光筹码所需的每街比例越大；SPR 超过 10 时三街尺度已逼近或超过满池。',
      ['SPR', '3 streets', '2 streets'],
      [
        ['2', '35.5%', '61.8%'],
        ['4', '54.0%', '100%'],
        ['7.8', '77.5%', '153.7%'],
        ['24.5', '134.2%', '303.6%'],
      ],
    ),
  ],
};
