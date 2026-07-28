import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { BookOpen, HelpCircle } from 'lucide-react';
import { RangeGrid } from './RangeGrid';
import { RangeSelector } from './RangeSelector';
import { RangeInfo } from './RangeInfo';
import { useRangeTrainerStore } from '../store';
import { getPositionsForPlayerCount } from '@/shared/types/position';
import { GAME_VARIANT_CONFIGS } from '@/shared/constants/poker';
import type { GameVariant } from '@/shared/types/poker';

const VARIANT_OPTIONS: { value: GameVariant; label: string }[] = [
  { value: 'standard', label: '标准德州' },
  { value: 'short-deck', label: '短牌德州 (6+)' },
  { value: 'heads-up', label: '单挑 (HU)' },
];

function getPlayerCountOptions(variant: GameVariant): number[] {
  switch (variant) {
    case 'standard': return [2, 3, 4, 6, 9];
    case 'short-deck': return [2, 3, 4, 5, 6];
    case 'heads-up': return [2];
  }
}

export default function RangeTrainerHome() {
  const navigate = useNavigate();
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

  const playerCountOptions = getPlayerCountOptions(gameVariant);
  const variantConfig = GAME_VARIANT_CONFIGS[gameVariant];

  // 自动选择第一个匹配的预设
  React.useEffect(() => {
    if (!learnState.selectedPreset) {
      const match = presets.find(
        (p) => p.position === learnState.selectedPosition && p.actionType === learnState.selectedActionType
      );
      if (match) setSelectedPreset(match);
    }
  }, [learnState.selectedPosition, learnState.selectedActionType, presets]);

  // 当变体切换后，确保位置有效
  React.useEffect(() => {
    if (positions.length > 0 && !positions.includes(learnState.selectedPosition)) {
      setSelectedPosition(positions[0]!);
    }
  }, [positions, learnState.selectedPosition]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ivory)]">手牌范围训练</h1>
            <p className="text-sm text-[var(--ivory-dim)] mt-1">
              学习各位置的标准开牌范围，掌握 GTO 基础
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
              学习模式
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/range-trainer/quiz')}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              测验模式
            </Button>
          </div>
        </div>

        {/* 游戏变体切换 */}
        <div className="panel">
          <div className="space-y-3">
            {/* 变体选择 */}
            <div>
              <label className="text-xs font-medium text-[var(--ivory-dim)] mb-1.5 block">游戏变体</label>
              <div className="flex gap-2">
                {VARIANT_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setGameVariant(v.value)}
                    className={`pill flex-1 ${gameVariant === v.value ? 'active' : ''}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            {/* 人数选择 */}
            {playerCountOptions.length > 1 && (
              <div>
                <label className="text-xs font-medium text-[var(--ivory-dim)] mb-1.5 block">玩家人数</label>
                <div className="flex gap-2">
                  {playerCountOptions.map((count) => (
                    <button
                      key={count}
                      onClick={() => setPlayerCount(count)}
                      className={`pill flex-1 ${playerCount === count ? 'active' : ''}`}
                    >
                      {count}-Max
                    </button>
                  ))}
                </div>
              </div>
            )}
            {gameVariant === 'short-deck' && (
              <p className="text-xs text-[var(--brass-bright)] bg-[var(--brass)]/10 rounded-md px-3 py-1.5">
                短牌模式：移除 2-5，共 36 张牌，9×9 范围矩阵。同花 &gt; 蒸蘆，顺子 &gt; 三条。
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
              <div className="panel-title">范围选择</div>
              <p className="text-xs text-[var(--ivory-muted)] mb-3">选择位置和动作类型查看标准范围</p>
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
              <div className="panel-title">范围信息</div>
              <RangeInfo
                selectedHands={selectedHands}
                highlightedHand={learnState.highlightedHand}
                presetName={learnState.selectedPreset?.name}
              />
            </div>
          </div>

          {/* 右侧网格 */}
          <div className="panel">
            <div className="panel-title">
              {gameVariant === 'short-deck' ? '9×9 范围矩阵' : '13×13 范围矩阵'}
              {gameVariant !== 'standard' && (
                <span className="ml-2 text-xs font-normal text-[var(--brass-bright)]">
                  {variantConfig.displayName}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--ivory-muted)] mb-3">
              对角线=对子 | 上三角=同花 | 下三角=非同花 | 绿色=在范围内
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
            以上范围基于 6-max 现金局近似 GTO 策略，实际范围会根据对手倾向和筹码深度有所调整。
          </p>
          <p className="mt-1">
            悬停网格中的格子可查看手牌详情，绿色表示该手牌在当前范围中。
          </p>
        </div>
      </div>
    </div>
  );
}
