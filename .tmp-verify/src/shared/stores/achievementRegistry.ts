/**
 * 成就检查数据源注册表（依赖倒置）。
 * 业务模块在自身 bootstrap 文件中调用 registerAchievementSource 注册，
 * progress store 的成就检查遍历 getAchievementSources() 查询，不再动态 import。
 */
import type { AchievementDataSource } from '@/shared/types/achievementDataSource';

const registry: AchievementDataSource[] = [];

export function registerAchievementSource(source: AchievementDataSource): void {
  registry.push(source);
}

export function getAchievementSources(): readonly AchievementDataSource[] {
  return registry;
}
