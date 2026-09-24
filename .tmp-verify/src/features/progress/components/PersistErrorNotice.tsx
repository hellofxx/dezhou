/**
 * 持久化写失败提示条。
 *
 * 监听 progress store 的 persistError 运行时标记，非空时渲染醒目横幅，
 * 提示用户 localStorage 写入失败、学习进度无法保存，并指引转至
 * 设置 → 数据管理 导出备份。
 *
 * 渲染位置：AppLayout 全局渲染一次，桌面端与移动端均可见。
 */
import { useTranslation } from 'react-i18next';
import { useProgressStore } from '../store';
import { AlertTriangle } from 'lucide-react';

export default function PersistErrorNotice() {
  const { t } = useTranslation();
  const persistError = useProgressStore((s) => s.persistError);

  if (!persistError) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center gap-3 px-4 py-3 bg-[var(--danger)]/90 backdrop-blur-sm border-b border-[var(--danger)] shadow-lg"
    >
      <AlertTriangle className="w-5 h-5 shrink-0 text-[var(--ivory)]" />
      <div className="flex-1 min-w-0 text-sm text-[var(--ivory)]">
        <p className="font-medium">
          {t('progress.persistError.title', {
            defaultValue: '进度无法保存',
          })}
        </p>
        <p className="text-[var(--ivory-muted)] text-xs mt-0.5">
          {t('progress.persistError.description', {
            defaultValue: '本地存储已满，学习进度可能丢失。请到 设置 → 数据管理 导出备份。',
          })}
        </p>
      </div>
      <button
        onClick={() => {
          // 跳转到设置页的数据管理标签
          window.location.href = '/settings';
        }}
        className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--ivory)]/20 hover:bg-[var(--ivory)]/30 text-[var(--ivory)] transition-colors"
      >
        {t('progress.persistError.action', {
          defaultValue: '前往设置',
        })}
      </button>
    </div>
  );
}