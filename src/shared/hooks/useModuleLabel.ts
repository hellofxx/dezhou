import { useTranslation } from 'react-i18next';
import { MODULE_LABEL_KEYS, MODULE_LABELS_FALLBACK } from '@/shared/constants/moduleLabels';

/**
 * 将模块标识解析为本地化显示名。
 * - 优先使用 i18n（zh / en 自动切换）
 * - 未注册模块直接返回原 moduleId（避免硬编码 i18n key 缺失时显示空白）
 */
export function useModuleLabel(): (moduleId: string) => string {
  const { t } = useTranslation();
  return (moduleId: string): string => {
    const key = MODULE_LABEL_KEYS[moduleId];
    if (key) return t(key);
    return MODULE_LABELS_FALLBACK[moduleId] ?? moduleId;
  };
}