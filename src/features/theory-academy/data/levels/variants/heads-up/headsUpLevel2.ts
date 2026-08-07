import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { headsUpRules } from '../variantRules';

const variant: PokerVariant = 'heads-up';

export const HEADS_UP_LEVEL_2: TheoryLevelInfo = {
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
