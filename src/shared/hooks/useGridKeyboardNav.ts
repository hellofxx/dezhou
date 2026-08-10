import { useCallback } from 'react';

/**
 * 网格/图节点键盘可达性共享 hook（G2 三处消费：RangeGrid / StrategyMatrix / ConceptGraph）。
 * 为"可点击 div/SVG 节点"统一补充 role="button" + tabIndex + onKeyDown(Enter/Space)。
 * 满足 shared 层 ≥2 模块准入门槛。
 */
export interface GridKeyboardNavOptions {
  /** 禁用时 tabIndex=-1 且不响应键盘 */
  disabled?: boolean;
}

export interface GridKeyboardNavProps {
  role: 'button';
  tabIndex: number;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

export function useGridKeyboardNav<T>(
  value: T,
  onSelect?: (value: T) => void,
  options?: GridKeyboardNavOptions
): GridKeyboardNavProps {
  const disabled = options?.disabled ?? false;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;
      // Enter / Space 触发与 onClick 等价；preventDefault 防止 Space 滚动页面
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect?.(value);
      }
    },
    [disabled, onSelect, value]
  );

  return {
    role: 'button',
    tabIndex: disabled ? -1 : 0,
    onKeyDown: handleKeyDown,
  };
}
