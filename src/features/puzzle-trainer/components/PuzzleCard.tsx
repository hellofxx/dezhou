/**
 * 单题卡片组件：渲染场景、手牌、选项、五级反馈。
 *
 * - 选项按钮区已下沉至 ActionBoard 组件，按行动强度分档视觉权重
 * - 反馈面板已拆至 PuzzleCardFeedback（复用 GRADE_DISPLAY_CONFIG）
 * - 支持三种模式（rush / daily / theme），Rush 模式下额外显示连对数与剩余命
 */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { transitionStandard } from '@/shared/utils/motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import ActionBoard from './ActionBoard';
import { PuzzleCardFeedback } from './PuzzleCardFeedback';
import { InfoChip, RushStatusBar } from './PuzzleCardChrome';
import type { PuzzleAnswerRecord, PuzzleQuestion } from '../types';

interface PuzzleCardProps {
  question: PuzzleQuestion;
  /** 当前题已答的记录（未答时 null） */
  answerRecord: PuzzleAnswerRecord | null;
  /** 当前选中的选项 ID（用于高亮） */
  selectedOptionId: string | null;
  /** 选择回调 */
  onSelectOption: (optionId: string) => void;
  /** 进入下一题回调（已答时显示按钮） */
  onNext: () => void;
  /** 是否是最后一题（影响按钮文案） */
  isLastQuestion?: boolean;
  /** Puzzle Rush 模式：显示连对数与剩余命 */
  rushMode?: boolean;
  lives?: number;
  streak?: number;
  /** 题目序号显示，如 "第 3 / 8 题" */
  questionProgress?: { current: number; total: number };
  /** 最近一次连对奖励（毫秒），>0 时显示"+10s" */
  bonusFeedback?: number;
}

export function PuzzleCard({
  question,
  answerRecord,
  selectedOptionId,
  onSelectOption,
  onNext,
  isLastQuestion = false,
  rushMode = false,
  lives,
  streak,
  questionProgress,
  bonusFeedback,
}: PuzzleCardProps) {
  const { t } = useTranslation();
  const isAnswered = answerRecord !== null;
  const themeLabel = t(`puzzle.themes.${question.theme}`, question.theme);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionStandard}
      className="space-y-3"
    >
      {/* 顶部状态条 */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[var(--ivory-dim)] min-w-0">
          <span className="px-2 py-0.5 rounded-full bg-[var(--walnut)]/60 text-[var(--brass-bright)] font-display tracking-wide whitespace-nowrap text-[10px] sm:text-[11px] max-w-[160px] truncate">
            {themeLabel}
          </span>
          {questionProgress && (
            <span className="font-numeric text-[var(--ivory-muted)] whitespace-nowrap">
              {t('puzzle.card.progress', {
                current: questionProgress.current,
                total: questionProgress.total,
              })}
            </span>
          )}
        </div>
        {rushMode && (
          <RushStatusBar lives={lives} streak={streak} bonusFeedback={bonusFeedback} />
        )}
      </div>

      {/* 场景卡片 */}
      <Card className="puzzle-question-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* 场景描述 */}
          <div className="space-y-1.5">
            <p className="puzzle-question-eyebrow">
              {t('puzzle.card.scenarioLabel')}
            </p>
            <p className="puzzle-question-scenario">{question.scenario}</p>
          </div>

          {/* 手牌 / 位置 / 公共牌 / 底池 */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {question.hand && (
              <InfoChip
                label={t('puzzle.card.handLabel')}
                value={question.hand}
                mono
              />
            )}
            {question.position && (
              <InfoChip
                label={t('puzzle.card.positionLabel')}
                value={question.position}
              />
            )}
            {question.board && (
              <InfoChip
                label={t('puzzle.card.boardLabel')}
                value={question.board}
                mono
              />
            )}
            {typeof question.potSize === 'number' && (
              <InfoChip
                label={t('puzzle.card.potLabel')}
                value={`${question.potSize} BB`}
              />
            )}
            {typeof question.betSize === 'number' && (
              <InfoChip
                label={t('puzzle.card.betLabel')}
                value={`${question.betSize} BB`}
              />
            )}
            {typeof question.stackSize === 'number' && (
              <InfoChip
                label={t('puzzle.card.stackLabel')}
                value={`${question.stackSize} BB`}
              />
            )}
          </div>

          {/* 行动区分隔线 */}
          <div className="puzzle-question-divider" aria-hidden />

          {/* 选项按钮组：委托给 ActionBoard 管理（行动强度分档） */}
          <div className="space-y-2">
            <p className="puzzle-action-eyebrow">
              {t('puzzle.card.yourMove')}
            </p>
            <ActionBoard
              options={question.options}
              selectedOptionId={selectedOptionId}
              isAnswered={isAnswered}
              onSelect={onSelectOption}
            />
          </div>

          {/* 反馈面板 */}
          {isAnswered && answerRecord && (
            <PuzzleCardFeedback
              question={question}
              record={answerRecord}
              onNext={onNext}
              isLastQuestion={isLastQuestion}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
