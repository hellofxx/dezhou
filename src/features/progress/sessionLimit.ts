/**
 * 训练页止损守卫入口。
 *
 * 与 ui.ts 分开导出：SessionLimitGuard 及其依赖只被训练页按需加载，
 * 避免 AppLayout/BlankLayout 引入 ui.ts 时把守卫组件提前并入首屏依赖图。
 */
export {
  default as SessionLimitGuard,
  useSessionLimitReached,
  useSessionLimitStatus,
} from './components/gate/SessionLimitGuard';
