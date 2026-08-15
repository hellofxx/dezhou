/**
 * 统计卡片 - 跨模块通用指标展示组件
 * 用于 range-trainer、puzzle-trainer、progress、hand-history 等模块的统计数据呈现
 */
import { Card, CardContent } from '@/shared/components/ui/card';

interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  accent?: 'gold' | 'green' | 'default' | 'sage';
}

export function StatCard({
  icon,
  label,
  value,
  suffix = '',
  accent = 'default',
}: StatCardProps) {
  const accentColor = {
    gold: 'text-[var(--brass-bright)]',
    green: 'text-[var(--success)]',
    sage: 'text-[var(--sage)]',
    default: 'text-[var(--ivory)]',
  }[accent];

  return (
    <Card className="bg-[var(--surface)] border-[var(--walnut-border)] rounded-[var(--radius)] shadow-[var(--shadow-sm)]">
      <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
        {icon && <div className="text-[var(--ivory-dim)]">{icon}</div>}
        <div className="text-[10px] uppercase tracking-wider text-[var(--ivory-dim)]">
          {label}
        </div>
        <div className={`font-numeric text-xl ${accentColor}`}>
          {value}{suffix}
        </div>
      </CardContent>
    </Card>
  );
}
