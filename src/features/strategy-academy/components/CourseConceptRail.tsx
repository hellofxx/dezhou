import { useTranslation } from 'react-i18next';
import { getLessonMeta } from '../data/lessonMeta';
import { TheoryBridgeCard } from './TheoryBridgeCard';

interface CourseConceptRailProps {
  lessonId: string;
  onNavigate: (route: string) => void;
}

/** 课程阅读页的「本课概念」桥接块（桌面导轨与移动正文共用）。 */
export default function CourseConceptRail({ lessonId, onNavigate }: CourseConceptRailProps) {
  const { t } = useTranslation();

  return (
    <TheoryBridgeCard
      anchors={getLessonMeta(lessonId).theoryAnchors}
      onNavigate={onNavigate}
      title={t('academy.courseHub.conceptRail.title')}
      subtitle={t('academy.courseHub.conceptRail.subtitle')}
    />
  );
}