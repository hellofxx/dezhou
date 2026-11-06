/**
 * 再看一题按钮组件 - quiet 语义 + RefreshCw（§13.4.3）
 *
 * @module shared/components/feedback/TryAgainButton
 * @description 出现在 wrong / blunder 反馈卡片底部，右对齐，
 * 点击触发同类型新题（由调用方处理，不清除当前反馈）。
 * 交互状态由 `Button variant="quiet"` 接管，描边/尺寸/悬停表面沿用原观感。
 */

import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface TryAgainButtonProps {
  onTryAgain: () => void;
}

export function TryAgainButton({ onTryAgain }: TryAgainButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="quiet"
      onClick={onTryAgain}
      className="ml-auto h-auto gap-1.5 rounded border border-[var(--poker-walnut-border)] bg-transparent px-3 py-1.5 text-sm font-normal text-[var(--poker-ivory-dim)] hover:bg-[var(--poker-walnut-raised)] hover:text-[var(--poker-ivory-dim)]"
    >
      <RefreshCw size={16} aria-hidden="true" />
      <span>{t('feedback.tryAgain')}</span>
    </Button>
  );
}
