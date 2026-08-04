/**
 * 课程完成面板（done 阶段）
 *
 * P2-01: 从 CourseView 抽取，用于收敛 done 阶段 JSX（约 84 行）。
 * 包含：成绩展示 + 返回学院/下一课按钮 + 推荐下一步轨道卡列表。
 */
import { CheckCircle2, Home, ArrowRight, RotateCcw, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DrillResult } from './drills/types';
import type { LearningTrack } from '../types';

export interface CourseDoneViewProps {
  isDrill: boolean;
  quizScore: number;
  drillResult: DrillResult | null;
  nextLesson: { id: string; title: string } | undefined;
  relatedTracks: LearningTrack[];
  completedLessons: readonly string[];
  hasPractice?: boolean;
  onBack: () => void;
  onNext: () => void;
  onRestart: (target?: 'units' | 'practice') => void;
  onNavigateToTrack: (trackId: string) => void;
}

export default function CourseDoneView({
  isDrill,
  quizScore,
  drillResult,
  nextLesson,
  relatedTracks,
  completedLessons,
  hasPractice = false,
  onBack,
  onNext,
  onRestart,
  onNavigateToTrack,
}: CourseDoneViewProps) {
  const { t } = useTranslation();
  return (
    <>
      <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-8 text-center">
        <CheckCircle2 className="w-14 h-14 text-[var(--success)] mx-auto mb-4" />
        <h2 className="font-display text-2xl text-[var(--ivory)] mb-2">
          {isDrill
            ? t('academy.courseView.drillComplete', { defaultValue: '训练完成！' })
            : t('academy.courseView.courseComplete', { defaultValue: '课程完成！' })}
        </h2>
        {isDrill && drillResult ? (
          <>
            <p className="text-[var(--ivory-dim)] mb-1">
              {t('academy.courseView.drillScore', { defaultValue: '训练成绩' })}
            </p>
            <p className="font-numeric text-4xl text-[var(--brass-bright)] mb-2">
              {drillResult.correct}/{drillResult.total}
            </p>
            <p className="text-xs text-[var(--ivory-muted)] mb-8">
              {t('academy.courseView.drillStats', {
                defaultValue: '正确率 {{accuracy}}% · 用时 {{time}}s',
                accuracy: quizScore,
                time: (drillResult.timeTaken / 1000).toFixed(1),
              })}
            </p>
          </>
        ) : (
          <>
            <p className="text-[var(--ivory-dim)] mb-1">
              {t('academy.courseView.quizScoreLabel', { defaultValue: '测验得分' })}
            </p>
            <p className="font-numeric text-4xl text-[var(--brass-bright)] mb-8">
              {quizScore}
              {t('academy.courseView.scoreUnit', { defaultValue: '分' })}
            </p>
          </>
        )}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/80 transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            {t('academy.courseView.backToAcademy', { defaultValue: '返回学院' })}
          </button>
          {hasPractice && (
            <button
              onClick={() => onRestart('practice')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--brass-bright)]/50 text-[var(--brass-bright)] hover:bg-[var(--brass-bright)]/10 transition-colors text-sm"
            >
              <Zap className="w-4 h-4" />
              {t('academy.courseView.restartPractice', { defaultValue: '重新实战' })}
            </button>
          )}
          <button
            onClick={() => onRestart('units')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory-muted)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/80 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            {t('academy.courseView.restartLesson', { defaultValue: '重学本课' })}
          </button>
          {nextLesson && (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity max-w-full"
            >
              <span className="truncate min-w-0 max-w-[10rem] sm:max-w-[14rem]">
                {t('academy.courseView.nextLesson', {
                  defaultValue: '下一课：{{title}}',
                  title: nextLesson.title,
                })}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {relatedTracks.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-base text-[var(--ivory)] mb-4 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-[var(--brass-bright)]" />
            {t('academy.courseView.recommendedNext', { defaultValue: '推荐下一步' })}
          </h3>
          <div className="grid gap-3">
            {relatedTracks.map((track) => {
              const completedIn = track.lessonIds.filter((id) =>
                completedLessons.includes(id)
              ).length;
              const totalIn = track.lessonIds.length;
              return (
                <button
                  key={track!.id}
                  onClick={() => onNavigateToTrack(track!.id)}
                  className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-4 text-left hover:border-[var(--brass-bright)]/50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{track!.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm text-[var(--ivory)] group-hover:text-[var(--brass-bright)] transition-colors">
                        {track!.name}
                      </p>
                      <p className="text-xs text-[var(--ivory-muted)] mt-1 line-clamp-2">
                        {track!.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-[var(--ivory-dim)]">
                          {t('academy.courseView.trackInfo', {
                            defaultValue: '{{count}} 节课 · {{duration}}',
                            count: track!.lessonIds.length,
                            duration: track!.estimatedDuration,
                          })}
                        </span>
                        <span className="text-[10px] text-[var(--ivory-dim)] bg-[var(--walnut-raised)] px-1.5 py-0.5 rounded">
                          {t('academy.courseView.trackProgress', {
                            defaultValue: '{{completed}}/{{total}} 课时',
                            completed: completedIn,
                            total: totalIn,
                          })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--ivory-muted)] group-hover:text-[var(--brass-bright)] transition-colors shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}