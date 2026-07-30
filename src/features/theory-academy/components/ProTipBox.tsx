interface ProTipBoxProps {
  content: string;
}

/** 职业建议提示框（与 strategy-academy ProTip 视觉对齐，模块内自持避免跨模块引用） */
export function ProTipBox({ content }: ProTipBoxProps) {
  return (
    <div className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">💡</span>
        <div>
          <p className="text-xs font-semibold text-[var(--gold)] mb-1.5 uppercase tracking-wider">
            职业牌手说
          </p>
          <p className="text-sm text-[var(--ivory-dim)] leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}
