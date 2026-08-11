import type { TFunction } from 'i18next';
import type { RangePreset } from '../types';

/**
 * 渲染层预设范围名称 i18n key 解析（单源）。
 *
 * 背景：constants.ts 的 preset name 大部分为英文，仅少量（短牌 CO/BTN Open Raise、
 * 通用 4-Bet 范围）为硬编码中文。本工具提供「渲染层 key 覆盖」：消费组件经
 * `t(key, { defaultValue: <数据层 name> })` 渲染，命中 i18n key 时用 key，否则回退数据层原文。
 * key 命名遵循 `<module>.<context>.<field>`：rangeTrainer.presetName.<id> 等。
 */
export function presetNameKey(presetId: string): string {
  return `rangeTrainer.presetName.${presetId}`;
}

export function resolvePresetName(t: TFunction, preset: RangePreset): string {
  return t(presetNameKey(preset.id), { defaultValue: preset.name });
}
