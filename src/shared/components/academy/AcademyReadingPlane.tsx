import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

interface AcademyReadingPlaneProps {
  /** 主阅读列（xl 以下居中单栏，xl 起上限 768px） */
  children: ReactNode;
  /** 学习导轨内容（xl 起显示） */
  rail: ReactNode;
  /** 导轨可访问名（<aside> 的 aria-label） */
  railLabel: string;
  /** 主阅读列的附加类名（如纵向节奏 space-y-5） */
  contentClassName?: string;
}

/**
 * 两院阅读页双栏骨架（理论章节 / 策略课时共用）。
 * 主阅读列保持 768px 上限（DESIGN.md §6.5 L3），右侧 264px 学习导轨承接宽屏横向空间，
 * 把两侧留白转为本级目录与进度；xl 以下回落居中单栏，不挤压正文。
 */
export function AcademyReadingPlane({
  children,
  rail,
  railLabel,
  contentClassName,
}: AcademyReadingPlaneProps) {
  return (
    <div className="mx-auto w-full max-w-[1064px] xl:grid xl:grid-cols-[minmax(0,1fr)_264px] xl:items-start xl:gap-8">
      <div className={cn('mx-auto w-full min-w-0 max-w-3xl xl:max-w-none', contentClassName)}>
        {children}
      </div>
      <aside
        aria-label={railLabel}
        className="hidden scrollbar-thin xl:sticky xl:top-2 xl:block xl:max-h-[calc(100vh-7rem)] xl:self-start xl:overflow-y-auto"
      >
        {rail}
      </aside>
    </div>
  );
}
