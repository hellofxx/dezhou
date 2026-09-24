/**
 * 帮助中心纯数据层 — 只存 i18n key，不含硬编码文案。
 * 所有用户可见文本通过 `help.*` 命名空间在 zh.json / en.json 中维护。
 */
import type { HelpArticle, FaqItem, ConceptCard } from '../types';

/** 9 篇教程文章（8 模块 + 平台总览） */
export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'overview',
    modulePath: '/',
    titleKey: 'articles.overview.title',
    introKey: 'articles.overview.intro',
    icon: 'book-open',
    accent: 'brass',
    sections: [
      { type: 'paragraph', key: 'articles.overview.s0' },
      { type: 'steps', key: 'articles.overview.s1', stepKeys: ['articles.overview.s1-steps.0', 'articles.overview.s1-steps.1', 'articles.overview.s1-steps.2', 'articles.overview.s1-steps.3'] },
      { type: 'tip', key: 'articles.overview.s2' },
      { type: 'link', key: 'articles.overview.s3', to: '/progress' },
    ],
  },
  {
    id: 'range-trainer',
    modulePath: '/range-trainer',
    titleKey: 'articles.range-trainer.title',
    introKey: 'articles.range-trainer.intro',
    icon: 'target',
    accent: 'brass',
    sections: [
      { type: 'paragraph', key: 'articles.range-trainer.s0' },
      { type: 'steps', key: 'articles.range-trainer.s1', stepKeys: ['articles.range-trainer.s1-steps.0', 'articles.range-trainer.s1-steps.1', 'articles.range-trainer.s1-steps.2', 'articles.range-trainer.s1-steps.3'] },
      { type: 'tip', key: 'articles.range-trainer.s2' },
      { type: 'link', key: 'articles.range-trainer.s3', to: '/range-trainer' },
    ],
  },
  {
    id: 'pot-odds',
    modulePath: '/pot-odds',
    titleKey: 'articles.pot-odds.title',
    introKey: 'articles.pot-odds.intro',
    icon: 'calculator',
    accent: 'info',
    sections: [
      { type: 'paragraph', key: 'articles.pot-odds.s0' },
      { type: 'steps', key: 'articles.pot-odds.s1', stepKeys: ['articles.pot-odds.s1-steps.0', 'articles.pot-odds.s1-steps.1', 'articles.pot-odds.s1-steps.2'] },
      { type: 'tip', key: 'articles.pot-odds.s2' },
      { type: 'link', key: 'articles.pot-odds.s3', to: '/pot-odds' },
    ],
  },
  {
    id: 'gto-simulator',
    modulePath: '/gto-simulator',
    titleKey: 'articles.gto-simulator.title',
    introKey: 'articles.gto-simulator.intro',
    icon: 'gamepad2',
    accent: 'frost',
    sections: [
      { type: 'paragraph', key: 'articles.gto-simulator.s0' },
      { type: 'steps', key: 'articles.gto-simulator.s1', stepKeys: ['articles.gto-simulator.s1-steps.0', 'articles.gto-simulator.s1-steps.1', 'articles.gto-simulator.s1-steps.2', 'articles.gto-simulator.s1-steps.3'] },
      { type: 'tip', key: 'articles.gto-simulator.s2' },
      { type: 'link', key: 'articles.gto-simulator.s3', to: '/gto-simulator' },
    ],
  },
  {
    id: 'academy',
    modulePath: '/academy',
    titleKey: 'articles.academy.title',
    introKey: 'articles.academy.intro',
    icon: 'graduation-cap',
    accent: 'success',
    sections: [
      { type: 'paragraph', key: 'articles.academy.s0' },
      { type: 'steps', key: 'articles.academy.s1', stepKeys: ['articles.academy.s1-steps.0', 'articles.academy.s1-steps.1', 'articles.academy.s1-steps.2', 'articles.academy.s1-steps.3'] },
      { type: 'tip', key: 'articles.academy.s2' },
      { type: 'link', key: 'articles.academy.s3', to: '/academy' },
    ],
  },
  {
    id: 'theory',
    modulePath: '/theory',
    titleKey: 'articles.theory.title',
    introKey: 'articles.theory.intro',
    icon: 'library',
    accent: 'brass',
    sections: [
      { type: 'paragraph', key: 'articles.theory.s0' },
      { type: 'steps', key: 'articles.theory.s1', stepKeys: ['articles.theory.s1-steps.0', 'articles.theory.s1-steps.1', 'articles.theory.s1-steps.2'] },
      { type: 'tip', key: 'articles.theory.s2' },
      { type: 'link', key: 'articles.theory.s3', to: '/theory' },
    ],
  },
  {
    id: 'puzzle',
    modulePath: '/puzzle',
    titleKey: 'articles.puzzle.title',
    introKey: 'articles.puzzle.intro',
    icon: 'puzzle',
    accent: 'brass',
    sections: [
      { type: 'paragraph', key: 'articles.puzzle.s0' },
      { type: 'steps', key: 'articles.puzzle.s1', stepKeys: ['articles.puzzle.s1-steps.0', 'articles.puzzle.s1-steps.1', 'articles.puzzle.s1-steps.2', 'articles.puzzle.s1-steps.3'] },
      { type: 'tip', key: 'articles.puzzle.s2' },
      { type: 'link', key: 'articles.puzzle.s3', to: '/puzzle' },
    ],
  },
  {
    id: 'hand-history',
    modulePath: '/hand-history',
    titleKey: 'articles.hand-history.title',
    introKey: 'articles.hand-history.intro',
    icon: 'clipboard-list',
    accent: 'leather',
    sections: [
      { type: 'paragraph', key: 'articles.hand-history.s0' },
      { type: 'steps', key: 'articles.hand-history.s1', stepKeys: ['articles.hand-history.s1-steps.0', 'articles.hand-history.s1-steps.1', 'articles.hand-history.s1-steps.2', 'articles.hand-history.s1-steps.3'] },
      { type: 'tip', key: 'articles.hand-history.s2' },
      { type: 'link', key: 'articles.hand-history.s3', to: '/hand-history' },
    ],
  },
  {
    id: 'progress',
    modulePath: '/progress',
    titleKey: 'articles.progress.title',
    introKey: 'articles.progress.intro',
    icon: 'bar-chart3',
    accent: 'info',
    sections: [
      { type: 'paragraph', key: 'articles.progress.s0' },
      { type: 'steps', key: 'articles.progress.s1', stepKeys: ['articles.progress.s1-steps.0', 'articles.progress.s1-steps.1', 'articles.progress.s1-steps.2'] },
      { type: 'tip', key: 'articles.progress.s2' },
      { type: 'link', key: 'articles.progress.s3', to: '/progress' },
    ],
  },
];

/** 5 步快速上手路径 */
export const QUICK_START_STEPS: { key: string; to: string }[] = [
  { key: 'quickStart.steps.0', to: '/onboarding' },
  { key: 'quickStart.steps.1', to: '/academy' },
  { key: 'quickStart.steps.2', to: '/academy/quick-drill' },
  { key: 'quickStart.steps.3', to: '/' },
  { key: 'quickStart.steps.4', to: '/progress' },
];

/** 6 个系统概念卡片 */
export const CONCEPT_CARDS: ConceptCard[] = [
  { key: 'concepts.elo', iconKey: 'gauge' },
  { key: 'concepts.streak', iconKey: 'flame' },
  { key: 'concepts.srs', iconKey: 'repeat' },
  { key: 'concepts.feedback', iconKey: 'award' },
  { key: 'concepts.sessionLimit', iconKey: 'clock' },
  { key: 'concepts.dataStorage', iconKey: 'database' },
];

/** 8 条 FAQ */
export const FAQ_ITEMS: FaqItem[] = [
  { questionKey: 'faq.q0.question', answerKey: 'faq.q0.answer' },
  { questionKey: 'faq.q1.question', answerKey: 'faq.q1.answer' },
  { questionKey: 'faq.q2.question', answerKey: 'faq.q2.answer' },
  { questionKey: 'faq.q3.question', answerKey: 'faq.q3.answer' },
  { questionKey: 'faq.q4.question', answerKey: 'faq.q4.answer' },
  { questionKey: 'faq.q5.question', answerKey: 'faq.q5.answer' },
  { questionKey: 'faq.q6.question', answerKey: 'faq.q6.answer' },
  { questionKey: 'faq.q7.question', answerKey: 'faq.q7.answer' },
];
