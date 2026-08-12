import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  accuracy: number;
  sessions: number;
  isUser?: boolean;
}

const MOCK_PLAYERS = [
  { name: 'Phil Ivey', score: 9850, accuracy: 0.94, sessions: 312 },
  { name: 'Daniel Negreanu', score: 9320, accuracy: 0.91, sessions: 287 },
  { name: 'Doyle Brunson', score: 8910, accuracy: 0.89, sessions: 265 },
  { name: 'Vanessa Selbst', score: 8640, accuracy: 0.92, sessions: 248 },
  { name: 'Fedor Holz', score: 8200, accuracy: 0.90, sessions: 231 },
  { name: 'Jason Koon', score: 7890, accuracy: 0.88, sessions: 219 },
  { name: 'Bryn Kenney', score: 7560, accuracy: 0.87, sessions: 205 },
  { name: 'Justin Bonomo', score: 7230, accuracy: 0.86, sessions: 198 },
  { name: 'Stephen Chidwick', score: 6950, accuracy: 0.89, sessions: 186 },
  { name: 'Alex Foxen', score: 6720, accuracy: 0.85, sessions: 174 },
  { name: 'Nick Petrangelo', score: 6430, accuracy: 0.88, sessions: 163 },
  { name: 'Cary Katz', score: 6100, accuracy: 0.84, sessions: 155 },
  { name: 'Erik Seidel', score: 5890, accuracy: 0.87, sessions: 148 },
  { name: 'Antonio Esfandiari', score: 5540, accuracy: 0.83, sessions: 139 },
  { name: 'Maria Ho', score: 5210, accuracy: 0.86, sessions: 127 },
  { name: 'Liv Boeree', score: 4980, accuracy: 0.85, sessions: 118 },
  { name: 'Igor Kurganov', score: 4650, accuracy: 0.84, sessions: 112 },
  { name: 'Oleksii Kovalchuk', score: 4320, accuracy: 0.82, sessions: 104 },
  { name: 'David Peters', score: 4010, accuracy: 0.81, sessions: 96 },
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

  const leaderboard = useMemo(() => {
    let all: LeaderboardEntry[];

    switch (activeTab) {
      case 'accuracy':
        all = [...MOCK_PLAYERS, userEntry]
          .toSorted((a, b) => b.accuracy - a.accuracy)
          .map((p, i) => ({ ...p, rank: i + 1 }));
        break;
      case 'sessions':
        all = [...MOCK_PLAYERS, userEntry]
          .toSorted((a, b) => b.sessions - a.sessions)
          .map((p, i) => ({ ...p, rank: i + 1 }));
        break;
      default:
        all = [...MOCK_PLAYERS, userEntry]
          .toSorted((a, b) => b.score - a.score)
          .map((p, i) => ({ ...p, rank: i + 1 }));
    }

    return all;
  }, [activeTab, userEntry]);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'score', label: t('leaderboard.totalScore') },
    { key: 'accuracy', label: t('leaderboard.accuracy') },
    { key: 'sessions', label: t('leaderboard.sessions') },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-[var(--brass-bright)]" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-[var(--ivory-dim)]" />;
    if (rank === 3) return <Award className="w-4 h-4 text-[var(--brass-deep)]" />;
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
          <h1 className="font-display text-[28px] text-[var(--ivory)] tracking-wide">
            {t('leaderboard.title')}
          </h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--walnut-raised)]/60 rounded-md p-1 border border-[var(--walnut-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[var(--brass)] text-[var(--primary-foreground)]'
                  : 'text-[var(--ivory-dim)] hover:text-[var(--ivory)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
