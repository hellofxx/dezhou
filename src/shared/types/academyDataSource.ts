/**
 * 学院课程数据源接口（progress store 依赖倒置）。
 * strategy-academy 在自身 store.bootstrap.ts 调用 registerAcademyDataSource 注册实现，
 * progress 模块经 useAcademyDataSource hook / getAcademyDataSource() 消费，
 * 消除 progress → strategy-academy 的跨模块直接引用（与 achievementRegistry 同模式）。
 */

/** 课程元数据最小结构（供 progress 渲染标题与级别；数据层中文标题作 i18n defaultValue 兜底） */
export interface AcademyLessonMeta {
  id: string;
  /** 数据层标题（中文），渲染端作 t(key, { defaultValue: title }) 兜底 */
  title: string;
  level: number;
}

/** 学院进度快照（响应式订阅的最小形状，仅含 progress 所需字段） */
export interface AcademyProgressSnapshot {
  completedLessons: readonly string[];
}

export interface AcademyDataSource {
  /** 找下一未完成课程（按 LEVELS 顺序遍历标准课程） */
  findNextLesson(completedLessons: readonly string[]): AcademyLessonMeta | null;
  /** 按 lessonId 查元数据（标准课程优先，回退变体课程） */
  getLessonMeta(lessonId: string): AcademyLessonMeta | undefined;
  /**
   * 响应式快照：必须返回 store state 的稳定字段引用，禁止合成新对象
   * （否则 useSyncExternalStore 触发无限重渲染）。
   */
  getAcademyProgressSnapshot(): AcademyProgressSnapshot;
  getFirstAttemptScoresSnapshot(): Record<string, number>;
  getLastAttemptScoresSnapshot(): Record<string, number>;
  /** 订阅状态变化，返回取消订阅函数 */
  subscribe(listener: () => void): () => void;
}
