/**
 * 设置页备份格式（v3）：外部 JSON 的解析与白名单校验。
 *
 * 纯函数，无 React / store 依赖；导入策略在此收口：
 * - 训练记录逐条校验关键字段与数值范围；
 * - settings / preferences 只接受白名单字段，未知字段丢弃、非法值忽略；
 * - hands 由调用方独立处理（IndexedDB），解析阶段只过滤对象项。
 */
import { MENTOR_PROFILES } from '@/shared/types/mentor';
import type { MentorStyle } from '@/shared/types/mentor';
import { GAME_VARIANT_CONFIGS } from '@/shared/constants/poker';
import type { GameVariant } from '@/shared/types/poker';
import type { TrainingRecord, UserSettings } from '../../types';
import type { BackupHand } from '../../utils/handHistoryBackup';

/** 导出文件格式版本：v1 仅含 records+settings；v2 起新增 hands；v3 起新增 preferences。 */
export const EXPORT_DATA_VERSION = 3;

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

/** 白名单数值边界（防止导入把题量 / 计时写成非法值）。 */
const QUIZ_TIME_MAX = 600;
const QUESTION_COUNT_MAX = 500;
const QUESTIONS_PER_SESSION_MAX = 1000;
const DAILY_LIMIT_MAX = 1000;

const MENTOR_IDS = new Set<string>(MENTOR_PROFILES.map((profile) => profile.id));

export interface BackupPayload {
  records: unknown[];
  settings: unknown;
  preferences: unknown;
  hands: BackupHand[];
}

/** 备份中的个人偏好（v3）：与训练记录 / 设置相互独立的三个单值。 */
export interface BackupPreferences {
  mentorStyle?: MentorStyle;
  currentGameVariant?: GameVariant;
  dailyQuestionLimit?: number;
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

/** 只接受 preferences 白名单字段（未知字段丢弃，非法值忽略）。 */
export function sanitizeImportedPreferences(value: unknown): BackupPreferences {
  if (!isPlainObject(value)) return {};
  const patch: BackupPreferences = {};
  const { mentorStyle, currentGameVariant, dailyQuestionLimit } = value;
  if (typeof mentorStyle === 'string' && MENTOR_IDS.has(mentorStyle)) {
    patch.mentorStyle = mentorStyle as MentorStyle;
  }
  if (
    typeof currentGameVariant === 'string' &&
    Object.prototype.hasOwnProperty.call(GAME_VARIANT_CONFIGS, currentGameVariant)
  ) {
    patch.currentGameVariant = currentGameVariant as GameVariant;
  }
  if (isIntInRange(dailyQuestionLimit, 0, DAILY_LIMIT_MAX)) {
    patch.dailyQuestionLimit = dailyQuestionLimit;
  }
  return patch;
}

/** 解析备份文件主体；完全无可导入内容时返回 null（视为格式不正确）。 */
export function readBackupPayload(raw: unknown): BackupPayload | null {
  if (!isPlainObject(raw)) return null;
  const records = Array.isArray(raw.records) ? raw.records : [];
  const hands = Array.isArray(raw.hands) ? raw.hands.filter(isPlainObject) : [];
  const hasSettings = isPlainObject(raw.settings);
  const hasPreferences = isPlainObject(raw.preferences);
  if (records.length === 0 && hands.length === 0 && !hasSettings && !hasPreferences) return null;
  return { records, settings: raw.settings, preferences: raw.preferences, hands };
}