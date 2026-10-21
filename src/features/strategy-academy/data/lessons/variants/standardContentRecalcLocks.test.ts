import { describe, expect, it } from 'vitest';
import { standardLevels } from './standard';
import type { Lesson } from '../../../types';

/**
 * 标准德州内容复算回归锁（批次 3）。
 *
 * 与 standardQuantAudit.test.ts 的分工：后者锁「批次 1/2 已修」的题库与公式；
 * 本文件锁批次 3 清零的 #3-#12 及 L1/L2/L8 抽查修复，防止正文/选项/解析被回退。
 * 锁定目标均为可复算的数值、牌面与牌力标签；不锁措辞风格。
 */
const lessons = standardLevels.flatMap((level) => level.lessons);

const getLesson = (id: string): Lesson => {
  const lesson = lessons.find((item) => item.id === id);
  if (!lesson) throw new Error(`缺少课程 ${id}`);
  return lesson;
};

const text = (id: string): string => JSON.stringify(getLesson(id));

describe('标准德州内容复算回归锁：L3', () => {
  it('2/4 法则误差表与 15 outs 组合听牌口径', () => {
    const draws = text('l3-draws');
    expect(draws).toContain('精确 31.5% | 误差 +0.5');
    expect(draws).toContain('9♥8♥3♣');
    expect(draws).not.toContain('9♥8♦3♣');
    expect(draws).toContain('15 个 Outs');
    expect(draws).toContain('约 15 个 outs');
    expect(draws).not.toContain('约 12-15 个 outs');
    expect(draws).toContain('约15 outs，turn 单街约33%');
  });

  it('Check-Raise 组合听牌 15 outs 与牌面', () => {
    const checkraise = text('l3-checkraise');
    expect(checkraise).toContain('约 15 个 outs');
    expect(checkraise).not.toContain('约 12 个 outs');
    expect(checkraise).toContain('9♥8♣4♥');
  });

  it('牌面记法、后门同花与满池尺度', () => {
    expect(text('l3-texture')).toContain('K♠7♦2♣');
    expect(text('l3-texture')).not.toContain('K♠72A♠');
    expect(text('l3-texture')).not.toContain('K♠72♠');
    expect(text('l3-texture')).toContain('同花听牌（9 outs）');
    expect(text('l3-3bet-postflop')).toContain('Bet 18.5BB（满池）');
    expect(text('l3-3bet-postflop')).not.toContain('Bet 16BB（满池）');
    expect(text('drill-l3-cbet')).toContain('同花听牌（9 outs）');
    expect(text('drill-l3-cbet')).not.toContain('后门同花听牌');
  });

  it('三街几何与 turn 后门听牌失效', () => {
    const multistreet = text('l3-multistreet');
    expect(multistreet).toContain('SPR 17 约 114%');
    expect(multistreet).not.toContain('理想三街全下');
    expect(text('l3-float-probe')).toContain('turn 后门同花已失效');
    expect(text('l3-float-probe')).not.toContain('后门同花 + 高牌胜率');
    expect(text('l3-bluffing')).toContain('单街约 20% 胜率');
    expect(text('l3-bluffing')).toContain('后门同花（约4% 到河牌）');
  });
});

describe('标准德州内容复算回归锁：L4', () => {
  it('4-Bet 全下权益、摊牌权益与 blockers 组合数', () => {
    const ev = text('l4-ev-thinking');
    expect(ev).toContain('46.3%');
    expect(ev).toContain('约 42%');
    expect(ev).toContain('约 -7.8BB');
    expect(ev).not.toContain('-11.7BB');
    expect(ev).not.toContain('AKs 对 QQ 单口约 43%');
    expect(ev).toContain('底池赔率约 26%');
    const realCases = text('l4-ev-real-cases');
    expect(realCases).toContain('~54% by river');
    expect(realCases).toContain('+7.7BB');
    expect(realCases).toContain('5.4BB');
    const blockers = text('l4-blockers');
    expect(blockers).toContain('对手 AA/KK 合计 6 种（40%）');
    expect(blockers).not.toContain('你领先的 QQ 占比');
    expect(blockers).toContain('AK 从 16 降至 8');
    expect(blockers).not.toContain('AA 从 6→1');
  });

  it('诈唬比公式、150% overbet 比例与牌力标签', () => {
    const gto = text('l4-gto-basics');
    expect(gto).toContain('f×(P+bP)');
    expect(gto).not.toContain('P+2bP');
    expect(gto).toContain('AK顶对顶踢脚（TPTK）');
    expect(gto).not.toContain('AK同花成牌');
    const gameTree = text('l4-game-tree');
    expect(gameTree).toContain('两头顺组合听牌（约15 outs）');
    expect(gameTree).toContain('后门同花+A高牌（后门顶对）');
    expect(gameTree).toContain('坚果同花，但 All-in 过度');
    expect(gameTree).not.toContain('同花但非坚果');
    const overbet = text('l4-overbet');
    expect(overbet).toContain('Value:Bluff 比例约为 5:3（bluff 37.5%');
    expect(overbet).not.toContain('Value:Bluff 比例约为 2:1');
    const rangeConstruction = text('l4-range-construction');
    expect(rangeConstruction).toContain('面对 150% pot overbet：value:bluff ≈ 5:3');
    expect(rangeConstruction).not.toContain('面对 150% pot overbet：value:bluff ≈ 2:1');
    expect(overbet).toContain('Q 高同花听牌');
    expect(overbet).not.toContain('QJ 是错过的坚果同花听牌');
    const mdf = text('l4-mdf-real-cases');
    expect(mdf).toContain('+4.8BB');
    expect(mdf).toContain('Flop: J-7-3');
    expect(mdf).not.toContain('Flop: JJJ');
    expect(mdf).toContain('AA, KK, JJ, KJ');
    expect(mdf).not.toContain('QQ loses to 95%');
  });
});

describe('标准德州内容复算回归锁：L5-L7', () => {
  it('L5 tilt 牌面与反超牌力', () => {
    const tilt = text('l5-tilt');
    expect(tilt).toContain('Qd');
    expect(tilt).toContain('三条反超');
    expect(tilt).not.toContain('两对反超');
  });

  it('L6 ICM、Push/Fold 与 bounty 听牌', () => {
    const icm = text('l6-icm');
    expect(icm).toContain('$37');
    expect(icm).not.toContain('$36.5');
    expect(icm).toContain('call 需 25% 胜率');
    expect(icm).toContain('37.5%');
    expect(icm).not.toContain('27% × 1.5');
    const push = text('l6-pushfold');
    expect(push).toContain('完整 Nash 范围约 50-55%');
    expect(push).toContain('SB 在 10BB 时 Push 范围约 50-55%');
    expect(push).not.toContain('总计约 70-80% 手牌');
    expect(push).not.toContain('UTG 在 10BB 时 Push 范围接近全开');
    const bounty = text('l6-bounty');
    expect(bounty).toContain('非坚果');
    expect(bounty).not.toContain('你有坚果同花听牌+顺子听牌！');
  });

  it('L7 口袋对、投入额、非坚果听牌与 straddle 倍数', () => {
    const deep = text('l7-deepstack');
    expect(deep).toContain('低于 A/K 的口袋对（underpair）');
    expect(deep).not.toContain('只是第三对');
    expect(deep).toContain('投入3BB（跟注 CO 的 3BB open）');
    expect(deep).not.toContain('投入2BB（SB已投1BB）');
    const multi = text('l7-multiway');
    expect(multi).toContain('非坚果');
    expect(multi).not.toContain('坚果同花听牌+顺子听牌');
    expect(multi).toContain('4 人底池，Q♥J♥ 只有 Q 高同花听牌');
    expect(multi).not.toContain('3人底池QJ高牌');
    const straddle = text('l7-straddle');
    expect(straddle).toContain('7.5x straddle');
    expect(straddle).not.toContain('3x straddle）标准大小');
  });

  it('L2 A5 后门听牌标签', () => {
    const lesson = text('l2-4bet-strategy');
    expect(lesson).toContain('后门顺子潜力');
    expect(lesson).not.toContain('卡顺潜力');
  });
});
