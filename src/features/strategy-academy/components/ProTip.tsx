interface ProTipProps {
  content: string;
}

export function ProTip({ content }: ProTipProps) {
  return (
    <div className="rounded-lg border border-[var(--brass)]/40 bg-[var(--brass)]/5 p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">💡</span>
        <div>
          <p className="text-xs font-semibold text-[var(--brass-bright)] mb-1.5 uppercase tracking-wider">
            职业牌手说
          </p>
          <p className="text-sm text-[var(--ivory-dim)] leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}
