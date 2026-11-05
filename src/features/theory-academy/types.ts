import type { EloDimension, PokerVariant } from '@/shared/types/elo';
import type { VariantRuleInfo } from '@/shared/types/variantRules';

export type { VariantRuleInfo };

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

/** 表格块：headers / rows / captionKey 一律存 i18n key（或纯数字 / 语言中立 token），渲染端逐项 t() 解析 */
export interface TheoryTableBlockData {
  kind: 'table';
  headers: string[];
  rows: string[][];
  /** 表标题 i18n key（可选；渲染为原生 <caption>） */
  captionKey?: string;
}

/** 范围矩阵单元格主导动作 token（渲染端映射 i18n 文案与档位色，数据层不存文案） */
export type TheoryRangeAction = 'raise' | 'bet' | 'call' | 'check' | 'fold' | 'all-in' | 'mixed';

/** 范围矩阵单元格：hand 为 13×13 手牌 token（'AA' / 'AKs' / 'AKo'），weight 为 0–100 频率权重 */
export interface TheoryRangeMatrixCell {
  hand: string;
  weight: number;
  action: TheoryRangeAction;
}

/** 范围矩阵块（只读展示；variant 缺省按 standard 52 张布局渲染） */
export interface TheoryRangeMatrixBlockData {
  kind: 'range-matrix';
  cells: TheoryRangeMatrixCell[];
  variant?: PokerVariant;
  captionKey?: string;
}

/** 决策树节点：labelKey 为语言中立 token（i18n key，或纯数字 / 动作记号） */
export interface TheoryDecisionTreeNode {
  id: string;
  labelKey: string;
}

/** 决策树边：from / to 引用节点 id，labelKey 为分支条件的 i18n key */
export interface TheoryDecisionTreeEdge {
  from: string;
  to: string;
  labelKey: string;
}

/** 决策树块（只读；rootId 指向起点节点） */
export interface TheoryDecisionTreeBlockData {
  kind: 'decision-tree';
  rootId: string;
  nodes: TheoryDecisionTreeNode[];
  edges: TheoryDecisionTreeEdge[];
  captionKey?: string;
}

/** 正文富文本块判别联合（按 kind 分派渲染） */
export type TheoryRichBlockData = TheoryTableBlockData | TheoryRangeMatrixBlockData | TheoryDecisionTreeBlockData;

/**
 * 内容段落：content 存正文文本，data 为可选富文本块（表格 / 范围矩阵 / 决策树）。
 * data 只承载语言中立 token / 数字 / i18n key，渲染端经 t() 解析，同一份数据服务 zh / en；
 * 追加式约束：新块只能追加在既有 content 尾部，禁止插入或重排既有索引。
 */
export interface TheorySection {
  type: TheorySectionType;
  content: string;
  data?: TheoryRichBlockData;
}

/** 章末小测题（结构与 strategy-academy QuizQuestion 一致，便于复用排序治理） */
export interface TheoryQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * 章节主题标签（供学习路径筛选与内容检索；不参与解锁判定）。
 * 六大主题：6-max 结构 / 现金局 / 锦标赛 / 地基 / 翻前 / 翻后。
 */
export type TheoryPathTag =
  | 'six-max'
  | 'cash'
  | 'mtt'
  | 'foundation'
  | 'preflop'
  | 'postflop';

/**
 * 理论章节摘要（目录层字段）。
 * 首页/进度/解锁只依赖这一层，正文与小测留在 TheoryChapter，由章节页按需加载。
 */
export interface TheoryChapterSummary {
  id: string;                       // 全局唯一，前缀 t<level>-（与 l<level>- 隔离）
  level: TheoryLevelNumber;
  order: number;
  title: string;
  subtitle: string;
  duration: string;                 // 预计阅读时长，如 '10 min'
  variant: PokerVariant; // 所属变体
  /**
   * 增补章标记：true 表示本章是主线之外的补强内容。
   * 增补章在其所属 Level 解锁后即可读，但不参与 Level 解锁判定与核心进度统计。
   */
  supplemental?: boolean;
  /** 章节主题标签（由 chapterMeta 统一打标，用于学习路径筛选） */
  pathTags?: TheoryPathTag[];
}

/** 理论章节（阅读单元 + 章末小测） */
export interface TheoryChapter extends TheoryChapterSummary {
  /** 本章小测答题影响的 ELO 维度 */
  eloDimension: EloDimension;
  /** 本章学习目标（先行组织者策略，可选；为空时 UI 不渲染目标卡片） */
  objectives?: string[];
  content: TheorySection[];
  /** 章末小测（必填）：独立题库改造后由合并层填充，level 文件以 quiz: [] 占位 */
  quiz: TheoryQuizQuestion[];
  /** 变体特有规则说明 */
  variantRules?: VariantRuleInfo;
  /**
   * 本章对应的实践推荐（章节粒度桥接）。
   * 仅数据层字段，不进 TheoryProgress 持久化；由 standard/index.ts 在聚合时从
   * chapterPracticeMap 附加，因此 standardLevelN.ts 内不直接书写。
   */
  practiceRecommendations?: PracticeRecommendation;
}

/** 理论→实践桥接推荐（引用 strategy-academy 课程/轨道 ID 字符串，不产生模块 import） */
export interface PracticeRecommendation {
  /** strategy-academy 课程（跳转 /academy/lesson/:id）；title 为展示用标题 */
  lessons: { id: string; title: string }[];
  /** 可选的学习轨道 ID（跳转 /academy/tracks） */
  trackId?: string;
}

/** 理论 Level 摘要（目录层字段，不含章节正文） */
export interface TheoryLevelSummary {
  id: string;                       // 't1' ... 't9'
  level: TheoryLevelNumber;
  tier: TheoryTier;
  title: string;
  description: string;
  icon: string;
  chapters: TheoryChapterSummary[];
  unlockRequirement: string;
  /** 完成本 Level 后的实践推荐（策略学院课程/轨道） */
  practiceRecommendations: PracticeRecommendation;
  /** 所属变体 */
  variant: PokerVariant;
}

/** 理论 Level 信息（完整数据，含章节正文与小测） */
export interface TheoryLevelInfo extends TheoryLevelSummary {
  chapters: TheoryChapter[];
}

/** 变体规则信息（类型定义已迁至 shared，理论侧保留重导出以兼容既有 import） */

/** 术语表条目：stable id + i18n key；aliases 为别名 key（搜索时逐 key 解析后匹配） */
export interface TheoryGlossaryTerm {
  id: string;
  termKey: string;
  definitionKey: string;
  aliases?: string[];
  relatedChapterIds?: string[];
}

/** 参考书目条目：stable id + 展示文案 key（年份为语言中立字段） */
export interface TheoryBibliographyEntry {
  id: string;
  titleKey: string;
  authorKey?: string;
  year?: number;
  noteKey?: string;
  relatedChapterIds?: string[];
}

/** 内容运营元数据（纯前端静态数据，无后端）：chapterId → 最近校对日期（ISO 8601 YYYY-MM-DD） */
export interface TheoryContentOps {
  lastReviewed: Record<string, string>;
}

/** 章末小测尝试记录：首次成绩锁定掌握度 / ELO 口径，重考只更新练习口径（bestScore / lastScore） */
export interface TheoryChapterAttempt {
  /** 累计尝试次数（首次为 1） */
  attempts: number;
  firstScore: number;
  firstCorrect: number;
  firstTotal: number;
  bestScore: number;
  lastScore: number;
  lastAt: number;
}

/** Level checkpoint 尝试记录（形成性测评：不解锁下一级、不发证） */
export interface TheoryCheckpointAttempt {
  attempts: number;
  bestScore: number;
  lastScore: number;
  lastAt: number;
  /** 本轮抽中的题目 id（按抽题顺序；供错题 SRS 路由与结果回放） */
  questionIds: string[];
}

/** checkpoint 单次提交载荷 */
export interface TheoryCheckpointResult {
  /** 得分（0–100） */
  score: number;
  questionIds: string[];
}

/** 定位测评结果：只写 creditLevels（重测取并集），绝不写 completedChapters */
export interface TheoryPlacementResult {
  score: number;
  correct: number;
  total: number;
  /** 推荐起点 Level id（'t1'–'t9'） */
  recommendedLevelId: string;
  /** 免修 Level id 列表（单调不减，避免重测低分被收回访问权） */
  creditLevels: string[];
  completedAt: number;
}

/** 章节笔记（纯文本，渲染端负责转义） */
export interface TheoryChapterNote {
  text: string;
  updatedAt: number;
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
  activeVariant: PokerVariant;      // ← 默认'standard'
  /** P2 扩展字段：各变体的独立进度元数据 */
  variantMetadata?: {
    'standard': { lastViewedAt: number; preferredOrder: number };
    'short-deck': { lastViewedAt: number; preferredOrder: number };
    'heads-up': { lastViewedAt: number; preferredOrder: number };
  };
  /** v4：章末小测尝试记录（chapterId → 记录）；老数据由 quizScores 种子化 */
  chapterAttempts?: Record<string, TheoryChapterAttempt>;
  /** v4：Level checkpoint 记录（levelId → 记录） */
  checkpoints?: Record<string, TheoryCheckpointAttempt>;
  /** v4：定位测评结果（未测则缺省） */
  placement?: TheoryPlacementResult;
  /** v4：收藏章节 id 列表 */
  bookmarkedChapters?: string[];
  /** v5：新增单挑核心章前的已解锁 Level 宽限名单（只放宽解锁，不写完成） */
  legacyUnlockedLevels?: string[];
  /** v4：章节笔记（chapterId → 笔记；纯文本，上限见 store.MAX_CHAPTER_NOTE_LENGTH） */
  chapterNotes?: Record<string, TheoryChapterNote>;
}
