import { useMemo, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Flame, Trophy, Snowflake } from 'lucide-react';
import { useProgressStore } from '../../store';
import { isEarnBackActive, getTodayString } from '../../utils/streakCalc';
import { transitionSlow } from '@/shared/utils/motion';

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  calendarData: Map<string, number>;
}

export default function StreakTracker({ currentStreak, longestStreak, calendarData }: StreakTrackerProps) {
  const { t } = useTranslation();
  const streak = useProgressStore((s) => s.streak);
  const checkMilestone = useProgressStore((s) => s.checkMilestone);
  const detectStreakBreak = useProgressStore((s) => s.detectStreakBreak);
  const freezeCardFragments = useProgressStore((s) => s.freezeCardFragments);

  // 碎片合成动画
  const [showSynthesize, setShowSynthesize] = useState(false);

  // 监听碎片变化触发合成动画
  useEffect(() => {
    if (freezeCardFragments === 0 && showSynthesize) {
      const timer = setTimeout(() => setShowSynthesize(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [freezeCardFragments, showSynthesize]);

  // 监听碎片从 4 变为 0（合成触发）：用 ref 保存上一次值（usePrevious 模式）
  const prevFragmentsRef = useRef(freezeCardFragments);
  useEffect(() => {
    if (prevFragmentsRef.current === 4 && freezeCardFragments === 0) {
      setShowSynthesize(true);
    }
    prevFragmentsRef.current = freezeCardFragments;
  }, [freezeCardFragments]);

  // 挂载时补检未庆祝的里程碑（庆典弹窗由全局 MilestoneCelebrationHost 监听
  // pendingMilestone 统一展示，checkMilestone 幂等且达成时即发奖励）
  useEffect(() => {
    checkMilestone();
    // 断裂发现检测：昨日漏训且无卡自动保护 → 标记 Earn Back 窗口（幂等）
    detectStreakBreak();
    // 仅挂载时执行一次（两个 action 均为幂等的 zustand action）
  }, []);

  // 生成最近 30 天的日期网格
  const gridDays = useMemo(() => {
    const days: { date: string; dayLabel: string; count: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        dayLabel: String(d.getDate()),
        count: calendarData.get(dateStr) ?? 0,
      });
    }
    return days;
  }, [calendarData]);

  // 晚间紧迫感判断：20:00 后未训练时火焰变红 + 闪烁
  const hour = new Date().getHours();
  const isLateEvening = hour >= 20;
  const todayTrained = streak.lastTrainingDate === getTodayString();
  const isEndingSoon = isLateEvening && !todayTrained && streak.currentStreak > 0;

  // Earn Back 窗口期判断
  const isEarnBack = isEarnBackActive(streak.streakBrokenAt);

  // 火焰样式：正常 gold；晚间未训练变陶土红闪烁
  const flameClass = isEndingSoon
    ? 'w-5 h-5 text-[var(--poker-danger)] animate-pulse'
    : 'w-5 h-5 text-[var(--brass-bright)]';
  const streakNumClass = isEndingSoon
    ? 'text-3xl font-bold font-numeric text-[var(--poker-danger)] animate-pulse'
    : 'text-3xl font-bold font-numeric text-[var(--brass-bright)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionSlow, delay: 0.3 }}
    >
      <Card className="bg-[var(--felt)] border-[var(--walnut-border)]">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-[17px] text-[var(--ivory)] tracking-wide">
            {t('progress.calendar.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 冻结卡数量 + 碎片进度 + Earn Back 提示行 */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[var(--ivory-muted)]">
                <Snowflake className="w-3.5 h-3.5 text-[var(--info)]" />
                <span>
                  {t('streak.freeze.label')}{' '}
                  <span className="font-numeric text-[var(--ivory)] font-semibold">
                    {streak.streakFreezes}
                  </span>
                </span>
              </div>
              {/* 碎片进度指示器 */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">🧩</span>
                <span className="font-numeric text-[var(--ivory)] text-[11px]">
                  {freezeCardFragments}/5
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i < freezeCardFragments
                          ? 'bg-[var(--brass-bright)]'
                          : 'bg-[var(--walnut-raised)]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {isEarnBack && (
              <div className="flex items-center gap-1 text-[var(--brass-bright)] font-medium">
                <span aria-hidden>⚡</span>
                <span>{t('streak.earnBack.windowHint')}</span>
              </div>
            )}
          </div>

          {/* 碎片合成动画提示 */}
          <AnimatePresence>
            {showSynthesize && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center text-xs text-[var(--brass-bright)] font-semibold py-1"
              >
                ✨ {t('streak.fragment.synthesized')}
              </motion.div>
            )}
          </AnimatePresence>

          {/* "即将熄灭" 提示（晚间 20:00 后未训练） */}
          {isEndingSoon && (
            <div className="text-[11px] text-[var(--poker-danger)] text-center animate-pulse">
              {t('streak.endingSoon')}
            </div>
          )}

          {/* 连续天数 */}
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className={flameClass} />
                <span className={streakNumClass}>
                  {currentStreak}
                </span>
              </div>
              <div className="text-xs text-[var(--ivory-muted)] mt-1">{t('progress.calendar.currentStreak')}</div>
            </div>
            <div className="w-px h-10 bg-[var(--walnut-border)]" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5 text-[var(--brass-bright)]" />
                <span className="text-3xl font-bold font-numeric text-[var(--brass-bright)]">
                  {longestStreak}
                </span>
              </div>
              <div className="text-xs text-[var(--ivory-muted)] mt-1">{t('progress.calendar.longestStreak')}</div>
            </div>
          </div>

          {/* 打卡日历网格 */}
          <div>
            <div className="text-xs text-[var(--ivory-muted)] mb-2">{t('progress.calendar.last30Days')}</div>
            <div className="grid grid-cols-10 gap-1">
              {gridDays.map(({ date, dayLabel, count }) => (
                <div
                  key={date}
                  className="relative group"
                  title={t('progress.calendar.sessions', { count })}
                >
                  <div
                    className="w-full aspect-square rounded-sm transition-colors"
                    style={{
                      backgroundColor: getCellColor(count),
                    }}
                  />
                  <span className="sr-only">{date}: {count}</span>
                  {/* tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                    <div className="px-2 py-1 bg-[var(--felt-deep)] border border-[var(--walnut-border)] rounded text-[10px] text-[var(--ivory-dim)] whitespace-nowrap font-numeric">
                      {t('progress.calendar.tooltip', { day: dayLabel, count })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-[var(--ivory-muted)]">
              <span>{t('progress.calendar.less')}</span>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCellColor(0) }} />
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCellColor(1) }} />
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCellColor(3) }} />
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCellColor(5) }} />
              <span>{t('progress.calendar.more')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Streak heat-map colors.
 * Empty cell = walnut raised; trained days step through brass→gold opacity,
 * so the more you train, the brighter the brass glows on the felt.
 */
function getCellColor(count: number): string {
  if (count === 0) return 'var(--walnut-raised)';
  if (count === 1) return 'var(--brass-cell-2)';
  if (count === 2) return 'var(--brass-cell-3)';
  if (count <= 4) return 'var(--brass-cell-4)';
  return 'var(--brass-cell-5)';
}
