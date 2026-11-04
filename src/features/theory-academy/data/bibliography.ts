import type { TheoryBibliographyEntry } from '../types';

/**
 * 理论学院参考书目（唯一事实源）。
 *
 * 只登记正文实际引用过或直接支撑章节结论的著作；titleKey / authorKey / noteKey 经
 * `theory.bibliography.<id>.*` 解析（见 locales/<lng>/theory-content/glossary.json），
 * 数据层只保留语言中立的年份与章节关联。
 */
export const THEORY_BIBLIOGRAPHY: TheoryBibliographyEntry[] = [
  {
    id: 'mop',
    titleKey: 'theory.bibliography.mop.title',
    authorKey: 'theory.bibliography.mop.author',
    year: 2006,
    noteKey: 'theory.bibliography.mop.note',
    relatedChapterIds: ['t1-combinatorics', 't1-variance', 't9-mop'],
  },
  {
    id: 'theory-of-poker',
    titleKey: 'theory.bibliography.theory-of-poker.title',
    authorKey: 'theory.bibliography.theory-of-poker.author',
    year: 1987,
    noteKey: 'theory.bibliography.theory-of-poker.note',
    relatedChapterIds: ['t2-ev', 't3-fundamental-theorem'],
  },
  {
    id: 'harrington-v1',
    titleKey: 'theory.bibliography.harrington-v1.title',
    authorKey: 'theory.bibliography.harrington-v1.author',
    year: 2004,
    noteKey: 'theory.bibliography.harrington-v1.note',
    relatedChapterIds: ['t1-combinatorics', 't1-outs', 't2-implied-odds'],
  },
  {
    id: 'harrington-v2',
    titleKey: 'theory.bibliography.harrington-v2.title',
    authorKey: 'theory.bibliography.harrington-v2.author',
    year: 2005,
    noteKey: 'theory.bibliography.harrington-v2.note',
    relatedChapterIds: ['t4-range-thinking', 't7-hand-reading'],
  },
  {
    id: 'applications',
    titleKey: 'theory.bibliography.applications.title',
    authorKey: 'theory.bibliography.applications.author',
    year: 2015,
    noteKey: 'theory.bibliography.applications.note',
    relatedChapterIds: ['t4-range-advantage', 't6-sizing-theory', 't6-srp-postflop'],
  },
  {
    id: 'grinders-manual',
    titleKey: 'theory.bibliography.grinders-manual.title',
    authorKey: 'theory.bibliography.grinders-manual.author',
    year: 2017,
    noteKey: 'theory.bibliography.grinders-manual.note',
    relatedChapterIds: ['t4-preflop-structure', 't6-3bet-pot'],
  },
  {
    id: 'modern-poker-theory',
    titleKey: 'theory.bibliography.modern-poker-theory.title',
    authorKey: 'theory.bibliography.modern-poker-theory.author',
    year: 2019,
    noteKey: 'theory.bibliography.modern-poker-theory.note',
    relatedChapterIds: ['t5-gto-concept', 't6-equity-realization', 't9-unified'],
  },
  {
    id: 'thinking-in-bets',
    titleKey: 'theory.bibliography.thinking-in-bets.title',
    authorKey: 'theory.bibliography.thinking-in-bets.author',
    year: 2018,
    noteKey: 'theory.bibliography.thinking-in-bets.note',
    relatedChapterIds: ['t8-mindset', 't3-fundamental-theorem'],
  },
  {
    id: 'mental-game',
    titleKey: 'theory.bibliography.mental-game.title',
    authorKey: 'theory.bibliography.mental-game.author',
    year: 2010,
    noteKey: 'theory.bibliography.mental-game.note',
    relatedChapterIds: ['t8-tilt', 't8-session'],
  },
  {
    id: 'elements-of-poker',
    titleKey: 'theory.bibliography.elements-of-poker.title',
    authorKey: 'theory.bibliography.elements-of-poker.author',
    year: 2007,
    noteKey: 'theory.bibliography.elements-of-poker.note',
    relatedChapterIds: ['t7-player-types', 't7-exploit'],
  },
];
