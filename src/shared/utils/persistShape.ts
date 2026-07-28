/**
 * 持久化形状快照工具（测试专用，供各 persist store 的 shape 快照测试复用）。
 * 仅被 *.test.ts 引用，不会进入生产 bundle。
 *
 * 目的：为 zustand persist store 提供持久化 schema 的机械化检测。
 * 任何写入 localStorage 的键结构变化（新增 / 删除 / 类型变更持久化字段）
 * 都会导致快照失配、测试变红，强制作者面对「递增 version + 编写 migrate」的决策。
 */

/** 形状节点：基础类型名 / 'null' / 'array' / 嵌套对象形状 */
export type ShapeNode =
  | 'string'
  | 'number'
  | 'boolean'
  | 'bigint'
  | 'null'
  | 'array'
  | { [key: string]: ShapeNode };

/**
 * 递归构造值的“持久化形状”：仅保留会被 JSON 序列化写入存储的键，值替换为类型标记。
 *
 * 规则（对齐 JSON.stringify 的序列化语义）：
 *  - 函数 / undefined / symbol：被 JSON.stringify 丢弃 → 不计入形状
 *  - null → 'null'
 *  - 数组 → 'array'（不下钻元素：元素形状由运行时数据决定，不属于持久化 schema）
 *  - 普通对象 → 递归其键（按字母序插入，保证快照顺序稳定）
 *  - 其余基础类型 → typeof 结果（'string' | 'number' | 'boolean' | 'bigint'）
 */
export function buildPersistedShape(value: unknown): ShapeNode {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') {
    const shape: { [key: string]: ShapeNode } = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const child = (value as Record<string, unknown>)[key];
      // 函数 / undefined / symbol 不会被持久化，忽略
      if (child === undefined || typeof child === 'function' || typeof child === 'symbol') {
        continue;
      }
      shape[key] = buildPersistedShape(child);
    }
    return shape;
  }
  return typeof value as ShapeNode;
}
