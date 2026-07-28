import type { ConceptNode } from '../types';

export const CONCEPT_NODES: ConceptNode[] = [
  // 基础概念
  {
    id: 'concept-position',
    name: '位置优势',
    description: '后位行动获取更多信息的战略优势，是所有策略的基石',
    relatedLessons: ['l1-position', 'l3-float-probe'],
    relatedModules: ['range-trainer', 'gto-simulator'],
    prerequisites: [],
    category: 'fundamental',
  },
  {
    id: 'concept-hand-selection',
    name: '起手牌选择',
    description: '根据位置和行动选择合适的翻前起手牌范围',
    relatedLessons: ['l1-hand-selection', 'l2-raise-sizing'],
    relatedModules: ['range-trainer'],
    prerequisites: ['concept-position'],
    category: 'fundamental',
  },
  {
    id: 'concept-pot-odds',
    name: '底池赔率',
    description: '通过计算所需胜率来判断跟注是否有利可图',
    relatedLessons: ['l3-draws'],
    relatedModules: ['pot-odds'],
    prerequisites: [],
    category: 'mathematical',
  },
  {
    id: 'concept-implied-odds',
    name: '隐含赔率',
    description: '考虑后续街潜在收益后的有效赔率评估',
    relatedLessons: ['l3-draws', 'l3-multistreet'],
    relatedModules: ['pot-odds'],
    prerequisites: ['concept-pot-odds'],
    category: 'mathematical',
  },
  {
    id: 'concept-ev',
    name: '期望值（EV）',
    description: '长期重复某决策的平均收益，+EV 决策是盈利的核心',
    relatedLessons: ['l1-basics', 'l3-bet-sizing'],
    relatedModules: ['pot-odds', 'gto-simulator'],
    prerequisites: ['concept-pot-odds'],
    category: 'mathematical',
  },
  {
    id: 'concept-cbet',
    name: '持续下注',
    description: '翻前加注者在翻后继续下注的策略',
    relatedLessons: ['l3-cbet'],
    relatedModules: ['gto-simulator'],
    prerequisites: ['concept-hand-selection', 'concept-position'],
    category: 'strategic',
  },
  {
    id: 'concept-range',
    name: '范围思维',
    description: '以对手可能持有的所有手牌集合来思考，而非猜测单一手牌',
    relatedLessons: ['l4-range-reading', 'l2-3bet'],
    relatedModules: ['range-trainer', 'gto-simulator'],
    prerequisites: ['concept-hand-selection'],
    category: 'strategic',
  },
  {
    id: 'concept-bluff',
    name: '诈唬策略',
    description: '用弱牌表示强度迫使对手弃牌的策略',
    relatedLessons: ['l3-bluffing', 'l3-check-raise'],
    relatedModules: ['gto-simulator'],
    prerequisites: ['concept-range', 'concept-ev'],
    category: 'strategic',
  },
  {
    id: 'concept-bet-sizing',
    name: '下注尺度',
    description: '选择合适的下注大小来最大化 EV',
    relatedLessons: ['l3-bet-sizing', 'l2-raise-sizing'],
    relatedModules: ['gto-simulator', 'pot-odds'],
    prerequisites: ['concept-ev', 'concept-range'],
    category: 'strategic',
  },
  {
    id: 'concept-opponent-reading',
    name: '对手阅读',
    description: '通过统计数据和行为模式识别对手类型并调整策略',
    relatedLessons: ['l4-opponent-exploit', 'l4-range-reading'],
    relatedModules: ['hand-history', 'gto-simulator'],
    prerequisites: ['concept-range'],
    category: 'strategic',
  },
  {
    id: 'concept-tilt-control',
    name: '情绪控制',
    description: '在逆境中保持理性决策，避免因情绪波动做出非最优选择',
    relatedLessons: ['l4-mental-game', 'l5-discipline'],
    relatedModules: [],
    prerequisites: [],
    category: 'psychological',
  },
  {
    id: 'concept-bankroll',
    name: '资金管理',
    description: '合理分配和保护扑克资金，控制下注级别的风险',
    relatedLessons: ['l5-bankroll', 'l1-bankroll'],
    relatedModules: [],
    prerequisites: [],
    category: 'psychological',
  },
  {
    id: 'concept-icm',
    name: 'ICM 模型',
    description: '锦标赛中将筹码转化为实际奖金价值的模型，影响泡沫期决策',
    relatedLessons: ['l6-icm', 'l6-bubble'],
    relatedModules: ['gto-simulator'],
    prerequisites: ['concept-ev'],
    category: 'mathematical',
  },
  {
    id: 'concept-multiway',
    name: '多人底池策略',
    description: '3人以上底池中调整策略，减少诈唬频率，增加价值下注',
    relatedLessons: ['l7-multiway'],
    relatedModules: ['gto-simulator'],
    prerequisites: ['concept-range', 'concept-bet-sizing'],
    category: 'strategic',
  },
  {
    id: 'concept-spr',
    name: 'SPR（筹码底池比）',
    description: '有效筹码与底池大小的比值，决定翻后策略的灵活性',
    relatedLessons: ['l3-multistreet', 'l7-deep-stack', 'l2-short-stack'],
    relatedModules: ['pot-odds'],
    prerequisites: ['concept-pot-odds', 'concept-bet-sizing'],
    category: 'mathematical',
  },
];

/** 根据 ID 查找概念节点 */
export function getConceptNode(id: string): ConceptNode | undefined {
  return CONCEPT_NODES.find((n) => n.id === id);
}

/** 根据课程 ID 找出关联的概念 */
export function getConceptsForLesson(lessonId: string): ConceptNode[] {
  return CONCEPT_NODES.filter((n) => n.relatedLessons.includes(lessonId));
}

/** 根据模块找出关联的概念 */
export function getConceptsForModule(
  module: 'pot-odds' | 'range-trainer' | 'gto-simulator' | 'hand-history'
): ConceptNode[] {
  return CONCEPT_NODES.filter((n) => n.relatedModules.includes(module));
}
