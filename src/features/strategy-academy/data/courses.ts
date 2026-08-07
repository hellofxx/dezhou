// 向后兼容 re-export — 实际数据已拆分至 lessons/variants/standard/。
// 直接指向 variants/standard/index.ts，避免经 data/levels/index.ts 的三层级联。
// 消费方（store / 组件 / 跨模块）沿用本路径，零改动。
export { standardLevels as LEVELS } from './lessons/variants/standard';
