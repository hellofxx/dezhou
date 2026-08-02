import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHandHistoryStore } from '../store';
import { formatDate } from '../utils/handNotation';
import { calculateHeroStats } from '../utils/handStats';
import { HandStatsPanel } from './HandStatsPanel';
import { Trash2, Upload, Search, BarChart3, List } from 'lucide-react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

const MIN_HANDS_FOR_STATS = 20;

export default function HandHistoryList() {
  const navigate = useNavigate();
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
            {hands.length} hand{hands.length !== 1 ? 's' : ''} imported
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/hand-history/import')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brass)] text-[var(--primary-foreground)] text-sm font-display font-semibold hover:bg-[var(--brass-bright)] transition-colors"
          >
            <Upload size={16} />
            Import
          </button>
          {hands.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-display font-semibold text-[var(--clay)] hover:bg-[var(--clay)]/10 transition-colors"
            >
              <Trash2 size={16} />
              Clear All
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
          牌局列表
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`pill ${activeTab === 'stats' ? 'active' : ''}`}
        >
          <BarChart3 size={13} className="inline mr-1" />
          我的统计
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
              <p className="text-sm text-[var(--ivory-dim)] font-display mb-1">数据不足</p>
              <p className="text-xs text-[var(--ivory-muted)]">
                至少需要 {MIN_HANDS_FOR_STATS} 手牌局才能显示统计数据（当前 {hands.length} 手）
              </p>
            </div>
          ) : !heroName ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-[var(--ivory-dim)] font-display mb-2">未检测到 Hero 玩家</p>
              <p className="text-xs text-[var(--ivory-muted)]">请确保导入的牌局中包含你的底牌信息</p>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ivory-muted)]" />
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter({ search: e.target.value })}
                placeholder="Search by hand #, player name, or site..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] text-sm text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] focus:outline-none focus:border-[var(--brass)]/50"
              />
            </div>
            <select
              value={filter.site ?? ''}
              onChange={(e) => setFilter({ site: e.target.value || undefined })}
              className="px-3 py-2 rounded-lg bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] text-sm text-[var(--ivory)] focus:outline-none"
            >
              <option value="">All Sites</option>
              <option value="pokerstars">PokerStars</option>
              <option value="ggpoker">GGPoker</option>
              <option value="partypoker">PartyPoker</option>
              <option value="manual">Manual</option>
            </select>
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter({ sortBy: e.target.value as 'date' | 'pot' | 'site' })}
              className="px-3 py-2 rounded-lg bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] text-sm text-[var(--ivory)] focus:outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="pot">Sort by Pot</option>
              <option value="site">Sort by Site</option>
            </select>
          </div>

          {/* Hand list */}
          {filteredHands.length === 0 ? (
            hands.length === 0 ? (
              <EmptyState
                icon="📋"
                title="还没有导入任何牌局"
                description="导入你的第一手牌局，开始复盘分析"
                action={{ label: '导入牌局', onClick: () => navigate('/hand-history/import') }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--walnut-raised)]/40 flex items-center justify-center mb-4">
                  <Search size={24} className="text-[var(--ivory-muted)]" />
                </div>
                <p className="text-sm text-[var(--ivory-muted)]">没有匹配的牌局</p>
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
                        Hand #{hand.handNumber}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--ivory-muted)] font-numeric">
                      {hand.gameType} · ${hand.stakes.smallBlind}/${hand.stakes.bigBlind} · {hand.players.length} players · {formatDate(hand.timestamp)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-[var(--brass-bright)] font-numeric">${hand.pot.toFixed(2)}</div>
                      {hand.winner && (
                        <div className="text-[10px] text-[var(--ivory-muted)] truncate max-w-[100px]">
                          Won by {hand.players[hand.winner.playerId]?.name ?? '?'}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteHand(hand.id); }}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 text-[var(--ivory-muted)] hover:text-[var(--clay)] hover:bg-[var(--clay)]/10 transition-all"
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
            <h3 className="text-sm font-display font-semibold text-[var(--ivory)] mb-2">Clear all hands?</h3>
            <p className="text-xs text-[var(--ivory-muted)] mb-4">This will permanently delete all {hands.length} imported hands.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 text-xs rounded-lg text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]/60"
              >
                Cancel
              </button>
              <button
                onClick={() => { clearAll(); setConfirmClear(false); }}
                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--clay)] text-[var(--ivory)] hover:brightness-110"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
