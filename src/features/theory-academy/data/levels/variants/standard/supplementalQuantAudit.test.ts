/**
 * 6-max 现金增补章（chapters/ 目录）量化断言审计 · 独立文件。
 *
 * 为什么不并入 standardQuantAudit.test.ts：该文件已接近行数棘轮上限，只减不增；
 * 增补章数值集中在本文件锁定，判分数据或正文数字漂移即变红。
 *
 * 审计口径与 standardQuantAudit.test.ts 同源：
 * - α（诈唬保本弃牌率）= B/(P+B)；MDF = P/(P+B)
 * - 跟注门槛 = 补注额 ÷ 跟注后底池；SPR = 剩余有效筹码 ÷ 当前底池
 * - 6-max 基准（100bb、无前注）：UTG 19 / HJ 22 / CO 32 / BTN 44 / SB 38
 *
 * 正文人工复核索引（下标含 heading 段、0 起）：
 * [正确] t1-sixmax-table idx10：1.5÷6=0.25bb/手、1.5÷9≈0.17bb/手、身后 5 人 vs 8 人
 * [正确] t3-blind-battle idx6/idx7：4.0→5.5、1.5÷5.5≈27.3%；4.5→6.5、2.0÷6.5≈30.8%；错算 1.5÷4.0=37.5%
 * [正确] t4-sixmax-ranges idx3：双列 19/22/32/44/38 与 15/18/30/35/35
 * [正确] t6-srp-postflop idx2/idx5/idx6：5.5、97.5、SPR≈17.7；α(1/4)=20%/MDF=80%、α(1/3)≈25%/MDF=75%；1.8→9.1→15.1
 * [正确] t6-3bet-pot idx2/idx5/idx8/idx9：20.5/90/4.4、40.5/80/2.0；62+8=70≈5.3%；44.9%/39.9%；7+23+60=90
 * [正确] t6-turn-river idx6/idx8/idx10：α 33.3/42.9/50%、跟注 25/30/33.3%；8/24≈33.3%、4/20=20%；1.5×池 α=60%、37.5%、5:3
 * [正确] t9-sixmax-capstone idx4/idx6/idx7：6.5/97.5/SPR 15.0；6÷22.5≈26.7%、10÷46≈22%；15÷52.5≈28.6%
 */
import { describe, it, expect } from 'vitest';
import { THEORY_LEVELS } from '../../index';
import type { TheoryChapter, TheoryQuizQuestion } from '../../../../types';
import { calculateAlpha, calculateMDF, requiredEquity } from '../../../../utils/theoryFormulas';

const chapters = THEORY_LEVELS.flatMap((level) => level.chapters);

const chapterById = (id: string): TheoryChapter => {
  const chapter = chapters.find((c) => c.id === id);
  expect(chapter, `章节 ${id} 存在`).toBeDefined();
  return chapter as TheoryChapter;
};

const sectionText = (chapterId: string, index: number): string =>
  chapterById(chapterId).content[index]?.content ?? '';

const getQuiz = (chapterId: string, questionId: string): TheoryQuizQuestion => {
  const question = chapterById(chapterId).quiz.find((q) => q.id === questionId);
  expect(question, `小测题 ${questionId} 存在`).toBeDefined();
  return question as TheoryQuizQuestion;
};

const expectAnswerIs = (chapterId: string, questionId: string, answer: string) => {
  const question = getQuiz(chapterId, questionId);
  expect(question.options[question.correctIndex], `${questionId} 复算后的正确选项`).toBe(answer);
};

const SUPPLEMENTAL_IDS = [
  't1-sixmax-table',
  't3-blind-battle',
  't4-sixmax-ranges',
  't6-srp-postflop',
  't6-3bet-pot',
  't6-turn-river',
  't9-sixmax-capstone',
] as const;

describe('6-max 增补章：基准与盲注战数值', () => {
  it('t1-sixmax-table：每手盲注成本与身后人数可复算', () => {
    expect(1.5 / 6).toBe(0.25);
    expect(1.5 / 9).toBeCloseTo(0.1667, 4);
    const formula = sectionText('t1-sixmax-table', 10);
    expect(formula).toContain('0.25bb/手');
    expect(formula).toContain('0.17bb/手');
    expect(formula).toContain('身后 5 人');
    expect(formula).toContain('身后 8 人');
    expectAnswerIs('t1-sixmax-table', 't1-sixmax-table-q1', 'SB（小盲）');
    expectAnswerIs(
      't1-sixmax-table',
      't1-sixmax-table-q2',
      '两套命名的座位数不同，满员桌的中位在 6-max 没有对应座位，不能逐座一一映射',
    );
    expectAnswerIs(
      't1-sixmax-table',
      't1-sixmax-table-q3',
      '每手牌分摊的盲注成本更高，且身后尚未表态的对手更少',
    );
  });

  it('t3-blind-battle：BB 防守门槛 27.3% / 30.8%，错算 37.5%', () => {
    expect(requiredEquity(1.5, 5.5)).toBeCloseTo(0.2727, 4);
    expect(requiredEquity(2.0, 6.5)).toBeCloseTo(0.3077, 4);
    expect(1.5 / 4.0).toBe(0.375);
    const text = sectionText('t3-blind-battle', 6);
    expect(text).toContain('27.3%');
    expect(text).toContain('37.5%');
    const formula = sectionText('t3-blind-battle', 7);
    expect(formula).toContain('27.3%');
    expect(formula).toContain('30.8%');
    expectAnswerIs('t3-blind-battle', 't3-blind-battle-q1', '27.3%');
    expectAnswerIs(
      't3-blind-battle',
      't3-blind-battle-q2',
      '小盲开池的手牌组合约占全部起手牌的三成多，是范围宽度而不是胜率',
    );
    expectAnswerIs(
      't3-blind-battle',
      't3-blind-battle-q3',
      '平跟让大盲免费看翻牌，而小盲翻后永远最先行动、权益难以实现',
    );
  });

  it('t4-sixmax-ranges：双列 RFI 表逐行锁定', () => {
    const table = sectionText('t4-sixmax-ranges', 3);
    expect(table).toContain('UTG 19 / 15');
    expect(table).toContain('HJ 22 / 18');
    expect(table).toContain('CO 32 / 30');
    expect(table).toContain('BTN 44 / 35');
    expect(table).toContain('SB 38 / 35');
    expectAnswerIs('t4-sixmax-ranges', 't4-sixmax-ranges-q1', 'BTN（按钮位）');
    expectAnswerIs(
      't4-sixmax-ranges',
      't4-sixmax-ranges-q2',
      '新手列是入门期的简化、整体更紧，只用来建立位置感，熟练后要切回标准列',
    );
    expectAnswerIs(
      't4-sixmax-ranges',
      't4-sixmax-ranges-q3',
      '以最强价值牌与带阻断的诈唬牌组成极化结构，中等牌跟注或弃牌',
    );
  });
});

describe('6-max 增补章：翻后底池、尺度与承诺线', () => {
  it('t6-srp-postflop：SPR≈17.7、小尺度 α/MDF 与三街尺度链', () => {
    expect((100 - 2.5) / 5.5).toBeCloseTo(17.727, 3);
    expect(calculateAlpha(1, 0.25)).toBeCloseTo(0.2, 10);
    expect(calculateMDF(1, 0.25)).toBeCloseTo(0.8, 10);
    expect(calculateAlpha(1, 1 / 3)).toBeCloseTo(0.25, 10);
    expect(calculateMDF(1, 1 / 3)).toBeCloseTo(0.75, 10);
    const ledger = sectionText('t6-srp-postflop', 2);
    expect(ledger).toContain('5.5bb');
    expect(ledger).toContain('97.5bb');
    expect(ledger).toContain('17.7');
    const alphaTable = sectionText('t6-srp-postflop', 5);
    expect(alphaTable).toContain('20%');
    expect(alphaTable).toContain('25%');
    const example = sectionText('t6-srp-postflop', 6);
    expect(example).toContain('1.8bb');
    expect(example).toContain('9.1bb');
    expect(example).toContain('15.1bb');
    expect(5.5 + 1.8 + 1.8).toBeCloseTo(9.1, 10);
    expect(9.1 + 3 + 3).toBeCloseTo(15.1, 10);
    expectAnswerIs(
      't6-srp-postflop',
      't6-srp-postflop-q1',
      '成本低：1/3 池的保本弃牌率只有约 25%，整个范围都下得起',
    );
    expectAnswerIs(
      't6-srp-postflop',
      't6-srp-postflop-q2',
      'A 高、K 高的干燥牌面与成对牌面',
    );
    expectAnswerIs(
      't6-srp-postflop',
      't6-srp-postflop-q3',
      '这张牌补齐了对手范围里的听牌，而自己的下注范围已没有对应的价值牌',
    );
  });

  it('t6-3bet-pot：3BP/4BP 的 SPR、承诺门槛与尺度阶梯', () => {
    expect(90 / 20.5).toBeCloseTo(4.39, 2);
    expect(80 / 40.5).toBeCloseTo(1.975, 3);
    expect(requiredEquity(90, 200.5)).toBeCloseTo(0.4489, 4);
    expect(requiredEquity(80, 200.5)).toBeCloseTo(0.399, 3);
    expect(6 * 5 + 16 + 16).toBe(62);
    expect((62 + 8) / 1326).toBeCloseTo(0.0528, 4);
    expect(7 + 23 + 60).toBe(90);
    const ledger = sectionText('t6-3bet-pot', 2);
    expect(ledger).toContain('20.5bb');
    expect(ledger).toContain('90bb');
    expect(ledger).toContain('4.4');
    expect(ledger).toContain('40.5bb');
    expect(ledger).toContain('80bb');
    expect(ledger).toContain('2.0');
    const combos = sectionText('t6-3bet-pot', 5);
    expect(combos).toContain('62 个');
    expect(combos).toContain('70 个');
    expect(combos).toContain('5.3%');
    const commitment = sectionText('t6-3bet-pot', 8);
    expect(commitment).toContain('44.9%');
    expect(commitment).toContain('39.9%');
    const ladder = sectionText('t6-3bet-pot', 9);
    expect(ladder).toContain('7bb');
    expect(ladder).toContain('23bb');
    expect(ladder).toContain('60bb');
    expect(ladder).toContain('80.5bb');
    expectAnswerIs(
      't6-3bet-pot',
      't6-3bet-pot-q1',
      '有效筹码相对底池的倍数下降，承诺线与尺度都要跟着变',
    );
    expectAnswerIs(
      't6-3bet-pot',
      't6-3bet-pot-q2',
      '翻后最先行动，权益实现率偏低，必须用能承受 4-bet 的牌',
    );
    expectAnswerIs(
      't6-3bet-pot',
      't6-3bet-pot-q3',
      '降低，因为底池里已有的死钱替你跟注方分摊了一部分风险',
    );
  });

  it('t6-turn-river：α、跟注权益、均衡诈唬占比与超池条件', () => {
    expect(calculateAlpha(1, 0.5)).toBeCloseTo(1 / 3, 10);
    expect(calculateAlpha(1, 0.75)).toBeCloseTo(0.4286, 4);
    expect(calculateAlpha(1, 1)).toBeCloseTo(0.5, 10);
    expect(requiredEquity(0.5, 2)).toBeCloseTo(0.25, 10);
    expect(requiredEquity(0.75, 2.5)).toBeCloseTo(0.3, 10);
    expect(requiredEquity(1, 3)).toBeCloseTo(1 / 3, 10);
    expect(8 / 24).toBeCloseTo(1 / 3, 10);
    expect(4 / 20).toBe(0.2);
    expect(requiredEquity(1 / 3, 5 / 3)).toBeCloseTo(0.2, 10);
    expect(calculateAlpha(1, 1.5)).toBeCloseTo(0.6, 10);
    expect(requiredEquity(1.5, 4)).toBeCloseTo(0.375, 10);
    const formula = sectionText('t6-turn-river', 6);
    expect(formula).toContain('33.3%');
    expect(formula).toContain('42.9%');
    expect(formula).toContain('50%');
    expect(formula).toContain('25%');
    expect(formula).toContain('30%');
    const example = sectionText('t6-turn-river', 8);
    expect(example).toContain('33.3%');
    expect(example).toContain('20%');
    const overbet = sectionText('t6-turn-river', 10);
    expect(overbet).toContain('60%');
    expect(overbet).toContain('37.5%');
    expect(overbet).toContain('5:3');
    expectAnswerIs(
      't6-turn-river',
      't6-turn-river-q1',
      '弃牌率 50%，跟注方权益 33.3%',
    );
    expectAnswerIs(
      't6-turn-river',
      't6-turn-river-q2',
      '下注尺度：尺度越大，均衡要求的诈唬占比越高',
    );
    expectAnswerIs(
      't6-turn-river',
      't6-turn-river-q3',
      '对手在这条行动线上能代表的合法价值组合数',
    );
  });
});

describe('6-max 增补章：综合实战与结构', () => {
  it('t9-sixmax-capstone：SPR=15、转河跟注门槛与五步链', () => {
    expect(97.5 / 6.5).toBeCloseTo(15, 10);
    expect(6 / 22.5).toBeCloseTo(0.2667, 4);
    expect(10 / 46).toBeCloseTo(0.2174, 4);
    expect(15 / 52.5).toBeCloseTo(0.2857, 4);
    const setup = sectionText('t9-sixmax-capstone', 4);
    expect(setup).toContain('6.5bb');
    expect(setup).toContain('15.0');
    const turn = sectionText('t9-sixmax-capstone', 6);
    expect(turn).toContain('26.7%');
    expect(turn).toContain('22%');
    const river = sectionText('t9-sixmax-capstone', 7);
    expect(river).toContain('28.6%');
    expectAnswerIs(
      't9-sixmax-capstone',
      't9-sixmax-capstone-q1',
      '确认位置与有效筹码，并据此算出筹码底池比',
    );
    expectAnswerIs(
      't9-sixmax-capstone',
      't9-sixmax-capstone-q2',
      '筹码的风险权重不同，同样数量的筹码代表的价值不同',
    );
    expectAnswerIs(
      't9-sixmax-capstone',
      't9-sixmax-capstone-q3',
      '加大价值下注的尺度，并把诈唬降到接近零',
    );
  });

  it('7 个增补章全部存在且标记为 supplemental', () => {
    for (const id of SUPPLEMENTAL_IDS) {
      const chapter = chapterById(id);
      expect(chapter.supplemental, `${id} 必须标记为增补章`).toBe(true);
      expect(chapter.subtitle, `${id} 副标题必须写明可选`).toContain('可选，不影响解锁');
    }
  });
});
