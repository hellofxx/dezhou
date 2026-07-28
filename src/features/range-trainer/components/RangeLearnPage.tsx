import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { RangeGrid } from './RangeGrid';
import { RangeSelector } from './RangeSelector';
import { RangeInfo } from './RangeInfo';
import { useRangeTrainerStore } from '../store';
import { PRESET_RANGES } from '../constants';

export default function RangeLearnPage() {
  const navigate = useNavigate();
  const {
    learnState,
    setSelectedPreset,
    setSelectedPosition,
    setSelectedActionType,
    setHighlightedHand,
    presets,
  } = useRangeTrainerStore();

  const selectedHands = learnState.selectedPreset?.hands ?? [];

  const handlePresetSelect = (preset: typeof learnState.selectedPreset) => {
    setSelectedPreset(preset);
  };

  // 自动选择第一个匹配的预设
  React.useEffect(() => {
    if (!learnState.selectedPreset) {
      const match = PRESET_RANGES.find(
        (p) => p.position === learnState.selectedPosition && p.actionType === learnState.selectedActionType
      );
      if (match) setSelectedPreset(match);
    }
  }, [learnState.selectedPosition, learnState.selectedActionType]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/range-trainer')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--ivory)] flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[var(--brass)]" />
                学习模式
              </h1>
              <p className="text-sm text-[var(--ivory-dim)] mt-0.5">
                浏览和学习各位置的标准开牌范围
              </p>
            </div>
          </div>
        </div>

        {/* 主体内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* 左侧面板 */}
          <div className="space-y-4">
            <Card className="bg-[var(--surface)] border-[var(--surface-raised)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">范围选择</CardTitle>
                <CardDescription>选择位置和动作类型查看标准范围</CardDescription>
              </CardHeader>
              <CardContent>
                <RangeSelector
                  selectedPosition={learnState.selectedPosition}
                  selectedActionType={learnState.selectedActionType}
                  onPositionChange={setSelectedPosition}
                  onActionTypeChange={setSelectedActionType}
                  presets={presets}
                  onPresetSelect={handlePresetSelect}
                />
              </CardContent>
            </Card>

            <Card className="bg-[var(--surface)] border-[var(--surface-raised)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">范围信息</CardTitle>
              </CardHeader>
              <CardContent>
                <RangeInfo
                  selectedHands={selectedHands}
                  highlightedHand={learnState.highlightedHand}
                  presetName={learnState.selectedPreset?.name}
                />
              </CardContent>
            </Card>
          </div>

          {/* 右侧网格 */}
          <Card className="bg-[var(--surface)] border-[var(--surface-raised)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">13×13 范围矩阵</CardTitle>
              <CardDescription>
                对角线=对子 | 上三角=同花 | 下三角=非同花 | 绿色=在范围内
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RangeGrid
                selectedHands={selectedHands}
                highlightedHand={learnState.highlightedHand}
                onCellHover={setHighlightedHand}
                className="max-w-[640px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* 底部说明 */}
        <div className="text-center text-xs text-[var(--ivory-dim)] pb-4">
          <p>以上范围基于 6-max 现金局近似 GTO 策略，实际范围会根据对手倾向和筹码深度有所调整。</p>
        </div>
      </div>
    </div>
  );
}
