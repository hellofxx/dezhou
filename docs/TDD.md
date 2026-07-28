# 德州扑克训练平台 — 技术设计文档 (TDD)

| 字段 | 内容 |
|------|------|
| 文档版本 | v2.2 |
| 作者 | 开发团队 |
| 最后更新 | 2026-07-28 |
| 状态 | v2.2 文档同步更新（审计修复：IndexedDB 单例、persist v2、Worker 健康检查、trainingEvents 合规、测试覆盖扩展） |

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
│  │              Feature Modules (8 个)                  │     │
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
│  │  │ Academy (新增) │ │ (新增)         │              │     │
│  │  └───────────────┘ └────────────────┘              │     │
│  │  ┌──────────────────────┐                          │     │
│  │  │ Onboarding (新增)     │                          │     │
│  │  └──────────────────────┘                          │     │
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
| pnpm | ^11.12.0 | 快速、磁盘友好的包管理器 |

---

## 3. 项目结构

```
src/
├── app/                          # 应用层
│   ├── pages/placeholder.tsx     # 占位页面
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
│   │   ├── components/           # UI 组件（10个）
│   │   ├── hooks/                # 回放 hook
│   │   ├── parsers/              # 多格式解析器
│   │   │   ├── common.ts         # 公共解析工具
│   │   │   ├── gg-poker.ts       # GGPoker 格式
│   │   │   └── pokerstars.ts     # PokerStars 格式
│   │   ├── utils/                # 手牌标记工具
│   │   ├── index.ts
│   │   ├── store.ts              # IndexedDB 持久化 store
│   │   └── types.ts
│   │
│   └── progress/                 # 进度追踪模块
│       ├── components/           # UI 组件（含 AchievementWall / ProgressReplay 等）
│       ├── data/
│       │   └── achievements.ts   # 成就定义数据（22 个成就）
│       ├── hooks/                # 统计 hooks
│       ├── utils/                # 聚合/连击计算
│       │   ├── statsAggregator.ts
│       │   └── streakCalc.ts
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
│   │   ├── data/                  # 题库（3 个）
│   │   ├── hooks/                 # usePuzzleEngine
│   │   ├── utils/                 # dateSeed
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
│
├── shared/                       # 共享层
│   ├── components/               # 通用组件
│   │   ├── ui/                   # shadcn/ui 基础组件（9个：button/card/dialog/input/progress/select/tabs/toast/tooltip）
│   │   ├── Card.tsx              # 扑克牌组件
│   │   ├── CardBack.tsx          # 牌背
│   │   ├── CardSVG.tsx           # SVG 牌面
│   │   ├── Chip.tsx              # 筹码
│   │   ├── EmptyState.tsx        # 空状态组件
│   │   ├── ErrorBoundary.tsx     # 错误边界
│   │   ├── GameVariantSelector.tsx  # 游戏变体选择器
│   │   ├── HandDisplay.tsx       # 手牌展示
│   │   ├── LoadingState.tsx      # 加载骨架屏
│   │   ├── PositionBadge.tsx     # 位置徽章
│   │   ├── ResultSummary.tsx     # 训练结果摘要
│   │   └── SuitIcon.tsx          # 花色图标
│   ├── constants/
│   │   ├── app.ts                # 应用常量
│   │   ├── mentorStyles.ts       # 导师文案模板（MENTOR_FEEDBACK_TEMPLATES / renderMentorFeedback）
│   │   └── poker.ts              # 扑克常量（花色/牌面/总数）
│   ├── hooks/                    # 共享 hooks
│   ├── stores/
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
│       ├── pokerMath.ts          # 扑克数学计算
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
├── workers/                      # Web Worker
│   ├── gtoWorker.ts              # GTO 策略计算 Worker
│   └── useGTOWorker.ts           # Worker Hook 封装
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
| `workers/` | Web Worker 及其 React Hook 封装 |
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
// - GRADE_DISPLAY_CONFIG：五级显示配置（颜色 / 图标 / i18n titleKey）
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
  module: 'range-trainer' | 'pot-odds' | 'gto-simulator' | 'strategy-academy' | 'puzzle-trainer';
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
  site: 'pokerstars' | 'ggpoker' | 'manual';
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
| constants | constants.ts | `PRESET_RANGES` 预设范围数据 |

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
| hooks | useOddsCalculation, useEquityEstimate | 计算逻辑封装 |
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
| components | HandHistoryList, HandReplayer, AnnotationPanel 等 10 个 | 列表、回放、标注 UI |
| hooks | useHandReplay | 回放控制 hook |
| parsers | common.ts, pokerstars.ts, gg-poker.ts | 多格式解析器 |
| store | store.ts | IndexedDB 持久化（getDB 单例） + 回放状态 + dbError 错误状态 |

**关键算法**：

1. **多格式解析器架构（策略模式）**：
   ```
   用户粘贴文本 → detectFormat(text) → 路由到对应 parser
                    │
                    ├─ PokerStars parser
                    ├─ GGPoker parser
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
| components | Dashboard, ProgressPage, AccuracyChart, AchievementBadges 等 13 个 | 仪表盘、图表、成就 |
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

   **emit 合规状态**（v2.0 更新）：range-trainer / gto-simulator / strategy-academy / pot-odds / puzzle-trainer 均已合规 emit；hand-history 经评估为复盘分析工具（非交互式训练），标注为合理豁免。

   **addRecord 去重**（v2.0 新增）：`addRecord` 内部检查 `state.records.some(r => r.id === record.id)`，相同 id 的记录不重复添加，防止事件总线重复 emit 导致训练记录膨胀。

2. **统计聚合算法** (`statsAggregator.ts`)：
   - `aggregateStats(records)` → 总会话数、总题数、总正确率、平均用时、连续天数
   - `aggregateByDay(records, days)` → 按日聚合（图表用）
   - `aggregateByModule(records)` → 按模块聚合
   - `getWeakHands(records, module)` → 找出答错最多的手牌

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
   - `shouldDownshiftDifficulty(moduleType: ModuleType): boolean` 定义于 progress store
   - 判定逻辑：连续答错 ≥3 次返回 true，否则 false
   - 调用方（range-trainer / pot-odds / gto-simulator / puzzle-trainer / strategy-academy）根据返回值显示降级提示 banner，或自动降级难度（QuickDrill 不低于 beginner）
   - 数据源：progress store 持有的 `consecutiveWrongByModule: Record<ModuleType, number>`
   - 该 API 是自适应难度的**唯一入口**，禁止各模块自行判定

6. **`recordTrainingDay()` / `recordQuickDrillCompletion()` / `markDailyCompleted()` 幂等性**：
   - 同一日重复调用不重复计数
   - 实现方式：内部检查 `lastTrainingDate === today` 或 `dailyCompleted[dateKey] === true`

7. **成就系统**（v2.1 新增）：
   - 共 22 个成就，分 4 个类别：学习（Learning）/ 连续（Streak）/ 技能（Skill）/ 里程碑（Milestone）
   - 每个成就 4 个等级：bronze / silver / gold / diamond
   - 成就定义数据存储在 `progress/data/achievements.ts`
   - `AchievementWall` 组件展示成就墙，已解锁成就高亮，未解锁显示解锁条件
   - Store 字段：`unlockedAchievements: string[]`、`achievementUnlockDates: Record<string, number>`

8. **冻结卡碎片系统**（v2.1 新增）：
   - `freezeCardFragments: number` 记录当前碎片数量，5 片碎片可合成 1 张冻结卡
   - 碎片掉落概率：训练模式 30%、速训模式 20%
   - `lastFragmentDate: string` 记录上次掉落日期，`fragmentsEarnedToday: number` 记录今日已获碎片数
   - 合成时调用 `synthesizeFreezeCard()` 扣减 5 碎片、增加 1 张冻结卡

9. **进步回放**（v2.1 新增）：
   - `ProgressReplay` 组件对比用户首次尝试与最近一次的表现（`firstAttemptScores` / `lastAttemptScores`）
   - 展示各维度进步幅度，可视化成长轨迹

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

2. **OnboardingGate 守卫**：`OnboardingGate` 包裹 `AppLayout` 的 `<Outlet />`，读取 `progress.onboarding` 状态，未完成时重定向到 `/onboarding`，确保新用户必经引导流程。

3. **定位测试**：5 道题覆盖 handRanking / position / odds / range 四个维度，根据答题结果推断用户初始能力等级。

4. **首次微训练**：最后一题强制从简单题库抽取，答错时追加补救题，确保首胜体验；首胜庆祝调用 `recordTrainingDay` 启动 Day 1 Streak。

5. **状态持久化**：`progress.onboarding: OnboardingState` 记录完成状态与定位结果，通过 persist 持久化，避免重复引导。

### 5.7 Puzzle Trainer（扑克谜题）

**模块职责**：提供 Puzzle Rush / Daily Puzzle / Theme Drill 三种谜题模式，通过限时挑战、每日题目、主题专练增强决策直觉。

**内部结构**：
| 层 | 文件 | 职责 |
|----|------|------|
| components | 6 个组件 | PuzzleHome / PuzzleCard / PuzzleResult 等 |
| data | 3 个题库 | rushPuzzles / dailyPuzzles / themePuzzles |
| hooks | usePuzzleEngine | 统一管理三种模式的题目流 / 计时 / 命 / 连对奖励 |
| utils | dateSeed | 日期种子算法（Mulberry32 + Fisher–Yates） |
| store | store.ts | persist v2 持久化（rushBest / dailyBest / themeBest / dailyCompleted） |
| types.ts | 类型定义 | PuzzleTheme / PuzzleResult / PuzzleBestRecord 等 |

**三种模式**：

| 模式 | 路由 | 时长/题量 | 结束条件 |
|------|------|----------|---------|
| Puzzle Rush | `/puzzle/rush?duration=3\|5` | 3 或 5 分钟 | 3 条命耗尽或时间到 |
| Daily Puzzle | `/puzzle/daily` | 8 题（日期种子） | 全部答完 |
| Theme Drill | `/puzzle/theme/:themeId` | 单主题 15 题 | 全部答完 |

**关键算法**：

1. **日期种子算法**（`utils/dateSeed.ts`）：
   - `getDateSeed(date)` — 将 `Date` 转为 YYYYMMDD 数字（例：2026-07-25 → 20260725）
   - `seededRandom(seed)` — 基于 **Mulberry32** 算法的伪随机数生成器，同一种子始终产生相同序列
   - `pickBySeed<T>(arr, count, seed)` / `shuffleBySeed<T>(arr, seed)` — 基于种子的 Fisher–Yates 洗牌
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

8. **课程联动反馈**（v2.1 新增）：
   - `usePuzzleEngine` 新增 `inferPuzzleLessonId(theme)` 工具函数，将 10 个主题映射到课程 ID（如 `preflop-rfi` → `l2-rfi-basics`）
   - `PuzzleAnswerRecord` 类型新增 `relatedLessonId?: string` 字段
   - `PuzzleCard` 在 wrong/blunder 级别显示"去复习"链接，跳转对应课程

9. **trainingEvents.emit 合规**（v2.0 新增）：
   - `PuzzleRush` / `DailyPuzzle` / `ThemeDrill` 三种模式完成后均调用 `trainingEvents.emit(record)`，progress store 自动收集训练记录
   - emit 的 `record.module` 为 `'puzzle-trainer'`

10. **自适应难度接入**（v2.0 新增）：
    - 三种模式（Rush / Daily / ThemeDrill）均调用 `progress.shouldDownshiftDifficulty('puzzle-trainer')` 检查是否需要降级
    - 连续答错 ≥3 次时显示降级提示 banner（i18n key: `puzzle.common.downshiftHint`）

### 5.8 Strategy Academy（策略学院）

**模块职责**：提供结构化课程、知识图谱、学习路径、实践 Drill 与等级认证，构建从零基础到进阶的系统学习体系。

**内部结构**：
| 层 | 文件 | 职责 |
|----|------|------|
| components | 课程组件 + drills/ | AcademyHome / BasicsIntro / CourseView / ConceptGraphView / LevelCard / PracticeDrill + 4 个 Drill + ChoiceDrillRenderer.tsx |
| data | courses.ts / learningTracks / levels/ / localLessons/ / opponentProfiles | 课程数据（courses.ts 现为 re-export 兼容层）、学习路径、分级课程数据、本地课程、对手形象 |
| hooks | useAcademy | 学院进度 hook |
| utils | courseProgress | 进度计算工具 |
| store | store.ts | Zustand store（含 abilityAssessment） |
| types.ts | 类型定义 | Course / Lesson / LearningTrack / OpponentProfile 等 |

**关键设计**：

1. **课程结构**：课程数据原存储在 `courses.ts`，现已拆分到 `data/levels/` 目录（`index.ts` + `level1.ts` ~ `level8.ts`，其中 level4 拆为 `level4a.ts` / `level4b.ts`），`courses.ts` 保留为 re-export 兼容层。每级包含多个课时（lesson）；lesson 类型包括理论课、Drill 实践课、概念课。`CourseView` 采用三段式视图（概念讲解 → 交互练习 → 总结回顾）。

   **L4 拆分说明**：原 Level 4（GTO 与博弈论基础）内容过多，拆分为：
   - **L4A（范围与EV思维）**：覆盖翻前范围构造、EV 计算与应用
   - **L4B（GTO与博弈论）**：覆盖 Nash 均衡、MDF、最小防御频率等博弈论概念

2. **基础 Drill 集合**（`components/drills/`）：
   | Drill | 题量 | 覆盖维度 |
   |------|------|--------|
   | HandRankingDrill | 10 题 | 牌型识别 |
   | PositionDrill | 8 题 | 位置意识 |
   | OutsDrill | 8 题 | 听牌计数 |
   | PotOddsDrill | 6 题 | 赔率计算 |

   统一 `DrillProps` 接口：`onComplete(result)` / `onExit()`，复用现有 CardSVG / HandDisplay 组件。

   **ChoiceDrillRenderer 通用组件**（`components/drills/ChoiceDrillRenderer.tsx`）：通用选择题 Drill 渲染器，接受题库数据与配置参数，支持自定义题目数量、随机抽取、五级反馈接入，L2-L8 每级新增的 2 个 Drill 均通过此组件渲染。

   **DrillComponentName 类型**：`'HandRankingDrill' | 'PositionDrill' | 'OutsDrill' | 'PotOddsDrill' | 'ChoiceDrill'`（共 5 个值），其中 `'ChoiceDrill'` 对应 ChoiceDrillRenderer 通用渲染器。

3. **学习路径**（`learningTracks.ts`）：零基础快速入门 track 按顺序插入基础 Drill，引导新手完成入门训练。

   **学习路径横向推荐**：每个 LearningTrack 新增 `relatedTrackIds?: string[]` 字段，完成当前课程路径后推荐关联路径，形成学习网络。

   **前置条件**：`LevelInfo` 类型新增 `id?: string` 和 `prerequisiteLevelIds?: string[]` 字段，支持跨等级解锁规则：
   - L7（高级策略）需完成 L3 + L5
   - L8（综合实战）需完成 L4B
   - 本土低级别盈利路径需完成 L1-L3

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
   - **例外**：`mental-tilt-recognition` 课程无前置依赖，跳过 prerequisite 检查（情绪管理可随时访问）
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

### 5.9 跨模块系统设计

> 本节汇总 Streak / ELO / SRS / Emotion / Mentor 五大跨模块系统，以及 v2.1 新增的反馈闭环 / 位置渐进解锁 / 自适应难度三大系统的技术设计。这些系统横切多个 feature 模块，状态统一收敛在 `progress` store，通过 persist 持久化。

**反馈闭环系统**（v2.1 新增）

正向反馈（训练→课程）：
- 所有训练模块（range-trainer / pot-odds / gto-simulator / puzzle-trainer）的答题反馈必须携带 `relatedLessonId`（v2.0 确认 pot-odds 已合规）
- 工具函数：
  - `inferRelatedLessonId(position, actionType)` — range-trainer 用
  - GTO `GTOSessionPage` 根据 `scenario.street` 推导：preflop→`l4-gto-basics`, flop→`l3-cbet`, turn/river→`l3-multistreet`
  - `inferPuzzleLessonId(theme)` — puzzle-trainer 用，10 主题映射到课程 ID
- 渲染：`QuizCard` / `GTOFeedback` / `PuzzleCard` 在 wrong/blunder 级别显示"去复习"链接

反向反馈（数据→难度）：
- `progress.shouldDownshiftDifficulty(moduleType): boolean` 是自适应难度的**唯一入口**
- 数据源：`consecutiveWrongByModule: Record<ModuleType, number>`
- 调用方：所有训练模块的会话页面（range-trainer / pot-odds / gto-simulator / puzzle-trainer / strategy-academy）（v2.0 确认 puzzle-trainer 已接入）
- 行为：连续答错 ≥3 次显示降级提示 banner；QuickDrill 自动降级难度（不低于 beginner）

**位置渐进解锁系统**（v2.1 新增）

- 常量 `POSITION_UNLOCK_THRESHOLDS: Partial<Record<Position, number>>` 定义于 `range-trainer/constants.ts`
- 阈值表：UTG=0 / HJ=800 / CO=1000 / BTN=1200 / SB=1500 / BB=1800
- 工具函数 `isPositionUnlocked(position, preflopElo): boolean`：
  - 未配置阈值的位置（如 MP/UTG1）默认解锁（返回 true）
  - 已配置阈值的位置：`preflopElo >= threshold` 时解锁
- 调用方：`RangeSelector` 组件渲染时过滤锁定位置，悬停提示解锁所需 ELO
- 阈值变更规则：调整阈值时必须同步更新 `docs/CHANGELOG.md`，并在 `range-trainer-dev.md` 子代理文件中记录

**Streak 系统（连击与冻结卡）**

状态字段（`progress.streak: StreakState`）：`currentStreak` / `longestStreak` / `lastTrainingDate`(YYYY-MM-DD) / `streakFreezes` / `streakFreezeUsedToday` / `milestones` / `lastMilestoneCelebrated` / `streakStartDate` / `streakBrokenAt`。

核心机制：
- **冻结卡扣减**：`gap = 2` 天且 `streakFreezes > 0` 且今日未用时，自动扣减 1 张，streak 继续 +1（同一天仅生效一次）；新用户初始赠送 2 张
- **里程碑奖励**：达成 3 / 7 / 30 / 100 / 365 天分别奖励 1 / 2 / 3 / 5 / 10 张冻结卡
- **Earn Back 机制**：streak 断裂时记录 `streakBrokenAt`，24 小时内完成训练可恢复
- **提醒动效**：`StreakTracker` 在 20:00 后未训练时火焰变红闪烁
- **庆典与分享**：`StreakCelebration.tsx` 全屏 Dialog（CSS keyframes 彩屑 / 烟花 / 光晕）；30 天及以上显示"分享"按钮，调用 `generateStreakShareCanvas` 生成 1080×1080 PNG

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

训练模块维度映射：

| 模块 | hook | 维度 | 触发时机 |
|---|---|---|---|
| range-trainer | `useQuizEngine` 的 `recordEloForAnswer` | preflop | 答题后 / 超时 |
| pot-odds | `useOddsEloRecorder` | math | 答题后 |
| gto-simulator | `useGtoEloRecorder` | postflop | 决策提交后 |

UI 组件：`Dashboard` 段位徽章按钮、`WeaknessAnalysis` 五维雷达图（数据源为 ELO 五维分数 0-3000）、`RankUpCelebration` 全屏升段 Dialog。

**SRS 间隔重复（SM-2 算法 / 每日混合比例）**

算法（`features/progress/utils/spacedRepetition.ts`，基于 SM-2）：
- `ReviewItemMetadata`：元数据接口（`front` / `back` / `options` / `source` / `scenario`，全部可选）
- `ReviewItem` 接口扩展：新增 `metadata?: ReviewItemMetadata`
- 核心函数：`processReview` / `getTodayReviewItems` / `getReviewStats` / `getDaysSinceLastReview`

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
- `SessionLimitGuard.tsx` — 每日题量上限守卫，导出 `useSessionLimitReached()` / `useSessionLimitStatus()` hook
- `DownswingAlert.tsx` — 仅当 `isDownswing === true` 时渲染，展示 3 天正确率下降趋势
- `MoodTracker.tsx` — 三档情绪按钮（Smile/Meh/Frown）+ 今日正确率 + 4 种情绪关联文案
- `SettingsPage.tsx` — "每日题量上限"设置（0 无限 / 50 / 100 / 200）

**Mentor 导师人格化（三种风格 / 文案模板）**

导师风格（`progress.mentorStyle`）：
- **严厉教练**（Strict）— 直接指出错误，强调纪律性
- **鼓励伙伴**（Encouraging）— 正向强化，关注进步
- **冷静分析师**（Analytical）— 数据驱动，客观陈述

文案模板：各训练模块的 `DecisionFeedback.explanation` 根据当前 `mentorStyle` 选择对应文案模板；Streak 里程碑庆典、ELO 升段庆祝等场景同样按风格差异化渲染；模板存储在 i18n 资源中（`mentor.*` 命名空间），zh / en 双语齐全。

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

仅 `progress` store 使用 persist 中间件，将训练记录和用户设置持久化到 localStorage：

```typescript
persist(
  (set, get) => ({
    records: [],
    settings: { theme: 'dark', language: 'zh', ... },
    // ...
  }),
  { name: 'poker-training-progress' }  // localStorage key
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

- **发布方**（v2.0 更新）：range-trainer / pot-odds / gto-simulator / puzzle-trainer / strategy-academy 五个模块在会话结束时创建 `TrainingRecord` 并 `emit`；hand-history 为复盘工具，合理豁免
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
| `/range-trainer/result/:sessionId` | SessionResultPage | AppLayout |
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
| `/daily-challenge` | DailyChallengePage | AppLayout |
| `/leaderboard` | LeaderboardPage | AppLayout |
| `/settings` | SettingsPage | AppLayout |

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

`gtoWorker.ts` 在独立线程中运行，避免策略查找和 EV 计算阻塞 UI：

```typescript
// 主线程通过 useGTOWorker hook 发送消息
const { lookupStrategy, calculateEV } = useGTOWorker();
const result = await lookupStrategy('AKs', 'BTN');

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
- Worker 不可用时自动降级到主线程计算（`computeFallback`）

**健康检查与一次性重建**（v2.0 新增）：

`useGTOWorker` hook 新增 Worker 生命周期管理：
- **`onerror` 监听**：Worker 脚本报错时立即标记为 dead，后续调用直接使用 fallback
- **10 秒超时降级**：请求发送后 10 秒未收到响应，标记 Worker 为 dead
- **一次性重建**（`rebuildWorker`）：超时后尝试重新创建 Worker 实例（通过 `rebuildAttemptedRef` 保证仅尝试一次）；重建成功则后续请求使用新 Worker，重建失败则永久使用 fallback
- 设计目标：避免 Worker 静默死亡导致全部请求超时，同时防止无限重建循环

**`batchAnalyze` 消息类型**（v2.1 新增）：

除 `lookupStrategy` 和 `calculateEV` 外，Worker 还支持 `batchAnalyze` 消息类型，用于批量分析多个手牌策略：
```typescript
// 主线程发送批量分析请求
worker.postMessage({ type: 'batchAnalyze', payload: { hands: string[], gameType: string }, id });
// Worker 返回批量结果
{ type: 'batchAnalyze', result: Record<string, HandStrategy>, id }
```
- 适用场景：范围训练测验模式需一次性获取多手牌策略时，减少主线程与 Worker 的消息往返次数
- 内部对每手牌分别调用 `lookupStrategy`，汇总后一次性返回

### 8.2 React.memo + Zustand selector 精确订阅

```typescript
// 组件仅订阅所需字段，避免无关更新
const oddsState = usePotOddsStore((s) => s.oddsState);
const status = useRangeTrainerStore((s) => s.quizState.status);
```

Zustand v5 内置 selector 机制，仅当选中字段变化时触发组件重渲染。

### 8.3 路由级代码分割

每个路由页面为独立 chunk，首屏仅加载当前页面代码。31 个路由页面被分割为 31 个独立 JS chunk。

**`manualChunks` 分包策略**（v2.1 新增）：

`vite.config.ts` 配置 `rollupOptions.output.manualChunks`，按功能模块自动分包，避免单个 chunk 体积过大：

```typescript
manualChunks: {
  'vendor-recharts': ['recharts'],
  'vendor-motion': ['framer-motion'],
  'vendor-router': ['react-router'],
  'feature-range': findFiles('src/features/range-trainer'),
  'feature-gto': findFiles('src/features/gto-simulator'),
  'feature-progress': findFiles('src/features/progress'),
  'feature-academy': findFiles('src/features/strategy-academy'),
  // ...
}
```

- 主 chunk 从 1204 kB 降至 291 kB，最大 vendor chunk（recharts）为 418 kB
- 各 feature 模块独立 chunk，按需加载

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
| `poker-training-progress` | 训练记录数组 + 用户设置 | Zustand persist 自动序列化 |
| `i18nextLng` | 当前语言偏好 | i18next |

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
| progress | `poker-training-progress` | 8 | records / settings / onboarding / streak / elo / quickDrillStreak / mentorStyle / emotion / consecutiveWrongByModule / unlockedAchievements / achievementUnlockDates / freezeCardFragments / lastFragmentDate / fragmentsEarnedToday |
| puzzle-trainer | `puzzle-trainer-store` | 2 | rushBest / dailyBest / themeBest / quickDrillBest / dailyCompleted |
| strategy-academy | `strategy-academy-progress` | 2 | progress / practiceResults（cap 200） / abilityAssessment / dailyPlan / certifications / firstAttemptScores / lastAttemptScores |

> v2.1 说明：progress store 新增 `consecutiveWrongByModule: Record<ModuleType, number>` 字段用于自适应难度判定。该字段为运行时累加值（每次答错 +1，答对重置为 0），首次加载时通过防御性合并默认值 `{}` 注入。

**Persist 版本迁移记录**：

| 迁移 | 描述 |
|------|------|
| v6 → v7 | 成就系统迁移：注入 `unlockedAchievements: []` 和 `achievementUnlockDates: {}` 默认值 |
| v7 → v8 | 冻结卡碎片系统迁移：注入 `freezeCardFragments: 0`、`lastFragmentDate: ''`、`fragmentsEarnedToday: 0` 默认值 |
| strategy-academy v0 → v1 | 进步回放得分记录迁移：注入 `firstAttemptScores: {}` 和 `lastAttemptScores: {}` 默认值 |
| strategy-academy v1 → v2 | practiceResults 裁剪：对超过 200 条的老数据执行 `.slice(-200)` 保留最近记录 |

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

### 11.1 单元测试（Vitest）

覆盖纯函数和工具函数（v2.0：18 文件 124 用例）：

| 测试目标 | 文件 | 关键用例 |
|----------|------|----------|
| `pokerMath.ts` | pokerMath.test.ts | 赔率计算、EV 计算、权益估算 |
| `elo.ts` | elo.test.ts | ELO 变化、段位、K 因子、升级 |
| `decisionFeedback.ts` | decisionFeedback.test.ts | GRADE_THRESHOLDS、calculateGrade 边界 |
| `strategyCompare.ts` | strategyCompare.test.ts | 最优判定、EV 损失精度（v2.0 新增） |
| `statsAggregator.ts` | statsAggregator.test.ts | 聚合正确性、空记录处理（v2.0 新增） |
| `streakCalc.ts` | streakCalc.test.ts | 连击天数计算（v2.0 新增） |
| `parsers/common.ts` | common.test.ts | 牌面字符串解析、格式检测（v2.0 新增） |
| `handClassifier.ts` | handClassifier.test.ts | 169 种手牌分类（v2.0 新增） |
| `deck.ts` | deck.test.ts | 牌组生成、洗牌（v2.0 新增） |
| store migrate | store.migrate.test.ts ×3 | progress / puzzle-trainer / strategy-academy 迁移链路 |
| store persist shape | store.persist-shape.test.ts ×3 | 各 store 持久化 shape 校验 |
| i18n | localeParity.test.ts | zh/en 键集对称性 |
| eslint | eslintCrossImports.test.ts | 跨模块导入白名单守卫 |
| opponentScoring | opponentScoring.test.ts | 对手画像评分逻辑 |

### 11.2 组件测试（Testing Library）

覆盖交互组件：

- `RangeGrid` — 点击格子触发高亮、颜色映射正确
- `OddsCalculator` — 输入变化后结果实时更新
- `SpotTrainer` — 提交决策后显示反馈
- `HandReplayer` — next/prev 按钮正确推进/回退

### 11.3 E2E 测试（Playwright）

覆盖关键用户流程：

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
