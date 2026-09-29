import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { headsUpRules } from '../variantRules';

const variant: PokerVariant = 'heads-up';

export const HEADS_UP_LEVEL_3: TheoryLevelInfo = {
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
        '理解单挑 SB 的结构独特性——翻后即按钮位 + 0.5 强制 Ante 死钱，与满员桌 SB 完全相反',
        '掌握 SB 开池尺度的数学：盈亏平衡弃牌率与 MDF，理解 min-raise 为何是单挑主武器',
        '学会划分 limp 叠与 raise 叠，理解单挑 limp 的 GTO 合理性及随对手的调整条件',
      ],
      content: [
        { type: 'heading', content: '单挑 SB：翻后最后行动的唯一玩家' },
        {
          type: 'text',
          content:
            '满员桌的 SB 是全桌最惨的位置：翻前倒数第二个行动、翻后永远无位置、被迫投入盲注却几乎无翻后优势。单挑的 SB 则完全不同——你就是按钮位，且已投入的 0.5 兼具 Ante 性质：无论你最终是否参与，这 0.5 都已进入底池成为死钱。两个结构事实叠加，让单挑 SB 成为翻前最先表态、翻后却握着全部信息的位置：翻前你必须先行动，翻后每一街都是 BB 先动、你最后决定。理解这个双重身份，是本章所有策略的起点。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前策略；《Easy Game》Andrew Seidman Ch.4 位置）',
        },
        {
          type: 'key-point',
          content:
            '单挑中 SB 的 0.5 是"强制 Ante"：它不是可以放弃的沉没成本，而是你与 BB 争夺的奖池的一部分。翻后你最后行动——这是满员桌 SB 梦寐以求的待遇，代价是翻前必须先表态（位置反转，详见本级『位置反转』章）。',
        },
        { type: 'heading', content: '开池尺度：min-raise 是主武器' },
        {
          type: 'formula',
          content:
            'SB min-raise 到 2BB 的数学（SB 已投 0.5，额外风险 1.5BB；BB 已投 1，可弃牌或再补 1）：\n\n纯偷盲模型（以 SB 直接弃牌为基准，0.5 死钱已沉没）：SB 额外风险 1.5BB，BB 弃牌则赢得整个 1.5BB 底池\nEV(raise) = f×1.5 − (1−f)×1.5（f = BB 弃牌率）\n盈亏平衡：f×1.5 = (1−f)×1.5 → f = 50%\n即 BB 弃牌率超过 50% 时，SB 用任意两张牌 min-raise 的纯偷盲部分开始盈利；\n等价地，BB 的最小防守频率 MDF = 1 − 50% = 50%。\n\n开池尺度对比（SB 额外风险 → 盈亏平衡弃牌率）：\nmin-raise 2BB：1.5BB → 1.5÷3 = 50%\n2.5BB：2BB → 2÷3.5 ≈ 57.1%\n3BB：2.5BB → 2.5÷4 = 62.5%\n\n结论：尺度越小，自动盈利的门槛越低；单挑中 BB 实际防守 60%-70% 以上（弃牌仅 30%-40%），min-raise 的纯偷盲部分为负——盈利的大头在翻后。（概念源自：《Applications of No-Limit Hold’em》Matthew Janda Ch.3 盲注博弈；《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前策略）',
        },
        {
          type: 'text',
          content:
            '为什么单挑开池以 min-raise 为主？三点：(1) 偷盲门槛低——2BB 只需 50% 弃牌率，而单挑 BB 面对 min-raise 的真实弃牌率只有约 30%-40%，纯偷盲几乎不盈利，所以开池的价值不在偷盲而在翻后，尺度越小翻后越容易控池；(2) 大尺度在单挑是"自我惩罚"——BB 的跟注范围随尺度收窄，你花 3BB 只换来一个更强的跟注范围；而你翻后虽握着位置，用宽范围去打大底池，位置优势也补不回范围劣势的代价，这远高于满员桌；(3) 频率与平衡——min-raise 让你能用约 80% 的手牌开池，范围足够宽才能覆盖翻后的各种牌面。满员桌"偷盲要加大尺度"的经验在单挑要反过来用：尺度服务于翻后，而不是服务于偷盲。',
        },
        {
          type: 'text',
          content:
            '单挑 SB 的 limp 是满员桌教条的例外。满员桌 SB 几乎从不 limp，因为 limp 后面对多人加注会失去位置、被动进池，且放弃 Fold Equity；但单挑中三条理由让 limp 成为 GTO 合理选项：(1) 赔率——补 0.5 看 1.5 的底池，所需胜率仅 25%，任何牌对 BB 的宽范围都接近甚至超过这条线；(2) 结构——BB 翻前最后行动，limp 后 BB 只能 check 或 raise（isolate），而你的翻后按钮位由规则决定、不会因为改成 limp 而丢失；(3) 范围保护——limp 范围混入 AA/KK 等强牌，BB 就不能对 limp 无脑 isolate。求解器显示单挑 SB 会以约 20%-30% 的频率选择 limp（随筹码深度与对手调整），其余以 min-raise 为主。（概念源自：《Modern Poker Theory》Michael Acevedo Ch.3 翻前玩法与 limp 混合；《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前策略）',
        },
        {
          type: 'example',
          content:
            '实例：单挑 100BB 深，你（SB）持 A♠5♠。先给牌分档：强成牌（JJ+、AK）进 raise 叠，靠价值与偷盲双重收益；投机牌（小对子、同花连张、A5s 类）在 limp 叠与 raise 叠之间混合；垃圾牌（K8o、Q6o）直接弃牌。A5s 的归属取决于 BB 的 3-bet 频率：BB 3-bet 约 15% 时，A5s 被 3-bet 的概率约 15%，被 3-bet 后 A5s 通常只能弃牌——min-raise 的 EV 被侵蚀约 0.15×1.5 ≈ 0.23BB，此时把 A5s 放进 limp 叠更划算；BB 3-bet 低于 8% 时，A5s 的阻断价值（对手更少 AA/AK）和翻后坚果听牌潜力让 min-raise 成为更优选择。同一手牌，对手的 3-bet 频率决定它的归属——这是"范围随对手移动"的第一次实战。',
        },
        {
          type: 'example',
          content:
            '实例二：你（SB）持 7♥6♥，100BB 深。对手是跟注站（翻后几乎不弃牌）：min-raise 的偷盲 EV = 0.35×1.5 − 0.65×1.5 ≈ −0.45BB（纯偷盲口径），而 limp 后 76s 对 BB 随机范围约有 43% 胜率，深筹码下中顺子/同花对手照单全收——limp 进翻牌（甚至直接弃掉边缘牌）明显优于 raise。换一个对手：BB 是 nit（弃牌率约 70%），min-raise 的偷盲 EV = 0.7×1.5 − 0.3×1.5 = +0.6BB，此时 76s 也值得 raise。同一手 76s，跟注站面前 limp、nit 面前 raise——单挑 SB 的尺度与行动不是固定的，而是对 BB 防守频率的直接响应。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点："limp 是软弱行为、永远错误"是满员桌的教条，直接搬进单挑会持续损失 EV。单挑 SB 的 limp 拥有 GTO 依据：死钱赔率 25%、翻后按钮位不受影响、范围保护三合一。真正的错误不是 limp 本身，而是"limp 范围里没有强牌"——那才会被 BB 无脑 isolate。',
        },
        {
          type: 'pro-tip',
          content:
            'SB 开池速记三叠：raise 叠（JJ+、AK、A5s 等阻断牌）、limp 叠（中小对子、同花连张、弱同花 Ax）、弃牌叠（K8o 以下的垃圾）。每 50 手检查一次：你的 limp 叠里是否混入了足够强牌？BB 的 3-bet 是否正在把你赶出 raise 叠？两个答案决定下一轮的频率调整。',
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
          question: 'SB min-raise 到 2BB，假设被跟注或 3-bet 时 EV 为零，BB 弃牌率达到多少时 SB 用任意两张牌都自动盈利：',
          options: ['约 40%', '约 50%', '约 60%', '约 75%'],
          correctIndex: 1,
          explanation: '以 SB 直接弃牌为基准（0.5 已沉没）：f×1.5 = (1−f)×1.5 → f = 50% 保本。GTO 中 BB 实际只弃约 30%-40%，纯偷盲为负——开池价值在翻后。40%/60%/75% 均与推导不符。',
        },
        {
          id: 't3hu-sb-strategy-q3',
          question: '为什么单挑中 SB 的 limp 是 GTO 合理选项，而满员桌 SB 几乎从不 limp？',
          options: [
            '补 0.5 只需 25% 权益，且 limp 不会让 SB 丢失翻后按钮位——BB 在翻前最后行动，limp 后只能 check 或 raise',
            '单挑底池更小，limp 的损失可以忽略',
            'limp 之后 BB 不能再加注，SB 等于免费看翻牌',
            '满员桌规则禁止 SB 平跟',
          ],
          correctIndex: 0,
          explanation: '核心是结构差异：单挑 SB 已投的 0.5 是死钱（补 0.5 看 1.5 底池，赔率 25%），且 limp 不改变他翻后的按钮位；满员桌 SB 翻前倒数第二个行动，limp 后面对多人加注既失去位置又失去主动权。说 limp 之后 BB 不能加注、或 limp 能免费看翻牌，都与规则不符；其余选项忽略赔率结构。',
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
          explanation: 'BB 70% 的 isolate 频率意味着你的 limp 几乎必然被打：以 25% 的赔率看翻牌的计划落空，边缘牌被迫在 3-bet 底池里弃牌或勉强继续。正确调整是收窄 limp 叠、改用 min-raise 抢回主动权；继续 limp 是被剥削，增加 limp 是放大漏洞，4 倍尺度只会让 BB 弃掉弱牌留下强牌。',
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
        '理解单挑 BB 的赔率优势如何把满员桌的亏损位变成盈利位，并认识翻后无位置所需的补偿',
        '掌握 MDF 的计算，区分防守底线与最优防守频率，理解 60%+ 防守的数学依据',
        '学会跟注防守与 3-bet 防守的划分，掌握面对 SB limp 的 isolate 策略',
      ],
      content: [
        { type: 'heading', content: 'BB：单挑中最赚钱的位置' },
        {
          type: 'text',
          content:
            '满员桌的 BB 是长期亏损位：翻前最后行动是唯一的慰藉，翻后永远无位置让 85%-92% 的权益实现率成为常态。单挑的 BB 保留了翻前最后行动的权利，且自己已投的 1BB 成为死钱，跟注价格因此极低；但翻后最先说话的是 BB，SB 在翻后最后说话（按钮位）。所以单挑 BB 的盈利来自赔率与范围宽度，而不是翻后位置：BB 在翻前最后行动，却买不到翻后的位置，每街都要先表态，必须用 check-raise 杠杆与更宽的防守来补偿这段劣势。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.2 位置与权益；《Easy Game》Andrew Seidman Ch.4 位置）',
        },
        {
          type: 'formula',
          content:
            'BB 面对 SB 开池 3BB 的防守底线（MDF）：\n\n口径一（死钱口径）：SB 总投入 3BB 为风险、双方盲注 1.5BB 为奖池\nSB 自动盈利所需弃牌率 f* = 3 ÷ (1.5+3) = 3 ÷ 4.5 ≈ 66.7%\nBB 的最小防守频率 MDF = 1 − 66.7% ≈ 33.3%\n\n口径二（加注额口径）：SB 加注额 2.5BB、下注前底池 1.5BB\nMDF = 1 − 2.5 ÷ (1.5+2.5) = 1 − 2.5 ÷ 4 = 37.5%\n\n两种口径给出同一结论：BB 的防守底线约 33%-38%——低于这个频率，SB 用任意两张牌开池都自动盈利。（概念源自：《Applications of No-Limit Hold’em》Matthew Janda Ch.3 盲注博弈与 MDF；《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前赔率计算）',
        },
        {
          type: 'text',
          content:
            '但 MDF 只是"阻止自动盈利"的底线，不是最优防守频率。求解器中单挑 BB 面对 SB 开池的实际防守约 60%-70%（跟注约 35%-50% + 3-bet 约 15%-25%），远高于 33%-38% 的底线，原因有三：(1) 死钱——SB 的 0.5 让跟注价格便宜，面对 min-raise 只需再跟 1BB，所需胜率 = 跟注额 ÷（当前底池 + 对手下注 + 跟注额）= 1 ÷ (1.5 + 1.5 + 1) = 1 ÷ 4 = 25%（当前底池 1.5 里含 BB 自己已投的 1BB，它是死钱但仍在分母中，不可剔除）；同一结论可由 t2hu 的 EV(call) = E×(P+B) − (1−E)×B 复算：P = 对手总投入 2BB、B = 你的跟注额 1BB，令 EV=0 得 E = B ÷ (P + 2B) = 1 ÷ (2 + 2) = 25%；(2) SB 范围宽且弱——单挑 SB 开池约 80% 的手牌，BB 的弱牌对宽范围的胜率天然高，压过 25% 的跟注线并不困难；(3) MDF 模型把"继续"的 EV 记为零，可 BB 只要在翻后利用先行动权（check-raise 与 check-call）实现一部分权益，跟注就转为正 EV。代价也写在结构里：BB 在翻后 OOP，权益要打折实现，所以防守要比满员桌更宽才划得来。MDF 回答"最少防守多少"，死钱与对手范围回答"还能多防守多少"——单挑 BB 的 60%+ 是这两者之和。',
        },
        {
          type: 'key-point',
          content:
            '单挑 BB 的"60%+ 防守"是赔率换来的防守：你在翻前最后行动、且已投的盲注是死钱，用边缘牌跟注的代价远低于满员桌。把满员桌"BB 只能打紧"的直觉搬进单挑，等于把这条便宜的跟注线白白扔掉。',
        },
        { type: 'heading', content: '跟注 vs 3-bet：防守的两条腿' },
        {
          type: 'text',
          content:
            '面对 SB 开池，BB 的防守范围分两叠。跟注叠：中小对子（22-TT）、同花连张（65s 以上）、弱 A 同花（A2s-A9s）、弱 K 同花（K6s-K9s）——这些牌靠便宜的赔率与隐含赔率实现权益，跟注不摊牌也能赢。3-bet 叠分两层：价值层（JJ+、AK，对 SB 宽范围领先明显，打价值也压缩 SB 的偷盲频率）与诈唬层（A5s、A4s、K8s 等带阻断牌的组合——阻断 AA/KK/AK，让 SB 更难反加）。面对 3-bet，SB 要么 4Bet 要么弃牌，所以诈唬层必须选择"被 4Bet 可以干净弃牌"的牌。Gap Concept 在单挑 BB 的修正：满员桌跟注加注需要更强牌（Gap），但单挑 BB 已投 1BB 死钱、跟注价格极低，可以大幅突破 Gap——这就是 BB 防守 60%+ 与满员桌 BB 防守 25%-50% 的差距来源。（概念源自：《The Theory of Poker》David Sklansky Ch.2-3 Gap Concept；《Heads-Up No-Limit Hold’em》Collin Moshman Ch.3 翻前策略）',
        },
        {
          type: 'example',
          content:
            '实例：单挑 100BB 深，SB min-raise 到 2BB，你（BB）持 K♠7♠。K7s 是求解器 BB 跟注范围的典型边缘牌：跟注 1BB，跟注后总底池 = SB 2 + BB 已投 1 + 你的跟注 1 = 4BB，所需胜率 = 1 ÷ 4 = 25%（通式：跟注额 ÷（当前底池 1.5 + 对手下注 1.5 + 自己跟注 1））；K7s 对 SB 约 80% 的开池范围胜率约 48%——富余约 23 个百分点。翻后你先行动（OOP）：翻牌出 K 可薄价值，出同花/顺子听牌可便宜追，完全 miss 可放弃。弃牌等于放弃 25% 赔率下可争夺的 48% 权益——这是单挑 BB 最典型的错误：把满员桌"K7s 是烂牌"的记忆带进来。满员桌面对 UTG 开局 K7s 确实是弃牌，但单挑面对 SB 的 80% 范围，它是 +EV 的跟注。',
        },
        {
          type: 'example',
          content:
            '实例二（isolate）：SB limp（补 0.5 看翻牌），你（BB）持 A♠8♠，100BB 深，SB 面对加注弃牌约 55%。isolate 加注到 4BB：EV ≈ 0.55×1.5（对手弃牌赢死钱）+ 0.45×(+0.5)（被跟注后主动权与范围优势约 +0.5BB）≈ +1.05BB；而 check 的 EV 只有约 +0.7BB（底池小、让 SB 免费实现弱范围）。isolate 比 check 多赚约 0.35BB。但注意：isolate 不是偷盲——SB 的 limp 已经暴露弱范围，你的加注是在"惩罚弱范围 + 夺取主动权"，被跟注后 A8s 的摊牌价值让你翻后游刃有余。对手 limp-fold 频率越高，isolate 的频率就该越高。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：BB 防守 60%+ 不等于"跟注站"。真正的跟注站没有 3-bet 叠、没有隔离加注——而单挑 BB 的 60% 由跟注、3-bet 价值、3-bet 诈唬三部分构成，每一部分都随 SB 的倾向移动。防守的宽度与防守的被动是两回事。',
        },
        {
          type: 'pro-tip',
          content:
            'BB 防守速查三步：(1) 报底池赔率——SB 开池 2BB 时跟注线 25%（再跟 1BB ÷ 跟注后总池 4BB），3BB 时 33.3%（再跟 2BB ÷ 跟注后总池 6BB）；(2) 分叠——便宜赔率跟注叠、强成牌价值 3-bet、阻断牌诈唬 3-bet；(3) 看 SB——弃牌多的 SB 提高 3-bet 频率，limp 多的 SB 提高 isolate 频率，3-bet 多的 SB 收窄跟注叠。三步走完，60% 的防守就是有结构的选择，而不是"舍不得弃牌"。',
        },
      ],
      quiz: [
        {
          id: 't3hu-bb-defense-q1',
          question: '单挑中 BB 面对 SB 开池的典型防守频率约为：',
          options: ['15%-25%', '30%-40%', '60%-70%', '85%-95%'],
          correctIndex: 2,
          explanation: '求解器显示单挑 BB 防守约 60%-70%（跟注 35%-50% + 3-bet 15%-25%）。15%-25% 是满员桌面对紧位置的量级，85%-95% 是被动跟注站的量级，两者都不是 GTO 防守。',
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
            '因为 SB 的死钱把 BB 的跟注价格压得极低，而他对宽范围的权益高于此，跟注本身是正 EV',
            '因为 MDF 公式在翻前不适用',
            '因为 BB 必须阻止 SB 用任何牌偷盲',
          ],
          correctIndex: 1,
          explanation: 'MDF 只保证"阻止纯诈唬自动盈利"，而 BB 跟注的正 EV 来自 SB 的 0.5 死钱、SB 的宽范围，以及 BB 用翻后先行动权（check-raise）能实现的那部分权益——这些让他可以防守超过底线且仍然盈利；BB 翻后并无位置，这份代价要靠更宽的防守补偿。其余各项与发牌随机性、MDF 的适用范围或底线/最优的区分相矛盾。',
        },
        {
          id: 't3hu-bb-defense-q4',
          question: 'SB limp 后，你（BB）持 A♠8♠，SB 面对加注弃牌约 55%。最优行动是：',
          options: ['check，让翻牌免费开', 'isolate 加注到 4BB 左右', '加注到 10BB，最大限度施压', '直接弃牌'],
          correctIndex: 1,
          explanation: 'isolate 的 EV ≈ 0.55×1.5 + 0.45×0.5 ≈ +1.05BB，明显高于 check 的约 +0.7BB。加注到 10BB 是过度施压——SB 只会留下强牌跟注，你的 A8s 翻后胜率骤降；check 让 SB 免费实现弱范围；弃牌浪费了这条低价买来的摊牌价值。',
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
      subtitle: '翻后 BB 先行动的影响',
      duration: '12 min',
      eloDimension: 'postflop',
      objectives: [
        '理解单挑"位置反转"结构：SB 翻前最先表态、BB 在翻前最后行动；翻后由 BB 先行动、SB 在翻后最后行动',
        '掌握位置优势的街间衰减规律（river 位置价值最大）及其量化模型',
        '学会 OOP 的三大补偿工具（check 为主、check-raise、罕见 donk）与 IP 的应对',
      ],
      content: [
        { type: 'heading', content: '位置反转：单挑独有的身份互换' },
        {
          type: 'text',
          content:
            '满员桌的位置是"定额"：BTN 每手都最后行动，SB/BB 每手都无位置，位置属性终生不变。单挑的位置是"反转"的：BB 在翻前最后行动，翻后却最先表态（失去位置）；SB 恰好相反——翻前必须先行动，翻后最后行动并握着按钮位。每一手牌，翻前占便宜的人翻后还债，翻前被动的人翻后收租。这个反转是单挑最容易被忽视的结构事实：满员桌玩家初上单挑桌，往往还在用"我是 aggressor 我有主动权"的满员桌心态打翻后，结果被 SB 的位置优势反复收割。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.2 位置理论；《Easy Game》Andrew Seidman Ch.4 位置）',
        },
        {
          type: 'key-point',
          content:
            '位置反转的残酷面：BB 在翻前最后行动，却买不到翻后的位置。翻前你是最后表态的一方，翻后你才是 OOP——"主动权"只在翻牌圈之前属于你，翻牌一发，SB 的每个决策都比你晚一步。',
        },
        {
          type: 'formula',
          content:
            '位置优势的街间量化模型（limp 底池 2BB 起，每街半池下注+跟注）：\n\n底池序列：翻牌 2BB → 转牌 4BB → 河牌 8BB\n每街下注额：翻牌 1BB → 转牌 2BB → 河牌 4BB\n\n设位置带来"每街 5% 的决策优势"（信息优势 + 控池权折合）：\n翻牌贡献：1BB × 5% = 0.05BB\n转牌贡献：2BB × 5% = 0.10BB\n河牌贡献：4BB × 5% = 0.20BB\n位置总价值 ≈ 0.35BB/手，其中河牌占 0.20 ÷ 0.35 ≈ 57%\n\n结论：位置价值的一半以上在河牌兑现——"river 位置最大"不是口号，而是底池几何级数放大的数学必然。注意：T2 提到的位置价值 0.5-1BB/手 包含翻前位置优势的总量估计；本节的 0.35BB 仅量化翻后位置在保守假设下的街间分配，是前者的组成部分。（概念源自：《Heads-Up No-Limit Hold’em》Collin Moshman Ch.2 位置与权益；《Harrington on Hold’em》Dan Harrington Vol.1 Ch.5 位置与权益）',
        },
        {
          type: 'text',
          content:
            '为什么河牌位置价值最大？三条机制：(1) 底池最大——同样的 5% 决策优势，作用在 8BB 底池上的筹码当量是翻牌圈的 4 倍；(2) 范围最窄、信息最全——经过翻牌转牌两轮过滤，双方范围大幅收窄，最后行动者可以在最精确的读牌上做最终裁决；(3) 决策不可逆——河牌是最后一街，IP 可以"下注后被加注弃牌"，OOP 却要承受"过牌被偷、下注被加注"的两难。BTN 的机制在这里同样适用：单挑的 BTN 就是 SB，每手如此——这就是单挑 SB 能在翻后兑现更多权益的量化解释。',
        },
        {
          type: 'example',
          content:
            '实例：单挑 100BB 深，SB（按钮位）min-raise 到 2BB，BB 持 A♠Q♠ 跟注，底池 4BB。翻牌 K♥8♦3♣。位置反转的第一个镜头：BB 在翻前最后行动、拿到最便宜的跟注价，翻牌却要最先表态——SB 才是翻后有位置的一方。BB 过牌，SB 下注 2BB（半池，底池来到 6BB），BB 跟注后底池 8BB、投入 2BB，所需胜率 25%。这手 AQ 的权益：SB 在这张 K 高牌面的下注范围里 Kx 密度约 30%（这是教学锚点值；即便按 SB 约 80% 的开池范围整体估到约 20%，加权也只升到约 23%），无 K 时 AQ 靠 6 个高张 Outs 加后门花约有 27% 权益，有 K 时只剩约 6%——加权约 0.7×27% + 0.3×6% ≈ 21%，两种取值的 21%-23% 都在 25% 的跟注线之下，标准答案是弃牌。同一手 A♠Q♠ 若换到 SB 视角：他可以在 BB 过牌后下注半池拿下底池，也可以随后过牌免费看转牌，AQ 从"跟注线边缘的弃牌"变成"主动权的载体"。反转让同一手牌在两个位置差出近一个底池的价值。',
        },
        { type: 'heading', content: '补偿工具：OOP 的三大杠杆' },
        {
          type: 'text',
          content:
            'OOP 面对反转，靠三个工具补偿：(1) check 为主——OOP 的默认动作是把决策权交给 IP，用"过牌范围"隐藏牌的强度，SB 若随后过牌你就免费看牌；(2) check-raise（x/r）——OOP 范围中约 10%-15% 的决策选择 x/r，范围由坚果/超强牌 + 合适的诈唬（强听牌、阻断牌）构成，作用是压制 IP 的下注频率、保护 check-call 范围不被剥削；(3) donk bet——OOP 主动下注，求解器中罕见（约 2%-5% 的牌面结构），因为 donk 范围天然偏强、被加注时无法平衡，且放弃 x/r 杠杆；例外出现在 OOP 范围占优的特定牌面（如 SB limp 后击中 6♠5♦4♣ 的两对/顺子密度），此时 donk 保护权益反而是最优。记住：donk 是例外不是常态，满员桌新手最爱用 donk"保护牌"，在单挑中这是范围失衡的免费告示。（概念源自：《Modern Poker Theory》Michael Acevedo Ch.4 翻后玩法与 OOP 结构；《Harrington on Hold’em》Dan Harrington Vol.1 Ch.5 位置与权益）',
        },
        {
          type: 'example',
          content:
            '实例二（river 位置价值）：单挑盲注 0.5/1，翻前 SB min-raise 2BB、BB 跟注，底池 4BB。翻牌 Q♠8♦3♣，BB 过牌、SB 下注 2BB，底池 8BB。转牌 2♥，BB 过牌、SB 下注 4BB，底池 16BB。河牌 9♠，双方各持一张 Q 配 K 踢脚（如你持 K♦Q♦、对手持 K♥Q♥，顶对 Q + K 踢脚）。场景 A——你在 SB（有位置）：BB 过牌，你下注 1/3 池约 5BB 薄价值，被加注可以安全弃牌（BB 范围里的 88/33/99 都是合理加注），净赚约 5BB；场景 B——你在 BB（无位置）：你过牌，SB 下注 8BB，你的顶对沦为"跟注抓诈或弃牌"的二选一；你主动下注 8BB，被加注时顶对 Q 在 100BB 深局中很难弃。同一手牌、同一条下注线，IP 兑现 5BB 薄价值，OOP 只能被动响应——河牌 57% 的位置价值占比，在这里变成真金白银。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：翻前的 aggressor 虽然握着位置，却不能每条街都下注。SB 的持续下注（cbet）频率远低于满员桌 BTN，因为 BB 的防守范围极宽，SB 用整个宽范围进翻后时权益被"稀释"，而先表态的一方随时可以用 check-raise 反击。主动权的正确用法是"叙事权"，不是"必须下注权"：OOP 的 check 不是示弱，而是把球踢给 IP 再决定接不接。',
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
            'BB 翻前最后行动，翻后先行动；SB 翻前先行动，翻后最后行动',
            'SB 和 BB 每手交换按钮',
            '翻牌后由 BB 先下注',
            '位置优势在河牌自动消失',
          ],
          correctIndex: 0,
          explanation: '单挑中 BB 翻前最后行动（拿到翻前的价格与信息）、翻后先行动（无翻后位置），SB 恰好相反——这是单挑独有的位置反转。其余各项误解按钮规则、把翻后先表态的一方说反、或与"river 位置价值最大"矛盾。',
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
          question: '你（BB）用 K♠Q♠ 跟注 SB 的 min-raise，翻牌 K♦9♣3♠，SB（有位置）是 float 与加注频率都很高的激进玩家。最优倾向是：',
          options: [
            '2/3 池大注，立刻拿下底池',
            '混合 check 与约 1/3 池的领先小注，保留 check-raise 杠杆并控池',
            '100% check，永远让出主动权',
            '直接全下保护顶对',
          ],
          correctIndex: 1,
          explanation: 'OOP 面对 float 高手，大注成本极高（被加注只能弃牌）、all-in 过度、100% check 让范围透明可被剥削。混合 check 与小额领先下注：小注让边缘牌付费看牌，check 保留 x/r 杠杆，两者频率平衡让 IP 无法确定你的顶对强度——这正是 OOP 补偿工具的组合应用。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T4: 范围理论（单挑版）==========
