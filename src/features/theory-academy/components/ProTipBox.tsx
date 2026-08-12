import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react';
import { LabeledBlock } from '@/shared/components/business/ContentBlocks';

interface ProTipBoxProps {
  content: string;
}

/**
 * 职业建议提示框：复用 shared LabeledBlock 骨架，
 * 与 strategy-academy ContentBlock 的 pro-tip 视觉完全一致（Lightbulb + 标签）。
 */
export function ProTipBox({ content }: ProTipBoxProps) {
  const { t } = useTranslation();
  return (
    <LabeledBlock
      icon={Lightbulb}
      iconClass="text-[var(--brass-bright)]"
      label={t('academy.content.proTip')}
      labelClass="text-[var(--brass-bright)] uppercase tracking-wider"
      wrapClass="border border-[var(--brass)]/40 bg-[var(--brass)]/5"
      content={content}
    />
  );
}
