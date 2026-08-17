/**
 * 再看一题按钮组件 - btn-ghost 样式 + RefreshCw（§13.4.3）
 *
 * @module shared/components/feedback/TryAgainButton
 * @description 出现在 wrong / blunder 反馈卡片底部，右对齐，
 * 点击触发同类型新题（由调用方处理，不清除当前反馈）。
 */

import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';

interface TryAgainButtonProps {
  onTryAgain: () => void;
}

export function TryAgainButton({ onTryAgain }: TryAgainButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onTryAgain}
      className="ml-auto inline-flex items-center gap-1.5 rounded border border-[var(--poker-walnut-border)] bg-transparent px-3 py-1.5 text-sm text-[var(--poker-ivory-dim)] transition-colors hover:bg-[var(--poker-walnut-raised)]"
    >
      <RefreshCw size={16} aria-hidden="true" />
      <span>{t('feedback.tryAgain')}</span>
    </button>
  );
}
