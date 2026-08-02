import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
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
import { Settings, Volume2, VolumeX, Clock, Hash, Download, Upload, Trash2, Info, Gamepad2, GraduationCap, ShieldAlert, Bug, Unlock, Lock, Snowflake, HelpCircle } from 'lucide-react';
import { useProgressStore } from '../../store';
import { getTodayString } from '../../utils/streakCalc';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { APP_VERSION } from '@/shared/constants/app';
import type { TrainingRecord } from '../../types';
import { GameVariantSelector } from '@/shared/components/business/GameVariantSelector';
import { useTranslation } from 'react-i18next';
import { MENTOR_PROFILES } from '@/shared/types/mentor';
import type { MentorStyle } from '@/shared/types/mentor';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

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

  // P0-2: 手动使用冻结卡（PRD 5.8：设置页一键"为今天请假"，反馈成功/失败）
  const streakFreezes = useProgressStore((s) => s.streak.streakFreezes);
  const streakFreezeUsedToday = useProgressStore((s) => s.streak.streakFreezeUsedToday);
  const lastTrainingDate = useProgressStore((s) => s.streak.lastTrainingDate);
  const useStreakFreezeAction = useProgressStore((s) => s.useStreakFreeze);
  const [freezeStatus, setFreezeStatus] = useState<'success' | 'fail' | null>(null);
  // 今日已训练时无需保护（与 streak 同为本地时区口径）
  const trainedToday = lastTrainingDate === getTodayString();

  const handleUseFreeze = () => {
    const ok = useStreakFreezeAction();
    setFreezeStatus(ok ? 'success' : 'fail');
    setTimeout(() => setFreezeStatus(null), 3000);
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
          setImportStatus(`成功导入 ${data.records.length} 条记录`);
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('文件格式不正确');
          setTimeout(() => setImportStatus(null), 3000);
        }
      } catch {
        setImportStatus('导入失败：文件解析错误');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-[var(--ivory)] flex items-center gap-2">
            <Settings className="w-6 h-6" />
            设置
            <span className="text-sm tracking-widest text-[var(--brass)]/60">♠♥♦♣</span>
          </h1>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {/* 主题 */}
          <motion.div variants={item}>
            <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--ivory-muted)]">
                  外观
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SettingRow label="主题" description="选择应用的主题模式">
                  <Select
                    value={settings.theme}
                    onValueChange={(v) => updateSettings({ theme: v as 'dark' | 'light' | 'system' })}
                  >
                    <SelectTrigger className="w-[140px] bg-[var(--background)] border-[var(--walnut-border)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">暗色</SelectItem>
                      <SelectItem value="light">亮色</SelectItem>
                      <SelectItem value="system">跟随系统</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </CardContent>
            </Card>
          </motion.div>

          {/* 游戏变体 */}
          <motion.div variants={item}>
            <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--ivory-muted)] flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  {t('gameVariant.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <GameVariantSelector />
                <p className="text-xs text-[var(--ivory-dim)]">
                  {t('gameVariant.switchHint')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* 教练风格（P2-4 导师角色人格化） */}
          <motion.div variants={item}>
            <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--ivory-muted)] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {t('mentor.settings.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-[var(--ivory-dim)]">
                  {t('mentor.settings.hint')}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {MENTOR_PROFILES.map((profile) => {
                    const selected = profile.id === mentorStyle;
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => setMentorStyle(profile.id as MentorStyle)}
                        aria-pressed={selected}
                        className={`flex items-start gap-3 rounded-md border p-3 text-left transition-all ${
                          selected
                            ? 'border-[var(--brass)] bg-[var(--brass)]/10 ring-1 ring-[var(--brass)]/40'
                            : 'border-[var(--walnut-border)] bg-[var(--background)] hover:border-[var(--brass)]/50'
                        }`}
                      >
                        <span className="text-2xl leading-none mt-0.5">{profile.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
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
              </CardContent>
            </Card>
          </motion.div>

          {/* 训练设置 */}
          <motion.div variants={item}>
            <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--ivory-muted)]">
                  训练设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SettingRow
                  label="音效"
                  description="训练时播放音效"
                  icon={settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[var(--brass-bright)]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[var(--ivory-muted)]" />
                  )}
                >
                  <button
                    onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                    aria-pressed={settings.soundEnabled}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-[var(--brass)]' : 'bg-[var(--walnut-raised)]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-[var(--ivory)] transition-transform ${
                        settings.soundEnabled ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </SettingRow>

                <SettingRow
                  label="默认测验时间"
                  description="每题的默认限时"
                  icon={<Clock className="w-4 h-4 text-[var(--ivory-dim)]" />}
                >
                  <Select
                    value={String(settings.defaultQuizTime)}
                    onValueChange={(v) => updateSettings({ defaultQuizTime: Number(v) })}
                  >
                    <SelectTrigger className="w-[120px] bg-[var(--background)] border-[var(--walnut-border)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 秒</SelectItem>
                      <SelectItem value="15">15 秒</SelectItem>
                      <SelectItem value="30">30 秒</SelectItem>
                      <SelectItem value="0">无限时</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow
                  label="默认题目数量"
                  description="每次测验的默认题数"
                  icon={<Hash className="w-4 h-4 text-[var(--ivory-dim)]" />}
                >
                  <Select
                    value={String(settings.defaultQuestionCount)}
                    onValueChange={(v) => updateSettings({ defaultQuestionCount: Number(v) })}
                  >
                    <SelectTrigger className="w-[120px] bg-[var(--background)] border-[var(--walnut-border)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 题</SelectItem>
                      <SelectItem value="20">20 题</SelectItem>
                      <SelectItem value="30">30 题</SelectItem>
                      <SelectItem value="50">50 题</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                {/* P2-5.4: Session 止损 — 每日题量上限 */}
                <SettingRow
                  label={t('sessionLimit.settingLabel', { defaultValue: '每日题量上限' })}
                  description={t('sessionLimit.settingHint', { defaultValue: '达到上限后将禁止继续训练，0 = 无限' })}
                  icon={<ShieldAlert className="w-4 h-4 text-[var(--ivory-dim)]" />}
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
                      <SelectItem value="50">50 题</SelectItem>
                      <SelectItem value="100">100 题</SelectItem>
                      <SelectItem value="200">200 题</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                {/* P0-2: 手动使用冻结卡（"为今天请假"保住连续性；每日限 1 张） */}
                <SettingRow
                  label={t('streak.freeze.settingLabel', { defaultValue: '冻结卡' })}
                  description={t('streak.freeze.settingHint', {
                    defaultValue: '今天没空训练？用 1 张冻结卡为今天请假，保住连续训练（每日限 1 张），当前剩余 {{count}} 张',
                    count: streakFreezes,
                  })}
                  icon={<Snowflake className="w-4 h-4 text-[var(--info)]" />}
                >
                  <div className="flex items-center gap-2">
                    {freezeStatus === 'success' && (
                      <span className="text-xs text-[var(--poker-success)]">
                        {t('streak.freeze.useSuccess', { defaultValue: '已使用 1 张，今日连续性已保护 ✓' })}
                      </span>
                    )}
                    {freezeStatus === 'fail' && (
                      <span className="text-xs text-[var(--danger)]">
                        {t('streak.freeze.useFail', { defaultValue: '不可用（今日已训/已用、无卡或无可保护连续）' })}
                      </span>
                    )}
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
                  </div>
                </SettingRow>

                <SettingRow
                  label={t('settings.languageLabel', { defaultValue: '语言' })}
                  description={t('settings.languageHint', { defaultValue: '界面语言，切换后立即生效' })}
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
              </CardContent>
            </Card>
          </motion.div>

          {/* 数据管理 */}
          <motion.div variants={item}>
            <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--ivory-muted)]">
                  数据管理
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {importStatus && (
                  <div className="text-sm text-[var(--brass)] bg-[var(--brass)]/10 rounded-lg px-3 py-2">
                    {importStatus}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="gap-1"
                  >
                    <Download className="w-4 h-4" />
                    导出数据
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImport}
                    className="gap-1"
                  >
                    <Upload className="w-4 h-4" />
                    导入数据
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClearDialogOpen(true)}
                    className="gap-1 text-[var(--danger)] hover:text-[var(--danger)]"
                  >
                    <Trash2 className="w-4 h-4" />
                    清除所有数据
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
                  当前共 {records.length} 条训练记录
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* 开发者选项 */}
          <motion.div variants={item}>
            <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--ivory-muted)] flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  开发者选项
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {debugUnlockAll ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-[var(--brass-bright)] bg-[var(--brass)]/10 rounded-lg px-3 py-2">
                      <Unlock className="w-4 h-4" />
                      调试解锁已开启 · 全部功能已解锁
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deactivateDebug}
                      className="gap-1"
                    >
                      <Lock className="w-4 h-4" />
                      关闭调试解锁
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-[var(--ivory-dim)]">
                      输入调试码解锁全部功能（所有课程等级、位置、学习轨道与每日题量上限）。
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
                        placeholder="输入调试码"
                        aria-label="调试码"
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
                        激活
                      </Button>
                    </div>
                    {debugError && (
                      <p className="text-xs text-[var(--danger)]">调试码不正确</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 关于 */}
          <motion.div variants={item}>
            <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-[var(--ivory-dim)]" />
                  <div className="text-sm text-[var(--ivory-muted)]">
                    德州扑克训练平台 v{APP_VERSION}
                  </div>
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
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* 确认清除对话框 */}
        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <DialogContent className="bg-[var(--surface)] border-[var(--walnut-border)]">
            <DialogHeader>
              <DialogTitle className="text-[var(--ivory)]">确认清除</DialogTitle>
              <DialogDescription>
                此操作将永久删除所有训练记录，且无法恢复。确定要继续吗？
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
                取消
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  clearAllRecords();
                  setClearDialogOpen(false);
                }}
                className="text-[var(--danger)] border-[var(--danger)]/30 hover:bg-[var(--danger)]/10"
              >
                确认清除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

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
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <div className="text-sm text-[var(--ivory)]">{label}</div>
          <div className="text-xs text-[var(--ivory-dim)]">{description}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
