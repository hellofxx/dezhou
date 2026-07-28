import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { LEARNING_TRACKS, isTrackPrerequisiteMet, getPrerequisiteHint } from '../data/learningTracks';
import { useAcademyStore } from '../store';
import { ProgressBar } from './ProgressBar';

export default function LearningTracksView() {
  const navigate = useNavigate();
  const { progress, activeTrackId, setActiveTrack, certifications } = useAcademyStore();

  // 构建已认证 Level 集合，用于前置条件检查
  const certifiedLevels = new Set<number>(
    Object.entries(certifications)
      .filter(([, cert]) => !!cert?.certifiedAt)
      .map(([level]) => Number(level))
  );

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="walnut-panel rounded-lg border border-[var(--walnut-border)] relative brass-rail overflow-hidden"
        >
          <div className="p-5 md:p-6">
            <button
              onClick={() => navigate('/academy')}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              返回策略学院
            </button>
            <h1 className="font-display text-2xl text-[var(--ivory)]">学习轨道</h1>
            <p className="text-sm text-[var(--ivory-dim)] mt-1">
              根据你的目标选择合适的学习路径，系统化提升特定方向的技能
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

            // 前置条件检查
            const prereqMet = isTrackPrerequisiteMet(track, certifiedLevels);
            const prereqHint = !prereqMet && track.prerequisiteLevelIds
              ? getPrerequisiteHint(track.prerequisiteLevelIds)
              : null;

            // 找到轨道中下一个未完成的课程
            const nextLesson = track.lessonIds.find(
              (id) => !progress.completedLessons.includes(id)
            );

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className={`rounded-lg border p-5 transition-all ${
                  isActive
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
                      <h3 className="font-display text-[16px] text-[var(--ivory)]">{track.name}</h3>
                      {isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--brass-bright)]/20 text-[var(--brass-bright)]">
                          当前轨道
                        </span>
                      )}
                      {progressPercent === 100 && (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--ivory-muted)] mb-3">{track.description}</p>

                    {/* 前置条件提示 */}
                    {prereqHint && (
                      <div className="flex items-center gap-1.5 mb-3 text-xs text-amber-400/90 bg-amber-400/10 rounded px-2.5 py-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{prereqHint}</span>
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-[11px] text-[var(--ivory-dim)] mb-3">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {track.targetAudience}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {track.estimatedDuration}
                      </span>
                    </div>

                    {/* Progress */}
                    {!isLeakFix && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--ivory-dim)]">
                            {completedInTrack}/{totalInTrack} 课时
                          </span>
                          <span className="font-numeric text-[var(--brass-bright)]">{progressPercent}%</span>
                        </div>
                        <ProgressBar value={progressPercent} size="sm" />
                      </div>
                    )}

                    {isLeakFix && (
                      <p className="text-xs text-[var(--ivory-muted)]">
                        根据你的五维能力评分动态推荐
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => setActiveTrack(isActive ? null : track.id)}
                        className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                          isActive
                            ? 'bg-[var(--walnut-raised)] text-[var(--ivory-muted)] hover:text-[var(--ivory)]'
                            : 'bg-[var(--brass-bright)] text-[var(--felt-deep)] font-medium hover:opacity-90'
                        }`}
                      >
                        {isActive ? '取消选择' : '选择此轨道'}
                      </button>
                      {nextLesson && !isLeakFix && (
                        <button
                          onClick={() => navigate(`/academy/lesson/${nextLesson}`)}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-[var(--walnut-raised)] text-[var(--ivory)] hover:text-[var(--brass-bright)] transition-colors"
                        >
                          继续学习
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
