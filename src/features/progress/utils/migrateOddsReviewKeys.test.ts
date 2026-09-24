import { describe, it, expect } from 'vitest';
import { migrateOddsReviewItems } from './migrateOddsReviewKeys';
import zhPotOdds from '@/i18n/locales/zh/potOdds.json';
import enPotOdds from '@/i18n/locales/en/potOdds.json';

/**
 * v17 → v18 赔率复习项迁移守卫。
 *
 * 覆盖三类存量形态：
 * a) 残缺 key（历史 `slice(0,40)` 摘要产物）→ label 归一为完整 key；
 * b) 最早期的中文原文版 → label/front/scenario 归一、含原文的 options 整体移除、back 清空；
 * c) options 已是 key 形态时，back 从正确选项 key 修复。
 * 另锁死与 pot-odds 侧单源的镜像一致性（id 前缀 + key 模板）与幂等性。
 */

/** 残缺 key 形态（近期版本产物：front/back 已是 key，label 被截断） */
function truncatedItem(): Record<string, unknown> {
  return {
    id: 'odds:3',
    label: 'potOdds.quizBank.q3.scenar…',
    category: 'odds',
    easeFactor: 2.6,
    interval: 7,
    repetitions: 2,
    nextReviewDate: '2026-09-10',
    lastReviewedAt: 1757000000000,
    metadata: {
      front: 'potOdds.quizBank.q3.question',
      back: 'potOdds.quizBank.q3.optA.text',
      options: [
        {
          text: 'potOdds.quizBank.q3.optA.text',
          isCorrect: true,
          explanation: 'potOdds.quizBank.q3.optA.explanation',
        },
        {
          text: 'potOdds.quizBank.q3.optB.text',
          isCorrect: false,
          explanation: 'potOdds.quizBank.q3.optB.explanation',
        },
      ],
      source: 'odds',
      scenario: 'potOdds.quizBank.q3.scenario',
    },
  };
}

/** 中文原文形态（最早期版本产物） */
function legacyChineseItem(): Record<string, unknown> {
  return {
    id: 'odds:5',
    label: '底池 $80，对手下注 $80（满池下注）',
    category: 'odds',
    easeFactor: 2.5,
    interval: 3,
    repetitions: 1,
    nextReviewDate: '2026-09-08',
    metadata: {
      front: '你应该跟注吗？',
      back: '不该跟注',
      options: [
        { text: '跟注', isCorrect: false, explanation: '直接赔率不够' },
        { text: '弃牌', isCorrect: true, explanation: 'EV 为负' },
      ],
      source: 'odds',
      scenario: '底池 $80，对手下注 $80（满池下注）',
    },
  };
}

describe('migrateOddsReviewItems（v17 → v18）', () => {
  it('残缺 key：仅 label 归一，front/back/options 与进度字段原样保留', () => {
    const input = [truncatedItem()];
    const out = migrateOddsReviewItems(input) as Array<Record<string, unknown>>;
    expect(out).not.toBe(input);
    const item = out[0] as Record<string, unknown>;
    expect(item.label).toBe('potOdds.quizBank.q3.scenario');
    const metadata = item.metadata as Record<string, unknown>;
    expect(metadata.front).toBe('potOdds.quizBank.q3.question');
    expect(metadata.back).toBe('potOdds.quizBank.q3.optA.text');
    expect(metadata.options).toHaveLength(2);
    // 复习进度零丢失
    expect(item.interval).toBe(7);
    expect(item.easeFactor).toBe(2.6);
    expect(item.repetitions).toBe(2);
    expect(item.nextReviewDate).toBe('2026-09-10');
  });

  it('中文原文版：label/front/scenario 归一，含原文的 options 移除，back 清空', () => {
    const out = migrateOddsReviewItems([legacyChineseItem()]) as Array<Record<string, unknown>>;
    const item = out[0] as Record<string, unknown>;
    expect(item.label).toBe('potOdds.quizBank.q5.scenario');
    const metadata = item.metadata as Record<string, unknown>;
    expect(metadata.front).toBe('potOdds.quizBank.q5.question');
    expect(metadata.scenario).toBe('potOdds.quizBank.q5.scenario');
    expect(metadata.options).toBeUndefined();
    expect(metadata.back).toBe('');
    // 调度进度保留
    expect(item.interval).toBe(3);
  });

  it('options 为 key 形态时，back 从正确选项的 key 修复', () => {
    const item = truncatedItem();
    (item.metadata as Record<string, unknown>).back = 'potOdds.quizBank.q3.optB.text';
    const out = migrateOddsReviewItems([item]) as Array<Record<string, unknown>>;
    const metadata = (out[0] as Record<string, unknown>).metadata as Record<string, unknown>;
    expect(metadata.back).toBe('potOdds.quizBank.q3.optA.text');
  });

  it('幂等：迁移结果再跑一次不产生任何改写（原数组引用直接返回）', () => {
    const first = migrateOddsReviewItems([truncatedItem(), legacyChineseItem()]);
    const second = migrateOddsReviewItems(first);
    expect(second).toBe(first);
  });

  it('非 odds 项（theory/strategy 等）保持原对象引用不动', () => {
    const theoryItem = { id: 'theory:t1-q1', label: 'theory.quiz.t1-q1.question' };
    const strategyItem = { id: 'l4-mdf', label: 'academy.lessonTitle.l4-mdf' };
    const items = [theoryItem, strategyItem];
    const out = migrateOddsReviewItems(items);
    expect(out).toBe(items);
  });

  it('占位 id（odds:0）与非数字 id 保守跳过，不凭空生成 key', () => {
    const items = [
      { id: 'odds:0', label: 'x', metadata: { front: 'y', back: 'z' } },
      { id: 'odds:rescue-1', label: 'x', metadata: { front: 'y', back: 'z' } },
      { id: 'odds:', label: 'x' },
    ];
    const out = migrateOddsReviewItems(items);
    expect(out).toBe(items);
  });

  it('脏数据安全：非数组原样返回，数组内非对象元素跳过', () => {
    expect(migrateOddsReviewItems(undefined)).toBeUndefined();
    expect(migrateOddsReviewItems('nope')).toBe('nope');
    const items = [null, 42, 'odds:3', { id: 'odds:3' }];
    const out = migrateOddsReviewItems(items) as unknown[];
    expect(out).toBe(items);
    expect(out[0]).toBeNull();
    expect(out[3]).toEqual({ id: 'odds:3' });
  });

  it('镜像守卫：派生 key 在 zh/en 的 potOdds 包中全部真实存在', () => {
    const zhRoot = zhPotOdds as unknown as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    const enRoot = enPotOdds as unknown as Record<string, Record<string, unknown>>;
    const zhQuizBank = zhRoot.quizBank;
    const enQuizBank = enRoot.quizBank;
    if (!zhQuizBank || !enQuizBank) throw new Error('potOdds locale 缺少 quizBank 段');
    const questionIds = Object.keys(zhQuizBank);
    expect(questionIds.length).toBeGreaterThan(0);
    for (const qKey of questionIds) {
      for (const field of ['scenario', 'question']) {
        expect(zhQuizBank[qKey]?.[field], `zh 缺失 quizBank.${qKey}.${field}`).toBeDefined();
      }
      expect(enQuizBank[qKey], `en 缺失 ${qKey}`).toBeDefined();
    }
  });
});
