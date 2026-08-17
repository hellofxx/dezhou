export interface MilestoneMarkerProps {
  /** 标注文字，如"距下一段位还需 120 ELO" */
  label: string;
  /** 进度条上的 left 百分比位置 0-100 */
  leftPercent: number;
}

/**
 * MilestoneMarker — 进度条上的小菱形里程碑标记（DESIGN_LANGUAGE §13.2.3）。
 * 使用全局类 .milestone-marker（globals.css，6px 菱形 brass-bright），
 * 标注文字位于标记点上方 4px（9px ivory-muted）。
 */
export default function MilestoneMarker({ label, leftPercent }: MilestoneMarkerProps) {
  return (
    <div className="relative h-0" style={{ left: `${leftPercent}%` }}>
      <span className="milestone-marker" role="img" aria-label={label} />
      <span className="absolute left-1/2 bottom-[7px] -translate-x-1/2 whitespace-nowrap text-[9px] leading-none tracking-[0.02em] text-[var(--poker-ivory-muted)]">
        {label}
      </span>
    </div>
  );
}
