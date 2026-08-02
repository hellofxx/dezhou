import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { GAME_VARIANT_CONFIGS } from '@/shared/constants/poker';
import type { GameVariant } from '@/shared/types/poker';
import { useProgressStore } from '@/features/progress/store';

interface GameVariantSelectorProps {
  compact?: boolean;
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

const VARIANT_DESCRIPTIONS: Record<GameVariant, { zh: string; en: string }> = {
  standard: { zh: '经典52张牌，全球最流行的扑克变体', en: 'Classic 52-card deck, the world\'s most popular poker variant' },
  'short-deck': { zh: '36张牌（6-A），顺子>三条，同花>葫芦', en: '36 cards (6-A), straight > trips, flush > full house' },
  'heads-up': { zh: '1v1 单挑对决，纯策略博弈', en: '1v1 duel, pure strategy battle' },
};

export function GameVariantSelector({ compact = false, onChange }: GameVariantSelectorProps) {
  const { t, i18n } = useTranslation();
  const currentVariant = useProgressStore((s) => s.currentGameVariant);
  const setGameVariant = useProgressStore((s) => s.setGameVariant);
  const lang = i18n.language as 'zh' | 'en';

  const variants: GameVariant[] = ['standard', 'short-deck', 'heads-up'];

  const handleSelect = (variant: GameVariant) => {
    setGameVariant(variant);
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
              aria-label={t(`gameVariant.${variant === 'short-deck' ? 'shortDeck' : variant === 'heads-up' ? 'headsUp' : 'standard'}`)}
            >
              <span className="text-sm leading-none">{VARIANT_ICONS[variant]}</span>
              <span className="hidden sm:inline">
                {t(`gameVariant.${variant === 'short-deck' ? 'shortDeck' : variant === 'heads-up' ? 'headsUp' : 'standard'}`)}
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
        const i18nKey = variant === 'short-deck' ? 'shortDeck' : variant === 'heads-up' ? 'headsUp' : 'standard';

        return (
          <button
            key={variant}
            onClick={() => handleSelect(variant)}
            className={cn(
              'relative flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all',
              isActive
                ? 'border-[var(--brass-bright)] bg-[var(--brass-bright)]/10 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                : 'border-[var(--walnut-border)] bg-[var(--felt)] hover:border-[var(--brass)]/40 hover:bg-[var(--felt)]/80'
            )}
            aria-label={t(`gameVariant.${variant === 'short-deck' ? 'shortDeck' : variant === 'heads-up' ? 'headsUp' : 'standard'}`)}
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
                <span className="ml-auto h-2 w-2 rounded-full bg-[var(--brass-bright)] shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
              )}
            </div>
            <p className="text-xs text-[var(--ivory-muted)] leading-relaxed">
              {VARIANT_DESCRIPTIONS[variant][lang] || VARIANT_DESCRIPTIONS[variant].zh}
            </p>
            <p className="text-[10px] text-[var(--ivory-muted)]/60">
              {config.deckSize} {lang === 'zh' ? '张牌' : 'cards'} · {config.minPlayers}-{config.maxPlayers} {lang === 'zh' ? '人' : 'players'}
            </p>
          </button>
        );
      })}
    </div>
  );
}
