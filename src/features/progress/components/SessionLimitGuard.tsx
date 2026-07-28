import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useProgressStore } from '../store';
import { getTodayString } from '../utils/spacedRepetition';

/**
 * P2-5.4: Session 止损守卫组件。
 *
 * 检查 `progressStore.emotion.dailyQuestionsAnswered >= dailyQuestionLimit`（仅当 limit > 0）。
 * 达到上限时渲染提示卡片，禁止继续训练；并提供"返回 Dashboard"按钮。
 *
 * 用法：
 * ```tsx
 * if (SessionLimitGuard.reached()) return <SessionLimitGuard />;
 * ```
 *
 * 由于 React 组件无法静态暴露 reached()，调用方应使用 `useSessionLimitReached()` hook。
 */
export function useSessionLimitReached(): boolean {
  const limit = useProgressStore((s) => s.emotion.dailyQuestionLimit);
  const answered = useProgressStore((s) => s.emotion.dailyQuestionsAnswered);
  const date = useProgressStore((s) => s.emotion.dailyQuestionsDate);
  const today = getTodayString();
  // 跨日重置：如果记录的日期不是今天，视为 0
  const effectiveAnswered = date === today ? answered : 0;
  return limit > 0 && effectiveAnswered >= limit;
}

export function useSessionLimitStatus(): {
  reached: boolean;
  limit: number;
  answered: number;
} {
  const limit = useProgressStore((s) => s.emotion.dailyQuestionLimit);
  const answered = useProgressStore((s) => s.emotion.dailyQuestionsAnswered);
  const date = useProgressStore((s) => s.emotion.dailyQuestionsDate);
  const today = getTodayString();
  const effectiveAnswered = date === today ? answered : 0;
  return {
    reached: limit > 0 && effectiveAnswered >= limit,
    limit,
    answered: effectiveAnswered,
  };
}

export default function SessionLimitGuard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { limit, answered } = useSessionLimitStatus();

  return (
    <div className="h-full overflow-auto flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <Card className="bg-[var(--surface)] border-[var(--walnut-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-[var(--danger)]/15 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-[var(--danger)]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-xl text-[var(--ivory)]">
                {t('sessionLimit.title', { defaultValue: '今日已达题量上限' })}
              </h2>
              <p className="text-sm text-[var(--ivory-muted)]">
                {t('sessionLimit.message', {
                  defaultValue:
                    '你今天已经答了 {{answered}} / {{limit}} 题。建议休息一下，明天再继续 — 长期进步比短期冲刺更重要。',
                  answered,
                  limit,
                })}
              </p>
            </div>
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => navigate('/')}
                className="bg-[var(--brass-bright)] text-[var(--felt-deep)] hover:opacity-90 gap-1.5"
              >
                <Home className="w-4 h-4" />
                {t('sessionLimit.backHome', { defaultValue: '返回 Dashboard' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
