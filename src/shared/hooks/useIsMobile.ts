/**
 * useIsMobile — 检测视口宽度 < 768px。
 *
 * 与 DESIGN_LANGUAGE §6.3 移动端断点（md: 768px）对齐。
 * 使用 window.matchMedia，避免 resize 事件频繁重渲染。
 */
import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 767px)';

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}