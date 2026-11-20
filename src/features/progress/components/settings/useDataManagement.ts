/**
 * 设置页「数据管理」逻辑（导出 / 导入 / 清除训练记录）。
 *
 * 设计要点：
 * - **导入按实际落库结果计数**：逐条走 progress store 的 `submitRecord`（可等待结果），
 *   分别统计新增 / 重复 / 无效 / 未保存失败，而不是「文件里写了几行」；
 * - **unknown 校验**：外部 JSON 一律先按 unknown 收下，记录校验关键字段与数值范围，
 *   设置只接受白名单字段（未知字段丢弃，非法值忽略）；
 * - **牌局独立结果**：hands 走 IndexedDB，成功 / 失败单独提示，绝不影响训练记录统计；
 * - **导出不得用空数组冒充完整**：`loadAllHands` 失败时仍导出 records + settings，
 *   并以 `partial: true` 与文案明确标注为部分备份；
 * - **清除结果按实际情况反馈**：清库失败已由持久化切片回滚内存并上报 records 来源，
 *   本 hook 只读取该状态，不自行判定成功。
 */
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '@/shared/constants/app';
import type { TrainingRecord, UserSettings } from '../../types';
import { useProgressStore } from '../../store';
import { usePersistenceStatus } from '../../persistenceStatus';
import { loadAllHands, saveAllHands, type BackupHand } from '../../utils/handHistoryBackup';

/** 导出文件格式版本：v1 仅含 records+settings；v2 起新增 hands（IndexedDB 牌局复盘）分区。 */
export const EXPORT_DATA_VERSION = 2;

/** 合法的训练模块标识（与 TrainingRecord.module 联合类型保持一致）。 */
const TRAINING_MODULES = new Set([
  'range-trainer',
  'pot-odds',
  'gto-simulator',
  'strategy-academy',
  'puzzle-trainer',
  'hand-history',
  'theory-academy',
]);

/** settings 白名单字段的数值边界（防止导入把题量/计时写成非法值）。 */
const QUIZ_TIME_MAX = 600;
const QUESTION_COUNT_MAX = 500;
const QUESTIONS_PER_SESSION_MAX = 1000;

export type DataMessageKind = 'success' | 'error' | 'info';

export interface DataMessage {
  id: string;
  kind: DataMessageKind;
  text: string;
}

export interface ImportSummary {
  added: number;
  duplicate: number;
  invalid: number;
  failed: number;
}

export interface BackupPayload {
  records: unknown[];
  settings: unknown;
  hands: BackupHand[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isIntInRange(value: unknown, min: number, max: number): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= min && value <= max;
}

/** 校验外部 JSON 里的单条训练记录（关键字段存在 + 数值范围合法）。 */
export function isValidTrainingRecord(value: unknown): value is TrainingRecord {
  if (!isPlainObject(value)) return false;
  if (typeof value.id !== 'string' || value.id.trim() === '') return false;
  if (typeof value.module !== 'string' || !TRAINING_MODULES.has(value.module)) return false;
  if (typeof value.mode !== 'string') return false;
  if (!isFiniteNumber(value.createdAt) || value.createdAt <= 0) return false;
  const result = value.result;
  if (!isPlainObject(result)) return false;
  if (typeof result.sessionId !== 'string' || typeof result.module !== 'string') return false;
  if (!isIntInRange(result.totalQuestions, 1, QUESTIONS_PER_SESSION_MAX)) return false;
  if (!isIntInRange(result.correctAnswers, 0, result.totalQuestions)) return false;
  if (!isFiniteNumber(result.accuracy) || result.accuracy < 0 || result.accuracy > 1) return false;
  if (!isFiniteNumber(result.averageTime) || result.averageTime < 0) return false;
  if (!isFiniteNumber(result.timestamp) || result.timestamp <= 0) return false;
  return Array.isArray(result.details);
}

/** 只接受 settings 白名单字段（未知字段丢弃，非法值忽略，不整体覆盖）。 */
export function sanitizeImportedSettings(value: unknown): Partial<UserSettings> {
  if (!isPlainObject(value)) return {};
  const patch: Partial<UserSettings> = {};
  const { theme, soundEnabled, defaultQuizTime, defaultQuestionCount, language } = value;
  if (theme === 'dark' || theme === 'light' || theme === 'system') patch.theme = theme;
  if (typeof soundEnabled === 'boolean') patch.soundEnabled = soundEnabled;
  if (isIntInRange(defaultQuizTime, 0, QUIZ_TIME_MAX)) patch.defaultQuizTime = defaultQuizTime;
  if (isIntInRange(defaultQuestionCount, 1, QUESTION_COUNT_MAX)) {
    patch.defaultQuestionCount = defaultQuestionCount;
  }
  if (language === 'zh' || language === 'en') patch.language = language;
  return patch;
}

/** 解析备份文件主体；完全无可导入内容时返回 null（视为格式不正确）。 */
export function readBackupPayload(raw: unknown): BackupPayload | null {
  if (!isPlainObject(raw)) return null;
  const records = Array.isArray(raw.records) ? raw.records : [];
  const hands = Array.isArray(raw.hands) ? raw.hands.filter(isPlainObject) : [];
  const hasSettings = isPlainObject(raw.settings);
  if (records.length === 0 && hands.length === 0 && !hasSettings) return null;
  return { records, settings: raw.settings, hands };
}

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('file read failed'));
    reader.readAsText(file);
  });
}

/** 触发浏览器下载（不依赖 IDB / 网络）。 */
function triggerDownload(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useDataManagement() {
  const { t } = useTranslation();
  const records = useProgressStore((s) => s.records);
  const settings = useProgressStore((s) => s.settings);
  const submitRecord = useProgressStore((s) => s.submitRecord);
  const updateSettings = useProgressStore((s) => s.updateSettings);
  const clearAllRecords = useProgressStore((s) => s.clearAllRecords);
  const persistence = usePersistenceStatus();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [messages, setMessages] = useState<DataMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // 清除失败由持久化切片上报（内存已回滚）——按实际状态反馈，不假装成功
  const clearFailed = persistence.records.active && persistence.records.operation === 'clear';

  const exportData = async () => {
    if (busy) return;
    setBusy(true);
    setMessages([]);
    let hands: BackupHand[] | null = null;
    try {
      hands = await loadAllHands();
    } catch {
      // 读取失败 → 走部分导出；绝不写 hands: [] 冒充完整备份
      hands = null;
    }
    try {
      triggerDownload(`poker-training-${new Date().toISOString().slice(0, 10)}.json`, {
        version: APP_VERSION,
        dataVersion: EXPORT_DATA_VERSION,
        exportedAt: new Date().toISOString(),
        partial: hands === null,
        records,
        settings,
        ...(hands === null ? {} : { hands }),
      });
      setMessages([
        hands === null
          ? { id: 'export', kind: 'error', text: t('settings.exportPartial') }
          : {
              id: 'export',
              kind: 'success',
              text: t('settings.exportComplete', { count: records.length }),
            },
      ]);
    } catch {
      setMessages([{ id: 'export', kind: 'error', text: t('settings.exportFailed') }]);
    } finally {
      setBusy(false);
    }
  };

  const importFile = async (file: File) => {
    setBusy(true);
    setMessages([]);
    try {
      let raw: unknown;
      try {
        raw = JSON.parse(await readFileText(file));
      } catch {
        setMessages([{ id: 'import', kind: 'error', text: t('settings.importFailed') }]);
        return;
      }
      const payload = readBackupPayload(raw);
      if (!payload) {
        setMessages([{ id: 'import', kind: 'error', text: t('settings.importInvalid') }]);
        return;
      }
      const summary: ImportSummary = { added: 0, duplicate: 0, invalid: 0, failed: 0 };
      for (const candidate of payload.records) {
        if (!isValidTrainingRecord(candidate)) {
          summary.invalid += 1;
          continue;
        }
        const result = await submitRecord(candidate);
        if (result.ok) {
          if (result.status === 'inserted') summary.added += 1;
          else summary.duplicate += 1;
        } else if (result.reason === 'invalid') {
          summary.invalid += 1;
        } else {
          // failed / cancelled：内存可能保留，但未落库 → 计入「未保存」
          summary.failed += 1;
        }
      }
      const settingsPatch = sanitizeImportedSettings(payload.settings);
      if (Object.keys(settingsPatch).length > 0) updateSettings(settingsPatch);

      const next: DataMessage[] = [
        {
          id: 'import',
          kind: summary.invalid === 0 && summary.failed === 0 ? 'success' : 'info',
          text: t('settings.importSummary', {
            added: summary.added,
            duplicate: summary.duplicate,
            invalid: summary.invalid,
            failed: summary.failed,
          }),
        },
      ];
      if (payload.hands.length > 0) {
        try {
          await saveAllHands(payload.hands);
          next.push({
            id: 'import-hands',
            kind: 'success',
            text: t('settings.importRecoveredHands', { count: payload.hands.length }),
          });
        } catch {
          next.push({ id: 'import-hands', kind: 'error', text: t('settings.importHandsFailed') });
        }
      }
      setMessages(next);
    } finally {
      setBusy(false);
    }
  };

  const requestImport = () => {
    if (busy) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 先重置 input，保证同一文件可再次触发 change（导入失败后重试）
    event.target.value = '';
    if (!file) return;
    void importFile(file);
  };

  const confirmClear = () => {
    setClearDialogOpen(false);
    setMessages([]);
    // 清库失败由 store + 持久化协调器回滚内存并上报，本处不重复判定
    clearAllRecords();
  };

  const allMessages: DataMessage[] = clearFailed
    ? [...messages, { id: 'clear-failed', kind: 'error', text: t('settings.clearFailed') }]
    : messages;

  return {
    messages: allMessages,
    busy,
    fileInputRef,
    requestImport,
    handleFileChange,
    exportData,
    clearDialogOpen,
    setClearDialogOpen,
    confirmClear,
    clearFailed,
  };
}
