import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { shortDeckRules } from '../variantRules';

const variant: PokerVariant = 'short-deck';

export const SHORT_DECK_LEVEL_4: TheoryLevelInfo = {
  id: 't4sd',
  level: 4,
  tier: 'intermediate',
  title: '短牌范围构建',
  description: '构建适应短牌特性的范围结构',
  icon: '♦️',
  variant,
  unlockRequirement: '完成 T3SD 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l4sd-preflop-ranges', title: '短牌翻前范围' },
      { id: 'l4sd-blocker-bluff', title: '阻断牌诈唬' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't4sd-range-construction',
      level: 4,
      order: 1,
      title: '范围组成',
      subtitle: '短牌范围的强度分布特征',
      duration: '15 min',
      eloDimension: 'handReading',
      objectives: [
        '理解短牌范围构建与标准德州的结构差异（对子密度高、同花价值提升）',
        '掌握短牌翻前/翻后范围的价值分布特征与极化策略',
        '学会根据短牌特有起手牌强度构建有效范围',
      ],
      content: [
        { type: 'heading', content: '短牌范围：结构不同，逻辑相通' },
        {
          type: 'text',
          content:
            '范围构建的基本逻辑在短牌中不变（按牌力分价值/中等/诈唬），但结构有差异：短牌对子密度高（8.6% vs 5.9%）、同花价值提升、AK 与对子关系微妙。这导致短牌范围中"对子与同花牌"的比重上升，而"纯大高张（非同花 AK/AQ）"的相对价值下降。',
        },
        {
          type: 'key-point',
          content: '短牌范围特征：对子与同花牌更值钱，非同花大高张相对降值。构建范围时，把更多组合配给对子/同花连牌，减少对"AX 非同花"的依赖。',
        },
        { type: 'heading', content: '短牌范围的价值分布' },
        {
          type: 'formula',
          content:
            '短牌翻前范围的价值分层（相对标准德州调整）：\n\n顶级：AA / KK / QQ（对子价值高，压制 AK）\n次级价值：JJ-TT / AK（最强非对子）/ 大对子\n投机层：99-22（set mining，三条价值高）/ 同花连牌 JTs+/ 同花 Ax\n\n对比标准德州：\n标准德州 AK 是次级价值偏上，短牌 AK 仍是次级但低于对子\n标准德州同花连牌投机层，短牌因同花价值提升仍投机但回报更高\n\n极化策略：短牌下注范围更极化（坚果对子 + 同花听牌/诈唬），因为听牌密度高、成牌价值大。（概念源自：《Short Deck Poker》范围构建与 6+ 结构）',
        },
        {
          type: 'text',
          content:
            '短牌范围的实践差异：因为听牌密度高、成牌价值大（同花/顺子），短牌范围可以更"极化"——用强成牌（对子/两对/同花）下注价值，用强听牌（同花/顺子听牌）半诈唬，中间牌过牌控池。标准德州中一些"中等牌"在短牌中因 RIO 高而更适合过牌。',
        },
        {
          type: 'example',
          content:
            '实例：短牌翻前 BTN 开池，你（BB）持 T♠9♠。T9s 在短牌范围中属投机层：能成同花（beats 葫芦）与顺子。翻后若中听牌可积极追注。若持 A♠K♦（非同花），则属次级价值——能中顶对，但翻牌对子密度高，顶对价值不如标准德州。',
        },
        {
          type: 'example',
          content:
            '实例二（极化范围）：短牌翻牌 8♦7♣3♠，你（BTN IP）持两对（87）与同花听牌（A♥9♥）。两对下注价值（虽然短牌两对非坚果但强），同花听牌半诈唬。中间牌（如 99）在湿润面 RIO 高，更适合过牌控池。短牌范围极化让对手难以应对。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌范围更极化不等于"更激进到失控"。极化是把"价值/诈唬"做强、把"中等牌"过牌——因为中等牌在短牌湿润面 RIO 高。范围的"两个极端"都强，中间真空，才能让对手难以应对。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌范围速记：顶级对子 + 次级 AK + 投机对子/同花连牌。下注范围极化（价值对子 + 半诈唬听牌），中等牌过牌控池。每手牌先按"我的范围在哪些牌面占优"构建下注/过牌比例。',
        },
      ],
      quiz: [
        {
          id: 't4sd-range-construction-q1',
          question: '短牌范围构建与标准德州的结构差异主要是：',
          options: [
            '没有差异',
            '对子密度高、同花价值提升、非同花大高张相对降值',
            '范围更窄',
            '只玩同花',
          ],
          correctIndex: 1,
          explanation: '短牌对子密度高（8.6%）、同花价值提升，非同花大高张相对降值，范围结构不同。',
        },
        {
          id: 't4sd-range-construction-q2',
          question: '短牌翻前范围中，投机层主要包括：',
          options: [
            'AA/KK',
            '99-22 对子 + 同花连牌 JTs+ + 同花 Ax',
            '非同花 AK/AQ',
            '72o 等垃圾',
          ],
          correctIndex: 1,
          explanation: '短牌投机层是小对子（set mining）+ 同花连牌 + 同花 Ax，利用三条与同花价值。',
        },
        {
          id: 't4sd-range-construction-q3',
          question: '短牌下注范围更"极化"的原因是：',
          options: [
            '底池更大',
            '听牌密度高、成牌价值大，中等牌 RIO 高更适合过牌',
            '范围更窄',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '短牌听牌密度高、成牌价值大，下注范围用价值对子 + 半诈唬听牌，中等牌因 RIO 高而过牌。',
        },
        {
          id: 't4sd-range-construction-q4',
          question: '短牌翻牌 8♦7♣3♠，持中间牌（99）的正确做法是：',
          options: [
            '价值下注',
            '过牌控池，湿润面 RIO 高',
            '直接全下',
            '诈唬',
          ],
          correctIndex: 1,
          explanation: '短牌湿润面中等牌（99）RIO 高，更适合过牌控池，而非价值下注。',
        },
        {
          id: 't4sd-range-construction-q5',
          question: '短牌中非同花 AK 的相对价值比标准德州：',
          options: [
            '更高',
            '下降（对子密度高，顶对价值不如标准德州）',
            '不变',
            '完全没用',
          ],
          correctIndex: 1,
          explanation: '短牌对子密度高，非同花 AK 的顶对价值下降，相对降值。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
    {
      id: 't4sd-equity',
      level: 4,
      order: 2,
      title: '权益共享',
      subtitle: '短牌多路池的权益稀释',
      duration: '12 min',
      eloDimension: 'math',
      objectives: [
        '理解短牌多路底池中权益（Equity）被稀释的机制',
        '掌握短牌多人池中听牌与成牌的权益分配差异',
        '学会在短牌多路池中调整下注与跟注决策',
      ],
      content: [
        { type: 'heading', content: '多路池：短牌的权益稀释' },
        {
          type: 'text',
          content:
            '短牌虽然有 6 人桌、但听牌密度高，多人进池时权益（Equity）被显著稀释。多路底池中，你的顶对/两对面对多个对手的听牌，胜率被瓜分；同花/顺子听牌的"某张 Outs 给另一个对手送更强牌"的风险上升。理解权益稀释，是短牌多人池决策的基础。',
        },
        {
          type: 'key-point',
          content: '短牌多路池权益铁律：每多一个对手，你的成牌权益被稀释。顶对/两对在多人池价值下降，听牌的"干净度"下降（可能送更强牌）——多路池要收紧、控池。',
        },
        { type: 'heading', content: '权益稀释的数学' },
        {
          type: 'formula',
          content:
            '多人池权益稀释示例（短牌）：\n\n单挑：你持顶对，对手范围单一，你的胜率约 60%-70%\n三人池：再加一个对手，你的顶对胜率可能跌到 35%-45%\n\n听牌 Outs 的"干净度"：\n多人池中，你的同花听牌 Outs 若被其他对手持有/成更大同花，价值下降\n\n权益总和：单挑 U₁+U₂=100%，三人 U₁+U₂+U₃=100%\n你的份额随对手数下降\n\n结论：多路池中，成牌（顶对/两对）的薄价值被稀释，听牌的反向隐含赔率上升。（概念源自：《Short Deck Poker》多人池权益与 6+ 数学）',
        },
        {
          type: 'text',
          content:
            '短牌多人池的实践：因为短牌底池通常大、进池率高，多人池更常见。多路池中应：(1) 收紧边缘跟注（顶对弱踢脚价值被稀释）；(2) 快打强牌（避免给多个对手免费追听）；(3) 听牌追注要更谨慎（Outs 干净度下降、RIO 上升）。',
        },
        {
          type: 'example',
          content:
            '实例：短牌你持 A♠K♠，翻牌 A♦J♣8♥（顶对顶踢脚），三人池。你中顶对 A 但有两个对手。你的顶对在单挑是强牌（约 65%），三人池可能跌到 40%。一个对手持 J、另一个持 8 或听牌，都可能超越你。正确做法是下注保护（快打），但意识到底池越大、你的薄价值越被稀释，转牌河牌要及时控池或评估。',
        },
        {
          type: 'example',
          content:
            '实例二（听牌 RIO）：短牌你持 7♥8♥，翻牌 9♦6♣3♠，你听两头顺（5/T），三人池。你的顺子听牌 Outs 在多人池中被"稀释"：若一个对手也听 5/T，你们分池或他成更大顺子。且转牌若对手中两对/三条，你的顺子也可能输给更大的牌。多人池追听要更谨慎。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌多路池中，"我有强听牌就追"可能变成送钱。因为 Outs 干净度下降（可能送更强牌）、RIO 上升，你的听牌权益被多人瓜分。多人池是"快打强牌 + 收紧追听"的场合，而非"激进追听"。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌多路池速记：每多一个对手，权益稀释约 10%-20%。单挑 60% 的顶对，三人池约 40%。多路池：快打强牌保护、收紧边缘跟注、听牌追注看 Outs 干净度。',
        },
      ],
      quiz: [
        {
          id: 't4sd-equity-q1',
          question: '短牌多路池中权益被稀释的主要表现是：',
          options: [
            '权益变多',
            '顶对/两对胜率被多人瓜分，听牌 Outs 干净度下降',
            '没有变化',
            '听牌更强',
          ],
          correctIndex: 1,
          explanation: '多路池中顶对/两对胜率被多人瓜分，听牌 Outs 可能送更强牌（干净度下降）。',
        },
        {
          id: 't4sd-equity-q2',
          question: '单挑顶对胜率约 65%，三人池可能跌到：',
          options: ['约 60%', '约 35%-45%', '约 70%', '约 90%'],
          correctIndex: 1,
          explanation: '每多一个对手权益被稀释，三人池顶对胜率可能跌到 35%-45%。',
        },
        {
          id: 't4sd-equity-q3',
          question: '短牌多路池中，强牌的正确处理是：',
          options: [
            '慢玩',
            '快打下注保护，避免给多个对手免费追听',
            '立即弃牌',
            '过牌',
          ],
          correctIndex: 1,
          explanation: '多路池中多个对手可能追听，强牌应快打下注保护，避免免费被追。',
        },
        {
          id: 't4sd-equity-q4',
          question: '短牌多人池中追听牌要更谨慎的原因是：',
          options: [
            '听牌更强',
            'Outs 干净度下降（可能送更强牌）、RIO 上升',
            '底池更小',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '多人池听牌 Outs 可能给其他对手送更强牌，反向隐含赔率上升，追听要更谨慎。',
        },
        {
          id: 't4sd-equity-q5',
          question: '短牌多路池中，边缘顶对弱踢脚的正确做法是：',
          options: [
            '无脑价值下注',
            '收紧或控池，薄价值被稀释',
            '直接全下',
            '永远弃牌',
          ],
          correctIndex: 1,
          explanation: '多路池中顶对弱踢脚的薄价值被稀释，应收紧或控池。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
    {
      id: 't4sd-blockers',
      level: 4,
      order: 3,
      title: '挡牌效应',
      subtitle: '利用短牌特性读牌',
      duration: '10 min',
      eloDimension: 'handReading',
      objectives: [
        '理解挡牌（Blocker）在短牌中的特殊应用（对子密度高、同花价值大）',
        '掌握短牌中阻断同花/对子的挡牌价值',
        '学会用挡牌优化短牌诈唬与跟注决策',
      ],
      content: [
        { type: 'heading', content: '短牌挡牌：读牌的新维度' },
        {
          type: 'text',
          content:
            '挡牌（Blocker）指你持有的牌减少对手特定组合数。短牌中挡牌有特殊价值：因为同花价值极高（beats 葫芦）且对子密度高，阻断对手的同花/对子组合对诈唬与跟注决策影响更大。你持 A♥ 时，对手的 A♥X♥ 坚果同花被完全阻断——这在短牌中价值极高。',
        },
        {
          type: 'key-point',
          content: '短牌挡牌铁律：持 A 高阻断坚果同花（对手 A♥X♥ 组合为 0）；持对子阻断对手的对子。短牌同花/对子价值高，阻断它们对诈唬成功率影响巨大。',
        },
        { type: 'heading', content: '短牌挡牌的三重应用' },
        {
          type: 'text',
          content:
            '短牌挡牌三重价值：(1) 阻断同花——持 A♠ 时对手 A♠X♠ 坚果同花为 0，诈唬成功率上升；(2) 阻断对子——持 K 时对手 KK 从 6 种减到 3 种；(3) 价值解封——不持某花色时对手更可能有同花跟你，价值下注被支付。短牌因同花/对子价值高，这些阻断效果被放大。',
        },
        {
          type: 'example',
          content:
            '实例：短牌翻牌三张黑桃 K♠9♠4♠，你持 A♦A♣（无黑桃 A）。你不阻断任何同花，对手可能有 A♠X♠ 坚果同花或更小同花。你的 AA 抓诈唬价值下降，倾向弃牌。相反，若你持 A♠（无黑桃成牌），你阻断了坚果同花 A♠X♠ 全部组合，对手"最强牌"被证伪——你的诈唬或跟注成功率上升。',
        },
        {
          type: 'example',
          content:
            '实例二（翻前阻断）：短牌你（BB）面对 SB 开池，考虑 3Bet 诈唬。持 A♦5♦ 与 7♦6♦ 的区别：A5s 的 A 阻断对手的 AA 与 AK（顶级强牌变少，被 4Bet 概率下降），且被 4Bet 后 A5s 可干净弃牌；76s 不阻断任何强牌，被 4Bet 时更常撞上 QQ+。短牌中对子密度高，A 高阻断价值更明显。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌挡牌是边际工具，不是万能钥匙。持 A♠ 诈唬成功率上升，但不保证成功；用它推翻基础范围分析是滥用。挡牌在短牌中价值大（因同花/对子价值高），但仍是"基础范围对了之后"的锦上添花。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌挡牌速记：三张同花面持 A♠ → 阻断坚果同花，诈唬/跟注加分；持对子 → 阻断对手对子。离桌练习：随机摆三张同花面，数"对手坚果同花"在你持 A♠ 与不持时的差异，熟练后实战 10 秒判断。',
        },
      ],
      quiz: [
        {
          id: 't4sd-blockers-q1',
          question: '短牌中挡牌的特殊价值源于：',
          options: [
            '底池更大',
            '同花价值极高（beats 葫芦）且对子密度高',
            '牌发得慢',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '短牌同花价值极高（beats 葫芦）、对子密度高，阻断同花/对子的挡牌效果被放大。',
        },
        {
          id: 't4sd-blockers-q2',
          question: '三张黑桃面持 A♠，对对手坚果同花组合的影响是：',
          options: [
            '无影响',
            '完全阻断（对手 A♠X♠ 为 0），诈唬成功率上升',
            '增加对手组合',
            '让对手更强',
          ],
          correctIndex: 1,
          explanation: '持 A♠ 使对手 A♠X♠ 坚果同花组合数为 0，最强的跟注/反加牌被削减，诈唬成功率上升。',
        },
        {
          id: 't4sd-blockers-q3',
          question: '翻前 3Bet 诈唬，为什么 A5s 优于 76s？',
          options: [
            'A5s 阻断 AA/AK，被 4Bet 概率下降',
            '76s 阻断更多强牌',
            'A5s 牌力更强',
            '没有区别',
          ],
          correctIndex: 0,
          explanation: 'A5s 的 A 阻断对手 AA/AK，降低被 4Bet 频率；76s 不阻断强牌，撞上 QQ+ 概率更高。',
        },
        {
          id: 't4sd-blockers-q4',
          question: '短牌中挡牌的适用边界是：',
          options: [
            '可以推翻任何基础分析',
            '是边缘局面的边际工具，需建立在正确基础范围之上',
            '只在翻前有效',
            '只用于跟注',
          ],
          correctIndex: 1,
          explanation: '挡牌调整组合比例而非改写范围，基础范围正确时锦上添花，基础错误时无法救你。',
        },
        {
          id: 't4sd-blockers-q5',
          question: '三张黑桃面持 A♦A♣（无黑桃 A），面对对手下注的正确倾向是：',
          options: [
            '无脑跟注',
            '谨慎——不阻断同花，对手跟注范围偏强',
            '加注诈唬',
            '直接全下',
          ],
          correctIndex: 1,
          explanation: '不持 A♠ 时你不阻断同花，对手可能拿 A♠X♠ 坚果或更小同花，抓诈唬价值下降。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
  ],
};

// ========== T5: 博弈论基础（短牌版）==========
