import { useTranslation } from 'react-i18next';
import { ArrowRight, Home, RotateCcw, Target } from 'lucide-react';
import { ResultSlip } from '@/shared/components/feedback/ResultSlip';
import type { DrillResult } from './drills/types';

interface CourseDoneSlipProps {
  open: boolean;
  isDrill: boolean;
  quizScore: number;
  drillResult: DrillResult | null;
  nextLesson: { id: string; title: string } | undefined;
  onNext: () => void;
  onBack: () => void;
  /** 返回入口文案（来源感知，由 CourseView 经 resolveCourseBack 提供） */
  backLabel: string;
  onRestart: () => void;
  onClose: () => void;
}

/** 课程完成纸条：回执面板保留在背后，关闭即揭示。 */
export default function CourseDoneSlip({
  open,
  isDrill,
  quizScore,
  drillResult,
  nextLesson,
  onNext,
  onBack,
  backLabel,
  onRestart,
  onClose,
}: CourseDoneSlipProps) {
  const { t } = useTranslation();

  const title = isDrill
    ? t('academy.courseView.drillMastered', { defaultValue: '训练达标' })
    : t('academy.courseView.lessonMastered', { defaultValue: '本课已掌握' });

  const metrics = isDrill && drillResult
    ? [
        { label: t('academy.courseView.drillScore', { defaultValue: '训练成绩' }), value: `${drillResult.correct}/${drillResult.total}`, icon: <Target className="w-4 h-4" />, accent: 'brass' as const },
        { label: t('academy.courseView.accuracy', { defaultValue: '正确率' }), value: `${quizScore}%`, accent: 'success' as const },
        { label: t('academy.courseView.timeSpent', { defaultValue: '用时' }), value: `${(drillResult.timeTaken / 1000).toFixed(1)}s` },
      ]
    : [
        { label: t('academy.courseView.quizScoreLabel', { defaultValue: '测验得分' }), value: `${quizScore}`, icon: <Target className="w-4 h-4" />, accent: 'brass' as const },
      ];

  return (
    <ResultSlip
      open={open}
      onClose={onClose}
      title={title}
      subtitle={nextLesson ? t('academy.courseView.nextUp', { defaultValue: '下一步：{{title}}', title: nextLesson.title }) : t('academy.courseView.pathComplete', { defaultValue: '这一段学习已完成' })}
      tone="success"
      metrics={metrics}
      detail={
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--brass)]/40 px-4 text-sm font-semibold text-[var(--brass-text)] transition-colors hover:bg-[var(--brass-glow)]"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {t('academy.courseView.restartLesson', { defaultValue: '重学本课' })}
          </button>
        </div>
      }
      actions={
        nextLesson
          ? [
              { label: t('academy.courseView.nextLesson', { defaultValue: '下一课：{{title}}', title: nextLesson.title }), onClick: onNext, variant: 'primary', icon: <ArrowRight className="w-4 h-4" /> },
              { label: backLabel, onClick: onBack, variant: 'outline', icon: <Home className="w-4 h-4" /> },
            ]
          : [
              { label: backLabel, onClick: onBack, variant: 'primary', icon: <Home className="w-4 h-4" /> },
            ]
      }
    />
  );
}
