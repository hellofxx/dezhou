/**
 * 对手画像数据——单一事实源在 shared/data/opponentProfiles.ts（gto-simulator 亦消费），
 * 此处 re-export 兼容模块内旧路径。
 */
export {
  OPPONENT_PROFILES,
  getOpponentProfile,
  OPPONENT_DRILL_QUESTIONS,
  getOpponentDrillQuestion,
} from '@/shared/data/opponentProfiles';
export type { OpponentDrillQuestion } from '@/shared/data/opponentProfiles';
