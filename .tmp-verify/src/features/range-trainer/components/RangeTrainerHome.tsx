import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { BookOpen, HelpCircle } from 'lucide-react';
import { RangeGrid } from './RangeGrid';
import { RangeSelector } from './RangeSelector';
import { RangeInfo } from './RangeInfo';
import { useRangeTrainerStore } from '../store';
import { getPositionsForPlayerCount } from '@/shared/types/position';
import { getPlayerCountOptions } from '@/shared/constants/poker';
import type { GameVariant } from '@/shared/types/poker';

const VARIANT_OPTIONS: { value: GameVariant; labelKey: string }[] = [
  { value: 'standard', labelKey: 'rangeTrainer.variant.standard' },
  { value: 'short-deck', labelKey: 'rangeTrainer.variant.shortDeck' },
  { value: 'heads-up', labelKey: 'rangeTrainer.variant.headsUp' },
];

export default function RangeTrainerHome() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    learnState,
    setSelectedPreset,
    setSelectedPosition,
    setSelectedActionType,
    setHighlightedHand,
    presets,
    gameVariant,
    playerCount,
    setGameVariant,
    setPlayerCount,
  } = useRangeTrainerStore();

  // 当前选中预设的手牌，如果没有预设则用空数组
  const selectedHands = learnState.selectedPreset?.hands ?? [];

  const handlePresetSelect = (preset: typeof learnState.selectedPreset) => {
    setSelectedPreset(preset);
  };

  // 根据变体和人数获取位置列表
  const positions = React.useMemo(
    () => getPositionsForPlayerCount(playerCount),
    [playerCount]
  );

  // XMOD-002：人数选项统一由 shared getPlayerCountOptions 推导（GAME_VARIANT_CONFIGS 为唯一事实源）。
  // standard 额外排除 5：无专属 5-max preset 数据（5-max 回落 6-max preset 缺口），避免选到后无可用范围。
  const playerCountOptions = getPlayerCountOptions(
    gameVariant,
    gameVariant === 'standard' ? [5] : [],
  );

  // 自动选择第一个匹配的预设
  // RNG-002 修复：依赖须含 selectedPreset —— setSelectedPosition/ActionType 会将
  // selectedPreset 置 null，若点击的是"已选中"的位置/动作（position/actionType 值不变），
  // 缺失该依赖会导致 effect 不重跑、预设永久丢失（网格清空直到切换到其他组合）
  React.useEffect(() => {
    if (!learnState.selectedPreset) {
      const match = presets.find(
        (p) => p.position === learnState.selectedPosition && p.actionType === learnState.selectedActionType
      );
      if (match) setSelectedPreset(match);
    }
  }, [learnState.selectedPreset, learnState.selectedPosition, learnState.selectedActionType, presets, setSelectedPreset]);

  // 当变体切换后，确保位置有效
  React.useEffect(() => {
    if (positions.length > 0 && !positions.includes(learnState.selectedPosition)) {
      setSelectedPosition(positions[0]!);
    }
  }, [positions, learnState.selectedPosition]);

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-6">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ivory)]">{t('rangeTrainer.title')}</h1>
            <p className="text-sm text-[var(--ivory-dim)] mt-1">
              {t('rangeTrainer.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--primary-foreground)]"
              onClick={() => navigate('/range-trainer/learn')}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              {t('rangeTrainer.learn')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/range-trainer/quiz')}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              {t('rangeTrainer.quiz')}
            </Button>
          </div>
        </div>

        {/* 游戏变体切换 */}
        <div className="panel">
          <div className="space-y-3">
            {/* 变体选择 */}
            <div>
              <label className="text-xs font-medium text-[var(--ivory-dim)] mb-1.5 block">{t('rangeTrainer.variant.label')}</label>
              <div className="flex gap-2">
                {VARIANT_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setGameVariant(v.value)}
                    className={`pill flex-1 ${gameVariant === v.value ? 'active' : ''}`}
                  >
                    {t(v.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            {/* 人数选择 */}
            {playerCountOptions.length > 1 && (
              <div>
                <label className="text-xs font-medium text-[var(--ivory-dim)] mb-1.5 block">{t('rangeTrainer.variant.playerCount')}</label>
                <div className="flex gap-2">
                  {playerCountOptions.map((count) => (
                    <button
                      key={count}
                      onClick={() => setPlayerCount(count)}
                      className={`pill flex-1 ${playerCount === count ? 'active' : ''}`}
                    >
                      {t('rangeTrainer.variant.max', { count })}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {gameVariant === 'short-deck' && (
              <p className="text-xs text-[var(--brass-bright)] bg-[var(--brass)]/10 rounded-md px-3 py-1.5">
                {t('rangeTrainer.variant.shortDeckHint')}
              </p>
            )}
          </div>
        </div>

        {/* 主体内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* 左侧面板 */}
          <div className="space-y-4">
            {/* 范围选择器 */}
            <div className="panel">
              <div className="panel-title">{t('rangeTrainer.rangeSelect.title')}</div>
              <p className="text-xs text-[var(--ivory-muted)] mb-3">{t('rangeTrainer.rangeSelect.hint')}</p>
              <RangeSelector
                selectedPosition={learnState.selectedPosition}
                selectedActionType={learnState.selectedActionType}
                onPositionChange={setSelectedPosition}
                onActionTypeChange={setSelectedActionType}
                presets={presets}
                onPresetSelect={handlePresetSelect}
                positions={positions}
              />
            </div>

            {/* 范围信息 */}
            <div className="panel">
              <div className="panel-title">{t('rangeTrainer.rangeInfo.title')}</div>
              <RangeInfo
                selectedHands={selectedHands}
                highlightedHand={learnState.highlightedHand}
                preset={learnState.selectedPreset}
                variant={gameVariant}
              />
            </div>
          </div>

          {/* 右侧网格 */}
          <div className="panel">
            <div className="panel-title">
              {gameVariant === 'short-deck' ? t('rangeTrainer.rangeInfo.matrix9') : t('rangeTrainer.rangeInfo.matrix13')}
              {gameVariant !== 'standard' && (
                <span className="ml-2 text-xs font-normal text-[var(--brass-bright)]">
                  {gameVariant === 'short-deck' ? t('rangeTrainer.variant.shortDeck') : t('rangeTrainer.variant.headsUp')}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--ivory-muted)] mb-3">
              {t('rangeTrainer.rangeInfo.matrixLegend')}
            </p>
            <RangeGrid
              selectedHands={selectedHands}
              highlightedHand={learnState.highlightedHand}
              onCellHover={setHighlightedHand}
              variant={gameVariant}
              className="max-w-[640px]"
            />
          </div>
        </div>

        {/* 底部说明 */}
        <div className="text-center text-xs text-[var(--ivory-dim)] pb-4">
          <p>
            {t('rangeTrainer.footer.note')}
          </p>
          <p className="mt-1">
            {t('rangeTrainer.footer.hover')}
          </p>
        </div>
      </div>
    </div>
  );
}
