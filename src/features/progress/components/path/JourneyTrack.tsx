import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Route,
  Lock,
  Check,
  ChevronRight,
  PlayCircle,
  Sprout,
  TrendingUp,
  Target,
  Brain,
  Trophy,
  Medal,
  Coins,
  Crosshair,
  Flame,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ProgressRing } from '@/shared/components/data-display/ProgressRing';
import { getAcademyDataSource } from '@/shared/stores/academyDataSourceRegistry';
import { useAcademyLearningStages, useAcademyProgressSnapshot } from '../../hooks/useAcademyDataSource';
import { computeStageStates, findNextLesson, type JourneyStageState } from './journeyProgress';
import { groupLearningStages, journeyGroupIndex } from './journeyGroups';

/**
 * JourneyTrack — 学习旅程图（首页签名组件）。
 *
 * 结构：面板标题（学习旅程 + 脚手架路径 eyebrow）→ 阶段网格（环形进度 + 铭牌 + 课时 chip）
 * → 下一步条（含唯一主 CTA「继续学习」）。阶段数 > 4 时网格换行，连接线只在单行时绘制。
 *
 * 数据全部来自 academy 数据源注册表（progress 不得直接 import strategy-academy）：
 * 阶段快照经 hook 订阅，课时标题经 registry.getLessonMeta 读取（缺省回退 lessonId）。
 * 课时链接统一走 /lesson/{id}（批次 3 冻结路由）。
 */
const STAGE_GLYPHS = [Sprout, TrendingUp, Target, Brain, Trophy, Medal, Coins, Crosshair, Flame];

export default function JourneyTrack() {
  const { t } = useTranslation();
  const { stages } = useAcademyLearningStages();
  const { completedLessons } = useAcademyProgressSnapshot();

  const groupedStages = useMemo(() => groupLearningStages(stages), [stages]);
  const states = useMemo(
    () => computeStageStates(groupedStages, completedLessons),
    [groupedStages, completedLessons],
  );
  const next = useMemo(
    () => findNextLesson(groupedStages, completedLessons),
    [groupedStages, completedLessons],
  );
  const completedSet = useMemo(() => new Set(completedLessons), [completedLessons]);

  // 数据源尚未注册（late registration）时不占首屏空间，注册后由 hook 自愈重渲染
  if (states.length === 0) return null;

  const lessonLabel = (lessonId: string): string =>
    getAcademyDataSource()?.getLessonMeta(lessonId)?.title ?? lessonId;

  const groupTitle = (level: number): string =>
    t(`dashboard.path.stage${journeyGroupIndex(level) + 1}`);
  const groupSub = (level: number): string =>
    t(`dashboard.path.stage${journeyGroupIndex(level) + 1}Sub`);

  return (
    <section className="panel journey-panel mb-5" aria-labelledby="journey-track-title">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 id="journey-track-title" className="panel-title mb-0">
          <Route className="w-4 h-4" aria-hidden="true" />
          {t('dashboard.path.title')}
        </h2>
        <div className="flex items-center gap-3">
          <span className="journey-eyebrow">{t('dashboard.path.eyebrow')}</span>
          <Link
            to="/academy"
            className="text-[10px] uppercase tracking-[0.18em] text-[var(--brass-text)] hover:text-[var(--brass-bright)] transition-colors"
          >
            {t('dashboard.path.allCourses')}
          </Link>
        </div>
      </div>

      <div className={`journey-track ${states.length <= 4 ? 'is-single-row' : ''}`}>
        {states.map((state) => (
          <StageCard
            key={state.stage.id}
            state={state}
            title={groupTitle(state.stage.level)}
            subtitle={groupSub(state.stage.level)}
            glyphIndex={journeyGroupIndex(state.stage.level)}
            completed={completedSet}
            nextLessonId={next?.lessonId ?? null}
            lessonLabel={lessonLabel}
          />
        ))}
      </div>

      {next !== null && (
        <div className="next-lesson">
          <span className="nl-icon" aria-hidden="true">
            <PlayCircle className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="nl-title">
              {t('dashboard.path.nextTitle', { stage: groupTitle(next.stage.level) })}
            </div>
            <div className="nl-sub">{t('dashboard.path.nextSub')}</div>
          </div>
          <Button asChild size="sm" className="nl-continue">
            <Link to={`/lesson/${next.lessonId}`}>
              {t('dashboard.path.continue')}
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}

/** 阶段卡：环形进度 + 铭牌；最多 3 个课时 chip（优先未完成） */
function StageCard({
  state,
  title,
  subtitle,
  glyphIndex,
  completed,
  nextLessonId,
  lessonLabel,
}: {
  state: JourneyStageState;
  title: string;
  subtitle: string;
  glyphIndex: number;
  completed: ReadonlySet<string>;
  nextLessonId: string | null;
  lessonLabel: (lessonId: string) => string;
}) {
  const { t } = useTranslation();
  const { stage, done, total, ratio, unlocked, current } = state;
  const complete = unlocked && total > 0 && done === total;
  const Glyph = STAGE_GLYPHS[glyphIndex] ?? Sparkles;

  // 对照基准图：每段展示 2 个课时（优先未完成，保留阶段内顺序）
  const pending = stage.lessonIds.filter((id) => !completed.has(id));
  const finished = stage.lessonIds.filter((id) => completed.has(id));
  const chips = [...pending, ...finished].slice(0, 2);

  const nodeClass = [
    'stage-node',
    !unlocked ? 'locked' : complete ? 'done' : current ? 'current' : '',
  ]
    .filter((name) => name !== '')
    .join(' ');

  return (
    <div className={nodeClass}>
      <ProgressRing
        value={ratio}
        size={48}
        status={!unlocked ? 'idle' : complete ? 'complete' : 'in-progress'}
        ariaLabel={t('dashboard.path.ringAria', { done, total })}
        className="stage-ring"
        center={
          <span className="stage-glyph" aria-hidden="true">
            {unlocked ? <Glyph className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
          </span>
        }
      />

      <div className="stage-plaque">
        <div className="stage-name">{title}</div>
        <div className="stage-sub line-clamp-2">{subtitle}</div>
        <div className="stage-meta">
          {unlocked ? t('dashboard.path.lessons', { done, total }) : t('dashboard.path.locked')}
        </div>

        <div className="stage-lessons">
          {chips.map((lessonId) => {
            const isDone = completed.has(lessonId);
            const chipClass = [
              'lesson-chip',
              !unlocked ? 'locked' : isDone ? 'done' : lessonId === nextLessonId ? 'current' : '',
            ]
              .filter((name) => name !== '')
              .join(' ');
            const label = lessonLabel(lessonId);
            const stateIcon = !unlocked ? (
              <Lock className="w-3 h-3" aria-hidden="true" />
            ) : isDone ? (
              <Check className="w-3 h-3" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
            );
            const content = (
              <>
                <span className="truncate">{label}</span>
                <span className="chip-state">{stateIcon}</span>
              </>
            );

            return unlocked ? (
              <Link key={lessonId} to={`/lesson/${lessonId}`} className={chipClass} title={label}>
                {content}
              </Link>
            ) : (
              <span key={lessonId} className={chipClass} aria-disabled="true" title={label}>
                {content}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
