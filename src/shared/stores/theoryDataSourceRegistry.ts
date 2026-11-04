import type { TheoryDataSource } from '@/shared/types/theoryDataSource';

/**
 * 理论学院数据源注册表（依赖倒置）。
 * theory-academy 在自身 store.bootstrap.ts 调用 registerTheoryDataSource 注册实现；
 * progress 模块（每日训练计划 / 下一章推荐）经 getTheoryDataSource / subscribeTheoryDataSource 消费，
 * 消除 progress → theory-academy 的跨模块直接引用（与 academyDataSourceRegistry 同模式）。
 *
 * 与 academyDataSourceRegistry 的差异：本注册表把订阅者统一登记在注册表层，
 * 注册前订阅的调用方在注册完成后自动获得转发（late registration 自愈），
 * 注册后订阅的调用方直接桥接数据源 subscribe，两条路径都不会丢通知。
 */

type Listener = () => void;

let dataSource: TheoryDataSource | undefined;
let unsubscribeSource: (() => void) | undefined;
const listeners = new Set<Listener>();

function notifyListeners(): void {
  // 复制一份再遍历：监听器内部可能取消订阅，避免遍历中集合被修改
  for (const listener of [...listeners]) listener();
}

/** 注册（或替换）理论数据源；重复注册覆盖旧源并重绑订阅 */
export function registerTheoryDataSource(source: TheoryDataSource): void {
  dataSource = source;
  unsubscribeSource?.();
  unsubscribeSource = source.subscribe?.(notifyListeners);
  // 通知注册前已订阅的调用方：数据源已就绪，请重新读取快照（冷启动 / 懒加载场景自愈）
  notifyListeners();
}

export function getTheoryDataSource(): TheoryDataSource | undefined {
  return dataSource;
}

/** 订阅理论数据源变化（注册前 / 注册后均可调用；返回取消订阅函数） */
export function subscribeTheoryDataSource(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
