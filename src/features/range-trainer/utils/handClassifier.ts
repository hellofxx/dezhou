/**
 * 手牌分类工具——单一事实源在 shared/utils/handClassifier.ts（gto-simulator 亦消费），
 * 此处 re-export 兼容模块内旧路径。
 */
export { classifyHand, getHandCategory, isHandInRange } from '@/shared/utils/handClassifier';
