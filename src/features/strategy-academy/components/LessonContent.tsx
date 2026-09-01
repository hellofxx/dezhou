import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';
import type { Lesson, PracticeResult } from '../types';
import { ContentBlock } from './content';
import { HandExampleComponent } from './HandExample';
import { PracticeDrillComponent } from './PracticeDrill';
import { SectionNav } from './SectionNav';
import { LessonIntroCard } from './LessonIntroCard';
import { deriveLessonUnits } from '../utils/lessonUnits';
import { lessonContentKey, resolveUnitTitleKeyed } from '../utils/contentKeys';
import { pickReviewTargetUnit } from '../utils/adaptiveDifficulty';
import { useAcademyStore } from '../store';

// P4: 无完成记录时返回稳定空数组引用（zustand 默认 Object.is 比较，避免 `?? []` 每次新建引用导致重渲染）
const EMPTY_UNIT_IDS: string[] = [];

interface LessonContentProps {
  lesson: Lesson;
  onComplete: () => void;
  onPracticeComplete?: (result: PracticeResult) => void;
  // P3: 重挂载时初始视图（CourseView restart('practice') 直达实战；未传默认 units）
  initialView?: 'units' | 'practice';
}

type ViewMode = 'units' | 'practice';

export function LessonContent({ lesson, onComplete, onPracticeComplete, initialView }: LessonContentProps) {
  const { t } = useTranslation();

  const units = useMemo(() => deriveLessonUnits(lesson), [lesson]);
  const hasExamples = lesson.examples && lesson.examples.length > 0;
  const hasPractice = !!lesson.practice;
  const isTheoryOnly = !hasExamples && !hasPractice;

  // P4: 已完成小节从 store 持久化读取（订阅粒度：仅本课程 completedUnits 变化时重渲染）
  const completedUnitIds = useAcademyStore(
    (s) => s.progress.completedUnits[lesson.id] ?? EMPTY_UNIT_IDS,
  );
  const markUnitCompleted = useAcademyStore((s) => s.markUnitCompleted);

  // P4 回访恢复：进入已学课程时定位到最后完成小节（无记录或记录失效则第一个 unit）
  const [activeUnitId, setActiveUnitId] = useState(() => {
    const lastCompletedId = completedUnitIds[completedUnitIds.length - 1];
    return lastCompletedId && units.some((u) => u.id === lastCompletedId)
      ? lastCompletedId
      : (units[0]?.id ?? '');
  });
  const [view, setView] = useState<ViewMode>(initialView ?? 'units');
  // P2: checkpoint 已答状态（unitId → 已答；纯本地，不计分不接外部系统）
  const [checkpointAnswered, setCheckpointAnswered] = useState<Record<string, boolean>>({});

  // C1 fix: URL hash → activeUnitId sync（支持 #uX 直达且高亮对应胶囊）
  // 依赖 location.hash：SPA 内 hash 变更（React Router location 更新）同样触发同步，
  // 不依赖组件重挂载（CourseView 的 scrollToAnchor 负责滚动，此处负责高亮状态）
  const location = useLocation();
  useEffect(() => {
    const hash = location.hash.slice(1);
    if (hash && units.some((u) => u.id === hash)) {
      setActiveUnitId(hash);
    }
  }, [location.hash, units]);

  const currentUnitIndex = units.findIndex((u) => u.id === activeUnitId);
  const isLastUnit = currentUnitIndex === units.length - 1;

  // 导航到指定小节
  const handleNavigateUnit = useCallback((unitId: string) => {
    setActiveUnitId(unitId);
    const el = document.getElementById(unitId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // 进入下一节
  const handleNext = useCallback(() => {
    // P4: 标记完成写入 store（幂等），替代本地 useState
    markUnitCompleted(lesson.id, activeUnitId);

    if (!isLastUnit) {
      const nextUnit = units[currentUnitIndex + 1];
      if (nextUnit) {
        setActiveUnitId(nextUnit.id);
        const el = document.getElementById(nextUnit.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else if (hasPractice) {
      setView('practice');
    } else {
      onComplete();
    }
  }, [activeUnitId, currentUnitIndex, isLastUnit, hasPractice, onComplete, units, lesson.id, markUnitCompleted]);

  // 实战完成处理
  const handlePracticeComplete = useCallback(
    (result: PracticeResult) => {
      onPracticeComplete?.(result);
      onComplete();
    },
    [onPracticeComplete, onComplete],
  );

  // 返回小节视图
  const handleBackToSections = useCallback(() => {
    setView('units');
  }, []);

  // P3: 降级建议复习回跳（BUG-ACA-007 修复）— 建议主题为课程 id（稳定标识、语言无关），
  // 经 pickReviewTargetUnit 按 id 比对映射到小节锚点，zh/en 行为一致；
  // 旧实现用中文主题串与 unit 标题双向包含匹配，en locale 永远失配、回退 units[0]
  const handleReviewRequest = useCallback(
    (topicLessonIds: string[]) => {
      const target = pickReviewTargetUnit(lesson.id, units, topicLessonIds);
      if (!target) return;
      setView('units');
      // view 切换为异步渲染，延迟到 units DOM 挂载后再滚动到锚点
      window.setTimeout(() => handleNavigateUnit(target.id), 80);
    },
    [lesson.id, units, handleNavigateUnit],
  );

  // 确定 CTA 文案
  const nextCtaLabel = isLastUnit
    ? hasPractice
      ? t('academy.lessonUnit.startPractice')
      : t('academy.lessonUnit.completeLesson')
    : t('academy.lessonUnit.nextSection', { title: units[currentUnitIndex + 1]?.title ?? '' });

  // 实战视图
  if (view === 'practice' && hasPractice && lesson.practice) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleBackToSections}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('academy.lessonUnit.backToSections')}
        </button>
        <PracticeDrillComponent
          drill={lesson.practice}
          lessonId={lesson.id}
          onComplete={handlePracticeComplete}
          onReviewRequest={handleReviewRequest}
        />
      </div>
    );
  }

  // 纯理论课空态
  if (isTheoryOnly) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <SectionNav
          units={units}
          activeId={activeUnitId}
          completedIds={completedUnitIds}
          onNavigate={handleNavigateUnit}
          lessonId={lesson.id}
        />
        <div className="mt-4 space-y-4 max-w-4xl mx-auto">
          <LessonIntroCard units={units} duration={lesson.duration} />
          {units.map((unit, i) => (
            <section key={unit.id} id={unit.id} className="scroll-mt-24 space-y-4">
              <h2 className="font-display text-[20px] text-[var(--ivory)] tracking-wide">
                <span className="section-number">§{lesson.level}.{i + 1}</span>
                {resolveUnitTitleKeyed(t, lesson, unit)}
              </h2>
              {unit.sections.map((s, j) => {
                const idx = lesson.content.indexOf(s);
                return (
                  <ContentBlock
                    key={j}
                    section={s}
                    contentKey={idx >= 0 ? lessonContentKey(lesson.id, idx) : undefined}
                  />
                );
              })}
            </section>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--ivory-muted)]">
          <BookOpen className="w-3.5 h-3.5" />
          {t('academy.lessonUnit.theoryOnly')}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {t('academy.lessonUnit.completeLesson')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // 标准视图：小节导航 + 内容
  return (
    <div>
      <SectionNav
        units={units}
        activeId={activeUnitId}
        completedIds={completedUnitIds}
        onNavigate={handleNavigateUnit}
        lessonId={lesson.id}
      />
      <div className="mt-4 space-y-4 max-w-4xl mx-auto">
        {/* 先行组织者卡 */}
        <LessonIntroCard units={units} duration={lesson.duration} />

        {/* 小节序列 */}
        {units.map((unit, i) => {
          const example = unit.exampleId
            ? lesson.examples?.find((ex) => ex.id === unit.exampleId)
            : undefined;

          return (
            <section key={unit.id} id={unit.id} className="scroll-mt-24 space-y-4">
              <h2 className="font-display text-[20px] text-[var(--ivory)] tracking-wide">
                <span className="section-number">§{lesson.level}.{i + 1}</span>
                {resolveUnitTitleKeyed(t, lesson, unit)}
              </h2>
              {unit.sections.length === 0 && !example && (
                <p className="text-xs text-[var(--ivory-muted)]">
                  {t('academy.lessonUnit.noContent')}
                </p>
              )}
              {unit.sections.map((s, j) => {
                const idx = lesson.content.indexOf(s);
                return (
                  <ContentBlock
                    key={j}
                    section={s}
                    contentKey={idx >= 0 ? lessonContentKey(lesson.id, idx) : undefined}
                  />
                );
              })}
              {example &&
                (unit.checkpoint ? (
                  <HandExampleComponent
                    example={example}
                    index={i}
                    interactive
                    answered={!!checkpointAnswered[unit.id]}
                    onAnswered={(v) =>
                      setCheckpointAnswered((prev) => ({ ...prev, [unit.id]: v }))
                    }
                  />
                ) : (
                  <HandExampleComponent example={example} index={i} />
                ))}
            </section>
          );
        })}

        {/* 顺序推进 CTA */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {nextCtaLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
