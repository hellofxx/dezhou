import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Settings,
  Palette,
  Languages,
  SlidersHorizontal,
  Gamepad2,
  Database,
  Bug,
  Info,
  Volume2,
  VolumeX,
  Clock,
  Hash,
  ShieldAlert,
  Snowflake,
  Download,
  Upload,
  Trash2,
  Unlock,
  Lock,
  HelpCircle,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import { useProgressStore } from '../../store';
import { getTodayString } from '../../utils/streakCalc';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { APP_VERSION } from '@/shared/constants/app';
import type { TrainingRecord } from '../../types';
import { GameVariantSelector } from '@/shared/components/business/GameVariantSelector';
import { useTranslation } from 'react-i18next';
import { MENTOR_PROFILES } from '@/shared/types/mentor';
import type { MentorStyle } from '@/shared/types/mentor';
import { cn } from '@/shared/utils/cn';
import { MOTION_DURATION, staggerContainer, staggerItem, transitionStandard } from '@/shared/utils/motion';
import SettingsNav from './SettingsNav';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const settings = useProgressStore((s) => s.settings);
  const updateSettings = useProgressStore((s) => s.updateSettings);
  const records = useProgressStore((s) => s.records);
  const clearAllRecords = useProgressStore((s) => s.clearAllRecords);
  const addRecord = useProgressStore((s) => s.addRecord);
  const mentorStyle = useProgressStore((s) => s.mentorStyle);
  const setMentorStyle = useProgressStore((s) => s.setMentorStyle);
  // P2-5.4: 每日题量上限（Session 止损）
  const dailyQuestionLimit = useProgressStore((s) => s.emotion.dailyQuestionLimit);
  const setDailyQuestionLimit = useProgressStore((s) => s.setDailyQuestionLimit);
  const currentGameVariant = useProgressStore((s) => s.currentGameVariant);
  const setGameVariant = useProgressStore((s) => s.setGameVariant);

  // P0-2: 手动使用冻结卡（PRD 5.8：设置页一键"为今天请假"，反馈成功/失败）
  const streakFreezes = useProgressStore((s) => s.streak.streakFreezes);
  const streakFreezeUsedToday = useProgressStore((s) => s.streak.streakFreezeUsedToday);
  const lastTrainingDate = useProgressStore((s) => s.streak.lastTrainingDate);
  const useStreakFreezeAction = useProgressStore((s) => s.useStreakFreeze);
  const [freezeStatus, setFreezeStatus] = useState<'success' | 'fail' | null>(null);
  // PROG-12：收集状态自动复位定时器，组件卸载时统一清理，避免卸载后 setState 告警
  const statusTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const timers = statusTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);
  // 今日已训练时无需保护（与 streak 同为本地时区口径）
  const trainedToday = lastTrainingDate === getTodayString();

  const handleUseFreeze = () => {
    const ok = useStreakFreezeAction();
    setFreezeStatus(ok ? 'success' : 'fail');
    statusTimersRef.current.push(setTimeout(() => setFreezeStatus(null), 3000));
  };

  // 开发者选项：调试解锁
  const debugUnlockAll = useDebugModeStore((s) => s.unlockAll);
  const activateDebug = useDebugModeStore((s) => s.activateWithCode);
  const deactivateDebug = useDebugModeStore((s) => s.deactivate);
  const [debugCodeInput, setDebugCodeInput] = useState('');
  const [debugError, setDebugError] = useState(false);

  const handleDebugActivate = () => {
    const ok = activateDebug(debugCodeInput);
    setDebugError(!ok);
    if (ok) setDebugCodeInput('');
  };

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      records,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poker-training-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  // 受控展开：导航点击时把目标分区强制展开（解决 main 内容不可滚动时
  // scrollIntoView 无效的问题——折叠的 section 不滚动，用户看不到激活项）
  const [forceOpenId, setForceOpenId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.records && Array.isArray(data.records)) {
          for (const record of data.records as TrainingRecord[]) {
            addRecord(record);
          }
          if (data.settings) {
            updateSettings(data.settings);
          }
          setImportStatus(t('settings.importSuccess', { defaultValue: '成功导入 {{count}} 条记录', count: data.records.length }));
          statusTimersRef.current.push(setTimeout(() => setImportStatus(null), 3000));
        } else {
          setImportStatus(t('settings.importInvalid', { defaultValue: '文件格式不正确' }));
          statusTimersRef.current.push(setTimeout(() => setImportStatus(null), 3000));
        }
      } catch {
        setImportStatus(t('settings.importFailed', { defaultValue: '导入失败：文件解析错误' }));
        statusTimersRef.current.push(setTimeout(() => setImportStatus(null), 3000));
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  return (
    <div className="h-full overflow-auto">
      <div className="py-5 space-y-4 max-w-[1100px]">
        {/* Hero：eyebrow + 标题 + 自动保存铭牌 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitionStandard}
          className="settings-hero"
        >
          <p className="settings-hero-eyebrow">{t('settings.hero.eyebrow', { defaultValue: '牌室设置 · ROOM SETUP' })}</p>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="settings-hero-title">
                <Settings className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                {t('settings.title', { defaultValue: '设置' })}
              </h1>
              <p className="settings-hero-sub">
                {t('settings.subtitle', { defaultValue: '个性化你的训练体验，更改会自动保存' })}
              </p>
            </div>
            <span className="settings-hero-autosave hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              {t('settings.autoSaved', { defaultValue: '自动保存' })}
            </span>
          </div>
        </motion.div>

        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-4 lg:items-start">
          {/* 左侧分区导航（桌面 sticky） */}
          <div className="hidden lg:block lg:sticky lg:top-0">
            <SettingsNav
              sectionIds={['appearance', 'coach', 'training', 'game-streak', 'data', 'developer', 'about']}
              onActivate={setForceOpenId}
            />
          </div>

          <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="visible" className="space-y-3 min-w-0">
          {/* 外观 */}
          <motion.div variants={staggerItem}>
            <SettingsSection
              id="appearance"
              forceOpen={forceOpenId === 'appearance'}
              icon={<Palette className="w-4 h-4" />}
              title={t('settings.appearance', { defaultValue: '外观' })}
              hint={t('settings.appearanceHint', { defaultValue: '主题与界面语言' })}
            >
              <SettingRow
                label={t('settings.themeLabel', { defaultValue: '主题' })}
                description={t('settings.themeHint', { defaultValue: '选择应用的主题模式' })}
              >
                <Select
                  value={settings.theme}
                  onValueChange={(v) => updateSettings({ theme: v as 'dark' | 'light' | 'system' })}
                >
                  <SelectTrigger className="w-[140px] bg-[var(--background)] border-[var(--walnut-border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">{t('settings.themeDark', { defaultValue: '暗色' })}</SelectItem>
                    <SelectItem value="light">{t('settings.themeLight', { defaultValue: '亮色' })}</SelectItem>
                    <SelectItem value="system">{t('settings.themeSystem', { defaultValue: '跟随系统' })}</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow
                label={t('settings.languageLabel', { defaultValue: '语言' })}
                description={t('settings.languageHint', { defaultValue: '界面语言，切换后立即生效' })}
                icon={<Languages className="w-4 h-4" />}
              >
                <Select
                  value={settings.language}
                  onValueChange={(v) => {
                    const lang = v as 'zh' | 'en';
                    // 语言偏好事实源：progress store settings.language（persist），同步切换 i18n 实例
                    updateSettings({ language: lang });
                    i18n.changeLanguage(lang);
                  }}
                >
                  <SelectTrigger className="w-[120px] bg-[var(--background)] border-[var(--walnut-border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </SettingsSection>
          </motion.div>

          {/* 教练风格（P2-4 导师角色人格化） */}
          <motion.div variants={staggerItem}>
            <SettingsSection
              id="coach"
              forceOpen={forceOpenId === 'coach'}
              icon={<GraduationCap className="w-4 h-4" />}
              title={t('mentor.settings.title')}
              hint={t('mentor.settings.hint')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {MENTOR_PROFILES.map((profile) => {
                  const selected = profile.id === mentorStyle;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => setMentorStyle(profile.id as MentorStyle)}
                      aria-pressed={selected}
                      className={cn(
                        'flex sm:flex-col items-start sm:items-center gap-3 rounded-md border p-3 text-left sm:text-center transition-all',
                        selected
                          ? 'border-[var(--brass)] bg-[var(--brass-glow)] ring-1 ring-[var(--brass)]/40'
                          : 'border-[var(--walnut-border)] bg-[var(--background)] hover:border-[var(--brass)]/50'
                      )}
                    >
                      <span className="text-2xl leading-none mt-0.5 sm:mt-0">{profile.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 sm:justify-center">
                          <span className="text-sm font-display font-semibold text-[var(--ivory)]">
                            {t(`mentor.profiles.${profile.id}.name`, { defaultValue: profile.name })}
                          </span>
                          {selected && (
                            <span className="text-[10px] font-numeric text-[var(--brass-bright)] uppercase tracking-wider">
                              {t('mentor.settings.selected')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--ivory-muted)] mt-0.5">
                          {t(`mentor.profiles.${profile.id}.description`, { defaultValue: profile.description })}
                        </div>
                        <div className="text-[11px] text-[var(--ivory-dim)] mt-1">
                          {t('mentor.settings.voiceToneLabel')}: {t(`mentor.profiles.${profile.id}.voiceTone`, { defaultValue: profile.voiceTone })}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SettingsSection>
          </motion.div>

          {/* 训练偏好 */}
          <motion.div variants={staggerItem}>
            <SettingsSection
              id="training"
              forceOpen={forceOpenId === 'training'}
              icon={<SlidersHorizontal className="w-4 h-4" />}
              title={t('settings.training', { defaultValue: '训练偏好' })}
              hint={t('settings.trainingHint', { defaultValue: '音效、计时与题量' })}
            >
              <SettingRow
                label={t('settings.soundLabel', { defaultValue: '音效' })}
                description={t('settings.soundHint', { defaultValue: '训练时播放音效' })}
                icon={settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[var(--success)]" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              >
                <SwitchToggle
                  checked={settings.soundEnabled}
                  onChange={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                  label={t('settings.soundSwitch')}
                />
              </SettingRow>

              <SettingRow
                label={t('settings.quizTimeLabel', { defaultValue: '默认测验时间' })}
                description={t('settings.quizTimeHint', { defaultValue: '每题的默认限时' })}
                icon={<Clock className="w-4 h-4" />}
              >
                <Select
                  value={String(settings.defaultQuizTime)}
                  onValueChange={(v) => updateSettings({ defaultQuizTime: Number(v) })}
                >
                  <SelectTrigger className="w-[120px] bg-[var(--background)] border-[var(--walnut-border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 {t('settings.unitSecond', { defaultValue: '秒' })}</SelectItem>
                    <SelectItem value="15">15 {t('settings.unitSecond', { defaultValue: '秒' })}</SelectItem>
                    <SelectItem value="30">30 {t('settings.unitSecond', { defaultValue: '秒' })}</SelectItem>
                    <SelectItem value="0">{t('settings.unlimited', { defaultValue: '无限时' })}</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow
                label={t('settings.questionCountLabel', { defaultValue: '默认题目数量' })}
                description={t('settings.questionCountHint', { defaultValue: '每次测验的默认题数' })}
                icon={<Hash className="w-4 h-4" />}
              >
                <Select
                  value={String(settings.defaultQuestionCount)}
                  onValueChange={(v) => updateSettings({ defaultQuestionCount: Number(v) })}
                >
                  <SelectTrigger className="w-[120px] bg-[var(--background)] border-[var(--walnut-border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 {t('settings.unitQuestion', { defaultValue: '题' })}</SelectItem>
                    <SelectItem value="20">20 {t('settings.unitQuestion', { defaultValue: '题' })}</SelectItem>
                    <SelectItem value="30">30 {t('settings.unitQuestion', { defaultValue: '题' })}</SelectItem>
                    <SelectItem value="50">50 {t('settings.unitQuestion', { defaultValue: '题' })}</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              {/* P2-5.4: Session 止损 — 每日题量上限 */}
              <SettingRow
                label={t('sessionLimit.settingLabel', { defaultValue: '每日题量上限' })}
                description={t('sessionLimit.settingHint', { defaultValue: '达到上限后将禁止继续训练，0 = 无限' })}
                icon={<ShieldAlert className="w-4 h-4" />}
              >
                <Select
                  value={String(dailyQuestionLimit)}
                  onValueChange={(v) => setDailyQuestionLimit(Number(v))}
                >
                  <SelectTrigger className="w-[120px] bg-[var(--background)] border-[var(--walnut-border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('sessionLimit.unlimited', { defaultValue: '无限' })}</SelectItem>
                    <SelectItem value="50">50 {t('settings.unitQuestion', { defaultValue: '题' })}</SelectItem>
                    <SelectItem value="100">100 {t('settings.unitQuestion', { defaultValue: '题' })}</SelectItem>
                    <SelectItem value="200">200 {t('settings.unitQuestion', { defaultValue: '题' })}</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </SettingsSection>
          </motion.div>

          {/* 游戏与连续性 */}
          <motion.div variants={staggerItem}>
            <SettingsSection
              id="game-streak"
              forceOpen={forceOpenId === 'game-streak'}
              icon={<Gamepad2 className="w-4 h-4" />}
              title={t('gameVariant.title')}
              hint={t('gameVariant.switchHint')}
            >
              <GameVariantSelector
                currentVariant={currentGameVariant}
                onChange={setGameVariant}
              />
              <div className="hairline-brass" />
              <SettingRow
                label={t('streak.freeze.settingLabel', { defaultValue: '冻结卡' })}
                description={t('streak.freeze.settingHint', {
                  defaultValue: '今天没空训练？用 1 张冻结卡为今天请假，保住连续训练（每日限 1 张），当前剩余 {{count}} 张',
                  count: streakFreezes,
                })}
                icon={<Snowflake className="w-4 h-4 text-[var(--info)]" />}
              >
                <AnimatePresence>
                  {freezeStatus && (
                    <motion.span
                      key={freezeStatus}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: MOTION_DURATION.fast }}
                      className={cn(
                        'text-xs max-w-[180px] text-right',
                        freezeStatus === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                      )}
                    >
                      {freezeStatus === 'success'
                        ? t('streak.freeze.useSuccess', { defaultValue: '已使用 1 张，今日连续性已保护 ✓' })
                        : t('streak.freeze.useFail', { defaultValue: '不可用（今日已训/已用、无卡或无可保护连续）' })}
                    </motion.span>
                  )}
                </AnimatePresence>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseFreeze}
                  disabled={streakFreezes <= 0 || streakFreezeUsedToday || trainedToday}
                  className="gap-1"
                >
                  <Snowflake className="w-4 h-4" />
                  {t('streak.freeze.useNow', { defaultValue: '使用冻结卡' })}
                </Button>
              </SettingRow>
            </SettingsSection>
          </motion.div>

          {/* 数据管理 */}
          <motion.div variants={staggerItem}>
            <SettingsSection
              id="data"
              forceOpen={forceOpenId === 'data'}
              icon={<Database className="w-4 h-4" />}
              title={t('settings.data', { defaultValue: '数据管理' })}
              hint={t('settings.dataHint', { defaultValue: '导出、导入或清除训练数据' })}
            >
              <AnimatePresence>
                {importStatus && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: MOTION_DURATION.fast }}
                    className="text-sm text-[var(--brass)] bg-[var(--brass-glow)] rounded-lg px-3 py-2"
                  >
                    {importStatus}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
                  <Download className="w-4 h-4" />
                  {t('settings.exportData', { defaultValue: '导出数据' })}
                </Button>
                <Button variant="outline" size="sm" onClick={handleImport} className="gap-1">
                  <Upload className="w-4 h-4" />
                  {t('settings.importData', { defaultValue: '导入数据' })}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClearDialogOpen(true)}
                  className="gap-1 text-[var(--danger)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] border-[var(--danger)]/30"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('settings.clearAllData', { defaultValue: '清除所有数据' })}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-[var(--ivory-dim)]">
                {t('settings.recordCount', { defaultValue: '当前共 {{count}} 条训练记录', count: records.length })}
              </p>
            </SettingsSection>
          </motion.div>

          {/* 开发者选项（默认折叠，保持设置页整洁） */}
          <motion.div variants={staggerItem}>
            <SettingsSection
              id="developer"
              forceOpen={forceOpenId === 'developer'}
              icon={<Bug className="w-4 h-4" />}
              title={t('settings.developer', { defaultValue: '开发者选项' })}
              hint={t('settings.developerHint', { defaultValue: '调试解锁全部功能' })}
              defaultOpen={false}
            >
              {debugUnlockAll ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-[var(--brass-bright)] bg-[var(--brass-glow)] rounded-lg px-3 py-2">
                    <Unlock className="w-4 h-4" />
                    {t('settings.debugUnlocked', { defaultValue: '调试解锁已开启 · 全部功能已解锁' })}
                  </div>
                  <Button variant="outline" size="sm" onClick={deactivateDebug} className="gap-1">
                    <Lock className="w-4 h-4" />
                    {t('settings.closeDebugUnlock', { defaultValue: '关闭调试解锁' })}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-[var(--ivory-dim)]">
                    {t('settings.developerHint', { defaultValue: '调试解锁全部功能' })}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={debugCodeInput}
                      onChange={(e) => {
                        setDebugCodeInput(e.target.value);
                        if (debugError) setDebugError(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleDebugActivate();
                      }}
                      placeholder={t('settings.debugCodePlaceholder', { defaultValue: '输入调试码' })}
                      aria-label={t('settings.debugCodePlaceholder', { defaultValue: '输入调试码' })}
                      aria-invalid={debugError}
                      className="w-[140px] rounded-md border border-[var(--walnut-border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--ivory)] outline-none focus:border-[var(--brass)]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDebugActivate}
                      disabled={!debugCodeInput.trim()}
                      className="gap-1"
                    >
                      <Unlock className="w-4 h-4" />
                      {t('settings.activate', { defaultValue: '激活' })}
                    </Button>
                  </div>
                  {debugError && (
                    <p className="text-xs text-[var(--danger)]">{t('settings.debugCodeError', { defaultValue: '调试码不正确' })}</p>
                  )}
                </>
              )}
            </SettingsSection>
          </motion.div>

          {/* 关于 */}
          <motion.div variants={staggerItem}>
            <SettingsSection
              id="about"
              forceOpen={forceOpenId === 'about'}
              icon={<Info className="w-4 h-4" />}
              title={t('settings.about', { defaultValue: '关于' })}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-[var(--ivory-muted)]">
                  {t('settings.aboutVersion', { defaultValue: '德州扑克训练平台 v{{version}}', version: APP_VERSION })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/help')}
                  className="gap-1"
                >
                  <HelpCircle className="w-4 h-4" />
                  {t('settings.helpCenter')}
                </Button>
              </div>
            </SettingsSection>
          </motion.div>
          </motion.div>
        </div>

        {/* 确认清除对话框 */}
        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <DialogContent className="bg-[var(--surface)] border-[var(--walnut-border)]">
            <DialogHeader>
              <DialogTitle className="text-[var(--ivory)]">
                {t('settings.clearConfirmTitle', { defaultValue: '确认清除' })}
              </DialogTitle>
              <DialogDescription>
                {t('settings.clearConfirmDesc', { defaultValue: '此操作将永久删除所有训练记录，且无法恢复。确定要继续吗？' })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
                {t('settings.cancel', { defaultValue: '取消' })}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  clearAllRecords();
                  setClearDialogOpen(false);
                }}
                className="text-[var(--danger)] border-[var(--danger)]/30 hover:bg-[var(--danger-bg)]"
              >
                {t('settings.confirmClear', { defaultValue: '确认清除' })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

/** 折叠展开的设置分组：统一的图标芯片 + 高度动画展开 */
function SettingsSection({
  id,
  icon,
  title,
  hint,
  defaultOpen = true,
  forceOpen = false,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  /** 受控强制展开（导航点击时由父组件传入） */
  forceOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // forceOpen=true 时覆盖本地状态，但允许用户再手动折叠回去
  const effectiveOpen = forceOpen || open;

  return (
    <div id={`settings-section-${id}`} className="scroll-mt-4 rounded-lg border border-[var(--walnut-border)] bg-[var(--surface)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={effectiveOpen}
        aria-controls={`settings-${id}`}
        className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-left transition-colors hover:bg-[var(--walnut-raised)]/40"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--brass-glow)] text-[var(--brass)] shrink-0">
          {icon}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-[var(--ivory)]">{title}</span>
          {hint && (
            <span className="block text-xs text-[var(--ivory-muted)] mt-0.5 truncate">{hint}</span>
          )}
        </span>
        <ChevronDown
          className={cn('w-4 h-4 text-[var(--ivory-muted)] shrink-0 transition-transform duration-300', effectiveOpen && 'rotate-180')}
        />
      </button>
      <AnimatePresence initial={false}>
        {effectiveOpen && (
          <motion.div
            key={`settings-${id}-content`}
            id={`settings-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitionStandard}
            className="overflow-hidden"
          >
            <div className="px-4 pt-3 pb-4 space-y-2.5 border-t border-[var(--walnut-border)]/60">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 设置行：统一图标芯片、标签/描述 + 右侧控件 */
function SettingRow({
  label,
  description,
  icon,
  children,
}: {
  label: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-1.5">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-[var(--walnut-raised)]/60 text-[var(--ivory-dim)]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--ivory)]">{label}</div>
          <div className="text-xs text-[var(--ivory-muted)] leading-relaxed">{description}</div>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">{children}</div>
    </div>
  );
}

/** 开关：黄铜选中态 + 位移动画，触摸目标 ≥44px */
function SwitchToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 active:scale-95',
        checked ? 'bg-[var(--brass)]' : 'bg-[var(--walnut-border)]'
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform duration-200',
          'bg-[var(--stable-ivory)]',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}
