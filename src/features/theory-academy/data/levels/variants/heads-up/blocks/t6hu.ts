import type { TheorySection } from '../../../../../types';

// T6 下注工程（单挑）：尺度读数表、三连注几何、目的与门槛映射、牌面实现率折扣。
const table = (content: string, headers: string[], rows: string[][]): TheorySection => ({
  type: 'text',
  content,
  data: { kind: 'table', headers, rows },
});

export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't6hu-sizing-optimal': [
    table(
      '尺度读数速查：同一套式子换四个尺度。诈唬占比 f = b/(1+2b) 与薄价值保本胜率 B/(P+2B) 是同一个数，保本弃牌率 α = b/(1+b) 比它涨得更快——所以越大的尺度，越适合纯诈唬而不适合薄价值。',
      ['size', 'bluffShare', 'alpha', 'mdf'],
      [
        ['1/3 pot', '20.0%', '25.0%', '75.0%'],
        ['1/2 pot', '25.0%', '33.3%', '66.7%'],
        ['2/3 pot', '28.6%', '40.0%', '60.0%'],
        ['1x pot', '33.3%', '50.0%', '50.0%'],
        ['1.5x pot', '37.5%', '60.0%', '40.0%'],
      ],
    ),
  ],
  't6hu-barrel': [
    table(
      '三连注的底池几何（起始底池 5BB，每街 2/3 池）：三个下注决策点把底池推到六倍出头，河牌的下注额才足够接近满额筹码；换成 1/3 池，底池只涨到两倍出头，深筹码永远打不完。',
      ['street', 'bet', 'pot'],
      [
        ['flop', '3.3', '11.7'],
        ['turn', '7.8', '27.2'],
        ['river', '18.1', '63.5'],
      ],
    ),
  ],
  't6hu-bet-purpose': [
    table(
      '五个目的对应的主导尺度与保本线：价值与薄价值两行的门槛是被跟注所需的最低胜率，拒绝权益与诈唬两行的门槛是所需弃牌率——同一个 b 下，胜率门槛 B/(P+2B) 与弃牌率门槛 B/(P+B) 相差一个 b 的份额。',
      ['purpose', 'tier', 'size', 'threshold'],
      [
        ['value', 'nuts / top two', '2/3 - 1x', '28.6% - 33.3%'],
        ['thin value', 'top pair', '1/4 - 1/3x', '16.7% - 20.0%'],
        ['denial', 'mid pair / draw', '1/2 - 2/3x', '33.3% - 40.0%'],
        ['bluff', 'air with blockers', '2/3 - 1.5x', '40.0% - 60.0%'],
        ['realization', 'weak draw', '1/3x', '20.0%'],
      ],
    ),
  ],
  't6hu-equity-realization': [
    table(
      '牌面结构对应的实现率折扣（经验区间）：越湿润、越连接的牌面，领先方的实现率越低，因为对手的听牌与两对组合更多。折扣是报价而不是保证——同一块牌面上，位置更好的那一侧折扣更小。',
      ['texture', 'board', 'realization'],
      [
        ['dry high', 'K♠7♦2♣', '0.90 - 1.00'],
        ['paired', 'K♠K♦4♣', '0.85 - 0.95'],
        ['wet connected', '9♠8♥4♣', '0.75 - 0.85'],
        ['monotone', '9♠8♠4♠', '0.70 - 0.85'],
      ],
    ),
  ],
};
