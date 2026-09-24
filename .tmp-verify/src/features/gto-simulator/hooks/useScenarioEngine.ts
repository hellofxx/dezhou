import { useCallback } from 'react';
import type { ScenarioConfig, Scenario } from '../types';
import { useGTOSimulatorStore } from '../store';
import { generateScenario } from '../utils/scenarioGenerator';
import { getEasyGTOScenario } from './useGTOComparison';

/**
 * 场景引擎 Hook — 生成训练场景并管理会话流转。
 *
 * 逻辑已拆至 utils/scenarioGenerator.ts（P1C-01/05/20/21/25/26 修复在此）。
 * 本 Hook 仅负责：
 *  1. 使用 generateScenario 批量生成场景
 *  2. 末题替换为简单场景（getEasyGTOScenario）
 *  3. 代理 store 方法供组件使用
 */
export function useScenarioEngine() {
  const { config, startSession, submitDecision, nextScenario, session } = useGTOSimulatorStore();

  const generateScenarios = useCallback(
    (cfg?: Partial<ScenarioConfig>) => {
      const mergedConfig = cfg ? { ...config, ...cfg } : config;
      const scenarios: Scenario[] = [];
      for (let i = 0; i < mergedConfig.scenarioCount; i++) {
        scenarios.push(generateScenario(mergedConfig, i));
      }

      // "最后一题简单"策略：将末场景替换为最简单的 BTN AA open 场景
      const finalScenarios =
        scenarios.length > 0
          ? [...scenarios.slice(0, scenarios.length - 1), getEasyGTOScenario(scenarios.length - 1)]
          : scenarios;

      startSession(finalScenarios);
    },
    [config, startSession]
  );

  const getCurrentScenario = useCallback((): Scenario | null => {
    if (!session || session.isComplete) return null;
    return session.scenarios[session.currentIndex] ?? null;
  }, [session]);

  const getProgress = useCallback(() => {
    if (!session) return { current: 0, total: 0, percentage: 0 };
    return {
      current: session.currentIndex + 1,
      total: session.scenarios.length,
      percentage: ((session.currentIndex + 1) / session.scenarios.length) * 100,
    };
  }, [session]);

  return {
    generateScenarios,
    getCurrentScenario,
    submitDecision,
    nextScenario,
    getProgress,
    session,
    config,
  };
}
