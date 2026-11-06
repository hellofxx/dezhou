# 德州扑克训练平台 — 技术设计文档 (TDD)

> 状态：Current · 最后复核：2026-11-04

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
│       │   ├── dashboard/        # Dashboard / ModuleStatsPanel / ModuleStatsPage / AccuracyChart
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
│       ├── store.ts              # persist（version 以 store.ts 配置为唯一事实源）
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
│   │   ├── store.ts               # persist（version 以 store.ts 配置为唯一事实源）
│   │   └── types.ts
│   │
│   ├── strategy-academy/          # 策略学院模块
│   │   ├── components/            # 课程组件 + drills/（含 ChoiceDrillRenderer.tsx）
│   │   ├── data/                  # courses.ts（re-export 兼容层）/ learningTracks / levels/ / localLessons/ / opponentProfiles
│   │   │                          # levels/ 目录：index.ts + level1.ts ~ level8.ts（level4 拆为 level4a.ts / level4b.ts）
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── index.ts
│   │   ├── store.ts               # persist（version 以 store.ts 配置为唯一事实源）
│   │   └── types.ts
│   │
│   ├── theory-academy/            # 理论学院模块（2026-07 新增，设计见 5.8b）
│   │   ├── components/            # TheoryHome / TheoryChapterView / TheoryQuiz / TheoryLadder / TheoryResume / PracticeBridgeCard 等
│   │   ├── data/                  # levels/（index.ts 兼容层 + variants/ 三变体子目录 + theoryIntegrity.test.ts）
│   │   ├── hooks/                 # useTheory
│   │   ├── utils/                 # theoryProgress（纯函数）/ quizOrder（选项排序出口）/ getLevelTargetChapter
│   │   ├── index.ts
│   │   ├── store.ts               # persist（version 以 store.ts 配置为唯一事实源）
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
│   │   ├── poker/                # 扑克领域组件（Card / CardBack / CardSVG / Chip / HandDisplay / PositionBadge）
│   │   ├── feedback/             # 反馈与状态组件（FeedbackGrade / ResultSummary / EmptyState / LoadingState）
│   │   ├── layout/               # 布局组件（TableRail / LiveDot）
│   │   └── business/             # 业务组件（CasinoPlaque / ErrorBoundary / FreezeChip / GameVariantSelector / MottoEngraved）
│   ├── data/
│   │   └── opponentProfiles.ts   # 跨模块对手画像数据（gto-simulator / strategy-academy 消费）
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
│   ├── moduleRegistry.ts         # 模块注册表（I18nModuleKey / ALL_MODULES / loadModule 唯一契约源）
│   ├── preload.ts                # core 模块预加载
│   └── locales/
│       ├── zh/<module>.json      # 中文翻译（按模块拆分）
│       └── en/<module>.json      # 英文翻译（按模块拆分）
│
├── layouts/                      # 布局组件
│   ├── AppLayout.tsx             # 主布局（侧边栏 + 内容区）
│   ├── BlankLayout.tsx           # 空白布局（全屏训练）
│   └── MobileNav.tsx             # 移动端底部导航
│
├── fonts/                        # 自托管字体源（woff2，经 globals.css @font-face 引入）
│
├── guards/                       # 全局不变式测试（跨模块 / 全仓范围）
│   ├── README.md                 # 守卫清单与新增全局守卫的约定
│   ├── designTokenGuard.test.ts  # 源码层反霓虹 / 纯黑白
│   ├── designTokenCssGuard.test.ts # CSS 面填充合规
│   ├── dealerSlip.contrast.test.ts # 纸条 WCAG AA 对比度
│   ├── eslintCrossImports.test.ts  # 跨模块导入白名单快照
│   ├── huPositionOrderGuard.test.ts # 单挑位置方向零容忍
│   ├── rangePresetGtoConsistency.test.ts # preset 与 GTO JSON 一致性
│   └── line-count-guard.test.ts  # 单文件行数硬约束
│
├── test-utils/                   # 测试专用工具（不进运行时 bundle）
│   └── a11y.ts                   # 组件级 axe harness（jsdom）
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
| `guards/` | 全局不变式测试（跨模块 / 全仓范围）；新增全局守卫放此处，清单见 `src/guards/README.md` |
| `test-utils/` | 测试专用工具（a11y harness 等），仅被测试文件引用，不进运行时 bundle |
| `fonts/` | 自托管字体源（woff2），由 `styles/globals.css` 的 `@font-face` 引入 |

### 3.2 模块间依赖规则

1. **Feature 模块间不直接依赖** — 通过 `shared/stores/trainingEvents.ts` 事件总线通信
2. **Feature → Shared** — 所有 feature 模块可引用 shared 中的类型、组件、工具
3. **Shared 不依赖 Feature** — shared 层不引入任何 feature 模块代码
4. **Layouts 仅依赖 Shared** — 布局组件不直接引用 feature 内部
5. **App 层** — 通过 `React.lazy` 动态导入 feature 页面组件

### 3.3 共享层材质与交互基础设施

- **移动端反馈 Sheet**：`MobileFeedbackSheet` 由 Radix Dialog 承载（焦点陷阱 / Escape 关闭 / 关闭后焦点归还 / 背景滚动锁），内容面为 `.dealer-slip` 纸张（DESIGN.md §1.5 材质契约 / §5.23 / §13.7.2），入场 300ms、退场 200ms 由 `globals.css` 的 `[data-state]` keyframes 驱动（未启用 tailwindcss-animate，`animate-in` 系列类属空操作）。
- **网格键盘导航**：`shared/hooks/useRovingGridNav` 取代已删除的 `useGridKeyboardNav`——整张网格只有一个 Tab 停靠点（13×13 网格 169 → 1，三处消费方合计 3），方向键按 `columns` 跨行移动、Home / End 到首尾，Enter / Space 触发 `onSelect`；消费方为 RangeGrid / StrategyMatrix / ConceptGraph，兼容 SVG 项。
- **纸张作用域**：`.dealer-slip` 在自身作用域内把 ink / brass / 语义 / 表面 token 重锚为 §2.6 的 paper 值（canonical 与 globals.css alias、Tailwind `@theme` 颜色别名一并覆盖），纸面内禁止沿用暗色房间的亮阶色；层级取 z-index 100（§6.4），与弹窗 / Modal / 下拉菜单同层。

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
  amount?: number;       // **to 金额**（该动作后玩家在本街的累计投入），非增量
  playerIndex: number;   // 玩家座位索引
  timestamp?: number;    // 时间戳（用于回放）
}

// 金额口径契约（hand-history，事实源：src/features/hand-history/types.ts + parsers/common.ts）：
// - 解析层：各平台解析结果必须经 `normalizeToAmounts(actions)` 归一——Call 累加至 to、
//   Raise / AllIn 取历史最大投入、Fold / Check 原样透传；强制盲注（posts）归为 Call
// - 归一按街调用（每街起始 invested 归零），禁止跨街累计
// - 回放层：筹码扣减用 `delta = max(0, to - 已投入)`、底池累加同一 delta，街级投入取 max(已投入, to)
// - UI 层：Call 动作显示**增量**（to - 该玩家街内已投入），避免 "call $6" 实为补 $2 的误导

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

- **open / call 类 preset**（utg/hj/co/btn/sb-open、bb-call-vs-btn）与 **bb-3bet-vs-btn**（BB 面对 BTN open 时 raise 即发起 3-bet，JSON 有覆盖）：以 gto-simulator `data/preflop-ranges.json`（6max_100bb_preflop）为权威源，按「频率 ≥ 0.5」离散化生成；一致性由 `src/guards/rangePresetGtoConsistency.test.ts`（平台级跨模块守卫，同 eslintCrossImports 先例）锁定
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

4. **场景生成引擎**（`useScenarioEngine` → `utils/scenarioGenerator.ts` + `utils/decisionNodes.ts`）：
   - 根据 `ScenarioConfig`（位置、人数、难度、筹码深度）批量生成场景；`generateScenarios(config)` 启动训练会话
   - **翻前生成域受策略表约束**（不再按「前方 fold 概率 70%」自由生成动作）：非 BB 位置一律前面全 fold → `{pos}_open`；BB → opener ∈ {HJ, CO, BTN} → `bb_vs_{hj,co,btn}_open`。等效把生成空间收缩到 `preflop-ranges.json` 的 11 个真实 spot key
   - **出口过滤**：`generateScenario` 对 preflop 且 `resolveSpotKey(...)` 返回 `null` 的场景，强制回退到必然命中的 open 场景，并在 DEV 下打一次性 `console.warn`（`loggedPreflopFallback` 防刷屏）暴露缺口
   - `PREFLOP_FALLBACK` 常量仅作理论不可达路径的最后兜底，**禁止**作为常规判分来源（产品规格见 PRD §5.3.6）
   - **确定性生成**：传入 `seed` 时经 `shared/utils/seededShuffle` 的 `seededRandom`（mulberry32）驱动全部随机分支，未传 `seed` 时用 `Math.random`；模块内禁止再实现第二份 PRNG
   - 决策树构造逻辑位于 `utils/decisionNodes.ts`（自 `scenarioGenerator.ts` 拆出，满足单文件 ≤300 行硬约束）

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

9. **动作术语单一来源**（`utils/actionTerms.ts`）：
   - `ACTION_TERMS` 为 Fold / Check / Call / Raise / All-In 等动作术语的**唯一**常量出口，`actionTerm(action)` 与 `actionLabel(action, amount?)` 为渲染入口，模块内禁止再散落硬编码字面量
   - 术语**刻意不做 i18n 本地化**（属产品决策，见 PRD §5.20.5），因此该文件不接 `t()`；文件头注释记录此决策，防止后续被当作 i18n 遗漏「修复」

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
   - `ProgressReplay` 组件对比用户首次尝试与最近一次的表现，数据源为策略学院 `AcademyDataSource.getLessonAttemptsSnapshot()`（`lessonAttempts` 快照，经 shared `useAcademyLessonAttemptsSnapshot` 消费；progress 不 import feature）
   - 按绝对变化幅度降序取前 5 门课程，同时展示进步（`--poker-success`）与退步（`--poker-danger`），可视化成长轨迹

10. **存量理论复习项 key 化迁移**：理论学院早期实现把章末题目的**中文原文**写进复习项的 `label` / `metadata.front` / `metadata.back`，而复习项随 persist 长期存活、渲染层按 i18n key 解析（契约见 §5.8b 第 10 条与 §5.9 SRS 语言契约），故英文界面会显示中文题干/解析。progress store 因此在 persist `version` 递增的同时新增一个 migrate 步骤（版本号以 `store.ts` persist 配置为唯一事实源，本文档不维护数值副本，见 §9.4），调用纯函数 `features/progress/utils/migrateTheoryReviewKeys.ts`：
    - **无损反解**：按复习项 id 的 `theory:` 前缀反解出 questionId 并重建 key，不读题库数据、不猜测原文、不需要用户重考
    - **幂等与防御**：已是 key 的条目不再变更（未变更项连对象引用都保持原样）；非对象 / 缺字段的脏数据安全跳过；老存档完全没有 `reviewItems` 键时只回写数组，避免 hydration merge 覆盖默认 `[]`
    - **调度零丢失**：`interval` / `easeFactor` / `repetitions` / `nextReviewDate` / `lastReviewedAt` / `category` / `metadata.route` 等其余字段原样保留
    - **跨模块镜像约束**：`eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 中 `progress: []`（且只删不加），故 id 前缀与 theory quiz key 生成函数只能在本文件内以镜像拷贝存在，一致性由 `migrateTheoryReviewKeys.test.ts` 的「key 镜像守卫」用例锁死（该用例经 `@/i18n/contentKeyEntries` 取 theory-academy 侧单源生成结果比对）；把「理论复习项 id 前缀 + quiz key 生成」上收 shared 层以消除拷贝属待 `platform-dev` 协调项

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
| store | store.ts | persist（version 以 store.ts 配置为唯一事实源；rushBest / dailyBest / themeBest / dailyCompleted / history） |
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
| store | store.ts | Zustand store（lessonAttempts / placement / checkpoints / bookmarkedLessons / lessonNotes；v8 起无 abilityAssessment 与首末次得分镜像） |
| types.ts | 类型定义 | Course / Lesson / LearningTrack / OpponentProfile 等 |

**关键设计**：

1. **课程结构**：课程数据原存储在 `courses.ts`，现已拆分到 `data/lessons/variants/standard/` 目录（`index.ts` 聚合 + `standardLevel1.ts` ~ `standardLevel8.ts`，其中 L4 拆为 `standardLevel4a.ts` / `standardLevel4b.ts`）；`data/levels/index.ts` 与 `data/courses.ts` 保留为 re-export 兼容层。每级包含多个课时（lesson）；lesson 类型包括理论课、Drill 实践课、概念课。`CourseView` 阅读阶段采用**小节锚点式微观闭环**（2026-08 P1 重构，替代原三段式 Tabs）：课程页 = 先行组织者卡（LessonIntroCard 路线图）→ 小节序列（SectionNav sticky 锚点导航 + 概念块与内嵌牌例同屏 + 顺序推进 CTA「进入下一节 / 进入实战练习 / 完成学习」）→ 综合实战（PracticeDrill）→ 课后测验（LessonQuiz）。小节由 `utils/lessonUnits.ts` 的 `deriveLessonUnits` 派生（显式 `lesson.units` 字段优先，否则按 content 的 heading 分节、examples 按语义配对 exampleId）；`location.hash`（`#uN`）支持直达小节，`handleRestart` 以 `history.replaceState` 清理 hash 残留。

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

   **等级解锁判定（区分 4A/4B）**：store 提供两个方法——`isLevelUnlocked(level: number)`（按 level 数字，同 level 数字任一条目满足即解锁，用于兼容旧调用）与 `isLevelEntryUnlocked(levelId: string)`（按 `LevelInfo.id` 精确判定，如 `l4a`/`l4b`）。UI 门禁（`CourseView` / `ConceptGraph` / `AcademyHome` / `LevelCard`）统一使用 `isLevelEntryUnlocked`，消除 L4A/L4B 同为 `level:4` 时 L4B 门禁被旁路的缺陷。`CourseView` 对本土课按 `LOCAL_TRACK.prerequisiteLevelIds` 单独判定。级别认证（`LevelCertification`）题池按 `LEVELS.filter(l.level === level)` 合并同 level 全部条目（Level 4 = 4A + 4B），`submitCertificationAttempt` 的 questionCount 以组件实考抽题结果传入，题池上限为 `min(合并题池, 20)`（legacy `attemptCertification` 已于 v8 移除）。

4. **知识图谱**（ConceptGraphView）：
   - 使用 SVG + framer-motion 渲染节点和边
   - 节点状态：已掌握（绿色）、学习中（金色）、未解锁（灰色）
   - 支持点击节点跳转到对应课程
   - 数据源：课程依赖关系图（DAG）

5. **对手形象系统**（`data/opponentProfiles`）：`OpponentProfile` 类型定义对手分类（TAG / LAG / NIT / CALLING_STATION），含 VPIP / PFR / aggressionFactor 统计与应对策略。

6. **能力评估（v8 收敛）**：用户可见能力画像以 `progress.eloByVariant` 为单一事实源；策略侧自适应难度只读 `recentPracticeResults`（由 `recordPracticeResult` 维护，cap 50）。`abilityAssessment` 随 v8 移除，不再有第二套能力值。

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

10b. **课程内容渲染层 key 覆盖**（2026-08 全量迁移）：
    - **背景**：课程正文/题库/例题/实战数据（data/** 约 1.5MB 中文）保持硬编码中文原文，全量重写数据层成本极高且破坏引用完整性。
    - **方案**：渲染层 key 覆盖——模块级 `utils/contentKeys.ts`（strategy-academy 与 theory-academy 各一份，命名空间隔离）提供 key 生成函数，消费组件统一 `t(key, { defaultValue: <数据层中文> })`；英文界面命中 i18n key，中文界面回退数据层原文（行为零变化）。
    - **key 命名**：正文段落（section 无稳定 id）用 `lessonId + content 数组索引` 派生（`academy.lessonContent.<lessonId>.<i>` / `theory.content.<chapterId>.<i>`）；quiz/example/practice/drill 均有稳定 id 直接用 id 派生（`academy.lessonQuiz|lessonExample|lessonPractice|drill|opponentDrill.<id>.*` / `theory.quiz.<id>.*`）；术语 `academy.term.<id>.*`；对手档案 `academy.opponent.<id>.*`（跨模块共享）；Basics `academy.basicsContent.<stepId>.<i>`；unit 标题 `academy.unitTitle.<lessonId>.<unitId>`；theory 学习目标 `theory.chapterObjectives.<chapterId>.<i>`。
    - **命名空间冲突规避**：`academy.content/quiz/practice` 已被 UI chrome 占用，课程内容统一用 `lesson*` 前缀（`lessonContent/lessonQuiz/lessonPractice`）；`theory.objectives` 被 UI 标签占用，改用 `chapterObjectives`；quiz 题库并入现有 UI `quiz` 对象（UI 标签 + 题目共存）。
    - **翻译文件组织**：`locales/{zh,en}/academy-course/` 子目录按课程代码文件拆分（`level1~8.json` + `short-deck.json` + `heads-up.json` + `local-lessons.json` + 专题文件），由 `i18n/academyCourse.ts` 按文件懒加载并 deep 合并注入 `academy` 命名空间，`t()` 路径不变；academy.json 瘦身为 UI chrome。路由入口不再整批加载（详见第 12 条）。
    - **选项排序治理**：quiz/practice/drill 的 resolve 函数先 `t()` 解析（option 用原始索引派生 key），再由调用方走既有排序出口（`orderQuizQuestion` / `orderPracticeOptions` / `orderTheoryQuizQuestion` / `orderDrillOptions`）重排；种子只依赖 id，zh/en 顺序一致，correctIndex 同步重映射。
    - **守卫**：`src/i18n/contentI18n.test.ts` 强化为全量遍历断言——从数据模块（`ALL_VARIANT_LESSONS` / `LOCAL_LESSONS` / `BASICS_STEPS` / `GLOSSARY_TERMS` / `OPPONENT_PROFILES` / `OPPONENT_DRILL_QUESTIONS` / `ALL_VARIANT_THEORY_LEVELS`）遍历生成全部渲染消费点 key（expectedCount ≈ 12948），断言 zh/en 双语 JSON 均存在；localeParity / curriculumIntegrity / theoryIntegrity / 排序分布守卫保持绿。存在性检查**不覆盖**"文案已改而译文陈旧 / 下标错位"，对齐由 `src/i18n/contentAlignment.test.ts` 逐字镜像断言（见本节第 17 条）

12. **加载分层（2026-10）**：与理论学院同构的三层懒载，禁止任一层回退为全量静态依赖——
    - **数据**：`data/lessons/manifest/` 是由完整课程生成的目录摘要（`pnpm academy:manifest`），Home/store/成就检查/轨道/图谱/每日计划只读它（`utils/academyMeta.ts` + `utils/trackMeta.ts`）。完整课程由 `data/lessons/loaders.ts` 按「课程 → 所属 Level」动态 import（L4 合并 4A/4B；变体走各自 index；本土课走 localLessons）；`CourseView`/`LevelCertification`/`QuickDrill` 经 `useAcademyLessons` 消费。vite `manualChunks` 按摘要/单 Level/单变体拆分，摘要 import 不得拖入课程正文
    - **内容语言包**：`i18n/academyCourse.ts` 按文件加载（课程页 = `levelN|变体|local` + `term/opponent/opponentDrill`；Basics = `basics`；认证 = `levelN` + 专题；速训 = 标准全级别），成功才入缓存、失败可重试、并发共享 in-flight；语言切换只补已访问文件。en 下页面经 `useAcademyCourseI18n` 等待目标文件，zh 直接渲染数据层原文
    - **意图预取**：首页课程阶梯/继续学习卡在 hover/focus 时预取目标课程所属 Level 的完整数据；点击后直接命中缓存
    - **守卫**：`data/lessons/manifest.parity.test.ts`（摘要 ↔ 完整数据）、`data/lessons/loaders.test.ts`（Level/变体映射与速训全量）、`i18n/academyCourse.test.ts`（课程 id → 文件映射、定向加载、语言切换补载）

11. **新增课程**（v2.1 新增）：
    - `l3-3bet-postflop`：3Bet 翻后策略
    - `l7-hu`：单挑（Heads-Up）策略
    - `l5-tools`：扑克工具使用指南
    - `l5-online-vs-live`：线上 vs 线下差异与调整

12. **互动示例预测暂停（checkpoint）**（2026-08 P2 新增）：含 exampleId 且有 practice 的小节默认开启 `checkpoint`（含显式声明），`HandExampleComponent` 以 `interactive` prop 切换到 `PredictionPrompt` 互动模式——先猜后揭示（生成效应 + 自我解释效应）：预测区三动作按钮（正确决策 / 常见错误 / 干扰项，由现有数据派生零新字段）+ 五级反馈徽章（复用 `GRADE_DISPLAY_CONFIG`，evLoss 由 `commonMistake.evLoss` 解析兜底 3）。**设计豁免登记**：checkpoint 为脚手架性质，纯本地 state（`LessonContent.checkpointAnswered`），不接 ELO / 不 emit trainingEvents / 不调用 progress store（与 theory-academy 章末小测豁免同类）。

13. **降级复习闭环（P3 新增）**：`PracticeDrill` 自适应降级且 `shouldRecommendReview` 命中时，以常驻提示条替代 4 秒 toast，点击「返回复习」经 `onReviewRequest(topics)` 回跳——topic 与 unit.title 双向包含匹配（无匹配回退第 1 节），跳转后经末节 CTA 重新进入实战（drill 重开，P4 后小节完成状态持久化但 drill 中途状态不持久化）。完成页新增「重新实战」入口（`CourseDoneView.hasPractice` + `onRestart('practice')` → `restartTarget` 经 phase 重挂载直达实战视图）。

14. **反馈三态诚实渲染（呈现层）**：`PracticeDrill` 的反馈渲染逻辑下沉 `utils/practiceFeedbackView.ts`，按 `PracticeOption.evLoss` 是否有真实标定分三态——有有限数值 → `calibrated`（`calculateGrade(evLoss)` + `GRADE_DISPLAY_CONFIG` 等级与 EV 损失）；无 evLoss 且答对 → `correct`；无 evLoss 且答错 → `incorrect`（仅对/错 + 正确项提示）。取代旧实现 `calculateGrade(evLoss ?? (isCorrect ? 0 : 3))` 的兜底伪造档位（产品口径见 PRD §5.3.6 / §6.7.1 EV 标定诚实性）。`evImpact` 自由文本着色判定下沉 `utils/evImpactTone.ts`：仅在字符串**起始位置**可解析出数值时着色（严格为负 → danger，≥0 → success），解析不出一律中性（叙述型文案夹带的数字不猜方向）。标定覆盖率由 `utils/evCalibration.test.ts` 固化为**只能上升的棘轮**（数据源经 `import.meta.glob(..., '?raw')` 扫描课时源码统计携带数值型 `evLoss` 的选项数，不引入整个题库模块，也不依赖 Node fs/类型）。**未变更**：对错 / 连击 / SRS / ELO 的判分输入，以及 `shared/types/decisionFeedback.ts` 的 `GRADE_THRESHOLDS` / `calculateGrade` / `buildDecisionFeedback` 契约完全保持原样。

15. **理论支撑引用完整性守卫（反向死链）**：`data/theoryReferenceIntegrity.test.ts` 扫描策略课时中 `type: 'theory-reference'` 段落，断言其 `data.theoryChapterId` 指向的理论章节真实存在，且**每个** theory-reference 段落都带可跳转 id（无 id 者只能渲染为纯文本标签）。目标 id 全集经 Vite 原生 `import.meta.glob(..., '?raw')` 读取 theory-academy 数据源码正则扫描得出——两模块互相 import 被 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 禁止，引用只能是 ID 字符串，故目标存在性必须由守卫保证；不维护手工镜像清单，章节增删不引入漂移。与 §5.8b 的 `CROSS_MODULE_LESSON_IDS`（理论→实践方向）互补，两个方向的悬空引用各有断言。

16. **理论桥接可点化**：`components/content/TheoryReferenceBlock.tsx` 的跳转解析优先 `data.theoryChapterId` → `/theory/chapter/:id`，回退旧形态 `data.lessonId`（`data.target === 'theory'` 走理论章节路径，否则 `/academy/lesson/:id`），二者皆无时渲染纯文本标签，不生成死链。

17. **内容与测验的原子变更守卫**（落在 `src/i18n/`，两学院共享）：新增单源生成器 `contentKeyEntries.ts`（遍历课程数据产出 key ↔ 原文映射），由 `contentI18n.test.ts`（key **是否存在**）与新增 `contentAlignment.test.ts`（key ↔ 原文**是否对齐**）共同消费，消除两处重复遍历。对齐守卫断言分三层——① 索引族长度对齐与 orphan（locale 残留的下标条目即错位信号）② zh 逐字镜像（locale 值 === 数据层原文）③ en 非空且不含汉字（术语卡 `chinese` 字段例外）。历史漂移冻结在独立文件 `contentAlignment.baseline.ts` 的**棘轮基线**：只允许减少、修复一条删一条，守卫内置「基线卫生」断言禁止为跑绿新增条目。规则口径见 PRD §6.7.4 / §10 R11。

18. **题库分层与评估抽取（2026-11）**：标准课题库从 level/local 文件迁入 `data/lessons/variants/standard/quizBank/level1..8.ts` + `local.ts`（`Record<lessonId, QuizQuestion[]>`）；单挑课题库在 `data/lessons/variants/heads-up/quizBank/l3hu..l8hu.ts`（每课 10 题，q1–q5 由原 level 文件逐字迁入、题号与选项顺序不变）。`utils/applyQuizBank.ts` 薄包装 shared `mergeQuizBank`，在静态聚合与 `loaders.ts` 按 Level 注入；单挑 `heads-up/index.ts` 统一注入后，`ALL_VARIANT_LESSONS` 与运行时 loader 消费同一结果。每门非 Drill 标准课 8–12 题、单挑课 10 题；课时测验经 shared `drawByAttempt` 按 `lessonId#attemptNumber` 抽 5 题；Level 认证从该级全题库抽 20 题（`certificationExam.ts`，仍仅标准变体），不再复用固定课时卷。课程内容数据文件不做行数限制（策略 `lessons/variants` / `localLessons` / `basicsContent`；理论 `levels/variants` 的 Level / chapters / quizBank / blocks）；逻辑文件（loaders / 组合器 / index）仍受 ≤300 目标与 >400 硬失败约束。

19. **Store 评估状态（v8 收敛）**：`lessonAttempts: Record<lessonId, { attempts; firstScore; firstCorrect; firstTotal; bestScore; lastScore; lastAt }>` + `recordLessonAttempt` 是课后尝试的**唯一事实源**（首次成绩计掌握度/ELO，重考只更新 best/last 并进题级 SRS）。v8 已移除 `firstAttemptScores` / `lastAttemptScores` 镜像与 legacy `attemptCertification`；进步回放与掌握度改读同一份数据（`AcademyDataSource.getLessonAttemptsSnapshot()`）。认证记录含 `variant:'standard'` / `totalQuestions` / `poolSize` / `questionIds?`；`getCertificationState` 与 `submitCertificationAttempt` 为唯一认证入口（完成门禁、标准变体、有效期内不可重考、失败 24h 冷却、过期续期）。

20. **ELO 统一写入**：课时测验首考逐题 `progress.updateElo(lessonMeta.eloDimension, correct, difficulty)` + `recordAnswer`；重考不写 ELO/情绪计数。`PracticeDrill` 每答写 ELO（维度取 `relatedLessonId` → `lessonMeta`，兜底 postflop），并以 `recordPracticeResult` 只维护 `recentPracticeResults`（cap 50）作为自适应难度窗口——v8 起不再维护 `abilityAssessment`。基础 Drill 完成时按正确率写一次；认证不写 ELO（凭证不是学习）；Level Checkpoint 首轮写 ELO、重考不写（见第 27 条）。`dailyPlan` 读 `EloRating`；`store.bootstrap` 改调 progress store 的 `seedEloFromOnboardingAbility(onboarding.initialAbility)`（仅 `gamesPlayed === 0` 时播种），`syncEloFromAcademyAbility` 已随 v8 移除。用户可见能力画像以 `eloByVariant` 为单一事实源。

21. **题级 SRS**：`utils/strategySrs.ts` 薄包装 shared `buildQuestionReviewItems`；id 前缀 `strategy:`（与 theory 的 `theory:`、旧 lessonId 裸键隔离），label/front/back 存 `academy.lessonQuiz.<qid>.question/.explanation`，metadata 带 `/academy/lesson/<lessonId>`。`completeCourse` 在每次尝试都 emit + `recordTrainingDay`，按 `wrongQuestionIds` 写题级 SRS；满分或 Drill 保留课时级复习项。`useEnsureReviewSourceI18n` 从 strategy 题级复习项的 route 反解 lessonId，按需加载 `academy-course` 文件。

22. **lessonMeta 与双向桥接**：`data/lessonMeta/` 覆盖 92 门标准课（含 Drill/本土课）与 12 门单挑课（`headsUp.ts`），每课 `eloDimension` + `theoryAnchors`（≥1 理论章 id）。标准与单挑分表导出、运行时合并查询：标准锚点只允许 `t<n>-*`，单挑锚点只允许 `t<n>hu-*`；`lessonMeta.integrity.test.ts` 用 raw glob 分别扫描理论标准/单挑数据断言锚点存在且不跨变体，`theoryReferenceIntegrity.test.ts` 同时校验 inline `theory-reference` 与 lessonMeta 锚点（按课时 id 前缀分流）。策略首页/课程完成页/认证失败页用 `TheoryBridgeCard`（薄包装 shared `AcademyBridgeCard`）链到 `/theory/chapter/<id>`；理论 Checkpoint 完成后提供 `/academy/certification/<mappedLevel>` CTA。跨模块只传路由/ID 字符串。

23. **两院共享层（2026-11）**：`shared/types/academy.ts` 统一 `AcademyQuizQuestion` / `AcademyBridgeItem` / `AcademySearchItem` / `MasterySummary`；`shared/utils/academyQuizBank.ts`（`mergeQuizBank`）、`academyQuizDraw.ts`（`drawByAttempt`）、`academySrs.ts`（`buildQuestionReviewItems`）、`academyMastery.ts`（`summarizeMastery`）；`shared/components/academy/` 提供 `AcademyBridgeCard` / `AcademyMasteryCard` / `AcademySearchShell` / `AcademyBookmarksPanel`（strip / panel 两形态）/ `AcademyNotesPanel`（受控草稿 + 字数上限 + 显式保存）/ `ContentIssueReportDialog`（mailto / 剪贴板降级）。理论 S2、策略 T3/T4 与 P2 工具均以薄包装消费，shared 层只接收 items / labels / callbacks，禁止读 store、查目录、拼路由或 import feature；理论原有 ARIA/文案/视觉保持不变。

24. **persist v5 → v8**（`migrateStrategyAcademyState` 纯函数，按 `fromVersion` 逐版顺序执行）：**v6** 由 `firstAttemptScores` / `lastAttemptScores` / `quizScores` / `completedLessons` 反推 `lessonAttempts`，已完成但无分数的课时补 `attempts=1`（避免重考被误判首次），已有 `lessonAttempts` 不覆盖；**v7** 注入 P2 字段默认值（`placement: null` / `checkpoints: {}` / `bookmarkedLessons: []` / `lessonNotes: {}`）；**v8** 删除 `abilityAssessment`、`firstAttemptScores` / `lastAttemptScores` 镜像与 legacy `attemptCertification`（只删字段，不动 `progress` / `certifications` / `lessonAttempts`）。迁移为原地合并，进度 / 认证 / lessonAttempts / P2 字段全程保留；老存档零丢失，回滚只丢失新增字段。

25. **变体认证 de-scope**：本批 `getCertificationState` / `submitCertificationAttempt` 在非 standard 变体返回 `wrong-variant`；`LevelCard` / `LevelLadder` 仅在标准变体展示认证入口；PRD §5.16.8 / §5.17.3 同步声明“标准变体认证已上线、变体认证规划中”。变体认证接入时需新增 variant 维度键并提升 persist version。

26. **策略定位测评（16 题，只放宽解锁）**：题库 `data/placementQuestions.ts`（16 题，`PLACEMENT_TOPICS` 覆盖牌型 / 位置 / 赔率 / 翻前范围 / C-bet / EV / GTO / ICM；选项渲染前经 `orderResolvedOptions` 重排，判分以重排后对象为准）；`utils/placement.ts` 提供 `scoreToRecommendedLevel`（0–4 → L1、5–8 → L2、9–11 → L3、12–14 → L4A、15–16 → L4B，非有限值按 0 分钳制）、`creditLevelsForLevel`（推荐起点之前的 Level 单调前缀）与 `PLACEMENT_MAX_CREDIT_LEVEL = 'l4b'`；`utils/p2State.mergePlacement` 负责 creditLevels 并集与「重测不降级」（取更高起点，未知 id 按低档）。`store.recordPlacement` 只写 `placement`，**绝不写 `completedLessons`**；`isLevelEntryUnlocked` 把 `placement.creditLevels` 作为额外放行条件，**L5+ 条目不接受 credit**。`PlacementTestPage` 负责逐题 / 结果 / 重测，不写 ELO、不写 SRS、不 emit trainingEvents。
27. **Level Checkpoint（形成性，12 题）**：`utils/checkpoint.ts` 从该 Level 已应用题库抽 `CHECKPOINT_QUESTION_COUNT = 12` 题（题池不足时全量），每题带来源 `lessonId` 与 `eloDimension`；抽题键 `checkpoint-level-<n>`（`getCheckpointDrawKey`），`recordCheckpointAttempt` 只持久化 `checkpoints[level]`（attempts / firstScore / bestScore / lastScore / questionIds / lastAt）。`LevelCheckpointPage` 以 `isLevelLessonsCompleted(level)` 为入口门禁（URL 直达只渲染锁定原因与完成进度）；首轮逐题 `updateElo(sourceDimension, correct, difficulty)` + `recordAnswer`，`utils/checkpointSrs.ts` 按来源课生成 `checkpoint:l<level>:<qid>` 复习项（首轮与重考一致）；重考只更新成绩与 SRS，不写 ELO。**不发证、不解锁下一级、无冷却**，与认证（§5.16.8）分开入口。
28. **课时工具与内容运营（P2）**：
    - **书签 / 笔记**：store 字段 `bookmarkedLessons: string[]` / `lessonNotes: Record<lessonId, { text; updatedAt }>`；`toggleLessonBookmark` 幂等，`saveLessonNote` 只存纯文本、trim 后按 `MAX_LESSON_NOTE_LENGTH = 2000` 截断、空文本即删除。UI 由 shared `AcademyBookmarksPanel`（strip / panel 两形态）与 `AcademyNotesPanel`（受控草稿 + 显式保存）承载，策略侧薄包装 `StrategyBookmarksPanel` / `StrategyNotesPanel`，课时页入口 `LessonBookmarkButton` + `/academy/bookmarks` 收藏页。二者均为阅读辅助，不参与门禁、不写进度。
    - **内容运营**：`data/contentOps.ts` 的 `getLessonContentMeta(lessonId)` 提供 92 门标准课 + 12 门单挑课的 `lastReviewed`（`YYYY-MM-DD`）与可选 `sources`（引用 bibliography 条目 id），未知课时回退不渲染；`LessonReviewMeta` 展示「最近校对」并挂 shared `ContentIssueReportDialog` 的策略适配 `StrategyContentIssueReport`（mailto / 剪贴板降级，无后端、不记录用户身份）。`data/bibliography.ts` 按 Level 聚合 11 本策略教材（L1–L8 每级至少 1 本），`StrategyBibliographyPage` 只读，不复制理论学院书目数据。
    - **全文搜索**：`utils/searchIndex.ts` 首次查询 ≥2 字符（`SEARCH_MIN_QUERY_LENGTH`）才经 `loadAcademyLessonsForSearch(variant)` 懒加载当前变体课时并**按变体缓存**索引（standard = 速训全量，short-deck / heads-up = 变体专属课；并发共享 in-flight、失败清空可重试、`resetLessonSearchIndexCache` 仅测试用）；命中标题 / 副标题 / objectives / 正文 / 小测题干，结果去重、上限 `SEARCH_MAX_RESULTS = 20`、带 `SEARCH_SNIPPET_LENGTH = 80` 片段。`StrategySearchPage` 保留标题/副标题即时结果，正文结果异步补全，加载失败降级为标题搜索，不阻塞首页；UI 复用 shared `AcademySearchShell`。
29. **v8 技术债清理**：删除 `abilityAssessment`、`firstAttemptScores` / `lastAttemptScores` 镜像与 legacy `attemptCertification`（组件只走 `submitCertificationAttempt`）；`recordPracticeResult` 只维护 `recentPracticeResults`，自适应难度行为不变。`AcademyDataSource` 新增 `getLessonAttemptsSnapshot()`（由 `strategy-academy/store.bootstrap.ts` 注册，shared `useAcademyDataSource` 暴露 `useAcademyLessonAttemptsSnapshot`），progress `ProgressReplay` 改读该快照而不 import feature。progress store 新增 `seedEloFromOnboardingAbility(ability)` 取代 `syncEloFromAcademyAbility`（`store.bootstrap` 直接调用，仅 `gamesPlayed === 0` 播种；`emotionalControl` 固定 50）。回归由 `store.migrate.test.ts` / `store.persist-shape.test.ts` / `store.p2.test.ts` / `ProgressReplay.test.tsx` 锁定。
30. **路由（P2）**：新增 `/academy/placement`（PlacementTestPage）、`/academy/checkpoint/:level`（LevelCheckpointPage）、`/academy/bookmarks`（StrategyBookmarksPage）、`/academy/bibliography`（StrategyBibliographyPage）；`/academy/search` 原地升级为全文搜索（组件 `StrategySearchPage`，按当前变体加载标准全量 / 单挑 12 课索引，UI 复用 shared `AcademySearchShell`）。全部经 `React.lazy` + `<LazyWrapper>` 注册，i18n 走 `/academy` 路由分组（`academy.*`）。

31. **单挑策略全量对齐（2026-11）**：单挑 12 课从「每课 5 题内联 + 1 牌例」对齐到标准课深度，契约由 `data/lessons/variants/heads-up/headsUpVariantParity.test.ts` 固化——12 课 / L3–L8 全覆盖 / level 内 order 连续 / 每课 10 题（q1–q5 保留，SRS 不断链）/ ≥3 个 HandExample / ≥4 个 practice（l7 保持 5）/ ≥10 段正文 / ≥2 条 theory-reference / ≥2 个 units / `anteStructure='sb_ante'`。`quizShuffle` 分布守卫纳入全部变体课时；`curriculumIntegrity` 对变体 quiz / practice / units 做同一套断言，变体卡牌（含短牌）全量校验。数值由各 Level `quantAudit.l3hu..l8hu.test.ts` 复算。i18n 按 Level 拆为 `academy-course/heads-up-l3..l8.json`（zh 逐字镜像数据、en 人工译文），`deriveAcademyCourseFilesForLesson` 对 `l<n>hu-` 映射到对应文件；`huPositionOrderGuard` 扫描六份新 locale。单挑文案与题库不改变持久化 schema，认证仍 de-scope。变体阶梯门禁按 `activeVariant` 的 Level 序列解析：`isLevelEntryUnlockedByCompleted` 新增可选 `levels` 参数，store 优先在变体序列中查找条目并解析 `prerequisiteLevelIds` / 上一级；变体 L4 在 manifest 中合并为单一条目（id `l4b`），单挑按 L3→L4→L5 推进，L8 仍只依赖 L4b，L1/L2 共享基础层回退标准序列。

### 5.8b Theory Academy（理论学院，2026-07 新增）

与 strategy-academy 并列的独立理论学习模块（产品规格见 PRD 5.27）：理论学院负责知识构建，策略学院负责实践应用，两者形成“理论→实践”闭环。架构完全复刻 strategy-academy 成熟模式。

1. **数据模型**（`theory-academy/types.ts`）：
   - `TheoryChapterSummary` / `TheoryLevelSummary`：目录层字段（id / order / title / duration / chapters 等，**无 content / quiz / objectives**）；完整类型继承摘要，首页/store 只读摘要
   - **核心 / 增补标记**（产品规格见 PRD §5.27.11）：`TheoryChapterSummary` 增 `supplemental?: boolean` 与 `pathTags?: TheoryPathTag[]`；`TheoryPathTag = 'six-max' | 'cash' | 'mtt' | 'foundation' | 'preflop' | 'postflop'`（`pathTags` 只供静态学习路径聚合，**不参与解锁**）。**定义 `core = !supplemental`**——Level 解锁、Level 全完成、Level 进度、总进度、活跃 Level、续学建议、核心统计与掌握度一律只对 core 计算；`TheoryChapter` 继承摘要，故完整章同带这两字段，`supplemental` 缺省即 core（存量章节零改动）
   - `TheoryLevelInfo`：id（'t1'-'t9'）/ level / tier（`basic` T1-T3 | `intermediate` T4-T6 | `advanced` T7-T9）/ chapters / unlockRequirement / practiceRecommendations
   - `TheoryChapter`：id（全局唯一，前缀 `t<level>-`，与 strategy-academy 的 `l<level>-` 隔离）/ level / order / title / subtitle / duration / **eloDimension**（五维之一）/ `objectives?`（**类型可选、守卫必填**：完整性测试要求每章 3–5 条非空，类型保持可选是因为标准与变体共用该接口且旧数据缺字段不影响反序列化；渲染侧 `resolveTheoryObjectives` 按下标取 `theory.chapterObjectives.<id>.<i>`，defaultValue 回退数据原文）/ content（`TheorySection[]`）/ quiz（`TheoryQuizQuestion[]`，独立 quizBank 合并后的完整题库 8–12 题；抽题与尝试语义见 §5.8b 第 19 条）/ `practiceRecommendations?`（章节粒度桥接，**数据层字段、不进持久化**，由 `standard/index.ts` 聚合时从 `chapterPracticeMap` 附加，章节文件本身不书写）
   - `TheorySection`：type（text/heading/highlight/example/**formula**/pro-tip/key-point/takeaway，8 类，以 `types.ts` 的 `TheorySectionType` 为准）+ content（内联中文，与策略学院课程正文口径一致，渲染层 key 覆盖——`utils/contentKeys.ts` 的 `theoryContentKey(chapterId, sectionIndex)` 派生 key，消费组件 `t(key, { defaultValue: content })` 解析，数据层保持中文原文）。**段落无稳定 id，key 仅按下标**：在已有章节中间插段会让 zh/en 数组静默错位，补段只能追加到 `content` 数组末尾并同步平移两份 locale
   - `PracticeRecommendation`：lessons（{ id, title }[]，引用 strategy-academy 课程）+ trackId?（轨道）——仅字符串引用，不产生模块 import

2. **内容体系**：章节数据按 Level 拆分为 `data/levels/variants/standard/standardLevel1.ts ~ standardLevel9.ts`（课程内容数据文件属行数守卫豁免类别，阈值与豁免清单以 `src/guards/line-count-guard.test.ts` 与 `docs/AI_GUIDE.md` 为唯一事实源），`data/levels/variants/standard/index.ts` 聚合为 `standardLevels`（兼容层 `data/levels/index.ts` 再导出 `THEORY_LEVELS`）。变体课程位于 `data/levels/variants/{short-deck,heads-up}/`。
   - **章数与题量不在本文档维护副本**：以 `data/levels/variants/**` 与理论结构守卫测试（`theoryIntegrity.test.ts`）为唯一事实源
   - **内容编辑准则（段落类型覆盖、公式须含推导、牌例数量下限、误区显式化、解析须解释错误选项）见 `docs/PRD.md` §6.7.1**，本文件只记录其判定落点：段落类型枚举以 `types.ts` 的 `TheorySectionType` 为准，题量区间与内容非空由 `theoryIntegrity.test.ts` 断言
   - **教材对照基线与版权合规边界见 `docs/PRD.md` §5.27.4 / §6.7.2**；实现侧仅约定标注落点：出处以内联「（概念源自：教材名 章节）」写在 `content` 段落文本中（无独立结构化字段），如需按教材聚合统计请对 `data/levels/variants/**` 做文本检索
   - **目录摘要与完整数据分层**：`data/levels/manifest/`（`pnpm theory:manifest` 生成）提供 Level/章节目录，`utils/theoryMeta.ts` 供 Home/store/成就检查；完整章节数据经 `data/levels/loaders.ts` 按 Level 动态 import（章节页 `useTheoryLevel`），需要全变体的疑难清单用 `useTheoryLevels` 逐 Level 组合。`manifest.parity.test.ts` 与 `loaders.test.ts` 守卫映射一致
   - **增补章独立单文件**：6-max 现金增补章位于 `data/levels/variants/standard/chapters/t<level>-<topic>.ts`（每文件单章、单数组导出），与 `standardLevelN.ts` 的 core 章分离——Level 文件已触到单文件行数约束，且增补章可整批增删而不改动 core 文件。`standard/index.ts` 按 Level 拼接 `[...core, ...supplemental]`，`toSorted(order)` 后再统一打标，`standardLevels` 与摘要生成因此同源
   - **集中打标 `chapterMeta.ts`**（位于 `chapters/` 同级的 `variants/standard/` 下，避免被 loader 的 glob 命中）：维护 `SUPPLEMENTAL_CHAPTER_IDS`（据此置 `supplemental: true`）与 `PATH_TAGS`（章节 → 路径标签），导出幂等 `applyStandardChapterMeta(chapters)`。`standard/index.ts` 与 `loaders.ts` 都在「拼接 → 排序 → 附实践推荐」之后调它，故章节文件本身不书写这两个字段
   - **loader 二次 glob 合并**：`loaders.ts` 在既有 `standardLevel*.ts` glob 之外新增 `import.meta.glob('./variants/standard/chapters/t*-*.ts')`，按 `/chapters\/t(\d+)-[^/]+\.ts$/` 归组到 Level；加载单 Level 时 `Promise.all([base, ...supplemental])` → flatten → `toSorted(order)` → `applyChapterPractice` → `applyStandardChapterMeta`。章节页仍只取当前 Level 的 chunk（增补章与 Level 文件同为独立 chunk），`chapterMeta.ts` 落在一个常驻小 chunk
   - **目录摘要透传**：`pnpm theory:manifest` 的章节投影增加条件字段 `supplemental` / `pathTags`（无值不写键），`manifest.parity.test.ts` 同步断言，故摘要层足以支撑 core/增补进度、掌握度与路径展示；数据层改动后必须重跑

3. **Store**（`store.ts`，persist name `theory-academy-progress`，version 以该文件 persist 配置为唯一事实源）：
   - 状态（v4）：`progress: { completedChapters / quizScores / chapterAttempts / checkpoints / placement / bookmarkedChapters / chapterNotes / currentChapter / startedAt / flaggedQuestions / activeVariant / variantMetadata }`
   - `recordChapterAttempt(id, score, total, correct)`：总是记录 attempts/best/last；首次写 `completedChapters`、`firstScore` 与 `quizScores` 并 `trainingEvents.emit`（module `'theory-academy'`）；重考只做练习（不更新 ELO/recordAnswer/掌握度，仍可进 SRS）。`completeChapter` 已移除
   - `recordPlacement` / `recordCheckpointAttempt` / `toggleBookmark` / `saveChapterNote`：分别写定位免修（creditLevels 并集）、checkpoint 成绩、书签、笔记（上限 2000 字）
   - `isTheoryLevelUnlocked(levelId)`：首行 `isDebugUnlockActive()` 短路；T1 默认解锁，Tn 需 T(n-1) 全部**核心**章节完成，或前一 Level 在 `placement.creditLevels` 内（增补章不参与判定，完成增补章不回锁）
   - `getLevelProgress` / `getTotalProgress`：分子与分母都只取 core（增补章完成不改变百分比）；总进度仍按 `activeVariant` 序列自洽统计；免修不写完成态，故不计入进度
   - `resetProgress`

4. **ELO 集成**：`TheoryQuiz` **仅首次作答**调用 `progress.updateElo(chapter.eloDimension, isCorrect, getChapterDifficulty(level))` + `progress.recordAnswer(isCorrect)`（难度映射：T1≈0.2 递增至 T9≈0.8）；重考走练习态、跳过 ELO/recordAnswer。章节完成调 `progress.recordTrainingDay()`（首次与重考都记真实学习日）。

5. **选项排序治理**：`utils/quizOrder.ts` 的 `orderTheoryQuizQuestion` 复用 `shared/utils/seededShuffle`（数值升序 / id 哈希种子洗牌 + correctIndex 重映射），接入 5.9 选项排序治理。

6. **成就集成**：`achievements.ts` 新增 `theoryChapters` / `theoryLevel` 两个 condition type 与 4 项成就；progress store `checkCondition` 通过动态 import `getTheoryStore()`（复刻 `getAcademyStore` 缓存模式）读取进度。

7. **路由**：`/theory`（TheoryHome，含 ErrorBoundary）/ `/theory/chapter/:chapterId`（TheoryChapterView，URL 直达门禁）/ `/theory/review`（疑难清单），以及 2026-11 新增的 `/theory/placement`、`/theory/checkpoint/:levelId`、`/theory/glossary`、`/theory/search`、`/theory/bibliography`；均 lazy + LazyWrapper，复用 `/theory` i18n 分组；章节页按 chapterId 所属 Level 动态加载该 Level 完整数据，Home 只载摘要；侧边栏“研习”分组入口（`nav.theory`，Library 图标，紧邻策略学院并列，2026-07-30 导航 IA 重构后两学院与牌局复盘同属研习分组），MobileNav 底部导航同步含理论学院项。

8. **数据守卫**：`data/theoryIntegrity.test.ts`（ID 唯一与前缀、小测合法性、eloDimension、实践推荐结构）/ `utils/quizOrder.test.ts`（重映射 + 分布守卫 <50%）/ `store.persist-shape.test.ts`；实践推荐课程 ID 悬空由 strategy-academy `curriculumIntegrity.test.ts` 的 `CROSS_MODULE_LESSON_IDS` 守卫，反方向（策略课时 `theory-reference` → 理论章节）由 strategy-academy `data/theoryReferenceIntegrity.test.ts` 守卫（见 §5.8 第 15 条）。

9. **理论→实践桥接**：两级粒度并存——Level 粒度在各 Level 的 `practiceRecommendations` 声明、`PracticeBridgeCard` 于本级全部章节完成时展示（定向推荐仅指向 track-beginner / track-gto / track-cash-game）；章节粒度集中在 `data/levels/variants/standard/chapterPracticeMap.ts`，由 `standard/index.ts` 的 `withChapterPractice()` 在聚合时附加到章节对象，`TheoryChapterView` 优先展示章节卡、当章节推荐被 Level 推荐覆盖且本级已完成时不重复渲染。章节映射刻意只复用 Level 已登记的课时白名单，故 `data/theoryIntegrity.test.ts` 对章节粒度用**子集**断言（并断言非空，防聚合链被误删后静默失效），Level 粒度的等值断言保持不变。**白名单扩容须三处同一 commit 同步**：目标 Level 的 `practiceRecommendations.lessons`、`theoryIntegrity.test.ts` 的 `EXPECTED_PRACTICE_LESSON_IDS`、strategy-academy `curriculumIntegrity.test.ts` 的 `CROSS_MODULE_LESSON_IDS`（对面断言每个登记 id 真实存在于 `LEVELS`）。课时 id 命名空间有两种——`l<level>-*` 与本土课 `local-*`（后者已由「LOCAL_LESSONS 全部并入 LEVELS」断言保证可解析，路由同为 `/academy/lesson/:id`）；变体课时 id 两种清单都不得登记。strategy-academy `learningTracks.ts` 的 `track-theory-bridge`（“理论到实践”轨道）为经 `/academy/tracks` 泛浏览发现的通用衔接入口（按理论支柱顺序串联实战课程），不是各 Level 的定向推荐目标（P1F-05 定性，专批 A 2026-07-31）。**变体章节同样逐章桥接**：`data/levels/variants/{heads-up,short-deck}/chapterPracticeMap.ts` 各覆盖本变体全部章节，由同名 `variants/<v>/index.ts` 的 `withChapterPractice(levels)`（浅拷贝 Level 与章节后附加字段）接入，视图层与标准侧共用 `PracticeBridgeCard` 的 done 阶段分支、无变体分支。因变体课时进不了任何白名单，这一层的守卫结构换成两条替代断言（见第 15 条）。

10. **章末错题接入 SRS**：`utils/theorySrs.ts` 纯函数 `buildTheoryReviewItems(chapter, wrongQuestionIds)` 把章末错题转为复习项，由 `TheoryChapterView` 在小测完成回调里逐项 `progress.addReviewItem`。三条实现约束：
    - **id 命名空间**：复习项 id 一律 `theory:<questionId>`（`addReviewItem` 按 id 整体 upsert，裸 questionId 会与策略学院以 lessonId 为键的复习项互相吞并）
    - **载荷语言中立**：`label` / `metadata.front` / `metadata.back` 存 `theory.quiz.<questionId>.question` / `.explanation` i18n key（复用 `utils/contentKeys.ts` 单源生成函数），禁止写入任何语言的原文或译文；双语齐备性由 `contentI18n.test.ts` 与 `contentAlignment.test.ts` 断言，渲染层 `t()` 解析（见 §5.9 SRS 段）
    - **重测可入队**：SRS 记录写在 `completeChapter` 的 `alreadyCompleted` 早退之外（视图层），故首次答错与重测答错均可入队；`metadata.route` 指向所属章节页，`metadata.options` 刻意不传，使复习走自评模式而非多选
    - **本模块 persist version 未变更**：SRS 状态归 progress store 持有，理论侧只在视图层写入，不新增持久化字段

11. **量化口径单源**（`utils/theoryFormulas.ts`，模块内自持）：`calculateAlpha` / `calculateMDF` / `requiredEquity` / `kellyFraction`（+ `halfKellyFraction`）/ `requiredHandsForEdge` / `riskOfRuin` / 多人三式（`multiwayAllFold` / `perDefenderRequiredDefense` / `multiwayBluffEv`）/ 演练回填四式（`outsToEquity` / `pairTierCombos` / `aggressionFactor` / `vpipPercent`）共 13 个纯函数，是正文公式段与 `standardQuantAudit.test.ts` 复算块的共同口径源（锚点断言见 `utils/theoryFormulas.test.ts`）。**不下沉 `shared/utils/pokerMath.ts`**：当前仅本模块消费，未达 shared 层 ≥2 模块准入门槛；若策略学院（`MDFVisualizer` 等）将来复用再上收。参数语义须与审计口径一致——`betSize` 指该街下注总额，跟注类门槛一律用「需补入额 ÷ 跟注后底池」，死钱（前注 / Straddle）一律计入 `potBeforeBet` 而不计入 `betSize`。**牌堆参数显式化**：`outsToEquity(outs, cardsToCome, unknownCards = [47, 46])` 的第三个参数承载未知牌数，标准主线三处调用点依赖默认值零改动，短牌传导出的常量 `SHORT_DECK_UNKNOWN_CARDS = [31, 30]`（= 36 − 2 手牌 − 3 公共牌，再减转牌）；`utils/theoryFormulas.test.ts` 用「outs 1-20 逐位等于旧硬编码式」锁死默认口径不被参数化改动，`variantQuantAudit.test.ts` 的短牌 outs 复算一律调函数而非重写分数，非法上界随牌堆下移（32 outs 在 31 张口径下即 NaN）。
12. **零基础先修引导**：`TheoryHome` 侧栏私有组件 `BasicsPrerequisiteCard`，仅在当前变体 `completedChapters` 为空时渲染，以 `<Link to="/academy/basics">` 对接策略学院入门向导。因 `ALLOWED_CROSS_IMPORTS` 禁止 theory→strategy 边，该卡片**不读取**对方 `basicsProgress` 完成态、不构成门禁、不新增本模块持久化字段（jsdom 冒烟见 `components/TheoryHome.basicsGuide.test.tsx`）。
13. **章内即时计算演练**：题源 `utils/theoryCalcDrills.ts`（`CHAPTER_DRILL_SLOTS` 声明哪些章节有哪些公式槽位；`buildCalcDrill(chapterId, slotIndex, attempt)` 从离散参数网格出题、期望值一律调 `theoryFormulas` 现算、`gradeCalcDrill` 按单位容差判分），组件 `components/TheoryCalcDrill.tsx` 挂在 reading 阶段正文之后（读→算→测微闭环，不新增 phase 状态）。四条实现约束：
    - **seed 只由「章节 + 槽位 + 换题次数」决定**，不掺日期与用户——§5.26.4 的"同题同序"契约只约束每日谜题，掺日期会让回访时题面漂移
    - **零持久**（PRD §5.27.10 的产品决策落地）：组件不调 `recordAnswer` / `updateElo` / `completeChapter` / `addReviewItem` / `recordTrainingDay` / `trainingEvents.emit`，因为 `recordAnswer` 无幂等且直连全局连错计数（自适应难度唯一入口）与每日题量预算。双向守卫：组件测试断言五类持久状态快照在混合作答后逐字节不变，`theoryCalcDrills.test.ts` 用 `import.meta.glob('?raw')` 从源码层面禁用上述 token
    - **id 空间隔离**：`drillId` 形如 `${chapterId}#d${slot}`，刻意不用 `-qN` 后缀——`flaggedReviewModel` 与 SRS 按 `-q\d+$` 反解章节 id，撞名会把演练题误当小测题处理
    - **不属选项排序治理面**：纯数值填空无 `correctIndex`，故不经 `quizOrder.ts` 出口（依据 AGENTS.md 选项排序治理与 PRD §5.26.2 的适用范围），此判断写在该组件与生成器文件头，防后来者误判为漏接
    - 演练卡为**零持久、无 EV 标定**，反馈按 §5.9 登记豁免采二态呈现，不复用 `FeedbackGrade` / `GradeBadge`（二者 grade 必填且会渲染 EV 数值）
    - **单位与动态 key**：`DrillUnit = percent / hands / ratio / count`，容差按单位分档且只在生成器内定义（percent 绝对 0.5 个百分点、ratio 绝对 0.05、count 绝对 0、hands 相对 5%）。模板 `theory.drill.template.<formula>`、提示 `theory.drill.hint.<formula>` 与单位 `theory.drill.unit.<unit>` 三族 key 都是 `t()` 动态拼接，`staticKeyGuard.test.ts` 对动态 key 是已知盲区——由 `theoryCalcDrills.test.ts` 补两条守卫：模板内 `{{占位符}}` 集合 ⊆ 该 drill 的 `params` 键集、每个在用单位的双语标签存在且非空（缺 key 会把判分行渲染成键面字）
    - **覆盖是部分章节**：`CHAPTER_DRILL_SLOTS` 只登记确有可口算对象的章节，未登记章节 `buildCalcDrill` 返回 null、演练区整体不渲染（组件测试断言该缺席分支）。刻意不挂槽的理由写在题源文件头（如锦标赛 ICM 递归需多步带小数的分数运算，越出"参数取自友好网格、答案可口算复核"纪律）
14. **量化口径单源归属**：`utils/theoryFormulas.ts`（含多人 `multiwayAllFold` / `perDefenderRequiredDefense` / `multiwayBluffEv`）与 `utils/theoryCalcDrills.ts` 均留在模块内，**不下沉 shared**：当前仅 theory-academy 消费，未达 shared 层 ≥2 模块准入门槛；策略学院（`MDFVisualizer` 等）复用后再上收。

15. **变体桥接的双层守卫（无白名单可用时的替代结构）**：标准侧靠"白名单等值 + 子集"两断言约束跨模块引用面，变体课时（`l<n>hu|sd-*`）与三变体共享地基课（`l<n>-*`）都进不了那两个清单——前者因不在 `LEVELS` 内会使对面的存在性断言必红，后者因本就不是变体专属课。故改由一内一外两层保证：
    - **内层（理论侧，覆盖率）** `data/levels/variants/theoryIntegrity.test.ts`：断言每个变体章节都带非空 `practiceRecommendations.lessons`（漏章或聚合链 `withChapterPractice` 被误删即红），并断言引用 id 只属两种命名空间之一，防止把标准 Level 白名单里的 id 误抄进变体表
    - **外层（策略侧，存在性）** strategy-academy `data/theoryVariantBridgeIntegrity.test.ts`：经 `import.meta.glob(..., '?raw')` 扫描变体 Level 文件与 chapterPracticeMap 的引用点，变体专属 id 断言存在于 `ALL_VARIANT_LESSONS` 且**不在** `LEVELS`（这条正是"它们为何不能进 `CROSS_MODULE_LESSON_IDS`"的事实化），共享地基课 id 断言**在** `LEVELS` 内可解析；引用点自带的回退标题与 `academy.lessonTitle.*` 权威值比对（剥掉尾部消歧括号后取等），定位统一为 `目录/文件:行号`（两变体的 chapterPracticeMap.ts 同名，只留 basename 会歧义）
    - 渲染面另有一条组件级证据：`components/PracticeBridgeCard.variant.test.tsx` 逐个挂载全部变体章节推荐，断言课时卡数量、标题实际取到 i18n 权威值（回退字面量静默生效 = key 缺失，两侧数据守卫都看不见）、跳转拼装为 `/academy/lesson/:id`，en 侧无汉字与键面字泄漏
    - **新增变体章节必须同批登记桥接**：内层覆盖率断言会立刻拦住未登记的章节；`theoryVariantBridgeIntegrity` 的按来源分档断言（章节级 map 与 Level 级各 ≥ 下限）防止整张 map 失配

16. **变体规则性事实的方向守卫**：`src/guards/huPositionOrderGuard.test.ts`（全局不变式目录 `src/guards/`，与 `designTokenGuard` 同级）。防的缺陷类型是**规则性事实写反**而非数值近似——单挑的「翻后谁先行动 / 谁持有位置」曾在两学院正文里同时存在正反两种陈述（实测 152 处含 locale），读者看到的是自相矛盾。实现要点：
    - **判据单源**是 `shared/constants/headsUpRules.ts` 的 `headsUpRules`（SB 即按钮位、翻前 SB 先行动、翻后 BB 先行动；理论 `variants/variantRules.ts` 只做重导出，短牌 `shortDeckRules` 仍留在理论侧）；守卫除扫正文外还断言该区块自身保留 `sbFirstActionPreflop: true` / `bbFirstActionPostflop: true` 与散文一致，防止单源自己被改反而让正文"对着错的参照修"
    - **子句级三元组判定**（盲注主语 + 街道 + 方向谓语）而非全文正则：跨子句匹配会把「翻前 SB 先行动、BB 最后行动」这类正确句误判；子句无街道标记时继承段落，段落同时含翻前与翻后标记则判为不可判（不产生假绿）。谓语正则覆盖中英双语
    - **两处刻意豁免**：小测 `options` 字段（干扰项按设计就是假命题，扫它会禁止出题）与**子句自身**点名满员桌/6-max 的对比句（满员桌 SB 确实翻后先行动且 OOP，跨子句不豁免）
    - **扫描面为 4 份 HU locale**（theory zh/en + academy-course/heads-up zh/en）而非数据源码：zh locale 与数据层由 `contentAlignment` 逐字镜像锁定，故覆盖数据层且能拿到结构化字段以做上述豁免；内置"扫描字符串数 > 700"自检，locale 路径解析失效时不得空洞通过（教训见 2026-09-25 守卫路径修复）
    - **判定器自检用例**锁强度：7 条已知倒置必须判红、6 条已知正确句必须判绿，否则后续放宽正则会把守卫悄悄变成空操作

17. **加载分层（2026-10）**：理论学院是三处独立懒加载面，禁止任何一处回退为全量静态依赖——
    - **数据**：`data/levels/manifest/` 是由完整数据生成的目录摘要（`pnpm theory:manifest`），Home/store/成就检查只读它；完整数据由 `data/levels/loaders.ts` 按 Level 动态 import（每个 Level 单文件产出独立 chunk），章节页经 `useTheoryLevel` 只取当前 Level，疑难清单经 `useTheoryLevels` 逐 Level 组合。首页 chunk 不得静态引用 `data/levels/variants/**`；首页预取也只允许预取目标 Level
    - **内容语言包**：`theory.json` 只保留目录/UI 文案；正文、题目对象与 objectives 按 level 拆到 `locales/<lng>/theory-content/<levelId>.json`，由 `i18n/theoryContent.ts` 幂等加载（成功才入缓存、失败可重试、并发共享句柄）。章节页和疑难清单在 en 下等待对应 level 内容包后再渲染（zh 数据层原文即中文，直接渲染）；Dashboard 复习项由 `useEnsureReviewSourceI18n` 从 `theory.quiz.*` key 反解题 id 后补加载
    - **语言切换**：`preloadTouched` 对已访问 level 补加载目标语言内容包；核心包与内容包是同一 `theory.*` 命名空间，注入经 `addResourceBundle` deep merge
    - **意图预取**：章节阶梯与「继续学习」卡在 hover/focus 时预取当前变体完整数据，点击章节后直接命中缓存
    - **守卫**：`manifest.parity.test.ts`（摘要 ↔ 完整数据）、`levels/loaders.test.ts`（逐 Level 映射 ↔ 摘要，含未知 Level 缺省）、`contentI18n.test.ts`（theory-content 双语文件集 + 核心包不得残留正文）、`preload.test.ts`（核心包不含正文 / level 注入 / 语言切换补载）

18. **6-max 现金基准双列单源**（产品规格见 PRD §5.27.11）：
    - 数据落在模块内 `data/sixMaxBenchmarks.ts`：`SIX_MAX_BENCHMARK_SCOPE`（6 座 / 100bb / 无前注）与 `SIX_MAX_RFI_100BB_NO_ANTE` 双列（`standard` / `beginner`，键为 UTG / HJ / CO / BTN / SB）。**不下沉 `shared/`**：仅理论正文与增补章消费，未达 ≥2 模块准入门槛
    - 单源方向：`standard` 列 = range-trainer `PRESET_RANGES` 中 6-max open 预设名称的 `(~N%)` 标注（守卫逐位置解析比对）；`beginner` 列是入门简化，只受方向约束（不宽于标准列、BTN 仍为标准列最宽）
    - 守卫 `src/guards/sixMaxBenchmarkGuard.test.ts`（跨模块不变式，登记于 `src/guards/README.md`）：自带扫描面自检（解析到的预设数必须等于位置数），名称格式或预设集合被改动时不得空洞通过；增补章落地后同批断言 T4 章正文的双列行
    - 正文引用点（T3 / T4 / T7 的 RFI、VPIP、3-bet 口径）一律投影同一基准表，禁止正文自建第二套数字；新手列保留在策略入门课与旧正文作为简化教学

19. **核心 / 增补语义（`core = !supplemental`，产品规格见 PRD §5.27.2）**：
    | 计算项 | 口径 |
    |---|---|
    | Level 解锁（Tn → T(n+1)） | 只看前一级 core 章是否全部完成；仅余增补章未读时下一级**已解锁** |
    | Level 全完成 / Level 进度 / 总进度 | 分子与分母都只取 core |
    | 活跃 Level / 续学建议 / 首页统计 / 掌握度 | 只由 core 决定；增补章经理论阶梯或学习路径进入 |
    | 「6-max 补强」计数 | 增补章完成的独立计数（可选、界面标注不影响解锁） |
    | 完成记录 / 小测成绩 / ELO / SRS / trainingEvents | 增补章照常写入（学习行为真实发生），只是不计入核心进度 |

    - `utils/theoryMeta.ts` 增 `isSupplementalChapter` / `getCoreChaptersOfLevel` / `getSupplementalChaptersOfLevel` / `getCoreChapterCount` / `getSupplementalChapterCount`；保留 `getTotalChapterCount` 原语义（总章数）以免影响既有调用方
    - `isLevelUnlockedByCompleted` / `isLevelFullyCompleted` 的 `.every()` 只遍历 core；`getNextChapterSummary`：当前章为 core 时优先同变体下一个 core、无 core 则回退到下一个增补章；当前章为增补章时按扁平顺序取下一章
    - **不回锁**：core 过滤是纯读取计算，`completedChapters` 里的增补 id 不改变任何判定——老用户数据无需迁移，回滚增补章后残留的增补完成 id 只是孤立数据，core 统计自动忽略
    - 增补章语义由副标题承载（「6-max 现金局补强（可选，不影响解锁）」），`TheoryChapterView` 的门禁逻辑不变（Level 解锁即可读），避免在已到行数上限的视图里加分支

20. **掌握度与学习路径**（产品规格见 PRD §5.27.12，展示层不门禁）：
    - `utils/theoryMastery.ts`：`MASTERY_THRESHOLDS = { mastered: 80, passing: 60 }` 与 `getMasteryState(score)`（≥80 已掌握 / 60–79 通过 / <60 待复习 / 无分未测）；`summarizeMastery(coreChapters, quizScores, chapterAttempts?)` 返回 mastered / passing / needsReview / untested / total / weakestChapterId（同分按 manifest 顺序取前者）。**优先读首次成绩 `firstScore`，无记录回退 `quizScores`**（`resolveFirstScore`）；练习最佳分另列展示。不调用任何门禁函数
    - `data/theoryPaths.ts`：三条静态路径 `sixmax-cash-core` / `postflop-deep` / `mtt-bridge`（id + 主题标签 + 成员章节 id），成员由 `pathTags` 聚合，**不新增解锁条件**，也不扩大跨模块引用面
    - 组件：`TheoryMasteryCard`（四项计数 + 最低分章复习 CTA，无分时空态改为继续学习）、`TheoryLearningPaths`（仅标准变体渲染、`x/y` 进度、CTA 指向首个未完成且已解锁的成员章、下一章锁定显示锁定提示、全完成显示已完成）；两者只在 Home 展示，不参与路由门禁
    - 守卫：路径完整性（路径 id 唯一、单路径成员不重复、成员都带对应 `pathTags`、标题与描述 key 双语齐备）+ 掌握度边界用例（79 / 80、59 / 60、无分、weakest 同分 tie-break）

21. **新增守卫与持久化边界**：
    - `src/guards/sixMaxBenchmarkGuard.test.ts`：6-max 基准跨模块单源（见第 18 条）
    - 模块内 `theoryTitleKeys` 守卫：每个标准章节在 zh/en `theory.json` 均有非空 `chapterTitle` / `chapterSubtitle`，且 zh 与数据层 `title` / `subtitle` 逐字一致——`staticKeyGuard` 只覆盖静态字面量，动态拼接的目录 key 由它兜底
    - `data/theoryIntegrity.test.ts` 增「`chapters/` 下的章节必须 `supplemental: true`」断言，防增补章混入 core 造成回锁；`utils/theoryProgress.test.ts` 增「仅缺增补章仍解锁下一级」「增补未读时 `isLevelFullyCompleted` 为真」「`getNextChapterSummary` 三条规则」与 core / 增补计数用例
    - **persist migration**：`supplemental` / `pathTags` 仍属数据层字段；2026-11 整改新增 `chapterAttempts` / `checkpoints` / `placement` / `bookmarkedChapters` / `chapterNotes`，theory store version 3→4（见第 22 条与下方迁移设计）

22. **2026-11 标准课程整改（题库独立 / 尝试语义 / 定位与工具）**：
    - **题库独立与行数豁免**：全部 quiz 从 `standardLevelN.ts` / `chapters/t*.ts` 迁入 `data/levels/variants/standard/quizBank/t1..t9.ts`（每文件 `Record<chapterId, TheoryQuizQuestion[]>`）；`applyStandardQuizBank` 按 chapterId 注入、按题号排序、去重并校验 `<chapterId>-q<n>`。运行时 `loaders.ts` 用 `import.meta.glob('./variants/standard/quizBank/t*.ts')` 按 Level 懒加载；静态聚合 `variants/standard/index.ts` 直接 import 全部 9 个文件（仅测试/静态路径）。level/chapter 文件保留 `quiz: []` 占位。quizBank 为课程内容数据文件，按 `docs/AI_GUIDE.md` §文件大小 的课程内容豁免不做行数限制（逻辑文件仍受 ≤300 / >400 约束）
    - **抽题**：`utils/quizDraw.ts` 以 `hash(chapterId#attemptNumber)` 为种子，从完整题库抽 5 题（T1–T3）/6 题（T4–T9）；attemptNumber = 已持久化 attempts + 1，刷新稳定、重考换题；选项重排仍走 `quizOrder.ts`
    - **尝试与掌握度**：`TheoryProgress` v4 增 `chapterAttempts`（attempts/firstScore/firstCorrect/firstTotal/bestScore/lastScore/lastAt）、`checkpoints`、`placement`、`bookmarkedChapters`、`chapterNotes`。`recordChapterAttempt` 总是记录尝试；首次写 `completedChapters`/`firstScore`/`quizScores` 并 emit；重考只更新 best/last 与 SRS，不更新 ELO/recordAnswer/掌握度。`theoryMastery` 优先读 firstScore，老数据回退 quizScores
    - **定位测评**：`data/placementQuestions.ts`（16 题）+ `utils/placement.ts`；分档 0–5/6–10/11–13/14–16 → T1/T2/T4/T6；`placement.creditLevels` 为推荐起点之前的 Level 并集，只放宽解锁、不写 completedChapters；解锁唯一入口 `isLevelUnlockedByCompleted(levelId, completed, creditLevels)`
    - **Level checkpoint**：`utils/checkpoint.ts` 从该级核心章抽 12 题并标注来源章/维度；仅 `isLevelFullyCompleted` 可进；`recordCheckpointAttempt` 持久化 score/questionIds；首轮按题更新 ELO，重考不更新；错题按来源章进 SRS；不解锁、不发证
    - **跨模块数据源**：`shared/types/theoryDataSource.ts` + `shared/stores/theoryDataSourceRegistry.ts`；`theory-academy/store.bootstrap.ts` 注册 `findNextChapter` / `getRecommendedChapter` / `subscribe`。理论 store 的完成态是权威，调用方传入列表仅作补充（progress 传的是策略课时 id）；progress 每日计划消费 registry，不 import theory
    - **学习工具与内容运营**：`data/glossary.ts`（57 词）、`data/bibliography.ts`（10 本）、`data/contentOps.ts`（44 章 lastReviewed）；术语/书目的文案在 `locales/<lng>/theory-content/glossary.json`，由 `i18n/theoryContent.ts` 的 `loadTheoryContentBundle('glossary')` 显式加载（`useTheoryContentBundle` hook），路由与首页工具弹层都等待就绪后再渲染；`TheorySearch` 目录+术语+书目同步检索，正文按需 `loadTheoryLevelsForVariant(activeVariant)` 并缓存（目录与全文均跟随理论 store 当前变体）
    - **富内容块**：`TheorySection.data` 增 table / range-matrix / decision-tree；数据放 `data/levels/variants/standard/blocks/t*.ts`，由 `applyContentBlocks` 追加到正文尾部（不改既有索引）；结构化数据只放语言中立 token/数字，说明文字走既有 content key
    - **每日计划**：progress `dailyTrainingPlan.ts` 新增 `theory-review`（到期理论 SRS → `/theory/review`）与 `theory-chapter`（registry 下一章）；通用 review 卡排除 theory 项，5 槽上限与 late registration 订阅由 `useTheoryPlanRevision` 处理
    - **路由**：新增 `/theory/placement`、`/theory/checkpoint/:levelId`、`/theory/glossary`、`/theory/search`、`/theory/bibliography`，均 lazy + LazyWrapper，复用 `/theory` i18n 分组

23. **单挑变体全量对齐（2026-11）**：变体内容不再延期，标准与单挑共用同一条「章节组合 → 题库注入 → 富文本块追加」链路；短牌内容不在本批范围。
    - **章节与文件布局**：单挑核心章 37 章（T4 / T5 各 5、T6 / T7 / T8 各 4、T9 6），新增章一律独立单文件 `data/levels/variants/heads-up/chapters/t<level>hu-<topic>.ts`（单元素数组导出 `HEADS_UP_CHAPTERS`），Level 文件只保留存量核心章；`chapters/` 目录只放数据文件（禁测试文件，否则 eager glob 误匹配），`id` 前缀 `t<level>hu-` 是 Level 归属的事实源
    - **组合单源** `data/levels/variants/composeVariantChapters.ts`：顺序固定为「core + 额外章按 order 排序 → 附加 `chapterPracticeMap` 实践推荐 → 变体元数据打标（仅 standard）→ 追加富文本块 → 替换题库」。静态聚合 `heads-up/index.ts` 用 eager `import.meta.glob` 吸收 `chapters/t*hu-*.ts` / `quizBank/t*hu.ts` / `blocks/t*hu.ts`（内容轨新增文件无需改聚合清单，消除单写者冲突），运行时 `loaders.ts` 把原 standard 专属 glob 泛化为按 `PokerVariant` 查表（short-deck 为空映射，去掉了「非 standard 提前 return」分支），两路径共用同一函数。一致性由 `headsUpStaticRuntimeParity.test.ts` 深比较章节 id / order / content / quiz 兜底
    - **独立题库与富文本块**：题库 `heads-up/quizBank/t1hu..t9hu.ts`（`Record<chapterId, TheoryQuizQuestion[]>`，每章 8–12 题，题 id `<chapterId>-q<n>` 全局唯一，旧题逐字迁移、题号与选项顺序不变）；块 `heads-up/blocks/t2hu.ts`、`t4hu..t9hu.ts`（table / decision-tree / range-matrix，只追加到 `content` 尾部以保住下标型 i18n key）。注入器泛化为 `variants/applyQuizBank.ts` 的 `applyTheoryQuizBank`（`strict: true` 时题库出现未知章节键即抛错，单挑启用）与 `variants/applyContentBlocks.ts` 的 `applyTheoryContentBlocks`；`standard/quizBank/applyQuizBank.ts` / `standard/blocks/applyContentBlocks.ts` 改为别名再导出，既有 import 与测试不动。合并与抽题仍复用 shared `mergeQuizBank` / `drawByAttempt`
    - **行数豁免边界（2026-11 起）**：课程内容数据文件不做行数限制——理论 `levels/variants` 的 Level / `chapters/` / `quizBank/` / `blocks/` 与策略 `lessons/variants` / `localLessons` / `basicsContent` 均豁免；逻辑文件（`composeVariantChapters` / `loaders` / `index`）仍受 ≤300 行目标 / >400 行硬失败约束
    - **共享变体规则卡**：类型 `shared/types/variantRules.ts`、单挑规则单源 `shared/constants/headsUpRules.ts`、行构造纯函数 `shared/utils/academyVariantRules.ts`、展示组件 `shared/components/academy/AcademyVariantRuleCard`（纯 props、空 items 不渲染）；理论 `TheoryVariantRuleCard` 与策略 `StrategyVariantRuleCard` 只做变体判定 + 字面量 key 翻译，文案落 `locales/<lng>/variant.json` 的 `headsUpRules.*`。理论 `types.ts` 与 `variants/variantRules.ts` 改为 shared 重导出，短牌 `shortDeckRules` 仍留理论侧；`huPositionOrderGuard` / `variantRuleCopyGuard` 的单源路径同批改到 shared
    - **存量宽限（persist v5）**：新增核心章会重锁存量用户，故 `TheoryProgress` 增 `legacyUnlockedLevels`；`isLevelUnlockedByCompleted` 增第 4 个参数，命中即解锁（只放宽门禁、不写 `completedChapters`），`findNextTheoryChapter` / `store.isTheoryLevelUnlocked` 透传。宽限名单由历史快照常量逐级推导，新用户为空（见下方迁移设计）
    - 守卫面：`variants/theoryIntegrity.test.ts` 按变体分支题量（单挑 8–12 题 / 四选一，短牌保持原口径）、`heads-up/headsUpStaticRuntimeParity.test.ts`（静态聚合与 loader 深比较）、`heads-up/quizBank/quantAudit.t<n>hu.test.ts`（新增数字题逐题复算）、`variants/variantQuantAudit.test.ts`；strategy-academy `data/theoryVariantBridgeIntegrity.test.ts` 的章节引用下限随 37 章收紧，`data/discoveryData.test.ts` 覆盖单挑章节的 `contentOps.lastReviewed`

**理论学院 persist 迁移设计**（演进版本号以 store.ts 配置为唯一事实源）：
- **2026-11 v3→v4**：新增 `chapterAttempts` / `checkpoints` / `placement` / `bookmarkedChapters` / `chapterNotes`；迁移用 `quizScores` 种子化 `chapterAttempts`（attempts=1、firstScore=score、bestScore=score），其余补默认值；老用户 `completedChapters` / `quizScores` 零丢失，迁移后的已完成章不会被判为首次而重复 emit
- **2026-11 v4→v5**：单挑新增核心章落地前已解锁的存量用户不重锁。新增 `legacyUnlockedLevels`（默认 `[]`），迁移用历史快照常量（对齐前的 22 个单挑核心章 id，冻结、不随数据演进回填）逐级判断：前一 Level 的旧核心章全部完成则把当前 Level id 加入名单；已定义则原样保留。**只写宽限名单、绝不写 `completedChapters`**（新章仍需真正读完才计入完成度），新用户为空；宽限只放宽门禁，不参与完成度 / 掌握度 / 下一章口径
- `TheoryProgress` 已含 `flaggedQuestions: string[]` 与变体上下文（`activeVariant` / `variantMetadata`）字段，各版本 migrate 幂等合并默认值
- 新增幂等 action `toggleFlagQuestion(questionId)` / `switchVariant(variant)`
- 迁移版本演进历史见 `docs/CHANGELOG.md`
- 章节级桥接（`TheoryChapter.practiceRecommendations`）与章内计算演练**均未新增持久化字段**：前者是数据层字段、后者只有组件内 `useState`，`TheoryProgress` 形状不变（`store.persist-shape.test.ts` 快照未动即为证据），故 persist version 不递增
- 6-max 增补层（`supplemental` / `pathTags`）、掌握度卡与学习路径**均未新增持久化字段**：前者是数据层标记，后两者从既有 `quizScores` / `completedChapters` 派生，`TheoryProgress` 形状不变，故 persist version 不递增、不写 migrate

**章节难度标签阈值**（2026-08 定义）：
- `getChapterDifficulty(level)` 返回值 < 0.35 → 基础（success 色）
- 0.35 ≤ 值 < 0.6 → 进阶（warning 色）
- ≥ 0.6 → 高级（danger 色）

**目标章节推导**：
- 口径：「首个未完成章节，全完成则回到第一章」；`TheoryLadder` 的展开直达与 `TheoryResume` 的「继续阅读」CTA 按同一口径**内联实现**
- `utils/theoryProgress.ts` 保留同口径纯函数 `getLevelTargetChapter(level, completedChapters)`，当前无生产消费方（THY-006 删除 TheoryLearningMap / TheoryLevelCard 后遗留），登记为待收敛/死代码候选

**章节切换骨架屏**（2026-08）：
- TheoryChapterView 的 trackedChapterId 渲染期重置时同步置位 isTransitioning
- 150ms 后恢复渲染新章节内容（ComponentSkeleton 过渡）

**变体课程体系**（P2 变体支持，2026-08）：
- 数据位置：`data/levels/variants/`（`variantRules.ts` + `standard/`、`short-deck/`、`heads-up/` 三变体平级子目录 + `index.ts` + `theoryIntegrity.test.ts`）；三变体均按「每 Level 单文件」组织（如 `short-deck/shortDeckLevel1.ts` ~ `shortDeckLevel9.ts`），各 `index.ts` 聚合导出 `standardLevels` / `shortDeckLevels` / `headsUpLevels`
- 索引：`variants/index.ts` 导出 `ALL_VARIANT_THEORY_LEVELS`（标准 + 短牌 + 单挑总索引）与 `getTheoryLevelsByVariant(variant)` 查询函数（TheoryHome 按 activeVariant 过滤 Level 列表）
- ID 命名：Level `t{level}{suffix}`、章节 `t{level}{suffix}-{topic}`（短牌 suffix=sd、单挑 suffix=hu），与标准系列 `t{level}` 隔离；变体完整性守卫（`variants/theoryIntegrity.test.ts`，8 用例：ID 全局唯一/前缀格式/T1-T9 全覆盖/order 连续/eloDimension 合法/tier 归属）
- 内容标准与标准系列同构：每章 content 覆盖全部 7 类段落、公式含推导、实战案例含具体牌面/位置/底池、教材引用采用「（概念源自：《教材名》作者 Ch.XX）」脚注式标注
- 内容填充进度（2026-08-06，2026-11-05 更新）：单挑 T1-T3（t1hu 概率基础 / t2hu 赔率策略 / t3hu 位置与起手牌）已填充完整内容与章末小测，practiceRecommendations 对接单挑实践课程（l7hu-stakes / l4hu-ev-adjustments / l4hu-bn-opening / l3hu-bb-defense）；单挑 T4-T9 存量章已扩到独立题库 8–12 题/章并配富文本块，15 个新章落地后共 37 章（见第 23 条）；短牌内容不在该批范围（扩章与变体认证为后续批次）
- 变体实践推荐引用的课程 ID 不纳入标准系列 `CROSS_MODULE_LESSON_IDS` 白名单（该白名单仅对照标准 LEVELS 校验），悬空风险由变体课程自身存在性保证
- **变体解锁门禁适配**：变体 Level 的解锁链在变体自己的 Level 序列内独立判定（序列内 idx=0 恒解锁，Tn 需前一 Level 全部核心章节完成；变体章节均为核心章，增补章仅存在于标准变体，见第 19 条），`isLevelUnlockedByCompleted` 通过 `ALL_VARIANT_THEORY_LEVELS` 查找 levelId 所属变体再取该变体序列，标准系列行为完全不变；章节查找（`findChapterById`/`findLevelByChapterId`/`getNextChapter`）均支持变体章节，`getNextChapter` 顺延在同一变体序列内（不跨变体）；进度计算（`getLevelProgress`/`getTotalProgress`）按当前 `activeVariant` 的序列自洽统计

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
- **冻结卡唯一消耗路径 = 手动请假**：当天尚未训练时主动用 1 张卡为今天"补出勤"（`useStreakFreeze()` → 纯函数 `applyManualFreeze`，同日仅一次、无卡/已训练/已断连 ≥3 天均返回 null）；新用户初始赠送 2 张
- **自动恢复不扣卡**：`gap = 2`（漏训 1 天）时 `updateStreak` 直接免费续接 streak +1，**不再因持有冻结卡而扣减**（历史上"有卡者反被扣卡、无卡者免费恢复"的负价值设计已废除，产品口径见 PRD §5.8.2）
- **里程碑奖励**：达成 3 / 7 / 30 / 100 / 365 天分别奖励 1 / 2 / 3 / 5 / 10 张冻结卡
- **断连口径**：漏训 1 天内自动恢复（免费）；≥2 天无窗口可救，连续天数重置并记录 `streakBrokenAt`
- **提醒动效**：`StreakTracker` 在 20:00 后未训练时火焰变红闪烁
- **庆典与分享**：`StreakCelebration.tsx` 全屏 Dialog（CSS keyframes 彩屑 / 烟花 / 光晕）；30 天及以上显示"分享"按钮，调用 `generateStreakShareCanvas` 生成 1080×1080 PNG

核心 Actions（从 PRD 5.8 迁入）：

| Action | 描述 |
|---|---|
| `recordTrainingDay()` | 更新 streak（含 gap=2 免费自动恢复），今日成功记录时触发 `checkMilestone`（幂等）。计入口径（专批 B 统一）：**任何一次实质训练完成都计入训练日**——含各训练模块会话结算、theory 章节完成、strategy 课程测验/Drill 完成（CourseView）、QuickDrill 快速/普通模式完成 |
| `useStreakFreeze()` | 手动使用一张冻结卡为今天请假，返回布尔值（判定与状态变更收敛在 `streakCalc.applyManualFreeze`） |
| `checkMilestone()` | 检查并标记新达成的里程碑，返回里程碑天数或 null |
| `awardStreakFreeze(count?)` | 奖励指定数量冻结卡（默认 1） |

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
- `seedEloFromOnboardingAbility(ability)` — 用 onboarding 定位能力（rangeKnowledge / oddsCalculation / positionalPlay / gtoUnderstanding，emotionalControl 固定 50）播种 standard 变体初始 ELO，仅 `gamesPlayed===0` 且存在非默认能力时生效（取代已移除的 `syncEloFromAcademyAbility`；调用方为 strategy-academy `store.bootstrap`）

训练模块维度映射：

| 模块 | hook | 维度 | 触发时机 |
|---|---|---|---|
| range-trainer | `useQuizEngine` 的 `recordEloForAnswer` | preflop | 答题后 / 超时 |
| pot-odds | `useOddsEloRecorder` | math | 答题后 |
| gto-simulator | `useGtoEloRecorder` | postflop | 决策提交后 |
| theory-academy | `TheoryQuiz` 直接调用 `updateElo` | 按章节 `eloDimension` 声明（五维之一） | 章末小测每题作答后 |

UI 组件：`Dashboard` 段位徽章按钮、`WeaknessAnalysis` 五维雷达图（数据源为 ELO 五维分数 0-3000）、`RankUpCelebration` 全屏升段 Dialog。

**SRS 间隔重复（SM-2 算法 / 每日混合比例）**

算法（`shared/utils/spacedRepetition.ts`，基于 SM-2）：
- `ReviewItemMetadata`：元数据接口（`front` / `back` / `options` / `source`（`range` | `odds` | `gto` | `strategy` | `theory`）/ `scenario` / `route`（复习项点击跳转的目标路由，可选）/ `params`（`t()` 插值参数），全部可选）
- `ReviewItem` 接口扩展：新增 `metadata?: ReviewItemMetadata`
- 核心函数：`processReview` / `getTodayReviewItems` / `getReviewStats` / `getDaysSinceLastReview`
- 训练模块记录器（答题后注册/更新复习项）：range-trainer `useQuizEngine.recordSrsForAnswer` / pot-odds `useOddsSrsRecorder` / gto-simulator `useGtoSrsRecorder` / theory-academy `TheoryChapterView` 经 `utils/theorySrs.ts`（见 §5.8b 第 10 条）；题目 ID 规范 `range:{position}:{hand}` / `odds:{questionId}` / `gto:{scenarioId}` / `theory:{questionId}`
- **复习项载荷的语言契约**：`label` 与 `metadata.front|back|options[].text` 存的是 **i18n key**（语言中立，随 localStorage 长期存活），渲染层 `t()` 解析；禁止写入任何语言的原文（英文环境会直接回显中文）。产品口径见 PRD §12.4.3
- **来源包按需补加载**（与上一条配对，只做其一比原状更糟）：复习队列 / 复习会话渲染于 Dashboard 与 progress 路由，而 `i18n/moduleRegistry.ts` 为控制首屏体积刻意不把 theory / rangeTrainer / potOdds / gto 归入这些分组，冷启动直达首页时 `t(key)` 原样回显 key 字面量。故 `features/progress/components/srs/useEnsureReviewSourceI18n.ts` 按当前复习项的 `metadata.source` 收集来源模块并调 `preloadI18n`（幂等，注入后经 `config.ts` 的 `bindI18nStore: 'added'` 自动重渲染，无需本地 loading 态；`strategy` 的 academy 属 CORE_MODULES 故不列出）。缓存语义遵循 §9.1 的「成功才入缓存、失败可重试、并发共享句柄」
- **跳转路由解析**：`features/progress/utils/reviewRoute.ts` 的 `getReviewRoute(item)` 为纯函数（自 `SpacedRepetitionPanel` 内联 switch 提取以便单测）：`metadata.route` 以 `/` 开头时优先，其后按 `category` 映射；`theory` 缺 route 时回退 `/theory` 主页（禁止落到 default 拼出 `/academy/lesson/theory:...` 死链），default 落 `/academy/lesson/<id>`，任何分支不得抛错（存量复习项可能没有 `metadata.route`）
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
| `useProgressStore` | `records[]` + `settings` + `onboarding` + `streak` + `eloByVariant` + `activeVariant` + `quickDrillStreak` + `quickDrillBest` + `mentorStyle` + `emotion` + `unlockedAchievements` + `achievementUnlockDates` + `freezeCardFragments` + `lastFragmentDate` + `fragmentsEarnedToday` | localStorage（persist version 以 store.ts 配置为唯一事实源，见 §9.4） |
| `usePuzzleTrainerStore` | `rushBest` + `dailyBest` + `themeBest` + `dailyCompleted` + `history` | localStorage（persist version 以 store.ts 配置为唯一事实源，见 §9.4） |
| `useStrategyAcademyStore` | `progress` + `practiceResults`（cap 200） + `basicsProgress` + `adaptiveConfig` + `recentPracticeResults` + `dailyPlan` + `certifications` + `lessonAttempts` + `placement` + `checkpoints` + `bookmarkedLessons` + `lessonNotes` + `activeTrackId` + `activeVariant`（v8 起无 `abilityAssessment` / `firstAttemptScores` / `lastAttemptScores`） | localStorage（persist version 以 store.ts 配置为唯一事实源，见 §9.4） |
| `useTheoryAcademyStore` | `progress`（completedChapters / quizScores / currentChapter / startedAt） | localStorage（persist version 以 store.ts 配置为唯一事实源，见 §9.4） |
| `useDebugModeStore` | `unlockAll` | localStorage（persist version 以 store.ts 配置为唯一事实源，见 §9.4） |

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
| `/academy/search` | StrategySearchPage（标题即时 + 正文全文懒加载） | AppLayout |
| `/academy/placement` | PlacementTestPage | AppLayout |
| `/academy/checkpoint/:level` | LevelCheckpointPage | AppLayout |
| `/academy/bookmarks` | StrategyBookmarksPage | AppLayout |
| `/academy/bibliography` | StrategyBibliographyPage | AppLayout |
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
    // 不要为 recharts 建手动 chunk：其依赖 clsx / use-sync-external-store 被
    // cn() 与 react-i18next 共享，手动 chunk 会把整库拖进首屏静态图
    if (id.includes('framer-motion')) return 'vendor-framer';
    if (id.includes('react-dom')) return 'vendor-react-dom';
  }
}
```

- 主 chunk 从 1204 kB 降至约 291 kB；2026-10 移除 recharts 手动分包、解耦学院摘要链后，首屏预载包为 **234.7KB gzip / 37 个文件**
- 图表库交由 Rolldown 自动拆分，只出现在使用图表的路由 chunk；`check-bundle-size.mjs` 断言首屏静态图不得包含 recharts
- 不要为 `strategy-academy/data/` 剩余模块建泛化手动 chunk：Vite 的动态 import 预载 helper / mapDeps 会被并入该 chunk，启动层经 `academyCourse` 连带整条学院摘要链；现有规则只按 manifest / 单 Level / 变体等明确边界拆分
- 课程/题库大数据文件独立 chunk，按需加载

### 8.4 IndexedDB 大容量存储

手牌历史数据量大（单条手牌含完整动作序列），使用 IndexedDB 而非 localStorage：
- 无 5MB 容量限制
- 支持异步批量读写
- 原生事务支持

### 8.5 启动非阻塞与图表懒载（2026-10）

- **首屏闸门**：`main.tsx` 只等待 progress store 的 persist hydration（localStorage 同步层，3s 超时兜底）；`initProgressStore()`（IndexedDB records 回填 + 训练事件订阅）与三学院 `store.bootstrap`（成就/课程数据源注册）在后台并行执行。records 更新经 zustand selector 触发重渲染，数据源经 `useAcademyDataSource` 的 late-registration 自愈接续，无需阻塞首屏。
- **图表懒载**：使用 recharts 的组件（AccuracyChart / WeaknessAnalysis / ModuleStatsPage / HandStatsPanel / EquityChart / pot-odds EVCalculator）统一 `React.lazy` + `Suspense`；图表页首包从 114–118KB 降至 8.5–9.8KB gzip，recharts 在骨架绘制后按需下载。
- **framer-motion 保留**：`MotionConfig reducedMotion="user"` 是全站 80 个 framer 组件的统一 reduced-motion 接管点，移除会使动画不再遵循用户偏好（WCAG 2.1 AA 回归）；因此首屏保留 vendor-framer（约 42.2KB gzip），作为有意预算项。
- **体积守卫**：`check-bundle-size.mjs` 除首屏总预算外，额外断言首屏静态图不得包含 recharts；入口 `<script>` 已纳入统计。
- **实浏览器验证（2026-10）**：Playwright 对生产构建预览验证桌面 1440×900 与移动 390×844 关键页；理论章节页只请求单个 Level 数据包，图表页 recharts 在骨架后加载，无控制台错误与横向溢出。`document.title` 的应用名改用 `nav.appSubtitle`，英文界面不再残留中文平台名。

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
>
> 语言切换重渲染机制：core 模块（zh/en 静态同置内存）经 `languageChanged` 事件即时切换；feature 懒加载模块由 `preload.ts` 的 `languageChanged` 监听器异步补加载目标语言资源，`config.ts` 配置 `react.bindI18nStore: 'added removed'`，使 `addResourceBundle` 注入完成后触发所有 `useTranslation` 组件重渲染（默认值不订阅 store 事件会导致文案滞留 fallback 语言直至下次任意渲染）。
>
> **模块资源加载缓存语义**（事实源：`src/i18n/preload.ts` 的 `loadOne`）：`loadedKeys`（已完成集合）与 `loadPromises`（in-flight Map）双表协作——① 同一模块 key 的并发请求共享 `loadPromises` 中的同一个 Promise，不重复 `import()`；② `loadedKeys.add` **只在** `addResourceBundle` 成功之后执行，加载失败时 `.catch` 仅告警并允许下次重试（失败即标记会使该模块文案在会话余下时间永久滞留 fallback 语言）；③ `.finally` 清除 in-flight 条目。新增任何"加载 + 缓存"型工具须遵循同一顺序（成功才入缓存、失败可重试、并发共享句柄）。
>
> **theory 内容包**（`src/i18n/theoryContent.ts`）：同一缓存语义的第二实例——按 level 独立缓存、独立 in-flight；`touchedLevels` 记录已访问 level 供语言切换补载。`useTheoryContentI18n` 以 `isTheoryContentLoaded` 做渲染期同步判断（已缓存不闪骨架），en 未就绪时返回 false 触发骨架；zh 直接渲染数据层中文。
>
> **academy-course 课程文案**（`src/i18n/academyCourse.ts`）：同一缓存语义的第三实例——按文件（levelN / 变体 / local / basics / 专题）独立缓存与 in-flight；`touchedFiles` 记录已访问文件，语言切换只补目标语言的这些文件。`useAcademyCourseI18n` 负责 en 就绪门禁；zh 直接渲染数据层原文。

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
| progress | `poker-training-progress` | 以 `store.ts` persist 配置为唯一事实源 | records / settings / onboarding / streak / eloByVariant / activeVariant / quickDrillStreak / quickDrillBest / mentorStyle / emotion / unlockedAchievements / achievementUnlockDates / freezeCardFragments / lastFragmentDate / fragmentsEarnedToday |
| puzzle-trainer | `puzzle-trainer-store` | 以 `store.ts`persist 配置为唯一事实源 | rushBest / dailyBest / themeBest / dailyCompleted / history（上限 50 条）|
| strategy-academy | `strategy-academy-progress` | 以 `store.ts`persist 配置为唯一事实源 | progress（completedLessons / quizScores / currentLesson / startedAt / **completedUnits**）/ practiceResults（cap 200） / basicsProgress / adaptiveConfig / recentPracticeResults（cap 50） / dailyPlan / certifications（含 variant/totalQuestions/poolSize/questionIds）/ **lessonAttempts** / **placement**（recommendedLevelId / creditLevels / correct / total / takenAt）/ **checkpoints**（attempts / firstScore / bestScore / lastScore / questionIds / lastAt）/ **bookmarkedLessons** / **lessonNotes**（text / updatedAt，2000 字上限）/ activeTrackId / activeVariant。v8 已移除 abilityAssessment、firstAttemptScores / lastAttemptScores 镜像与 legacy attemptCertification |
| theory-academy | `theory-academy-progress` | 以 `store.ts`persist 配置为唯一事实源 | progress（completedChapters / quizScores / currentChapter / startedAt / **flaggedQuestions**）/ activeVariant / variantMetadata |
| debugMode | `poker-debug-mode` | 以 `store.ts`persist 配置为唯一事实源 | unlockAll |

> version 数值与字段清单以各 store.ts 实现为唯一事实源，本表仅作结构示意，不维护数值副本（避免漂移）。

> 自适应难度的连续答错计数使用 `emotion.consecutiveWrongCount`（v6 情绪系统字段，全局计数），不存在按模块拆分的计数字段。

---

### 9.5 游戏变体架构

#### 变体扩展统一模式

任意 feature 模块如需增加游戏变体支持（短牌/单挑/Max 等），应复用 `variants/` 子目录模式，遵循以下规范：

**1. 数据层结构**
- 在模块 data 目录下创建 `variants/` 子目录
- 每个变体对应一个 `<variant>/` 子目录，内含「每 Level 单文件」+ `index.ts` 聚合（如 theory-academy 的 `variants/standard/`、`short-deck/`、`heads-up/`，分别含 `standardLevel1.ts`~`standardLevel9.ts` 等；导出统一为 `<VARIANT>_LEVEL_<N>_CHAPTERS` / `<VARIANT>_LEVEL_<N>_LESSONS`）
- 变体间共享规则抽离到 `variants/variantRules.ts`（如 theory-academy 的 `shortDeckRules` / `headsUpRules`）
- 新增 `variants/index.ts` 汇总导出全部变体集合与辅助函数

**共享基础层契约（strategy-academy）**：策略变体的 L1/L2（规则/位置/加注大小/起手牌等变体无关的通用地基）不重复存储，由标准变体承担；`getLessonsByVariantAndLevel(variant, level)` 在查询变体 L1/L2 时自动回退引用标准共享基础层，保证变体学习路径贯通 L1-L8 且零内容重复。变体差异（牌型重排 / Ante 结构 / 位置动态）从 L3 起由变体专属课程覆盖。理论学院因各变体概率/范围/赔率均不同，其变体全覆盖 T1-T9 不适用该回退。契约由 `curriculumIntegrity.test.ts` 守卫固化。

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
| puzzle-trainer v2 → v3 | quickDrillBest 迁至 progress store：清理本模块存量字段 |
| strategy-academy v0 → v1 | 进步回放得分记录迁移：注入 `firstAttemptScores: {}` 和 `lastAttemptScores: {}` 默认值（两镜像已于 v8 删除，事实源改为 `lessonAttempts`） |
| strategy-academy v1 → v2 | practiceResults 裁剪：对超过 200 条的老数据执行 `.slice(-200)` 保留最近记录 |
| strategy-academy v2 → v3 | 认证系统升级：certifications 逐条注入 `cooldownPeriod: 24` 与 `lastAttemptAt` 默认值（validUntil 保持可选） |
| strategy-academy v3 → v4 | 小节完成状态持久化：防御性合并 progress（`{ ...initialProgress, ...progress, completedUnits: progress.completedUnits ?? {} }`），注入 `completedUnits: {}`，已有值不覆盖 |
| strategy-academy v4 → v5 | 变体上下文：注入 `activeVariant` 默认值（standard） |
| strategy-academy v5 → v6 | 课后尝试记录：由 `firstAttemptScores` / `lastAttemptScores` / `quizScores` / `completedLessons` 反推 `lessonAttempts`，已完成但无分课时补 `attempts=1` |
| strategy-academy v6 → v7 | P2 字段：注入 `placement: null` / `checkpoints: {}` / `bookmarkedLessons: []` / `lessonNotes: {}`（保留 lessonAttempts 与认证） |
| strategy-academy v7 → v8 | 技术债清理：删除 `abilityAssessment`、`firstAttemptScores` / `lastAttemptScores` 镜像与 legacy `attemptCertification`；progress / certifications / lessonAttempts / P2 字段原样保留 |
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

> 测试分层、文件命名 / 放置、判定标准、执行矩阵、责任与评审以 [`docs/testing/README.md`](./testing/README.md) 为唯一事实源；本节只保留架构级运行拓扑与 E2E 规划。

### 11.1 双项目运行拓扑（Vitest）

`vitest.config.ts` 定义两个项目：

- `unit`：Node 环境，收集 `src/**/*.test.ts`（纯函数 / store migrate / 数据完整性 / 全局守卫）。
- `component`：jsdom 环境，收集 `src/**/*.test.tsx`（组件渲染 / 交互 / a11y），setup 为 `src/setupTests.components.ts`。

Node 环境测 zustand persist migrate 需 stub `window.localStorage`（`src/shared/utils/localStorageStub.ts`），persist 形状断言用 `src/shared/utils/persistShape.ts`；hand-history 的 IndexedDB 测试使用 `fake-indexeddb/auto`（`src/features/hand-history/store.indexeddb.test.ts`）。测试文件按内容选后缀，禁止 `.spec.ts(x)` 与 `__tests__/`（不会被双项目收集，由 `testSystem.guard.test.ts` 阻断）。

### 11.2 不变式守卫

- 全局不变式集中在 `src/guards/`，清单与新增约定见 `src/guards/README.md`；守卫必须自检扫描面，allowlist 只减不增。
- i18n 全局守卫位于 `src/i18n/`；模块级数据完整性守卫留在各 feature 内。
- 测试体系自身由 `src/guards/testSystem.guard.test.ts` 守护：禁止 focused / skipped 测试、校验测试文件命名与放置、含 `describe`/`it` 的非测试文件为零、每个 feature 至少一个测试、persist store 必有 shape / migrate 测试、守卫文件与 README 清单双向一致。
- 执行入口：`pnpm test:guards`（快速层）与 `pnpm test`（全量）；`pnpm test:coverage` 仅用于覆盖率审计（v8，非门禁；规范见 `docs/testing/README.md` §7）。

### 11.3 E2E 测试（规划中，未落地）

项目尚未引入 Playwright 等 E2E 框架。在 E2E 落地前，UI / 路由 / 样式变更按 `docs/testing/README.md` §8 做真实浏览器验收并在 PR 记录证据。路由注册清单与 `/help` 静态渲染已由 `src/app/routes.test.tsx` 覆盖；训练路径仍靠手工验收。

若后续引入，优先覆盖以下关键用户流程：

1. **范围训练流程**：首页 → 选择位置 → 开始测验 → 答题 → 查看结果
2. **GTO 训练流程**：配置场景 → 生成场景 → 提交决策 → 查看反馈 → 完成会话
3. **手牌导入流程**：粘贴文本 → 检测格式 → 导入 → 列表中可见 → 回放
4. **进度查看流程**：完成训练 → Dashboard 数据更新 → 图表渲染

进入条件与当前缺口见 `docs/testing/README.md` §11。

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
3. `:root` — 暗色默认的全局 CSS 变量定义
4. `html[data-theme="light"]` — 浅色「白天牌室」原语覆盖（不写组件级 surface 补丁）
5. `@theme inline` — Tailwind v4 主题 token 映射
6. 全局基础样式（body / scrollbar / selection / focus 等）

变量命名规范：`--{类别}-{修饰符}`

**双主题语义层（v1.9.0）**：暗色为默认；light 主题只覆盖 `--felt-*` / `--walnut-*` / `--ivory-*` / `--brass-*` / `--poker-*` 原语，并新增 `--room-page` / `--room-surface` / `--room-surface-raised` / `--room-line` / `--room-ink*` / `--room-accent-text` / `--room-hairline`、`--hero-surface-gradient`、`--question-card-gradient`。组件读 semantic 层；绿呢牌桌、牌背、场景卡、HandReplayer 桌面与分享卡属物理物件，保持深色。黄铜 alpha 统一 `color-mix(in srgb, var(--brass) …)`，light 组件补丁 16 条白名单，由 `lightThemeSurfaceGuard.test.ts` 守卫。

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
| | --ivory-muted | #b0a68c（dark）/ #665b43（light） | 弱化文字 |
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
| 浅色主题 | `data-theme="light"` 翻转原语；组件读 semantic token，禁止新增逐组件补丁 |

设计约束：
- Brass 作镶嵌：1px 发丝线、激活状态、焦点环与一级主 CTA 的金属渐变（§5.5），不做大面积表面填充（§1.5 材质契约）
- 语义色始终使用固定色值，不引用装饰色变量（--gold/--clay/--sage）
- **答题选项按钮**（range-trainer QuizCard 等三选一场景）为平权选项，须三色相并立且都明显浮于呢面背景：fold=陶土红透底+红字+红边、call=胡桃木不透明实色 `--walnut-raised`+象牙字、raise=黄铜渐变；不套用「一亮 CTA + 两沉底次要」的 CTA 色阶（会导致暗按钮糊在一起、区分度不足）

### 14.5 组件主题适配

- shadcn/ui 组件通过 @theme inline 自动继承牌室主题
- 扑克牌组件（Card.tsx）使用纸质纹理渐变 + 金色高亮发光
- 侧边栏使用 `.walnut-panel` 类实现木纹质感
- `.brass-rail` 类提供面板顶部金色发丝线
- `.felt-ambient` 类提供微妙的呢面环境光
- 浅色主题：页面/面板/导航由 `--room-*` 与 `--hero-surface-gradient` 自动翻转；绿呢牌桌与牌背保持深色；light 组件补丁只保留 16 条白名单，新增补丁须先登记 DESIGN.md §2.8 与 `lightThemeSurfaceGuard`
- 标题层级：壳层唯一 h1；内容区视觉标题保留 h2，允许与页名同义/同名，**不做文案去重**（DESIGN.md §5.7 / §10.6 例外，`pageHeadingGuard` 守卫 h1 集合）

### 14.6 动画规范

- 统一使用 framer-motion 实现页面过渡和交互动画
- 标准时长：快速 150ms、常规 250ms、慢速 400ms
- 缓动函数：ease（默认）
- 翻牌动画：CSS 3D transform + perspective，300ms
- **`prefers-reduced-motion` 三层接管**（单一 CSS 兜底不足以覆盖全部动效通道）：
  1. CSS 层：`globals.css` 的 `@media (prefers-reduced-motion: reduce)` 把 `transition-duration` / `animation-duration` 压到 0.01ms，覆盖所有 CSS 驱动的动效
  2. React 层：`src/app/providers.tsx` 以 `<MotionConfig reducedMotion="user">` 包裹全树。该属性只把 **transform 类**（x/y/scale/rotate/layout）降级为瞬时跳变，**opacity 与 height 仍会过渡**
  3. 组件层：依赖上述两条覆盖不到的通道时须显式处理——`FaqAccordion` 的 `height: 0→auto` 展开用 framer-motion 的 `useReducedMotion()` 置零时长；`HelpHome` 的锚点 `scrollIntoView` 属 JS API（不受 CSS 兜底约束），按同一 hook 把 `behavior` 降为 `auto`
- 动效参数单源：React 侧引用 `src/shared/utils/motion.ts` 的 `MOTION_DURATION` / `MOTION_EASE` / 预置 variants，CSS 侧引用 `var(--poker-duration-*)` / `var(--poker-ease-*)`，禁止内联字面量与裸时长

### 14.7 UI 颜色实现规范与守卫（v1.3.2）

设计契约权威源为 `DESIGN.md`（以其当前版本为准，本文件不维护版本副本）；色彩 token 实现权威为 `src/styles/globals.css` 的 `:root`。二者之外的 `poker-ui-demo/colors_and_type.css` 为 demo 单页镜像，三者任一变更须同步。

强制规范（DESIGN.md §1.2 三不原则 / §1.3 反 SaaS 饱和色禁令）：

1. **禁止 Tailwind 霓虹调色板类**：`(bg|text|border|from|to|ring)-(red|green|blue|yellow|purple|...)-\d{2,3}`，语义反馈一律用 `--poker-*` / `--success|danger|warning|info` token（映射：green/emerald→success、red→danger、yellow/amber→brass、orange→terra、blue→info、purple→indigo）
2. **禁止纯白/纯黑文字与实底类**：`text-white`/`bg-white`/`text-black`/`bg-black`（`bg-black/NN` 半透明压暗层按 §4.2 阴影黑调豁免）
3. **禁止纯黑/纯白 hex 字面量**：`#000`/`#fff` 系
4. **SVG 例外**：渐变 stop 无法引用 CSS 变量时允许字面值，但必须注释标注对应 token（如 CardBack.tsx / public/cards/back.svg 的胡桃底 stop）

守卫机制分多层，源码、样式实现与主题补丁分别由测试把守（均随 `pnpm test` 强制执行，豁免白名单遵循「只删不加」，新增豁免须先在 DESIGN.md 登记设计依据）：

1. **源码层** `src/guards/designTokenGuard.test.ts`：`import.meta.glob('?raw')` 全量扫描 src 的 `.ts/.tsx`，断言霓虹调色板类、纯黑白类、纯黑白 hex 零匹配。
2. **样式层** `src/guards/designTokenCssGuard.test.ts`：扫描 `src/styles/*.css` 的 `background` / `background-color` 声明，断言 `rgba(255,255,255,α)` 的 α ≤ 0.05（§5.21 仅授权 hover 中性底色 0.03–0.04）、`rgba(0,0,0,α)` 未达实底、无纯黑白 hex。规则只作用于面填充，故 §4.3 牌面内描金（box-shadow 白高光）与 `@media (prefers-contrast: high)` 里刻意提到 `#ffffff` 的 `--ivory` 自定义属性天然不在射程内。该测试经 `readFileSync` 读文件而非 `import.meta.glob('?raw')`——Vitest 默认 `css: false` 会把 CSS 导入 stub 成空模块。同文件附带 help 段的结构断言（44px 触摸目标、transition 引用动效 token）。
3. **浅色主题层** `src/guards/lightThemeSurfaceGuard.test.ts`：light 组件级选择器 === 16 条 allowlist；黄铜字面 rgba 清零、黑色字面 rgba ≤ 41 条；`:root` / light 两侧必须定义 `--hero-surface-gradient` / `--question-card-gradient`。
4. **对比度层** `src/guards/feltContrast.test.ts`：暗色房间、纸张、light 房间（`--felt-deep` / `--felt` / `--felt-raised` / 浅木侧栏）的文本 token ≥ 4.5:1。
5. **Puzzle tier 层** `src/guards/actionTierPalette.guard.test.ts`：pre-answer 三档必须由 `--tier-*` 驱动且不得引用 success / danger / clay；aggressive 使用 terra；答后反馈才可用 success / danger。
6. **Emoji 层** `src/guards/emojiWhitelist.guard.test.ts`：组件层 7 文件插画 allowlist；内容层 `features/**/data/**` / `shared/data/**` / `i18n/**` 只允许成就、策略/理论正文与 i18n 既有文案；排版箭头 `↔` 单独豁免。
7. **标题层级层** `src/guards/pageHeadingGuard.test.ts`：全站 h1 allowlist；内容区视觉标题保留 h2、不做文案去重（v1.9.0 例外）。

---

## 15. 设计决策记录

### 15.1 为什么选择经典牌桌风格？

- 目标用户是德州扑克玩家，牌桌氛围能增强沉浸感和使用意愿
- 深色主题减少长时间训练的视觉疲劳
- 浅色「白天牌室」用于日间/强光环境：页面与面板转为羊皮纸/浅木，绿呢牌桌、牌背与场景卡保持深色物理物件，不是简单反相
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
