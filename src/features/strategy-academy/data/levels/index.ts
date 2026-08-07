/**
 * standard 变体 Level 聚合入口。
 * 实际数据位于 lessons/variants/standard/（每 Level 单文件）；本文件直接 re-export，
 * 供内部数据文件（learningTracks / 守卫测试 / quizShuffle.test）经 './levels' 消费。
 * 注意：对外历史入口 data/courses.ts 亦直接指向 lessons/variants/standard/，
 * 两者不再级联，避免三层间接。
 */
export { standardLevels as LEVELS } from '../lessons/variants/standard';
