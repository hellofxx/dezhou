import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { transitionSlow } from '@/shared/utils/motion';
import { getAcademyDataSource } from '@/shared/stores/academyDataSourceRegistry';
import {
  useAcademyFirstAttemptScores,
  useAcademyLastAttemptScores,
} from '@/shared/hooks/useAcademyDataSource';

interface ProgressEntry {
  lessonId: string;
  lessonTitle: string;
  first: number;
  last: number;
  improvement: number;
}

export default function ProgressReplay() {
  const { t } = useTranslation();
  const firstAttemptScores = useAcademyFirstAttemptScores();
  const lastAttemptScores = useAcademyLastAttemptScores();

  const topChanges = useMemo(() => {
    const source = getAcademyDataSource();

    const entries: ProgressEntry[] = [];
    for (const lessonId of Object.keys(lastAttemptScores)) {
      const first = firstAttemptScores[lessonId];
      const last = lastAttemptScores[lessonId];
      if (first === undefined || last === undefined) continue;
      const improvement = last - first;
      const meta = source?.getLessonMeta(lessonId);
      entries.push({
        lessonId,
        // PROG-14：优先 i18n 解析课程标题（含变体课程），数据层缺省时回退 id；
        // 依赖倒置后经数据源取元数据，key 前缀与 strategy-academy titleKeys.lessonTitleKey 单源一致
        lessonTitle: meta
          ? t(`academy.lessonTitle.${lessonId}`, { defaultValue: meta.title })
          : lessonId,
        first,
        last,
        improvement,
      });
    }
    // P2-C: 按绝对变化幅度降序排列，展示进步与退步，取前 5 门
    const sortedEntries = entries.toSorted((a, b) => Math.abs(b.improvement) - Math.abs(a.improvement));
    return sortedEntries.slice(0, 5);
  }, [firstAttemptScores, lastAttemptScores, t]);

  const hasData = topChanges.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionSlow, delay: 0.4 }}
    >
      <Card className="bg-[var(--felt)] border-[var(--walnut-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-[17px] text-[var(--ivory)] tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--brass-bright)]" />
            {t('dashboard.progressReplay.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div className="space-y-3">
              {topChanges.map((entry, idx) => {
                const isProgress = entry.improvement > 0;
                const isRegression = entry.improvement < 0;
                const isStable = entry.improvement === 0;
                return (
                  <div
                    key={entry.lessonId}
                    className="flex items-center gap-3"
                  >
                    {/* 排名 */}
                    <div className="w-5 h-5 rounded-full bg-[var(--brass)]/20 flex items-center justify-center text-[10px] font-numeric text-[var(--brass-bright)] shrink-0">
                      {idx + 1}
                    </div>
                    {/* 课程信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[var(--ivory)] truncate">
                        {entry.lessonTitle}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-numeric text-[10px] text-[var(--ivory-muted)]">
                          {entry.first}
                        </span>
                        <span className="text-[10px] text-[var(--ivory-muted)]">→</span>
                        <span className="font-numeric text-[10px] text-[var(--ivory)]">
                          {entry.last}
                        </span>
                      </div>
                    </div>
                    {/* 进步条形图 */}
                    <div className="w-16 shrink-0">
                      <div className="h-1.5 bg-[var(--walnut-raised)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isProgress
                              ? 'bg-[var(--poker-success)]'
                              : isRegression
                                ? 'bg-[var(--poker-danger)]'
                                : 'bg-[var(--ivory-muted)]'
                          }`}
                          style={{ width: `${Math.min(Math.abs(entry.improvement), 100)}%` }}
                        />
                      </div>
                    </div>
                    {/* 变化数值与语义色 */}
                    <div className={`flex items-center gap-0.5 shrink-0 ${
                      isProgress
                        ? 'text-[var(--poker-success)]'
                        : isRegression
                          ? 'text-[var(--poker-danger)]'
                          : 'text-[var(--ivory-muted)]'
                    }`}>
                      {isProgress && <ArrowUpRight className="w-3 h-3" />}
                      {isRegression && <ArrowDownRight className="w-3 h-3" />}
                      {isStable && <Minus className="w-3 h-3" />}
                      <span className="font-numeric text-xs font-semibold">
                        {isProgress ? '+' : ''}{entry.improvement}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-2xl mb-2">📈</div>
              <p className="text-xs text-[var(--ivory-muted)]">
                {t('dashboard.progressReplay.empty')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}