import type { PokerVariant } from './elo';

/**
 * 理论学院数据源接口（progress store 依赖倒置）。
 * theory-academy 在自身 store.bootstrap.ts 调用 registerTheoryDataSource 注册实现，
 * progress 模块（每日训练计划 / 下一章推荐）经 getTheoryDataSource / subscribeTheoryDataSource 消费，
 * 消除 progress → theory-academy 的跨模块直接引用（与 academyDataSourceRegistry 同模式）。
 */

/** 理论章节元数据最小结构（供 progress 渲染标题与路由；title 为数据层中文，作 i18n defaultValue 兜底） */
export interface TheoryChapterMeta {
  chapterId: string;
  /** 所属 Level id（'t1'–'t9'） */
  levelId: string;
  /** 数据层标题（中文），渲染端作 t(titleKey, { defaultValue: title }) 兜底 */
  title: string;
  /** 渲染层标题 i18n key（theory.chapterTitle.<chapterId>） */
  titleKey: string;
  /** 章节路由（'/theory/chapter/<chapterId>'），消费方只拼接不解析 */
  route: string;
  /** 预计阅读时长（分钟；由目录层 duration 解析，缺失回落 0） */
  estimatedMinutes: number;
}

export interface TheoryChapterAttemptSnapshot {
  firstScore: number;
  lastScore: number;
  attempts: number;
}

/** 理论学习快照：章级完成/成绩；chapterId 维度，跨变体共享。 */
export interface TheoryLearningSnapshot {
  readonly completedChapters: readonly string[];
  readonly chapterAttempts: Readonly<Record<string, TheoryChapterAttemptSnapshot>>;
  readonly quizScores: Readonly<Record<string, number>>;
}

/** 理论章节目录投影（静态数据，用于阶段/补充阅读归组）。 */
export interface TheoryChapterIndexEntry {
  chapterId: string;
  /** t1–t9 */
  levelId: string;
  /** P2：该章声明的实践课 id（来自 chapterPracticeMap） */
  practiceLessonIds?: readonly string[];
}

export interface TheoryDataSource {
  /** 找下一未完成核心章（跳过已免修 Level 与已完成章节） */
  findNextChapter(completedChapterIds: readonly string[]): TheoryChapterMeta | null;
  /** 推荐章节（可选；未实现时消费方回退 findNextChapter） */
  getRecommendedChapter?(): TheoryChapterMeta | null;
  /** 订阅理论进度变化，返回取消订阅函数（可选） */
  subscribe?(listener: () => void): () => void;
  /** 理论学习快照（可选；未实现时消费方降级为未知） */
  getLearningSnapshot?(): TheoryLearningSnapshot;
  /** 按变体返回章节目录（可选；静态数据，按变体缓存稳定引用） */
  getChapterCatalog?(variant: PokerVariant): readonly TheoryChapterIndexEntry[];
  /** 当前理论变体（可选；枢纽 canonical 变体切换命令的读侧，未实现时消费方降级为未知） */
  getActiveVariant?(): PokerVariant;
  /** 切换理论变体（可选；枢纽 canonical 变体切换命令的写侧，未实现时消费方降级为只读展示） */
  switchVariant?(variant: PokerVariant): void;
}
