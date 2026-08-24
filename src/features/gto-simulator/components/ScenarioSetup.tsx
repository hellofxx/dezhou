import { useTranslation } from 'react-i18next';
import { getPositionsForPlayerCount } from '@/shared/types/position';
import type { GameType, Difficulty } from '@/shared/types/common';
import type { GameVariant } from '@/shared/types/poker';
import { GAME_VARIANT_CONFIGS, getPlayerCountOptions } from '@/shared/constants/poker';
import { useGTOSimulatorStore } from '../store';
import { cn } from '@/shared/utils';
import { OPPONENT_PROFILES, getOpponentProfile } from '@/shared/data/opponentProfiles';

// label/desc 存 i18n key（gto.setup.*），渲染时 t() 解析
const GAME_TYPES: { value: GameType; label: string }[] = [
  { value: 'cash', label: 'gto.setup.gameTypeCash' },
  { value: 'tournament', label: 'gto.setup.gameTypeTournament' },
  { value: 'sit-and-go', label: 'gto.setup.gameTypeSnG' },
];

const VARIANT_OPTIONS: { value: GameVariant; label: string }[] = [
  { value: 'standard', label: 'gto.setup.variantStandard' },
  { value: 'short-deck', label: 'gto.setup.variantShortDeck' },
];

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'beginner', label: 'gto.setup.difficultyBeginner', desc: 'gto.setup.difficultyBeginnerDesc' },
  { value: 'intermediate', label: 'gto.setup.difficultyIntermediate', desc: 'gto.setup.difficultyIntermediateDesc' },
  { value: 'advanced', label: 'gto.setup.difficultyAdvanced', desc: 'gto.setup.difficultyAdvancedDesc' },
];

const SCENARIO_COUNTS = [10, 20, 30];

interface ScenarioSetupProps {
  onStart: () => void;
}

export function ScenarioSetup({ onStart }: ScenarioSetupProps) {
  const { t } = useTranslation();
  const { config, setConfig, exploitMode, selectedOpponent, setExploitMode, setSelectedOpponent } = useGTOSimulatorStore();
  const positions = getPositionsForPlayerCount(config.playerCount);
  const playerCountOptions = getPlayerCountOptions(config.gameVariant);

  const opponentIds = Object.keys(OPPONENT_PROFILES).filter((id) => id !== 'unknown');
  const selectedProfile = selectedOpponent ? getOpponentProfile(selectedOpponent) : null;

  const handleVariantChange = (variant: GameVariant) => {
    const cfg = GAME_VARIANT_CONFIGS[variant];
    const newPlayerCount = Math.min(Math.max(config.playerCount, cfg.minPlayers), cfg.maxPlayers);
    const newPositions = getPositionsForPlayerCount(newPlayerCount);
    const newPos = newPositions.includes(config.position) ? config.position : newPositions[0]!;
    setConfig({ gameVariant: variant, playerCount: newPlayerCount, position: newPos });
  };

  return (
    <div className="space-y-6">
      {/* 双列表单布局：左列=模式与变体，右列=桌位与难度，充分利用宽屏空间 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左列 */}
        <div className="space-y-6">
          {/* 训练模式 */}
          <div className="space-y-2">
            <label className="text-sm font-display font-semibold text-[var(--ivory-dim)] tracking-wide">{t('gto.setup.modeLabel')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setExploitMode(false)}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all border',
                  !exploitMode
                    ? 'bg-[var(--brass)] border-[var(--brass)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--walnut-raised)]/40 border-transparent text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]'
                )}
              >
                {t('gto.setup.gtoMode')}
              </button>
              <button
                onClick={() => setExploitMode(true)}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all border',
                  exploitMode
                    ? 'bg-[var(--sage)]/20 border-[var(--sage)] text-[var(--sage)]'
                    : 'bg-[var(--walnut-raised)]/40 border-transparent text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]'
                )}
              >
                {t('gto.setup.exploitMode')}
              </button>
            </div>
            {exploitMode && (
              <p className="text-xs text-[var(--sage)] bg-[var(--sage)]/10 rounded-md px-3 py-1.5">
                {t('gto.setup.exploitHint')}
              </p>
            )}
          </div>

          {/* 对手选择（仅 Exploit 模式） */}
          {exploitMode && (
            <div className="space-y-2">
              <label className="text-sm font-display font-semibold text-[var(--ivory-dim)] tracking-wide">{t('gto.setup.opponentLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                {opponentIds.map((id) => {
                  const profile = OPPONENT_PROFILES[id]!;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedOpponent(id)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-display font-medium transition-all border text-center',
                        selectedOpponent === id
                          ? 'border-[var(--brass)] bg-[var(--brass)]/15 text-[var(--brass-bright)]'
                          : 'border-[var(--walnut-border)]/40 bg-[var(--walnut-raised)]/40 text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]'
                      )}
                    >
                      <span className="mr-1">{profile.icon}</span>
                      {profile.shortName}
                    </button>
                  );
                })}
              </div>
              {selectedProfile && (
                <div className="rounded-lg bg-black/20 p-3 space-y-1">
                  <div className="text-xs font-display font-semibold" style={{ color: selectedProfile.color }}>
                    {selectedProfile.icon}{' '}
                    {t(`gto.setup.opponentProfile.${selectedProfile.id}.name`, { defaultValue: selectedProfile.name })}
                  </div>
                  <div className="text-xs text-[var(--ivory-muted)]">
                    {t(`gto.setup.opponentProfile.${selectedProfile.id}.description`, { defaultValue: selectedProfile.description })}
                  </div>
                  <div className="flex gap-3 text-xs font-numeric text-[var(--ivory-dim)]">
                    <span>VPIP: {selectedProfile.stats.vpip}%</span>
                    <span>PFR: {selectedProfile.stats.pfr}%</span>
                    <span>3-Bet: {selectedProfile.stats.threeBetPercent}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 游戏变体 */}
          <div className="space-y-2">
            <label className="text-sm font-display font-semibold text-[var(--ivory-dim)] tracking-wide">{t('gto.setup.variantLabel')}</label>
            <div className="flex gap-2">
              {VARIANT_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  onClick={() => handleVariantChange(v.value)}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all border',
                    config.gameVariant === v.value
                      ? v.value === 'short-deck'
                        ? 'bg-[var(--sage)]/20 border-[var(--sage)] text-[var(--sage)]'
                        : 'bg-[var(--brass)] border-[var(--brass)] text-[var(--primary-foreground)]'
                      : 'bg-[var(--walnut-raised)]/40 border-transparent text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]'
                  )}
                >
                  {t(v.label)}
                </button>
              ))}
            </div>
            {config.gameVariant === 'short-deck' && (
              <p className="text-xs text-[var(--sage)] bg-[var(--sage)]/10 rounded-md px-3 py-1.5">
                {t('gto.setup.shortDeckHint')}
              </p>
            )}
          </div>
          {/* 游戏类型 */}
          <div className="space-y-2">
            <label className="text-sm font-display font-semibold text-[var(--ivory-dim)] tracking-wide">{t('gto.setup.gameTypeLabel')}</label>
            <div className="flex gap-2">
              {GAME_TYPES.map((gt) => (
                <button
                  key={gt.value}
                  onClick={() => setConfig({ gameType: gt.value })}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-display font-medium transition-all',
                    config.gameType === gt.value
                      ? 'bg-[var(--brass)] text-[var(--primary-foreground)]'
                      : 'bg-[var(--walnut-raised)]/40 text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]'
                  )}
                >
                  {t(gt.label)}
                </button>
              ))}
            </div>
          </div>

          {/* 有效筹码 */}
          <div className="space-y-2">
            <label className="text-sm font-display font-semibold text-[var(--ivory-dim)] tracking-wide">
              {t('gto.setup.effectiveStack')}: <span className="text-[var(--brass-bright)] font-numeric">{config.effectiveStack} BB</span>
            </label>
            <input
              type="range"
              min={20}
              max={200}
              step={10}
              value={config.effectiveStack}
              onChange={(e) => setConfig({ effectiveStack: Number(e.target.value) })}
              className="w-full h-2 bg-[var(--walnut-raised)] rounded-lg appearance-none cursor-pointer accent-[var(--brass)]"
            />
            <div className="flex justify-between text-xs text-[var(--ivory-muted)] font-numeric">
              <span>20 BB</span>
              <span>200 BB</span>
            </div>
          </div>

        </div>

        {/* 右列 */}
        <div className="space-y-6">
          {/* 位置选择 — sage to differentiate from brass CTAs */}
          <div className="space-y-2">
            <label className="text-sm font-display font-semibold text-[var(--ivory-dim)] tracking-wide">{t('gto.setup.positionLabel')}</label>
            <div className="flex flex-wrap gap-2">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setConfig({ position: pos })}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-display font-bold transition-all',
                    config.position === pos
                      ? 'bg-[var(--sage)] text-[var(--ivory)]'
                      : 'bg-[var(--walnut-raised)]/40 text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]'
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* 玩家人数 */}
          <div className="space-y-2">
            <label className="text-sm font-display font-semibold text-[var(--ivory-dim)] tracking-wide">{t('gto.setup.playerCountLabel')}</label>
            <div className="flex flex-wrap gap-2">
              {playerCountOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    const newPositions = getPositionsForPlayerCount(count);
                    const newPos = newPositions.includes(config.position) ? config.position : newPositions[0]!;
                    setConfig({ playerCount: count, position: newPos });
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-display font-medium transition-all',
                    config.playerCount === count
                      ? 'bg-[var(--brass)] text-[var(--primary-foreground)]'
                      : 'bg-[var(--walnut-raised)]/40 text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]'
                  )}
                >
                  {count}-max
                </button>
              ))}
            </div>
          </div>

          {/* 难度 */}
          <div className="space-y-2">
            <label className="text-sm font-display font-semibold text-[var(--ivory-dim)] tracking-wide">{t('gto.setup.difficultyLabel')}</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setConfig({ difficulty: d.value })}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm transition-all text-center border',
                    config.difficulty === d.value
                      ? 'bg-[var(--brass)]/15 border-[var(--brass)]/50 text-[var(--brass-bright)] font-display font-bold'
                      : 'bg-[var(--walnut-raised)]/40 border-[var(--walnut-border)]/40 text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]'
                  )}
                >
                  <div className="font-display font-semibold">{t(d.label)}</div>
                  <div className="text-xs opacity-80 mt-0.5">{t(d.desc)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 场景数量 */}
          <div className="space-y-2">
            <label className="text-sm font-display font-semibold text-[var(--ivory-dim)] tracking-wide">{t('gto.setup.scenarioCountLabel')}</label>
            <div className="flex gap-2">
              {SCENARIO_COUNTS.map((count) => (
                <button
                  key={count}
                  onClick={() => setConfig({ scenarioCount: count })}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-display font-medium font-numeric transition-all',
                    config.scenarioCount === count
                      ? 'bg-[var(--brass)] text-[var(--primary-foreground)]'
                      : 'bg-[var(--walnut-raised)]/40 text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]'
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 开始按钮 */}
      <button
        onClick={onStart}
        className="hover-bright w-full py-3 rounded-xl bg-[var(--brass)] text-[var(--primary-foreground)] font-display font-bold text-lg shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {t('gto.setup.startGtoTraining')}
      </button>
    </div>
  );
}
