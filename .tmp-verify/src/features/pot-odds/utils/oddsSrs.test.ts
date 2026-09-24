import { describe, it, expect } from 'vitest';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import { buildOddsReviewItemInput } from './oddsSrs';
import zhPotOdds from '@/i18n/locales/zh/potOdds.json';
import enPotOdds from '@/i18n/locales/en/potOdds.json';

/**
 * 赔率复习项的 i18n key 契约守卫。
 *
 * 背景：历史实现把 `scenario` 截断为 40 字符摘要后存入 label，产出
 * `potOdds.quizBank.q1.scenar…` 这类残缺 key —— i18next 未命中时原样回显入参，
 * 中英文界面的复习卡片都会显示裸 key 片段（曾误判为「存了中文原文」）。
 * 本守卫锁死两件事：字段必须是完整 key、key 必须在双语包中都有译文。
 */

const CJK = /[㐀-鿿]/;
const TRUNCATION_MARK = /…$/;

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function allItemKeys(questionIndex: number): string[] {
  const { label, metadata } = buildOddsReviewItemInput(QUIZ_QUESTIONS[questionIndex]!);
  return [
    label,
    metadata.front,
    metadata.back,
    metadata.scenario,
    ...metadata.options.flatMap((o) => [o.text, o.explanation]),
  ];
}

describe('buildOddsReviewItemInput（复习项载荷）', () => {
  it('id 使用 odds: 命名空间，与理论 theory: 前缀隔离', () => {
    const { id } = buildOddsReviewItemInput(QUIZ_QUESTIONS[0]!);
    expect(id).toBe(`odds:${QUIZ_QUESTIONS[0]!.id}`);
  });

  it('back 取正确选项文本，且随正确选项变化', () => {
    for (const q of QUIZ_QUESTIONS) {
      const { metadata } = buildOddsReviewItemInput(q);
      const correctText = q.options.find((o) => o.isCorrect)?.text;
      expect(metadata.back).toBe(correctText);
      expect(metadata.back).not.toBe('');
    }
  });

  it('全量题目：载荷字段均为完整 i18n key（禁止截断、禁止写入原文）', () => {
    for (let i = 0; i < QUIZ_QUESTIONS.length; i += 1) {
      for (const key of allItemKeys(i)) {
        expect(key, `第 ${i + 1} 题载荷字段`).toMatch(/^potOdds\./);
        expect(TRUNCATION_MARK.test(key), `第 ${i + 1} 题出现截断省略号：${key}`).toBe(false);
        expect(CJK.test(key), `第 ${i + 1} 题 key 含中文原文：${key}`).toBe(false);
      }
    }
  });

  it('全量题目：每个 key 在 zh 与 en 的 potOdds 包中均能解析到非空译文', () => {
    for (let i = 0; i < QUIZ_QUESTIONS.length; i += 1) {
      const question = QUIZ_QUESTIONS[i]!;
      for (const key of allItemKeys(i)) {
        const path = key.replace(/^potOdds\./, '');
        const zhVal = getByPath(zhPotOdds, path);
        const enVal = getByPath(enPotOdds, path);
        expect(zhVal, `zh 缺失 ${key}（第 ${question.id} 题）`).toBeTruthy();
        expect(enVal, `en 缺失 ${key}（第 ${question.id} 题）`).toBeTruthy();
        expect(typeof zhVal).toBe('string');
        expect(typeof enVal).toBe('string');
      }
    }
  });
});
