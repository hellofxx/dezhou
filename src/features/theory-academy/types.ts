import type { EloDimension, PokerVariant } from '@/shared/types/elo';

// ===== 理论学院（Theory Academy）类型体系 =====
// 与 strategy-academy 并列的独立理论学习模块：
// 承载权威德扑理论内容（阅读 + 章末小测），策略学院承担实践应用。

/** 理论 Level 编号（T1-T9） */
export type TheoryLevelNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 分级段位：基础 T1-T3 / 中级 T4-T6 / 高级 T7-T9 */
export type TheoryTier = 'basic' | 'intermediate' | 'advanced';

/** 内容段落类型（与 strategy-academy LessonSectionType 对齐，另加 formula） */
export type TheorySectionType =
  | 'text'
  | 'heading'
  | 'highlight'
  | 'example'
  | 'formula'
  | 'pro-tip'
  | 'key-point'
  | 'takeaway';

/** 内容段落 */
export interface TheorySection {
  type: TheorySectionType;
  content: string;
}

/** 章末小测题（结构与 strategy-academy QuizQuestion 一致，便于复用排序治理） */
export interface TheoryQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** 理论章节（阅读单元 + 章末小测） */
export interface TheoryChapter {
  id: string;                       // 全局唯一，前缀 t<level>-（与 l<level>- 隔离）
  level: TheoryLevelNumber;
  order: number;
  title: string;
  subtitle: string;
  duration: string;                 // 预计阅读时长，如 '10 min'
  /** 本章小测答题影响的 ELO 维度 */
  eloDimension: EloDimension;
  /** 本章学习目标（先行组织者策略，可选；为空时 UI 不渲染目标卡片） */
  objectives?: string[];
  content: TheorySection[];
  quiz: TheoryQuizQuestion[];
}

/** 理论→实践桥接推荐（引用 strategy-academy 课程/轨道 ID 字符串，不产生模块 import） */
export interface PracticeRecommendation {
  /** strategy-academy 课程（跳转 /academy/lesson/:id）；title 为展示用标题 */
  lessons: { id: string; title: string }[];
  /** 可选的学习轨道 ID（跳转 /academy/tracks） */
  trackId?: string;
}

/** 理论 Level 信息 */
export interface TheoryLevelInfo {
  id: string;                       // 't1' ... 't9'
  level: TheoryLevelNumber;
  tier: TheoryTier;
  title: string;
  description: string;
  icon: string;
  chapters: TheoryChapter[];
  unlockRequirement: string;
  /** 完成本 Level 后的实践推荐（策略学院课程/轨道） */
  practiceRecommendations: PracticeRecommendation;
}

/** 变体规则信息 */
export interface VariantRuleInfo {
  deckSize?: number;                 // 36/52
  handRanking?: {
    tripsBeatsStraight?: true;      // 短牌核心：三条 > 顺子
    flushBeatsFullHouse?: true;     // 短牌核心：同花 > 葫芦
    aceHighStraight?: string[];     // A-K-Q-J-T
    aceLowStraight?: string[];      // 短牌：A-6-7-8-9（2-5 被移除，A 当低张）
    pairBeatsAnyAceKing?: true;     // 短牌核心：口袋对 > AKo
  };
  positionDynamics?: {
    sbAnte?: boolean;               // 单挑：SB 强制 Ante
    sbFirstActionPreflop?: true;    // 单挑：翻前 SB（按钮位）先行动
    bbFirstActionPostflop?: true;   // 单挑：翻后 BB 先行动（SB/按钮位最后行动）
  };
  blindStructure?: {
    sbAmount: number;
    bbAmount: number;
  };
  preFlopHandStrength?: {
    pairBeatsAnyAceKing?: true;     // 短牌核心规则
    suitedConnectorsStrength?: 'elevated';
  };
  [key: string]: unknown;
}

/** 理论章节增强 */
export interface TheoryChapter {
  id: string;                       // 全局唯一，前缀 t<level>-（与 l<level>- 隔离）
  level: TheoryLevelNumber;
  order: number;
  title: string;
  subtitle: string;
  duration: string;                 // 预计阅读时长，如 '10 min'
  /** 本章小测答题影响的 ELO 维度 */
  eloDimension: EloDimension;
  /** 本章学习目标（先行组织者策略，可选；为空时 UI 不渲染目标卡片） */
  objectives?: string[];
  content: TheorySection[];
  quiz: TheoryQuizQuestion[];
  variant: PokerVariant;            // ← 新增：所属变体标识
  variantRules?: VariantRuleInfo;   // ← 新增：变体特有规则说明
}

/** 理论 Level 信息增强 */
export interface TheoryLevelInfo {
  id: string;                       // 't1' ... 't9'
  level: TheoryLevelNumber;
  tier: TheoryTier;
  title: string;
  description: string;
  icon: string;
  chapters: TheoryChapter[];
  unlockRequirement: string;
  /** 完成本 Level 后的实践推荐（策略学院课程/轨道） */
  practiceRecommendations: PracticeRecommendation;
  variant: PokerVariant;            // ← 新增：所属变体
}

/** 理论学习进度（持久化）增强 */
export interface TheoryProgress {
  completedChapters: string[];
  quizScores: Record<string, number>;   // chapterId → 0-100（历史最高分）
  currentChapter: string | null;
  startedAt: number;
  /** 标记为疑难的小测题 id 列表（供后续复习清单使用） */
  flaggedQuestions: string[];
  
  /** P2 扩展字段：当前选中的变体上下文 */
  activeVariant: PokerVariant;      // ← 新增：默认'standard'
  
  /** P2 扩展字段：各变体的独立进度元数据 */
  variantMetadata?: {
    'standard': { lastViewedAt: number; preferredOrder: number };
    'short-deck': { lastViewedAt: number; preferredOrder: number };
    'heads-up': { lastViewedAt: number; preferredOrder: number };
  };
}
