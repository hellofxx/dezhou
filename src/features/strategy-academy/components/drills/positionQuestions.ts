// P0-3.4: 位置认知训练 题库
// 8 道题，交互式 6-max 牌桌布局，点击位置作答
//
// 6-max 座位顺序（顺时针）：UTG → MP → CO → BTN → SB → BB

export type SeatId = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';

export interface PositionQuestion {
  id: string;
  promptKey: string;          // 题干 i18n key
  target: SeatId;              // 正确答案位置
  explanationKey: string;     // 解析 i18n key
}

export const POSITION_QUESTIONS: PositionQuestion[] = [
  {
    id: 'pos-q1',
    promptKey: 'drills.position.questions.q1.prompt',
    target: 'BTN',
    explanationKey: 'drills.position.questions.q1.explanation',
  },
  {
    id: 'pos-q2',
    promptKey: 'drills.position.questions.q2.prompt',
    target: 'UTG',
    explanationKey: 'drills.position.questions.q2.explanation',
  },
  {
    id: 'pos-q3',
    promptKey: 'drills.position.questions.q3.prompt',
    target: 'BTN',
    explanationKey: 'drills.position.questions.q3.explanation',
  },
  {
    id: 'pos-q4',
    promptKey: 'drills.position.questions.q4.prompt',
    target: 'SB',
    explanationKey: 'drills.position.questions.q4.explanation',
  },
  {
    id: 'pos-q5',
    promptKey: 'drills.position.questions.q5.prompt',
    target: 'BB',
    explanationKey: 'drills.position.questions.q5.explanation',
  },
  {
    id: 'pos-q6',
    promptKey: 'drills.position.questions.q6.prompt',
    target: 'BB',
    explanationKey: 'drills.position.questions.q6.explanation',
  },
  {
    id: 'pos-q7',
    promptKey: 'drills.position.questions.q7.prompt',
    target: 'BTN',
    explanationKey: 'drills.position.questions.q7.explanation',
  },
  {
    id: 'pos-q8',
    promptKey: 'drills.position.questions.q8.prompt',
    target: 'MP',
    explanationKey: 'drills.position.questions.q8.explanation',
  },
];

// 6-max 牌桌座位布局（顺时针 UTG → MP → CO → BTN → SB → BB）
// 坐标使用百分比定位（top/left），相对椭圆形牌桌容器
export interface SeatLayout {
  id: SeatId;
  // 椭圆桌上的位置百分比
  top: string;
  left: string;
}

export const SEAT_LAYOUT: SeatLayout[] = [
  // UTG — 左侧（翻前最早行动）
  { id: 'UTG', top: '50%', left: '8%' },
  // MP — 左下
  { id: 'MP', top: '82%', left: '28%' },
  // CO — 右下
  { id: 'CO', top: '82%', left: '72%' },
  // BTN — 右侧（最佳位置）
  { id: 'BTN', top: '50%', left: '92%' },
  // SB — 右上
  { id: 'SB', top: '18%', left: '72%' },
  // BB — 左上
  { id: 'BB', top: '18%', left: '28%' },
];
