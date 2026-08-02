import { describe, it, expect } from 'vitest';
import { HELP_ARTICLES, QUICK_START_STEPS, CONCEPT_CARDS, FAQ_ITEMS } from './helpContent';
import type { HelpAccent } from '../types';

const VALID_ICONS = new Set([
  'target', 'calculator', 'gamepad2', 'graduation-cap', 'library',
  'puzzle', 'clipboard-list', 'bar-chart3', 'book-open',
]);

const VALID_ACCENTS = new Set<HelpAccent>(['brass', 'info', 'success', 'frost', 'leather']);

describe('helpContent integrity', () => {
  it('HELP_ARTICLES id 唯一', () => {
    const ids = HELP_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('HELP_ARTICLES icon 在允许集合内', () => {
    for (const article of HELP_ARTICLES) {
      expect(VALID_ICONS.has(article.icon)).toBe(true);
    }
  });

  it('HELP_ARTICLES accent 在允许集合内', () => {
    for (const article of HELP_ARTICLES) {
      expect(VALID_ACCENTS.has(article.accent)).toBe(true);
    }
  });

  it('HELP_ARTICLES modulePath 以 / 开头', () => {
    for (const article of HELP_ARTICLES) {
      expect(article.modulePath.startsWith('/')).toBe(true);
    }
  });

  it('HELP_ARTICLES sections 非空且 key 非空', () => {
    for (const article of HELP_ARTICLES) {
      expect(article.sections.length).toBeGreaterThan(0);
      for (const section of article.sections) {
        expect(section.key.length).toBeGreaterThan(0);
      }
    }
  });

  it('HELP_ARTICLES 共 9 篇', () => {
    expect(HELP_ARTICLES.length).toBe(9);
  });

  it('QUICK_START_STEPS 长度 = 5', () => {
    expect(QUICK_START_STEPS.length).toBe(5);
  });

  it('QUICK_START_STEPS to 以 / 开头', () => {
    for (const step of QUICK_START_STEPS) {
      expect(step.to.startsWith('/')).toBe(true);
    }
  });

  it('CONCEPT_CARDS 长度 = 6', () => {
    expect(CONCEPT_CARDS.length).toBe(6);
  });

  it('FAQ_ITEMS >= 8', () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(8);
  });

  it('FAQ_ITEMS key 非空', () => {
    for (const item of FAQ_ITEMS) {
      expect(item.questionKey.length).toBeGreaterThan(0);
      expect(item.answerKey.length).toBeGreaterThan(0);
    }
  });
});
