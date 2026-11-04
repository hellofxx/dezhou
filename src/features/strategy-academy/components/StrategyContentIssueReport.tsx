import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ContentIssueReportDialog } from '@/shared/components/academy';
import { toast } from '@/shared/components/ui/toast';
import { APP_VERSION } from '@/shared/constants/app';

/** 报告附带的环境上下文（纯前端静态信息，无用户标识） */
export interface StrategyContentIssueInput {
  appVersion: string;
  locale: string;
  lessonId: string;
  /** 可选：具体题 id（课后小测 / Drill 题目） */
  questionId?: string;
  /** 可选：正文段落下标（0 起、含 heading 段） */
  sectionIndex?: number;
  note: string;
  /** 报告生成时间戳（毫秒） */
  timestamp: number;
  /** 是否附带课时 / 段落 / 题目上下文 */
  includeContext: boolean;
}

/**
 * 生成可粘贴的内容问题报告（纯函数）。
 * 上下文可关：用户只想描述问题时不强塞定位信息；App 版本与语言始终附带（复现必需）。
 */
export function buildStrategyIssueReport(input: StrategyContentIssueInput): string {
  const lines = [
    '[Strategy Academy content issue]',
    `App version: ${input.appVersion}`,
    `Locale: ${input.locale}`,
  ];
  if (input.includeContext) {
    lines.push(`Lesson: ${input.lessonId}`);
    if (typeof input.sectionIndex === 'number') lines.push(`Section: ${input.sectionIndex}`);
    if (input.questionId) lines.push(`Question: ${input.questionId}`);
  }
  lines.push(`Timestamp: ${new Date(input.timestamp).toISOString()}`);
  lines.push('', 'Note:', input.note.trim());
  return lines.join('\n');
}

/** 邮件通道 URL（subject 与 body 均做 URL 编码，换行不会破坏 mailto） */
export function buildStrategyIssueMailto(
  email: string,
  report: string,
  subjectSuffix = '',
): string {
  const subject = `[Strategy Academy] content issue${subjectSuffix ? ` · ${subjectSuffix}` : ''}`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(report)}`;
}

/** 举报邮箱（构建期注入；未配置时只提供剪贴板通道） */
function readReportEmail(): string {
  const raw: unknown = import.meta.env['VITE_STRATEGY_REPORT_EMAIL'];
  return typeof raw === 'string' ? raw.trim() : '';
}

export interface StrategyContentIssueReportProps {
  lessonId: string;
  /** 可选：具体题 id（课后小测 / Drill 题目） */
  questionId?: string;
  /** 可选：正文段落下标 */
  sectionIndex?: number;
  /** 触发按钮形态：inline 文本按钮（默认）/ icon 图标按钮 */
  variant?: 'inline' | 'icon';
  className?: string;
}

/**
 * 内容问题上报（纯前端静态通道）——共享 ContentIssueReportDialog 的策略薄包装。
 *
 * 本层负责：拼装报告文本（版本 / 语言 / 时间戳恒定，课时 / 段落 / 题目按勾选附带）、
 * 生成 mailto 链接、写剪贴板与 toast 兜底；弹层只做展示与回调。
 * 无后端，故报告以**文本**形式产出：剪贴板优先（失败降级为手动复制提示），
 * 配置了 `VITE_STRATEGY_REPORT_EMAIL` 时额外提供 mailto 通道。
 */
export function StrategyContentIssueReport({
  lessonId,
  questionId,
  sectionIndex,
  variant = 'inline',
  className,
}: StrategyContentIssueReportProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [timestamp, setTimestamp] = useState(() => Date.now());

  const email = readReportEmail();
  const report = buildStrategyIssueReport({
    appVersion: APP_VERSION,
    locale: i18n.language,
    lessonId,
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
      toast.success(t('academy.report.copied'));
    } catch {
      toast.error(t('academy.report.failure'));
    }
  };

  return (
    <ContentIssueReportDialog
      open={open}
      onOpenChange={handleOpenChange}
      reportText={report}
      note={note}
      onNoteChange={setNote}
      includeContext={includeContext}
      onIncludeContextChange={setIncludeContext}
      mailtoHref={email ? buildStrategyIssueMailto(email, report, lessonId) : undefined}
      labels={{
        title: t('academy.report.title'),
        subtitle: t('academy.report.subtitle'),
        placeholder: t('academy.report.placeholder'),
        includeContext: t('academy.report.includeContext'),
        copy: t('academy.report.copy'),
        mailto: t('academy.report.mailto'),
        success: t('academy.report.success'),
        copied: t('academy.report.copied'),
        failure: t('academy.report.failure'),
        trigger: t('academy.report.title'),
        reportIssue: t('academy.contentMeta.reportIssue'),
      }}
      onCopy={handleCopy}
      variant={variant}
      className={className}
    />
  );
}
