import type { PlacementQuestion } from '../types';

// 5 道定位题覆盖 4 个维度：
// - handRanking (题1-2)：牌力排名，建立信心
// - position (题3)：位置认知
// - odds (题4)：底池赔率直觉
// - range (题5)：起手牌判断
//
// i18n 修复（P1）：question / option.text / explanation 改为存储 i18n key，
// 渲染端用 t() 解析（onboarding.placement.qN.*），消除数据层硬编码中文。
export const placementQuestions: PlacementQuestion[] = [
  {
    id: 'pq-1',
    dimension: 'handRanking',
    question: 'onboarding.placement.q1.question',
    options: [
      { id: 'a', text: 'onboarding.placement.q1.optA', isCorrect: true },
      { id: 'b', text: 'onboarding.placement.q1.optB', isCorrect: false },
      { id: 'c', text: 'onboarding.placement.q1.optC', isCorrect: false },
      { id: 'd', text: 'onboarding.placement.q1.optD', isCorrect: false },
    ],
    difficulty: 1,
    explanation: 'onboarding.placement.q1.explanation',
  },
  {
    id: 'pq-2',
    dimension: 'handRanking',
    question: 'onboarding.placement.q2.question',
    options: [
      { id: 'a', text: 'onboarding.placement.q2.optA', isCorrect: true },
      { id: 'b', text: 'onboarding.placement.q2.optB', isCorrect: false },
      { id: 'c', text: 'onboarding.placement.q2.optC', isCorrect: false },
      { id: 'd', text: 'onboarding.placement.q2.optD', isCorrect: false },
    ],
    difficulty: 2,
    explanation: 'onboarding.placement.q2.explanation',
  },
  {
    id: 'pq-3',
    dimension: 'position',
    question: 'onboarding.placement.q3.question',
    options: [
      { id: 'a', text: 'onboarding.placement.q3.optA', isCorrect: false },
      { id: 'b', text: 'onboarding.placement.q3.optB', isCorrect: false },
      { id: 'c', text: 'onboarding.placement.q3.optC', isCorrect: false },
      { id: 'd', text: 'onboarding.placement.q3.optD', isCorrect: true },
    ],
    difficulty: 2,
    explanation: 'onboarding.placement.q3.explanation',
  },
  {
    id: 'pq-4',
    dimension: 'odds',
    question: 'onboarding.placement.q4.question',
    options: [
      { id: 'a', text: 'onboarding.placement.q4.optA', isCorrect: false },
      { id: 'b', text: 'onboarding.placement.q4.optB', isCorrect: true },
      { id: 'c', text: 'onboarding.placement.q4.optC', isCorrect: false },
      { id: 'd', text: 'onboarding.placement.q4.optD', isCorrect: false },
    ],
    difficulty: 3,
    explanation: 'onboarding.placement.q4.explanation',
  },
  {
    id: 'pq-5',
    dimension: 'range',
    question: 'onboarding.placement.q5.question',
    options: [
      { id: 'a', text: 'onboarding.placement.q5.optA', isCorrect: false },
      { id: 'b', text: 'onboarding.placement.q5.optB', isCorrect: false },
      { id: 'c', text: 'onboarding.placement.q5.optC', isCorrect: false },
      { id: 'd', text: 'onboarding.placement.q5.optD', isCorrect: true },
    ],
    difficulty: 3,
    explanation: 'onboarding.placement.q5.explanation',
  },
];
