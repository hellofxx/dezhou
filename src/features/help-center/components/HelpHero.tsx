import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

export type HelpHeroAnchor = 'quickstart' | 'articles' | 'concepts' | 'faq';

interface HelpHeroProps {
  /** 锚点跳转回调：接收 rule 关联的 section id */
  onRuleClick: (anchor: HelpHeroAnchor) => void;
}

/**
 * 帮助中心 Hero — 签名元素「House Rules 台卡」
 *
 * 设计语言：扑克牌桌中央立着的「House Rules」规则牌，是真实存在的牌室文化物件。
 * 象牙卡面（casino-plaque 同源稳定 anchor）+ 黄铜顶部饰条 + 3 条编号规则
 * + 黄铜底座阴影 + 轻微 3D 倾斜（hover 时回正）。
 *
 * 与既有 Hero 家族差异化：
 * - academy-hero：brass 桌布径向渐变 + 进度环（学习）
 * - theory-hero：ivory 纸感径向渐变（理论）
 * - rank-plaque-hero：横向战绩牌匾（战绩）
 * - help-hero：立体立牌 + 底部 brass 底座（指引）
 */
export default function HelpHero({ onRuleClick }: HelpHeroProps) {
  const { t } = useTranslation();

  const rules: Array<{ anchor: HelpHeroAnchor; num: string }> = [
    { anchor: 'quickstart', num: '01' },
    { anchor: 'articles', num: '02' },
    { anchor: 'faq', num: '03' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="panel brass-rail help-hero"
      aria-label={t('help.hero.ariaLabel')}
    >
      <div className="help-hero-grid">
        {/* 左：文案 + 主 CTA */}
        <div className="help-hero-copy">
          <p className="section-eyebrow">{t('help.hero.eyebrow')}</p>
          <h1 className="help-hero-title">{t('help.hero.title')}</h1>
          <p className="help-hero-sub">{t('help.hero.subtitle')}</p>
          <div className="help-hero-actions">
            <button
              type="button"
              onClick={() => onRuleClick('quickstart')}
              className="help-hero-cta"
            >
              {t('help.hero.cta')}
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="help-hero-meta">{t('help.hero.meta')}</span>
          </div>
        </div>

        {/* 右：House Rules 立牌（视觉签名） */}
        <div className="help-hero-plaque-wrap">
          <div className="house-rules-card" role="group" aria-label={t('help.hero.cardAria')}>
            <div className="house-rules-rail" aria-hidden="true" />
            <div className="house-rules-eyebrow">{t('help.hero.cardEyebrow')}</div>
            <div className="house-rules-divider" aria-hidden="true" />
            <ol className="house-rules-list">
              {rules.map((rule) => (
                <li key={rule.anchor}>
                  <button
                    type="button"
                    onClick={() => onRuleClick(rule.anchor)}
                    className="house-rules-item"
                  >
                    <span className="house-rules-num">{rule.num}</span>
                    <span className="house-rules-text">
                      <span className="house-rules-text-title">
                        {t(`help.hero.rules.${rule.num}.title`)}
                      </span>
                      <span className="house-rules-text-body">
                        {t(`help.hero.rules.${rule.num}.body`)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="house-rules-foot">{t('help.hero.cardFooter')}</div>
          </div>
          <div className="house-rules-stand" aria-hidden="true" />
        </div>
      </div>
    </motion.section>
  );
}