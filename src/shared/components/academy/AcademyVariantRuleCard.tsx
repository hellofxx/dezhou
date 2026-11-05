import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollText } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { transitionStandard } from '@/shared/utils/motion';

/** 规则卡行（标签与值已由包装层翻译，共享层不持有 i18n） */
export interface AcademyVariantRuleItem {
  /** 稳定行 id（对应 buildHeadsUpRuleRows 的 row.id） */
  id: string;
  /** 行标签（已翻译） */
  label: string;
  /** 行值（已翻译或语言中立数字） */
  value: string;
}

export interface AcademyVariantRuleCardProps {
  /** 卡片标题（各院传入已翻译文案） */
  title: string;
  /** 副标题：说明这张卡谈的是哪个变体的哪些规则 */
  subtitle?: string;
  /** 规则行：顺序由调用方决定（纯函数已固定顺序） */
  items: AcademyVariantRuleItem[];
  /** 脚注：位置补充 / 免责说明，缺省不渲染 */
  footnote?: ReactNode;
  /** section 的可访问名（缺省用 title） */
  ariaLabel?: string;
  /** 标题前置图标（缺省为卷轴） */
  icon?: ReactNode;
  /** 外层附加类名（间距由调用方决定） */
  className?: string;
}

/**
 * 变体规则卡（理论章节 / 策略课时共用，DESIGN.md §5 内容卡）。
 *
 * 只接收 props：不调 useTranslation、不读 store、不 import router 或任何 feature，
 * 翻译与变体判定留在各院薄包装（规则是否适用由包装层先判定，本卡不做变体分派）。
 * 视觉基线为理论学院 PracticeBridgeCard：felt-deep 底 + 黄铜 30% 描边，
 * 规则行走 felt 内容块 + walnut 描边；颜色一律取 DESIGN.md token。
 * 行语义为 `<dl>` + 成对 dt/dd（标签在左、值右对齐），空 items 整卡不渲染。
 */
export function AcademyVariantRuleCard({
  title,
  subtitle,
  items,
  footnote,
  ariaLabel,
  icon,
  className,
}: AcademyVariantRuleCardProps) {
  const prefersReducedMotion = useReducedMotion();

  if (items.length === 0) return null;

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionStandard}
      aria-label={ariaLabel ?? title}
      className={cn(
        'rounded-lg border border-[var(--brass)]/30 bg-[var(--felt-deep)] p-5',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[var(--brass-bright)]" aria-hidden="true">
          {icon ?? <ScrollText className="w-4 h-4" />}
        </span>
        <h3 className="font-display text-[16px] text-[var(--ivory)]">{title}</h3>
      </div>

      {subtitle ? (
        <p className="mb-3 mt-1 text-xs leading-relaxed text-[var(--ivory-muted)]">{subtitle}</p>
      ) : null}

      <dl className={cn('space-y-1.5', !subtitle && 'mt-3')}>
        {items.map((item) => (
          <div
            key={item.id}
            data-variant-rule={item.id}
            className="flex items-baseline justify-between gap-3 rounded-md border border-[var(--walnut-border)]/60 bg-[var(--felt)]/50 px-3 py-1.5"
          >
            <dt className="min-w-0 text-xs text-[var(--ivory-muted)]">{item.label}</dt>
            <dd className="shrink-0 text-xs text-[var(--ivory)]">{item.value}</dd>
          </div>
        ))}
      </dl>

      {footnote ? (
        <div className="mt-3 border-t border-[var(--walnut-border)]/60 pt-2 text-[11px] leading-relaxed text-[var(--ivory-muted)]">
          {footnote}
        </div>
      ) : null}
    </motion.section>
  );
}
