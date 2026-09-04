import {
  lessonContentKey,
  lessonObjectivesKey,
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
// lessonTitleKey 单源在 titleKeys.ts（渲染侧 ConceptGraph / resolveLessonTitle 同源消费），
// 此处直接复用，避免 key 形态在两个文件各写一份而漂移
import { lessonTitleKey } from '../features/strategy-academy/utils/titleKeys';
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
 * 课程内容 key ↔ 数据原文 条目生成器（测试消费的单一事实源，非生产代码路径）。
 *
 * 背景：渲染层 i18n key 由两个模块 utils/contentKeys 的单源函数从课程数据派生，
 * 存在两类失效模式：
 * 1. 漏注册 —— 数据有内容但 locale 无 key（contentI18n.test.ts 断言 key 集合覆盖）
 * 2. 陈旧 —— locale key 存在但值落后于数据原文，界面继续渲染旧文案
 *    （contentAlignment.test.ts 断言 zh locale === 数据原文）
 * 两类断言共用本文件的 key 推导，避免同一遍历逻辑在两处副本漂移。
 *
 * 数据口径（PRD §12.4.3）：数据层中文原文是唯一事实源，zh locale 是其镜像副本。
 */

/**
 * 内容命名空间清单（单源）：既供 contentI18n.test.ts 做「新增命名空间须登记」断言，
 * 也供守卫确认每条推导 key 都落在已登记前缀内。
 */
export const CONTENT_KEY_PREFIXES: readonly string[] = [
  'academy.lessonContent.',
  'academy.lessonTitle.',
  'academy.lessonObjectives.',
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

/**
 * 遍历全部课程数据（standard / short-deck / heads-up / localLessons / basics / terms /
 * opponents / opponentDrill / theory 全变体），产出「每个渲染消费点 key → 数据侧应有原文」。
 *
 * 语义与 contentI18n.test.ts 原 generateExpectedContentKeys() 的 key 集合完全一致，
 * 差别仅是同时携带值；重复 key（LOCAL_LESSONS 已并入 ALL_VARIANT_LESSONS）在 Map 中自然折叠。
 */
export function generateContentEntries(): Map<string, string> {
  const entries = new Map<string, string>();

  // ===== strategy-academy：standard + short-deck + heads-up + localLessons =====
  for (const lesson of [...ALL_VARIANT_LESSONS, ...LOCAL_LESSONS]) {
    entries.set(lessonTitleKey(lesson.id), lesson.title);
    lesson.content.forEach((section, sectionIndex) =>
      entries.set(lessonContentKey(lesson.id, sectionIndex), section.content),
    );
    lesson.objectives?.forEach((obj, i) => entries.set(lessonObjectivesKey(lesson.id, i), obj));
    if (lesson.units) {
      for (const unit of lesson.units) {
        entries.set(unitTitleKey(lesson.id, unit.id), unit.title);
      }
    }
    for (const q of lesson.quiz) {
      entries.set(quizQuestionKey(q.id), q.question);
      q.options.forEach((opt, i) => entries.set(quizOptionKey(q.id, i), opt));
      entries.set(quizExplanationKey(q.id), q.explanation);
    }
    if (lesson.examples) {
      for (const ex of lesson.examples) {
        entries.set(exampleTitleKey(ex.id), ex.title);
        entries.set(exampleCorrectActionKey(ex.id), ex.correctDecision.action);
        if (ex.correctDecision.amount) {
          entries.set(exampleCorrectAmountKey(ex.id), ex.correctDecision.amount);
        }
        ex.correctDecision.reasoning.forEach((r, i) =>
          entries.set(exampleReasoningKey(ex.id, i), r),
        );
        entries.set(exampleMistakeActionKey(ex.id), ex.commonMistake.action);
        entries.set(exampleMistakeReasoningKey(ex.id), ex.commonMistake.reasoning);
        entries.set(exampleMistakeEvLossKey(ex.id), ex.commonMistake.evLoss);
        if (ex.gameContext?.tableDescription) {
          entries.set(exampleTableDescKey(ex.id), ex.gameContext.tableDescription);
        }
        if (ex.gameContext?.opponentHistory) {
          entries.set(exampleOpponentHistoryKey(ex.id), ex.gameContext.opponentHistory);
        }
        if (ex.gameContext?.stackDistribution) {
          entries.set(exampleStackDescKey(ex.id), ex.gameContext.stackDistribution);
        }
      }
    }
    if (lesson.practice) {
      for (const q of lesson.practice.questions) {
        const ctx = q.scenario.gameContext;
        if (ctx?.tableDescription) entries.set(practiceTableDescKey(q.id), ctx.tableDescription);
        if (ctx?.opponentHistory) entries.set(practiceOpponentHistoryKey(q.id), ctx.opponentHistory);
        if (ctx?.stackDistribution) entries.set(practiceStackDescKey(q.id), ctx.stackDistribution);
        q.options.forEach((opt, i) => {
          entries.set(practiceOptionActionKey(q.id, i), opt.action);
          if (opt.amount) entries.set(practiceOptionAmountKey(q.id, i), opt.amount);
          entries.set(practiceOptionExplanationKey(q.id, i), opt.explanation);
          if (opt.evImpact) entries.set(practiceOptionEvImpactKey(q.id, i), opt.evImpact);
        });
      }
    }
    if (lesson.drillData) {
      for (const dq of lesson.drillData.questions) {
        entries.set(drillScenarioKey(dq.id), dq.scenario);
        entries.set(drillQuestionKey(dq.id), dq.question);
        dq.options.forEach((opt, i) => entries.set(drillOptionKey(dq.id, i), opt.text));
        entries.set(drillExplanationKey(dq.id), dq.explanation);
      }
    }
  }

  // ===== basics：BASICS_STEPS 正文 + GLOSSARY_TERMS 术语 =====
  for (const step of BASICS_STEPS) {
    step.content.forEach((section, i) => entries.set(basicsContentKey(step.id, i), section.content));
  }
  for (const term of GLOSSARY_TERMS) {
    entries.set(termChineseKey(term.id), term.chinese);
    entries.set(termExplanationKey(term.id), term.explanation);
  }

  // ===== 对手档案 + 对手画像训练 =====
  for (const opp of Object.values(OPPONENT_PROFILES)) {
    entries.set(opponentNameKey(opp.id), opp.name);
    entries.set(opponentShortNameKey(opp.id), opp.shortName);
    entries.set(opponentDescriptionKey(opp.id), opp.description);
    opp.tendencies.forEach((item, i) => entries.set(opponentTendencyKey(opp.id, i), item));
    opp.exploitableBy.forEach((item, i) => entries.set(opponentExploitableKey(opp.id, i), item));
  }
  for (const q of OPPONENT_DRILL_QUESTIONS) {
    entries.set(opponentDrillScenarioKey(q.id), q.scenario);
    entries.set(opponentDrillExplanationKey(q.id), q.explanation);
    q.strategyOptions.forEach((opt, i) =>
      entries.set(opponentDrillStrategyKey(q.id, i), opt),
    );
    q.recentActions.forEach((action, i) =>
      entries.set(opponentDrillRecentActionKey(q.id, i), action),
    );
  }

  // ===== theory-academy：standard + short-deck + heads-up 全变体 =====
  for (const level of ALL_VARIANT_THEORY_LEVELS) {
    for (const chapter of level.chapters) {
      chapter.content.forEach((section, i) =>
        entries.set(theoryContentKey(chapter.id, i), section.content),
      );
      for (const q of chapter.quiz) {
        entries.set(theoryQuizQuestionKey(q.id), q.question);
        q.options.forEach((opt, i) => entries.set(theoryQuizOptionKey(q.id, i), opt));
        entries.set(theoryQuizExplanationKey(q.id), q.explanation);
      }
      chapter.objectives?.forEach((obj, i) => entries.set(theoryObjectiveKey(chapter.id, i), obj));
    }
  }

  return entries;
}
