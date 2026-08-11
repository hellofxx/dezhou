import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { RefreshCw, ArrowRight, CheckCircle2, BookOpen, GraduationCap, PlayCircle } from 'lucide-react';
import type { ReviewItem } from '../../utils/spacedRepetition';
import { getDaysSinceLastReview, getReviewStats } from '../../utils/spacedRepetition';

interface SpacedRepetitionPanelProps {
  reviewItems: ReviewItem[];
  todayItems: ReviewItem[];
  /** P1-3.4: 点击"开始复习"按钮时触发，由 Dashboard / 上层组件打开 ReviewSession Dialog */
  onStartReview?: () => void;
}

// 分类标签颜色
const CATEGORY_COLORS: Record<string, string> = {
  strategy: 'text-[var(--poker-indigo-bright)] bg-[var(--poker-indigo)]/15',
  range: 'text-[var(--poker-info)] bg-[var(--poker-info-bg)]',
  odds: 'text-[var(--poker-success)] bg-[var(--poker-success-bg)]',
  gto: 'text-[var(--poker-terra-bright)] bg-[var(--poker-terra)]/15',
};

/** P2-C: 根据复习项 category 映射导航路由 */
function getReviewRoute(item: ReviewItem): string {
  switch (item.category) {
    case 'range':
      return '/range-trainer';
    case 'odds':
      return '/pot-odds';
    case 'gto':
      return '/gto-simulator';
    case 'strategy':
    default:
      return `/academy/lesson/${item.id}`;
  }
}

export default function SpacedRepetitionPanel({
  reviewItems,
  todayItems,
  onStartReview,
}: SpacedRepetitionPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const stats = getReviewStats(reviewItems);

  // P1-3.4: 进度计算 — 今日已复习数（基于 lastReviewedAt 落在今日） / 今日待复习总数
  // 说明：getTodayReviewItems 会过滤掉 nextReviewDate > today 的项，
  // 已被复习的项 processReview 后 nextReviewDate 会推到未来，自动从 todayItems 中消失，
  // 因此 "今日已复习数" = lastReviewedAt 落在今日的项数（包含复习后通过 / 复习后未通过的项）
  const todayStartMs = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const reviewedToday = reviewItems.filter(
    (item) => typeof item.lastReviewedAt === 'number' && item.lastReviewedAt >= todayStartMs
  ).length;
  // totalDueToday：今日应有待复习总数 = 今日已复习数 + 当前仍待复习数
  const totalDueToday = reviewedToday + todayItems.length;
  const remainingToday = todayItems.length;
  const progressPercent = totalDueToday > 0 ? (reviewedToday / totalDueToday) * 100 : 0;
  const allDone = remainingToday === 0;

  return (
    <Card className="bg-[var(--felt)] border-[var(--walnut-border)] h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-5 h-5 text-[var(--brass-bright)]" />
          <h2 className="font-display text-[17px] text-[var(--ivory)] tracking-wide">
            {t('spacedRepetition.title', { defaultValue: '🔄 今日待复习' })}
          </h2>
          {!allDone && (
            <span className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--poker-terra)]/25 text-[var(--poker-terra-bright)]">
              {todayItems.length}
            </span>
          )}
          {allDone && totalDueToday > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--poker-success)]/20 text-[var(--poker-success)] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {t('spacedRepetition.allDone', { defaultValue: '已完成' })}
            </span>
          )}
        </div>

        {/* P1-3.4: 进度条 — 显示今日复习完成度 */}
        {totalDueToday > 0 && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[var(--ivory-muted)] font-numeric">
              <span>
                {t('spacedRepetition.progressLabel', {
                  defaultValue: '今日进度',
                })}
              </span>
              <span>
                {reviewedToday} / {totalDueToday}
              </span>
            </div>
            <div className="h-1.5 bg-[var(--walnut-raised)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--brass)] to-[var(--sage)] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* P1-3.4: 开始复习按钮（primary CTA） */}
        {!allDone && onStartReview && (
          <Button
            onClick={onStartReview}
            className="w-full mb-3 bg-[var(--brass)] text-[var(--primary-foreground)] hover:bg-[var(--brass-bright)] font-display font-semibold"
          >
            <PlayCircle className="w-4 h-4 mr-1.5" />
            {t('spacedRepetition.startReview', {
              defaultValue: '开始复习',
              count: todayItems.length,
            })}
            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[var(--primary-foreground)]/20 text-[10px] font-numeric">
              {todayItems.length}
            </span>
          </Button>
        )}

        {/* 全部完成提示：仅当今日确实有待复习项且已全部完成时显示 */}
        {allDone && totalDueToday > 0 && (
          <div className="py-4 text-center mb-3">
            <CheckCircle2 className="w-8 h-8 text-[var(--poker-success)] mx-auto mb-2" />
            <p className="text-sm text-[var(--ivory-dim)]">
              {t('spacedRepetition.allDoneMessage', {
                defaultValue: '✅ 今日复习已完成，继续保持节奏！',
              })}
            </p>
          </div>
        )}

        {/* 暂无复习项提示：新用户或所有项都在学习周期中 */}
        {allDone && totalDueToday === 0 && (
          <div className="py-4 text-center mb-3">
            <CheckCircle2 className="w-8 h-8 text-[var(--ivory-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--ivory-dim)]">
              {t('spacedRepetition.emptyToday', {
                defaultValue: '今天没有待复习的内容，完成训练后会自动加入复习队列',
              })}
            </p>
          </div>
        )}

        {/* 待复习列表（仅在有未复习项时展示，避免空白冗余） */}
        {!allDone && todayItems.length > 0 && (
          <div className="space-y-2 mb-4">
            {todayItems.slice(0, 5).map((item) => {
              const daysSince = getDaysSinceLastReview(item);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--walnut-raised)]/30 border border-[var(--walnut-border)]/40"
                >
                  <BookOpen className="w-4 h-4 text-[var(--brass-bright)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--ivory)] truncate">{t(item.label)}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                          CATEGORY_COLORS[item.category] || CATEGORY_COLORS.strategy
                        }`}
                      >
                        {t(`spacedRepetition.category.${item.category}`, {
                          defaultValue: t('spacedRepetition.category.strategy'),
                        })}
                      </span>
                    </div>
                    {daysSince !== null && (
                      <span className="text-[10px] text-[var(--ivory-muted)]">
                        {t('spacedRepetition.lastReview', {
                          defaultValue: '上次复习 {{days}} 天前',
                          days: daysSince,
                        })}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(getReviewRoute(item))}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[var(--brass)]/20 text-[var(--brass-bright)] text-xs font-medium hover:bg-[var(--brass)]/30 transition-colors"
                  >
                    {t('spacedRepetition.review', { defaultValue: '复习' })}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            {todayItems.length > 5 && (
              <p className="text-center text-xs text-[var(--ivory-muted)] pt-1">
                {t('spacedRepetition.moreItems', {
                  defaultValue: '还有 {{count}} 项待复习',
                  count: todayItems.length - 5,
                })}
              </p>
            )}
          </div>
        )}

        {/* 复习统计 */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--walnut-border)]/40 mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-[var(--ivory-muted)]">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{t('spacedRepetition.totalItems', { defaultValue: '总知识点' })}</span>
            <span className="font-numeric text-[var(--ivory)]">{stats.total}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[var(--poker-success)]">
              {t('spacedRepetition.mastered', { defaultValue: '已掌握' })}{' '}
              <span className="font-numeric">{stats.mastered}</span>
            </span>
            <span className="text-[var(--poker-info)]">
              {t('spacedRepetition.learning', { defaultValue: '学习中' })}{' '}
              <span className="font-numeric">{stats.learning}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
