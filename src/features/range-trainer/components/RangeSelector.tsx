import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Lock } from 'lucide-react';
import type { Position } from '@/shared/types/position';
import type { RangePreset } from '../types';
import { SIX_MAX_POSITIONS, ACTION_TYPES, POSITION_UNLOCK_THRESHOLDS, isPositionUnlocked } from '../constants';
import { useProgressStore } from '@/features/progress/store';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { useRangeTrainerStore } from '../store';
import { resolvePresetName } from '../utils/presetI18n';

interface RangeSelectorProps {
  selectedPosition: Position;
  selectedActionType: string;
  onPositionChange: (position: Position) => void;
  onActionTypeChange: (actionType: string) => void;
  presets: RangePreset[];
  onPresetSelect: (preset: RangePreset) => void;
  positions?: readonly Position[];
}

export function RangeSelector({
  selectedPosition,
  selectedActionType,
  onPositionChange,
  onActionTypeChange,
  presets,
  onPresetSelect,
  positions,
}: RangeSelectorProps) {
  const { t } = useTranslation();
  // P4 修复（4.4-P1-1）：基于 preflop ELO 的位置渐进解锁
  const preflopElo = useProgressStore((s) => s.eloByVariant[s.activeVariant].preflop);
  // 调试解锁：解除全部位置门禁
  const debugUnlock = useDebugModeStore((s) => s.unlockAll);
  // XMOD-009：低人数桌（≤2-max）绕过位置解锁，使 isPositionUnlocked 短路
  const playerCount = useRangeTrainerStore((s) => s.playerCount);

  // 过滤当前位置+动作类型的预设
  const filteredPresets = presets.filter(
    (p) => p.position === selectedPosition && p.actionType === selectedActionType
  );

  const displayPositions = positions ?? SIX_MAX_POSITIONS;

  return (
    <div className="space-y-4">
      {/* 位置选择 */}
      <div>
        <h3 className="text-sm font-medium text-[var(--ivory-muted)] mb-2">{t('rangeTrainer.rangeSelect.position')}</h3>
        <div className="flex flex-wrap gap-1.5">
          {displayPositions.map((pos) => {
            // XMOD-001：当前 (variant, playerCount) 下无可用 preset 的位置禁用「暂无数据」
            const hasPreset = presets.some((p) => p.position === pos);
            const unlocked = debugUnlock || isPositionUnlocked(pos, preflopElo, playerCount);
            const threshold = POSITION_UNLOCK_THRESHOLDS[pos];
            const lockHint = t('rangeTrainer.rangeSelect.unlockRequirement', { threshold });
            const noDataHint = t('rangeTrainer.rangeSelect.noData');
            const disabled = !unlocked || !hasPreset;
            const reason = !hasPreset ? noDataHint : unlocked ? undefined : lockHint;
            return (
              <Button
                key={pos}
                variant={selectedPosition === pos ? 'default' : 'outline'}
                size="sm"
                disabled={disabled}
                title={reason ?? pos}
                aria-label={reason ?? pos}
                className={cn(
                  'text-xs px-4 min-h-11',
                  selectedPosition === pos && 'bg-[var(--brass)] hover:bg-[var(--brass-bright)]',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => !disabled && onPositionChange(pos)}
              >
                {!unlocked && !hasPreset && <Lock className="w-3 h-3 mr-1" />}
                {pos}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 动作类型选择 */}
      <div>
        <h3 className="text-sm font-medium text-[var(--ivory-muted)] mb-2">{t('rangeTrainer.rangeSelect.actionType')}</h3>
        <div className="flex flex-wrap gap-1.5">
          {ACTION_TYPES.map((at) => (
            <Button
              key={at.value}
              variant={selectedActionType === at.value ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'text-xs px-3 py-1.5 h-auto',
                selectedActionType === at.value && 'bg-[var(--brass)] hover:bg-[var(--brass-bright)]'
              )}
              onClick={() => onActionTypeChange(at.value)}
            >
              {at.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 预设范围快速选择 */}
      {filteredPresets.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[var(--ivory-muted)] mb-2">{t('rangeTrainer.rangeSelect.preset')}</h3>
          <Select onValueChange={(val) => {
            const preset = presets.find((p) => p.id === val);
            if (preset) onPresetSelect(preset);
          }}>
            <SelectTrigger className="w-full bg-[var(--surface)] border-[var(--surface-raised)]">
              <SelectValue placeholder={t('rangeTrainer.rangeSelect.presetPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {filteredPresets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {t('rangeTrainer.rangeSelect.presetHands', {
                    name: resolvePresetName(t, preset),
                    count: preset.hands.length,
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
