// P0-3.9: DrillLessonRouter
// 根据 lesson.drillComponent 字段分发到具体的 Drill 组件
// 由 CourseView 在 lesson.type === 'drill' 时调用

import { lazy, Suspense } from 'react';
import type { Lesson } from '../../types';
import type { DrillProps } from './types';

// 懒加载各 Drill 组件，避免主 bundle 过大
const HandRankingDrill = lazy(() => import('./HandRankingDrill'));
const PositionDrill = lazy(() => import('./PositionDrill'));
const OutsDrill = lazy(() => import('./OutsDrill'));
const PotOddsDrill = lazy(() => import('./PotOddsDrill'));
const ChoiceDrillRenderer = lazy(() => import('./ChoiceDrillRenderer'));

interface DrillLessonRouterProps extends DrillProps {
  lesson: Lesson;
}

export function DrillLessonRouter({ lesson, onComplete, onExit }: DrillLessonRouterProps) {
  const props: DrillProps = { onComplete, onExit };

  const renderDrill = () => {
    switch (lesson.drillComponent) {
      case 'HandRankingDrill':
        return <HandRankingDrill {...props} />;
      case 'PositionDrill':
        return <PositionDrill {...props} />;
      case 'OutsDrill':
        return <OutsDrill {...props} />;
      case 'PotOddsDrill':
        return <PotOddsDrill {...props} />;
      case 'ChoiceDrill':
        return <ChoiceDrillRenderer {...props} lesson={lesson} />;
      default:
        return (
          <div className="text-center py-8 text-[var(--ivory-muted)]">
            未知 Drill 组件：{lesson.drillComponent ?? '(undefined)'}
          </div>
        );
    }
  };

  return (
    <Suspense
      fallback={
        <div className="text-center py-8 text-[var(--ivory-muted)] text-sm">
          加载训练内容...
        </div>
      }
    >
      {renderDrill()}
    </Suspense>
  );
}
