/**
 * 设置页基础件：折叠分区、设置行、开关、分段选择。
 *
 * 纸面（.dealer-slip）内所有色值只取 token，避免把暗色房间亮阶带进纸条；
 * 触摸目标统一 ≥44px，焦点环复用 shared FOCUS_RING 单源。
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';
import { transitionStandard } from '@/shared/utils/motion';

interface SettingsSectionProps {
  id: string;
  icon: ReactNode;
  title: string;
  hint?: string;
  /** 折叠态显示的当前取值（比静态 hint 更有用；展开后让位给 hint） */
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function SettingsSection({
  id,
  icon,
  title,
  hint,
  summary,
  defaultOpen = false,
  children,
}: SettingsSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const headingId = `settings-heading-${id}`;
  const regionId = `settings-${id}`;
  const secondary = !open && summary ? summary : hint;

  return (
    <section
      id={`settings-section-${id}`}
      aria-labelledby={headingId}
      className="scroll-mt-4 overflow-hidden rounded-lg border border-[var(--walnut-border)] bg-[var(--surface-raised)]"
    >
      <h3 id={headingId} className="m-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={open ? regionId : undefined}
          className={cn(
            'flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--walnut-raised)]/40',
            FOCUS_RING,
          )}
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--brass-glow)] text-[var(--brass-text)]"
          >
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[var(--ivory)]">{title}</span>
            {secondary && (
              <span
                className={cn(
                  'mt-0.5 block truncate text-xs',
                  !open && summary
                    ? 'font-numeric tracking-tight text-[var(--brass-text)]'
                    : 'text-[var(--ivory-muted)]',
                )}
              >
                {secondary}
              </span>
            )}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'h-4 w-4 shrink-0 text-[var(--ivory-muted)] transition-transform duration-300',
              open && 'rotate-180',
            )}
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={`${regionId}-content`}
            id={regionId}
            role="region"
            aria-labelledby={headingId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitionStandard}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 border-t border-[var(--walnut-border)]/60 px-4 pb-4 pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function SettingRow({ label, description, icon, children }: SettingRowProps) {
  return (
    <div className="flex flex-col gap-2 py-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--walnut-raised)]/60 text-[var(--ivory-dim)]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--ivory)]">{label}</div>
          <div className="text-xs leading-relaxed text-[var(--ivory-muted)]">{description}</div>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:shrink-0">
        {children}
      </div>
    </div>
  );
}

interface SwitchToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

export function SwitchToggle({ checked, onChange, label }: SwitchToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 active:scale-95',
        // 可见轨道 24px；伪元素把可点区域扩到 44px（触摸目标）
        "before:absolute before:-inset-2.5 before:content-['']",
        checked ? 'bg-[var(--brass)]' : 'bg-[var(--walnut-border)]',
        FOCUS_RING,
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform duration-200',
          'bg-[var(--stable-ivory)]',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  /** 可见标签（数字 / 符号优先，长文案放 ariaLabel） */
  label: ReactNode;
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex w-full flex-wrap items-center gap-0.5 rounded-md border border-[var(--walnut-border)] bg-[var(--background)] p-0.5 sm:w-auto',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] px-2 text-xs font-semibold transition-colors max-md:min-h-11 sm:flex-none sm:px-3',
              active
                ? 'bg-[var(--brass)] text-[var(--stable-ink)] shadow-sm'
                : 'text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)] hover:text-[var(--ivory)]',
              FOCUS_RING,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}