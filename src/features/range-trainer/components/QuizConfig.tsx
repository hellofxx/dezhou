import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Position } from '@/shared/types/position';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { HelpCircle, Zap, Clock, Hash, Lock } from 'lucide-react';
import { useProgressStore } from '@/features/progress/store';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { getPositionsForPlayerCount } from '@/shared/types/position';
import { useRangeTrainerStore } from '../store';
import { ACTION_TYPES, POSITION_UNLOCK_THRESHOLDS, isPositionUnlocked } from '../constants';
import type { RangePreset } from '../types';

/**
 * RNG-004 修复：测验位置选项 = 当前人数的有效位置 ∩ 存在预置范围的位置。
 * 修复前用 SIX_MAX_POSITIONS 硬编码过滤，导致 standard 2/3 人桌显示 6 个
 * 桌位不存在的位置（UTG/HJ/CO/SB），与 RangeSelector（按人数契约过滤）不一致。
 */
export function getQuizPositionOptions(playerCount: number, presets: RangePreset[]): Position[] {
  return getPositionsForPlayerCount(playerCount).filter((pos) =>
    presets.some((p) => p.position === pos),
  );
}

const TIME_OPTIONS = [
  { value: '0' }, { value: '5' }, { value: '10' },
  { value: '15' }, { value: '30' },
];

const QUESTION_COUNT_OPTIONS = [
  { value: '10' }, { value: '20' },
  { value: '30' }, { value: '50' },
];

/** 带图标标签的下拉配置项（本文件内复用，压缩四段重复 JSX） */
function ConfigField({
  icon, label, value, onChange, children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-[var(--ivory-muted)]">
        {icon}
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-[var(--background)] border-[var(--surface-raised)]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

interface QuizConfigProps {
  position: Position;
  actionType: string;
  timeLimit: number;
  questionCount: number;
  onPositionChange: (position: Position) => void;
  onActionTypeChange: (actionType: string) => void;
  onTimeLimitChange: (timeLimit: number) => void;
  onQuestionCountChange: (count: number) => void;
  onStart: () => void;
}

/**
 * 测验配置卡（从 RangeQuizPage 拆分）：
 * - P1A-01/P1A-10：位置与动作类型选项按 store 变体化 presets 实际存在的组合过滤，
 *   杜绝"无题库组合"进入测验（HU / 短牌 / 4-max 下同样成立）
 * - P1A-05：位置选项复用 isPositionUnlocked + 调试解锁旁路，对齐 RangeSelector 门禁
 */
export function QuizConfig({
  position, actionType, timeLimit, questionCount,
  onPositionChange, onActionTypeChange, onTimeLimitChange, onQuestionCountChange, onStart,
}: QuizConfigProps) {
  const { t } = useTranslation();
  const presets = useRangeTrainerStore((s) => s.presets);
  const playerCount = useRangeTrainerStore((s) => s.playerCount);
  const preflopElo = useProgressStore((s) => s.eloByVariant[s.activeVariant].preflop);
  const debugUnlock = useDebugModeStore((s) => s.unlockAll);

  // 按当前人数契约 + 变体 presets 实际存在的组合过滤位置与动作类型
  const positionOptions: Position[] = getQuizPositionOptions(playerCount, presets);
  const actionOptions = ACTION_TYPES.filter((at) =>
    presets.some((p) => p.position === position && p.actionType === at.value)
  );
  const hasPreset = presets.some(
    (p) => p.position === position && p.actionType === actionType
  );
  const isUnlocked = (pos: Position) => debugUnlock || isPositionUnlocked(pos, preflopElo, playerCount);

  // 变体切换后当前选择失效时，自动回退到第一个可用（且已解锁）的组合
  useEffect(() => {
    if (!positionOptions.includes(position)) {
      const fallback = positionOptions.find((pos) => isUnlocked(pos)) ?? positionOptions[0];
      if (fallback) onPositionChange(fallback);
    }
  }, [presets, position]);

  useEffect(() => {
    if (actionOptions.length > 0 && !actionOptions.some((at) => at.value === actionType)) {
      onActionTypeChange(actionOptions[0]!.value);
    }
  }, [presets, position, actionType]);

  const startDisabled = !hasPreset || !isUnlocked(position);

  return (
    <div className="h-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[var(--surface)] border-[var(--surface-raised)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 w-12 h-12 rounded-xl bg-[var(--brass)]/10 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-[var(--brass)]" />
          </div>
          <CardTitle className="text-xl">{t('rangeTrainer.config.title')}</CardTitle>
          <CardDescription>
            {t('rangeTrainer.config.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 位置选择（P1A-05：锁定位置禁用 + 阈值提示） */}
          <ConfigField icon={<Zap className="w-4 h-4" />} label={t('rangeTrainer.config.position')} value={position} onChange={(v) => onPositionChange(v as Position)}>
            {positionOptions.map((pos) => {
              const unlocked = isUnlocked(pos);
              const threshold = POSITION_UNLOCK_THRESHOLDS[pos];
              const lockHint = t('rangeTrainer.rangeSelect.unlockRequirement', { threshold });
              return (
                <SelectItem
                  key={pos}
                  value={pos}
                  disabled={!unlocked}
                  title={unlocked ? pos : lockHint}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {!unlocked && <Lock className="w-3 h-3" />}
                    {pos}
                    {!unlocked && (
                      <span className="text-xs opacity-70">{lockHint}</span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </ConfigField>

          {/* 动作类型（P1A-01/P1A-10：仅列出当前位置实际存在题库的动作） */}
          <ConfigField icon={<Zap className="w-4 h-4" />} label={t('rangeTrainer.config.actionType')} value={actionType} onChange={onActionTypeChange}>
            {actionOptions.map((at) => (
              <SelectItem key={at.value} value={at.value}>
                {at.label}
              </SelectItem>
            ))}
          </ConfigField>

          <ConfigField icon={<Clock className="w-4 h-4" />} label={t('rangeTrainer.config.timeLimit')} value={String(timeLimit)} onChange={(v) => onTimeLimitChange(Number(v))}>
            {TIME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.value === '0' ? t('rangeTrainer.config.timeUnlimited') : t('rangeTrainer.config.timeSeconds', { count: Number(opt.value) })}
              </SelectItem>
            ))}
          </ConfigField>

          <ConfigField icon={<Hash className="w-4 h-4" />} label={t('rangeTrainer.config.questionCount')} value={String(questionCount)} onChange={(v) => onQuestionCountChange(Number(v))}>
            {QUESTION_COUNT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t('rangeTrainer.config.questionUnit', { count: Number(opt.value) })}
              </SelectItem>
            ))}
          </ConfigField>

          {/* P1A-01 防御兜底：过滤后理论上不可达，仍保留提示避免静默无响应 */}
          {!hasPreset && (
            <p className="text-xs text-center text-[var(--clay)]">{t('rangeTrainer.config.noPreset')}</p>
          )}

          <Button
            onClick={onStart}
            disabled={startDisabled}
            className="w-full bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--primary-foreground)] h-12 text-base font-semibold font-display tracking-wide disabled:opacity-40"
          >
            {t('rangeTrainer.config.start')}
          </Button>

          <p className="text-xs text-center text-[var(--ivory-dim)]">
            {t('rangeTrainer.config.shortcuts')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
