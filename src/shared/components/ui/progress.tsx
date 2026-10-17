"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/shared/utils"

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** 无障碍标签：传入时写入 aria-label，数值语义由 Radix Root 提供 */
  label?: string
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, label, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    // value 必须下传：Radix Root 只有在拿到 value 时才输出 aria-valuenow /
    // aria-valuetext / data-state，否则读屏器只播报「进度条」而无数值。
    value={value}
    aria-label={label}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-[var(--progress-track)]",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-gradient-to-r from-[var(--brass)] to-[var(--brass-bright)] shadow-[0_0_6px_color-mix(in_srgb,var(--brass-bright)_30%,transparent)] transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
