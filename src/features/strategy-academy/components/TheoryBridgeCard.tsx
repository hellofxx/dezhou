import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import { AcademyBridgeCard } from '@/shared/components/academy';
import type { AcademyBridgeItem } from '@/shared/types/academy';

/** 理论章节路由的唯一拼接口径（策略侧只产出路由字符串，不 import 理论模块）。 */
export function theoryChapterRoute(chapterId: string): string {
  return `/theory/chapter/${chapterId}`;
}

export interface TheoryBridgeCardProps {
  /** 理论锚点：理论学院章节 id（事实源 `data/lessonMeta/*`） */
  anchors: string[];
  /** 跳转回调：由调用方注入路由能力（共享层与薄包装都不持有 router） */
  onNavigate: (route: string) => void;
  /** 卡片标题（缺省 `academy.theoryBridge.title`） */
  title?: string;
  /** 卡片副标题（缺省 `academy.theoryBridge.subtitle`） */
  subtitle?: string;
}

/**
 * 策略 → 理论 桥接卡（对外薄包装，展示层复用两院共享 `AcademyBridgeCard`）。
 *
 * 只负责三件事：章节 id → 路由、章节 id → 文案、空锚点不渲染；
 * 不读 store、不 import 理论模块（跨模块只允许 id 字符串）。
 * 章节标题取 `theory.chapterTitle.<id>`；该命名空间未随 `/academy` 路由加载时
 * i18next 会回落成裸 key，此处降级为章节 id，任何情况下都不把裸 key 渲染给用户。
 */
export function TheoryBridgeCard({
  anchors,
  onNavigate,
  title,
  subtitle,
}: TheoryBridgeCardProps) {
  const { t } = useTranslation();

  if (anchors.length === 0) return null;

  const items: AcademyBridgeItem[] = anchors.map((chapterId) => {
    const key = `theory.chapterTitle.${chapterId}`;
    const resolved = t(key);
    return {
      id: chapterId,
      label: resolved === key ? chapterId : resolved,
      route: theoryChapterRoute(chapterId),
    };
  });

  return (
    <AcademyBridgeCard
      title={title ?? t('academy.theoryBridge.title')}
      subtitle={subtitle ?? t('academy.theoryBridge.subtitle')}
      icon={<BookOpen className="w-4 h-4" />}
      items={items}
      onNavigate={onNavigate}
    />
  );
}

export default TheoryBridgeCard;
