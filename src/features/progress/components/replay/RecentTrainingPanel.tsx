import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Clock, History, Target } from 'lucide-react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Button } from '@/shared/components/ui/button';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';
import { useProgress } from '../../hooks/useProgress';
import { useModuleLabel } from '../../hooks/useModuleLabel';
import { resolveDisplayModuleKey } from '../../data/moduleLabels';
import type { TrainingRecord } from '../../types';

/**
 * RecentTrainingPanel — 进度中心「回放」页的最近训练卡。
 *
 * 从已下线的首页 Dashboard 平移而来（时间范围筛选 + 区间汇总 + 最近 5 条 + 相对时间），
 * 补上「全部手牌复盘」出口：手牌库属 hand-history 模块，本页只做链接，不 import 其组件。
 */

type TimeRange = '7d' | '30d' | '90d' | 'all';

const TIME_RANGE_KEYS: Record<TimeRange, string> = {
  '7d': 'progress.recentTraining.timeRange.7d',
  '30d': 'progress.recentTraining.timeRange.30d',
  '90d': 'progress.recentTraining.timeRange.90d',
  all: 'progress.recentTraining.timeRange.all',
};

const TIME_RANGE_DAYS: Record<TimeRange, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

const TIME_RANGES: readonly TimeRange[] = ['7d', '30d', '90d', 'all'];

export default function RecentTrainingPanel() {
  const { t } = useTranslation();
  const { records } = useProgress();
  const moduleLabel = useModuleLabel();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // records 按写入顺序追加，「最近训练」须严格按时间倒序，否则窗口内最早的一条会排在首位
  const filtered = useMemo(() => {
    const days = TIME_RANGE_DAYS[timeRange];
    const cutoff = days === null ? Number.NEGATIVE_INFINITY : Date.now() - days * 24 * 60 * 60 * 1000;
    return records.filter((record) => record.createdAt >= cutoff).toSorted((a, b) => b.createdAt - a.createdAt);
  }, [records, timeRange]);

  return (
    <section className="panel" aria-labelledby="recent-training-title">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 id="recent-training-title" className="panel-title mb-0">
          <History className="w-4 h-4" aria-hidden="true" />
          {t('progress.recentTraining.title')}
        </h3>
        <div
          role="tablist"
          aria-label={t('progress.recentTraining.timeRange.ariaLabel')}
          className="flex items-center gap-1 rounded-md bg-[var(--walnut-raised)]/60 p-0.5"
        >
          {TIME_RANGES.map((range) => {
            const active = timeRange === range;
            return (
              <button
                key={range}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-2 py-1 text-[10px] font-numeric rounded transition-colors min-h-11 sm:min-h-0',
                  FOCUS_RING,
                  active
                    ? 'bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold'
                    : 'text-[var(--ivory-muted)] hover:text-[var(--ivory)]',
                )}
              >
                {t(TIME_RANGE_KEYS[range])}
              </button>
            );
          })}
        </div>
      </div>

      <FilteredSummary records={filtered} />

      {filtered.length > 0 ? (
        <div className="space-y-1">
          {filtered.slice(0, 5).map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between gap-3 py-2 border-b border-[var(--walnut-border)]/40 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded bg-[var(--walnut-light)]/50 flex items-center justify-center shrink-0">
                  <Target className="w-3.5 h-3.5 text-[var(--brass-bright)]" aria-hidden="true" />
                </span>
                <span className="text-xs text-[var(--ivory)] truncate">
                  {moduleLabel(resolveDisplayModuleKey(record))}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[var(--ivory-muted)] font-numeric">
                  {formatRelative(record.createdAt, t)}
                </span>
                <span className="font-numeric text-xs text-[var(--brass-bright)] min-w-[44px] text-right">
                  {(record.result.accuracy * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          icon={<Clock className="w-8 h-8" />}
          title={t('progress.recentTraining.empty.title')}
          description={t('progress.recentTraining.empty.description')}
        />
      )}

      <div className="mt-3 flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to="/hand-history">
            {t('progress.recentTraining.viewAllReplays')}
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/** 当前时间范围内的关键统计 — 强化"决策辅助"价值 */
function FilteredSummary({ records }: { records: TrainingRecord[] }) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    if (records.length === 0) return { count: 0, questions: 0, accuracy: 0 };
    let questions = 0;
    let correct = 0;
    for (const record of records) {
      questions += record.result.totalQuestions;
      correct += record.result.correctAnswers;
    }
    return { count: records.length, questions, accuracy: questions > 0 ? correct / questions : 0 };
  }, [records]);

  return (
    <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-[var(--walnut-border)]/40">
      <Metric label={t('progress.recentTraining.sessions')} value={String(stats.count)} />
      <Metric label={t('progress.recentTraining.questions')} value={String(stats.questions)} />
      <Metric
        label={t('progress.recentTraining.accuracy')}
        value={`${(stats.accuracy * 100).toFixed(1)}%`}
        accent={stats.accuracy >= 0.7 ? 'success' : stats.accuracy < 0.5 ? 'danger' : 'brass'}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  accent = 'ivory',
}: {
  label: string;
  value: string;
  accent?: 'ivory' | 'brass' | 'success' | 'danger';
}) {
  const valueClass =
    accent === 'brass'
      ? 'text-[var(--brass-bright)]'
      : accent === 'success'
        ? 'text-[var(--poker-success)]'
        : accent === 'danger'
          ? 'text-[var(--danger-text)]'
          : 'text-[var(--ivory)]';
  return (
    <div className="flex flex-col items-start">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ivory-muted)]">{label}</span>
      <span className={`font-numeric text-base font-semibold mt-0.5 ${valueClass}`}>{value}</span>
    </div>
  );
}

/** 相对时间格式化（紧凑形式：今天/昨天/N 天前/N 周前/N 月前/N 年前） */
function formatRelative(
  timestamp: number,
  t: (key: string, options?: Record<string, number>) => string,
): string {
  const diff = Date.now() - timestamp;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return t('progress.recentTraining.justNow');
  if (diff < 2 * day) return t('progress.recentTraining.yesterday');
  if (diff < 7 * day) return t('progress.recentTraining.daysAgo', { n: Math.floor(diff / day) });
  if (diff < 30 * day) return t('progress.recentTraining.weeksAgo', { n: Math.floor(diff / (7 * day)) });
  if (diff < 365 * day) return t('progress.recentTraining.monthsAgo', { n: Math.floor(diff / (30 * day)) });
  return t('progress.recentTraining.yearsAgo', { n: Math.floor(diff / (365 * day)) });
}
