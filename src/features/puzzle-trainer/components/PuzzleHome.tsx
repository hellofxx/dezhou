/**
 * 谜题模式入口首页。
 *
 * - 3 个大卡片：Puzzle Rush / 每日谜题 / 主题训练
 * - Puzzle Rush 卡片显示 Best Record
 * - 每日谜题卡片显示今日完成状态
 * - 主题训练卡片显示主题列表（点击进入对应主题）
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PUZZLE_THEMES, PUZZLE_CATEGORIES, getPuzzlesByTheme } from '../data/puzzleBank';
import { getDailyKey } from '../data/dailyPuzzles';
import { usePuzzleStore } from '../store';

export default function PuzzleHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const rushBest = usePuzzleStore((s) => s.rushBest);
  const dailyBest = usePuzzleStore((s) => s.dailyBest);
  const dailyCompleted = usePuzzleStore((s) => s.dailyCompleted);
  // P1D-09 修复：themeBest 改为响应式订阅（旧实现在 render 中 getState() 非响应式读取，
  // 刚完成主题训练返回首页时新纪录不刷新）
  const themeBest = usePuzzleStore((s) => s.themeBest);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => getDailyKey(today), [today]);
  const isTodayCompleted = Boolean(dailyCompleted[todayKey]);

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-6">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--brass-dark)] font-medium">
            Poker Puzzle
          </p>
          <h1 className="font-display text-[28px] md:text-[32px] leading-tight text-[var(--ivory)]">
            {t('puzzle.home.title')}
          </h1>
          <p className="text-sm text-[var(--ivory-muted)] max-w-xl">
            {t('puzzle.home.subtitle')}
          </p>
        </motion.div>

        {/* 三大模式卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Puzzle Rush */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <div className="puzzle-card h-full flex flex-col" onClick={() => navigate('/puzzle/rush?duration=3')}>
              <span className="puzzle-emoji">⚡</span>
              <div className="puzzle-name">{t('puzzle.rushTitle')}</div>
              <div className="puzzle-desc flex-1">{t('puzzle.rushDesc')}</div>
              <div className="puzzle-meta">
                {rushBest && (
                  <span>🏆 {t('puzzle.home.bestRecord', { score: rushBest.bestScore })}</span>
                )}
                {/* P1D-08 修复：新增 3/5 分钟双入口（旧实现卡片写 "3/5 min" 却硬编码只跳 duration=3） */}
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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className={`puzzle-card h-full flex flex-col ${isTodayCompleted ? '' : 'daily'}`} onClick={() => navigate('/puzzle/daily')}>
              <span className="puzzle-emoji">📅</span>
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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="puzzle-card h-full flex flex-col" onClick={() => {
              const first = PUZZLE_THEMES[0];
              if (first) navigate(`/puzzle/theme/${first.id}`);
            }}>
              <span className="puzzle-emoji">📚</span>
              <div className="puzzle-name">{t('puzzle.themeDrillTitle')}</div>
              <div className="puzzle-desc flex-1">{t('puzzle.themeDrillDesc')}</div>
              <div className="puzzle-meta">
                <span>{PUZZLE_THEMES.length} {t('puzzle.home.themesUnit')}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 主题列表 - 按类别分组 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          <p className="section-eyebrow">{t('puzzle.home.themesTitle')}</p>
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
                    // Progress dots (max 5)
                    const filledDots = best ? Math.min(5, Math.round(best.bestAccuracy * 5)) : 0;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => navigate(`/puzzle/theme/${theme.id}`)}
                        className="theme-card text-left"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-lg">{theme.icon}</span>
                          <div className="theme-name">{label}</div>
                        </div>
                        <div className="theme-meta">
                          <span>{count} {t('puzzle.home.questionsUnit')} · {t(`puzzle.home.difficulty.${diffLevel}`)}</span>
                          <span className="theme-dots">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`dot ${i < filledDots ? 'filled' : 'empty'}`} />
                            ))}
                          </span>
                        </div>
                        {best && (
                          <div className="theme-score mt-1 text-[10px]">
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
