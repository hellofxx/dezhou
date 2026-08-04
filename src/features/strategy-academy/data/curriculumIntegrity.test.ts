/**
 * 课程数据完整性守卫测试（审计批次 4，治本 RC4）。
 *
 * 将两轮课程审计的机械校验固化为常驻门禁：ID 唯一性、判分数据合法性、
 * 牌面合法性、引用完整性、Drill 接线完整性。任何一项失败即测试变红，
 * 防止批量生成课程数据时再次引入结构性缺陷。
 */
import { describe, it, expect } from 'vitest';
import { LEVELS } from './levels';
import { LOCAL_LESSONS } from './localLessons';
import { LEARNING_TRACKS } from './learningTracks';
import { CONCEPT_NODES } from './conceptNodes';
import type { Lesson } from '../types';

const DRILL_COMPONENTS = new Set([
  'HandRankingDrill',
  'PositionDrill',
  'OutsDrill',
  'PotOddsDrill',
  'ChoiceDrill',
  'OpponentDrill',
]);

const CARD_RE = /^[2-9TJQKA][shdc]$/;
const BOARD_LEN: Record<string, number> = { preflop: 0, flop: 3, turn: 4, river: 5 };

// 跨模块硬编码引用的课程 ID（事实源：各模块推导函数）
// - puzzle-trainer: usePuzzleEngine.inferPuzzleLessonId
// - range-trainer:  useQuizEngine.inferRelatedLessonId
// - gto-simulator:  GTOSessionPage 的 street 推导
const CROSS_MODULE_LESSON_IDS = [
  'l1-hand-selection', 'l2-bb-defense', 'l2-3bet-basics', 'l2-4bet-strategy',
  'l2-short-stack', 'l3-cbet', 'l3-draws', 'l3-bet-sizing', 'l3-bluffing',
  'l3-multistreet', 'l4-gto-basics', 'l6-icm',
  // theory-academy 实践推荐引用（事实源：theory-academy/data/levels/index.ts 的 practiceRecommendations）
  'l1-basics', 'l1-position', 'l2-raise-sizing', 'l4-ev-thinking',
  'l4-range-thinking', 'l4-range-construction', 'l4-blockers',
  'l4-mdf', 'l4-frequency-balance', 'l4-overbet', 'l4-opponent-reading',
  'l5-tilt', 'l5-bankroll', 'l5-session-review',
  'l7-multiway', 'l8-exploitative-adjustments', 'l8-pool-tendencies',
];

const allLessons: Lesson[] = LEVELS.flatMap((level) => level.lessons);
const lessonIds = new Set(allLessons.map((l) => l.id));

interface Scenario {
  where: string;
  street: string;
  board?: string[];
  cards: string[];
  potSize?: number;
  effectiveStack?: number;
}

function collectScenarios(lesson: Lesson): Scenario[] {
  const scenarios: Scenario[] = [];
  for (const ex of lesson.examples ?? []) {
    scenarios.push({
      where: `${lesson.id}/example/${ex.id}`,
      street: ex.street,
      board: ex.board,
      cards: [...ex.heroHand, ...(ex.board ?? [])],
      potSize: ex.potSize,
      effectiveStack: ex.effectiveStack,
    });
  }
  for (const q of lesson.practice?.questions ?? []) {
    scenarios.push({
      where: `${lesson.id}/practice/${q.id}`,
      street: q.scenario.street,
      board: q.scenario.board,
      cards: [...q.scenario.heroHand, ...(q.scenario.board ?? [])],
      potSize: q.scenario.potSize,
      effectiveStack: q.scenario.effectiveStack,
    });
  }
  return scenarios;
}

describe('curriculum integrity: ID 唯一性', () => {
  it('lesson id 全局唯一，且 LOCAL_LESSONS 全部并入 LEVELS', () => {
    const seen = new Set<string>();
    const dups = allLessons.filter((l) => (seen.has(l.id) ? true : (seen.add(l.id), false)));
    expect(dups.map((l) => l.id)).toEqual([]);
    const missingLocal = LOCAL_LESSONS.filter((l) => !lessonIds.has(l.id)).map((l) => l.id);
    expect(missingLocal).toEqual([]);
  });

  it('quiz / practice 题 / example / practice 容器 id 全局唯一', () => {
    const seen = new Set<string>();
    const dups: string[] = [];
    const check = (id: string) => {
      if (seen.has(id)) dups.push(id);
      seen.add(id);
    };
    for (const lesson of allLessons) {
      lesson.quiz.forEach((q) => check(q.id));
      lesson.examples?.forEach((ex) => check(ex.id));
      if (lesson.practice) {
        check(lesson.practice.id);
        lesson.practice.questions.forEach((q) => check(q.id));
      }
      lesson.drillData?.questions.forEach((q) => check(q.id));
    }
    expect(dups).toEqual([]);
  });
  it('lesson id 与 quiz / practice / example / drillData 题 id 跨类无冲突', () => {
    const lessonIdSet = new Set(allLessons.map((l) => l.id));
    const conflicts: string[] = [];
    for (const lesson of allLessons) {
      lesson.quiz.forEach((q) => { if (lessonIdSet.has(q.id)) conflicts.push(`lesson id 与 quiz id 冲突: ${q.id}`); });
      lesson.examples?.forEach((ex) => { if (lessonIdSet.has(ex.id)) conflicts.push(`lesson id 与 example id 冲突: ${ex.id}`); });
      if (lesson.practice) {
        if (lessonIdSet.has(lesson.practice.id)) conflicts.push(`lesson id 与 practice 容器 id 冲突: ${lesson.practice.id}`);
        lesson.practice.questions.forEach((q) => { if (lessonIdSet.has(q.id)) conflicts.push(`lesson id 与 practice question id 冲突: ${q.id}`); });
      }
      lesson.drillData?.questions.forEach((q) => { if (lessonIdSet.has(q.id)) conflicts.push(`lesson id 与 drillData question id 冲突: ${q.id}`); });
    }
    expect(conflicts).toEqual([]);
  });
});

describe('curriculum integrity: 判分数据合法性', () => {
  it('quiz：correctIndex 界内、选项 ≥2 且无重复、explanation 非空', () => {
    const bad: string[] = [];
    for (const lesson of allLessons) {
      for (const q of lesson.quiz) {
        if (q.options.length < 2) bad.push(`${q.id}: 选项不足`);
        if (new Set(q.options).size !== q.options.length) bad.push(`${q.id}: 选项重复`);
        if (q.correctIndex < 0 || q.correctIndex >= q.options.length) bad.push(`${q.id}: correctIndex 越界`);
        if (!q.explanation.trim()) bad.push(`${q.id}: explanation 为空`);
      }
      if (lesson.type !== 'drill' && lesson.quiz.length === 0) bad.push(`${lesson.id}: 非 drill 课程 quiz 为空`);
    }
    expect(bad).toEqual([]);
  });

  it('practice / ChoiceDrill 题：恰有 1 个正确选项', () => {
    const bad: string[] = [];
    for (const lesson of allLessons) {
      for (const q of lesson.practice?.questions ?? []) {
        const n = q.options.filter((o) => o.isCorrect).length;
        if (n !== 1) bad.push(`${q.id}: 正确选项数=${n}`);
      }
      for (const q of lesson.drillData?.questions ?? []) {
        const n = q.options.filter((o) => o.isCorrect).length;
        if (n !== 1) bad.push(`${q.id}: 正确选项数=${n}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('curriculum integrity: 牌面与场景合法性', () => {
  it('卡牌格式合法、手牌与公共牌无重复、street 与 board 长度匹配、数值为正', () => {
    const bad: string[] = [];
    for (const lesson of allLessons) {
      for (const s of collectScenarios(lesson)) {
        for (const c of s.cards) {
          if (!CARD_RE.test(c)) bad.push(`${s.where}: 非法卡牌 ${c}`);
        }
        if (new Set(s.cards).size !== s.cards.length) bad.push(`${s.where}: 卡牌重复 ${s.cards.join(',')}`);
        const expected = BOARD_LEN[s.street];
        if (expected !== undefined && (s.board?.length ?? 0) !== expected) {
          bad.push(`${s.where}: street=${s.street} 但 board=${s.board?.length ?? 0} 张`);
        }
        if (s.potSize !== undefined && s.potSize <= 0) bad.push(`${s.where}: potSize=${s.potSize}`);
        if (s.effectiveStack !== undefined && s.effectiveStack <= 0) bad.push(`${s.where}: effectiveStack=${s.effectiveStack}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('curriculum integrity: 引用完整性', () => {
  it('学习轨道 / 概念节点 / prerequisites / relatedLessonId / 跨模块引用无悬空', () => {
    const bad: string[] = [];
    for (const track of LEARNING_TRACKS) {
      for (const id of track.lessonIds) {
        if (!lessonIds.has(id)) bad.push(`track ${track.id} → ${id}`);
      }
    }
    const conceptIds = new Set(CONCEPT_NODES.map((n) => n.id));
    for (const node of CONCEPT_NODES) {
      node.relatedLessons.forEach((id) => { if (!lessonIds.has(id)) bad.push(`concept ${node.id} → ${id}`); });
      node.prerequisites.forEach((id) => { if (!conceptIds.has(id)) bad.push(`concept ${node.id} 前置 → ${id}`); });
    }
    for (const lesson of allLessons) {
      lesson.prerequisites?.forEach((id) => { if (!lessonIds.has(id)) bad.push(`${lesson.id} prerequisites → ${id}`); });
      lesson.practice?.questions.forEach((q) => {
        if (q.relatedLessonId && !lessonIds.has(q.relatedLessonId)) bad.push(`${q.id} relatedLessonId → ${q.relatedLessonId}`);
      });
    }
    for (const id of CROSS_MODULE_LESSON_IDS) {
      if (!lessonIds.has(id)) bad.push(`跨模块引用 → ${id}`);
    }
    expect(bad).toEqual([]);
  });

  it('drill 课程接线完整：type=drill 必有已注册 drillComponent；ChoiceDrill 必有题目', () => {
    const bad: string[] = [];
    for (const lesson of allLessons) {
      if (lesson.type === 'drill') {
        if (!lesson.drillComponent || !DRILL_COMPONENTS.has(lesson.drillComponent)) {
          bad.push(`${lesson.id}: drillComponent=${lesson.drillComponent ?? '(missing)'}`);
        }
        if (lesson.drillComponent === 'ChoiceDrill' && !(lesson.drillData?.questions.length)) {
          bad.push(`${lesson.id}: ChoiceDrill 无题目`);
        }
      } else if (lesson.drillComponent) {
        bad.push(`${lesson.id}: 非 drill 课程声明了 drillComponent`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('curriculum integrity: order 字段规范（低优先债务固化）', () => {
  // 本土课（并入 l7）有意共享 order 以保证稳定展示顺序，不纳入 native order 唯一性校验
  const localIds = new Set(LOCAL_LESSONS.map((l) => l.id));
  it('每个 LevelInfo 条目内部（排除本土课）native 课程 order 无重复', () => {
    const bad: string[] = [];
    for (const level of LEVELS) {
      const orders = level.lessons.filter((l) => !localIds.has(l.id)).map((l) => l.order);
      const dup = orders.filter((o, i) => orders.indexOf(o) !== i);
      if (dup.length > 0) bad.push(`${level.id}: order 重复 ${[...new Set(dup)].join(',')}`);
    }
    expect(bad).toEqual([]);
  });
});
