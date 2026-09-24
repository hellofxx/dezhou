import { describe, expect, it } from 'vitest';
import { generateContentEntries } from '@/i18n/contentKeyEntries';
import { migrateStrategyReviewItems } from './migrateStrategyReviewKeys';

/**
 * 策略复习项「中文课名 → i18n key」改写纯函数用例（v16 → v17 迁移的实现体）。
 *
 * 背景：复习项存 localStorage，而 SpacedRepetitionPanel 渲染 t(item.label)，
 * i18next 未命中 key 时原样回显入参 —— 早期 completeCourse 写入的中文课名
 * 因此让英文界面复习队列显示中文。lessonId 可直接从复习项 id 反解，
 * 故迁移确定性、幂等，且复习进度零丢失。
 *
 * key 镜像守卫：期望值取自 @/i18n/contentKeyEntries —— 该表的 key 由 strategy-academy 侧
 * 单源 titleKeys.lessonTitleKey 从课程数据推导。progress 无法 import strategy-academy
 * （eslint.config.js ALLOWED_CROSS_IMPORTS: progress: []，清单只删不加），
 * 故辅助函数内的 key 拼接是镜像拷贝，其与单源的一致性由本文件的「镜像守卫」用例锁死。
 */

type Item = Record<string, unknown>;

// ===== 真实课程探针（条目值即数据层中文原文，与线上存量脏数据同形）=====
const entries = generateContentEntries();
const titleKey = [...entries.keys()].find(
  (k) => k.startsWith('academy.lessonTitle.') && /[一-鿿]/.test(entries.get(k) ?? ''),
)!;
const lessonId = titleKey.slice('academy.lessonTitle.'.length);
const legacyTitleText = entries.get(titleKey)!;

const legacyItem = (): Item => ({
  id: lessonId,
  label: legacyTitleText,
  category: 'strategy',
  easeFactor: 2.3,
  interval: 7,
  repetitions: 3,
  nextReviewDate: '2026-01-01',
  lastReviewedAt: 1_735_689_600_000,
});

describe('探针与 key 镜像守卫', () => {
  it('取到真实课时，其条目值为中文原文（保证脏数据 fixture 与线上同形）', () => {
    expect(lessonId.length).toBeGreaterThan(0);
    expect(legacyTitleText).toMatch(/[一-鿿]/);
  });

  it('镜像拼接的 key 命中 titleKeys 单源产物（漂移即红）', () => {
    const [migrated] = migrateStrategyReviewItems([legacyItem()]) as Item[];
    // 断言对象是单源推导出的 key 本身，而非本文件重述的字符串
    expect(migrated!.label).toBe(titleKey);
    // 改写后可在内容条目表中查到（渲染层 t() 能命中，不再回显原文）
    expect(entries.has(migrated!.label as string)).toBe(true);
  });
});

describe('migrateStrategyReviewItems 改写与保全', () => {
  it('中文课名 label → 改写为 key；复习进度与其余字段逐项不变', () => {
    const source = legacyItem();
    const [migrated] = migrateStrategyReviewItems([source]) as Item[];

    expect(migrated).not.toBe(source);
    expect(migrated!.label).toBe(titleKey);
    expect(migrated!.id).toBe(source.id);
    expect(migrated!.category).toBe('strategy');
    // 复习进度零丢失：逐项与原值同一
    expect(migrated!.interval).toBe(source.interval);
    expect(migrated!.easeFactor).toBe(source.easeFactor);
    expect(migrated!.repetitions).toBe(source.repetitions);
    expect(migrated!.nextReviewDate).toBe(source.nextReviewDate);
    expect(migrated!.lastReviewedAt).toBe(source.lastReviewedAt);
    // 原对象未被原地修改（纯函数式改写，禁止污染调用方数据）
    expect(source.label).toBe(legacyTitleText);
  });

  it('metadata 存在时原引用保留（本迁移只动 label）', () => {
    const metadata = { route: '/academy/lesson/' + lessonId };
    const [migrated] = migrateStrategyReviewItems([
      { ...legacyItem(), metadata },
    ]) as Item[];
    expect(migrated!.label).toBe(titleKey);
    expect(migrated!.metadata).toBe(metadata);
  });

  it('幂等：已是 key 形态的项不变（元素与数组引用都不变）', () => {
    const keyed: Item = {
      id: lessonId,
      label: titleKey,
      category: 'strategy',
      interval: 14,
      nextReviewDate: '2026-02-02',
    };
    const seed = [keyed];
    const first = migrateStrategyReviewItems(seed);
    expect(first).toBe(seed);
    // 二次执行（重复 migrate / 版本回退后再升级）结果不变
    const second = migrateStrategyReviewItems(first);
    expect(second).toBe(seed);
    expect((second as Item[])[0]).toBe(keyed);
  });

  it('非 strategy 分类完全不受影响（theory / range / odds / gto 各有自己的命名空间）', () => {
    const theory: Item = {
      id: 'theory:t1-combinatorics-q1',
      label: legacyTitleText,
      category: 'theory',
    };
    const gto: Item = { id: 'gto:spot:hand', label: legacyTitleText, category: 'gto' };
    const untagged: Item = { id: lessonId, label: legacyTitleText };
    const seed = [theory, gto, untagged];
    expect(migrateStrategyReviewItems(seed)).toBe(seed);
  });

  it('混合队列：仅脏策略项被改写，同队列其他项引用不变', () => {
    const clean: Item = { id: lessonId, label: titleKey, category: 'strategy' };
    const dirty = legacyItem();
    const result = migrateStrategyReviewItems([clean, dirty]) as Item[];
    expect(result[0]).toBe(clean);
    expect(result[1]).not.toBe(dirty);
    expect(result[1]!.label).toBe(titleKey);
  });
});

describe('migrateStrategyReviewItems 对旧存档与脏数据安全', () => {
  it('非数组输入原样返回（旧存档可能没有该键 / 值已损坏）', () => {
    for (const value of [undefined, null, 'not-an-array', 42, { id: lessonId }]) {
      expect(migrateStrategyReviewItems(value)).toBe(value);
    }
  });

  it('空数组保持引用（不产生多余写入）', () => {
    const empty: unknown[] = [];
    expect(migrateStrategyReviewItems(empty)).toBe(empty);
  });

  it('脏元素（null / 非对象 / id 缺失或非字符串）一律跳过且不抛错', () => {
    const seed: unknown[] = [
      null,
      42,
      'string-item',
      {},
      { id: 123, label: legacyTitleText, category: 'strategy' },
      { category: 'strategy', label: legacyTitleText },
    ];
    expect(migrateStrategyReviewItems(seed)).toBe(seed);
  });

  it('非课时 id 形态（含命名空间冒号 / 空格 / 大写）保守跳过：不写入无法命中的 key', () => {
    for (const id of ['range:UTG:AKs', 'BTN Turn', 'L4-GTO', '-lead', '']) {
      const dirty: Item = { id, label: legacyTitleText, category: 'strategy' };
      const result = migrateStrategyReviewItems([dirty]) as Item[];
      expect(result[0]).toBe(dirty);
      expect(result[0]!.label).toBe(legacyTitleText);
    }
  });

  it('label 非字符串 / 不含中文（如纯拉丁旧值）时不凭空改写', () => {
    const numeric: Item = { id: lessonId, label: 123, category: 'strategy' };
    const latin: Item = { id: lessonId, label: 'Squeeze Play', category: 'strategy' };
    const missing: Item = { id: lessonId, category: 'strategy' };
    const seed = [numeric, latin, missing];
    expect(migrateStrategyReviewItems(seed)).toBe(seed);
  });
});
