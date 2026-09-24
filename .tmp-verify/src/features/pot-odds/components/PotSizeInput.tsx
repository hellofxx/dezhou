import { useState } from 'react';
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
  // P1B-06：本地字符串草稿态——清空/非法输入时 DOM 显示与 state 不再脱节：
  // 输入中显示草稿原文，失焦时丢弃草稿回填 state 值（无效输入不会留下空白 DOM + 旧值计算）
  const [draft, setDraft] = useState<string | null>(null);
  // P1B-07：统一 clamp，数字输入与快捷按钮均不得绕过 min/max
  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm text-[var(--text-secondary)]">{label}</label>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-sm text-[var(--text-muted)]">{prefix}</span>}
          <Input
            type="number"
            value={draft ?? value}
            onChange={(e) => {
              setDraft(e.target.value);
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(clamp(v));
            }}
            onBlur={() => setDraft(null)}
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
        onChange={(e) => onChange(clamp(parseFloat(e.target.value)))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--surface-hover)] accent-[var(--primary)]"
      />
      {quickButtons && quickButtons.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {quickButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={() => onChange(clamp(btn.value))}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors font-numeric',
                value === clamp(btn.value)
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
