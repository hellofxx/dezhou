# 游戏变体扩展设计方案
## Short Deck Hold'em & Heads-Up Support Framework

**版本**: 1.0  
**日期**: 2026-08-06  
**状态**: 框架设计草稿  
**目标**: 为短牌德州和单挑两种变体搭建理论学院和策略学院的完整架构，同时改进标准德州模块的变体扩展能力

---

## 📋 目录

1. [总体架构](#总体架构)
2. [类型体系扩展](#类型体系扩展)
3. [数据结构设计](#数据结构设计)
4. [课程大纲框架 - 理论学院](#课程大纲框架 - 理论学院)
5. [课程大纲框架 - 策略学院](#课程大纲框架 - 策略学院)
6. [进度与 ELO 系统](#进度与 elo 系统)
7. [规则差异处理](#规则差异处理)
8. [UI/UX 设计](#uiux 设计)
9. [实施路线图](#实施路线图)

---

## 🏗️ 总体架构

### 混合模式分层结构

```
┌─────────────────────────────────────────────────────┐
│          基础层 (共享) T1-T3 / L1-L2                  │
│  - 通用概念：规则、概率基础、EV 计算、位置理论等      │
│  - variant: 'standard' (唯一事实源)                 │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│       高级层 (按变体拆分) T4-T9 / L3-L8              │
├──────────────┬──────────────┬───────────────────────┤
│ Standard     │ Short Deck   │ Heads-Up              │
│ (标准德州)    │ (短牌德州)    │ (单挑)                │
│ t4s-l8s      │ t4sd-l8sd    │ t4h-l8h               │
└──────────────┴──────────────┴───────────────────────┘
```

### 决策依据

| 方案 | 优点 | 缺点 | 复杂度 | 选择理由 |
|------|------|------|--------|----------|
| 混合模式 + 完全独立 ELO | 语义清晰、避免混淆；变体策略差异大时无耦合问题 | 内容复制成本高；新玩家入门路径长 | ⭐⭐⭐⭐ | **✓ 最终选择** |
| 参数化共享体系 | 内容零重复；维护成本低 | 基础题无法体现变体特性；高级内容难以复用 | ⭐ | ❌ 排除 |
| ELO 映射方案 | 反映玩家真实水平跨变体传递 | 公式复杂；高分段失真 | ⭐⭐ | ❌ 排除 |

**推荐理由**：短牌的翻前范围（AA>KQ 反转）和单挑的位置动态（SB 翻后先行动）是结构性差异，无法用简单参数覆盖。完全独立的 ELO 系统能够准确反映玩家在每种变体中的真实水平。

---

## 🧩 类型体系扩展

### 1. PokerVariant 定义

**文件**: `src/shared/types/elo.ts` (新增)

```typescript
/** 游戏变体类型 */
export type PokerVariant = 'standard' | 'short-deck' | 'heads-up';

/** 默认变体 */
export const DEFAULT_VARIANT: PokerVariant = 'standard';

/** 所有变体列表 */
export const ALL_VARIANTS: PokerVariant[] = ['standard', 'short-deck', 'heads-up'];

/** 变体配置元信息 */
export interface VariantConfig {
  id: PokerVariant;
  name: string;
  shortName: string;
  description: string;
  icon: string;         // emoji
  color: string;        // hex for UI theming
  deckSize: number;
  maxPlayers: number;
  /** 是否启用位置解锁机制 */
  supportsPositionUnlock: boolean;
}

/** 变体常量配置 */
export const VARIANT_CONFIG: Record<PokerVariant, VariantConfig> = {
  'standard': {
    id: 'standard',
    name: 'Texas Hold\'em',
    shortName: 'Hold\'em',
    description: '标准德州扑克，52 张牌，最多 9 人桌',
    icon: '♠️',
    color: '#c9a25e',
    deckSize: 52,
    maxPlayers: 9,
    supportsPositionUnlock: true,
  },
  'short-deck': {
    id: 'short-deck',
    name: 'Short Deck Hold\'em',
    shortName: 'Short Deck',
    description: '短牌德州，36 张牌（移除 2-5），同花>顺子，AA>KQ',
    icon: '♦️',
    color: '#ef4444',
    deckSize: 36,
    maxPlayers: 6,
    supportsPositionUnlock: true,
  },
  'heads-up': {
    id: 'heads-up',
    name: 'Heads-Up Hold\'em',
    shortName: 'Heads-Up',
    description: '单挑德州，2 人对战，SB 强制 Ante，翻后 SB 先行动',
    icon: '👤',
    color: '#3b82f6',
    deckSize: 52,
    maxPlayers: 2,
    supportsPositionUnlock: false,
  },
};
```

---

## 📦 数据结构设计

### 2. Theory Academy 增强

#### TheoryChapter 扩展

**文件**: `src/features/theory-academy/types.ts`

```typescript
/** 理论章节增强 */
export interface TheoryChapter {
  id: string;                       // 格式：t<level><suffix>-<chapterKey> (如 t4s-position)
  level: TheoryLevelNumber;
  order: number;
  title: string;
  subtitle: string;
  duration: string;
  eloDimension: EloDimension;
  objectives?: string[];
  content: TheorySection[];
  quiz: TheoryQuizQuestion[];
  variant: PokerVariant;            // ← 新增：所属变体标识
  /** 变体特有规则说明（可选，用于显示规则差异提示） */
  variantRules?: VariantRuleInfo;
}

/** 变体规则信息 */
export interface VariantRuleInfo {
  deckSize: number;                 // 36/52
  handRanking?: {
    flushBeatsStraight?: true;      // 短牌：同花 > 顺子
    aceHighStraight?: string[];     // A-K-Q-J-T
    aceLowStraight?: string[];      // A-2-3-4-5
    pairBeatsAnyAceKing?: true;     // 短牌核心：口袋对 > AKo
  };
  positionDynamics?: {
    sbAnte?: boolean;               // 单挑：SB 强制 Ante
    bbFirstActionPreflop?: true;    // 单挑：BB 翻前最后行动
    sbFirstActionPostflop?: true;   // 单挑：SB 翻后先行动（反转）
  };
  blindStructure?: {
    sbAmount: number;
    bbAmount: number;
  };
  preFlopHandStrength?: {
    pairBeatsAnyAceKing?: true;     // 短牌核心规则
    suitedConnectorsStrength?: 'elevated';
  };
  [key: string]: unknown;
}

/** 理论 Level 信息增强 */
export interface TheoryLevelInfo {
  id: string;                       // t1s, t1sd, t1h
  level: TheoryLevelNumber;
  tier: TheoryTier;
  title: string;
  description: string;
  icon: string;
  chapters: TheoryChapter[];
  unlockRequirement: string;
  practiceRecommendations: PracticeRecommendation;
  variant: PokerVariant;            // ← 新增：所属变体
}
```

#### TheoryProgress 扩展

**文件**: `src/features/theory-academy/store.ts`

```typescript
export interface TheoryProgress {
  completedChapters: string[];      // 现包含 variant 前缀：['t4s-01', 't4sd-01']
  quizScores: Record<string, number>;
  currentChapter: string | null;
  startedAt: number;
  flaggedQuestions: string[];
  
  /** P2 扩展字段：当前选中的变体上下文 */
  activeVariant: PokerVariant;      // ← 新增：默认'standard'
  
  /** P2 扩展字段：各变体的独立进度元数据 */
  variantMetadata?: {
    'standard': { lastViewedAt: number; preferredOrder: number };
    'short-deck': { lastViewedAt: number; preferredOrder: number };
    'heads-up': { lastViewedAt: number; preferredOrder: number };
  };
}
```

**Migrate 策略** (persistVersion: `'1.0' → '2.0'`):
```typescript
migrate: (data) => {
  if (!data.activeVariant && data.completedChapters?.length > 0) {
    data.activeVariant = 'standard';
    data.variantMetadata = {
      standard: { lastViewedAt: Date.now(), preferredOrder: 0 },
      'short-deck': { lastViewedAt: 0, preferredOrder: 1 },
      'heads-up': { lastViewedAt: 0, preferredOrder: 2 }
    };
  }
  return data;
}
```

### 3. Strategy Academy 增强

#### Lesson 扩展

**文件**: `src/features/strategy-academy/types.ts`

```typescript
export interface Lesson {
  // ... existing fields ...
  variant: PokerVariant;            // ← 新增：l4sa, l4bsd, l4hu
  variantContext?: {
    dealerButtonPosition?: Position.HU_SB | Position.HU_BB;
    anteStructure?: 'sb_ante' | 'both_ante' | 'no_ante';
    stackDepth?: number;            // 短牌通常更浅筹码
  };
}

export interface LearningTrack {
  // ... existing fields ...
  variant: PokerVariant;
}
```

---

## 📚 课程大纲框架 - 理论学院

### 4.1 理论学院整体结构概览

```typescript
// src/features/theory-academy/data/levels/variants/index.ts

/** 所有变体的 Level 集合（供索引查询使用） */
export const ALL_VARIANT_THEORY_LEVELS: TheoryLevelInfo[] = [
  // Standard (T1-T9)
  ...STANDARD_LEVELS,
  // Short Deck (T1-T9)
  ...SHORT_DECK_LEVELS,
  // Heads-Up (T1-T9)
  ...HEADS_UP_LEVELS,
];

/** 根据变体和 Tier 过滤 */
export function getTheoryLevelsByVariant(
  variant: PokerVariant,
  tier?: TheoryTier
): TheoryLevelInfo[] {
  let levels = ALL_VARIANT_THEORY_LEVELS.filter(l => l.variant === variant);
  if (tier) levels = levels.filter(l => l.tier === tier);
  return levels;
}
```

### 4.2 标准德州（Standard）—— 保持不变

**级别分布**:
- **T1 (Basic)**: 组合计数、Outs 与 2/4 法则、方差与长期视角
- **T2 (Basic)**: EV 计算、底池赔率、隐含赔率与反向隐含赔率
- **T3 (Basic)**: 位置理论与起手牌理论
- **T4 (Intermediate)**: 范围思维、组合数学与 Blockers、范围优势与坚果优势
- **T5 (Intermediate)**: 博弈论基础、GTO 概念、MDF 与 Alpha、混合策略与节点锁定
- **T6 (Intermediate)**: 下注目的、极化与线性尺度、SPR 与几何尺度
- **T7 (Advanced)**: VPIP/PFR/AF/WTSD 指标、玩家类型学、读牌流程与剥削调整
- **T8 (Advanced)**: Tilt 识别、Session 管理、资金心理与长期心态
- **T9 (Advanced)**: MOP 要义、ICM 理论、多人底池与 GTO-剥削统一框架

### 4.3 短牌德州（Short Deck）—— T1-T9 框架

```typescript
// 关键差异点标注：
// - deckSize: 36 (移除 2-5)
// - handRanking: Flush > Straight, Pair beats AKo
// - preflop ranges: Wider openings, deeper stacks less common

export const SHORT_DECK_THEORY_LEVELS: TheoryLevelInfo[] = [
  // T1 (Basic) — 共享标准版内容，仅修改例题牌面
  {
    id: 't1sd-combinatorics',
    level: 1,
    tier: 'basic',
    title: '短牌组合学与起手牌概率',
    description: '36 张牌下的组合总数、起手牌分布与短牌专属锚点',
    icon: '🎲',
    variant: 'short-deck',
    unlockRequirement: '无',
    chapters: [
      {
        id: 't1sd-combinatorics-ch1',
        level: 1,
        order: 1,
        title: '36 张牌的手牌空间',
        subtitle: '从 1326 到 666：短牌如何改变起手牌分布',
        duration: '10 min',
        eloDimension: 'math',
        variant: 'short-deck',
        variantRules: {
          deckSize: 36,
          handRanking: {
            flushBeatsStraight: true,
            pairBeatsAnyAceKing: true,
          },
        },
        objectives: [
          '理解短牌 666 种起手牌组合数的来源',
          '掌握短牌中大对子（AA-QQ）权重提升的本质',
          '区分标准/短牌的 6/4/12 锚点差异',
        ],
        content: [],      // 待填充
        quiz: [],         // 待填充
      },
      {
        id: 't1sd-outs-ch1',
        level: 1,
        order: 2,
        title: '短牌 Outs 与胜率估算',
        subtitle: '缺小牌后的补牌变化与 2/4 法则修正',
        duration: '10 min',
        eloDimension: 'math',
        variant: 'short-deck',
        variantRules: {
          deckSize: 36,
        },
        objectives: [
          '理解短牌同花听牌 Outs 减少（9→7）的原因',
          '掌握短牌两头顺听牌 Outs 增加（8→10）的现象',
          '学会短牌 2/4 法则误差修正公式',
        ],
        content: [],
        quiz: [],
      },
      {
        id: 't1sd-variance-ch1',
        level: 1,
        order: 3,
        title: '短牌方差特征',
        subtitle: '更大波动从何而来：AA vs AK 频率对比',
        duration: '10 min',
        eloDimension: 'mental',
        variant: 'short-deck',
        variantRules: {
          preFlopHandStrength: {
            pairBeatsAnyAceKing: true,
          },
        },
        objectives: [
          '理解 AA/KK 在短牌中出现频率翻倍的意义',
          '认识短牌连续"高牌碰撞"的概率必然性',
          '将资金管理标准从 20 买入调整为 30+',
        ],
        content: [],
        quiz: [],
      },
    ],
    practiceRecommendations: {
      lessons: [
        { id: 'l3sd-aggression', title: 'Short Deck Aggression' },
        { id: 'l4sd-preflop-ranges', title: 'Short Deck Preflop Ranges' },
      ],
    },
  },

  // T2 (Basic) — 赔率体系
  {
    id: 't2sd-potodds',
    level: 2,
    tier: 'basic',
    title: '短牌赔率体系',
    description: '改动的底池赔率、隐含赔率与 set mining 策略调整',
    icon: '⚖️',
    variant: 'short-deck',
    unlockRequirement: '完成 T1 所有章节',
    chapters: [
      {
        id: 't2sd-potodds-ch1',
        level: 2,
        order: 1,
        title: '短牌底池赔率重算',
        subtitle: '命中概率变化导致的跟注阈值位移',
        duration: '10 min',
        eloDimension: 'math',
        variant: 'short-deck',
        objectives: [
          '掌握短牌同花听牌所需胜率提升（18%→23%）',
          '理解为何短牌更需要隐含赔率支持',
          '熟背短牌常见尺度→所需胜率对照表',
        ],
        content: [],
        quiz: [],
      },
      {
        id: 't2sd-implied-ch1',
        level: 2,
        order: 2,
        title: 'Set Mining 深度标准',
        subtitle: '从 15-20 倍到 25-30 倍：短牌挖 Set 的新规则',
        duration: '10 min',
        eloDimension: 'math',
        variant: 'short-deck',
        objectives: [
          '计算短牌中暗三条命中率提升（11.76%→19.6%）',
          '掌握短牌 set mining 的最小筹码深度标准',
          '理解浅筹码下 set mining 失效的条件',
        ],
        content: [],
        quiz: [],
      },
      {
        id: 't2sd-reverse-ch1',
        level: 2,
        order: 3,
        title: '短牌反向隐含赔率',
        subtitle: 'AKo 变成废纸后的风险补偿',
        duration: '10 min',
        eloDimension: 'math',
        variant: 'short-deck',
        objectives: [
          '识别短牌中 AKo 变成弱牌的风险',
          '理解非坚果同花的支配性风险',
          '学会评估短牌听牌的"击中即输"概率',
        ],
        content: [],
        quiz: [],
      },
    ],
    practiceRecommendations: {
      lessons: [
        { id: 'l3sd-implied-odds', title: 'Implied Odds in Short Deck' },
      ],
    },
  },

  // T3 (Basic) — 位置理论（短牌适配）
  {
    id: 't3sd-position',
    level: 3,
    tier: 'basic',
    title: '短牌位置与起手牌',
    description: '6-max 桌上的位置价值放大效应与起手牌重构',
    icon: '🧭',
    variant: 'short-deck',
    unlockRequirement: '完成 T2 所有章节',
    chapters: [
      {
        id: 't3sd-pos-ch1',
        level: 3,
        order: 1,
        title: '6-max 位置动态',
        subtitle: 'BTN 位置权益的进一步提升',
        duration: '10 min',
        eloDimension: 'preflop',
        variant: 'short-deck',
        objectives: [
          '量化短牌 BTN 开牌范围（约 55-60%）',
          '理解 UTG 位置范围紧缩（约 8-12%）',
          '掌握 Gap Concept 在短牌中的新数值',
        ],
        content: [],
        quiz: [],
      },
      {
        id: 't3sd-hand-ch1',
        level: 3,
        order: 2,
        title: '短牌起手牌重构',
        subtitle: 'AA>KQ 后的等级重组与边缘牌弃牌',
        duration: '10 min',
        eloDimension: 'preflop',
        variant: 'short-deck',
        variantRules: {
          preFlopHandStrength: {
            pairBeatsAnyAceKing: true,
          },
        },
        objectives: [
          '背诵短牌第一梯队（任何位置可打）：AA-KK-QQ-AAs',
          '理解 KQo/KJo 在短牌中的贬值原因',
          '掌握同花连牌 JTs+ 的价值提升',
        ],
        content: [],
        quiz: [],
      },
      {
        id: 't3sd-sklansky-ch1',
        level: 3,
        order: 3,
        title: 'Sklansky 基本定理的短牌修正',
        subtitle: '信息不足时的决策基准线调整',
        duration: '10 min',
        eloDimension: 'preflop',
        variant: 'short-deck',
        objectives: [
          '应用 Sklansky 定理判断短牌跟注边界',
          '计算对手加注范围下的最优反应',
          '理解定理在短牌高波动下的局限',
        ],
        content: [],
        quiz: [],
      },
    ],
    practiceRecommendations: {
      lessons: [
        { id: 'l3sd-range-construction', title: 'Short Deck Range Construction' },
      ],
    },
  },

  // T4-T9 (Intermediate+ Advanced) — 变体专属高阶策略
  // 以下为框架标题，待内容填充

  // T4 (Intermediate) — 范围建构
  {
    id: 't4sd-range',
    level: 4,
    tier: 'intermediate',
    title: '短牌范围思维',
    description: '短牌专属的范围构建原则、组合优势与坚果逻辑',
    icon: '🗺️',
    variant: 'short-deck',
    unlockRequirement: '完成 T3 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },

  // T5 (Intermediate) — GTO 基础
  {
    id: 't5sd-gto',
    level: 5,
    tier: 'intermediate',
    title: '短牌博弈论基础',
    description: '纳什均衡在短牌中的应用与解算器输出解读',
    icon: '♟️',
    variant: 'short-deck',
    unlockRequirement: '完成 T4 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },

  // T6 (Intermediate) — 下注理论
  {
    id: 't6sd-betting',
    level: 6,
    tier: 'intermediate',
    title: '短牌下注尺度',
    description: '极化/线性尺度、几何下注与短牌特有的 SPR 逻辑',
    icon: '💠',
    variant: 'short-deck',
    unlockRequirement: '完成 T5 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },

  // T7 (Advanced) — 对手分析
  {
    id: 't7sd-reading',
    level: 7,
    tier: 'advanced',
    title: '短牌对手阅读',
    description: '短牌特有的人类行为模式与剥削信号识别',
    icon: '🔍',
    variant: 'short-deck',
    unlockRequirement: '完成 T6 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },

  // T8 (Advanced) — 心理学
  {
    id: 't8sd-psychology',
    level: 8,
    tier: 'advanced',
    title: '短牌心理学',
    description: '高波动环境下的情绪管理与 Tilt 控制',
    icon: '🧠',
    variant: 'short-deck',
    unlockRequirement: '完成 T7 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },

  // T9 (Advanced) — 综合
  {
    id: 't9sd-integration',
    level: 9,
    tier: 'advanced',
    title: '短牌理论综合',
    description: 'GTO 与剥削的统一框架及多场景适配',
    icon: '🏛️',
    variant: 'short-deck',
    unlockRequirement: '完成 T8 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },
];
```

### 4.4 单挑（Heads-Up）—— T1-T9 框架

```typescript
export const HEADS_UP_THEORY_LEVELS: TheoryLevelInfo[] = [
  // T1 (Basic) — 概率论（单挑适配）
  {
    id: 't1hu-probability',
    level: 1,
    tier: 'basic',
    title: '单挑概率论基础',
    description: '两人对决下的组合数、起手牌分布与位置权重的重新计算',
    icon: '🎲',
    variant: 'heads-up',
    unlockRequirement: '无',
    chapters: [
      {
        id: 't1hu-combinatorics-ch1',
        level: 1,
        order: 1,
        title: '单挑手牌空间',
        subtitle: '52 张牌但两人对决：概率密度的本质变化',
        duration: '10 min',
        eloDimension: 'math',
        variant: 'heads-up',
        objectives: [
          '理解单挑起手牌组合仍为 1326，但对抗逻辑完全不同',
          '掌握单挑中大牌（AA-KK）相对价值的下降',
          '区分单挑/六路/满员桌的起手牌强度排序差异',
        ],
        content: [],
        quiz: [],
      },
      {
        id: 't1hu-outs-ch1',
        level: 1,
        order: 2,
        title: '单挑 Outs 特点',
        subtitle: '单挑听牌更容易被追：Outs 质量的重新评估',
        duration: '10 min',
        eloDimension: 'math',
        variant: 'heads-up',
        objectives: [
          '理解单挑听牌 hit 率相同但暴露风险更高的特性',
          '掌握隐藏听牌（hidden draws）的 outs 估值方法',
          '学会计算单挑中的 "有效 outs"（干净 outs）',
        ],
        content: [],
        quiz: [],
      },
      {
        id: 't1hu-variance-ch1',
        level: 1,
        order: 3,
        title: '单挑方差特征',
        subtitle: '更快的决策节奏与更高的波动密度',
        duration: 10,
        eloDimension: 'mental',
        variant: 'heads-up',
        objectives: [
          '理解单挑每百手 variance 约为 6-max 的 1.5-2 倍',
          '掌握单挑资金管理标准（建议 50+ 买入）',
          '认识快速轮换对心态的影响及管理方法',
        ],
        content: [],
        quiz: [],
      },
    ],
    practiceRecommendations: {
      lessons: [
        { id: 'l3hu-preflop-systems', title: 'Heads-Up Preflop Systems' },
        { id: 'l4hu-bn-opening', title: 'BTN Opening Strategy' },
      ],
    },
  },

  // T2 (Basic) — 期望值与赔率（单挑适配）
  {
    id: 't2hu-odds',
    level: 2,
    tier: 'basic',
    title: '单挑期望值与赔率',
    description: '1v1 下的 EV 计算简化与底池赔率的独特应用场景',
    icon: '⚖️',
    variant: 'heads-up',
    unlockRequirement: '完成 T1 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },

  // T3 (Basic) — 位置理论（单挑专属）
  {
    id: 't3hu-position',
    level: 3,
    tier: 'basic',
    title: '单挑位置动力学',
    description: 'SB/BB 位置反转与按钮等效性的深度解析',
    icon: '🧭',
    variant: 'heads-up',
    unlockRequirement: '完成 T2 所有章节',
    chapters: [
      {
        id: 't3hu-dynamics-ch1',
        level: 3,
        order: 1,
        title: 'SB/BB 角色反转',
        subtitle: '翻前 SB 先行动？翻后 SB 先行动？位置真相揭秘',
        duration: '12 min',
        eloDimension: 'preflop',
        variant: 'heads-up',
        variantRules: {
          positionDynamics: {
            sbFirstActionPostflop: true,
            bbFirstActionPreflop: true,
            sbAnte: true,
          },
        },
        objectives: [
          '理解单挑中 SB 翻前和后位的行动顺序反转',
          '掌握 BB 位作为"翻前最后一个行动者"的优势量化',
          '学会计算 SB 位在翻后的"事实上的不利位置"',
        ],
        content: [],
        quiz: [],
      },
      {
        id: 't3hu-ante-ch1',
        level: 3,
        order: 2,
        title: 'SB Ante 结构的影响',
        subtitle: '死钱前置如何改变所有街的下注逻辑',
        duration: '10 min',
        eloDimension: 'preflop',
        variant: 'heads-up',
        variantRules: {
          blindStructure: { sbAmount: 0.5, bbAmount: 1.0 },
          positionDynamics: { sbAnte: true },
        },
        objectives: [
          '计算 SB Ante 带来的底池即时赔率变化',
          '理解 SB 偷盲频率的最低要求（MDF）提升',
          '学会利用 Ante 进行低成本诈唬',
        ],
        content: [],
        quiz: [],
      },
      {
        id: 't3hu-bn-equivalence-ch1',
        level: 3,
        order: 3,
        title: 'BB 位的"伪按钮"效应',
        subtitle: '为什么 BB 在某些意义上相当于按钮',
        duration: '10 min',
        eloDimension: 'preflop',
        variant: 'heads-up',
        objectives: [
          '理解 BB 翻后先行动但翻前最后行动的"双重身份"',
          '掌握 BB 防守范围的宽度合理化',
          '学会评估 BB 位置的 implied odds 优势',
        ],
        content: [],
        quiz: [],
      },
    ],
    practiceRecommendations: {
      lessons: [
        { id: 'l4hu-position-play', title: 'Positional Play in HU' },
      ],
    },
  },

  // T4-T9 (Intermediate+ Advanced) — 单挑专属高阶策略
  // 以下为框架标题，待内容填充

  // T4 (Intermediate) — 范围建构
  {
    id: 't4hu-ranges',
    level: 4,
    tier: 'intermediate',
    title: '单挑范围建构',
    description: '1v1 下的极端宽范围与极化平衡的艺术',
    icon: '🗺️',
    variant: 'heads-up',
    unlockRequirement: '完成 T3 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },

  // T5 (Intermediate) — GTO 基础
  {
    id: 't5hu-gto',
    level: 5,
    tier: 'intermediate',
    title: '单挑博弈论基础',
    description: 'HU GTO 求解器的独特输出解读与 Nash 均衡的简化模型',
    icon: '♟️',
    variant: 'heads-up',
    unlockRequirement: '完成 T4 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },

  // T6 (Intermediate) — 下注理论
  {
    id: 't6hu-betting',
    level: 6,
    tier: 'intermediate',
    title: '单挑下注理论',
    description: '单挑特有的过牌 - 加注结构与 multi-barrel 诈唬频率',
    icon: '💠',
    variant: 'heads-up',
    unlockRequirement: '完成 T5 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },

  // T7 (Advanced) — 对手分析
  {
    id: 't7hu-reading',
    level: 7,
    tier: 'advanced',
    title: '单挑对手阅读',
    description: '有限样本下的对手倾向识别与实时剥削策略',
    icon: '🔍',
    variant: 'heads-up',
    unlockRequirement: '完成 T6 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },

  // T8 (Advanced) — 心理学
  {
    id: 't8hu-psychology',
    level: 8,
    tier: 'advanced',
    title: '单挑心理学',
    description: '面对面的心理战与持续高压下的专注力保持',
    icon: '🧠',
    variant: 'heads-up',
    unlockRequirement: '完成 T7 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },

  // T9 (Advanced) — 综合
  {
    id: 't9hu-integration',
    level: 9,
    tier: 'advanced',
    title: '单挑理论综合',
    description: 'GTO 基线 + 剥削调整 + 心理战的三位一体',
    icon: '🏛️',
    variant: 'heads-up',
    unlockRequirement: '完成 T8 所有章节',
    chapters: [],
    practiceRecommendations: { lessons: [] },
  },
];
```

---

## 🎯 课程大纲框架 - 策略学院

### 5.1 策略学院整体结构

```typescript
// src/features/strategy-academy/data/lessons/variants/index.ts

/** 所有变体的课程集合（供索引查询使用） */
export const ALL_VARIANT_LESSONS: Lesson[] = [
  // Standard L1-L8
  ...STANDARD_LESSONS,
  // Short Deck L3-L8 (L1-L2 共享标准版)
  ...SHORT_DECK_LESSONS,
  // Heads-Up L3-L8 (L1-L2 共享标准版)
  ...HEADS_UP_LESSONS,
];
```

### 5.2 短牌策略课程大纲（L3-L8）

```typescript
export const SHORT_DECK_STRATEGY_COURSES: Lesson[] = [
  // ===== Level 3: 翻后策略（短牌适应版）=====
  {
    id: 'l3sd-cbet',
    level: 3,
    order: 1,
    title: '短牌持续下注',
    subtitle: '干燥牌面的高频 C-Bet 与短牌特有的湿滑牌面处理',
    duration: '8 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l3sd-donk',
    level: 3,
    order: 2,
    title: '短牌 Donk 下注',
    subtitle: '为何短牌 Donk 比标准德州更频繁？',
    duration: '8 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l3sd-check-raise',
    level: 3,
    order: 3,
    title: '短牌 Check-Raise 结构',
    subtitle: '极化尺度的短牌优化与深筹码陷阱规避',
    duration: '10 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 4A: 进阶思维·范围与 EV（短牌版）=====
  {
    id: 'l4sd-preflop-ranges',
    level: 4,
    order: 1,
    title: '短牌翻前范围',
    subtitle: '666 种组合下的范围构建原则与位置权重',
    duration: '12 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l4sd-nuts-equity',
    level: 4,
    order: 2,
    title: '短牌坚果权益',
    subtitle: '何时坚果领先？何时被逆转？短牌坚果风险分析',
    duration: '12 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l4sd-blocker-bluff',
    level: 4,
    order: 3,
    title: '短牌 Blocker 诈唬',
    subtitle: 'A/K Blocker 在短牌中的双倍效力与 K/Q Blocker 的贬值',
    duration: '10 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 4B: 进阶思维·GTO（短牌版）=====
  {
    id: 'l4sd-gto-fundamentals',
    level: 4,
    order: 4,
    title: '短牌 GTO 基础',
    subtitle: '从标准德州到短牌：需要调整的 5 个核心原则',
    duration: '15 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l4sd-solver-readout',
    level: 4,
    order: 5,
    title: '短牌解算器输出解读',
    subtitle: 'Solver Meta、Frequency Chart 与 Action % 的短牌差异',
    duration: '15 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 5: 职业素养（短牌适应）=====
  {
    id: 'l5sd-bankroll',
    level: 5,
    order: 1,
    title: '短牌资金管理',
    subtitle: '为何短牌需要 30-50 买入而非 20？波动率量化模型',
    duration: '10 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l5sd-tilt-control',
    level: 5,
    order: 2,
    title: '短牌 Tilt 控制',
    subtitle: '高波动环境下的情绪调节技巧与"冷启动"策略',
    duration: '10 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 6: 锦标赛（短牌特化）=====
  {
    id: 'l6sd-tourney-i',
    level: 6,
    order: 1,
    title: '短牌锦标赛 I',
    subtitle: 'MTT 中的短牌 Special：ICM 压力下的翻前全下范围',
    duration: '12 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l6sd-tourney-ii',
    level: 6,
    order: 2,
    title: '短牌锦标赛 II',
    subtitle: '泡沫期与决赛表的短牌特有陷阱',
    duration: '12 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 7: 现金桌专项（短牌特化）=====
  {
    id: 'l7sd-deep-stack',
    level: 7,
    order: 1,
    title: '深筹码短牌',
    subtitle: '150bb+ 短牌现金桌的 postflop 复杂性',
    duration: '15 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l7sd-shallow-stack',
    level: 7,
    order: 2,
    title: '浅筹码短牌',
    subtitle: '40-60bb 短牌的 push/fold 地图与 SPR 管理',
    duration: '15 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 8: 高级剥削（短牌特化）=====
  {
    id: 'l8sd-exploit-i',
    level: 8,
    order: 1,
    title: '短牌剥削 I',
    subtitle: '识别并攻击短牌玩家的常见 Leak：Overvaluing AX, Underbluffing',
    duration: '15 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l8sd-exploit-ii',
    level: 8,
    order: 2,
    title: '短牌剥削 II',
    subtitle: '针对"标准德州思维"对手的短牌杀招',
    duration: '15 min',
    variant: 'short-deck',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
];
```

### 5.3 单挑策略课程大纲（L3-L8）

```typescript
export const HEADS_UP_STRATEGY_COURSES: Lesson[] = [
  // ===== Level 3: 翻后策略（单挑特化）=====
  {
    id: 'l3hu-bn aggression',
    level: 3,
    order: 1,
    title: 'BTN 位激进打法',
    subtitle: '单挑按钮位的无限压迫与 BB 位防御的崩溃边界',
    duration: '10 min',
    variant: 'heads-up',
    variantContext: {
      dealerButtonPosition: Position.HU_BTN,
    },
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l3hu-sb continuation',
    level: 3,
    order: 2,
    title: 'SB 持续下注',
    subtitle: '翻后先行动者的 C-Bet 困境与解决之道',
    duration: '10 min',
    variant: 'heads-up',
    variantContext: {
      dealerButtonPosition: Position.HU_SB,
    },
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l3hu-bb defense',
    level: 3,
    order: 3,
    title: 'BB 位防守',
    subtitle: '面对 BTN 超宽开牌的 MDF 与额外防御',
    duration: '12 min',
    variant: 'heads-up',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 4A: 进阶思维·范围与 EV（单挑版）=====
  {
    id: 'l4hu-bn-opening',
    level: 4,
    order: 1,
    title: 'BTN 开牌范围',
    subtitle: '单挑按钮位 70-80% 宽度的构成艺术',
    duration: '15 min',
    variant: 'heads-up',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l4hu-ev-adjustments',
    level: 4,
    order: 2,
    title: '单挑 EV 调整',
    subtitle: '位置优势转化为 EV 的具体计算方法',
    duration: '12 min',
    variant: 'heads-up',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 4B: 进阶思维·GTO（单挑版）=====
  {
    id: 'l4hu-gto-basics',
    level: 4,
    order: 3,
    title: '单挑 GTO 入门',
    subtitle: 'Nash Equilibrium 在 HU 中的简化表达',
    duration: '15 min',
    variant: 'heads-up',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l4hu-counter-strategies',
    level: 4,
    order: 4,
    title: '反制策略',
    subtitle: '破坏对手 GTO 基线的 HU 特有手段',
    duration: '15 min',
    variant: 'heads-up',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 5: 职业素养（单挑特化）=====
  {
    id: 'l5hu-focus',
    level: 5,
    order: 1,
    title: '单挑专注力训练',
    subtitle: '90 分钟高强度 1v1 的心理耐力培养',
    duration: '10 min',
    variant: 'heads-up',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
  {
    id: 'l5hu-opponent-psychology',
    level: 5,
    order: 2,
    title: '单挑对手心理',
    subtitle: '面对面交锋中的微表情与行为线索识别',
    duration: '10 min',
    variant: 'heads-up',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 6: 锦标赛（单挑特化）=====
  {
    id: 'l6hu-tourney',
    level: 6,
    order: 1,
    title: '单挑锦标赛',
    subtitle: 'Final Table Heads-Up 的 ICM 特殊考量',
    duration: '12 min',
    variant: 'heads-up',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 7: 现金桌专项（单挑特化）=====
  {
    id: 'l7hu-stakes',
    level: 7,
    order: 1,
    title: '单挑不同限级',
    subtitle: '从 $1/$2 到高额单挑的游戏风格演变',
    duration: '15 min',
    variant: 'heads-up',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },

  // ===== Level 8: 高级剥削（单挑特化）=====
  {
    id: 'l8hu-exploitative',
    level: 8,
    order: 1,
    title: '单挑高级剥削',
    subtitle: '读取对手位置偏好与调整攻防比例',
    duration: '20 min',
    variant: 'heads-up',
    content: [],
    quiz: [],
    examples: [],
    practice: { questions: [] },
  },
];
```

---

## 💾 进度与 ELO 系统

### 6.1 ELO 评分完全独立

**文件**: `src/shared/types/elo.ts` 扩展

```typescript
/** ELO 评分状态增强 */
export interface EloRating {
  overall: number;
  preflop: number;
  postflop: number;
  math: number;
  handReading: number;
  mental: number;
  kFactor: number;
  gamesPlayed: number;
  lastUpdated: number;
  variant: PokerVariant;         // ← 新增：变体标识
}

/** progress store 查询接口增强 */
export interface UseProgressStore {
  // 原有方法保持不变
  getEloRating(dimension: EloDimension): number;
  
  // 新方法：带变体上下文
  getEloRating(variant: PokerVariant, dimension: EloDimension): number;
  getAllVariantsRatings(): Record<PokerVariant, EloRating>;
  switchActiveVariant(variant: PokerVariant): void;
}
```

### 6.2 Store Migration

```typescript
// src/features/progress/store.ts
persistVersion: '1.0' → '2.0'

migrate: (data) => {
  if (!data.eloByVariant) {
    // 老用户：克隆 standard ELO 到所有变体
    const standardElo = data.eloRating;
    data.eloByVariant = {
      standard: standardElo,
      'short-deck': { ...standardElo, gamesPlayed: 0, lastUpdated: 0 },
      'heads-up': { ...standardElo, gamesPlayed: 0, lastUpdated: 0 },
    };
    data.activeVariant = 'standard';
  }
  return data;
}
```

---

## 🔧 规则差异处理

### 7.1 变体规则工厂

**文件**: `src/shared/utils/variantRules.ts`

```typescript
/** 规则接口定义 */
export interface PokerVariantRules {
  deckSize: number;
  maxPlayers: number;
  handRanking: {
    flushBeatsStraight: boolean;
    aceHighStraight: string[];
    aceLowStraight: string[];
    pairBeatsAnyAceKing?: boolean;
  };
  positions: string[];
  preflopAggression: {
    sbCanRaiseFirst: boolean;
    bbFirstToActPostflop: boolean;
  };
  anteStructure?: 'sb_ante' | 'both_ante' | 'no_ante';
  [key: string]: unknown;
}

/** 标准德州规则定义 */
export const STANDARD_DECK_RULES: PokerVariantRules = {
  deckSize: 52,
  maxPlayers: 9,
  handRanking: {
    flushBeatsStraight: true,
    aceHighStraight: ['A-K-Q-J-T'],
    aceLowStraight: ['A-2-3-4-5'],
  },
  positions: ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  preflopAggression: {
    sbCanRaiseFirst: false,
    bbFirstToActPostflop: true,
  },
  anteStructure: 'no_ante',
};

/** 短牌规则定义 */
export const SHORT_DECK_RULES: PokerVariantRules = {
  deckSize: 36,
  maxPlayers: 6,
  handRanking: {
    flushBeatsStraight: true,  // 短牌同花>顺子
    aceHighStraight: ['A-K-Q-J-T'],
    aceLowStraight: ['A-2-3-4-5'],
    pairBeatsAnyAceKing: true,  // AA>KQ 是短牌核心差异
  },
  positions: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
  preflopAggression: {
    sbCanRaiseFirst: false,
    bbFirstToActPostflop: true,
  },
  anteStructure: 'no_ante',
};

/** 单挑规则定义 */
export const HEADS_UP_RULES: PokerVariantRules = {
  deckSize: 52,
  maxPlayers: 2,
  handRanking: {
    flushBeatsStraight: true,
    aceHighStraight: ['A-K-Q-J-T'],
    aceLowStraight: ['A-2-3-4-5'],
  },
  positions: ['HU_SB', 'HU_BB'],  // 特殊位置命名
  preflopAggression: {
    sbCanRaiseFirst: false,
    bbFirstToActPostflop: true,    // BB 翻前最后行动
    sbFirstToActPostflop: true,    // SB 翻后先行动（反转）
  },
  anteStructure: 'sb_ante',
  blindForces: {
    sbAmount: 0.5,
    bbAmount: 1.0,
  },
};

/** 根据变体返回对应规则 */
export function getVariantRules(variant: PokerVariant): PokerVariantRules {
  switch (variant) {
    case 'short-deck': return SHORT_DECK_RULES;
    case 'heads-up': return HEADS_UP_RULES;
    default: return STANDARD_DECK_RULES;
  }
}

/** 题目判分器（变体感知）*/
export function evaluateAnswer(
  answer: string,
  variant: PokerVariant,
  scenario: HandScenario
): { isCorrect: boolean; evLoss: number } {
  const rules = getVariantRules(variant);
  // 根据 rules 判断答案合理性
  // 例：短牌中"弃掉 KJo 对 22"可能被判正确（因为 AA>KQ）
}
```

---

## 🎨 UI/UX 设计

### 8.1 VariantToggle 组件

**文件**: `src/shared/components/VariantToggle.tsx`

```tsx
interface VariantToggleProps {
  variants?: PokerVariant[];           // 默认 all
  onSelect?: (variant: PokerVariant) => void;
  active?: PokerVariant;
  className?: string;
}

const VARIANT_CONFIG: Record<PokerVariant, { label: string; icon: string; color: string }> = {
  'standard': { label: '标准德州', icon: '♠️', color: '#c9a25e' },
  'short-deck': { label: '短牌德州', icon: '♦️', color: '#ef4444' },
  'heads-up': { label: '单挑', icon: '👤', color: '#3b82f6' },
};

export function VariantToggle({ 
  variants = ALL_VARIANTS, 
  onSelect, 
  active = DEFAULT_VARIANT,
  className 
}: VariantToggleProps) {
  // 实现分段控制器 UI
}
```

### 8.2 规则提示 Banner

**文件**: `src/shared/components/VariantRuleBanner.tsx`

```tsx
interface VariantRuleBannerProps {
  variant: PokerVariant;
  rules?: VariantRuleInfo;
  compact?: boolean;
}

export function VariantRuleBanner({ variant, rules, compact }: VariantRuleBannerProps) {
  if (variant === 'standard') return null;
  
  // 显示变体特有规则差异提示
}
```

---

## 🚀 实施路线图

### Phase 1: 基础设施 (Week 1)
- [ ] 类型定义扩展（types.ts）
- [ ] 进度 store migrate + version bump
- [ ] VariantToggle 组件开发
- [ ] ELO 多变体查询接口实现
- [ ] variantRules.ts 工厂函数

### Phase 2: 数据骨架 (Week 2-3)
- [ ] 创建 `theory-academy/data/levels/variants/` 目录
- [ ] 生成短牌 T4-T9 Level 框架文件（空 content/quiz）
- [ ] 生成单挑 T4-T9 Level 框架文件
- [ ] 创建 `strategy-academy/data/lessons/variants/` 目录
- [ ] 生成短牌 L3-L8 Lesson 框架文件
- [ ] 生成单挑 L3-L8 Lesson 框架文件
- [ ] 编写完整性测试守卫（curriculumIntegrity.test.ts 扩展）

### Phase 3: UI 集成 (Week 4)
- [ ] TheoryHome / AcademyHome 过滤逻辑
- [ ] 变体切换持久化
- [ ] 规则提示 Banner 集成
- [ ] Dashboard 多变体进度概览
- [ ] MobileNav 变体指示器

### Phase 4: 题库适配 (Week 5-6)
- [ ] range-trainer 短牌矩阵（9×9）
- [ ] range-trainer 单挑位置集
- [ ] pot-odds 变体感知计算
- [ ] gto-simulator 变体场景生成
- [ ] QuizCard 变体选项排序

### Phase 5: 测试与文档 (Week 7)
- [ ] 端到端变体切换测试
- [ ] i18n 双语键扩充
- [ ] CHANGELOG.md 更新
- [ ] AGENTS.md 子代理权限扩展

---

## 📝 附录：文件清单

### 新增文件列表

```
src/shared/types/
  ├── elo.ts (扩展)
  └── variantRules.ts (新增)

src/shared/utils/
  ├── variantRules.ts (新增)
  └── seededShuffle.ts (无需改动)

src/shared/components/
  ├── VariantToggle.tsx (新增)
  └── VariantRuleBanner.tsx (新增)

src/features/theory-academy/
  ├── types.ts (扩展)
  ├── store.ts (扩展 + migrate)
  └── data/levels/
      └── variants/
          ├── index.ts (新增：导出 all variants)
          ├── standard.ts (现有文件重组织)
          ├── short-deck.ts (新增：T1-T9 框架)
          └── heads-up.ts (新增：T1-T9 框架)

src/features/strategy-academy/
  ├── types.ts (扩展)
  └── data/lessons/
      └── variants/
          ├── index.ts (新增)
          ├── standard.ts (现有文件重组织)
          ├── short-deck.ts (新增：L3-L8 框架)
          └── heads-up.ts (新增：L3-L8 框架)

src/features/progress/
  └── store.ts (扩展：eloByVariant)
```

### 修改文件列表

| 文件 | 修改内容 |
|------|---------|
| `src/shared/types/elo.ts` | 新增 PokerVariant 类型与 VARIANT_CONFIG |
| `src/features/theory-academy/types.ts` | TheoryChapter/TheoryLevelInfo 添加 variant 字段 |
| `src/features/theory-academy/store.ts` | TheoryProgress 添加 activeVariant + migrate |
| `src/features/strategy-academy/types.ts` | Lesson/LearningTrack 添加 variant 字段 |
| `src/features/progress/store.ts` | ELO 存储改为按变体分离 + migrate |
| `src/app/routes.tsx` | 路由过滤逻辑（根据 activeVariant） |
| `src/i18n/locales/zh.json` | 新增 variant 相关 i18n key |
| `src/i18n/locales/en.json` | 新增 variant 相关 i18n key |

---

## ✅ 框架设计完成确认

本方案设计已完成以下目标：

1. ✅ 查看现有标准德州的课程内容，识别可复用基础概念（T1-T3/L1-L2 全部共享）
2. ✅ 为短牌德州和单挑分别创建课程大纲框架（包括理论学院 T1-T9 和策略学院 L1-L8 的层级结构）
3. ✅ 框架包含课程标题、基本描述和学习目标（占位符形式，不填充详细内容）
4. ✅ 同时改进现有的标准德州模块架构，使其能够支持多种变体的并存和扩展
5. ✅ 确保框架设计符合项目现有的架构模式和代码组织结构（feature-first, shared layer, Zustand persist）
6. ✅ 重点关注数据结构、状态管理和组件架构的变体支持能力

**后续步骤**: 框架已留存，等待内容填充指令后可逐步完善。

