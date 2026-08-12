import { useTranslation } from 'react-i18next';
import { AlertTriangle, KeyRound } from 'lucide-react';
import type { TheorySection } from '../types';
import {
  LabeledBlock,
  AsciiMonoText,
  FormulaBlock,
} from '@/shared/components/business/ContentBlocks';
import { ProTipBox } from './ProTipBox';

interface TheorySectionRendererProps {
  section: TheorySection;
  /** i18n content key（渲染层 key 覆盖）：命中取译文，缺省回退数据层原文 */
  contentKey?: string;
}

/**
 * 理论段落渲染器：按 section type 渲染。
 * 视觉词汇与 strategy-academy ContentBlock 严格对齐（P2-01 统一骨架）：
 * heading text-[20px] / text leading-[1.7] max-w-3xl / LabeledBlock 标签骨架 /
 * FormulaBlock / AsciiMonoText / 语义色图标。
 */
export function TheorySectionRenderer({ section, contentKey }: TheorySectionRendererProps) {
  const { t } = useTranslation();
  const content = contentKey ? t(contentKey, { defaultValue: section.content }) : section.content;
  switch (section.type) {
    case 'heading':
      return (
        <h2 className="font-display text-[20px] text-[var(--ivory)] tracking-wide mt-6 first:mt-0">
          {content}
        </h2>
      );

    case 'text':
      return (
        <p className="text-sm text-[var(--ivory-dim)] leading-[1.7] tracking-[0.01em] whitespace-pre-line max-w-3xl">
          {content}
        </p>
      );

    case 'highlight':
      return (
        <div className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">{content}</p>
        </div>
      );

    case 'key-point':
      return (
        <LabeledBlock
          icon={KeyRound}
          iconClass="text-[var(--poker-success)]"
          label={t('academy.content.keyPoint')}
          labelClass="text-[var(--poker-success)]"
          wrapClass="border border-[var(--poker-success)]/30 bg-[var(--poker-success-bg)]"
          content={content}
        />
      );

    case 'formula':
      return <FormulaBlock content={content} />;

    case 'example':
      return (
        <div className="rounded-lg bg-[var(--felt-deep)] border border-[var(--walnut-border)] p-4">
          <AsciiMonoText content={content} />
        </div>
      );

    case 'pro-tip':
      return <ProTipBox content={content} />;

    default:
      return (
        <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line max-w-3xl">
          {content}
        </p>
      );
  }
}
