/**
 * 持久化失败提示条（分源）。
 *
 * 消费 persistenceStatus（localStorage / records / cleanup 三个来源，运行态、不进 persist）：
 * - localStorage 写失败 → 学习状态未保存
 * - records 写失败 → 训练记录仅本次可见（刷新可能丢失）
 * - records operation='load' → 历史记录加载失败（bootstrap 从 IndexedDB 恢复失败）
 * - cleanup 失败 → 维护清理失败（旧记录未裁剪）
 *
 * 三条动作：
 * 1. 重试：localStorage → retryLocalStorageWrite（store 注册的快照重写），
 *    records → store.retryPendingRecords（只重写 IDB，不重复 emit / 评分）；
 * 2. 前往设置：useNavigate 走 SPA 路由（保留 router basename，如 /dezhou/），
 *    禁止 window.location 硬跳导致整页重载与 PWA 状态丢失；
 * 3. 下载当前数据：不做任何异步读取，直接用内存 records + settings 生成 JSON，
 *    并显式标注「不含可能未加载的历史与牌局，不是完整备份」。
 *
 * 文案全部落在 common.json（core 静态包），不使用 progress.* 命名空间——本组件在
 * AppLayout 首屏渲染，progress 语言包是按路由懒加载的。移动端贴底（底部导航之上），
 * 不遮挡顶栏导航与主操作。
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { AlertTriangle, Download, Settings, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { APP_VERSION } from '@/shared/constants/app';
import { useProgressStore } from '../store';
import { initProgressStore } from '../store.bootstrap';
import { isLegacyBridgeActive } from '../utils/legacyRecordsBridge';
import {
  getPersistenceStatus,
  retryLocalStorageWrite,
  usePersistenceStatus,
  type PersistenceStatus,
} from '../persistenceStatus';

/** 提示条来源：records 按 operation 细分「写失败」与「加载失败」 */
type NoticeSource = 'localStorage' | 'records' | 'history' | 'cleanup';

interface Notice {
  source: NoticeSource;
  title: string;
  description: string;
  /** 待重试写入的记录条数（仅 records 写失败来源） */
  pending?: number;
}

/** 按来源生成提示条目（纯函数，便于阅读与测试）。 */
function buildNotices(status: PersistenceStatus, t: TFunction): Notice[] {
  const notices: Notice[] = [];
  if (status.localStorage.active) {
    notices.push({
      source: 'localStorage',
      title: t('common.persistence.localStorage.title'),
      description: t('common.persistence.localStorage.description'),
    });
  }
  if (status.records.active) {
    // 加载失败（历史不在视野内）与写失败（本次记录未落库）是两种不同事实，不能合并成一句
    const loadFailed = status.records.operation === 'load';
    notices.push({
      source: loadFailed ? 'history' : 'records',
      title: loadFailed
        ? t('common.persistence.history.title')
        : t('common.persistence.records.title'),
      description: loadFailed
        ? t('common.persistence.history.description')
        : t('common.persistence.records.description'),
      ...(loadFailed || !status.records.pending ? {} : { pending: status.records.pending }),
    });
  }
  if (status.cleanup.active) {
    notices.push({
      source: 'cleanup',
      title: t('common.persistence.cleanup.title'),
      description: t('common.persistence.cleanup.description'),
    });
  }
  return notices;
}

/** 最近一次失败时间戳（用于「关闭后仅在出现更新的失败时再次出现」）。 */
function latestFailureAt(status: PersistenceStatus): number {
  return Math.max(
    status.localStorage.at ?? 0,
    status.records.at ?? 0,
    status.cleanup.at ?? 0,
  );
}

export default function PersistErrorNotice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = usePersistenceStatus();
  const records = useProgressStore((s) => s.records);
  const settings = useProgressStore((s) => s.settings);

  const [dismissedAt, setDismissedAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  const notices = buildNotices(status, t);
  const failureAt = latestFailureAt(status);
  if (notices.length === 0 || failureAt <= dismissedAt) return null;

  const canRetry = status.localStorage.active || status.records.active;

  const handleRetry = async () => {
    if (busy) return;
    setBusy(true);
    setRetryFailed(false);
    try {
      if (getPersistenceStatus().localStorage.active) retryLocalStorageWrite();
      const recordsState = getPersistenceStatus().records;
      if (recordsState.active) {
        // 启动加载 / legacy 迁移失败需要重走幂等 bootstrap：只刷新 pending 队列无法完成旧记录迁移
        if (recordsState.operation === 'load' || isLegacyBridgeActive()) {
          await initProgressStore();
        }
        await useProgressStore.getState().retryPendingRecords();
      }
      const after = getPersistenceStatus();
      setRetryFailed(after.localStorage.active || after.records.active);
    } catch {
      // 重试本身失败也按“仍未成功”呈现，不向用户抛未处理异常
      setRetryFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = () => {
    // 直接序列化内存快照：不 open IDB、不 await，避免在存储已异常时再次失败
    const payload = {
      version: APP_VERSION,
      dataVersion: 1,
      exportedAt: new Date().toISOString(),
      /** 明示为部分备份：历史与牌局可能尚未加载 */
      partial: true,
      handsIncluded: false,
      note: t('common.persistence.download.partialNote'),
      records,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `poker-training-memory-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-x-0 z-[95] max-h-[45vh] overflow-y-auto border-y border-[var(--danger)]/40 bg-[var(--surface)]/95 px-3 py-2.5 shadow-lg backdrop-blur-sm max-md:bottom-[76px] md:bottom-auto md:top-0 md:px-4"
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-start gap-x-3 gap-y-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger)]" aria-hidden="true" />
        <ul className="min-w-0 flex-1 space-y-1.5">
          {notices.map((notice) => (
            <li key={notice.source} className="text-sm text-[var(--ivory)]">
              <p className="font-medium">{notice.title}</p>
              <p className="text-xs leading-relaxed text-[var(--ivory-muted)]">
                {notice.description}
                {notice.pending
                  ? ` ${t('common.persistence.records.pending', { count: notice.pending })}`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          {canRetry && (
            <Button variant="secondary" size="sm" onClick={handleRetry} disabled={busy}>
              {busy ? t('common.persistence.retrying') : t('common.persistence.retry')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {t('common.persistence.download.label')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4" aria-hidden="true" />
            {t('common.persistence.openSettings')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('common.persistence.dismiss')}
            onClick={() => setDismissedAt(failureAt)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <p className="mx-auto mt-1 w-full max-w-[1400px] text-[11px] text-[var(--ivory-dim)]">
        {t('common.persistence.download.partialNote')}
      </p>
      {retryFailed && (
        <p className="mx-auto mt-1 w-full max-w-[1400px] text-xs text-[var(--danger-text)]">
          {t('common.persistence.retryFailed')}
        </p>
      )}
    </div>
  );
}
