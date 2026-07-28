import { motion } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, Minus } from 'lucide-react';

interface DifficultyIndicatorProps {
  currentDifficulty: 'beginner' | 'intermediate' | 'advanced';
  accuracy: number;
  sessionsCount: number;
}

// Difficulty ladder: sage (calm) → gold (warming up) → clay (under pressure).
// Avoids traffic-light green/yellow/red — fits the card-room palette.
const DIFFICULTY_CONFIG = {
  beginner: { label: '初级', color: 'text-[var(--sage)]', bg: 'bg-[var(--sage)]/12', border: 'border-[var(--sage)]/30' },
  intermediate: { label: '中级', color: 'text-[var(--gold)]', bg: 'bg-[var(--gold)]/12', border: 'border-[var(--gold)]/30' },
  advanced: { label: '高级', color: 'text-[var(--clay)]', bg: 'bg-[var(--clay)]/12', border: 'border-[var(--clay)]/30' },
};

export default function DifficultyIndicator({
  currentDifficulty,
  accuracy,
  sessionsCount,
}: DifficultyIndicatorProps) {
  const config = DIFFICULTY_CONFIG[currentDifficulty];
  const suggestion = getSuggestion(accuracy, sessionsCount);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`bg-[var(--felt)] border-[var(--walnut-border)]`}>
        <CardContent className="p-3 flex items-center gap-3">
          <div className={`shrink-0 w-10 h-10 rounded-md flex items-center justify-center ${config.bg} ${config.border} border`}>
            <span className={`font-display text-base ${config.color}`}>
              {config.label.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
              <span className="text-xs text-[var(--ivory-muted)]">难度</span>
            </div>
            {suggestion && (
              <div className="flex items-center gap-1 mt-0.5">
                {suggestion.icon}
                <span className="text-xs text-[var(--ivory-dim)]">{suggestion.text}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getSuggestion(accuracy: number, sessionsCount: number) {
  if (sessionsCount < 5) {
    return {
      text: '完成更多训练以获取建议',
      icon: <Minus className="w-3 h-3 text-[var(--ivory-muted)]" />,
    };
  }
  if (accuracy > 0.85 && sessionsCount > 20) {
    return {
      text: '表现出色，建议升级难度',
      icon: <ArrowUpCircle className="w-3 h-3 text-[var(--sage)]" />,
    };
  }
  if (accuracy < 0.5) {
    return {
      text: '建议降低难度巩固基础',
      icon: <ArrowDownCircle className="w-3 h-3 text-[var(--gold)]" />,
    };
  }
  return {
    text: '当前难度适合你',
    icon: <Minus className="w-3 h-3 text-[var(--brass)]" />,
  };
}
