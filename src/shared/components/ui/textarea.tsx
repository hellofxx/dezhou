import * as React from "react"

import { cn } from "@/shared/utils/cn"
import { FOCUS_RING } from "@/shared/components/ui/focusRing"

/**
 * 多行文本字段基础件：与 `Input` 同 token 体系（border-input / bg-background /
 * placeholder:text-muted-foreground / disabled 态），焦点环统一走 `FOCUS_RING` 单源。
 * 不提供 variant：尺寸与表面色由消费方用 className 覆盖（结构批次保持原视觉）。
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          FOCUS_RING,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
