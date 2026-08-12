import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHandHistoryStore } from '../store';
import { formatDate } from '../utils/handNotation';
import { calculateHeroStats } from '../utils/handStats';
import { HandStatsPanel } from './HandStatsPanel';
import { Trash2, Upload, Search, BarChart3, List } from 'lucide-react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

const MIN_HANDS_FOR_STATS = 20;

export default function HandHistoryList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hands, filter, setFilter, getFilteredHands, deleteHand, clearAll, loaded, loadFromDB } = useHandHistoryStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [heroName, setHeroName] = useState('');

  useEffect(() => {
    if (!loaded) loadFromDB();
  }, [loaded, loadFromDB]);

  // Auto-detect hero name from first hand with hole cards
  useEffect(() => {
    if (!heroName && hands.length > 0) {
      for (const hand of hands) {
        const heroPlayer = hand.players.find(p => p.holeCards);
        if (heroPlayer) {
          setHeroName(heroPlayer.name);
          break;
        }
      }
    }
  }, [hands, heroName]);

  const filteredHands = getFilteredHands();

  const stats = useMemo(() => {
    if (!heroName || hands.length < MIN_HANDS_FOR_STATS) return null;
    return calculateHeroStats(hands, heroName);
  }, [hands, heroName]);

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="section-eyebrow">Hand History</p>
          <h1 className="font-display text-[28px] tracking-wide text-[var(--ivory)]">Hand History</h1>
          <p className="text-sm text-[var(--ivory-muted)] mt-1 font-numeric">
            {t('handHistory.list.importedCount', { count: hands.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/hand-history/import')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brass)] text-[var(--primary-foreground)] text-sm font-display font-semibold hover:bg-[var(--brass-bright)] transition-colors"
          >
            <Upload size={16} />
            {t('handHistory.list.import')}
          </button>
          {hands.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-display font-semibold text-[var(--clay)] hover:bg-[var(--clay)]/10 transition-colors"
            >
              <Trash2 size={16} />
              {t('handHistory.list.clearAll')}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`pill ${activeTab === 'list' ? 'active' : ''}`}
        >
          <List size={13} className="inline mr-1" />
          {t('handHistory.list.tabsHands')}
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`pill ${activeTab === 'stats' ? 'active' : ''}`}
        >
          <BarChart3 size={13} className="inline mr-1" />
          {t('handHistory.list.tabsStats')}
        </button>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div>
          {hands.length < MIN_HANDS_FOR_STATS ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--walnut-raised)]/40 flex items-center justify-center mb-4">
                <BarChart3 size={24} className="text-[var(--ivory-muted)]" />
              </div>
              <p className="text-sm text-[var(--ivory-dim)] font-display mb-1">{t('handHistory.list.statsInsufficientTitle')}</p>
              <p className="text-xs text-[var(--ivory-muted)]">
                {t('handHistory.list.statsInsufficientDesc', { min: MIN_HANDS_FOR_STATS, count: hands.length })}
              </p>
            </div>
          ) : !heroName ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-[var(--ivory-dim)] font-display mb-2">{t('handHistory.list.heroNotFoundTitle')}</p>
              <p className="text-xs text-[var(--ivory-muted)]">{t('handHistory.list.heroNotFoundDesc')}</p>
            </div>
          ) : stats ? (
            <HandStatsPanel stats={stats} />
          ) : null}
        </div>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ivory-muted)]" />
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter({ search: e.target.value })}
                placeholder={t('handHistory.list.searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] text-sm text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] focus:outline-none focus:border-[var(--brass)]/50"
              />
            </div>
            <select
              value={filter.site ?? ''}
              onChange={(e) => setFilter({ site: e.target.value || undefined })}
              className="shrink-0 px-3 py-2 rounded-lg bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] text-sm text-[var(--ivory)] focus:outline-none"
            >
              <option value="">{t('handHistory.list.allSites')}</option>
              <option value="pokerstars">PokerStars</option>
              <option value="ggpoker">GGPoker</option>
              <option value="partypoker">PartyPoker</option>
              <option value="manual">Manual</option>
            </select>
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter({ sortBy: e.target.value as 'date' | 'pot' | 'site' })}
              className="shrink-0 px-3 py-2 rounded-lg bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] text-sm text-[var(--ivory)] focus:outline-none"
            >
              <option value="date">{t('handHistory.list.sortByDate')}</option>
              <option value="pot">{t('handHistory.list.sortByPot')}</option>
              <option value="site">{t('handHistory.list.sortBySite')}</option>
            </select>
          </div>

          {/* Hand list */}
          {filteredHands.length === 0 ? (
            hands.length === 0 ? (
              <EmptyState
                icon="📋"
                title={t('handHistory.list.emptyTitle')}
                description={t('handHistory.list.emptyDesc')}
                action={{ label: t('handHistory.list.emptyAction'), onClick: () => navigate('/hand-history/import') }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--walnut-raised)]/40 flex items-center justify-center mb-4">
                  <Search size={24} className="text-[var(--ivory-muted)]" />
                </div>
                <p className="text-sm text-[var(--ivory-muted)]">{t('handHistory.list.noMatch')}</p>
              </div>
            )
          ) : (
            <div className="panel p-2 space-y-1">
              {filteredHands.map((hand) => (
                <div
                  key={hand.id}
                  className="hh-item group flex items-center justify-between"
                  onClick={() => navigate(`/hand-history/${hand.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-numeric px-2 py-0.5 rounded bg-[var(--walnut-raised)]/60 text-[var(--ivory-muted)]">
                        {hand.site}
                      </span>
                      <span className="text-sm font-display font-medium text-[var(--ivory)] truncate">
                        {t('handHistory.list.handNumber', { number: hand.handNumber })}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--ivory-muted)] font-numeric">
                      {hand.gameType} · ${hand.stakes.smallBlind}/${hand.stakes.bigBlind} · {hand.players.length} {t('handHistory.list.players')} · {formatDate(hand.timestamp)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-[var(--brass-bright)] font-numeric">${hand.pot.toFixed(2)}</div>
                      {hand.winner && (
                        <div className="text-[10px] text-[var(--ivory-muted)] truncate max-w-[160px]">
                          {t('handHistory.list.wonBy', { name: hand.players[hand.winner.playerId]?.name ?? '?' })}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteHand(hand.id); }}
                      aria-label={t('common.ui.delete')}
                      className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-[var(--ivory-muted)]/70 hover:text-[var(--clay)] hover:bg-[var(--clay)]/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Confirm clear dialog */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--felt-deep)]/70" onClick={() => setConfirmClear(false)}>
          <div className="bg-[var(--felt)] rounded-xl p-6 max-w-sm mx-4 border border-[var(--walnut-border)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-display font-semibold text-[var(--ivory)] mb-2">{t('handHistory.list.confirmClearTitle')}</h3>
            <p className="text-xs text-[var(--ivory-muted)] mb-4">{t('handHistory.list.confirmClearDesc', { count: hands.length })}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 text-xs rounded-lg text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]/60"
              >
                {t('handHistory.list.cancel')}
              </button>
              <button
                onClick={() => { clearAll(); setConfirmClear(false); }}
                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--clay)]/15 text-[var(--clay)] border border-[var(--clay)]/40 hover:bg-[var(--clay)]/25 transition-colors"
              >
                {t('handHistory.list.deleteAll')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
