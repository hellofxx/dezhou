import { useTranslation } from 'react-i18next';
import { KeyRound, AlertTriangle, Sigma } from 'lucide-react';
import type { TheorySection } from '../types';
import { ProTipBox } from './ProTipBox';

interface TheorySectionRendererProps {
  section: TheorySection;
  /** i18n content key（渲染层 key 覆盖）：命中取译文，缺省回退数据层原文 */
  contentKey?: string;
}

/** 理论段落渲染器：按 section type 渲染（视觉与 strategy-academy LessonContent 对齐） */
export function TheorySectionRenderer({ section, contentKey }: TheorySectionRendererProps) {
  const { t } = useTranslation();
  const content = contentKey ? t(contentKey, { defaultValue: section.content }) : section.content;
  switch (section.type) {
    case 'heading':
      return (
        <h2 className="font-display text-[18px] text-[var(--ivory)] tracking-wide pt-2">
          {content}
        </h2>
      );

    case 'text':
      return (
        <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">
          {content}
        </p>
      );

    case 'highlight':
      return (
        <div className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--ivory-muted)] leading-relaxed">{content}</p>
        </div>
      );

    case 'key-point':
      return (
        <div className="rounded-lg border border-[var(--felt-light)]/50 bg-[var(--felt-light)]/10 p-4 flex items-start gap-3">
          <KeyRound className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--ivory-muted)] leading-relaxed">{content}</p>
        </div>
      );

    case 'formula':
      return (
        <div className="overflow-x-auto">
          <div className="rounded-lg border border-[var(--brass)]/30 bg-[var(--felt-deep)] p-4 flex items-start gap-3">
            <Sigma className="w-5 h-5 text-[var(--brass-bright)] shrink-0 mt-0.5" />
            <p className="text-base text-[var(--ivory)] font-mono leading-relaxed whitespace-pre-line">
              {content}
            </p>
          </div>
        </div>
      );

    case 'example':
      return (
        <div className="rounded-lg bg-[var(--felt-deep)] border border-[var(--walnut-border)] p-4">
          <p className="text-sm text-[var(--ivory-dim)] whitespace-pre-line leading-relaxed">
            {content}
          </p>
        </div>
      );

    case 'pro-tip':
      return <ProTipBox content={content} />;

    default:
      return (
        <p className="text-sm text-[var(--ivory-dim)] leading-relaxed">{content}</p>
      );
  }
}
