// 题目难度级别
export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced';

// 用户能力评估
export interface AbilityAssessment {
  rangeKnowledge: number;     // 范围知识
  oddsCalculation: number;    // 赔率计算
  gtoUnderstanding: number;   // GTO理解
  positionalPlay: number;     // 位置打法
  emotionalControl: number;   // 情绪控制
  lastUpdated: number;
}

// 难度自适应配置
export interface AdaptiveConfig {
  enabled: boolean;
  upgradeThreshold: number;   // 升级正确率阈值，默认 85
  downgradeThreshold: number; // 降级正确率阈值，默认 60
  timeBonus: number;          // 快速答题额外加分，默认 10秒
  recentWindow: number;       // 评估窗口（最近N题），默认 10
}

// 课程级别
export type CourseLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// 内容段落类型
export type LessonSectionType =
  | 'text'
  | 'heading'
  | 'highlight'
  | 'example'
  | 'diagram'
  | 'hand-example'
  | 'pro-tip'
  | 'key-point';

// 内容段落
export interface LessonSection {
  type: LessonSectionType;
  content: string;
  data?: Record<string, unknown>;
}

// 课后测验题
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ===== 对手形象系统类型 =====

// 对手统计数据
export interface OpponentStats {
  vpip: number;           // 自愿入池率（%）
  pfr: number;            // 翻前加注率（%）
  af: number;             // 激进度因子
  threeBetPercent: number; // 3-Bet频率（%）
  foldToCBet: number;     // 面对C-Bet弃牌率（%）
  cbetFrequency: number;  // C-Bet频率（%）
}

// 对手形象
export interface OpponentProfile {
  id: string;             // 'tag' | 'lag' | 'nit' | 'maniac' | 'calling_station' | 'unknown'
  name: string;           // 完整名称如 "TAG (紧凶)"
  shortName: string;      // 短标签如 "TAG"
  description: string;    // 一句话描述
  color: string;          // 主题色（hex）
  icon: string;           // emoji 图标
  stats: OpponentStats;
  tendencies: string[];   // 行为特征列表
  exploitableBy: string[]; // 可利用方式列表
}

// 游戏上下文（牌桌动态）
export interface GameContext {
  gameType: 'cash' | 'mtt' | 'sng';      // 游戏类型
  tableDescription?: string;              // 桌风描述如 "桌上连续3把无人加注"
  opponentHistory?: string;               // 对手近期数据如 "该对手过去20手3-Bet了4次"
  icmPressure?: 'low' | 'medium' | 'high'; // ICM 压力级别（锦标赛）
  stackDistribution?: string;             // 筹码分布描述如 "桌上有2个短筹码"
  bubbleFactor?: boolean;                 // 是否在泡沫期
}

// ===== 示例演示阶段类型 =====

// 手牌场景示例（用于 Example/Walkthrough 阶段）
export interface HandExample {
  id: string;
  title: string;
  heroHand: [string, string];
  heroPosition: string;
  previousActions: ExampleAction[];
  board?: string[];
  street: 'preflop' | 'flop' | 'turn' | 'river';
  // 筹码上下文（数字字段，单位BB）
  effectiveStack: number;     // 有效筹码深度，如 100
  potSize: number;            // 当前底池大小，如 5.5
  betSize?: number;           // 建议/实际下注金额，如 2.5
  correctDecision: {
    action: string;
    amount?: string;
    reasoning: string[];
  };
  commonMistake: {
    action: string;
    reasoning: string;
    evLoss: string;
  };
  opponent?: OpponentProfile;      // 对手形象（可选）
  gameContext?: GameContext;       // 游戏上下文（可选）
}

export interface ExampleAction {
  player: string;
  action: string;
}

// ===== 实战练习阶段类型 =====

export interface PracticeDrill {
  id: string;
  questions: PracticeQuestion[];
}

export interface PracticeQuestion {
  id: string;
  scenario: {
    heroHand: [string, string];
    heroPosition: string;
    previousActions: ExampleAction[];
    board?: string[];
    street: 'preflop' | 'flop' | 'turn' | 'river';
    potSize: number;         // 底池大小（BB）
    effectiveStack: number;  // 有效筹码深度（BB）
    betSize?: number;        // 下注金额（BB）
    opponent?: OpponentProfile;   // 对手形象（可选）
    gameContext?: GameContext;    // 游戏上下文（可选）
  };
  options: PracticeOption[];
  timeLimit?: number;
  difficulty?: QuestionDifficulty;  // 题目难度标记
  relatedLessonId?: string;         // 关联课程ID，答错时显示"去复习"链接
}

export interface PracticeOption {
  action: string;
  amount?: string;
  isCorrect: boolean;
  explanation: string;
  evImpact?: string;
}

// 实战练习结果
export interface PracticeResult {
  lessonId: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  weakPoints: string[];
  timestamp: number;
}

// Drill 组件名（用于 lesson.drillComponent 路由）
export type DrillComponentName =
  | 'HandRankingDrill'
  | 'PositionDrill'
  | 'OutsDrill'
  | 'PotOddsDrill'
  | 'ChoiceDrill';

// Drill 选择题题目（用于 ChoiceDrill 类型课程）
export interface DrillQuestion {
  id: string;
  scenario: string;        // 场景描述
  hand?: string;           // 手牌（可选）
  position?: string;       // 位置（可选）
  question: string;        // 问题
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;     // 解析
  difficulty: number;      // 1-3
}

// Drill 课程数据
export interface DrillData {
  questions: DrillQuestion[];
}

// 课程章节
export interface Lesson {
  id: string;
  level: CourseLevel;
  order: number;
  title: string;
  subtitle: string;
  duration: string;
  content: LessonSection[];
  quiz: QuizQuestion[];
  examples?: HandExample[];
  practice?: PracticeDrill;
  // P0-3: Drill 类型课程标识。默认 'lesson'。
  type?: 'lesson' | 'drill';
  // 当 type === 'drill' 时指定渲染哪个 Drill 组件
  drillComponent?: DrillComponentName;
  // ChoiceDrill 类型课程的数据
  drillData?: DrillData;
  /**
   * P4 修复（4.1-P2-1）：细粒度前置课程 ID 列表（可选）。
   *
   * 当前主要依赖 Level-based 解锁（isLevelUnlocked），同一 Level 内课程可任意顺序学习。
   * 对于有强依赖关系的课程（如 l2-4bet-strategy 依赖 l2-3bet-basics），
   * 可在此字段声明 prerequisite lesson IDs，CourseView 会额外检查。
   *
   * 未声明时仅受 Level 解锁约束；声明后需同时满足 Level 解锁与 prerequisite 完成。
   */
  prerequisites?: string[];
}

// 级别信息
export interface LevelInfo {
  /** 唯一标识（如 'l4a' / 'l4b'），用于 prerequisiteLevelIds 引用 */
  id?: string;
  level: CourseLevel;
  title: string;
  description: string;
  icon: string;
  lessons: Lesson[];
  unlockRequirement: string;
  /** 前置 Level ID 列表，需全部完成才能解锁本 Level */
  prerequisiteLevelIds?: string[];
}

// 学习进度
export interface AcademyProgress {
  completedLessons: string[];
  quizScores: Record<string, number>;
  currentLesson: string | null;
  startedAt: number;
}

// 职业素质维度
export type ProSkill = 'bankroll' | 'emotion' | 'position' | 'reading' | 'discipline';

// 术语条目
export interface Term {
  id: string;
  english: string;
  chinese: string;
  explanation: string;
  category: 'basic' | 'hand' | 'action' | 'strategy';
}

// 基础入门进度
export interface BasicsProgress {
  currentStep: number;
  completed: boolean;
  completedAt?: number;
}

// 基础入门步骤
export interface BasicsStep {
  id: string;
  title: string;
  icon: string;
  content: LessonSection[];
}

// ===== 每日训练计划 =====

export interface DailyPlan {
  reviewLessons: string[];        // 需要复习的课程ID（基于 spaced repetition）
  newLesson: string | null;       // 建议学习的新课程
  practiceSpots: string[];        // 基于弱点的定向练习课程ID
  estimatedTime: string;          // 预计用时
  focusArea: keyof AbilityAssessment | null; // 今日重点维度
  generatedAt: number;            // 生成时间戳
}

// ===== 学习轨道 =====

export interface LearningTrack {
  id: string;
  name: string;
  description: string;
  icon: string;
  targetAudience: string;
  estimatedDuration: string;
  lessonIds: string[];            // 按顺序引用现有课程ID
  color: string;                  // 主题色
  prerequisiteLevelIds?: string[]; // 前置 Level ID 列表（如 ['l1','l2','l3']），未完成时显示提示
  relatedTrackIds?: string[];      // 横向推荐关联路径 ID
}

// ===== 概念节点（跨模块关联）=====

export interface ConceptNode {
  id: string;
  name: string;
  description: string;
  relatedLessons: string[];       // 关联策略学院课程ID
  relatedModules: ('pot-odds' | 'range-trainer' | 'gto-simulator' | 'hand-history')[];
  prerequisites: string[];        // 前置概念ID
  category: 'fundamental' | 'mathematical' | 'strategic' | 'psychological';
}

// ===== 级别认证 =====

export interface LevelCertification {
  level: number;
  requiredAccuracy: number;       // 通过所需正确率（如 80）
  questionCount: number;          // 综合测验题数
  timeLimit: number;              // 限时（秒），0为不限时
  certifiedAt?: number;           // 通过时间戳
  attempts: number;               // 尝试次数
  bestScore?: number;             // 最高得分
}
