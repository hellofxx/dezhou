/**
 * AcademyPeek — quiz 原文 peek 折叠壳（理论 / 策略两院共用）。
 * 折叠头走 ui/Button quiet（sharedPrimitiveUsage 合规）+ ChevronDown/Up，
 * aria-expanded / aria-controls 关联展开区；展开区限高滚动（max-h-80）。
 * label 与 children 由消费者注入：shared 不 import feature、不新增 shared i18n key。
 */
import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface AcademyPeekProps {
  /** 折叠头文案（由消费者注入，如 academy.quiz.peek / theory.quiz.peek） */
  label: string;
  /** 展开区内容（只读原文，由 feature 薄件注入） */
  children: ReactNode;
  /** 初始是否展开，缺省折叠 */
  defaultOpen?: boolean;
}

export function AcademyPeek({ label, children, defaultOpen = false }: AcademyPeekProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt-deep)]/40">
      <Button
        variant="quiet"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full justify-between"
      >
        <span className="text-[13px]">{label}</span>
        {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
      </Button>
      {open ? (
        <div id={panelId} className="max-h-80 overflow-y-auto scrollbar-thin px-4 pb-4 space-y-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}