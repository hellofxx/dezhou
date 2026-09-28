/**
 * 阶段 7 全量量化断言审计 · standard 系批次 1 · 侧内守卫测试。
 *
 * 两部分职责：
 * 1. 题库类可复算断言（quiz 中带明确数字的判分题）：按统一口径（Alpha = b/(P+b)、
 *    MDF = 1/(1+b)、跟注所需胜率 = b/(P+2b)、诈唬密度 = b/(1+2b)、组合数学、
 *    outs 精确概率、ICM 递归、几何尺度）在本测试内**重新计算**，
 *    断言正确选项文本与复算结果一致——判分数据若被改动（数字、correctIndex、
 *    选项文本任一漂移）测试即红。
 * 2. 正文散文数值无法自动断言的，以文件头「人工复核索引」注释清单记录
 *    （文件 + 章节锚点 + content 索引 + 复算结论），作为后续人工复核索引；
 *    其中标注「示意值」的条目按 PRD §6.7.1 呈现诚实性处理，不视为错误。
 *
 * 审计口径单源（与任务书一致，禁止凭印象）：
 * - Alpha（进攻方零 EV 所需弃牌率）= b/(P+b)；MDF = P/(P+b)
 * - 面对下注 b 的跟注所需胜率 = b/(P+2b)：半池 25%、满池 33.3%、2/3 池 28.6%
 * - 含死钱场景单列复算；SPR = 有效筹码/当前底池；同花 4/口袋对 6/非同花 12
 * - outs→概率：单街 outs/剩余牌；双街 1 − ((47−o)/47)((46−o)/46)，修正 −(o−8)
 */
import { describe, it, expect } from 'vitest';
import { THEORY_LEVELS } from '../../index';
import type { TheoryChapter, TheoryQuizQuestion } from '../../../../types';
import {
  calculateAlpha,
  calculateMDF,
  requiredEquity,
  requiredHandsForEdge,
  riskOfRuin,
  multiwayAllFold,
  perDefenderRequiredDefense,
  multiwayBluffEv,
} from '../../../../utils/theoryFormulas';

/*
 * ========================= 人工复核索引（正文散文数值，批次 1 复算结论） =========================
 * 锚点：文件:章节 id + content 数组索引（行号为批次 1 修改后状态，仅供快速定位）。
 * 索引口径：0 起、**含 heading 段**；批次 1 的部分条目按"只数正文段"计，与真实下标差 1，
 * 后续批次以真实下标登记并在改动处顺手校正旧条目（发现即修，不批量重排以免噪声 diff）。
 * 「正确」= 复算与原文一致；「示意值」= 依赖外部统计/经验常数，正文已标注，保留不改。
 * 诚实性提醒：本标签是作者自评——曾有登记为「正确」的 ICM 推导被查出本身有误（见下方 t9-icm idx5），
 * 故「已登记」不等于「已验证」，数值类内容仍需非作者复核（PRD §6.7.3）。
 *
 * —— standardLevel1.ts ——
 * [正确] t1-combinatorics idx1/3/4/5：C(52,2)=1326；169=13+78+78；对子6/同花4/非同花12(4×4−4)；
 *        78/1326≈5.9%(1/17)、6/1326≈0.45%(1/221)、16/1326≈1.2%、同花牌 52/1326≈23.5%；
 *        idx6：QQ+ 18/1326≈1.36%(1/74)；idx7：1−C(48,3)/C(51,3)=1−17296/20825≈16.9%→17%；
 *        idx8：{AA,KK,QQ,AKs}=6+6+6+4=22，口袋对 18/22≈82%
 * [正确] t1-outs idx1：同花听牌 9(13−4)/两头顺 8/卡顺 4/一对听两对三条 5；idx4：9/47≈19.1%、误差 19.15−18=1.15<1.2；
 *        idx5：修正公式 15×4−(15−8)=53（本次修复：原误写 ≈54%，54.1% 为精确值口径）；
 *        idx6：精确值表 4/8/9/12/15 outs = 16.47→16.5/31.45→31.5(本次修复 31.4)/34.97→35.0/44.96→45.0/54.12→54.1，
 *        误差 −0.5/+0.5(本次修复 +0.6)/+1.0/+3.0/+5.9；idx7：精确值 31.5（本次修复）；
 *        idx9：100/400=25%、9/46≈19.6%；idx10：9+3=12 脏 outs、12×2=24%、两张牌精确 44.96→45%
 * [正确] t1-variance idx1/2：80% 五次平均输一次；idx5：μ=60、Σ偏差平方 147000、σ²=29400、σ≈171.46→171；
 *        idx6：翻倍 μ=120/σ≈342；idx7：90×√100=900bb>500bb；idx8：AA vs KK≈81%、0.19³≈0.69%→0.7%、
 *        200 次「连输三输」窗口 ≈1−e^(−n·p³·(1−p))≈67%>60%
 * [示意值] t1-variance idx5：胜率 5bb/100、标准差 80-100bb/100、5 万-10 万手（业界典型，正文已用「通常」）
 * [正确] t1-variance idx15/16（显著性手数，本次新增）：μ=5/100=0.05、σ=80/10=8 →
 *        n=(1.96×8÷0.05)²=313.6²=98,344.96→约 98,300；z=1.645→263.2²=69,274→约 69,300；
 *        胜率翻倍 μ=0.1→(1.96×80)²=24,586→约 24,600；
 *        2 万手：期望 1000bb、累计 σ=8×√20000≈1131bb>1000bb（仍在噪声内）；
 *        10 万手：期望 5000bb、σ=8×√100000≈2530bb、5000÷2530≈1.98σ
 *
 * —— standardLevel2.ts ——
 * [正确] t2-ev idx5：0.60×90−0.40×60=30、保本 f=60/150=40%（Alpha=b/(P+b) 口径正确）；
 *        idx6：0.70×100+0.30×150=115>100、0% 跟注退化 100
 * [正确] t2-pot-odds idx2：E=B/(P+2B) 推导链；idx3 尺度表 20/25/28.6/33.3/40%（b/(P+2b)）；
 *        idx4：60/240=25%、9 outs 转牌 18%；idx5：30/66≈45.5%；idx6：80/280≈28.6%；idx8：1/4 池 16.7%
 * [示意值] t2-pot-odds idx5：AK 对 BB 全下范围胜率约 55%（依赖具体范围定义，正文用「约」）
 * [正确] t2-implied-odds idx3：(120+60+100)/60=4.67:1 → 1/5.67≈17.6% vs 18%；idx4：保本 X=0.82×60/0.18−180≈93.3<100；
 *        idx9（Set Mining 精确式）：1−1081/1225≈11.76%、赔率 0.8824/0.1176≈7.5:1、1-in-8.5（正文中「教材常取整约 8:1」为文献示意）
 * [示意值] t2-implied-odds idx13：同花听牌两张牌约 36%（×4 法则值；精确 35%）
 *
 * —— standardLevel3.ts ——
 * [示意值] t3-position-value idx1：R 参考值 BTN 105-110%/CO 100-105%/BB 85-92%/SB 80-88%（现代研究量级，正文已标注）；
 *          idx12：UTG≈15%、BTN 40-50%（RFI 示意）；公式 idx2 内 50%×105%=52.5%、50%×85%=42.5% 算术正确
 * [示意值] t3-starting-hands idx3：四档 EV 分层 +0.6~+1.5bb（正文已标「示意量级」）；
 *          idx7：价值叠 34/1326≈2.56%→约 2.5%、诈唬叠约 4%
 * [正确] t3-fundamental-theorem idx2：0.30×50=+15（vs 过牌增量口径自洽）
 *
 * —— standardLevel4.ts ——
 * [正确] t4-range-thinking idx0：满池 33%/半池 25%（b/(P+2b)）；idx9：AK 组合 16→board 1K 剩 12；
 *        t4-combinatorics idx0：KK 3+99 3+44 3+K9s 2（board K♠9♦ 阻断两个同花组合）=11、6/17≈35.3%>33%；
 *        idx2：AK 16→12；idx3：4bet 场景 34→21（3+3+6+9）、QQ 6/34≈17.6%→18%、6/21≈28.6%→29%、AKo vs QQ≈43%
 * [示意值] t4-range-advantage idx3：范围优势/坚果优势密度框架（>50%、前 5% 为方法示意）
 * [正确] t4-preflop-structure idx4/idx7/idx10（翻前结构性理论，本次新增）：
 *        α(4,8)=8/12=66.7%、MDF=4/12=33.3%、CO 跟注门槛 5.5÷17.5=31.4%（三式互验）；
 *        BB 防守门槛 1.5÷5=30%；α(3.5,10)=10/13.5=74.1% > α(4,8)（OOP 尺度更大的依据）；
 *        4-bet α=17.5÷29.5=59.3%、BTN 跟注 12÷41.5=28.9%、SPR=80÷41.5=1.93≈1.9；
 *        被 5-bet 全下门槛 80÷201.5=39.7%≈40%；{QQ+、AK}=6+6+6+16=34 种、A5s=4 种
 * [示意值] t4-preflop-structure idx6/idx9/idx12：AQo 对 {QQ+,AK} 约 30%、KK 约 47%、JJ 约 37%
 *        （手牌权益依赖范围定义，正文与题面均以「约」表述）
 * [正确] t4-structure-economics idx4/idx5/idx6（结构经济学，本次新增）：
 *        α(1.5,2.25)=60.0% / MDF=40.0% → 大盲前注后 α(2.5,2.25)=2.25÷4.75=47.4% / MDF=52.6%；
 *        大盲收价 1.25÷5.0=25.0% → 0.25÷5.0=5.0%（前注已投在池内，需补额下降而底池不变）；
 *        BB 3-bet 到 8：α(3.75,8)=68.1% / MDF=31.9% → α(4.75,8)=62.7% / MDF=37.3%，每对互补为 1；
 *        idx9：n(8bb/100)=(1.96×9÷0.08)²≈48,620、n(3bb/100)≈345,744、比值 (8/3)²≈7.11；
 *        ROR σ=9bb/手、B=2000bb：exp(−3.95)≈1.9% → exp(−1.48)≈22.7%
 * [示意值] t4-structure-economics idx8 末句（忽略抽水对 σ 的轻微削减）、idx9 抽水档位「约 5bb/100」、
 *          idx10 pro-tip 只给口径不给平台数值表
 *
 * —— standardLevel5.ts ——
 * [正确] t5-game-theory idx4：混合 p=1/2 无差别、博弈值 ±0.5；t5-gto-concept idx3 例值（满池 1/3=2:1、半池 25%=3:1）；
 *        t5-mdf-alpha idx0：f=B/(P+B)、MDF=P/(P+B)=1/(1+b)，半池 67%/满池 50%/2 倍池 33%；
 *        idx1：Alpha=b/(1+b)、半池 33.3%/满池 50%；idx4：0.60×100−0.40×50=40；idx5：b/(1+2b)=2/5=40%、3:2；
 *        idx6：1/3 池防 75%、半池 67%、满池 50%
 * [示意值] t5-mixed-strategy idx3：跟注站「跟 50%/弃 50%」混合示意；idx6：弃牌 55% vs 均衡约 45%
 * [正确] t5-multiway-frequency idx3/idx5/idx8/idx9（多人频率与尺度，本次新增）：
 *        α(100,50)=1/3、MDF=2/3；全弃率 (1/3)²=11.11%→约 11%、(1/3)³=3.70%→约 3.7%；
 *        诈唬 EV = fⁿ·P −(1−fⁿ)·b：1 人 0、2 人 −33.33、3 人 −44.44；
 *        满池对照 α(100,100)=1/2 → 全弃 25%、EV=−50（尺度上调无救，正文以此立论）；
 *        责任分摊 d=1−α^(1/n)：2 人 42.26%→约 42.3%、3 人 30.66%→约 30.7%；
 *        恒等式 1−(1−0.4226)²=66.67%=MDF；常见错算 66.7%÷2=33.35% < 42.26%（正文点名）
 * [示意值] t5-multiway-frequency idx10：1−(1−9/47)³≈47.15%（把对手手牌视作随机的保护近似，正文已标注假设与「示意」）
 *
 * —— standardLevel6.ts ——
 * [正确] t6-bet-purpose idx1：w>B/(P+2B)、半池 25%/满池 33%；t6-sizing-theory idx3：f=b/(1+2b) 与 w=b/(1+2b) 对偶；
 *        idx12 阻塞注链路：跟注所需 0.25/1.5≈16.7%→17%、加注 0.75P 保本弃牌率 0.75/(1.25+0.75)=37.5%、
 *        防守下限 62.5%；t6-geometric idx2：x=((1+2·SPR)^(1/3)−1)/2、SPR=7.5→16^(1/3)≈2.52→76%、
 *        76/191.5/482.5 逐街池 252/635/1600 守恒；idx4：SPR=4→9^(1/3)=2.08→54%、1/3 池反例 33/56/311 与 311/278≈1.1 倍；
 *        idx5：两街 √5−1)/2≈61.8%→62%、124/448/276、1/3 池 67/334/333≈100%
 * [示意值] t6-geometric idx9：SPR≈2→约 60%（精确两街 61.8%）、SPR≈4→约 55%（精确 54%）、SPR≈7→约 3/4（精确 73.3%），
 *          正文已标注为速算经验值并给出精确公式；SPR≤3/6-13/20+ 单对-两对-坚果承诺阈（业界锚点）
 * [正确] t6-equity-realization idx3/idx5（权益实现，本次新增）：实现率 R=1 当且仅当牌局立即全下；
 *        门槛倒推 (1/3)÷0.85=39.21%→约 39%、25%÷0.8=31.25%→约 31%；
 *        本体口径与 T2 一致：满池 100÷300=33.3%、半池 50÷200=25%
 * [示意值] t6-equity-realization idx6/idx9/idx11：实现率 0.85（IP 中等牌力）/0.65（OOP 高牌）/0.8、
 *        A♠K♠ 55%×0.85≈47%、55%×0.65≈36%、AA 四人池约 64%（实现率与表值依赖统计口径，正文均以「约/典型量级」表述）
 *
 * —— standardLevel7.ts ——
 * [示意值] t7-stats idx1-3：VPIP<18/22-28/>32、AF<1.5/2-3/>4、WTSD>32/<22、3-bet<2/3-5/>7（业界参考线）；
 *          idx6/7 画像 45/12/0.8/38、24/20/2.8/27/6、38/6/1.2/35/1；idx10-11 样本量阈值 50-100/300+ 手；
 *          t7-exploit idx15「级别越高漂移越快」标注为经验规律（无外部定理可引）
 * [正确] t7-exploit idx16（元游戏漂移段，本次新增）：纯诈唬 EV = f×P − (1−f)×b（P=100、b=50）→
 *        f=0.65 得 +47.5、0.60 得 +40.0、0.55 得 +32.5（缩水 (47.5−32.5)/47.5≈31.6%→正文「约三成」）、
 *        f=α=50/150=33.3% 得 0；与 T5 的 α 口径同源，可由 multiwayBluffEv(defenders=1) 复算
 * [正确] t7-hand-reading idx0：0.75 池所需胜率 0.75/2.5=30%（b/(P+2b)）
 * [示意值] t7-exploit idx6：过牌加注 12%→30%；t7-player-types idx8-10 漂移画像数字
 *
 * —— standardLevel8.ts ——
 * [正确] t8-tilt idx6：(8−(−15))×1=23bb、0.1h→2.3bb；t8-session idx1：30+3−10=+23、砍 C 档 +33、差 10bb；
 *        t8-bankroll-psych idx2：Kelly f*=(0.55−0.45)/1=0.10→10%、半 Kelly 5%；
 *        t8-mindset idx1：P(决策正确|输)≠1−P(输|决策正确)、55%/45% 口径自洽；
 *        idx2 实例：2:1 赔率需 33.3%<40% 诈唬占比、60% 输分支
 * [示意值] t8-tilt idx0：Tendler「80% 亏损来自 20% Tilt 时间」（文献主张）；
 *          t8-bankroll-psych idx0：下风期 10-20 买入、现金 20-40、锦标赛 100+；idx4：3bb/100→半 Kelly 30-40 买入；
 *          损失厌恶系数 ≈2（Kahneman-Tversky ≈2.25 取整）
 * [正确] t8-bankroll-psych idx15/16（破产概率 ROR，本次新增）：μ=0.05bb/手、σ²=8²=64bb² →
 *        10 买入 exp(−1.5625)=20.96%→约 21%、20 买入 exp(−3.125)=4.39%→约 4.4%、
 *        30 买入 exp(−4.6875)=0.92%→约 0.9%；每多 10 买入的比值 0.2096/0.0439=0.0439/0.0092≈4.8→正文「约 1/5」；
 *        与 idx0「现金 20-40 买入」、idx2 Kelly 上限口径互相印证（Kelly 给下注上限，ROR 给资金分布下界）
 *
 * —— standardLevel9.ts ——
 * [正确] t9-mop idx1：AKQ 均衡 y=B/(P+2B)、f=y/(1−y)=B/(P+B)、c=P/(P+B)、f+c=1、满池 f=c=1/2、1/3 池 f=1/4/c=3/4；
 *        t9-icm idx3（修正下标，原登记写作 idx1）：亚军概率 0.3×5/7+0.2×5/8≈0.339、0.375、0.286；
 *        $EV 38.4/32.8/28.9 守恒≈100；
 *        t9-icm idx5（本次修复，原登记写作 idx4 且推导有误）：中筹码 M=3000 被 5000 覆盖 →
 *        弃牌 $EV=32.8；跟注且赢 6000/2000/2000 → P=0.6/0.3/0.1、$EV=0.6×50+0.3×30+0.1×20=41.0；
 *        期望 0.55×41.0+0.45×0=22.6 < 32.8 ⇒ 弃牌；现金桌同一手 0.55×3000−0.45×3000=+300 筹码 ⇒ 跟注。
 *        原实例写"A=5000 全下 B=3000、输光归零、0.55×46≈25.3<38.4"三处不成立：B 只覆盖 3000，
 *        A 输了剩 2000（$EV 31.9）而非归零；期望式漏掉输分支；补回后 39.6>38.4 结论反转
 * [正确] t9-multiway idx0/idx3：四人底池=AA 对 3 对手→表值约 64%（本次修复：原误写 55%/56%，为 vs4 口径）
 * [示意值] t9-multiway idx1 胜率表（AA 85/73/64/56/49、KK 82/69/59/51、AKs 67/50/40、87s 41/30/24，与常见数据源一致，正文标「典型」）；
 *          t9-unified idx4：C-Bet 弃牌 65% vs 均衡约 45%
 */
describe('standard 量化断言审计：组合数学类判分题复算', () => {
  const chapters = THEORY_LEVELS.flatMap((l) => l.chapters);
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

  it('t1-combinatorics：C(52,2)=1326、非同花 12、{AA,KK,AKs}=16', () => {
    // q1: C(52,2) = 52×51/2
    expect((52 * 51) / 2).toBe(1326);
    expectAnswerIs('t1-combinatorics', 't1-combinatorics-q1', '1326 种');
    // q2: AK 共 4×4=16，同花 4，非同花 16−4=12
    expect(4 * 4 - 4).toBe(12);
    expectAnswerIs('t1-combinatorics', 't1-combinatorics-q2', '12 种');
    // q4: AA+KK+AKs = 6+6+4
    expect(6 + 6 + 4).toBe(16);
    expectAnswerIs('t1-combinatorics', 't1-combinatorics-q4', '16 种');
  });

  it('t1-outs：8 outs 单街 16%、同花听牌 9 个、15 outs 高估 6 个百分点', () => {
    // q1: 两头顺 8 outs ×2%
    expect(8 * 2).toBe(16);
    expectAnswerIs('t1-outs', 't1-outs-q1', '16%');
    // q2: 13−4 = 9
    expect(13 - 4).toBe(9);
    expectAnswerIs('t1-outs', 't1-outs-q2', '9 个');
    // q5: ×4 估 60%，精确 1 − (32/47)(31/46) ≈ 54.1%，高估 ≈6 个百分点
    const exact15 = 1 - ((47 - 15) / 47) * ((46 - 15) / 46);
    expect(exact15).toBeGreaterThan(0.54);
    expect(exact15).toBeLessThan(0.542);
    expect(Math.round(60 - exact15 * 100)).toBe(6);
    expectAnswerIs('t1-outs', 't1-outs-q5', '6 个百分点');
  });

  it('t1-variance：1/√n=1/10、五手结果标准差 ≈171', () => {
    // q3: √100 = 10
    expect(Math.sqrt(100)).toBe(10);
    expectAnswerIs('t1-variance', 't1-variance-q3', '缩小到 1/10');
    // q5: μ=60 → σ=√(147000/5)=√29400≈171
    const xs = [200, -150, 300, -100, 50];
    const mu = xs.reduce((a, b) => a + b, 0) / 5;
    const ss = xs.reduce((a, b) => a + (b - mu) ** 2, 0);
    expect(mu).toBe(60);
    expect(ss).toBe(147000);
    expect(Math.round(Math.sqrt(ss / 5))).toBe(171);
    expectAnswerIs('t1-variance', 't1-variance-q5', '171');
  });

  it('t4-combinatorics：board 阻断组合 C(3,2)=3、抓诈 6/17≈35%>33%、4bet 阻断 6/21≈29%', () => {
    // q1: 牌面 1 张 K → C(3,2)
    expect((3 * 2) / 2).toBe(3);
    expectAnswerIs('t4-combinatorics', 't4-combinatorics-q1', '3 种');
    // q4: 诈唬占比 6/(11+6) ≈ 35.3% > 满池 33.3% → 跟注
    const share = 6 / (11 + 6);
    expect(share).toBeGreaterThan(1 / 3);
    expect(Math.round(share * 100)).toBe(35);
    expectAnswerIs(
      't4-combinatorics',
      't4-combinatorics-q4',
      '跟注，诈唬占比 35% 超过所需 33%',
    );
    // q5: 持 AK 后 34→21，QQ 6/21 ≈ 28.6% → 约 29%
    expect(3 + 3 + 6 + 3 * 3).toBe(21);
    expect(Math.round((6 / 21) * 100)).toBe(29);
    expectAnswerIs('t4-combinatorics', 't4-combinatorics-q5', '约 29%');
  });

  it('t7-hand-reading：KQ 双重阻断（board K♠+手持 QQ）→ 3×2=6 价值，5/17≈29%<30% 弃牌', () => {
    const q = getQuiz('t7-hand-reading', 't7-hand-reading-q5');
    // 题干输入数字锁定：价值 12 种、0.75 池
    expect(q.question).toContain('12 种');
    expect(q.question).toContain('0.75 池');
    // 复算：board K♠ 剩 3K，手持 QQ 剩 2Q → KQ 6；KK 3（3K 取 2）、88 3 → 价值 12
    expect(3 + 3 + 3 * 2).toBe(12);
    // 诈唬占比 5/(12+5) ≈ 29.4% < 0.75 池所需 0.75/2.5=30% → 弃牌
    expect(0.75 / (1 + 2 * 0.75)).toBeCloseTo(0.3, 10);
    expect(5 / (12 + 5)).toBeLessThan(0.3);
    expectAnswerIs(
      't7-hand-reading',
      't7-hand-reading-q5',
      '弃牌，诈唬占比约 29% 低于所需 30%',
    );
  });
});

describe('standard 量化断言审计：赔率与 EV 类判分题复算', () => {
  const chapters = THEORY_LEVELS.flatMap((l) => l.chapters);
  const getQuiz = (chapterId: string, questionId: string): TheoryQuizQuestion => {
    const chapter = chapters.find((c) => c.id === chapterId);
    const q = (chapter as TheoryChapter).quiz.find((x) => x.id === questionId);
    expect(q, `小测题 ${questionId} 存在`).toBeDefined();
    return q as TheoryQuizQuestion;
  };
  const expectAnswerIs = (chapterId: string, questionId: string, answer: string) => {
    const q = getQuiz(chapterId, questionId);
    expect(q.options[q.correctIndex], `${questionId} 复算后的正确选项`).toBe(answer);
  };

  it('t2-ev：跟注 EV=+10、2/3 池 Alpha=40%', () => {
    // q1: EV = 0.30×(100+50) − 0.70×50
    expect(0.3 * 150 - 0.7 * 50).toBeCloseTo(10, 10);
    expectAnswerIs('t2-ev', 't2-ev-q1', '+10');
    // q2: Alpha = b/(1+b)，b=2/3 → 0.4
    expect(2 / 3 / (1 + 2 / 3)).toBeCloseTo(0.4, 10);
    expectAnswerIs('t2-ev', 't2-ev-q2', '40%');
  });

  it('t2-pot-odds：50/200=25%、满池 33%、1/3 池 20%', () => {
    // q1: 50÷(100+50+50)
    expect(50 / 200).toBe(0.25);
    expectAnswerIs('t2-pot-odds', 't2-pot-odds-q1', '25%');
    // q2: b=P → b/(P+2b) = 1/3
    expect(1 / (1 + 2)).toBeCloseTo(1 / 3, 10);
    expectAnswerIs('t2-pot-odds', 't2-pot-odds-q2', '33%');
    // q5: b=P/3 → (1/3)/(5/3)=0.2
    expect(1 / 3 / (1 + 2 / 3)).toBeCloseTo(0.2, 10);
    expectAnswerIs('t2-pot-odds', 't2-pot-odds-q5', '20%');
  });

  it('t2-implied-odds：保本未来赢款 X = c/h − (W+c) ≈ 116.7 → 约 120', () => {
    const q = getQuiz('t2-implied-odds', 't2-implied-odds-q5');
    // 题干输入：底池 150、下注 75、胜率 18%
    expect(q.question).toContain('150');
    expect(q.question).toContain('75');
    expect(q.question).toContain('18%');
    // 复算：0.18×(225+X) = 0.82×75 → X = 61.5/0.18 − 225 ≈ 116.7（选项取整「约 120」）
    const x = (0.82 * 75) / 0.18 - 225;
    expect(x).toBeGreaterThan(110);
    expect(x).toBeLessThan(120);
    expectAnswerIs('t2-implied-odds', 't2-implied-odds-q5', '约 120');
  });

  it('t6-bet-purpose：半池保本线 25%，w=30% 盈利', () => {
    // 半池所需 w = 0.5/(1+1) = 25%
    expect(0.5 / 2).toBe(0.25);
    expectAnswerIs(
      't6-bet-purpose',
      't6-bet-purpose-q5',
      '盈利，因为保本线只需 w > 25%',
    );
  });

  it('t6-geometric：SPR=4 三街几何尺度 (9^(1/3)−1)/2 ≈ 54%', () => {
    const x = (Math.cbrt(1 + 2 * 4) - 1) / 2;
    expect(x).toBeGreaterThan(0.53);
    expect(x).toBeLessThan(0.55);
    expectAnswerIs('t6-geometric', 't6-geometric-q5', '每街约 54% 池');
  });
});

describe('standard 量化断言审计：博弈论与 ICM 类判分题复算', () => {
  const chapters = THEORY_LEVELS.flatMap((l) => l.chapters);
  const getQuiz = (chapterId: string, questionId: string): TheoryQuizQuestion => {
    const chapter = chapters.find((c) => c.id === chapterId);
    const q = (chapter as TheoryChapter).quiz.find((x) => x.id === questionId);
    expect(q, `小测题 ${questionId} 存在`).toBeDefined();
    return q as TheoryQuizQuestion;
  };
  const expectAnswerIs = (chapterId: string, questionId: string, answer: string) => {
    const q = getQuiz(chapterId, questionId);
    expect(q.options[q.correctIndex], `${questionId} 复算后的正确选项`).toBe(answer);
  };

  it('t5-gto-concept：满池价值:诈唬 2:1、半池诈唬占比 25%', () => {
    // q1: y = b/(1+2b)，b=1 → 1/3 → 价值 2/3 : 诈唬 1/3 = 2:1
    expect(1 / (1 + 2 * 1)).toBeCloseTo(1 / 3, 10);
    expectAnswerIs('t5-gto-concept', 't5-gto-concept-q1', '2:1');
    // q5: b=0.5 → 0.5/2 = 25%
    expect(0.5 / (1 + 2 * 0.5)).toBe(0.25);
    expectAnswerIs('t5-gto-concept', 't5-gto-concept-q5', '25%');
  });

  it('t5-mdf-alpha：半池 MDF≈67%、2 倍池 MDF≈33%', () => {
    // q1: MDF = 1/(1+b)，b=0.5
    expect(1 / (1 + 0.5)).toBeCloseTo(2 / 3, 10);
    expectAnswerIs('t5-mdf-alpha', 't5-mdf-alpha-q1', '67%');
    // q5: b=2 → 1/3；超池均衡诈唬 b/(1+2b)=2/5=40%
    expect(1 / (1 + 2)).toBeCloseTo(1 / 3, 10);
    expect(2 / (1 + 2 * 2)).toBeCloseTo(0.4, 10);
    expectAnswerIs('t5-mdf-alpha', 't5-mdf-alpha-q5', '33%');
  });

  it('t9-mop：AKQ 满池 K 的跟注频率 c=P/(P+B)=1/2，1/3 池 f=1/4、c=3/4', () => {
    // q5: B=P → c = P/(P+P) = 1/2
    expect(1 / (1 + 1)).toBe(0.5);
    expectAnswerIs('t9-mop', 't9-mop-q5', '1/2');
    // 对照正文：下注 1/3 池 → f = (1/3)/(4/3)=1/4、c=3/4
    expect(1 / 3 / (1 + 1 / 3)).toBeCloseTo(0.25, 10);
    expect(1 / (1 + 1 / 3)).toBeCloseTo(0.75, 10);
  });

  it('t9-alpha：1/3 池 Alpha=25%、弃牌率 30% → EV ≈ +0.067 池', () => {
    // q1: Alpha = bet/(pot+bet) 的正确选项由数据层文本锁定（公式题）
    const q1 = getQuiz('t9-alpha', 't9-alpha-q1');
    expect(q1.options[q1.correctIndex]).toBe('Alpha = bet / (pot + bet)');
    // q5: α = (1/3)/(1+1/3) = 0.25；EV = 0.30×1 − 0.70×(1/3) ≈ +0.0667
    expect(1 / 3 / (1 + 1 / 3)).toBeCloseTo(0.25, 10);
    const ev = 0.3 * 1 - 0.7 * (1 / 3);
    expect(ev).toBeGreaterThan(0.06);
    expect(ev).toBeLessThan(0.07);
    expectAnswerIs(
      't9-alpha',
      't9-alpha-q5',
      '这个尺度的 bluff 保本且盈利，EV ≈ +0.067 池',
    );
  });

  it('t9-icm：3 人 SNG $EV(A) ≈ 38.4（递归复算）', () => {
    // 题干输入：A=5000/B=3000/C=2000，奖池 50/30/20
    const [pA, pB, pC] = [0.5, 0.3, 0.2];
    const pA2 = pB * (5000 / 7000) + pC * (5000 / 8000);
    const pA3 = 1 - pA - pA2;
    const evA = pA * 50 + pA2 * 30 + pA3 * 20;
    expect(pA2).toBeGreaterThan(0.338);
    expect(pA2).toBeLessThan(0.34);
    expect(evA).toBeGreaterThan(38.3);
    expect(evA).toBeLessThan(38.5);
    expectAnswerIs('t9-icm', 't9-icm-q5', '38.4');
  });

  it('t9-icm 实例三：中筹码被覆盖时跟注 $EV 22.6 < 弃牌 32.8（递归复算）', () => {
    // 3 人奖池 50/30/20 的 ICM 递归：P(第 1 名)=筹码占比，其余名次对剩余子集递归
    const icm = (shares: readonly number[], payouts: readonly number[]): number[] => {
      if (shares.length === 1) return [payouts[0] as number];
      const total = shares.reduce((a, b) => a + b, 0);
      const out: number[] = shares.map(() => 0);
      shares.forEach((_, champ) => {
        const pChamp = (shares[champ] as number) / total;
        const top = payouts[0] as number;
        out[champ] = (out[champ] as number) + pChamp * top;
        const rest = shares.filter((_, i) => i !== champ);
        const sub = icm(rest, payouts.slice(1));
        let rank = 0;
        shares.forEach((_, i) => {
          if (i === champ) return;
          out[i] = (out[i] as number) + pChamp * (sub[rank] as number);
          rank += 1;
        });
      });
      return out;
    };
    const pay = [50, 30, 20];
    // 弃牌分支：M 持 3000（A=5000/C=2000），正文取 32.8
    const fold = icm([5000, 3000, 2000], pay)[1] as number;
    expect(fold).toBeCloseTo(32.75, 2);
    // 跟注且赢分支：M 变 6000，大筹码剩 2000、小筹码 2000
    const win = icm([6000, 2000, 2000], pay)[0] as number;
    expect(win).toBeCloseTo(41, 6);
    // 跟注且输分支：被覆盖 → 归零，故期望只含赢分支
    const call = 0.55 * win + 0.45 * 0;
    expect(call).toBeCloseTo(22.55, 2);
    expect(call).toBeLessThan(fold);
    // 同一手牌在现金桌：冒 3000 赢 3000、55% 胜率 → +300 筹码
    expect(0.55 * 3000 - 0.45 * 3000).toBeCloseTo(300, 6);
    // 反向守卫：大筹码 A=5000 全下短筹码 B=3000 时 A 输了仍剩 2000，
    // 补回输分支后期望 39.6 > 弃牌 38.4，该配置根本推不出"ICM 弃牌"（旧版正文误用此配置）
    const aLose = icm([2000, 3000, 2000], pay)[0] as number;
    expect(0.55 * (icm([8000, 2000], [50, 30])[0] as number) + 0.45 * aLose).toBeGreaterThan(
      icm([5000, 3000, 2000], pay)[0] as number,
    );
    // 正文与题库不得回退到旧实例
    const intro = chapters.find((c) => c.id === 't9-icm') as TheoryChapter;
    const example3 = intro.content[5]?.content ?? '';
    expect(example3).toContain('M 变 6000');
    expect(example3).toContain('22.6');
    expect(example3).not.toContain('输光则归零');
    expect(example3).not.toContain('25.3');
    const q5 = getQuiz('t9-icm', 't9-icm-q5');
    expect(q5.options).not.toContain('25.3');
    expect(q5.options).toContain('22.6');
  });

  it('t9-multiway：4 人池=AA 对 3 个对手 → 表值约 64%（非 56%）', () => {
    // q5 考「面对 4 个随机对手」→ 表 4 人≈56%
    expectAnswerIs('t9-multiway', 't9-multiway-q5', '56%');
    // 正文口径守卫：四人底池（3 个对手）必须落在表中 3 人档（约 64%），不允许回退到 vs4 口径
    const chapter = chapters.find((c) => c.id === 't9-multiway');
    expect(chapter).toBeDefined();
    const sections = (chapter as TheoryChapter).content;
    const intro = sections[1]?.content ?? '';
    expect(intro).toContain('四人底池跌至约 64%');
    expect(intro).not.toContain('四人底池跌至约 55%');
    const example2 = sections[3]?.content ?? '';
    expect(example2).toContain('约 64%');
    expect(example2).not.toContain('约 56%');
  });

  it('t4-preflop-structure：3-bet / 4-bet 的 α、MDF、跟注门槛与 SPR 互验', () => {
    // CO 开 2.5（含盲注 P=4）被 BTN 3-bet 到 8
    expect(calculateAlpha(4, 8)).toBeCloseTo(0.6667, 4);
    expect(calculateMDF(4, 8)).toBeCloseTo(0.3333, 4);
    expectAnswerIs('t4-preflop-structure', 't4-preflop-structure-q1', '约 67%');
    // CO 跟注：补 5.5 进跟注后底池 4+8+5.5=17.5
    expect(requiredEquity(5.5, 4 + 8 + 5.5)).toBeCloseTo(0.3143, 4);
    expectAnswerIs('t4-preflop-structure', 't4-preflop-structure-q2', '约 31%');
    // BB 防守 2.5 开池的门槛；OOP 的 3-bet 必须比 IP 要求更高弃牌率
    expect(requiredEquity(1.5, 3.5 + 1.5)).toBeCloseTo(0.3, 6);
    expect(calculateAlpha(3.5, 10)).toBeGreaterThan(calculateAlpha(4, 8));
    // BTN 对 4-bet 到 20 的跟注门槛与 SPR、被 5-bet 全下的门槛
    expect(requiredEquity(12, 12 + 17.5 + 12)).toBeCloseTo(0.2892, 4);
    expect((100 - 20) / 41.5).toBeCloseTo(1.93, 2);
    expect(requiredEquity(80, 201.5)).toBeCloseTo(0.397, 3);
    // 价值分支组合数与诈唬分支组合数
    expect(6 + 6 + 6 + 16).toBe(34);
  });

  it('t6-equity-realization：所需全下权益 = 底池门槛 ÷ 实现率', () => {
    expect(requiredEquity(100, 300)).toBeCloseTo(1 / 3, 6);
    expect(requiredEquity(50, 200)).toBeCloseTo(0.25, 6);
    expect(1 / 3 / 0.85).toBeCloseTo(0.392, 3);
    expectAnswerIs('t6-equity-realization', 't6-equity-realization-q1', '约 39%');
    expect(0.25 / 0.8).toBeCloseTo(0.3125, 4);
    expectAnswerIs('t6-equity-realization', 't6-equity-realization-q3', '约 31%');
  });

  it('t1-variance / t8-bankroll-psych 新增推导段：样本量与破产概率可复算', () => {
    expect(requiredHandsForEdge(5, 80, 1.96)).toBeCloseTo(98345, 0);
    expect(requiredHandsForEdge(5, 80, 1.645)).toBeCloseTo(69274, 0);
    expect(requiredHandsForEdge(10, 80, 1.96)).toBeCloseTo(24586, 0);
    // 2 万手仍在噪声内：累计 σ > 累计期望
    expect(8 * Math.sqrt(20000)).toBeGreaterThan(20000 * 0.05);
    // 10 万手≈2σ
    expect(5000 / (8 * Math.sqrt(100000))).toBeCloseTo(1.98, 2);
    expect(riskOfRuin({ winrateBB100: 5, sdBB100: 80, bankrollBB: 1000 })).toBeCloseTo(0.21, 2);
    expect(riskOfRuin({ winrateBB100: 5, sdBB100: 80, bankrollBB: 2000 })).toBeCloseTo(0.044, 3);
    expect(riskOfRuin({ winrateBB100: 5, sdBB100: 80, bankrollBB: 3000 })).toBeCloseTo(0.009, 3);
  });

  it('t5-multiway-frequency：乘积律、EV 塌方与责任分摊互验', () => {
    // 半池基线
    expect(calculateAlpha(100, 50)).toBeCloseTo(1 / 3, 6);
    expect(calculateMDF(100, 50)).toBeCloseTo(2 / 3, 6);
    // 全弃率与判分题
    expect(multiwayAllFold(1 / 3, 2)).toBeCloseTo(0.1111, 4);
    expectAnswerIs('t5-multiway-frequency', 't5-multiway-frequency-q1', '约 11%');
    expect(multiwayAllFold(1 / 3, 3)).toBeCloseTo(0.037, 3);
    // EV：1 人保本、2 人 −33.3、3 人 −44.4；满池进两人 −50（尺度上调更差）
    expect(multiwayBluffEv({ potBeforeBet: 100, betSize: 50, foldRate: 1 / 3, defenders: 1 })).toBeCloseTo(0, 10);
    expect(multiwayBluffEv({ potBeforeBet: 100, betSize: 50, foldRate: 1 / 3, defenders: 2 })).toBeCloseTo(-33.33, 2);
    expect(multiwayBluffEv({ potBeforeBet: 100, betSize: 50, foldRate: 1 / 3, defenders: 3 })).toBeCloseTo(-44.44, 2);
    expect(multiwayBluffEv({ potBeforeBet: 100, betSize: 100, foldRate: 0.5, defenders: 2 })).toBeCloseTo(-50, 10);
    // 责任分摊 d = 1 − α^(1/n) 与"除以人数"错算的方向关系
    const d2 = perDefenderRequiredDefense(1 / 3, 2);
    expect(d2).toBeCloseTo(0.4226, 4);
    expectAnswerIs('t5-multiway-frequency', 't5-multiway-frequency-q3', '约 42.3%');
    expect(perDefenderRequiredDefense(1 / 3, 3)).toBeCloseTo(0.3066, 4);
    expect(0.6667 / 2).toBeLessThan(d2);
    // 恒等式：分摊后至少一人拦住的概率 = 单挑 MDF
    expect(1 - (1 - d2) ** 2).toBeCloseTo(calculateMDF(100, 50), 10);
    // 正文口径守卫：必须同时给出正确值与错算值，且不得把错算当结论
    const chapter = chapters.find((x) => x.id === 't5-multiway-frequency') as TheoryChapter;
    const diffusion = chapter.content[9]?.content ?? '';
    expect(diffusion).toContain('42.3%');
    expect(diffusion).toContain('66.7% ÷ 2 = 33.4%');
    const protection = chapter.content[11]?.content ?? '';
    expect(protection).toContain('示意');
  });

  it('t7-exploit 元游戏漂移段：纯诈唬 EV 随弃牌率衰减 +47.5→+32.5→0', () => {
    const ev = (foldRate: number) =>
      multiwayBluffEv({ potBeforeBet: 100, betSize: 50, foldRate, defenders: 1 });
    expect(ev(0.65)).toBeCloseTo(47.5, 10);
    expect(ev(0.6)).toBeCloseTo(40, 10);
    expect(ev(0.55)).toBeCloseTo(32.5, 10);
    // 65%→55% 掉 10 个百分点的弃牌率，利润缩水约三成
    expect((ev(0.65) - ev(0.55)) / ev(0.65)).toBeCloseTo(0.316, 3);
    // 漂到保本弃牌率 α 时期望归零
    const alpha = calculateAlpha(100, 50);
    expect(alpha).toBeCloseTo(1 / 3, 6);
    expect(ev(alpha)).toBeCloseTo(0, 10);
    // 正文口径守卫：衰减段必须落在 idx16（含 heading 的 0 起点），并给出 α 的算式
    const drift = chapters.find((x) => x.id === 't7-exploit') as TheoryChapter;
    const decayExample = drift.content[16]?.content ?? '';
    expect(decayExample).toContain('+47.5');
    expect(decayExample).toContain('+32.5');
    expect(decayExample).toContain('50 ÷ 150');
    expect(drift.content[17]?.type).toBe('takeaway');
  });

  it('t4-structure-economics：前注改 P、抽水改 μ 的全部数值可复算', () => {
    // 实例一：无 ante vs 大盲前注 1bb（BTN 开 2.25 尺度取同值以隔离 ante 效应）
    expect(calculateAlpha(1.5, 2.25)).toBeCloseTo(0.6, 10);
    expect(calculateMDF(1.5, 2.25)).toBeCloseTo(0.4, 10);
    expect(calculateAlpha(2.5, 2.25)).toBeCloseTo(0.4737, 4);
    expect(calculateMDF(2.5, 2.25)).toBeCloseTo(0.5263, 4);
    expectAnswerIs('t4-structure-economics', 't4-structure-economics-q1', '约 47.4%');
    // 大盲收价：需补 1.25 → 0.25，跟注后底池同为 5.0bb
    expect(requiredEquity(1.25, 5)).toBeCloseTo(0.25, 10);
    expect(requiredEquity(0.25, 5)).toBeCloseTo(0.05, 10);
    // 实例二：BB 3-bet 到 8 的两套 α/MDF，且每对互补为 1
    expect(calculateAlpha(3.75, 8)).toBeCloseTo(0.6809, 4);
    expect(calculateMDF(3.75, 8)).toBeCloseTo(0.3191, 4);
    expect(calculateAlpha(4.75, 8)).toBeCloseTo(0.6275, 4);
    expect(calculateAlpha(4.75, 8) + calculateMDF(4.75, 8)).toBeCloseTo(1, 10);
    // 实例三：抽水把 μ 由 8 压到 3 → 样本量按 (8/3)² 放大、ROR 放大一个数量级
    expect(requiredHandsForEdge(8, 90, 1.96)).toBeCloseTo(48620, 0);
    expect(requiredHandsForEdge(3, 90, 1.96)).toBeCloseTo(345744, 0);
    expect(requiredHandsForEdge(3, 90, 1.96) / requiredHandsForEdge(8, 90, 1.96)).toBeCloseTo(7.111, 2);
    expectAnswerIs('t4-structure-economics', 't4-structure-economics-q3', '变成原来的约 7.1 倍');
    expect(riskOfRuin({ winrateBB100: 8, sdBB100: 90, bankrollBB: 2000 })).toBeCloseTo(0.019, 3);
    expect(riskOfRuin({ winrateBB100: 3, sdBB100: 90, bankrollBB: 2000 })).toBeCloseTo(0.227, 3);
    // 正文口径守卫：误区段必须同时给出改前/改后两组数，且不得回退成"多送 1bb"式表述
    const chapter = chapters.find((x) => x.id === 't4-structure-economics') as TheoryChapter;
    const myth = chapter.content[12]?.content ?? '';
    expect(myth).toContain('60.0% 掉到 47.4%');
    expect(myth).toContain('40.0% 升到 52.6%');
    expect(myth).toContain('1.25bb 变成补 0.25bb');
    const rakeExample = chapter.content[9]?.content ?? '';
    expect(rakeExample).toContain('7.1 倍');
    expect(rakeExample).toContain('22.7%');
    expect(chapter.content[9]?.type).toBe('example');
  });
});
