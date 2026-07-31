import { useEffect, type ReactNode } from 'react';
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
import { useRangeTrainerStore } from '../store';
import { SIX_MAX_POSITIONS, ACTION_TYPES, POSITION_UNLOCK_THRESHOLDS, isPositionUnlocked } from '../constants';

const TIME_OPTIONS = [
  { value: '0', label: '无限时' }, { value: '5', label: '5 秒' }, { value: '10', label: '10 秒' },
  { value: '15', label: '15 秒' }, { value: '30', label: '30 秒' },
];

const QUESTION_COUNT_OPTIONS = [
  { value: '10', label: '10 题' }, { value: '20', label: '20 题' },
  { value: '30', label: '30 题' }, { value: '50', label: '50 题' },
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
  const presets = useRangeTrainerStore((s) => s.presets);
  const preflopElo = useProgressStore((s) => s.elo.preflop);
  const debugUnlock = useDebugModeStore((s) => s.unlockAll);

  // 按当前变体 presets 实际存在的组合过滤位置与动作类型
  const positionOptions: Position[] = SIX_MAX_POSITIONS.filter((pos) =>
    presets.some((p) => p.position === pos)
  );
  const actionOptions = ACTION_TYPES.filter((at) =>
    presets.some((p) => p.position === position && p.actionType === at.value)
  );
  const hasPreset = presets.some(
    (p) => p.position === position && p.actionType === actionType
  );
  const isUnlocked = (pos: Position) => debugUnlock || isPositionUnlocked(pos, preflopElo);

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
          <CardTitle className="text-xl">范围测验</CardTitle>
          <CardDescription>
            测试你对各位置开牌范围的掌握程度
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 位置选择（P1A-05：锁定位置禁用 + 阈值提示） */}
          <ConfigField icon={<Zap className="w-4 h-4" />} label="位置" value={position} onChange={(v) => onPositionChange(v as Position)}>
            {positionOptions.map((pos) => {
              const unlocked = isUnlocked(pos);
              const threshold = POSITION_UNLOCK_THRESHOLDS[pos];
              return (
                <SelectItem
                  key={pos}
                  value={pos}
                  disabled={!unlocked}
                  title={unlocked ? pos : `需 preflop ELO ≥ ${threshold} 解锁`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {!unlocked && <Lock className="w-3 h-3" />}
                    {pos}
                    {!unlocked && (
                      <span className="text-xs opacity-70">需 preflop ELO ≥ {threshold} 解锁</span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </ConfigField>

          {/* 动作类型（P1A-01/P1A-10：仅列出当前位置实际存在题库的动作） */}
          <ConfigField icon={<Zap className="w-4 h-4" />} label="动作类型" value={actionType} onChange={onActionTypeChange}>
            {actionOptions.map((at) => (
              <SelectItem key={at.value} value={at.value}>
                {at.label}
              </SelectItem>
            ))}
          </ConfigField>

          <ConfigField icon={<Clock className="w-4 h-4" />} label="每题限时" value={String(timeLimit)} onChange={(v) => onTimeLimitChange(Number(v))}>
            {TIME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </ConfigField>

          <ConfigField icon={<Hash className="w-4 h-4" />} label="题目数量" value={String(questionCount)} onChange={(v) => onQuestionCountChange(Number(v))}>
            {QUESTION_COUNT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </ConfigField>

          {/* P1A-01 防御兜底：过滤后理论上不可达，仍保留提示避免静默无响应 */}
          {!hasPreset && (
            <p className="text-xs text-center text-[var(--clay)]">该组合暂无题库</p>
          )}

          <Button
            onClick={onStart}
            disabled={startDisabled}
            className="w-full bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--primary-foreground)] h-12 text-base font-semibold font-display tracking-wide disabled:opacity-40"
          >
            开始训练
          </Button>

          <p className="text-xs text-center text-[var(--ivory-dim)]">
            快捷键：1=Fold · 2=Call · 3=Raise · Esc=暂停
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
