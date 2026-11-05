/**
 * 标准变体题库注入器：实现已上提到 `variants/applyQuizBank.ts`（三变体共用），
 * 本文件只保留既有导出名，避免 standard 侧 import 与测试改写。
 * 运行时路径（loaders.ts）与静态路径（variants/standard/index.ts）继续从这里取。
 */
export { applyTheoryQuizBank as applyStandardQuizBank } from '../../applyQuizBank';
