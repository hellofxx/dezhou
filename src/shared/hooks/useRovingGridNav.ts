import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

/**
 * 网格 / 图节点的 roving tabindex 键盘导航共享 hook。
 * 整张网格只有一个 Tab 停靠点（当前 active 项），方向键在项之间移动焦点，
 * Enter / Space 触发与 onClick 等价的 onSelect。消费方：RangeGrid / StrategyMatrix / ConceptGraph。
 * 兼容 SVG（ref 类型为 Element，聚焦前检测 focus 是否存在）。
 */
export interface RovingGridNavOptions<T> {
  /** 可聚焦项集合（顺序即 Home/End 与无 columns 时的移动顺序） */
  values: T[];
  /** 每行列数；不传时 Up/Down 按 ±1 顺序移动（适合非矩形图） */
  columns?: number;
  /** 可选受控值；不传时 hook 内部管理 */
  activeValue?: T;
  onActiveChange?: (value: T) => void;
  /** Enter / Space 触发；移动焦点不触发 */
  onSelect?: (value: T) => void;
  disabled?: boolean;
}

export interface RovingGridItemProps {
  role: 'button';
  ref: (el: Element | null) => void;
  tabIndex: number;
  onKeyDown: (event: ReactKeyboardEvent) => void;
  'aria-current'?: 'true';
}

/** 只在元素确实可聚焦时调用（HTMLElement 与 SVGElement 均已实现 focus） */
function focusElement(el: Element | undefined): void {
  if (!el) return;
  const candidate = el as Element & { focus?: unknown };
  if (typeof candidate.focus === 'function') {
    (candidate.focus as () => void).call(el);
  }
}

export function useRovingGridNav<T>(options: RovingGridNavOptions<T>): {
  getItemProps: (value: T) => RovingGridItemProps;
} {
  const { values, columns, activeValue, onActiveChange, onSelect, disabled = false } = options;

  const [internalActive, setInternalActive] = useState<T | undefined>(() => values[0]);
  const isControlled = activeValue !== undefined;
  const active = isControlled ? activeValue : internalActive;

  // 调用方每次渲染新建 values 引用属正常情况，用 indexOf 判定成员关系即可
  const rawActiveIndex = active === undefined ? -1 : values.indexOf(active);
  const activeIndex = rawActiveIndex >= 0 ? rawActiveIndex : values.length > 0 ? 0 : -1;

  // values 变化且 active 已不在其中 → 回退到 values[0]（受控模式只做派生，不回写外部状态）
  useEffect(() => {
    if (isControlled || values.length === 0) return;
    if (internalActive !== undefined && values.indexOf(internalActive) >= 0) return;
    setInternalActive(values[0]);
  }, [values, internalActive, isControlled]);

  const nodeRefs = useRef(new Map<T, Element>());
  const refCallbacks = useRef(new Map<T, (el: Element | null) => void>());

  const getRef = useCallback((value: T): ((el: Element | null) => void) => {
    const cached = refCallbacks.current.get(value);
    if (cached) return cached;
    const callback = (el: Element | null) => {
      if (el) nodeRefs.current.set(value, el);
      else nodeRefs.current.delete(value);
    };
    refCallbacks.current.set(value, callback);
    return callback;
  }, []);

  // 移动后聚焦：走 effect 保证在 active 更新后执行
  const [focusTick, setFocusTick] = useState(0);
  const pendingFocus = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (focusTick === 0) return;
    const target = pendingFocus.current;
    if (target === undefined) return;
    focusElement(nodeRefs.current.get(target));
  }, [focusTick]);

  const setActive = useCallback(
    (value: T) => {
      if (!isControlled) setInternalActive(value);
      onActiveChange?.(value);
    },
    [isControlled, onActiveChange]
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (disabled) return;
      const count = values.length;
      if (count === 0 || activeIndex < 0) return;

      const step = columns ?? 1;
      let nextIndex: number;
      switch (event.key) {
        case 'ArrowRight':
          nextIndex = activeIndex + 1;
          break;
        case 'ArrowLeft':
          nextIndex = activeIndex - 1;
          break;
        case 'ArrowDown':
          nextIndex = activeIndex + step;
          break;
        case 'ArrowUp':
          nextIndex = activeIndex - step;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = count - 1;
          break;
        case 'Enter':
        case ' ':
        case 'Spacebar':
          // 与 onClick 等价；preventDefault 防止 Space 滚动页面
          event.preventDefault();
          onSelect?.(values[activeIndex] as T);
          return;
        default:
          return;
      }

      // 方向键 / Home / End 只移动 active，不触发 onSelect；preventDefault 防页面滚动
      event.preventDefault();
      const clamped = Math.min(Math.max(nextIndex, 0), count - 1);
      if (clamped === activeIndex) return;
      const nextValue = values[clamped];
      if (nextValue === undefined) return;
      setActive(nextValue);
      pendingFocus.current = nextValue;
      setFocusTick((tick) => tick + 1);
    },
    [disabled, values, activeIndex, columns, onSelect, setActive]
  );

  const getItemProps = useCallback(
    (value: T): RovingGridItemProps => {
      const isActive = !disabled && activeIndex >= 0 && values.indexOf(value) === activeIndex;
      const props: RovingGridItemProps = {
        role: 'button',
        ref: getRef(value),
        tabIndex: isActive ? 0 : -1,
        onKeyDown: handleKeyDown,
      };
      // 仅 active 项返回 aria-current，其余不返回该属性
      if (isActive) props['aria-current'] = 'true';
      return props;
    },
    [values, disabled, activeIndex, handleKeyDown, getRef]
  );

  return { getItemProps };
}
