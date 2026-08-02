import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ArrowRight, Target, Gamepad2 } from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';
import { aggregateByDay } from '../../utils/statsAggregator';
import { getTrainingCalendar } from '../../utils/streakCalc';
import StatsOverview from '../dashboard/StatsOverview';
import AccuracyChart from '../dashboard/AccuracyChart';
import StreakTracker from '../streak/StreakTracker';
import WeaknessAnalysis from '../stats/WeaknessAnalysis';
import AchievementBadges from '../achievement/AchievementBadges';
import DifficultyIndicator from '../stats/DifficultyIndicator';

const MODULE_LABELS: Record<string, string> = {
  'range-trainer': '手牌范围训练',
  'pot-odds': '赔率计算器',
  'gto-simulator': 'GTO 模拟器',
  'theory-academy': '理论学院',
};

export default function ProgressPage() {
  const navigate = useNavigate();
  const { summary, moduleStats, recentRecords, records } = useProgress();

  const dailyStats = useMemo(() => aggregateByDay(records, 14), [records]);

  const now = new Date();
  const calendarData = useMemo(
    () => getTrainingCalendar(records, now.getMonth(), now.getFullYear()),
    [records, now.getMonth(), now.getFullYear()],
  );

  // Determine difficulty based on overall stats
  const difficulty = useMemo<'beginner' | 'intermediate' | 'advanced'>(() => {
    if (summary.overallAccuracy > 0.8) return 'advanced';
    if (summary.overallAccuracy > 0.55) return 'intermediate';
    return 'beginner';
  }, [summary.overallAccuracy]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mr-auto py-6 space-y-6">
        {/* 顶栏 H1 已显示页名，内容区不重复大标题，仅保留副标语 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-sm text-[var(--ivory-dim)]">追踪你的训练进度与成长</p>
        </motion.div>

        {/* 难度指示（全宽横条）+ 统计卡片（完整宽度，4 卡均分） */}
        <DifficultyIndicator
          currentDifficulty={difficulty}
          accuracy={summary.overallAccuracy}
          sessionsCount={summary.totalSessions}
        />
        <StatsOverview stats={summary} moduleStats={moduleStats} />

        {/* 图表 + 打卡日历 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <AccuracyChart dailyStats={dailyStats} days={14} />
          </div>
          <div>
            <StreakTracker
              currentStreak={summary.currentStreak}
              longestStreak={summary.longestStreak}
              calendarData={calendarData}
            />
          </div>
        </div>

        {/* 五维能力雷达图 — P1-2.6 升级为 ELO 分数显示（0-3000 量纲） */}
        <WeaknessAnalysis />

        {/* 模块统计入口 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/progress/range')}
              className="w-full text-left rounded-[var(--radius)] border border-[var(--walnut-border)] bg-[var(--surface)] p-4 hover:border-[var(--brass)]/30 hover:bg-[var(--walnut-border)]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--brass)]/10 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-[var(--brass)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--ivory)]">手牌范围训练详情</div>
                  <div className="text-xs text-[var(--ivory-dim)]">查看范围训练的详细统计与薄弱点</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--ivory-dim)]" />
              </div>
            </button>
            <button
              onClick={() => navigate('/progress/gto')}
              className="w-full text-left rounded-[var(--radius)] border border-[var(--walnut-border)] bg-[var(--surface)] p-4 hover:border-[var(--brass)]/30 hover:bg-[var(--walnut-border)]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--ivory-dim)]/10 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-5 h-5 text-[var(--ivory-muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--ivory)]">GTO 模拟器详情</div>
                  <div className="text-xs text-[var(--ivory-dim)]">查看 GTO 训练的详细统计与分析</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--ivory-dim)]" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* 成就展示 */}
        <AchievementBadges records={records} />

        {/* 最近训练记录 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[var(--ivory)]">
                最近训练记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentRecords.length === 0 ? (
                <div className="py-8 text-center text-[var(--ivory-dim)] text-sm">
                  暂无训练记录，开始你的第一次训练吧！
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[var(--ivory-dim)] border-b border-[var(--walnut-border)]">
                        <th className="text-left py-2 px-2 font-medium">模块</th>
                        <th className="text-left py-2 px-2 font-medium">模式</th>
                        <th className="text-right py-2 px-2 font-medium">正确率</th>
                        <th className="text-right py-2 px-2 font-medium">用时</th>
                        <th className="text-right py-2 px-2 font-medium">日期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-[var(--walnut-border)]/50 last:border-0"
                        >
                          <td className="py-2 px-2 text-[var(--ivory)]">
                            {MODULE_LABELS[record.module] ?? record.module}
                          </td>
                          <td className="py-2 px-2 text-[var(--ivory-muted)] capitalize">
                            {record.mode}
                          </td>
                          <td className="py-2 px-2 text-right font-numeric text-[var(--brass)]">
                            {(record.result.accuracy * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 px-2 text-right font-numeric text-[var(--ivory-muted)]">
                            {(record.result.averageTime / 1000).toFixed(1)}s
                          </td>
                          <td className="py-2 px-2 text-right text-[var(--ivory-dim)]">
                            {formatDate(record.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
