import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { staggerContainer, staggerItem, transitionStandard } from '@/shared/utils/motion';
import { AppearanceSection } from './sections/AppearanceSection';
import { CoachSection } from './sections/CoachSection';
import { TrainingSection } from './sections/TrainingSection';
import { GameStreakSection } from './sections/GameStreakSection';
import { DataSection } from './sections/DataSection';
import { DeveloperSection } from './sections/DeveloperSection';
import { AboutSection } from './sections/AboutSection';

/**
 * 设置面本体（牌室纸条内）：单栏折叠分区，无侧栏导航。
 * 分区各自订阅所需 store 字段，页面只负责 hero 与编排。
 */
export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1100px] space-y-4 pb-5">
        {/* Hero：eyebrow + 标题 + 自动保存铭牌（纸面台卡） */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitionStandard}
          className="settings-hero"
        >
          <p className="settings-hero-eyebrow">
            {t('settings.hero.eyebrow', { defaultValue: '牌室设置 · ROOM SETUP' })}
          </p>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="settings-hero-title">
                <Settings className="h-5 w-5 shrink-0 md:h-6 md:w-6" aria-hidden="true" />
                {t('settings.title', { defaultValue: '设置' })}
              </h2>
              <p className="settings-hero-sub">
                {t('settings.subtitle', { defaultValue: '个性化你的训练体验，更改会自动保存' })}
              </p>
            </div>
            <span className="settings-hero-autosave hidden sm:inline-flex">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
              {t('settings.autoSaved', { defaultValue: '自动保存' })}
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer(0.06)}
          initial="hidden"
          animate="visible"
          className="min-w-0 space-y-3"
        >
          <motion.div variants={staggerItem}><AppearanceSection /></motion.div>
          <motion.div variants={staggerItem}><CoachSection /></motion.div>
          <motion.div variants={staggerItem}><TrainingSection /></motion.div>
          <motion.div variants={staggerItem}><GameStreakSection /></motion.div>
          <motion.div variants={staggerItem}><DataSection /></motion.div>
          <motion.div variants={staggerItem}><DeveloperSection /></motion.div>
          <motion.div variants={staggerItem}><AboutSection /></motion.div>
        </motion.div>
      </div>
    </div>
  );
}