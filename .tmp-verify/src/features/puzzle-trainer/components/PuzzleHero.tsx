/**
 * Puzzle 首页签名元素「翻开的谜题牌」。
 *
 * 家族同形（academy-hero / theory-hero / rank-plaque-hero / help-hero 同构），
 * 差异化：一张象牙扑克牌面微倾立起——中央花色问号 + 今日日期角标，
 * 象征"等你翻开解答的牌"。Hero 左文案 + 每日谜题主 CTA（三态）。
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { transitionSlow } from '@/shared/utils/motion';
import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { getDailyKey } from '../data/dailyPuzzles';

interface PuzzleHeroProps {
  /** 今日是否已完成每日谜题（决定 CTA 三态） */
  dailyCompleted: boolean;
  /** 今日最佳正确率（0-1，无记录时 null） */
  dailyAccuracy: number | null;
}

export default function PuzzleHero({ dailyCompleted, dailyAccuracy }: PuzzleHeroProps) {
  const { t } = useTranslation();
  const dateKey = getDailyKey(new Date());

  return (
    <section className="puzzle-hero" aria-label={t('puzzle.home.hero.ariaLabel')}>
      <div className="puzzle-hero-grid">
        <div className="puzzle-hero-copy">
          <p className="puzzle-hero-eyebrow">{t('puzzle.home.hero.eyebrow')}</p>
          <h1 className="puzzle-hero-title">{t('puzzle.home.title')}</h1>
          <p className="puzzle-hero-sub">{t('puzzle.home.subtitle')}</p>
          <div className="puzzle-hero-actions">
            <Link to="/puzzle/daily" className="puzzle-hero-cta">
              <CalendarDays className="w-4 h-4" />
              {dailyCompleted
                ? t('puzzle.home.hero.reviewDaily')
                : t('puzzle.home.hero.startDaily')}
            </Link>
            <span className="puzzle-hero-meta">
              {t('puzzle.home.hero.meta')}
            </span>
          </div>
          {dailyCompleted && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="puzzle-hero-done"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('puzzle.home.hero.doneLabel')}
              {typeof dailyAccuracy === 'number' && (
                <span className="font-numeric">
                  {t('puzzle.home.hero.doneAccuracy', { percent: Math.round(dailyAccuracy * 100) })}
                </span>
              )}
            </motion.div>
          )}
        </div>

        {/* 签名元素：翻开的谜题牌 */}
        <div className="puzzle-hero-plaque-wrap">
          <motion.div
            initial={{ opacity: 0, y: 16, rotateY: -12 }}
            animate={{ opacity: 1, y: 0, rotateY: -7 }}
            transition={transitionSlow}
            className="puzzle-face"
          >
            {/* 左上角标：花色 + 日期 */}
            <span className="puzzle-face-index">
              <span className="puzzle-face-suit" aria-hidden>♠</span>
              <span className="puzzle-face-date font-numeric">{dateKey.slice(5)}</span>
            </span>
            {/* 中央主符号：花色问号 */}
            <span className="puzzle-face-center">
              <span className="puzzle-face-mark">
                <span className="puzzle-face-q" aria-hidden>?</span>
              </span>
              <span className="puzzle-face-label">{t('puzzle.home.hero.plaqueLabel')}</span>
            </span>
            {/* 右下角标（倒置） */}
            <span className="puzzle-face-index br" aria-hidden>
              <span className="puzzle-face-suit">♠</span>
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
