/**
 * 成就检查数据源接口（progress store 依赖倒置）。
 * 各业务模块（strategy-academy / theory-academy）通过 achievementRegistry 注册实现，
 * progress store 不再动态 import 具体模块，消除运行时循环依赖。
 */
export interface AchievementDataSource {
  /** 完成指定等级的课程（academy：isLevelLessonsCompleted；theory 不实现，返回 false） */
  isLevelLessonsCompleted(level: number): boolean;
  /** 获取认证记录 map（theory 返回空对象） */
  getCertifications(): Record<number, { certifiedAt?: number | null } | undefined>;
  /** 全部等级均认证（theory 返回 false） */
  areAllLevelsCertified(): boolean;
  /** 完成指定学习轨道（theory 返回 false） */
  isTrackCompleted(trackId: string): boolean;
  /** theory 专用：已完成章节 id 列表 */
  getCompletedChapters?(): string[];
  /** theory 专用：前 N 个 Level 全部章节完成 */
  isTheoryLevelFullyCompleted?(level: number): boolean;
  /** puzzle 专用：是否存在 puzzle 训练历史（firstPuzzle 成就） */
  hasPuzzleHistory?(): boolean;
  /** puzzle 专用：是否完成过每日谜题（firstDailyPuzzle 成就） */
  hasCompletedDailyPuzzle?(): boolean;
  /** puzzle 专用：指定日期 key（YYYY-MM-DD）的每日谜题是否完成（DailyChallenge 展示用） */
  isDailyPuzzleCompleted?(dateKey: string): boolean;
}
