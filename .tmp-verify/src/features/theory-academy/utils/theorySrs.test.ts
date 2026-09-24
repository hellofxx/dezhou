import { describe, expect, it } from 'vitest';
import {
  THEORY_REVIEW_ID_PREFIX,
  buildTheoryReviewItems,
  theoryChapterRoute,
  theoryReviewItemId,
} from './theorySrs';
import { theoryQuizExplanationKey, theoryQuizQuestionKey } from './contentKeys';
import { getTodayReviewItems } from '@/shared/utils/spacedRepetition';
import { ALL_VARIANT_THEORY_LEVELS } from '../data/levels/variants';
import type { TheoryChapter, TheoryQuizQuestion } from '../types';

/**
 * 理论章末错题 → SRS 复习项构造（纯函数）守卫。
 * 覆盖三件事：id 命名空间隔离、metadata/label 只存 i18n key（语言中立）、跳转路由指向章节页。
 */

/** 双语内容资源（文件名即 i18next 命名空间前缀，同 src/i18n/contentI18n.test.ts 口径） */
const localeResources = import.meta.glob<Record<string, unknown>>(
  '../../../i18n/locales/{zh,en}/theory.json',
  { import: 'default', eager: true },
);
const zhTheory = localeResources['../../../i18n/locales/zh/theory.json']!;
const enTheory = localeResources['../../../i18n/locales/en/theory.json']!;

/** 按 `theory.` 前缀剥离后在资源对象内逐段取值；缺失返回 undefined */
function resolveLocalized(resource: Record<string, unknown>, fullKey: string): string | undefined {
  const segments = fullKey.replace(/^theory\./, '').split('.');
  let node: unknown = resource;
  for (const seg of segments) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[seg];
  }
  return typeof node === 'string' ? node : undefined;
}

/** 汉字检测：英文界面回显中文的唯一可观测特征 */
const HAN = /[\u4e00-\u9fff]/;

function question(id: string, overrides: Partial<TheoryQuizQuestion> = {}): TheoryQuizQuestion {
  return {
    id,
    question: `${id} 的题干`,
    options: ['100 种', '200 种'],
    correctIndex: 0,
    explanation: `${id} 的解析`,
    ...overrides,
  };
}

function chapter(quiz: TheoryQuizQuestion[]): TheoryChapter {
  return {
    id: 't1-combinatorics',
    level: 1,
    order: 1,
    title: '组合计数',
    subtitle: '起手牌组合数',
    duration: '8 min',
    eloDimension: 'math',
    content: [],
    quiz,
    variant: 'standard',
  };
}

describe('theoryReviewItemId / theoryChapterRoute', () => {
  it('复习项 id 带 theory: 命名空间前缀', () => {
    expect(theoryReviewItemId('t1-combinatorics-q1')).toBe('theory:t1-combinatorics-q1');
  });

  it('不与策略学院以裸 lessonId 为键的复习项相撞（progress.addReviewItem 按 id 整体 upsert）', () => {
    // 假设题 id 与某课程 id 同名：加前缀后仍是两个互不吞并的键
    expect(theoryReviewItemId('l3-cbet')).not.toBe('l3-cbet');
  });

  it('章节路由与 routes.tsx 的 /theory/chapter/:chapterId 对齐', () => {
    expect(theoryChapterRoute('t1-combinatorics')).toBe('/theory/chapter/t1-combinatorics');
  });
});

describe('buildTheoryReviewItems（错题 → 复习项）', () => {
  const quiz = [question('t1-combinatorics-q1'), question('t1-combinatorics-q2')];

  it('空错题列表不产出复习项', () => {
    expect(buildTheoryReviewItems(chapter(quiz), [])).toEqual([]);
  });

  it('每题一项：id 带命名空间、category 为 theory', () => {
    const items = buildTheoryReviewItems(chapter(quiz), ['t1-combinatorics-q2']);
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item?.id).toBe('theory:t1-combinatorics-q2');
    expect(item?.category).toBe('theory');
  });

  it('label / metadata.front / metadata.back 存的是内容 key，不是任何语言的原文', () => {
    const [item] = buildTheoryReviewItems(chapter(quiz), ['t1-combinatorics-q1']);
    expect(item?.label).toBe(theoryQuizQuestionKey('t1-combinatorics-q1'));
    expect(item?.metadata).toEqual({
      source: 'theory',
      route: '/theory/chapter/t1-combinatorics',
      front: theoryQuizQuestionKey('t1-combinatorics-q1'),
      back: theoryQuizExplanationKey('t1-combinatorics-q1'),
    });
  });

  it('持久化载荷语言中立：整个复习项序列化后不含汉字（英文界面不再回显中文）', () => {
    const items = buildTheoryReviewItems(chapter(quiz), ['t1-combinatorics-q1', 't1-combinatorics-q2']);
    expect(HAN.test(JSON.stringify(items))).toBe(false);
  });

  it('不写 metadata.options —— 复习模式据此走 front/back 自评而非多选（ReviewSession 判定）', () => {
    const [item] = buildTheoryReviewItems(chapter(quiz), ['t1-combinatorics-q1']);
    expect(item?.metadata?.options).toBeUndefined();
    expect(item?.metadata?.front).toBeTruthy();
  });

  it('不接收渲染层译文（避免持久化随语言漂移）：入参 chapter 的原文不出现在产物中', () => {
    const items = buildTheoryReviewItems(chapter(quiz), ['t1-combinatorics-q1']);
    expect(JSON.stringify(items)).not.toContain(quiz[0]?.question);
    expect(JSON.stringify(items[0])).not.toContain('undefined');
  });

  it('新入队项今日不到期（明天才开始复习）', () => {
    const items = buildTheoryReviewItems(chapter(quiz), ['t1-combinatorics-q1', 't1-combinatorics-q2']);
    expect(getTodayReviewItems(items)).toEqual([]);
  });

  it('未知题 id 静默跳过（数据不一致时不写入空项）', () => {
    const items = buildTheoryReviewItems(chapter(quiz), ['ghost-q9', 't1-combinatorics-q1']);
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('theory:t1-combinatorics-q1');
  });

  it('重复题 id 会产出重复项 —— 幂等性由 progress.addReviewItem 的按 id upsert 保证', () => {
    const items = buildTheoryReviewItems(chapter(quiz), [
      't1-combinatorics-q1',
      't1-combinatorics-q1',
    ]);
    expect(items.map((i) => i.id)).toEqual([
      'theory:t1-combinatorics-q1',
      'theory:t1-combinatorics-q1',
    ]);
  });
});

describe('理论复习项 key ↔ 双语内容资源契约', () => {
  /**
   * 渲染层（ReviewSession / SpacedRepetitionPanel）对 label/front/back 调 t() 且无 defaultValue 兜底，
   * 故 key 必须在 zh 与 en 同时命中，且 en 侧必须是英文而非中文占位。
   * 覆盖真实题库全部章节与题目（不重复实现 contentI18n 的通用遍历，只断言本模块产物）。
   */
  it('真实题库构造的每个复习项，其 key 在 zh/en 均命中且 en 解析结果不含汉字', () => {
    const failures: string[] = [];
    let checked = 0;

    for (const level of ALL_VARIANT_THEORY_LEVELS) {
      for (const levelChapter of level.chapters) {
        const items = buildTheoryReviewItems(
          levelChapter,
          levelChapter.quiz.map((q) => q.id),
        );
        // 题 id 与章节数据一一对应（无静默丢失）
        expect(items.length).toBe(levelChapter.quiz.length);

        for (const item of items) {
          const questionId = item.id.slice(THEORY_REVIEW_ID_PREFIX.length);
          const fields: ReadonlyArray<readonly [string, string | undefined]> = [
            ['label', item.label],
            ['front', item.metadata?.front],
            ['back', item.metadata?.back],
          ];
          for (const [field, key] of fields) {
            checked += 1;
            if (typeof key !== 'string') {
              failures.push(`${item.id}.${field}: not-a-string`);
              continue;
            }
            // 必须是 contentKeys 单源函数产出的 key（禁手拼）
            const expected =
              field === 'back'
                ? theoryQuizExplanationKey(questionId)
                : theoryQuizQuestionKey(questionId);
            if (key !== expected) failures.push(`${item.id}.${field}: unexpected-key ${key}`);
            const zh = resolveLocalized(zhTheory, key);
            const en = resolveLocalized(enTheory, key);
            if (!zh) failures.push(`${item.id}.${field}: zh-missing ${key}`);
            if (!en) failures.push(`${item.id}.${field}: en-missing ${key}`);
            else if (HAN.test(en)) failures.push(`${item.id}.${field}: en-resolves-to-chinese`);
          }
        }
      }
    }

    expect(checked).toBeGreaterThan(0);
    expect(failures.slice(0, 10)).toEqual([]);
  });

  it('同一题在 zh 与 en 资源下解析出不同文本（证明译文随语言切换而非固定回显）', () => {
    const target = ALL_VARIANT_THEORY_LEVELS[0]?.chapters[0];
    const questionId = target?.quiz[0]?.id;
    expect(questionId).toBeTruthy();
    const key = theoryQuizQuestionKey(questionId!);
    const zh = resolveLocalized(zhTheory, key);
    const en = resolveLocalized(enTheory, key);
    expect(zh && HAN.test(zh)).toBe(true);
    expect(en && HAN.test(en)).toBe(false);
    expect(en).not.toBe(zh);
  });
});
