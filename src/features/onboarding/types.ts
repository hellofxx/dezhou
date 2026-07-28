// 定位测试维度
export type PlacementDimension = 'handRanking' | 'position' | 'odds' | 'range';

// 定位测试题目
export interface PlacementQuestion {
  id: string;
  dimension: PlacementDimension;
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  difficulty: number;       // 1=最简单，5=最难
  explanation: string;
}

// 首次微训练题目（复用 range-trainer 的 QuizQuestion）
export type { QuizQuestion } from '@/features/range-trainer/types';
