import { useTranslation } from 'react-i18next';
import { AlertTriangle, KeyRound, Lightbulb } from 'lucide-react';
import type { TheorySection } from '../types';
import {
  LabeledBlock,
  AsciiMonoText,
} from '@/shared/components/business/ContentBlocks';

interface TheorySectionRendererProps {
  section: TheorySection;
  /** i18n content key（渲染层 key 覆盖）：命中取译文，缺省回退数据层原文 */
  contentKey?: string;
  /** 章号（用于标题编号系统 §{章号}.{节号}） */
  chapterOrder?: number;
  /** 节号索引（0-based，用于标题编号上方 eyebrow） */
  sectionIndex?: number;
}

/**
 * 理论段落渲染器：按 section type 渲染。
 * 视觉词汇与 strategy-academy ContentBlock 严格对齐（P2-01 统一骨架）：
 * heading text-[20px] / text leading-[1.7] max-w-3xl / LabeledBlock 标签骨架 /
 * formula-display（§13.3.2）/ AsciiMonoText / 语义色图标。
 * §13.3.3：heading 上方渲染 .section-number eyebrow（§{章号}.{节号}）。
 */
export function TheorySectionRenderer({
  section,
  contentKey,
  chapterOrder,
  sectionIndex,
}: TheorySectionRendererProps) {
  const { t } = useTranslation();
  const content = contentKey ? t(contentKey, { defaultValue: section.content }) : section.content;
  // §13.3.3 课程标题编号系统：eyebrow 前缀 §{章号}.{节号}（缺章号时仅 §{节号}）
  const sectionNumber =
    chapterOrder !== undefined && sectionIndex !== undefined
      ? `§${chapterOrder}.${sectionIndex + 1}`
      : sectionIndex !== undefined
        ? `§${sectionIndex + 1}`
        : undefined;
  switch (section.type) {
    case 'heading':
      return (
        <div className="mt-6 first:mt-0">
          {sectionNumber !== undefined && <span className="section-number">{sectionNumber}</span>}
          <h2 className="font-display text-[20px] text-[var(--ivory)] tracking-wide">
            {content}
          </h2>
        </div>
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
          wrapClass="border border-[var(--poker-success)]/30 border-l-[3px] border-l-[var(--poker-success)] bg-[var(--poker-success-bg)]"
          content={content}
        />
      );

    case 'formula':
      return (
        <div className="formula-display whitespace-pre-line">{content}</div>
      );

    case 'takeaway':
      return <LessonTakeawayBlock content={content} />;

    case 'example':
      return (
        <div className="rounded-lg bg-[var(--felt-deep)] border border-[var(--walnut-border)] p-4">
          <AsciiMonoText content={content} />
        </div>
      );

    case 'pro-tip':
      return (
        <LabeledBlock
          icon={Lightbulb}
          iconClass="text-[var(--brass-bright)]"
          label={t('academy.content.proTip')}
          labelClass="text-[var(--brass-bright)] uppercase tracking-wider"
          wrapClass="border border-[var(--brass)]/40 border-l-[3px] border-l-[var(--brass)] bg-[var(--brass)]/5"
          content={content}
        />
      );

    default:
      return (
        <p className="text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line max-w-3xl">
          {content}
        </p>
      );
  }
}

/**
 * 要点总结卡（§13.3.1）：walnut-raised 底 + brass-deep 顶边 + brass 左侧竖线，
 * 内容按换行拆分为带 brass 圆点的小项列表（与 strategy-academy ContentBlock 对齐）。
 */
function LessonTakeawayBlock({ content }: { content: string }) {
  const { t } = useTranslation();
  const items = content.split('\n').map((s) => s.trim()).filter(Boolean);
  return (
    <div className="lesson-takeaway">
      <p className="text-sm font-semibold text-[var(--ivory)] mb-2">
        {t('academy.content.takeaway')}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-sm text-[var(--ivory-dim)] leading-[1.7] flex items-start gap-2"
          >
            <span aria-hidden="true" className="mt-[9px] w-1.5 h-1.5 shrink-0 rounded-full bg-[var(--brass)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
