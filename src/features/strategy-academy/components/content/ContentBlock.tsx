import { AlertTriangle, KeyRound, Lightbulb, type LucideIcon } from 'lucide-react';
import type { LessonSection } from '../../types';
import { FormulaBlock, AsciiMonoText } from './FormulaBlock';
import { TheoryReferenceBlock } from './TheoryReferenceBlock';
import { DiagramBlock, HandExampleBlock } from './DiagramBlock';

interface ContentBlockProps {
  section: LessonSection;
}

/**
 * 内容块统一分发组件（P2-01 视觉词汇统一）。
 * 统一骨架：rounded-lg p-4 / 图标 20px 语义色 shrink-0 / 标签 text-xs font-semibold /
 * 正文 text-sm text-[var(--ivory-dim)] leading-relaxed。
 */
export function ContentBlock({ section }: ContentBlockProps) {
  switch (section.type) {
    case 'heading':
      return (
        <h2 className="font-display text-[20px] text-[var(--ivory)] tracking-wide mt-6 first:mt-0">
          {section.content}
        </h2>
      );

    case 'text':
      return (
        <p
          /* 正文段落限宽 max-w-3xl（768px 阅读宽度），与放宽后的容器（max-w-4xl）形成层次 */
          className="text-sm text-[var(--ivory-dim)] leading-[1.7] tracking-[0.01em] whitespace-pre-line max-w-3xl"
        >
          {section.content}
        </p>
      );

    case 'highlight':
      return (
        <div className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">
            {section.content}
          </p>
        </div>
      );

    case 'key-point':
      return (
        <LabeledBlock
          icon={KeyRound}
          iconClass="text-[var(--poker-success)]"
          label="关键要点"
          labelClass="text-[var(--poker-success)]"
          wrapClass="border border-[var(--poker-success)]/30 bg-[var(--poker-success-bg)]"
          content={section.content}
        />
      );

    case 'pro-tip':
      return (
        <LabeledBlock
          icon={Lightbulb}
          iconClass="text-[var(--brass-bright)]"
          label="职业牌手说"
          labelClass="text-[var(--brass-bright)] uppercase tracking-wider"
          wrapClass="border border-[var(--brass)]/40 bg-[var(--brass)]/5"
          content={section.content}
        />
      );

    case 'counter-intuitive':
      return (
        <LabeledBlock
          icon={Lightbulb}
          iconClass="text-[var(--poker-terra-bright)]"
          label="反直觉点"
          labelClass="text-[var(--poker-terra-bright)]"
          wrapClass="border border-[var(--poker-terra)]/40 bg-[var(--poker-terra)]/15"
          content={section.content}
        />
      );

    case 'formula':
      return <FormulaBlock content={section.content} />;

    case 'example':
      return (
        <div className="rounded-lg bg-[var(--felt-deep)] border border-[var(--walnut-border)] p-4">
          <AsciiMonoText content={section.content} />
        </div>
      );

    case 'theory-reference':
      return <TheoryReferenceBlock section={section} />;

    case 'diagram':
      return <DiagramBlock section={section} />;

    case 'hand-example':
      return <HandExampleBlock section={section} />;

    default:
      return (
        <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line max-w-3xl">
          {section.content}
        </p>
      );
  }
}

interface LabeledBlockProps {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  labelClass: string;
  wrapClass: string;
  content: string;
}

/** 图标 + 标签 + 正文的通用骨架（key-point / pro-tip / counter-intuitive 共用） */
function LabeledBlock({ icon: Icon, iconClass, label, labelClass, wrapClass, content }: LabeledBlockProps) {
  return (
    <div className={`rounded-lg ${wrapClass} p-4 flex items-start gap-3`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClass}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold mb-1.5 ${labelClass}`}>{label}</p>
        <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </div>
  );
}
