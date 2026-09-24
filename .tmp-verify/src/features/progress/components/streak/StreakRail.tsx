import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react';
import Sparkline from '@/shared/components/business/Sparkline';
import FreezeChip from './FreezeChip';
import { useProgressStore } from '../../store';
import { getTodayString } from '../../utils/streakCalc';

/**
 * StreakRail — 周连续训练轨道条。
 * 位于 FeltArena 下方（负 margin 叠压），展示连续天数、7 日圆点、冻结卡、今日正确率。
 */
export default function StreakRail() {
  const { t } = useTranslation();
  const streak = useProgressStore((s) => s.streak);
  const emotion = useProgressStore((s) => s.emotion);
  const records = useProgressStore((s) => s.records);
  const detectStreakBreak = useProgressStore((s) => s.detectStreakBreak);

  // 挂载时检测断裂（昨日漏训且无卡自动保护 → 标记 Earn Back 窗口，幂等）
  useEffect(() => {
    detectStreakBreak();
  }, [detectStreakBreak]);

  // Week day labels (Mon-Sun) — localized via i18n
  const weekDayLabels = useMemo(
    () =>
      [
        t('dashboard.streakRail.weekDays.mon'),
        t('dashboard.streakRail.weekDays.tue'),
        t('dashboard.streakRail.weekDays.wed'),
        t('dashboard.streakRail.weekDays.thu'),
        t('dashboard.streakRail.weekDays.fri'),
        t('dashboard.streakRail.weekDays.sat'),
        t('dashboard.streakRail.weekDays.sun'),
      ] as const,
    [t],
  );

  // Calculate which days of the current week had training
  const weekData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    // Build set of dates that had training
    const trainedDates = new Set<string>();
    for (const r of records) {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      trainedDates.add(key);
    }

    return weekDayLabels.map((_label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
      const isDone = trainedDates.has(key);
      return { isToday, isDone };
    });
  }, [records, weekDayLabels]);

  // Today's accuracy from emotion state
  // 防御：dailyQuestionsDate 必须是今天，否则昨日数据会被当作"今日正确率"展示
  const isTodayData = emotion.dailyQuestionsDate === getTodayString();
  const todayAccuracy =
    isTodayData && emotion.dailyTotal > 0
      ? Math.round((emotion.dailyCorrect / emotion.dailyTotal) * 100)
      : null;

  // §13.2.2：最近 7 天每日正确率趋势（按日聚合 correctAnswers/totalQuestions，无数据日填 0）
  const sevenDayAccuracy = useMemo(() => {
    const now = new Date();
    const days: { date: string; correct: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({ date: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, correct: 0, total: 0 });
    }
    const indexByDate = new Map(days.map((d, i) => [d.date, i]));
    for (const r of records) {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const idx = indexByDate.get(key);
      if (idx === undefined) continue;
      days[idx]!.correct += r.result.correctAnswers;
      days[idx]!.total += r.result.totalQuestions;
    }
    return days.map((d) => (d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0));
  }, [records]);

  // 全 0（无任何记录）时不渲染微图
  const hasAccuracyData = sevenDayAccuracy.some((v) => v > 0);

  return (
    <div className="streak-rail" style={{ marginTop: '-14px', marginBottom: '12px' }}>
      {/* Left: streak count */}
      <div className="streak-rail-item">
        <Flame style={{ width: '14px', height: '14px', color: 'var(--brass-bright)' }} />
        <span className="font-display text-[20px] text-[var(--brass-bright)] font-numeric leading-none">
          {streak.currentStreak}
        </span>
        <span className="text-[10px] text-[var(--ivory-muted)] hidden sm:inline">
          {t('dashboard.streakRail.consecutiveDays')}
        </span>
      </div>

      {/* Center: 7 day dots */}
      <div className="streak-rail-dots">
        {weekDayLabels.map((label, i) => {
          const { isToday, isDone } = weekData[i] ?? { isToday: false, isDone: false };
          const statusClass = isToday ? 'today' : isDone ? 'done' : 'missed';
          return (
            <div key={label} className={`streak-dot ${statusClass}`}>
              <span>{label}</span>
              <em>
                {isToday
                  ? t('dashboard.streakRail.today')
                  : isDone
                    ? '✓'
                    : t('dashboard.streakRail.rest')}
              </em>
            </div>
          );
        })}
      </div>

      {/* Freeze cards */}
      <div className="streak-rail-item">
        <FreezeChip count={streak.streakFreezes} size={16} showCount />
        <span className="text-[10px] text-[var(--ivory-dim)] hidden sm:inline">
          {t('dashboard.streakRail.freezeCard')}{' '}
          <span className="text-[var(--poker-frost)] font-semibold font-numeric">
            x{streak.streakFreezes}
          </span>
        </span>
      </div>

      {/* Divider */}
      <div className="streak-rail-divider" />

      {/* Today accuracy */}
      <div className="streak-rail-item">
        <span className="text-[10px] uppercase tracking-widest text-[var(--ivory-muted)] hidden sm:inline">
          {t('dashboard.streakRail.todayAccuracy')}
        </span>
        {todayAccuracy !== null ? (
          <span className="font-display text-[22px] text-[var(--poker-success)] font-numeric leading-none">
            {todayAccuracy}%
          </span>
        ) : (
          <span className="text-[10px] text-[var(--ivory-muted)] font-numeric">--</span>
        )}
        {/* §13.2.2：7 日正确率趋势微图（无数据不渲染） */}
        {hasAccuracyData && <Sparkline data={sevenDayAccuracy} />}
      </div>
    </div>
  );
}
