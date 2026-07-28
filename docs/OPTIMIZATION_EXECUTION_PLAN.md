# 德州扑克训练平台教学体系优化执行方案

> 基于调研报告和现有代码结构制定，每个任务明确到文件级别，可直接按步骤开发

---

## 代码现状盘点

### 已有基础（无需从零开发）

| 模块 | 文件位置 | 现有能力 |
|------|---------|---------|
| 间隔重复SRS | `src/features/progress/utils/spacedRepetition.ts` | ✅ SM-2算法完整实现、复习队列调度、难度因子调整 |
| Streak计算 | `src/features/progress/utils/streakCalc.ts` | ✅ 当前连续天数、最长连续天数、训练日历 |
| 能力评估 | `src/features/strategy-academy/store.ts` | ✅ 5维能力评分(rangeKnowledge/oddsCalculation/gtoUnderstanding/positionalPlay/emotionalControl)、自适应难度updateAbilityScore |
| 快速Drill | `src/features/strategy-academy/components/QuickDrill.tsx` | ✅ QuickDrill组件已存在 |
| 每日计划 | `src/features/strategy-academy/utils/dailyPlan.ts` | ✅ 每日训练计划生成逻辑 |
| 训练事件总线 | `src/shared/stores/trainingEvents.ts` | ✅ 训练记录自动写入store |
| 成就系统 | 已规划 | ⚠️ 基础框架已有，需扩展 |

### 需要新增/修改的模块概览

```
src/
├── features/
│   ├── onboarding/              ← 新增：新手引导模块
│   ├── puzzle-trainer/          ← 新增：扑克谜题模式
│   ├── progress/
│   │   ├── store.ts             ← 修改：扩展Streak机制
│   │   └── components/
│   │       ├── StreakCelebration.tsx  ← 新增：里程碑庆典
│   │       └── OnboardingGate.tsx     ← 新增：首次访问判断
│   └── strategy-academy/
│       ├── data/
│       │   ├── basicsContent.ts ← 修改：扩展基础Drill题库
│       │   └── localTrack.ts    ← 新增：本土化学习路径数据
│       └── components/
│           └── drills/          ← 新增：基础Drill组件目录
└── shared/
    └── types/
        └── elo.ts               ← 新增：ELO评分类型定义
```

---

## P0 阶段：第1-2周（核心体验升级）

### 🎯 P0-1：新手引导重构（预计3天）

#### 1.1 首次访问检测与引导状态存储

**文件：`src/features/progress/types.ts`** — 新增OnboardingState类型

```typescript
export interface OnboardingState {
  completed: boolean;
  currentStep: number;      // 0=欢迎, 1=定位测试, 2=首次训练, 3=庆祝, 4=目标设定, 5=完成
  placementTestScore?: number;
  initialAbility: {
    rangeKnowledge: number;
    oddsCalculation: number;
    gtoUnderstanding: number;
    positionalPlay: number;
  };
  dailyGoalMinutes: 5 | 10 | 20;
  startedAt: number;
  completedAt?: number;
}
```

**文件：`src/features/progress/store.ts`** — 添加onboarding状态

```typescript
// 在ProgressStore接口中添加
onboarding: OnboardingState;
completeOnboardingStep: (step: number, data?: Partial<OnboardingState>) => void;
skipOnboarding: () => void;
resetOnboarding: () => void;

// 初始状态
onboarding: {
  completed: false,
  currentStep: 0,
  initialAbility: { rangeKnowledge: 50, oddsCalculation: 50, gtoUnderstanding: 50, positionalPlay: 50 },
  dailyGoalMinutes: 10,
  startedAt: Date.now(),
},
```

#### 1.2 新增Onboarding模块目录

**新建目录：`src/features/onboarding/`**

```
onboarding/
├── index.ts
├── types.ts
├── store.ts                    (可复用progress store，不需要单独store)
├── components/
│   ├── OnboardingFlow.tsx      ← 主流程容器
│   ├── WelcomeStep.tsx         ← 步骤0：欢迎页（新手/有基础选择）
│   ├── PlacementTestStep.tsx   ← 步骤1：5道快速定位题
│   ├── FirstDrillStep.tsx      ← 步骤2：首次微训练（3-5题）
│   ├── CelebrationStep.tsx     ← 步骤3：首胜庆祝动画
│   └── GoalSettingStep.tsx     ← 步骤4：每日目标设定
└── data/
    └── placementQuestions.ts   ← 定位测试题库
```

#### 1.3 定位测试题库设计

**文件：`src/features/onboarding/data/placementQuestions.ts`** — 5道题覆盖4个维度

```typescript
// 题目设计原则：
// - 题1-2：牌力排名（最简单，建立信心）
// - 题3：位置认知（UTG/BTN哪个位置更有优势？）
// - 题4：底池赔率直觉（底池100，下注50，需要多少胜率？）
// - 题5：起手牌判断（BTN位K2s是否应该开池？）

export interface PlacementQuestion {
  id: string;
  dimension: 'handRanking' | 'position' | 'odds' | 'range';
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  difficulty: number;
  explanation: string;
}
```

#### 1.4 路由入口与展示逻辑

**文件：`src/app/routes.tsx`** — 添加onboarding路由

```tsx
// 在BlankLayout的children中添加
{ path: 'onboarding', element: <LazyWrapper><OnboardingFlow /></LazyWrapper> },
```

**文件：`src/features/progress/components/OnboardingGate.tsx`** — 新建组件

逻辑：
- 检查 `progressStore.onboarding.completed`
- 如果未完成且不是onboarding路由，使用Navigate重定向到 `/onboarding`
- 在AppLayout外层包裹此组件

**文件：`src/App.tsx` 或 `src/layouts/AppLayout.tsx`** — 包裹OnboardingGate

```tsx
<OnboardingGate>
  <Outlet />
</OnboardingGate>
```

#### 1.5 首次微训练设计

3-5道最简单的手牌范围题，复用range-trainer的QuizCard组件：

- 题1："AA在BTN位是否应该开池？" → 是（最简单，确保答对）
- 题2："72o在UTG位是否应该开池？" → 否
- 题3："KK是否应该3bet？" → 是
- 题4-5：根据前面答题情况动态调整难度

关键原则：**最后一题必须是简单题，确保用户以成功收尾**

> ✅ **已完成（P0-1）**
>
> 已交付 14 个 SubTask：
> - P0-1.1 `OnboardingState` 类型定义（`src/features/progress/types.ts`）
> - P0-1.2 `progress/store.ts` 扩展 onboarding 状态、3 个 actions（`completeOnboardingStep` / `skipOnboarding` / `resetOnboarding`）、`lastTrainingDate` + `recordTrainingDay` stub、persist `version: 1` + migrate 函数
> - P0-1.3 ~ P0-1.4 `src/features/onboarding/` 目录与 5 题定位测试题库（覆盖 handRanking / position / odds / range 四维度）
> - P0-1.5 `OnboardingFlow` 主容器，基于 `currentStep` 切换 5 步并自动跳转 `/`
> - P0-1.6 `WelcomeStep` 新手 / 有基础 / 跳过引导
> - P0-1.7 `PlacementTestStep` 答题后将正确率映射到 30-70 区间写入 `initialAbility`
> - P0-1.8 `FirstDrillStep` 复用 `QuizCard`，最后一题简单题 + 答错追加补救题
> - P0-1.9 `CelebrationStep` 纯 CSS 动画（撒花粒子 / 弹出 / 脉冲），调用 `recordTrainingDay()` 启动 Day 1 Streak
> - P0-1.10 `GoalSettingStep` 5/10/20 分钟三档选择
> - P0-1.11 `OnboardingGate` 组件：未完成且不在 `/onboarding` 时重定向
> - P0-1.12 `/onboarding` 路由已注册到 `BlankLayout` 下，使用 `LazyWrapper`
> - P0-1.13 `AppLayout` 用 `OnboardingGate` 包裹 `<Outlet />`
> - P0-1.14 `docs/PRD.md` 新增 5.7 章节、`zh.json` / `en.json` 新增 `onboarding.*` 文案
>
> 验证：`pnpm tsc --noEmit` 通过，`pnpm dev` 启动无报错。

---

### 🎯 P0-2：Streak机制深度升级（预计2天）

#### 2.1 扩展Streak状态

**文件：`src/features/progress/types.ts`** — 添加StreakState类型

```typescript
export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastTrainingDate: string | null;      // YYYY-MM-DD
  streakFreezes: number;               // 冻结卡数量
  streakFreezeUsedToday: boolean;
  milestones: {
    day3: boolean;
    day7: boolean;
    day30: boolean;
    day100: boolean;
    day365: boolean;
  };
  lastMilestoneCelebrated: number | null;  // 最近庆祝的里程碑天数
  streakStartDate: string | null;
}
```

**文件：`src/features/progress/store.ts`** — 添加streak状态和actions

```typescript
// 初始状态
streak: {
  currentStreak: 0,
  longestStreak: 0,
  lastTrainingDate: null,
  streakFreezes: 2,  // 新用户赠送2张冻结卡
  streakFreezeUsedToday: false,
  milestones: { day3: false, day7: false, day30: false, day100: false, day365: false },
  lastMilestoneCelebrated: null,
  streakStartDate: null,
},

// Actions
recordTrainingDay: () => void;           // 记录今日训练，更新streak
useStreakFreeze: () => boolean;          // 使用冻结卡，返回是否成功
checkMilestone: () => number | null;     // 检查是否达到新里程碑，返回里程碑天数
awardStreakFreeze: (count?: number) => void;  // 奖励冻结卡
```

#### 2.2 Streak更新逻辑

**文件：`src/features/progress/utils/streakCalc.ts`** — 扩展函数

```typescript
/**
 * 更新Streak状态（核心逻辑）
 * 规则：
 * 1. 如果今天已训练，不重复计算
 * 2. 如果昨天训练过 → streak +1
 * 3. 如果前天训练过但昨天没训练 → 有冻结卡则自动使用，streak继续；否则streak重置为1
 * 4. 如果更久之前 → streak重置为1
 */
export function updateStreak(state: StreakState): StreakState;

/**
 * 检查并返回新达成的里程碑
 */
export function checkNewMilestone(currentStreak: number, milestones: StreakState['milestones']): number | null;
```

#### 2.3 里程碑庆典组件

**新建文件：`src/features/progress/components/StreakCelebration.tsx`**

使用Dialog组件（已有shadcn/ui dialog）实现全屏庆典：

- 3天：徽章 + 奖励1张冻结卡
- 7天：金色火焰徽章 + 奖励2张冻结卡 + 简单烟花动画
- 30天：奖杯徽章 + 奖励3张冻结卡 + 全屏庆祝动画 + 分享卡片
- 100天：钻石徽章 + 特殊主题解锁
- 365天：传奇徽章 + 特殊成就

动画实现：使用CSS动画 + framer-motion（如未安装则用CSS transition）

#### 2.4 冻结卡获取渠道

在现有成就系统基础上扩展奖励：

| 触发条件 | 冻结卡奖励 |
|---------|-----------|
| 新用户首次完成onboarding | +2 |
| 完成每日挑战 | +1/天 |
| 单次训练正确率100%（≥10题） | +1 |
| Streak里程碑（3/7/30/100/365天） | +1/+2/+3/+5/+10 |
| 解锁新成就 | +1 |

**文件：`src/features/progress/components/StreakTracker.tsx`** — 修改现有组件，显示冻结卡数量

Dashboard的Streak展示区域增加：
- 冻结卡图标+数量
- 视觉紧迫感（火焰颜色随时间变化：上午正常→傍晚橙色→夜间红色闪烁）
- "你的Streak即将熄灭"提示（晚间20:00后如未训练显示）

#### 2.5 Earn Back机制

当Streak断裂后（冻结卡也用完），24小时内完成一组训练（≥5题）可以恢复Streak。

```typescript
// 在streak state中添加
streakBrokenAt: number | null;  // Streak断裂时间戳

// 逻辑：如果streakBrokenAt存在且在24小时内，完成训练可以恢复streak
canEarnBack: () => boolean;
earnBackStreak: (previousStreak: number) => void;
```

#### 2.6 社交分享卡片

**新建工具函数：`src/shared/utils/shareCard.ts`**

使用Canvas生成分享图片：
- 背景：牌桌绿呢面风格
- 文字："我在德州扑克训练平台已连续训练N天！"
- 显示当前正确率、获得的徽章
- 底部二维码/产品名

```typescript
export function generateStreakShareCanvas(days: number, stats: {
  accuracy: number;
  badges: string[];
}): Promise<Blob>;
```

> ✅ **已完成（P0-2）**
>
> 已交付 8 个 SubTask：
> - P0-2.1 `StreakState` / `StreakMilestones` / `MILESTONE_FREEZE_REWARDS` / `MILESTONE_DAYS` 类型定义（`src/features/progress/types.ts`）
> - P0-2.2 `progress/store.ts` 扩展 `streak: StreakState` 字段、6 个 actions（`recordTrainingDay` / `useStreakFreeze` / `checkMilestone` / `awardStreakFreeze` / `canEarnBack` / `earnBackStreak`）、persist `version: 2` + migrate 函数（老 `lastTrainingDate` number 时间戳转 YYYY-MM-DD string）
> - P0-2.3 `streakCalc.ts` 扩展 `updateStreak` / `checkNewMilestone` / `getTodayString` / `getYesterdayString` / `daysBetween` / `isEarnBackActive` / `EARN_BACK_WINDOW_MS`
> - P0-2.4 新建 `StreakCelebration.tsx` 全屏 Dialog（5 档徽章 🥉🔥🏆💎👑 + CSS keyframes 动画 + 30 天以上分享按钮 + 关闭时调用 `awardStreakFreeze`）
> - P0-2.5 `StreakTracker.tsx` 显示冻结卡数量 ❄️、晚间 20:00 火焰变红闪烁、挂载时检查里程碑触发庆典
> - P0-2.6 Earn Back 机制：`streakBrokenAt` 24 小时窗口、`canEarnBack` / `earnBackStreak` 恢复 streak、StreakTracker 显示"⚡ Earn Back 窗口期"
> - P0-2.7 新建 `src/shared/utils/shareCard.ts`，`generateStreakShareCanvas` 生成 1080x1080 PNG（牌桌绿呢面渐变 + 黄铜装饰）返回 Blob
> - P0-2.8 同步 `docs/PRD.md` 新增 5.8 章节、`zh.json` / `en.json` 新增 `streak.celebration.*` / `streak.freeze.*` / `streak.earnBack.*` / `streak.endingSoon` 文案
>
> 验证：`node_modules/.bin/tsc --noEmit` 通过，`pnpm dev` 启动无报错。

---

### 🎯 P0-3：基础Drill内容建设（预计3天）

#### 3.1 新增4个零基础交互式Drill

**新建目录：`src/features/strategy-academy/components/drills/`**

每个Drill都是独立组件，统一接口：

```typescript
interface DrillProps {
  onComplete: (result: { correct: number; total: number; timeTaken: number }) => void;
  onExit: () => void;
}
```

| Drill名称 | 文件 | 题量 | 时长 | 训练目标 |
|----------|------|------|------|---------|
| 牌力排名闪电战 | `HandRankingDrill.tsx` | 10题 | 2-3分钟 | 快速判断两手牌大小 |
| 位置认知训练 | `PositionDrill.tsx` | 8题 | 2分钟 | 识别6-max位置、理解位置顺序 |
| Outs速算 | `OutsDrill.tsx` | 8题 | 3分钟 | 常见听牌的Outs数量、二四法则 |
| 底池赔率直觉 | `PotOddsDrill.tsx` | 6题 | 3分钟 | 图形化赔率计算 |

#### 3.2 牌力排名闪电战设计

题目类型：
- 显示两手牌（如"As Ks" vs "Ah Qd"），选择哪个更大
- 显示一手牌+翻牌面，判断牌型（如"As Ks Qs Js Ts" → 皇家同花顺）
- 进度条显示，答对即时绿色反馈
- 最后2题设计为简单题确保成功收尾

复用现有CardSVG、HandDisplay组件。

#### 3.3 位置认知训练设计

交互式牌桌：
- 显示6-max牌桌布局
- 题目如"点击按钮位(BTN)"、"哪个位置最先行动？"
- 点击位置后即时反馈
- 配合文字解释"BTN是翻牌后最后行动的位置，具有最大位置优势"

#### 3.4 更新零基础学习路径

**文件：`src/features/strategy-academy/data/learningTracks.ts`** — 修改零基础快速入门track

```typescript
{
  id: 'track-beginner',
  name: '零基础快速入门',
  lessonIds: [
    'drill-hand-ranking',      // 新增：牌力排名
    'l1-basics',               // 规则基础
    'drill-position',          // 新增：位置认知
    'l1-position',
    'drill-outs',              // 新增：Outs速算
    'drill-pot-odds',          // 新增：底池赔率
    'l1-hand-selection',
    'l1-bankroll',
    'l1-leaks',
    'l2-raise-sizing',
  ],
  // ...
}
```

#### 3.5 注册课程ID

**文件：`src/features/strategy-academy/data/courses.ts`** — 添加Drill类型的lesson

```typescript
// 在LEVELS中Level 1添加
{
  id: 'drill-hand-ranking',
  title: '牌力排名闪电战',
  type: 'drill',
  estimatedTime: '3分钟',
  drillComponent: 'HandRankingDrill',
},
// 同理添加其他3个drill
```

---

> ✅ **已完成（P0-3）**
>
> 已交付 9 个 SubTask：
> - P0-3.1 新建 `src/features/strategy-academy/components/drills/` 目录（含 `types.ts` / `DrillLessonRouter.tsx` 与 4 个 Drill + 4 个题库文件）
> - P0-3.2 定义 `DrillProps` 统一接口（`onComplete(result: DrillResult)` / `onExit`），并定义 `ChoiceDrillQuestion` 基础题型接口与 `DrillResult` 数据契约（`correct` / `total` / `timeTaken`）
> - P0-3.3 实现 `HandRankingDrill.tsx`（10 题，3 种题型：compare-hands / identify-rank / simple-compare；最后 2 题为简单起手牌比较；复用 `CardSVG` 渲染；通过 `handRankingQuestions.ts` 提供 i18n key 驱动的题库）
> - P0-3.4 实现 `PositionDrill.tsx`（8 题，交互式 6-max 椭圆牌桌点击；`SEAT_LAYOUT` 提供百分比坐标定位；通过 `positionQuestions.ts` 提供 i18n key 驱动的题库）
> - P0-3.5 实现 `OutsDrill.tsx`（8 题，覆盖同花听牌 9 outs / OESD 8 outs / Gutshot 4 outs / 二四法则 / 高牌听顶对 6 outs；通过 `outsQuestions.ts` 提供 i18n key 驱动的题库）
> - P0-3.6 实现 `PotOddsDrill.tsx`（6 题，含 `PotVisualization` 图形化 progress bar 可视化底池/跟注比例；通过 `potOddsQuestions.ts` 提供 i18n key 驱动的题库）
> - P0-3.7 修改 `src/features/strategy-academy/data/courses.ts` 在 Level 1 注册 4 个 `type: 'drill'` lesson（`drill-hand-ranking` / `drill-position` / `drill-outs` / `drill-pot-odds`），扩展 `Lesson` 类型新增 `drillComponent?: DrillComponentName` 字段
> - P0-3.8 修改 `src/features/strategy-academy/data/learningTracks.ts` 在零基础快速入门 track 中按顺序插入 4 个 drill（保留原有课程顺序）
> - P0-3.9 同步更新 `zh.json` / `en.json` 新增 `drills.common.*` / `drills.handRanking.*` / `drills.position.*` / `drills.outs.*` / `drills.potOdds.*` i18n key（题目、选项、解析、反馈文案）；同时新增 `DrillLessonRouter.tsx`（React.lazy 懒加载 4 个 Drill 组件），修改 `CourseView.tsx` 处理 `type === 'drill'` 的 phase 流程（跳过 quiz，直接进入 done 阶段并展示训练成绩）
>
> 验证：`node_modules/.bin/tsc --noEmit` 通过，`node_modules/.bin/vite --port 5174` 启动无报错。

---

### 🎯 P0-4：反馈机制三级分类升级（预计1天）

#### 4.1 定义决策评级类型

**文件：`src/shared/types/poker.ts`** 或新建 `src/shared/types/decisionFeedback.ts`

```typescript
export type DecisionGrade = 'optimal' | 'acceptable' | 'error';

export interface DecisionFeedback {
  grade: DecisionGrade;
  evLoss: number;           // BB损失
  correctAction: string;
  explanation: string;      // 1-2句简洁解释
  relatedLessonId?: string; // 相关课程链接
}

// 评级阈值
export const GRADE_THRESHOLDS = {
  optimal: 0,       // 0 EV损失
  acceptable: 2,    // < 2BB损失
  error: Infinity,  // >= 2BB损失
};
```

#### 4.2 修改现有反馈组件

**文件：`src/features/gto-simulator/components/GTOFeedback.tsx`** — 升级反馈显示

- `optimal`：深绿色背景 + ✅ + "最优决策！"
- `acceptable`：浅绿色背景 + 🟢 + "不错，但还有更好的选择" + 显示最优动作
- `error`：橙/红色背景 + 🔴 + "这个决策损失了X BB" + 解释 + "去复习→"链接到相关课程

同理修改range-trainer的QuizCard反馈。

#### 4.3 成功收尾逻辑

在所有训练模块的题目生成逻辑中：
- 记录用户本次训练的答题情况
- 最后一题（第N题）从"简单"难度题库中抽取
- 如果当前最后一题答错了，追加一道简单题作为"补救"，让用户以正确结束

**文件：`src/features/range-trainer/hooks/useQuizEngine.ts`** 等各模块quiz hook — 添加lastQuestionEasy逻辑

> ✅ **已完成（P0-4）**
>
> 已交付 6 个 SubTask：
> - P0-4.1 新建 `src/shared/types/decisionFeedback.ts`：定义 `DecisionGrade`（optimal/acceptable/error）、`DecisionFeedback` 接口、`GRADE_THRESHOLDS` 常量、`calculateGrade` 函数、`GRADE_DISPLAY_CONFIG` 显示配置
> - P0-4.2 修改 `src/features/gto-simulator/components/GTOFeedback.tsx`：新增 `feedback?: DecisionFeedback | null` 可选 props；提供时优先使用三级显示（深绿 optimal / 浅绿 acceptable / 橙红 error），否则降级为旧二元显示；error 级附带 EV 损失与"去复习"链接（指向 `relatedLessonId`）；通过 `src/shared/types/index.ts` 统一导出
> - P0-4.3 修改 `src/features/range-trainer/components/QuizCard.tsx`：新增 `decisionFeedback?: DecisionFeedback | null` 可选 props；同步三级反馈样式与 GTOFeedback 一致
> - P0-4.4 修改 `src/features/range-trainer/hooks/useQuizEngine.ts`：新增 `getEasyQuestion()` 辅助函数（返回 AA@BTN open 题）；`startQuiz` 将末题替换为简单题；`nextQuestion` 实现补救机制（末题答错且未用过补救时追加一道简单题）；`buildResult` 返回 `lastQuestionCorrect`；`QuizSessionState` 新增 `rescueUsed: boolean` 字段
> - P0-4.5 修改 `src/features/pot-odds/hooks/useOddsCalculation.ts` 新增 `getEasyOddsQuestion()`；`PotOddsQuizPage.tsx` 实现末题替换与补救机制（`rescueUsed` / `rescueQuestions` state + `effectiveQuestions` memo）。修改 `src/features/gto-simulator/hooks/useGTOComparison.ts` 新增 `getEasyGTOScenario()`；`useScenarioEngine.generateScenarios` 将末场景替换为 BTN AA open；`useGTOSimulatorStore` 新增 `rescueUsed: boolean` 顶层状态，`nextScenario` 在末场景最后决策非最优且未用过补救时追加一道简单场景
> - P0-4.6 同步 `src/i18n/locales/zh.json` / `en.json` 新增 `feedback.grade.*` / `feedback.message.*` / `feedback.evLossLabel` / `feedback.correctAction` / `feedback.goReview` 文案；`docs/PRD.md` 新增 5.9 章节、`docs/OPTIMIZATION_EXECUTION_PLAN.md` 标记 P0-4 完成
>
> 验证：`pnpm tsc --noEmit` 通过，`pnpm dev` 启动无报错。

---

### 🎯 P0-5：首页"3分钟快速训练"入口（预计1天）

#### 5.1 Dashboard新增快速入口卡片

**文件：`src/features/progress/components/Dashboard.tsx`**

在显著位置（顶部欢迎区下方）添加大卡片：

```tsx
<div className="quick-start-card">
  <h3>⚡ 3分钟快速训练</h3>
  <p>每天5题，保持牌感</p>
  <div className="quick-start-options">
    <Button onClick={() => startQuickDrill('range')}>范围练习</Button>
    <Button onClick={() => startQuickDrill('odds')}>赔率速算</Button>
    <Button onClick={() => startQuickDrill('mixed')}>混合训练</Button>
  </div>
  {todayCompleted && <span className="completed-badge">✓ 今日已完成</span>}
</div>
```

#### 5.2 快速Drill逻辑

复用QuickDrill组件，配置为：
- 固定5题
- 难度根据用户能力自适应
- 完成后显示简洁结果（正确率+用时+XP）
- 自动计入Streak

**文件：`src/features/strategy-academy/components/QuickDrill.tsx`** — 扩展支持快速模式参数

> ✅ **已完成（P0-5）**
>
> 已交付 4 个 SubTask：
> - P0-5.1 修改 `src/features/progress/components/Dashboard.tsx`：在欢迎区下方新增"3 分钟快速训练"渐变 CTA 卡片（brass-dark → brass → brass-bright 渐变背景，复用 shadcn/ui Card/Button），含范围练习 / 赔率速算 / 混合训练三个 Button 入口，点击跳转 `/academy/quick-drill?mode=${mode}&quick=true`；通过 `streak.lastTrainingDate === getTodayString()` 判断今日已完成并显示 "✓ 今日已完成" 徽章
> - P0-5.2 扩展 `src/features/strategy-academy/components/QuickDrill.tsx`：新增 `useSearchParams` 读取 `mode` / `quick` URL 参数；快速模式固定 5 题（普通模式 8 题）；难度根据 `onboarding.initialAbility` 平均值与 `streak.currentStreak` 自适应（avg < 50 或 streak < 3 → beginner；avg ≥ 70 且 streak ≥ 7 → advanced；否则 intermediate）；支持 `mode: range | odds | mixed` 三种模式，分别映射到 `['rangeKnowledge']` / `['oddsCalculation']` / `[]` 弱点过滤；快速模式隐藏难度选择器并展示自适应难度标签
> - P0-5.3 完成时（用户答完 5 题）调用 `progressStore.recordTrainingDay()` 自动计入 Streak（内部已调用 `checkMilestone`，不重复调用）；新增 XP 计算（每题答对 +10 XP，全对额外 +20 XP 奖励）与简洁结果面板（正确率 / 平均用时 / XP 获得 / 全对奖励提示 / Streak 计入提示）
> - P0-5.4 同步 `src/i18n/locales/zh.json` / `en.json` 新增 `dashboard.quickStart.*`（title / subtitle / range / odds / mixed / completedToday）与 `quickDrill.*`（quickTitle / quickSubtitle / mode.* / difficulty.* / result.* / adaptiveDifficulty 等）i18n key；`docs/PRD.md` 新增 5.11 章节、`docs/OPTIMIZATION_EXECUTION_PLAN.md` 标记 P0-5 完成、`.trae/specs/.../tasks.md` 与 `checklist.md` 勾选 P0-5 全部项
>
> 验证：`node_modules/.bin/tsc --noEmit` 通过，`node_modules/.bin/vite --port 5176` 启动无报错。

---

## P0 阶段验收清单

- [x] 新用户首次访问自动进入Onboarding流程
- [x] 定位测试5道题完成后给出初始能力评估
- [x] 首次微训练3-5题，最后一题确保答对
- [x] 首胜庆祝动画，Day 1 Streak启动
- [x] 每日目标设定（5/10/20分钟）
- [x] Streak冻结卡机制（初始2张）
- [x] 3/7天里程碑全屏庆典
- [x] 晚间Streak即将熄灭提醒
- [x] 4个零基础Drill可正常使用
- [x] 零基础学习路径已更新
- [x] 反馈从二元升级为三级分类
- [x] 训练最后一题确保简单题
- [x] 首页"3分钟快速训练"入口
- [x] 完成训练自动计入Streak

---

## P1 阶段：第3-6周（训练模式丰富）

### 🎯 P1-1：扑克谜题（Poker Puzzle）模式（预计5天）

#### 新建目录：`src/features/puzzle-trainer/`

```
puzzle-trainer/
├── index.ts
├── types.ts
├── store.ts                (可选，用context或直接props)
├── components/
│   ├── PuzzleHome.tsx           ← 谜题模式首页
│   ├── PuzzleRush.tsx           ← 限时冲刺
│   ├── DailyPuzzle.tsx          ← 每日谜题
│   ├── ThemeDrill.tsx           ← 主题训练
│   ├── PuzzleResult.tsx         ← 结果页
│   └── PuzzleCard.tsx           ← 单题卡片组件
├── hooks/
│   └── usePuzzleEngine.ts
├── data/
│   ├── dailyPuzzles.ts          ← 每日题库（按日期种子生成）
│   ├── puzzleBank.ts            ← 题库（按主题分类）
│   └── rushQuestions.ts         ← 冲刺模式题库
└── utils/
    └── dateSeed.ts              ← 日期种子算法（同一天题目相同）
```

#### Puzzle Rush设计

- 3分钟/5分钟倒计时显示在顶部
- 连续答对5题奖励+10秒
- 答错扣一条命（共3条命），命耗尽或时间到结束
- 题目难度递增：前5题简单→中间中等→后面较难
- 结束显示：分数、正确率、个人Best Record
- 记录Best到progress store

#### 每日谜题设计

- 基于日期字符串生成种子，每天5-10题固定
- 显示"今日已有XXX人完成"（本地模拟，不联网）
- 完成后显示详细解析
- 完成状态持久化，当日重复做不改变完成状态

#### 路由注册

```tsx
// routes.tsx添加
{ path: 'puzzle', element: <LazyWrapper><PuzzleHome /></LazyWrapper> },
{ path: 'puzzle/rush', element: <LazyWrapper><PuzzleRush /></LazyWrapper> },
{ path: 'puzzle/daily', element: <LazyWrapper><DailyPuzzle /></LazyWrapper> },
{ path: 'puzzle/theme/:themeId', element: <LazyWrapper><ThemeDrill /></LazyWrapper> },
```

Dashboard和导航栏添加入口。

> ✅ **已完成（P1-1）**
>
> 已交付 15 个 SubTask：
> - P1-1.1 新建 `src/features/puzzle-trainer/` 完整目录结构（`index.ts` / `types.ts` / `store.ts` / `components/` / `hooks/` / `data/` / `utils/`）
> - P1-1.2 实现 `utils/dateSeed.ts`：基于 YYYYMMDD 字符串的 Mulberry32 种子算法，提供 `getDateSeed` / `seededRandom` / `pickBySeed` / `shuffleBySeed` / `getDailyCompletionCount`（100-999 范围本地模拟） / `getDailyKey`
> - P1-1.3 编写 `data/puzzleBank.ts`：5 主题 × 15 题（preflop-rfi / big-blind-defense / three-bet / c-bet / flush-draw），每题含 scenario / hand / position / options / correctExplanation / difficulty；导出 `PUZZLE_THEMES` 元数据与 `getPuzzlesByTheme` / `getThemeMeta` / `getAllPuzzles`
> - P1-1.4 编写 `data/dailyPuzzles.ts`：基于日期种子从全题库抽取 8 题（`DAILY_PUXZZLE_COUNT = 8`），所有人当天看到相同题目
> - P1-1.5 编写 `data/rushQuestions.ts`：难度递增题库（前 5 题 difficulty=1，中间 difficulty=2，后面 difficulty=3），导出 `RUSH_DURATIONS`（180s/300s） / `RUSH_INITIAL_LIVES=3` / `RUSH_STREAK_THRESHOLD=5` / `RUSH_STREAK_BONUS=10000`（10 秒）
> - P1-1.6 实现 `hooks/usePuzzleEngine.ts`：管理题目流 / 计时 / 命 / 连对奖励时间；提供 `answer` / `next` / `end` / `reset` / `buildResult` 等接口；Rush 模式自动检测命耗尽
> - P1-1.7 实现 `components/PuzzleCard.tsx`：单题卡片，复用 `DecisionFeedback` 三级反馈样式（optimal/acceptable/error），支持手牌 / 位置 / 公共牌 / 底池 / 下注展示与解析展开
> - P1-1.8 实现 `components/PuzzleRush.tsx`：3/5 分钟限时模式（URL 参数 `?duration=3|5`），顶部倒计时 + 3 条命心形 + 连对计数；连对 5 题奖励 +10 秒；难度递增
> - P1-1.9 实现 `components/DailyPuzzle.tsx`：每日谜题（固定 8 题，基于日期种子），完成状态持久化（`dailyCompleted[dateKey] = true` 幂等），显示"今日已有 XXX 人完成"（本地模拟 100-999）
> - P1-1.10 实现 `components/ThemeDrill.tsx`：主题训练，从 URL params 读取 `themeId` 加载该主题全部题目
> - P1-1.11 实现 `components/PuzzleResult.tsx`：结果页（分数 / 正确率 / 用时 / 平均用时 / Best Record / 答错题目列表与正确答案对照）
> - P1-1.12 实现 `components/PuzzleHome.tsx`：模式入口首页，三大模式卡片（Puzzle Rush / Daily Puzzle / Theme Drill） + 主题列表网格，显示各模式 Best Record
> - P1-1.13 修改 `src/app/routes.tsx`：注册 `/puzzle`、`/puzzle/rush`、`/puzzle/daily`、`/puzzle/theme/:themeId` 四个路由，全部使用 `LazyWrapper` 懒加载
> - P1-1.14 在 `Dashboard.tsx` 模块卡片网格添加谜题入口；`AppLayout.tsx` 侧边栏训练区添加 Puzzle 图标入口；`MobileNav.tsx` 底部导航添加谜题入口
> - P1-1.15 同步更新 `docs/PRD.md`（新增 5.12 章节）、`docs/TDD.md`（新增 puzzle-trainer 模块架构说明）、`zh.json` / `en.json` 新增 `puzzle.*` 完整 i18n 树（themes / home / card / rush / daily / theme / result / common 八个子树，中英双语齐全）
>
> 验证：`node_modules/.bin/tsc --noEmit` 通过，`node_modules/.bin/vite --port 5178` 启动无报错。

---

### 🎯 P1-2：ELO能力分级体系（预计3天）

#### 类型定义

**新建文件：`src/shared/types/elo.ts`**

```typescript
export interface EloRating {
  overall: number;
  preflop: number;
  postflop: number;
  math: number;
  handReading: number;
  mental: number;
  kFactor: number;           // K因子，新手高、老手低
  gamesPlayed: number;
  lastUpdated: number;
}

export interface Rank {
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
  description: string;
  icon: string;
}

export const RANKS: Rank[] = [
  { name: '新手', minScore: 0, maxScore: 500, color: '#9ca3af', icon: '🌱' },
  { name: '入门', minScore: 500, maxScore: 800, color: '#8ba59b', icon: '🎯' },
  { name: '进阶', minScore: 800, maxScore: 1200, color: '#7fb883', icon: '♠️' },
  { name: '中级', minScore: 1200, maxScore: 1600, color: '#c9a25e', icon: '♥️' },
  { name: '高级', minScore: 1600, maxScore: 2000, color: '#c9a25e', icon: '♦️' },
  { name: '专家', minScore: 2000, maxScore: 3000, color: '#c25a4c', icon: '♣️' },
];
```

#### ELO更新算法

**新建文件：`src/shared/utils/elo.ts`**

```typescript
/**
 * 简化ELO更新算法
 * @param currentRating 当前分数
 * @param isCorrect 是否答对
 * @param questionDifficulty 题目难度 (0=最简单, 1=最难)
 * @param kFactor K因子（默认32，新手48，高分24）
 */
export function calculateEloChange(
  currentRating: number,
  isCorrect: number,      // 0或1
  questionDifficulty: number,
  kFactor: number = 32
): number;

/**
 * 根据分数获取段位
 */
export function getRankForScore(score: number): Rank;
```

#### 集成到现有系统

**文件：`src/features/progress/store.ts`** — 添加elo字段

用EloRating替代/补充现有的abilityAssessment（abilityAssessment是0-100，ELO是0-3000，可做映射）。

训练答题后调用calculateEloChange更新对应维度分数。

**文件：`src/features/progress/components/Dashboard.tsx`** — 显示段位徽章

- 顶部显示当前段位名称+徽章+分数
- 点击查看五维雷达图（已存在，升级为ELO分数显示）
- 段位升级时触发庆祝动画

> ✅ **已完成（P1-2）**
>
> 已交付 8 个 SubTask：
> - P1-2.1 新建 `src/shared/types/elo.ts`：定义 `EloRating`（overall/preflop/postflop/math/handReading/mental/kFactor/gamesPlayed/lastUpdated）、`Rank` 接口、`RANKS` 六段位常量（新手 🌱 / 入门 🎯 / 进阶 ♠️ / 中级 ♥️ / 高级 ♦️ / 专家 ♣️，0-3000 量纲）、`DEFAULT_ELO`（500 起始分）、`RankUpEvent` 类型
> - P1-2.2 新建 `src/shared/utils/elo.ts`：实现 `calculateEloChange`（简化 ELO 公式 E=1/(1+10^((diff*800-rating+400)/400))，含动态 K 因子：新手 48 / 默认 32 / 高分 24）、`getRankForScore`、`getDynamicKFactor`、`abilityToElo`（0-100 → 300-1500 映射）、`checkRankUp`（仅返回向上跨段位事件）、`computeOverallElo`（五维平均）、`applyEloChange`（钳制 + 重算 overall/kFactor/gamesPlayed）
> - P1-2.3 修改 `src/features/progress/store.ts`：添加 `elo` / `eloRankUp` 状态字段与 `updateElo` / `resetElo` / `clearEloRankUp` / `syncEloFromAcademyAbility` actions；persist version 升级至 3，migrate 函数注入 ELO 默认值；启动时通过 setTimeout + 动态 import 从 `strategy-academy/abilityAssessment` 同步初始 ELO（仅当 `gamesPlayed===0` 时生效，避免循环依赖）
> - P1-2.4 在 `range-trainer/hooks/useQuizEngine.ts`、`pot-odds/hooks/useOddsCalculation.ts`、`gto-simulator/hooks/useGTOComparison.ts` 分别暴露 `recordEloForAnswer` 记录器，对应训练答题后更新 `preflop` / `math` / `postflop` 维度 ELO；在 `TrainingSession.tsx` / `PotOddsQuizPage.tsx` / `GTOSessionPage.tsx` 集成调用
> - P1-2.5 修改 `Dashboard.tsx`：欢迎区下方新增段位徽章按钮（icon + 名称 + overall 分数 + Trophy 图标，边框色随段位），点击跳转 `/progress` 查看五维雷达图
> - P1-2.6 升级 `WeaknessAnalysis.tsx`：数据源从 `records`（0-100 正确率）切换为 `elo`（0-3000 五维分数），维度标签更新为翻前/翻后/赔率数学/牌局阅读/心态一致性；雷达图边框/填充色随当前段位颜色变化；右上角同步展示段位徽章；`gamesPlayed===0` 时显示空状态
> - P1-2.7 新建 `RankUpCelebration.tsx` 组件：监听 `eloRankUp` 状态，弹出全屏 Dialog，含 emoji 大徽章 + 旧段位→新段位过渡展示 + CSS 彩纸粒子动画（framer-motion）；在 `Dashboard.tsx` 集成调用；5 秒后自动关闭
> - P1-2.8 同步更新 `docs/PRD.md`、`docs/TDD.md`、`docs/OPTIMIZATION_EXECUTION_PLAN.md`，新增 `elo` 与 `rankUp` i18n 键（中英双语）

---

### 🎯 P1-3：间隔重复系统落地（预计2天）✅ 已完成

现有SRS算法已完整实现，需要做的是**与实际训练题打通**：

#### 训练题注册到SRS

在range-trainer、pot-odds、gto-simulator各模块的训练完成时：
- 每道题（或每个知识点）创建ReviewItem
- 答题正确/错误后调用processReview更新
- 下次训练优先从todayReviewItems中抽取题目

**文件：`src/features/range-trainer/hooks/useQuizEngine.ts`** 等

```typescript
import { addReviewItem, processReview } from '@/features/progress/utils/spacedRepetition';
import { useProgressStore } from '@/features/progress/store';

// 答题后
const quality = isCorrect ? (timeTaken < 5000 ? 5 : 4) : 1;
const updated = processReview(reviewItem, quality);
updateReviewItem(updated);
```

#### 每日复习队列UI

**文件：`src/features/progress/components/SpacedRepetitionPanel.tsx`** — 升级现有组件

- 打开Dashboard时显示"今日待复习N题"
- 点击直接开始复习模式
- 复习题目按类别混合（范围/赔率/GTO）
- 复习完成显示"今日复习已完成 ✓"

#### 新学+复习混合

每日训练题目组成：
- 30%来自SRS复习队列
- 70%新题目/新知识点
- 根据用户正确率动态调整比例（正确率低则增加复习比例）

#### 实现说明（v1.5 落地细节）

- **P1-3.1**：`useQuizEngine.recordSrsForAnswer(question, isCorrect, timeTakenMs)`，题目 ID=`range:{position}:{hand}`，metadata.options 三选项
- **P1-3.2**：`useOddsSrsRecorder`（pot-odds）+ `useGtoSrsRecorder`（gto-simulator），ID 规范 `odds:{id}` / `gto:{id}`；GTO 仅在场景首决策节点记录
- **P1-3.3**：`features/progress/utils/dailyTrainingMix.ts` 的 `composeDailyMix` 实现：默认 30%，正确率 <0.6 → 50%，<0.4 → 70%
- **P1-3.4**：`SpacedRepetitionPanel` 升级 — `onStartReview` prop、主 CTA 按钮、进度条（基于 `lastReviewedAt` 落在今日的项数）、"已完成" / "今天没有待复习的内容"双状态
- **P1-3.5**：新增 `features/progress/components/ReviewSession.tsx`（Dialog-based）— 三种渲染模式（多选题 / 自评 / 退化自评）+ 总结页（总题数 / 答对 / 正确率 / 用时）
- **P1-3.6**：i18n 扩展 `spacedRepetition.*` 9 个新键、新增 `review.*` 命名空间 16 个键；同步更新 `docs/PRD.md` 5.14 节、`docs/TDD.md` 17.8 节
- ReviewItem 扩展 `metadata?: ReviewItemMetadata`（front / back / options / source / scenario），无需升级 persist version（可选字段，老数据自动回退）

---

### 🎯 P1-4：3分钟快速训练扩展（预计1天）✅ 已完成

在P0基础上扩展：
- 快速训练完成后计入Puzzle Rush分数
- 快速训练题目与SRS复习队列打通
- 连续7天完成快速训练额外奖励冻结卡

#### 实现说明（v1.6 落地细节）

- **P1-4.1**：`puzzle-trainer/types.ts` 新增 `QuickDrillBestRecord`（bestScore / bestAccuracy / bestTime / achievedAt）；`puzzle-trainer/store.ts` 新增 `quickDrillBest: null` 状态字段、`submitQuickDrillResult({ score, accuracy, timeTaken })` action（仅当 `score > previousBest.bestScore` 时更新，返回 `{ isNewRecord, previousBest }`）；persist version 升级 1→2，migrate 函数注入 `quickDrillBest: null`；`QuickDrill.tsx` 的 `computeQuickDrillScore(accuracy, averageTime) = round(accuracy * 100) + max(0, round((10 - averageTime) * 3))`（满分约 130，时间奖励上限 30）
- **P1-4.2**：`QuickDrill.tsx` 在 quick 模式下读取 `getTodayReviewItems(reviewItems)` 与 `getStatsSummary().overallAccuracy`，调用 `composeDailyMix(newQuestions, todayReviewItems, questionCount, userAccuracy)` 决定复习题/新题比例；`reviewItemToPracticeQuestion(item)` 仅保留 `metadata.options` 选择题，合成占位场景（heroHand `['As','Ks']` / heroPosition `BTN` / street `preflop`），将 `metadata.front ?? item.label` 放入 `previousActions`；复习题放在新题之前作为热身；`drillQuestions` useMemo 返回 `{ drillQuestions, reviewCount }`，结果面板与入口卡片按 `reviewCount > 0` / `todayReviewItems.length > 0` 显示对应提示
- **P1-4.3**：`progress/store.ts` 新增 `quickDrillStreak: 0` 与 `lastQuickDrillDate: null` 字段、`recordQuickDrillCompletion()` action（幂等：`lastQuickDrillDate === today` 直接返回；`=== yesterday` → +1；否则重置为 1；`newStreak % 7 === 0` 时调用 `awardStreakFreeze(1)` 返回 `newBadge: true`）；persist version 升级 3→4，migrate 函数注入两个字段的默认值；`QuickDrill.tsx` 的 `handleComplete` 在 quick 模式下调用并缓存 `{ newBadge, quickDrillStreak }` 用于结果面板展示
- **P1-4.4**：i18n 扩展 `quickDrill.result.reviewIncluded` / `quickDrill.reviewQueueHint` / `quickDrill.newRecord` / `quickDrill.freezeReward` / `quickDrill.streak.{current, rewarded, broken}` 共 7 个新键，zh/en 双语齐全；`docs/PRD.md` 新增 5.15 章节、`docs/OPTIMIZATION_EXECUTION_PLAN.md` 标记 P1-4 完成、`.trae/specs/.../tasks.md` 与 `checklist.md` 勾选 P1-4 全部项
- 结果面板按状态优先级显示四类提示：复习题数量（Sparkles 蓝色）→ 新纪录（Trophy 金色，仅 isNewRecord）→ 冻结卡奖励（Gift 绿色，仅 freezeRewarded）→ 当前连续天数（Zap 灰色，非奖励轮次显示）→ Streak 计入 ✓

---

## P1 阶段验收清单

- [x] Puzzle Rush 3/5分钟限时模式正常工作
- [x] 连对奖励时间、答错扣命机制正常
- [x] 每日谜题基于日期种子，当天题目固定
- [x] 主题训练按知识点分类（至少10个主题）
- [x] Best Record记录和展示
- [x] ELO评分系统正常更新
- [x] 六段位徽章正确显示
- [x] 段位升级庆祝动画
- [x] 五维雷达图使用ELO分数
- [x] SRS复习队列自动调度
- [x] 复习题目自动从队列抽取
- [x] “今日待复习”提示正常显示
- [x] 导航栏有谜题模式入口

---

## P2 阶段：第7-12周（深度与本土化）

### 🎯 P2-1：本土化学习路径（预计5天）

#### 新建本土化数据

**文件：`src/features/strategy-academy/data/localTrack.ts`**

```typescript
export const LOCAL_TRACK: LearningTrack = {
  id: 'track-local-cn',
  name: '本土低级别盈利路径',
  description: '针对国内常见Limp局/Straddle/深筹/跟注站的实战策略',
  icon: '🇨🇳',
  targetAudience: '活跃在国内低级别局的玩家',
  estimatedDuration: '8-10小时',
  color: '#ef4444',
  lessonIds: [
    // 模块1：Limp局应对
    'local-limp-intro',
    'local-limp-isolate',
    'local-limp-multiway',
    // 模块2：Ante/Straddle
    'local-straddle',
    'local-ante',
    // 模块3：深筹码调整
    'local-deep-implied-odds',
    'local-deep-suited-connectors',
    // 模块4：玩家类型剥削
    'local-exploit-calling-station',
    'local-exploit-maniac',
    'local-exploit-nit',
    'local-exploit-lag',
    // 模块5：GTO与剥削平衡
    'local-gto-vs-exploit',
    'local-when-to-deviate',
    // 模块6：情绪管理
    'mental-tilt-recognition',
    'mental-stop-loss',
    'mental-session-management',
  ],
};
```

#### 课程内容建设

每个lesson包含：
- 概念讲解（2-3段文字 + 示例牌局）
- 关键要点（3-5条bullet points）
- 3-5道配套练习题
- 常见错误提醒

#### 对手画像训练

**文件：`src/features/strategy-academy/data/opponentProfiles.ts`** — 已有，扩展为训练Drill

新增Drill：显示一系列动作数据（VPIP/PFR/AF），让用户判断对手类型并选择应对策略。

> ✅ **已完成（P2-1）**
>
> 已交付 10 个 SubTask：
> - P2-1.1 新建 `src/features/strategy-academy/data/localTrack.ts`：定义 `track-local-cn` 学习轨道，6 模块 16 课，预计 8-10 小时
> - P2-1.2 编写模块 1（Limp 局应对）3 课：`localLessons/limp.ts`（local-limp-intro / local-limp-isolate / local-limp-multiway），覆盖 Limp 局特点、隔离加注尺度、多人底池翻后应对
> - P2-1.3 编写模块 2（Ante/Straddle）2 课：`localLessons/straddle.ts`（local-straddle / local-ante），覆盖 BTN Straddle 位置优势、Ante 结构翻前范围调整
> - P2-1.4 编写模块 3（深筹码调整）2 课：`localLessons/deepStack.ts`（local-deep-implied-odds / local-deep-suited-connectors），覆盖 500BB 隐含赔率、同花连牌深筹策略、反向隐含赔率陷阱
> - P2-1.5 编写模块 4（玩家剥削）4 课：`localLessons/exploit.ts`（local-exploit-calling-station / local-exploit-maniac / local-exploit-nit / local-exploit-lag），覆盖国内 4 类常见对手的针对性剥削策略
> - P2-1.6 编写模块 5（GTO 与剥削平衡）2 课：`localLessons/gtoBalance.ts`（local-gto-vs-exploit / local-when-to-deviate），覆盖 GTO 与剥削抉择框架、基于统计偏差的具体偏离策略
> - P2-1.7 编写模块 6（情绪管理）3 课：`localLessons/mental.ts`（mental-tilt-recognition / mental-stop-loss / mental-session-management），覆盖 Tilt 识别、止损纪律、Session 管理
> - P2-1.8 扩展 `opponentProfiles.ts`：新增 `OpponentDrillQuestion` 接口与 `OPPONENT_DRILL_QUESTIONS`（8 道判断题，覆盖跟注站/Maniac/Nit/LAG/TAG/未知 6 类对手，每题含统计、近期行为、类型判断、策略选择、解析）
> - P2-1.9 在 `courses.ts` Level 7（现金桌专项）追加 16 课（通过 `...LOCAL_LESSONS` spread），在 `learningTracks.ts` 追加 `LOCAL_TRACK` 到 `LEARNING_TRACKS` 数组
> - P2-1.10 同步更新 `docs/PRD.md`（新增 11.6 章节）、`docs/OPTIMIZATION_EXECUTION_PLAN.md`（标记 P2-1 完成）、`src/i18n/locales/zh.json` 与 `en.json`（新增 `localTrack.*` 与 `opponentDrill.*` i18n 键，中英双语）

---

### 🎯 P2-2：反馈机制五级分类升级（预计2天）✅ 已完成（P2-2）

将P0的三级分类升级为五级（对标GTO Wizard）：

```typescript
export type DecisionGrade = 'best' | 'correct' | 'inaccuracy' | 'wrong' | 'blunder';

export const GRADE_THRESHOLDS = {
  best: 0,         // 最优，最高频动作
  correct: 0.5,    // < 0.5BB损失，可接受
  inaccuracy: 2,   // 0.5-2BB，小偏差
  wrong: 5,        // 2-5BB，错误
  blunder: Infinity, // >=5BB，重大错误
};
```

每级不同颜色和反馈文案。

#### 实现说明（v2.2 落地细节）

- **P2-2.1**：`src/shared/types/decisionFeedback.ts` 将 `DecisionGrade` 从 `'optimal' | 'acceptable' | 'error'` 扩展为 `'best' | 'correct' | 'inaccuracy' | 'wrong' | 'blunder'`；`GRADE_THRESHOLDS` 更新为 `best:0 / correct:0.5 / inaccuracy:2 / wrong:5 / blunder:Infinity`；`calculateGrade(evLoss)` 按新阈值返回五级；`GRADE_DISPLAY_CONFIG` 五套样式（best 深绿 🌟 / correct 浅绿 ✅ / inaccuracy 黄 🟡 / wrong 橙 🟠 / blunder 红 🔴）；新增 `migrateGrade(oldGrade)` 将旧三级映射为 `best/correct/wrong`；新增 `buildDecisionFeedback({ isCorrect, evLoss?, correctAction, ... })` 辅助不持有 evLoss 的调用方构造反馈
- **P2-2.2**：`GTOFeedback.tsx` 与 `QuizCard.tsx` 的默认文案分支扩展为五级（best/correct/inaccuracy/wrong/blunder），`grade !== 'best'` 时显示最优动作，`grade === 'wrong' || grade === 'blunder'` 时显示 explanation + "去复习" 链接；`shared/types/index.ts` 导出新增 `migrateGrade` / `buildDecisionFeedback` / `LegacyDecisionGrade`
- **P2-2.3**：`useQuizEngine` 导出 `buildRangeFeedback(isCorrect, question)`、`useOddsCalculation` 导出 `buildOddsFeedback(isCorrect, correctAction, evLossOverride?, ...)`、`useGTOComparison` 导出 `buildGtoFeedback(result, correctAction, relatedLessonId?)`（GTO 直接用 `calculateGrade(evLoss)`）；`TrainingSession.tsx` 在 `handleAnswer` / `handleTimeUp` 中同步 `setDecisionFeedback` 并作为 `decisionFeedback` prop 传入 `QuizCard`；`GTOSessionPage.tsx` 在 `GTOFeedback` 渲染时通过 IIFE 构造 `buildGtoFeedback(feedback, correctAction)` 并传入 `feedback` prop；puzzle-trainer 自动升级（`usePuzzleEngine` 已用 `calculateGrade`）
- **P2-2.4**：`zh.json` / `en.json` 添加 `feedback.grade.{best,correct,inaccuracy,wrong,blunder}` 与 `feedback.message.*` 五级 key，旧 `optimal/acceptable/error` key 保留并加 `[deprecated]` 前缀；`docs/PRD.md` 5.9 节更新为五级分类描述与验收标准
- 向后兼容：旧 `DecisionGrade` 值通过 `migrateGrade` 可映射到新五级；旧 i18n key 保留；GTOFeedback / QuizCard 的 legacy 二元显示路径（未传 `feedback` / `decisionFeedback` 时）仍可正常工作

---

### 🎯 P2-3：主题Drill扩展（预计3天）✅ 已完成

扩展Puzzle模式的主题训练到10+主题：

| 主题 | 题量 | 描述 |
|------|------|------|
| 翻前RFI | 30题 | 各位置首次加注范围 |
| 大盲防守 | 25题 | vs 各位置open的防守范围 |
| 3Bet底池 | 20题 | 3Bet时机和范围 |
| C-Bet策略 | 20题 | 翻牌持续下注 |
| 同花听牌 | 20题 | 听牌打法 |
| 河牌价值下注 | 20题 | 价值下注尺度和范围 |
| 诈唬时机 | 15题 | 成功诈唬的条件 |
| 短筹码策略 | 20题 | 20-40BB策略 |
| ICM基础 | 15题 | 锦标赛ICM概念 |
| 多人底池 | 20题 | Multiway策略 |

#### 实现说明

- **P2-3.1**：`src/features/puzzle-trainer/types.ts` 扩展 `PuzzleTheme` 联合类型新增 5 主题（river-value / bluff / short-stack / icm / multiway），新增 `PuzzleThemeCategory` 类型（preflop / postflop / river / tournament）；`data/puzzleBank.ts` 更新 `PuzzleThemeMeta` 接口添加 `category` 字段，`PUZZLE_THEMES` 数组扩展至 10 主题并附分类信息，新增 `PuzzleCategoryMeta` 接口与 `PUZZLE_CATEGORIES` 数组（4 分类）；现有 5 主题补题至目标题量（preflop-rfi 30 / big-blind-defense 25 / three-bet 20 / c-bet 20 / flush-draw 20），新增 5 主题完整题库（river-value 20 / bluff 15 / short-stack 20 / icm 15 / multiway 20），共 205 题，难度分布约 40% 简单 / 40% 中等 / 20% 难
- **P2-3.2**：`components/PuzzleHome.tsx` 主题训练入口由扁平网格改为按 `PUZZLE_CATEGORIES` 分组展示（翻前 / 翻后 / 河牌 / 锦标赛 4 组），每个主题卡片显示名称、题量、难度标识（基于题目平均难度映射初级 / 中级 / 高级）、最佳正确率；点击跳转 `/puzzle/theme/:themeId`
- **P2-3.3**：`docs/PRD.md` 5.12 节更新主题列表至 10 主题并补充分类分组映射与难度标识说明；`docs/OPTIMIZATION_EXECUTION_PLAN.md` P2-3 章节标记完成；`src/i18n/locales/zh.json` / `en.json` 添加 5 个新主题 i18n key（puzzle.themes.river-value / bluff / short-stack / icm / multiway）+ 4 个分类 key（puzzle.categories.*）+ themesUnit + 3 个 difficulty key（puzzle.home.difficulty.beginner / intermediate / advanced），双语齐全

---

### 🎯 P2-4：导师角色人格化（可选，预计2天）✅ 已完成

设计2-3个可选教练风格：

| 教练 | 风格 | 文案特点 |
|------|------|---------|
| 严谨数学派 | GTO导向 | "这一决策损失了2.3BB，从EV角度看..." |
| 老派牌手 | 经验导向 | "小子，我打了20年牌，告诉你这时候应该..." |
| 鼓励型教练 | 正向激励 | "差一点就对了！你已经比80%的玩家厉害了！" |

用户可在设置中切换教练风格，所有反馈文案随风格变化。

#### 实现说明

- **P2-4.1**：`src/shared/types/mentor.ts` 定义 `MentorStyle`（strict-math / old-school / encouraging）、`MentorProfile`、`MentorFeedbackTemplate` 类型与 `MENTOR_PROFILES` / `DEFAULT_MENTOR` 常量；通过 `src/shared/types/index.ts` 导出
- **P2-4.2**：`src/shared/constants/mentorStyles.ts` 提供 `MENTOR_FEEDBACK_TEMPLATES`（3 风格 × 5 grade = 15 个模板，含 `{evLoss}` / `{correctAction}` 占位符）与 `renderMentorFeedback(mentorStyle, grade, params)` 简单字符串替换函数（不引入模板引擎）
- **P2-4.3**：`progress/store.ts` 新增 `mentorStyle: MentorStyle` 状态字段（默认 `DEFAULT_MENTOR = 'strict-math'`）与 `setMentorStyle(style)` action；persist version 升级 4→5，migrate 函数 v4→v5 注入 `mentorStyle = DEFAULT_MENTOR`（仅新字段，不触碰 onboarding/streak/elo/quickDrillStreak 等已有字段）
- **P2-4.4**：`SettingsPage.tsx` 在"游戏变体"卡片后新增"教练风格"卡片，使用 shadcn/ui Card 渲染 3 张教练卡片（icon / name / description / voiceTone），点击切换 `setMentorStyle`，当前选中项高亮（黄铜金边框 + ring）；标签通过 useTranslation 引用 `mentor.settings.*` / `mentor.profiles.{style}.*` i18n key
- **P2-4.5**：`GTOFeedback.tsx` / `QuizCard.tsx` 读取 `progressStore.mentorStyle`，在显示 feedback 文案时优先调用 `renderMentorFeedback(mentorStyle, grade, { evLoss, correctAction })` 渲染人格化文案；缺省时降级到 i18n `feedback.message.*`；`GRADE_DISPLAY_CONFIG` 的颜色与图标保持不变（不随风格变化）
- **P2-4.6**：`docs/PRD.md` 新增 11.7 章节、`docs/OPTIMIZATION_EXECUTION_PLAN.md` 标记 P2-4 完成、`src/i18n/locales/zh.json` / `en.json` 添加 `mentor.*` i18n key（settings 4 项 + profiles.{strict-math,old-school,encouraging}.{name,description,voiceTone} 共 12 项，双语齐全）；`.trae/specs/.../tasks.md` 与 `checklist.md` 勾选 P2-4 全部项

---

### 🎯 P2-5：情绪管理模块（预计3天）✅ 已完成

- Tilt前兆识别：在用户连续答错3题以上时，显示"要不要休息一下？"提示
- Session止损：可设置每日训练题量上限，达到后提醒休息
- 下风期应对：当用户正确率连续3天下降时，展示"下风期应对指南"
- 情绪记录：可选的简单情绪标记（今天状态好/一般/差），与正确率关联展示

#### 实现说明

- **P2-5.1**：`src/features/progress/types.ts` 新增 `EmotionState` 接口（todayMood / moodDate / consecutiveWrongCount / dailyQuestionLimit / dailyQuestionsAnswered / dailyQuestionsDate / accuracyHistory / isDownswing / dailyCorrect / dailyTotal 共 10 字段）与 `DEFAULT_EMOTION_STATE` 常量；`progress/store.ts` 新增 `emotion` 状态字段与 `setTodayMood` / `recordAnswer` / `setDailyQuestionLimit` / `checkDownswing` / `resetDailyCounters` 共 5 个 actions；persist version 升级 5→6，migrate 函数 v5→v6 防御性合并注入 emotion 默认值（保留可能已存在的字段）
- **P2-5.2**：在 `range-trainer/hooks/useQuizEngine.ts`（导出 `recordAnswerForEmotion` 由 `TrainingSession` 调用）、`pot-odds/hooks/useOddsCalculation.ts`（新增 `useOddsEmotionRecorder`）、`gto-simulator/hooks/useGTOComparison.ts`（新增 `useGtoEmotionRecorder`）、`strategy-academy/components/PracticeDrill.tsx`（直接调用 `recordAnswerForEmotion`）四个训练模块的答题回调中调用 `recordAnswer(isCorrect)`，实时更新 `consecutiveWrongCount` 与 `dailyQuestionsAnswered`；`recordAnswer` 内部自动调用 `checkDownswing` 更新下风期标记
- **P2-5.3**：新建 `src/features/progress/components/TiltWarning.tsx`，监听 `emotion.consecutiveWrongCount`，仅在"从 <3 跨越到 >=3"时弹出 Dialog 一次（useRef 比较前后值），提供"休息一下"（navigate('/')）与"继续训练"（关闭 Dialog）两个按钮；在 `src/layouts/AppLayout.tsx` 全局渲染一次（覆盖所有训练页面）
- **P2-5.4**：新建 `src/features/progress/components/SessionLimitGuard.tsx`，导出 `useSessionLimitReached()` / `useSessionLimitStatus()` 两个 hook 与默认 Guard 组件；hook 内部处理跨日重置（`dailyQuestionsDate !== today` 时视为 0）；在 `RangeQuizPage.tsx` / `PotOddsQuizPage.tsx` / `GTOSessionPage.tsx` / `QuickDrill.tsx` 组件开头检查 `useSessionLimitReached()`，达到上限时返回 `<SessionLimitGuard />`；`SettingsPage.tsx` 在"训练设置"卡片新增"每日题量上限"SettingRow（0/50/100/200 四档，绑定 `emotion.dailyQuestionLimit`）
- **P2-5.5**：`checkDownswing` action 在 store 内实现（取最近 3 天 accuracyHistory，判断严格递减）；新建 `src/features/progress/components/DownswingAlert.tsx`，仅当 `emotion.isDownswing === true` 时渲染提示卡片（TrendingDown 图标 + 3 天数据展示 + "查看应对指南"按钮跳转 `/academy/lesson/mental-tilt-recognition` 课程）；在 `Dashboard.tsx` "今日挑战" 卡片后渲染
- **P2-5.6**：新建 `src/features/progress/components/MoodTracker.tsx`，提供"好 / 一般 / 差"三档情绪标记按钮（Smile / Meh / Frown 图标），点击调用 `setTodayMood`；同步展示今日正确率（来自 `dailyCorrect / dailyTotal`，含跨日防御性判断）与情绪关联文案（4 种情境：好+高正确率、差+低正确率、差+高正确率、其他）；在 `Dashboard.tsx` 渲染
- **P2-5.7**：`docs/PRD.md` 新增 11.8 章节、`docs/TDD.md` 新增 17.9 章节、`docs/OPTIMIZATION_EXECUTION_PLAN.md` 标记 P2-5 完成、`src/i18n/locales/zh.json` / `en.json` 添加 `tilt.*`（4 项）/ `sessionLimit.*`（6 项）/ `downswing.*`（3 项）/ `mood.*`（10 项）共 23 个 i18n key，双语齐全；`.trae/specs/.../tasks.md` 与 `checklist.md` 勾选 P2-5 全部项

---

## P2 阶段验收清单

- [x] “本土低级别盈利路径”完整上线（6模块16课）
- [x] Limp局、Straddle、深筹策略课程内容完成
- [x] 4类对手画像训练Drill可用
- [x] 反馈升级为五级分类+详细解释
- [x] 主题Drill扩展到10+主题
- [x] 导师角色可选（至少2个风格）
- [x] Tilt识别提示
- [x] 情绪记录功能
- [x] 所有课程配有练习题
- [x] 中文内容全部经过本土化校验

---

## 开发优先级与排期建议

### 人力分配建议（单人开发顺序）

```
Week 1:
  Day 1-2: P0-1 新手引导（OnboardingFlow + 路由 + 状态）
  Day 3: P0-1 定位测试题库 + 首次微训练
  Day 4-5: P0-2 Streak状态升级 + 更新逻辑

Week 2:
  Day 1: P0-2 Streak庆典 + 冻结卡 + 提醒
  Day 2-3: P0-3 4个基础Drill组件 + 题库
  Day 4: P0-4 三级反馈升级 + 成功收尾逻辑
  Day 5: P0-5 首页快速入口 + 测试修复

Week 3-4:
  P1-1 扑克谜题模式（5天）
  P1-2 ELO分级体系（3天）

Week 5-6:
  P1-3 SRS系统与训练题打通（2天）
  P1-4 快速训练扩展（1天）
  测试 + 修复 + 数据迁移（3天）

Week 7-10:
  P2-1 本土化路径（5天）
  P2-2 五级反馈（2天）
  P2-3 主题Drill扩展（3天）
  P2-4 导师角色（2天）
  P2-5 情绪管理（3天）
  缓冲/测试（1周）
```

### 关键文件修改影响范围

| 修改文件 | 影响模块 | 风险等级 |
|---------|---------|---------|
| `progress/store.ts` | 全局数据 | 中 — 需要做好版本迁移（persist版本升级） |
| `App.tsx` / 路由 | 导航入口 | 低 |
| `Dashboard.tsx` | 首页 | 低 — 主要是添加UI |
| 各模块quiz hooks | 训练逻辑 | 中 — 反馈升级需统一接口 |
| 新增文件 | - | 低 — 不影响现有功能 |

### 数据迁移注意事项

由于使用zustand/persist，store结构变化需要版本迁移：

```typescript
// 在persist配置中添加version和migrate
{
  name: 'poker-training-progress',
  version: 2,  // 升级版本号
  migrate: (persistedState: any, version: number) => {
    if (version < 2) {
      // 添加新字段的默认值
      return {
        ...persistedState,
        onboarding: { /* 默认值 */ },
        streak: { /* 默认值 */ },
        elo: { /* 默认值 */ },
      };
    }
    return persistedState;
  },
}
```

---

## 预期效果验证方法

P0上线后观察以下指标（可在Dashboard加个管理员统计面板，或直接从IndexedDB导出数据分析）：

| 指标 | 测量方式 | 目标值 |
|------|---------|-------|
| 新手完成Onboarding比例 | 完成onboarding用户数 / 新用户数 | ≥70% |
| 首次训练完成率 | 完成FirstDrillStep用户数 / 进入onboarding用户数 | ≥85% |
| Day 1留存（次日返回） | 第二天打开应用的新用户比例 | ≥50% |
| Day 7留存 | 7天后仍有训练记录的用户比例 | ≥40%→目标55% |
| 平均单次训练时长 | 从开始训练到结束的时间 | 5-8分钟 |
| Streak >=7天用户比例 | 所有用户中streak≥7的比例 | ≥25% |
| 使用快速训练入口比例 | 从首页快速入口开始训练的比例 | ≥40% |

---

## 总结：最小可行优化（1周可完成版本）

如果时间紧张，优先做以下**最小集**即可看到明显效果：

1. ✅ **Onboarding欢迎页 + 首次微训练**（不做定位测试，简化为直接开始3题范围训练+庆祝）
2. ✅ **Streak里程碑庆祝**（3天和7天的简单弹窗+冻结卡基础逻辑）
3. ✅ **牌力排名闪电战Drill**（10题最简单的牌力比较）
4. ✅ **首页快速训练入口**（5题快速范围练习）
5. ✅ **训练最后一题确保简单**（所有quiz hook添加此逻辑）

这5项工作量约5人天，可在1周内完成，且能显著提升新用户首日体验和留存。