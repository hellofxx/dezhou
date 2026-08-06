# 德州扑克训练平台 — 技术设计文档 (TDD)

## 1. 文档信息

| 字段 | 内容 |
|------|------|
| 文档版本 | v2.4 |
| 作者 | 开发团队 |
| 最后更新 | 2026-07-31 |
| 状态 | v2.4 承接 PRD 职责分离回归（从 PRD 迁入 Streak/ELO/SRS/反馈补救/Drill 题库等技术实现细节；补 §1 文档信息章节） |

> **文档职责**：本文件描述技术实现细节（How）。产品规格见 `PRD.md`，版本演进与执行历史见 `CHANGELOG.md`。

### 相关文档

- `package.json` — 依赖与脚本配置
- `vite.config.ts` — 构建与开发服务器配置
- `tsconfig.json` — TypeScript 编译选项
- `public/manifest.json` — PWA 清单
- `components.json` — shadcn/ui 组件配置

---

## 2. 系统架构概述

### 2.1 架构风格

本项目采用 **纯前端 SPA + Feature-First 模块化** 架构。无后端服务，所有数据存储在浏览器端（localStorage / IndexedDB），所有计算在客户端完成。

### 2.2 架构图

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (PWA)                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐   React Router v7   ┌──────────────────────┐  │
│  │ AppLayout│─────────────────────│  Lazy-loaded Pages   │  │
│  │ Sidebar  │   <Outlet/>         │  (code-split per     │  │
│  │ MobileNav│                     │   route)             │  │
│  └──────────┘                     └──────────────────────┘  │
│        │                                      │              │
│        ▼                                      ▼              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              Feature Modules (9 个)                  │     │
│  │  ┌───────────┐ ┌──────────┐ ┌───────────────┐      │     │
│  │  │ Range     │ │ Pot Odds │ │ GTO Simulator │      │     │
│  │  │ Trainer   │ │ Calc     │ │               │      │     │
│  │  └───────────┘ └──────────┘ └───────────────┘      │     │
│  │  ┌───────────┐ ┌──────────────────────┐            │     │
│  │  │ Hand      │ │ Progress Tracking    │            │     │
│  │  │ History   │ │ (事件总线聚合)        │            │     │
│  │  └───────────┘ └──────────────────────┘            │     │
│  │  ┌───────────────┐ ┌────────────────┐              │     │
│  │  │ Strategy      │ │ Puzzle Trainer │              │     │
│  │  │ Academy       │ │                │              │     │
│  │  └───────────────┘ └────────────────┘              │     │
│  │  ┌───────────────┐ ┌────────────────┐              │     │
│  │  │ Theory        │ │ Onboarding     │              │     │
│  │  │ Academy       │ │                │              │     │
│  │  └───────────────┘ └────────────────┘              │     │
│  │  ┌───────────────┐                                 │     │
│  │  │ Help Center   │                                 │     │
│  │  │ (静态教程)    │                                 │     │
│  │  └───────────────┘                                 │     │
│  └─────────────────────────────────────────────────────┘     │
│        │                                                       │
│        ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐     │
│  │         Cross-Module Systems (跨模块系统)            │     │
│  │   Streak / ELO / SRS / Emotion / Mentor             │     │
│  └─────────────────────────────────────────────────────┘     │
│        │                  │                  │               │
│        ▼                  ▼                  ▼               │
│  ┌──────────┐   ┌────────────────┐   ┌────────────┐         │
│  │  Zustand  │   │ trainingEvents │   │ Web Worker │         │
│  │  Stores   │   │ (事件总线)     │   │ (GTO计算)  │         │
│  └──────────┘   └────────────────┘   └────────────┘         │
│        │                  │                                  │
│        ▼                  ▼                                  │
│  ┌──────────┐   ┌────────────┐                               │
│  │ localStorage│ │ IndexedDB │                               │
│  │ (设置/摘要) │ │ (手牌历史) │                               │
│  └──────────┘   └────────────┘                               │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 技术栈选型

| 技术 | 版本 | 选型理由 |
|------|------|----------|
| React | ^19.2.7 | 最新 React 19，支持 Concurrent Features、use() hook |
| Vite | ^8.1.5 | 极速 ESM 开发服务器，HMR 即时生效 |
| TypeScript | ^7.0.2 | 严格类型检查，`noUncheckedIndexedAccess` 保障安全 |
| Zustand | ^5.0.14 | 轻量状态管理（<1KB），原生支持 selector 精确订阅和 persist 中间件 |
| Tailwind CSS | ^4.3.3 | 原子化 CSS，Vite 插件集成，零运行时开销 |
| shadcn/ui (Radix) | Radix 原语 | 无障碍组件基础，CVA 样式变体 |
| React Router | ^7.18.1 | v7 data router，支持 createBrowserRouter |
| Recharts | ^3.9.2 | 声明式 React 图表库，用于数据可视化 |
| Framer Motion | ^12.42.2 | 声明式动画库，页面切换动效 |
| i18next | ^26.3.6 | 国际化方案，支持中英文切换 |
| Lucide React | ^1.25.0 | 轻量图标库，tree-shakable |
| pnpm | 以 `package.json` 的 `packageManager` 字段为准 | 快速、磁盘友好的包管理器 |

---

## 3. 项目结构

```
src/
├── app/                          # 应用层
│   ├── providers.tsx             # 全局 Provider 组合
│   └── routes.tsx                # 路由配置（React Router v7）
│
├── features/                     # 功能模块（Feature-First）
│   ├── range-trainer/            # 范围训练模块
│   │   ├── components/           # UI 组件（11个）
│   │   ├── hooks/                # 自定义 hooks（2个）
│   │   ├── utils/                # 工具函数（2个）
│   │   ├── constants.ts          # 预设范围常量
│   │   ├── index.ts              # 公共导出
│   │   ├── store.ts              # Zustand store
│   │   └── types.ts              # 模块类型
│   │
│   ├── pot-odds/                 # 赔率计算模块
│   │   ├── components/           # UI 组件（8个）
│   │   ├── hooks/                # 计算 hooks（2个）
│   │   ├── utils/                # 工具函数
│   │   ├── constants.ts          # 默认状态常量
│   │   ├── index.ts
│   │   ├── store.ts
│   │   └── types.ts
│   │
│   ├── gto-simulator/            # GTO 模拟器模块
│   │   ├── components/           # UI 组件（9个）
│   │   ├── hooks/                # 场景引擎 hooks（2个）
│   │   ├── utils/                # 策略比较工具
│   │   ├── data/                 # 预计算策略数据（JSON）
│   │   │   └── preflop-ranges.json
│   │   ├── index.ts
│   │   ├── store.ts
│   │   └── types.ts
│   │
│   ├── hand-history/             # 手牌历史模块
│   │   ├── components/           # UI 组件（12个）
│   │   ├── hooks/                # 回放 hook
│   │   ├── parsers/              # 多格式解析器
│   │   │   ├── common.ts         # 公共解析工具（detectFormat / parseCardString）
│   │   │   ├── gg-poker.ts       # GGPoker 格式
│   │   │   ├── partypoker.ts     # PartyPoker 格式
│   │   │   └── pokerstars.ts     # PokerStars 格式
│   │   ├── utils/                # 手牌标记工具
│   │   ├── index.ts
│   │   ├── store.ts              # IndexedDB 持久化 store
│   │   └── types.ts
│   │
│   └── progress/                 # 进度追踪模块
│       ├── components/           # UI 组件（31 个，按功能分组）
│       │   ├── dashboard/        # Dashboard / StatsOverview / ModuleStatsPage / AccuracyChart
│       │   ├── stats/            # GTOStatsPage / RangeStatsPage / WeaknessAnalysis / DifficultyIndicator
│       │   ├── streak/           # StreakTracker / StreakCelebration / StreakRail
│       │   ├── achievement/      # AchievementWall / AchievementBadges / DailyChallenge / Leaderboard
│       │   ├── gate/             # OnboardingGate / SessionLimitGuard / TiltWarning / DownswingAlert
│       │   ├── settings/         # SettingsPage / MoodTracker
│       │   ├── srs/              # SpacedRepetitionPanel / ReviewSession
│       │   ├── celebration/      # MilestoneCelebrationHost / RankUpCelebration
│       │   ├── training/         # DailyTrainingPlan / FeltArena
│       │   └── replay/           # ProgressReplay / ProgressPage
│       ├── data/
│       │   └── achievements.ts   # 成就定义数据（26 个成就）
│       ├── hooks/                # 统计 hooks
│       ├── utils/                # 聚合/连击/SRS/每日计划（共 8 个，含测试）
│       │   ├── statsAggregator.ts
│       │   ├── streakCalc.ts
│       │   ├── spacedRepetition.ts   # SM-2 间隔重复
│       │   └── dailyTrainingMix.ts   # 每日复习/新题混合
│       ├── index.ts
│       ├── store.ts              # persist v8 持久化 store
│       └── types.ts
│
│   ├── onboarding/                # 新手引导模块
│   │   ├── components/            # 6 个步骤组件
│   │   ├── data/                  # 定位测试题库
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   ├── puzzle-trainer/            # 扑克谜题模块
│   │   ├── components/            # 6 个组件
│   │   ├── data/                  # 题库（dailyPuzzles / puzzleBank / rushQuestions）
│   │   ├── hooks/                 # usePuzzleEngine
│   │   ├── utils/                 # dateSeed / optionOrder
│   │   ├── index.ts
│   │   ├── store.ts               # persist v2
│   │   └── types.ts
│   │
│   ├── strategy-academy/          # 策略学院模块
│   │   ├── components/            # 课程组件 + drills/（含 ChoiceDrillRenderer.tsx）
│   │   ├── data/                  # courses.ts（re-export 兼容层）/ learningTracks / levels/ / localLessons/ / opponentProfiles
│   │   │                          # levels/ 目录：index.ts + level1.ts ~ level8.ts（level4 拆为 level4a.ts / level4b.ts）
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── index.ts
│   │   ├── store.ts               # persist v2
│   │   └── types.ts
│   │
│   ├── theory-academy/            # 理论学院模块（2026-07 新增，设计见 5.8b）
│   │   ├── components/            # TheoryHome / TheoryChapterView / TheoryQuiz / TheoryLevelCard / PracticeBridgeCard / TheoryLearningMap 等
│   │   ├── data/                  # levels/（index.ts + theoryLevel1.ts ~ theoryLevel9.ts）+ theoryIntegrity.test.ts
│   │   ├── hooks/                 # useTheory
│   │   ├── utils/                 # theoryProgress（纯函数）/ quizOrder（选项排序出口）/ getLevelTargetChapter
│   │   ├── index.ts
│   │   ├── store.ts               # persist v2（theory-academy-progress）
│   │   └── types.ts
│
│   ├── help-center/               # 帮助中心模块（静态教程页，无 store）
│   │   ├── components/            # HelpHome / HelpArticle / QuickStartPath / FaqAccordion / ModuleEntryCard
│   │   ├── data/                  # helpContent.ts（纯 i18n key 数据）+ helpContent.integrity.test.ts
│   │   ├── index.ts
│   │   └── types.ts
│
├── shared/                       # 共享层
│   ├── components/               # 通用组件（分层组织）
│   │   ├── ui/                   # shadcn/ui 基础组件（9个：button/card/dialog/input/progress/select/tabs/toast/tooltip）
│   │   ├── poker/                # 扑克领域组件（Card / CardBack / CardSVG / Chip / SuitIcon / HandDisplay / PositionBadge）
│   │   ├── feedback/             # 反馈与状态组件（FeedbackGrade / ResultSummary / EmptyState / LoadingState）
│   │   ├── layout/               # 布局组件（TableRail / LiveDot）
│   │   └── business/             # 业务组件（CasinoPlaque / ErrorBoundary / FreezeChip / GameVariantSelector / MottoEngraved）
│   ├── constants/
│   │   ├── app.ts                # 应用常量
│   │   ├── mentorStyles.ts       # 导师文案模板（MENTOR_FEEDBACK_TEMPLATES / renderMentorFeedback）
│   │   └── poker.ts              # 扑克常量（花色/牌面/总数）
│   ├── stores/
│   │   ├── debugMode.ts          # 调试解锁 store（persist name=poker-debug-mode）
│   │   └── trainingEvents.ts     # 训练事件总线
│   ├── types/
│   │   ├── action.ts             # 动作类型
│   │   ├── common.ts             # 通用类型
│   │   ├── poker.ts              # 扑克领域类型
│   │   ├── position.ts           # 位置类型
│   │   ├── decisionFeedback.ts   # 五级反馈类型与辅助函数
│   │   ├── elo.ts                # ELO 五维评分类型
│   │   ├── mentor.ts             # 导师风格类型
│   │   └── index.ts              # barrel 导出（decisionFeedback / elo / mentor）
│   └── utils/
│       ├── cn.ts                 # className 合并工具
│       ├── deck.ts               # 牌组工具
│       ├── elo.ts                # ELO 算法（calculateEloChange / getDynamicKFactor / abilityToElo / applyEloChange）
│       ├── formatters.ts         # 格式化工具
│       ├── handRanking.ts        # 牌型判定工具
│       ├── index.ts              # barrel 导出
│       ├── localStorageStub.ts   # Node 环境测试用 localStorage 桩
│       ├── persistShape.ts       # persist 形状测试助手
│       ├── pokerMath.ts          # 扑克数学计算
│       ├── seededShuffle.ts      # 种子洗牌（Mulberry32 / FNV-1a / 数值选项判定）
│       ├── shareCard.ts          # Streak 分享卡片生成（generateStreakShareCanvas）
│       └── soundManager.ts       # 音效管理
│
├── i18n/                         # 国际化
│   ├── config.ts                 # i18next 配置
│   └── locales/
│       ├── en.json               # 英文翻译
│       └── zh.json               # 中文翻译
│
├── layouts/                      # 布局组件
│   ├── AppLayout.tsx             # 主布局（侧边栏 + 内容区）
│   ├── BlankLayout.tsx           # 空白布局（全屏训练）
│   └── MobileNav.tsx             # 移动端底部导航
│
├── styles/
│   └── globals.css               # 全局样式 + CSS 变量
│
├── App.tsx                       # 根组件
├── main.tsx                      # 入口文件
└── vite-env.d.ts                 # Vite 类型声明
```

### 3.1 目录职责

| 目录 | 职责 |
|------|------|
| `app/` | 应用级配置：路由定义、全局 Provider |
| `features/` | 按功能拆分的独立模块，每个模块包含完整的 components/hooks/utils/store/types |
| `shared/` | 跨模块共享的类型、组件、工具函数、常量、事件总线 |
| `i18n/` | 国际化资源与配置 |
| `layouts/` | 页面级布局组件 |
| `styles/` | 全局样式、CSS 自定义属性 |

### 3.2 模块间依赖规则

1. **Feature 模块间不直接依赖** — 通过 `shared/stores/trainingEvents.ts` 事件总线通信
2. **Feature → Shared** — 所有 feature 模块可引用 shared 中的类型、组件、工具
3. **Shared 不依赖 Feature** — shared 层不引入任何 feature 模块代码
4. **Layouts 仅依赖 Shared** — 布局组件不直接引用 feature 内部
5. **App 层** — 通过 `React.lazy` 动态导入 feature 页面组件

---

## 4. 核心数据模型

### 4.1 扑克领域模型

```typescript
// 花色枚举
export enum Suit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades',
}

// 牌面值枚举（2-14，14=Ace）
export enum Rank {
  Two = 2, Three = 3, Four = 4, Five = 5, Six = 6,
  Seven = 7, Eight = 8, Nine = 9, Ten = 10,
  Jack = 11, Queen = 12, King = 13, Ace = 14,
}

// 一张扑克牌
export interface Card {
  suit: Suit;
  rank: Rank;
}

// 公共牌（翻牌3张 + 转牌1张 + 河牌1张）
export interface Board {
  flop: [Card, Card, Card];
  turn: Card | null;
  river: Card | null;
}

// 手牌（2张）
export type HoleCards = [Card, Card];

// 手牌类型分类
export type HandCategory = 'pair' | 'suited' | 'offsuit';

// 规范手牌表示（169种之一）如 "AKs", "QQ", "JTo"
export type HandNotation = string;

// 牌型等级
export enum HandRank {
  HighCard = 1, OnePair = 2, TwoPair = 3, ThreeOfAKind = 4,
  Straight = 5, Flush = 6, FullHouse = 7, FourOfAKind = 8,
  StraightFlush = 9, RoyalFlush = 10,
}

// 牌型判定结果
export interface HandResult {
  rank: HandRank;
  name: string;
  cards: Card[];
  score: number;
}

// 范围动作
export type RangeAction = 'raise' | 'call' | 'fold';

// 范围条目
export interface RangeEntry {
  hand: HandNotation;
  action: RangeAction;
  frequency?: number;
}
```

### 4.2 动作模型

```typescript
// 玩家动作类型
export enum ActionType {
  Fold = 'fold',
  Check = 'check',
  Call = 'call',
  Raise = 'raise',
  AllIn = 'all-in',
}

// 一个完整的动作
export interface PlayerAction {
  type: ActionType;
  amount?: number;       // 加注/跟注的金额
  playerIndex: number;   // 玩家座位索引
  timestamp?: number;    // 时间戳（用于回放）
}

// 下注尺寸类型
export type BetSizing = 'min' | 'half-pot' | 'pot' | 'custom';

// 决策（用户在训练中的选择）
export interface Decision {
  action: ActionType;
  amount?: number;
}

// 决策评级（五级分类，对标 GTO Wizard）
export type DecisionGrade = 'best' | 'correct' | 'inaccuracy' | 'wrong' | 'blunder';

// 决策反馈（对比结果）
export interface DecisionFeedback {
  grade: DecisionGrade;        // 五级评级
  evLoss: number;              // EV 损失（BB/100）
  correctAction: Decision;     // GTO 最优动作
  explanation: string;         // 反馈文案
  relatedLessonId?: string;    // 关联课程 ID（wrong / blunder 级别建议填写）
}

// 说明：DecisionFeedback 与 DecisionGrade 定义在 src/shared/types/decisionFeedback.ts
// 配套辅助函数：
// - GRADE_THRESHOLDS：best=0 / correct=0.5 / inaccuracy=2 / wrong=5 / blunder=Infinity（BB/100）
// - calculateGrade(evLoss)：根据 EV 损失返回对应 DecisionGrade；边界归入更严重等级（v2.1 修正）
//     · evLoss <= 0 → 'best'
//     · evLoss < 0.5 → 'correct'
//     · evLoss <= 2 → 'inaccuracy'   （旧版 <2 已修正为 ≤2）
//     · evLoss <= 5 → 'wrong'         （旧版 <5 已修正为 ≤5）
//     · evLoss > 5 → 'blunder'
// - GRADE_DISPLAY_CONFIG：五级显示配置（color / textColor / 图标 / i18n titleKey）
//     · v1.3.2 牌室化：color 字段引用 globals.css 的 `.grade-best`~`.grade-blunder` 类（样式唯一事实源，
//       苔藓绿/黄铜/陶土红低透底 + 左侧色条），textColor 为 --poker-* token 文字色；
//       禁止 Tailwind 霓虹调色板类（§14.4 反 SaaS 饱和色禁令）与纯白文字
// - migrateGrade(oldGrade)：将旧三级值（optimal/acceptable/error）映射为新五级值
// - buildDecisionFeedback({ isCorrect, evLoss?, correctAction, explanation?, relatedLessonId? })：构造助手
//     · v2.1 修正：内部统一调用 calculateGrade(evLoss) 分级，避免 isCorrect 掩盖真实 EV 损失
```

### 4.3 训练模型

```typescript
// 训练会话状态
export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';

// 训练模式
export type TrainingMode = 'learn' | 'quiz' | 'practice';

// 难度级别
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// 训练结果
export interface TrainingResult {
  sessionId: string;
  module: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;   // 平均每题用时（秒）
  timestamp: number;
  details: QuestionResult[];
}

// 单题结果
export interface QuestionResult {
  question: string;
  isCorrect: boolean;
  timeTaken: number;     // 用时（毫秒）
  userAnswer: string;
  correctAnswer: string;
}

// 训练记录（持久化）
export interface TrainingRecord {
  id: string;
  module: 'range-trainer' | 'pot-odds' | 'gto-simulator' | 'strategy-academy' | 'puzzle-trainer' | 'hand-history' | 'theory-academy';
  mode: string;
  result: TrainingResult;
  createdAt: number;
}
```

### 4.4 场景模型

```typescript
// GTO 场景定义
export interface Scenario {
  id: string;
  name: string;
  description: string;
  gameType: GameType;
  stakes: Stakes;
  effectiveStack: number;       // 有效筹码（BB）
  position: Position;
  playerCount: number;
  street: 'preflop' | 'flop' | 'turn' | 'river';
  board?: Board;
  potSize: number;
  previousActions: PreviousAction[];
  heroHand: [Card, Card];
  difficulty: Difficulty;
}

// GTO 策略数据（预计算）
export interface GTOSpot {
  scenarioKey: string;
  handStrategies: Record<HandNotation, HandStrategy>;
}

// 手牌策略（频率分布）
export interface HandStrategy {
  fold: number;                 // 0-1 频率
  call: number;
  raise: number;
  raiseAmount?: number;         // 加注大小（BB）
}

// GTO 决策记录
export interface GTODecision {
  scenarioId: string;
  userAction: Decision;
  gtoStrategy: HandStrategy;
  evLoss: number;               // EV损失（BB/100）
  isOptimal: boolean;
  timeTaken: number;
}
```

### 4.5 牌局模型

```typescript
// 玩家信息
export interface Player {
  id: number;
  name: string;
  position: Position;
  seatNumber: number;
  stack: number;
  holeCards?: HoleCards;
}

// 完整牌局历史
export interface HandHistory {
  id: string;
  site: 'pokerstars' | 'ggpoker' | 'partypoker' | 'manual';
  handNumber: string;
  timestamp: number;
  gameType: string;
  stakes: Stakes;
  players: Player[];
  board: Card[];
  streets: {
    preflop: PlayerAction[];
    flop: StreetActions;
    turn: StreetActions;
    river: StreetActions;
  };
  pot: number;
  winner?: { playerId: number; amount: number; hand?: string };
  annotations: Record<string, string>;
}

// 回放状态
export interface ReplayState {
  currentStreet: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  currentActionIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  visibleCards: Card[];
  playerStacks: number[];
  currentPot: number;
}
```

### 4.6 对手形象与游戏上下文

```typescript
// 对手形象
interface OpponentProfile {
  id: string;
  name: string;
  type: 'TAG' | 'LAG' | 'NIT' | 'CALLING_STATION' | 'MANIAC' | 'UNKNOWN';
  vpip: number;
  pfr: number;
  aggressionFactor: number;
  tendencies: string[];
  counterStrategy: string[];
}

// 游戏上下文（筹码量与下注尺度）
interface GameContext {
  effectiveStack: number; // BB
  potSize: number;
  betSizes: BetSize[];
}

type BetSize = '1/3' | '1/2' | '3/4' | 'pot' | 'overbet';
```

### 4.7 复习与推荐

```typescript
// 间隔复习项
interface ReviewItem {
  id: string;
  module: string;
  content: string;
  interval: number; // 天
  easeFactor: number;
  nextReviewDate: string;
  repetitions: number;
}

// 每日推荐
interface DailyRecommendation {
  id: string;
  type: 'training' | 'review' | 'lesson';
  title: string;
  description: string;
  module: string;
  priority: number;
  route: string;
}
```

---

## 5. 模块设计

### 5.1 Range Trainer（范围训练）

**模块职责**：帮助玩家记忆不同位置的标准起手牌范围，通过学习和测验两种模式巩固知识。

**内部结构**：
| 层 | 文件 | 职责 |
|----|------|------|
| components | RangeTrainerHome, RangeGrid, RangeCell 等 11 个 | 13×13 网格渲染、学习/测验界面 |
| hooks | useQuizEngine / useTimer 2 个 | 测验引擎 / 计时器 |
| utils | handClassifier 等 2 个 | 手牌分类、格式转换 |
| store | store.ts | 学习状态 + 测验状态管理 |
| constants | constants.ts | `PRESET_RANGES` 预设范围数据（数据源定性见下方「预置范围数据源」） |

**预置范围数据源（2026-07-31 跨模块专批 C，P1A-06/P1A-08 定性）**：

- **open / call 类 preset**（utg/hj/co/btn/sb-open、bb-call-vs-btn）与 **bb-3bet-vs-btn**（BB 面对 BTN open 时 raise 即发起 3-bet，JSON 有覆盖）：以 gto-simulator `data/preflop-ranges.json`（6max_100bb_preflop）为权威源，按「频率 ≥ 0.5」离散化生成；一致性由 `src/rangePresetGtoConsistency.test.ts`（src 根，平台级跨模块守卫，同 eslintCrossImports 先例）锁定
- **发起 3-bet 类 preset**（btn-3bet-vs-co / co-3bet-vs-hj）与 **4bet-range**：JSON **无**对应频率表（JSON 的 `btn_vs_co_3bet` / `co_vs_hj_3bet` 语义为「Hero open 后面对 3-bet 的响应」，与「发起 3-bet」是不同 spot），这三个 preset 以 range-trainer 模块自身为权威源，**不参与** JSON 一致性校验；严禁为对齐而臆造求解器频率数据
- **变体 preset**（短牌 / HU / 4-Max）：JSON 口径仅 6-max 100bb，无对应表，模块自身权威源
- **百分比标注**：preset 名称中的 `(~N%)` 按组合数加权占比（P1A-07 口径，`getRangeComboPercentage`）标注，守卫断言偏差 ≤ 1 个百分点

**关键算法**：

1. **13×13 网格渲染策略**：行=第一张牌 Rank（A→2），列=第二张牌 Rank（A→2）。对角线=对子（如 AA），上三角=同花（suited），下三角=非同花（offsuit）。每个格子根据 `RangeAction` 着色（raise=绿色、call=蓝色、fold=灰色）。

2. **范围解析器**：`PRESET_RANGES` 以 `{position, actionType, hands[]}` 格式存储标准范围。`getAllHandNotations()` 生成全部 169 种规范手牌，通过集合交集判断某手牌是否在范围内。

3. **间隔重复算法（Spaced Repetition）**：
   - 维护 `handWeights: Record<string, number>`，初始权重=1
   - 答错：`weight = min(weight + 1, 3)`，提高该手牌再次出现的概率
   - 答对：`weight = 1`，恢复正常
   - 题目生成使用加权随机抽样（`weightedPick`），约 50% 范围内 + 50% 范围外

4. **测验引擎状态机**：
   ```
   idle → startQuiz → running → answerQuestion → (running | completed)
                                 ↕ pause/resume
                              paused
   ```

5. **位置渐进解锁**（v2.1 新增）：
   - 常量 `POSITION_UNLOCK_THRESHOLDS: Partial<Record<Position, number>>` 定义于 `constants.ts`：UTG=0 / HJ=800 / CO=1000 / BTN=1200 / SB=1500 / BB=1800
   - 工具函数 `isPositionUnlocked(position, preflopElo): boolean` 判断位置是否已解锁
   - 未配置阈值的位置（如 MP/UTG1）默认解锁
   - `RangeSelector` 组件渲染时调用 `isPositionUnlocked` 过滤锁定位置，悬停提示解锁所需 ELO
   - 阈值设计原则：UTG 始终解锁（最简单），BB 最后解锁（防御最复杂）

6. **反馈闭环接入**（v2.1 新增）：
   - `useQuizEngine` 新增 `inferRelatedLessonId(position, actionType)` 工具函数，由 position+actionType 推导 `relatedLessonId`
   - `buildRangeFeedback` 调用时传入 `relatedLessonId`，wrong/blunder 级别在 QuizCard 显示"去复习"链接
   - 自适应难度：`useQuizEngine` 读取 `progress.shouldDownshiftDifficulty(moduleType)` 判断是否降级，连续答错 ≥3 次时 `TrainingSession` 显示降级提示 banner

### 5.2 Pot Odds Calculator（赔率计算器）

**模块职责**：实时计算底池赔率、所需权益、EV，帮助玩家理解跟注决策的数学基础。

**内部结构**：
| 层 | 文件 | 职责 |
|----|------|------|
| components | PotOddsPage, OddsCalculator, EVCalculator, EquityChart 等 8 个 | 计算器 UI、图表展示 |
| hooks | useOddsCalculation | 计算逻辑封装（useEquityEstimate 已于 2026-07-31 P1-B 作为死代码删除） |
| store | store.ts | 输入状态管理（非持久化） |

**关键算法**：

1. **赔率计算公式**：
   ```
   potOdds = betSize / (potSize + betSize)
   ```
   隐含赔率修正：
   ```
   impliedOdds = potOdds - impliedGain / (potSize + betSize)
   ```

2. **Rule of 2 and 4（权益估算）**：
   ```typescript
   function estimateEquity(outs: number, street: 'flop' | 'turn'): number {
     if (street === 'flop') return outs * 4 / 100;   // 翻牌到河牌
     return outs * 2 / 100;                           // 转牌到河牌
   }
   ```

3. **EV 计算模型**：
   ```
   EV = equity × (potSize + betSize) - (1 - equity) × betSize
   ```
   当 `estimatedEquity > requiredEquity` 时，跟注有利可图。

4. **Recharts 图表集成**：`EquityChart` 组件使用 Recharts 绘制赔率 vs 权益对比图，柱状图展示不同 outs 数下的盈亏分界。

5. **Quiz 五级反馈与自适应难度**（v2.1 新增）：
   - `PotOddsQuizPage` 接入 `buildOddsFeedback`，输出 `DecisionFeedback`，按五级评级渲染（best/correct/inaccuracy/wrong/blunder）
   - 连续答错 ≥3 次时调用 `progress.shouldDownshiftDifficulty('pot-odds')`，显示降级提示 banner

6. **trainingEvents.emit 合规**（v2.0 新增）：
   - `PotOddsQuizPage` 完成测验后调用 `trainingEvents.emit(record)`，progress store 自动收集训练记录
   - `relatedLessonId` 反馈闭环已确认合规（`useOddsCalculation.ts` 调用 `buildOddsFeedback` 时携带 `relatedLessonId`）

### 5.3 GTO Simulator（GTO 模拟器）

**模块职责**：模拟真实牌局场景，将玩家决策与 GTO 最优策略比较，计算 EV 损失。

**内部结构**：
| 层 | 文件 | 职责 |
|----|------|------|
| components | GTOSimulatorHome, SpotTrainer, ScenarioSetup 等 9 个 | 场景配置、训练界面、结果展示 |
| hooks | useScenarioEngine, useGTOComparison | 场景生成、策略比较 |
| utils | strategyCompare.ts | 核心比较算法 |
| data | preflop-ranges.json | 预计算 GTO 策略频率数据 |
| store | store.ts | 会话管理、反馈状态 |

**关键算法**：

1. **预计算数据存储格式**：JSON 结构为 `gameType → spotKey → handNotation → HandStrategy`：
   ```json
   {
     "6max_100bb_preflop": {
       "btn_open": {
         "AKs": { "fold": 0, "call": 0.1, "raise": 0.9, "raiseAmount": 2.5 }
       }
     }
   }
   ```

2. **策略比较算法** (`compareDecision`)：
   ```typescript
   function compareDecision(userAction, gtoStrategy, potSize) {
     const evLoss = calculateEVLoss(userAction, gtoStrategy, potSize);
     const isOptimal = evLoss <= 0.5; // 容差 0.5 BB/100
     return { isOptimal, evLoss, explanation };
   }
   ```

3. **EV 损失计算**：
   ```typescript
   // 频率差越大 → 损失越大
   freqDeficit = 1 - optimalFreq
   potFactor = max(1, potSize / 10)
   evLoss = freqDeficit × potFactor × 2  // 缩放因子
   ```

4. **场景生成引擎** (`useScenarioEngine`)：
   - 根据 `ScenarioConfig`（位置、人数、难度、筹码深度）批量生成场景
   - 随机生成 Hero 手牌 + 前置动作（前方玩家 fold 概率 70%）
   - `generateScenarios(config)` → 启动训练会话

5. **EV 计算标准化**（v2.1 新增）：
   - `calculateEVFromAction(action, heroEquity, potSize, callAmount, raiseAmount?)` 使用标准 EV 公式：
     - fold: `0`
     - call: `eq × (pot + call) - (1 - eq) × call`
     - raise: `eq × (pot + rA) - (1 - eq) × rA`（rA 默认 `callAmount × 3`）
   - 移除旧版硬编码 `foldEquity = 0.3`，回归 GTO 标准
   - `PREFLOP_EQUITY` 表从 58 手扩展至 169 手全覆盖（PokerStove/Equilab 公开数据），消除 `fallback 0.50` 误算
   - `adjustForOpponent` Calling Station 剥削逻辑：fold -0.05, raise +0.15, call 归一化（原 fold 不变与策略矛盾）

6. **手牌难度分类全覆盖**（v2.1 新增）：
   - `useScenarioEngine` 的手牌难度分类从 56 手扩展至 169 手，三类互斥无重复：
     - `STRONG`：15 手（AA/KK/QQ/JJ/AKs/AKo 等顶端牌）
     - `INTERMEDIATE`：54 手（中等对子 + 强同花/非同花）
     - `ADVANCED`：100 手（边缘手 + 小同花/非同花 + 阻隔牌）
   - 配合 `difficulty` 字段（1/2/3）映射到训练场景配置

7. **resolveSpotKey 重构**（v2.1 新增）：
   - `useGTOComparison.resolveSpotKey` 在未覆盖场景返回 `null`，避免错误降级为 `open`
   - 调用方对 `null` 走 fallback 路径，不再误用 `open` 数据

8. **反馈闭环接入**（v2.1 新增）：
   - `GTOSessionPage` 根据 `scenario.street` 推导 `relatedLessonId`：preflop→`l4-gto-basics`, flop→`l3-cbet`, turn/river→`l3-multistreet`
   - 调用 `buildGtoFeedback` 时传入第三参数 `relatedLessonId`，wrong/blunder 显示"去复习"链接
   - 连续答错 ≥3 次时调用 `progress.shouldDownshiftDifficulty('gto-simulator')`，显示降级提示 banner

### 5.4 Hand History（手牌历史）

**模块职责**：导入、存储、回放和分析历史手牌数据。

**内部结构**：
| 层 | 文件 | 职责 |
|----|------|------|
| components | HandHistoryList, HandReplayer, AnnotationPanel 等 12 个 | 列表、回放、标注 UI |
| hooks | useHandReplay | 回放控制 hook |
| parsers | common.ts, pokerstars.ts, gg-poker.ts, partypoker.ts | 多格式解析器 |
| store | store.ts | IndexedDB 持久化（getDB 单例） + 回放状态 + dbError 错误状态 |

**关键算法**：

1. **多格式解析器架构（策略模式）**：
   ```
   用户粘贴文本 → detectFormat(text) → 路由到对应 parser
                    │
                    ├─ PokerStars parser
                    ├─ GGPoker parser
                    ├─ PartyPoker parser
                    └─ 'unknown' → 提示不支持
   ```
   - `common.ts` 提供 `parseCardString("Ah")` → `{suit: Hearts, rank: Ace}`
   - `detectFormat()` 使用正则匹配区分平台格式

2. **IndexedDB 持久化方案**（v2.0 重构为单例模式）：
   ```typescript
   // DB: hand-history-db v1, Store: hands, keyPath: id
   // v2.0：openDB() 重构为 getDB() 单例模式，缓存已打开的数据库连接
   let cachedDB: IDBDatabase | null = null;
   function getDB(): Promise<IDBDatabase>
   async function dbGetAll(): Promise<HandHistory[]>
   async function dbPut(hands: HandHistory[]): Promise<void>
   async function dbDelete(id: string): Promise<void>
   async function dbClear(): Promise<void>
   ```
   - **错误处理**（v2.0 新增）：`classifyDBError(err)` 分类 IndexedDB 异常（QuotaExceededError → 配额超限 / 连接失败 → 不可用 / 其他 → 通用错误），store 持有 `dbError: string | null` 字段，错误消息通过 i18n 国际化（`handHistory.dbError.quotaExceeded` / `.unavailable` / `.generic`）

3. **回放引擎状态机**：
   ```
   preflop(action 0..N) → flop(action 0..N) → turn(action 0..N) → river(action 0..N) → showdown
   ```
   - `computeReplayState(hand, street, actionIdx)` 逐步重放动作，计算筹码/底池变化
   - 支持 next/prev/jumpToStreet/play/pause/setPlaybackSpeed

4. **标注系统设计**：
   - `annotations: Record<string, string>` — 键为 `"{street}_{actionIndex}"` 或自定义标识
   - 标注随 HandHistory 一起持久化到 IndexedDB
   - 在回放任意时刻可添加/查看标注

### 5.5 Progress Tracking（进度追踪）

**模块职责**：聚合所有训练模块的数据，提供统计分析和可视化。

**内部结构**：
| 层 | 文件 | 职责 |
|----|------|------|
| components | Dashboard, ProgressPage, AccuracyChart, AchievementWall, SessionLimitGuard, OnboardingGate 等 29 个 | 仪表盘、图表、成就、门禁 |
| hooks | useProgress | 数据查询 hook |
| utils | statsAggregator.ts, streakCalc.ts | 统计聚合、连击计算 |
| store | store.ts | persist 持久化 + 事件订阅 |

**关键算法**：

1. **事件总线设计**（跨模块通信）：
   ```typescript
   // trainingEvents.ts — 发布/订阅模式
   export const trainingEvents = {
     subscribe: (cb) => { callbacks.push(cb); return unsubscribe; },
     emit: (record: TrainingRecord) => { callbacks.forEach(cb => cb(record)); },
   };

   // progress store 启动时订阅
   trainingEvents.subscribe((record) => {
     useProgressStore.getState().addRecord(record);
   });
   ```
   各 feature 模块训练完成后调用 `trainingEvents.emit(record)`，progress store 自动收集。

   **emit 合规状态**（v2.0 更新）：range-trainer / gto-simulator / strategy-academy / pot-odds / puzzle-trainer 均已合规 emit；theory-academy（2026-07 新增）章末小测完成时 emit；hand-history 经评估为复盘分析工具（非交互式训练），标注为合理豁免。

   **addRecord 去重**（v2.0 新增）：`addRecord` 内部检查 `state.records.some(r => r.id === record.id)`，相同 id 的记录不重复添加，防止事件总线重复 emit 导致训练记录膨胀。

2. **统计聚合算法** (`statsAggregator.ts`)：
   - `aggregateStats(records)` → 总会话数、总题数、总正确率、平均用时、连续天数
   - `aggregateByDay(records, days)` → 按日聚合（图表用）
   - `aggregateByModule(records)` → 按模块聚合
   - `getWeakHands(records, module)` → 找出答错最多的手牌
   - 平均用时计算：排除 `module === 'theory-academy'` 的记录（章末小测不记录耗时，averageTime 恒为 0，参与计算会拉低整体值）；三处聚合函数（`aggregateStats` / `aggregateByDay` / `aggregateByModule`）均执行此过滤

3. **Zustand persist 中间件**：
   ```typescript
   export const useProgressStore = create<ProgressStore>()(
     persist((set, get) => ({ ... }), { name: 'poker-training-progress' })
   );
   ```
   自动序列化到 localStorage，应用刷新后恢复。

4. **雷达图/成就/难度系统**：
   - 雷达图展示各模块正确率（Recharts RadarChart）
   - 成就徽章基于里程碑触发（如连续 7 天训练、100% 正确率）
   - 难度递进：beginner → intermediate → advanced

5. **自适应难度 API**（v2.1 新增）：
   - `shouldDownshiftDifficulty(): boolean` 定义于 progress store（无参调用）
   - 判定逻辑：`emotion.consecutiveWrongCount >= 3` 时返回 true，否则 false
   - 调用方（range-trainer / pot-odds / gto-simulator / puzzle-trainer / strategy-academy）根据返回值显示降级提示 banner，或自动降级难度（QuickDrill 不低于 beginner）
   - 数据源：`emotion.consecutiveWrongCount`（全局计数，由 `recordAnswer(isCorrect)` 维护：答错 +1，答对归零）
   - 该 API 是自适应难度的**唯一入口**，禁止各模块自行判定

6. **`recordTrainingDay()` / `recordQuickDrillCompletion()` / `markDailyCompleted()` 幂等性**：
   - 同一日重复调用不重复计数
   - 实现方式：内部检查 `lastTrainingDate === today` 或 `dailyCompleted[dateKey] === true`

7. **成就系统**（v2.1 新增，2026-07 理论学院扩充）：
   - 共 26 个成就，分 4 个类别：学习（Learning，10 个，含 4 项理论学院成就）/ 连续（Streak，5 个）/ 技能（Skill，6 个）/ 里程碑（Milestone，5 个）
   - 每个成就归属四档等级体系（bronze / silver / gold / diamond）中的一档
   - 成就定义数据存储在 `progress/data/achievements.ts`
   - `AchievementWall` 组件展示成就墙，已解锁成就高亮，未解锁显示解锁条件
   - Store 字段：`unlockedAchievements: string[]`、`achievementUnlockDates: Record<string, number>`

8. **冻结卡碎片系统**（v2.1 新增）：
   - `freezeCardFragments: number` 记录当前碎片数量，5 片碎片可合成 1 张冻结卡
   - 碎片掉落概率：训练模式 30%、速训模式 20%；每日最多获得 2 片（`tryEarnFragment` 内部限制，跨日自动重置计数）
   - `lastFragmentDate: string` 记录上次掉落日期，`fragmentsEarnedToday: number` 记录今日已获碎片数
   - 合成时调用 `synthesizeFreezeCard()` 扣减 5 碎片、增加 1 张冻结卡

9. **进步回放**（v2.1 新增）：
   - `ProgressReplay` 组件对比用户首次尝试与最近一次的表现（`firstAttemptScores` / `lastAttemptScores`）
   - 按绝对变化幅度降序取前 5 门课程，同时展示进步（`--poker-success`）与退步（`--poker-danger`），可视化成长轨迹

### 5.6 Onboarding（新手引导）

**模块职责**：引导新用户完成定位测试与首次微训练，设定训练目标，启动 Streak 计数。

**内部结构**：
| 层 | 文件 | 职责 |
|----|------|------|
| components | 6 个步骤组件 | Welcome / PlacementTest / FirstDrill / Celebration / GoalSetting 等 |
| data | 定位测试题库 | 5 道定位题覆盖 handRanking / position / odds / range 四个维度 |
| index.ts | 公共导出 | — |
| types.ts | 类型定义 | OnboardingState |

**关键设计**：

1. **流程编排**：`OnboardingFlow` 组件按顺序渲染 5 步流程（Welcome → PlacementTest → FirstDrill → Celebration → GoalSetting），步骤组件各自管理局部状态，完成后回调推进下一步。

2. **OnboardingGate 守卫**：`OnboardingGate` 同时包裹 `AppLayout` 与 `BlankLayout` 的 `<Outlet />`，读取 `progress.onboarding` 状态，未完成时重定向到 `/onboarding`，确保新用户必经引导流程（覆盖 5 条全屏训练路由：范围测验/赔率测验/GTO 会话/Puzzle/牌局复盘）。

3. **定位测试**：5 道题覆盖 handRanking / position / odds / range 四个维度，根据答题结果推断用户初始能力等级。

4. **首次微训练**：最后一题强制从简单题库抽取，答错时追加补救题，确保首胜体验；首胜庆祝调用 `recordTrainingDay` 启动 Day 1 Streak。

5. **状态持久化**：`progress.onboarding: OnboardingState` 记录完成状态与定位结果，通过 persist 持久化，避免重复引导。

### 5.7 Puzzle Trainer（扑克谜题）

**模块职责**：提供 Puzzle Rush / Daily Puzzle / Theme Drill 三种谜题模式，通过限时挑战、每日题目、主题专练增强决策直觉。

**内部结构**：
| 层 | 文件 | 职责 |
|----|------|------|
| components | 6 个组件 | PuzzleHome / PuzzleCard / PuzzleResult 等 |
| data | 3 个题库 | rushQuestions / dailyPuzzles / puzzleBank（主题题库） |
| hooks | usePuzzleEngine | 统一管理三种模式的题目流 / 计时 / 命 / 连对奖励 |
| utils | dateSeed | 日期种子算法（Mulberry32 + Fisher–Yates） |
| store | store.ts | persist v2 持久化（rushBest / dailyBest / themeBest / dailyCompleted / quickDrillBest / history） |
| types.ts | 类型定义 | PuzzleTheme / PuzzleResult / PuzzleBestRecord 等 |

**三种模式**：

| 模式 | 路由 | 时长/题量 | 结束条件 |
|------|------|----------|---------|
| Puzzle Rush | `/puzzle/rush?duration=3\|5` | 3 或 5 分钟 | 3 条命耗尽或时间到 |
| Daily Puzzle | `/puzzle/daily` | 8 题（日期种子） | 全部答完 |
| Theme Drill | `/puzzle/theme/:themeId` | 单主题 15-30 题 | 全部答完 |

**关键算法**：

1. **日期种子算法**（`utils/dateSeed.ts`）：
   - `getDateSeed(date)` — 将 `Date` 转为 YYYYMMDD 数字（例：2026-07-25 → 20260725）
   - `seededRandom(seed)`（Mulberry32）/ `shuffleBySeed(arr, seed)`（Fisher–Yates）/ `hashStringToSeed(str)`（FNV-1a）已上移至 `shared/utils/seededShuffle.ts`（供多模块复用），本文件 re-export 保持模块内 import 路径不变
   - `pickBySeed<T>(arr, count, seed)` — 基于种子抽取 N 个不重复元素
   - `getDailyCompletionCount(date)` — 基于种子生成 100-999 之间整数（本地模拟完成人数）
   - `getDailyKey(date)` — 返回 YYYY-MM-DD 字符串，作为 `dailyCompleted` map 的 key

2. **Rush 核心规则**：
   - 3 条命，连对 5 题奖励 +10 秒（`RUSH_STREAK_BONUS = 10000ms`）
   - 难度递增：前 5 题 difficulty=1，中间 difficulty=2，后面 difficulty=3
   - 分数公式：`correctCount × 100 + floor(timeRemaining/1000) × 10 + lives × 200`

3. **Daily 模式**：基于日期种子从全题库抽取 8 题，所有人当天看到相同题目；完成状态 `dailyCompleted[dateKey] = true` 幂等持久化。

4. **Theme 模式**：10 主题共 205 题（翻前 RFI 30 / 大盲防守 25 / 3Bet 策略 20 / C-Bet 持续下注 20 / 同花听牌 20 / 河牌价值下注 20 / 诈唬时机 15 / 短筹码策略 20 / ICM 基础 15 / 多人底池 20），按 4 类分组（翻前 / 翻后 / 河牌 / 锦标赛）。

5. **Puzzle 引擎**（`hooks/usePuzzleEngine.ts`）：
   - 接口：`state` / `currentQuestion` / `answer(optionId)` / `next()` / `end()` / `reset()` / `buildResult()` / `isCurrentAnswered` / `currentAnswer` / `lastBonus` / `clearBonus`
   - `buildResult()` 返回 `PuzzleResult`（含 sessionId / mode / theme / totalQuestions / correctCount / wrongCount / accuracy / duration / averageTime / score / timestamp / answers / questions / status）

6. **反馈系统**：五级反馈复用 `DecisionFeedback` 与 `GRADE_DISPLAY_CONFIG`，根据 EV 损失自动评级（best/correct/inaccuracy/wrong/blunder）。

7. **独立 Store**：独立 zustand store（不触碰 progress store 的 elo 字段），persist name: `puzzle-trainer-store`；任一模式完成时调用 `progressStore.recordTrainingDay()` 计入 Streak。

8. **选项语义排序**（`utils/optionOrder.ts`）：`parseOptionSortKey(text)` 从选项文本解析（动作类别, 尺度），类别优先级 Fold < Check < Call < Limp < Bet/C-bet < Raise/3bet/4bet/5bet < 全下类，同类按 BB 数值升序；`sortOptionsCanonically(options)` 稳定排序。题库出口 `getAllPuzzles()` / `getPuzzlesByTheme()` 逐题应用（源题库静态数据不重排），详见 5.9 选项排序治理系统。

9. **课程联动反馈**（v2.1 新增）：
   - `usePuzzleEngine` 新增 `inferPuzzleLessonId(theme)` 工具函数，将 10 个主题映射到课程 ID（如 `preflop-rfi` → `l2-rfi-basics`）
   - `PuzzleAnswerRecord` 类型新增 `relatedLessonId?: string` 字段
   - `PuzzleCard` 在 wrong/blunder 级别显示"去复习"链接，跳转对应课程

10. **trainingEvents.emit 合规**（v2.0 新增）：
   - `PuzzleRush` / `DailyPuzzle` / `ThemeDrill` 三种模式完成后均调用 `trainingEvents.emit(record)`，progress store 自动收集训练记录
   - emit 的 `record.module` 为 `'puzzle-trainer'`

11. **自适应难度接入**（v2.0 新增）：
    - 三种模式（Rush / Daily / ThemeDrill）均调用 `progress.shouldDownshiftDifficulty('puzzle-trainer')` 检查是否需要降级
    - 连续答错 ≥3 次时显示降级提示 banner（i18n key: `puzzle.common.downshiftHint`）

### 5.8 Strategy Academy（策略学院）

**模块职责**：提供结构化课程、知识图谱、学习路径、实践 Drill 与等级认证，构建从零基础到进阶的系统学习体系。

**内部结构**：
| 层 | 文件 | 职责 |
|----|------|------|
| components | 课程组件 + drills/ | AcademyHome / BasicsIntro / CourseView / LessonContent / SectionNav / LessonIntroCard / PredictionPrompt / ConceptGraphView / LevelCard / PracticeDrill + 4 个 Drill + ChoiceDrillRenderer.tsx |
| data | courses.ts / learningTracks / levels/ / localLessons/ / opponentProfiles | 课程数据（courses.ts 现为 re-export 兼容层）、学习路径、分级课程数据、本地课程、对手形象 |
| hooks | useAcademy | 学院进度 hook |
| utils | courseProgress / lessonUnits | 进度计算工具 / 课程小节派生（显式 units 优先 → heading 分节 → 兜底单 unit → examples 分配 → 综合示例尾节标识符，`resolveUnitTitle` 渲染层翻译） |
| store | store.ts | Zustand store（含 abilityAssessment） |
| types.ts | 类型定义 | Course / Lesson / LearningTrack / OpponentProfile 等 |

**关键设计**：

1. **课程结构**：课程数据原存储在 `courses.ts`，现已拆分到 `data/levels/` 目录（`index.ts` + `level1.ts` ~ `level8.ts`，其中 level4 拆为 `level4a.ts` / `level4b.ts`），`courses.ts` 保留为 re-export 兼容层。每级包含多个课时（lesson）；lesson 类型包括理论课、Drill 实践课、概念课。`CourseView` 阅读阶段采用**小节锚点式微观闭环**（2026-08 P1 重构，替代原三段式 Tabs）：课程页 = 先行组织者卡（LessonIntroCard 路线图）→ 小节序列（SectionNav sticky 锚点导航 + 概念块与内嵌牌例同屏 + 顺序推进 CTA「进入下一节 / 进入实战练习 / 完成学习」）→ 综合实战（PracticeDrill）→ 课后测验（LessonQuiz）。小节由 `utils/lessonUnits.ts` 的 `deriveLessonUnits` 派生（显式 `lesson.units` 字段优先，否则按 content 的 heading 分节、examples 按语义配对 exampleId）；`location.hash`（`#uN`）支持直达小节，`handleRestart` 以 `history.replaceState` 清理 hash 残留。

   **L4 拆分说明**：原 Level 4（GTO 与博弈论基础）内容过多，拆分为：
   - **L4A（范围与EV思维）**：覆盖翻前范围构造、EV 计算与应用
   - **L4B（GTO与博弈论）**：覆盖 Nash 均衡、MDF、最小防御频率等博弈论概念

2. **基础 Drill 集合**（`components/drills/`）：
   | Drill | 题量 | 题库文件 | 覆盖维度 |
   |------|------|------|--------|
   | HandRankingDrill | 10 题 | `handRankingQuestions.ts` | 牌型识别（末 2 题简单起手牌比较） |
   | PositionDrill | 8 题 | `positionQuestions.ts` | 位置意识（6-max 牌桌点击） |
   | OutsDrill | 8 题 | `outsQuestions.ts` | 听牌计数（同花/OESD/Gutshot/二四法则） |
   | PotOddsDrill | 6 题 | `potOddsQuestions.ts` | 赔率计算（含图形化可视化） |

   统一 `DrillProps` 接口：`onComplete(result)` / `onExit()`，复用现有 CardSVG / HandDisplay 组件。题库均以 `promptKey` / `optionsKeys` / `explanationKey` 引用 i18n key（多语言驱动）。

   **ChoiceDrillRenderer 通用组件**（`components/drills/ChoiceDrillRenderer.tsx`）：通用选择题 Drill 渲染器，接受题库数据与配置参数，支持自定义题目数量、随机抽取、五级反馈接入，L2-L8 每级新增的 2 个 Drill 均通过此组件渲染。

   **DrillComponentName 类型**：`'HandRankingDrill' | 'PositionDrill' | 'OutsDrill' | 'PotOddsDrill' | 'ChoiceDrill'`（共 5 个值），其中 `'ChoiceDrill'` 对应 ChoiceDrillRenderer 通用渲染器。

3. **学习路径**（`learningTracks.ts`）：零基础快速入门 track 按顺序插入基础 Drill，引导新手完成入门训练。

   **学习路径横向推荐**：每个 LearningTrack 新增 `relatedTrackIds?: string[]` 字段，完成当前课程路径后推荐关联路径，形成学习网络。

   **前置条件**：`LevelInfo` 类型新增 `id?: string` 和 `prerequisiteLevelIds?: string[]` 字段，支持跨等级解锁规则：
   - L7（现金桌专项）需完成 L3 + L5
   - L8（高级剥削策略）需完成 L4B
   - 本土低级别盈利路径需完成 L1-L3

   **等级解锁判定（区分 4A/4B）**：store 提供两个方法——`isLevelUnlocked(level: number)`（按 level 数字，同 level 数字任一条目满足即解锁，用于兼容旧调用）与 `isLevelEntryUnlocked(levelId: string)`（按 `LevelInfo.id` 精确判定，如 `l4a`/`l4b`）。UI 门禁（`CourseView` / `ConceptGraph` / `AcademyHome` / `LevelCard`）统一使用 `isLevelEntryUnlocked`，消除 L4A/L4B 同为 `level:4` 时 L4B 门禁被旁路的缺陷。`CourseView` 对本土课按 `LOCAL_TRACK.prerequisiteLevelIds` 单独判定。级别认证（`LevelCertification`）题池按 `LEVELS.filter(l.level === level)` 合并同 level 全部条目（Level 4 = 4A + 4B），`attemptCertification` 的 questionCount 与实考口径统一为 `min(合并题池, 20)`。

4. **知识图谱**（ConceptGraphView）：
   - 使用 SVG + framer-motion 渲染节点和边
   - 节点状态：已掌握（绿色）、学习中（金色）、未解锁（灰色）
   - 支持点击节点跳转到对应课程
   - 数据源：课程依赖关系图（DAG）

5. **对手形象系统**（`data/opponentProfiles`）：`OpponentProfile` 类型定义对手分类（TAG / LAG / NIT / CALLING_STATION），含 VPIP / PFR / aggressionFactor 统计与应对策略。

6. **能力评估**：`abilityAssessment` 字段记录用户在各维度的能力值（0-100），可与 ELO 系统通过 `abilityToElo()` 映射互转。

7. **快速训练入口**：`QuickDrill` 组件接收 `quick=true` 参数进入快速模式（固定 5 题、自适应难度），完成时调用 `recordTrainingDay` 计入 Streak，XP 计算（每题 +10 / 全对 +20 奖励）。

8. **课程双层门禁**（v2.1 新增）：
   - `CourseView` 在挂载时检查两道门禁：
     - **Level 门禁**：用户当前 `level` 必须 ≥ 课程所在等级
     - **Prerequisite 门禁**：课程 `prerequisites?: string[]` 中所有课程 ID 必须已完成
   - 任一门禁不通过时显示锁定提示卡片，不渲染课程内容（防止 URL 绕过）
   - **例外**：`local-mental-tilt-recognition` 课程无前置依赖，跳过 prerequisite 检查（情绪管理可随时访问）
   - `Lesson` 类型新增 `prerequisites?: string[]` 字段（定义于 `strategy-academy/types.ts`）
   - 当前已声明 prerequisite 的课程：`l2-4bet-strategy` / `l2-squeeze`（均依赖 `l2-3bet-basics`）

9. **QuickDrill 自动降级**（v2.1 新增）：
   - 连续答错 ≥3 次时调用 `progress.shouldDownshiftDifficulty('strategy-academy')`，自动降级难度（不低于 beginner）
   - 降级后的题目从更低难度池抽取

10. **dailyPlan 职责区分**（v2.1 新增）：
    - 项目内存在两个 `generateDailyPlan` 函数，职责不同：
      - `strategy-academy/utils/dailyPlan.ts`：生成学院焦点课程计划（当日学习目标）
      - `progress/utils/dailyPlan.ts`（或类似）：跨模块推荐计划（基于五维能力弱项推荐训练模块）
    - 两者通过注释明确职责，避免功能混淆
    - `ABILITY_LESSON_MAP` 已修正 5 个错误 lesson ID（如 `l2-3bet` → `l2-3bet-basics`）

11. **新增课程**（v2.1 新增）：
    - `l3-3bet-postflop`：3Bet 翻后策略
    - `l7-hu`：单挑（Heads-Up）策略
    - `l5-tools`：扑克工具使用指南
    - `l5-online-vs-live`：线上 vs 线下差异与调整

12. **互动示例预测暂停（checkpoint）**（2026-08 P2 新增）：含 exampleId 且有 practice 的小节默认开启 `checkpoint`（含显式声明），`HandExampleComponent` 以 `interactive` prop 切换到 `PredictionPrompt` 互动模式——先猜后揭示（生成效应 + 自我解释效应）：预测区三动作按钮（正确决策 / 常见错误 / 干扰项，由现有数据派生零新字段）+ 五级反馈徽章（复用 `GRADE_DISPLAY_CONFIG`，evLoss 由 `commonMistake.evLoss` 解析兜底 3）。**设计豁免登记**：checkpoint 为脚手架性质，纯本地 state（`LessonContent.checkpointAnswered`），不接 ELO / 不 emit trainingEvents / 不调用 progress store（与 theory-academy 章末小测豁免同类）。

13. **降级复习闭环（P3 新增）**：`PracticeDrill` 自适应降级且 `shouldRecommendReview` 命中时，以常驻提示条替代 4 秒 toast，点击「返回复习」经 `onReviewRequest(topics)` 回跳——topic 与 unit.title 双向包含匹配（无匹配回退第 1 节），跳转后经末节 CTA 重新进入实战（drill 重开，P4 后小节完成状态持久化但 drill 中途状态不持久化）。完成页新增「重新实战」入口（`CourseDoneView.hasPractice` + `onRestart('practice')` → `restartTarget` 经 phase 重挂载直达实战视图）。

### 5.8b Theory Academy（理论学院，2026-07 新增）

与 strategy-academy 并列的独立理论学习模块（产品规格见 PRD 5.27）：理论学院负责知识构建，策略学院负责实践应用，两者形成“理论→实践”闭环。架构完全复刻 strategy-academy 成熟模式。

1. **数据模型**（`theory-academy/types.ts`）：
   - `TheoryLevelInfo`：id（'t1'-'t9'）/ level / tier（`basic` T1-T3 | `intermediate` T4-T6 | `advanced` T7-T9）/ chapters / unlockRequirement / practiceRecommendations
   - `TheoryChapter`：id（全局唯一，前缀 `t<level>-`，与 strategy-academy 的 `l<level>-` 隔离）/ level / order / title / subtitle / duration / **eloDimension**（五维之一）/ content（`TheorySection[]`）/ quiz（`TheoryQuizQuestion[]`，3-5 题）
   - `TheorySection`：type（text/heading/highlight/example/**formula**/pro-tip/key-point）+ content（内联中文，与策略学院课程正文口径一致，不进 i18n）
   - `PracticeRecommendation`：lessons（{ id, title }[]，引用 strategy-academy 课程）+ trackId?（轨道）——仅字符串引用，不产生模块 import

2. **内容体系**：9 Level 共 31 章、155 道章末小测（2026-08 系统性扩充后每章满 5 题；扩充前 124 题），数据按 Level 拆分为 `data/levels/theoryLevel1.ts ~ theoryLevel9.ts`（课程内容数据文件放宽 200 行限制；扩充后单文件约 350-500 行），`data/levels/index.ts` 聚合为 `THEORY_LEVELS`。扩充标准（2026-08 起为硬性契约）：
   - 每章 content 覆盖全部 7 类段落（text/heading/highlight/key-point/formula/example/pro-tip），禁止纯 text 堆砌
   - 关键公式必须展示推导过程而非仅结论（例：MDF 推导 `对手诈唬 EV = f×P − (1−f)×B = 0 → f = P/(P+B) = 1/(1+b)`；几何尺度三街公式 `x = ((1+2·SPR)^(1/3)−1)/2`）
   - 每章至少 2-3 个不同场景实战牌例（翻前/翻后、价值/诈唬、浅/深筹码），标注反直觉点与认知误区（highlight 段落）
   - 教材对照：思想复述 + 通用数学表述，禁止逐字复制受版权教材原文；出处以「（概念源自：XXX 教材 YY 章）」脚注式标注（对照索引见 PRD 5.27 经典教材对照表）

3. **Store**（`store.ts`，persist name `theory-academy-progress`，version 1）：
   - 状态：`progress: { completedChapters / quizScores / currentChapter / startedAt }`
   - `completeChapter(id, score, total, correct)`：幂等（重复不重复计数），quizScores 取历史最高分，内部 `trainingEvents.emit`（module `'theory-academy'`）
   - `isTheoryLevelUnlocked(levelId)`：首行 `isDebugUnlockActive()` 短路；T1 默认解锁，Tn 需 T(n-1) 全部章节完成
   - `getLevelProgress` / `getTotalProgress` / `resetProgress`

4. **ELO 集成**：`TheoryQuiz` 每题作答时调用 `progress.updateElo(chapter.eloDimension, isCorrect, getChapterDifficulty(level))` + `progress.recordAnswer(isCorrect)`（难度映射：T1≈0.2 递增至 T9≈0.8）；章节完成调 `progress.recordTrainingDay()`。

5. **选项排序治理**：`utils/quizOrder.ts` 的 `orderTheoryQuizQuestion` 复用 `shared/utils/seededShuffle`（数值升序 / id 哈希种子洗牌 + correctIndex 重映射），接入 5.9 选项排序治理。

6. **成就集成**：`achievements.ts` 新增 `theoryChapters` / `theoryLevel` 两个 condition type 与 4 项成就；progress store `checkCondition` 通过动态 import `getTheoryStore()`（复刻 `getAcademyStore` 缓存模式）读取进度。

7. **路由**：`/theory`（TheoryHome，含 ErrorBoundary）/ `/theory/chapter/:chapterId`（TheoryChapterView，URL 直达门禁），均 lazy + LazyWrapper；侧边栏“研习”分组入口（`nav.theory`，Library 图标，紧邻策略学院并列，2026-07-30 导航 IA 重构后两学院与牌局复盘同属研习分组），MobileNav 底部导航同步含理论学院项。

8. **数据守卫**：`data/theoryIntegrity.test.ts`（ID 唯一与前缀、小测合法性、eloDimension、实践推荐结构）/ `utils/quizOrder.test.ts`（重映射 + 分布守卫 <50%）/ `store.persist-shape.test.ts`；实践推荐课程 ID 悬空由 strategy-academy `curriculumIntegrity.test.ts` 的 `CROSS_MODULE_LESSON_IDS` 守卫。

9. **理论→实践桥接**：每 Level 完成后 `PracticeBridgeCard` 展示推荐课程/轨道（路由字符串跳转），各 Level 的 practiceRecommendations 定向推荐仅指向 track-beginner / track-gto / track-cash-game；strategy-academy `learningTracks.ts` 的 `track-theory-bridge`（“理论到实践”轨道）为经 `/academy/tracks` 泛浏览发现的通用衔接入口（按理论支柱顺序串联实战课程），不是各 Level 的定向推荐目标（P1F-05 定性，专批 A 2026-07-31）。

**理论学院 persist v2 迁移**（2026-08）：
- `TheoryProgress` 新增 `flaggedQuestions: string[]` 字段
- persist version 1 → 2，migrate 注入 `flaggedQuestions` 默认值
- 新增幂等 action `toggleFlagQuestion(questionId)`

**章节难度标签阈值**（2026-08 定义）：
- `getChapterDifficulty(level)` 返回值 < 0.35 → 基础（success 色）
- 0.35 ≤ 值 < 0.6 → 进阶（warning 色）
- ≥ 0.6 → 高级（danger 色）

**学习路径地图**（2026-08）：
- `getLevelTargetChapter(level, completedChapters)` 纯函数：返回首个未完成章节（全完成则返回第一章）
- TheoryLevelCard「继续学习」与 TheoryLearningMap 节点点击共用此推导

**章节切换骨架屏**（2026-08）：
- TheoryChapterView 的 trackedChapterId 渲染期重置时同步置位 isTransitioning
- 150ms 后恢复渲染新章节内容（ComponentSkeleton 过渡）

**变体课程体系**（P2 变体支持，2026-08）：
- 数据位置：`data/levels/variants/`（`short-deck.ts` / `heads-up.ts` / `index.ts` / `theoryIntegrity.test.ts`）；标准系列复用主 `THEORY_LEVELS` 不重复存放
- 索引：`variants/index.ts` 导出 `ALL_VARIANT_THEORY_LEVELS`（标准 + 短牌 + 单挑总索引）与 `getTheoryLevelsByVariant(variant)` 查询函数（TheoryHome 按 activeVariant 过滤 Level 列表）
- ID 命名：Level `t{level}{suffix}`、章节 `t{level}{suffix}-{topic}`（短牌 suffix=sd、单挑 suffix=hu），与标准系列 `t{level}` 隔离；变体完整性守卫（`variants/theoryIntegrity.test.ts`，8 用例：ID 全局唯一/前缀格式/T1-T9 全覆盖/order 连续/eloDimension 合法/tier 归属）
- 内容标准与标准系列同构：每章 content 覆盖全部 7 类段落、公式含推导、实战案例含具体牌面/位置/底池、教材引用采用「（概念源自：《教材名》作者 Ch.XX）」脚注式标注
- 内容填充进度（2026-08-06）：单挑 T1-T3（t1hu 概率基础 / t2hu 赔率策略 / t3hu 位置与起手牌）已填充完整内容与章末小测，practiceRecommendations 对接单挑实践课程（l7hu-stakes / l4hu-ev-adjustments / l4hu-bn-opening / l3hu-bb-defense）；T4-T9 与短牌系列仍为骨架（content/quiz 空数组，守卫允许骨架阶段为空）
- 变体实践推荐引用的课程 ID 不纳入标准系列 `CROSS_MODULE_LESSON_IDS` 白名单（该白名单仅对照标准 LEVELS 校验），悬空风险由变体课程自身存在性保证
- **变体解锁门禁适配**：变体 Level 的解锁链在变体自己的 Level 序列内独立判定（序列内 idx=0 恒解锁，Tn 需前一 Level 全部章节完成），`isLevelUnlockedByCompleted` 通过 `ALL_VARIANT_THEORY_LEVELS` 查找 levelId 所属变体再取该变体序列，标准系列行为完全不变；章节查找（`findChapterById`/`findLevelByChapterId`/`getNextChapter`）均支持变体章节，`getNextChapter` 顺延在同一变体序列内（不跨变体）；进度计算（`getLevelProgress`/`getTotalProgress`）按当前 `activeVariant` 的序列自洽统计

### 5.9 跨模块系统设计

> 本节汇总 Streak / ELO / SRS / Emotion / Mentor 五大跨模块系统，以及 v2.1 新增的反馈闭环 / 位置渐进解锁 / 自适应难度三大系统、选项排序治理系统的技术设计。这些系统横切多个 feature 模块，状态统一收敛在 `progress` store，通过 persist 持久化。

**选项排序治理系统**（2026-07 新增，产品规格见 PRD 5.26）

消除题库静态数据"正确答案位置固定"的可作弊模式，选项顺序处理全部在出口/渲染前由纯函数完成，源题库数据零重排。

共享基础设施 `shared/utils/seededShuffle.ts`（判定规则以该文件实现为事实源）：
- `seededRandom`（Mulberry32）/ `shuffleBySeed`（Fisher–Yates，不修改原数组）/ `hashStringToSeed`（FNV-1a，uint32）
- `isNumericOptionSet(texts)` 与 `sortByNumericValue(items, getText)` — 纯数值选项集判定与升序排列

分流规则：动作类选项语义固定排序（消极→激进）；纯数值选项单调排列；文字陈述类按 `hash(题目id)` 种子洗牌（跨会话稳定）；认证考试用会话随机种子。

各模块实现：

| 模块 | 实现 | 接入点 |
|---|---|---|
| puzzle-trainer | `utils/optionOrder.ts` | 题库出口 getter（`withCanonicalOptions`），barrel 不再导出原始 `PUZZLE_BANK` |
| strategy-academy | `utils/quizShuffle.ts`（`orderQuizQuestion` / `orderDrillOptions` / `orderResolvedOptions`） | LessonQuiz（id 稳定种子）/ LevelCertification（会话随机）/ ChoiceDrillRenderer / OutsDrill 等 4 个 i18n-key Drill（`t()` 解析后 useMemo 重排） |
| pot-odds | `utils/quizOrder.ts`（`orderQuizOptions`） | `data/quizQuestions.ts` 模块顶层 map + `getEasyOddsQuestion` |

设计要点：
- i18n-key 型题库（outs / potOdds / handRanking / opponent Drill）须在 `t()` 解析后重排；数值判定在模块内放宽为"文本含数字"（`isDigitBearingOptionSet`）以兼容 zh/en 文案；洗牌种子只依赖题目 id，双语顺序天然一致
- Drill 数值题源数据本已升序，"一律升序"无治理效果，采用"数值单调 + 升/降序方向由 `hash(id)` 奇偶决定"（决策记录于 CHANGELOG 2026-07-28）；课后测验的数值题仍一律升序
- 重排同步重映射 `correctIndex`，判分与 ELO/SRS/训练事件链路以重排后对象为唯一事实源
- 各模块测试内置分布守卫（正确答案索引占比上限断言），防未来题库扩充时偏差回归

**反馈闭环系统**（v2.1 新增）

正向反馈（训练→课程）：
- 所有训练模块（range-trainer / pot-odds / gto-simulator / puzzle-trainer）的答题反馈必须携带 `relatedLessonId`（v2.0 确认 pot-odds 已合规）
- 工具函数：
  - `inferRelatedLessonId(position, actionType)` — range-trainer 用
  - GTO `GTOSessionPage` 根据 `scenario.street` 推导：preflop→`l4-gto-basics`, flop→`l3-cbet`, turn/river→`l3-multistreet`
  - `inferPuzzleLessonId(theme)` — puzzle-trainer 用，10 主题映射到课程 ID
- 渲染：`QuizCard` / `GTOFeedback` / `PuzzleCard` 在 wrong/blunder 级别显示"去复习"链接
- 设计豁免（2026-07-31 P0-B 定性）：theory-academy 章末小测为概念判断题、无 EV 语义，暂不接入五级判分体系（沿用二元对错 + 解析渲染，见 TheoryQuiz.tsx 头注），与 hand-history 不 emit 训练事件的豁免同为登记在案的设计豁免

反向反馈（数据→难度）：
- `progress.shouldDownshiftDifficulty(): boolean`（无参调用）是自适应难度的**唯一入口**
- 数据源：`emotion.consecutiveWrongCount`（全局计数，由 `recordAnswer(isCorrect)` 维护）
- 调用方：所有训练模块的会话页面（range-trainer / pot-odds / gto-simulator / puzzle-trainer / strategy-academy）（v2.0 确认 puzzle-trainer 已接入）
- 行为：连续答错 ≥3 次显示降级提示 banner；QuickDrill 自动降级难度（不低于 beginner）
- 模块边界（2026-08 定性）：strategy-academy 课程内 PracticeDrill 的自适应降级建议（`shouldRecommendReview`）为模块内闭环，经 `onReviewRequest` 本地回跳小节锚点，**不消费也不修改** `progress.shouldDownshiftDifficulty`（后者仅 QuickDrill 只读消费）

“最后一题简单 + 补救机制”实现（从 PRD 5.9 迁入）：

| 模块 | 最后一题简单辅助函数 | 调用方 |
|---|---|---|
| range-trainer | `getEasyQuestion()` → QuizQuestion（AA@BTN raise） | `useQuizEngine` / `store.ts` 的 `startQuiz` + `nextQuestion` |
| pot-odds | `getEasyOddsQuestion()` → PotOddsQuizQuestion（底池 100 / 下注 0 / 跟注 +EV） | `PotOddsQuizPage` 的 `effectiveQuestions` memo + `handleNext` |
| gto-simulator | `getEasyGTOScenario(index)` → Scenario（BTN AA open，GTO 100% raise） | `useScenarioEngine.generateScenarios` + store `nextScenario` |

- 末题答错且未用过补救时追加一道简单题，以 `rescueUsed: boolean` 状态避免无限循环；`TrainingResult.lastQuestionCorrect` 记录最终题（含补救题）是否答对
- 五级反馈类型与阈值事实源：`shared/types/decisionFeedback.ts`（`GRADE_THRESHOLDS` / `calculateGrade` / `GRADE_DISPLAY_CONFIG` / `migrateGrade` / `buildDecisionFeedback`，详见 §4.2）

**位置渐进解锁系统**（v2.1 新增）

- 常量 `POSITION_UNLOCK_THRESHOLDS: Partial<Record<Position, number>>` 定义于 `range-trainer/constants.ts`
- 阈值表：UTG=0 / HJ=800 / CO=1000 / BTN=1200 / SB=1500 / BB=1800
- 工具函数 `isPositionUnlocked(position, preflopElo): boolean`：
  - 未配置阈值的位置（如 MP/UTG1）默认解锁（返回 true）
  - 已配置阈值的位置：`preflopElo >= threshold` 时解锁
- 调用方：`RangeSelector` 组件渲染时过滤锁定位置，悬停提示解锁所需 ELO
- 阈值变更规则：调整阈值时必须同步更新 `docs/CHANGELOG.md`，并在 `range-trainer-dev.md` 子代理文件中记录

**调试解锁系统（开发者选项）**（2026-07 新增，产品规格见 PRD）

面向开发与演示的全局门禁旁路，激活后一次性解除所有功能锁。

- 独立 store `shared/stores/debugMode.ts`（persist name=`poker-debug-mode`，version 1，不并入 progress store 以免连带 persist 形状/版本变更）：`unlockAll` 状态 + `activateWithCode(code)` + `deactivate()`；激活码常量 `DEBUG_UNLOCK_CODE` 以该文件为唯一事实源（本文档不维护数值副本）；导出非响应式 `isDebugUnlockActive()` 供 store 方法/纯逻辑短路，组件内响应式门禁改用 `useDebugModeStore((s) => s.unlockAll)`
- 解锁点短路（激活后全部放行，共 9 处）：strategy-academy store 的 `isLevelUnlocked`/`isLevelEntryUnlocked`（`isDebugUnlockActive()`）、strategy-academy `ConceptGraph` 本土课节点解锁（`isLocalLessonUnlocked`，`isDebugUnlockActive()`）、`CourseView` 本土课与课程级门禁、strategy-academy `LearningTracksView` 轨道前置、range-trainer `RangeSelector` 位置解锁、range-trainer `QuizConfig` 位置解锁、progress `SessionLimitGuard`（`useSessionLimitReached`）每日题量上限、theory-academy store 的 `isTheoryLevelUnlocked`（`isDebugUnlockActive()`）、theory-academy `TheoryChapterView` 章节 URL 直达门禁（未标注 `isDebugUnlockActive()` 者均走组件响应式 `useDebugModeStore((s) => s.unlockAll)`）
- UI 入口：`SettingsPage`「开发者选项」分区（数字输入框 + 激活/关闭）
- 范围边界：onboarding 不纳入（未完成引导无法进入设置页，纳入无意义）；成就与统计数据不受影响

**Streak 系统（连击与冻结卡）**

状态字段（`progress.streak: StreakState`）：`currentStreak` / `longestStreak` / `lastTrainingDate`(YYYY-MM-DD) / `streakFreezes` / `streakFreezeUsedToday` / `milestones` / `lastMilestoneCelebrated` / `streakStartDate` / `streakBrokenAt`。

核心机制：
- **冻结卡扣减**：`gap = 2` 天且 `streakFreezes > 0` 且今日未用时，自动扣减 1 张，streak 继续 +1（同一天仅生效一次）；新用户初始赠送 2 张
- **里程碑奖励**：达成 3 / 7 / 30 / 100 / 365 天分别奖励 1 / 2 / 3 / 5 / 10 张冻结卡
- **Earn Back 机制**：streak 断裂时记录 `streakBrokenAt`，24 小时内完成训练可恢复
- **提醒动效**：`StreakTracker` 在 20:00 后未训练时火焰变红闪烁
- **庆典与分享**：`StreakCelebration.tsx` 全屏 Dialog（CSS keyframes 彩屑 / 烟花 / 光晕）；30 天及以上显示"分享"按钮，调用 `generateStreakShareCanvas` 生成 1080×1080 PNG

核心 Actions（从 PRD 5.8 迁入）：

| Action | 描述 |
|---|---|
| `recordTrainingDay()` | 更新 streak（含 Earn Back / 冻结卡自动扣减），今日成功记录时触发 `checkMilestone`（幂等）。计入口径（专批 B 统一）：**任何一次实质训练完成都计入训练日**——含各训练模块会话结算、theory 章节完成、strategy 课程测验/Drill 完成（CourseView）、QuickDrill 快速/普通模式完成 |
| `useStreakFreeze()` | 手动使用一张冻结卡，返回布尔值 |
| `checkMilestone()` | 检查并标记新达成的里程碑，返回里程碑天数或 null |
| `awardStreakFreeze(count?)` | 奖励指定数量冻结卡（默认 1） |
| `canEarnBack()` | 判断是否处于 Earn Back 24 小时窗口期 |
| `earnBackStreak(previousStreak)` | 恢复 streak 为 previousStreak + 1，清除 `streakBrokenAt` |

**ELO 能力分级（五维评分 / 六段位 / 动态 K 因子）**

类型定义（`shared/types/elo.ts`）：
- `EloRating`：`overall` / `preflop` / `postflop` / `math` / `handReading` / `mental` / `kFactor` / `gamesPlayed` / `lastUpdated`
- `RANKS` 六段位：新手 🌱 (0-500) / 入门 🎯 (500-800) / 进阶 ♠️ (800-1200) / 中级 ♥️ (1200-1600) / 高级 ♦️ (1600-2000) / 专家 ♣️ (2000-3000)
- `DEFAULT_ELO`：起始 500 分 / kFactor 32 / gamesPlayed 0

核心算法（`shared/utils/elo.ts`）：
- `calculateEloChange(currentRating, isCorrect, difficulty, kFactor)` — 简化 ELO 公式：`E = 1/(1+10^((diff*800-rating+400)/400))`，`delta = K*(S-E)`
- `getDynamicKFactor(gamesPlayed, overall)` — 动态 K 因子：新手 48 / 默认 32 / 高分 24
- `abilityToElo(ability)` — 0-100 → 300-1500 映射（用于 strategy-academy 迁移）
- `applyEloChange(current, dimension, isCorrect, difficulty)` — 钳制 + 重算 overall / kFactor / gamesPlayed

Progress Store Actions（从 PRD 5.13 迁入）：
- `updateElo(dimension, isCorrect, difficulty)` — 应用 ELO 变化到指定维度，重算 overall/kFactor/gamesPlayed，自动检测段位升级并设 `eloRankUp`
- `resetElo()` — 重置 ELO 为默认值（用于设置页“重置能力评分”）
- `clearEloRankUp()` — 关闭升段庆祝后清空 `eloRankUp`
- `syncEloFromAcademyAbility(aa)` — 从 strategy-academy abilityAssessment 同步初始 ELO，仅 `gamesPlayed===0` 时生效

训练模块维度映射：

| 模块 | hook | 维度 | 触发时机 |
|---|---|---|---|
| range-trainer | `useQuizEngine` 的 `recordEloForAnswer` | preflop | 答题后 / 超时 |
| pot-odds | `useOddsEloRecorder` | math | 答题后 |
| gto-simulator | `useGtoEloRecorder` | postflop | 决策提交后 |
| theory-academy | `TheoryQuiz` 直接调用 `updateElo` | 按章节 `eloDimension` 声明（五维之一） | 章末小测每题作答后 |

UI 组件：`Dashboard` 段位徽章按钮、`WeaknessAnalysis` 五维雷达图（数据源为 ELO 五维分数 0-3000）、`RankUpCelebration` 全屏升段 Dialog。

**SRS 间隔重复（SM-2 算法 / 每日混合比例）**

算法（`features/progress/utils/spacedRepetition.ts`，基于 SM-2）：
- `ReviewItemMetadata`：元数据接口（`front` / `back` / `options` / `source` / `scenario`，全部可选）
- `ReviewItem` 接口扩展：新增 `metadata?: ReviewItemMetadata`
- 核心函数：`processReview` / `getTodayReviewItems` / `getReviewStats` / `getDaysSinceLastReview`
- 训练模块记录器（答题后注册/更新复习项）：range-trainer `useQuizEngine.recordSrsForAnswer` / pot-odds `useOddsSrsRecorder` / gto-simulator `useGtoSrsRecorder`；题目 ID 规范 `range:{position}:{hand}` / `odds:{questionId}` / `gto:{scenarioId}`
- puzzle-trainer 不注册 SRS（2026-07-31 专批 C 定性，P1D-11）：题库短 id（如 `rfi-001`）仅为模块内部标识（全库唯一由 `data/puzzleBank.ids.test.ts` 守卫），不进入 SRS 键空间，无跨模块碰撞风险；若未来接入 SRS，在**注册处**拼接 `puzzle:{theme}:{questionId}` 作为 key，题库静态数据不改 id、存量 ReviewItem 零迁移
- QuickDrill 复习题回写闭环（专批 B，P1E-05）：快速训练混入的 `review-*` 复习题答完后，由 `strategy-academy/utils/quickDrillSrs.ts` 纯函数（`computeReviewWriteBacks`）按逐题作答明细（`PracticeResult.answers`，不入 persist）调用 `processReview` 推进 ReviewItem，再逐项 `updateReviewItem` 回写 progress store（quality 映射同下表；非 review-* 忽略，复习项已清理静默跳过）

Quality 评分映射：答对 + 用时 < 5 秒 → 5；答对 → 4；答错 → 1（自评"记得" → 5；"不记得" → 1）。

每日训练题目混合（`features/progress/utils/dailyTrainingMix.ts`）：

```typescript
composeDailyMix<T extends { id: string }>(
  newQuestions: T[],
  reviewItems: ReviewItem[],
  totalCount: number,
  userAccuracy: number
): DailyMixResult<T>
```

- 默认复习占比 30%（`DEFAULT_REVIEW_RATIO`）
- 正确率 < 0.6 → 50%（`LOW_ACCURACY_REVIEW_RATIO`）
- 正确率 < 0.4 → 70%（`VERY_LOW_ACCURACY_REVIEW_RATIO`）
- 今日复习队列为空 → 全部用新题

UI 组件：`SpacedRepetitionPanel`（主 CTA + 进度条 + 统计）、`ReviewSession`（Dialog-based，三种渲染模式：multiple-choice / self-eval / minimal）。

**Emotion 情绪管理（Tilt 识别 / Session 止损 / 下风期检测）**

类型定义（`features/progress/types.ts`）：`EmotionState` 接口含 `todayMood` / `moodDate` / `consecutiveWrongCount` / `dailyQuestionLimit` / `dailyQuestionsAnswered` / `dailyQuestionsDate` / `accuracyHistory` / `isDownswing` / `dailyCorrect` / `dailyTotal` 共 10 个字段。

Progress Store Actions：
- `setTodayMood(mood)` — 写入今日情绪
- `recordAnswer(isCorrect)` — 跨日重置 → 更新计数器 → 更新 consecutiveWrongCount → 更新 accuracyHistory（保留最近 7 天） → 自动调用 `checkDownswing`
- `checkDownswing()` — 取最近 3 天 accuracyHistory，严格递减则 `isDownswing = true`
- `setDailyQuestionLimit(limit)` / `resetDailyCounters()`

UI 组件：
- `TiltWarning.tsx` — 监听 `consecutiveWrongCount`，仅在"从 < 3 跨越到 >= 3"时弹出 Dialog 一次
- `SessionLimitGuard.tsx` — 每日题量上限守卫，导出 `useSessionLimitReached()` / `useSessionLimitStatus()` hook。`useSessionLimitReached` 采用**开局判定**口径（专批 B，P1D-06/P1F-01）：挂载时一次性快照额度并用 ref 冻结——开局已达上限拦在开始前，会话进行中额度耗尽不中途拦断（避免卸载进行中会话导致无结算丢弃）；调试解锁旁路保留响应式（激活期间不冻结快照）；调用点：puzzle 三模式 / QuickDrill / TheoryChapterView。`useSessionLimitStatus` 保持响应式（仅展示用）
- `DownswingAlert.tsx` — 仅当 `isDownswing === true` 时渲染，展示 3 天正确率下降趋势
- `MoodTracker.tsx` — 三档情绪按钮（Smile/Meh/Frown）+ 今日正确率 + 4 种情绪关联文案
- `SettingsPage.tsx` — "每日题量上限"设置（0 无限 / 50 / 100 / 200）

**Mentor 导师人格化（三种风格 / 文案模板）**

导师风格（`progress.mentorStyle`，类型定义于 `shared/types/mentor.ts`）：
- **严谨数学派**（`strict-math`）— GTO/EV 导向，数据驱动客观陈述
- **老派牌手**（`old-school`）— 经验导向，犀利直接指出问题
- **鼓励型教练**（`encouraging`）— 正向强化，关注进步

文案模板：模板存储在 `shared/constants/mentorStyles.ts`（`MENTOR_FEEDBACK_TEMPLATES`，三种风格 × 五个评级），由 `renderMentorFeedback(mentorStyle, grade, params, t)` 渲染——模板值改为 i18n key 引用，实际文案在 `zh.json` / `en.json` 的 `mentor.feedback.*` 下，由 `t` 函数解析后替换占位符；QuizCard / GTOFeedback 优先调用，模板缺省时降级到通用 i18n 文案；反馈颜色与图标不随风格变化（统一由 `GRADE_DISPLAY_CONFIG` 控制）。

---

## 6. 状态管理架构

### 6.1 Zustand Store 设计模式

每个 feature 模块拥有独立的 Zustand store，遵循以下模式：

```typescript
interface FeatureStore {
  // 状态字段
  state: FeatureState;
  // 同步 Actions
  doSomething: (param: string) => void;
  // 异步 Actions（如 IndexedDB）
  loadAsync: () => Promise<void>;
  // 计算属性（通过 get() 实现）
  getDerived: () => DerivedData;
}

export const useFeatureStore = create<FeatureStore>((set, get) => ({
  state: initialState,
  doSomething: (param) => set((s) => ({ state: { ...s.state, field: param } })),
  loadAsync: async () => { const data = await fetch(); set({ data }); },
  getDerived: () => computeFrom(get().state),
}));
```

### 6.2 persist 中间件使用

共 5 个 store 使用 persist 中间件持久化到 localStorage：progress（训练记录与跨模块状态中枢）、puzzle-trainer、strategy-academy、theory-academy、debugMode（调试解锁）；range-trainer / pot-odds / gto-simulator 为纯内存 store；hand-history 用 IndexedDB：

```typescript
persist(
  (set, get) => ({
    records: [],
    settings: { theme: 'dark', language: 'zh', ... },
    // ...
  }),
  { name: 'poker-training-progress', version: 8, migrate }  // localStorage key
)
```

### 6.3 跨模块通信方案

```
┌────────────────┐     emit      ┌─────────────────┐     subscribe     ┌──────────────┐
│ Range Trainer  │──────────────▶│                 │◀──────────────────│ Progress     │
│ Pot Odds       │──────────────▶│ trainingEvents  │                   │ Store        │
│ GTO Simulator  │──────────────▶│ (事件总线)       │──────────────────▶│ (自动写入)    │
│ Puzzle Trainer │──────────────▶│                 │                   │              │
│ Strategy Acad  │──────────────▶│                 │                   │              │
└────────────────┘               └─────────────────┘                   └──────────────┘
```

- **发布方**（v2.0 更新）：range-trainer / pot-odds / gto-simulator / puzzle-trainer / strategy-academy 五个模块在会话结束时创建 `TrainingRecord` 并 `emit`；theory-academy（2026-07）在章末小测完成时 emit；hand-history 为复盘工具，合理豁免
- **订阅方**：progress store 在模块加载时 `subscribe`，自动 `addRecord`（v2.0 新增 id 去重）

### 6.4 各 Store 数据结构

| Store | 状态 | 持久化 |
|-------|------|--------|
| `useRangeTrainerStore` | `learnState` + `quizState` + `presets` | 否（内存） |
| `usePotOddsStore` | `oddsState` + `evState` | 否（内存） |
| `useGTOSimulatorStore` | `config` + `session` + `feedback` + `lastResult` | 否（内存） |
| `useHandHistoryStore` | `hands[]` + `currentHand` + `replayState` + `filter` | IndexedDB |
| `useProgressStore` | `records[]` + `settings` + `onboarding` + `streak` + `elo` + `quickDrillStreak` + `mentorStyle` + `emotion` + `unlockedAchievements` + `achievementUnlockDates` + `freezeCardFragments` + `lastFragmentDate` + `fragmentsEarnedToday` | localStorage (persist v8) |
| `usePuzzleTrainerStore` | `rushBest` + `dailyBest` + `themeBest` + `dailyCompleted` + `quickDrillBest` + `history` | localStorage (persist v2) |
| `useStrategyAcademyStore` | `progress` + `practiceResults`（cap 200） + `basicsProgress` + `abilityAssessment` + `adaptiveConfig` + `recentPracticeResults` + `dailyPlan` + `certifications` + `activeTrackId` + `firstAttemptScores` + `lastAttemptScores` | localStorage (persist v2) |
| `useTheoryAcademyStore` | `progress`（completedChapters / quizScores / currentChapter / startedAt） | localStorage (persist v1) |
| `useDebugModeStore` | `unlockAll` | localStorage (persist v1) |

---

## 7. 路由与代码分割

### 7.1 React Router v7 配置

使用 `createBrowserRouter` 创建路由，支持嵌套布局和数据加载。

### 7.2 路由表

| 路径 | 组件 | 布局 |
|------|------|------|
| `/` | Dashboard | AppLayout |
| `/onboarding` | OnboardingFlow | **BlankLayout** |
| `/range-trainer` | RangeTrainerHome | AppLayout |
| `/range-trainer/learn` | RangeLearnPage | **BlankLayout** |
| `/range-trainer/quiz` | RangeQuizPage | **BlankLayout** |
| `/pot-odds` | PotOddsPage | AppLayout |
| `/pot-odds/quiz` | PotOddsQuizPage | **BlankLayout** |
| `/gto-simulator` | GTOSimulatorHome | AppLayout |
| `/gto-simulator/session/:scenarioId` | GTOSessionPage | **BlankLayout** |
| `/gto-simulator/result/:sessionId` | GTOResultPage | AppLayout |
| `/hand-history` | HandHistoryList | AppLayout |
| `/hand-history/import` | HandImportPage | AppLayout |
| `/hand-history/:handId` | HandReplayPage | **BlankLayout** |
| `/progress` | ProgressPage | AppLayout |
| `/progress/range` | RangeStatsPage | AppLayout |
| `/progress/gto` | GTOStatsPage | AppLayout |
| `/puzzle` | PuzzleHome | AppLayout |
| `/puzzle/rush` | PuzzleRush | AppLayout |
| `/puzzle/daily` | DailyPuzzle | AppLayout |
| `/puzzle/theme/:themeId` | ThemeDrill | AppLayout |
| `/academy` | AcademyHome | AppLayout |
| `/academy/basics` | BasicsIntro | AppLayout |
| `/academy/concept-graph` | ConceptGraphView | AppLayout |
| `/academy/tracks` | LearningTracksView | AppLayout |
| `/academy/quick-drill` | QuickDrill | AppLayout |
| `/academy/certification/:level` | LevelCertification | AppLayout |
| `/academy/lesson/:lessonId` | CourseView | AppLayout |
| `/theory` | TheoryHome | AppLayout |
| `/theory/chapter/:chapterId` | TheoryChapterView | AppLayout |
| `/leaderboard` | LeaderboardPage | AppLayout |
| `/settings` | SettingsPage | AppLayout |
| `/help` | HelpHome | AppLayout |
| `/help/article/:articleId` | HelpArticle | AppLayout |

### 7.3 React.lazy + Suspense 懒加载策略

所有页面组件均使用 `React.lazy(() => import(...))` 动态导入，包裹在 `LazyWrapper` 组件中：

```tsx
function LazyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      {children}
    </Suspense>
  );
}
```

- Vite 自动按路由边界生成独立的 chunk 文件
- `BlankLayout` 用于全屏训练/回放页面，无侧边栏干扰
- `AppLayout` 提供标准侧边栏 + 顶部标题 + 内容区

---

## 8. 性能策略

### 8.1 Web Worker（GTO 计算卸载）

`gtoWorker.ts` 在独立线程中运行，避免策略查找和 EV 计算阻塞 UI。Worker 内复制了 `calculateGrade` 五级评级阈值（`GRADE_BEST=0` / `GRADE_CORRECT=0.5` / `GRADE_INACCURACY=2` / `GRADE_WRONG=5`，与 `shared/types/decisionFeedback.ts` 一致），通过 `estimateEvLoss(diff, handStrength)` 确定性函数计算 EV 损失（无 `Math.random()`），替代原四级评级（optimal/minor_mistake/mistake/blunder）的伪造 EV 损失。当前唯一消费方为 hand-history 的 `utils/gtoDeviation.ts`（模块级单例 Worker + 消息 id 映射 + 10 秒超时降级 fallback）；原 `useGTOWorker.ts` hook 封装（健康检查 / 一次性重建）为零调用方死代码，已于 2026-07-31 专批 A 删除。

```typescript
// 主线程（gtoDeviation.ts）通过消息协议发送请求
worker.postMessage({ type: 'batchAnalyze', payload, id });

// Worker 接收并响应
self.onmessage = (e) => {
  switch (type) {
    case 'lookupStrategy': result = lookupStrategy(payload); break;
    case 'calculateEV': result = calculateEV(payload); break;
  }
  self.postMessage({ type, result, id });
};
```

- 带 10 秒超时保护
- Worker 不可用（构造抛错）时自动降级到主线程 fallback

**`batchAnalyze`消息类型**（v2.1 新增）：

除 `lookupStrategy`和 `calculateEV`外，Worker还支持 `batchAnalyze`消息类型，用于批量分析多个手牌策略：
```typescript
// 主线程（gtoDeviation.ts）发送批量分析请求
worker.postMessage({ type: 'batchAnalyze', payload: { hands }, id });
// Worker 返回批量结果
{ type: 'batchAnalyze', result: BatchAnalyzeResult[] }
```
- 输入参数：`payload.hands: BatchAnalyzeHand[]`（每项含 id/hand/position/board?/action/street/handStrength?）；输出结果为 `BatchAnalyzeResult[]`（每项含 id/gtoAction/evLoss/grade）
- 适用场景：手牌复盘模块的偏差检测（`hand-history/utils/gtoDeviation.ts`）一次性分析多决策点

### 8.2 React.memo + Zustand selector 精确订阅

```typescript
// 组件仅订阅所需字段，避免无关更新
const oddsState = usePotOddsStore((s) => s.oddsState);
const status = useRangeTrainerStore((s) => s.quizState.status);
```

Zustand v5 内置 selector 机制，仅当选中字段变化时触发组件重渲染。

### 8.3 路由级代码分割

每个路由页面为独立 chunk，首屏仅加载当前页面代码（路由清单以 `src/app/routes.tsx` 为准，Vite 自动按路由边界生成独立 JS chunk）。

**`manualChunks` 分包策略**（v2.1 新增）：

`vite.config.ts` 配置 `rollupOptions.output.manualChunks`（函数形式），对大型数据文件与 vendor 库独立分包，避免单个 chunk 体积过大：

```typescript
manualChunks(id) {
  // 大型数据文件独立分包
  if (id.includes('/strategy-academy/data/levels/')) {
    return id.match(/level[1-4]/) ? 'academy-levels-early' : 'academy-levels-late';
  }
  if (id.includes('/strategy-academy/data/')) return 'strategy-academy-data';
  if (id.includes('/puzzle-trainer/data/puzzleBank')) return 'puzzle-data';
  // Vendor 库分包
  if (id.includes('node_modules')) {
    if (id.includes('recharts') || id.includes('d3-')) return 'vendor-recharts';
    if (id.includes('framer-motion')) return 'vendor-framer';
    if (id.includes('react-dom')) return 'vendor-react-dom';
  }
}
```

- 主 chunk 从 1204 kB 降至约 291 kB，最大 vendor chunk（recharts）约 418 kB
- 课程/题库大数据文件独立 chunk，按需加载

### 8.4 IndexedDB 大容量存储

手牌历史数据量大（单条手牌含完整动作序列），使用 IndexedDB 而非 localStorage：
- 无 5MB 容量限制
- 支持异步批量读写
- 原生事务支持

---

## 9. 持久化策略

### 9.1 localStorage

| 存储 Key | 内容 | 来源 |
|-----------|------|------|
| `poker-training-progress` | 训练记录 + 用户设置 + Streak/ELO/SRS/Emotion/Mentor 跨模块状态 | Zustand persist（progress store） |
| `puzzle-trainer-store` | 谜题 Best Record / 每日完成态 / 历史记录 | Zustand persist（puzzle-trainer store） |
| `strategy-academy-progress` | 课程进度 / 能力评估 / 认证记录 | Zustand persist（strategy-academy store） |
| `theory-academy-progress` | 理论章节完成态 / 小测得分 | Zustand persist（theory-academy store） |
| `poker-debug-mode` | 调试解锁状态 | Zustand persist（debugMode store） |

> 语言切换通过顶部导航的 `i18n.changeLanguage` 实现（未接入 LanguageDetector，默认 zh）；用户语言偏好字段 `settings.language` 随 progress store 持久化。

### 9.2 IndexedDB

| 数据库 | 版本 | Object Store | keyPath | 内容 |
|--------|------|-------------|---------|------|
| `hand-history-db` | 1 | `hands` | `id` | 完整 HandHistory 对象 |

操作封装为 4 个函数：`dbGetAll`、`dbPut`、`dbDelete`、`dbClear`。v2.0 重构为 `getDB()` 单例模式（缓存已打开的数据库连接，避免重复 `openDB`），并新增 `classifyDBError` 错误分类与 `dbError` 状态字段。

### 9.3 Zustand persist 中间件配置

```typescript
persist(
  (set, get) => ({ /* store body */ }),
  {
    name: 'poker-training-progress',  // localStorage key
    // 默认使用 JSON.stringify/parse
    // 默认序列化全部状态
  }
)
```

### 9.4 Persist 版本历史

各持久化 store 通过 `version` 字段管理 schema 迁移，`migrate` 函数负责跨版本数据结构升级。

| Store | persist name | version | 关键字段 |
|---|---|---|---|
| progress | `poker-training-progress` | 以 `store.ts` persist 配置为唯一事实源 | records / settings / onboarding / streak / elo / quickDrillStreak / mentorStyle / emotion / unlockedAchievements / achievementUnlockDates / freezeCardFragments / lastFragmentDate / fragmentsEarnedToday |
| puzzle-trainer | `puzzle-trainer-store` | 以 `store.ts`persist 配置为唯一事实源 | rushBest / dailyBest / themeBest / quickDrillBest / dailyCompleted / history（上限 50 条）|
| strategy-academy | `strategy-academy-progress` | 以 `store.ts`persist 配置为唯一事实源 | progress（completedLessons / quizScores / currentLesson / startedAt / **completedUnits**）/ practiceResults（cap 200） / abilityAssessment / dailyPlan / certifications / firstAttemptScores / lastAttemptScores |
| theory-academy | `theory-academy-progress` | 以 `store.ts`persist 配置为唯一事实源 | progress（completedChapters / quizScores / currentChapter / startedAt） |
| debugMode | `poker-debug-mode` | 以 `store.ts`persist 配置为唯一事实源 | unlockAll |

> version 数值与字段清单以各 store.ts 实现为唯一事实源，本表仅作结构示意，不维护数值副本（避免漂移）。

> 自适应难度的连续答错计数使用 `emotion.consecutiveWrongCount`（v6 情绪系统字段，全局计数），不存在按模块拆分的计数字段。

---

### 9.5 游戏变体架构

#### 变体扩展统一模式

任意 feature 模块如需增加游戏变体支持（短牌/单挑/Max 等），应复用 `variants/` 子目录模式，遵循以下规范：

**1. 数据层结构**
- 在模块 data 目录下创建 `variants/` 子目录
- 每个变体对应一个 `<variant>.ts` 文件（如 theory-academy 的 `short-deck.ts` / `heads-up.ts`）
- 新增 `variants/index.ts` 汇总导出全部变体集合与辅助函数

**2. ID 命名规范**
- Level ID：`t{level}<suffix>`（标准系列无 suffix，短牌 suffix=`sd`，单挑 suffix=`hu`）
- Chapter ID：`t{level}<suffix>-<topic>`（如 `t1sd-概率基础` / `t1hu-位置意识`）
- **隔离原则**：变体系列 ID 必须与标准系列完全隔离，禁止混用

**3. 跨模块集成点**
- `progress/store.ts`：注册对该 variant 的成就判定函数入口（如有）
- `theory-progress.ts`：调用 `getTheoryLevelsByVariant(variant)` 获取对应进度
- 其他模块按实际需求注册该 variant 的数据消费点

**4. 完整性守卫**
- 变体目录内包含 `theoryIntegrity.test.ts`（或其他同名的 integrity test）
- 守护内容：ID 唯一性、前缀合规、小测合法性、实践推荐结构等

**5. 索引导出**
- `variants/index.ts` 必须导出：
  - `ALL_VARIANT_THEORY_LEVELS`：标准 + 所有变体的总索引数组
  - `getTheoryLevelsByVariant(variant: TheoryVariant): TheoryLevelInfo[]`：按 variant 过滤的查询函数

#### 最佳实践与反模式

✅ **推荐做法**：新变体 Level 添加时一次性完成数据创建 + index 汇总 + 跨模块集成点注册 + integrity 测试编写
❌ **反模式**：仅添加变体数据文件而未更新 variants/index.ts 或遗漏跨模块集成点

> 参考实现：theory-academy/data/levels/variants/（short-deck/heads-up 双变体系列，L7-L9 已深度集成至 progress 成就系统）。

**Persist 版本迁移记录**：

| 迁移 | 描述 |
|------|------|
| progress v1 → v6 | 历次防御性注入：v1 onboarding / v2 streak（补发 2 张冻结卡） / v3 elo / v4 quickDrill 字段 / v5 mentorStyle / v6 emotion |
| v6 → v7 | 成就系统迁移：注入 `unlockedAchievements: []` 和 `achievementUnlockDates: {}` 默认值 |
| v7 → v8 | 冻结卡碎片系统迁移：注入 `freezeCardFragments: 0`、`lastFragmentDate: ''`、`fragmentsEarnedToday: 0` 默认值 |
| puzzle-trainer v1 → v2 | 快速训练 Best Record：注入 `quickDrillBest: null` 默认值 |
| strategy-academy v0 → v1 | 进步回放得分记录迁移：注入 `firstAttemptScores: {}` 和 `lastAttemptScores: {}` 默认值 |
| strategy-academy v1 → v2 | practiceResults 裁剪：对超过 200 条的老数据执行 `.slice(-200)` 保留最近记录 |
| strategy-academy v2 → v3 | 认证系统升级：certifications 逐条注入 `cooldownPeriod: 24` 与 `lastAttemptAt` 默认值（validUntil 保持可选） |
| strategy-academy v3 → v4 | 小节完成状态持久化：防御性合并 progress（`{ ...initialProgress, ...progress, completedUnits: progress.completedUnits ?? {} }`），注入 `completedUnits: {}`，已有值不覆盖 |
| theory-academy v0 → v1 | 首版兜底：防御性合并 progress 默认值（新 store，无存量迁移负担） |

---

## 10. 安全与数据保护

### 10.1 纯前端架构的安全优势

- **零网络传输**：所有数据存储在浏览器本地，不经过任何服务器
- **无用户账户系统**：不涉及身份认证和敏感信息传输
- **无第三方 API 调用**：消除中间人攻击和数据泄露风险
- **CSP 友好**：静态部署可配置严格的内容安全策略

### 10.2 数据导出/导入机制

- 手牌历史支持通过 `HandImporter` 组件从文本导入
- 可解析 PokerStars / GGPoker 标准格式
- 支持手动录入（`site: 'manual'`）

### 10.3 数据版本迁移策略

- IndexedDB 使用 `DB_VERSION` 版本号控制
- `onupgradeneeded` 回调处理 schema 变更
- localStorage 通过 Zustand persist 的版本管理
- 未来可扩展 `migrate` 函数处理数据结构升级

---

## 11. 测试策略

### 11.1 测试双项目划分（Vitest）

`vitest.config.ts` 定义两个项目：`unit` 项目在 Node 环境运行 `src/**/*.test.ts`（纯函数 / store migrate，Node 环境测 zustand persist migrate 需 stub `window.localStorage`）；`component` 项目在 jsdom 环境运行 `src/**/*.test.tsx`（组件冒烟，setup 为 `src/setupTests.components.ts`）。

当前共 64 个测试文件（清单以 `src/**/*.test.ts(x)`实际文件为准）：

| 测试目标 | 文件 | 关键用例 |
|----------|------|----------|
| 全局守卫 | designTokenGuard.test.ts / eslintCrossImports.test.ts | UI 颜色合规全量扫描 / 跨模块导入白名单 |
| i18n | localeParity.test.ts | zh/en 键集对称性 |
| 共享层 | pokerMath / elo / deck / seededShuffle / decisionFeedback 各 .test.ts | 赔率与 EV 计算、ELO 变化与段位、牌组生成、种子洗牌、GRADE_THRESHOLDS 边界 |
| gto-simulator | strategyCompare.test.ts | 最优判定、EV 损失精度 |
| hand-history | parsers/common.test.ts | 牌面解析、三平台格式检测（含 partypoker） |
| range-trainer | handClassifier.test.ts | 169 种手牌分类 |
| pot-odds | quizOrder.test.ts | 选项排序与分布守卫 |
| progress | statsAggregator / streakCalc / store.migrate / store.persist-shape 各 .test.ts，StreakTracker.test.tsx | 聚合、连击、迁移链路、persist 形状、组件冒烟 |
| puzzle-trainer | puzzleBank.optionOrder.test.ts / store.migrate / store.persist-shape | 选项语义排序、迁移、persist 形状 |
| strategy-academy | curriculumIntegrity / quizShuffle / drillOptionOrder / opponentScoring / store.migrate / store.persist-shape 各 .test.ts，DrillLessonRouter.test.tsx | 课程数据完整性、选项洗牌、对手评分、Drill 路由冒烟 |
| theory-academy | theoryIntegrity / quizOrder / store.migrate / store.persist-shape 各 .test.ts | 理论数据完整性、选项重映射与分布守卫、v0→v1 迁移、persist 形状 |

### 11.2 组件测试（jsdom 冒烟）

当前已落地的组件测试（`component` 项目）：

- `StreakTracker.test.tsx` — 连击追踪展示与晚间提醒态冒烟
- `DrillLessonRouter.test.tsx` — Drill 懒加载路由接线冒烟

新增交互组件测试时按内容选择 `.test.tsx` 后缀并入 `component` 项目。

### 11.3 E2E 测试（规划中，未落地）

项目尚未引入 Playwright 等 E2E 框架。若后续引入，优先覆盖以下关键用户流程：

1. **范围训练流程**：首页 → 选择位置 → 开始测验 → 答题 → 查看结果
2. **GTO 训练流程**：配置场景 → 生成场景 → 提交决策 → 查看反馈 → 完成会话
3. **手牌导入流程**：粘贴文本 → 检测格式 → 导入 → 列表中可见 → 回放
4. **进度查看流程**：完成训练 → Dashboard 数据更新 → 图表渲染

---

## 12. 部署方案

### 12.1 静态构建输出

```bash
pnpm build    # tsc -b && vite build
```

输出到 `dist/` 目录：
- `index.html` — 入口
- `assets/` — JS chunks、CSS、字体
- 所有资源路径为绝对路径，可部署到任意静态服务器

### 12.2 PWA Service Worker 缓存策略

`public/sw.js` 实现离线缓存：
- `manifest.json` 声明 PWA 元数据（名称、图标、主题色）
- `display: standalone` 模式，安装后全屏运行
- 缓存版本号通过 SW 注册 URL 查询参数 `v` 传入（`APP_VERSION` 常量，由 `main.tsx` 在注册时动态注入），`activate` 事件自动清理旧版本缓存
- Service Worker 拦截请求，优先返回缓存资源

### 12.3 推荐部署平台

| 平台 | 优势 | 配置 |
|------|------|------|
| **Vercel** | 零配置部署、自动 HTTPS、边缘网络 | 直接连接 Git 仓库 |
| **Netlify** | 表单处理、分支预览、重定向规则 | `netlify.toml` 配置 SPA fallback |
| **Cloudflare Pages** | 全球 CDN、无限带宽、Workers 集成 | 连接 Git，构建命令 `pnpm build` |

所有平台均支持：
- 自动 HTTPS
- SPA fallback（`/* → /index.html`）
- 自定义域名
- CI/CD 自动部署

---

## 13. 扩展性设计

### 13.1 新功能模块添加流程

1. 在 `src/features/` 下创建新目录，遵循标准结构：
   ```
   new-module/
   ├── components/
   ├── hooks/
   ├── utils/
   ├── index.ts
   ├── store.ts
   └── types.ts
   ```

2. 在 `src/app/routes.tsx` 添加路由（lazy import）
3. 在 `src/layouts/AppLayout.tsx` 添加导航项
4. 如需跨模块通信，通过 `trainingEvents` 事件总线发布训练结果
5. Progress store 自动收集，无需额外修改

### 13.2 后端 API 集成预留

当前纯前端架构预留了以下扩展点：

- **数据同步层**：可在 store 的 `addRecord` / `addHands` 中插入 API 调用
- **认证模块**：可新增 `features/auth/` 模块，使用 OAuth/JWT
- **排行榜**：当前 `Leaderboard` 为本地数据，可扩展为在线排行
- **GTO Solver 数据**：当前 JSON 为简化数据，可接入真实 solver API
- **多人对战**：通过 WebSocket 实现实时多人训练

### 13.3 插件化训练模式设计

训练模块遵循统一接口：

```typescript
interface TrainingModule {
  moduleId: string;
  startSession: (config: unknown) => void;
  submitAnswer: (answer: unknown) => void;
  getResult: () => TrainingResult;
}
```

新增训练模块只需：
1. 实现上述接口
2. 训练结束时 `trainingEvents.emit(record)`
3. 在 progress 的统计聚合中自动识别新 `module` 标识

这使得未来可以轻松添加如 ICM 训练、手牌阅读器、位置意识训练等新模块。

---

## 14. 样式系统与主题

### 14.1 CSS 变量架构

项目采用 CSS Custom Properties 实现主题系统，所有颜色通过变量引用。全局样式定义在 `src/styles/globals.css`，结构为：

1. Google Fonts 字体引入
2. `@import "tailwindcss"` — Tailwind v4 入口
3. `:root` — 全局 CSS 变量定义
4. `@theme inline` — Tailwind v4 主题 token 映射
5. 全局基础样式（body / scrollbar / selection / focus 等）

变量命名规范：`--{类别}-{修饰符}`

| 类别 | 变量 | 色值 | 用途 |
|------|------|------|------|
| Felt（呢面） | --felt-deep | #0e1a14 | 页面背景（低光呢面） |
| | --felt | #15301f | 主表面（瓶绿） |
| | --felt-raised | #1d4029 | 抬升表面（hover） |
| Walnut（胡桃木） | --walnut | #241a10 | 侧边栏/面板背景 |
| | --walnut-raised | #3a2a18 | 面板抬升/hover |
| | --walnut-border | #4a3825 | 边框色 |
| Ivory（象牙白） | --ivory | #f3ebd9 | 主文字/牌面 |
| | --ivory-dim | #cabf9f | 次要文字 |
| | --ivory-muted | #8a8068 | 弱化文字 |
| Brass（黄铜金） | --brass | #c9a25e | 唯一强调色 |
| | --brass-bright | #e8c97e | 亮金（hover/active） |
| | --brass-deep | #a07d3d | 暗金（pressed） |
| 语义色 | --success / --success-bg | #7fb883 / rgba(127,184,131,0.12) | 正确反馈、盈利 |
| | --danger / --danger-bg | #c25a4c / rgba(194,90,76,0.12) | 错误反馈、亏损 |
| | --warning / --warning-bg | #c9a25e / rgba(201,162,94,0.14) | 警告提示 |
| | --info / --info-bg | #8ba59b / rgba(139,165,155,0.12) | 信息提示 |
| 装饰/徽章（v1.3.2） | --poker-gold | #d4a84b | 金牌成就徽章 |
| | --poker-bronze | #cd7f32 | 铜牌徽章（银=--ivory-dim、钻=--poker-frost） |
| | --poker-indigo / --poker-indigo-bright | #4a5a7a / #8ea4c4 | 石板靛（策略/进阶标签底 / 暗底文字亮阶） |
| | --poker-terra / --poker-terra-bright | #965a3e / #c98a63 | 陶土赭（心理/弱项标签底 / 暗底文字亮阶） |
| 花色 | --suit-heart / --suit-diamond | #d04545 | 红心/方块（深红） |
| | --suit-club / --suit-spade | #f3ebd9 | 梅花/黑桃（象牙白，深色背景可见） |

Token 别名（保持组件兼容）：
- `--background: var(--felt-deep)` — 页面背景
- `--surface: var(--felt)` — 卡片/面板表面
- `--surface-hover: var(--felt-raised)` — 悬停表面
- `--primary: var(--brass)` — 主色
- `--primary-hover: var(--brass-bright)` — 主色 hover
- `--primary-foreground: #1a1612` — 主色按钮上的文字
- `--secondary: var(--info)` — 辅助色
- `--text-primary / --text-secondary / --text-muted` — 文字层级
- `--radius: 0.5rem` — 基础圆角

### 14.2 字体配置

通过 Google Fonts CDN 引入三套字体：

| 变量 | 字体 | 用途 |
|------|------|------|
| --font-display | Fraunces (serif) | 标题、品牌名、英雄数字 |
| --font-body | Inter Tight (sans-serif) | 正文、UI 文字 |
| --font-mono | JetBrains Mono (monospace) | 赔率/筹码/数字数据 |

字体类：
- `.font-display` — Fraunces + optical sizing + variation settings
- `.font-numeric` — JetBrains Mono + tabular-nums（等宽数字）

### 14.3 Tailwind v4 集成

通过 `@theme inline` 块将 CSS 变量映射为 Tailwind 语义 token，shadcn/ui 组件自动继承主题：

| Tailwind token | 映射值 | 对应工具类示例 |
|------|------|------|
| --color-background | var(--felt-deep) | bg-background |
| --color-foreground | var(--ivory) | text-foreground |
| --color-card | var(--felt) | bg-card |
| --color-primary | var(--brass) | bg-primary, text-primary |
| --color-primary-foreground | #1a1612 | text-primary-foreground |
| --color-secondary | var(--info) | bg-secondary |
| --color-muted | var(--walnut-raised) | bg-muted |
| --color-muted-foreground | var(--ivory-muted) | text-muted-foreground |
| --color-accent | var(--walnut-raised) | bg-accent |
| --color-destructive | var(--danger) | bg-destructive |
| --color-border | var(--walnut-border) | border-border |
| --color-ring | var(--brass) | ring-ring |
| --color-success | var(--success) | text-success, bg-success |
| --color-danger | var(--danger) | text-danger |
| --color-warning | var(--warning) | text-warning |
| --color-info | var(--info) | text-info |

Tailwind v4 还将 `--font-sans` / `--font-mono` 转为 `font-sans` / `font-mono` 工具类。

### 14.4 使用约定

| 场景 | 使用变量/类 |
|------|------|
| 页面背景 | bg-background 或 var(--felt-deep) |
| 卡片/面板 | bg-card 或 var(--felt) |
| 悬停状态 | var(--felt-raised) 或 var(--walnut-raised) |
| 主文字 | text-foreground 或 var(--ivory) |
| 次要文字 | text-muted-foreground 或 var(--ivory-dim) |
| 强调/激活 | var(--brass)，仅作发丝线和激活指示器 |
| 边框 | border-border 或 var(--walnut-border) |
| 成功/正确 | text-success 或 var(--success) |
| 错误/亏损 | text-danger 或 var(--danger) |
| 警告 | text-warning 或 var(--warning) |
| 信息 | text-info 或 var(--info) |
| 侧边栏背景 | .walnut-panel 或 var(--walnut) |

设计约束：
- Brass 仅用作 1px 发丝线和激活状态，不作为按钮或大表面的填充色
- 语义色始终使用固定色值，不引用装饰色变量（--gold/--clay/--sage）
- **答题选项按钮**（range-trainer QuizCard 等三选一场景）为平权选项，须三色相并立且都明显浮于呢面背景：fold=陶土红透底+红字+红边、call=胡桃木不透明实色 `--walnut-raised`+象牙字、raise=黄铜渐变；不套用「一亮 CTA + 两沉底次要」的 CTA 色阶（会导致暗按钮糊在一起、区分度不足）

### 14.5 组件主题适配

- shadcn/ui 组件通过 @theme inline 自动继承牌室主题
- 扑克牌组件（Card.tsx）使用纸质纹理渐变 + 金色高亮发光
- 侧边栏使用 `.walnut-panel` 类实现木纹质感
- `.brass-rail` 类提供面板顶部金色发丝线
- `.felt-ambient` 类提供微妙的呢面环境光

### 14.6 动画规范

- 统一使用 framer-motion 实现页面过渡和交互动画
- 标准时长：快速 150ms、常规 250ms、慢速 400ms
- 缓动函数：ease（默认）
- 翻牌动画：CSS 3D transform + perspective，300ms
- 支持 `prefers-reduced-motion` 媒体查询，尊重用户减少动画偏好

### 14.7 UI 颜色实现规范与守卫（v1.3.2）

设计契约权威源为 `poker-ui-demo/DESIGN_LANGUAGE.md`（v1.3.2）；色彩 token 实现权威为 `src/styles/globals.css` 的 `:root`。二者之外的 `poker-ui-demo/colors_and_type.css` 为 demo 单页镜像，三者任一变更须同步。

强制规范（DESIGN_LANGUAGE §1.2 三不原则 / §1.3 反 SaaS 饱和色禁令）：

1. **禁止 Tailwind 霓虹调色板类**：`(bg|text|border|from|to|ring)-(red|green|blue|yellow|purple|...)-\d{2,3}`，语义反馈一律用 `--poker-*` / `--success|danger|warning|info` token（映射：green/emerald→success、red→danger、yellow/amber→brass、orange→terra、blue→info、purple→indigo）
2. **禁止纯白/纯黑文字与实底类**：`text-white`/`bg-white`/`text-black`/`bg-black`（`bg-black/NN` 半透明压暗层按 §4.2 阴影黑调豁免）
3. **禁止纯黑/纯白 hex 字面量**：`#000`/`#fff` 系
4. **SVG 例外**：渐变 stop 无法引用 CSS 变量时允许字面值，但必须注释标注对应 token（如 CardBack.tsx / public/cards/back.svg 的胡桃底 stop）

守卫机制：`src/designTokenGuard.test.ts`（vitest，随 `pnpm test` 强制执行）通过 `import.meta.glob('?raw')` 全量扫描 src 源码，断言上述三类零匹配；豁免白名单 `EXEMPT_FILES` 遵循「只删不加」，新增豁免须先在 DESIGN_LANGUAGE.md 登记设计依据。

---

## 15. 设计决策记录

### 15.1 为什么选择经典牌桌风格？

- 目标用户是德州扑克玩家，牌桌氛围能增强沉浸感和使用意愿
- 深色主题减少长时间训练的视觉疲劳
- 绿色背景与扑克牌形成自然对比，提升可读性

### 15.2 为什么使用 Fraunces 作为标题字体？

- 衬线体增强品牌辨识度和专业感
- Fraunces 是 Google Fonts 中品质优秀的现代衬线体
- 与 Inter Tight（无衬线正文）形成清晰的视觉层级

### 15.3 为什么黄铜金作为强调色而非翡翠绿？

- 黄铜金在深绿背景上对比度更高（符合 WCAG AA）
- 金色传递“价值”和“奖励”的心理暗示，适合训练平台
- 与牌桌绿色形成经典的“赌场”配色组合

### 15.4 CSS 变量 vs Tailwind 任意值？

- 使用 CSS 变量保持语义化和主题一致性
- 通过 Tailwind v4 的 `@theme inline` 将 CSS 变量映射为语义 token（如 bg-card、text-foreground）
- 组件直接使用 Tailwind 语义类，无需 `bg-[var(--xxx)]` 任意值写法
