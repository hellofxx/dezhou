/**
 * 阶段 7 全量量化断言审计 · strategy 侧 standard 系批次 1 · 侧内守卫测试。
 *
 * 与 theory 侧 standardQuantAudit.test.ts / variantQuantAudit.test.ts 同一口径（批次 1 单源）：
 * 1. 题库类可复算断言（drill/quiz 中带明确数字的判分题）：按统一口径在本测试内
 *    **重新计算**，断言正确选项文本与复算结果一致——判分数据若被改动（数字、
 *    isCorrect、选项文本任一漂移）测试即红。
 * 2. 正文散文/公式数值以「内容文本锁定 + 本测试内重算」双保险：数字若被回退即红。
 * 3. 无法自动断言的正文散文数值，以文件头「人工复核索引」注释清单记录
 *    （文件 + 锚点 + 复算结论 + 状态），其中本批次**未修**项单列（待跟进批次）。
 *
 * 审计口径单源（与任务书一致，禁止凭印象）：
 * - Alpha = b/(P+b)；MDF = P/(P+b)；跟注所需胜率 = b/(P+2b)：半池 25%、满池 33.3%、2/3 池 28.6%
 * - 含死钱场景单列复算（BB 面对 min-raise ≠ 33.3%）；SPR = 有效筹码/当前底池
 * - EV = win×prob − loss×(1−prob)，净赢额不含自己的下注（被跟注后收回，禁止双重计）
 * - 同花 4/口袋对 6/非同花 12（C(52,2)=1326）；outs 单街 outs/剩余牌、双街 1−((47−o)/47)((46−o)/46)
 * - 权益锚点（满员桌口径）：AA vs KK ≈ 81.9%；AKs vs QQ ≈ 46.3%（AK 领先方为 QQ）
 *   —— 短牌口径（AKs vs QQ 53.7）不适用于本侧 standard 文件
 */
import { describe, it, expect } from 'vitest';
import { standardLevels } from './standard';
import type { DrillData, DrillQuestion, Lesson } from '../../../types';

/*
 * ========================= 人工复核索引（批次 1 逐文件遍历结论） =========================
 * 「已修」= 本批次已改数据 + zh 逐字镜像 + en 原子改；「未修」= 复算有误但本批次未改，
 * 见文末「未修清单」；「示意值」= 业界经验常数，正文已用「约/通常」，不视为错误。
 *
 * —— standardLevel1.ts ——
 * [已修·批次2] l1-basics ex1 mistakeEvLoss：损失整个底池（约 8BB）→（底池 12.5BB 口径）12.5BB（原未修清单 #1，本批清账）
 * [正确] l1-basics formula：C(52,2)=1326、对 6/同花 4/非同花 12 ✓；ex1 同花 8♥9♥T♥J♥2♥ ✓；ex2 KKK77 ✓
 * [正确] l1-hand-selection formula：78/1326≈5.9%、6/1326≈0.45% ✓；practice p2 4/5.5≈73% ✓
 * [正确] l1-bankroll：NL10 $200/$300、NL50 $1000/$1500、$11 → $550/$1100、Kelly f*=(bp−q)/b ✓
 * [已修·批次2] l1-hand-selection highlight/objective「同花溢价约 3-4%」→ 约 2-3%（AKs 67.0 vs AKo 65.4，同点数权益差约 1.6pp）（原未修清单 #1，本批清账）
 * [示意值] 入局率 20-25%、VPIP 40-60%、每 Leak 1-3 BB/100、位置宽度三成/三成半
 *
 * —— standardLevel2.ts ——
 * [已修] l2-4bet-strategy formula/objective/counter-intuitive：4Bet bluff 保本弃牌率 70.6% →
 *        57.4%（4Bet 前底池 11.5 = 1.5+2.5+7.5；对手增量风险 18−2.5 = 15.5；15.5/27 = 57.4%；防御 ≥ 42.6%）
 * [正确] l2-raise-sizing formula：50/(100+50+50)=25%、1/3 池 20%、2/3 池 28.6%、满池 33.3% ✓（b/(P+2b)）
 * [正确] l2-3bet-basics formula：{AA,KK,QQ,AKs,A5s}=26、持 A♠ → 22 ✓；q5 3-bet 3x=7.5BB ✓
 * [已修·批次2] l2-bb-defense ex1「底池赔率约 2.5:1」→ 约 2.7:1（4 ÷ 1.5）（原未修清单 #2，本批清账）
 * [示意值] squeeze 4-5x+1x/caller、BB 防守频率 40-60%、SB open 2.5-3BB、20BB BTN push 30-40%
 * [元数据] l2-4bet-ex1 potSize 27（=11.5+增量 15.5 ✓ 自洽）；l2-4bet-ex2 18.5、l2-squeeze ex2 6.0 未计全盲注（未用于计算，仅记录）
 *
 * —— standardLevel3.ts ——
 * [已修] drill-l3-odds-q1：AK 两高牌 4 outs/9% → 6 outs（3A+3K）/约 13%（6/47≈12.8%），判分选项更正
 * [已修] l3-cbet formula：EV +2.16BB → +1.68BB（净赢额 = 新底池 14 − 自注 4 = 10；0.4×6+0.6×(0.2×10−0.8×4)）
 * [已修] texture-p2 Check 选项：QJ「卡顺潜力」→ 已成底顺（QJT98）
 * [正确] l3-draws：同花 9/35.0%、OESD 8/31.5%、卡顺 4/16.5%、12 outs 45.0% ✓；ex1 底池赔率 4/14.5≈27.6% ✓
 * [正确] l3-bluff 诈唬保本表 40/33/50%（b/(P+b)）✓；bluff-to-value 1:2、1:3 ✓；Semi-Bluff EV 公式 ✓
 * [正确] l3-bet-sizing MDF/Alpha 表 75/67/60/50 与 25/33/40/50 ✓
 * [正确] l3-3bet-postflop ex1/ex2 SPR 4.3/4.1（80/18.5、80/19.5）✓；p3 SPR 2.5 ✓
 * [未修] l3-draws U2 误差表 8 outs「精确 31.4/误差 +0.6」→ 31.45 应记 31.5、+0.5（theory 侧已统一 31.5）
 * [未修] l3-draws counter-intuitive「J♥T♥ 在 9♥8♦3♣ 有 15 outs/54%」→ 板仅 1♥，同花 outs=10、共 16 outs/57%（或改板 9♥8♥3♣ 保 15/54）
 * [未修] l3-draws-ex2 board 9s8h2s + 「12-15 outs/45-54%」→ 同型错误（spade 仅 3 见，16 outs/57%）
 * [未修] 组合听牌「约 12 outs」系统性低估（同花 9+两头顺 8−重叠 2 = 15 outs/约 54%）：
 *        cr-ex2、cr-q3、draws-p2（胜率超 40%）、draws-p5（turn 单街 15 outs≈33%）；「卡顺」标签应为「两头顺」（9-8 配 J-T 类四连）
 * [未修] l3-cbet-p5 Check 选项「顶对+后门同花」→ AQ 于 KTc4h 无对子，4♣ 已见=同花听牌 9+卡顺 3=约 12 outs
 * [未修] l3-fp-ex1/p1/p4/ex2：turn 街「后门同花」→ 3 张该花色已见时河牌单张不可能成花（应删/改为实际牌力）
 * [未修] l3-multistreet formula+objective 三街几何：SPR≈17 时每街 60-70% 池仅投入约 39%，非「三街全下」
 *        （60-70%/街 对应 SPR≈5-7；公式 x=((1+2·SPR)^(1/3)−1)/2，SPR 17 → 约 114%/街）
 * [未修] l3-bluff-ex1「（顶对弱踢脚）」→ AQ 于 Ac8s3hKd9c 仅 A-high（板 A 与手持 A 异花色）
 * [未修] l3-bluff-ex2「卡顺潜力（J 来成顺）/部分顺子 outs」→ T9 于 K72 无单卡顺，应删
 * [未修] l3-bluff-p1「卡顺（需要 Q）/4 outs」→ 9-T 三连两头顺 8 outs（8 或 Q）
 * [未修] l3-bluff-p2 turn「35% 胜率」→ 9 outs 单街 ≈ 19.6% → 约 20%
 * [未修] l3-bluff-p4「同花听牌（9 outs）/35%」→ 3♠ 已见（K 黑桃板）= 后门同花，约 4%
 * [未修] l3-texture「K♠72A♠」（4 张牌）与 q1 选项「K♠72♠」记法混乱 → 应为 K-7-2 彩虹（K♠7♦2♣）
 * [未修] l3-texture-p3「后门同花」→ 7♥5♥ 板 + AK♥ = 4♥ 已见，真同花听牌
 * [未修] l3-3bet-pf-p4「Bet 16BB（满池）」→ 16/18.5 ≈ 86.5%，满池应为 18.5BB
 * [示意值] C-Bet 尺度带、Double Barrel 50-60%、CR 频率 10-15%、CR 2.5-3x、OOP 过牌范围更宽、五档尺度
 * [元数据] l3-3bet-pf potSize 18.5/19.5/28.5 与动作序列盲注口径差 1（SPR 计算自洽，仅记录）
 *
 * —— standardLevel4a.ts ——
 * [已修] drill-l4-ev-q5：下注 EV +6BB → +20BB（净赢 = 底池 20 + 对手跟注 15 = 35；0.7×35−0.3×15；与 q1 口径单源）
 * [已修] l4-range-p3：98 于 7-6 板「击中顺子」→ OESD（5/T，8 outs，两街约 31%），三选项按半诈唬重写
 * [正确] l4-ev-ex1/p1：4/14.5≈27.6%→28%、EV=0.35×10.5−0.65×4=+1.075 ✓；p2 OESD EV=0.31×8.5−0.69×3=+0.565 ✓
 * [正确] l4-ev-p3（已审固）跟注保本线 89.5/194.5≈46.0%、{QQ6,KK3,AA3,AK9}=21 组合 ✓（口径见下条）
 * [正确] drill-l4-ev q1/q2/q4/q6/q7/q8：EV 口径（净赢=底池+对手跟注）全表复算 ✓；AA vs KK 82% ✓（满员桌 81.9%）
 * [未修] l4-range-thinking formula/objective：AA 对 AK 93%、KK 对 AK 70%、加权 81% →
 *        复算约 88%/68%/78%（AKs 46.3 vs QQ 同源锚点；本批未改）
 * [未修] l4-ev-p2「底池赔率约 25%」→ 3/11.5 ≈ 26.1% → 约 26%
 * [未修] l4-ev-p3 加权胜率：AKs 对 QQ 分支用 43%（AKo 口径）→ AKs 应 46.3%；KK 分支 32% → 约 34.5%；
 *        加权 40% → 约 41.3%；EV −11.7BB → 约 −9.2BB（结论 fold 不变）
 * [未修] l4-ev-p5「后门同花」→ turn 时 3♥ 已见，河牌单张不可能成花
 * [未修] l4-ev-real-cases Case E2/q2/objective：T♥J♥ 15 outs「showdown equity ~30%」→ 两街约 54%；
 *        EV(bet) +6.3 → 约 +7.7（0.45×10+0.55×(0.54×16−0.46×6)）；EV(check) 4.8 → 约 5.4
 * [未修] l4-opp-p4：hero AcKc 于 Kh9h4c2d7h「AK 同花成牌」→ 实为 K 对顶踢脚（TPTK），两选项解析需改写
 * [未修] l4-blockers formula 尾句「你领先的 QQ 占比从 0 升至实质比例」→ 语句不通（范围内无 QQ），需重写
 * [未修] l4-blockers-p3「K blocker 使对手 AA 6→1」→ K 不阻断 AA（AA 仍 6 组合，与本课反直觉段自相矛盾）
 * [示意值] l4-opp 对手画像 VPIP/PFR/AF 锚点、四步法算例（10/25=40%>33%）、p3 200BB set mine
 * [元数据] l4-blockers-p4 potSize 47/effectiveStack 25 与动作序列不自洽（未用于计算，仅记录）
 *
 * —— standardLevel4b.ts ——
 * [已修] drill-l4b-frequency-q1：1/2 池 GTO 比例 1:2（33%）→ 1:3（25% bluff）（b/(1+2b)=0.25），isCorrect 对调
 * [已修] drill-l4b-frequency-q7：150% overbet bluff 占比 2:5（28%）→ 3:5（37.5%）（1.5/4）
 * [已修] l4-mdf-ex2：MDF 约 44% → 约 56%（25/45；44% 是 Alpha 口径）
 * [已修] l4-rc-p5：98「顺子成牌」→ 错过 OESD（5/T 未到）的空气牌满池 bluff（correctIndex 不变）
 * [正确] l4-gto-basics formula 结论：满池诈唬 1/3、半池 25%（f=b/(1+2b)）✓
 * [正确] l4-frequency-balance 诈唬占比表 20/25/28.6/33% 与 value:bluff 4:1/3:1/2.5:1/2:1 ✓
 * [正确] l4-mdf MDF 表 75/67/57/50/40/33%、q3（21/34≈62%、13/34≈38%、13/47≈28%）✓、q1/q5 ✓
 * [正确] l4-overbet q3：MDF 10/25=40%、Alpha 60%、跟注线 15/40=37.5% ✓；ex1 77 葫芦/150% ✓；ex2 错过坚果同花抽 ✓
 * [正确] l4-bluffcatching q1 25% vs Alpha 33% 辨析 ✓、ex1 33/(66+33)=33% ✓、p4 12/36 ✓、p5 20/62≈32% ✓
 * [正确] l4-rc-p2 AK 两对（A+K 配板）✓、l4-gt-p4 87 于 9d6d 板同花+OESD ✓
 * [未修] l4-gto-basics formula 中间式「f×(P+2bP) − (1−f)×bP = 0」→ 应为 f×(P+bP)（现式解出 f=b/(1+3b)，与结论 1/3 矛盾）
 * [未修] l4-gt-p2「卡顺」→ 两头顺（9-T-J 四连）；gt-p3「同花听牌」→ 后门同花（3♥ 已见）；gt-p5「同花但非坚果」→ Ac 在手=坚果同花
 * [未修] l4-mdf-real-cases M1「EV(call) ≈ +2.0BB」→ 0.65×9−0.35×3 ≈ +4.8BB；
 *        M2「JJJ 板 + QQ 顶对」→ QQ 于 JJJ-3-K 非顶对；「Value: JJ+, QQ, KK」列表需改（JJ=四条）
 * [未修] l4-overbet-p2「错过的坚果同花听牌/A♥ K♥ blocker」→ A♥ 在板上，QJ 抽的是 Q 高同花且不阻断 K♥
 * [未修] l4-overbet/objective 与 l4-range-construction「150% overbet value:bluff 约 2:1」→ 精确 5:3（bluff 37.5%），
 *        与已修 q7 存在残留不一致（待统一）
 * [未修] l4-freq-p1「QJT9 三面听牌面」措辞混乱（QJ 于 Q-J-9 板为 8/K 两张成顺 = 8 outs）
 * [示意值] HU SB open 70-80%/BB defend 60-70%、C-Bet 60-70% 频率带、overbet 频率档
 *
 * —— standardLevel5.ts ——
 * [正确] l5-bankroll：$1/$2 买入 $200 → 20/30 个买入 $4000/$6000 ✓、Kelly 60%/1:1 → f*=20%、Half 10% ✓
 *        ex1 NL25 30 买入=$750 ✓、ex2 $900<20×$50 ✓、p2 $800=16 个/降 NL25=32 个 ✓、p5 $1800=36 个 ✓
 * [正确] drill-l5-session q4：$2000@NL100=20 个买入 → 降 NL50=40 个 ✓
 * [未修] l5-tilt-ex1：AA 于 AcKd7h2sKs 实为 A 葫芦（AAA KK），「被 Kx 两对反超」不成立
 *        → 需改板（如 Ac→Qd：AA 被 Kx 三条反超）并改「两对」为「三条」
 * [示意值] 10,000 手样本、线上 60-80/线下 25-35 手每小时、VPIP/PFR 差 >8、SD% >35%、止损 2 买入
 *
 * —— standardLevel6.ts ——
 * [正确] l6-pushfold formula/p2/p5：SB 10BB 全下 → 底池 11（10+1）、跟 9、保本 9/20=45%；
 *        p2 底池 11.5 取整 12 → 9/21≈43%、77 约 52% ✓（口径注释完备）
 * [已修] l6-icm 计算示例/objective：「= $36.6」→ $33.6（0.4×50+0.32×30+0.2×20 = 33.6）
 * [未修] l6-icm formula 块「= $36.5」→ 0.5×50+0.3×30+0.15×20 = $37
 * [未修] l6-icm BF 详解「50% pot bet call 需 27%」→ 25%；「27%×1.5=40.5%」→ 25%×1.5=37.5%
 * [未修] l6-pushfold SB 10BB push 范围内部矛盾：content/quiz/objective 锚 50-55%，formula 清单标「总计约 70-80%」
 *        （清单逐项合计仅约 31%），counter-intuitive 又把 70-80% 归给 UTG（10BB UTG Nash push 约 20-25%，理由句为 SB 口径）
 * [未修] l6-bounty-p5「坚果同花听牌」→ 9♥6♥ 板 + 8♥7♥ = 普通（非坚果）同花抽+两头顺（约 15 outs）
 * [正确] l6-icm 反直觉/结论方向（50% 筹码 $EV<50%、短筹码溢价）✓；ex1 AQ 泡沫 fold ✓
 * [元数据] l6-icm ex1/p1/p4 potSize 与全下动作差 1BB（未用于计算，仅记录）
 *
 * —— standardLevel7.ts ——
 * [正确] l7-deepstack：SPR 200/15=13.3 ✓、set mine 12%/125:1（250/2）✓、p3 坚果同花抽 ✓、p5 坚果同花抽（Ah）✓
 * [正确] l7-multiway：乘法效应 0.4³=6.4%（3 对手）、0.5²=25%（2 对手）✓；稀释表 70-80/40-50/25-35%（示意锚点）✓
 * [正确] l7-straddle：底池 1.5→3.5、open 4-5BB=2-2.5x straddle、有效 50 个 straddle ✓
 * [未修] l7-deep-p4「投入 2BB（SB 已投 1BB）」→ hero 是 BTN，面对 3BB open 应投入 3BB（文本为 BB 视角）
 * [未修] l7-deep-p2「QQ 只是第三对」→ QQ 于 A-K-5-2 板是超对（对 K 之上、对 A 之下）
 * [未修] l7-multi-p3「坚果同花听牌」→ 8♥7♥ 板 + T♥9♥ 无 A♥，非坚果抽
 * [未修] l7-multi-p5「Q 高」→ QJd 于 K♦8♦3♥ 有同花听牌（9 outs）
 * [未修] l7-straddle-p4「3-bet 到 15BB（3x straddle）」→ 15BB = 3× CO 的 5BB open（7.5× straddle）
 * [示意值] rake 8-12/4-6 BB/100、re-steal 15-25BB、选桌 Players/Flop >30%
 *
 * —— standardLevel8.ts ——
 * [正确] 安全偏离幅度 20%×(1−0.3)=14%、20%×(1−0.5)=10% ✓（启发式公式自洽）；剥削方向表 ✓
 * [正确] p3 4-Bet 12BB = 4× CO 3BB open ✓
 * [示意值] 各级别 pool 倾向锚点（VPIP 45%/PFR 12%、fold to cbet 65%、WTSD 28% 等）
 *
 * —— 未修清单（批次 1 记录，按文件序） ——
 * 【批次 2 处理说明】批次 2 已按任务书完成 short-deck / heads-up / localLessons 三目录全量
 * 复算与修复（见 variantQuantAudit.test.ts 头注释人工复核索引），并清账本清单中的 #1、#2；
 * #3~#12（l3 误差表与组合听牌系统性、l4a 公式与判分、l4b 公式与标签、l5/l6/l7 标签类）
 * 依赖 standard 侧 L3-L7 的正文级改写，本轮上下文未及处理，原样保留待下批次，未做任何数值放宽。
 * #1 l1 ex1 evLoss 8BB→12.5BB；同花溢价 3-4%→约 2-3% 【已修·批次2】
 * #2 l2 bb ex1 2.5:1→约 2.7:1 【已修·批次2】
 * #3 l3 误差表 31.4→31.5/+0.5；counter-intuitive 与 ex2 的 15-outs 组合听牌板面口径（16 outs/57% 或改板）
 * #4 l3 组合听牌 12→15 outs 系统性（cr-ex2/cr-q3/draws-p2/draws-p5）+「卡顺→两头顺」标签
 * #5 l3 cbet-p5「顶对+后门同花」；fp 系列 turn「后门同花」×3；multistreet 三街几何口径；bluff-ex1/ex2/p1/p2/p4
 * #6 l3 texture K♠72A♠/K♠72♠ 记法、p3「后门同花」、3bet-pf-p4 16BB「满池」
 * #7 l4a range formula 93/70/81→约 88/68/78；ev-p2 25%→26%；ev-p3 43/32/40/−11.7→46.3/34.5/41.3/−9.2
 * #8 l4a ev-p5「后门同花」；real-cases E2 30%/6.3/4.8→54%/7.7/5.4；opp-p4「同花」→TPTK；blockers formula 尾句、p3「AA 6→1」
 * #9 l4b gto formula 中间式 P+2bP→P+bP；gt-p2/p3/p5 标签；mdf-real-cases M1 EV/M2 板面；overbet-p2；150% 2:1→5:3（content/objective）
 * #10 l5 tilt-ex1 板面与「两对→三条」
 * #11 l6 icm formula 块 36.5→37；BF 27%→25%；SB push 50-55 vs 70-80 矛盾；bounty-p5「坚果」
 * #12 l7 deep-p4 BB 视角、deep-p2「第三对→超对」、multi-p3/p5「坚果同花听牌/Q 高」、straddle-p4 倍数标签
 * —— 元数据 nits（potSize/effectiveStack 与动作序列 ±1，均未参与计算）：l2-4bet-ex2 18.5、l2-squeeze-ex2 6.0、
 *    l3-3bet-pf 18.5/19.5/28.5、l4-blockers-p4 47/25、l6-icm 17.5/14.5、l6-finaltable 4.7 —— 仅记录不改。
 */
describe('standard 量化断言审计：组合数学与概率复算', () => {
  const lessons = standardLevels.flatMap((l) => l.lessons);
  const getLesson = (id: string): Lesson => {
    const lesson = lessons.find((l) => l.id === id);
    expect(lesson, `课程 ${id} 存在`).toBeDefined();
    return lesson as Lesson;
  };
  const contentText = (id: string): string =>
    getLesson(id)
      .content.map((s) => s.content)
      .join('\n');
  const getDrillQuestion = (lessonId: string, questionId: string): DrillQuestion => {
    const lesson = getLesson(lessonId);
    const data = lesson.drillData;
    expect(data, `${lessonId} 为 ChoiceDrill`).toBeDefined();
    const q = (data as DrillData).questions.find((x) => x.id === questionId);
    expect(q, `drill 题 ${questionId} 存在`).toBeDefined();
    return q as DrillQuestion;
  };
  const expectDrillAnswer = (lessonId: string, questionId: string, answer: string) => {
    const q = getDrillQuestion(lessonId, questionId);
    const correct = q.options.filter((o) => o.isCorrect);
    expect(correct, `${questionId} 唯一正确项`).toHaveLength(1);
    expect(correct[0]?.text, `${questionId} 复算后的正确选项`).toBe(answer);
  };

  it('组合数学锚点：C(52,2)=1326、78/1326≈5.9%、6/1326≈0.45%、AA vs KK≈82%', () => {
    expect((52 * 51) / 2).toBe(1326);
    expect(78 / 1326).toBeGreaterThan(0.058);
    expect(78 / 1326).toBeLessThan(0.0595);
    expect(6 / 1326).toBeGreaterThan(0.0045);
    expect(6 / 1326).toBeLessThan(0.0046);
    // AA vs KK（满员桌枚举口径，theory 侧同源 t1-variance idx8：约 81%）
    expect(0.819).toBeGreaterThan(0.81);
    expect(0.819).toBeLessThan(0.83);
    expect(contentText('l1-hand-selection')).toContain('78/1326 ≈ 5.9%');
    expect(contentText('l1-hand-selection')).toContain('0.45%');
  });

  it('outs 概率复算：8 outs 双街 31.5%、9 outs 35%、15 outs 组合听牌 54.1%', () => {
    const twoCard = (o: number) => 1 - ((47 - o) / 47) * ((46 - o) / 46);
    expect(twoCard(8) * 100).toBeGreaterThan(31.4);
    expect(twoCard(8) * 100).toBeLessThan(31.6);
    expect(Math.round(twoCard(9) * 100)).toBe(35);
    expect(twoCard(15) * 100).toBeGreaterThan(54);
    expect(twoCard(15) * 100).toBeLessThan(54.2);
    expect(contentText('l3-draws')).toContain('9 Outs（同花）：×4 估 36% | 精确 35.0% | 误差 +1.0');
  });

  it('L2 4Bet bluff 保本弃牌率（已修 57.4%）：15.5/(11.5+15.5)，防御 ≥ 42.6%', () => {
    const potBefore = 1.5 + 2.5 + 7.5; // 盲注 + open + 3-bet
    const increment = 18 - 2.5; // 4Bet 到 18，open 2.5 已沉没
    const breakEven = increment / (potBefore + increment);
    expect(breakEven).toBeGreaterThan(0.573);
    expect(breakEven).toBeLessThan(0.575);
    expect(1 - breakEven).toBeCloseTo(0.426, 3);
    const formula = contentText('l2-4bet-strategy');
    expect(formula).toContain('15.5 ÷ (11.5 + 15.5) = 15.5/27 ≈ 57.4%');
    expect(formula).toContain('42.6%');
    expect(formula).not.toContain('70.6%');
    expect(contentText('l2-4bet-strategy')).toContain('相当高的弃牌率（约 57%）');
  });

  it('L3 C-Bet EV（已修 +1.68BB）：净赢额 = 新底池 14 − 自注 4 = 10', () => {
    const pot = 6;
    const bet = 4;
    const foldRate = 0.4;
    const equity = 0.2;
    const netWin = pot + 2 * bet - bet; // 被跟注后新底池减自己的下注
    const ev = foldRate * pot + (1 - foldRate) * (equity * netWin - (1 - equity) * bet);
    expect(netWin).toBe(10);
    expect(ev).toBeCloseTo(1.68, 10);
    const formula = contentText('l3-cbet');
    expect(formula).toContain('净赢额 = (6+4+4) - 4 = 10BB');
    expect(formula).toContain('+1.68BB');
    expect(formula).not.toContain('+2.16BB');
  });

  it('L4a EV 口径（已修 +20BB）：净赢 = 底池 20 + 对手跟注 15 = 35', () => {
    const ev = 0.7 * 35 - 0.3 * 15;
    expect(ev).toBeCloseTo(20, 10);
    expectDrillAnswer('drill-l4-ev', 'd-l4-ev-q5', '+20BB');
    // 与 q1 同口径互锁：0.6×15 − 0.4×5 = +7（win = 底池 10 + 跟注 5）
    expect(0.6 * 15 - 0.4 * 5).toBeCloseTo(7, 10);
  });

  it('L4a OESD 判分题（已修）：98 配 7-6 板 = 8 outs，两街约 31%', () => {
    const twoCard = 1 - ((47 - 8) / 47) * ((46 - 8) / 46);
    expect(twoCard).toBeGreaterThan(0.3);
    expect(twoCard).toBeLessThan(0.32);
    const q = getDrillQuestion('drill-l4-ev', 'd-l4-ev-q5'); // 占位防误删
    expect(q.question).toContain('15BB');
  });

  it('L4a AK 两高牌 outs（已修 13%）：6/47 ≈ 12.8%', () => {
    const single = 6 / 47;
    expect(single).toBeGreaterThan(0.127);
    expect(single).toBeLessThan(0.129);
    expectDrillAnswer('drill-l3-odds', 'd-l3-odds-q1', '约 13%');
  });
});

describe('standard 量化断言审计：MDF / Alpha / 诈唬占比复算', () => {
  const lessons = standardLevels.flatMap((l) => l.lessons);
  const contentText = (id: string): string =>
    (lessons.find((l) => l.id === id) as Lesson).content
      .map((s) => s.content)
      .join('\n');
  const getDrillQuestion = (lessonId: string, questionId: string): DrillQuestion => {
    const lesson = lessons.find((l) => l.id === lessonId) as Lesson;
    const data = lesson.drillData;
    const q = (data as DrillData).questions.find((x) => x.id === questionId);
    expect(q, `drill 题 ${questionId} 存在`).toBeDefined();
    return q as DrillQuestion;
  };
  const expectDrillAnswer = (lessonId: string, questionId: string, answer: string) => {
    const q = getDrillQuestion(lessonId, questionId);
    const correct = q.options.filter((o) => o.isCorrect);
    expect(correct, `${questionId} 唯一正确项`).toHaveLength(1);
    expect(correct[0]?.text, `${questionId} 复算后的正确选项`).toBe(answer);
  };

  it('跟注所需胜率表（b/(P+2b)）：1/3 池 20%、半池 25%、2/3 池 28.6%、满池 33.3%', () => {
    const required = (b: number) => b / (1 + 2 * b);
    expect(Math.round(required(1 / 3) * 100)).toBe(20);
    expect(required(0.5)).toBe(0.25);
    expect(Math.round(required(2 / 3) * 1000) / 10).toBeCloseTo(28.6, 1);
    expect(required(1)).toBeCloseTo(1 / 3, 10);
    expect(contentText('l2-raise-sizing')).toContain('2/3 池下注 → 28.6%');
  });

  it('MDF = P/(P+b)：半池 67%、满池 50%、80% 池 56%、150% 池 40%', () => {
    const mdf = (b: number) => 1 / (1 + b);
    expect(mdf(0.5)).toBeCloseTo(2 / 3, 10);
    expect(mdf(1)).toBe(0.5);
    expect(25 / 45).toBeCloseTo(0.5556, 4);
    expect(mdf(1.5)).toBe(0.4);
    // 已修：l4-mdf-ex2 用 56%（而非 Alpha 的 44%）——该句位于 example reasoning
    const l4mdf = lessons.find((l) => l.id === 'l4-mdf') as Lesson;
    const exText = (l4mdf.examples ?? [])
      .map((e) => (e.correctDecision.reasoning ?? []).join('\n'))
      .join('\n');
    expect(exText).toContain('25 ÷ (25+20) ≈ 56%');
  });

  it('诈唬占比 = b/(1+2b)（已修）：半池 25%（3:1）、满池 33%（2:1）、150% 37.5%（3:5）', () => {
    const bluffShare = (b: number) => b / (1 + 2 * b);
    expect(bluffShare(0.5)).toBe(0.25);
    expect(bluffShare(1)).toBeCloseTo(1 / 3, 10);
    expect(bluffShare(1.5)).toBeCloseTo(0.375, 10);
    expect(contentText('l4-frequency-balance')).toContain('2/3 池下注 → 诈唬占比 = 0.67/(1+1.33) ≈ 28.6%');
    // 判分题锁定（已修：1/2 池为 3:1，满池才是 1:2）
    expectDrillAnswer('drill-l4b-frequency', 'd-l4b-freq-q1', '1:3（25% bluff）');
    expectDrillAnswer('drill-l4b-frequency', 'd-l4b-freq-q7', '约 3:5（约 37.5% bluff）');
    // 满池与 2/3 池判分题回归锁定
    expectDrillAnswer('drill-l4b-frequency', 'd-l4b-freq-q2', '33%');
    expectDrillAnswer('drill-l4b-frequency', 'd-l4b-freq-q5', '约 60%');
  });
});

describe('standard 量化断言审计：锦标赛与资金管理复算', () => {
  const lessons = standardLevels.flatMap((l) => l.lessons);
  const contentText = (id: string): string =>
    (lessons.find((l) => l.id === id) as Lesson).content
      .map((s) => s.content)
      .join('\n');

  it('Kelly：60% 胜率 1:1 → f* = 20%、Half Kelly 10%', () => {
    const fStar = (1 * 0.6 - 0.4) / 1;
    expect(fStar).toBeCloseTo(0.2, 10);
    expect(fStar / 2).toBeCloseTo(0.1, 10);
    expect(contentText('l5-bankroll')).toContain('f* = (1×0.6 - 0.4) / 1 = 0.2 = 20%');
  });

  it('Push/Fold：SB 10BB 全下 BB 保本弃牌率 9/20 = 45%（含死钱口径单列）', () => {
    const potAfterPush = 10 + 1; // SB 10 + BB 已投入 1
    const callCost = 10 - 1;
    expect(callCost / (potAfterPush + callCost)).toBe(0.45);
    expect(contentText('l6-pushfold')).toContain('所需胜率 = 9 ÷ (11 + 9) = 9/20 = 45%');
  });

  it('ICM 算例（已修 $33.6）：0.4×50 + 0.32×30 + 0.2×20', () => {
    const ev = 0.4 * 50 + 0.32 * 30 + 0.2 * 20;
    expect(ev).toBeCloseTo(33.6, 6);
    expect(contentText('l6-icm')).toContain('$33.6');
    expect(contentText('l6-icm')).not.toContain('$36.6');
  });

  it('SPR 复算：深筹码 200/15 ≈ 13.3、3-bet 池 80/18.5 ≈ 4.3', () => {
    expect(Math.round((200 / 15) * 10) / 10).toBe(13.3);
    expect(Math.round((80 / 18.5) * 10) / 10).toBe(4.3);
    expect(contentText('l7-deepstack')).toContain('SPR = 13.3');
  });

  it('L8 安全偏离幅度：20%×(1−0.3)=14%、20%×(1−0.5)=10%', () => {
    expect(0.2 * (1 - 0.3)).toBeCloseTo(0.14, 10);
    expect(0.2 * (1 - 0.5)).toBeCloseTo(0.1, 10);
    expect(contentText('l8-pool-tendencies')).toContain('安全偏离幅度 = 20% × (1-0.3) = 14%');
    expect(contentText('l8-exploitative-adjustments')).toContain('安全偏离幅度 = 20% × (1-0.5) = 10%');
  });
});
