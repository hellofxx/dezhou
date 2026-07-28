import { cn } from '@/shared/utils';
import { Input } from '@/shared/components/ui/input';

interface PotSizeInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  className?: string;
  quickButtons?: { label: string; value: number }[];
}

export function PotSizeInput({
  label,
  value,
  onChange,
  min = 0,
  max = 10000,
  step = 1,
  prefix = '',
  className,
  quickButtons,
}: PotSizeInputProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm text-[var(--text-secondary)]">{label}</label>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm text-[var(--text-muted)]">{prefix}</span>}
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
            }}
            className="w-24 h-8 text-right font-mono text-sm bg-[var(--surface)] border-[var(--surface-hover)]"
            min={min}
            max={max}
            step={step}
          />
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--surface-hover)] accent-[var(--primary)]"
      />
      {quickButtons && quickButtons.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {quickButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={() => onChange(btn.value)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors font-numeric',
                value === btn.value
                  ? 'bg-[var(--brass)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--walnut-raised)]/60 text-[var(--ivory-dim)] hover:bg-[var(--brass)]/15 hover:text-[var(--brass-bright)]'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
