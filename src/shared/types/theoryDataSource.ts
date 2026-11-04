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

export interface TheoryDataSource {
  /** 找下一未完成核心章（跳过已免修 Level 与已完成章节） */
  findNextChapter(completedChapterIds: readonly string[]): TheoryChapterMeta | null;
  /** 推荐章节（可选；未实现时消费方回退 findNextChapter） */
  getRecommendedChapter?(): TheoryChapterMeta | null;
  /** 订阅理论进度变化，返回取消订阅函数（可选） */
  subscribe?(listener: () => void): () => void;
}
