/**
 * Level Checkpoint 文案解析（P2 交付期占位）。
 *
 * 模块文件 owner 分工：`academy.json` 归 P8，本轨不直接编辑词典；
 * 因此在 P8 补齐 `academy.levelCheckpoint.*` 之前，所有文案统一经本函数解析并回退中文 defaultValue。
 * key 用模板拼接（非 `t('字面量')`），避免 i18n 静态 key 守卫在 key 尚未入库时误报；
 * P8 落地后自动切到词典译文，无需改组件。
 *
 * 待 P8 登记的 key（zh/en 同批）见交付报告清单。
 */
import type { TFunction } from 'i18next';

export const CHECKPOINT_I18N_PREFIX = 'academy.levelCheckpoint';

export function checkpointText(
  t: TFunction,
  suffix: string,
  fallback: string,
  values?: Record<string, string | number>,
): string {
  return t(`${CHECKPOINT_I18N_PREFIX}.${suffix}`, { defaultValue: fallback, ...values });
}
