/**
 * 相关课程标签组件 - pill 样式跳转课程（§13.4.4）
 *
 * @module shared/components/feedback/RelatedLessonChip
 * @description 使用全局 CSS 类 related-lesson-chip（globals.css 已定义），
 * 带 ExternalLink 图标。共享层不持有路由：点击只把 lessonId 回传给调用方注入的
 * `onOpen`，由各 feature 用自身 navigate 拼目标路径（避免 shared 硬编码 feature 路由）。
 */

import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';

interface RelatedLessonChipProps {
  lessonId: string;
  /** 点击回调：由调用方注入路由跳转（shared 不感知 feature 路由） */
  onOpen: (lessonId: string) => void;
  /** 自定义标签文字（缺省用 i18n feedback.relatedLesson） */
  label?: string;
}

export function RelatedLessonChip({ lessonId, onOpen, label }: RelatedLessonChipProps) {
  const { t } = useTranslation();
  const text = label ?? t('feedback.relatedLesson');

  // 移动端 44px 触摸目标（DESIGN.md §6.3）：用 min-height 撑高，不用会与相邻元素重叠的伪元素热区
  return (
    <button
      type="button"
      className={cn('related-lesson-chip max-md:min-h-11', FOCUS_RING)}
      aria-label={text}
      onClick={() => onOpen(lessonId)}
    >
      <span>{text}</span>
      <ExternalLink size={12} className="text-[var(--poker-brass-muted)]" aria-hidden="true" />
    </button>
  );
}
