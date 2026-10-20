import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  isAcademyCourseFilesLoaded,
  loadAcademyCourseFiles,
} from '@/i18n/academyCourse';

/**
 * 课程文案文件就绪状态。
 * - zh：数据层原文即中文，立即可渲染；文件在后台加载（供语言切换与镜像 key 一致性）
 * - en：等待对应文件注入后再渲染，避免中文原文闪现
 * 已加载过的文件直接返回 true（同 Level 课程间切换不闪骨架）。
 */
export function useAcademyCourseI18n(files: readonly string[]): boolean {
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'zh';
  const normalized = [...new Set(files)].toSorted();
  const fileKey = normalized.join(',');
  const readyKey = `${language}:${fileKey}`;
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!fileKey) return;
    // 已就绪（组件测试预加载 / 同 Level 课程切换）时不产生多余状态更新
    if (isAcademyCourseFilesLoaded(fileKey.split(','), language)) return;
    let cancelled = false;
    void loadAcademyCourseFiles(fileKey.split(','), language).then(() => {
      if (!cancelled) setConfirmedKey(`${language}:${fileKey}`);
    });
    return () => {
      cancelled = true;
    };
  }, [fileKey, language]);

  if (!fileKey) return true;
  return (
    language === 'zh' ||
    isAcademyCourseFilesLoaded(fileKey.split(','), language) ||
    confirmedKey === readyKey
  );
}