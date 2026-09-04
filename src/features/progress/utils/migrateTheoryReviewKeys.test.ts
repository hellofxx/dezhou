import { describe, expect, it } from 'vitest';
import { generateContentEntries } from '@/i18n/contentKeyEntries';
import { migrateTheoryReviewItems } from './migrateTheoryReviewKeys';

/**
 * 理论复习项「中文原文 → i18n key」改写纯函数用例（v15 → v16 迁移的实现体）。
 *
 * 背景：复习项存 localStorage，而 i18next 未命中 key 时原样回显入参 ——
 * 早期实现写入的中文原文会让英文界面复习队列显示中文题干/解析。
 * questionId 可从 `theory:<questionId>` 形式的 id 无损反解，
 * 故迁移确定性、幂等，且复习进度零丢失。
 *
 * key 镜像守卫：期望值取自 @/i18n/contentKeyEntries —— 该表的 key 由 theory-academy 侧
 * 单源 contentKeys 函数从题库数据推导。progress 无法 import theory-academy
 * （eslint.config.js ALLOWED_CROSS_IMPORTS: progress: []，清单只删不加），
 * 故辅助函数内的 key 拼接是镜像拷贝，其与单源的一致性由本文件的「镜像守卫」用例锁死。
 */

type Item = Record<string, unknown>;
type Meta = Record<string, unknown>;

const meta = (item: Item): Meta => item.metadata as Meta;

// ===== 真实题库探针（条目值即数据层中文原文，与线上存量脏数据同形）=====
const entries = generateContentEntries();
const questionKey = [...entries.keys()].find(
  (k) => k.startsWith('theory.quiz.') && k.endsWith('.question'),
)!;
const questionId = questionKey.slice('theory.quiz.'.length, -'.question'.length);
const explanationKey = [...entries.keys()].find(
  (k) => k.startsWith(`theory.quiz.${questionId}.`) && k.endsWith('.explanation'),
)!;
const legacyQuestionText = entries.get(questionKey)!;
const legacyExplanationText = entries.get(explanationKey)!;

const legacyItem = (): Item => ({
  id: `theory:${questionId}`,
  label: legacyQuestionText,
  category: 'theory',
  easeFactor: 2.3,
  interval: 7,
  repetitions: 3,
  nextReviewDate: '2026-01-01',
  lastReviewedAt: 1_735_689_600_000,
  metadata: {
    source: 'theory',
    route: '/theory/chapter/t1-combinatorics',
    front: legacyQuestionText,
    back: legacyExplanationText,
  },
});

describe('探针与 key 镜像守卫', () => {
  it('取到真实理论题，其条目值为中文原文（保证脏数据 fixture 与线上同形）', () => {
    expect(questionId.length).toBeGreaterThan(0);
    expect(legacyQuestionText).toMatch(/[一-鿿]/);
    expect(legacyExplanationText).toMatch(/[一-鿿]/);
  });

  it('镜像拼接的 key 命中 contentKeys 单源产物（漂移即红）', () => {
    const result = migrateTheoryReviewItems([legacyItem()]) as Item[];
    const [migrated] = result;
    // 断言对象是单源推导出的 key 本身，而非本文件重述的字符串
    expect(migrated!.label).toBe(questionKey);
    expect(meta(migrated!).front).toBe(questionKey);
    expect(meta(migrated!).back).toBe(explanationKey);
    // 改写后三项均可在内容条目表中查到（渲染层 t() 能命中，不再回显原文）
    expect(entries.has(migrated!.label as string)).toBe(true);
    expect(entries.has(meta(migrated!).front as string)).toBe(true);
    expect(entries.has(meta(migrated!).back as string)).toBe(true);
  });
});

describe('migrateTheoryReviewItems 改写与保全', () => {
  it('中文原文项 → 三字段改写为 key；复习进度与其余字段逐项不变', () => {
    const source = legacyItem();
    const [migrated] = migrateTheoryReviewItems([source]) as Item[];

    expect(migrated).not.toBe(source);
    expect(meta(migrated!).back).toBe(explanationKey);

    // 复习进度零丢失：逐项与原值同一
    expect(migrated!.interval).toBe(source.interval);
    expect(migrated!.easeFactor).toBe(source.easeFactor);
    expect(migrated!.repetitions).toBe(source.repetitions);
    expect(migrated!.nextReviewDate).toBe(source.nextReviewDate);
    expect(migrated!.lastReviewedAt).toBe(source.lastReviewedAt);
    expect(migrated!.id).toBe(source.id);
    expect(migrated!.category).toBe(source.category);
    expect(meta(migrated!).source).toBe('theory');
    expect(meta(migrated!).route).toBe('/theory/chapter/t1-combinatorics');
    // 原对象未被原地修改（纯函数式改写，禁止污染调用方数据）
    expect(source.label).toBe(legacyQuestionText);
    expect(meta(source).front).toBe(legacyQuestionText);
  });

  it('幂等：已是 key 形态的项不变（元素与数组引用都不变）', () => {
    const keyed: Item = {
      id: `theory:${questionId}`,
      label: questionKey,
      category: 'theory',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: '2026-02-02',
      metadata: { source: 'theory', front: questionKey, back: explanationKey },
    };
    const seed = [keyed];
    const first = migrateTheoryReviewItems(seed);
    expect(first).toBe(seed);
    // 二次执行（重复 migrate / 版本回退后再升级）结果不变
    const second = migrateTheoryReviewItems(first);
    expect(second).toBe(seed);
    expect((second as Item[])[0]).toBe(keyed);
  });

  it('部分脏字段：仅 label 为中文时只改 label，已是 key 的 front/back 不触碰', () => {
    const partial: Item = {
      id: `theory:${questionId}`,
      label: legacyQuestionText,
      category: 'theory',
      interval: 14,
      metadata: { front: questionKey, back: explanationKey },
    };
    const [migrated] = migrateTheoryReviewItems([partial]) as Item[];
    expect(migrated!.label).toBe(questionKey);
    expect(migrated!.interval).toBe(14);
    expect(migrated!.metadata).toBe(partial.metadata); // 未变则保留原 metadata 引用
  });

  it('仅 back 为中文时只改 back，label/front 原样', () => {
    const onlyBack: Item = {
      id: `theory:${questionId}`,
      label: questionKey,
      metadata: { front: questionKey, back: legacyExplanationText },
    };
    const [migrated] = migrateTheoryReviewItems([onlyBack]) as Item[];
    expect(migrated!.label).toBe(questionKey);
    expect(meta(migrated!).front).toBe(questionKey);
    expect(meta(migrated!).back).toBe(explanationKey);
    expect(migrated!.metadata).not.toBe(onlyBack.metadata);
  });

  it('非 theory: 前缀项完全不受影响（策略学院裸 lessonId / range / gto）', () => {
    const strategy: Item = {
      id: 'l3-cbet',
      label: '持续下注尺度',
      category: 'strategy',
      metadata: { front: '题干中文', back: '解析中文' },
    };
    const range: Item = { id: 'range:UTG:AKs', label: 'rangeTrainer.srs.howToAct' };
    const gto: Item = { id: 'gto:spot:hand', label: 'BTN Turn', category: 'gto' };
    const seed = [strategy, range, gto];
    expect(migrateTheoryReviewItems(seed)).toBe(seed);
  });

  it('混合队列：仅脏理论项被改写，同队列其他项引用不变', () => {
    const strategy: Item = { id: 'l4-gto-basics', label: 'GTO 基础', category: 'strategy' };
    const dirty = legacyItem();
    const result = migrateTheoryReviewItems([strategy, dirty]) as Item[];
    expect(result[0]).toBe(strategy);
    expect(result[1]).not.toBe(dirty);
    expect(result[1]!.label).toBe(questionKey);
  });
});

describe('migrateTheoryReviewItems 对旧存档与脏数据安全', () => {
  it('非数组输入原样返回（旧存档可能没有该键 / 值已损坏）', () => {
    for (const value of [undefined, null, 'not-an-array', 42, { id: questionKey }]) {
      expect(migrateTheoryReviewItems(value)).toBe(value);
    }
  });

  it('空数组与非理论空数组保持引用（不产生多余写入）', () => {
    const empty: unknown[] = [];
    expect(migrateTheoryReviewItems(empty)).toBe(empty);
  });

  it('脏元素（null / 非对象 / id 缺失或非字符串）一律跳过且不抛错', () => {
    const seed: unknown[] = [
      null,
      42,
      'string-item',
      {},
      { id: 123, label: legacyQuestionText },
      { id: 'theory', label: legacyQuestionText },
    ];
    expect(migrateTheoryReviewItems(seed)).toBe(seed);
  });

  it('空 questionId（`theory:`）无法反解，保守跳过：不写空 key 也不抛错', () => {
    const dirty: Item = {
      id: 'theory:',
      label: legacyQuestionText,
      metadata: { front: legacyQuestionText, back: legacyExplanationText },
    };
    const result = migrateTheoryReviewItems([dirty]) as Item[];
    expect(result[0]).toBe(dirty);
    expect(result[0]!.label).toBe(legacyQuestionText);
  });

  it('字段缺失或非字符串时不凭空创建（保持持久化形状）', () => {
    const noMetadata: Item = { id: `theory:${questionId}`, label: legacyQuestionText };
    const [m1] = migrateTheoryReviewItems([noMetadata]) as Item[];
    expect(m1!.label).toBe(questionKey);
    expect('metadata' in m1!).toBe(false);

    const brokenMetadata: Item = {
      id: `theory:${questionId}`,
      label: legacyQuestionText,
      metadata: 'broken',
    };
    const [m2] = migrateTheoryReviewItems([brokenMetadata]) as Item[];
    expect(m2!.label).toBe(questionKey);
    expect(m2!.metadata).toBe('broken');

    const nonStringFields: Item = {
      id: `theory:${questionId}`,
      label: 123,
      metadata: { front: 0, back: null },
    };
    expect(migrateTheoryReviewItems([nonStringFields])).toEqual([
      { id: `theory:${questionId}`, label: 123, metadata: { front: 0, back: null } },
    ]);
  });
});
