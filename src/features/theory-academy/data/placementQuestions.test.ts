import { describe, it, expect } from 'vitest';
import {
  PLACEMENT_OPTION_COUNT,
  THEORY_PLACEMENT_QUESTIONS,
  placementExplanationKey,
  placementOptionKey,
  placementQuestionKey,
} from './placementQuestions';
import { orderPlacementOptions } from '../utils/placement';

/**
 * 定位测评题库 ↔ i18n 对齐守卫。
 *
 * 题库文案只存 key（theory.placement.questions.<id>.*），数据层不存原文，
 * 故这里承担 localeParity / contentAlignment 覆盖不到的三类校验：
 * 1. 双语 key 齐备且选项数一致（缺 key 会把 key 面字渲染给用户）；
 * 2. en 不含汉字（避免中文原文漏进英文界面）；
 * 3. 选项展示顺序与正确项展示位置跨语言一致（种子只依赖题 id，语言不得改变顺序）。
 */
type LocaleTree = { placement?: { questions?: Record<string, LocaleQuestion> } };
type LocaleQuestion = { question?: string; options?: string[]; explanation?: string };

const zhModules = import.meta.glob<LocaleTree>('../../../i18n/locales/zh/theory.json', {
  import: 'default',
  eager: true,
});
const enModules = import.meta.glob<LocaleTree>('../../../i18n/locales/en/theory.json', {
  import: 'default',
  eager: true,
});

function loadLocale(modules: Record<string, LocaleTree>, label: string): Record<string, LocaleQuestion> {
  const entry = Object.values(modules)[0];
  const questions = entry?.placement?.questions;
  if (!questions) throw new Error(`无法读取 ${label}/theory.json 的 placement.questions`);
  return questions;
}

const zhQuestions = loadLocale(zhModules, 'zh');
const enQuestions = loadLocale(enModules, 'en');
const HAN_RE = /[\u4e00-\u9cff]/;

describe('定位测评题库 i18n 齐备性', () => {
  it('扫描面有效（16 题双语均在）', () => {
    expect(THEORY_PLACEMENT_QUESTIONS).toHaveLength(16);
    expect(Object.keys(zhQuestions)).toHaveLength(16);
    expect(Object.keys(enQuestions)).toHaveLength(16);
  });

  it('每题题干 / 4 个选项 / 解析在 zh 与 en 均存在且非空', () => {
    for (const question of THEORY_PLACEMENT_QUESTIONS) {
      for (const [label, locale] of [
        ['zh', zhQuestions],
        ['en', enQuestions],
      ] as const) {
        const entry = locale[question.id];
        expect(entry, `${label}/${question.id}`).toBeDefined();
        expect(entry?.question?.trim(), `${label}/${question.id}.question`).toBeTruthy();
        expect(entry?.explanation?.trim(), `${label}/${question.id}.explanation`).toBeTruthy();
        expect(entry?.options, `${label}/${question.id}.options`).toHaveLength(PLACEMENT_OPTION_COUNT);
        for (const option of entry?.options ?? []) {
          expect(option.trim()).toBeTruthy();
        }
      }
    }
  });

  it('key 生成函数与 +PLACEMENT_OPTION_COUNT 口径一致', () => {
    expect(placementQuestionKey('pl-t1-combos')).toBe('theory.placement.questions.pl-t1-combos.question');
    expect(placementOptionKey('pl-t1-combos', 2)).toBe('theory.placement.questions.pl-t1-combos.options.2');
    expect(placementExplanationKey('pl-t1-combos')).toBe(
      'theory.placement.questions.pl-t1-combos.explanation',
    );
  });

  it('en 侧不含汉字（中文原文不得漏进英文界面）', () => {
    const offenders: string[] = [];
    for (const [id, entry] of Object.entries(enQuestions)) {
      const texts = [entry.question ?? '', entry.explanation ?? '', ...(entry.options ?? [])];
      if (texts.some((text) => HAN_RE.test(text))) offenders.push(id);
    }
    expect(offenders).toEqual([]);
  });
});

describe('选项展示顺序跨语言一致', () => {
  it('每题 zh / en 的正确项展示位置完全相同', () => {
    for (const question of THEORY_PLACEMENT_QUESTIONS) {
      const zhOptions = zhQuestions[question.id]?.options ?? [];
      const enOptions = enQuestions[question.id]?.options ?? [];
      const zhOrdered = orderPlacementOptions(question.id, zhOptions, question.correctIndex);
      const enOrdered = orderPlacementOptions(question.id, enOptions, question.correctIndex);
      expect(
        zhOrdered.findIndex((option) => option.isCorrect),
        `${question.id} 正确项位置`,
      ).toBe(enOrdered.findIndex((option) => option.isCorrect));
    }
  });

  it('正确项展示位置在题库内分散（不集中在单一位置）', () => {
    const positions = THEORY_PLACEMENT_QUESTIONS.map((question) =>
      orderPlacementOptions(
        question.id,
        zhQuestions[question.id]?.options ?? [],
        question.correctIndex,
      ).findIndex((option) => option.isCorrect),
    );
    expect(new Set(positions).size).toBeGreaterThanOrEqual(3);
    const occurrences = positions.reduce<Record<number, number>>((acc, position) => {
      acc[position] = (acc[position] ?? 0) + 1;
      return acc;
    }, {});
    const max = Math.max(...Object.values(occurrences));
    expect(max / positions.length).toBeLessThan(0.5);
  });
});
