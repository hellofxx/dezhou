import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Trophy, Medal, Award, Info } from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  accuracy: number;
  sessions: number;
  isUser?: boolean;
}

/**
 * 演示数据：全部为虚构角色，不含任何真实牌手姓名。
 * 数值仅用于撑起榜单量级，让用户看清自己相对所处的位置。
 */
const DEMO_PLAYERS = [
  { name: 'Vera Kaine', score: 9850, accuracy: 0.94, sessions: 312 },
  { name: 'Kenji Morowaka', score: 9320, accuracy: 0.91, sessions: 287 },
  { name: 'Dmitri Volkov', score: 8910, accuracy: 0.89, sessions: 265 },
  { name: 'Ana Belmonte', score: 8640, accuracy: 0.92, sessions: 248 },
  { name: 'Silas Reed', score: 8200, accuracy: 0.9, sessions: 231 },
  { name: 'Noor Haddad', score: 7890, accuracy: 0.88, sessions: 219 },
  { name: 'Tobias Lindqvist', score: 7560, accuracy: 0.87, sessions: 205 },
  { name: 'Camila Duarte', score: 7230, accuracy: 0.86, sessions: 198 },
  { name: 'Ravi Chandrasekar', score: 6950, accuracy: 0.89, sessions: 186 },
  { name: 'Elena Marchetti', score: 6720, accuracy: 0.85, sessions: 174 },
  { name: 'Marcus Cole', score: 6430, accuracy: 0.88, sessions: 163 },
  { name: 'Yuki Tanabe', score: 6100, accuracy: 0.84, sessions: 155 },
  { name: 'Owen Blackwood', score: 5890, accuracy: 0.87, sessions: 148 },
  { name: 'Priya Raman', score: 5540, accuracy: 0.83, sessions: 139 },
  { name: 'Lukas Brenner', score: 5210, accuracy: 0.86, sessions: 127 },
  { name: 'Isabel Ferreira', score: 4980, accuracy: 0.85, sessions: 118 },
  { name: 'Tariq Nasser', score: 4650, accuracy: 0.84, sessions: 112 },
  { name: 'Hana Kobayashi', score: 4320, accuracy: 0.82, sessions: 104 },
  { name: 'Anton Reyes', score: 4010, accuracy: 0.81, sessions: 96 },
];

type TabType = 'score' | 'accuracy' | 'sessions';

export default function Leaderboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('score');
  const { summary } = useProgress();

  const userEntry = useMemo(() => ({
    name: t('leaderboard.you'),
    score: summary.totalSessions * 30 + Math.round(summary.overallAccuracy * 1000),
    accuracy: summary.overallAccuracy,
    sessions: summary.totalSessions,
    isUser: true,
  }), [summary, t]);

  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    const all: Omit<LeaderboardEntry, 'rank'>[] = [...DEMO_PLAYERS, userEntry];
    const sortKey = activeTab === 'accuracy' ? 'accuracy' : activeTab === 'sessions' ? 'sessions' : 'score';
    return all
      .toSorted((a, b) => b[sortKey] - a[sortKey])
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [activeTab, userEntry]);

  const userRanked = leaderboard.find((entry) => entry.isUser) ?? null;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'score', label: t('leaderboard.totalScore') },
    { key: 'accuracy', label: t('leaderboard.accuracy') },
    { key: 'sessions', label: t('leaderboard.sessions') },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-[var(--brass-bright)]" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-[var(--ivory-dim)]" />;
    if (rank === 3) return <Award className="w-4 h-4 text-[var(--brass-text)]" />;
    return <span className="text-xs text-[var(--ivory-muted)] w-4 text-center font-numeric">{rank}</span>;
  };

  const getValue = (entry: LeaderboardEntry) => {
    switch (activeTab) {
      case 'accuracy':
        return `${(entry.accuracy * 100).toFixed(1)}%`;
      case 'sessions':
        return `${entry.sessions}`;
      default:
        return `${entry.score}`;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-display text-[28px] text-[var(--ivory)] tracking-wide">
            {t('leaderboard.title')}
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-[var(--ivory-dim)]">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{t('leaderboard.demoNotice')}</span>
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--walnut-raised)]/60 rounded-md p-1 border border-[var(--walnut-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[var(--brass-fill)] text-[var(--brass-fill-ink)]'
                  : 'text-[var(--ivory-dim)] hover:text-[var(--ivory)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 我的排名摘要行 */}
        {userRanked && (
          <Card className="bg-[var(--surface)] border-[var(--brass)]/35">
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brass-text)]">
                {t('leaderboard.myRank')}
              </span>
              <span className="font-numeric text-lg font-semibold text-[var(--brass-bright)]">
                #{userRanked.rank}
              </span>
              <span className="flex-1" />
              <span className="text-xs text-[var(--ivory-muted)]">
                {tabs.find((tab) => tab.key === activeTab)?.label}
              </span>
              <span className="font-numeric text-sm text-[var(--ivory)]">
                {getValue(userRanked)}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard list */}
        <Card className="bg-[var(--felt)] border-[var(--walnut-border)]">
          <CardContent className="p-0">
            <div className="divide-y divide-[var(--walnut-border)]/40">
              {leaderboard.map((entry) => (
                <div
                  key={entry.name}
                  className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors ${
                    entry.isUser
                      ? 'bg-[var(--brass)]/8 border-l-2 border-l-[var(--brass-bright)]'
                      : 'hover:bg-[var(--walnut-raised)]/30'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0 truncate">
                    <span className={`text-sm font-medium ${
                      entry.isUser ? 'text-[var(--brass-bright)]' : 'text-[var(--ivory)]'
                    }`}>
                      {entry.name}
                    </span>
                  </div>
                  <div className="text-sm font-numeric text-[var(--ivory-dim)]">
                    {getValue(entry)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
