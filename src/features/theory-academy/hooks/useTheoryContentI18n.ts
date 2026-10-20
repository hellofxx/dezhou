import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  isTheoryContentLoaded,
  loadTheoryContentForChapters,
} from '@/i18n/preload';

/**
 * 章节内容语言包就绪状态。
 * - zh：数据层原文即中文，立即可渲染；内容包在后台加载（供语言切换与镜像 key 一致性）
 * - en：等待对应 level 内容包注入后再渲染，避免中文原文闪现
 * 已加载过的 level 直接返回 true（同 level 章节间切换不闪骨架）。
 */
export function useTheoryContentI18n(chapterIds: readonly string[]): boolean {
  const { i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'zh';
  const chapters = [...new Set(chapterIds)].toSorted();
  const chapterKey = chapters.join(',');
  const readyKey = `${language}:${chapterKey}`;
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!chapterKey) return;
    // 已就绪（常见于组件测试预加载 / 同 level 章节切换）时不产生多余状态更新
    if (isTheoryContentLoaded(chapterKey.split(','), language)) return;
    let cancelled = false;
    void loadTheoryContentForChapters(chapterKey.split(','), language).then(() => {
      if (!cancelled) setConfirmedKey(`${language}:${chapterKey}`);
    });
    return () => {
      cancelled = true;
    };
  }, [chapterKey, language]);

  if (!chapterKey) return true;
  return (
    language === 'zh' ||
    isTheoryContentLoaded(chapterKey.split(','), language) ||
    confirmedKey === readyKey
  );
}
