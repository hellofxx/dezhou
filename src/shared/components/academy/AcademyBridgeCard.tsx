import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronRight, Swords } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/button';
import { transitionStandard } from '@/shared/utils/motion';
import type { AcademyBridgeCta, AcademyBridgeItem } from '@/shared/types/academy';

export interface AcademyBridgeCardProps {
  /** 卡片标题（各院传入已翻译文案） */
  title: string;
  /** 副标题：说明这批推荐为什么出现在这里 */
  subtitle?: string;
  /** 推荐条目：整行可点，跳转由 onNavigate 负责 */
  items: AcademyBridgeItem[];
  /** 可选主 CTA（黄铜实底）：用于"进入轨道 / 继续学习"这类唯一主动作 */
  cta?: AcademyBridgeCta;
  /** 标题前置图标（缺省为交叉双剑） */
  icon?: ReactNode;
  /** CTA 前置图标（缺省为箭头） */
  ctaIcon?: ReactNode;
  /** section 的可访问名（缺省用 title） */
  ariaLabel?: string;
  /** 行按钮可访问名（缺省用条目 label） */
  itemAriaLabel?: (item: AcademyBridgeItem) => string;
  /** 跳转回调：共享层不持有路由，路由字符串由各院适配器提供 */
  onNavigate: (route: string) => void;
}

/**
 * 学院桥接卡（理论 → 实践 / 实践 → 理论共用，DESIGN.md §5 推荐项）。
 *
 * 只接收 props/callbacks：不读 store、不调 useNavigate、不 import 任何 feature，
 * 路由拼接与文案翻译留在各院薄包装。视觉基线为理论学院 PracticeBridgeCard：
 * felt-deep 底 + 黄铜 30% 描边，条目行 felt 底 + walnut 描边，CTA 走 --brass-fill。
 * 整卡只有一个高亮主按钮：条目行是等权目的地，CTA 才是主动作。
 *
 * 交互状态由 `Button` 接管（行项 quiet 语义）；CTA 已统一为 `variant="default"`
 * 金属件（V1），只保留布局类。
 */
export function AcademyBridgeCard({
  title,
  subtitle,
  items,
  cta,
  icon,
  ctaIcon,
  ariaLabel,
  itemAriaLabel,
  onNavigate,
}: AcademyBridgeCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const hasItems = items.length > 0;

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionStandard}
      aria-label={ariaLabel ?? title}
      className="rounded-lg border border-[var(--brass)]/30 bg-[var(--felt-deep)] p-5"
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[var(--brass-bright)]" aria-hidden="true">
          {icon ?? <Swords className="w-4 h-4" />}
        </span>
        <h3 className="font-display text-[16px] text-[var(--ivory)]">{title}</h3>
      </div>

      {subtitle ? (
        <p className="mb-4 mt-1 text-xs leading-relaxed text-[var(--ivory-muted)]">{subtitle}</p>
      ) : null}

      <ul className={cn(hasItems && 'space-y-2', hasItems && !subtitle && 'mt-4')}>
        {items.map((item) => (
          <li key={item.id}>
            <Button
              type="button"
              variant="quiet"
              onClick={() => onNavigate(item.route)}
              aria-label={itemAriaLabel?.(item) ?? item.label}
              className="flex h-auto w-full min-h-11 items-center justify-between gap-2 rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] px-4 py-2.5 text-left text-sm font-normal text-[var(--ivory-dim)] transition-all hover:border-[var(--brass)]/50 hover:bg-[var(--felt-raised)]/40 hover:text-[var(--ivory-dim)]"
            >
              <span className="min-w-0 truncate">{item.label}</span>
              <ChevronRight
                className="w-4 h-4 shrink-0 text-[var(--ivory-muted)]"
                aria-hidden="true"
              />
            </Button>
          </li>
        ))}
      </ul>

      {cta ? (
        <Button
          type="button"
          variant="default"
          onClick={() => onNavigate(cta.route)}
          aria-label={cta.label}
          className={cn(
            'flex h-auto w-full min-h-11 items-center justify-start gap-2 rounded-lg px-4 py-2.5 text-sm',
            hasItems || subtitle ? 'mt-2' : 'mt-4'
          )}
        >
          <span className="shrink-0" aria-hidden="true">
            {ctaIcon ?? <ArrowRight className="w-4 h-4" />}
          </span>
          <span className="min-w-0 truncate">{cta.label}</span>
        </Button>
      ) : null}
    </motion.section>
  );
}
