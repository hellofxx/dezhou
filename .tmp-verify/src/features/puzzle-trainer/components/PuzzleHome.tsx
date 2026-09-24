/**
 * 谜题模式入口首页。
 *
 * - Hero「翻开的谜题牌」签名元素 + 每日谜题主 CTA
 * - 3 个大卡片：Puzzle Rush / 每日谜题 / 主题训练（Lucide 图标）
 * - Puzzle Rush 卡片显示 Best Record
 * - 每日谜题卡片显示今日完成状态
 * - 主题训练卡片显示主题列表（点击进入对应主题）
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Zap, CalendarDays, Library, ChevronRight } from 'lucide-react';
import { PUZZLE_THEMES, PUZZLE_CATEGORIES, getPuzzlesByTheme } from '../data/puzzleBank';
import { getDailyKey } from '../data/dailyPuzzles';
import { usePuzzleStore } from '../store';
import PuzzleHero from './PuzzleHero';
import { staggerContainer, staggerItem } from '@/shared/utils/motion';

export default function PuzzleHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const rushBest = usePuzzleStore((s) => s.rushBest);
  const dailyBest = usePuzzleStore((s) => s.dailyBest);
  const dailyCompleted = usePuzzleStore((s) => s.dailyCompleted);
  const themeBest = usePuzzleStore((s) => s.themeBest);

  // PZL-05 修复：不再在 mount 时冻结 today，每次渲染实时取日期，
  // 避免跨午夜停留时每日完成态滞后（getDailyKey 仅字符串拼接，开销可忽略）
  const todayKey = getDailyKey(new Date());
  const isTodayCompleted = Boolean(dailyCompleted[todayKey]);

  return (
    <div className="h-full overflow-auto">
      <div className="py-5 space-y-6">
        {/* Hero 签名元素 */}
        <PuzzleHero
          dailyCompleted={isTodayCompleted}
          dailyAccuracy={dailyBest?.bestAccuracy ?? null}
        />

        {/* 三大模式卡片 */}
        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Puzzle Rush */}
          <motion.div variants={staggerItem} className="h-full">
            <div className="puzzle-card h-full flex flex-col" onClick={() => navigate('/puzzle/rush?duration=3')}>
              <span className="puzzle-mode-icon"><Zap className="w-5 h-5" /></span>
              <div className="puzzle-name">{t('puzzle.rushTitle')}</div>
              <div className="puzzle-desc flex-1">{t('puzzle.rushDesc')}</div>
              <div className="puzzle-meta">
                {rushBest && (
                  <span>🏆 {t('puzzle.home.bestRecord', { score: rushBest.bestScore })}</span>
                )}
                <span className="flex items-center gap-1">
                  {([3, 5] as const).map((min) => (
                    <button
                      key={min}
                      type="button"
                      className="px-3 min-h-8 inline-flex items-center rounded-full border border-[var(--walnut-border)] text-[var(--brass-bright)] hover:border-[var(--brass-muted)] hover:bg-[var(--surface-raised)] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/puzzle/rush?duration=${min}`);
                      }}
                    >
                      {min} min
                    </button>
                  ))}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Daily Puzzle */}
          <motion.div variants={staggerItem} className="h-full">
            <div
              className={`puzzle-card h-full flex flex-col ${isTodayCompleted ? '' : 'daily'}`}
              data-badge={t('puzzle.home.todayBadge')}
              onClick={() => navigate('/puzzle/daily')}
            >
              <span className="puzzle-mode-icon"><CalendarDays className="w-5 h-5" /></span>
              <div className="puzzle-name">{t('puzzle.dailyTitle')}</div>
              <div className="puzzle-desc flex-1">{t('puzzle.dailyDesc')}</div>
              <div className="puzzle-meta">
                <span>{todayKey}</span>
                {isTodayCompleted && <span className="text-[var(--poker-success)]">✓</span>}
                {dailyBest && <span>🎯 {Math.round(dailyBest.bestAccuracy * 100)}%</span>}
              </div>
            </div>
          </motion.div>

          {/* Theme Drill */}
          <motion.div variants={staggerItem} className="h-full">
            <div className="puzzle-card h-full flex flex-col" onClick={() => {
              const first = PUZZLE_THEMES[0];
              if (first) navigate(`/puzzle/theme/${first.id}`);
            }}>
              <span className="puzzle-mode-icon"><Library className="w-5 h-5" /></span>
              <div className="puzzle-name">{t('puzzle.themeDrillTitle')}</div>
              <div className="puzzle-desc flex-1">{t('puzzle.themeDrillDesc')}</div>
              <div className="puzzle-meta">
                <span>{PUZZLE_THEMES.length} {t('puzzle.home.themesUnit')}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* 主题列表 - 按类别分组 */}
        <motion.div
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="section-eyebrow m-0">{t('puzzle.home.themesTitle')}</p>
            <span className="text-[10px] text-[var(--ivory-dim)] font-numeric">
              {PUZZLE_THEMES.length} {t('puzzle.home.themesUnit')}
            </span>
          </div>
          {PUZZLE_CATEGORIES.map((category) => {
            const categoryThemes = PUZZLE_THEMES.filter((th) => th.category === category.id);
            if (categoryThemes.length === 0) return null;
            return (
              <div key={category.id} className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-display text-sm text-[var(--brass-bright)] tracking-wide uppercase">
                    {t(category.nameKey, category.fallbackName)}
                  </h3>
                  <span className="text-[10px] text-[var(--ivory-dim)] font-numeric">
                    {categoryThemes.length} {t('puzzle.home.themesUnit')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryThemes.map((theme) => {
                    const questions = getPuzzlesByTheme(theme.id);
                    const count = questions.length;
                    const best = themeBest[theme.id];
                    const label = t(theme.nameKey, theme.fallbackName);
                    const avgDiff =
                      count > 0
                        ? questions.reduce((s, q) => s + q.difficulty, 0) / count
                        : 1;
                    const diffLevel: 'beginner' | 'intermediate' | 'advanced' =
                      avgDiff < 1.5 ? 'beginner' : avgDiff < 2.5 ? 'intermediate' : 'advanced';
                    const filledDots = best ? Math.min(5, Math.round(best.bestAccuracy * 5)) : 0;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => navigate(`/puzzle/theme/${theme.id}`)}
                        className="theme-card text-left"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-lg">{theme.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="theme-name">{label}</div>
                            <div className="theme-diff">
                              <span className={`theme-diff-pill ${diffLevel}`}>
                                {t(`puzzle.home.difficulty.${diffLevel}`)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="theme-meta">
                          <span>{count} {t('puzzle.home.questionsUnit')}</span>
                          <span className="theme-dots">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`dot ${i < filledDots ? 'filled' : 'empty'}`} />
                            ))}
                          </span>
                        </div>
                        {best && (
                          <div className="theme-score mt-1 text-[10px] flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            {t('puzzle.home.bestAccuracyShort', { percent: Math.round(best.bestAccuracy * 100) })}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
