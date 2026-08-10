import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useProgressStore } from '../../store';
import { getTodayString } from '../../utils/spacedRepetition';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { transitionStandard } from '@/shared/utils/motion';

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
 *
 * P1D-06/P1F-01（专批 B）：**开局判定口径** —— 挂载时一次性快照"是否已达上限"并冻结：
 * - 开局已达上限 → 拦在训练开始前（调用方渲染 <SessionLimitGuard />）
 * - 会话进行中达上限 → 不再中途翻转拦断（原响应式判定会整体卸载进行中会话，
 *   无结算、无 emit 直接丢弃），允许当前会话正常走完结算；下次进入训练页（新挂载）时再拦
 * - 调试解锁旁路保持响应式（激活即放行；激活期间不冻结快照）
 * 已知边界：同一挂载内的"再来一轮 / 重考"沿用挂载时快照，直到重新进入页面才重新判定。
 */
export function useSessionLimitReached(): boolean {
  const limit = useProgressStore((s) => s.emotion.dailyQuestionLimit);
  const answered = useProgressStore((s) => s.emotion.dailyQuestionsAnswered);
  const date = useProgressStore((s) => s.emotion.dailyQuestionsDate);
  const debugUnlock = useDebugModeStore((s) => s.unlockAll);
  const today = getTodayString();
  // 跨日重置：如果记录的日期不是今天，视为 0
  const effectiveAnswered = date === today ? answered : 0;
  const reachedNow = limit > 0 && effectiveAnswered >= limit;
  // 开局判定：首次（非调试态）渲染时冻结快照，此后不随答题计数响应式翻转
  const frozenRef = useRef<boolean | null>(null);
  if (frozenRef.current === null && !debugUnlock) {
    frozenRef.current = reachedNow;
  }
  // 调试解锁：解除每日题量上限（响应式旁路）
  if (debugUnlock) return false;
  return frozenRef.current ?? reachedNow;
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
        transition={transitionStandard}
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
