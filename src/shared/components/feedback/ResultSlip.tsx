/**
 * 结果纸条（共享）：dealer-slip 材质的结果壳层。
 *
 * - overlay：Dialog 浮层（课程完成、范围/赔率/谜题/速训结算）
 * - page：独立整页结果（GTO `/gto-simulator/result/:sessionId`）
 *
 * 只负责纸张外壳、指标/徽章/导师寄语/详情槽与动作组；正确率环、错题表等
 * 业务内容由调用方注入。标题层级固定 h2：壳层 h1 是全站唯一一级标题。
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';
import { StatCard } from '@/shared/components/data-display/StatCard';
import { ResultActions, type ResultAction } from './ResultActions';
import { ResultHeader, type ResultTone } from './ResultHeader';
import { cn } from '@/shared/utils/cn';

export type ResultSlipPresentation = 'overlay' | 'page';

export interface ResultSlipMetric {
  label: string;
  value: string;
  icon?: ReactNode;
  accent?: 'brass' | 'success' | 'danger' | 'info';
}

export interface ResultSlipBadge {
  label: string;
  icon?: ReactNode;
  tone?: 'brass' | 'success' | 'info' | 'warning';
}

interface ResultSlipBaseProps {
  title: string;
  subtitle?: string;
  tone?: ResultTone;
  ring?: ReactNode;
  stamp?: string;
  metrics?: ResultSlipMetric[];
  badges?: ResultSlipBadge[];
  mentorQuote?: { text: string; author?: string };
  detail?: ReactNode;
  actions: ResultAction[];
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

export interface ResultSlipOverlayProps extends ResultSlipBaseProps {
  presentation?: 'overlay';
  open: boolean;
  onClose: () => void;
}

export interface ResultSlipPageProps extends ResultSlipBaseProps {
  presentation: 'page';
}

export type ResultSlipProps = ResultSlipOverlayProps | ResultSlipPageProps;

/** 指标强调色 → StatCard accent（StatCard 没有 danger/info 档，映射到中性/苔藓） */
const METRIC_ACCENT = {
  brass: 'gold',
  success: 'green',
  danger: 'default',
  info: 'sage',
} as const;

const BADGE_TONE_CLASS: Record<NonNullable<ResultSlipBadge['tone']>, string> = {
  brass: 'border-[var(--brass)]/40 bg-[var(--brass-glow)] text-[var(--brass-text)]',
  success: 'border-[var(--success)]/40 bg-[var(--success-bg)] text-[var(--sage-text)]',
  info: 'border-[var(--info)]/40 bg-[var(--info-bg)] text-[var(--info)]',
  warning: 'border-[var(--warning)]/40 bg-[var(--warning-bg)] text-[var(--brass-text)]',
};

interface ResultSlipBodyProps extends ResultSlipBaseProps {
  resolvedStamp: string;
}

function ResultSlipBody({
  title,
  subtitle,
  tone,
  ring,
  resolvedStamp,
  metrics,
  badges,
  mentorQuote,
  detail,
  actions,
}: ResultSlipBodyProps) {
  return (
    <div className="space-y-5">
      <ResultHeader
        headingLevel="h2"
        title={title}
        subtitle={subtitle}
        tone={tone}
        ring={ring}
      />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center rounded-sm border border-[var(--brass)]/40 bg-[var(--brass-glow)] px-3 py-1 font-display text-[11px] tracking-[0.18em] text-[var(--brass-text)]">
          {resolvedStamp}
        </span>
        {badges?.map((badge) => (
          <span
            key={badge.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm border px-3 py-1 text-[11px] font-semibold',
              BADGE_TONE_CLASS[badge.tone ?? 'brass'],
            )}
          >
            {badge.icon ? <span aria-hidden="true">{badge.icon}</span> : null}
            {badge.label}
          </span>
        ))}
      </div>

      {metrics && metrics.length > 0 ? (
        <div
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
          aria-label={title}
          role="group"
        >
          {metrics.map((metric) => (
            <StatCard
              key={metric.label}
              size="xl"
              surface="solid"
              valueFirst
              className="rounded-xl"
              contentClassName="p-4"
              icon={metric.icon}
              value={metric.value}
              label={metric.label}
              accent={METRIC_ACCENT[metric.accent ?? 'brass']}
            />
          ))}
        </div>
      ) : null}

      {mentorQuote ? (
        <blockquote className="rounded-lg border border-[var(--paper-rule)] bg-[var(--paper-raised)] p-4">
          <p className="m-0 text-sm leading-relaxed text-[var(--ivory-dim)]">
            {mentorQuote.text}
          </p>
          {mentorQuote.author ? (
            <footer className="mt-2 text-[11px] text-[var(--ivory-muted)]">
              — {mentorQuote.author}
            </footer>
          ) : null}
        </blockquote>
      ) : null}

      {detail}

      <ResultActions layout="stack" actions={actions} className="pt-1" />
    </div>
  );
}

export function ResultSlip(props: ResultSlipProps) {
  const { t } = useTranslation();
  const resolvedStamp = props.stamp ?? t('common.resultSlip.stamp');
  const body = <ResultSlipBody {...props} resolvedStamp={resolvedStamp} />;

  if (props.presentation === 'page') {
    return (
      <section
        className={cn('dealer-slip relative mx-auto w-full max-w-3xl p-6', props.className)}
        role="region"
        aria-label={props.title}
      >
        {body}
      </section>
    );
  }

  const { open, onClose, returnFocusRef } = props;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          'w-[calc(100vw-2rem)] max-w-2xl max-h-[86vh] overflow-hidden p-4 md:p-6',
          props.className,
        )}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocusRef?.current ?? document.getElementById('main-content');
          (target ?? document.body).focus();
        }}
      >
        {/* 可访问名不占用 heading 角色：可见标题由 ResultHeader 的 h2 承担 */}
        <DialogTitle asChild>
          <div className="sr-only">{props.title}</div>
        </DialogTitle>
        <div className="max-h-[76vh] overflow-y-auto pr-1 -mr-1">{body}</div>
      </DialogContent>
    </Dialog>
  );
}
