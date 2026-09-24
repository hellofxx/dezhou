import { cn } from '@/shared/utils/cn';

export interface MottoEngravedProps {
  /** 铭文文字，如 "知其道者 · 不惑于局" */
  text: string;
  className?: string;
}

/**
 * MottoEngraved — 黄铜镌刻铭文，两侧带发丝线。
 * 用于 FeltArena hero 区域。
 * 注意：中文文字禁止使用 italic（DESIGN_LANGUAGE §3.2）。
 */
export default function MottoEngraved({ text, className }: MottoEngravedProps) {
  return (
    <div className={cn('motto-engraved', className)} aria-label={text}>
      <span className="motto-line" aria-hidden="true" />
      <span className="motto-text">{text}</span>
      <span className="motto-line" aria-hidden="true" />
    </div>
  );
}
