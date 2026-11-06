import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import { transitionStandard } from '@/shared/utils/motion';
import type { MasteryState, MasterySummary } from '@/shared/types/academy';

export interface AcademyMasteryLabels {
  mastered: string;
  passing: string;
  needsReview: string;
  untested: string;
  total: string;
}

export interface AcademyMasteryWeakest {
  /** 最弱项显示名（只作可访问名补充，不占版面） */
  label: string;
  /** 跳转路由（由各院适配器拼好） */
  route: string;
  /** CTA 可见文案 */
  ctaLabel: string;
  onNavigate: (route: string) => void;
}

export interface AcademyMasteryCardProps {
  title: string;
  subtitle?: string;
  /** 掌握度汇总（首次成绩口径由调用方解析后传入，本卡只展示） */
  summary: MasterySummary;
  labels: AcademyMasteryLabels;
  /** 卡片底部附加区（理论学院把检查点入口放这里） */
  footer?: ReactNode;
  weakest?: AcademyMasteryWeakest;
  /** section 的可访问名（缺省用 title） */
  ariaLabel?: string;
}

/** 四档固定顺序：已掌握 → 通过 → 待复习 → 未测（DESIGN.md §5 色阶：success / brass / terra / walnut） */
const MASTERY_ROW_ORDER: readonly MasteryState[] = ['mastered', 'passing', 'needsReview', 'untested'];

const MASTERY_ROW_STYLE: Record<MasteryState, { icon: LucideIcon; tone: string }> = {
  mastered: {
    icon: Trophy,
    tone: 'bg-[var(--poker-success)]/12 text-[var(--poker-success)]',
  },
  passing: {
    icon: CheckCircle2,
    tone: 'bg-[var(--brass-bright)]/12 text-[var(--brass-bright)]',
  },
  needsReview: {
    icon: AlertTriangle,
    tone: 'bg-[var(--poker-terra)]/15 text-[var(--poker-terra-bright)]',
  },
  untested: {
    icon: CircleDashed,
    tone: 'bg-[var(--walnut-raised)] text-[var(--ivory-dim)]',
  },
};

/**
 * 学院掌握度卡（理论章节 / 策略课时共用）。
 *
 * 只读 props：不调用解锁门禁、不写 store（掌握度只展示，不改变解锁）。
 * 统计范围由调用方先收窄（例如理论剔除增补章），本卡不感知业务筛选。
 * 四档顺序固定，长标签与计数各占一端，计数一律 font-numeric。
 */
export function AcademyMasteryCard({
  title,
  subtitle,
  summary,
  labels,
  footer,
  weakest,
  ariaLabel,
}: AcademyMasteryCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionStandard}
      aria-label={ariaLabel ?? title}
    >
      <SectionLabel as="h2" className="mb-2.5 px-1">
        {title}
      </SectionLabel>

      <div className="panel space-y-2.5">
        {subtitle ? (
          <p className="text-xs leading-relaxed text-[var(--ivory-muted)]">{subtitle}</p>
        ) : null}

        <ul className="space-y-2">
          {MASTERY_ROW_ORDER.map((state) => {
            const row = MASTERY_ROW_STYLE[state];
            const Icon = row.icon;
            return (
              <li key={state} data-mastery-state={state} className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                    row.tone
                  )}
                  aria-hidden="true"
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="min-w-0 flex-1 text-xs text-[var(--ivory-muted)]">
                  {labels[state]}
                </span>
                <span className="font-numeric text-sm text-[var(--ivory)]">{summary[state]}</span>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3 border-t border-[var(--walnut-border)]/60 pt-1.5">
          <span className="min-w-0 flex-1 text-xs text-[var(--ivory-muted)]">{labels.total}</span>
          <span className="font-numeric text-sm text-[var(--ivory)]">{summary.total}</span>
        </div>

        {weakest ? (
          <button
            type="button"
            onClick={() => weakest.onNavigate(weakest.route)}
            aria-label={`${weakest.ctaLabel} · ${weakest.label}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs font-semibold text-[var(--brass-bright)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
          >
            <span className="min-w-0 truncate">{weakest.ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </button>
        ) : null}

        {footer ? (
          <div className="border-t border-[var(--walnut-border)]/60 pt-1.5">{footer}</div>
        ) : null}
      </div>
    </motion.section>
  );
}
