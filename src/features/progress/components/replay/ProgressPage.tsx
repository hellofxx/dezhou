import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ArrowRight, Target, Gamepad2 } from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';
import { DIFFICULTY_THRESHOLDS } from '../../constants';
import { transitionSlow } from '@/shared/utils/motion';
import { useModuleLabel } from '@/shared/hooks/useModuleLabel';
import { aggregateByDay } from '../../utils/statsAggregator';
import { getTrainingCalendar } from '../../utils/streakCalc';
import StatsOverview from '../dashboard/StatsOverview';
import AccuracyChart from '../dashboard/AccuracyChart';
import StreakTracker from '../streak/StreakTracker';
import WeaknessAnalysis from '../stats/WeaknessAnalysis';
import AchievementBadges from '../achievement/AchievementBadges';
import DifficultyIndicator from '../stats/DifficultyIndicator';
import ProgressHero from './ProgressHero';

export default function ProgressPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { summary, moduleStats, recentRecords, records } = useProgress();
  const moduleLabel = useModuleLabel();

  const dailyStats = useMemo(() => aggregateByDay(records, 14), [records]);

  const now = new Date();
  const calendarData = useMemo(
    () => getTrainingCalendar(records, now.getMonth(), now.getFullYear()),
    [records, now.getMonth(), now.getFullYear()],
  );

  // 最近记录日期格式化（跟随 i18n locale）
  const dateFormatter = useMemo(() => {
    const locale = i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [i18n.language]);

  // Determine difficulty based on overall stats（阈值单源：DIFFICULTY_THRESHOLDS）
  const difficulty = useMemo<'beginner' | 'intermediate' | 'advanced'>(() => {
    if (summary.overallAccuracy > DIFFICULTY_THRESHOLDS.advanced) return 'advanced';
    if (summary.overallAccuracy > DIFFICULTY_THRESHOLDS.intermediate) return 'intermediate';
    return 'beginner';
  }, [summary.overallAccuracy]);

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

        {/* 签名元素：战绩牌匾 Hero（段位 + 四项核心指标） */}
        <ProgressHero summary={summary} />

        {/* 难度阶梯（全宽横条） */}
        <DifficultyIndicator
          currentDifficulty={difficulty}
          accuracy={summary.overallAccuracy}
          sessionsCount={summary.totalSessions}
        />

        {/* 四项核心指标卡 */}
        <StatsOverview stats={summary} moduleStats={moduleStats} />

        {/* 趋势图 + 打卡日历（2:1） */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        {/* 五维能力雷达图（2）+ 模块统计入口（1） */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <WeaknessAnalysis />
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/progress/range')}
              className="flex-1 w-full text-left rounded-[var(--radius)] border border-[var(--walnut-border)] bg-[var(--surface)] p-4 hover:border-[var(--brass)]/30 hover:bg-[var(--walnut-border)]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--brass)]/10 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-[var(--brass)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--ivory)]">
                    {t('progress.moduleEntry.rangeTitle')}
                  </div>
                  <div className="text-xs text-[var(--ivory-dim)]">
                    {t('progress.moduleEntry.rangeDesc')}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--ivory-dim)]" />
              </div>
            </button>
            <button
              onClick={() => navigate('/progress/gto')}
              className="flex-1 w-full text-left rounded-[var(--radius)] border border-[var(--walnut-border)] bg-[var(--surface)] p-4 hover:border-[var(--brass)]/30 hover:bg-[var(--walnut-border)]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--ivory-dim)]/10 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-5 h-5 text-[var(--ivory-muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--ivory)]">
                    {t('progress.moduleEntry.gtoTitle')}
                  </div>
                  <div className="text-xs text-[var(--ivory-dim)]">
                    {t('progress.moduleEntry.gtoDesc')}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--ivory-dim)]" />
              </div>
            </button>
          </div>
        </div>

        {/* 成就展示 */}
        <AchievementBadges records={records} />

        {/* 最近训练记录 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionSlow, delay: 0.4 }}
        >
          <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-[15px] text-[var(--ivory)] tracking-wide">
                {t('progress.recentRecords')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentRecords.length === 0 ? (
                <div className="py-8 text-center text-[var(--ivory-dim)] text-sm">
                  {t('progress.recentRecordsEmpty')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[var(--ivory-dim)] border-b border-[var(--walnut-border)]">
                        <th className="text-left py-2 px-2 font-medium">{t('progress.column.module')}</th>
                        <th className="text-left py-2 px-2 font-medium">{t('progress.column.mode')}</th>
                        <th className="text-right py-2 px-2 font-medium">{t('progress.column.accuracy')}</th>
                        <th className="text-right py-2 px-2 font-medium">{t('progress.column.time')}</th>
                        <th className="text-right py-2 px-2 font-medium">{t('progress.column.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-[var(--walnut-border)]/50 last:border-0"
                        >
                          <td className="py-2 px-2 text-[var(--ivory)]">
                            {moduleLabel(record.module)}
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
                            {dateFormatter.format(record.createdAt)}
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

