// 第二轮补漏：theory 变体 chapterObjectives + localLessons content 缺失 + theory content 缺失。
// 从数据读取缺失项，用 zh→en 词典翻译，注入 theory.json 与 local-lessons.json。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// 读取缺失清单（contentGap2.tmp.test.ts 已生成）
const rows = JSON.parse(readFileSync(join(root, '.codebuddy-gap2.json'), 'utf8'));

// zh → en 词典（覆盖全部缺失项）。未命中时用通用兜底。
const dict = {
  // ===== localLessons content =====
  '实战推荐：80% GTO + 20% 剥削。用 GTO 作为基础框架保护自己，在明确有利可图时进行小幅剥削调整。这能兼顾稳定性和收益上限。':
    'Practical recommendation: 80% GTO + 20% exploitation. Use GTO as the base framework to protect yourself, and make small exploitative adjustments when clearly profitable. This balances stability with a higher profit ceiling.',
  '使用 Session 日志记录情绪状态：每次 session 后标记"今天情绪如何（1-5 分）"，并与盈亏关联。长期数据会让你发现"情绪差时亏损严重"，从而建立情绪管理意识。':
    'Use a session log to record emotional states: after each session mark "today\'s mood (1-5)" and correlate it with profit/loss. Long-term data reveals that "poor mood correlates with heavy losses", building emotional-management awareness.',
  // ===== theory content =====
  '学习求解器输出时别背频率，问三个为什么：为什么这个牌面用这个尺度？为什么这手牌进下注范围而那手进过牌？为什么转牌后频率变了？理解结构，频率自然会记住。':
    'When studying solver output, don\'t memorize frequencies — ask three whys: why this sizing on this board? Why does this hand enter the betting range and that one check? Why did the frequency change on the turn? Understand the structure and the frequencies will remember themselves.',
};

// ===== theory 变体 chapterObjectives zh→en 词典 =====
const objDict = {
  // t1sd
  '理解 36 张牌牌组（移除 2-5）对组合计数与起手牌数量的根本影响': 'Understand the fundamental impact of the 36-card deck (removing 2-5) on combo counting and starting-hand counts',
  '掌握短牌翻牌前的组合数与翻牌结构差异，体会更"稠密"的听牌环境': 'Master short-deck preflop combo counts and flop-structure differences, experiencing the denser draw environment',
  '会用组合数推导短牌关键概率，如对手持某手牌的频率': 'Use combinatorics to derive key short-deck probabilities, such as the frequency of an opponent holding a certain hand',
  '掌握短牌 outs 按 36 张牌组重算的方法（每花色仅 9 张）': 'Master the method of recalculating short-deck outs on the 36-card deck (only 9 per suit)',
  '理解短牌 2/4 法则的误差与修正方向': 'Understand the error of the short-deck 2/4 rule and the direction of its correction',
  '学会将短牌听牌胜率转化为跟注与半诈唬决策': 'Learn to convert short-deck draw equity into calling and semi-bluff decisions',
  '理解短牌高波动性的数学根源（翻牌率更高、听牌更常见、底池更大）': 'Understand the mathematical roots of short-deck high variance (higher flop rate, more common draws, bigger pots)',
  '掌握短牌更保守的资金管理原则与波动承受心态': 'Master short-deck\'s more conservative bankroll principles and variance-tolerance mindset',
  '学会在短牌高频波动中保持决策质量与情绪稳定': 'Learn to maintain decision quality and emotional stability under short-deck high-frequency variance',
  // t2sd
  '理解短牌 Ante 制下底池赔率的计算差异（无标准盲注，前注制）': 'Understand the pot-odds calculation differences under the short-deck ante structure (no standard blinds, ante-based)',
  '掌握短牌所需胜率的快速估算，结合更低的听牌命中率做跟注决策': 'Master fast required-equity estimation for short deck, combining lower draw hit rates into calling decisions',
  '学会在短牌大底池环境中正确评估赔率与胜率': 'Learn to correctly evaluate odds and equity in short-deck big-pot environments',
  '理解短牌中同花/顺子成牌后价值极高，隐含赔率普遍更佳': 'Understand that short-deck flushes/straights are extremely valuable when made, with generally better implied odds',
  '掌握短牌 set mining 门槛提高的原因（三条牌级低于葫芦/同花）': 'Master why short-deck set-mining thresholds rise (trips rank below full houses/flushes)',
  '学会用隐含赔率支撑短牌听牌的跟注与半诈唬决策': 'Learn to use implied odds to support short-deck draw calls and semi-bluffs',
  '理解反向隐含赔率（RIO）在短牌中的放大（边缘牌被更强成牌压制）': 'Understand how reverse implied odds (RIO) amplify in short deck (marginal hands dominated by stronger made hands)',
  '掌握短牌中易被"压制"的牌型与处境，避免慢打边缘牌': 'Master the short-deck hand types and spots prone to domination, avoiding slow-playing marginal hands',
  '学会用 RIO 意识收紧边缘跟注与慢玩，保护筹码': 'Learn to tighten marginal calls and slow-plays with RIO awareness to protect chips',
  // t3sd
  '理解短牌起手牌强度的根本重排：口袋对 > 任何 A-K、AK 最强非对子': 'Understand the fundamental reshuffle of short-deck starting-hand strength: any pair > any A-K, AK the strongest non-pair',
  '掌握 AK 与口袋对、同花连牌在短牌中的相对价值变化': 'Master the relative value changes of AK, pocket pairs, and suited connectors in short deck',
  '学会根据重排后的起手牌强度调整翻前策略': 'Learn to adjust preflop strategy based on the reshuffled starting-hand strength',
  '理解短牌同花价值提升的根本原因（同花 beats 葫芦）': 'Understand the root cause of short-deck flush value rising (flush beats full house)',
  '掌握同花连牌与同花 Ax 在短牌中的可玩性与策略地位': 'Master the playability and strategic status of suited connectors and suited Ax in short deck',
  '学会利用同花价值提升优化翻前范围与翻后决策': 'Learn to exploit the flush-value rise to optimize preflop ranges and postflop decisions',
  '理解位置价值在短牌中的放大（听牌密度高、决策更频繁）': 'Understand the amplification of positional value in short deck (high draw density, more frequent decisions)',
  '掌握 BTN 位置优势在短牌中的利用与 BB 位置的防守调整': 'Master exploiting the BTN positional advantage and adjusting BB defense in short deck',
  '学会用位置优势补偿短牌的高波动风险': 'Learn to compensate short-deck high-variance risk with positional advantage',
  // t4sd
  '理解短牌范围构建与标准德州的结构差异（对子密度高、同花价值提升）': 'Understand the structural differences between short-deck and standard hold\'em range construction (high pair density, higher flush value)',
  '掌握短牌翻前/翻后范围的价值分布特征与极化策略': 'Master short-deck preflop/postflop range value distribution and polarization strategy',
  '学会根据短牌特有起手牌强度构建有效范围': 'Learn to build effective ranges from short-deck-specific starting-hand strength',
  '理解短牌多路底池中权益（Equity）被稀释的机制': 'Understand the mechanism of equity dilution in short-deck multiway pots',
  '掌握短牌多人池中听牌与成牌的权益分配差异': 'Master the equity allocation differences between draws and made hands in short-deck multiway pots',
  '学会在短牌多路池中调整下注与跟注决策': 'Learn to adjust betting and calling decisions in short-deck multiway pots',
  '理解挡牌（Blocker）在短牌中的特殊应用（对子密度高、同花价值大）': 'Understand the special application of blockers in short deck (high pair density, big flush value)',
  '掌握短牌中阻断同花/对子的挡牌价值': 'Master the blocker value of blocking flushes/pairs in short deck',
  '学会用挡牌优化短牌诈唬与跟注决策': 'Learn to optimize short-deck bluff and call decisions with blockers',
  // t5sd
  '理解短牌均衡策略（GTO）与标准德州的结构差异': 'Understand the structural differences between short-deck equilibrium strategy (GTO) and standard hold\'em',
  '掌握短牌中价值:诈唬比、MDF 等频率基准的调整': 'Master the short-deck frequency-baseline adjustments (value:bluff ratio, MDF)',
  '学会以 GTO 为基线识别对手偏离并做最小必要偏离': 'Learn to identify opponent deviations against the GTO baseline and make minimum necessary deviations',
  '理解短牌诈唬收益提升的原因（成牌价值高、弃牌收益大）': 'Understand why short-deck bluff rewards rise (high made-hand value, big fold rewards)',
  '掌握短牌半诈唬的运用（强听牌诈唬价值高）': 'Master short-deck semi-bluff usage (strong draws carry high bluff value)',
  '学会用挡牌与弃牌率判断短牌诈唬频率': 'Learn to judge short-deck bluff frequency with blockers and fold rates',
  // t6sd
  '理解短牌传统下注尺度（1/3 池等）在部分场景失效的原因': 'Understand why traditional short-deck bet sizes (like 1/3 pot) fail in some scenarios',
  '掌握短牌下注尺度的调整：成牌价值高、听牌密度大': 'Master short-deck bet-size adjustments: high made-hand value, high draw density',
  '学会根据牌面与筹码深度选择短牌有效下注尺': 'Learn to choose effective short-deck bet sizes by board and stack depth',
  '理解短牌连续下注（barrel）更频繁的原因（成牌价值高、价值下注多）': 'Understand why short-deck barreling is more frequent (high made-hand value, more value bets)',
  '掌握短牌多街下注的协调与牌面易手调整': 'Master short-deck multi-street bet coordination and board-change adjustments',
  '学会用连续价值下注榨取短牌成牌价值': 'Learn to extract short-deck made-hand value with consecutive value bets',
  // t7sd
  '识别标准德州玩家转短牌时的常见认知偏差': 'Identify the common cognitive biases of standard hold\'em players moving to short deck',
  '掌握从对手错误模式反推范围与剥削方向': 'Master inferring ranges and exploitation directions from opponent error patterns',
  '学会用频率统计确认对手的错误倾向': 'Learn to confirm opponent error tendencies with frequency statistics',
  '理解从 NLHE 到短牌的关键思维转换点': 'Understand the key mindset shifts from NLHE to short deck',
  '掌握短牌特有策略调整（范围、下注、追听）': 'Master short-deck-specific strategic adjustments (ranges, betting, chasing)',
  '学会用"短牌思维"替代"满员桌思维"做决策': 'Learn to replace "full-ring thinking" with "short-deck thinking" in decisions',
  // t8sd
  '理解短牌高波动对心理韧性的考验': 'Understand the test that short-deck high variance poses to mental resilience',
  '掌握承受短牌波动的心理策略与波动预算': 'Master the psychological strategies and variance budget for absorbing short-deck variance',
  '学会在短牌高频波动中保持决策质量': 'Learn to maintain decision quality under short-deck high-frequency variance',
  '理解短牌高波动下 tilt 的高发机制': 'Understand why tilt fires frequently under short-deck high variance',
  '掌握避免 tilt 的自我觉察与预设纪律': 'Master the self-awareness and preset discipline to avoid tilt',
  '学会用"过程 vs 结果"分离控制情绪': 'Learn to control emotions by separating "process vs result"',
  // t9sd
  '把 T1-T8 的短牌知识整合为完整决策闭环': 'Integrate the T1-T8 short-deck knowledge into a complete decision loop',
  '理解短牌理论在不同筹码深度与游戏类型的适用变化': 'Understand how short-deck theory adapts across stack depths and game types',
  '建立个人短牌复盘与学习体系': 'Build a personal short-deck review and learning system',
  '研究职业短牌玩家的决策框架与短牌特有调整': 'Study professional short-deck players\' decision frameworks and short-deck-specific adjustments',
  '理解顶级玩家的共同特征：短牌思维、频率平衡、情绪稳定': 'Understand the shared traits of top players: short-deck thinking, frequency balance, emotional stability',
  '学会从职业短牌案例中提炼可复用方法论': 'Learn to distill reusable methodologies from professional short-deck cases',
  // t1hu
  '掌握单挑结构差异（SB 强制 Ante、BB 翻前最后行动、翻后 SB 先行动）对概率框架的影响': 'Master how the heads-up structural differences (SB forced ante, BB acts last preflop, SB acts first postflop) affect the probability framework',
  '理解单挑起手牌胜率重排：只需打败一个对手时，高张与同花连张的价值上升': 'Understand the heads-up starting-hand equity reshuffle: high cards and suited connectors rise when beating only one opponent',
  '会用组合数推导"对手拿 A"等单挑关键概率，并建立三档胜率锚点': 'Use combinatorics to derive key heads-up probabilities like "opponent has an A" and build three-tier equity anchors',
  '理解单挑中 Outs 的相对性：先判断领先还是落后，再决定数谁的 Outs': 'Understand the relativity of heads-up outs: first judge ahead or behind, then decide whose outs to count',
  '掌握 6 Outs 高张与 15 Outs 组合听牌的双街精确推导与 2/4 法则误差边界': 'Master the two-street exact derivation of 6-out overcards and 15-out combo draws, plus the 2/4-rule error boundary',
  '将单挑听牌胜率转化为半诈唬与全下决策': 'Convert heads-up draw equity into semi-bluff and shove decisions',
  '理解单挑高频对抗导致波动浓缩的数学机制（√N 法则与 50-60% 全下分布）': 'Understand the math of compressed variance in heads-up high-frequency play (√N rule and 50-60% shove distribution)',
  '掌握连败窗口的概率直觉，避免把波动误判为水平问题': 'Master the probabilistic intuition of losing streaks, avoiding mistaking variance for a skill problem',
  '将波动意识落地为单挑资金管理（50 个买入以上）与 session 管理原则': 'Ground variance awareness into heads-up bankroll (50+ buy-ins) and session-management principles',
  // t2hu
  '理解单挑盲注结构导致的翻前底池赔率差异——SB 的 0.5 死钱使跟注价格显著优于满员桌': 'Understand how the heads-up blind structure changes preflop pot odds — the SB\'s 0.5 dead money makes calling significantly cheaper than full ring',
  '掌握 limp vs raise 两种行动的底池赔率计算与跟注需求阈值': 'Master pot-odds calculation and required-equity thresholds for both limp and raise actions',
  '对比单挑与满员桌的多路底池中"赔率稀释"的本质：公式不变、胜率打折': 'Compare the essence of "odds dilution" between heads-up and full-ring multiway pots: formula unchanged, equity discounted',
  '掌握 EV 三分支框架（fold/call/raise）及其数值比较方法': 'Master the EV three-branch framework (fold/call/raise) and its numeric comparison method',
  '理解位置价值量化：单挑中每手牌约 0.5-1BB 的位置差异（BB 位优势）': 'Understand quantified positional value: about 0.5-1BB per-hand difference in heads-up (BB advantage)',
  '用 EV 模型分析翻前 limp vs raise 决策，识别死钱偷盲价值': 'Use the EV model to analyze preflop limp vs raise decisions and recognize dead-money steal value',
  '理解单挑中翻后位置劣势方（SB 翻前最后行动但翻后先行动）的风险暴露': 'Understand the risk exposure of the heads-up postflop positional disadvantage (SB acts last preflop but first postflop)',
  '掌握 check-raise 作为补偿工具，对比 check-call 的风险收益': 'Master the check-raise as a compensation tool, comparing its risk/reward with check-call',
  '评估隐含赔率在单挑中的变化：宽范围导致支付密度低→反向隐含赔率上升': 'Assess how heads-up implied odds change: wide ranges lower payment density → reverse implied odds rise',
  // t3hu
  '理解单挑 SB 的结构独特性——翻前最后行动 + 0.5 强制 Ante 死钱，与满员桌 SB 完全相反': 'Understand the HU SB\'s structural uniqueness — acting last preflop plus the 0.5 forced ante dead money, opposite to the full-ring SB',
  '掌握 SB 开池尺度的数学：盈亏平衡弃牌率与 MDF，理解 min-raise 为何是单挑主武器': 'Master the math of SB opening sizes: break-even fold rate and MDF, understanding why min-raise is the HU main weapon',
  '学会划分 limp 叠与 raise 叠，理解单挑 limp 的 GTO 合理性及随对手的调整条件': 'Learn to split the limp and raise piles, understanding the GTO rationale for HU limping and its opponent-dependent adjustment conditions',
  '理解单挑 BB 的双重优势（翻前最后行动 + 翻后位置）如何把满员桌的亏损位变成盈利位': 'Understand how the HU BB\'s double advantage (acting last preflop + postflop position) turns a full-ring losing seat into a profitable one',
  '掌握 MDF 的计算，区分防守底线与最优防守频率，理解 60%+ 防守的数学依据': 'Master MDF calculation, distinguishing the defense floor from the optimal frequency, and understand the math of 60%+ defense',
  '学会跟注防守与 3Bet 防守的划分，掌握面对 SB limp 的 isolate 策略': 'Learn the call-defense vs 3Bet-defense split and master the isolate strategy vs an SB limp',
  '理解单挑"位置反转"结构：翻前 SB 最后行动、翻后 SB 先行动，BB 获得翻后位置': 'Understand the HU "position reversal": SB acts last preflop and first postflop, giving the BB postflop position',
  '掌握位置优势的街间衰减规律（river 位置价值最大）及其量化模型': 'Master the street-by-street positional-value pattern (river position matters most) and its quantitative model',
  '学会 OOP 的三大补偿工具（check 为主、check-raise、罕见 donk）与 IP 的应对': 'Learn the OOP\'s three compensation tools (check-first, check-raise, rare donk) and the IP responses',
  // t4hu
  '理解单挑范围宽度远超满员桌的根本原因——打败一个对手与位置反转的双重作用': 'Understand why HU ranges are far wider than full ring — the double effect of beating one opponent and position reversal',
  '掌握 SB 开池约 80%、BB 防守 60%+ 的频率基准及其数学依据（死钱赔率与翻后位置）': 'Master the frequency baselines (SB opens ~80%, BB defends 60%+) and their math (dead-money odds and postflop position)',
  '学会按对手倾向动态收放范围宽度，避免"固定范围"在单挑中被剥削': 'Learn to dynamically expand and contract range width by opponent tendencies, avoiding fixed ranges getting exploited in HU',
  '理解极化（polarized）与线性（linear）范围的区别及其适用场景': 'Understand the difference between polarized and linear ranges and their applicable scenarios',
  '掌握单挑下注范围的价值:诈唬两极化结构与均衡比例推导': 'Master the HU betting-range value:bluff polarization structure and equilibrium-ratio derivation',
  '学会用"两条街坚果 + 一个听牌转诈唬"构建不可预测的下注范围': 'Learn to build an unpredictable betting range with "two streets of nuts + one draw converting to a bluff"',
  '理解挡牌（Blocker）的定义：手中的牌减少对手特定组合数': 'Understand the blocker definition: cards you hold reduce specific opponent combos',
  '掌握单挑宽范围中挡牌的三重价值：诈唬阻断、价值解封、翻前 3Bet 选择': 'Master the triple value of blockers in wide HU ranges: bluff blocking, value unblocking, preflop 3Bet selection',
  '学会用挡牌微调下注与跟注决策，在单挑边缘局面争取边际 EV': 'Learn to fine-tune bet/call decisions with blockers, gaining marginal EV in HU edge spots',
  // t5hu
  '理解单挑是纯二人零和博弈，纳什均衡的"不可剥削"保证在此严格成立': 'Understand that HU is a pure two-player zero-sum game where the Nash "unexploitable" guarantee strictly holds',
  '掌握 GTO 不是"最赚钱"而是"不被剥削"的策略定位，及其与剥削的关系': 'Master that GTO is "not being exploited" rather than "winning the most", and its relationship with exploitation',
  '学会在单挑中以 GTO 为基线，识别对手偏离并做最小必要偏离': 'Learn to use GTO as the HU baseline, identify opponent deviations, and make minimum necessary deviations',
  '理解混合策略与无差别原则：同一手牌按频率分配动作的条件': 'Understand mixed strategies and the indifference principle: the condition for allocating actions by frequency',
  '掌握 MDF 与 Alpha 在单挑防守进攻中的临界频率计算': 'Master MDF and Alpha critical-frequency calculations in HU defense/offense',
  '学会在单挑宽范围下执行频率平衡，避免可被剥削的确定性倾向': 'Learn to execute frequency balance across wide HU ranges, avoiding exploitable deterministic tendencies',
  // t6hu
  '理解下注尺度的三因素：牌力层级、范围优势与底池几何（SPR）': 'Understand the three sizing factors: hand-strength tier, range advantage, and pot geometry (SPR)',
  '掌握单挑中"小注控池、大注极化"的尺度逻辑与价值:诈唬比随尺度变化': 'Master the HU sizing logic of "small bets control, big bets polarize" and how the value:bluff ratio changes with size',
  '学会根据筹码深度（SPR）选择翻牌/转牌尺度，规划河牌全下': 'Learn to choose flop/turn sizes by stack depth (SPR) and plan the river shove',
  '理解单挑多街下注（barrel）的协调逻辑：翻牌/转牌/河牌的尺度与频率联动': 'Understand HU multi-street barreling coordination: flop/turn/river size and frequency linkage',
  '掌握连开三枪（triple barrel）的适用条件与牌面易手（board change）调整': 'Master triple-barrel conditions and board-change adjustments',
  '学会根据对手范围收窄与底池增长，动态分配各街的下注组合': 'Learn to dynamically allocate per-street bet combos as the opponent\'s range narrows and the pot grows',
  // t7hu
  '识别单挑最常见的对手类型：跟注站、nit（紧弱）、疯鱼（激进跟注）、紧凶': 'Identify the most common HU opponent types: calling station, nit, maniac, TAG',
  '掌握从频率与倾向推断对手范围的读牌方法': 'Master hand-reading by inferring opponent ranges from frequencies and tendencies',
  '学会区分"可剥削倾向"与"一次性动作"，避免过度反应': 'Learn to distinguish "exploitable tendencies" from "one-off actions", avoiding overreactions',
  '理解从 GTO 基线转向剥削策略的正确框架：最小必要偏离': 'Understand the correct framework for shifting from the GTO baseline to exploitation: minimum necessary deviation',
  '掌握针对不同对手类型的具体调整（频率、尺度、范围）': 'Master the specific adjustments (frequency, size, range) against different opponent types',
  '学会识别"何时回到 GTO"——剥削打开漏洞的边界': 'Learn to recognize "when to return to GTO" — the boundary where exploitation opens your own leaks',
  // t8hu
  '理解单挑高频对抗下的波动密度与情绪触发机制': 'Understand variance density and emotional triggers under HU high-frequency play',
  '掌握避免 tilt（情绪失控）的策略与自我觉察方法': 'Master strategies and self-awareness methods to avoid tilt',
  '学会用"过程 vs 结果"分离保持长期决策质量': 'Learn to maintain long-term decision quality by separating "process vs result"',
  '理解线下物理读取（tell）与线上频率读取的区别与局限': 'Understand the difference and limitations between live physical reads (tells) and online frequency reads',
  '掌握反读取（平衡自己的动作，避免泄露范围）': 'Master counter-reading (balancing your actions to avoid leaking range)',
  '学会用"叙事一致性"判断对手意图，避免过拟合': 'Learn to judge opponent intent with "narrative consistency", avoiding overfitting',
  // t9hu
  '把 T1-T8 的知识整合为单挑决策的完整闭环：范围→数学→下注→剥削→心理': 'Integrate the T1-T8 knowledge into a complete HU decision loop: range → math → betting → exploitation → psychology',
  '理解单挑理论在不同筹码深度与游戏类型（现金/锦标赛）的适用变化': 'Understand how HU theory adapts across stack depths and game types (cash/tournaments)',
  '建立个人复盘与学习体系，形成持续改进的方法论': 'Build a personal review and learning system for continuous improvement',
  '研究职业单挑选手的决策框架与范围构建习惯': 'Study professional HU players\' decision frameworks and range-construction habits',
  '理解顶级玩家的共同特征：频率平衡、范围一致、情绪稳定': 'Understand the shared traits of top players: frequency balance, range consistency, emotional stability',
  '学会从职业选手的公开策略与牌例中提炼可复用的方法论': 'Learn to distill reusable methodologies from pros\' public strategies and hand examples',
};

function resolveTarget(key) {
  if (key.startsWith('theory.')) return 'src/i18n/locales/{lang}/theory.json';
  if (key.startsWith('academy.lessonContent.local')) return 'src/i18n/locales/{lang}/academy-course/local-lessons.json';
  throw new Error(`Unexpected target for ${key}`);
}

// 分组：theory.json 与 local-lessons.json
const theoryRows = rows.filter((r) => r.key.startsWith('theory.'));
const localRows = rows.filter((r) => r.key.startsWith('academy.lessonContent.local'));

for (const lang of ['zh', 'en']) {
  // theory.json
  const theoryPath = join(root, resolveTarget('theory.x').replace('{lang}', lang));
  const tj = JSON.parse(readFileSync(theoryPath, 'utf8'));
  let changed = 0;
  for (const r of theoryRows) {
    const parts = r.key.split('.');
    // theory.content.<id>.<i> 或 theory.chapterObjectives.<id>.<i> 或 theory.quiz.<id>.*
    const outerKey = parts[1]; // content | chapterObjectives | quiz
    const id = parts[2];
    const field = parts[3];
    if (outerKey === 'content') {
      const arr = tj.content[id] ?? (tj.content[id] = []);
      const idx = Number(field);
      if (arr[idx] === undefined) {
        arr[idx] = lang === 'zh' ? r.zh : dict[r.zh];
        changed++;
      }
    } else if (outerKey === 'chapterObjectives') {
      const arr = tj.chapterObjectives[id] ?? (tj.chapterObjectives[id] = []);
      const idx = Number(field);
      if (arr[idx] === undefined) {
        const value = lang === 'zh' ? r.zh : objDict[r.zh];
        if (value === undefined) throw new Error(`Missing objDict en for: ${r.zh}`);
        arr[idx] = value;
        changed++;
      }
    } else {
      throw new Error(`Unexpected theory outer: ${outerKey}`);
    }
  }
  if (changed > 0) {
    writeFileSync(theoryPath, JSON.stringify(tj, null, 2) + '\n', 'utf8');
    console.log(`${lang}/theory.json: +${changed}`);
  }

  // local-lessons.json
  const localPath = join(root, resolveTarget('academy.lessonContent.local-x').replace('{lang}', lang));
  const lj = JSON.parse(readFileSync(localPath, 'utf8'));
  let lchanged = 0;
  for (const r of localRows) {
    const parts = r.key.split('.');
    const lessonId = parts[2];
    const idx = Number(parts[3]);
    const arr = lj.lessonContent[lessonId] ?? (lj.lessonContent[lessonId] = []);
    if (arr[idx] === undefined) {
      const value = lang === 'zh' ? r.zh : dict[r.zh];
      if (value === undefined) throw new Error(`Missing dict en for: ${r.zh}`);
      arr[idx] = value;
      lchanged++;
    }
  }
  if (lchanged > 0) {
    writeFileSync(localPath, JSON.stringify(lj, null, 2) + '\n', 'utf8');
    console.log(`${lang}/local-lessons.json: +${lchanged}`);
  }
}
console.log('done');
