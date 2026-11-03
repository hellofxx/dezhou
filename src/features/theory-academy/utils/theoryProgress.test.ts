/**
 * 理论进度纯函数测试（P1F-02 回归 + 变体 Level 解锁门禁缺陷修复 + core/增补二分）：
 * 「下一章」跨 Level 顺延时必须先校验目标 Level 解锁态，
 * 否则点击后被章节页门禁 Navigate 静默弹回 /theory。
 * ① getNextChapter 跨 Level 顺延行为 ② isLevelUnlockedByCompleted 解锁判定
 * ③ 跨 Level 未解锁场景（bug 复现路径） ④ 正常顺序学习流不会出现锁定提示
 * ⑤ 变体 Level 解锁链独立于标准序列（t1hu 恒解锁，t2hu 需 t1hu 全完成）
 * ⑥ core = !supplemental：解锁/全完成/下一章 只认核心章，增补章完成与否不改变任何解锁
 */
import { describe, it, expect } from 'vitest';
import { THEORY_LEVELS } from '../data/levels';
import { headsUpLevels } from '../data/levels/variants/heads-up';
import { shortDeckLevels } from '../data/levels/variants/short-deck';
import type { TheoryLevelInfo } from '../types';
import {
  getAllChapters,
  getNextChapter,
  findChapterById,
  findLevelByChapterId,
  isLevelUnlockedByCompleted,
  isLevelFullyCompleted,
} from './theoryProgress';
import {
  getCoreChapterCount,
  getCoreChaptersOfLevel,
  getNextChapterSummary,
  getSupplementalChapterCount,
  getSupplementalChaptersOfLevel,
  getTotalChapterCount,
  isSupplementalChapter,
} from './theoryMeta';

/** core 章（!supplemental）：解锁与进度的唯一分母口径 */
const coreOf = (level: TheoryLevelInfo) => level.chapters.filter((c) => !c.supplemental);
const supplementalOf = (level: TheoryLevelInfo) => level.chapters.filter(isSupplementalChapter);

const t1 = THEORY_LEVELS[0]!;
const t2 = THEORY_LEVELS[1]!;
const lastT1Chapter = t1.chapters[t1.chapters.length - 1]!;
const lastT1Core = coreOf(t1)[coreOf(t1).length - 1]!;
const firstT1Supplemental = supplementalOf(t1)[0]!;

const t1hu = headsUpLevels[0]!;
const t2hu = headsUpLevels[1]!;
const lastT1huChapter = t1hu.chapters[t1hu.chapters.length - 1]!;

// ========== 标准系列回归（行为零变化） ==========

describe('getNextChapter 跨 Level 顺延（标准系列）', () => {
  it('T1 末章的下一章属于 T2（跨 Level 顺延成立，是 P1F-02 的触发前提）', () => {
    const next = getNextChapter(lastT1Chapter.id);
    expect(next).toBeDefined();
    expect(findLevelByChapterId(next!.id)?.id).toBe(t2.id);
  });

  it('全体系最后一章无下一章（返回 undefined）', () => {
    const all = getAllChapters();
    expect(getNextChapter(all[all.length - 1]!.id)).toBeUndefined();
  });
});

describe('isLevelUnlockedByCompleted（标准系列回归）', () => {
  it('T1 恒解锁（含零进度）', () => {
    expect(isLevelUnlockedByCompleted(t1.id, [])).toBe(true);
  });

  it('跨 Level 未解锁场景：仅完成 T1 末章（T1 未全完成）时，末章的"下一章"（T2）判定为锁定', () => {
    const next = getNextChapter(lastT1Chapter.id)!;
    const nextLevel = findLevelByChapterId(next.id)!;
    expect(isLevelUnlockedByCompleted(nextLevel.id, [lastT1Chapter.id])).toBe(false);
  });

  it('T1 全部章节完成后 T2 解锁（下一章按钮恢复可点击）', () => {
    const completed = t1.chapters.map((c) => c.id);
    expect(isLevelUnlockedByCompleted(t2.id, completed)).toBe(true);
  });

  it('前一 Level 缺任意**核心章**均不解锁（增补章不参与该循环）', () => {
    const core = coreOf(t1);
    expect(core.length).toBeGreaterThan(1); // 防空样本使循环空跑
    for (const missing of core) {
      const completed = core.filter((c) => c.id !== missing.id).map((c) => c.id);
      expect(isLevelUnlockedByCompleted(t2.id, completed), `缺 ${missing.id}`).toBe(false);
    }
  });

  it('未知 Level id 判定为锁定（防御）', () => {
    expect(isLevelUnlockedByCompleted('t99', [])).toBe(false);
  });

  it('正常顺序学习流不变式：按扁平顺序完成到任意章节时，其下一章所属 Level 均已解锁', () => {
    const all = getAllChapters();
    const completed: string[] = [];
    for (const chapter of all) {
      completed.push(chapter.id);
      const next = getNextChapter(chapter.id);
      if (!next) continue;
      const nextLevel = findLevelByChapterId(next.id)!;
      expect(isLevelUnlockedByCompleted(nextLevel.id, completed)).toBe(true);
    }
  });
});

// ========== core / 增补二分（标准变体的增补章语义） ==========

describe('core 与增补章划分（theoryMeta）', () => {
  it('每个 Level 的 core 章与增补章互补齐全，且 core 判定为 !supplemental', () => {
    for (const level of THEORY_LEVELS) {
      const core = getCoreChaptersOfLevel(level);
      const supplemental = getSupplementalChaptersOfLevel(level);
      expect(core.length + supplemental.length, `${level.id} 章节分割`).toBe(level.chapters.length);
      expect(core.every((c) => !c.supplemental)).toBe(true);
      expect(supplemental.every((c) => c.supplemental === true)).toBe(true);
    }
  });

  it('标准变体确有增补章，单挑/短牌没有（样本非空，避免语义测试空跑）', () => {
    expect(getSupplementalChapterCount('standard')).toBeGreaterThan(0);
    expect(getSupplementalChapterCount('heads-up')).toBe(0);
    expect(getSupplementalChapterCount('short-deck')).toBe(0);
    // T1 至少含 1 章增补，后续用例依赖该样本
    expect(supplementalOf(t1).length).toBeGreaterThan(0);
    expect(isSupplementalChapter(firstT1Supplemental)).toBe(true);
  });

  it('核心章数 + 增补章数 = 总章数（三变体均成立），且无参调用默认标准系列', () => {
    for (const variant of ['standard', 'heads-up', 'short-deck'] as const) {
      expect(
        getCoreChapterCount(variant) + getSupplementalChapterCount(variant),
        `${variant} 计数关系`,
      ).toBe(getTotalChapterCount(variant));
    }
    expect(getCoreChapterCount()).toBe(getCoreChapterCount('standard'));

    const manualCore = THEORY_LEVELS.reduce((sum, level) => sum + coreOf(level).length, 0);
    expect(getCoreChapterCount('standard')).toBe(manualCore);
  });

  it('仅缺增补章时下一 Level 仍解锁（增补章完成与否不影响解锁）', () => {
    const coreCompleted = coreOf(t1).map((c) => c.id);
    // 增补章未读：completed 中不含任何 t1 增补章
    expect(coreCompleted.some((id) => supplementalOf(t1).some((s) => s.id === id))).toBe(false);
    expect(isLevelUnlockedByCompleted(t2.id, coreCompleted)).toBe(true);
  });

  it('isLevelFullyCompleted 只看核心章：增补未读时为 true，核心缺章时为 false', () => {
    const coreIds = coreOf(t1).map((c) => c.id);
    expect(isLevelFullyCompleted(t1.id, coreIds)).toBe(true);
    expect(isLevelFullyCompleted(t1.id, coreIds.slice(1))).toBe(false);
    // 只完成增补章、核心章一页未读 → 未完成
    expect(isLevelFullyCompleted(t1.id, supplementalOf(t1).map((c) => c.id))).toBe(false);
  });
});

describe('getNextChapterSummary 的 core / 增补续读规则', () => {
  it('core → 下一个 core：跨过同 Level 的增补章，直接进入下一 Level 核心章', () => {
    // 先证明扁平顺序上的下一章确实是增补章（否则本用例测不到"跳过"这一行为）
    const flat = getAllChapters();
    const flatIdx = flat.findIndex((c) => c.id === lastT1Core.id);
    expect(isSupplementalChapter(flat[flatIdx + 1]!)).toBe(true);

    const next = getNextChapterSummary(lastT1Core.id);
    expect(next).toBeDefined();
    expect(isSupplementalChapter(next!)).toBe(false);
    expect(findLevelByChapterId(next!.id)?.id).toBe(t2.id);
  });

  it('core → 增补回退：全变体已无后续核心章时，回退到扁平顺序的第一个增补章', () => {
    const lastLevel = THEORY_LEVELS[THEORY_LEVELS.length - 1]!;
    const lastCore = coreOf(lastLevel)[coreOf(lastLevel).length - 1]!;
    const firstSupplementalAfter = supplementalOf(lastLevel)[0]!;
    expect(firstSupplementalAfter).toBeDefined();

    const next = getNextChapterSummary(lastCore.id);
    expect(next).toBeDefined();
    expect(isSupplementalChapter(next!)).toBe(true);
    expect(next!.id).toBe(firstSupplementalAfter.id);
  });

  it('增补 → 扁平下一章：跨 Level 顺延与同类相邻均按扁平顺序', () => {
    // T1 末位增补章 → 下一 Level 首个核心章
    expect(getNextChapterSummary(firstT1Supplemental.id)?.id).toBe(t2.chapters[0]!.id);
    // 同一 Level 内相邻增补章（T6 有 3 章增补）：取第一到第二
    const t6 = THEORY_LEVELS[5]!;
    const t6Supplemental = supplementalOf(t6);
    expect(t6Supplemental.length).toBeGreaterThan(1);
    expect(getNextChapterSummary(t6Supplemental[0]!.id)?.id).toBe(t6Supplemental[1]!.id);
  });

  it('序列末尾仍返回 undefined（增补章位于末尾时同样无下一章）', () => {
    const all = getAllChapters();
    const last = all[all.length - 1]!;
    expect(isSupplementalChapter(last)).toBe(true);
    expect(getNextChapterSummary(last.id)).toBeUndefined();
    expect(getNextChapterSummary('t99-unknown')).toBeUndefined();
  });
});

// ========== 变体系列新增用例 ==========

describe('变体章节查找（heads-up）', () => {
  it('findChapterById 能命中变体章节', () => {
    const chapter = findChapterById('t1hu-probability');
    expect(chapter).toBeDefined();
    expect(chapter!.id).toBe('t1hu-probability');
  });

  it('findLevelByChapterId 能返回变体 Level', () => {
    const level = findLevelByChapterId('t1hu-probability');
    expect(level).toBeDefined();
    expect(level!.id).toBe('t1hu');
  });
});

describe('变体 nextChapter 顺延不跨变体（heads-up）', () => {
  it('t1hu 末章的下一章属于 t2hu（同一变体序列内顺延）', () => {
    const next = getNextChapter(lastT1huChapter.id);
    expect(next).toBeDefined();
    expect(findLevelByChapterId(next!.id)?.id).toBe(t2hu.id);
  });

  it('变体末章无下一章不跨变体（t9hu 末章返回 undefined，不会顺延到标准 t4）', () => {
    const lastHuLevel = headsUpLevels[headsUpLevels.length - 1]!;
    const lastHuChapter = lastHuLevel.chapters[lastHuLevel.chapters.length - 1]!;
    expect(getNextChapter(lastHuChapter.id)).toBeUndefined();
  });
});

describe('变体 isLevelUnlockedByCompleted（heads-up）', () => {
  it('t1hu 恒解锁（修复前返回 false 的缺陷）', () => {
    expect(isLevelUnlockedByCompleted(t1hu.id, [])).toBe(true);
  });

  it('t2hu 需 t1hu 全部章节完成（变体序列内解锁链独立）', () => {
    // 仅完成部分 t1hu 章节 → t2hu 不解锁
    expect(isLevelUnlockedByCompleted(t2hu.id, [lastT1huChapter.id])).toBe(false);
    // 完成 t1hu 全部章节 → t2hu 解锁
    const t1huCompleted = t1hu.chapters.map((c) => c.id);
    expect(isLevelUnlockedByCompleted(t2hu.id, t1huCompleted)).toBe(true);
  });

  it('变体 Level 缺任意一章均不解锁', () => {
    for (const missing of t1hu.chapters) {
      const completed = t1hu.chapters.filter((c) => c.id !== missing.id).map((c) => c.id);
      expect(isLevelUnlockedByCompleted(t2hu.id, completed)).toBe(false);
    }
  });

  it('变体正常顺序学习流不变式', () => {
    const allHuChapters = headsUpLevels.flatMap((l) => l.chapters);
    const completed: string[] = [];
    for (const chapter of allHuChapters) {
      completed.push(chapter.id);
      const next = getNextChapter(chapter.id);
      if (!next) continue;
      const nextLevel = findLevelByChapterId(next.id)!;
      expect(isLevelUnlockedByCompleted(nextLevel.id, completed)).toBe(true);
    }
  });
});

describe('变体 isLevelFullyCompleted', () => {
  it('t1hu 全部章节完成后判定为全完成', () => {
    const completed = t1hu.chapters.map((c) => c.id);
    expect(isLevelFullyCompleted(t1hu.id, completed)).toBe(true);
  });

  it('t1hu 缺一章时判定为未完成', () => {
    const completed = t1hu.chapters.slice(1).map((c) => c.id);
    expect(isLevelFullyCompleted(t1hu.id, completed)).toBe(false);
  });

  it('标准系列 isLevelFullyCompleted 仍正确', () => {
    const completed = t1.chapters.map((c) => c.id);
    expect(isLevelFullyCompleted(t1.id, completed)).toBe(true);
  });
});

// ========== 两变体参数化不变式 ==========
// 上面的 HU 专属用例覆盖了同一代码路径，但短牌高级段从每级 2 章增到 3 章后，
// 顺延与解锁链的形状只在短牌侧被真正改变；按变体参数化覆盖，免得再靠"同一路径"推断。
describe.each([
  ['heads-up', headsUpLevels, 22],
  ['short-deck', shortDeckLevels, 27],
] as const)('变体学习流不变式：%s', (_name, levels, chapterCount) => {
  const all = levels.flatMap((l) => l.chapters);

  it('守卫确实取到该变体全部章节（防空数组使下列断言空跑）', () => {
    expect(all.length).toBeGreaterThanOrEqual(chapterCount);
  });

  it('每级至少 2 章，且章节序列的 level 只允许持平或 +1（不跳级、不回退）', () => {
    for (const level of levels) {
      expect(level.chapters.length, `${level.id} 章节数`).toBeGreaterThanOrEqual(2);
    }
    const ordered = levels.flatMap((l) => l.chapters.map((c) => c.level));
    for (let i = 1; i < ordered.length; i++) {
      // 允许本级内同级，跨级时只允许 +1（不顺延到下下级、不回到上级）
      expect(ordered[i]! - ordered[i - 1]!).toBeLessThanOrEqual(1);
      expect(ordered[i]! - ordered[i - 1]!).toBeGreaterThanOrEqual(0);
    }
  });

  it('顺序学完前置章节后，下一章所属 Level 必已解锁（正常流不出现锁定提示）', () => {
    const completed: string[] = [];
    for (const chapter of all) {
      completed.push(chapter.id);
      const next = getNextChapter(chapter.id);
      if (!next) continue;
      const nextLevel = findLevelByChapterId(next.id)!;
      expect(isLevelUnlockedByCompleted(nextLevel.id, completed), `${chapter.id} → ${next.id}`).toBe(true);
    }
  });

  it('变体末章无下一章（不跨变体顺延）', () => {
    expect(getNextChapter(all[all.length - 1]!.id)).toBeUndefined();
  });
});
