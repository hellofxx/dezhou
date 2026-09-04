import type { TFunction } from 'i18next';
import type {
  BasicsStep,
  DrillQuestion,
  HandExample,
  Lesson,
  LessonSection,
  LessonUnit,
  OpponentProfile,
  PracticeQuestion,
  QuizQuestion,
  Term,
} from '../types';
import type { OpponentDrillQuestion } from '../data/opponentProfiles';
import { resolveUnitTitle } from './lessonUnits';

/**
 * 渲染层课程内容 i18n key 解析（单源）。
 *
 * 背景：课程正文/题库/例题/实战（data/**）为硬编码中文，全量迁移数据层成本极高。
 * 本工具提供「渲染层 key 覆盖」：消费组件经 `t(key, { defaultValue: <数据层中文> })` 渲染，
 * 英文环境命中 i18n key，中文环境回退数据层原文（行为零变化）。
 *
 * key 命名遵循 `<module>.<context>.<field>`：
 * - 正文段落（section 无稳定 id）：`academy.lessonContent.<lessonId>.<content 数组索引>`
 * - 课后测验/例题/实战（均有稳定 id）：`academy.lessonQuiz|lessonExample|lessonPractice.<id>.*`
 * - 对手档案（跨模块共享 id）：`academy.opponent.<id>.*`
 *   （内容命名空间用 lesson* 前缀，因 `academy.content/quiz/practice` 已被 UI chrome 占用）
 *
 * 排序治理配合：quiz / practice 的 resolve 函数先 t() 解析（option 用原始索引派生 key），
 * 再由调用方走既有排序出口（orderQuizQuestion / orderPracticeOptions）重排 ——
 * 种子只依赖 id，zh/en 顺序一致，correctIndex 同步重映射。
 */

// ===== 正文段落 =====

export function lessonContentKey(lessonId: string, sectionIndex: number): string {
  return `academy.lessonContent.${lessonId}.${sectionIndex}`;
}

export function basicsContentKey(stepId: string, sectionIndex: number): string {
  return `academy.basicsContent.${stepId}.${sectionIndex}`;
}

export function unitTitleKey(lessonId: string, unitId: string): string {
  return `academy.unitTitle.${lessonId}.${unitId}`;
}

/** 解析正文段落文本：key 命中取译文，否则回退数据层原文 */
export function resolveSectionText(t: TFunction, section: LessonSection, key: string): string {
  return t(key, { defaultValue: section.content });
}

/** 解析 unit 展示标题（key 优先，fallback 为既有 resolveUnitTitle 语义） */
export function resolveUnitTitleKeyed(t: TFunction, lesson: Lesson, unit: LessonUnit): string {
  return t(unitTitleKey(lesson.id, unit.id), {
    defaultValue: resolveUnitTitle(unit, (k) => t(k)),
  });
}

// ===== 学习目标（Lesson.objectives，索引型数组）=====

export function lessonObjectivesKey(lessonId: string, index: number): string {
  return `academy.lessonObjectives.${lessonId}.${index}`;
}

/** 解析学习目标数组（按索引派生 key，defaultValue 兜底数据层中文原文） */
export function resolveLessonObjectives(
  t: TFunction,
  lessonId: string,
  objectives: readonly string[],
): string[] {
  return objectives.map((obj, i) =>
    t(lessonObjectivesKey(lessonId, i), { defaultValue: obj }),
  );
}

// ===== 课后测验（QuizQuestion 有稳定 id）=====

export function quizQuestionKey(questionId: string): string {
  return `academy.lessonQuiz.${questionId}.question`;
}

export function quizOptionKey(questionId: string, optionIndex: number): string {
  return `academy.lessonQuiz.${questionId}.options.${optionIndex}`;
}

export function quizExplanationKey(questionId: string): string {
  return `academy.lessonQuiz.${questionId}.explanation`;
}

/** 解析课后测验题（option 用原始索引派生 key；调用方随后走 orderQuizQuestion） */
export function resolveQuizQuestion(t: TFunction, q: QuizQuestion): QuizQuestion {
  return {
    ...q,
    question: t(quizQuestionKey(q.id), { defaultValue: q.question }),
    options: q.options.map((opt, i) => t(quizOptionKey(q.id, i), { defaultValue: opt })),
    explanation: t(quizExplanationKey(q.id), { defaultValue: q.explanation }),
  };
}

// ===== 手牌例题（HandExample 有稳定 id）=====

export function exampleTitleKey(exampleId: string): string {
  return `academy.lessonExample.${exampleId}.title`;
}

export function exampleCorrectActionKey(exampleId: string): string {
  return `academy.lessonExample.${exampleId}.correctAction`;
}

export function exampleCorrectAmountKey(exampleId: string): string {
  return `academy.lessonExample.${exampleId}.correctAmount`;
}

export function exampleReasoningKey(exampleId: string, index: number): string {
  return `academy.lessonExample.${exampleId}.reasoning.${index}`;
}

export function exampleMistakeActionKey(exampleId: string): string {
  return `academy.lessonExample.${exampleId}.mistakeAction`;
}

export function exampleMistakeReasoningKey(exampleId: string): string {
  return `academy.lessonExample.${exampleId}.mistakeReasoning`;
}

export function exampleMistakeEvLossKey(exampleId: string): string {
  return `academy.lessonExample.${exampleId}.mistakeEvLoss`;
}

export function exampleTableDescKey(exampleId: string): string {
  return `academy.lessonExample.${exampleId}.tableDesc`;
}

export function exampleOpponentHistoryKey(exampleId: string): string {
  return `academy.lessonExample.${exampleId}.opponentHistory`;
}

export function exampleStackDescKey(exampleId: string): string {
  return `academy.lessonExample.${exampleId}.stackDesc`;
}

/** 解析手牌例题（仅字符串文案字段；数字/牌面/位置为通用常量不翻译） */
export function resolveHandExample(t: TFunction, ex: HandExample): HandExample {
  const correctDecision = ex.correctDecision;
  const commonMistake = ex.commonMistake;
  const gameContext = ex.gameContext;
  return {
    ...ex,
    title: t(exampleTitleKey(ex.id), { defaultValue: ex.title }),
    correctDecision: {
      ...correctDecision,
      action: t(exampleCorrectActionKey(ex.id), { defaultValue: correctDecision.action }),
      amount: correctDecision.amount
        ? t(exampleCorrectAmountKey(ex.id), { defaultValue: correctDecision.amount })
        : undefined,
      reasoning: correctDecision.reasoning.map((r, i) =>
        t(exampleReasoningKey(ex.id, i), { defaultValue: r }),
      ),
    },
    commonMistake: {
      ...commonMistake,
      action: t(exampleMistakeActionKey(ex.id), { defaultValue: commonMistake.action }),
      reasoning: t(exampleMistakeReasoningKey(ex.id), { defaultValue: commonMistake.reasoning }),
      evLoss: t(exampleMistakeEvLossKey(ex.id), { defaultValue: commonMistake.evLoss }),
    },
    gameContext: gameContext
      ? {
          ...gameContext,
          tableDescription: gameContext.tableDescription
            ? t(exampleTableDescKey(ex.id), { defaultValue: gameContext.tableDescription })
            : undefined,
          opponentHistory: gameContext.opponentHistory
            ? t(exampleOpponentHistoryKey(ex.id), { defaultValue: gameContext.opponentHistory })
            : undefined,
          stackDistribution: gameContext.stackDistribution
            ? t(exampleStackDescKey(ex.id), { defaultValue: gameContext.stackDistribution })
            : undefined,
        }
      : undefined,
  };
}

// ===== 对手档案（跨模块共享 id，全局 key）=====

export function opponentNameKey(opponentId: string): string {
  return `academy.opponent.${opponentId}.name`;
}

export function opponentShortNameKey(opponentId: string): string {
  return `academy.opponent.${opponentId}.shortName`;
}

export function opponentDescriptionKey(opponentId: string): string {
  return `academy.opponent.${opponentId}.description`;
}

export function opponentTendencyKey(opponentId: string, index: number): string {
  return `academy.opponent.${opponentId}.tendencies.${index}`;
}

export function opponentExploitableKey(opponentId: string, index: number): string {
  return `academy.opponent.${opponentId}.exploitable.${index}`;
}

/** 解析对手档案（stats 数值与 icon/color 不翻译） */
export function resolveOpponent(t: TFunction, opp: OpponentProfile): OpponentProfile {
  return {
    ...opp,
    name: t(opponentNameKey(opp.id), { defaultValue: opp.name }),
    shortName: t(opponentShortNameKey(opp.id), { defaultValue: opp.shortName }),
    description: t(opponentDescriptionKey(opp.id), { defaultValue: opp.description }),
    tendencies: opp.tendencies.map((item, i) =>
      t(opponentTendencyKey(opp.id, i), { defaultValue: item }),
    ),
    exploitableBy: opp.exploitableBy.map((item, i) =>
      t(opponentExploitableKey(opp.id, i), { defaultValue: item }),
    ),
  };
}

// ===== 实战练习（PracticeQuestion 有稳定 id；option 无 id 用 questionId + 原始索引）=====

export function practiceTableDescKey(questionId: string): string {
  return `academy.lessonPractice.${questionId}.tableDesc`;
}

export function practiceOpponentHistoryKey(questionId: string): string {
  return `academy.lessonPractice.${questionId}.opponentHistory`;
}

export function practiceStackDescKey(questionId: string): string {
  return `academy.lessonPractice.${questionId}.stackDesc`;
}

export function practiceOptionActionKey(questionId: string, optionIndex: number): string {
  return `academy.lessonPractice.${questionId}.option.${optionIndex}.action`;
}

export function practiceOptionAmountKey(questionId: string, optionIndex: number): string {
  return `academy.lessonPractice.${questionId}.option.${optionIndex}.amount`;
}

export function practiceOptionExplanationKey(questionId: string, optionIndex: number): string {
  return `academy.lessonPractice.${questionId}.option.${optionIndex}.explanation`;
}

export function practiceOptionEvImpactKey(questionId: string, optionIndex: number): string {
  return `academy.lessonPractice.${questionId}.option.${optionIndex}.evImpact`;
}

/**
 * 解析实战题（option 用原始索引派生 key；调用方随后走 orderPracticeOptions）。
 * scenario 中 heroHand/position/board/street/previousActions 为通用常量不翻译；
 * opponent 走 resolveOpponent；gameContext 文案字段走 key 覆盖。
 */
export function resolvePracticeQuestion(t: TFunction, q: PracticeQuestion): PracticeQuestion {
  const scenario = q.scenario;
  const gameContext = scenario.gameContext;
  return {
    ...q,
    options: q.options.map((opt, i) => ({
      ...opt,
      action: t(practiceOptionActionKey(q.id, i), { defaultValue: opt.action }),
      amount: opt.amount
        ? t(practiceOptionAmountKey(q.id, i), { defaultValue: opt.amount })
        : undefined,
      explanation: t(practiceOptionExplanationKey(q.id, i), { defaultValue: opt.explanation }),
      evImpact: opt.evImpact
        ? t(practiceOptionEvImpactKey(q.id, i), { defaultValue: opt.evImpact })
        : undefined,
    })),
    scenario: {
      ...scenario,
      // opponent 走 resolveOpponent（data/opponentProfiles 硬编码中文，渲染层 key 覆盖）
      opponent: scenario.opponent ? resolveOpponent(t, scenario.opponent) : scenario.opponent,
      gameContext: gameContext
        ? {
            ...gameContext,
            tableDescription: gameContext.tableDescription
              ? t(practiceTableDescKey(q.id), { defaultValue: gameContext.tableDescription })
              : undefined,
            opponentHistory: gameContext.opponentHistory
              ? t(practiceOpponentHistoryKey(q.id), { defaultValue: gameContext.opponentHistory })
              : undefined,
            stackDistribution: gameContext.stackDistribution
              ? t(practiceStackDescKey(q.id), { defaultValue: gameContext.stackDistribution })
              : undefined,
          }
        : gameContext,
    },
  };
}

// ===== 术语（basicsContent 术语表）=====

export function termChineseKey(termId: string): string {
  return `academy.term.${termId}.chinese`;
}

export function termExplanationKey(termId: string): string {
  return `academy.term.${termId}.explanation`;
}

/** 解析术语条目（english 为英文专名不翻译） */
export function resolveTerm(t: TFunction, term: Term): Term {
  return {
    ...term,
    chinese: t(termChineseKey(term.id), { defaultValue: term.chinese }),
    explanation: t(termExplanationKey(term.id), { defaultValue: term.explanation }),
  };
}

// ===== Basics 步骤正文 =====

/** 解析 Basics 步骤正文段落（content 用 stepId + content 数组索引） */
export function resolveBasicsSectionText(
  t: TFunction,
  step: BasicsStep,
  section: LessonSection,
  sectionIndex: number,
): string {
  return t(basicsContentKey(step.id, sectionIndex), { defaultValue: section.content });
}

// ===== Drill 选择题（lesson.drillData，DrillQuestion 有稳定 id）=====

export function drillScenarioKey(questionId: string): string {
  return `academy.drill.${questionId}.scenario`;
}

export function drillQuestionKey(questionId: string): string {
  return `academy.drill.${questionId}.question`;
}

export function drillOptionKey(questionId: string, optionIndex: number): string {
  return `academy.drill.${questionId}.option.${optionIndex}`;
}

export function drillExplanationKey(questionId: string): string {
  return `academy.drill.${questionId}.explanation`;
}

/** 解析 Drill 选择题（hand/position 为英文牌型/位置缩写不翻译；调用方随后走 orderDrillOptions） */
export function resolveDrillQuestion(t: TFunction, q: DrillQuestion): DrillQuestion {
  return {
    ...q,
    scenario: t(drillScenarioKey(q.id), { defaultValue: q.scenario }),
    question: t(drillQuestionKey(q.id), { defaultValue: q.question }),
    options: q.options.map((opt, i) => ({
      ...opt,
      text: t(drillOptionKey(q.id, i), { defaultValue: opt.text }),
    })),
    explanation: t(drillExplanationKey(q.id), { defaultValue: q.explanation }),
  };
}

// ===== 对手画像训练（OpponentDrillQuestion 有稳定 id）=====

export function opponentDrillScenarioKey(questionId: string): string {
  return `academy.opponentDrill.${questionId}.scenario`;
}

export function opponentDrillExplanationKey(questionId: string): string {
  return `academy.opponentDrill.${questionId}.explanation`;
}

export function opponentDrillStrategyKey(questionId: string, optionIndex: number): string {
  return `academy.opponentDrill.${questionId}.strategy.${optionIndex}`;
}

export function opponentDrillRecentActionKey(questionId: string, index: number): string {
  return `academy.opponentDrill.${questionId}.recentActions.${index}`;
}

/** 解析对手画像训练题（stats/sampleSize/typeOptions 为数值与 profile id 不翻译） */
export function resolveOpponentDrillQuestion(
  t: TFunction,
  q: OpponentDrillQuestion,
): OpponentDrillQuestion {
  return {
    ...q,
    scenario: t(opponentDrillScenarioKey(q.id), { defaultValue: q.scenario }),
    explanation: t(opponentDrillExplanationKey(q.id), { defaultValue: q.explanation }),
    strategyOptions: q.strategyOptions.map((opt, i) =>
      t(opponentDrillStrategyKey(q.id, i), { defaultValue: opt }),
    ),
    recentActions: q.recentActions.map((action, i) =>
      t(opponentDrillRecentActionKey(q.id, i), { defaultValue: action }),
    ),
  };
}
