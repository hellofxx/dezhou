import { cn } from '@/shared/utils/cn';

export interface CasinoPlaqueProps {
  /** 数值，如 "247"、"78.4%" */
  value: string;
  /** 标签，如 "训练总手" */
  label: string;
  /** 副文本，如 "+23 本周" */
  sub?: string;
  /** 尺寸，默认 'md' */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * CasinoPlaque — 象牙色赌场铭牌，黄铜描边。
 * 用于 FeltArena 数据展示。
 */
export default function CasinoPlaque({ value, label, sub, size = 'md', className }: CasinoPlaqueProps) {
  return (
    <div
      className={cn('casino-plaque', size === 'sm' && 'plaque-sm', className)}
      role="group"
      aria-label={`${label}: ${value}${sub ? ` (${sub})` : ''}`}
    >
      <span className="casino-plaque-value font-numeric">{value}</span>
      <span className="casino-plaque-label">{label}</span>
      {sub && <span className="casino-plaque-sub">{sub}</span>}
    </div>
  );
}
