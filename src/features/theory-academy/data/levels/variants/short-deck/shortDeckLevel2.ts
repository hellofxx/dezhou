import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { shortDeckRules } from '../variantRules';

const variant: PokerVariant = 'short-deck';

export const SHORT_DECK_LEVEL_2: TheoryLevelInfo = {
  id: 't2sd',
  level: 2,
  tier: 'basic',
  title: '赔率与期望值',
  description: '短牌情境下的赔率计算与决策',
  icon: '♦️',
  variant,
  unlockRequirement: '完成 T1SD 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l3sd-check-raise', title: '短牌过牌加注' },
      { id: 'l4sd-nuts-equity', title: '坚果与权益计算' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't2sd-potodds',
      level: 2,
      order: 1,
      title: '底池赔率',
      subtitle: '短牌中的即时赔率计算',
      duration: '12 min',
      eloDimension: 'math',
      objectives: [
        '理解短牌 Ante 制下底池赔率的计算差异（无标准盲注，前注制）',
        '掌握短牌所需胜率的快速估算，结合更低的听牌命中率做跟注决策',
        '学会在短牌大底池环境中正确评估赔率与胜率',
      ],
      content: [
        { type: 'heading', content: '短牌底池赔率：Ante 制的独特结构' },
        {
          type: 'text',
          content:
            '短牌通常采用前注（Ante）制：所有人投相同前注，BTN 再投额外 ante。这意味着没有传统的 SB/BB 盲注结构，底池由固定的前注构成。底池赔率的公式不变（所需胜率 = 跟注额 ÷ 底池），但短牌的特殊性在于：底池通常更大（前注 + 更多跟注）、而听牌命中率需要按 36 张牌重算。',
        },
        {
          type: 'key-point',
          content: '底池赔率只算数字，不看情绪。短牌底池大、跟注价格相对便宜，但你必须用短牌修正后的胜率（按 36 张牌）判断是否够格，而非满员桌的胜率表。',
        },
        { type: 'heading', content: '所需胜率的短牌修正' },
        {
          type: 'formula',
          content:
            '底池赔率所需胜率公式：\n所需胜率 = 跟注额 ÷ (当前底池 + 对手下注 + 跟注额)\n\n短牌实例（Ante 制，底池 8 ante，对手下注 4 ante，你需跟 4）：\n所需胜率 = 4 ÷ (8+4+4) = 25%\n\n但你的胜率要按短牌修正：\n同花听牌 5 outs → 单街约 15%，双街约 28%\n顺子听牌 8 outs → 单街约 24%，双街约 44%\n\n只有胜率 ≥ 所需胜率（或加隐含赔率）才跟注。（概念源自：《Short Deck Poker》底池赔率与 6+ 数学框架）',
        },
        {
          type: 'text',
          content:
            '短牌底池赔率的关键实践：因为底池通常较大、跟注价格便宜，更多边缘牌值得跟注；但因为听牌命中率的绝对数字低于满员桌，你必须依赖"短牌成牌后的高价值"（同花/顺子常是坚果）来支撑跟注。理解这两股力量的平衡，是短牌赔率决策的核心。',
        },
        {
          type: 'example',
          content:
            '实例：短牌底池 10 ante，你（BTN）持 A♥K♥，翻牌 9♥7♥2♣。对手下注 5 ante（半池），你跟注需 5，底池变 20。所需胜率 = 5/20 = 25%。你的同花听牌（5 outs）+ 高张约 8 个综合 Outs，双街约 35%+。25% 的赔率配 35% 的胜率，跟注 +EV；且成同花后是坚果级，隐含赔率极佳，甚至可以加注半诈唬。',
        },
        {
          type: 'example',
          content:
            '实例二（边缘跟注）：短牌底池 6 ante，你持 Q♠J♠，翻牌 9♣8♦2♥，你听 T 顺子（8 个 Outs，但 9、8 已见）。对手下注 3 ante（半池），所需胜率 25%。你单街约 24%（8/33）略低于 25%，但双街约 44%，且 T 成顺后可能压过对手两对。加隐含赔率后跟注转 +EV——短牌顺子听牌的隐含价值高。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌底池大、赔率便宜，但"便宜"不等于"白给"。你必须用短牌修正后的胜率判断——同花 outs 只有 5 个，单街 15%，看似不足以跟注，但成牌后是超强牌。把"赔率便宜"与"胜率修正"结合，才是短牌赔率的正确姿势。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌赔率速算：半池下注所需胜率 25%、1/3 池 20%、满池 33.3%。背熟后结合"同花 5 outs ≈ 15% 单街、顺子 8 outs ≈ 24% 单街"判断是否够格。',
        },
      ],
      quiz: [
        {
          id: 't2sd-potodds-q1',
          question: '短牌通常采用哪种下注结构？',
          options: ['标准 SB/BB 盲注', '前注（Ante）制，BTN 投额外 ante', '无任何强制下注', '只有 BB 盲注'],
          correctIndex: 1,
          explanation: '短牌通常采用前注制：所有人投相同前注，BTN 再投额外 ante，无传统 SB/BB 结构。',
        },
        {
          id: 't2sd-potodds-q2',
          question: '短牌底池 8 ante、对手下注 4 ante，你需跟 4，所需胜率约为：',
          options: ['20%', '25%', '33.3%', '40%'],
          correctIndex: 1,
          explanation: '4 ÷ (8+4+4) = 4/16 = 25%。',
        },
        {
          id: 't2sd-potodds-q3',
          question: '短牌同花听牌（5 outs）单街命中率约为：',
          options: ['约 19%', '约 15%', '约 24%', '约 10%'],
          correctIndex: 1,
          explanation: '5 ÷ 33 ≈ 15%。19% 是满员桌 9 outs 的单街值。',
        },
        {
          id: 't2sd-potodds-q4',
          question: '短牌底池大、赔率便宜时，跟注决策的正确依据是：',
          options: [
            '赔率便宜就无脑跟',
            '用短牌修正后的胜率判断，并结合成牌后的高价值',
            '永远弃牌',
            '只看底池大小',
          ],
          correctIndex: 1,
          explanation: '短牌跟注要按 36 张牌修正胜率，并依赖同花/顺子成牌后的高价值支撑。赔率便宜不等于白给。',
        },
        {
          id: 't2sd-potodds-q5',
          question: '短牌顺子听牌（8 outs）双街命中率约为：',
          options: ['约 24%', '约 44%', '约 30%', '约 55%'],
          correctIndex: 1,
          explanation: '短牌顺子 8 outs 双街约 44%（1 − 命中率补集），远高于单街的 24%。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
    {
      id: 't2sd-implied',
      level: 2,
      order: 2,
      title: '隐含赔率',
      subtitle: '短牌隐含赔率的特殊考量',
      duration: '15 min',
      eloDimension: 'math',
      objectives: [
        '理解短牌中同花/顺子成牌后价值极高，隐含赔率普遍更佳',
        '掌握短牌 set mining 门槛提高的原因（三条牌级低于葫芦/同花）',
        '学会用隐含赔率支撑短牌听牌的跟注与半诈唬决策',
      ],
      content: [
        { type: 'heading', content: '短牌隐含赔率：成牌价值的两极分化' },
        {
          type: 'text',
          content:
            '隐含赔率（Implied Odds）指"当前跟注后，未来能再赢多少"。短牌的隐含赔率呈两极分化：一方面，同花（beats 葫芦）与顺子成牌后是超强牌，隐含赔率极佳；另一方面，set（三条）因为牌级低于葫芦与同花，隐含赔率反而变差。理解这个分化，是短牌隐含赔率决策的核心。',
        },
        {
          type: 'key-point',
          content: '短牌隐含赔率铁律：追同花/顺子 → 隐含赔率极佳（成牌是坚果级）；追三条（set）→ 隐含赔率变差（三条打不过葫芦/同花）。',
        },
        { type: 'heading', content: 'set mining 门槛：短牌为何要更高' },
        {
          type: 'formula',
          content:
            '短牌 set mining 门槛推导：\n\n短牌口袋对翻牌击中三条概率：\n每个点数 4 张，你持 2 张，剩余 2 张在牌堆；翻牌 3 张中出现至少 1 张你的点数\n= 1 − C(31,3)/C(33,3) ≈ 1 − 4495/5456 ≈ 17.6%\n（满员桌约 12%）\n\n但短牌三条价值下降：三条 < 葫芦 < 同花\n\n所以虽然击中概率更高（17.6% vs 12%），但需要更高的投入产出比：\n短牌 set mining 需要 ≥ 15-20 倍跟注额的回本门槛\n（满员桌约 10-12 倍即可）\n\n推导逻辑：三条成牌后输给葫芦/同花的概率升高，隐含赔率打折，需更大倍数补偿。（概念源自：《Short Deck Poker》set mining 与 6+ 数学）',
        },
        {
          type: 'text',
          content:
            '短牌追同花/顺子的隐含赔率为什么好？因为成牌后是坚果或接近坚果：同花 beats 葫芦、顺子只输给三条/葫芦/同花。当对手范围里有大对子或强牌时，你成同花/顺子能榨取大量筹码。而追三条则相反——成牌后仍可能输给葫芦/同花，对手也容易弃牌（他们知道三条不是坚果）。',
        },
        {
          type: 'example',
          content:
            '实例：短牌你持 7♥8♥，翻牌 6♦9♣2♠（两头顺听牌 7 个 Outs：5 和 T）。对手下注半池，你跟注 5 ante 看转牌。你的隐含赔率：若 T 或 5 让你成顺子（7-8-9-T 或 5-6-7-8-9），这是短牌强顺，可能压过对手的两对甚至三条以下。对手范围若有对子/强牌，成顺后能再赢 10+ ante。跟注的隐含赔率极佳。',
        },
        {
          type: 'example',
          content:
            '实例二（set mining 对比）：短牌你持 5♠5♦，翻前跟注 2 ante。翻牌 5♣9♥K♦，你中三条。表面看是大优势，但短牌中三条输给葫芦（对手持 99/K9）与同花。且对手范围里 99、K9 这类牌在短牌更常见（对子密度高）。所以即便中了三条，你也要警惕反超——这正是短牌 set 隐含赔率差的根源。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌中"中三条"远没有满员桌那么开心。满员桌三条是隐藏坚果，短牌三条只压过顺子、输给葫芦和同花。湿润牌面上对手的更强成牌随时可能反超，三条的隐含赔率大幅打折。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌隐含赔率速记：追同花/顺子 → 成牌是坚果级，放心追；追三条 → 需更高门槛（15-20 倍跟注额），且中牌后警惕葫芦/同花。判断先问"我成牌后是坚果吗"。',
        },
      ],
      quiz: [
        {
          id: 't2sd-implied-q1',
          question: '短牌中隐含赔率呈两极分化的表现是：',
          options: [
            '所有听牌隐含赔率都差',
            '追同花/顺子隐含赔率极佳，追三条隐含赔率变差',
            '所有听牌隐含赔率都好',
            '没有差别',
          ],
          correctIndex: 1,
          explanation: '短牌同花/顺子成牌是坚果级（隐含赔率佳），三条成牌输给葫芦/同花（隐含赔率差）。',
        },
        {
          id: 't2sd-implied-q2',
          question: '短牌 set mining 需要比满员桌更高的门槛，原因是：',
          options: [
            '短牌更难中三条',
            '短牌三条牌级低于葫芦/同花，隐含赔率打折',
            '短牌底池更小',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '短牌三条输给葫芦与同花，成牌价值下降，需更高投入产出比补偿，门槛更高。',
        },
        {
          id: 't2sd-implied-q3',
          question: '短牌口袋对翻牌击中三条的概率约为：',
          options: ['约 12%', '约 17.6%', '约 25%', '约 8%'],
          correctIndex: 1,
          explanation: '短牌约 17.6%（满员桌约 12%）。虽然击中概率更高，但三条价值下降，需更高门槛。',
        },
        {
          id: 't2sd-implied-q4',
          question: '短牌中"中三条没满员桌那么开心"的原因是：',
          options: [
            '三条牌力更弱',
            '三条输给葫芦和同花，且短牌对子密度高让反超更常见',
            '三条不能赢钱',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '短牌三条 < 葫芦 < 同花，且对子密度高，对手持 99/K9 等反超组合更常见。',
        },
        {
          id: 't2sd-implied-q5',
          question: '短牌追同花听牌时，判断跟注价值的核心是：',
          options: [
            '只看当前赔率',
            '成同花后是坚果级（beats 葫芦），隐含赔率极佳',
            '同花 outs 太少不值得',
            '永远弃牌',
          ],
          correctIndex: 1,
          explanation: '短牌同花 beats 葫芦，成牌后是接近坚果的强牌，隐含赔率极佳——outs 少但成牌价值高。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
    {
      id: 't2sd-reverse',
      level: 2,
      order: 3,
      title: '反向隐含赔率',
      subtitle: '避免陷入糟糕处境',
      duration: '10 min',
      eloDimension: 'math',
      objectives: [
        '理解反向隐含赔率（RIO）在短牌中的放大（边缘牌被更强成牌压制）',
        '掌握短牌中易被"压制"的牌型与处境，避免慢打边缘牌',
        '学会用 RIO 意识收紧边缘跟注与慢玩，保护筹码',
      ],
      content: [
        { type: 'heading', content: '反向隐含赔率：短牌的隐藏陷阱' },
        {
          type: 'text',
          content:
            '反向隐含赔率（Reverse Implied Odds）指"当前跟注后，未来可能输掉更多"。短牌的 RIO 被放大：因为牌型重排（同花 > 葫芦、三条 > 顺子）与对子密度高，边缘成牌（如顶对、两对、顺子）更容易被更强的牌压制。慢玩边缘牌或追便宜的听牌，可能在河牌输掉整个底池。',
        },
        {
          type: 'key-point',
          content: '短牌 RIO 铁律：边缘成牌（顶对、两对、顺子）在短牌湿润面上价值下降，容易被更强牌压制。有 RIO 意识，才能避免"赢了小锅、输了大锅"。',
        },
        { type: 'heading', content: '高 RIO 的典型处境' },
        {
          type: 'text',
          content:
            '短牌高 RIO 处境有三类：(1) 顶对弱踢脚——面对对手两对/顺子/同花时输掉大锅；(2) 边缘顺子——被更大的顺子、葫芦、同花压制；(3) 慢玩强牌被反超——短牌听牌密度高，慢玩等于给对手免费追听。识别这些处境后，用"控制底池 + 及时止损"规避 RIO。',
        },
        {
          type: 'example',
          content:
            '实例：短牌你持 A♠K♦，翻牌 K♣9♦8♥。你中顶对 A 踢脚，但牌面湿润（98 连牌，对手可成顺子/两对）。对手下注半池，你跟注。转牌 7♣ 完成 TJ 顺子。你的顶对现在输给大量顺子与两对——这就是 RIO：你当前领先但后续街可能输掉大锅。正确做法是翻牌控池或警惕跟注，而非一路慢玩。',
        },
        {
          type: 'example',
          content:
            '实例二（慢玩陷阱）：短牌你持 A♥A♣，翻牌 A♦9♣3♠，中三条 A。看似坚果，但短牌中三条 < 葫芦 < 同花，且牌面有红心同花听牌可能。若你慢玩过牌，对手用同花听牌免费追，转牌成同花反超你。短牌听牌密度高，强牌必须下注保护，避免慢玩带来的 RIO。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌中"我有顶对/两对"不是慢玩的理由。牌面越湿润、听牌密度越高，你的边缘成牌越危险。快打强牌保护 + 控池边缘牌，是规避 RIO 的核心。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌 RIO 三问：(1) 我的成牌是坚果吗？(2) 对手可能有什么更强的组合？(3) 慢玩会否给对手免费追听？三问后：坚果快打、边缘控池、湿润面少慢玩。',
        },
      ],
      quiz: [
        {
          id: 't2sd-reverse-q1',
          question: '反向隐含赔率（RIO）指的是：',
          options: [
            '当前跟注后未来能赢更多',
            '当前跟注后未来可能输掉更多',
            '底池赔率的计算',
            '对手的赔率',
          ],
          correctIndex: 1,
          explanation: 'RIO 指跟注后未来可能输掉更多。短牌因牌型重排与听牌密度，RIO 被放大。',
        },
        {
          id: 't2sd-reverse-q2',
          question: '短牌中 RIO 被放大的原因是：',
          options: [
            '底池更小',
            '牌型重排（同花>葫芦、三条>顺子）与对子密度高，边缘成牌易被压制',
            '牌发得慢',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '短牌边缘成牌（顶对/顺子）更容易被更强的牌（葫芦/同花）压制，RIO 放大。',
        },
        {
          id: 't2sd-reverse-q3',
          question: '湿润牌面（K♣9♦8♥）上持顶对，正确做法是：',
          options: [
            '一路慢玩',
            '控池或警惕，避免后续被顺子/两对压制输大锅',
            '直接全下',
            '立即弃牌',
          ],
          correctIndex: 1,
          explanation: '湿润面顶对 RIO 高，应控池或警惕跟注，避免慢玩被后续街反超。',
        },
        {
          id: 't2sd-reverse-q4',
          question: '短牌中强牌（如三条 A）慢玩的主要风险是：',
          options: [
            '没有风险',
            '给对手免费追同花/顺子，短牌听牌密度高易被反超',
            '强牌应该弃牌',
            '慢玩更赚钱',
          ],
          correctIndex: 1,
          explanation: '短牌听牌密度高，慢玩强牌等于给对手免费追听，转牌河牌易被同花/葫芦反超。',
        },
        {
          id: 't2sd-reverse-q5',
          question: '规避短牌 RIO 的核心策略是：',
          options: [
            '坚果快打保护、边缘控池、湿润面少慢玩',
            '永远慢玩',
            '永远全下',
            '只玩坚果',
          ],
          correctIndex: 0,
          explanation: '规避 RIO：坚果快打保护、边缘成牌控池、湿润面避免慢玩给对手免费追听。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
  ],
};

// ========== T3: 起手牌与位置（短牌版）==========
