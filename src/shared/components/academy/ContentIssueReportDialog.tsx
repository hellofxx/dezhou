import { Flag, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { cn } from '@/shared/utils/cn';

export interface ContentIssueReportDialogLabels {
  title: string;
  subtitle: string;
  placeholder: string;
  includeContext: string;
  copy: string;
  mailto: string;
  /** 无邮件通道时的替代说明 */
  success: string;
  /** 复制成功提示（由调用方 toast 呈现，弹层本身不渲染） */
  copied: string;
  /** 复制失败提示（由调用方 toast 呈现，弹层本身不渲染） */
  failure: string;
  /** 触发按钮的可访问名 */
  trigger: string;
  /** inline 变体触发按钮的可见文案 */
  reportIssue: string;
}

export interface ContentIssueReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 已生成好的纯文本报告（拼装逻辑属于调用方，弹层只展示与复制） */
  reportText: string;
  note: string;
  onNoteChange: (note: string) => void;
  includeContext: boolean;
  onIncludeContextChange: (includeContext: boolean) => void;
  /** 配置了举报邮箱时的 mailto 链接（缺省只提供剪贴板通道） */
  mailtoHref?: string;
  labels: ContentIssueReportDialogLabels;
  /** 复制动作（剪贴板写入与失败提示由调用方负责） */
  onCopy: () => Promise<void>;
  /** 触发按钮形态：inline 文本按钮（默认）/ icon 图标按钮 */
  variant?: 'inline' | 'icon';
  className?: string;
}

/**
 * 内容问题上报弹层（理论章节 / 策略课时共用）。
 *
 * 纯展示：不拼报告文本、不读版本号与语言、不写剪贴板；`reportText` 与 `onCopy` 均由调用方提供。
 * 无后端，报告以文本形式产出：剪贴板通道常驻，配置了邮箱时并列 mailto 通道。
 */
export function ContentIssueReportDialog({
  open,
  onOpenChange,
  reportText,
  note,
  onNoteChange,
  includeContext,
  onIncludeContextChange,
  mailtoHref,
  labels,
  onCopy,
  variant = 'inline',
  className,
}: ContentIssueReportDialogProps) {
  const handleCopy = () => {
    try {
      // 失败提示由调用方 toast 兜底，此处只吸收拒绝，避免未处理的 Promise
      void onCopy().catch(() => {});
    } catch {
      // 同步抛错同样交给调用方；弹层不带 i18n / toast 依赖
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-label={labels.trigger}
        className={cn(
          'inline-flex min-h-11 items-center gap-1.5 rounded text-xs text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
          variant === 'inline' ? 'px-2' : 'min-w-11 justify-center px-2',
          className,
        )}
      >
        <Flag className="w-3.5 h-3.5" aria-hidden="true" />
        {variant === 'inline' ? labels.reportIssue : null}
      </button>
      <DialogContent className="bg-[var(--surface)] border-[var(--walnut-border)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[var(--ivory)]">{labels.title}</DialogTitle>
          <DialogDescription className="text-[var(--ivory-muted)] pt-1">
            {labels.subtitle}
          </DialogDescription>
        </DialogHeader>

        <label className="block space-y-1.5">
          <span className="sr-only">{labels.placeholder}</span>
          <textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={labels.placeholder}
            rows={4}
            className="w-full rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] px-3 py-2 text-sm text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-[var(--ivory-dim)]">
          <input
            type="checkbox"
            checked={includeContext}
            onChange={(event) => onIncludeContextChange(event.target.checked)}
            className="h-4 w-4 accent-[var(--brass)]"
          />
          {labels.includeContext}
        </label>

        <pre className="max-h-32 overflow-auto rounded-lg border border-[var(--walnut-border)]/60 bg-[var(--felt)]/40 p-3 text-[11px] leading-relaxed text-[var(--ivory-muted)] whitespace-pre-wrap">
          {reportText}
        </pre>

        <DialogFooter className="gap-2 flex-wrap sm:gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] text-sm font-semibold hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
          >
            {labels.copy}
          </button>
          {mailtoHref ? (
            <a
              href={mailtoHref}
              className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-sm text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              {labels.mailto}
            </a>
          ) : (
            <p className="text-[11px] text-[var(--ivory-muted)]">{labels.success}</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
