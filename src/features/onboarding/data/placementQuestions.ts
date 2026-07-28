import type { PlacementQuestion } from '../types';

// 5 道定位题覆盖 4 个维度：
// - handRanking (题1-2)：牌力排名，建立信心
// - position (题3)：位置认知
// - odds (题4)：底池赔率直觉
// - range (题5)：起手牌判断
export const placementQuestions: PlacementQuestion[] = [
  {
    id: 'pq-1',
    dimension: 'handRanking',
    question: '以下哪手起手牌的牌力最强？',
    options: [
      { id: 'a', text: 'AA（口袋火箭）', isCorrect: true },
      { id: 'b', text: 'KK（口袋国王）', isCorrect: false },
      { id: 'c', text: 'QQ（口袋王后）', isCorrect: false },
      { id: 'd', text: 'JJ（口袋杰克）', isCorrect: false },
    ],
    difficulty: 1,
    explanation: 'AA 是德州扑克最强的起手牌，对抗任何其他起手牌都有约 80%+ 的胜率。',
  },
  {
    id: 'pq-2',
    dimension: 'handRanking',
    question: '在最终成牌中，以下哪种牌型最强？',
    options: [
      { id: 'a', text: '同花顺（Straight Flush）', isCorrect: true },
      { id: 'b', text: '四条（Four of a Kind）', isCorrect: false },
      { id: 'c', text: '葫芦（Full House）', isCorrect: false },
      { id: 'd', text: '同花（Flush）', isCorrect: false },
    ],
    difficulty: 2,
    explanation: '牌型从大到小：皇家同花顺 > 同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌。',
  },
  {
    id: 'pq-3',
    dimension: 'position',
    question: '在 6-max 游戏中，哪个位置在翻前具有最大的位置优势？',
    options: [
      { id: 'a', text: 'UTG（枪口位）', isCorrect: false },
      { id: 'b', text: 'HJ（劫持位）', isCorrect: false },
      { id: 'c', text: 'CO（截断位）', isCorrect: false },
      { id: 'd', text: 'BTN（按钮位）', isCorrect: true },
    ],
    difficulty: 2,
    explanation: 'BTN（按钮位）是翻前/翻后都最后行动的位置，拥有最多信息优势，是 6-max 中最有利的位置。',
  },
  {
    id: 'pq-4',
    dimension: 'odds',
    question: '底池有 100 筹码，对手下注 50，你需要跟注 50。你至少需要多少胜率才能跟注有利可图？',
    options: [
      { id: 'a', text: '20%', isCorrect: false },
      { id: 'b', text: '25%', isCorrect: true },
      { id: 'c', text: '33%', isCorrect: false },
      { id: 'd', text: '50%', isCorrect: false },
    ],
    difficulty: 3,
    explanation: '跟注 50 进入 200 的总底池（100 原底池 + 50 对手下注 + 50 你的跟注），所需胜率 = 50 / 200 = 25%。',
  },
  {
    id: 'pq-5',
    dimension: 'range',
    question: '在 UTG（枪口位，6 人桌最早行动位置），以下哪手牌应该开池加注？',
    options: [
      { id: 'a', text: '72o（非同花 72）', isCorrect: false },
      { id: 'b', text: 'K2s（同花 K2）', isCorrect: false },
      { id: 'c', text: '92o（非同花 92）', isCorrect: false },
      { id: 'd', text: 'AQo（非同花 AQ）', isCorrect: true },
    ],
    difficulty: 3,
    explanation: 'UTG 是最早行动的位置，应使用紧凑的开池范围（约 16% 的手牌）。AQo 是强牌在 UTG 标准范围内；72o / 92o / K2s 都太弱，不在 UTG 开池范围。',
  },
];
