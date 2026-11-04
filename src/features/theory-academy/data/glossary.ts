import type { TheoryGlossaryTerm } from '../types';

/**
 * 理论学院术语表（唯一事实源）。
 *
 * 发现层（术语检索 / 相关章节跳转）只读本文件；文案经 i18n key 解析
 * （`theory.glossary.<id>.term` / `.definition` / `.alias<n>`，见 locales/<lng>/theory-content/glossary.json），
 * 数据层不存任何中文或英文句子，保证 zh/en 同源同形。
 *
 * 约定：
 * - id 为 stable kebab-case，一经发布不再改名（外部链接与检索索引依赖它）；
 * - aliases 存 i18n key（渲染端逐个 t() 解析后匹配），不是裸文案；
 * - relatedChapterIds 引用理论章节 id，供「相关章节」跳转与学习路径串联。
 */
export const THEORY_GLOSSARY: TheoryGlossaryTerm[] = [
  {
    id: 'pot-odds',
    termKey: 'theory.glossary.pot-odds.term',
    definitionKey: 'theory.glossary.pot-odds.definition',
    relatedChapterIds: ['t2-pot-odds'],
  },
  {
    id: 'implied-odds',
    termKey: 'theory.glossary.implied-odds.term',
    definitionKey: 'theory.glossary.implied-odds.definition',
    aliases: ['theory.glossary.implied-odds.alias0'],
    relatedChapterIds: ['t2-implied-odds'],
  },
  {
    id: 'reverse-implied-odds',
    termKey: 'theory.glossary.reverse-implied-odds.term',
    definitionKey: 'theory.glossary.reverse-implied-odds.definition',
    aliases: ['theory.glossary.reverse-implied-odds.alias0'],
    relatedChapterIds: ['t2-implied-odds'],
  },
  {
    id: 'equity',
    termKey: 'theory.glossary.equity.term',
    definitionKey: 'theory.glossary.equity.definition',
    aliases: ['theory.glossary.equity.alias0'],
    relatedChapterIds: ['t1-combinatorics', 't6-equity-realization'],
  },
  {
    id: 'expected-value',
    termKey: 'theory.glossary.expected-value.term',
    definitionKey: 'theory.glossary.expected-value.definition',
    aliases: ['theory.glossary.expected-value.alias0'],
    relatedChapterIds: ['t2-ev'],
  },
  {
    id: 'outs',
    termKey: 'theory.glossary.outs.term',
    definitionKey: 'theory.glossary.outs.definition',
    aliases: ['theory.glossary.outs.alias0'],
    relatedChapterIds: ['t1-outs'],
  },
  {
    id: 'set-mining',
    termKey: 'theory.glossary.set-mining.term',
    definitionKey: 'theory.glossary.set-mining.definition',
    relatedChapterIds: ['t2-implied-odds'],
  },
  {
    id: 'combinatorics',
    termKey: 'theory.glossary.combinatorics.term',
    definitionKey: 'theory.glossary.combinatorics.definition',
    aliases: ['theory.glossary.combinatorics.alias0'],
    relatedChapterIds: ['t1-combinatorics', 't4-combinatorics'],
  },
  {
    id: 'blocker',
    termKey: 'theory.glossary.blocker.term',
    definitionKey: 'theory.glossary.blocker.definition',
    aliases: ['theory.glossary.blocker.alias0'],
    relatedChapterIds: ['t4-combinatorics'],
  },
  {
    id: 'range',
    termKey: 'theory.glossary.range.term',
    definitionKey: 'theory.glossary.range.definition',
    aliases: ['theory.glossary.range.alias0'],
    relatedChapterIds: ['t4-range-thinking', 't4-sixmax-ranges'],
  },
  {
    id: 'range-advantage',
    termKey: 'theory.glossary.range-advantage.term',
    definitionKey: 'theory.glossary.range-advantage.definition',
    relatedChapterIds: ['t4-range-advantage'],
  },
  {
    id: 'nut-advantage',
    termKey: 'theory.glossary.nut-advantage.term',
    definitionKey: 'theory.glossary.nut-advantage.definition',
    aliases: ['theory.glossary.nut-advantage.alias0'],
    relatedChapterIds: ['t4-range-advantage'],
  },
  {
    id: 'polarization',
    termKey: 'theory.glossary.polarization.term',
    definitionKey: 'theory.glossary.polarization.definition',
    relatedChapterIds: ['t6-sizing-theory', 't6-3bet-pot'],
  },
  {
    id: 'linear-range',
    termKey: 'theory.glossary.linear-range.term',
    definitionKey: 'theory.glossary.linear-range.definition',
    relatedChapterIds: ['t6-sizing-theory', 't4-sixmax-ranges'],
  },
  {
    id: 'continuation-bet',
    termKey: 'theory.glossary.continuation-bet.term',
    definitionKey: 'theory.glossary.continuation-bet.definition',
    aliases: ['theory.glossary.continuation-bet.alias0'],
    relatedChapterIds: ['t6-srp-postflop'],
  },
  {
    id: 'check-raise',
    termKey: 'theory.glossary.check-raise.term',
    definitionKey: 'theory.glossary.check-raise.definition',
    relatedChapterIds: ['t6-turn-river', 't7-exploit'],
  },
  {
    id: 'probe-bet',
    termKey: 'theory.glossary.probe-bet.term',
    definitionKey: 'theory.glossary.probe-bet.definition',
    relatedChapterIds: ['t6-turn-river'],
  },
  {
    id: 'overbet',
    termKey: 'theory.glossary.overbet.term',
    definitionKey: 'theory.glossary.overbet.definition',
    relatedChapterIds: ['t6-sizing-theory', 't6-turn-river'],
  },
  {
    id: 'blocking-bet',
    termKey: 'theory.glossary.blocking-bet.term',
    definitionKey: 'theory.glossary.blocking-bet.definition',
    relatedChapterIds: ['t6-sizing-theory'],
  },
  {
    id: 'minimum-defense-frequency',
    termKey: 'theory.glossary.minimum-defense-frequency.term',
    definitionKey: 'theory.glossary.minimum-defense-frequency.definition',
    aliases: ['theory.glossary.minimum-defense-frequency.alias0'],
    relatedChapterIds: ['t5-mdf-alpha', 't5-multiway-frequency'],
  },
  {
    id: 'alpha',
    termKey: 'theory.glossary.alpha.term',
    definitionKey: 'theory.glossary.alpha.definition',
    aliases: ['theory.glossary.alpha.alias0'],
    relatedChapterIds: ['t5-mdf-alpha', 't9-alpha'],
  },
  {
    id: 'nash-equilibrium',
    termKey: 'theory.glossary.nash-equilibrium.term',
    definitionKey: 'theory.glossary.nash-equilibrium.definition',
    aliases: ['theory.glossary.nash-equilibrium.alias0'],
    relatedChapterIds: ['t5-game-theory'],
  },
  {
    id: 'gto',
    termKey: 'theory.glossary.gto.term',
    definitionKey: 'theory.glossary.gto.definition',
    relatedChapterIds: ['t5-gto-concept', 't9-unified'],
  },
  {
    id: 'mixed-strategy',
    termKey: 'theory.glossary.mixed-strategy.term',
    definitionKey: 'theory.glossary.mixed-strategy.definition',
    relatedChapterIds: ['t5-mixed-strategy'],
  },
  {
    id: 'indifference',
    termKey: 'theory.glossary.indifference.term',
    definitionKey: 'theory.glossary.indifference.definition',
    aliases: ['theory.glossary.indifference.alias0'],
    relatedChapterIds: ['t5-mixed-strategy', 't9-mop'],
  },
  {
    id: 'node-locking',
    termKey: 'theory.glossary.node-locking.term',
    definitionKey: 'theory.glossary.node-locking.definition',
    relatedChapterIds: ['t5-mixed-strategy'],
  },
  {
    id: 'exploitative-play',
    termKey: 'theory.glossary.exploitative-play.term',
    definitionKey: 'theory.glossary.exploitative-play.definition',
    aliases: ['theory.glossary.exploitative-play.alias0'],
    relatedChapterIds: ['t7-exploit', 't9-unified'],
  },
  {
    id: 'icm',
    termKey: 'theory.glossary.icm.term',
    definitionKey: 'theory.glossary.icm.definition',
    relatedChapterIds: ['t9-icm', 't9-cash-vs-mtt'],
  },
  {
    id: 'chip-ev',
    termKey: 'theory.glossary.chip-ev.term',
    definitionKey: 'theory.glossary.chip-ev.definition',
    aliases: ['theory.glossary.chip-ev.alias0'],
    relatedChapterIds: ['t2-ev', 't9-icm'],
  },
  {
    id: 'dollar-ev',
    termKey: 'theory.glossary.dollar-ev.term',
    definitionKey: 'theory.glossary.dollar-ev.definition',
    relatedChapterIds: ['t9-icm', 't9-cash-vs-mtt'],
  },
  {
    id: 'spr',
    termKey: 'theory.glossary.spr.term',
    definitionKey: 'theory.glossary.spr.definition',
    aliases: ['theory.glossary.spr.alias0'],
    relatedChapterIds: ['t6-geometric', 't6-3bet-pot'],
  },
  {
    id: 'geometric-sizing',
    termKey: 'theory.glossary.geometric-sizing.term',
    definitionKey: 'theory.glossary.geometric-sizing.definition',
    relatedChapterIds: ['t6-geometric'],
  },
  {
    id: 'equity-realization',
    termKey: 'theory.glossary.equity-realization.term',
    definitionKey: 'theory.glossary.equity-realization.definition',
    relatedChapterIds: ['t6-equity-realization', 't3-position-value'],
  },
  {
    id: 'vpip',
    termKey: 'theory.glossary.vpip.term',
    definitionKey: 'theory.glossary.vpip.definition',
    relatedChapterIds: ['t7-stats'],
  },
  {
    id: 'pfr',
    termKey: 'theory.glossary.pfr.term',
    definitionKey: 'theory.glossary.pfr.definition',
    relatedChapterIds: ['t7-stats'],
  },
  {
    id: 'aggression-factor',
    termKey: 'theory.glossary.aggression-factor.term',
    definitionKey: 'theory.glossary.aggression-factor.definition',
    aliases: ['theory.glossary.aggression-factor.alias0'],
    relatedChapterIds: ['t7-stats', 't7-player-types'],
  },
  {
    id: 'wtsd',
    termKey: 'theory.glossary.wtsd.term',
    definitionKey: 'theory.glossary.wtsd.definition',
    relatedChapterIds: ['t7-stats'],
  },
  {
    id: 'three-bet',
    termKey: 'theory.glossary.three-bet.term',
    definitionKey: 'theory.glossary.three-bet.definition',
    aliases: ['theory.glossary.three-bet.alias0'],
    relatedChapterIds: ['t4-preflop-structure', 't3-blind-battle'],
  },
  {
    id: 'four-bet',
    termKey: 'theory.glossary.four-bet.term',
    definitionKey: 'theory.glossary.four-bet.definition',
    relatedChapterIds: ['t4-preflop-structure'],
  },
  {
    id: 'squeeze',
    termKey: 'theory.glossary.squeeze.term',
    definitionKey: 'theory.glossary.squeeze.definition',
    relatedChapterIds: ['t4-sixmax-ranges', 't3-blind-battle'],
  },
  {
    id: 'cold-call',
    termKey: 'theory.glossary.cold-call.term',
    definitionKey: 'theory.glossary.cold-call.definition',
    relatedChapterIds: ['t4-sixmax-ranges'],
  },
  {
    id: 'gap-concept',
    termKey: 'theory.glossary.gap-concept.term',
    definitionKey: 'theory.glossary.gap-concept.definition',
    relatedChapterIds: ['t3-starting-hands'],
  },
  {
    id: 'position',
    termKey: 'theory.glossary.position.term',
    definitionKey: 'theory.glossary.position.definition',
    aliases: ['theory.glossary.position.alias0'],
    relatedChapterIds: ['t3-position-value', 't1-sixmax-table'],
  },
  {
    id: 'tilt',
    termKey: 'theory.glossary.tilt.term',
    definitionKey: 'theory.glossary.tilt.definition',
    relatedChapterIds: ['t8-tilt', 't8-session'],
  },
  {
    id: 'bankroll-management',
    termKey: 'theory.glossary.bankroll-management.term',
    definitionKey: 'theory.glossary.bankroll-management.definition',
    relatedChapterIds: ['t8-bankroll-psych'],
  },
  {
    id: 'risk-of-ruin',
    termKey: 'theory.glossary.risk-of-ruin.term',
    definitionKey: 'theory.glossary.risk-of-ruin.definition',
    aliases: ['theory.glossary.risk-of-ruin.alias0'],
    relatedChapterIds: ['t8-bankroll-psych', 't4-structure-economics'],
  },
  {
    id: 'kelly-criterion',
    termKey: 'theory.glossary.kelly-criterion.term',
    definitionKey: 'theory.glossary.kelly-criterion.definition',
    relatedChapterIds: ['t8-bankroll-psych'],
  },
  {
    id: 'variance',
    termKey: 'theory.glossary.variance.term',
    definitionKey: 'theory.glossary.variance.definition',
    relatedChapterIds: ['t1-variance', 't8-tilt'],
  },
  {
    id: 'downswing',
    termKey: 'theory.glossary.downswing.term',
    definitionKey: 'theory.glossary.downswing.definition',
    relatedChapterIds: ['t1-variance', 't8-session'],
  },
  {
    id: 'rake',
    termKey: 'theory.glossary.rake.term',
    definitionKey: 'theory.glossary.rake.definition',
    relatedChapterIds: ['t4-structure-economics', 't9-cash-vs-mtt'],
  },
  {
    id: 'ante',
    termKey: 'theory.glossary.ante.term',
    definitionKey: 'theory.glossary.ante.definition',
    relatedChapterIds: ['t4-structure-economics'],
  },
  {
    id: 'straddle',
    termKey: 'theory.glossary.straddle.term',
    definitionKey: 'theory.glossary.straddle.definition',
    relatedChapterIds: ['t4-structure-economics'],
  },
  {
    id: 'multiway-pot',
    termKey: 'theory.glossary.multiway-pot.term',
    definitionKey: 'theory.glossary.multiway-pot.definition',
    aliases: ['theory.glossary.multiway-pot.alias0'],
    relatedChapterIds: ['t5-multiway-frequency', 't9-multiway'],
  },
  {
    id: 'heads-up',
    termKey: 'theory.glossary.heads-up.term',
    definitionKey: 'theory.glossary.heads-up.definition',
    relatedChapterIds: ['t5-game-theory'],
  },
  {
    id: 'bubble',
    termKey: 'theory.glossary.bubble.term',
    definitionKey: 'theory.glossary.bubble.definition',
    relatedChapterIds: ['t9-icm'],
  },
  {
    id: 'fold-equity',
    termKey: 'theory.glossary.fold-equity.term',
    definitionKey: 'theory.glossary.fold-equity.definition',
    aliases: ['theory.glossary.fold-equity.alias0'],
    relatedChapterIds: ['t2-ev', 't6-bet-purpose'],
  },
  {
    id: 'thin-value',
    termKey: 'theory.glossary.thin-value.term',
    definitionKey: 'theory.glossary.thin-value.definition',
    relatedChapterIds: ['t6-bet-purpose', 't6-turn-river'],
  },
];

const GLOSSARY_BY_ID = new Map(THEORY_GLOSSARY.map((term) => [term.id, term]));

export function getGlossaryTerm(id: string): TheoryGlossaryTerm | undefined {
  return GLOSSARY_BY_ID.get(id);
}
