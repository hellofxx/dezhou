import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/shared/components/layout/BackLink';
import { Button } from '@/shared/components/ui/button';
import { AcademyStickyCta, AcademyTakeawayCard } from '@/shared/components/academy';
import { assembleTakeawayItems } from '@/shared/utils/academyTakeaway';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { Lesson, PracticeResult } from '../types';
import { PracticeDrillComponent } from './PracticeDrill';
import { SectionNav } from './SectionNav';
import { LessonIntroCard } from './LessonIntroCard';
import { LessonUnitSection } from './LessonUnitSection';
import { StrategyVariantRuleCard } from './StrategyVariantRuleCard';
import { deriveLessonUnits } from '../utils/lessonUnits';
import { lessonContentKey, resolveLessonObjectives } from '../utils/contentKeys';
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
  // 渐进披露：手动展开的小节集合（纯本地 state，零 persist；仅标准分支消费）
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set());

  const revealUnit = useCallback((unitId: string) => {
    setExpandedIds((prev) => (prev.has(unitId) ? prev : new Set(prev).add(unitId)));
  }, []);

  // C1 fix: URL hash → activeUnitId sync（支持 #uX 直达且高亮对应胶囊）
  // 依赖 location.hash：SPA 内 hash 变更（React Router location 更新）同样触发同步，
  // 不依赖组件重挂载（CourseView 的 scrollToAnchor 负责滚动，此处负责高亮状态）
  const location = useLocation();
  useEffect(() => {
    const hash = location.hash.slice(1);
    if (hash && units.some((u) => u.id === hash)) {
      setActiveUnitId(hash);
      // hash 直达目标小节须同时释放披露（折叠头虽恒在，正文需可见）
      revealUnit(hash);
    }
  }, [location.hash, units, revealUnit]);

  const currentUnitIndex = units.findIndex((u) => u.id === activeUnitId);
  const isLastUnit = currentUnitIndex === units.length - 1;
  // 披露水位：当前小节与最后完成小节取大者；unit i 可见当 i ≤ revealedUpTo 或已手动展开
  const lastCompletedIndex = completedUnitIds.reduce(
    (max, id) => Math.max(max, units.findIndex((u) => u.id === id)),
    -1,
  );
  const revealedUpTo = Math.max(currentUnitIndex, lastCompletedIndex);

  // 导航到指定小节
  const handleNavigateUnit = useCallback((unitId: string) => {
    setActiveUnitId(unitId);
    revealUnit(unitId);
    const el = document.getElementById(unitId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [revealUnit]);

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

  const handleCheckpointAnswered = useCallback((unitId: string, answered: boolean) => {
    setCheckpointAnswered((prev) => ({ ...prev, [unitId]: answered }));
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

  // 章末要点卡自动装配：有显式 takeaway 块时短路不双卡；
  // objectives / key-point 均经 i18n 解析单源（en 不泄漏数据层中文）
  const hasExplicitTakeaway = lesson.content.some((s) => s.type === 'takeaway');
  const autoTakeawayItems = useMemo(() => {
    if (hasExplicitTakeaway) return [];
    const keyPointTexts = lesson.content.flatMap((s, idx) =>
      s.type === 'key-point'
        ? [t(lessonContentKey(lesson.id, idx), { defaultValue: s.content })]
        : [],
    );
    return assembleTakeawayItems(
      resolveLessonObjectives(t, lesson.id, lesson.objectives ?? []),
      keyPointTexts,
    );
  }, [t, lesson, hasExplicitTakeaway]);
  const takeawayCard = autoTakeawayItems.length > 0
    ? <AcademyTakeawayCard items={autoTakeawayItems} />
    : null;

  // 单挑规则卡：变体判定在包装层（标准/短牌返回 null），仅在阅读态两条渲染路径插入
  const variantRuleCard = <StrategyVariantRuleCard lesson={lesson} />;

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
        <BackLink
          onClick={handleBackToSections}
          label={t('academy.lessonUnit.backToSections')}
          size="md"
        />
        <PracticeDrillComponent
          drill={lesson.practice}
          lessonId={lesson.id}
          onComplete={handlePracticeComplete}
          onReviewRequest={handleReviewRequest}
        />
      </div>
    );
  }

  // 纯理论课空态（披露不覆盖：全量渲染，保「两节同可见」契约）
  if (isTheoryOnly) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 pb-24 md:pb-0"
      >
        <SectionNav
          units={units}
          activeId={activeUnitId}
          completedIds={completedUnitIds}
          onNavigate={handleNavigateUnit}
          lessonId={lesson.id}
        />
        <div className="mt-4 space-y-4 max-w-4xl mx-auto">
          {/* 变体规则卡（单挑课时）：正文之前、课程路线图之前 */}
          {variantRuleCard}
          <LessonIntroCard
            lessonId={lesson.id}
            units={units}
            duration={lesson.duration}
            objectives={lesson.objectives}
          />
          {units.map((unit, i) => (
            <LessonUnitSection
              key={unit.id}
              unit={unit}
              lesson={lesson}
              index={i}
              collapsible={false}
              revealed
              onExpand={revealUnit}
              checkpointAnswered={!!checkpointAnswered[unit.id]}
              onCheckpointAnswered={handleCheckpointAnswered}
            />
          ))}
          {takeawayCard}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--ivory-muted)]">
          <BookOpen className="w-3.5 h-3.5" />
          {t('academy.lessonUnit.theoryOnly')}
        </div>
        <AcademyStickyCta>
          <Button variant="default" onClick={onComplete}>
            {t('academy.lessonUnit.completeLesson')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </AcademyStickyCta>
      </motion.div>
    );
  }

  // 标准视图：小节导航 + 内容（渐进披露：未来小节折叠，CTA 推进 / 导航 / hash 释放）
  return (
    <div className="pb-24 md:pb-0">
      <SectionNav
        units={units}
        activeId={activeUnitId}
        completedIds={completedUnitIds}
        onNavigate={handleNavigateUnit}
        lessonId={lesson.id}
      />
      <div className="mt-4 space-y-4 max-w-4xl mx-auto">
        {/* 变体规则卡（单挑课时）：正文之前、先行组织者卡之前 */}
        {variantRuleCard}
        {/* 先行组织者卡 */}
        <LessonIntroCard
          lessonId={lesson.id}
          units={units}
          duration={lesson.duration}
          objectives={lesson.objectives}
        />

        {/* 小节序列 */}
        {units.map((unit, i) => (
          <LessonUnitSection
            key={unit.id}
            unit={unit}
            lesson={lesson}
            index={i}
            collapsible
            revealed={i <= revealedUpTo || expandedIds.has(unit.id)}
            onExpand={revealUnit}
            checkpointAnswered={!!checkpointAnswered[unit.id]}
            onCheckpointAnswered={handleCheckpointAnswered}
          />
        ))}

        {takeawayCard}

        {/* 顺序推进 CTA（移动端 sticky 底部，桌面内联右对齐） */}
        <AcademyStickyCta>
          <Button variant="default" onClick={handleNext}>
            {nextCtaLabel}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </AcademyStickyCta>
      </div>
    </div>
  );
}