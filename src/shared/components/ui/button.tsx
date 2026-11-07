import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/utils/cn"
import { FOCUS_RING } from "@/shared/components/ui/focusRing"

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors ${FOCUS_RING} disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        // 一级金属件：黄铜渐变 + 投影（每屏唯一主动作，DESIGN.md §5.5）
        default: "btn-brass font-semibold",
        // 危险 / 折叠语义：低饱和 danger 底 + danger 字（V1 收口）
        destructive:
          "border border-[var(--poker-danger)]/25 bg-[var(--poker-danger-bg)] text-[var(--danger-text)] font-semibold hover:bg-[var(--poker-danger)]/18",
        // 次级描边：透明底 + 胡桃边（V1 收口）
        outline:
          "border border-[var(--walnut-border)] bg-transparent text-[var(--ivory-dim)] font-semibold hover:border-[var(--brass)]/50 hover:text-[var(--ivory)]",
        // 二级金属件：深胡桃金属 + 黄铜字（同组次动作，DESIGN.md §5.5）
        secondary: "btn-metal font-semibold",
        // 三级 quiet：接设计系统 .btn-quiet（V1 收口）
        ghost: "btn-quiet font-semibold",
        quiet:
          "bg-transparent text-[var(--ivory-dim)] font-semibold hover:bg-[color-mix(in_srgb,var(--ivory)_6%,transparent)] hover:text-[var(--ivory)]",
        link: "text-[var(--brass-text)] underline-offset-4 hover:underline",
      },
      size: {
        // 默认尺寸复刻金属族原有 padding / radius；因 .btn-* 已入 components 层，
        // size 变体现在可以真正覆盖布局属性。
        default: "h-auto px-[18px] py-[10px] rounded-lg max-md:min-h-11",
        sm: "h-auto rounded-md px-3 py-2 max-md:min-h-11",
        lg: "h-auto rounded-lg px-6 py-2.5",
        icon: "h-10 w-10 max-md:h-11 max-md:w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
