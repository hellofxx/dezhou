export interface AppBuildInfo {
  version: string;
  builtAt: string;
}

const FALLBACK_BUILD_INFO: AppBuildInfo = { version: '0.0.0-dev', builtAt: '' };

/**
 * 构建信息由 Vite `define` 注入（vite.config.ts）：
 * - version = package.json 语义版本 + 部署序号（CI 的 GITHUB_RUN_NUMBER，本地 0）；
 * - builtAt = 构建时刻（ISO 8601，展示时按用户语言 / 时区本地化）。
 * 测试等未注入环境回退为 dev 标记，更新时间整行不渲染。
 */
export const BUILD_INFO: AppBuildInfo =
  typeof __APP_BUILD_INFO__ === 'object' && __APP_BUILD_INFO__ !== null
    ? __APP_BUILD_INFO__
    : FALLBACK_BUILD_INFO;

export const APP_VERSION = BUILD_INFO.version;
export const APP_BUILD_TIME = BUILD_INFO.builtAt;

/** 部署序号 > 0 时递增 patch（0.1.0 + 3 → 0.1.3）；非法序号保持基础版本。 */
export function resolveAppVersion(baseVersion: string, sequence: number): string {
  if (!/^\d+\.\d+\.\d+$/.test(baseVersion)) return baseVersion;
  const [major = '0', minor = '0', patch = '0'] = baseVersion.split('.');
  const patchNumber = Number.parseInt(patch, 10);
  if (!Number.isFinite(sequence) || sequence <= 0 || !Number.isFinite(patchNumber)) {
    return baseVersion;
  }
  return `${major}.${minor}.${patchNumber + Math.floor(sequence)}`;
}

/** 更新时间本地化展示；空值 / 非法时间返回空串（调用方据此不渲染）。 */
export function formatBuildTime(iso: string, language: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

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
