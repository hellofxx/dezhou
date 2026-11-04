import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { toast } from '@/shared/components/ui/toast';
import { APP_VERSION } from '@/shared/constants/app';
import { cn } from '@/shared/utils/cn';

/** 报告附带的环境上下文（纯前端静态信息，无用户标识） */
export interface ContentIssueReportInput {
  appVersion: string;
  locale: string;
  chapterId: string;
  questionId?: string;
  /** 正文段落下标（0 起、含 heading 段） */
  sectionIndex?: number;
  note: string;
  /** 报告生成时间戳（毫秒） */
  timestamp: number;
  /** 是否附带章节 / 段落 / 题目上下文 */
  includeContext: boolean;
}

/**
 * 生成可粘贴的内容问题报告（纯函数）。
 * 上下文可关：用户只想描述问题时不强塞定位信息；App 版本与语言始终附带（复现必需）。
 */
export function buildContentIssueReport(input: ContentIssueReportInput): string {
  const lines = [
    '[Theory Academy content issue]',
    `App version: ${input.appVersion}`,
    `Locale: ${input.locale}`,
  ];
  if (input.includeContext) {
    lines.push(`Chapter: ${input.chapterId}`);
    if (typeof input.sectionIndex === 'number') lines.push(`Section: ${input.sectionIndex}`);
    if (input.questionId) lines.push(`Question: ${input.questionId}`);
  }
  lines.push(`Timestamp: ${new Date(input.timestamp).toISOString()}`);
  lines.push('', 'Note:', input.note.trim());
  return lines.join('\n');
}

/** 邮件通道 URL（subject 与 body 均做 URL 编码，换行不会破坏 mailto） */
export function buildContentIssueMailto(
  email: string,
  report: string,
  subjectSuffix = '',
): string {
  const subject = `[Theory Academy] content issue${subjectSuffix ? ` · ${subjectSuffix}` : ''}`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(report)}`;
}

/** 举报邮箱（构建期注入；未配置时只提供剪贴板通道） */
function readReportEmail(): string {
  const raw: unknown = import.meta.env['VITE_THEORY_REPORT_EMAIL'];
  return typeof raw === 'string' ? raw.trim() : '';
}

interface ContentIssueReportProps {
  chapterId: string;
  /** 可选：具体题 id（章末小测 / 检查点题目） */
  questionId?: string;
  /** 可选：正文段落下标 */
  sectionIndex?: number;
  /** 触发按钮形态：inline 文本按钮（默认）/ icon 图标按钮 */
  variant?: 'inline' | 'icon';
  className?: string;
}

/**
 * 内容问题上报（纯前端静态通道）。
 *
 * 无后端，故报告以**文本**形式产出：剪贴板优先（失败降级为手动复制提示），
 * 配置了 `VITE_THEORY_REPORT_EMAIL` 时额外提供 mailto 通道。
 * 报告内容固定携带 App 版本、语言与时间戳；章节 / 段落 / 题目按用户勾选附带。
 */
export function ContentIssueReport({
  chapterId,
  questionId,
  sectionIndex,
  variant = 'inline',
  className,
}: ContentIssueReportProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [timestamp, setTimestamp] = useState(() => Date.now());

  const email = readReportEmail();
  const report = buildContentIssueReport({
    appVersion: APP_VERSION,
    locale: i18n.language,
    chapterId,
    questionId,
    sectionIndex,
    note,
    timestamp,
    includeContext,
  });

  const handleOpenChange = (next: boolean) => {
    if (next) setTimestamp(Date.now());
    setOpen(next);
  };

  const handleCopy = async () => {
    try {
      if (typeof navigator.clipboard?.writeText !== 'function') throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(report);
      toast.success(t('theory.report.copied'));
    } catch {
      toast.error(t('theory.report.failure'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <button
        onClick={() => handleOpenChange(true)}
        aria-label={t('theory.report.title')}
        className={cn(
          'inline-flex min-h-11 items-center gap-1.5 rounded text-xs text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
          variant === 'inline' ? 'px-2' : 'min-w-11 justify-center px-2',
          className,
        )}
      >
        <Flag className="w-3.5 h-3.5" aria-hidden="true" />
        {variant === 'inline' && t('theory.contentMeta.reportIssue')}
      </button>
      <DialogContent className="bg-[var(--surface)] border-[var(--walnut-border)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[var(--ivory)]">{t('theory.report.title')}</DialogTitle>
          <DialogDescription className="text-[var(--ivory-muted)] pt-1">
            {t('theory.report.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <label className="block space-y-1.5">
          <span className="sr-only">{t('theory.report.placeholder')}</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('theory.report.placeholder')}
            rows={4}
            className="w-full rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] px-3 py-2 text-sm text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-[var(--ivory-dim)]">
          <input
            type="checkbox"
            checked={includeContext}
            onChange={(event) => setIncludeContext(event.target.checked)}
            className="h-4 w-4 accent-[var(--brass)]"
          />
          {t('theory.report.includeContext')}
        </label>

        <pre className="max-h-32 overflow-auto rounded-lg border border-[var(--walnut-border)]/60 bg-[var(--felt)]/40 p-3 text-[11px] leading-relaxed text-[var(--ivory-muted)] whitespace-pre-wrap">
          {report}
        </pre>

        <DialogFooter className="gap-2 flex-wrap sm:gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] text-sm font-semibold hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
          >
            {t('theory.report.copy')}
          </button>
          {email ? (
            <a
              href={buildContentIssueMailto(email, report, chapterId)}
              className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-sm text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              {t('theory.report.mailto')}
            </a>
          ) : (
            <p className="text-[11px] text-[var(--ivory-muted)]">{t('theory.report.success')}</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ContentIssueReport;
