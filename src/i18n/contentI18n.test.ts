import { describe, expect, it } from 'vitest';
// 全量断言：从课程数据推导渲染层 key，兜底「数据有内容但漏注册双语 key」
import {
  lessonContentKey,
  basicsContentKey,
  unitTitleKey,
  quizQuestionKey,
  quizOptionKey,
  quizExplanationKey,
  exampleTitleKey,
  exampleCorrectActionKey,
  exampleCorrectAmountKey,
  exampleReasoningKey,
  exampleMistakeActionKey,
  exampleMistakeReasoningKey,
  exampleMistakeEvLossKey,
  exampleTableDescKey,
  exampleOpponentHistoryKey,
  exampleStackDescKey,
  practiceTableDescKey,
  practiceOpponentHistoryKey,
  practiceStackDescKey,
  practiceOptionActionKey,
  practiceOptionAmountKey,
  practiceOptionExplanationKey,
  practiceOptionEvImpactKey,
  drillScenarioKey,
  drillQuestionKey,
  drillOptionKey,
  drillExplanationKey,
  termChineseKey,
  termExplanationKey,
  opponentNameKey,
  opponentShortNameKey,
  opponentDescriptionKey,
  opponentTendencyKey,
  opponentExploitableKey,
  opponentDrillScenarioKey,
  opponentDrillExplanationKey,
  opponentDrillStrategyKey,
  opponentDrillRecentActionKey,
} from '../features/strategy-academy/utils/contentKeys';
import {
  theoryContentKey,
  theoryQuizQuestionKey,
  theoryQuizOptionKey,
  theoryQuizExplanationKey,
  theoryObjectiveKey,
} from '../features/theory-academy/utils/contentKeys';
import { ALL_VARIANT_LESSONS } from '../features/strategy-academy/data/lessons/variants';
import { LOCAL_LESSONS } from '../features/strategy-academy/data/localLessons';
import { BASICS_STEPS, GLOSSARY_TERMS } from '../features/strategy-academy/data/basicsContent';
import {
  OPPONENT_PROFILES,
  OPPONENT_DRILL_QUESTIONS,
} from '../features/strategy-academy/data/opponentProfiles';
import { ALL_VARIANT_THEORY_LEVELS } from '../features/theory-academy/data/levels/variants';

/**
 * 课程内容 i18n 守卫（阶段三·全量断言）。
 *
 * 覆盖对象：渲染层 key 覆盖的课程内容 key 命名空间 ——
 * strategy-academy（academy.content / basicsContent / unitTitle / quiz / example /
 * practice / drill / opponentDrill / term / opponent）与
 * theory-academy（theory.content / quiz / objectives）。
 *
 * 双重视角：
 * 1. 双语对称（阶段一骨架）：zh 与 en 的内容 key 集合完全对称（onlyZh / onlyEn = 0），
 *    即新增内容 key 必须同步双语，任一侧缺键即失败。
 * 2. 全量遍历（阶段三强化）：遍历全部课程数据（standard / short-deck / heads-up /
 *    localLessons / basics / terms / opponents / opponentDrill / theory 全变体），
 *    用 contentKeys 的单源 key 生成函数推导每个渲染消费点应存在的 key，
 *    断言双语 JSON 均包含 —— 兜底「数据有内容但漏注册 key 前缀」。
 */

const CONTENT_NAMESPACE_PREFIXES = [
  'academy.lessonContent.',
  'academy.basicsContent.',
  'academy.unitTitle.',
  'academy.lessonQuiz.',
  'academy.lessonExample.',
  'academy.lessonPractice.',
  'academy.drill.',
  'academy.opponentDrill.',
  'academy.term.',
  'academy.opponent.',
  'theory.content.',
  'theory.quiz.',
  'theory.chapterObjectives.',
];

const CONTENT_MODULES = ['academy', 'theory'] as const;

const zhModules = import.meta.glob<Record<string, unknown>>('./locales/zh/*.json', {
  import: 'default',
  eager: true,
});
const enModules = import.meta.glob<Record<string, unknown>>('./locales/en/*.json', {
  import: 'default',
  eager: true,
});

// 课程内容按 Level/变体拆分于 academy-course/ 子目录（对齐 data/lessons/variants 课程代码文件），
// 经 config.ts 的 import.meta.glob deep 合并注入 academy 命名空间 —— 守卫须同步遍历子目录。
const zhCourseModules = import.meta.glob<Record<string, unknown>>('./locales/zh/academy-course/*.json', {
  import: 'default',
  eager: true,
});
const enCourseModules = import.meta.glob<Record<string, unknown>>('./locales/en/academy-course/*.json', {
  import: 'default',
  eager: true,
});

function flattenKeys(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix];
  return Object.entries(node).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

function collectContentKeys(
  modules: Record<string, Record<string, unknown>>,
  courseModules: Record<string, Record<string, unknown>>,
): string[] {
  const keys: string[] = [];
  for (const file of Object.keys(modules)) {
    const moduleName = file.split('/').pop()!.replace(/\.json$/, '') as string;
    if (!(CONTENT_MODULES as readonly string[]).includes(moduleName)) continue;
    // 主文件（academy.json / theory.json）根对象即命名空间：flatten 结果须前置 module 前缀
    for (const key of flattenKeys(modules[file])) {
      const fullKey = `${moduleName}.${key}`;
      if (CONTENT_NAMESPACE_PREFIXES.some((p) => fullKey.startsWith(p))) keys.push(fullKey);
    }
  }
  // 课程子目录文件内部无 academy. 前缀（注入后才是完整 key），须前置补齐再判定
  for (const file of Object.keys(courseModules)) {
    for (const key of flattenKeys(courseModules[file])) {
      const fullKey = `academy.${key}`;
      if (CONTENT_NAMESPACE_PREFIXES.some((p) => fullKey.startsWith(p))) keys.push(fullKey);
    }
  }
  return keys;
}

/** 由全部课程数据推导应存在的渲染层 key 集合（与 contentKeys 单源 key 函数对齐） */
function generateExpectedContentKeys(): string[] {
  const keys: string[] = [];

  // ===== strategy-academy：standard + short-deck + heads-up + localLessons =====
  for (const lesson of [...ALL_VARIANT_LESSONS, ...LOCAL_LESSONS]) {
    lesson.content.forEach((_, sectionIndex) =>
      keys.push(lessonContentKey(lesson.id, sectionIndex)),
    );
    if (lesson.units) {
      for (const unit of lesson.units) keys.push(unitTitleKey(lesson.id, unit.id));
    }
    for (const q of lesson.quiz) {
      keys.push(quizQuestionKey(q.id));
      q.options.forEach((_, i) => keys.push(quizOptionKey(q.id, i)));
      keys.push(quizExplanationKey(q.id));
    }
    if (lesson.examples) {
      for (const ex of lesson.examples) {
        keys.push(exampleTitleKey(ex.id));
        keys.push(exampleCorrectActionKey(ex.id));
        if (ex.correctDecision.amount) keys.push(exampleCorrectAmountKey(ex.id));
        ex.correctDecision.reasoning.forEach((_, i) => keys.push(exampleReasoningKey(ex.id, i)));
        keys.push(exampleMistakeActionKey(ex.id));
        keys.push(exampleMistakeReasoningKey(ex.id));
        keys.push(exampleMistakeEvLossKey(ex.id));
        if (ex.gameContext?.tableDescription) keys.push(exampleTableDescKey(ex.id));
        if (ex.gameContext?.opponentHistory) keys.push(exampleOpponentHistoryKey(ex.id));
        if (ex.gameContext?.stackDistribution) keys.push(exampleStackDescKey(ex.id));
      }
    }
    if (lesson.practice) {
      for (const q of lesson.practice.questions) {
        if (q.scenario.gameContext?.tableDescription) keys.push(practiceTableDescKey(q.id));
        if (q.scenario.gameContext?.opponentHistory) keys.push(practiceOpponentHistoryKey(q.id));
        if (q.scenario.gameContext?.stackDistribution) keys.push(practiceStackDescKey(q.id));
        q.options.forEach((opt, i) => {
          keys.push(practiceOptionActionKey(q.id, i));
          if (opt.amount) keys.push(practiceOptionAmountKey(q.id, i));
          keys.push(practiceOptionExplanationKey(q.id, i));
          if (opt.evImpact) keys.push(practiceOptionEvImpactKey(q.id, i));
        });
      }
    }
    if (lesson.drillData) {
      for (const dq of lesson.drillData.questions) {
        keys.push(drillScenarioKey(dq.id));
        keys.push(drillQuestionKey(dq.id));
        dq.options.forEach((_, i) => keys.push(drillOptionKey(dq.id, i)));
        keys.push(drillExplanationKey(dq.id));
      }
    }
  }

  // ===== basics：BASICS_STEPS 正文 + GLOSSARY_TERMS 术语 =====
  for (const step of BASICS_STEPS) {
    step.content.forEach((_, i) => keys.push(basicsContentKey(step.id, i)));
  }
  for (const term of GLOSSARY_TERMS) {
    keys.push(termChineseKey(term.id));
    keys.push(termExplanationKey(term.id));
  }

  // ===== 对手档案 + 对手画像训练 =====
  for (const opp of Object.values(OPPONENT_PROFILES)) {
    keys.push(opponentNameKey(opp.id));
    keys.push(opponentShortNameKey(opp.id));
    keys.push(opponentDescriptionKey(opp.id));
    opp.tendencies.forEach((_, i) => keys.push(opponentTendencyKey(opp.id, i)));
    opp.exploitableBy.forEach((_, i) => keys.push(opponentExploitableKey(opp.id, i)));
  }
  for (const q of OPPONENT_DRILL_QUESTIONS) {
    keys.push(opponentDrillScenarioKey(q.id));
    keys.push(opponentDrillExplanationKey(q.id));
    q.strategyOptions.forEach((_, i) => keys.push(opponentDrillStrategyKey(q.id, i)));
    q.recentActions.forEach((_, i) => keys.push(opponentDrillRecentActionKey(q.id, i)));
  }

  // ===== theory-academy：standard + short-deck + heads-up 全变体 =====
  for (const level of ALL_VARIANT_THEORY_LEVELS) {
    for (const chapter of level.chapters) {
      chapter.content.forEach((_, i) => keys.push(theoryContentKey(chapter.id, i)));
      chapter.quiz.forEach((q) => {
        keys.push(theoryQuizQuestionKey(q.id));
        q.options.forEach((_, i) => keys.push(theoryQuizOptionKey(q.id, i)));
        keys.push(theoryQuizExplanationKey(q.id));
      });
      chapter.objectives?.forEach((_, i) => keys.push(theoryObjectiveKey(chapter.id, i)));
    }
  }

  return keys;
}

describe('课程内容 i18n key 双语对称（渲染层 key 覆盖）', () => {
  it('zh 与 en 的内容 key 集合完全一致（只加单语立即失败）', () => {
    const zhKeys = new Set(collectContentKeys(zhModules, zhCourseModules));
    const enKeys = new Set(collectContentKeys(enModules, enCourseModules));
    const onlyInZh = [...zhKeys].filter((k) => !enKeys.has(k));
    const onlyInEn = [...enKeys].filter((k) => !zhKeys.has(k));
    expect({ onlyInZh, onlyInEn }).toEqual({ onlyInZh: [], onlyInEn: [] });
  });

  it('内容 key 命名空间前缀已登记（新增命名空间须同步本清单）', () => {
    const unique = new Set(CONTENT_NAMESPACE_PREFIXES);
    expect(unique.size).toBe(CONTENT_NAMESPACE_PREFIXES.length);
    expect(CONTENT_NAMESPACE_PREFIXES.length).toBeGreaterThan(0);
  });

  it('全量遍历：课程数据推导的每个内容 key 在 zh 与 en 双语 JSON 中均存在', () => {
    const expectedKeys = generateExpectedContentKeys();
    const zhKeys = new Set(collectContentKeys(zhModules, zhCourseModules));
    const enKeys = new Set(collectContentKeys(enModules, enCourseModules));

    const missingInZh = expectedKeys.filter((k) => !zhKeys.has(k));
    const missingInEn = expectedKeys.filter((k) => !enKeys.has(k));

    // 若数据含内容但任一语言 JSON 缺失 key，即为漏注册 —— 兜底内容 key 化遗漏。
    expect({
      expectedCount: expectedKeys.length,
      missingInZh: [...new Set(missingInZh)].slice(0, 20),
      missingInZhCount: new Set(missingInZh).size,
      missingInEn: [...new Set(missingInEn)].slice(0, 20),
      missingInEnCount: new Set(missingInEn).size,
    }).toEqual({
      expectedCount: expect.any(Number),
      missingInZh: [],
      missingInZhCount: 0,
      missingInEn: [],
      missingInEnCount: 0,
    });
  });
});
