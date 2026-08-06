import type { Lesson } from '../../../types';

/**
 * Short Deck（短牌）L3-L8 课程骨架（P2 变体支持，Day 3-4）。
 *
 * 36 张牌（移除 2-5）、同花 > 顺子、AA > KQ、6 人桌。
 * 当前为骨架：content / quiz / examples / practice 为占位空结构，
 * 实际内容由后续任务（Day 5+）按设计文档第 5.2 节填充。
 * variant 显式声明为 'short-deck'；variantContext 标注典型浅筹码深度。
 */
export const SHORT_DECK_STRATEGY_COURSES: Lesson[] = [
  // ===== L3 翻后策略 =====
  {
    id: 'l3sd-cbet',
    level: 3,
    order: 1,
    title: '短牌持续下注',
    subtitle: '干燥牌面的高频 C-Bet 与短牌特有的湿滑牌面处理',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l3sd-cbet-practice', questions: [] }, // 待填充
  },
  {
    id: 'l3sd-donk',
    level: 3,
    order: 2,
    title: '短牌 Donk 下注',
    subtitle: '短牌翻牌率更高环境下的主动下注时机与频率',
    duration: '7 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l3sd-donk-practice', questions: [] }, // 待填充
  },
  {
    id: 'l3sd-check-raise',
    level: 3,
    order: 3,
    title: '短牌过牌加注',
    subtitle: '用 Check-Raise 构建范围、保护强牌并应对高频下注',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l3sd-check-raise-practice', questions: [] }, // 待填充
  },
  // ===== L4A 进阶思维 · 范围与 EV =====
  {
    id: 'l4sd-preflop-ranges',
    level: 4,
    order: 1,
    title: '短牌翻前范围',
    subtitle: '36 张牌环境下的起手牌价值重排与开局范围构建',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4sd-preflop-ranges-practice', questions: [] }, // 待填充
  },
  {
    id: 'l4sd-nuts-equity',
    level: 4,
    order: 2,
    title: '坚果与权益计算',
    subtitle: '短牌高权益环境下的坚果追逐、胜率修正与成牌概率',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4sd-nuts-equity-practice', questions: [] }, // 待填充
  },
  {
    id: 'l4sd-blocker-bluff',
    level: 4,
    order: 3,
    title: '阻断牌诈唬',
    subtitle: '短牌强牌密集环境下的阻断牌价值与诈唬选择',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4sd-blocker-bluff-practice', questions: [] }, // 待填充
  },
  // ===== L4B 进阶思维 · GTO 与博弈论 =====
  {
    id: 'l4sd-gto-fundamentals',
    level: 4,
    order: 1,
    title: '短牌 GTO 基础',
    subtitle: '短牌博弈树差异、频率基准与 GTO 策略的适用边界',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4sd-gto-fundamentals-practice', questions: [] }, // 待填充
  },
  {
    id: 'l4sd-solver-readout',
    level: 4,
    order: 2,
    title: 'Solver 结果解读',
    subtitle: '阅读短牌 Solver 输出并提炼为可执行的实战策略',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4sd-solver-readout-practice', questions: [] }, // 待填充
  },
  // ===== L5 职业素养 =====
  {
    id: 'l5sd-bankroll',
    level: 5,
    order: 1,
    title: '短牌资金管理',
    subtitle: '高波动短牌局的风险控制、资金规则与升/降级纪律',
    duration: '7 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l5sd-bankroll-practice', questions: [] }, // 待填充
  },
  {
    id: 'l5sd-tilt-control',
    level: 5,
    order: 2,
    title: '短牌情绪控制',
    subtitle: '短牌大底池波动的情绪管理、下风期识别与纪律训练',
    duration: '7 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l5sd-tilt-control-practice', questions: [] }, // 待填充
  },
  // ===== L6 锦标赛策略 =====
  {
    id: 'l6sd-tourney-i',
    level: 6,
    order: 1,
    title: '短牌锦标赛（一）',
    subtitle: '短牌 MTT 的筹码节奏、翻前攻防与生存策略',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 50 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l6sd-tourney-i-practice', questions: [] }, // 待填充
  },
  {
    id: 'l6sd-tourney-ii',
    level: 6,
    order: 2,
    title: '短牌锦标赛（二）',
    subtitle: '短牌 MTT 的 ICM、泡沫期与决赛桌调整',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 40 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l6sd-tourney-ii-practice', questions: [] }, // 待填充
  },
  // ===== L7 现金桌专项 =====
  {
    id: 'l7sd-deep-stack',
    level: 7,
    order: 1,
    title: '短牌深筹码',
    subtitle: '100BB+ 短牌深筹码策略、强牌价值提取与坚果对抗',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 150 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l7sd-deep-stack-practice', questions: [] }, // 待填充
  },
  {
    id: 'l7sd-shallow-stack',
    level: 7,
    order: 2,
    title: '短牌浅筹码',
    subtitle: '30BB 以下短筹码的 Push/Fold 与翻前全下策略',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 30 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l7sd-shallow-stack-practice', questions: [] }, // 待填充
  },
  // ===== L8 高级剥削策略 =====
  {
    id: 'l8sd-exploit-i',
    level: 8,
    order: 1,
    title: '短牌剥削（一）',
    subtitle: '针对短牌休闲玩家的范围剥削、下注尺度与频率调整',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l8sd-exploit-i-practice', questions: [] }, // 待填充
  },
  {
    id: 'l8sd-exploit-ii',
    level: 8,
    order: 2,
    title: '短牌剥削（二）',
    subtitle: '高波动环境的牌桌动态利用与针对性反制',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l8sd-exploit-ii-practice', questions: [] }, // 待填充
  },
];
