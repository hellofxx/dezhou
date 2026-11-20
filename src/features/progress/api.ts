import { useProgressStore } from './store';
import type { ProgressCommands, ProgressReadModel } from './api.types';

/**
 * progress 跨模块公共入口。
 *
 * 其他 feature 只通过本文件读取状态或提交业务命令：
 * - 不暴露完整 store、getState/setState/persist；
 * - 读取走显式 ProgressReadModel（新增字段需在此登记）；
 * - 命令只委托既有 action，业务规则仍由 progress 持有。
 * 模块内部（components / utils / store.bootstrap）可直接使用 store。
 */
export function useProgressState<T>(selector: (state: ProgressReadModel) => T): T {
  return useProgressStore((s) => selector(s));
}

export const progressCommands: ProgressCommands = {
  updateSettings: (partial) => useProgressStore.getState().updateSettings(partial),
  updateElo: (dimension, isCorrect, difficulty) =>
    useProgressStore.getState().updateElo(dimension, isCorrect, difficulty),
  seedEloFromOnboardingAbility: (ability) =>
    useProgressStore.getState().seedEloFromOnboardingAbility(ability),
  recordAnswer: (isCorrect) => useProgressStore.getState().recordAnswer(isCorrect),
  addReviewItem: (item) => useProgressStore.getState().addReviewItem(item),
  updateReviewItem: (item) => useProgressStore.getState().updateReviewItem(item),
  recordTrainingDay: () => useProgressStore.getState().recordTrainingDay(),
  shouldDownshiftDifficulty: () => useProgressStore.getState().shouldDownshiftDifficulty(),
  completeOnboardingStep: (step, data) =>
    useProgressStore.getState().completeOnboardingStep(step, data),
  skipOnboarding: () => useProgressStore.getState().skipOnboarding(),
  submitQuickDrillResult: (input) => useProgressStore.getState().submitQuickDrillResult(input),
  recordQuickDrillCompletion: () =>
    useProgressStore.getState().recordQuickDrillCompletion(),
  setMentorStyle: (style) => useProgressStore.getState().setMentorStyle(style),
  useStreakFreeze: () => useProgressStore.getState().useStreakFreeze(),
  setDailyQuestionLimit: (limit) =>
    useProgressStore.getState().setDailyQuestionLimit(limit),
  setTodayMood: (mood) => useProgressStore.getState().setTodayMood(mood),
  clearEloRankUp: () => useProgressStore.getState().clearEloRankUp(),
  switchActiveVariant: (variant) =>
    useProgressStore.getState().switchActiveVariant(variant),
  checkDownswing: () => useProgressStore.getState().checkDownswing(),
  getActiveEloRating: () => {
    const state = useProgressStore.getState();
    return state.eloByVariant[state.activeVariant];
  },
  getStandardEloRating: () => useProgressStore.getState().eloByVariant.standard,
  getOnboardingInitialAbility: () =>
    useProgressStore.getState().onboarding.initialAbility,
  getReviewItemsSnapshot: () => useProgressStore.getState().reviewItems,
  getEmotionSnapshot: () => useProgressStore.getState().emotion,
  getSettingsSnapshot: () => useProgressStore.getState().settings,
};

export type { ProgressCommands, ProgressReadModel, OnboardingAbility } from './api.types';
