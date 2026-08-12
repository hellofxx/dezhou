import { AlertTriangle, KeyRound, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LessonSection } from '../../types';
import { FormulaBlock, AsciiMonoText } from './FormulaBlock';
import { LabeledBlock } from '@/shared/components/business/ContentBlocks';
import { TheoryReferenceBlock } from './TheoryReferenceBlock';
import { DiagramBlock, HandExampleBlock } from './DiagramBlock';

interface ContentBlockProps {
  section: LessonSection;
  /** i18n content key（渲染层 key 覆盖）：命中取译文，缺省回退数据层原文 */
  contentKey?: string;
}

/**
 * 内容块统一分发组件（P2-01 视觉词汇统一）。
 * 统一骨架：rounded-lg p-4 / 图标 20px 语义色 shrink-0 / 标签 text-xs font-semibold /
 * 正文 text-sm text-[var(--ivory-dim)] leading-relaxed。
 */
export function ContentBlock({ section, contentKey }: ContentBlockProps) {
  const { t } = useTranslation();
  const resolvedContent = contentKey ? t(contentKey, { defaultValue: section.content }) : section.content;
  switch (section.type) {
    case 'heading':
      return (
        <h2 className="font-display text-[20px] text-[var(--ivory)] tracking-wide mt-6 first:mt-0">
          {resolvedContent}
        </h2>
      );

    case 'text':
      return (
        <p
          /* 正文段落限宽 max-w-3xl（768px 阅读宽度），与放宽后的容器（max-w-4xl）形成层次 */
          className="text-sm text-[var(--ivory-dim)] leading-[1.7] tracking-[0.01em] whitespace-pre-line max-w-3xl"
        >
          {resolvedContent}
        </p>
      );

    case 'highlight':
      return (
        <div className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">
            {resolvedContent}
          </p>
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
          content={resolvedContent}
        />
      );

    case 'pro-tip':
      return (
        <LabeledBlock
          icon={Lightbulb}
          iconClass="text-[var(--brass-bright)]"
          label={t('academy.content.proTip')}
          labelClass="text-[var(--brass-bright)] uppercase tracking-wider"
          wrapClass="border border-[var(--brass)]/40 bg-[var(--brass)]/5"
          content={resolvedContent}
        />
      );

    case 'counter-intuitive':
      return (
        <LabeledBlock
          icon={Lightbulb}
          iconClass="text-[var(--poker-terra-bright)]"
          label={t('academy.content.counterIntuitive')}
          labelClass="text-[var(--poker-terra-bright)]"
          wrapClass="border border-[var(--poker-terra)]/40 bg-[var(--poker-terra)]/15"
          content={resolvedContent}
        />
      );

    case 'formula':
      return <FormulaBlock content={resolvedContent} />;

    case 'example':
      return (
        <div className="rounded-lg bg-[var(--felt-deep)] border border-[var(--walnut-border)] p-4">
          <AsciiMonoText content={resolvedContent} />
        </div>
      );

    case 'theory-reference':
      return <TheoryReferenceBlock section={section} contentKey={contentKey} />;

    case 'diagram':
      return <DiagramBlock section={section} contentKey={contentKey} />;

    case 'hand-example':
      return <HandExampleBlock section={section} contentKey={contentKey} />;

    default:
      return (
        <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line max-w-3xl">
          {resolvedContent}
        </p>
      );
  }
}


