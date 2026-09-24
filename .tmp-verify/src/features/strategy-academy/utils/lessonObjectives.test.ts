import { describe, it, expect } from 'vitest';
import { lessonObjectivesKey, resolveLessonObjectives } from './contentKeys';
import { ALL_VARIANT_LESSONS } from '../data/lessons/variants';
import { LOCAL_LESSONS } from '../data/localLessons';
import type { Lesson } from '../types';

/**
 * 学习目标（Lesson.objectives）key 单源与内容卫生守卫。
 *
 * 背景：objectives 为新增的**可选**索引型数组字段，渲染经
 * `t(lessonObjectivesKey(lessonId, i), { defaultValue: <数据层中文> })` 覆盖
 * （口径与 theory-academy 的 theory.chapterObjectives 一致）。
 * 本文件覆盖两类失效：
 * 1. key 形态漂移 —— 命名空间未在 contentKeyEntries.CONTENT_KEY_PREFIXES 登记时，
 *    contentI18n / contentAlignment 两个守卫会立即失覆盖（此处补形态断言）
 * 2. 目标文案不合规 —— PRD §6.7.1「学习目标对齐」要求可观察行为动词，
 *    禁止「掌握/理解/了解/建立」这类不可测动词（本轮实测大量既有 objectives 以此起头）
 */

/** 不可测动词起头（一律拒绝） */
const UNTESTABLE_HEAD = /^(掌握|理解|了解|熟悉|建立|体会|领会|知道|认识|领悟)/;
/** 可观察行为动词（至少命中一个） */
const OBSERVABLE_VERB =
  /(说明|计算|比较|识别|构建|判断|列举|列出|复述|区分|排列|说出|给出|推导|运用|应用)/;

const lessonsWithObjectives = ALL_VARIANT_LESSONS.filter(
  (l): l is Lesson & { objectives: string[] } =>
    l.objectives !== undefined && l.objectives.length > 0,
);

const localLessonsWithObjectives = LOCAL_LESSONS.filter(
  (l): l is Lesson & { objectives: string[] } =>
    l.objectives !== undefined && l.objectives.length > 0,
);

/**
 * 本批次（第 1 批：standard 目录 9 个 Level 文件）全部课时 ID 清单。
 * L1-L8 共 75 个课时（55 个 content 型 + 20 个 drill 型）全部落地 objectives。
 * 变体课时（short-deck 的 l3sd-* / heads-up 的 l3hu-*）不匹配清单前缀，属后续批次。
 */
const STANDARD_LESSON_IDS: readonly string[] = [
  // L1
  'l1-basics',
  'l1-position',
  'l1-hand-selection',
  'l1-bankroll',
  'l1-leaks',
  'drill-hand-ranking',
  'drill-position',
  'drill-outs',
  'drill-pot-odds',
  // L2
  'l2-raise-sizing',
  'l2-3bet-basics',
  'l2-4bet-strategy',
  'l2-squeeze',
  'l2-bb-defense',
  'l2-blind-war',
  'l2-short-stack',
  'drill-l2-3bet',
  'drill-l2-position-range',
  // L3
  'l3-cbet',
  'l3-draws',
  'l3-multistreet',
  'l3-checkraise',
  'l3-float-probe',
  'l3-bet-sizing',
  'l3-bluffing',
  'l3-texture',
  'l3-check-range',
  'drill-l3-cbet',
  'drill-l3-odds',
  'l3-3bet-postflop',
  // L4A
  'l4-range-thinking',
  'l4-ev-thinking',
  'l4-ev-real-cases',
  'l4-opponent-reading',
  'l4-blockers',
  'drill-l4-range-id',
  'drill-l4-ev',
  // L4B
  'l4-gto-basics',
  'l4-game-tree',
  'l4-frequency-balance',
  'l4-mdf',
  'l4-mdf-real-cases',
  'l4-overbet',
  'l4-range-construction',
  'l4-bluffcatching',
  'drill-l4-gto',
  'drill-l4b-frequency',
  // L5
  'l5-bankroll',
  'l5-tilt',
  'l5-game-selection',
  'l5-session-review',
  'l5-data-driven',
  'drill-l5-tilt',
  'l5-tools',
  'l5-online-vs-live',
  'drill-l5-session',
  // L6
  'l6-icm',
  'l6-pushfold',
  'l6-bubble',
  'l6-finaltable',
  'l6-bounty',
  'drill-l6-icm',
  'drill-l6-pushfold',
  // L7
  'l7-deepstack',
  'l7-multiway',
  'l7-straddle',
  'l7-rake',
  'l7-table-selection',
  'drill-l7-deepstack',
  'drill-l7-multiway',
  // L8
  'l8-pool-tendencies',
  'l8-population-analysis',
  'l8-exploitative-adjustments',
  'drill-l8-exploit',
  'drill-l8-pool',
];

/**
 * 第 2 批（变体目录）：heads-up 6 个 Level 文件全部课时 ID 清单。
 * 变体专属课程覆盖 L3-L8（L1/L2 回退共享基础层），共 12 个课时。
 */
const HEADS_UP_LESSON_IDS: readonly string[] = [
  // L3
  'l3hu-bn-aggression',
  'l3hu-sb-continuation',
  'l3hu-bb-defense',
  // L4
  'l4hu-bn-opening',
  'l4hu-ev-adjustments',
  'l4hu-gto-basics',
  'l4hu-counter-strategies',
  // L5
  'l5hu-focus',
  'l5hu-opponent-psychology',
  // L6
  'l6hu-tourney',
  // L7
  'l7hu-stakes',
  // L8
  'l8hu-exploitative',
];

/**
 * 第 2 批（变体目录）：short-deck 6 个 Level 文件全部课时 ID 清单。
 * 变体专属课程覆盖 L3-L8，共 17 个课时。
 */
const SHORT_DECK_LESSON_IDS: readonly string[] = [
  // L3
  'l3sd-intro',
  'l3sd-cbet',
  'l3sd-donk',
  'l3sd-check-raise',
  // L4
  'l4sd-preflop-ranges',
  'l4sd-nuts-equity',
  'l4sd-blocker-bluff',
  'l4sd-gto-fundamentals',
  'l4sd-solver-readout',
  // L5
  'l5sd-bankroll',
  'l5sd-tilt-control',
  // L6
  'l6sd-tourney-i',
  'l6sd-tourney-ii',
  // L7
  'l7sd-deep-stack',
  'l7sd-shallow-stack',
  // L8
  'l8sd-exploit-i',
  'l8sd-exploit-ii',
];

/**
 * 第 3 批（localLessons 目录 7 个文件）全部课时 ID 清单。
 * 本土低级别盈利路径共 17 个课时（16 个 content 型 + 1 个 drill 型 opp-drill）。
 */
const LOCAL_LESSON_IDS: readonly string[] = [
  // 模块 1：Limp 局应对（limp.ts）
  'local-limp-intro',
  'local-limp-isolate',
  'local-limp-multiway',
  // 模块 2：Ante / Straddle（straddle.ts）
  'local-straddle',
  'local-ante',
  // 模块 3：深筹码调整（deepStack.ts）
  'local-deep-implied-odds',
  'local-deep-suited-connectors',
  // 模块 4：玩家类型剥削（exploit.ts）
  'local-exploit-calling-station',
  'local-exploit-maniac',
  'local-exploit-nit',
  'local-exploit-lag',
  // 模块 4.5：对手画像 Drill（oppDrill.ts，drill 型）
  'opp-drill',
  // 模块 5：GTO 与剥削平衡（gtoBalance.ts）
  'local-gto-vs-exploit',
  'local-when-to-deviate',
  // 模块 6：情绪管理（mental.ts）
  'local-mental-tilt-recognition',
  'local-mental-stop-loss',
  'local-mental-session-management',
];

describe('lessonObjectivesKey（学习目标 key 单源）', () => {
  it('key 形态为 academy.lessonObjectives.<lessonId>.<index>', () => {
    expect(lessonObjectivesKey('l4-mdf', 0)).toBe('academy.lessonObjectives.l4-mdf.0');
    expect(lessonObjectivesKey('l1-basics', 3)).toBe('academy.lessonObjectives.l1-basics.3');
  });

  it('resolveLessonObjectives 逐条按索引取 key，并以数据层原文作 defaultValue 兜底', () => {
    const calls: { key: string; defaultValue?: string }[] = [];
    const fakeT = ((key: string, opts?: { defaultValue: string }) => {
      calls.push({ key, defaultValue: opts?.defaultValue });
      return `R:${key}`;
    }) as unknown as Parameters<typeof resolveLessonObjectives>[0];

    const objectives = ['计算 MDF', '区分 Alpha'];
    const resolved = resolveLessonObjectives(fakeT, 'l4-mdf', objectives);

    expect(resolved).toEqual([
      'R:academy.lessonObjectives.l4-mdf.0',
      'R:academy.lessonObjectives.l4-mdf.1',
    ]);
    expect(calls.map((c) => c.key)).toEqual([
      'academy.lessonObjectives.l4-mdf.0',
      'academy.lessonObjectives.l4-mdf.1',
    ]);
    expect(calls.map((c) => c.defaultValue)).toEqual(objectives);
  });

  it('空数组不产出任何 key（组件侧据此整块不渲染）', () => {
    const fakeT = (() => '') as unknown as Parameters<typeof resolveLessonObjectives>[0];
    expect(resolveLessonObjectives(fakeT, 'l1-basics', [])).toEqual([]);
  });
});

describe('Lesson.objectives 内容卫生（PRD §6.7.1 学习目标对齐）', () => {
  it('已落地的样例课时均声明 objectives', () => {
    const ids = new Set(lessonsWithObjectives.map((l) => l.id));
    expect(['l1-basics', 'l2-3bet-basics', 'l4-mdf'].every((id) => ids.has(id))).toBe(true);
  });

  it('本批次（standard 9 个 Level 文件）全部课时均声明 objectives', () => {
    const ids = new Set(lessonsWithObjectives.map((l) => l.id));
    const missing = STANDARD_LESSON_IDS.filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });

  it('清单与 standard 命名前缀的课时集合完全一致（防止后续批次新增课时漏登记）', () => {
    // standard 课时命名约定：content 型以 l<数字>- 开头，drill 型以 drill- 开头；
    // 变体课时（short-deck 的 l3sd-* / heads-up 的 l3hu-*）不匹配该模式。
    const standardPattern = /^(l[1-8]-|drill-)/;
    const detected = ALL_VARIANT_LESSONS.filter((l) => standardPattern.test(l.id))
      .map((l) => l.id)
      .sort();
    expect(detected).toEqual([...STANDARD_LESSON_IDS].sort());
  });

  it('本批次（heads-up 6 个 Level 文件）全部课时均声明 objectives', () => {
    const ids = new Set(lessonsWithObjectives.map((l) => l.id));
    const missing = HEADS_UP_LESSON_IDS.filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });

  it('本批次（short-deck 6 个 Level 文件）全部课时均声明 objectives', () => {
    const ids = new Set(lessonsWithObjectives.map((l) => l.id));
    const missing = SHORT_DECK_LESSON_IDS.filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });

  it('变体课时清单与 l<数字>(hu|sd)- 命名课时集合完全一致（防止后续批次新增课时漏登记）', () => {
    // 变体课时命名约定：l<数字>hu-（heads-up）与 l<数字>sd-（short-deck）。
    const variantPattern = /^l\d+(hu|sd)-/;
    const detected = ALL_VARIANT_LESSONS.filter((l) => variantPattern.test(l.id))
      .map((l) => l.id)
      .sort();
    expect(detected).toEqual([...HEADS_UP_LESSON_IDS, ...SHORT_DECK_LESSON_IDS].sort());
  });

  it('本批次（localLessons 7 个文件）全部课时均声明 objectives', () => {
    const ids = new Set(localLessonsWithObjectives.map((l) => l.id));
    const missing = LOCAL_LESSON_IDS.filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
  });

  it('localLessons 课时清单与数据源集合完全一致（防止后续批次新增课时漏登记）', () => {
    // localLessons 是独立聚合源（localLessons/ 目录 7 个文件），直接以 LOCAL_LESSONS
    // 全量 ID 与清单对比，无前缀歧义。
    // 注：standardLevel7 末尾以 ...LOCAL_LESSONS spread 同一批对象（本土课并入 L7），
    // 因此 ALL_VARIANT_LESSONS 与 LOCAL_LESSONS 存在既有的 ID 交叉（同对象引用），
    // contentKeyEntries 的 Map 生成按 key 自然折叠，key 产出不重复。
    const detected = LOCAL_LESSONS.map((l) => l.id).sort();
    expect(detected).toEqual([...LOCAL_LESSON_IDS].sort());
  });

  it('每条 objective 非空、2-4 条、不用不可测动词起头且命中可观察行为动词（含 localLessons 全源）', () => {
    const bad: string[] = [];
    for (const lesson of [...lessonsWithObjectives, ...localLessonsWithObjectives]) {
      const list = lesson.objectives;
      if (list.length < 2 || list.length > 4) bad.push(`${lesson.id}: 条数=${list.length}`);
      list.forEach((obj, i) => {
        const where = `${lesson.id}[${i}]`;
        if (!obj.trim()) bad.push(`${where}: 空`);
        if (UNTESTABLE_HEAD.test(obj.trim())) bad.push(`${where}: 不可测动词起头 ${obj}`);
        if (!OBSERVABLE_VERB.test(obj)) bad.push(`${where}: 无可观察行为动词 ${obj}`);
      });
    }
    expect(bad).toEqual([]);
  });
});
