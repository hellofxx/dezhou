import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';
import type { Lesson, PracticeResult } from '../types';
import { ContentBlock } from './content';
import { HandExampleComponent } from './HandExample';
import { PracticeDrillComponent } from './PracticeDrill';
import { SectionNav } from './SectionNav';
import { LessonIntroCard } from './LessonIntroCard';
import { deriveLessonUnits, resolveUnitTitle } from '../utils/lessonUnits';

interface LessonContentProps {
  lesson: Lesson;
  onComplete: () => void;
  onPracticeComplete?: (result: PracticeResult) => void;
}

type ViewMode = 'units' | 'practice';

export function LessonContent({ lesson, onComplete, onPracticeComplete }: LessonContentProps) {
  const { t } = useTranslation();

  const units = useMemo(() => deriveLessonUnits(lesson), [lesson]);
  const hasExamples = lesson.examples && lesson.examples.length > 0;
  const hasPractice = !!lesson.practice;
  const isTheoryOnly = !hasExamples && !hasPractice;

  const [activeUnitId, setActiveUnitId] = useState(units[0]?.id ?? '');
  const [completedUnitIds, setCompletedUnitIds] = useState<string[]>([]);
  const [view, setView] = useState<ViewMode>('units');

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
    setCompletedUnitIds((prev) =>
      prev.includes(activeUnitId) ? prev : [...prev, activeUnitId],
    );

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
  }, [activeUnitId, currentUnitIndex, isLastUnit, hasPractice, onComplete, units]);

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
        />
        <div className="mt-4 space-y-4 max-w-4xl mx-auto">
          <LessonIntroCard units={units} duration={lesson.duration} />
          {units.map((unit) => (
            <section key={unit.id} id={unit.id} className="scroll-mt-24 space-y-4">
              <h2 className="font-display text-[20px] text-[var(--ivory)] tracking-wide">
                {units.indexOf(unit) + 1}. {resolveUnitTitle(unit, (key) => t(key))}
              </h2>
              {unit.sections.map((s, j) => (
                <ContentBlock key={j} section={s} />
              ))}
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
                {i + 1}. {resolveUnitTitle(unit, (key) => t(key))}
              </h2>
              {unit.sections.length === 0 && !example && (
                <p className="text-xs text-[var(--ivory-muted)]">
                  {t('academy.lessonUnit.noContent')}
                </p>
              )}
              {unit.sections.map((s, j) => (
                <ContentBlock key={j} section={s} />
              ))}
              {example && (
                <HandExampleComponent example={example} index={i} />
              )}
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