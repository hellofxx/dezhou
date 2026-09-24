import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowUpCircle, ArrowDownCircle, Minus } from 'lucide-react';
import { DIFFICULTY_THRESHOLDS } from '../../constants';
import { transitionStandard } from '@/shared/utils/motion';

interface DifficultyIndicatorProps {
  currentDifficulty: 'beginner' | 'intermediate' | 'advanced';
  accuracy: number;
  sessionsCount: number;
}

interface LevelDef {
  id: 'beginner' | 'intermediate' | 'advanced';
  label: string;
  colorVar: string;
  dotClass: string;
}

// Difficulty ladder: sage (calm) → gold (warming up) → clay (under pressure).
// Avoids traffic-light green/yellow/red — fits the card-room palette.
const LEVELS: LevelDef[] = [
  { id: 'beginner', label: 'beginner', colorVar: 'var(--sage)', dotClass: 'beginner' },
  { id: 'intermediate', label: 'intermediate', colorVar: 'var(--brass)', dotClass: 'intermediate' },
  { id: 'advanced', label: 'advanced', colorVar: 'var(--clay)', dotClass: 'advanced' },
];

export default function DifficultyIndicator({
  currentDifficulty,
  accuracy,
  sessionsCount,
}: DifficultyIndicatorProps) {
  const { t } = useTranslation();
  const suggestion = getSuggestion(accuracy, sessionsCount, t);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={transitionStandard}
    >
      <div className="difficulty-ladder" role="group" aria-label={t('progress.difficulty.label')}>
        <span className="dl-label">{t('progress.difficulty.label')}</span>
        <div className="dl-track">
          {LEVELS.map((level, i) => {
            const active = level.id === currentDifficulty;
            return (
              <Fragment key={level.id}>
                {i > 0 && <div className="dl-line" aria-hidden />}
                <div
                  className={`dl-step ${level.dotClass}${active ? ' active' : ''}`}
                  aria-current={active ? 'step' : undefined}
                >
                  <span className="dl-dot" style={active ? { borderColor: level.colorVar } : undefined} />
                  <span className="dl-step-name">{t(`progress.difficulty.${level.label}`)}</span>
                </div>
              </Fragment>
            );
          })}
        </div>
        {suggestion && (
          <div className="dl-suggestion">
            {suggestion.icon}
            <span>{suggestion.text}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function getSuggestion(
  accuracy: number,
  sessionsCount: number,
  t: (key: string) => string,
): { text: string; icon: React.ReactNode } | null {
  if (sessionsCount < 5) {
    return {
      text: t('progress.difficulty.needMore'),
      icon: <Minus className="w-3 h-3 text-[var(--ivory-muted)]" />,
    };
  }
  if (accuracy > DIFFICULTY_THRESHOLDS.advanced && sessionsCount > DIFFICULTY_THRESHOLDS.upgradeMinSessions) {
    return {
      text: t('progress.difficulty.upgrade'),
      icon: <ArrowUpCircle className="w-3 h-3 text-[var(--sage)]" />,
    };
  }
  if (accuracy < DIFFICULTY_THRESHOLDS.downshift) {
    return {
      text: t('progress.difficulty.downshift'),
      icon: <ArrowDownCircle className="w-3 h-3 text-[var(--brass-bright)]" />,
    };
  }
  return {
    text: t('progress.difficulty.fits'),
    icon: <Minus className="w-3 h-3 text-[var(--brass)]" />,
  };
}
