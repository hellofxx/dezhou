import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Calculator, ClipboardList, Gamepad2, Puzzle, Target, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProgressState } from '@/features/progress/api';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';

/**
 * DrillHub — 训练枢纽。
 *
 * 四张训练台卡片（范围 / 赔率 / GTO / 谜题），`?mode=` 决定哪张被高亮，
 * 让导航、学习旅程与进度页可以「带意图」地把用户送进正确的那张台子。
 * 底部「今日弱项」只读 progress 公共 API（`@/features/progress/api`），
 * 不做跨模块深引，也不自己维护训练记录。
 */

type DrillMode = 'range' | 'odds' | 'gto' | 'puzzle';

interface DrillEntry {
  mode: DrillMode;
  href: string;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  accent: 'brass' | 'info' | 'frost' | 'success';
}

const DRILLS: DrillEntry[] = [
  {
    mode: 'range',
    href: '/drill/range',
    icon: Target,
    titleKey: 'rangeTrainer.drillHub.range',
    descKey: 'rangeTrainer.drillHub.rangeDesc',
    accent: 'brass',
  },
  {
    mode: 'odds',
    href: '/drill/odds',
    icon: Calculator,
    titleKey: 'rangeTrainer.drillHub.odds',
    descKey: 'rangeTrainer.drillHub.oddsDesc',
    accent: 'info',
  },
  {
    mode: 'gto',
    href: '/gto-simulator',
    icon: Gamepad2,
    titleKey: 'rangeTrainer.drillHub.gto',
    descKey: 'rangeTrainer.drillHub.gtoDesc',
    accent: 'frost',
  },
  {
    mode: 'puzzle',
    href: '/drill/puzzle',
    icon: Puzzle,
    titleKey: 'rangeTrainer.drillHub.puzzle',
    descKey: 'rangeTrainer.drillHub.puzzleDesc',
    accent: 'success',
  },
];

const MODES: readonly DrillMode[] = ['range', 'odds', 'gto', 'puzzle'];

/** 弱项统计的模块名 → 导航文案 key（nav 属 core 命名空间，任何路由可用） */
const MODULE_LABEL_KEYS: Record<string, string> = {
  'range-trainer': 'nav.rangeTrainer',
  'pot-odds': 'nav.potOdds',
  'gto-simulator': 'nav.gtoSimulator',
  'puzzle-trainer': 'nav.puzzle',
};

/** 低于该题量的模块不参与弱项判定，避免 1 题 0 分被当成弱项 */
const WEAKNESS_MIN_QUESTIONS = 10;

function normalizeMode(raw: string | null): DrillMode | null {
  if (raw === null) return null;
  return MODES.find((mode) => mode === raw) ?? null;
}

export default function DrillHub() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const activeMode = normalizeMode(searchParams.get('mode'));

  const records = useProgressState((s) => s.records);

  const weakest = useMemo(() => {
    const tally = new Map<string, { total: number; correct: number }>();
    for (const record of records) {
      const entry = tally.get(record.module) ?? { total: 0, correct: 0 };
      tally.set(record.module, {
        total: entry.total + record.result.totalQuestions,
        correct: entry.correct + record.result.correctAnswers,
      });
    }

    let found: { module: string; accuracy: number } | null = null;
    for (const [module, entry] of tally) {
      if (entry.total < WEAKNESS_MIN_QUESTIONS) continue;
      const accuracy = entry.correct / entry.total;
      if (found === null || accuracy < found.accuracy) found = { module, accuracy };
    }
    return found;
  }, [records]);

  const weakestLabelKey = weakest === null ? undefined : MODULE_LABEL_KEYS[weakest.module];

  return (
    <div className="h-full overflow-auto">
      <div className="py-4 space-y-4">
        <header>
          <h2 className="text-2xl font-bold text-[var(--ivory)]">{t('rangeTrainer.drillHub.title')}</h2>
          <p className="mt-1 text-sm text-[var(--ivory-dim)]">{t('rangeTrainer.drillHub.subtitle')}</p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0">
          {DRILLS.map((drill) => {
            const Icon = drill.icon;
            const isActive = drill.mode === activeMode;
            return (
              <li key={drill.mode} className="min-w-0">
                <Link
                  to={drill.href}
                  data-active={isActive ? 'true' : undefined}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn('drill-hub-card', FOCUS_RING)}
                >
                  <span className="drill-hub-head">
                    <span className="drill-hub-icon" data-accent={drill.accent} aria-hidden="true">
                      <Icon className="w-6 h-6" />
                    </span>
                    <span className="drill-hub-title">{t(drill.titleKey)}</span>
                  </span>
                  <span className="drill-hub-desc">{t(drill.descKey)}</span>
                  <span className="drill-hub-cta">
                    {t('rangeTrainer.drillHub.start')}
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <section className="panel" aria-labelledby="drill-hub-weakness">
          <div className="flex flex-wrap items-start gap-3">
            <span className="drill-hub-icon" data-accent="brass" aria-hidden="true">
              <TrendingDown className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-[12rem]">
              <h3 id="drill-hub-weakness" className="panel-title mb-1">
                {t('rangeTrainer.drillHub.weakness.title')}
              </h3>
              <p className="m-0 text-xs leading-relaxed text-[var(--ivory-muted)]">
                {weakest === null
                  ? t('rangeTrainer.drillHub.weakness.empty')
                  : t('rangeTrainer.drillHub.weakness.summary', {
                      module: weakestLabelKey ? t(weakestLabelKey) : weakest.module,
                      accuracy: `${Math.round(weakest.accuracy * 100)}%`,
                    })}
              </p>
            </div>
            <Link
              to="/progress?tab=overview"
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-[var(--walnut-border)] px-3 text-xs font-semibold text-[var(--ivory-dim)] transition-colors hover:border-[var(--brass)]/50 hover:text-[var(--ivory)]',
                FOCUS_RING,
              )}
            >
              {t('rangeTrainer.drillHub.weakness.cta')}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <div className="flex justify-end">
          <Link
            to="/hand-history"
            className={cn(
              'inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-[var(--ivory-muted)] transition-colors hover:text-[var(--brass-bright)]',
              FOCUS_RING,
            )}
          >
            <ClipboardList className="w-4 h-4" aria-hidden="true" />
            {t('rangeTrainer.drillHub.review')}
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
