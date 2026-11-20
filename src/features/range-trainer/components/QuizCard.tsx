/**
 * 范围训练答题卡——组件本体已下沉 shared/components/quiz/QuizCard.tsx
 * （onboarding 首训亦消费）。此处保留薄包装：从 progress 读模型注入 mentorStyle，
 * 使本模块消费方（TrainingSession 等）无需改动。
 */
import { useProgressState } from '@/features/progress/api';
import { QuizCard as SharedQuizCard } from '@/shared/components/quiz/QuizCard';
import type { QuizCardProps } from '@/shared/components/quiz/QuizCard';

export type { QuizCardProps };

export function QuizCard(props: QuizCardProps) {
  const mentorStyle = useProgressState((s) => s.mentorStyle);
  return <SharedQuizCard {...props} mentorStyle={mentorStyle} />;
}
