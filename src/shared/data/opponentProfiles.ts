import type { OpponentProfile, OpponentStats } from '@/shared/types/opponent';

export const OPPONENT_PROFILES: Record<string, OpponentProfile> = {
  tag: {
    id: 'tag',
    name: 'TAG (紧凶)',
    shortName: 'TAG',
    description: '紧而激进的玩家，只打强牌但打得很凶',
    color: '#4a5a7a',           // 靖蓝（保守偏紧）
    icon: '🎯',
    stats: {
      vpip: 18,                 // 自愿入池率 18%
      pfr: 15,                  // 翻前加注率 15%
      af: 3.5,                  // 激进度因子 3.5
      threeBetPercent: 6,       // 3-Bet 频率 6%
      foldToCBet: 55,           // 面对C-Bet弃牌率 55%
      cbetFrequency: 70,        // C-Bet频率 70%
    },
    tendencies: [
      '起手牌范围紧，主要是强牌',
      '翻后持续下注频率高',
      '面对3-Bet通常弃牌（除顶级牌外）',
      '很少bluff，但价值下注很重',
    ],
    exploitableBy: [
      '多偷他的盲注（他弃牌多）',
      '他加注时给予更多信用',
      '用位置优势对他做浮动跟注',
    ],
  },
  lag: {
    id: 'lag',
    name: 'LAG (松凶)',
    shortName: 'LAG',
    description: '松而激进的玩家，打很多牌且经常加注',
    color: '#c25a4c',           // 陶土红（激进）
    icon: '🔥',
    stats: {
      vpip: 30,
      pfr: 25,
      af: 4.0,
      threeBetPercent: 10,
      foldToCBet: 40,
      cbetFrequency: 80,
    },
    tendencies: [
      '起手牌范围很宽',
      '频繁3-Bet和加注',
      '翻后C-Bet频率极高',
      '经常bluff，但也有强牌',
    ],
    exploitableBy: [
      '用强牌设陷阱让他bluff',
      '减少对他C-Bet的弃牌率',
      '用更宽的范围跟注他的下注',
    ],
  },
  nit: {
    id: 'nit',
    name: 'Nit (超紧)',
    shortName: 'NIT',
    description: '极其保守的玩家，只打最顶级的牌',
    color: '#5a6a8a',           // 靖蓝（超保守）
    icon: '🧊',
    stats: {
      vpip: 10,
      pfr: 8,
      af: 2.5,
      threeBetPercent: 3,
      foldToCBet: 70,
      cbetFrequency: 60,
    },
    tendencies: [
      '只打 AA/KK/QQ/AK 等顶级牌',
      '几乎不bluff',
      '面对加注经常弃牌',
      '加注时几乎总是有强牌',
    ],
    exploitableBy: [
      '疯狂偷他的盲注',
      '他加注时立即弃掉中等牌',
      '不要尝试对他bluff（他会弃牌但你也无法从他身上赢大底池）',
    ],
  },
  maniac: {
    id: 'maniac',
    name: 'Maniac (疯狂)',
    shortName: 'MAN',
    description: '极度激进的玩家，不断加注和bluff',
    color: '#9a4a3a',           // 深陶土（极度激进）
    icon: '💥',
    stats: {
      vpip: 45,
      pfr: 35,
      af: 6.0,
      threeBetPercent: 15,
      foldToCBet: 25,
      cbetFrequency: 90,
    },
    tendencies: [
      '几乎每手牌都参与',
      '频繁大额加注',
      '大量bluff，很难弃牌',
      '情绪波动大，容易tilt',
    ],
    exploitableBy: [
      '用强牌耐心等他送筹码',
      '不要对他bluff（他不会弃牌）',
      '用中等牌力跟注到底（他范围太宽）',
      '控制底池大小，避免被他的激进带动',
    ],
  },
  calling_station: {
    id: 'calling_station',
    name: 'Calling Station (跟注站)',
    shortName: 'CS',
    description: '被动玩家，很少加注但喜欢跟注到底',
    color: '#c9a25e',           // 黄铜（被动）
    icon: '📞',
    stats: {
      vpip: 40,
      pfr: 5,
      af: 0.8,
      threeBetPercent: 1,
      foldToCBet: 20,
      cbetFrequency: 30,
    },
    tendencies: [
      '喜欢跟注但不喜欢加注',
      '几乎不弃牌（尤其是面对小注）',
      '很少主动下注',
      '加注时通常有非常强的牌',
    ],
    exploitableBy: [
      '对他价值下注（他会用弱牌跟注）',
      '不要对他bluff（他不会弃牌）',
      '他加注时立即弃牌（他只有强牌才加注）',
    ],
  },
  unknown: {
    id: 'unknown',
    name: 'Unknown (未知)',
    shortName: '?',
    description: '没有足够数据的对手，使用默认GTO策略',
    color: '#6e6553',           // 象牙灰
    icon: '❓',
    stats: {
      vpip: 25,
      pfr: 18,
      af: 2.5,
      threeBetPercent: 6,
      foldToCBet: 50,
      cbetFrequency: 65,
    },
    tendencies: ['没有足够数据，使用GTO基准策略应对'],
    exploitableBy: ['使用GTO策略，避免过度调整'],
  },
};

// 快速查找函数
export function getOpponentProfile(id: string): OpponentProfile {
  return OPPONENT_PROFILES[id] || OPPONENT_PROFILES['unknown']!;
}

// ===== P2-1.8: 对手画像训练 Drill =====
//
// 显示一系列动作数据（VPIP/PFR/AF 等），让用户判断对手类型并选择应对策略。
// 题目设计：每个 stats 配套 3-5 道判断题，覆盖国内低级别常见对手类型。

/** 对手画像训练题目（P2-1.8） */
export interface OpponentDrillQuestion {
  id: string;
  scenario: string;            // 场景描述（如"NL25 现金桌，对手数据如下"）
  stats: OpponentStats;        // 对手统计数据
  sampleSize: number;          // 样本手数
  recentActions: string[];     // 最近行为描述（如"过去 5 手 3-Bet 了 2 次"）
  // 第 1 问：判断对手类型
  typeOptions: string[];       // 对手类型选项（profile id 列表）
  correctType: string;         // 正确的对手类型（profile id）
  // 第 2 问：选择应对策略
  strategyOptions: string[];   // 应对策略选项
  correctStrategyIndex: number; // 正确策略 index
  explanation: string;         // 综合解析
}

/**
 * 对手画像训练题库（P2-1.8）
 *
 * 共 8 道题，覆盖国内低级别常见的 5 种对手类型：
 * - 跟注站（2 题，最常见）
 * - Maniac（2 题）
 * - Nit（1 题）
 * - LAG（1 题）
 * - TAG（1 题）
 * - 未知/混合（1 题）
 */
export const OPPONENT_DRILL_QUESTIONS: OpponentDrillQuestion[] = [
  {
    id: 'opp-drill-q1',
    scenario: 'NL10 现金桌，对手数据如下：',
    stats: {
      vpip: 42,
      pfr: 6,
      af: 0.8,
      threeBetPercent: 1,
      foldToCBet: 18,
      cbetFrequency: 30,
    },
    sampleSize: 156,
    recentActions: [
      '过去 10 手 Limp 了 5 次',
      '翻后经常 check-call',
      '面对 C-Bet 几乎从不弃牌',
    ],
    typeOptions: ['tag', 'calling_station', 'nit', 'lag'],
    correctType: 'calling_station',
    strategyOptions: [
      '高频诈唬，让他弃牌',
      '纯价值下注，加大尺度，绝不诈唬',
      '收紧开牌范围，等待 AA/KK',
      '频繁 3-Bet bluff',
    ],
    correctStrategyIndex: 1,
    explanation:
      'VPIP 42% / PFR 6% / AF 0.8 / Fold to C-Bet 18% 是典型跟注站特征：跟注宽、加注紧、几乎不弃牌。正确策略是纯价值下注，加大尺度（2/3 pot+），绝不诈唬（他 Fold to C-Bet 仅 18%）。他加注时立即弃牌（加注即代表强牌）。',
  },
  {
    id: 'opp-drill-q2',
    scenario: 'NL25 现金桌，对手数据如下：',
    stats: {
      vpip: 38,
      pfr: 4,
      af: 0.6,
      threeBetPercent: 0.5,
      foldToCBet: 22,
      cbetFrequency: 25,
    },
    sampleSize: 89,
    recentActions: [
      '翻前 Limp 后面对加注仍跟注',
      '用 K5o 跟注到河牌',
      '加注过一次，亮出 set',
    ],
    typeOptions: ['calling_station', 'maniac', 'tag', 'nit'],
    correctType: 'calling_station',
    strategyOptions: [
      '用顶对弱踢脚打光全部筹码',
      '用宽范围价值下注 2-3 条街，加大尺度',
      '只打 AA/KK，其他全弃',
      '高频 3-Bet 诈唬',
    ],
    correctStrategyIndex: 1,
    explanation:
      'VPIP 38% / PFR 4% / AF 0.6 是典型跟注站。正确策略是用宽范围价值下注（顶对弱踢脚可值 2-3 条街），加大尺度到 2/3 pot+。不要诈唬，他加注时弃掉顶对（他加注即 set 或更强）。注意：用顶对打光是错的——他跟注范围含两对/set，顶对不足以支撑全下。',
  },
  {
    id: 'opp-drill-q3',
    scenario: 'NL25 现金桌，对手数据如下：',
    stats: {
      vpip: 48,
      pfr: 38,
      af: 6.5,
      threeBetPercent: 16,
      foldToCBet: 25,
      cbetFrequency: 88,
    },
    sampleSize: 124,
    recentActions: [
      '过去 10 手 3-Bet 了 3 次',
      '翻后连续 triple barrel',
      '曾用 K7o 5-Bet All-in',
    ],
    typeOptions: ['tag', 'nit', 'maniac', 'calling_station'],
    correctType: 'maniac',
    strategyOptions: [
      '收紧范围，用强牌陷阱，绝不诈唬',
      '跟他 bluff 对攻',
      '立即换桌',
      '只打 AA/KK',
    ],
    correctStrategyIndex: 0,
    explanation:
      'VPIP 48% / PFR 38% / AF 6.5 / 3-Bet 16% 是典型 Maniac：极松极凶、高频诈唬。正确策略是收紧范围，用强牌（QQ+/AK）4-Bet 价值或跟注陷阱，让他自己送筹码过来。绝不诈唬（他不弃牌）。换桌是逃避，错失了 Maniac 是最赚钱对手的机会。',
  },
  {
    id: 'opp-drill-q4',
    scenario: 'NL50 现金桌，对手数据如下：',
    stats: {
      vpip: 52,
      pfr: 42,
      af: 7.0,
      threeBetPercent: 18,
      foldToCBet: 20,
      cbetFrequency: 92,
    },
    sampleSize: 67,
    recentActions: [
      '翻前 4-Bet All-in 被 QQ call，亮出 A7o',
      '翻后几乎 100% C-Bet',
      '情绪明显激动，连续加注',
    ],
    typeOptions: ['maniac', 'lag', 'tag', 'nit'],
    correctType: 'maniac',
    strategyOptions: [
      '用 AA 跟注陷阱，让他翻后继续攻击',
      '弃掉所有非顶级牌',
      '换桌避免纠缠',
      '用 AQ 4-Bet 价值',
    ],
    correctStrategyIndex: 0,
    explanation:
      'VPIP 52% / PFR 42% / AF 7.0 是极端 Maniac（甚至有 tilt 倾向）。AA/KK 应跟注陷阱（而非 4-Bet），让他翻后继续 C-Bet bluff 送筹码。AQ 4-Bet 是对的但不是最优——Maniac 5-Bet All-in 范围含大量 bluff，AA 跟注陷阱 EV 更高。弃掉非顶级牌是错的（JJ/TT/AK 都有显著价值）。',
  },
  {
    id: 'opp-drill-q5',
    scenario: 'NL100 现金桌，对手数据如下：',
    stats: {
      vpip: 9,
      pfr: 7,
      af: 2.8,
      threeBetPercent: 3,
      foldToCBet: 72,
      cbetFrequency: 58,
    },
    sampleSize: 210,
    recentActions: [
      '过去 20 手只开牌 2 次（AA 和 AK）',
      '面对 C-Bet 弃牌率极高',
      '从未在翻后加注过',
    ],
    typeOptions: ['tag', 'nit', 'lag', 'calling_station'],
    correctType: 'nit',
    strategyOptions: [
      '疯狂偷盲，C-Bet 诈唬，他加注时弃牌',
      '用顶对价值下注三条街',
      '只打更强的牌',
      '频繁 3-Bet 诈唬',
    ],
    correctStrategyIndex: 0,
    explanation:
      'VPIP 9% / PFR 7% / Fold to C-Bet 72% 是典型 Nit：超紧、易弃牌、加注即强牌。正确策略是疯狂偷盲（他 Fold to Steal 70%+）、高频 C-Bet 诈唬（Fold to C-Bet 72%）、他加注时立即弃牌。用顶对价值下注是错的——他跟注三条街的范围是 AA/KK/set，顶对毫无胜算。',
  },
  {
    id: 'opp-drill-q6',
    scenario: 'NL200 现金桌，对手数据如下：',
    stats: {
      vpip: 28,
      pfr: 24,
      af: 4.2,
      threeBetPercent: 11,
      foldToCBet: 42,
      cbetFrequency: 78,
    },
    sampleSize: 178,
    recentActions: [
      '频繁 3-Bet（含 A5s、K9s 等 blocker）',
      '翻后 double barrel 频率高',
      '会根据对手调整策略',
    ],
    typeOptions: ['tag', 'lag', 'nit', 'maniac'],
    correctType: 'lag',
    strategyOptions: [
      '用 TT+/AQ+ 4-Bet 价值，强牌陷阱，利用位置',
      '弃掉所有中等牌力',
      '只打 AA/KK',
      '频繁 limp 陷阱',
    ],
    correctStrategyIndex: 0,
    explanation:
      'VPIP 28% / PFR 24% / AF 4.2 / 3-Bet 11% 是典型 LAG：松凶但有逻辑、会弃牌。正确策略是 TT+/AQ+ 积极 4-Bet 价值（他 3-Bet 范围宽），用 AA/KK 跟注陷阱，利用位置压制他的宽范围。弃掉中等牌力是错的——LAG 范围宽，顶对/中等对子仍有价值。',
  },
  {
    id: 'opp-drill-q7',
    scenario: 'NL50 现金桌，对手数据如下：',
    stats: {
      vpip: 19,
      pfr: 16,
      af: 3.2,
      threeBetPercent: 6,
      foldToCBet: 55,
      cbetFrequency: 68,
    },
    sampleSize: 245,
    recentActions: [
      '开牌范围合理（约 16%）',
      '翻后 C-Bet 频率标准',
      '面对 3-Bet 会根据位置弃牌',
    ],
    typeOptions: ['tag', 'lag', 'calling_station', 'maniac'],
    correctType: 'tag',
    strategyOptions: [
      '使用 GTO 策略，小幅剥削他的弃牌',
      '疯狂诈唬他',
      '只价值下注，绝不诈唬',
      '换桌避免纠缠',
    ],
    correctStrategyIndex: 0,
    explanation:
      'VPIP 19% / PFR 16% / AF 3.2 / 3-Bet 6% 是典型 TAG（紧凶）：范围合理、C-Bet 标准、会根据位置调整。TAG 是难剥削的对手，应使用 GTO 策略，仅小幅剥削他的 Fold to C-Bet 55%（略高于 GTO 50%，可适度增加 C-Bet bluff）。疯狂诈唬是错的（他 Fold to C-Bet 55% 不够高），只 value 不诈唬也错（他弃牌率足以支撑适度诈唬）。',
  },
  {
    id: 'opp-drill-q8',
    scenario: 'NL25 现金桌，对手数据如下（样本较小）：',
    stats: {
      vpip: 35,
      pfr: 18,
      af: 2.5,
      threeBetPercent: 7,
      foldToCBet: 48,
      cbetFrequency: 65,
    },
    sampleSize: 28,
    recentActions: [
      '数据波动较大，难以判断',
      '有时激进有时被动',
      '尚未表现出明显倾向',
    ],
    typeOptions: ['calling_station', 'lag', 'unknown', 'maniac'],
    correctType: 'unknown',
    strategyOptions: [
      '使用 GTO 默认策略，积累更多数据后再调整',
      '假设他是跟注站，纯价值下注',
      '假设他是 Maniac，收紧范围',
      '立即换桌',
    ],
    correctStrategyIndex: 0,
    explanation:
      '样本仅 28 手，统计数据不可靠（VPIP 35% 可能在 20-50% 之间波动）。正确策略是使用 GTO 默认策略，积累更多数据（至少 100 手）后再进行剥削调整。过早基于小样本剥削是常见的负 EV 错误——他实际可能是 TAG 或跟注站，错误剥削会让你亏损。',
  },
];

/** 根据 ID 查找对手画像训练题 */
export function getOpponentDrillQuestion(id: string): OpponentDrillQuestion | undefined {
  return OPPONENT_DRILL_QUESTIONS.find((q) => q.id === id);
}
