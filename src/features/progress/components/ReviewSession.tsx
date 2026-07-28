/**
 * P1-3.5: 复习模式会话组件（Dialog-based）
 *
 * 从 SpacedRepetitionPanel 的"开始复习"按钮触发，按类别混合（range / odds / gto）
 * 渲染今日待复习项。每答完一题调用 processReview 更新 SRS 状态。
 *
 * 渲染策略（根据 ReviewItem.metadata 决定）：
 *   1. metadata.options 存在 → 多选题模式（点击选项 → 自动判分）
 *   2. metadata.front/back 存在 → 自评模式（先看问题，点击"显示答案"后，
 *      由用户自评"记得 / 不记得"，对应 quality 5 / 1）
 *   3. metadata 缺失 → 退化自评模式，仅展示 label
 *
 * 完成后显示"今日复习已完成 ✓"总结页（正确数 / 总数 / 用时）。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle2, XCircle, Eye, ArrowRight, Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { useProgressStore } from '../store';
import type { ReviewItem } from '../utils/spacedRepetition';
import { processReview, getTodayReviewItems } from '../utils/spacedRepetition';

interface ReviewSessionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 可选：外部预计算的今日待复习项；不传则组件内部从 store 实时读取 */
  initialItems?: ReviewItem[];
}

/** 分类标签颜色 */
const CATEGORY_COLORS: Record<string, string> = {
  strategy: 'text-purple-400 bg-purple-400/10',
  range: 'text-blue-400 bg-blue-400/10',
  odds: 'text-green-400 bg-green-400/10',
  gto: 'text-orange-400 bg-orange-400/10',
};

const CATEGORY_LABELS: Record<string, string> = {
  strategy: '策略',
  range: '范围',
  odds: '赔率',
  gto: 'GTO',
};

interface AnswerRecord {
  itemId: string;
  isCorrect: boolean;
  timeTakenMs: number;
}

export default function ReviewSession({ open, onOpenChange, initialItems }: ReviewSessionProps) {
  const { t } = useTranslation();
  const updateReviewItem = useProgressStore((s) => s.updateReviewItem);
  const storeReviewItems = useProgressStore((s) => s.reviewItems);

  // 实时读取今日待复习项；initialItems 优先（外部门控已确定快照）
  const todayItems = useMemo(() => {
    if (initialItems && initialItems.length > 0) return initialItems;
    return getTodayReviewItems(storeReviewItems);
  }, [initialItems, storeReviewItems]);

  // 会话状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showAnswer, setShowAnswer] = useState(false); // 自评模式：是否已显示答案
  const [selectedOption, setSelectedOption] = useState<number | null>(null); // 多选题：当前选中
  const [isFinished, setIsFinished] = useState(false);
  const sessionStartRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());

  // 重置会话状态（每次打开时）
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setAnswers([]);
      setShowAnswer(false);
      setSelectedOption(null);
      setIsFinished(false);
      sessionStartRef.current = Date.now();
      questionStartRef.current = Date.now();
    }
  }, [open]);

  // 当题目切换时重置单题状态
  useEffect(() => {
    setShowAnswer(false);
    setSelectedOption(null);
    questionStartRef.current = Date.now();
  }, [currentIndex]);

  const currentItem = todayItems[currentIndex];
  const totalCount = todayItems.length;

  // 提交一题的答案（多选或自评共用）
  const submitAnswer = useCallback(
    (isCorrect: boolean) => {
      if (!currentItem) return;
      const timeTakenMs = Date.now() - questionStartRef.current;

      // quality 评分：答对+快→5，答对→4，答错→1（自评"记得"=5，"不记得"=1）
      const quality = isCorrect ? (timeTakenMs < 5000 ? 5 : 4) : 1;
      const updated = processReview(currentItem, quality);
      updateReviewItem(updated);

      setAnswers((prev) => [
        ...prev,
        { itemId: currentItem.id, isCorrect, timeTakenMs },
      ]);
    },
    [currentItem, updateReviewItem]
  );

  // 多选题：点击选项
  const handleSelectOption = useCallback(
    (idx: number) => {
      if (selectedOption !== null || !currentItem?.metadata?.options) return;
      setSelectedOption(idx);
      const option = currentItem.metadata.options[idx];
      const isCorrect = !!option?.isCorrect;
      submitAnswer(isCorrect);
    },
    [selectedOption, currentItem, submitAnswer]
  );

  // 自评模式：点击"记得 / 不记得"
  const handleSelfEval = useCallback(
    (isCorrect: boolean) => {
      if (!showAnswer) return; // 必须先显示答案
      submitAnswer(isCorrect);
    },
    [showAnswer, submitAnswer]
  );

  // 下一题 / 完成
  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= totalCount) {
      setIsFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, totalCount]);

  // 关闭 Dialog
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // 渲染模式判定
  const renderMode: 'multiple-choice' | 'self-eval' | 'minimal' = (() => {
    if (!currentItem) return 'minimal';
    if (currentItem.metadata?.options && currentItem.metadata.options.length > 0) {
      return 'multiple-choice';
    }
    if (currentItem.metadata?.front || currentItem.metadata?.back) {
      return 'self-eval';
    }
    return 'minimal';
  })();

  // 多选题反馈状态
  const hasAnswered = selectedOption !== null;
  const correctOptionIdx = currentItem?.metadata?.options?.findIndex((o) => o.isCorrect) ?? -1;

  // 空状态：今日无复习项
  if (todayItems.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[var(--felt)] border-[var(--walnut-border)] text-[var(--ivory)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--ivory)] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              {t('review.empty.title', { defaultValue: '今日复习已完成 ✓' })}
            </DialogTitle>
            <DialogDescription className="text-[var(--ivory-muted)]">
              {t('review.empty.subtitle', {
                defaultValue: '今天没有待复习的内容，下次训练后再来吧！',
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button onClick={handleClose} className="bg-[var(--brass)] text-[var(--primary-foreground)]">
              {t('common.confirm', { defaultValue: '确认' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 完成总结页
  if (isFinished) {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalTimeMs = Date.now() - sessionStartRef.current;
    const accuracy = answers.length > 0 ? (correctCount / answers.length) * 100 : 0;
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[var(--felt)] border-[var(--walnut-border)] text-[var(--ivory)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--ivory)] flex items-center gap-2 justify-center">
              <Trophy className="w-6 h-6 text-[var(--brass-bright)]" />
              {t('review.complete.title', { defaultValue: '今日复习已完成 ✓' })}
            </DialogTitle>
            <DialogDescription className="text-[var(--ivory-muted)] text-center">
              {t('review.complete.subtitle', {
                defaultValue: '保持节奏，记忆会更牢固',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-2">
            <SummaryStat
              label={t('review.complete.total', { defaultValue: '总题数' })}
              value={`${answers.length}`}
            />
            <SummaryStat
              label={t('review.complete.correct', { defaultValue: '答对' })}
              value={`${correctCount}`}
              accent="green"
            />
            <SummaryStat
              label={t('review.complete.accuracy', { defaultValue: '正确率' })}
              value={`${accuracy.toFixed(0)}%`}
              accent="brass"
            />
          </div>

          <div className="text-center text-xs text-[var(--ivory-muted)] pt-1">
            {t('review.complete.duration', {
              defaultValue: '用时 {{sec}} 秒',
              sec: Math.round(totalTimeMs / 1000),
            })}
          </div>

          <div className="flex justify-end pt-3">
            <Button onClick={handleClose} className="bg-[var(--brass)] text-[var(--primary-foreground)]">
              {t('common.confirm', { defaultValue: '确认' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 主复习界面
  const progressPercent = totalCount > 0 ? ((currentIndex + (hasAnswered || showAnswer ? 1 : 0)) / totalCount) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--felt)] border-[var(--walnut-border)] text-[var(--ivory)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[var(--ivory)] flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[var(--brass-bright)]" />
            {t('review.title', { defaultValue: '今日复习' })}
            <span className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--brass)]/20 text-[var(--brass-bright)]">
              {currentIndex + 1} / {totalCount}
            </span>
          </DialogTitle>
          <DialogDescription className="text-[var(--ivory-muted)]">
            {t('review.subtitle', {
              defaultValue: '按类别混合复习，巩固长期记忆',
            })}
          </DialogDescription>
        </DialogHeader>

        {/* 进度条 */}
        <div className="h-1.5 bg-[var(--walnut-raised)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--brass)] to-[var(--sage)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {currentItem && (
          <div className="space-y-4">
            {/* 分类标签 + 题干 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    CATEGORY_COLORS[currentItem.category] ?? CATEGORY_COLORS.strategy
                  }`}
                >
                  {CATEGORY_LABELS[currentItem.category] ?? '策略'}
                </span>
                <span className="text-xs text-[var(--ivory-muted)]">{currentItem.label}</span>
              </div>

              {/* 题干 */}
              <div className="p-3 rounded-lg bg-[var(--walnut-raised)]/30 border border-[var(--walnut-border)]/40">
                <p className="text-sm text-[var(--ivory)] leading-relaxed">
                  {currentItem.metadata?.front ??
                    t('review.defaultFront', {
                      defaultValue: '请回忆该知识点的关键内容，然后点击"显示答案"自评。',
                    })}
                </p>
              </div>
            </div>

            {/* 渲染模式：多选题 / 自评 / 退化自评 */}
            <AnimatePresence mode="wait">
              {renderMode === 'multiple-choice' && currentItem.metadata?.options ? (
                <motion.div
                  key="mc"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-2"
                >
                  {currentItem.metadata.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectOpt = !!opt.isCorrect;
                    const showFeedback = hasAnswered;
                    let optionClass =
                      'border-[var(--walnut-border)] bg-[var(--walnut-raised)]/40 hover:bg-[var(--walnut-raised)]/70 hover:border-[var(--brass-muted)]/60';
                    if (showFeedback) {
                      if (isCorrectOpt) {
                        optionClass = 'border-green-500/60 bg-green-500/15 text-green-300';
                      } else if (isSelected) {
                        optionClass = 'border-red-500/60 bg-red-500/15 text-red-300';
                      } else {
                        optionClass = 'border-[var(--walnut-border)]/40 bg-[var(--walnut-raised)]/20 opacity-60';
                      }
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={hasAnswered}
                        className={`w-full text-left px-3 py-2.5 rounded-md border text-sm transition-all flex items-center justify-between gap-2 ${optionClass}`}
                      >
                        <span className="text-[var(--ivory)]">{opt.text}</span>
                        {showFeedback && isCorrectOpt && (
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        )}
                        {showFeedback && isSelected && !isCorrectOpt && (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}

                  {/* 选项解析（答对/答错后显示） */}
                  {hasAnswered && currentItem.metadata.options[selectedOption ?? correctOptionIdx]?.explanation && (
                    <div className="p-2.5 rounded-md bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)]/40 text-xs text-[var(--ivory-dim)]">
                      {currentItem.metadata.options[selectedOption ?? correctOptionIdx]?.explanation}
                    </div>
                  )}
                </motion.div>
              ) : renderMode === 'self-eval' ? (
                <motion.div
                  key="self"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-2"
                >
                  {/* 答案区域 */}
                  {showAnswer ? (
                    <div className="p-3 rounded-lg bg-[var(--brass)]/10 border border-[var(--brass)]/30">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--brass-bright)] mb-1">
                        {t('review.answerLabel', { defaultValue: '答案' })}
                      </div>
                      <p className="text-sm text-[var(--ivory)] leading-relaxed">
                        {currentItem.metadata?.back ?? ''}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="w-full px-3 py-2.5 rounded-md border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/40 hover:bg-[var(--walnut-raised)]/70 text-sm text-[var(--ivory)] flex items-center justify-center gap-2 transition-all"
                    >
                      <Eye className="w-4 h-4 text-[var(--brass-bright)]" />
                      {t('review.showAnswer', { defaultValue: '显示答案' })}
                    </button>
                  )}

                  {/* 自评按钮（仅在显示答案后出现） */}
                  {showAnswer && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSelfEval(false)}
                        className="px-3 py-2.5 rounded-md border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-sm text-red-300 font-medium transition-all"
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        {t('review.forgot', { defaultValue: '不记得' })}
                      </button>
                      <button
                        onClick={() => handleSelfEval(true)}
                        className="px-3 py-2.5 rounded-md border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 text-sm text-green-300 font-medium transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 inline mr-1" />
                        {t('review.remembered', { defaultValue: '记得' })}
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                // minimal 模式：仅展示 label，自评
                <motion.div
                  key="minimal"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-2"
                >
                  <div className="p-3 rounded-lg bg-[var(--walnut-raised)]/30 border border-[var(--walnut-border)]/40 text-sm text-[var(--ivory-dim)]">
                    {t('review.minimalHint', {
                      defaultValue: '请回忆该知识点的关键内容，自评是否记得。',
                    })}
                  </div>
                  {!showAnswer ? (
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="w-full px-3 py-2.5 rounded-md border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/40 hover:bg-[var(--walnut-raised)]/70 text-sm text-[var(--ivory)] flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4 text-[var(--brass-bright)]" />
                      {t('review.showAnswer', { defaultValue: '显示答案' })}
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSelfEval(false)}
                        className="px-3 py-2.5 rounded-md border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-sm text-red-300 font-medium"
                      >
                        {t('review.forgot', { defaultValue: '不记得' })}
                      </button>
                      <button
                        onClick={() => handleSelfEval(true)}
                        className="px-3 py-2.5 rounded-md border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 text-sm text-green-300 font-medium"
                      >
                        {t('review.remembered', { defaultValue: '记得' })}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 下一题按钮（仅在已答题后出现） */}
            {(hasAnswered || (showAnswer && answers.length > currentIndex)) && (
              <Button
                onClick={handleNext}
                className="w-full bg-[var(--brass)] text-[var(--primary-foreground)] hover:bg-[var(--brass-bright)]"
              >
                {currentIndex + 1 >= totalCount
                  ? t('review.finish', { defaultValue: '完成复习' })
                  : t('review.next', { defaultValue: '下一题' })}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** 总结页统计项 */
function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'green' | 'brass';
}) {
  const valueColor =
    accent === 'green'
      ? 'text-green-400'
      : accent === 'brass'
        ? 'text-[var(--brass-bright)]'
        : 'text-[var(--ivory)]';
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[var(--walnut-raised)]/30 border border-[var(--walnut-border)]/40">
      <div className="text-[10px] uppercase tracking-wider text-[var(--ivory-muted)]">{label}</div>
      <div className={`font-numeric text-xl ${valueColor}`}>{value}</div>
    </div>
  );
}
