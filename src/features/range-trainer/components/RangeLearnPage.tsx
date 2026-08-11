import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { RangeGrid } from './RangeGrid';
import { RangeSelector } from './RangeSelector';
import { RangeInfo } from './RangeInfo';
import { useRangeTrainerStore } from '../store';

export default function RangeLearnPage() {
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
  } = useRangeTrainerStore();

  const selectedHands = learnState.selectedPreset?.hands ?? [];

  const handlePresetSelect = (preset: typeof learnState.selectedPreset) => {
    setSelectedPreset(preset);
  };

  // 自动选择第一个匹配的预设
  // P1A-11 修复：改用 store 的变体化 presets（含 ADVANCED / HU / 短牌 / 4-max），
  // 不再直接读 6-max 基础 PRESET_RANGES
  React.useEffect(() => {
    if (!learnState.selectedPreset) {
      const match = presets.find(
        (p) => p.position === learnState.selectedPosition && p.actionType === learnState.selectedActionType
      );
      if (match) setSelectedPreset(match);
    }
  }, [learnState.selectedPreset, learnState.selectedPosition, learnState.selectedActionType, presets, setSelectedPreset]);

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
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--ivory)] flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[var(--brass)]" />
                {t('rangeTrainer.learn')}
              </h1>
              <p className="text-sm text-[var(--ivory-dim)] mt-0.5">
                {t('rangeTrainer.learnSubtitle')}
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
                <CardTitle className="text-base">{t('rangeTrainer.rangeSelect.title')}</CardTitle>
                <CardDescription>{t('rangeTrainer.rangeSelect.hint')}</CardDescription>
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
                <CardTitle className="text-base">{t('rangeTrainer.rangeInfo.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <RangeInfo
                  selectedHands={selectedHands}
                  highlightedHand={learnState.highlightedHand}
                  preset={learnState.selectedPreset}
                  variant={gameVariant}
                />
              </CardContent>
            </Card>
          </div>

          {/* 右侧网格 */}
          <Card className="bg-[var(--surface)] border-[var(--surface-raised)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('rangeTrainer.rangeInfo.matrix13')}</CardTitle>
              <CardDescription>
                {t('rangeTrainer.rangeInfo.matrixLegend')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RangeGrid
                selectedHands={selectedHands}
                highlightedHand={learnState.highlightedHand}
                onCellHover={setHighlightedHand}
                variant={gameVariant}
                className="max-w-[640px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* 底部说明 */}
        <div className="text-center text-xs text-[var(--ivory-dim)] pb-4">
          <p>{t('rangeTrainer.footer.note')}</p>
        </div>
      </div>
    </div>
  );
}
