import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/utils/cn"
import { BUTTON_FOCUS_RING } from "@/shared/components/ui/focusRing"

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors ${BUTTON_FOCUS_RING} disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        // 一级金属件：黄铜渐变 + 投影（每屏唯一主动作，DESIGN.md §5.5）
        default: "btn-brass",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        // 二级金属件：深胡桃金属 + 黄铜字（同组次动作，DESIGN.md §5.5）
        secondary: "btn-metal",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // 结构批次：设计系统的 quiet / link 语义，供 shared 组件 dogfooding 使用。
        // 视觉统一（ghost/outline/destructive 收口）留给 V1。
        quiet:
          "bg-transparent text-[var(--ivory-dim)] hover:bg-[color-mix(in_srgb,var(--ivory)_6%,transparent)] hover:text-[var(--ivory)]",
        link: "text-[var(--brass-text)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 max-md:min-h-11",
        sm: "h-9 rounded-md px-3 max-md:min-h-11",
        lg: "h-11 rounded-md px-8",
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
