/**
 * Heads-Up (单挑) 理论 Level 集合
 * Day 2-3: 游戏变体支持扩展 - Heads-Up T1-T9 骨架
 * 
 * ID 命名规则：t{level}hu-{topic}
 */

import type { TheoryLevelInfo, VariantRuleInfo } from '@/features/theory-academy/types';
import type { PokerVariant } from '@/shared/types/elo';

const variant: PokerVariant = 'heads-up';

/** 变体特有规则 */
const headsUpRules: VariantRuleInfo = {
  deckSize: 52,
  positionDynamics: {
    sbAnte: true,
    bbFirstActionPreflop: true,
    sbFirstActionPostflop: true,
  },
  blindStructure: {
    sbAmount: 0.5,
    bbAmount: 1,
  },
};

// ========== T1: 概率基础（单挑版）==========
export const t1hu: TheoryLevelInfo = {
  id: 't1hu',
  level: 1,
  tier: 'basic',
  title: '单挑概率基础',
  description: '理解单挑中的独特概率分布',
  icon: '👤',
  variant,
  unlockRequirement: '无前置要求',
  practiceRecommendations: {
    lessons: [
      { id: 'l1-basics', title: '德州扑克规则与牌型' },
      { id: 'l7hu-stakes', title: '单挑策略基础' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't1hu-probability',
      level: 1,
      order: 1,
      title: '两人对局概率',
      subtitle: '单挑中的起手牌强度重排',
      duration: '10 min',
      eloDimension: 'math',
      objectives: [
        '掌握单挑结构差异（SB 强制 Ante、BB 翻前最后行动、翻后 SB 先行动）对概率框架的影响',
        '理解单挑起手牌胜率重排：只需打败一个对手时，高张与同花连张的价值上升',
        '会用组合数推导"对手拿 A"等单挑关键概率，并建立三档胜率锚点',
      ],
      content: [
        { type: 'heading', content: '从满员桌到单挑：一切都变了' },
        {
          type: 'text',
          content:
            '单挑（Heads-Up）只有两名玩家，每手牌你与对手互为 SB 与 BB。结构差异深刻影响概率框架：SB 强制投入 0.5（兼具 Ante 性质）、BB 投入 1；翻前 BB 永远最后行动，SB 的加注无法"偷走"盲注；翻后 SB 先行动，BB 拥有翻后位置优势。由此，可玩起手牌比例从满员桌的约 15%-20% 飙升到约 50% 以上——因为你要打败的只有一个对手。',
        },
        {
          type: 'key-point',
          content: '手牌的价值由"你要打败几个人"决定。单挑中你面对的是一个人而不是八个人——这个事实重排了几乎每一手牌的胜率。',
        },
        { type: 'heading', content: '起手牌胜率重排' },
        {
          type: 'formula',
          content:
            '对手至少拿一张 A 的概率（你持两张非 A 牌）：\n剩余牌堆 50 张：A 4 张、非 A 46 张\n对手总组合数：C(50,2) = 50×49÷2 = 1225\n对手两牌皆非 A：C(46,2) = 46×45÷2 = 1035\n至少一张 A = 1 − 1035÷1225 ≈ 15.5%\n\n真正体现单挑差异的对比是"对手范围中强牌的密度"。当你持 AA 时，剩余 50 张仅含 2 张 A，单挑对手拿 AA 仅 1/1225 ≈ 0.08%；而满员桌 8 名对手中至少一人拿 AA 约 8/1225 ≈ 0.65%——单挑中你最强牌的统治力极少被"撞车"抵消。更关键的是：单挑中对手范围里的牌 50% 以上你都领先，而满员桌你最多领先 3-4 人——"密度"的差异才是真正影响决策的因素。（概念源自：《The Theory of Poker》David Sklansky Ch.1 手牌价值与对手数量；《Modern Poker Theory》Michael Acevedo Ch.1 单挑范围收窄）',
        },
        {
          type: 'text',
          content:
            '15.5% 这个数字意味着什么？单挑中每 6-7 手就有一手对手至少有一张 A，但你的牌同样也经常领先——因为对手范围宽，绝大多数时候他的 A 是裸 A 而非压制你的对子。真正需要警惕的不是"对手有 A"这个事实，而是"A 配了什么 kicker"。满员桌中 "有人有 A" 几乎等于"有人有更强的牌"，但单挑中远非如此。',
        },
        {
          type: 'example',
          content:
            '实例：单挑 100BB 深，你（SB）持 A♠K♥，对手（BB）范围接近随机牌。翻前全下，AKo 对随机牌约 65.4%；若你只加注到 3BB 对手跟注，翻后 A 高仍是强势摊牌牌。对比满员桌：UTG 持 AKo 面对 8 名对手全下，胜率跌到约 30%——同一手牌，单挑中是碾压级，满员桌是边缘牌，这就是"重排"的实战意义。',
        },
        {
          type: 'formula',
          content:
            '单挑 vs 随机牌的翻前全下胜率锚点：\nAA ≈ 85%｜KK ≈ 82%｜QQ ≈ 80%\nAKo ≈ 65%｜AQs ≈ 66%｜KQs ≈ 62%\n22 ≈ 50%｜T9s ≈ 52%｜72o ≈ 35%\n满员桌九人全下最差手牌跌破 15%，而单挑最差手牌仍保有约 35%——任何两张牌在单挑中都不是死牌。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.1 单挑起手牌排名）',
        },
        {
          type: 'example',
          content:
            '实例二：你持 A♠A♥。单挑中对手拿 AA 的概率 = 1/1225 ≈ 0.08%（你持两张 A 后剩余 50 张仅含 2 张 A）；满员桌 8 名对手中至少一人拿 AA 约 8/1225 ≈ 0.65%。同时，AA 对随机牌约 85% 胜率，而 AA 在九人桌面对 8 人全下只剩约 31%——单挑中你最强牌的统治力既更少被"撞车"抵消，也更少被多人底池稀释。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：单挑中"烂牌"远没有想象中烂。72o 对随机牌仍有约 35% 胜率——对手的任何加注都无法"代表"一手比你强很多的牌。沿用满员桌"必须等好牌"的心态，会在单挑中慢性失血。',
        },
        {
          type: 'pro-tip',
          content:
            '建立三档速查锚点：大对子/高张 65%-85%、中小对子约 50%、垃圾牌约 35%。翻前遇到全下，先用这三档估算处境，再谈底池赔率——锚点数字就是单挑桌边的速算词典。',
        },
      ],
      quiz: [
        {
          id: 't1hu-probability-q1',
          question: '单挑中你持 AKo 面对对手随机底牌，翻牌前全下胜率约为：',
          options: ['约 55%', '约 65%', '约 75%', '约 85%'],
          correctIndex: 1,
          explanation: 'AKo 对随机牌约 65.4%。85% 是 AA 对随机牌的胜率；55% 接近中小对子的水平——把 AKo 当成 55% 会低估单挑高张的价值。',
        },
        {
          id: 't1hu-probability-q2',
          question: '你持两张非 A 底牌，单挑中对手至少拿一张 A 的概率约为：',
          options: ['约 4%', '约 8%', '约 15.5%', '约 30%'],
          correctIndex: 2,
          explanation: '1 − C(46,2)/C(50,2) = 1 − 1035/1225 ≈ 15.5%。0.65% 是满员桌 8 名对手中至少一人拿 AA 的量级（你持 AA 时），与本题条件概率不同。30% 是对单挑中 A 出现概率的明显高估。',
        },
        {
          id: 't1hu-probability-q3',
          question: '关于单挑盲注结构，下列哪项描述正确？',
          options: [
            'SB 强制投入 0.5，BB 翻前最后行动，翻后 SB 先行动',
            'SB 翻前最后行动，可以免费看翻牌',
            'BB 每手强制投入 0.5 且翻后最后行动',
            'SB 与 BB 翻后行动顺序随机',
          ],
          correctIndex: 0,
          explanation: '单挑中 SB 强制投入 0.5（兼具 Ante 性质）、BB 翻前最后行动、翻后 SB 先行动（BB 获得翻后位置优势）。其余选项均与单挑规则相反。',
        },
        {
          id: 't1hu-probability-q4',
          question: '与九人桌相比，单挑中你持 AA 被对手拿 AA 压制的概率：',
          options: ['更高：对手拿 AA 约 0.65%', '更低：对手拿 AA 约 0.08%', '完全相同', '无法比较'],
          correctIndex: 1,
          explanation: '你持 AA 后剩余 50 张仅含 2 张 A，单挑对手拿 AA 概率 1/1225 ≈ 0.08%；满员桌 8 名对手中至少一人拿 AA 约 8/1225 ≈ 0.65%。单挑中你最强牌的统治力更少被"撞车"抵消。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't1hu-outs',
      level: 1,
      order: 2,
      title: 'Outs 计算',
      subtitle: '单挑听牌的更高胜率',
      duration: '12 min',
      eloDimension: 'math',
      objectives: [
        '理解单挑中 Outs 的相对性：先判断领先还是落后，再决定数谁的 Outs',
        '掌握 6 Outs 高张与 15 Outs 组合听牌的双街精确推导与 2/4 法则误差边界',
        '将单挑听牌胜率转化为半诈唬与全下决策',
      ],
      content: [
        { type: 'heading', content: '单挑中的 Outs：先回答"谁领先"' },
        {
          type: 'text',
          content:
            'Outs 的定义不变——能让你的牌反超对手的未知牌。但单挑改变了"干净 Outs"的标准：对手范围宽，往往只有一对甚至只有高牌，你的高张 Outs 极少被反向压制；满员桌多路底池中"某张 Outs 给另一个对手送同花"的风险在单挑中几乎消失，折扣幅度可以从 7-8 折放宽到约 9 折。',
        },
        {
          type: 'key-point',
          content: 'Outs 永远是相对范围而言的。单挑中先判断"我现在领先还是落后"，再决定数谁的 Outs——顺序错误是单挑新手最大的数学错误。',
        },
        { type: 'heading', content: '反转视角：数对手的 Outs' },
        {
          type: 'formula',
          content:
            '经典场景：你高牌领先，对手持两张更小的高牌听牌，对手 6 个 Outs（3+3）。双街精确推导（翻牌圈，未知牌 45 张）：\nP(转牌命中) = 6÷45 ≈ 13.3%\nP(转牌未中、河牌命中) = (39÷45)×(6÷44) ≈ 11.9%\nP(双街至少一中) ≈ 25.2%（2/4 法则估 24%，误差约 1 个百分点）\n你的领先胜率 ≈ 1 − 25.2% ≈ 74.8%（反向红色会小幅修正，量级不变）。（概念源自：《The Mathematics of Poker》Bill Chen / Jeremie Ankenman Ch.5-6 Outs 与概率树；《Heads-Up No-Limit Hold’em》Collin Moshman Ch.4 单挑听牌对抗）',
        },
        {
          type: 'example',
          content:
            '实例：单挑盲注 0.5/1，翻前 SB 补满到 1、BB 选择 check，底池 2。翻牌 9♠7♦2♣，你（BB）持 K♠Q♠，对手（SB）持 J♣T♦。你以 K 高领先，对手只有 6 个 Outs（3 张 J + 3 张 T），双街反超约 25.2%，你的总胜率约 67%（对手中牌后你仍有 K/Q 反超的红色）。对手下注 1（半池）。决策：若你跟注 1，对手转牌只需再付一次注就能看河牌，等于用低成本买走约 25% 的反超机会——这是错误起点；正确做法是加注到 3 左右：对手弃牌你直接赢下底池 3（2+1），对手跟注则是在为 25% 的机会支付超过其价值的代价。单挑中"领先时保护"的出现频率远高于满员桌。',
        },
        {
          type: 'formula',
          content:
            '组合听牌 15 Outs 的精确胜率（翻牌→河牌两张牌）：\n15 Outs = 同花 9 + 高张 6\nP(两张都不中) = (32÷47)×(31÷46) ≈ 45.9%\nP(至少一中) = 1 − 45.9% ≈ 54.1%\n2/4 法则给 60%，高估约 6 个百分点——Outs ≥ 13 时改用修正公式 Outs×4 − (Outs−8) = 53%，或直接口算 54%。',
        },
        {
          type: 'example',
          content:
            '实例二：单挑盲注 0.5/1，你（BB）持 A♥K♥，对手（SB）3Bet 后你跟注，底池 8。翻牌 9♥7♥2♣，对手（约 5♠5♦）下注 5。你同花 9 Outs + 高张 6 Outs = 15 Outs，约 54.1% 胜率，但目前只有 A 高落后。决策：加注或全下是正 EV——对手弃牌你直接赢 13（底池 8 + 下注 5），被跟注你仍有 54%；对手的对子反而沦为"抽两对/三条"的听牌方。满员桌多路底池中这种组合听牌胜率会被稀释到 50% 以下，单挑中却可以放心激进。（概念源自：《Applications of No-Limit Hold’em》Matthew Janda Ch.6 半诈唬与组合听牌）',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：单挑中听牌不是"被动等待"，而是进攻武器。15 Outs 的组合听牌即使当前落后也是翻硬币优势——谁更接近坚果，谁就拥有进攻权。',
        },
        {
          type: 'pro-tip',
          content:
            '实战口诀：先问"谁领先"，再数 Outs。领先 → 数对手的 Outs 并让他们付费；落后 → 数自己的 Outs 并计算底池赔率。单挑每手牌都重复这个流程，速度决定胜率。',
        },
      ],
      quiz: [
        {
          id: 't1hu-outs-q1',
          question: '你持 K♠Q♠（K 高）领先对手 J♣T♦（J 高），翻牌 9♠7♦2♣。对手转牌+河牌反超的概率约为：',
          options: ['约 13%', '约 25%', '约 37%', '约 50%'],
          correctIndex: 1,
          explanation: '对手 6 个 Outs（3 张 J + 3 张 T），双街命中 = 6/45 + (39/45)×(6/44) ≈ 25.2%。13% 是只看一张牌的量级，50% 明显高估。',
        },
        {
          id: 't1hu-outs-q2',
          question: '单挑中 15 个 Outs 的组合听牌在翻牌圈全下，精确胜率约为：',
          options: ['约 45%', '约 54%', '约 60%', '约 68%'],
          correctIndex: 1,
          explanation: '1 − (32/47)×(31/46) ≈ 54.1%。2/4 法则给 60% 高估约 6 个百分点，45% 是仅数同花 Outs 的低估——这正是 15 Outs 要用修正公式的原因。',
        },
        {
          id: 't1hu-outs-q3',
          question: '为什么单挑中顺子听牌的 Outs 通常比满员桌更"干净"？',
          options: [
            '因为单挑底池更小',
            '因为只有一个对手，同时持有同花听牌压低 Outs 的概率更低',
            '因为单挑中顺子牌型更大',
            '因为单挑发牌方式不同',
          ],
          correctIndex: 1,
          explanation: '多路底池中"某张 Outs 给另一个对手送同花"的风险在单挑中几乎消失，折扣可从 7-8 折放宽到约 9 折。底池大小与发牌方式不影响 Outs 的干净度。',
        },
        {
          id: 't1hu-outs-q4',
          question: '你持 A♥K♥ 落后对手 5♠5♦，翻牌 9♥7♥2♣，你的胜率约为：',
          options: ['约 40%', '约 54%', '约 65%', '约 73%'],
          correctIndex: 1,
          explanation: '同花 9 Outs + 高张 6 Outs = 15 Outs，双街 ≈ 54.1%——落后却是翻硬币优势，这是单挑组合听牌可以激进全下的数学基础。40% 是只数同花 Outs 的错误值。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't1hu-variance',
      level: 1,
      order: 3,
      title: '波动管理',
      subtitle: '单挑的高频对抗效应',
      duration: '10 min',
      eloDimension: 'mental',
      objectives: [
        '理解单挑高频对抗导致波动浓缩的数学机制（√N 法则与 50-60% 全下分布）',
        '掌握连败窗口的概率直觉，避免把波动误判为水平问题',
        '将波动意识落地为单挑资金管理（50 个买入以上）与 session 管理原则',
      ],
      content: [
        { type: 'heading', content: '单挑波动：更快、更密、更剧烈' },
        {
          type: 'text',
          content:
            '单挑中每手牌你都在盲注位（SB 或 BB），盲注频率是九人桌的约 4.5 倍；SB 只需补 0.5 就能看翻牌，几乎每手都进翻牌；线上单挑每小时可达 200-300 手，是满员桌的 2-3 倍。同样的胜率优势在单挑中被"浓缩"进更短的时间——波动不是单挑的缺陷，而是高频对抗的数学必然。',
        },
        {
          type: 'key-point',
          content: '单挑下风期不是异常，而是必然：每小时的决策数、全下数、盲注压力全部加倍，运气的影响密度也随之加倍。',
        },
        { type: 'heading', content: '波动数学：高频全下的叠加' },
        {
          type: 'formula',
          content:
            '单次全下的标准差（伯努利模型：赢 +100、输 −100 筹码，p = 60%）：\nσ = √(p×(1−p)) × 100 = √(0.6×0.4) × 100 ≈ 49 筹码\n连续 N 手累计：σ_total = σ×√N\n50 手：σ ≈ 49×√50 ≈ 347；期望 = 50×(0.6−0.4)×100 = 1000\n亏损概率：1000÷347 ≈ 2.9σ → 约 0.2%\n结论：期望为正的 1000 筹码仍可能整体亏损——单挑中 60% 胜率的全下天天发生，这正是"赢家也会长期回撤"的数学根源。（概念源自：《The Mathematics of Poker》Bill Chen / Jeremie Ankenman Ch.3 方差与标准差；《The Mental Game of Poker》Jared Tendler Ch.4 波动耐受与情绪）',
        },
        {
          type: 'text',
          content:
            '√N 法则的直觉：波动随样本量平方根增长，而期望随样本量线性增长。因此翻倍样本量只能将波动的相对影响缩小到 1/√2 ≈ 70%，需要 4 倍样本量才能将波动影响减半。单挑的高频对抗意味着你更快积累样本，但同样也更快经历波动的完整周期——这正是"赢家也会长期回撤"的数学根源。',
        },
        {
          type: 'example',
          content:
            '实例：55% 胜率是单挑常见的翻前全下局面（如小对子对两高张约 55:45）。连输 5 手概率 = 0.45⁵ ≈ 1.8%，每小时 200+ 手中约出现 3-4 次；连输 8 手 ≈ 0.17%，约每 3 小时一次。换句话说：单挑 session 中"连续输掉一大串"不是运气差，而是稳定出现的背景噪声——把它当成天气，而不是审判。',
        },
        {
          type: 'formula',
          content:
            '单挑 vs 满员桌的波动参数对比（bb/100 手典型量级）：\n满员桌：赢家 5bb/100，标准差 80-100\n单挑：赢家 5-15bb/100，标准差 120-180\n单挑的"波动/期望"比更高：同样的 5bb 优势需要 2-4 倍样本量才能可靠收敛——这就是单挑玩家比满员桌玩家更容易怀疑自己水平的原因。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.10 资金管理与波动）',
        },
        {
          type: 'example',
          content:
            '实例二（资金管理推演）：假设你单挑胜率 55%、买入 100 筹码、每百手标准差 150。若只带 20 个买入（满员桌标准），约 5% 概率出现 20 个买入（2000 筹码）级别的下风期——单挑的高频波动可能让这种下风在数周内兑现；带 50 个买入，同样的波动只消耗约 40% 资金。结论：单挑资金门槛更高，Moshman 建议至少 50 个买入，并按"降级/补级"规则严格执行，而不是"再打一场翻本"。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：单挑中"输了很多手"几乎不证明"打得差"。每小时的样本里塞满了 55%-60% 胜率的全下，连输 8-10 手是数学常态。用决策日志（记录每个关键决策的推理）代替输赢日志复盘，否则你会在波动最剧烈时做出最差的策略调整。',
        },
        {
          type: 'pro-tip',
          content:
            '单挑 session 管理三件套：(1) 预设波动预算——100BB 深局输 40-50BB 即暂停复盘，是止损重开而非翻本；(2) 每 100 手起身一次，切断连败的心理惯性；(3) 复盘只问 EV 不问结果——Tendler 的"过程 vs 结果"分离是单挑心理的生存技能。',
        },
      ],
      quiz: [
        {
          id: 't1hu-variance-q1',
          question: '单挑中你以 55% 胜率连续全下 10 手，10 手全输的概率约为：',
          options: ['约 0.03%', '约 0.3%', '约 3%', '约 30%'],
          correctIndex: 0,
          explanation: '0.45¹⁰ ≈ 0.00034 ≈ 0.03%。虽然单次看似罕见，但单挑每小时 200+ 手、55%-60% 全下反复出现，连败窗口每个 session 都可能遇到——这正是高频对抗的波动效应。',
        },
        {
          id: 't1hu-variance-q2',
          question: '单挑现金桌的典型标准差（bb/100 手）与满员桌相比：',
          options: ['更低，约 40-60', '相近，约 80-100', '更高，常达 120-180', '没有可比性'],
          correctIndex: 2,
          explanation: '单挑每手都参与、全下胜率常落在 50%-60% 区间，单次结果不确定性强，标准差典型量级 120-180bb/100，明显高于满员桌的 80-100。',
        },
        {
          id: 't1hu-variance-q3',
          question: '单挑中 SB 以低成本（limp）看翻牌为何比满员桌更常见？',
          options: [
            'SB 已投入 0.5，补 0.5 即可看翻牌，且 BB 翻前最后行动',
            '单挑中 SB 总是最后行动',
            '单挑中盲注比满员桌小',
            '单挑翻牌后没有下注',
          ],
          correctIndex: 0,
          explanation: 'SB 已投入 0.5，补 0.5 到 1 就能看翻牌（赔率 1:3，跟注 0.5 争夺 1.5 底池）；且 BB 翻前最后行动意味着 SB 的 limp 不会被加注后失去位置——因此单挑几乎每手都进翻牌，决策密度极高。其余选项与单挑规则不符。',
        },
        {
          id: 't1hu-variance-q4',
          question: '资金管理上，单挑现金桌建议的买入数约为：',
          options: ['10-15 个买入', '20-40 个买入', '50 个以上买入', '2-3 个买入'],
          correctIndex: 2,
          explanation: '单挑标准差高、下风期更浓缩，建议 50 个以上买入（Moshman）；20-40 是满员桌标准，直接套用在单挑上可能被波动击穿，10-15 与 2-3 则远超合理风险范围。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T2: 赔率与 EV（单挑版）==========
export const t2hu: TheoryLevelInfo = {
  id: 't2hu',
  level: 2,
  tier: 'basic',
  title: '单挑赔率策略',
  description: '掌握单挑情境下的数学决策',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T1HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l4hu-ev-adjustments', title: 'EV 调整' },
      { id: 'l7hu-stakes', title: '单挑策略基础' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't2hu-odds',
      level: 2,
      order: 1,
      title: '即时赔率',
      subtitle: '单挑底池赔率的特殊性',
      duration: '12 min',
      eloDimension: 'math',
      objectives: [
        '理解单挑盲注结构导致的翻前底池赔率差异——SB 的 0.5 死钱使跟注价格显著优于满员桌',
        '掌握 limp vs raise 两种行动的底池赔率计算与跟注需求阈值',
        '对比单挑与满员桌的多路底池中"赔率稀释"的本质：公式不变、胜率打折',
      ],
      content: [
        { type: 'heading', content: '单挑中的底池赔率为什么"不一样"' },
        {
          type: 'text',
          content:
            '单挑的盲注结构与满员桌有根本差异：SB 投入 0.5BB 且兼具 Ante 性质，BB 投入 1BB，翻前总底池仅 1.5BB，相对 100BB 有效筹码可忽略不计。关键点是：SB 的 0.5 是"死钱"，任何未投入的玩家（在本例中只有 BB）都可以免费看翻牌——因为 SB 已投了部分，只需补 0.5 即可凑成 1.5BB 的全额盲注。这导致单挑翻前的"争夺频率"远高于满员桌：你不必等待对手加注才能看到有利赔率，limp 就能以约 25% 的所需胜率进入翻牌圈。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.2 翻前赔率结构；《Applications of No-Limit Hold’em》Matthew Janda Ch.3 盲注博弈）',
        },
        { type: 'key-point', content: '底池赔率只算数字，不看情绪。单挑中 SB 的死钱意味着每次 limped pot 都是自动正 EV 机会，只要你的牌力超过所需胜率即可。' },
        { type: 'heading', content: 'SB limp 后的跟注价格推导' },
        {
          type: 'formula',
          content: '翻前 SB limp 场景：SB 已投 0.5，BB 已投 1，底池 1.5BB。SB 若要补到 1 看翻牌（即完成盲注），需再投入 0.5。\n\n所需胜率计算公式：\n所需胜率 = 跟注额 ÷ (当前底池 + 对手下注 + 跟注额)\n\n应用：\n• 当前底池 = 1.5BB（含 SB 已投的 0.5，但这已是死钱）\n• 对手下注 = 0（无人加注）\n• 跟注额 = 0.5BB（SB 补足的差额）\n• 所需胜率 = 0.5 ÷ (1.5 + 0 + 0.5) = 0.5 ÷ 2.0 = 25%\n\n推导验证：设胜率为 E。EV(跟注) = E×1.5 − (1−E)×0.5。盈亏平衡时：E×1.5 = (1−E)×0.5 → 1.5E = 0.5 − 0.5E → 2E = 0.5 → E = 25%。（概念源自：Harrington on Hold\u2019em Vol.1 Ch.3 底池赔率公式，Dan Harrington / Bill Robertie）',
        },
        {
          type: 'example',
          content:
            '实例：单挑盲注 0.5/1，你持 Q♠J♠。翻前 SB limp（补 0.5），你（BB）check。翻牌 T♦8♣3♥，你听两头顺。转牌 A♠，底池 2.5BB，BB 下注 1.25BB（半池）。你跟注 1.25，所需胜率 = 1.25 ÷ (2.5+1.25+1.25) = 1.25÷5 = 25%。QJ 在 T83A 面仍有 K+9=8 Outs ≈ 17%（只看河牌）；加上顶对的 2 个 Outs（剩余 Q 和 J 各 1 张），合计 10 Outs ≈ 21.7%。单街不足 25%，弃牌或 check-raise。这个例子展示：即使底池赔率便宜（25%），若你的手牌权益不足以覆盖，仍需弃牌。关键是把赔率和胜率分别计算，而不是模糊判断。',
        },
        {
          type: 'example',
          content:
            '实例二：SB 持 J♠T♠，limp 看翻牌（赔率 25%）。翻牌 J♣7♦2♠，中顶对。BB 下注 1BB（底池 2BB）。你跟注所需胜率 = 1 ÷ (2+1+1) = 25%。你的顶对胜率远超过 25%（对手范围宽，你可能领先）→ 轻松跟注。对比满员桌同一局面：5 人底池，底池 5BB，下注 2.5BB（半池），所需胜率仍为 25%（公式尺度无关）——但你的实际胜率被多人稀释，可能从 60% 跌到 40%，而 HU 中对单对手仍是 60%。这就是"赔率稀释"的数学本质：底池给的价格不变，但胜率需要按人数重新校准。',
        },
        {
          type: 'formula',
          content: '面对加注时的跟注赔率对比（开池到 3BB）：\n\n单挑场景（BB 防守）：\n• SB 开池到 3BB（总投入 3），BB 已投 1，底池 = 4BB\n• BB 需跟注 2BB（3−1）\n• 所需胜率 = 2 ÷ (4+2) = 33.3%\n\n满员桌场景（BTN 跟注 UTG 开池 3BB）：\n• UTG 开池 3BB，SB/Fold/CO 弃牌，BTN 面对底池 4.5BB（UTG 的 3+SB 0.5+BB 1）\n• BTN 需跟注 3BB\n• 所需胜率 = 3 ÷ (4.5+3) = 40%\n\n结论：同样尺度的开池，BB 的跟注价格更便宜（33.3% < 40%）。原因：SB 的 0.5 死钱降低了跟注成本，且 HU 中对手范围宽（通常 >60%），你的胜率更高。满员桌面对 UTG 范围（约 15%）胜率更低，所需胜率更高，边缘牌直接弃牌。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前赔率计算）',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：单挑中"小牌"不是废牌。9-高在单挑中翻后仍可赢牌——因为对手的跟注范围极宽（30%-50% 起手牌），9-high 的摊牌价值远超满员桌。同样的底池赔率 25%，单挑中 9-high 可能在 40%+的时机领先，而满员桌只有 15%-20%。',
        },
        {
          type: 'pro-tip',
          content:
            '速算锚点：单挑半池下注所需胜率 25%，1/3 池 20%，2/3 池 28.6%，满池 33.3%。limp 看翻牌 25%，开池跟注 3BB 33.3%。这些数字背熟，牌桌上比数更快。',
        },
      ],
      quiz: [
        {
          id: 't2hu-odds-q1',
          question: '单挑中翻前 SB 补 0.5 看翻牌的所需胜率约为：',
          options: ['15%', '25%', '33%', '40%'],
          correctIndex: 1,
          explanation: '底池 1.5BB，SB 跟注 0.5BB，所需胜率 = 0.5 ÷ (1.5+0.5) = 25%。选项 B 正确；其他选项偏离真实值过多。',
        },
        {
          id: 't2hu-odds-q2',
          question: 'SB 开池 3BB，BB 跟注所需胜率约为：',
          options: ['25%', '33.3%', '40%', '50%'],
          correctIndex: 1,
          explanation: '底池 = 3+1 = 4BB，BB 跟注 2BB，所需胜率 = 2 ÷ (4+2) = 33.3%。选项 B 正确；注意这与满员桌 BTN 跟注 40% 不同，因为单挑死钱占比更高。',
        },
        {
          id: 't2hu-odds-q3',
          question: '单挑中"赔率稀释"的正确含义是：',
          options: [
            '底池赔率公式在不同人数时会改变',
            '半池下注的单挑和满员桌所需胜率相同，但胜率被多人瓜分',
            '多人底池中每张 Outs 的价值下降',
            '以上都正确',
          ],
          correctIndex: 1,
          explanation: '底池赔率公式本身尺度无关，半池永远是 25%。但多人底池中你面临多个对手，命中同花可能被更大同花击败、顶对被更好踢脚压制——这就是"胜率打折"的稀释机制。',
        },
        {
          id: 't2hu-odds-q4',
          question: '单挑中对手范围宽（如 60% 起手牌）对跟注决策的影响是：',
          options: [
            '提高所需胜率（更难赢）',
            '降低所需胜率阈值，使得更多牌可以跟注',
            '不影响数学计算，只看位置',
            '迫使玩家收紧跟注范围',
          ],
          correctIndex: 1,
          explanation: '对手范围越宽，你持有任意两张牌时的胜率越高（例如 9-high 对宽范围约 40% 领先）。同样的底池赔率下，宽范围的跟注门槛更低，这是单挑中激进风格的数学基础。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't2hu-ev',
      level: 2,
      order: 2,
      title: '期望值优化',
      subtitle: '双位置优势的价值实现',
      duration: '15 min',
      eloDimension: 'math',
      objectives: [
        '掌握 EV 三分支框架（fold/call/raise）及其数值比较方法',
        '理解位置价值量化：单挑中每手牌约 0.5-1BB 的位置差异（BB 位优势）',
        '用 EV 模型分析翻前 limp vs raise 决策，识别死钱偷盲价值',
      ],
      content: [
        { type: 'heading', content: 'EV 框架：fold / call / raise 三分支' },
        {
          type: 'text',
          content:
            '扑克中的所有决策都可以分解为三个分支：弃牌、跟注、加注。每个分支都有独立的 EV 计算公式，最优策略是选择 EV 最大的行动。单挑中 EV 计算的特殊之处在于：范围极宽（60%+），死钱占比高（0.5BB SB 死钱），位置优势明显（BB 位每手都有翻后信息优势）。这些因素都会影响分支 EV 的大小，但不改变 EV 的计算逻辑本身。（概念源自：《The Theory of Poker》David Sklansky Ch.6 期望值基础）',
        },
        {
          type: 'formula',
          content: '跟注的 EV 公式：\nEV(call) = P(win) × (Pot + CallOpponent) − P(lose) × CallHero\n\n推导：\n假设底池 = P，对手下注 = B，你跟注额 = B。\n• 若你赢：净盈利 = P + B（赢得底池 + 对手下注）\n• 若你输：净亏损 = B（失去跟注额）\n• 胜率 = E，败率 = 1 − E\n\n因此：EV(call) = E×(P+B) − (1−E)×B\n            = E(P+B) − B + EB\n            = E(P+2B) − B\n\n盈亏平衡条件：EV(call) = 0 → E(P+2B) = B → E = B ÷ (P+2B)，这正是所需胜率公式。\n\n示例：P=4BB, B=2BB, E=30% → EV = 0.3×6 − 0.7×2 = 1.8 − 1.4 = +0.4BB\n该值为正，跟注正确。（概念源自：Harrington on Hold’em Vol.1 Ch.3）',
        },
        {
          type: 'formula',
          content: '弃牌的 EV 恒为 0，作为基准线。下注的 EV 包含两部分：\nEV(bet) = 弃牌率 × 当前底池 + (1−弃牌率) × [胜率 × 新底池 − 败率 × 下注额]\n\n简化模型（纯诈唬：摊牌必输）：\nEV(bluff) = f×P − (1−f)×Bet\n盈亏平衡弃牌率 f*：令 EV=0 → f×P = (1−f)×Bet → f(P+Bet) = Bet → f* = Bet ÷ (P+Bet)\n\n实例：P=6BB, Bet=3BB → f* = 3 ÷ 9 = 33.3%。只要你估计对手弃牌率 > 33.3%，纯诈唬就是正 EV。（概念源自：《The Mathematics of Poker》Bill Chen / Jeremie Ankenman Ch.5 期望值计算）',
        },
        {
          type: 'example',
          content:
            '实例：翻牌圈底池 4BB，你（BB）持同花听牌 9 outs，对手（SB）下注 2BB。转牌一张牌，命中概率 = 9/47 ≈ 19.1%（单街精确值）。EV(call) = 0.191×6 − 0.809×2 = 1.146 − 1.618 = −0.47BB。纯数学上看，跟注负 EV。但如果考虑隐含赔率（命中后再赢 X），盈亏平衡 X = 0.47/0.191 ≈ 2.5BB。即命中后平均能再赢 2.5BB，跟注转为正 EV。这就是为什么听牌可以追隐含赔率好的对手——对方筹码深且愿意支付。（概念源自：《Applications of No-Limit Hold’em》Matthew Janda Ch.2 期望值计算）',
        },
        {
          type: 'example',
          content:
            '实例二（limp vs raise EV 对比）：SB 持 Q♠J♠，100BB 深。选项 A（limp）：BB 加注率 30%（你弃牌损失 -0.3BB 或跟注 -0.1）、BB check 率 70%（翻后 EV +0.5BB）。EV(limp) = 0.7×0.5 − 0.3×0.2 = 0.35 − 0.06 = +0.29BB。选项 B（raise 2.5BB）：BB 弃牌率 60%（+1.5BB）、BB 跟注率 30%（你无位置，-0.4BB）、BB 3Bet 率 10%（-2.5BB 弃牌，损失全部 2.5BB 加注额）。EV(raise) = 0.6×1.5 + 0.3×(−0.4) + 0.1×(−2.5) = 0.9 − 0.12 − 0.25 = +0.53BB。结论：raise > limp（0.53 > 0.29）。原因是 SB 死钱带来的 steal EV（弃牌率 60% 直接赢 1.5BB），以及 raise 的范围优势。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前策略）',
        },
        {
          type: 'formula',
          content: '位置价值量化：\n研究估计单挑中位置优势约 0.5-1BB/手。推导思路：\n• BB 每手翻后最后行动（有信息优势），SB 每手先行动（无位置）\n• 位置价值来自三点：a) 信息优势（看到 SB 行动再决定）b) 控池能力（cheap realization）c) 免费看牌（check to the aggressor）\n\n量化模型：位置差体现在单手的期望差异上。例如同一手 98s，你在 BB 位平均每手 +0.75BB，在 SB 位 -0.25BB，差值 1BB。100 手累计约 100BB 差异，但由于胜率本身的波动（±15bb/100），位置贡献约占总收益的 25%-50%。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.2 位置与权益）',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：在单挑中，很多情况下"raise"永远优于"call"，即使 call 也是正 EV。因为 EV 选最大，不是选正的——0.53BB (raise) > 0.29BB (limp)。记住：你的任务是最大化 EV，不是寻找"不亏"的选项。',
        },
        {
          type: 'pro-tip',
          content:
            '复盘模板：每个关键决策写三行 EV 估计：Fold EV = 0；Call EV = E×(P+B) − (1−E)×B；Raise EV = f×P + (1−f)×[...]。即使粗略估算，三行也比一行强得多。',
        },
      ],
      quiz: [
        {
          id: 't2hu-ev-q1',
          question: '单挑中 EV 三分支指的是：',
          options: [
            '下注、过牌、全下',
            '弃牌、跟注、加注',
            '价值下注、诈唬、半诈唬',
            '翻前、翻后、河牌',
          ],
          correctIndex: 1,
          explanation: 'EV 三分支是弃牌/跟注/加注，它们是所有决策点的原子选项。选项 A/C 属于下注类型分类，不是原子分支。',
        },
        {
          id: 't2hu-ev-q2',
          question: '底池 4BB，对手下注 2BB，你 30% 胜率，跟注的 EV 约为：',
          options: ['+0.4BB', '-0.47BB', '+1.0BB', '-1.0BB'],
          correctIndex: 0,
          explanation: 'EV = 0.3×6 − 0.7×2 = 1.8 − 1.4 = +0.4BB。选项 B (-0.47) 是同花听牌单街的负 EV，需要换到 30% 胜率才会得到这个结果；这里给的 30% 胜率对应的是强对子，非听牌。',
        },
        {
          id: 't2hu-ev-q3',
          question: '单挑中位置价值约 0.5-1BB/手，这个估值的含义是：',
          options: [
            'BB 位每手翻牌都能多赚 1BB',
            '长期来看 BB 位比 SB 位每手多 0.5-1BB 期望收益',
            '翻前位置的价值',
            '只在锦标赛中成立',
          ],
          correctIndex: 1,
          explanation: '位置价值是长期期望差异：BB 位因为有翻后信息优势，平均每手多赢 0.5-1BB。这不是单手保证的收益，而是统计意义上的期望值。',
        },
        {
          id: 't2hu-ev-q4',
          question: 'SB 持 Q♠J♠，limp EV = +0.29BB，raise 2.5BB EV = +0.53BB。正确的决策是：',
          options: ['limp（因为更保守）', 'raise（因为 EV 更高）', '取决于情绪状态', '随机选择'],
          correctIndex: 1,
          explanation: 'EV 最大化是核心原则：raise (0.53) > limp (0.29)。即使 limp 是正 EV，也不是最优选择。职业玩家的职责是选最大的那个数字。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't2hu-risk',
      level: 2,
      order: 3,
      title: '风险评估',
      subtitle: '翻后位置劣势的应对',
      duration: '10 min',
      eloDimension: 'math',
      objectives: [
        '理解单挑中翻后位置劣势方（SB 翻前最后行动但翻后先行动）的风险暴露',
        '掌握 check-raise 作为补偿工具，对比 check-call 的风险收益',
        '评估隐含赔率在单挑中的变化：宽范围导致支付密度低→反向隐含赔率上升',
      ],
      content: [
        { type: 'heading', content: '位置劣势方的风险定价' },
        {
          type: 'text',
          content:
            '单挑的关键规则事实：SB 翻前最后行动（有翻前位置），BB 翻前最后行动；但翻后，SB 先行动（无位置），BB 最后行动（有位置）。这意味着：SB 是翻后位置劣势方（Out-of Position, OOP），BB 是有位置方（In Position, IP）。位置劣势的风险在于：信息不对称（你不知道 BB 会做什么）、被迫做第一个决定、难以实现权益（容易被 raise 驱逐）。位置优势的价值在于：你可以看到对手的行动后再决定、可以用更便宜的价格实现权益、可以控制底池大小。单挑中位置劣势的风险需要策略补偿，这就是本章的核心。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.2 位置理论）',
        },
        {
          type: 'formula',
          content:
            'check-raise vs check-call 的 EV 对比：\n\n设定：底池 = 6BB，SB（OOP）下注 3BB，BB（IP）可选择 check-call 或 check-raise。\n\nOption A (check-call): BB 跟注 3BB\n• 若赢：盈利 = 底池 + 对手下注 + 你的跟注 = 6+3 = 9BB（不含你的 3BB 成本，净盈利 6BB）\n• 若输：损失 = 3BB（跟注额）\n• 胜率 = W\n• EV(CC) = W×9 − (1−W)×3 = 9W − 3 + 3W = 12W − 3\n\nOption B (check-raise to 9BB): BB 加注到 9BB（比跟注多投 6BB）\n• 若 SB 弃牌（概率 f）：BB 赢 6+3 = 9BB\n• 若 SB 跟注（1−f）：BB 总投入 9BB，最终底池 = 6+3+9+6 = 24BB（SB 跟注 6）\n• BB 净盈利 = W×24 − 9\n• EV(CR) = f×9 + (1−f)×(24W − 9)\n\n对比：CR 的优势在于 f×9 杠杆项（弃牌直接收池），代价是多投 6BB 的被跟注风险。\n参数测试：W=35%, f=60% → EV(CC)=12×0.35−3=4.2−3=+1.2BB\n                    EV(CR)=0.6×9+0.4×(24×0.35−9)=5.4+0.4×(8.4−9)=5.4−0.24=+5.16BB\n当弃牌率高时，CR >> CC。（概念源自：《Applications of No-Limit Hold’em》Matthew Janda Ch.6 半诈唬与组合听牌）',
        },
        {
          type: 'example',
          content:
            '实例一：盲注 0.5/1，有效筹码 100BB。你（BB）持 7♠6♠，SB 开池 2.5BB，你跟注。底池 5BB。翻牌 8♣5♦2♠（双卡顺听牌）。SB cbet 2.5BB（半池）。\n\nOption A (call)：EV(CC) ≈ 双卡顺 8 outs × 1/47 ≈ 17% × (5+2.5) − 83% × 2.5 ≈ 1.275 − 2.075 = -0.8BB（单街简化）\n\nOption B (check-raise to 8BB)：\n• SB 弃牌率 55%（HU 中 SB cbet 范围广，面对 raise 弃牌率高）\n• 被跟注时 BB 胜率 32%（双卡顺 + 后门花）\n• EV(CR) = 0.55×7.5 + 0.45×(15.5×0.32 − 8) = 4.125 + 0.45×(4.96 − 8) = 4.125 − 1.398 = +2.73BB\n\n对比：CR (+2.73) > call (-0.8)。结论：BB 利用弃牌率杠杆，用 check-raise 将听牌转化为立即盈利的工具。这是位置优势方的标准操作。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.4 听牌对抗策略）',
        },
        {
          type: 'example',
          content:
            '实例二（隐含赔率的变化）：单挑中对手范围宽（60%+ 起手牌），这对隐含赔率的影响是反直觉的。满员桌 Set Mining：你持 55 跟注 CO 开池 3BB，有效筹码 150BB，SPR≈50。命中 set（12%）时，对手 15% 范围更容易有强牌付你。但单挑中对手开池 60%（几乎任何牌），当你击中 set 时，对手可能有空气牌（不支付），也可能只有弱对子（你能榨出 3-5BB）。研究建议 HU 中 set mining 门槛提高到 20-25 倍跟注额（比满员桌的 15-20 倍更高），因为宽范围导致支付密度低。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前策略）',
        },
        {
          type: 'formula',
          content:
            'SPR（Stack-to-Pot Ratio）与风险暴露：\nSPR = 有效筹码 ÷ 底池\n\n解读：\n• SPR < 4：低 SPR，顶对价值上升。翻牌圈基本锁定所有筹码，位置劣势的影响减小（因为底池小）。\n• SPR 4-12：中风险，需要权衡位置与牌力。无位置方倾向于 check-call 或 small bet，避免被 raise 挤压。\n• SPR > 12：高风险，深筹码放大位置劣势。无位置方需要更紧地玩 top pair，依赖位置优势的玩家可以 exploit（例如 float turn）。\n\n实例：100BB 深，SB raise 2.5BB，BB call。底池 5BB，SPR = 97.5/5 ≈ 19.5。翻牌 K♥9♦3♣，SB（OOP）持 K♠Q♦。无位置 + 高 SPR → 顶对风险大，容易被更好的 Kx（AK/QK）碾压。正确策略：small bet 或 check-back，避免建立大底池。\n对比短筹码：15BB 深，同样局面，SPR = 12.5/5 = 2.5。此时顶对直接打光，位置劣势被"SPR 低"中和——你不必担心后续街的控制问题。（概念源自：Harrington on Hold’em Vol.1 Ch.4 SPR 理论）',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：在单挑中，位置优势方（BB）经常用 check-call 而非 check-raise。因为你有位置，不需要冒险 raise 来补偿劣势——check-call 让对手继续诈唬或价值下注，而你保留 fold 的权利。位置就是低风险高收益的工具。',
        },
        {
          type: 'pro-tip',
          content:
            '决策流程：1) 报 SPR：SPR < 4 打光、4-12 中风险、>12 控池；2) 报位置：OOP 优先 raise 补偿，IP 优先 check-call 控权；3) 评估牌力：坚果听牌 favor raise，中等牌 favor call。这三个步骤形成肌肉记忆。',
        },
      ],
      quiz: [
        {
          id: 't2hu-risk-q1',
          question: '单挑中翻后谁先行动？',
          options: ['BB', 'SB', '根据按钮移动', '随机'],
          correctIndex: 1,
          explanation: 'SB 是翻后位置劣势方（先行动），BB 是位置优势方（后行动）。这是单挑的基本规则事实，决定了翻后决策的所有数学基础。',
        },
        {
          id: 't2hu-risk-q2',
          question: '底池 6BB，对手下注 3BB，检查 - 加注到 9BB 的盈亏平衡弃牌率是：',
          options: ['20%', '33.3%', '45%', '55%'],
          correctIndex: 1,
          explanation: '纯诈唬假设下（摊牌必输），EV(check-raise) = f×9 − (1−f)×9 = 18f − 9；EV(check-call) = −3（跟注 3 必输）。令 18f − 9 = −3，得 f = 33.3%。补充说明：若 check-raise 有摊牌价值（W>0），盈亏平衡弃牌率更低。选项 B 正确。',
        },
        {
          id: 't2hu-risk-q3',
          question: '单挑中隐含赔率为何可能低于满员桌？',
          options: [
            '因为对手总是很紧',
            '因为对手范围宽，支付密度低',
            '因为底池太小',
            '因为位置优势更大',
          ],
          correctIndex: 1,
          explanation: '对手范围宽（60%+）意味着他们有很多空气牌，当你击中强牌（set/两对）时，他们可能没有足够强的牌付钱。这就是"支付密度低"，隐含赔率下降。',
        },
        {
          id: 't2hu-risk-q4',
          question: 'SPR > 12 时，无位置方（SB）的最优策略倾向是：',
          options: [
            '用顶对激进打光筹码',
            '控池（small bet/check-back）',
            '直接全下',
            'fold 所有非坚果牌',
          ],
          correctIndex: 1,
          explanation: '高 SPR 放大位置劣势：你容易陷入深底池的艰难决策（尤其是被 raise 时）。无位置方应该控池，避免把太多筹码投入边缘牌。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T3: 起手牌与位置（单挑版）==========
export const t3hu: TheoryLevelInfo = {
  id: 't3hu',
  level: 3,
  tier: 'basic',
  title: '单挑位置与起手牌',
  description: '精通 SB/BB 位置的差异策略',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T2HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l4hu-bn-opening', title: '按钮位开局加注' },
      { id: 'l3hu-bb-defense', title: 'BB 防守' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't3hu-sb-strategy',
      level: 3,
      order: 1,
      title: 'SB 位置策略',
      subtitle: '翻前 limp 范围与强制 ante',
      duration: '15 min',
      eloDimension: 'preflop',
      objectives: [
        '理解单挑 SB 的结构独特性——翻前最后行动 + 0.5 强制 Ante 死钱，与满员桌 SB 完全相反',
        '掌握 SB 开池尺度的数学：盈亏平衡弃牌率与 MDF，理解 min-raise 为何是单挑主武器',
        '学会划分 limp 叠与 raise 叠，理解单挑 limp 的 GTO 合理性及随对手的调整条件',
      ],
      content: [
        { type: 'heading', content: '单挑 SB：翻前最后行动的唯一玩家' },
        {
          type: 'text',
          content:
            '满员桌的 SB 是全桌最惨的位置：翻前倒数第二个行动、翻后永远无位置、被迫投入盲注却几乎无翻后优势。单挑的 SB 则完全不同——你面对唯一的对手 BB，翻前永远最后行动，且已投入的 0.5 兼具 Ante 性质：无论你最终是否参与，这 0.5 都已进入底池成为死钱。两个结构事实叠加，让单挑 SB 成为翻前主动权最大、翻后却最被动的位置：翻前你可以看 BB 的动作做最后决定，翻后你第一个说话。理解这个双重身份，是本章所有策略的起点。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前策略；《Easy Game》Andrew Seidman Ch.4 位置）',
        },
        {
          type: 'key-point',
          content:
            '单挑中 SB 的 0.5 是"强制 Ante"：它不是可以放弃的沉没成本，而是你与 BB 争夺的奖池的一部分。翻前你最后行动——这是满员桌 SB 梦寐以求的待遇，代价是翻后第一个说话（位置反转，第三章详述）。',
        },
        { type: 'heading', content: '开池尺度：min-raise 是主武器' },
        {
          type: 'formula',
          content:
            'SB min-raise 到 2BB 的数学（SB 已投 0.5，额外风险 1.5BB；BB 已投 1，可弃牌或再补 1）：\n\n纯偷盲模型：SB 额外风险 1.5BB，目标奖池 1BB（BB 的盲注）\nEV(raise) = f×1 − (1−f)×1.5（f = BB 弃牌率）\n盈亏平衡：f×1 = (1−f)×1.5 → f = 1.5÷2.5 = 60%\n即 BB 弃牌率超过 60% 时，SB 用任意两张牌 min-raise 都自动盈利；\n等价地，BB 的最小防守频率 MDF = 1 − 60% = 40%。\n\n开池尺度对比（SB 额外风险 → 盈亏平衡弃牌率）：\nmin-raise 2BB：1.5BB → 1.5÷2.5 = 60%\n2.5BB：2BB → 2÷3 ≈ 66.7%\n3BB：2.5BB → 2.5÷3.5 ≈ 71.4%\n\n结论：尺度越小，自动盈利的门槛越低；单挑中 BB 实际防守 60%-70% 以上，min-raise 的纯偷盲部分接近盈亏平衡——盈利的大头在翻后。（概念源自：《Applications of No-Limit Hold’em》Matthew Janda Ch.3 盲注博弈；《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前策略）',
        },
        {
          type: 'text',
          content:
            '为什么单挑开池以 min-raise 为主？三点：(1) 偷盲门槛低——2BB 只需 60% 弃牌率，而单挑 BB 面对 min-raise 的真实弃牌率只有约 30%-40%，纯偷盲几乎不盈利，所以开池的价值不在偷盲而在翻后，尺度越小翻后越容易控池；(2) 大尺度在单挑是"自我惩罚"——BB 的跟注范围随尺度收窄，你花 3BB 只换来一个更强、更有位置的跟注范围，翻后 OOP 打大底池的代价远高于满员桌；(3) 频率与平衡——min-raise 让你能用约 80% 的手牌开池，范围足够宽才能覆盖翻后的各种牌面。满员桌"偷盲要加大尺度"的经验在单挑要反过来用：尺度服务于翻后，而不是服务于偷盲。',
        },
        {
          type: 'text',
          content:
            '单挑 SB 的 limp 是满员桌教条的例外。满员桌 SB 几乎从不 limp，因为 limp 后面对多人加注会失去位置、被动进池，且放弃 Fold Equity；但单挑中三条理由让 limp 成为 GTO 合理选项：(1) 赔率——补 0.5 看 1.5 的底池，所需胜率仅 25%，任何牌对 BB 的宽范围都接近甚至超过这条线；(2) 结构——BB 翻前最后行动，limp 后 BB 只能 check 或 raise（isolate），你无论如何都是翻后 OOP，limp 不再额外"失去位置"；(3) 范围保护——limp 范围混入 AA/KK 等强牌，BB 就不能对 limp 无脑 isolate。求解器显示单挑 SB 会以约 20%-30% 的频率选择 limp（随筹码深度与对手调整），其余以 min-raise 为主。（概念源自：《Modern Poker Theory》Michael Acevedo Ch.3 翻前玩法与 limp 混合；《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前策略）',
        },
        {
          type: 'example',
          content:
            '实例：单挑 100BB 深，你（SB）持 A♠5♠。先给牌分档：强成牌（JJ+、AK）进 raise 叠，靠价值与偷盲双重收益；投机牌（小对子、同花连张、A5s 类）在 limp 叠与 raise 叠之间混合；垃圾牌（K8o、Q6o）直接弃牌。A5s 的归属取决于 BB 的 3bet 频率：BB 3bet 约 15% 时，A5s 被 3bet 的概率约 15%，被 3bet 后 A5s 通常只能弃牌——min-raise 的 EV 被侵蚀约 0.15×1.5 ≈ 0.23BB，此时把 A5s 放进 limp 叠更划算；BB 3bet 低于 8% 时，A5s 的阻断价值（对手更少 AA/AK）和翻后坚果听牌潜力让 min-raise 成为更优选择。同一手牌，对手的 3bet 频率决定它的归属——这是"范围随对手移动"的第一次实战。',
        },
        {
          type: 'example',
          content:
            '实例二：你（SB）持 7♥6♥，100BB 深。对手是跟注站（翻后几乎不弃牌）：min-raise 的偷盲 EV = 0.35×1 − 0.65×1.5 ≈ −0.63BB（纯偷盲口径），而 limp 后 76s 对 BB 随机范围约有 43% 胜率，深筹码下中顺子/同花对手照单全收——limp 进翻牌（甚至直接弃掉边缘牌）明显优于 raise。换一个对手：BB 是 nit（弃牌率约 70%），min-raise 的偷盲 EV = 0.7×1 − 0.3×1.5 = +0.25BB，此时 76s 也值得 raise。同一手 76s，跟注站面前 limp、nit 面前 raise——单挑 SB 的尺度与行动不是固定的，而是对 BB 防守频率的直接响应。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点："limp 是软弱行为、永远错误"是满员桌的教条，直接搬进单挑会持续损失 EV。单挑 SB 的 limp 拥有 GTO 依据：死钱赔率 25%、翻前最后行动、范围保护三合一。真正的错误不是 limp 本身，而是"limp 范围里没有强牌"——那才会被 BB 无脑 isolate。',
        },
        {
          type: 'pro-tip',
          content:
            'SB 开池速记三叠：raise 叠（JJ+、AK、A5s 等阻断牌）、limp 叠（中小对子、同花连张、弱同花 Ax）、弃牌叠（K8o 以下的垃圾）。每 50 手检查一次：你的 limp 叠里是否混入了足够强牌？BB 的 3bet 是否正在把你赶出 raise 叠？两个答案决定下一轮的频率调整。',
        },
      ],
      quiz: [
        {
          id: 't3hu-sb-strategy-q1',
          question: '单挑中 SB 的 0.5 盲注被描述为"兼具 Ante 性质"，最准确的理解是：',
          options: [
            '它是一笔已投入的死钱，无论 SB 是否参与都留在奖池里，使 limp 和偷盲都有了数学基础',
            '它在翻前结束时自动返还给 SB',
            '它只在 BB 也 limp 时才生效',
            '它让 SB 可以免费看翻牌而不需要再投入',
          ],
          correctIndex: 0,
          explanation: 'SB 的 0.5 无论是否参与都已进入底池，具有 Ante 的死钱属性：limp 时补 0.5 即可看 1.5 底池（所需胜率 25%），偷盲时它以奖池形式被争夺。选项 B 与规则相反，C 混淆了 Ante 的作用条件，D 忽略了 SB 仍需补足盲注差额。',
        },
        {
          id: 't3hu-sb-strategy-q2',
          question: 'SB min-raise 到 2BB，假设被跟注或 3bet 时 EV 为零，BB 弃牌率达到多少时 SB 用任意两张牌都自动盈利：',
          options: ['约 40%', '约 50%', '约 60%', '约 75%'],
          correctIndex: 2,
          explanation: 'SB 额外风险 1.5BB、目标奖池 1BB：f×1 = (1−f)×1.5 → f = 1.5/2.5 = 60%。40% 是 BB 的最小防守频率（MDF），50% 与 75% 均与推导不符。',
        },
        {
          id: 't3hu-sb-strategy-q3',
          question: '为什么单挑中 SB 的 limp 是 GTO 合理选项，而满员桌 SB 几乎从不 limp？',
          options: [
            '单挑 SB 翻前最后行动，limp 后 BB 只能 check 或 raise，不会因被加注而额外失去位置',
            '单挑底池更小，limp 的损失可以忽略',
            '单挑中 SB 翻后也是最后行动，limp 没有翻后代价',
            '满员桌规则禁止 SB 平跟',
          ],
          correctIndex: 0,
          explanation: '核心是结构差异：单挑 SB 翻前最后行动且已投 0.5 死钱（赔率 25%），limp 不会被"加注后失去位置"惩罚；满员桌 SB 次先行动，limp 后面对多人加注既失去位置又失去主动权。B 忽略赔率结构，C 与单挑翻后 SB 先行动的事实相反，D 不存在。',
        },
        {
          id: 't3hu-sb-strategy-q4',
          question: '对手（BB）面对你的 limp 有 70% 的频率加注（isolate），你（SB）持 K♠8♠ 深筹码。最优调整是：',
          options: [
            '继续照常 limp，靠翻后发挥',
            '大幅减少 limp，边缘牌改 min-raise 或直接弃牌，limp 叠只留强牌',
            '增加 limp 频率，用更多牌反击',
            '改用 4 倍大尺度开池',
          ],
          correctIndex: 1,
          explanation: 'BB 70% 的 isolate 频率意味着你的 limp 几乎必然被打：以 25% 的赔率看翻牌的计划落空，边缘牌被迫 OOP 面对大底池。正确调整是收窄 limp 叠、改用 min-raise 抢回主动权；继续 limp 是被剥削，增加 limp 是放大漏洞，4 倍尺度只会让 BB 弃掉弱牌留下强牌。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't3hu-bb-defense',
      level: 3,
      order: 2,
      title: 'BB 位置防守',
      subtitle: '应对 SB 的激进攻击',
      duration: '15 min',
      eloDimension: 'preflop',
      objectives: [
        '理解单挑 BB 的双重优势（翻前最后行动 + 翻后位置）如何把满员桌的亏损位变成盈利位',
        '掌握 MDF 的计算，区分防守底线与最优防守频率，理解 60%+ 防守的数学依据',
        '学会跟注防守与 3Bet 防守的划分，掌握面对 SB limp 的 isolate 策略',
      ],
      content: [
        { type: 'heading', content: 'BB：单挑中最赚钱的位置' },
        {
          type: 'text',
          content:
            '满员桌的 BB 是长期亏损位：翻前最后行动是唯一的慰藉，翻后永远无位置让 85%-92% 的权益实现率成为常态。单挑的 BB 完全不同——翻前最后行动之外，翻后还是最后行动：SB 先说话，你后说话。两个"最后行动"叠加，让 BB 成为单挑中位置最好、范围最宽、盈利最高的座位。位置反转的本质是：单挑中每一手牌都有一方获得"翻前信息优势 + 翻后位置优势"的双重加成，BB 就是那一方。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.2 位置与权益；《Easy Game》Andrew Seidman Ch.4 位置）',
        },
        {
          type: 'formula',
          content:
            'BB 面对 SB 开池 3BB 的防守底线（MDF）：\n\n口径一（死钱口径）：SB 总投入 3BB 为风险、双方盲注 1.5BB 为奖池\nSB 自动盈利所需弃牌率 f* = 3 ÷ (1.5+3) = 3 ÷ 4.5 ≈ 66.7%\nBB 的最小防守频率 MDF = 1 − 66.7% ≈ 33.3%\n\n口径二（加注额口径）：SB 加注额 2.5BB、下注前底池 1.5BB\nMDF = 1 − 2.5 ÷ (1.5+2.5) = 1 − 2.5 ÷ 4 = 37.5%\n\n两种口径给出同一结论：BB 的防守底线约 33%-38%——低于这个频率，SB 用任意两张牌开池都自动盈利。（概念源自：《Applications of No-Limit Hold’em》Matthew Janda Ch.3 盲注博弈与 MDF；《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前赔率计算）',
        },
        {
          type: 'text',
          content:
            '但 MDF 只是"阻止自动盈利"的底线，不是最优防守频率。求解器中单挑 BB 面对 SB 开池的实际防守约 60%-70%（跟注约 35%-50% + 3Bet 约 15%-25%），远高于 33%-38% 的底线，原因有三：(1) 翻后位置——BB 是 IP，权益实现率超过 100%，跟注的 EV 高于 MDF 模型假设的零；(2) 死钱——SB 的 0.5 让跟注价格便宜，面对 min-raise 跟 1BB 争夺 SB 投入的 2BB（BB 视角），所需胜率 = 1 ÷ (2+1) ≈ 33.3%；注意：跟注赔率的分母只计入对手投入的死钱，不含自己的盲注——这与 t2hu 的 EV(call) = E×(P+B) − (1−E)×B 公式一致（P 为对手投入部分）；(3) SB 范围宽且弱——单挑 SB 开池约 80% 的手牌，BB 的弱牌对宽范围的胜率天然高。MDF 回答"最少防守多少"，位置与死钱回答"还能多防守多少"——单挑 BB 的 60%+ 是这两者之和。',
        },
        {
          type: 'key-point',
          content:
            '单挑 BB 的"60%+ 防守"是有位置的防守：你翻前最后行动、翻后最后行动，用边缘牌跟注的代价远低于满员桌。把满员桌"BB 只能打紧"的直觉搬进单挑，等于把位置优势白白扔掉。',
        },
        { type: 'heading', content: '跟注 vs 3Bet：防守的两条腿' },
        {
          type: 'text',
          content:
            '面对 SB 开池，BB 的防守范围分两叠。跟注叠：中小对子（22-TT）、同花连张（65s 以上）、弱 A 同花（A2s-A9s）、弱 K 同花（K6s-K9s）——这些牌靠位置与隐含赔率实现权益，跟注不摊牌也能赢。3Bet 叠分两层：价值层（JJ+、AK，对 SB 宽范围领先明显，打价值也压缩 SB 的偷盲频率）与诈唬层（A5s、A4s、K8s 等带阻断牌的组合——阻断 AA/KK/AK，让 SB 更难反加）。面对 3Bet，SB 要么 4Bet 要么弃牌，所以诈唬层必须选择"被 4Bet 可以干净弃牌"的牌。Gap Concept 在单挑 BB 的修正：满员桌跟注加注需要更强牌（Gap），但单挑 BB 已投 1BB 死钱且翻后有位置，可以大幅突破 Gap——这就是 BB 防守 60%+ 与满员桌 BB 防守 25%-50% 的差距来源。（概念源自：《The Theory of Poker》David Sklansky Ch.2-3 Gap Concept；《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前策略）',
        },
        {
          type: 'example',
          content:
            '实例：单挑 100BB 深，SB min-raise 到 2BB，你（BB）持 K♠7♠。K7s 是求解器 BB 跟注范围的典型边缘牌：跟注 1BB 争夺 SB 投入的 2BB（BB 视角），所需胜率 = 1 ÷ (2+1) ≈ 33.3%；K7s 对 SB 约 80% 的开池范围胜率约 48%——富余约 15 个百分点。翻后你 IP：翻牌出 K 可薄价值，出同花/顺子听牌可便宜追，完全 miss 可放弃。弃牌等于放弃约 33% 赔率下的 48% 权益——这是单挑 BB 最典型的错误：把满员桌"K7s 是烂牌"的记忆带进来。满员桌面对 UTG 开局 K7s 确实是弃牌，但单挑面对 SB 的 80% 范围，它是 +EV 的跟注。',
        },
        {
          type: 'example',
          content:
            '实例二（isolate）：SB limp（补 0.5 看翻牌），你（BB）持 A♠8♠，100BB 深，SB 面对加注弃牌约 55%。isolate 加注到 4BB：EV ≈ 0.55×1.5（对手弃牌赢死钱）+ 0.45×(+0.5)（被跟注后 IP 位置优势约 +0.5BB）≈ +1.05BB；而 check 的 EV 只有约 +0.7BB（底池小、让 SB 免费实现弱范围）。isolate 比 check 多赚约 0.8BB。但注意：isolate 不是偷盲——SB 的 limp 已经暴露弱范围，你的加注是在"惩罚弱范围 + 夺取主动权"，被跟注后 A8s 的摊牌价值让你翻后游刃有余。对手 limp-fold 频率越高，isolate 的频率就该越高。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：BB 防守 60%+ 不等于"跟注站"。真正的跟注站没有 3Bet 叠、没有隔离加注——而单挑 BB 的 60% 由跟注、3Bet 价值、3Bet 诈唬三部分构成，每一部分都随 SB 的倾向移动。防守的宽度与防守的被动是两回事。',
        },
        {
          type: 'pro-tip',
          content:
            'BB 防守速查三步：(1) 报底池赔率——SB 开池 2BB 时跟注线约 33%，3BB 时 33%；(2) 分叠——有位置跟注叠、强成牌价值 3Bet、阻断牌诈唬 3Bet；(3) 看 SB——弃牌多的 SB 提高 3Bet 频率，limp 多的 SB 提高 isolate 频率，3Bet 多的 SB 收窄跟注叠。三步走完，60% 的防守就是有结构的选择，而不是"舍不得弃牌"。',
        },
      ],
      quiz: [
        {
          id: 't3hu-bb-defense-q1',
          question: '单挑中 BB 面对 SB 开池的典型防守频率约为：',
          options: ['15%-25%', '30%-40%', '60%-70%', '85%-95%'],
          correctIndex: 2,
          explanation: '求解器显示单挑 BB 防守约 60%-70%（跟注 35%-50% + 3Bet 15%-25%）。15%-25% 是满员桌面对紧位置的量级，85%-95% 是被动跟注站的量级，两者都不是 GTO 防守。',
        },
        {
          id: 't3hu-bb-defense-q2',
          question: 'SB 开池 3BB（总投入 3），按死钱口径，BB 的最低防守频率（MDF）约为：',
          options: ['约 20%', '约 33%', '约 50%', '约 67%'],
          correctIndex: 1,
          explanation: 'MDF = 1 − 3/(1.5+3) = 1 − 66.7% ≈ 33.3%。67% 是 SB 自动盈利所需的 BB 弃牌率（f*），20% 与 50% 均与推导不符。注意 MDF 只是底线，GTO 实际防守 60%-70% 远高于它。',
        },
        {
          id: 't3hu-bb-defense-q3',
          question: '为什么 GTO 中单挑 BB 的防守频率（60%-70%）远高于 MDF 底线（33%-38%）？',
          options: [
            '因为 BB 的牌比 SB 更好',
            '因为 BB 翻后 IP、权益实现率超过 100%，跟注本身是正 EV',
            '因为 MDF 公式在翻前不适用',
            '因为 BB 必须阻止 SB 用任何牌偷盲',
          ],
          correctIndex: 1,
          explanation: 'MDF 只保证"阻止纯诈唬自动盈利"，而 BB 跟注的正 EV 来自翻后位置（权益实现率 >100%）、SB 的 0.5 死钱和 SB 的宽范围——这些让 BB 可以防守超过底线且仍然盈利。A 与发牌随机性矛盾，C 错误（MDF 在任何下注场景都适用），D 混淆了底线与最优。',
        },
        {
          id: 't3hu-bb-defense-q4',
          question: 'SB limp 后，你（BB）持 A♠8♠，SB 面对加注弃牌约 55%。最优行动是：',
          options: ['check，让翻牌免费开', 'isolate 加注到 4BB 左右', '加注到 10BB，最大限度施压', '直接弃牌'],
          correctIndex: 1,
          explanation: 'isolate 的 EV ≈ 0.55×1.5 + 0.45×0.5 ≈ +1.05BB，明显高于 check 的约 +0.7BB。加注到 10BB 是过度施压——SB 只会留下强牌跟注，你的 A8s 翻后胜率骤降；check 让 SB 免费实现弱范围；弃牌浪费了 IP 的摊牌价值。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't3hu-position-reversal',
      level: 3,
      order: 3,
      title: '位置反转',
      subtitle: '翻后 SB 先行动的影响',
      duration: '12 min',
      eloDimension: 'postflop',
      objectives: [
        '理解单挑"位置反转"结构：翻前 SB 最后行动、翻后 SB 先行动，BB 获得翻后位置',
        '掌握位置优势的街间衰减规律（river 位置价值最大）及其量化模型',
        '学会 OOP 的三大补偿工具（check 为主、check-raise、罕见 donk）与 IP 的应对',
      ],
      content: [
        { type: 'heading', content: '位置反转：单挑独有的身份互换' },
        {
          type: 'text',
          content:
            '满员桌的位置是"定额"：BTN 每手都最后行动，SB/BB 每手都无位置，位置属性终生不变。单挑的位置是"反转"的：SB 翻前最后行动（有翻前位置），翻后第一个行动（无翻后位置）；BB 恰好相反——翻前次先，翻后最后。每一手牌，翻前占便宜的人翻后还债，翻前被动的人翻后收租。这个反转是单挑最容易被忽视的结构事实：满员桌玩家初上单挑桌，往往还在用"我是 aggressor 我有主动权"的满员桌心态打翻后，结果被 BB 的位置优势反复收割。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.2 位置理论；《Easy Game》Andrew Seidman Ch.4 位置）',
        },
        {
          type: 'key-point',
          content:
            '位置反转的残酷面：SB 翻前的最后行动买不到翻后的位置。翻前你是 aggressor，翻后你是 OOP——"主动权"只在翻牌圈之前属于你，翻牌一发，BB 的每个决策都比你晚一步。',
        },
        {
          type: 'formula',
          content:
            '位置优势的街间量化模型（limp 底池 2BB 起，每街半池下注+跟注）：\n\n底池序列：翻牌 2BB → 转牌 4BB → 河牌 8BB\n每街下注额：翻牌 1BB → 转牌 2BB → 河牌 4BB\n\n设位置带来"每街 5% 的决策优势"（信息优势 + 控池权折合）：\n翻牌贡献：1BB × 5% = 0.05BB\n转牌贡献：2BB × 5% = 0.10BB\n河牌贡献：4BB × 5% = 0.20BB\n位置总价值 ≈ 0.35BB/手，其中河牌占 0.20 ÷ 0.35 ≈ 57%\n\n结论：位置价值的一半以上在河牌兑现——"river 位置最大"不是口号，而是底池几何级数放大的数学必然。注意：T2 提到的位置价值 0.5-1BB/手 包含翻前位置优势的总量估计；本节的 0.35BB 仅量化翻后位置在保守假设下的街间分配，是前者的组成部分。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.2 位置与权益；《Harrington on Hold’em》Dan Harrington Vol.1 Ch.5 位置与权益）',
        },
        {
          type: 'text',
          content:
            '为什么河牌位置价值最大？三条机制：(1) 底池最大——同样的 5% 决策优势，作用在 8BB 底池上的筹码当量是翻牌圈的 4 倍；(2) 范围最窄、信息最全——经过翻牌转牌两轮过滤，双方范围大幅收窄，最后行动者可以在最精确的读牌上做最终裁决；(3) 决策不可逆——河牌是最后一街，IP 可以"下注后被加注弃牌"，OOP 却要承受"过牌被偷、下注被加注"的两难。满员桌的 BTN 同样享受这三点，但单挑的 BB 每手都是 BTN——这就是单挑 BB 盈利率高的量化解释。',
        },
        {
          type: 'example',
          content:
            '实例：单挑 100BB 深，SB 持 A♠Q♠ min-raise 到 2BB，BB 跟注，底池 4BB。翻牌 K♥8♦3♣。位置反转的第一个镜头：你是翻前 aggressor，翻牌却 OOP 先行动。BB 下注 2BB（半池，底池来到 6BB），你跟注后底池 8BB、你投入 2BB，所需胜率 25%。你的 AQ 权益：BB 跟注范围中 Kx 密度约 30%，无 K 时 AQ 靠 6 个高张 Outs 加后门花约有 27% 权益，有 K 时只剩约 6%——加权约 0.7×27% + 0.3×6% ≈ 21%，低于 25% 的跟注线，标准答案是 check-fold。同一手 A♠Q♠ 若换到 BB 视角（IP）：你可以下注半池拿下底池，也可以过牌免费看转牌，AQ 从"跟注线边缘的弃牌"变成"主动权的载体"。反转让同一手牌在两个位置差出近一个底池的价值。',
        },
        { type: 'heading', content: '补偿工具：OOP 的三大杠杆' },
        {
          type: 'text',
          content:
            'OOP 面对反转，靠三个工具补偿：(1) check 为主——OOP 的默认动作是把决策权交给 IP，用"过牌范围"隐藏牌的强度，BB 若过牌你就免费看牌；(2) check-raise（x/r）——OOP 范围中约 10%-15% 的决策选择 x/r，范围由坚果/超强牌 + 合适的诈唬（强听牌、阻断牌）构成，作用是压制 IP 的下注频率、保护 check-call 范围不被剥削；(3) donk bet——OOP 主动下注，求解器中罕见（约 2%-5% 的牌面结构），因为 donk 范围天然偏强、被加注时无法平衡，且放弃 x/r 杠杆；例外出现在 OOP 范围占优的特定牌面（如 SB limp 后击中 6♠5♦4♣ 的两对/顺子密度），此时 donk 保护权益反而是最优。记住：donk 是例外不是常态，满员桌新手最爱用 donk"保护牌"，在单挑中这是范围失衡的免费告示。（概念源自：《Modern Poker Theory》Michael Acevedo Ch.4 翻后玩法与 OOP 结构；《Harrington on Hold’em》Dan Harrington Vol.1 Ch.5 位置与权益）',
        },
        {
          type: 'example',
          content:
            '实例二（river 位置价值）：单挑盲注 0.5/1，翻前 SB min-raise 2BB、BB 跟注，底池 4BB。翻牌 Q♠8♦3♣，BB 下注 2BB、SB 跟注，底池 8BB。转牌 2♥，BB 下注 4BB、SB 跟注，底池 16BB。河牌 9♠，双方都持 K♠Q♠（顶对 Q + K 踢脚）。场景 A——你在 BB（IP）：SB 过牌，你下注 1/3 池约 5BB 薄价值，被加注可以安全弃牌（SB 范围里的 88/33/99 都是合理加注），净赚约 5BB；场景 B——你在 SB（OOP）：你过牌，BB 下注 8BB，你的顶对沦为"跟注抓诈或弃牌"的二选一；你主动下注 8BB，被加注时顶对 Q 在 100BB 深局中很难弃。同一手牌、同一条下注线，IP 兑现 5BB 薄价值，OOP 只能被动响应——河牌 57% 的位置价值占比，在这里变成真金白银。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：翻前 aggressor 翻后常常要让出主动权。SB 的持续下注（cbet）频率远低于满员桌 BTN——因为 OOP 的 cbet 面对 IP 的 float 与加注成本极高，且 SB 的范围在翻后被 BB 的宽防守范围"稀释"。主动权的正确用法是"叙事权"，不是"必须下注权"：OOP 的 check 不是示弱，而是把球踢给 IP 再决定接不接。',
        },
        {
          type: 'pro-tip',
          content:
            'OOP 决策流程四问：底池多大（SPR 决定要不要控池）？我过牌后 IP 下注的频率大概多少（决定 check-call 还是 x/r）？我的范围里有坚果吗（决定 x/r 频率）？这个牌面我的范围占优吗（决定是否 donk）？四问走完，反转的位置就从被动挨打变成有结构的博弈。',
        },
      ],
      quiz: [
        {
          id: 't3hu-position-reversal-q1',
          question: '单挑中"位置反转"最准确的含义是：',
          options: [
            'SB 翻前最后行动但翻后先行动，BB 翻前次先但翻后最后行动',
            'SB 和 BB 每手交换按钮',
            '翻牌后由 BB 先下注',
            '位置优势在河牌自动消失',
          ],
          correctIndex: 0,
          explanation: '单挑中翻前 SB 最后行动（有翻前位置）、翻后 SB 先行动（无翻后位置），BB 恰好相反——这是单挑独有的位置反转。B 是按钮规则误解，C 与规则相反（翻后 SB 先行动），D 与"river 位置价值最大"矛盾。',
        },
        {
          id: 't3hu-position-reversal-q2',
          question: '位置价值街间模型（翻牌/转牌/河牌贡献 0.05/0.10/0.20BB），河牌约占总位置价值的：',
          options: ['约 33%', '约 43%', '约 57%', '约 67%'],
          correctIndex: 2,
          explanation: '总价值 = 0.05 + 0.10 + 0.20 = 0.35BB，河牌占比 = 0.20/0.35 ≈ 57%。33% 是三街平均占比（1/3），67% 是把河牌单独与翻牌对比得出的错误值。',
        },
        {
          id: 't3hu-position-reversal-q3',
          question: '为什么翻后 OOP 通常避免 donk bet？',
          options: [
            '因为 donk bet 在规则上被禁止',
            '因为 donk 范围天然偏强、被加注时无法平衡，且放弃 check-raise 杠杆',
            '因为 OOP 永远应该过牌跟注',
            '因为 donk bet 只在小底池有效',
          ],
          correctIndex: 1,
          explanation: 'donk 范围以强牌为主，IP 加注时无法平衡；同时 donk 放弃了 x/r 杠杆，等于免费暴露范围强度。它只在 OOP 范围占优的特定牌面（如 limp 底池中两对/顺子密度高）才作为例外出现。A 与规则不符，C 过度绝对（OOP 有 x/r 等杠杆），D 无依据。',
        },
        {
          id: 't3hu-position-reversal-q4',
          question: '你（SB）翻前 min-raise 后持 K♠Q♠，翻牌 K♦9♣3♠，BB（IP）是 float 频率很高的激进玩家。最优倾向是：',
          options: [
            '2/3 池大注，立刻拿下底池',
            '混合 check 与小注（约 1/3 池）cbet，保留 check-raise 杠杆并控池',
            '100% check，永远让出主动权',
            '直接全下保护顶对',
          ],
          correctIndex: 1,
          explanation: 'OOP 面对 float 高手，大注成本极高（被加注只能弃牌）、all-in 过度、100% check 让范围透明可被剥削。混合 check 与小注 cbet：小注让边缘牌付费看牌，check 保留 x/r 杠杆，两者频率平衡让 IP 无法确定你的顶对强度——这正是 OOP 补偿工具的组合应用。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T4: 范围理论（单挑版）==========
export const t4hu: TheoryLevelInfo = {
  id: 't4hu',
  level: 4,
  tier: 'intermediate',
  title: '单挑范围构建',
  description: '建立双位置的宽广与紧密范围',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T3HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l4hu-bn-opening', title: '按钮位开局加注' },
      { id: 'l4hu-gto-basics', title: '单挑 GTO 基础' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't4hu-range-width',
      level: 4,
      order: 1,
      title: '范围宽度',
      subtitle: '单挑中更宽的开池范围',
      duration: '15 min',
      eloDimension: 'handReading',
      objectives: [
        '理解单挑范围宽度远超满员桌的根本原因——打败一个对手与位置反转的双重作用',
        '掌握 SB 开池约 80%、BB 防守 60%+ 的频率基准及其数学依据（死钱赔率与翻后位置）',
        '学会按对手倾向动态收放范围宽度，避免"固定范围"在单挑中被剥削',
      ],
      content: [
        { type: 'heading', content: '单挑的范围为什么这么宽' },
        {
          type: 'text',
          content:
            '范围宽度指一个位置愿意参与底池的起手牌比例。满员桌 UTG 约 15%、BTN 约 40%，而单挑 SB 的开池频率高达约 80%、BB 的防守频率约 60%+。这背后是两个结构事实的叠加：其一，你要打败的只有一个对手，任何两张牌对随机范围都保有约 35% 的权益（T1 已建立这一锚点）；其二，位置反转让 BB 翻后最后行动，SB 的 0.5 死钱让跟注价格极其便宜。范围宽度不是风格选择，而是单挑规则结构的数学必然。',
        },
        {
          type: 'key-point',
          content:
            '单挑中"宽"不是错误，而是默认。满员桌教条"起手要等好牌"在单挑中会慢性失血——因为你的每一次弃牌，都把 0.5-1BB 的死钱让给了对手。范围宽度就是单挑的第一纪律。',
        },
        { type: 'heading', content: 'SB 开池宽度：约 80% 的频率从何而来' },
        {
          type: 'formula',
          content:
            'SB 开池范围包含所有"面对 BB 随机范围至少有 40% 权益"的牌，再加一部分靠翻后位置优势实现的边缘牌：\n\n可开池牌（约 80%）：\n强牌（JJ+/AK/AQ）+ 同花连张 + 同花 Ax + 任意对子 + 大部分同花牌与部分非同花高张\n\n弃牌（约 20%）：\n完全垃圾（72o、83o 等）与阻断价值差的非同花弱牌\n\nSB 补 0.5 即可看 1.5BB 底池（所需胜率 25%），任何牌对 BB 宽防守范围都接近或超过这条线；即使被 BB 3Bet，SB 的弃牌也只损失 1.5BB 的加注额——低频高风险的 3Bet 遭遇，可以由范围宽度带来的高频盈利覆盖。（概念源自：《Modern Poker Theory》Michael Acevedo Ch.3 单挑范围收窄与放宽）',
        },
        {
          type: 'text',
          content:
            'BB 防守约 60%+ 的数学同样清晰：面对 SB min-raise 到 2BB，BB 跟注 1BB 争夺 SB 投入的 2BB，所需胜率 = 1÷(2+1) ≈ 33.3%；而 BB 翻后是位置优势方（IP），权益实现率超过 100%——同样 33% 的底池赔率，单挑 BB 的跟注比满员桌更有利。这就是为什么单挑 BB 可以防守超过 MDF 底线（约 33%-38%）而仍然盈利。',
        },
        {
          type: 'example',
          content:
            '实例：单挑 100BB 深，你（SB）持 K♦6♦。按满员桌标准这是明显弃牌，但在单挑中：面对 BB 约 60% 的防守范围，K6s 约有 46%-48% 的翻前权益，加上翻后位置反转带来的控池能力，K6s 是求解器 SB 开池范围的标准成员。若你因为"K6s 不够好"而弃牌，你就在让对手用垃圾牌白拿盲注。',
        },
        {
          type: 'example',
          content:
            '实例二（范围随对手移动）：同一手 J♠8♠，面对 BB 3bet 率高达 25% 的激进玩家，你被 3Bet 后 J8s 通常只能弃牌，min-raise 的偷盲 EV 被侵蚀，应考虑收窄开池；面对 3Bet 率仅 8% 的被动 BB，J8s 的翻后同花与顺子潜力能充分实现，值得开池。范围宽度从来不是一个固定数字，而是对对手攻击频率的直接响应。',
        },
        {
          type: 'example',
          content:
            '实例三（翻后实现的关键）：你（BB）持 6♠5♠ 面对 SB min-raise 跟注。翻牌 K♠8♦4♣，SB 下注 1/3 池，你的 65s 只有卡顺听牌（2 张 7）+ 后门花，权益约 20%，低于 25% 的跟注线，标准弃牌。但若翻牌 7♠6♦4♣ 你中了对子带顺子听牌，权益跃升至约 55%，可以跟注甚至过牌加注。范围宽的意义不是"什么牌都跟"，而是"给了你足够多的牌在正确牌面赢钱"。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：范围宽不等于玩得松。单挑高手用 80% 的牌参与，但其中约一半在翻后很快放弃——他们"参与得多、投入得少"，靠翻后位置与牌面适配榨取价值。真正的错误是"范围宽但每条街都舍不得弃"，那才是跟注站。',
        },
        {
          type: 'pro-tip',
          content:
            '单挑范围速查：SB 约开池 80%（顶端 15% 强牌 + 中段同花连张/Ax + 底部垃圾混合），BB 约防守 60%（跟注叠约 35%-45% + 3Bet 叠约 15%-25%）。每 50 手检查一次：你的弃牌率是否被对手的偷盲利润盯上？你的 3Bet 频率是否太低让 SB 无限开池？两个答案决定下一轮的宽度。',
        },
      ],
      quiz: [
        {
          id: 't4hu-range-width-q1',
          question: '单挑中 SB 的典型开池频率约为：',
          options: ['约 20%', '约 40%', '约 60%', '约 80%'],
          correctIndex: 3,
          explanation: '单挑 SB 开池约 80%，因为只面对一个对手、任何两张牌对随机范围保有约 35% 权益，且补 0.5 即可看 1.5BB 底池。20% 是满员桌紧位置的量级，40% 是 BTN 面对多人的量级。',
        },
        {
          id: 't4hu-range-width-q2',
          question: '为什么单挑 BB 可以防守 60%+ 而满员桌 BB 只防守约 25%-40%？',
          options: [
            '单挑中 BB 翻后是位置优势方，权益实现率超过 100%',
            '单挑中 BB 每手都拿到好牌',
            '单挑中 BB 不需要防守',
            '满员桌规则禁止 BB 宽防守',
          ],
          correctIndex: 0,
          explanation: '位置反转让单挑 BB 翻后最后行动（IP），权益实现率超 100%，且 SB 的 0.5 死钱让跟注价格便宜（33.3%）。满员桌 BB 翻后永远 OOP，防守必须收紧。',
        },
        {
          id: 't4hu-range-width-q3',
          question: '单挑中 SB 开池范围约 80%，最准确的理解是：',
          options: [
            '用 80% 的牌参与，但很多牌翻后很快放弃，靠位置与牌面适配',
            '用 80% 的牌打到摊牌',
            '80% 的牌都会开池后加注',
            '只玩顶端的 80% 强牌',
          ],
          correctIndex: 0,
          explanation: '范围宽是"参与多、投入少"：约 80% 参与，但一半在翻后放弃。真正的错误是把宽范围打成"每条街都不弃"的跟注站。',
        },
        {
          id: 't4hu-range-width-q4',
          question: '面对 3Bet 率高达 25% 的激进 BB，你（SB）应如何调整范围宽度？',
          options: [
            '保持 80% 不变',
            '收窄开池范围，减少被 3Bet 后只能弃牌的边缘牌',
            '增加开池到 100%',
            '完全停止开池',
          ],
          correctIndex: 1,
          explanation: '高频 3Bet 侵蚀偷盲 EV，边缘牌被 3Bet 后只能弃牌。正确调整是收窄范围；完全停止开池过度反应，保持 100% 是自杀。',
        },
        {
          id: 't4hu-range-width-q5',
          question: '范围宽度与"玩得松"的区别在于：',
          options: [
            '没有区别',
            '宽度靠翻后位置与牌面适配实现价值，而非无脑投入',
            '玩得松的人范围更宽',
            '宽度只适用于翻前',
          ],
          correctIndex: 1,
          explanation: '宽范围高手在正确牌面下注收钱、错误牌面迅速弃牌；跟注站则是范围宽且每条街都过度投入。关键在"是否随牌面与位置收放"。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't4hu-polarization',
      level: 4,
      order: 2,
      title: '两极化范围',
      subtitle: '价值手牌与纯诈唬的组合',
      duration: '12 min',
      eloDimension: 'handReading',
      objectives: [
        '理解极化（polarized）与线性（linear）范围的区别及其适用场景',
        '掌握单挑下注范围的价值:诈唬两极化结构与均衡比例推导',
        '学会用"两条街坚果 + 一个听牌转诈唬"构建不可预测的下注范围',
      ],
      content: [
        { type: 'heading', content: '极化 vs 线性：两种下注范围哲学' },
        {
          type: 'text',
          content:
            '极化范围（Polarized）只包含强牌与弱牌，把中间牌让给过牌；线性范围（Linear）则按牌力从强到弱连贯地进入下注。单挑中，翻后下注范围普遍极化：因为对手范围宽、跟注频率高，你需要用坚果榨取价值、用垃圾牌施加压力，而中间牌（中等对子、弱顶对）更容易被反加，适合控池过牌。',
        },
        {
          type: 'key-point',
          content:
            '单挑下注是"两个世界"的游戏：下注范围由坚果价值 + 诈唬（含半诈唬）构成，中间牌交给过牌。这让对手陷入两难——跟注赢诈唬、弃牌输价值，两端都无法轻松应对。',
        },
        { type: 'heading', content: '价值:诈唬比的数学' },
        {
          type: 'formula',
          content:
            '河牌满池下注的均衡价值:诈唬比（底池 P、下注 P、对手持跟注站）：\n\n对手跟注 EV = f×2P − (1−f)×P（f = 诈唬占比）\n盈亏平衡：令 = 0 → 2fP = (1−f)P → 3f = 1 → f = 1/3\n\n即价值:诈唬 = 2:1：满池下注范围内约 2/3 价值、1/3 诈唬。\n\n半池（0.5P）：对手跟注 EV = f×1.5P − (1−f)×0.5P = 0 → f = 0.25，价值:诈唬 = 3:1。（概念源自：《Modern Poker Theory》Michael Acevedo Ch.2-3 极化下注与频率）',
        },
        {
          type: 'text',
          content:
            '转牌与翻牌的极化略有不同：因为还有后续街，诈唬占比可以更高——部分诈唬（听牌）后续可能成牌转化为价值，或继续诈唬。单挑中对手范围宽、跟注频率高，翻牌可以激进地两极化下注整个范围，但到了转牌河牌，底池变大、对手范围收窄，极化下注的尺度与频率都应随之调整。',
        },
        {
          type: 'example',
          content:
            '实例：单挑 100BB 深，SB min-raise、BB 跟注，翻牌 K♠9♦4♣。SB 持 A♦A♣（超对，价值）与 A♦5♦（空气+后门花，诈唬）。SB 下注半池 1BB（底池 2BB），价值:诈唬约 2:1——AA 打价值、A5s 代表同花听牌施压。若 SB 的 A5s 选择过牌，它的下注范围就只剩 AA，对手会迅速识别并弃掉一切边缘牌——极化结构被破坏。',
        },
        {
          type: 'example',
          content:
            '实例二（中间牌的正确处理）：同一牌面，SB 持 K♦Q♦（顶对弱踢脚）。KQ 在单挑中不该进下注范围：它打不过 AK/AA，却输给任何 K 更大的踢脚；下注被加注时进退两难。正确做法是过牌控池、抓诈唬。极化范围的价值正是"让 KQ 这类中间牌免于尴尬决策"。',
        },
        {
          type: 'example',
          content:
            '实例三（转牌转诈唬）：翻牌 8♠6♣2♦，SB 持 7♦5♦（两头顺听牌）下注，BB 跟注。转牌 A♠，7♦5♦ 未中顺子。此时 75s 从"听牌"转化为"纯诈唬"：A 是绝佳的诈唬牌（阻断对手的 AA、且对手顶对范围被压缩），SB 二次开火代表 A，BB 若弃牌 SB 直接赢下底池。听牌转诈唬是单挑极化范围的动态核心。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：中间牌（中等对子、弱顶对）不是"没价值"，而是"过牌价值"最高。把它们硬塞进下注范围，反而给了对手加注榨取你的机会。极化不是"强弱都要打"，而是"强弱打价值+压力、中间过牌"。',
        },
        {
          type: 'pro-tip',
          content:
            '构建下注范围三步：(1) 列坚果价值牌（超对、两对、顺子等）；(2) 列诈唬牌（强听牌优先，转牌未中再转纯诈唬）；(3) 把中间牌全部划入过牌。这样你的下注范围天然极化，无需刻意平衡。',
        },
      ],
      quiz: [
        {
          id: 't4hu-polarization-q1',
          question: '极化范围（Polarized）的含义是：',
          options: [
            '范围由强到弱线性排列',
            '范围只含强牌与弱牌（诈唬），中间牌交给过牌',
            '范围只含强牌',
            '范围只含诈唬',
          ],
          correctIndex: 1,
          explanation: '极化 = 强牌价值 + 弱牌诈唬，中间牌过牌。线性范围才按牌力连贯排列。',
        },
        {
          id: 't4hu-polarization-q2',
          question: '河牌满池下注的均衡价值:诈唬比约为：',
          options: ['1:1', '2:1', '3:1', '4:1'],
          correctIndex: 1,
          explanation: 'f = 1/3，价值 2/3、诈唬 1/3，价值:诈唬 = 2:1。恰等于对手跟注所需胜率 33%。',
        },
        {
          id: 't4hu-polarization-q3',
          question: '为什么单挑中顶对弱踢脚（如 KQ）通常不进下注范围？',
          options: [
            '因为它不够强，只能过牌控池抓诈唬',
            '因为它应该直接弃牌',
            '因为它是强牌必须下注',
            '因为它会影响价值:诈唬比',
          ],
          correctIndex: 0,
          explanation: 'KQ 是中间牌：打不过 AK/AA，输给更大踢脚的 K。下注被加注进退两难，过牌控池让 KQ 免于尴尬决策。',
        },
        {
          id: 't4hu-polarization-q4',
          question: '"听牌转诈唬"指的是：',
          options: [
            '听牌击中后继续价值下注',
            '听牌未中后，用阻断牌与牌面结构将其转化为纯诈唬',
            '放弃听牌改过牌',
            '听牌永远跟注',
          ],
          correctIndex: 1,
          explanation: '转牌未中时，听牌从"有摊牌改进潜力"转为"纯诈唬"，配合阻断牌（如 A 高）二次开火代表强牌，是极化范围的动态核心。',
        },
        {
          id: 't4hu-polarization-q5',
          question: '转牌/翻牌 vs 河牌的极化诈唬占比，正确的说法是：',
          options: [
            '河牌诈唬占比最高',
            '转牌翻牌因有后续街，诈唬占比可以更高',
            '各街完全相同',
            '翻牌诈唬占比最低',
          ],
          correctIndex: 1,
          explanation: '前街有后续街可转化/放弃，诈唬占比可以更高；河牌最后一街，诈唬必须精确匹配底池赔率（满池 1/3）。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't4hu-blocking',
      level: 4,
      order: 3,
      title: '挡牌应用',
      subtitle: '利用已知信息缩小范围',
      duration: '10 min',
      eloDimension: 'handReading',
      objectives: [
        '理解挡牌（Blocker）的定义：手中的牌减少对手特定组合数',
        '掌握单挑宽范围中挡牌的三重价值：诈唬阻断、价值解封、翻前 3Bet 选择',
        '学会用挡牌微调下注与跟注决策，在单挑边缘局面争取边际 EV',
      ],
      content: [
        { type: 'heading', content: '挡牌：你的底牌是范围信息' },
        {
          type: 'text',
          content:
            '挡牌（Blocker）指你持有的牌减少了对手持有特定组合的数量。你持 A♠ 时，对手持 A♠X♠ 坚果同花组合数为零；你持 K 时，对手持 KK 从 6 种减到 3 种。在满员桌，挡牌是高级技巧；在单挑，因为双方范围都宽、决策密集，挡牌成为每一手牌的常备工具——你的两张牌既是对手范围的过滤器，也是你进攻与防守频率的调节器。',
        },
        {
          type: 'key-point',
          content:
            '挡牌不改变牌力，改变概率分布。同一手"空气牌"，持 A♠ 的诈唬比持 2♠ 的诈唬成功率高得多——因为你阻断了对手最强的跟注牌（坚果同花）。',
        },
        { type: 'heading', content: '挡牌的三重价值' },
        {
          type: 'text',
          content:
            '第一重：诈唬阻断（Blocking Bluffs）——你持的牌若是对手范围里的强牌，你的诈唬可信度上升，因为对手"声称"的坚果被你证伪。第二重：价值解封（Unblocking）——你持的牌若没有阻断对手的跟注站，你的价值下注更容易被支付（比如不持 A♠ 时对手更可能有同花跟你）。第三重：翻前组合数学——3Bet 范围选择带阻断牌的诈唬（如 A5s 阻断 AA/AK），被 4Bet 时又能干净弃牌。',
        },
        {
          type: 'example',
          content:
            '实例：三张黑桃牌面 K♠9♠4♠，你持 A♦A♣（无黑桃 A，成不了坚果同花）。对手全下。你的挡牌情况：你不阻断任何同花，对手可能有 A♠X♠ 坚果同花、或更小同花。AA 无 A♠ 时是"不阻断价值"的典型——对手跟注范围偏强，你的抓诈唬价值下降，倾向弃牌。',
        },
        {
          type: 'example',
          content:
            '实例二（诈唬阻断）：同一 K♠9♠4♠ 牌面，你持 A♠5♦（单张 A♠，无同花）。你阻断了坚果同花 A♠X♠ 的全部组合——对手"最强牌"被证伪一半。此时你加注诈唬（代表同花）的成功率显著上升，因为对手的跟注站范围里少了很多强牌。挡牌让同一手"空气"变成不同强度的诈唬。',
        },
        {
          type: 'example',
          content:
            '实例三（翻前 3Bet 选择）：单挑你（BB）面对 SB 开池，考虑 3Bet 诈唬。持 A♦5♦ 与持 7♦6♦ 的区别：A5s 阻断 AA 与 AK 各一部分（对手范围里的顶级强牌变少，被 4Bet 概率下降），且被 4Bet 后 A5s 可干净弃牌；76s 不阻断任何强牌，被 4Bet 时更常撞上 QQ+。因此 A5s 是更优的 3Bet 诈唬牌。挡牌让"诈唬组合"从笼统的数量变成精确的选择。',
        },
        {
          type: 'formula',
          content:
            '挡牌的定量效果（你持 A♦A♣，三黑桃面）：\n\n对手持坚果同花 A♠X♠ 的组合：\n无挡牌时：A♠ 配任意黑桃共 12 种（剩余 12 张黑桃）\n你持 A♦（不阻断黑桃）：仍约 12 种\n你持 A♠（阻断）：A♠ 已在你手里，坚果同花组合数 = 0\n\n对比：持 A♠ 使对手"最强跟注牌"从 12 种骤减到 0——这就是诈唬成功率的数学来源。（概念源自：《The Mathematics of Poker》Bill Chen / Jeremie Ankenman Ch.10 阻断牌与组合计数）',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：挡牌是边际效应，不是万能钥匙。持 A♠ 诈唬成功率上升，但不保证成功；用它推翻基础范围分析是滥用。单挑中挡牌的价值在于"边缘局面的边际 EV"——基础范围对了，挡牌锦上添花；基础范围错了，挡牌救不了你。',
        },
        {
          type: 'pro-tip',
          content:
            '离桌练习：随机摆三张同花牌面，数"对手坚果同花组合"在你持 A♠ 与不持 A♠ 时的差异。熟练后实战中只需 10 秒判断：我的牌阻断的是对手的价值还是诈唬？阻断价值 → 增加诈唬；不阻断 → 谨慎跟注。',
        },
      ],
      quiz: [
        {
          id: 't4hu-blocking-q1',
          question: '挡牌（Blocker）的作用机制是：',
          options: [
            '提升自己牌力',
            '你持有的牌减少了对手特定组合的数量',
            '阻止对手加注',
            '让对手看不出你的范围',
          ],
          correctIndex: 1,
          explanation: '你手中的每张牌都从对手组合中移除了含这张牌的所有组合——底牌因此成为关于对手范围的信息。',
        },
        {
          id: 't4hu-blocking-q2',
          question: '三张黑桃牌面，你持单张 A♠（不成同花）。对诈唬的意义是：',
          options: [
            '没有意义，你没成同花',
            '你阻断了对手坚果同花组合，诈唬成功率上升',
            '说明你应该弃牌',
            '对手一定没有同花',
          ],
          correctIndex: 1,
          explanation: '持 A♠ 使对手 A♠X♠ 坚果同花组合数为零，他最强的跟注牌被削减，你的诈唬 Fold Equity 上升。',
        },
        {
          id: 't4hu-blocking-q3',
          question: '三黑桃面你持 A♦A♣（不阻断黑桃），面对对手全下的正确倾向是：',
          options: [
            '无脑跟注抓诈唬',
            '谨慎——你不阻断任何同花，对手跟注范围偏强',
            '加注诈唬',
            '直接全下',
          ],
          correctIndex: 1,
          explanation: '不持 A♠ 时你不阻断同花，对手可能拿 A♠X♠ 坚果同花或更小同花，抓诈唬价值下降。',
        },
        {
          id: 't4hu-blocking-q4',
          question: '翻前 3Bet 诈唬，为什么 A5s 优于 76s？',
          options: [
            'A5s 阻断 AA 与 AK，被 4Bet 概率下降且可干净弃牌',
            '76s 阻断更多强牌',
            'A5s 牌力更强',
            '两者没有区别',
          ],
          correctIndex: 0,
          explanation: 'A5s 的 A 阻断对手范围顶端的 AA/AK，降低被 4Bet 频率；且被 4Bet 后 A5s 可干净弃牌。76s 不阻断强牌，撞上 QQ+ 的概率更高。',
        },
        {
          id: 't4hu-blocking-q5',
          question: '关于挡牌的适用边界，正确的说法是：',
          options: [
            '挡牌可以推翻任何基础范围分析',
            '挡牌是边缘局面的边际工具，需建立在正确基础范围之上',
            '挡牌只在河牌有效',
            '挡牌只用于跟注决策',
          ],
          correctIndex: 1,
          explanation: '挡牌调整组合比例而非改写范围。基础范围正确时它锦上添花，基础范围错误时它无法救你——这是它与"万能钥匙"的分界线。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T5: 博弈论基础（单挑版）==========
export const t5hu: TheoryLevelInfo = {
  id: 't5hu',
  level: 5,
  tier: 'intermediate',
  title: '单挑 GTO 基础',
  description: '应用博弈论于单挑场景',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T4HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l4hu-gto-basics', title: '单挑 GTO 基础' },
      { id: 'l4hu-counter-strategies', title: '反制策略' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't5hu-gto-he',
      level: 5,
      order: 1,
      title: 'GTO 核心思想',
      subtitle: '不可被剥削的单挑策略',
      duration: '18 min',
      eloDimension: 'postflop',
      objectives: [
        '理解单挑是纯二人零和博弈，纳什均衡的"不可剥削"保证在此严格成立',
        '掌握 GTO 不是"最赚钱"而是"不被剥削"的策略定位，及其与剥削的关系',
        '学会在单挑中以 GTO 为基线，识别对手偏离并做最小必要偏离',
      ],
      content: [
        { type: 'heading', content: '单挑：博弈论的最纯净实验室' },
        {
          type: 'text',
          content:
            '单挑扑克（忽略抽水）是教科书级的二人零和博弈：一方的盈利恰为另一方所失。约翰·纳什证明，这类博弈存在均衡策略组合——双方各自采用均衡策略时，任何一方单方面偏离都无法让自己更好。这意味着：单挑存在一套"不可被剥削"的策略（GTO），对手无论怎么打，你的长期期望都不低于博弈值。这是单挑独有的理论优势，多人底池的均衡保证会因联合效应而弱化。',
        },
        {
          type: 'key-point',
          content:
            'GTO 的定位是"防弹背心"不是"武器"：它保证你不被剥削，但不承诺赚得最多。面对漏洞百出的对手，针对性剥削策略赚得更多——代价是打开自己的漏洞。单挑高手在"穿背心"与"换刀"之间切换。',
        },
        { type: 'heading', content: '均衡的数学直觉' },
        {
          type: 'formula',
          content:
            '极小极大定理（冯·诺依曼 1928）：\n存在博弈值 v，使 max_a min_b U₁(a,b) = min_b max_a U₁(a,b) = v\n\n含义：均衡策略保证你的期望 ≥ v，对手无法单方面压低。\n\n石头剪刀布的均衡：各 1/3 随机。对手总出石头时，均衡策略仍不输不赢（期望 0），但"总出布"的剥削策略每局都赢；然而一旦你总出布，自己也变得可被剥削（对手改出剪刀）。扑克完全同构。（概念源自：《The Mathematics of Poker》Bill Chen / Jeremie Ankenman Ch.2 博弈论基本概念）',
        },
        {
          type: 'text',
          content:
            '单挑中 GTO 与满员桌的差异：单挑范围极宽（SB 开池 80%、BB 防守 60%+），均衡策略意味着极高的下注频率与诈唬密度；而满员桌均衡下多数玩家只能打紧。求解器在单挑中会输出大量"激进的下注"与"极化的范围"——GTO 不是"打得紧"，而是"让一切保持在对手无法反制的比例上"。',
        },
        {
          type: 'example',
          content:
            '实例：单挑 SB 面对 BB，求解器会告诉你 SB 用约 80% 范围开池、BB 用约 60%+ 防守，翻后 OOP 的 SB 高频过牌、IP 的 BB 高频下注。这些频率看起来"松"，但都是均衡的一部分——任何一方偏离（如 SB 只开池 50%），另一方都能通过加宽防守或提高偷盲频率来剥削。',
        },
        {
          type: 'example',
          content:
            '实例二（最小必要偏离）：你观察到某单挑对手河牌面对大注只跟注 25%（均衡约 50%）。据此你可整体上调河牌超池诈唬频率——但幅度以"他若修正到 40% 你仍不亏"为限。这就是"以 GTO 为基线、按可观测偏差做有方向、有纪律的偏离"，而非盲目加码。',
        },
        {
          type: 'example',
          content:
            '实例三（单挑 GTO 的进攻性）：求解器中的单挑 BB 面对 SB 开池，会在很多牌面过牌加注（Check-Raise）——用听牌与强牌构成两极化范围施压。这源于 IP 的位置优势与宽范围。若你面对强势 BB 只会跟注从不加注，你的防守频率虽高却毫无威胁，对手的 C-Bet 频率可以无限上调剥削你。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点："GTO 就是打得紧"是最大误读。单挑 GTO 充满高频下注、超池全下与薄价值——它只是让这一切保持在对手无法反制的比例上。学习求解器别背频率，问三个为什么：为什么这个牌面用这个尺度？为什么这手牌进下注范围？为什么转牌后频率变了？',
        },
        {
          type: 'pro-tip',
          content:
            '单挑学习路径：先用求解器理解均衡"形状"（为什么这样打），再用节点锁定研究"对手常见漏洞的收割方案"，最后实战验证。基线给你不败之地，偏离给你利润空间——完全不懂 GTO 的剥削是裸奔，完全不敢偏离的 GTO 是自缚。',
        },
      ],
      quiz: [
        {
          id: 't5hu-gto-he-q1',
          question: '纳什均衡"不可剥削"的保证在什么场景下严格成立？',
          options: [
            '任意人数的底池',
            '单挑（二人零和博弈）',
            '只有锦标赛',
            '只有翻前',
          ],
          correctIndex: 1,
          explanation: '三人以上博弈中均衡的保底性质会因联合效应弱化。单挑才是纳什均衡"不可剥削"保证的严格适用域。',
        },
        {
          id: 't5hu-gto-he-q2',
          question: '面对一个漏洞百出的弱对手，单挑 GTO 策略的表现是：',
          options: [
            '赚得最多',
            '不输，但赚得少于针对性剥削策略',
            '会输给弱对手',
            '和剥削策略完全一样',
          ],
          correctIndex: 1,
          explanation: 'GTO 保证期望不低于博弈值（保底），但不主动利用对手错误；剥削策略榨取更多，代价是自己也打开漏洞。',
        },
        {
          id: 't5hu-gto-he-q3',
          question: '单挑 GTO 与满员桌 GTO 的主要差异是：',
          options: [
            '单挑 GTO 更紧',
            '单挑范围极宽，GTO 意味着极高下注频率与诈唬密度',
            '两者完全相同',
            '单挑不存在 GTO',
          ],
          correctIndex: 1,
          explanation: '单挑范围宽（SB 80%、BB 60%+），均衡策略伴随高下注频率与极化范围，而非"打得紧"。',
        },
        {
          id: 't5hu-gto-he-q4',
          question: '"最小必要偏离"的含义是：',
          options: [
            '完全照抄 GTO 频率',
            '以 GTO 为基线，按可观测偏差做有方向、有幅度上限的偏离',
            '随意加大诈唬频率',
            '永远偏离 GTO',
          ],
          correctIndex: 1,
          explanation: '偏离要有方向（针对对手漏洞）与幅度纪律（对手修正后仍不亏），保留随时回到基线的转身空间。',
        },
        {
          id: 't5hu-gto-he-q5',
          question: '学习求解器输出时，更应关注的是：',
          options: [
            '死记每个频率数字',
            '理解频率背后的"为什么"（尺度/范围/街间逻辑）',
            '只抄下注尺度',
            '忽略所有频率',
          ],
          correctIndex: 1,
          explanation: '背频率不如理解结构：为什么这个尺度、为什么进下注范围、为什么转牌频率变。理解结构频率自然记住。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't5hu-frequency',
      level: 5,
      order: 2,
      title: '频率平衡',
      subtitle: '下注与 check 的最优混合',
      duration: '15 min',
      eloDimension: 'postflop',
      objectives: [
        '理解混合策略与无差别原则：同一手牌按频率分配动作的条件',
        '掌握 MDF 与 Alpha 在单挑防守进攻中的临界频率计算',
        '学会在单挑宽范围下执行频率平衡，避免可被剥削的确定性倾向',
      ],
      content: [
        { type: 'heading', content: '频率：均衡的语言' },
        {
          type: 'text',
          content:
            '均衡策略不是"这手牌永远这么打"，而是"这手牌在特定节点按某种频率分配动作"。单挑中，范围宽、决策密，频率平衡尤为重要：若你的 C-Bet 频率恒定、3Bet 范围可预测，观察力强的对手会用节点锁定你的模式并反制。混合策略（Mixed Strategy）与无差别原则（Indifference Principle）共同构成频率平衡的数学基础。',
        },
        {
          type: 'key-point',
          content:
            '无差别原则：均衡中一手牌被混合使用，当且仅当它的各动作 EV 完全相等。混合的目的不是"迷惑"，而是让对手的边缘牌（如跟注站）在跟注与弃牌之间也恰好无差别——对手无从反制。',
        },
        { type: 'heading', content: 'MDF：防守的临界频率' },
        {
          type: 'formula',
          content:
            'MDF（最小防御频率）= 1 − 弃牌率 = 1/(1+b)（b = 下注额/底池）\n\n例：半池 b=0.5 → 防 67%；满池 b=1 → 防 50%；2 倍池 b=2 → 防 33%\n\nAlpha（诈唬盈亏平衡弃牌率）= b/(1+b) = 1 − MDF\n\n单挑半池下注：对手需防 67%，你的纯诈唬需要他弃牌 ≥33% 才保本。（概念源自：《The Mathematics of Poker》Bill Chen / Jeremie Ankenman Ch.5-6 下注-弃牌子博弈）',
        },
        {
          type: 'text',
          content:
            '单挑中防守不只等于跟注：加注同样计入防守频率。面对高频诈唬者，用加注替代部分跟注既防守又收价值；面对紧弱价值型下注，超额弃牌（低于 MDF）才是剥削。先算总量，再定分配——单挑 BB 的 60%+ 防守由跟注、3Bet 价值、3Bet 诈唬三部分构成，每一部分都随 SB 倾向移动。',
        },
        {
          type: 'example',
          content:
            '实例：单挑翻牌底池 2BB，SB（OOP）持强牌+诈唬混合范围，下注半池 1BB。你是 BB（IP），需用约 67% 范围继续。选择继续的牌按牌力+改进潜力排序：顶对、好听牌优先，纯垃圾进入弃牌的 33%。若你只防 40%，SB 每次诈唬平均立赚：0.60×2 − 0.40×1 = 0.8BB——你就在喂对手自动利润。',
        },
        {
          type: 'example',
          content:
            '实例二（混合执行）：河牌你持跟注站面对满池下注，均衡中对手诈唬占 1/3，你跟注所需胜率恰为 33%——跟与弃 EV 相同。求解器可能输出"跟 50%/弃 50%"。实战含义：这类决策单次做错的代价约等于零，不必纠结；真正的大 EV 差异在更早街的范围构建里。',
        },
        {
          type: 'example',
          content:
            '实例三（单挑频率剥削）：你观察到某单挑对手在翻牌面对 C-Bet 弃牌 60%（均衡约 45%）。这是明确的 MDF 漏洞——你的翻牌 C-Bet 频率与诈唬密度可以整体上调，因为对手在过度弃牌。但幅度以"他若收紧到 50% 你仍不亏"为限，保留修正空间。频率平衡不仅是防守，也是识别对手失衡并收割的显微镜。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：单挑中"该不该混合"不是哲学问题，是数学问题。混合节点两边 EV 相等，单次选错代价≈0；纯策略节点（明显最优动作唯一）才贡献绝大部分 EV。把精力投给高 EV 差异的决策，比纠结 50% 混合的精确执行更有价值。',
        },
        {
          type: 'pro-tip',
          content:
            '频率平衡三锚点背熟：面对半池防 67%、满池防 50%、2 倍池防 33%；半池下注诈唬 25%、满池诈唬 33%。复盘统计你面对转牌/河牌大注的实际弃牌率——绝大多数玩家远超均衡，这就是对手大注总"恰好"让你弃牌的原因。',
        },
      ],
      quiz: [
        {
          id: 't5hu-frequency-q1',
          question: '面对半池下注，MDF（最小防御频率）约为：',
          options: ['50%', '67%', '75%', '33%'],
          correctIndex: 1,
          explanation: 'MDF = 1/(1+0.5) = 2/3 ≈ 67%。需用最强约三分之二范围继续，否则对手任意诈唬有利可图。',
        },
        {
          id: 't5hu-frequency-q2',
          question: '均衡中一手牌被混合分配多个动作的前提是：',
          options: [
            '这手牌太难决定',
            '各动作的 EV 完全相等',
            '求解器精度不足',
            '为了迷惑对手随便选的',
          ],
          correctIndex: 1,
          explanation: '无差别原则：EV 不等时理性策略必选更高者。混合只发生在 EV 相等的临界牌上。',
        },
        {
          id: 't5hu-frequency-q3',
          question: '你面对满池下注实际只防守 30%（MDF 应为 50%），对手的正确剥削是：',
          options: [
            '只用坚果下注',
            '提高任意两张牌的诈唬频率',
            '降低下注尺度',
            '不再下注',
          ],
          correctIndex: 1,
          explanation: '弃牌率 70% 远超满池诈唬保本所需 50%，对手用任意两张牌下注都自动盈利，应疯狂增加诈唬。',
        },
        {
          id: 't5hu-frequency-q4',
          question: '单挑中"防守不只等于跟注"的含义是：',
          options: [
            '弃牌也算防守',
            '加注同样计入防守频率，先算总量再定分配',
            '防守只靠下注',
            '防守越紧越好',
          ],
          correctIndex: 1,
          explanation: '防守可由跟注+加注共同构成，BB 的 60%+ 防守含 3Bet 价值与诈唬。面对高频诈唬者用加注替代部分跟注。',
        },
        {
          id: 't5hu-frequency-q5',
          question: '对实战玩家，处理混合策略节点最务实的态度是：',
          options: [
            '必须精确执行每个频率',
            '认识到选哪边损失都极小，把精力投给高 EV 差异的决策',
            '永远选下注那一边',
            '避开所有混合局面',
          ],
          correctIndex: 1,
          explanation: '混合节点两边 EV 相等，单次"选错"代价≈0；真正拉开差距的是纯策略节点与更早街的范围构建质量。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T6: 下注理论（单挑版）==========
export const t6hu: TheoryLevelInfo = {
  id: 't6hu',
  level: 6,
  tier: 'intermediate',
  title: '单挑下注工程',
description: '设计最优下注尺与街间协调',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T5HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l3hu-bn-aggression', title: '按钮位激进度' },
      { id: 'l3hu-sb-continuation', title: 'SB 持续下注' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't6hu-sizing-optimal',
      level: 6,
      order: 1,
      title: '最优下注尺',
      subtitle: '小尺度与大额下注的选择',
      duration: '15 min',
      eloDimension: 'postflop',
      objectives: [
        '理解下注尺度的三因素：牌力层级、范围优势与底池几何（SPR）',
        '掌握单挑中"小注控池、大注极化"的尺度逻辑与价值:诈唬比随尺度变化',
        '学会根据筹码深度（SPR）选择翻牌/转牌尺度，规划河牌全下',
      ],
      content: [
        { type: 'heading', content: '尺度：下注工程的第一个旋钮' },
        {
          type: 'text',
          content:
            '下注尺度（Bet Size）是单挑翻后最重要的决策之一。它同时传递三个信号：牌力（价值大注 vs 诈唬）、范围结构（极化 vs 线性）、控池意图（小注留对手、大注抢底池）。单挑中尺度选择的核心逻辑是"小注控池、大注极化"——这与满员桌类似，但单挑更极端：因为对手范围宽、决策密，小注的控池价值与超池的极化价值都被放大。',
        },
        {
          type: 'key-point',
          content:
            '尺度不决定你"有没有价值"，而决定你"怎么变现价值"。同花顺坚果可以用超池全下榨干对手，顶对弱踢脚只能用 1/3 池小注薄价值——选错尺度，等于选错变现方式。',
        },
        { type: 'heading', content: '价值:诈唬比随尺度的变化' },
        {
          type: 'formula',
          content:
            '下注尺度的价值:诈唬比（底池 P、下注 bP）：\n\n诈唬占比 f = b/(1+2b)\n\n例：\n1/3 池 b≈0.33 → f = 0.33/1.66 ≈ 20%（价值:诈唬 = 4:1）\n半池 b=0.5 → f = 0.25（3:1）\n满池 b=1 → f = 1/3（2:1）\n2 倍池 b=2 → f = 0.4（3:2）\n\n结论：尺度越大，允许携带的诈唬越多——"大注=极化"的数学根源。（概念源自：《Modern Poker Theory》Michael Acevedo Ch.2-3 GTO 下注结构）',
        },
        {
          type: 'text',
          content:
            '单挑中尺度选择的实际偏好：干燥高牌面用 1/3 池小注高频（对手宽范围难中牌，小注即可让他弃牌或给边缘牌定价）；湿润连牌面用 2/3 池以上大注或超池（保护权益、极化）。而翻牌圈单挑通常倾向小注（1/3 池）——因为底池小、对手宽、你的范围优势大，小注即可实现薄价值与偷池。',
        },
        {
          type: 'example',
          content:
            '实例：单挑翻牌 K♠7♦2♣（干燥），SB min-raise、BB 跟注，底池 2BB。SB 持 A♠K♣（顶对顶踢脚）。此面干燥，BB 范围极少中 K，SB 用 1/3 池小注（约 0.7BB）即可：顶对 K 的薄价值让宽范围的弱牌付费，同时不给 BB 的垃圾牌免费看牌。若用满池大注，BB 只会留下更强的 K 或 set 跟你，K 的薄价值被浪费。',
        },
        {
          type: 'example',
          content:
            '实例二（SPR 规划全下）：单挑 100BB 深，翻前 SB raise 2.5BB、BB 跟注，底池 5BB，SPR = 97.5/5 ≈ 19.5。翻牌 9♠8♥4♣，SB 持 6♠5♠（顺子听牌）。高 SPR 下，SB 可用大注（2/3 池约 3.3BB）下注建立底池——为转牌/河牌的全下铺路：底池 11.6BB → 转牌下注 7.7BB → 底池 27BB → 河牌全下剩余 86BB，筹码自然打光。若翻牌小注 1/3 池，底池增长太慢，深筹码无法在河牌完成全下。',
        },
        {
          type: 'example',
          content:
            '实例三（小注控池）：同一 9♠8♥4♣ 面，SB 持 J♣T♣（顶对 + 顺子听牌，但易被反超）。中等牌力不追求打光筹码，SB 用 1/3 池小注控制底池规模，避免被 BB 的强牌加注后陷入大底池。小注既是"让弱牌付费"，也是"控制风险敞口"。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：单挑中小注不是"软弱"，而是"精确"——1/3 池小注在干燥面高频使用是 GTO 常态，因为它最大化薄价值与偷池比。满员桌"下注要够大才有威胁"的直觉在单挑宽范围下会变成浪费。',
        },
        {
          type: 'pro-tip',
          content:
            '尺度速查：(1) 报 SPR——低 SPR 打光、高 SPR 需规划多街；(2) 看牌面——干燥高牌面小注高频、湿润低牌面大注保护；(3) 定牌力——坚果超池、顶对小注、听牌中注。三步走完，尺度就有结构而非感觉。',
        },
      ],
      quiz: [
        {
          id: 't6hu-sizing-optimal-q1',
          question: '下注尺度越大，均衡策略允许携带的诈唬占比会：',
          options: ['减少', '增加', '不变', '无规律'],
          correctIndex: 1,
          explanation: 'f = b/(1+2b) 随 b 单调上升：满池诈唬 33%、2 倍池 40%。尺度越大对手跟注价格越差，可容纳越高诈唬密度。',
        },
        {
          id: 't6hu-sizing-optimal-q2',
          question: '干燥高牌面（如 K♠7♦2♣），顶对的最优尺度倾向是：',
          options: [
            '满池大注施压',
            '1/3 池小注薄价值，避免宽范围只留强牌跟注',
            '过牌',
            '超池全下',
          ],
          correctIndex: 1,
          explanation: '干燥面对手难中牌，小注即可薄价值让弱牌付费、控池；大注只会让 BB 留下更强的牌，浪费 K 的薄价值。',
        },
        {
          id: 't6hu-sizing-optimal-q3',
          question: 'SPR ≈ 19.5（深筹码），翻牌持强听牌，正确的尺度策略是：',
          options: [
            '小注控池',
            '大注建立底池，为转牌/河牌全下铺路',
            '过牌',
            '直接全下',
          ],
          correctIndex: 1,
          explanation: '高 SPR 下需用大注让底池几何级增长，才能在河牌完成全下。小注底池增长太慢，深筹码无法打光。',
        },
        {
          id: 't6hu-sizing-optimal-q4',
          question: '中等牌力（如顶对带顺子听牌）在下注尺度上的倾向是：',
          options: [
            '超池极化',
            '小注控池，控制风险敞口',
            '满池大注',
            '总是过牌',
          ],
          correctIndex: 1,
          explanation: '中等牌力不追求打光，小注既能薄价值又能控制被反加的风险。超池/满池会把中等牌陷入大底池尴尬。',
        },
        {
          id: 't6hu-sizing-optimal-q5',
          question: '半池下注的均衡诈唬占比约为：',
          options: ['20%', '25%', '33%', '40%'],
          correctIndex: 1,
          explanation: 'f = 0.5/(1+1) = 0.25，价值:诈唬 = 3:1。33% 是满池、20% 是 1/3 池、40% 是 2 倍池。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't6hu-barrel',
      level: 6,
      order: 2,
      title: '多条 streets',
      subtitle: '连续下注的协调性',
      duration: '12 min',
      eloDimension: 'postflop',
      objectives: [
        '理解单挑多街下注（barrel）的协调逻辑：翻牌/转牌/河牌的尺度与频率联动',
        '掌握连开三枪（triple barrel）的适用条件与牌面易手（board change）调整',
        '学会根据对手范围收窄与底池增长，动态分配各街的下注组合',
      ],
      content: [
        { type: 'heading', content: '多街下注：一次决策，三条街收线' },
        {
          type: 'text',
          content:
            '单挑翻后不只是"这一街下不下注"，而是"这一手牌如何在三条街收线"。翻牌下注后，转牌、河牌是继续开火（barrel）还是过牌，取决于：你的牌力层级、对手范围如何随每一街收窄、底池如何随每一街几何增长。一个精心设计的下注线（Betting Line）让强牌榨取全程、诈唬在正确时机收网。',
        },
        {
          type: 'key-point',
          content:
            '多街下注的黄金法则：价值牌可以连开三枪、半诈唬转牌收、纯诈唬河牌收。但每条街都要重新评估——转牌或河牌完成对手听牌时（牌面易手），你的开火频率必须随之下调。',
        },
        { type: 'heading', content: '连开三枪的数学结构' },
        {
          type: 'formula',
          content:
            '单挑翻牌圈下注线的底池几何（起始底池 P）：\n\n三连注方案（每街 2/3 池）：\n翻牌 2/3P → 转牌 2/3 × 新底池 → 河牌 2/3 × 新底池\n\n以 P=5BB 为例：\n翻牌下注 3.3BB，底池 → 11.6BB\n转牌下注 7.7BB，底池 → 27BB\n河牌下注 18BB，底池 → 63BB\n\n若要河牌全下打光 97.5BB，需从翻牌开始用约 2/3 池让底池几何增长——小注（1/3 池）做不到。（概念源自：《Applications of No-Limit Hold’em》Matthew Janda Ch.9 街间底池管理与尺度）',
        },
        {
          type: 'text',
          content:
            '但连开三枪不是无脑每街下注。三条街的开火组合取决于牌面演化：干燥高牌面（如 K♠7♦2♣→5♥→9♣）对手范围难中牌，可高频 triple barrel 代表强牌；湿润连接面（如 9♠8♥4♣→7♦→6♣）则极易完成顺子/同花，转牌河牌要警惕牌面易手，开火频率大幅下降。',
        },
        {
          type: 'example',
          content:
            '实例：单挑翻牌 K♠7♦2♣，SB 持 A♠A♣ 下注 1/3 池，BB 跟注（底池 8BB）。转牌 5♥ 空白，AA 仍领先，SB 下注半池 4BB，BB 跟注（底池 16BB）。河牌 9♣ 空白，SB 下注 2/3 池约 10.7BB 收价值。三条街 AA 全部开火——因为牌面持续干燥，AA 的领先保持完整，价值最大化。',
        },
        {
          type: 'example',
          content:
            '实例二（牌面易手）：同样 SB 持 A♠A♣，翻牌 9♠8♥4♣ 下注，BB 跟注。转牌 7♦——完成 QT、T6、65 的顺子。AA 的领先被削弱：BB 的宽防守范围里有不少顺子组合。此时 SB 应下调转牌下注频率（混合 check），因为继续开火只会被更强的牌跟注或加注。AA 从"三条街价值"变成"两街价值+一街控池"。',
        },
        {
          type: 'example',
          content:
            '实例三（半诈唬转牌收）：翻牌 8♠6♣2♦，SB 持 7♦5♦（两头顺）下注 1/3 池，BB 跟注。转牌 A♠（阻断牌+牌面变干），75s 未中顺子。转牌继续下注半池代表 A——BB 若弃牌，SB 用一个"接近坚果的听牌"在转牌收网。这是半诈唬的标准路径：翻牌听牌、转牌牌面有利时转纯诈唬收池。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：转牌河牌的"牌面易手"比你的牌力更重要。AA 在干燥面是三条街价值，在湿润面变成两街价值——不是 AA 变弱了，是对手范围里能击败它的组合变多了。开火频率必须跟随"对手范围如何被新牌改进"，而不是你自己的牌。',
        },
        {
          type: 'pro-tip',
          content:
            '下注线规划三问：(1) 这张牌面会改进谁的听牌？(2) 底池还能撑几街下注？（SPR 与全下计划）(3) 对手跟注后范围还剩什么？三问走完，你的连开三枪就从"惯性"变成"计划"。',
        },
      ],
      quiz: [
        {
          id: 't6hu-barrel-q1',
          question: '干燥高牌面（如 K♠7♦2♣→5♥→9♣）上，顶对的正确下注线是：',
          options: [
            '只下注翻牌一街',
            '高频连开三枪，因为对手范围难中牌且牌面持续干燥',
            '全部过牌',
            '转牌河牌都大注',
          ],
          correctIndex: 1,
          explanation: '干燥面对手难中牌，牌面持续不改进听牌，顶对领先保持完整，可高频 triple barrel 收全程价值。',
        },
        {
          id: 't6hu-barrel-q2',
          question: '湿润连接面（9♠8♥4♣→7♦→6♣）上，转牌河牌的正确开火频率是：',
          options: [
            '保持高频连开',
            '大幅下调，因为牌面易手、对手范围顺子组合大增',
            '转牌必开、河牌必弃',
            '无规律',
          ],
          correctIndex: 1,
          explanation: '湿润面极易完成顺子/同花，转牌河牌牌面易手，AA 等成牌优势被削弱，开火频率必须随之下调。',
        },
        {
          id: 't6hu-barrel-q3',
          question: '底池 5BB、SPR 高，若要河牌全下打光筹码，翻牌尺度应选择：',
          options: [
            '1/3 池小注',
            '约 2/3 池大注让底池几何增长',
            '过牌',
            '超池全下',
          ],
          correctIndex: 1,
          explanation: '高 SPR 需约 2/3 池让底池逐街几何增长才能在河牌全下；1/3 池底池增长太慢，无法打光深筹码。',
        },
        {
          id: 't6hu-barrel-q4',
          question: 'AA 在翻牌 9♠8♥4♣ 下注、转牌 7♦ 时的正确调整是：',
          options: [
            '继续全下施压',
            '下调转牌下注频率，因对手范围被新牌改进',
            '河牌才下注',
            '完全弃牌',
          ],
          correctIndex: 1,
          explanation: '7♦ 完成 QT、65 等顺子，BB 宽范围含不少顺子组合，AA 领先被削弱，应控池而非继续开火。',
        },
        {
          id: 't6hu-barrel-q5',
          question: '"半诈唬转牌收"指的是：',
          options: [
            '翻牌听牌，转牌牌面有利时转纯诈唬收池',
            '转牌永远弃牌',
            '翻牌直接全下',
            '河牌才诈唬',
          ],
          correctIndex: 0,
          explanation: '半诈唬翻牌以听牌下注，转牌未中但牌面有利（如出 A 阻断牌）时转纯诈唬，让对手弃牌直接赢底池。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T7: 对手分析（单挑版）==========
export const t7hu: TheoryLevelInfo = {
  id: 't7hu',
  level: 7,
  tier: 'advanced',
  title: '单挑对手剥削',
  description: '识别并利用对手的 exploitable 倾向',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T6HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l4hu-counter-strategies', title: '反制策略' },
      { id: 'l8hu-exploitative', title: '剥削性打法' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't7hu-patterns',
      level: 7,
      order: 1,
      title: '对手模式识别',
      subtitle: '常见单挑玩家的行为特征',
      duration: '15 min',
      eloDimension: 'handReading',
      objectives: [
        '识别单挑最常见的对手类型：跟注站、nit（紧弱）、疯鱼（激进跟注）、紧凶',
        '掌握从频率与倾向推断对手范围的读牌方法',
        '学会区分"可剥削倾向"与"一次性动作"，避免过度反应',
      ],
      content: [
        { type: 'heading', content: '单挑是读人的战场' },
        {
          type: 'text',
          content:
            '单挑只面对一个对手，读人的价值被无限放大——你无需兼顾多桌的多个形象，只需吃透眼前这一位。单挑玩家的倾向通常可分为几类：跟注站（Calling Station）翻后几乎不弃牌、nit（紧弱）范围极窄弃牌过多、疯鱼（Maniac）激进且跟注松、紧凶（TAG）平衡但可预测。识别类型后，你的剥削策略就有了方向。',
        },
        {
          type: 'key-point',
          content:
            '读人不是猜手牌，是估范围。对手"跟注过多"意味着他的范围偏宽、偏弱；"弃牌过多"意味着他的范围极窄、可被偷。从频率反推范围，是模式识别的核心。',
        },
        { type: 'heading', content: '从频率到范围：四个关键维度' },
        {
          type: 'text',
          content:
            '观察单挑对手的四个频率：(1) 翻前开池率——判断他玩多宽；(2) 面对 C-Bet 的弃牌率——判断他是否过度弃牌；(3) 3Bet 率——判断他的攻击性；(4) 摊牌倾向——判断他是跟注站还是可控。这四个频率交叉，基本勾勒出对手的完整画像。样本至少 50-100 手，单手牌印象不作数。',
        },
        {
          type: 'example',
          content:
            '实例：某单挑对手翻前开池 85%（宽），但面对 C-Bet 弃牌 60%（过度弃牌）。画像：开池宽+弃牌多 = "宽范围 + 弱防守"的结合。剥削方向：翻后你作为 IP 应高频 C-Bet 偷池，因为他的弃牌率高；同时他的开池宽说明你 BB 的防守也能加宽。两个漏洞一次收割。',
        },
        {
          type: 'example',
          content:
            '实例二（跟注站）：对手翻后几乎不弃牌（弃牌率 <25%），但开池适中。画像：跟注站。剥削方向：不能用纯诈唬（他不弃），改用价值下注薄价值——顶对弱踢脚也能下注收钱，因为他会用更差的牌跟注。同时减少诈唬频率，把诈唬牌转化为半诈唬或过牌。',
        },
        {
          type: 'example',
          content:
            '实例三（nit）：对手开池仅 30%，面对加注弃牌过多。画像：nit。剥削方向：提高偷盲与加注频率（他的弃牌率是自动利润）；但注意不要被他偶尔的强牌反加——nit 一旦进入底池通常很强。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：不要因为对手"某次"翻出坚果就改变对他的分类。单挑是高频博弈，单个全下赢/输是噪声；只有跨 50-100 手的频率统计才构成可剥削的信号。用单手牌印象下结论，是剥削的最大敌人。',
        },
        {
          type: 'pro-tip',
          content:
            '建立对手笔记：每 20 手记录一次四个频率（开池率/弃牌率/3Bet 率/摊牌倾向）。单挑高手中"边打边记笔记"是把短期印象转化为长期优势的纪律。',
        },
      ],
      quiz: [
        {
          id: 't7hu-patterns-q1',
          question: '单挑中"读人"的正确方式是：',
          options: [
            '猜对手具体拿什么牌',
            '从频率（开池率/弃牌率等）反推对手范围',
            '凭感觉判断',
            '只看单手牌表现',
          ],
          correctIndex: 1,
          explanation: '读人是估范围而非猜手牌。从四个关键频率（开池/弃牌/3Bet/摊牌）交叉推断对手画像。',
        },
        {
          id: 't7hu-patterns-q2',
          question: '对手开池 85%、面对 C-Bet 弃牌 60%，正确判断是：',
          options: [
            '他是 nit，应减少下注',
            '他是"宽范围+弱防守"，应高频 C-Bet 偷池',
            '他是跟注站',
            '没有漏洞可剥削',
          ],
          correctIndex: 1,
          explanation: '开池宽 + 弃牌多 = 宽范围弱防守，IP 高频 C-Bet 偷池 + BB 加宽防守，两个漏洞同时收割。',
        },
        {
          id: 't7hu-patterns-q3',
          question: '面对翻后几乎不弃牌的跟注站，正确的剥削是：',
          options: [
            '增加纯诈唬',
            '用价值下注薄价值，减少诈唬',
            '完全停止下注',
            '只玩坚果',
          ],
          correctIndex: 1,
          explanation: '跟注站不弃牌，纯诈唬无效；改用价值下注薄价值，因为对手会用更差的牌跟注。',
        },
        {
          id: 't7hu-patterns-q4',
          question: '识别对手类型时，足够的样本量约为：',
          options: ['3-5 手', '10 手', '50-100 手', '任意手数'],
          correctIndex: 2,
          explanation: '单个全下的输赢是噪声，只有 50-100 手的频率统计才构成可靠信号。单手牌印象下结论是剥削大敌。',
        },
        {
          id: 't7hu-patterns-q5',
          question: '对手开池仅 30%、面对加注弃牌过多（nit），剥削方向是：',
          options: [
            '提高偷盲与加注频率',
            '减少进攻',
            '只玩强牌',
            '增加跟注',
          ],
          correctIndex: 0,
          explanation: 'nit 弃牌过多，偷盲与加注的弃牌率是自动利润。但注意他进池后通常很强，避免被反加。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't7hu-exploit',
      level: 7,
      order: 2,
      title: '针对性调整',
      subtitle: '从 GTO 到剥削的转换',
      duration: '12 min',
      eloDimension: 'postflop',
      objectives: [
        '理解从 GTO 基线转向剥削策略的正确框架：最小必要偏离',
        '掌握针对不同对手类型的具体调整（频率、尺度、范围）',
        '学会识别"何时回到 GTO"——剥削打开漏洞的边界',
      ],
      content: [
        { type: 'heading', content: '剥削不是抛弃 GTO，是校准 GTO' },
        {
          type: 'text',
          content:
            '剥削策略（Exploitative Strategy）利用对手偏离均衡的倾向赚取超额利润。但单挑高手不会"抛弃"GTO，而是"校准"它：以均衡频率为基线，针对对手的明确偏离做最小必要偏离。关键纪律是——每次偏离都打开自己的漏洞，因此幅度要可控，且对手调整后要及时回到基线。',
        },
        {
          type: 'key-point',
          content:
            '剥削的正确姿态：方向瞄准对手漏洞（Maximally Exploitative），幅度保持最小（Minimally Exploitative）。偏离的目标是"对手修正前赚够"，而非"把自己也变漏洞"。',
        },
        { type: 'heading', content: '节点锁定：把剥削变成计算' },
        {
          type: 'text',
          content:
            '节点锁定（Node Locking）是求解器的高级用法：把对手某节点的策略锁定为你观察到的真实倾向（如"此对手河牌从不诈唬"或"面对 C-Bet 弃牌 60%"），重解你的最优应对。输出的就是针对该漏洞的最大剥削策略。这让剥削从"感觉"变成"计算"。',
        },
        {
          type: 'formula',
          content:
            '针对弃牌过多的对手提高偷盲（SB min-raise 到 2BB，BB 面对弃牌率 f）：\n\nEV(steal) = f×1.5 − (1−f)×1.5\n\n均衡弃牌率约 40%（f=0.4）→ EV = 0.4×1.5 − 0.6×1.5 = −0.3BB（不盈利，需翻后补）\n\n若对手弃牌率 60%（f=0.6）→ EV = 0.6×1.5 − 0.4×1.5 = +0.3BB（纯偷盲已盈利）\n\n结论：对手每提高弃牌率 10%，你的偷盲频率都应上调——但幅度以"他若修正到 50% 你仍不亏"为限。（概念源自：《Applications of No-Limit Hold’em》Matthew Janda Ch.13 剥削性下注与频率）',
        },
        {
          type: 'example',
          content:
            '实例：锁定"BB 面对转牌二次开火弃牌 55%（均衡约 45%）"后重解，求解器会立刻把你的转牌诈唬频率推高、连原本过牌的弱牌也加入下注。它精确展示了"对手每偏离 1%，你应该偏离多少"来收割。',
        },
        {
          type: 'example',
          content:
            '实例二（针对跟注站的价值）：对手翻后跟注过松（跟注站），锁定该倾向后，你的价值下注尺度可以加大、薄价值牌（顶对弱踢脚）全进下注范围。因为跟注站用弱牌跟注，你的宽价值范围被超额支付。',
        },
        {
          type: 'example',
          content:
            '实例三（何时回基线）：你提高偷盲频率后，对手开始频繁 3Bet 反击——说明他发现了你的偏离。此时必须回到 GTO 基线（收窄偷盲范围、减少纯诈唬），否则你新打开的漏洞会被他反向收割。剥削是动态博弈：偏离-被察觉-回基线，循环往复。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：剥削的最大风险不是"剥削得不够"，而是"剥削过头"把自己变成漏洞。单挑高手在收割对手漏洞的同时，永远留着一只手握在 GTO 基线的方向盘上——对手一调整，立刻归位。',
        },
        {
          type: 'pro-tip',
          content:
            '剥削执行五步：(1) HUD 收集足够样本确认漏洞；(2) 求解器锁定该节点求最优应对；(3) 对比基线标出被推高的频率与尺度；(4) 实战执行；(5) 每 500 手复核样本是否仍成立。没有数据支撑的"锁定"只是纸上的剥削。',
        },
      ],
      quiz: [
        {
          id: 't7hu-exploit-q1',
          question: '"最小必要偏离"的纪律是：',
          options: [
            '完全抛弃 GTO',
            '方向瞄准对手漏洞、幅度保持最小，随时可回基线',
            '永远加大剥削',
            '完全照抄 GTO',
          ],
          correctIndex: 1,
          explanation: '偏离打开自己的漏洞，幅度要可控；方向瞄准漏洞、幅度最小、对手调整后及时回基线。',
        },
        {
          id: 't7hu-exploit-q2',
          question: '针对弃牌率 60%（均衡 40%）的对手，偷盲 EV 为：',
          options: ['−0.3BB', '+0.3BB', '0', '无法计算'],
          correctIndex: 1,
          explanation: 'EV = 0.6×1.5 − 0.4×1.5 = +0.3BB，纯偷盲已盈利。对手弃牌率越高，偷盲频率越应上调。',
        },
        {
          id: 't7hu-exploit-q3',
          question: '节点锁定（Node Locking）的用途是：',
          options: [
            '锁定自己策略防止手抖',
            '把对手策略固定为观察到的倾向，求最大剥削应对',
            '防止求解器崩溃',
            '锁定翻前范围',
          ],
          correctIndex: 1,
          explanation: '节点锁定把"对手实际怎么打"输入求解器，输出对该偏差的最优收割方案，让剥削从感觉变计算。',
        },
        {
          id: 't7hu-exploit-q4',
          question: '面对翻后跟注过松的跟注站，剥削调整是：',
          options: [
            '加大价值下注、薄价值牌全进下注范围',
            '增加纯诈唬',
            '减少下注',
            '只玩坚果',
          ],
          correctIndex: 0,
          explanation: '跟注站用弱牌跟注，你的宽价值范围被超额支付，价值下注尺度可加大、薄价值牌可进下注范围。',
        },
        {
          id: 't7hu-exploit-q5',
          question: '你提高偷盲频率后对手开始频繁 3Bet 反击，正确做法是：',
          options: [
            '继续加大偷盲',
            '回到 GTO 基线，收窄范围',
            '完全停止开池',
            '忽略对手反应',
          ],
          correctIndex: 1,
          explanation: '对手发现你的偏离，你新打开的漏洞会被反向收割。必须回到基线，剥削是"偏离-被察觉-回基线"的动态博弈。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T8: 扑克心理学（单挑版）==========
export const t8hu: TheoryLevelInfo = {
  id: 't8hu',
  level: 8,
  tier: 'advanced',
  title: '单挑心理战',
  description: '在高压一对一环境中保持心理优势',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T7HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l5hu-focus', title: '单挑专注力' },
      { id: 'l5hu-opponent-psychology', title: '对手心理' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't8hu-pressure',
      level: 8,
      order: 1,
      title: '压力管理',
      subtitle: '单挑的持续紧张感应对',
      duration: '12 min',
      eloDimension: 'mental',
      objectives: [
        '理解单挑高频对抗下的波动密度与情绪触发机制',
        '掌握避免 tilt（情绪失控）的策略与自我觉察方法',
        '学会用"过程 vs 结果"分离保持长期决策质量',
      ],
      content: [
        { type: 'heading', content: '单挑：情绪的极限测试' },
        {
          type: 'text',
          content:
            '单挑是扑克中情绪压力最大的形式：每手牌都在盲注位、每小时 200+ 手、波动浓缩、没有队友分担、对手全程盯着你。连续输掉 8-10 个全下是数学常态（T1 的 55%-60% 全下胜率意味着 0.45^8 ≈ 0.17% 的连败常出现）。在这种环境下，情绪管理（Emotion Management）与策略本身同等重要——一个 tilt 的决策能抹掉数小时的正 EV。',
        },
        {
          type: 'key-point',
          content:
            '单挑下风期不是异常，是必然。把连续输牌当成"天气"而非"审判"，才能避免在波动最剧烈时做出最差的策略调整。',
        },
        { type: 'heading', content: 'tilt 的机制与防线' },
        {
          type: 'text',
          content:
            'Tilt（情绪失控）源于三个触发：结果依赖（赢了开心、输了痛苦）、期望落空（"我该赢的"）、报复心理（"下一把一定要赢回来"）。tilt 的可怕在于它会扭曲你的范围——你会开池更松、跟注更宽、追听更凶，全部偏离基线。防线有三：(1) 自我觉察——设定"情绪红灯"（连续 N 手想报复、想加注翻本）并强制暂停；(2) 预先承诺——桌外定好止损点，到点就离桌；(3) 过程归因——只复盘决策的 EV 是否正确，不因结果好坏改变打法。',
        },
        {
          type: 'example',
          content:
            '实例：单挑你连输 6 个 60% 胜率的全下（概率 0.4^6 ≈ 0.4%，虽低但每小时遇到几次）。此时你的理智知道"打对了"，但情绪想"翻本"。若你继续加大尺度追回损失，就是典型的 tilt 循环。正确做法：识别到报复冲动 → 暂停 10 分钟 → 重新用"这手牌 EV 是多少"而非"我要赢回来"来决策。',
        },
        {
          type: 'example',
          content:
            '实例二（过程 vs 结果）：你持 AK 对 55 全下，55 胜出。结果：你输了。过程：AK 对 55 约 43% 胜率，全下 EV 取决于底池赔率，若赔率合适则 +EV，打对了。单挑高手复盘只看过程："这个决策 EV 对吗？"而 tilt 玩家只看结果："我又输给垃圾牌了。"两者的长期差异是天文数字。',
        },
        {
          type: 'formula',
          content:
            '单挑波动预算（Tendler 的心理管理框架）：\n\n单次全下标准差 σ = √(p(1−p)) × 池底（伯努利近似）\nN 手累计波动 = σ×√N，期望 = N×边际胜率×池底\n\n例：p=60%、池底 100、边际 20：\n期望(50 手) = 50×0.2×100 = 1000\n波动(50 手) = 49×√50 ≈ 347\n\n结论：即使期望为正，单挑中"赢家长期回撤"也是常态——这是心理压力的数学根源，也是你需预设波动预算的原因。（概念源自：《The Mental Game of Poker》Jared Tendler Ch.4 波动耐受与情绪）',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：tilt 最危险的不是"输钱时的冲动"，而是"赢钱后的松懈"。赢了几手后玩家常放松警惕、开始玩边缘牌，把优势送回去。单挑的纪律必须全程一致，无论牌势顺逆。',
        },
        {
          type: 'pro-tip',
          content:
            '单挑 session 管理三件套：(1) 预设波动预算——输 40-50BB 即暂停复盘，是止损重开而非翻本；(2) 每 100 手起身一次，切断连败的心理惯性；(3) 复盘只问 EV 不问结果。',
        },
      ],
      quiz: [
        {
          id: 't8hu-pressure-q1',
          question: '单挑中连续输掉多个 60% 胜率全下的原因主要是：',
          options: [
            '运气差到极点',
            '高频对抗下的数学必然（0.4^N 的连败常出现）',
            '打得不好',
            '对手作弊',
          ],
          correctIndex: 1,
          explanation: '0.45^8 ≈ 0.17% 的连败虽低，但单挑每小时 200+ 手、55%-60% 全下反复出现，连败是稳定出现的背景噪声。',
        },
        {
          id: 't8hu-pressure-q2',
          question: '"过程 vs 结果"分离的核心含义是：',
          options: [
            '赢钱才算打对',
            '复盘只看决策 EV 是否正确，不因结果改变打法',
            '输钱就要调整策略',
            '过程不重要',
          ],
          correctIndex: 1,
          explanation: 'AK 对 55 全下即使输也是 +EV 的正确决策。复盘看过程（EV）而非结果（输赢），才能保持长期质量。',
        },
        {
          id: 't8hu-pressure-q3',
          question: 'tilt 对策略最典型的破坏是：',
          options: [
            '让范围收紧',
            '让开池更松、跟注更宽、追听更凶，全部偏离基线',
            '让打法更保守',
            '没有影响',
          ],
          correctIndex: 1,
          explanation: 'tilt 扭曲范围：开池过松、跟注过宽、追听过凶，系统性偏离均衡基线。',
        },
        {
          id: 't8hu-pressure-q4',
          question: '单挑 session 中"预设波动预算"的作用是：',
          options: [
            '限制最多能输多少',
            '到止损点暂停复盘，避免翻本式追加',
            '确保每次都赢',
            '计算期望值',
          ],
          correctIndex: 1,
          explanation: '波动预算是止损纪律：输到预设点数暂停复盘，切断"翻本"冲动，而非继续追加陷入 tilt。',
        },
        {
          id: 't8hu-pressure-q5',
          question: '关于 tilt 的高发时点，正确的说法是：',
          options: [
            '只在连续输牌时',
            '赢牌后的松懈同样危险',
            '从不发生',
            '只在锦标赛',
          ],
          correctIndex: 1,
          explanation: '赢牌后玩家常放松警惕、玩边缘牌，把优势送回去。单挑纪律须全程一致，顺逆都不可松懈。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't8hu-reads',
      level: 8,
      order: 2,
      title: '心理读取',
      subtitle: '观察与反观察的技巧',
      duration: '10 min',
      eloDimension: 'mental',
      objectives: [
        '理解线下物理读取（tell）与线上频率读取的区别与局限',
        '掌握反读取（平衡自己的动作，避免泄露范围）',
        '学会用"叙事一致性"判断对手意图，避免过拟合',
      ],
      content: [
        { type: 'heading', content: '读取：把观察变成信息' },
        {
          type: 'text',
          content:
            '读取（Read）分为两类：线下物理读取（Physical Tells——下注手势、肢体、眼神）与线上频率读取（Frequency Reads——下注节奏、时间、尺度）。单挑中读取的价值高，但陷阱也多：物理 tell 被反制（对手演戏）、频率 tell 样本不足。最可靠的是把"观察"与"动作叙事"结合——对手的动作序列是否讲一个自洽的故事。',
        },
        {
          type: 'key-point',
          content:
            '最好的读取是"动作一致性"：一个对手翻牌转牌都过牌、河牌突然超池全下，他的叙事是"我有坚果"。若这个叙事与他的频率统计矛盾，就是读取信号。',
        },
        { type: 'heading', content: '反读取：平衡你的动作' },
        {
          type: 'text',
          content:
            '你在读对手，对手也在读你。反读取（Balanced Play）要求你的动作不泄露范围信息：不要因为"这手牌强"就下注快、因为"在诈唬"就犹豫。单挑中对手盯着你的每一个节奏，无意识的"强牌下注快、弱牌下注慢"是经典的泄露。专业玩家的反读取是刻意保持动作节奏一致，或用混合频率掩盖。',
        },
        {
          type: 'example',
          content:
            '实例：线上单挑，对手转牌面对你的下注思考了 20 秒才跟注。频率读取：思考时间长 = 他在艰难决策，可能边缘牌（跟注站特征）或听牌。但样本不足时，这可能是演戏。正确做法是交叉验证：他面对大注的跟注倾向、他河牌的摊牌选择，综合判断而非单独依赖一次节奏。',
        },
        {
          type: 'example',
          content:
            '实例二（反读取）：你持 AA，翻牌下注时注意自己的节奏。若你因为"我有强牌"而下注飞快、又因为"我在诈唬"而下注犹豫，对手会很快破解。反读取练习：规定自己所有下注用相同思考时间，或在关键时刻刻意打乱节奏（强牌也犹豫、诈唬也果断）。',
        },
        {
          type: 'example',
          content:
            '实例三（叙事一致性）：对手翻牌下注、转牌下注、河牌过牌。叙事：翻牌转牌有牌力、河牌放弃。若他河牌过牌但下注尺度反常（翻牌大注、河牌小注），结合他的频率，可能是"薄价值"而非"放弃"。读取要结合"动作序列"与"频率统计"，单一动作不作数。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：读取的敌人不是"读错"，而是"过度自信"。单挑高手会承认"这个读取只有 60% 把握"并据此下注，而不是"我确定他有什么"。把读取转化为概率而非确定性，才是可持续的策略。',
        },
        {
          type: 'pro-tip',
          content:
            '读取纪律：(1) 只用统计显著的频率（50+ 手样本）下结论；(2) 结合动作叙事与频率交叉验证；(3) 承认读取的不确定性，把它折入胜率与赔率计算。三件事做完，读取就从玄学变成数学。',
        },
      ],
      quiz: [
        {
          id: 't8hu-reads-q1',
          question: '最可靠的单挑读取方式是：',
          options: [
            '只看对手一次下注节奏',
            '结合动作叙事与频率统计交叉验证',
            '完全依赖物理 tell',
            '凭直觉',
          ],
          correctIndex: 1,
          explanation: '单一动作或节奏样本不足不可靠。把"动作序列是否自洽"与"跨 50+ 手的频率统计"结合才是可靠读取。',
        },
        {
          id: 't8hu-reads-q2',
          question: '"反读取（Balanced Play）"的核心是：',
          options: [
            '隐藏自己的强牌',
            '让动作不泄露范围信息，保持节奏一致',
            '永远最快下注',
            '让对手猜不透牌力',
          ],
          correctIndex: 1,
          explanation: '反读取要求动作不泄露范围：不要"强牌快、弱牌慢"，刻意保持节奏一致或打乱节奏，避免被对手破解。',
        },
        {
          id: 't8hu-reads-q3',
          question: '单挑读取的正确态度是把读取当作：',
          options: [
            '确定性的事实',
            '一个概率（如"60% 把握"）并折入决策',
            '永远正确的工具',
            '可忽略的噪声',
          ],
          correctIndex: 1,
          explanation: '读取有不确定性，高手把它转化为概率而非确定性，再折入胜率与赔率计算，才是可持续策略。',
        },
        {
          id: 't8hu-reads-q4',
          question: '对手翻牌转牌都下注、河牌过牌，最可能的解读是：',
          options: [
            '他一定在诈唬',
            '结合频率与尺度，可能是薄价值或放弃',
            '他一定有坚果',
            '无法读取',
          ],
          correctIndex: 1,
          explanation: '叙事"翻转有牌力、河牌放弃"，但要结合河牌尺度与频率统计——可能是薄价值而非纯放弃，需交叉验证。',
        },
        {
          id: 't8hu-reads-q5',
          question: '经典的下注泄露是：',
          options: [
            '强牌下注快、弱牌下注慢',
            '所有下注节奏一致',
            '用相同思考时间',
            '打乱节奏',
          ],
          correctIndex: 0,
          explanation: '"强牌快、弱牌慢"是经典泄露。反读取应保持节奏一致或刻意打乱，避免对手破解你的范围强度。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T9: 经典理论综合（单挑版）==========
export const t9hu: TheoryLevelInfo = {
  id: 't9hu',
  level: 9,
  tier: 'advanced',
  title: '单挑理论大师',
  description: '整合所有技能成为单挑专家',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T8HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l7hu-stakes', title: '单挑策略基础' },
      { id: 'l6hu-tourney', title: '单挑锦标赛' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't9hu-mastery',
      level: 9,
      order: 1,
      title: '全面整合',
      subtitle: '构建个人单挑理论体系',
      duration: '20 min',
      eloDimension: 'postflop',
      objectives: [
        '把 T1-T8 的知识整合为单挑决策的完整闭环：范围→数学→下注→剥削→心理',
        '理解单挑理论在不同筹码深度与游戏类型（现金/锦标赛）的适用变化',
        '建立个人复盘与学习体系，形成持续改进的方法论',
      ],
      content: [
        { type: 'heading', content: '从碎片到体系：单挑决策闭环' },
        {
          type: 'text',
          content:
            'T1-T8 的每一章都是一块积木：T1 概率基础、T2 赔率与 EV、T3 位置与起手、T4 范围、T5 GTO、T6 下注、T7 剥削、T8 心理。单挑大师不是"记住每章"，而是把它们连成一个决策闭环——面对任何局面，按"范围→数学→下注→剥削→心理"的顺序自动运转。这个闭环让你在桌边不再是"这个决策我背过公式"，而是"这个局面的所有维度我都看到了"。',
        },
        {
          type: 'key-point',
          content:
            '单挑决策闭环：先问"双方范围是什么"（T4），再算"我的 EV 与赔率"（T2），然后"用什么尺度下注"（T6），接着"对手有什么偏离可剥削"（T7），最后"我的情绪是否稳定"（T8）。五问缺一不可。',
        },
        { type: 'heading', content: '理论随场景变形' },
        {
          type: 'text',
          content:
            '单挑理论不是铁板一块，它随两个参数变形：筹码深度与游戏类型。深筹码（100BB+）：范围更宽、下注更极化、翻后位置价值更大，SPR 高需规划多街。短筹码（20BB 以下）：翻前全下更频繁、位置价值缩小、下注更直接。现金桌：无限重买、波动可管理、以 bb/100 衡量。锦标赛：筹码是资源、ICM 压力、盲注随时间上涨，策略随阶段动态调整（详见 l6hu-tourney）。',
        },
        {
          type: 'example',
          content:
            '实例：深筹码 100BB，单挑 SB 持 A♠5♠。决策闭环：范围——A5s 是 SB 开池范围成员（约 80% 内）；数学——min-raise 2BB，纯偷盲需 60% 弃牌率；下注——深筹码倾向小注控池+翻后发挥；剥削——若 BB 弃牌多提高开池频率；心理——节奏一致不泄露。一个决策，五问全过。',
        },
        {
          type: 'example',
          content:
            '实例二（短筹码）：单挑 15BB 深，SB 持 K♠Q♠。范围——KQs 面对 BB 宽范围胜率约 60%；数学——全下 15BB 或 min-raise 后全下，KQs 对跟注范围优势明显；下注——短筹码不用多街，直接全下或小加注引诱；剥削——BB 若弃牌过多直接推；心理——接受波动。短筹码的策略比深筹码更直接——筹码深度的变化，让同一手牌的玩法完全不同。',
        },
        {
          type: 'example',
          content:
            '实例三（复盘方法论）：单挑 session 后，用"决策闭环"逐手复盘——这手牌我范围判断对吗？EV 算对了吗？尺度合适吗？对手倾向判断对吗？情绪有没有影响？五个问题把每一手牌变成一次训练。Tendler 强调"过程 vs 结果"：复盘只问过程（决策质量），不问结果（输赢）。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：单挑大师的"聪明"不在于每个决策都完美，而在于"系统稳定"。偶尔的决策失误不可避免，但稳定的决策闭环+严格的情绪纪律，让长期期望曲线稳定向上。追求"每手都完美"反而会导致过度思考与 tilt。',
        },
        {
          type: 'pro-tip',
          content:
            '构建个人体系的四步：学（T1-T8 理论）→ 练（求解器验证）→ 打（实战执行闭环）→ 复（逐手复盘+笔记）。四步循环，你的单挑水平随每个 session 稳定爬升。',
        },
      ],
      quiz: [
        {
          id: 't9hu-mastery-q1',
          question: '单挑决策闭环的正确顺序是：',
          options: [
            '下注→范围→数学→心理',
            '范围→数学→下注→剥削→心理',
            '心理→范围→下注→数学',
            '只看结果',
          ],
          correctIndex: 1,
          explanation: '闭环：范围（T4）→ 数学（T2）→ 下注（T6）→ 剥削（T7）→ 心理（T8），五问缺一不可。',
        },
        {
          id: 't9hu-mastery-q2',
          question: '深筹码（100BB）与短筹码（15BB）单挑的主要差异是：',
          options: [
            '没有差异',
            '深筹码范围更宽、下注更极化、需规划多街；短筹码翻前全下更频繁、更直接',
            '短筹码范围更宽',
            '深筹码不需要下注',
          ],
          correctIndex: 1,
          explanation: '筹码深度改变策略：深筹码 SPR 高需多街规划、下注极化；短筹码翻前全下更频繁、玩法更直接。',
        },
        {
          id: 't9hu-mastery-q3',
          question: '单挑复盘最应关注的是：',
          options: [
            '这手输了多少',
            '决策过程（范围/EV/尺度/剥削/情绪）是否正确',
            '赢了多少手',
            '对手多强',
          ],
          correctIndex: 1,
          explanation: '复盘只问过程（决策质量）不问结果（输赢），把每一手牌变成训练，才能持续改进。',
        },
        {
          id: 't9hu-mastery-q4',
          question: '短筹码（15BB）单挑持 KQs，最合理的玩法是：',
          options: [
            '复杂多街下注',
            '直接全下或小加注引诱，缩短决策树',
            '过牌看翻牌',
            '弃牌',
          ],
          correctIndex: 1,
          explanation: '短筹码不用多街规划，KQs 对宽范围胜率约 60%，直接全下或小加注引诱是标准打法。',
        },
        {
          id: 't9hu-mastery-q5',
          question: '"系统稳定"比"每手完美"更重要的原因是：',
          options: [
            '完美不可能',
            '稳定的决策闭环+情绪纪律让长期期望稳定向上，追求完美反致过度思考与 tilt',
            '系统稳定更省力',
            '对手更喜欢',
          ],
          correctIndex: 1,
          explanation: '偶尔失误不可避免，稳定的闭环与情绪纪律让长期期望曲线向上；追求"每手完美"反而引发过度思考与 tilt。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't9hu-pro-study',
      level: 9,
      order: 2,
      title: '职业选手研究',
      subtitle: '顶级 HU 玩家的决策逻辑',
      duration: '25 min',
      eloDimension: 'handReading',
      objectives: [
        '研究职业单挑选手的决策框架与范围构建习惯',
        '理解顶级玩家的共同特征：频率平衡、范围一致、情绪稳定',
        '学会从职业选手的公开策略与牌例中提炼可复用的方法论',
      ],
      content: [
        { type: 'heading', content: '顶级单挑选手在想什么' },
        {
          type: 'text',
          content:
            '研究职业单挑选手（如 Moshman 体系中的资深 HU 玩家、求解器时代的顶级 Grinder）的核心价值，不是模仿某个动作，而是理解他们的决策框架。顶级玩家的共同特征高度一致：频率平衡（不泄露范围）、范围一致（动作叙事自洽）、情绪稳定（不受结果影响）、纪律执行（严格按预设策略）。',
        },
        {
          type: 'key-point',
          content:
            '职业与业余的分水岭不是"运气"或"天赋"，而是"决策框架"——业余靠感觉，职业靠系统。研究职业选手，是学习他们的系统，而非抄他们的牌。',
        },
        { type: 'heading', content: '职业决策框架拆解' },
        {
          type: 'text',
          content:
            '顶级单挑选手的决策框架通常分四层：(1) 翻前范围构建——以 GTO 基线为起点，按对手倾向微调；(2) 翻后范围分配——按牌面归属（谁的范围优势/坚果优势）决定下注/过牌；(3) 下注尺度纪律——按 SPR 与牌力层级选择尺度；(4) 剥削切换——识别对手偏离时切换到最大剥削，对手调整时回基线。每一层都有明确的输入与输出，而非临场发挥。',
        },
        {
          type: 'example',
          content:
            '实例（翻前范围微调）：职业选手面对某 BB 弃牌过多的对手，会刻意提高 SB 开池频率至接近 100%、降低加注尺度（min-raise 为主），因为宽范围+小尺度最大化偷盲 EV。这不是"感觉该偷"，而是"对手弃牌率统计支持"的可计算决策。',
        },
        {
          type: 'example',
          content:
            '实例二（翻后范围分配）：职业选手在单挑翻牌 A♠8♦3♣（干燥高牌面）会高频小额 C-Bet 整个下注范围——因为加注者范围优势明显（含大量 Ax），跟注者难中 A。而在 7♠6♥4♣ 湿润面会大幅下调 C-Bet 频率——因为跟注者范围含更多顺子/听牌。范围优势决定下注频率，这是可复用的方法论。',
        },
        {
          type: 'example',
          content:
            '实例三（情绪纪律）：顶级选手在连输 10 个 60% 全下后，仍会按同一套框架决策——因为他们把"波动"视为不可控的外部变量，只控制"决策质量"。这正是 T8 强调的"过程 vs 结果"分离在职业层面的极致体现。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：职业选手研究的价值不在"他们多厉害"，而在"他们的系统有多可复制"。一个业余玩家照着职业框架练一个月，往往比"背了十年感觉"进步更快——因为系统可训练，感觉不可复制。',
        },
        {
          type: 'pro-tip',
          content:
            '研究职业牌例的流程：(1) 记录一手牌的所有动作序列；(2) 用决策闭环逐层拆解（范围/数学/下注/剥削/心理）；(3) 对照自己的处理找差距；(4) 提炼一条可复用原则写入笔记。每研究 10 手，你的决策框架就完整一分。',
        },
      ],
      quiz: [
        {
          id: 't9hu-pro-study-q1',
          question: '顶级单挑选手与业余玩家的核心分水岭是：',
          options: [
            '运气',
            '决策框架（系统性 vs 靠感觉）',
            '天赋',
            '筹码量',
          ],
          correctIndex: 1,
          explanation: '职业与业余的差距是"决策框架"——职业靠系统（范围构建、频率平衡、纪律），业余靠感觉。',
        },
        {
          id: 't9hu-pro-study-q2',
          question: '职业选手面对弃牌过多的 BB，会如何微调翻前策略？',
          options: [
            '减少开池',
            '提高开池频率至接近 100%、降低尺度（min-raise）最大化偷盲 EV',
            '只玩坚果',
            '增加跟注',
          ],
          correctIndex: 1,
          explanation: '对手弃牌率统计支持"宽范围+小尺度"最大化偷盲 EV，是可计算决策而非感觉。',
        },
        {
          id: 't9hu-pro-study-q3',
          question: '翻牌 A♠8♦3♣（干燥高牌面），加注者的 C-Bet 频率应：',
          options: [
            '大幅下降',
            '高频小额下注整个范围',
            '完全过牌',
            '只看自己牌',
          ],
          correctIndex: 1,
          explanation: '加注者范围优势明显（含大量 Ax），跟注者难中 A，可高频小额 C-Bet 整个下注范围。',
        },
        {
          id: 't9hu-pro-study-q4',
          question: '顶级选手连输多个 60% 全下后仍按同一框架决策，体现的是：',
          options: [
            '固执',
            '把波动视为不可控变量、只控制决策质量的情绪纪律',
            '不在乎输赢',
            '运气好',
          ],
          correctIndex: 1,
          explanation: '顶级选手把波动当外部变量，只控制决策质量，这正是"过程 vs 结果"分离的极致体现。',
        },
        {
          id: 't9hu-pro-study-q5',
          question: '研究职业牌例最有价值的方式是：',
          options: [
            '照抄他们的动作',
            '用决策闭环逐层拆解，提炼可复用原则',
            '只关注他们赢了多少',
            '模仿他们的运气',
          ],
          correctIndex: 1,
          explanation: '逐层拆解（范围/数学/下注/剥削/心理）+ 对照差距 + 提炼原则，才能把职业框架转化为自己的系统。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

/** Heads-Up 全部 Level */
export const headsUpLevels: TheoryLevelInfo[] = [
  t1hu,
  t2hu,
  t3hu,
  t4hu,
  t5hu,
  t6hu,
  t7hu,
  t8hu,
  t9hu,
];
