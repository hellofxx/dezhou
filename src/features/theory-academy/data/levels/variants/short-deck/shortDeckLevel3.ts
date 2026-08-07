import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { shortDeckRules } from '../variantRules';

const variant: PokerVariant = 'short-deck';

export const SHORT_DECK_LEVEL_3: TheoryLevelInfo = {
  id: 't3sd',
  level: 3,
  tier: 'basic',
  title: '短牌起手牌策略',
  description: '理解短牌起手牌强度重排与位置价值',
  icon: '♦️',
  variant,
  unlockRequirement: '完成 T2SD 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l3sd-intro', title: '短牌德州入门' },
      { id: 'l4sd-preflop-ranges', title: '短牌翻前范围' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't3sd-rankings',
      level: 3,
      order: 1,
      title: '起手牌重排',
      subtitle: 'AKo 在短牌中的真实强度',
      duration: '12 min',
      eloDimension: 'handReading',
      objectives: [
        '理解短牌起手牌强度的根本重排：口袋对 > 任何 A-K、AK 最强非对子',
        '掌握 AK 与口袋对、同花连牌在短牌中的相对价值变化',
        '学会根据重排后的起手牌强度调整翻前策略',
      ],
      content: [
        { type: 'heading', content: '短牌起手牌：强度被重新洗牌' },
        {
          type: 'text',
          content:
            '短牌起手牌强度与标准德州有根本差异，源于两个规则变化：(1) 牌型重排——三条 > 顺子、同花 > 葫芦；(2) 对子密度——口袋对占起手牌比例从 5.9% 升至 8.6%。这导致：口袋对价值上升（更容易中三条、且三条是最强成牌之一），而 AK 等大高张的相对价值变化微妙。',
        },
        {
          type: 'key-point',
          content: '短牌起手牌铁律：任何口袋对 > 任何 A-K。AK 是"最强非对子"，但不击败对子。AA/KK 仍是顶级，但小对子的价值因三条牌级上升而提升。',
        },
        { type: 'heading', content: 'AK 与口袋对的短牌对比' },
        {
          type: 'formula',
          content:
            '短牌 AK 与口袋对的翻前全下对比（36 张牌组）：\n\nAK 对任意口袋对（如 22）：约 43%-45% 胜率（AK 落后）\nAK 对 AK（同牌）：约 50%（分池/撞花）\nAK 对 KK：约 25%（KK 压制）\n\n口袋对价值提升原因：\n1. 短牌中三条 > 顺子，中三条后是极强成牌\n2. 对子密度高，翻牌中三条概率更高（约 17.6%）\n3. 大对子（AA/KK）压制 AK 更容易\n\nAK 的价值：仍是压制其他非对子的最强牌，且翻后能中顶对。（概念源自：《Short Deck Poker》起手牌强度与 6+ 规则）',
        },
        {
          type: 'text',
          content:
            '短牌起手牌重排的实践含义：翻前全下时，AK 对口袋对通常落后（43%-45%），所以"AK 全下 vs 对子"不再是标准德州的"翻硬币偏上"。同时，同花连牌（JTs、98s）因为顺子/同花成牌价值高，可玩性好，但属于次级梯队——它们能赢大锅（成坚果），但翻前强度不如对子与 AK。',
        },
        {
          type: 'example',
          content:
            '实例：短牌你持 A♠K♠，翻前对手 3Bet 全下。你的牌是"最强非对子"，但面对口袋对（如 88）约 44% 胜率。决策取决于底池赔率：若需要 45% 胜率而你有 44%，边缘弃牌；若只需 40%，跟注 +EV。关键是用短牌修正后的胜率（AK vs 对子 43%-45%）而非满员桌的 43% 直觉。',
        },
        {
          type: 'example',
          content:
            '实例二（小对子价值）：短牌你持 7♠7♦，翻前面对对手加注。短牌中 77 中三条概率约 17.6%（满员桌 12%），且三条是短牌强成牌（只输葫芦/同花）。所以小对子（22-77）在短牌中的价值显著提升——set mining 虽需更高门槛（T2），但中牌后的强度与频率都支持更多跟注。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌中"AK 很强"需要正确理解。AK 压制所有非对子、翻后能中顶对，但翻前全下对任何口袋对都落后。把满员桌"AK 翻硬币偏上"的记忆搬进短牌，会高估 AK 的翻前价值。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌起手速记：AA/KK 顶级、其他对子次之（三条价值高）、AK 最强非对子、同花连牌（JTs+）可玩性好但次级。翻前全下时，对子 vs AK 用"43%-45%"而非满员桌直觉。',
        },
      ],
      quiz: [
        {
          id: 't3sd-rankings-q1',
          question: '短牌中 AK 与口袋对的翻前全下胜率约为：',
          options: ['约 55%', '约 43%-45%', '约 70%', '约 35%'],
          correctIndex: 1,
          explanation: '短牌 AK 对任意口袋对约 43%-45%，通常落后。AK 是"最强非对子"但不击败对子。',
        },
        {
          id: 't3sd-rankings-q2',
          question: '短牌起手牌强度的根本重排是：',
          options: [
            'AK 最强',
            '任何口袋对 > 任何 A-K',
            '同花连牌最强',
            '没有变化',
          ],
          correctIndex: 1,
          explanation: '短牌任何口袋对 > 任何 A-K（因三条牌级上升、对子密度高）。AK 是最强非对子。',
        },
        {
          id: 't3sd-rankings-q3',
          question: '短牌中 AK 对 KK 的胜率约为：',
          options: ['约 43%', '约 25%', '约 55%', '约 35%'],
          correctIndex: 1,
          explanation: 'AK 对 KK 约 25%，KK 压制 AK 更容易（短牌牌型与对子价值）。',
        },
        {
          id: 't3sd-rankings-q4',
          question: '短牌中小对子价值提升的原因是：',
          options: [
            '小对子更常见',
            '三条牌级上升且中三条概率更高（约 17.6%）',
            '小对子能成顺子',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '短牌三条 > 顺子，且中三条概率约 17.6%（满员桌 12%），小对子价值显著提升。',
        },
        {
          id: 't3sd-rankings-q5',
          question: '短牌中同花连牌（JTs）的定位是：',
          options: [
            '顶级梯队',
            '可玩性好但次级，能赢大锅但翻前强度不如对子与 AK',
            '完全没用',
            '最强起手牌',
          ],
          correctIndex: 1,
          explanation: '同花连牌短牌可玩性好（成顺子/同花价值高），但属于次级梯队，翻前强度不如对子与 AK。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
    {
      id: 't3sd-suitedness',
      level: 3,
      order: 2,
      title: '同花价值提升',
      subtitle: '短牌中同花连子的崛起',
      duration: '10 min',
      eloDimension: 'preflop',
      objectives: [
        '理解短牌同花价值提升的根本原因（同花 beats 葫芦）',
        '掌握同花连牌与同花 Ax 在短牌中的可玩性与策略地位',
        '学会利用同花价值提升优化翻前范围与翻后决策',
      ],
      content: [
        { type: 'heading', content: '短牌：同花的崛起' },
        {
          type: 'text',
          content:
            '短牌中同花 beats 葫芦，这是与标准德州（葫芦 > 同花）的根本差异。同花的相对价值大幅提升，成为短牌最顶级的成牌之一。这改变了起手牌策略：同花连牌（JTs、98s 等）与同花 Ax 的可玩性显著增强——它们既能成同花（坚果级），又能成顺子。',
        },
        {
          type: 'key-point',
          content: '短牌同花铁律：同花 beats 葫芦，是顶级成牌。所以"同花牌"在短牌中的价值远超满员桌——追同花听牌的隐含赔率极佳，成牌后基本锁定大底池。',
        },
        { type: 'heading', content: '同花连牌的可玩性分析' },
        {
          type: 'formula',
          content:
            '短牌同花连牌（如 JTs）的翻前胜率对比（面对随机范围）：\n\nJTs：约 42%-44%\n98s：约 40%-42%\n76s：约 38%-40%\n\n对比满员桌同牌略低（因对子密度高），但短牌成牌价值高：\n1. 成同花（beats 葫芦）→ 坚果级\n2. 成顺子（约 8 个点数的连接）→ 强牌\n\n隐含赔率极佳：深筹码下追同花/顺子的回报极高。\n\n策略地位：同花连牌可玩性好，但不属顶级梯队（AA/KK/QQ/JJ/AK 才是），翻前遇到强阻力要懂得收手。（概念源自：《Short Deck Poker》同花价值与 6+ 起手牌）',
        },
        {
          type: 'text',
          content:
            '短牌同花 Ax 的价值同样提升：A♠K♠、A♠Q♠ 等既能成同花（beats 葫芦）又能中顶对 A，且 A 高作为阻断牌。但要注意——同花 Ax 的价值来自"同花听牌的坚果潜力 + 顶对"，而非"AX 本身"，因为短牌对子密度高、Ax 被对子压制的概率更大。',
        },
        {
          type: 'example',
          content:
            '实例：短牌你持 J♠T♠，翻前面对 BTN 加注。JTs 在短牌中可玩性好：翻牌能成同花听牌（价值高）、顺子听牌、或中顶对。虽然翻前强度不如对子，但翻后成牌潜力大。深筹码下应积极跟注或 3Bet 半诈唬，利用同花价值提升的隐含赔率。',
        },
        {
          type: 'example',
          content:
            '实例二（同花追注）：短牌你持 A♥9♥，翻牌 K♥8♦3♣。你听同花（已见 A♥9♥K♥ = 3 张红心，同花 outs = 9 − 3 = 6）。对手下注，你跟注。若转牌成红心，你的同花是坚果级（beats 葫芦），能榨取大量筹码。短牌同花听牌虽 outs 少（6 个），但成牌后价值极高，追注的隐含赔率极佳。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌同花连牌"可玩性好"不等于"顶级强牌"。它们能赢大锅（成坚果同花/顺子），但翻前强度不如对子与 AK。把它当成"高回报的投机牌"而非"稳定价值牌"，才能正确使用。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌同花速记：同花 beats 葫芦 → 追同花听牌价值极高；JTs 及以上同花连牌可玩性好；同花 Ax 兼具坚果潜力与顶对。翻前遇到强阻力（大 3Bet）时，同花连牌应懂得收手——它们是投机牌。',
        },
      ],
      quiz: [
        {
          id: 't3sd-suitedness-q1',
          question: '短牌同花 beats 葫芦，这意味着：',
          options: [
            '同花价值下降',
            '同花是顶级成牌，追同花听牌隐含赔率极佳',
            '同花只压过顺子',
            '没有变化',
          ],
          correctIndex: 1,
          explanation: '短牌同花 > 葫芦，同花是顶级成牌，追同花听牌的隐含赔率极佳，成牌后基本锁定大底池。',
        },
        {
          id: 't3sd-suitedness-q2',
          question: '短牌中 JTs 的定位是：',
          options: [
            '顶级强牌',
            '可玩性好但次级，高回报投机牌',
            '完全没用',
            '最强起手牌',
          ],
          correctIndex: 1,
          explanation: 'JTs 能成坚果同花/顺子（高回报），但翻前强度不如对子与 AK，属于次级投机牌。',
        },
        {
          id: 't3sd-suitedness-q3',
          question: '短牌同花 Ax 的价值主要来自：',
          options: [
            'AX 本身很强',
            '同花听牌的坚果潜力 + 顶对 A',
            'Ax 能击败对子',
            '没有价值',
          ],
          correctIndex: 1,
          explanation: '短牌同花 Ax 价值来自"同花听牌坚果潜力 + 顶对 A"，而非 Ax 本身——对子密度高，Ax 被压制概率大。',
        },
        {
          id: 't3sd-suitedness-q4',
          question: '短牌中 A♥9♥ 在 K♥8♦3♣ 面的同花 outs 为：',
          options: ['9', '6', '5', '4'],
          correctIndex: 1,
          explanation: '已见红心 A♥9♥K♥ = 3 张，同花 outs = 9 − 3 = 6。',
        },
        {
          id: 't3sd-suitedness-q5',
          question: '短牌同花连牌面对大 3Bet 时的正确态度是：',
          options: [
            '无脑跟注',
            '懂得收手，它们是投机牌',
            '永远全下',
            '只玩同花连牌',
          ],
          correctIndex: 1,
          explanation: '同花连牌是投机牌，面对大 3Bet 的强阻力应收手，不属顶级梯队。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
    {
      id: 't3sd-position',
      level: 3,
      order: 3,
      title: '位置调整',
      subtitle: '位置对短牌策略的影响',
      duration: '12 min',
      eloDimension: 'postflop',
      objectives: [
        '理解位置价值在短牌中的放大（听牌密度高、决策更频繁）',
        '掌握 BTN 位置优势在短牌中的利用与 BB 位置的防守调整',
        '学会用位置优势补偿短牌的高波动风险',
      ],
      content: [
        { type: 'heading', content: '短牌位置：价值被放大' },
        {
          type: 'text',
          content:
            '短牌中位置价值被放大，因为听牌密度高、决策更频繁、底池更大。有位置（BTN/IP）意味着你能看到对手行动后再决定，能更便宜地实现权益，能控制底池大小。无位置（BB/OOP）在短牌中更吃亏——听牌多、容易被反超，被迫做更多艰难决策。',
        },
        {
          type: 'key-point',
          content: '短牌位置铁律：BTN 有位置时用更多听牌追注（能便宜实现权益）；BB 无位置时收紧边缘跟注，避免高 RIO 处境。位置在短牌中既是优势也是风险调节器。',
        },
        { type: 'heading', content: 'BTN 与 BB 的短牌位置策略' },
        {
          type: 'text',
          content:
            'BTN（IP）在短牌中的策略：可以更激进地开池、更宽地追听牌——因为位置让你能实现权益、控制底池。BB（OOP）在短牌中的策略：面对 BTN 的宽开池，防守范围要合理，但边缘听牌（易被反超）要控池，避免 RIO。短牌无位置时的核心是"控池 + 及时止损"。',
        },
        {
          type: 'example',
          content:
            '实例：短牌你在 BTN 持 7♠8♠，翻牌 9♦6♣2♥（两头顺听牌）。你 IP 下注或跟注都能便宜实现权益——转牌中 5/T 成顺，中不了可以免费看河牌或弃牌。若你在 BB（OOP）持同样牌，先行动、被加注时进退两难。位置让同一手听牌的价值完全不同。',
        },
        {
          type: 'example',
          content:
            '实例二（OOP 控池）：短牌你在 BB 持 Q♦J♦，翻牌 Q♣9♦8♠（顶对 + 卡顺）。你 OOP 先行动。顶对在湿润面 RIO 高，且你无位置难实现权益。正确做法是控池（小注或过牌），避免建立大底池后被顺子/同花反超。IP 的 BTN 则可以利用位置薄价值。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌无位置时，"激进下注抢主动权"可能适得其反。因为听牌密度高、你 OOP 先行动，激进容易建立大底池后陷入高 RIO 处境。位置在短牌中更多是"控池与止损"的工具，而非无脑进攻。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌位置速记：BTN/IP → 宽开池 + 积极追听牌（便宜实现权益）；BB/OOP → 收紧跟注 + 控池止损（避免 RIO）。每手牌先问"我有位置吗"，再决定激进还是控池。',
        },
      ],
      quiz: [
        {
          id: 't3sd-position-q1',
          question: '短牌中位置价值被放大的原因是：',
          options: [
            '底池更小',
            '听牌密度高、决策更频繁、底池更大',
            '位置规则不同',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '短牌听牌密度高、决策频繁、底池大，位置（能看到行动、控制底池）的价值被放大。',
        },
        {
          id: 't3sd-position-q2',
          question: 'BTN（IP）在短牌中追听牌的策略倾向是：',
          options: [
            '收紧跟注',
            '积极追注，因为能便宜实现权益',
            '永远弃牌',
            '只玩坚果',
          ],
          correctIndex: 1,
          explanation: 'BTN/IP 有位置，能便宜实现权益，可以更积极地追听牌。',
        },
        {
          id: 't3sd-position-q3',
          question: 'BB（OOP）在短牌中持顶对湿润面的正确做法是：',
          options: [
            '激进下注抢主动权',
            '控池止损，避免高 RIO',
            '直接全下',
            '立即弃牌',
          ],
          correctIndex: 1,
          explanation: 'OOP 顶对湿润面 RIO 高且难实现权益，应控池止损。激进易建立大底池后被反超。',
        },
        {
          id: 't3sd-position-q4',
          question: '同一手两头顺听牌，IP 与 OOP 的价值差异在于：',
          options: [
            '没有差异',
            'IP 能便宜实现权益、控制底池，OOP 先行动易进退两难',
            'OOP 更好',
            '牌会发得不同',
          ],
          correctIndex: 1,
          explanation: 'IP 能便宜实现权益（中牌收、不中弃/看免费），OOP 先行动被加注时进退两难。',
        },
        {
          id: 't3sd-position-q5',
          question: '短牌无位置时的核心策略是：',
          options: [
            '控池 + 及时止损',
            '无脑激进',
            '永远全下',
            '只玩强牌',
          ],
          correctIndex: 0,
          explanation: '短牌 OOP 的核心是控池止损，避免高 RIO 处境，而非无脑进攻。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
  ],
};

// ========== T4: 范围理论（短牌版）==========
