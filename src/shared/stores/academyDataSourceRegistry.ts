/**
 * 学院课程数据源注册表（依赖倒置）。
 * strategy-academy / puzzle-trainer / theory-academy 在各自 bootstrap 文件中调用 registerAcademyDataSource 注册，
 * progress 模块经 getAcademyDataSource() 查询，不再直接 import academy。
 * 
 * T2/A2 P0-03 时序修复：增加 onRegister 订阅机制，支持「late registration 自愈」——
 * 若组件挂载时数据源尚未注册，则订阅注册事件；一旦注册成功即转发订阅，避免 Dashboard 间歇性丢失数据。
 * 注册由应用入口 async Promise.all([...]) 同步触发（见 main.tsx:bootstrapAndRender），非 requestIdleCallback。
 */
import type { AcademyDataSource } from '@/shared/types/academyDataSource';

let dataSource: AcademyDataSource | undefined;
const subscribers = new Set<() => void>();

export function registerAcademyDataSource(source: AcademyDataSource): void {
  dataSource = source;
  // 通知已注册的订阅者（自愈路径）
  subscribers.forEach((listener) => listener());
  subscribers.clear();
}

export function getAcademyDataSource(): AcademyDataSource | undefined {
  return dataSource;
}

/** 未注册时订阅，注册后自动转发 — 实现 late registration 自愈 */
export function onAcademyDataRegister(listener: () => void): () => void {
  if (dataSource) {
    // 已注册：立即执行 listener，不保留订阅
    listener();
    return () => {};
  }
  // 未注册：加入订阅队列
  subscribers.add(listener);
  // 返回取消函数
  return () => subscribers.delete(listener);
}
