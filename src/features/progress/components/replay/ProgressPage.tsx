import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { transitionSlow } from '@/shared/utils/motion';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';
import ProgressOverview from './ProgressOverview';
import ProgressReplay from './ProgressReplay';
import RecentTrainingPanel from './RecentTrainingPanel';
import Leaderboard from '../achievement/Leaderboard';

/**
 * ProgressPage — 进度中心（三分区）。
 *
 * 概览 / 回放 / 排行三个视图共用一条地址参数 `?tab=overview|replay|leaderboard`，
 * 便于从训练枢纽、行程图等处直达某个分区（如弱项分析在 overview）。
 * 排行直接复用本模块既有的 Leaderboard；手牌库与理论复习属其他模块，只给链接不嵌入。
 */

type ProgressTab = 'overview' | 'replay' | 'leaderboard';

const TAB_KEYS: Record<ProgressTab, string> = {
  overview: 'progress.tabs.overview',
  replay: 'progress.tabs.replay',
  leaderboard: 'progress.tabs.leaderboard',
};

const TABS: readonly ProgressTab[] = ['overview', 'replay', 'leaderboard'];

function normalizeTab(raw: string | null): ProgressTab {
  if (raw === null) return 'overview';
  return TABS.find((tab) => tab === raw) ?? 'overview';
}

export default function ProgressPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeTab(searchParams.get('tab'));

  const selectTab = useCallback(
    (tab: ProgressTab) => {
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams],
  );

  return (
    <div className="h-full overflow-auto">
      <div className="py-4 space-y-4">
        {/* 顶栏 H1 已显示页名，内容区仅保留副标语 */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitionSlow}
          className="m-0 text-sm text-[var(--ivory-dim)]"
        >
          {t('progress.subtitle')}
        </motion.p>

        {/* 分区切换（tablist + ?tab= 同步；三个 tab 均可 Tab 聚焦，不做 roving tabindex） */}
        <div
          role="tablist"
          aria-label={t('progress.tabs.ariaLabel')}
          className="flex gap-1 rounded-md border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/60 p-1"
        >
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`progress-tab-${tab}`}
                aria-selected={active}
                aria-controls="progress-tabpanel"
                onClick={() => selectTab(tab)}
                className={cn(
                  'flex-1 min-h-11 rounded px-3 py-2 text-sm font-medium transition-colors',
                  FOCUS_RING,
                  active
                    ? 'bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold'
                    : 'text-[var(--ivory-dim)] hover:text-[var(--ivory)]',
                )}
              >
                {t(TAB_KEYS[tab])}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id="progress-tabpanel"
          aria-labelledby={`progress-tab-${activeTab}`}
          className="space-y-4"
        >
          {activeTab === 'overview' ? <ProgressOverview /> : null}

          {activeTab === 'replay' ? (
            <>
              <ProgressReplay />
              {/* 手牌库属 hand-history 模块：只做入口链接，不嵌入其组件 */}
              <RecentTrainingPanel />
            </>
          ) : null}

          {activeTab === 'leaderboard' ? <Leaderboard /> : null}
        </div>
      </div>
    </div>
  );
}
