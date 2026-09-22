/**
 * 成就检查数据源注册表（依赖倒置）。
 * 业务模块在自身 bootstrap 文件中调用 registerAchievementSource 注册，
 * progress store 的成就检查遍历 getAchievementSources() 查询，不再动态 import。
 * 
 * T7/B4 幂等修复：增加 id 字段和 upsert 逻辑，防止重复注册累积。
 */
import type { AchievementDataSource } from '@/shared/types/achievementDataSource';

interface RegistryItem extends AchievementDataSource {
  id: string;
}

const registry: RegistryItem[] = [];

export function registerAchievementSource(source: Omit<AchievementDataSource, 'id'> & { id?: string }): void {
  const sourceId = source.id || `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Fallback if no id
  
  // Check if already registered by id
  const existingIndex = registry.findIndex((s) => s.id === sourceId);
  if (existingIndex >= 0) {
    // Replace instead of append (idempotent upsert)
    registry[existingIndex] = { ...source, id: sourceId };
    return;
  }
  
  // New registration
  registry.push({ ...source, id: sourceId });
}

export function getAchievementSources(): readonly AchievementDataSource[] {
  return registry;
}
