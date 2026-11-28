import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface TrainingPauseDialogProps {
  open: boolean;
  onResume: () => void;
  onExit: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}

/** 暂停确认层：Radix Dialog 统一焦点陷阱、Escape/关闭恢复与焦点归还。 */
export function TrainingPauseDialog({
  open,
  onResume,
  onExit,
  returnFocusRef,
}: TrainingPauseDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onResume();
      }}
    >
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-sm p-6 text-[var(--ivory)]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocusRef.current?.isConnected
            ? returnFocusRef.current
            : document.getElementById('main-content');
          target?.focus();
        }}
      >
        <DialogHeader className="items-center gap-2 pr-8">
          <DialogTitle className="font-display text-2xl tracking-wide text-[var(--ivory)]">
            {t('rangeTrainer.session.paused')}
          </DialogTitle>
          <DialogDescription className="text-center text-[var(--ivory-muted)]">
            {t('rangeTrainer.session.shortcuts')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button onClick={onResume} className="w-full min-h-11">
            {t('rangeTrainer.session.resume')}
          </Button>
          <Button
            variant="outline"
            onClick={onExit}
            className="w-full min-h-11 border-[var(--poker-danger)]/40 text-[var(--danger-text)] hover:bg-[var(--poker-danger)]/10 hover:text-[var(--danger-text)]"
          >
            {t('rangeTrainer.session.exit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
