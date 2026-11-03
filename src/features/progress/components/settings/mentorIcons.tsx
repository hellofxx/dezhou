/**
 * 导师头像图标映射（MentorIconId → Lucide 组件）。
 *
 * `shared/types/mentor.ts` 只持有纯类型 iconId，渲染实现留在 progress 模块内
 * （shared/types 不引入 UI 依赖）。图标尺寸由调用方传入，默认沿用原 emoji 的
 * 24px（text-2xl）视觉尺寸。
 */
import { Calculator, Drama, Sparkles, type LucideIcon } from 'lucide-react';
import type { MentorIconId } from '@/shared/types/mentor';

export const MENTOR_ICONS: Record<MentorIconId, LucideIcon> = {
  calculator: Calculator,
  drama: Drama,
  sparkles: Sparkles,
};

interface MentorIconProps {
  iconId: MentorIconId;
  /** 尺寸/颜色类（默认 24px，与原 emoji 文本尺寸一致） */
  className?: string;
}

export default function MentorIcon({ iconId, className = 'w-6 h-6' }: MentorIconProps) {
  const Icon = MENTOR_ICONS[iconId];
  return <Icon aria-hidden="true" className={className} />;
}
