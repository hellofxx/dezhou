export const APP_VERSION = '0.1.0';

/** BlankLayout 快捷键浮层开合事件：训练页据此暂停/恢复计时 */
export const TRAINING_OVERLAY_EVENT = 'poker:training-overlay';
export const QUIZ_TIME_OPTIONS = [10, 15, 30, 0] as const; // 0 = 无限时
export const DEFAULT_QUIZ_TIME = 15;
export const MAX_RECENT_SESSIONS = 50;
export const STORAGE_KEYS = {
  settings: 'poker-settings',
  progress: 'poker-progress',
  history: 'poker-history',
} as const;
