/**
 * 结果页：显示分数、正确率、用时、Best Record、答错的题目列表与正确答案。
 *
 * - "再试一次"会重置引擎
 * - "返回首页"会跳转到 /puzzle
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Trophy, Clock, Target, RefreshCw, Home, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { StatCard, WrongAnswerList, type WrongAnswerEntry } from './PuzzleResultParts';
import type { PuzzleResult } from '../types';

interface PuzzleResultProps {
  result: PuzzleResult;
  /** 是否破纪录 */
  isNewRecord: boolean;
  /** "再试一次"回调 */
  onRetry: () => void;
  /** "返回首页"回调 */
  onBackHome: () => void;
}

export function PuzzleResult({ result, isNewRecord, onRetry, onBackHome }: PuzzleResultProps) {
  const { t } = useTranslation();

  const accuracyPercent = Math.round(result.accuracy * 100);
  const durationSec = Math.round(result.duration / 1000);
  const avgTimeSec = (result.averageTime / 1000).toFixed(1);

  // 答错的题目
  const wrongAnswers = useMemo(() => {
    return result.answers
      .map((a) => {
        const question = result.questions.find((q) => q.id === a.questionId);
        if (!question || a.isCorrect) return null;
        const correctOption = question.options.find((o) => o.isCorrect);
        const selectedOption = question.options.find((o) => o.id === a.selectedOptionId);
        return { question, correctOption, selectedOption };
      })
      .filter(Boolean) as WrongAnswerEntry[];
  }, [result.answers, result.questions]);

  const isRush = result.mode === 'rush';

  return (
    <div className="h-full overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto px-4 py-6 space-y-4"
      >
        {/* 标题 + 破纪录徽章 */}
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl md:text-3xl text-[var(--ivory)] tracking-wide">
            {isRush ? t('puzzle.result.rushTitle') : t('puzzle.result.title')}
          </h2>
          {isNewRecord && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[var(--brass-dark)] to-[var(--brass-bright)] text-[var(--felt-deep)] font-display text-sm shadow-[var(--shadow-brass)]"
            >
              <Trophy className="w-4 h-4" />
              {t('puzzle.result.newRecord')}
            </motion.div>
          )}
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isRush && (
            <StatCard
              icon={<Trophy className="w-4 h-4" />}
              label={t('puzzle.result.score')}
              value={`${result.score}`}
              accent="gold"
            />
          )}
          <StatCard
            icon={<Target className="w-4 h-4" />}
            label={t('puzzle.result.correctRate')}
            value={`${accuracyPercent}%`}
            accent={accuracyPercent >= 70 ? 'green' : 'default'}
          />
          <StatCard
            icon={<Target className="w-4 h-4" />}
            label={t('puzzle.result.correctCount')}
            value={`${result.correctCount}/${result.totalQuestions}`}
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label={t('puzzle.result.duration')}
            value={isRush ? t('puzzle.result.minutes', { min: Math.floor(durationSec / 60), sec: durationSec % 60 }) : `${durationSec}s`}
          />
          {!isRush && (
            <StatCard
              icon={<TrendingUp className="w-4 h-4" />}
              label={t('puzzle.result.avgTime')}
              value={`${avgTimeSec}s`}
            />
          )}
        </div>

        {/* 答错的题目列表（仅有错题时显示） */}
        {wrongAnswers.length > 0 && <WrongAnswerList entries={wrongAnswers} />}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            onClick={onRetry}
            className="flex-1 bg-[var(--brass)] text-[var(--primary-fg)] hover:bg-[var(--brass-bright)]"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            {t('puzzle.result.retry')}
          </Button>
          <Button
            onClick={onBackHome}
            variant="outline"
            className="flex-1 border-[var(--walnut-border)] text-[var(--ivory)] hover:bg-[var(--surface-raised)]"
          >
            <Home className="w-4 h-4 mr-1" />
            {t('puzzle.result.backHome')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
