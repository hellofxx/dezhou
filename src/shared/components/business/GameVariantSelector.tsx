import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { GAME_VARIANT_CONFIGS } from '@/shared/constants/poker';
import type { GameVariant } from '@/shared/types/poker';

// PLAT-02 修复：改为受控组件（props 注入 currentVariant/onChange），
// 解除对 features/progress/store 的直接依赖（shared 不依赖 feature 的分层约束）。
// PLAT-03 修复：VARIANT_DESCRIPTIONS 双语双轨改为 i18n key（gameVariant.desc* / deckSize / players）。
interface GameVariantSelectorProps {
  compact?: boolean;
  /** 当前变体（受控值），由使用方从 progress store 读取传入 */
  currentVariant: GameVariant;
  /** 变体切换回调，由使用方调用 progress store 的 setGameVariant */
  onChange?: (variant: GameVariant) => void;
}

const VARIANT_ICONS: Record<GameVariant, string> = {
  standard: '🃏',
  'short-deck': '⚡',
  'heads-up': '🤺',
};

const VARIANT_BADGES: Partial<Record<GameVariant, string>> = {
  'short-deck': '6+',
};

export function GameVariantSelector({ compact = false, currentVariant, onChange }: GameVariantSelectorProps) {
  const { t } = useTranslation();

  const variants: GameVariant[] = ['standard', 'short-deck', 'heads-up'];

  const i18nKeyFor = (variant: GameVariant) =>
    variant === 'short-deck' ? 'shortDeck' : variant === 'heads-up' ? 'headsUp' : 'standard';

  const handleSelect = (variant: GameVariant) => {
    onChange?.(variant);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 rounded-lg bg-[var(--walnut-raised)]/50 p-1">
        {variants.map((variant) => {
          const isActive = currentVariant === variant;
          return (
            <button
              key={variant}
              onClick={() => handleSelect(variant)}
              className={cn(
                'relative flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all',
                isActive
                  ? 'bg-[var(--brass-bright)] text-[var(--felt-deep)] shadow-sm'
                  : 'text-[var(--ivory-muted)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-raised)]'
              )}
              aria-label={t(`gameVariant.${i18nKeyFor(variant)}`)}
            >
              <span className="text-sm leading-none">{VARIANT_ICONS[variant]}</span>
              <span className="hidden sm:inline">
                {t(`gameVariant.${i18nKeyFor(variant)}`)}
              </span>
              {VARIANT_BADGES[variant] && (
                <span className={cn(
                  'absolute -top-1 -right-1 rounded-full px-1 text-[8px] font-bold leading-tight',
                  isActive
                    ? 'bg-[var(--felt-deep)] text-[var(--brass-bright)]'
                    : 'bg-[var(--brass)]/30 text-[var(--brass-bright)]'
                )}>
                  {VARIANT_BADGES[variant]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {variants.map((variant) => {
        const config = GAME_VARIANT_CONFIGS[variant];
        const isActive = currentVariant === variant;
        const i18nKey = i18nKeyFor(variant);

        return (
          <button
            key={variant}
            onClick={() => handleSelect(variant)}
            className={cn(
              'relative flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all',
              isActive
                ? 'border-[var(--brass-bright)] bg-[var(--brass-bright)]/10 shadow-[var(--shadow-brass-glow)]'
                : 'border-[var(--walnut-border)] bg-[var(--felt)] hover:border-[var(--brass)]/40 hover:bg-[var(--felt)]/80'
            )}
            aria-label={t(`gameVariant.${i18nKey}`)}
          >
            <div className="flex items-center gap-2 w-full">
              <span className="text-xl">{VARIANT_ICONS[variant]}</span>
              <span className={cn(
                'text-sm font-semibold',
                isActive ? 'text-[var(--brass-bright)]' : 'text-[var(--ivory)]'
              )}>
                {t(`gameVariant.${i18nKey}`)}
              </span>
              {VARIANT_BADGES[variant] && (
                <span className="ml-auto rounded-full bg-[var(--brass)]/20 px-1.5 py-0.5 text-[10px] font-bold text-[var(--brass-bright)]">
                  {VARIANT_BADGES[variant]}
                </span>
              )}
              {isActive && (
                <span className="ml-auto h-2 w-2 rounded-full bg-[var(--brass-bright)] shadow-[var(--shadow-brass-glow-dot)]" />
              )}
            </div>
            <p className="text-xs text-[var(--ivory-muted)] leading-relaxed">
              {t(`gameVariant.desc${i18nKey}`)}
            </p>
            <p className="text-[10px] text-[var(--ivory-muted)]/60">
              {config.deckSize} {t('gameVariant.deckSize')} · {config.minPlayers}-{config.maxPlayers} {t('gameVariant.players')}
            </p>
          </button>
        );
      })}
    </div>
  );
}
