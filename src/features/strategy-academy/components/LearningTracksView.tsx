import { useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { transitionSlow, transitionStandard } from '@/shared/utils/motion';
import { ArrowLeft, ArrowRight, Users, Clock, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { LEARNING_TRACKS, isTrackPrerequisiteMet } from '../data/learningTracks';
import {
  resolveTrackName,
  resolveTrackDescription,
  resolveTrackAudience,
  resolveTrackDuration,
} from '../utils/titleKeys';
import { LEVELS } from '../data/courses';
import { useAcademyStore } from '../store';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { ProgressBar } from './ProgressBar';
export default function LearningTracksView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // P1E-01: 消费 ?track= 参数（滚动/高亮）
  const [searchParams] = useSearchParams();
  const highlightTrackId = searchParams.get('track');
  const trackRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { progress, activeTrackId, setActiveTrack } = useAcademyStore();
  // 调试解锁：解除全部轨道前置
  const debugUnlock = useDebugModeStore((s) => s.unlockAll);

  // P1E-01: ?track= 存在时滚动到目标轨道
  useEffect(() => {
    if (!highlightTrackId) return;
    const el = trackRefs.current[highlightTrackId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightTrackId]);

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-6">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitionSlow}
          className="walnut-panel rounded-lg border border-[var(--walnut-border)] relative brass-rail overflow-hidden"
        >
          <div className="p-5 md:p-6">
            <button
              onClick={() => navigate('/academy')}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('academy.tracks.backToAcademy')}
            </button>
            <h1 className="font-display text-2xl text-[var(--ivory)]">{t('academy.tracks.title')}</h1>
            <p className="text-sm text-[var(--ivory-dim)] mt-1">
              {t('academy.tracks.subtitle')}
            </p>
          </div>
        </motion.section>

        {/* Track cards */}
        <div className="space-y-4">
          {LEARNING_TRACKS.map((track, index) => {
            const isActive = activeTrackId === track.id;
            const completedInTrack = track.lessonIds.filter((id) =>
              progress.completedLessons.includes(id)
            ).length;
            const totalInTrack = track.lessonIds.length;
            const progressPercent = totalInTrack > 0 ? Math.round((completedInTrack / totalInTrack) * 100) : 0;
            const isLeakFix = track.id === 'track-leak-fix';

            // P1E-02: 前置条件检查改用课程完成口径（调试解锁时直接放行）
            const prereqMet = debugUnlock || isTrackPrerequisiteMet(track, progress.completedLessons);
            // ACAD-09：定位第一个未满足的前置 Level 的第一课，供"去学习"动态跳转
            // （旧实现固定跳 /academy/basics，与 prerequisiteLevelIds 不对应）
            const firstMissingLessonId = (() => {
              if (prereqMet || !track.prerequisiteLevelIds) return null;
              for (const prereqId of track.prerequisiteLevelIds) {
                const entry = LEVELS.find((l) => l.id === prereqId);
                if (!entry) continue;
                const missing = entry.lessons.find((l) => !progress.completedLessons.includes(l.id));
                if (missing) return missing.id;
              }
              return null;
            })();
            const prereqHint =
              !prereqMet && track.prerequisiteLevelIds
                ? t('academy.tracks.prereqHint', {
                    levels: track.prerequisiteLevelIds
                      .map((id) => id.replace(/^l/i, 'Level '))
                      .join('、'),
                  })
                : null;

            // 找到轨道中下一个未完成的课程
            const nextLesson = track.lessonIds.find(
              (id) => !progress.completedLessons.includes(id)
            );

            // P1E-01: 高亮被 ?track= 参数引用的轨道
            const isHighlighted = highlightTrackId === track.id;

            return (
              <motion.div
                key={track.id}
                ref={(el) => { trackRefs.current[track.id] = el; }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transitionStandard, delay: index * 0.08 }}
                className={`rounded-lg border p-5 transition-all ${
                  isHighlighted
                    ? 'border-[var(--brass-bright)] bg-[var(--brass-bright)]/8 ring-1 ring-[var(--brass-bright)]/40'
                    : isActive
                      ? 'border-[var(--brass-bright)]/60 bg-[var(--brass-bright)]/5'
                      : 'border-[var(--walnut-border)] bg-[var(--felt)] hover:border-[var(--brass)]/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: track.color + '15' }}
                  >
                    {track.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-[16px] text-[var(--ivory)]">{resolveTrackName(t, track)}</h3>
                      {track.id === 'track-local-cn' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--poker-indigo)]/25 text-[var(--poker-indigo-bright)]">
                          {t('academy.tracks.mergedIntoLevel7')}
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--brass-bright)]/20 text-[var(--brass-bright)]">
                          {t('academy.tracks.currentTrack')}
                        </span>
                      )}
                      {progressPercent === 100 && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--poker-success)]" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--ivory-muted)] mb-3">{resolveTrackDescription(t, track)}</p>

                    {/* P1E-03: 前置条件提示（附跳转链接） */}
                    {prereqHint && (
                      <div className="flex items-center gap-1.5 mb-3 text-xs text-[var(--brass-bright)]/90 bg-[var(--poker-warning-bg)] rounded px-2.5 py-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{prereqHint}</span>
                        <button
                          onClick={() =>
                            firstMissingLessonId
                              ? navigate(`/academy/lesson/${firstMissingLessonId}`)
                              : navigate('/academy/basics')
                          }
                          className="ml-auto text-[var(--brass-bright)] underline underline-offset-2 whitespace-nowrap"
                        >
                          {t('academy.tracks.goLearn')}
                        </button>
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-[11px] text-[var(--ivory-dim)] mb-3">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {resolveTrackAudience(t, track)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {resolveTrackDuration(t, track)}
                      </span>
                    </div>

                    {/* Progress */}
                    {!isLeakFix && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--ivory-dim)]">
                            {t('academy.tracks.lessonsCount', { completed: completedInTrack, total: totalInTrack })}
                          </span>
                          <span className="font-numeric text-[var(--brass-bright)]">{progressPercent}%</span>
                        </div>
                        <ProgressBar value={progressPercent} size="sm" />
                      </div>
                    )}

                    {isLeakFix && (
                      <p className="text-xs text-[var(--ivory-muted)]">
                        {t('academy.tracks.recommendedByAbility')}
                      </p>
                    )}

                    {/* Actions — P1E-03: prereqMet=false 时禁用按钮 */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => setActiveTrack(isActive ? null : track.id)}
                        disabled={!prereqMet}
                        className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                          !prereqMet
                            ? 'bg-[var(--walnut-raised)] text-[var(--ivory-muted)] opacity-50 cursor-not-allowed'
                            : isActive
                              ? 'bg-[var(--walnut-raised)] text-[var(--ivory-muted)] hover:text-[var(--ivory)]'
                              : 'bg-[var(--brass-bright)] text-[var(--felt-deep)] font-medium hover:opacity-90'
                        }`}
                      >
                        {!prereqMet && <Lock className="inline w-3 h-3 mr-1" />}
                        {isActive ? t('academy.tracks.deselectTrack') : t('academy.tracks.selectTrack')}
                      </button>
                      {nextLesson && !isLeakFix && (
                        <button
                          onClick={() => navigate(`/academy/lesson/${nextLesson}`)}
                          disabled={!prereqMet}
                          className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-colors ${
                            !prereqMet
                              ? 'bg-[var(--walnut-raised)] text-[var(--ivory-muted)] opacity-50 cursor-not-allowed'
                              : 'bg-[var(--walnut-raised)] text-[var(--ivory)] hover:text-[var(--brass-bright)]'
                          }`}
                        >
                          {t('academy.tracks.continueLearning')}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
