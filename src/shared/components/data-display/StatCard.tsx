/**
 * 统计卡片 - 跨模块通用指标展示组件
 * 用于 range-trainer、puzzle-trainer、progress、hand-history 等模块的统计数据呈现
 */
import { Card, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';

export interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  accent?: 'gold' | 'green' | 'default' | 'sage';
  /** 尺寸档：sm 紧凑指标（text-lg + 小标签）/ md 默认卡片（text-xl）/ lg 页头指标（text-xl 加粗 + 小标签） */
  size?: 'sm' | 'md' | 'lg';
  /** 布局：stack 图标在上、标签在数值上（默认）/ inline 图标在左、数值在标签上 */
  layout?: 'stack' | 'inline';
  /** stack 布局下数值在上（兼容 hand-history 原「值上标签下」的指标卡） */
  valueFirst?: boolean;
  /** 表面材质：default 默认卡面 / flat 扁平表面色 / raised 胡桃木凸起（无阴影） */
  surface?: 'default' | 'flat' | 'raised';
}

const ACCENT_CLASS: Record<NonNullable<StatCardProps['accent']>, string> = {
  gold: 'text-[var(--brass-bright)]',
  green: 'text-[var(--success)]',
  sage: 'text-[var(--sage-text)]',
  default: 'text-[var(--ivory)]',
};

const SURFACE_CLASS: Record<NonNullable<StatCardProps['surface']>, string> = {
  default:
    'bg-[var(--surface)] border-[var(--walnut-border)] rounded-[var(--radius)] shadow-[var(--shadow-sm)]',
  flat: 'bg-[var(--surface)] border-[var(--surface-raised)]',
  raised:
    'bg-[var(--walnut-raised)]/40 border-[var(--walnut-border)] rounded-xl shadow-none',
};

/** 尺寸档只覆盖数值与标签排版；数值色由 accent 决定 */
const SIZE_CLASS: Record<
  NonNullable<StatCardProps['size']>,
  { value: string; label: string }
> = {
  sm: {
    value: 'text-lg font-bold',
    label: 'text-[10px] text-[var(--ivory-muted)] font-display tracking-wide',
  },
  md: {
    value: 'text-xl',
    label: 'text-[10px] uppercase tracking-wider text-[var(--ivory-dim)]',
  },
  lg: {
    // 数值保持 text-xl（progress 单模块统计页原样），标签降为 text-xs 并加粗数值
    value: 'text-xl font-bold',
    label: 'text-xs text-[var(--ivory-dim)]',
  },
};

export function StatCard({
  icon,
  label,
  value,
  suffix = '',
  accent = 'default',
  size = 'md',
  layout = 'stack',
  valueFirst = false,
  surface = 'default',
}: StatCardProps) {
  const isInline = layout === 'inline';
  const sizeClass = SIZE_CLASS[size];
  const accentColor = ACCENT_CLASS[accent];

  // 数值：font-numeric 为设计 token 字体（禁 font-mono 直连系统等宽字体栈）
  const valueNode = (
    <div className={`font-numeric ${sizeClass.value} ${accentColor}`}>
      {value}
      {suffix}
    </div>
  );
  const labelNode = <div className={sizeClass.label}>{label}</div>;

  return (
    <Card className={cn(SURFACE_CLASS[surface])}>
      <CardContent
        className={
          isInline ? 'p-4 flex items-center gap-3' : 'p-3 flex flex-col items-center gap-1 text-center'
        }
      >
        {icon && (
          <div className={cn('text-[var(--ivory-dim)]', isInline && 'shrink-0')}>{icon}</div>
        )}
        {isInline ? (
          <div>
            {valueNode}
            {labelNode}
          </div>
        ) : valueFirst ? (
          <>
            {valueNode}
            {labelNode}
          </>
        ) : (
          <>
            {labelNode}
            {valueNode}
          </>
        )}
      </CardContent>
    </Card>
  );
}
