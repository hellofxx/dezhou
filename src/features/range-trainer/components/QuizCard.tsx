/**
 * 范围训练答题卡——组件本体已下沉 shared/components/business/QuizCard.tsx
 * （onboarding 首训亦消费）。此处保留薄包装：从 progress store 注入 mentorStyle，
 * 使本模块消费方（TrainingSession 等）无需改动。
 */
import { useProgressStore } from '@/features/progress/store';
import { QuizCard as SharedQuizCard } from '@/shared/components/business/QuizCard';
import type { QuizCardProps } from '@/shared/components/business/QuizCard';

export type { QuizCardProps };

export function QuizCard(props: QuizCardProps) {
  const mentorStyle = useProgressStore((s) => s.mentorStyle);
  return <SharedQuizCard {...props} mentorStyle={mentorStyle} />;
}
