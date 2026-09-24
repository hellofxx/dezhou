/**
 * 阶段 7 全量量化断言审计 · strategy 侧 short-deck + heads-up + localLessons 批次 2 · 侧内守卫测试。
 *
 * 与 theory 侧 variantQuantAudit.test.ts / 侧内 standardQuantAudit.test.ts 同一口径（批次 1 单源），
 * 两部分职责：
 * 1. 题库类可复算断言（quiz 中带明确数字的判分题）：按统一口径（Alpha = b/(P+b)、
 *    MDF = 1/(1+b)、跟注所需胜率 = b/(P+2b)、诈唬密度 = b/(1+2b)、组合数学、outs 精确
 *    概率、偷盲保本弃牌率）在本测试内**重新计算**，断言正确选项文本与复算结果一致——
 *    判分数据若被改动（数字、correctIndex、选项文本任一漂移）测试即红。
 * 2. 正文散文数值以「内容文本锁定 + 本测试内重算」双保险（如短牌 set mining 17.1%、
 *    Maniac 5-Bet EV +68BB）；无法自动断言的示意值不在此清单，不判错。
 *
 * short-deck 专属口径（与 theory 侧批次 2 单源）：
 * - 36 张牌（6-A，无 2-5）：C(36,2)=630；口袋对 9×C(4,2)=54（占 8.57%）
 * - 翻牌后未知牌 = 31（36−2−3）；转牌后 = 30；单街命中率 = outs/31
 * - 5 outs 双街 1−(26/31)(25/30) ≈ 30.1%；8 outs 双街 1−(23/31)(22/30) ≈ 45.6%
 * - set mining = 1−C(32,3)/C(34,3) ≈ 17.1%（÷33 与 17.6% 均为无依据旧口径）
 * - 权威精确枚举（pokerpro.tools，全枚举）：AKs vs QQ 53.7%/46.3%、AKo vs QQ 51.8%/48.2%
 *   —— AK 对 66-QQ 五五开偏上；短牌无 5，「AK 对 55」「99-22」「A5s」均为非法引用
 * - heads-up 偷盲口径：以 SB 直接弃牌为基准（0.5 死钱沉没），min-raise 保本弃牌率
 *   = 1.5/(1.5+1.5) = 50%（与 theory 侧 t3hu/t7hu 的 1.5/1.5 口径单源；旧「目标奖池
 *   1BB」60% 口径重复计损 0.5 死钱，禁回退）
 */
import { describe, it, expect } from 'vitest';
import { SHORT_DECK_STRATEGY_COURSES } from './short-deck';
import { HEADS_UP_STRATEGY_COURSES } from './heads-up';
import { LOCAL_LESSONS } from '../../localLessons';
import type { Lesson, QuizQuestion } from '../../../types';

/*
 * ========================= 人工复核索引（批次 2 逐文件遍历结论） =========================
 * 「已修」= 本批次已改数据 + zh 逐字镜像 + en 原子改。
 * 「示意值」= 业界经验常数/范围，正文已用「约」，不视为错误。
 *
 * —— short-deck（l3sd~l8sd，6 文件） ——
 * [已修] l4sd-preflop-ranges objectives/highlight/q5/p2：「AK 对任何口袋对 43%-45% 落后」→
 *        AKs vs QQ ≈ 53.7% 领先（对 66-QQ 五五开偏上，仅对 AA/KK 明显落后）
 * [已修] l4sd-preflop-ranges content/q2/ex1：投机层 99-22 → 66-99（短牌无 2-5）；
 *        中三条概率 17.6% → 17.1%（1−C(32,3)/C(34,3)）
 * [已修] l4sd-nuts-equity objectives/content formula/pro-tip/q3/q5/ex1：÷33 → ÷31
 *        （翻牌后未知牌 36−2−3=31）；5 outs 15%/28% → 16%/30%；8 outs 24%/44% → 26%/46%；
 *        「outs×2 更准」→ outs×3（1/31≈3.2%/out）
 * [已修] l4sd-nuts-equity example2/p2/p3：89 配 6-7-2 只单向听 T（5 非法）→ 合法 8-outs
 *        结构 TJ 配 8-9-6（听 7/Q）与 TJ 配 6-9-Q（听 8/K）；p3 78 配 9-6-J 听 T + 同花听 6 outs
 * [已修] l4sd-blocker-bluff key-point/example/p1/p3：花色统一 A♠X♠；K♠9♠4♠ → K♠9♠6♠；
 *        p1「后门同花」→ 同花听牌 6 outs（9−3）；p3 6 outs → 5 outs（9−4，板 2 张红心）
 * [已修] l5sd-tilt objectives/example2：「AK 对 55（43%-45%）」→ AK 对 66 五五开偏上（短牌无 5）
 * [已修] l3sd/l5sd/l6sd/l7sd/l8sd 全量非法牌张：board/正文/题干中 2-5 花色牌与 5♥ 转牌
 *        全部替换为合法牌面（性质保持：干燥/湿润连接/同花听牌等）
 * [示意值] l3sd-check-raise EV(x/r)=3.15（f=0.5/P=6/R=6/E=0.35 逐项复算自洽）；
 *          l7sd-shallow EV(shove)=1.11（复算自洽）；KQs≈45%/K8o≈30%（vs 范围示意）；
 *          l6sd AK≈45%/KQs≈58%/A4s≈50%（vs 全下范围示意）；donk 频率 3-5%、C-Bet 频率带
 *
 * —— heads-up（l3hu~l8hu，6 文件） ——
 * [已修] l4hu-bn-opening objectives/key-point/formula/example2/q2：偷盲保本 60% → 50%
 *        （以弃牌为基准 f×1.5=(1−f)×1.5；旧「目标奖池 1BB」口径把已沉没 0.5 重复计损）；
 *        尺度对比 min-raise 50%、2.5BB 57.1%、3BB 62.5%（= 增量/(1.5+增量)，与 theory 侧单源）；
 *        example2 EV −0.125BB → +0.15BB（0.55×1.5−0.45×1.5）
 * [已修] l4hu-ev-adjustments formula / l4hu-counter formula+objectives：EV(steal) = f×1 −
 *        (1−f)×1.5 → f×1.5 − (1−f)×1.5；f=0.4 → −0.3、f=0.6 → +0.3、f=0.7 → +0.6
 * [已修] l3hu-bb-defense content ex1：「双卡顺（4 张 6 + 4 张 9）」→「（4 张 4 + 4 张 9）」
 *        （76 配 8-5-2 缺 4/9，6 是自己手牌）
 * [已修] l3hu bn-p3/bb-p2 板面：98 于 J-6-2、87 于 J-6-3 均无单街顺（缺两张）→
 *        改 J-7-2 / J-9-3（真卡顺听 T）
 * [已修] l3hu-sb-continuation p3：「76 于 9-5-4 双卡顺」→ 卡顺（听 8，5-6-7-8-9 单向）
 * [已修] l5hu-opp-p3：「98 中对 + 卡顺」→ 中对（88）（J-8-5 面无卡顺潜力）
 * [已修] l7hu-stakes objectives/content/q1：open 范围 50-70% → 约 80%（与 L3/L4 侧内统一）；
 *        p4「后门同花」→ 同花听牌 10 outs（板 Th 已见 1 张红心）
 * [已修] l8hu-p3：「后门同花」→ 同花听牌 10 outs（板 3s 已见 1 黑桃）
 * [已修] l3hu-bb-defense 25% 回归锁：SB min-raise 跟注线 1÷(1.5+1.5+1)=25%（含死钱），
 *        pro-tip/objectives/ex1/formula 四处口径一致，无 33.3% 残留（CHANGELOG 记载曾修，本批全量复核清零）
 * [示意值] l6hu A4s≈50%/A7o≈55%/KQs≈58%（vs 全下范围示意）；l5hu 疲劳征兆、session 时长；
 *          l7hu SPR 4.3（80/18.5 翻前有效口径，自洽）
 *
 * —— localLessons（7 文件） ——
 * [已修] local-exploit-maniac objectives/content：KK 5-Bet EV「0.75×200−0.25×100=+125」
 *        → 决策点口径 +68BB（0.75×113.5−0.25×69；原式把回款当净赢且用总投入计损失）
 * [已修] local-exploit-calling-station example：open 4BB → 2.5BB（pot 5.5，与 C-Bet 2.5≈1/2、
 *        4≈2/3 pot 自洽）
 * [已修] local-straddle objectives/key-point/content×2/highlight/q2：「有效筹码减半 50BB
 *        effective」→ SPR 口径（2BB straddle 不改有效筹码 ~98-100BB；底池预置 1.5→4.5BB）
 * [已修] local-ante objectives/content/q3：BB 跟注所需胜率 37.5%/28.8% → 27.3%/22.4%
 *        （1.5/(4+1.5)、1.5/(5.2+1.5)；旧口径漏算 BB 已投 1BB 死钱）
 * [已修] local-limp-multiway example：89s 配 7♠T♠2♦「共 15 outs」→ 16 outs
 *        （8 顺子 + 10 同花 − 重叠 6♠/J♠；与 theory 侧同源修复）
 * [已修] local-deep-implied example：「跟注 8BB 赢 11.5BB」→ 约 9.5BB（0.5+1+8）
 * [已修] local-deep-suited objectives/content/example/q4：15 outs → 16 outs（10 同花 +
 *        6 顺子 − 5♠/J♠；单街 34%、两条街 57%、二四法则 64%）
 * [已修] local-mental-stop-loss example：买入换算链修正（1 buy-in = 100BB = $50；
 *        单 session 300BB、单日 500BB、单周 1000BB；原把 $50 买入当 50BB 计）
 * [已修] local-deep-implied EV：0.12×500−0.88×8 = +53BB 复算自洽 ✓（保留）；
 *        local-when-to-deviate EV：0.68×5.5−0.32×2 = +3.10BB 复算自洽 ✓（保留）
 * [示意值] 对手画像统计锚点（VPIP/PFR/AF/3-bet）、隔离尺度 4-5/6-7/8-10BB、TPTK 多人底池
 *          胜率 60%/35%、抽水占比、止损三档 buy-in 数本身
 */

describe('variant 量化断言审计：short-deck 判分题复算', () => {
  const lessons = SHORT_DECK_STRATEGY_COURSES;
  const getLesson = (id: string): Lesson => {
    const lesson = lessons.find((l) => l.id === id);
    expect(lesson, `课程 ${id} 存在`).toBeDefined();
    return lesson as Lesson;
  };
  const contentText = (id: string): string =>
    getLesson(id).content.map((s) => s.content).join('\n');
  const getQuiz = (lessonId: string, questionId: string): QuizQuestion => {
    const lesson = getLesson(lessonId);
    const q = lesson.quiz.find((x) => x.id === questionId);
    expect(q, `小测题 ${questionId} 存在`).toBeDefined();
    return q as QuizQuestion;
  };
  const expectAnswerIs = (lessonId: string, questionId: string, answer: string) => {
    const q = getQuiz(lessonId, questionId);
    expect(q.options[q.correctIndex], `${questionId} 复算后的正确选项`).toBe(answer);
  };

  it('l4sd-preflop-ranges：AKs vs QQ ≈ 54% 领先（权威锚点，禁回退 43%-45% 落后）', () => {
    expectAnswerIs('l4sd-preflop-ranges', 'l4sd-preflop-ranges-q5', '约 54%（领先）');
    const q = getQuiz('l4sd-preflop-ranges', 'l4sd-preflop-ranges-q5');
    expect(q.question).toContain('AKs');
    expect(q.question).toContain('QQ');
    // 投机层牌级：短牌无 2-5，最小对 66
    expectAnswerIs('l4sd-preflop-ranges', 'l4sd-preflop-ranges-q2', '66-99 对子 + 同花连牌 JTs+ + 同花 Ax');
  });

  it('l4sd-nuts-equity：短牌未知牌 31、5 outs 16%/30%、8 outs 26%/46%（÷31 口径锁定）', () => {
    expect(36 - 2 - 3).toBe(31);
    expect(5 / 31).toBeGreaterThan(0.16);
    expect(5 / 31).toBeLessThan(0.162);
    const flushTwo = 1 - ((31 - 5) / 31) * ((30 - 5) / 30);
    expect(flushTwo).toBeGreaterThan(0.3);
    expect(flushTwo).toBeLessThan(0.302);
    const straightTwo = 1 - ((31 - 8) / 31) * ((30 - 8) / 30);
    expect(Math.round(straightTwo * 100)).toBe(46);
    expectAnswerIs('l4sd-nuts-equity', 'l4sd-nuts-equity-q5', 'outs ÷ 31');
    expectAnswerIs('l4sd-nuts-equity', 'l4sd-nuts-equity-q3', '约 46%');
    expectAnswerIs('l4sd-nuts-equity', 'l4sd-nuts-equity-q2', '5');
    expectAnswerIs('l4sd-nuts-equity', 'l4sd-nuts-equity-q1', '9 − 已见该花色张数');
    // 公式块锁定（÷31 与基准表）
    const formula = contentText('l4sd-nuts-equity');
    expect(formula).toContain('outs ÷ 31');
    expect(formula).toContain('5/31 ≈ 16%');
    expect(formula).toContain('8/31 ≈ 26%');
    expect(formula).not.toContain('÷ 33');
    expect(formula).not.toContain('33)');
    // 短牌 set mining 与满员桌同口径对比
    const setMining = 1 - ((32 * 31 * 30) / 6) / ((34 * 33 * 32) / 6);
    expect(setMining).toBeGreaterThan(0.17);
    expect(setMining).toBeLessThan(0.172);
    expect(contentText('l4sd-preflop-ranges')).toContain('约 17.1%');
  });

  it('l4sd-blocker-bluff：板/手同花已见数决定 outs（p1 6 outs 与 p3 5 outs 互锁）', () => {
    // p1：板 Q♦8♦ 两方块 + 手 Ad 一方块 = 3 已见 → 同花 outs = 9 − 3 = 6
    // p3：板 9♥7♥ 两红心 + 手 KhQh 两红心 = 4 已见 → 同花 outs = 9 − 4 = 5
    expect(9 - 3).toBe(6);
    expect(9 - 4).toBe(5);
    expect(6).not.toBe(5); // 两题口径不得混用（曾把 p1 写成后门、p3 写成 9−3）
    const lesson = getLesson('l4sd-blocker-bluff');
    const practiceText = (lesson.practice?.questions ?? [])
      .map((p) => p.options.map((o) => o.explanation).join('\n'))
      .join('\n');
    expect(practiceText).toContain('6 outs = 9−3 已见');
    expect(practiceText).toContain('5 outs（9−4 已见）');
    const q2 = getQuiz('l4sd-blocker-bluff', 'l4sd-blocker-bluff-q2');
    expect(q2.options[q2.correctIndex]).toContain('0');
  });

  it('l3sd-check-raise 半诈唬 x/r EV：f=0.5/P=6/R=6/E=0.35 → 3.15（逐项复算）', () => {
    const f = 0.5, pot = 6, raise = 6, eWin = 0.35;
    const ev = f * pot - (1 - f) * ((1 - eWin) * raise - eWin * (pot + raise));
    expect(ev).toBeCloseTo(3.15, 10);
    expect(contentText('l3sd-check-raise')).toContain('3 + 0.15 = 3.15');
  });

  it('l7sd-shallow-stack Push/Fold EV：全下 15/弃牌率 40%/胜率 45% → +1.11（复算）', () => {
    const pot = 3, shove = 15, foldRate = 0.4, eWin = 0.45;
    const ev = foldRate * pot - (1 - foldRate) * (shove * (1 - eWin) - eWin * (pot + shove));
    expect(ev).toBeCloseTo(1.11, 6);
    expect(contentText('l7sd-shallow-stack')).toContain('1.2 − 0.09 = 1.11');
  });
});

describe('variant 量化断言审计：heads-up 判分题复算（25% 回归锁）', () => {
  const lessons = HEADS_UP_STRATEGY_COURSES;
  const getLesson = (id: string): Lesson => {
    const lesson = lessons.find((l) => l.id === id);
    expect(lesson, `课程 ${id} 存在`).toBeDefined();
    return lesson as Lesson;
  };
  const contentText = (id: string): string =>
    getLesson(id).content.map((s) => s.content).join('\n');
  const getQuiz = (lessonId: string, questionId: string): QuizQuestion => {
    const lesson = getLesson(lessonId);
    const q = lesson.quiz.find((x) => x.id === questionId);
    expect(q, `小测题 ${questionId} 存在`).toBeDefined();
    return q as QuizQuestion;
  };
  const expectAnswerIs = (lessonId: string, questionId: string, answer: string) => {
    const q = getQuiz(lessonId, questionId);
    expect(q.options[q.correctIndex], `${questionId} 复算后的正确选项`).toBe(answer);
  };

  it('l3hu-bb-defense-q1：防守频率 60%-70%（位置防守基准）', () => {
    expectAnswerIs('l3hu-bb-defense', 'l3hu-bb-defense-q1', '60%-70%');
  });

  it('BB 面对 SB min-raise 跟注线 25%（含死钱口径，回归锁：禁回退 33.3%）', () => {
    // BB 已投 1BB 死钱必须计入分母：1 ÷ (0.5+1.5+1+1)…等价于再跟 1 ÷ 跟注后总底池 4
    const required = 1 / (1.5 + 1.5 + 1);
    expect(required).toBe(0.25);
    const naiveWithoutDeadMoney = 1 / (1.5 + 1.5);
    expect(naiveWithoutDeadMoney).toBeCloseTo(1 / 3, 10); // 漏算死钱得到的 33.3% 错值
    // 判分题 + 正文四处口径全部锁定
    expectAnswerIs('l4hu-ev-adjustments', 'l4hu-ev-adjustments-q2', '25%');
    const formula = contentText('l4hu-ev-adjustments');
    expect(formula).toContain('1 ÷ (1.5 + 1.5 + 1) = 1 ÷ 4 = 25%');
    expect(formula).toContain('不可漏算');
    const bbLesson = getLesson('l3hu-bb-defense');
    const bbText = bbLesson.content.map((s) => s.content).join('\n');
    const bbExample = (bbLesson.examples ?? [])
      .map((e) => [...(e.correctDecision.reasoning ?? []), e.commonMistake?.reasoning ?? ''].join('\n'))
      .join('\n');
    expect(bbText).toContain('1÷(3+1)=25%');
    expect(bbExample).toContain('所需胜率 = 1÷4 = 25%');
    expect(`${bbText}\n${bbExample}`).not.toContain('33.3%');
  });

  it('SB min-raise 纯偷盲保本弃牌率 50%（沉没成本口径，禁回退 60% 目标奖池口径）', () => {
    // 以 SB 直接弃牌为基准：0.5 已沉没；再投 1.5 → 弃牌赢 1.5 / 被跟注输 1.5
    const breakEven = 1.5 / (1.5 + 1.5);
    expect(breakEven).toBe(0.5);
    const legacy = 1.5 / 2.5; // 旧口径 60%（重复计损 0.5 死钱）
    expect(legacy).toBeCloseTo(0.6, 10);
    const formula = contentText('l4hu-bn-opening');
    expect(formula).toContain('f = 1.5/(1.5+1.5) = 50%');
    expect(formula).toContain('2.5BB（再投 2）→ 2/3.5 ≈ 57.1%');
    expect(formula).toContain('2.5/4 = 62.5%');
    expect(formula).not.toContain('1.5/2.5 = 60%');
    const counterFormula = contentText('l4hu-counter-strategies');
    expect(counterFormula).toContain('0.4×1.5 − 0.6×1.5 = −0.3BB');
    expect(counterFormula).toContain('0.6×1.5 − 0.4×1.5 = +0.3BB');
    expect(counterFormula).toContain('0.7×1.5 − 0.3×1.5 = +0.6BB');
  });

  it('l4hu-ev-adjustments：诈唬密度 b/(1+2b) 与 MDF 1/(1+b) 基准（半池 25%/67%）', () => {
    const bluffShare = (b: number) => b / (1 + 2 * b);
    expect(bluffShare(1)).toBeCloseTo(1 / 3, 10);
    expect(bluffShare(0.5)).toBe(0.25);
    const mdf = (b: number) => 1 / (1 + b);
    expect(mdf(0.5)).toBeCloseTo(2 / 3, 10);
    expect(mdf(1)).toBe(0.5);
    expectAnswerIs('l4hu-gto-basics', 'l4hu-gto-basics-q2', '2:1');
    expectAnswerIs('l4hu-gto-basics', 'l4hu-gto-basics-q3', '单挑范围极宽、下注频率高、诈唬密度大');
  });

  it('l7hu-stakes-q1：HU open 范围约 80%（侧内统一口径，禁回退 50-70%）', () => {
    expectAnswerIs('l7hu-stakes', 'l7hu-stakes-q1', '约 80%');
    expectAnswerIs('l3hu-bn-aggression', 'l3hu-bn-aggression-q2', '约 80%');
  });
});

describe('variant 量化断言审计：localLessons 判分题复算', () => {
  const lessons = LOCAL_LESSONS;
  const getLesson = (id: string): Lesson => {
    const lesson = lessons.find((l) => l.id === id);
    expect(lesson, `课程 ${id} 存在`).toBeDefined();
    return lesson as Lesson;
  };
  const contentText = (id: string): string =>
    getLesson(id).content.map((s) => s.content).join('\n');
  const getQuiz = (lessonId: string, questionId: string): QuizQuestion => {
    const lesson = getLesson(lessonId);
    const q = lesson.quiz.find((x) => x.id === questionId);
    expect(q, `小测题 ${questionId} 存在`).toBeDefined();
    return q as QuizQuestion;
  };
  const expectAnswerIs = (lessonId: string, questionId: string, answer: string) => {
    const q = getQuiz(lessonId, questionId);
    expect(q.options[q.correctIndex], `${questionId} 复算后的正确选项`).toBe(answer);
  };

  it('local-ante-q3：Ante 局 BB 跟注所需胜率 22.4%（死钱口径，禁回退 28.8%）', () => {
    // 无 Ante：1.5 ÷ (4+1.5)；有 Ante：1.5 ÷ (5.2+1.5)——分母含 BB 已投 1BB 死钱
    const noAnte = 1.5 / (0.5 + 2.5 + 1 + 1.5);
    const withAnte = 1.5 / (2.7 + 2.5 + 1.5);
    expect(noAnte).toBeGreaterThan(0.272);
    expect(noAnte).toBeLessThan(0.274);
    expect(withAnte).toBeGreaterThan(0.223);
    expect(withAnte).toBeLessThan(0.225);
    // 漏算死钱的旧口径复算（对照）
    expect(1.5 / 4).toBe(0.375);
    expect(1.5 / 5.2).toBeCloseTo(0.288, 3);
    expectAnswerIs('local-ante', 'local-ante-q3', '约 22.4%（赔率更好）');
    expect(contentText('local-ante')).toContain('1.5/(5.2+1.5) ≈ 22.4%');
  });

  it('local-deep-sc-q4：16 outs 两条街 ≈ 57%（单街 34%，二四法则 64% 对照）', () => {
    expect(16 / 47).toBeGreaterThan(0.34);
    expect(16 / 47).toBeLessThan(0.341);
    const twoStreet = 1 - ((47 - 16) / 47) * ((46 - 16) / 46);
    expect(twoStreet).toBeGreaterThan(0.569);
    expect(twoStreet).toBeLessThan(0.571);
    expectAnswerIs('local-deep-suited-connectors', 'local-deep-sc-q4', '约 57%');
    // 87♠ 配 6♠9♠T♦ 的 16 outs 组成：同花 13−3=10、顺子非重叠 8−2=6 → 合计 16
    expect((13 - 3) + (8 - 2)).toBe(16);
  });

  it('local-limp-multiway：89♠ 配 7♠T♠2♦ 组合听牌 16 outs（15 为漏算口径）', () => {
    // 顺子缺 6/J 各 4 张 = 8；同花 13−3 = 10；重叠 6♠/J♠ 不重复计 → 16
    expect(8 + 10 - 2).toBe(16);
    expect(contentText('local-limp-multiway')).toContain('共 16 outs');
    expect(contentText('local-limp-multiway')).not.toContain('共 15 outs');
  });

  it('local-exploit-maniac：KK 5-Bet 跟注 EV ≈ +68BB（决策点口径，禁回退 +125）', () => {
    // 决策点底池 = 1.5+3+12+28+69 = 113.5（Maniac all-in 100 超出有效退回，CO 再跟 69）
    const potAtDecision = 1.5 + 3 + 12 + 28 + 69;
    expect(potAtDecision).toBe(113.5);
    const ev = 0.75 * potAtDecision - 0.25 * 69;
    expect(ev).toBeGreaterThan(67.5);
    expect(ev).toBeLessThan(68.5);
    const legacy = 0.75 * 200 - 0.25 * 100; // 旧口径 +125（回款当净赢 + 总投入计损）
    expect(legacy).toBe(125);
    expect(contentText('local-exploit-maniac')).toContain('0.75 × 113.5 - 0.25 × 69 ≈ +68BB');
    expect(contentText('local-exploit-maniac')).not.toContain('+125BB');
  });

  it('local-when-to-deviate：Fold to C-Bet 68% 时 1/3 池诈唬 EV = +3.10BB（复算自洽锁定）', () => {
    const pot = 5.5, bet = 2, foldRate = 0.68;
    const ev = foldRate * pot - (1 - foldRate) * bet;
    expect(ev).toBeCloseTo(3.1, 6);
    expect(contentText('local-when-to-deviate')).toContain('+3.10BB');
  });

  it('local-exploit-nit：偷盲后 1/3 池 C-Bet EV = +3.25BB（复算自洽锁定）', () => {
    // pot = 0.5+2.5+2.5 = 5.5；EV = 0.7×5.5 − 0.3×2
    expect(0.5 + 2.5 + 2.5).toBe(5.5);
    expect(0.7 * 5.5 - 0.3 * 2).toBeCloseTo(3.25, 10);
  });

  it('local-mental-stop-loss：买入换算 1 buy-in = 100BB（3/5/10 档 300/500/1000BB）', () => {
    expect(3 * 100).toBe(300);
    expect(5 * 100).toBe(500);
    expect(10 * 100).toBe(1000);
    const example = contentText('local-mental-stop-loss');
    expect(example).toContain('3 × 100BB = 300BB');
    expect(example).not.toContain('3 × 50BB');
  });
});

describe('variant 量化断言审计：short-deck 非法牌张守卫（不存在 2-5）', () => {
  it('short-deck 全部 content 与 quiz 文本不得出现非法花色牌张（2♠-5♣）或非法牌级引用', () => {
    const illegalPatterns = [
      /[2345][♠♥♦♣]/, // 非法花色牌（2♠-5♣ 等）
      /A5s/, // 短牌无 5（3-bet 诈唬对照牌应为 A6s）
    ];
    const offenders: string[] = [];
    for (const lesson of SHORT_DECK_STRATEGY_COURSES) {
      lesson.content.forEach((sec, i) => {
        for (const re of illegalPatterns) {
          if (re.test(sec.content)) {
            offenders.push(`${lesson.id}.content[${i}]: ${sec.content.slice(0, 40)}`);
          }
        }
      });
      for (const q of lesson.quiz) {
        const texts = [q.question, ...q.options, q.explanation];
        texts.forEach((text, j) => {
          for (const re of illegalPatterns) {
            if (re.test(text)) offenders.push(`${q.id}.texts[${j}]: ${text.slice(0, 40)}`);
          }
        });
      }
    }
    expect(offenders, `发现非法牌张引用：\n${offenders.join('\n')}`).toEqual([]);
  });

  it('short-deck 全部 board 数组不得含 2-5 牌张（数据层 structural 扫描）', () => {
    const offenders: string[] = [];
    const rankOf = (card: string) => card[0] ?? '';
    const illegalRanks = new Set(['2', '3', '4', '5']);
    const scanCards = (cards: string[] | undefined, where: string) => {
      for (const c of cards ?? []) {
        if (illegalRanks.has(rankOf(c))) offenders.push(`${where}: ${c}`);
      }
    };
    for (const lesson of SHORT_DECK_STRATEGY_COURSES) {
      for (const ex of lesson.examples ?? []) {
        scanCards(ex.board, `${lesson.id}.${ex.id}.board`);
        scanCards(ex.heroHand, `${lesson.id}.${ex.id}.heroHand`);
      }
      for (const p of lesson.practice?.questions ?? []) {
        scanCards(p.scenario.board, `${lesson.id}.${p.id}.board`);
        scanCards(p.scenario.heroHand, `${lesson.id}.${p.id}.heroHand`);
      }
    }
    expect(offenders, `发现非法牌张：\n${offenders.join('\n')}`).toEqual([]);
  });

  it('short-deck 手牌/示例中的 A5s、99-22、22-55 等非法牌级引用清零（regression）', () => {
    const offenders: string[] = [];
    const patterns = [/99-22/, /A5s/, /AK 对 55/, /vs 55/];
    for (const lesson of SHORT_DECK_STRATEGY_COURSES) {
      const haystacks = [
        ...lesson.content.map((s) => s.content),
        ...(lesson.objectives ?? []),
        ...lesson.quiz.flatMap((q) => [q.question, ...q.options, q.explanation]),
      ];
      haystacks.forEach((text, i) => {
        for (const re of patterns) {
          // 「把…43%-45% 落后…」的反面教材引用允许存在；仅拦截非法牌级本身
          if (re.test(text)) offenders.push(`${lesson.id}.text[${i}]: ${re.source}`);
        }
      });
    }
    expect(offenders, `发现非法牌级引用：\n${offenders.join('\n')}`).toEqual([]);
  });

  it('short-deck outs 口径不得回退 ÷33/÷47（l4sd-nuts-equity 公式块）', () => {
    const lessons = SHORT_DECK_STRATEGY_COURSES;
    const nuts = lessons.find((l) => l.id === 'l4sd-nuts-equity');
    expect(nuts).toBeDefined();
    const texts = (nuts as Lesson).content.map((s) => s.content).join('\n');
    expect(texts).toContain('outs ÷ 31');
    expect(texts).not.toContain('outs ÷ 33');
    expect(texts).not.toContain('5/33');
    expect(texts).not.toContain('8/33');
  });
});
