import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Route } from 'lucide-react';
import { AcademyBridgeCard } from '@/shared/components/academy';
import type { AcademyBridgeCta, AcademyBridgeItem } from '@/shared/types/academy';
import type { PracticeRecommendation } from '../types';

interface PracticeBridgeCardProps {
  recommendations: PracticeRecommendation;
  /** 副标题 key：章节粒度传 theory.bridge.chapterSubtitle，缺省沿用 Level 粒度文案 */
  subtitleKey?: string;
}

/**
 * "去实践"推荐卡：理论→实践闭环出口，Level 粒度与章节粒度共用。
 *
 * 展示层改用两院共享 `AcademyBridgeCard`（行为/文案/ARIA 不变），本组件只做理论侧适配：
 * 文案取 `theory.bridge.*` 与 `academy.lessonTitle.*`，路由拼 `/academy/lesson/:id` 与
 * `/academy/tracks?track=`（仅路由字符串，不产生跨模块 import）。
 * Level 粒度引用完整性由 strategy-academy curriculumIntegrity 测试守卫，
 * 标准章节粒度由 theory-academy data/theoryIntegrity 的子集断言守卫，
 * 变体章节粒度（l&lt;n&gt;hu|sd-* 与共享地基课）由 strategy-academy
 * theoryVariantBridgeIntegrity 测试守卫。
 */
export function PracticeBridgeCard({ recommendations, subtitleKey = 'theory.bridge.subtitle' }: PracticeBridgeCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const items: AcademyBridgeItem[] = recommendations.lessons.map((lesson) => ({
    id: lesson.id,
    label: t(`academy.lessonTitle.${lesson.id}`, { defaultValue: lesson.title }),
    route: `/academy/lesson/${lesson.id}`,
  }));

  // P1F-04：携带 ?track= 参数，LearningTracksView（P1E-01）消费后滚动高亮目标轨道
  const cta: AcademyBridgeCta | undefined = recommendations.trackId
    ? {
        label: t('theory.bridge.enterTrack'),
        route: `/academy/tracks?track=${recommendations.trackId}`,
      }
    : undefined;

  return (
    <AcademyBridgeCard
      title={t('theory.bridge.applyPractice')}
      subtitle={t(subtitleKey)}
      items={items}
      cta={cta}
      ctaIcon={<Route className="w-4 h-4" />}
      itemAriaLabel={(item) => t('theory.bridge.gotoLesson', { title: item.label })}
      onNavigate={navigate}
    />
  );
}
