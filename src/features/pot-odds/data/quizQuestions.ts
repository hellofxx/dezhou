import type { PotOddsQuizQuestion } from '../types';

/**
 * 赔率速算训练题库（19 题）。
 *
 * 从 PotOddsQuizPage 组件内抽离为数据文件（答案位置偏差治理）：
 *  - id 1-14：原有题目，数据原样保留；
 *  - id 15-19：平衡题（正确答案均为"否/应弃牌/不该跟注"式否定项），
 *    补齐"识别 -EV 跟注"训练维度，对冲原题库中"肯定项为正确答案"的内容偏差。
 *
 * 注意：本文件只负责数据，选项展示顺序由 utils/quizOrder.ts 的
 * orderQuizOptions 统一处理（数值选项升序、其余按题目 id 种子洗牌），
 * 书写时正确答案位置无需刻意安排。
 *
 * i18n（P1）：scenario / question / options[].text / options[].explanation
 * 均存储 i18n key（potOdds.quizBank.qN.*），渲染端经 t() 解析，消除数据层硬编码中文。
 */
export const QUIZ_QUESTIONS: PotOddsQuizQuestion[] = [
  {
    id: 1,
    category: 'odds-judgment',
    scenario: 'potOdds.quizBank.q1.scenario',
    question: 'potOdds.quizBank.q1.question',
    options: [
      { text: 'potOdds.quizBank.q1.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q1.optA.explanation' },
      { text: 'potOdds.quizBank.q1.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q1.optB.explanation' },
    ],
  },
  {
    id: 2,
    category: 'outs-calculation',
    scenario: 'potOdds.quizBank.q2.scenario',
    question: 'potOdds.quizBank.q2.question',
    options: [
      { text: 'potOdds.quizBank.q2.optA.text', isCorrect: false, explanation: 'potOdds.quizBank.q2.optA.explanation' },
      { text: 'potOdds.quizBank.q2.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q2.optB.explanation' },
      { text: 'potOdds.quizBank.q2.optC.text', isCorrect: true, explanation: 'potOdds.quizBank.q2.optC.explanation' },
      { text: 'potOdds.quizBank.q2.optD.text', isCorrect: false, explanation: 'potOdds.quizBank.q2.optD.explanation' },
    ],
  },
  {
    id: 3,
    category: 'implied-odds',
    scenario: 'potOdds.quizBank.q3.scenario',
    question: 'potOdds.quizBank.q3.question',
    options: [
      { text: 'potOdds.quizBank.q3.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q3.optA.explanation' },
      { text: 'potOdds.quizBank.q3.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q3.optB.explanation' },
    ],
  },
  {
    id: 4,
    category: 'reverse-implied',
    scenario: 'potOdds.quizBank.q4.scenario',
    question: 'potOdds.quizBank.q4.question',
    options: [
      { text: 'potOdds.quizBank.q4.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q4.optA.explanation' },
      { text: 'potOdds.quizBank.q4.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q4.optB.explanation' },
    ],
  },
  {
    id: 5,
    category: 'odds-judgment',
    scenario: 'potOdds.quizBank.q5.scenario',
    question: 'potOdds.quizBank.q5.question',
    options: [
      { text: 'potOdds.quizBank.q5.optA.text', isCorrect: false, explanation: 'potOdds.quizBank.q5.optA.explanation' },
      { text: 'potOdds.quizBank.q5.optB.text', isCorrect: true, explanation: 'potOdds.quizBank.q5.optB.explanation' },
    ],
  },
  {
    id: 6,
    category: 'outs-calculation',
    scenario: 'potOdds.quizBank.q6.scenario',
    question: 'potOdds.quizBank.q6.question',
    options: [
      { text: 'potOdds.quizBank.q6.optA.text', isCorrect: false, explanation: 'potOdds.quizBank.q6.optA.explanation' },
      { text: 'potOdds.quizBank.q6.optB.text', isCorrect: true, explanation: 'potOdds.quizBank.q6.optB.explanation' },
      { text: 'potOdds.quizBank.q6.optC.text', isCorrect: false, explanation: 'potOdds.quizBank.q6.optC.explanation' },
      { text: 'potOdds.quizBank.q6.optD.text', isCorrect: false, explanation: 'potOdds.quizBank.q6.optD.explanation' },
    ],
  },
  {
    id: 7,
    category: 'odds-judgment',
    scenario: 'potOdds.quizBank.q7.scenario',
    question: 'potOdds.quizBank.q7.question',
    options: [
      { text: 'potOdds.quizBank.q7.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q7.optA.explanation' },
      { text: 'potOdds.quizBank.q7.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q7.optB.explanation' },
    ],
  },
  {
    id: 8,
    category: 'implied-odds',
    scenario: 'potOdds.quizBank.q8.scenario',
    question: 'potOdds.quizBank.q8.question',
    options: [
      { text: 'potOdds.quizBank.q8.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q8.optA.explanation' },
      { text: 'potOdds.quizBank.q8.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q8.optB.explanation' },
    ],
  },
  {
    id: 9,
    category: 'reverse-implied',
    scenario: 'potOdds.quizBank.q9.scenario',
    question: 'potOdds.quizBank.q9.question',
    options: [
      { text: 'potOdds.quizBank.q9.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q9.optA.explanation' },
      { text: 'potOdds.quizBank.q9.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q9.optB.explanation' },
    ],
  },
  {
    id: 10,
    category: 'odds-judgment',
    scenario: 'potOdds.quizBank.q10.scenario',
    question: 'potOdds.quizBank.q10.question',
    options: [
      { text: 'potOdds.quizBank.q10.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q10.optA.explanation' },
      { text: 'potOdds.quizBank.q10.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q10.optB.explanation' },
    ],
  },
  {
    id: 11,
    category: 'outs-calculation',
    scenario: 'potOdds.quizBank.q11.scenario',
    question: 'potOdds.quizBank.q11.question',
    options: [
      { text: 'potOdds.quizBank.q11.optA.text', isCorrect: false, explanation: 'potOdds.quizBank.q11.optA.explanation' },
      { text: 'potOdds.quizBank.q11.optB.text', isCorrect: true, explanation: 'potOdds.quizBank.q11.optB.explanation' },
      { text: 'potOdds.quizBank.q11.optC.text', isCorrect: false, explanation: 'potOdds.quizBank.q11.optC.explanation' },
      { text: 'potOdds.quizBank.q11.optD.text', isCorrect: false, explanation: 'potOdds.quizBank.q11.optD.explanation' },
    ],
  },
  {
    id: 12,
    category: 'implied-odds',
    scenario: 'potOdds.quizBank.q12.scenario',
    question: 'potOdds.quizBank.q12.question',
    options: [
      { text: 'potOdds.quizBank.q12.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q12.optA.explanation' },
      { text: 'potOdds.quizBank.q12.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q12.optB.explanation' },
    ],
  },
  {
    id: 13,
    category: 'odds-judgment',
    scenario: 'potOdds.quizBank.q13.scenario',
    question: 'potOdds.quizBank.q13.question',
    options: [
      { text: 'potOdds.quizBank.q13.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q13.optA.explanation' },
      { text: 'potOdds.quizBank.q13.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q13.optB.explanation' },
    ],
  },
  {
    id: 14,
    category: 'reverse-implied',
    scenario: 'potOdds.quizBank.q14.scenario',
    question: 'potOdds.quizBank.q14.question',
    options: [
      { text: 'potOdds.quizBank.q14.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q14.optA.explanation' },
      { text: 'potOdds.quizBank.q14.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q14.optB.explanation' },
    ],
  },
  // ─── 以下为平衡题（id 15-19）：正确答案均为否定项，训练"识别 -EV 跟注" ───
  {
    id: 15,
    category: 'odds-judgment',
    balanceQuestion: true,
    scenario: 'potOdds.quizBank.q15.scenario',
    question: 'potOdds.quizBank.q15.question',
    options: [
      { text: 'potOdds.quizBank.q15.optA.text', isCorrect: false, explanation: 'potOdds.quizBank.q15.optA.explanation' },
      { text: 'potOdds.quizBank.q15.optB.text', isCorrect: true, explanation: 'potOdds.quizBank.q15.optB.explanation' },
    ],
  },
  {
    id: 16,
    category: 'odds-judgment',
    balanceQuestion: true,
    scenario: 'potOdds.quizBank.q16.scenario',
    question: 'potOdds.quizBank.q16.question',
    options: [
      { text: 'potOdds.quizBank.q16.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q16.optA.explanation' },
      { text: 'potOdds.quizBank.q16.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q16.optB.explanation' },
    ],
  },
  {
    id: 17,
    category: 'implied-odds',
    balanceQuestion: true,
    scenario: 'potOdds.quizBank.q17.scenario',
    question: 'potOdds.quizBank.q17.question',
    options: [
      { text: 'potOdds.quizBank.q17.optA.text', isCorrect: false, explanation: 'potOdds.quizBank.q17.optA.explanation' },
      { text: 'potOdds.quizBank.q17.optB.text', isCorrect: true, explanation: 'potOdds.quizBank.q17.optB.explanation' },
    ],
  },
  {
    id: 18,
    category: 'reverse-implied',
    balanceQuestion: true,
    scenario: 'potOdds.quizBank.q18.scenario',
    question: 'potOdds.quizBank.q18.question',
    options: [
      { text: 'potOdds.quizBank.q18.optA.text', isCorrect: false, explanation: 'potOdds.quizBank.q18.optA.explanation' },
      { text: 'potOdds.quizBank.q18.optB.text', isCorrect: true, explanation: 'potOdds.quizBank.q18.optB.explanation' },
    ],
  },
  {
    id: 19,
    category: 'implied-odds',
    balanceQuestion: true,
    scenario: 'potOdds.quizBank.q19.scenario',
    question: 'potOdds.quizBank.q19.question',
    options: [
      { text: 'potOdds.quizBank.q19.optA.text', isCorrect: true, explanation: 'potOdds.quizBank.q19.optA.explanation' },
      { text: 'potOdds.quizBank.q19.optB.text', isCorrect: false, explanation: 'potOdds.quizBank.q19.optB.explanation' },
    ],
  },
];
