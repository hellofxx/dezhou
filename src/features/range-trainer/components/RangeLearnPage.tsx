import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/shared/components/layout/BackLink';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { BookOpen } from 'lucide-react';
import type { GameVariant, HandNotation } from '@/shared/types/poker';
import type { RangePreset } from '../types';
import { RangeGrid } from './RangeGrid';
import { RangeSelector } from './RangeSelector';
import { RangeInfo } from './RangeInfo';
import { useRangeTrainerStore } from '../store';

const EMPTY_HANDS: HandNotation[] = [];

interface LearnRangeInfoProps {
  preset: RangePreset | null;
  variant: GameVariant;
}

/** 悬停状态只驱动信息卡，避免父页与范围选择器随之重渲染。 */
function LearnRangeInfo({ preset, variant }: LearnRangeInfoProps) {
  const highlightedHand = useRangeTrainerStore((state) => state.learnState.highlightedHand);
  return (
    <RangeInfo
      selectedHands={preset?.hands ?? EMPTY_HANDS}
      highlightedHand={highlightedHand}
      preset={preset}
      variant={variant}
    />
  );
}

interface LearnRangeGridProps {
  selectedHands: HandNotation[];
  variant: GameVariant;
}

/** 网格自身订阅悬停状态与写入 action，父页仅订阅稳定的范围配置字段。 */
function LearnRangeGrid({ selectedHands, variant }: LearnRangeGridProps) {
  const highlightedHand = useRangeTrainerStore((state) => state.learnState.highlightedHand);
  const setHighlightedHand = useRangeTrainerStore((state) => state.setHighlightedHand);
  return (
    <RangeGrid
      selectedHands={selectedHands}
      highlightedHand={highlightedHand}
      onCellHover={setHighlightedHand}
      variant={variant}
      className="max-w-[640px]"
    />
  );
}

export default function RangeLearnPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const selectedPreset = useRangeTrainerStore((state) => state.learnState.selectedPreset);
  const selectedPosition = useRangeTrainerStore((state) => state.learnState.selectedPosition);
  const selectedActionType = useRangeTrainerStore((state) => state.learnState.selectedActionType);
  const setSelectedPreset = useRangeTrainerStore((state) => state.setSelectedPreset);
  const setSelectedPosition = useRangeTrainerStore((state) => state.setSelectedPosition);
  const setSelectedActionType = useRangeTrainerStore((state) => state.setSelectedActionType);
  const presets = useRangeTrainerStore((state) => state.presets);
  const gameVariant = useRangeTrainerStore((state) => state.gameVariant);

  const selectedHands = selectedPreset?.hands ?? EMPTY_HANDS;

  // 自动选择第一个匹配的预设
  // P1A-11 修复：改用 store 的变体化 presets（含 ADVANCED / HU / 短牌 / 4-max），
  // 不再直接读 6-max 基础 PRESET_RANGES
  React.useEffect(() => {
    if (!selectedPreset) {
      const match = presets.find(
        (p) => p.position === selectedPosition && p.actionType === selectedActionType
      );
      if (match) setSelectedPreset(match);
    }
  }, [selectedPreset, selectedPosition, selectedActionType, presets, setSelectedPreset]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackLink
              onClick={() => navigate('/drill/range')}
              label={t('common.ui.back')}
              variant="button"
              className="hidden md:inline-flex"
            />
            <div>
              <h2 className="text-2xl font-bold text-[var(--ivory)] flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[var(--brass-text)]" />
                {t('rangeTrainer.learn')}
              </h2>
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
                  selectedPosition={selectedPosition}
                  selectedActionType={selectedActionType}
                  onPositionChange={setSelectedPosition}
                  onActionTypeChange={setSelectedActionType}
                  presets={presets}
                  onPresetSelect={setSelectedPreset}
                />
              </CardContent>
            </Card>

            <Card className="bg-[var(--surface)] border-[var(--surface-raised)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('rangeTrainer.rangeInfo.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <LearnRangeInfo preset={selectedPreset} variant={gameVariant} />
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
              <LearnRangeGrid selectedHands={selectedHands} variant={gameVariant} />
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
