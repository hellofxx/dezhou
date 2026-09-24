/**
 * 阶段 7 全量量化断言审计 · short-deck + heads-up 变体批次 2 · 侧内守卫测试。
 *
 * 与 standardQuantAudit.test.ts 同一口径（批次 1 单源），两部分职责：
 * 1. 题库类可复算断言（quiz 中带明确数字的判分题）：按统一口径（Alpha = b/(P+b)、
 *    MDF = 1/(1+b)、跟注所需胜率 = b/(P+2b)、诈唬密度 = b/(1+2b)、组合数学、
 *    outs 精确概率、偷盲保本弃牌率）在本测试内**重新计算**，断言正确选项文本
 *    与复算结果一致——判分数据若被改动（数字、correctIndex、选项文本任一漂移）
 *    测试即红。
 * 2. 正文散文数值无法自动断言的，以文件头「人工复核索引」注释清单记录
 *    （文件 + 章节 id + content 索引 + 复算结论）。
 *
 * short-deck 专属口径（与标准局不同）：
 * - 36 张牌（6-A，每花色 9 张）：C(36,2)=630、口袋对 9×6=54（占 8.57%）
 * - 翻牌后未知牌 = 31（36−2−3）；转牌后 = 30；单张 outs 单街 = 1/31 ≈ 3.2%
 * - 5 outs 双街 1−(26/31)(25/30) ≈ 30.1%；8 outs 双街 1−(23/31)(22/30) ≈ 45.6%
 * - set mining = 1−C(32,3)/C(34,3) ≈ 17.1%（与满员桌 1−C(48,3)/C(50,3) 同口径）
 * - 权威精确枚举（pokerpro.tools，2026-08 全枚举）：AKs vs QQ 53.7%/46.3%、
 *   AKo vs QQ 51.8%/48.2%、AA vs KK 74.6%/25.4%——AK 对中小口袋对五五开偏上
 * - heads-up 偷盲口径：以 SB 直接弃牌为基准（0.5 死钱沉没），min-raise 2BB
 *   保本弃牌率 = 50%（与 t7hu 的 f×1.5=(1−f)×1.5 单源）
 */
import { describe, it, expect } from 'vitest';
import { shortDeckLevels, headsUpLevels } from './index';
import type { TheoryChapter, TheoryQuizQuestion } from '../../../types';

/*
 * ========================= 人工复核索引（正文散文数值，批次 2 复算结论） =========================
 * 锚点：文件:章节 id + content 数组索引。「正确」= 复算与原文一致；「示意值」= 依赖外部
 * 统计/经验常数或范围模拟，正文已用「约」，保留不改；「规则集说明」= 变体规则约定。
 *
 * —— short-deck ——
 * [规则集说明] variantRules.ts 短牌采用 house rule：三条 > 顺子（tripsBeatsStraight: true）。
 *   现代 Triton 主流规则为顺子 > 三条（pokerpro 全枚举：7 张成顺 14.0% vs 成三条 7.3%）；
 *   本模块 9 级内容一致采用 house rule，全部数值推演自洽，未改动；如后续切换规则集须整体重审。
 * [规则集说明→建议] variantRules.ts preFlopHandStrength.pairBeatsAnyAceKing: true 颗粒度粗于
 *   精确枚举结论（AK 翻前全下对 66-QQ 五五开偏上，仅对 AA/KK 明显落后）；本次只修正正文
 *   与判分题数值，标志语义复核留待规则审计批次。
 * [正确] t1sd-combinatorics idx2/4：C(36,2)=630；口袋对 54=9×C(4,2)；54/630≈8.57%→8.6%；
 *        78/1326≈5.88%→5.9%；同花 4/非同花 12（每点数 4 张不变）
 * [正确] t1sd-combinatorics idx5（修复后）：持 A♠K♠ 扣阻断→口袋对 48（AA/KK 各 C(3,2)=3）、
 *        AK 3×3=9、AQ 3×4=12；12/69≈17.4%→约 17%
 * [正确] t1sd-combinatorics idx5（修复后）+ idx6 + q5：AKs vs QQ ≈ 53.7%、AKo vs QQ ≈ 51.8%、
 *        AK vs KK ≈ 32%-35%、AK vs AA ≈ 28%-31%（pokerpro.tools 全枚举）
 * [正确] t1sd-outs idx2/4/6：同花 outs=9−4=5；未知牌 31=36−2−3；5/31≈16.1%→16%；
 *        双街 1−(26/31)(25/30)=30.1%→30%；8/31≈25.8%→26%；8 outs 双街 45.6%→46%；
 *        满员桌对照 9/47≈19%、5 outs 双街 20.3%→20%、8/47≈17%
 * [示意值] t1sd-combinatorics q5（原版）/idx5：AK 对任意口袋对 43%-45%——已按精确枚举修正，
 *          不再保留旧口径
 * [正确] t1sd-variance idx3/4/5：σ=√(p(1−p))×池底 框架（池底=总注入的伯努利近似）；
 *        0.5^8≈0.39%→0.4%；标准差 150-220、50/150 买入（业界典型，正文标"典型/建议"）
 * [正确] t2sd-potodds idx2/4/6：4/(8+4+4)=25%；5/(10+5+5)=25%；b/(P+2b) 口径全对；
 *        修复后 5 outs 单街 16%（5/31）、双街 30.1%→30%；8 outs 单街 26%、双街 45.6%→46%
 * [正确] t2sd-implied idx2/4（修复后）：set mining = 1−C(32,3)/C(34,3)=1−4960/5984≈17.12%→17.1%
 *        （原 C(31,3)/C(33,3)=17.6% 分母无有效依据）；满员桌同口径 11.76%→12% ✓
 * [示意值] t2sd-implied idx2/6：set mining 门槛 短牌 15-20 倍 / 满员桌 10-12 倍（经验锚点，
 *          与 heads-up 侧"满员桌 15-20 倍"表述存在跨文件口径差，均为示意，建议后续统一）
 * [正确] t3sd-rankings idx4/5/6/8（修复后）：AK 对 88 50%-55% 略优；77 中三条 17.1%
 * [示意值] t3sd-suitedness idx2：JTs 42-44% / 98s 40-42% / 76s 38-40%（vs 随机范围，依赖模拟；
 *          方向正确——短牌同花连牌 vs 随机低于满员桌同位牌，因对子密度与成牌重排）
 * [正确] t3sd-suitedness idx5 + q4：已见红心 A♥9♥K♥=3 → 同花 outs = 9−3 = 6
 * [正确] t4sd-range-construction idx0/q1（修复后）：8.6% vs 5.9% 对子密度 ✓；
 *        投机层牌级范围 66-99（原 99-22 引用短牌不存在的 22-55）
 * [正确] t4sd-blockers idx6（修复后）：翻前 3-bet 诈唬对照牌 A6s（短牌无 5，原 A5s）
 * [示意值] t4sd-equity idx2/4/6：单挑顶对 60-70% / 三人池 35-45% / 每多一对手稀释 10-20%
 *          （依赖对手范围假设，正文用"约/可能"）
 * [正确] t4sd-blockers idx4：持 K 时对手 KK 6 种→3 种（C(4,2)→C(3,2)）✓
 * [正确] t5sd-gto-short idx2：诈唬占比 b/(1+2b)：满池 1/3（2:1）、半池 1/4（3:1）；
 *        MDF=1/(1+b)：半池 67%、满池 50% ✓
 * [正确] t5sd-bluff idx2：半诈唬 EV 公式 f×P−(1−f)(1−E)B+(1−f)E(P+B)；代入 f=0.5/P=8/B=4/
 *        E=0.35 → 4−1.3+2.1=4.8 ✓；纯空气 0.5×8−0.5×4=2 ✓；"高 2-3 倍"≈2.4× ✓
 * [正确] t6sd-sizing idx2/q5：f=b/(1+2b)：1/3 池 20%、半池 25%、满池 33%、2 倍池 40% ✓
 * [正确] t6sd-barrel idx2（修复后）：P=6 逐街 2/3 池几何 14→32.67→76.22（32.7/21.8/76.2），
 *        原 32.6/21.7/75.9 累计截断误差
 * [正确] t7sd-adjustment idx5（修复后）：短牌同花 5 outs 单街 ≈16%（5/31，原 15% 为 8/33 误分母）
 * [正确] t7sd-mistakes idx2：同花听牌满员桌 9 outs（13−4）vs 短牌 5（9−4）✓
 * [正确] t7sd-mistakes idx4/实例三（修复后）：剥削口径改 AA vs AK ≈70%、KK vs AK ≈65%-68%
 * [正确] t8sd-variance idx2：σ=√(0.5×0.5)×100=50；50×√50≈353.6→354；期望 0 ✓；0.5^8≈0.4% ✓
 * [正确] t8sd-tilt idx4（修复后）：AK 对 66 五五开偏上（原"AK 对 55 43%-45%"含非法牌级 55）
 * [正确] t9sd-case-study idx5/q3（修复后）：湿润面 9♦8♣6♥、相对干燥面 K♠7♦J♣（合法牌张）
 *
 * —— heads-up ——
 * [正确] t1hu-probability idx2/q2：C(50,2)=1225、C(46,2)=1035、1−1035/1225≈15.5%；
 *        持 AA 后对手 AA=1/1225≈0.08%；满员桌 8/1225≈0.65%（并集近似，正文标"约"）
 * [正确] t1hu-probability idx2（修复后）：AKo vs 8 随机对手 ≈20%（AKs 表值 vs1-8=67/50/40/34/
 *        29/26/23/21 延伸、AKo 略低；原 30% 与同段 AA=35% 矛盾）；AA vs 8 ≈35%
 *        （dpskill 对照表 85.2/73.4/63.9/55.9/49.2/43.6/38.7/34.6 末端；beatthefish 31% 为
 *        另一口径，取与项目 t9-multiway 表同源的 35%）；九人桌最差手牌 ≈5%（示意）
 * [正确] t1hu-probability idx4：AKo vs 随机 65.4%、AA vs 随机 85%、72o vs 随机 ≈35% ✓
 * [正确] t1hu-outs idx2/4/6：6 outs（45 已知对手底牌口径）双街 6/45+(39/45)(6/44)=25.15%→25.2%
 *        （修复 (39/45)(6/44)=11.82%→11.8% 舍入）；15 outs 1−(32/47)(31/46)=54.1%、
 *        修正公式 15×4−(15−8)=53 ✓；9/47≈19.1% ✓；隐含赔率 X=0.472/0.191≈2.5 ✓
 * [正确] t1hu-variance idx2/4/5/6（修复后）：盲注频率 4.5 倍=1/(2/9)；σ=√0.24×100≈49；
 *        49√50≈346（原 347 舍入偏高）；期望 1000；1000/346≈2.9σ→0.2%；
 *        0.45^5≈1.8%、0.45^8≈0.17%、0.45^10≈0.034%；2000/5000=40% ✓；标准差 120-180（业界典型示意）
 * [正确] t2hu-odds idx2/q1：SB limp 0.5/(1.5+0.5)=25%，EV 推导链 2E=0.5→25% 自洽；
 *        q2/idx4：3BB 开池 2/(4+2)=33.3%、满员桌 BTN 3/(4.5+3)=40% ✓；速算表 25/20/28.6/33.3 ✓
 * [正确] t2hu-odds idx3（修复后）：QJ 翻牌 T-8-3 为卡顺（A 转牌后 K/9 双向 8 outs），
 *        8/46≈17.4%→17%；删除原"顶对 2 个 Outs（Q/J 各剩 1 张）"错误加项（各剩 3 张且
 *        A 在板上成对非顶对），决策结论（弃牌/CR）保持
 * [正确] t2hu-ev idx2/4：EV(call)=E(P+2B)−B；0.3×6−0.7×2=+0.4 ✓；f*=B/(P+B)=3/9=33.3% ✓；
 *        例一 9/47=19.15%→19.1%、EV=−0.47、X≈2.5 ✓；例二 0.29/0.53 模型自洽 ✓
 * [正确] t2hu-risk idx2（修复后）：净盈利口径 9BB（EV=12W−3 在 W=1 处 +9）；CR 参数测试
 *        12×0.35−3=+1.2、0.6×9+0.4×(8.4−9)=+5.16 ✓；例一（修复后）EV(CR)=0.55×7.5+
 *        0.45×(13×0.32−8)=+2.4（终局底池 21−8=13 净赢口径，与公式块 24W−9 一致；
 *        原 15.5×0.32−8 混用口径且 −1.398 算术误）；q2：18f−9=−3→f=33.3% ✓
 * [正确] t2hu-risk idx4：SPR=97.5/5≈19.5、12.5/5=2.5 ✓；set mining 门槛 20-25 倍（示意，
 *        与短牌侧同注）
 * [正确] t3hu-sb-strategy idx2/q2（修复后）：以弃牌为基准的偷盲模型 f×1.5=(1−f)×1.5→50%
 *        （原"目标奖池 1BB"口径 60% 与 t7hu 的 1.5/1.5 口径冲突，且把已沉没 0.5 重复计损）；
 *        尺度表 2.5BB→57.1%、3BB→62.5%；例二 −0.45/+0.6（修复后）
 * [正确] t3hu-bb-defense idx2：MDF 双口径 33.3%（全投入口径）与 37.5%（增量口径）并存，
 *        结论"33%-38%"区间诚实；BB 面对min-raise 再跟 1 → 1/4=25% ✓（含死钱口径单列，
 *        无 33.3% 残留）；K7s 48% vs 需 25% 富余 23 个百分点 ✓
 * [正确] t3hu-bb-defense idx5（修复后）：isolate EV 1.05−0.7=0.35（原 0.8 算术误）
 * [正确] t3hu-position-reversal idx2/q2：0.05/0.10/0.20 → 0.35、河牌 0.2/0.35≈57% ✓；
 *        例一 0.7×27%+0.3×6%≈21% ✓；例二（修复后）双方各持同点异花 K-Q（原"双方都持
 *        K♠Q♠"为不可能场景）；1/3 池≈5BB（16 池）✓
 * [正确] t4hu-range-width idx2/4/q2：min-raise 再跟 1/总池 4=25% ✓；K6s 46-48%、76s 权益
 *        约 20%/55%（依赖范围，示意）
 * [正确] t4hu-range-width idx6（修复后）：6-5 配 K-8-4 面卡顺听 7 共 4 张（原"2 张 7"误）
 * [正确] t4hu-polarization idx2/q2：满池 f=1/3（2:1）、半池 f=0.25（3:1）推导链 ✓；
 *        例一（修复后）min-raise+跟注底池 4BB、半池 2BB
 * [正确] t4hu-blocking idx4（修复后）：三黑桃面（K♠9♠4♠ 单挑合法）剩余黑桃 13−3=10 张，
 *        坚果同花 10 种（原 12 种漏减牌面 3 张）✓
 * [正确] t5hu-frequency idx4/6/8：MDF=1/(1+b) 67/50/33、Alpha=1−MDF；只防 40% → 0.6×2−0.4×1=
 *        +0.8 ✓；半池诈唬 25%/满池 33%（价值:诈唬口径）✓
 * [正确] t6hu-sizing idx2/q5：f=b/(1+2b)=20/25/33/40% ✓；idx4（修复后）底池 4BB、
 *        1/3 池≈1.3BB；SPR 链 3.3/7.8/18.1→63.5/86BB ✓（原 11.6/7.7/27/63 为截断值）
 * [正确] t6hu-barrel idx2（修复后）：7♦ 完成 JT/T6/65 顺子（9-8-4-7 面上 QT 不成顺）；
 *        几何 P=5：3.3→11.7→7.8→27.2→18.1→63.5 ✓（原 63 为截断）
 * [正确] t7hu-exploit idx2/q2：f×1.5−(1−f)×1.5：f=0.4→−0.3、f=0.6→+0.3、f=0.5→0
 *        （与 t3hu 修复后口径单源）✓
 * [正确] t8hu-pressure idx2/4/6：0.4^6≈0.41%→0.4%；0.45^8≈0.17%；σ 期望链与 t1hu 一致；
 *        AK vs 55 约 43%（满员桌模拟低段示意值，保留"约"）
 * [正确] t9hu-mastery idx4（修复后）：纯偷盲需 50% 弃牌率（口径统一）；KQs 对宽范围约 60%
 *        （15BB 全下 vs 紧跟注范围，示意）
 */

describe('variant 量化断言审计：short-deck 组合与概率判分题复算', () => {
  const chapters = shortDeckLevels.flatMap((l) => l.chapters);
  const getQuiz = (chapterId: string, questionId: string): TheoryQuizQuestion => {
    const chapter = chapters.find((c) => c.id === chapterId);
    expect(chapter, `章节 ${chapterId} 存在`).toBeDefined();
    const q = (chapter as TheoryChapter).quiz.find((x) => x.id === questionId);
    expect(q, `小测题 ${questionId} 存在`).toBeDefined();
    return q as TheoryQuizQuestion;
  };
  const expectAnswerIs = (chapterId: string, questionId: string, answer: string) => {
    const q = getQuiz(chapterId, questionId);
    expect(q.options[q.correctIndex], `${questionId} 复算后的正确选项`).toBe(answer);
  };

  it('t1sd-combinatorics：C(36,2)=630、口袋对 54 占 8.6%、AKs vs QQ 权威口径', () => {
    expect((36 * 35) / 2).toBe(630);
    expect(9 * ((4 * 3) / 2)).toBe(54);
    expect(54 / 630).toBeGreaterThan(0.085);
    expect(54 / 630).toBeLessThan(0.0865);
    expect(78 / 1326).toBeGreaterThan(0.058);
    expect(78 / 1326).toBeLessThan(0.0595);
    expectAnswerIs('t1sd-combinatorics', 't1sd-combinatorics-q1', '36 张');
    expectAnswerIs('t1sd-combinatorics', 't1sd-combinatorics-q2', '630 种');
    expectAnswerIs('t1sd-combinatorics', 't1sd-combinatorics-q3', '约 8.6%');
  });

  it('t1sd-combinatorics-q5：短牌 AKs 对 QQ ≈ 54% 领先（精确枚举 53.7%，满员桌反转为 46%）', () => {
    // 锁定权威锚点：不允许回退到"AK 对口袋对 43%-45% 落后"的满员桌旧口径
    expectAnswerIs('t1sd-combinatorics', 't1sd-combinatorics-q5', '约 54%');
    const q = getQuiz('t1sd-combinatorics', 't1sd-combinatorics-q5');
    expect(q.question).toContain('AKs');
    expect(q.question).toContain('QQ');
  });

  it('t1sd-outs：同花 outs=9−4=5、未知牌 31、8 outs 单街 26%/双街 46%', () => {
    expect(9 - 4).toBe(5);
    expect(36 - 2 - 3).toBe(31);
    expect(5 / 31).toBeGreaterThan(0.16);
    expect(5 / 31).toBeLessThan(0.162);
    expect(8 / 31).toBeGreaterThan(0.257);
    expect(8 / 31).toBeLessThan(0.259);
    // q1/q2/q3/q5：判分选项锁定
    expectAnswerIs('t1sd-outs', 't1sd-outs-q1', '9 − 已见该花色张数');
    expectAnswerIs('t1sd-outs', 't1sd-outs-q2', '5');
    expectAnswerIs('t1sd-outs', 't1sd-outs-q3', 'outs ÷ 31');
    expectAnswerIs('t1sd-outs', 't1sd-outs-q5', '约 26%');
  });

  it('t2sd-potodds：b/(P+2b)=25%、5 outs 单街 16%（÷31 非÷33）、8 outs 双街 46%', () => {
    expect(4 / (8 + 4 + 4)).toBe(0.25);
    // 短牌双街精确：5 outs 与 8 outs
    const flushTwo = 1 - ((31 - 5) / 31) * ((30 - 5) / 30);
    const straightTwo = 1 - ((31 - 8) / 31) * ((30 - 8) / 30);
    expect(flushTwo).toBeGreaterThan(0.30);
    expect(flushTwo).toBeLessThan(0.302);
    expect(Math.round(straightTwo * 100)).toBe(46);
    expectAnswerIs('t2sd-potodds', 't2sd-potodds-q2', '25%');
    expectAnswerIs('t2sd-potodds', 't2sd-potodds-q3', '约 16%');
    expectAnswerIs('t2sd-potodds', 't2sd-potodds-q5', '约 46%');
  });

  it('t2sd-implied-q3：set mining = 1−C(32,3)/C(34,3) ≈ 17.1%（满员桌同口径 11.8%）', () => {
    const shortDeck = 1 - ((32 * 31 * 30) / 6) / ((34 * 33 * 32) / 6);
    const fullRing = 1 - ((48 * 47 * 46) / 6) / ((50 * 49 * 48) / 6);
    expect(shortDeck).toBeGreaterThan(0.17);
    expect(shortDeck).toBeLessThan(0.172);
    expect(Math.round(fullRing * 100)).toBe(12);
    expectAnswerIs('t2sd-implied', 't2sd-implied-q3', '约 17.1%');
  });

  it('t3sd-rankings-q3：AK 对 KK ≈ 33%（精确枚举 32%-35%，原 25% 无依据）', () => {
    expectAnswerIs('t3sd-rankings', 't3sd-rankings-q3', '约 33%');
    // 权威锚点：AKs vs QQ 53.7%（对子压制口径不得回退）
    expectAnswerIs('t3sd-rankings', 't3sd-rankings-q1', '约 54%');
  });

  it('t3sd-suitedness-q4：A♥9♥ 配 K♥8♦6♣ 面 3 张已见红心 → 同花 outs = 6', () => {
    expect(9 - 3).toBe(6);
    expectAnswerIs('t3sd-suitedness', 't3sd-suitedness-q4', '6');
  });

  it('t5sd-bluff：半诈唬 EV=4.8 vs 纯空气 EV=2（逐项复算）', () => {
    const f = 0.5, pot = 8, bet = 4, eWin = 0.35;
    const evSemi = f * pot - (1 - f) * (1 - eWin) * bet + (1 - f) * eWin * (pot + bet);
    const evAir = f * pot - (1 - f) * bet;
    expect(evSemi).toBeCloseTo(4.8, 6);
    expect(evAir).toBeCloseTo(2, 6);
    expect(evSemi / evAir).toBeGreaterThan(2);
    expect(evSemi / evAir).toBeLessThan(3);
  });

  it('t6sd-sizing：诈唬占比 f=b/(1+2b) 表 20/25/33/40%', () => {
    const f = (b: number) => b / (1 + 2 * b);
    expect(Math.round(f(1 / 3) * 100)).toBe(20);
    expect(f(0.5)).toBe(0.25);
    expect(Math.round(f(1) * 100)).toBe(33);
    expect(f(2)).toBe(0.4);
    expectAnswerIs('t6sd-sizing', 't6sd-sizing-q5', '25%');
  });

  it('t6sd-barrel：P=6 逐街 2/3 池几何 14→32.7→76.2（锁定精确复算）', () => {
    const bet = (p: number) => (2 / 3) * p;
    const p0 = 6;
    const p1 = p0 + 2 * bet(p0); // 14
    const p2 = p1 + 2 * bet(p1); // 32.667
    const p3 = p2 + 2 * bet(p2); // 76.222
    expect(p1).toBe(14);
    expect(Math.round(p2 * 10) / 10).toBe(32.7);
    expect(Math.round(bet(p2) * 10) / 10).toBe(21.8);
    expect(Math.round(p3 * 10) / 10).toBe(76.2);
  });

  it('t8sd-variance：σ=50、50×√50≈354、0.5^8≈0.4%（判分题锁定）', () => {
    expect(Math.sqrt(0.5 * 0.5) * 100).toBe(50);
    expect(Math.round(50 * Math.sqrt(50))).toBe(354);
    expect(0.5 ** 8).toBeGreaterThan(0.0038);
    expect(0.5 ** 8).toBeLessThan(0.004);
    expectAnswerIs('t8sd-variance', 't8sd-variance-q2', '高频对抗下的数学常态，应保持决策质量');
  });
});

describe('variant 量化断言审计：heads-up 判分题复算', () => {
  const chapters = headsUpLevels.flatMap((l) => l.chapters);
  const getQuiz = (chapterId: string, questionId: string): TheoryQuizQuestion => {
    const chapter = chapters.find((c) => c.id === chapterId);
    expect(chapter, `章节 ${chapterId} 存在`).toBeDefined();
    const q = (chapter as TheoryChapter).quiz.find((x) => x.id === questionId);
    expect(q, `小测题 ${questionId} 存在`).toBeDefined();
    return q as TheoryQuizQuestion;
  };
  const expectAnswerIs = (chapterId: string, questionId: string, answer: string) => {
    const q = getQuiz(chapterId, questionId);
    expect(q.options[q.correctIndex], `${questionId} 复算后的正确选项`).toBe(answer);
  };

  it('t1hu-probability：1−C(46,2)/C(50,2)≈15.5%、对手 AA 0.08% vs 满员桌 0.65%', () => {
    expect((50 * 49) / 2).toBe(1225);
    expect((46 * 45) / 2).toBe(1035);
    expect(1 - 1035 / 1225).toBeGreaterThan(0.154);
    expect(1 - 1035 / 1225).toBeLessThan(0.156);
    expect(1 / 1225).toBeLessThan(0.0009);
    expect(8 / 1225).toBeGreaterThan(0.0064);
    expect(8 / 1225).toBeLessThan(0.0066);
    expectAnswerIs('t1hu-probability', 't1hu-probability-q1', '约 65%');
    expectAnswerIs('t1hu-probability', 't1hu-probability-q2', '约 15.5%');
    expectAnswerIs('t1hu-probability', 't1hu-probability-q4', '更低：对手拿 AA 约 0.08%');
  });

  it('t1hu-outs：6 outs 双街 25.2%（11.8% 舍入锁定）、15 outs 54.1% 与修正公式 53', () => {
    const sixTwo = 6 / 45 + ((45 - 6) / 45) * (6 / 44);
    expect(sixTwo).toBeGreaterThan(0.25);
    expect(sixTwo).toBeLessThan(0.253);
    expect(Math.round(((45 - 6) / 45) * (6 / 44) * 1000) / 10).toBe(11.8);
    const fifteen = 1 - ((47 - 15) / 47) * ((46 - 15) / 46);
    expect(fifteen).toBeGreaterThan(0.54);
    expect(fifteen).toBeLessThan(0.542);
    expect(15 * 4 - (15 - 8)).toBe(53);
    expectAnswerIs('t1hu-outs', 't1hu-outs-q1', '约 25%');
    expectAnswerIs('t1hu-outs', 't1hu-outs-q2', '约 54%');
    expectAnswerIs('t1hu-outs', 't1hu-outs-q4', '约 54%');
  });

  it('t1hu-variance：0.45^5/0.45^8/0.45^10、σ=49、49√50≈347、期望 1000、2.9σ', () => {
    expect(0.45 ** 5).toBeGreaterThan(0.018);
    expect(0.45 ** 5).toBeLessThan(0.019);
    expect(Math.round(0.45 ** 8 * 10000) / 100).toBeCloseTo(0.17, 1);
    expect(Math.round(0.45 ** 10 * 100000) / 100000).toBeCloseTo(0.00034, 5);
    const sigma = Math.sqrt(0.6 * 0.4) * 100;
    expect(Math.round(sigma)).toBe(49);
    expect(Math.round(sigma * Math.sqrt(50))).toBe(346);
    expect(50 * 0.2 * 100).toBe(1000);
    expect(Math.round(1000 / 347 * 10) / 10).toBe(2.9);
    expectAnswerIs('t1hu-variance', 't1hu-variance-q1', '约 0.03%');
    expectAnswerIs('t1hu-variance', 't1hu-variance-q4', '50 个以上买入');
  });

  it('t2hu-odds：SB limp 25%、3BB 开池 2/(4+2)=33.3%、满员桌 BTN 40%', () => {
    expect(0.5 / (1.5 + 0.5)).toBe(0.25);
    // EV 推导链自洽：E×1.5 − (1−E)×0.5 = 0 → E = 25%
    const e = 0.5 / 2;
    expect(e).toBe(0.25);
    expect(2 / (4 + 2)).toBeCloseTo(1 / 3, 10);
    expect(3 / (4.5 + 3)).toBe(0.4);
    expectAnswerIs('t2hu-odds', 't2hu-odds-q1', '25%');
    expectAnswerIs('t2hu-odds', 't2hu-odds-q2', '33.3%');
  });

  it('t2hu-ev：EV(call)=+0.4、纯诈唬 f*=33.3%、隐含赔率 X≈2.5', () => {
    expect(0.3 * 6 - 0.7 * 2).toBeCloseTo(0.4, 10);
    expect(3 / (6 + 3)).toBeCloseTo(1 / 3, 10);
    // 9 outs 单街负 EV 的隐含赔率补偿
    const pHit = 9 / 47;
    const x = (0.809 * 2 - 0.191 * 6) / 0.191;
    expect(pHit).toBeGreaterThan(0.19);
    expect(pHit).toBeLessThan(0.192);
    expect(x).toBeGreaterThan(2.4);
    expect(x).toBeLessThan(2.6);
    expectAnswerIs('t2hu-ev', 't2hu-ev-q2', '+0.4BB');
  });

  it('t2hu-risk：check-raise 例算口径（净赢 13=21−8）与 q2 保本弃牌率 33.3%', () => {
    // 被跟注后终局底池 21、投入 8 → 净赢 13；EV(CR)=0.55×7.5+0.45×(13×0.32−8)=+2.4
    const evCr = 0.55 * 7.5 + 0.45 * (13 * 0.32 - 8);
    expect(evCr).toBeGreaterThan(2.3);
    expect(evCr).toBeLessThan(2.5);
    // 纯诈唬 CR：EV=f×9−(1−f)×9 vs CC −3 → 18f−9=−3 → f=1/3
    expect(18 * (1 / 3) - 9).toBe(-3);
    expectAnswerIs('t2hu-risk', 't2hu-risk-q2', '33.3%');
  });

  it('t3hu-sb-strategy-q2：偷盲保本弃牌率 50%（沉没成本口径，禁回退 60%）', () => {
    // 以 SB 直接弃牌为基准：0.5 已沉没；加注 1.5 → 赢 1.5 / 输 1.5
    const breakEven = 1.5 / (1.5 + 1.5);
    expect(breakEven).toBe(0.5);
    // 尺度表：2.5BB → 57.1%、3BB → 62.5%
    expect(Math.round((2 / 3.5) * 1000) / 10).toBe(57.1);
    expect(2.5 / 4).toBe(0.625);
    expectAnswerIs('t3hu-sb-strategy', 't3hu-sb-strategy-q2', '约 50%');
  });

  it('t3hu-bb-defense：死钱口径 MDF≈33.3%、增量口径 37.5%、min-raise 跟注线 25%', () => {
    expect(1 - 3 / (1.5 + 3)).toBeCloseTo(1 / 3, 10);
    expect(1 - 2.5 / (1.5 + 2.5)).toBe(0.375);
    // BB 面对 min-raise：再跟 1 / 终池 4 = 25%（含死钱，单列复算）
    expect(1 / (1.5 + 1.5 + 1)).toBe(0.25);
    expectAnswerIs('t3hu-bb-defense', 't3hu-bb-defense-q1', '60%-70%');
    expectAnswerIs('t3hu-bb-defense', 't3hu-bb-defense-q2', '约 33%');
  });

  it('t3hu-position-reversal-q2：街间位置价值 0.05/0.10/0.20 → 河牌 57%', () => {
    const total = 0.05 + 0.1 + 0.2;
    expect(total).toBeCloseTo(0.35, 10);
    expect(Math.round((0.2 / total) * 100)).toBe(57);
    expectAnswerIs('t3hu-position-reversal', 't3hu-position-reversal-q2', '约 57%');
  });

  it('t4hu-polarization-q2：满池价值:诈唬 2:1（f=1/3 推导）', () => {
    // 对手跟注站无差别：f×2P = (1−f)×P → f = 1/3
    const f = 1 / 3;
    expect(2 * f).toBeCloseTo(1 - f, 10);
    expectAnswerIs('t4hu-polarization', 't4hu-polarization-q2', '2:1');
  });

  it('t4hu-blocking：三黑桃面剩余 10 张黑桃 → 坚果同花 10 种（非 12）', () => {
    // K♠9♠4♠ 上桌、持 A♦A♣：剩余黑桃 = 13 − 3（牌面）
    expect(13 - 3).toBe(10);
  });

  it('t5hu-frequency-q1：半池 MDF=1/(1+0.5)≈67%', () => {
    expect(1 / (1 + 0.5)).toBeCloseTo(2 / 3, 10);
    expectAnswerIs('t5hu-frequency', 't5hu-frequency-q1', '67%');
  });

  it('t7hu-exploit-q2：偷盲 EV 1.5/1.5 口径（与 t3hu 修复后单源）', () => {
    expect(0.4 * 1.5 - 0.6 * 1.5).toBeCloseTo(-0.3, 10);
    expect(0.6 * 1.5 - 0.4 * 1.5).toBeCloseTo(0.3, 10);
    expectAnswerIs('t7hu-exploit', 't7hu-exploit-q2', '+0.3BB');
  });

  it('t6hu-barrel-q3 与几何链：P=5 三连 2/3 池 → 63.5（锁定精确复算）', () => {
    const bet = (p: number) => (2 / 3) * p;
    const p0 = 5;
    const p1 = p0 + 2 * bet(p0); // 11.667
    const p2 = p1 + 2 * bet(p1); // 27.222
    const p3 = p2 + 2 * bet(p2); // 63.519
    expect(Math.round(p1 * 10) / 10).toBe(11.7);
    expect(Math.round(p2 * 10) / 10).toBe(27.2);
    expect(Math.round(bet(p2) * 10) / 10).toBe(18.1);
    expect(Math.round(p3 * 10) / 10).toBe(63.5);
  });
});

describe('variant 量化断言审计：非法牌张守卫（short-deck 不存在 2-5）', () => {
  it('short-deck 全部 content 与 quiz 文本不得出现非法牌级（2/3/4/5 的花色牌或 22-55 牌级引用）', () => {
    const illegalPatterns = [
      /[2345][♠♥♦♣]/, // 非法花色牌（2♠-5♣ 等）
      /听 [2345] 或|或 [2345] 组成顺子/, // 听非法牌级
    ];
    const offenders: string[] = [];
    for (const level of shortDeckLevels) {
      for (const chapter of level.chapters) {
        chapter.content.forEach((sec, i) => {
          for (const re of illegalPatterns) {
            if (re.test(sec.content)) offenders.push(`${chapter.id}.content[${i}]: ${sec.content.slice(0, 40)}`);
          }
        });
        for (const q of chapter.quiz) {
          const texts = [q.question, ...q.options, q.explanation];
          texts.forEach((text, j) => {
            for (const re of illegalPatterns) {
              if (re.test(text)) offenders.push(`${q.id}.texts[${j}]: ${text.slice(0, 40)}`);
            }
          });
        }
      }
    }
    expect(offenders, `发现非法牌张引用：\n${offenders.join('\n')}`).toEqual([]);
  });

  it('short-deck 两头顺示例的 outs 必须可用 31 张未知牌复算（防 ÷33/÷47 回归）', () => {
    const chapters = shortDeckLevels.flatMap((l) => l.chapters);
    const outs = chapters.find((c) => c.id === 't1sd-outs');
    expect(outs).toBeDefined();
    const texts = (outs as TheoryChapter).content.map((s) => s.content).join('\n');
    expect(texts).toContain('31 张');
    expect(texts).not.toContain('÷ 33');
    expect(texts).not.toContain('8/33');
    expect(texts).not.toContain('÷ 47');
    expect(texts).not.toContain('8/47 ≈ 26');
  });
});
