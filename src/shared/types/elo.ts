// ELO 能力分级体系（P1-2）
// 五维 ELO 评分 + 六段位定义

/** ELO 评分维度：preflop/postflop/math/handReading/mental */
export type EloDimension = 'preflop' | 'postflop' | 'math' | 'handReading' | 'mental';

/** ELO 完整评分状态 */
export interface EloRating {
  overall: number;       // 综合分（五维平均）
  preflop: number;       // 翻前
  postflop: number;      // 翻后
  math: number;          // 数学（赔率/EV）
  handReading: number;   // 牌局阅读
  mental: number;        // 心态/一致性
  kFactor: number;       // K 因子（动态：新手 48 / 默认 32 / 高分 24）
  gamesPlayed: number;   // 累计答题数
  lastUpdated: number;   // 最后更新时间戳
  variant?: PokerVariant; // P2 新增：所属变体标识（可选，用于多变体 ELO 分离）
}

/** 段位定义 */
export interface Rank {
  name: string;
  minScore: number;
  maxScore: number;
  color: string;        // hex 颜色
  description: string;
  icon: string;         // emoji
}

/** 六段位常量（按 minScore 升序） */
export const RANKS: Rank[] = [
  { name: '新手', minScore: 0, maxScore: 500, color: '#9ca3af', icon: '🌱', description: '刚开始接触德州扑克' },
  { name: '入门', minScore: 500, maxScore: 800, color: '#8ba59b', icon: '🎯', description: '掌握基本概念' },
  { name: '进阶', minScore: 800, maxScore: 1200, color: '#7fb883', icon: '♠️', description: '理解位置与范围' },
  { name: '中级', minScore: 1200, maxScore: 1600, color: '#c9a25e', icon: '♥️', description: '能应用 GTO 基础' },
  { name: '高级', minScore: 1600, maxScore: 2000, color: '#c9a25e', icon: '♦️', description: '熟练运用剥削策略' },
  { name: '专家', minScore: 2000, maxScore: 3000, color: '#c25a4c', icon: '♣️', description: '深度理解与实战盈利' },
];

/** 默认 ELO 评分（新用户起始 500 分） */
export const DEFAULT_ELO: EloRating = {
  overall: 500,
  preflop: 500,
  postflop: 500,
  math: 500,
  handReading: 500,
  mental: 500,
  kFactor: 32,
  gamesPlayed: 0,
  lastUpdated: 0,
};

/** 段位升级事件 */
export interface RankUpEvent {
  from: Rank;
  to: Rank;
}

// ===== 游戏变体支持（P2 新增） =====

/** 游戏变体类型 */
export type PokerVariant = 'standard' | 'short-deck' | 'heads-up';

/** 默认变体 */
export const DEFAULT_VARIANT: PokerVariant = 'standard';

/** 所有变体列表 */
export const ALL_VARIANTS: PokerVariant[] = ['standard', 'short-deck', 'heads-up'];

/** 变体配置元信息 */
export interface VariantConfig {
  id: PokerVariant;
  name: string;
  shortName: string;
  description: string;
  icon: string;         // emoji
  color: string;        // hex for UI theming
  deckSize: number;
  maxPlayers: number;
  /** 是否启用位置解锁机制 */
  supportsPositionUnlock: boolean;
}

/** 变体常量配置 */
export const VARIANT_CONFIG: Record<PokerVariant, VariantConfig> = {
  'standard': {
    id: 'standard',
    name: "Texas Hold'em",
    shortName: 'Hold\'em',
    description: '标准德州扑克，52 张牌，最多 9 人桌',
    icon: '♠️',
    color: '#c9a25e',
    deckSize: 52,
    maxPlayers: 9,
    supportsPositionUnlock: true,
  },
  'short-deck': {
    id: 'short-deck',
    name: 'Short Deck Hold\'em',
    shortName: 'Short Deck',
    description: '短牌德州，36 张牌（移除 2-5），同花>顺子，AA>KQ',
    icon: '♦️',
    color: '#ef4444',
    deckSize: 36,
    maxPlayers: 6,
    supportsPositionUnlock: true,
  },
  'heads-up': {
    id: 'heads-up',
    name: 'Heads-Up Hold\'em',
    shortName: 'Heads-Up',
    description: '单挑德州，2 人对战，SB 强制 Ante，翻后 SB 先行动',
    icon: '👤',
    color: '#3b82f6',
    deckSize: 52,
    maxPlayers: 2,
    supportsPositionUnlock: false,
  },
};
