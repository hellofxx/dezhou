/**
 * StatPair — Hero 首屏的横向指标列（<dl> 语义：每项 dt 标签 + dd 数值）。
 * 策略学院 / 理论学院「继续学习」卡共用；容器类名由消费方传入（academy-hero-stats / theory-hero-stats）。
 */
export interface StatPairItem {
  value: React.ReactNode;
  label: string;
}

export interface StatPairProps {
  items: StatPairItem[];
  className?: string;
}

export function StatPair({ items, className }: StatPairProps) {
  return (
    <dl className={className}>
      {items.map((item, index) => (
        <div key={index} className="flex items-baseline gap-2">
          <dt className="text-[10px] text-[var(--ivory-muted)]">{item.label}</dt>
          <dd className="font-numeric text-sm text-[var(--brass-bright)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
