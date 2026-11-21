/**
 * progress 跨模块展示入口。
 *
 * 仅导出 shell / 训练页实际复用的门禁、庆典与持久化提示组件；
 * 不在此汇总页面或业务组件，避免根入口把整个 progress 页面图拖入启动依赖。
 */
export { default as OnboardingGate } from './components/gate/OnboardingGate';
export { default as TiltWarning } from './components/gate/TiltWarning';
export { default as MilestoneCelebrationHost } from './components/celebration/MilestoneCelebrationHost';
export { default as ProgressPersistErrorNotice } from './components/PersistErrorNotice';
// 壳层浮层：/settings 的设置纸条（body 内的设置面仍按需懒加载，外壳随布局进入首屏）
export { default as SettingsSlip } from './components/settings/SettingsSlip';
