import { useTranslation } from 'react-i18next';
import { AcademyPeek } from '@/shared/components/academy';
import type { Lesson } from '../types';
import { LessonQuiz, type LessonQuizResult } from './LessonQuiz';
import { LessonQuizPeek } from './LessonQuizPeek';

interface CourseQuizSectionProps {
  lesson: Lesson;
  attemptNumber: number;
  isPractice: boolean;
  onComplete: (result: LessonQuizResult) => void;
  onReview: () => void;
}

/** 课后测验装配体：标题 + 原文 peek 折叠壳 + LessonQuiz。 */
export function CourseQuizSection({
  lesson,
  attemptNumber,
  isPractice,
  onComplete,
  onReview,
}: CourseQuizSectionProps) {
  const { t } = useTranslation();
  return (
    <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6">
      <h2 className="font-display text-[17px] text-[var(--ivory)] mb-5">
        {t('academy.courseView.quizTitle', { defaultValue: '课后测验' })}
      </h2>
      {/* quiz 原文 peek：作答时可对照本课正文（折叠壳在 LessonQuiz 之上，不侵入选项区） */}
      <div className="mb-5">
        <AcademyPeek label={t('academy.quiz.peek')}>
          <LessonQuizPeek lesson={lesson} />
        </AcademyPeek>
      </div>
      <LessonQuiz
        lessonId={lesson.id}
        questions={lesson.quiz}
        level={lesson.level}
        attemptNumber={attemptNumber}
        isPractice={isPractice}
        onComplete={onComplete}
        onReview={onReview}
      />
    </div>
  );
}