/**
 * 相关课程标签组件 - pill 样式跳转课程（§13.4.4）
 *
 * @module shared/components/feedback/RelatedLessonChip
 * @description 使用全局 CSS 类 related-lesson-chip（globals.css 已定义），
 * 带 ExternalLink 图标，点击跳转对应课程页面。
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

interface RelatedLessonChipProps {
  lessonId: string;
  /** 自定义标签文字（缺省用 i18n feedback.relatedLesson） */
  label?: string;
}

export function RelatedLessonChip({ lessonId, label }: RelatedLessonChipProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const text = label ?? t('feedback.relatedLesson');

  return (
    <button
      type="button"
      className="related-lesson-chip"
      aria-label={text}
      onClick={() => navigate(`/academy/lesson/${lessonId}`)}
    >
      <span>{text}</span>
      <ExternalLink size={12} className="text-[var(--poker-brass-muted)]" aria-hidden="true" />
    </button>
  );
}
