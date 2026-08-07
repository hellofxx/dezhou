import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { shortDeckRules } from '../variantRules';

const variant: PokerVariant = 'short-deck';

export const SHORT_DECK_LEVEL_7: TheoryLevelInfo = {
  id: 't7sd',
  level: 7,
  tier: 'advanced',
  title: '短牌对手阅读',
  description: '识别并利用短牌玩家的常见错误',
  icon: '♦️',
  variant,
  unlockRequirement: '完成 T6SD 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l8sd-exploit-i', title: '短牌剥削（一）' },
      { id: 'l8sd-exploit-ii', title: '短牌剥削（二）' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't7sd-mistakes',
      level: 7,
      order: 1,
      title: '常见错误模式',
      subtitle: '标准玩家转短牌的认知偏差',
      duration: '15 min',
      eloDimension: 'handReading',
      objectives: [
        '识别标准德州玩家转短牌时的常见认知偏差',
        '掌握从对手错误模式反推范围与剥削方向',
        '学会用频率统计确认对手的错误倾向',
      ],
      content: [
        { type: 'heading', content: '标准玩家的短牌认知偏差' },
        {
          type: 'text',
          content:
            '短牌玩家大多是标准德州转来的，带着满员桌的思维惯性。这些"认知偏差"是可剥削的金矿：用标准德州 outs 表算短牌胜率、低估同花价值（以为葫芦 > 同花）、高估 AK、set mining 门槛过低、湿润面慢玩。识别这些错误模式，是短牌剥削的前提。',
        },
        {
          type: 'key-point',
          content: '短牌剥削的核心：识别对手的"标准德州惯性"。用 36 张牌 outs 重算的玩家、低估同花价值的玩家、set mining 过松的玩家，都是可剥削对象。',
        },
        { type: 'heading', content: '常见错误的定性与剥削' },
        {
          type: 'text',
          content:
            '四类最常见的短牌玩家错误：(1) outs 算错——用满员桌 outs 表，同花听牌当 9 outs（实际短牌 5），会高估胜率；(2) 低估同花——以为葫芦 > 同花，用标准德州价值排序，会错判强弱；(3) 高估 AK——以为 AK 翻硬币偏上，实际对子都落后；(4) set mining 过松——用满员桌门槛，短牌三条价值低。识别后针对性剥削。',
        },
        {
          type: 'example',
          content:
            '实例：你发现对手用标准德州 outs 表（同花听牌当 9 outs）追听。他的实际胜率被高估，追听过松。剥削：你的价值下注可以更大、跟注更紧——他追听的成本高、成功率低。识别这个认知偏差后，你能针对性地榨取。',
        },
        {
          type: 'example',
          content:
            '实例二（低估同花）：对手用标准德州价值排序，以为葫芦 > 同花。当你成同花、他成葫芦时，他会误以为葫芦更大而继续跟注你的大注。剥削：你在同花面（beats 葫芦）的价值下注可以更积极，因为对手会误判强度。',
        },
        {
          type: 'example',
          content:
            '实例三（高估 AK）：对手以为 AK 翻前翻硬币偏上，频繁全下 AK。剥削：你用口袋对跟注他的全下，因为短牌对子 > AK（43%-45%），你小幅领先。识别他对 AK 的高估，你的对子跟注变 +EV。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌中"对手用满员桌直觉"是最可剥削的漏洞。他们的 outs 算错、牌型排序错、起手牌高估——这些偏差让你的价值下注更值钱、你的跟注更有利。识别偏差比记住更多 GTO 更重要。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌剥削速记：观察对手的四个信号——追听用不用短牌 outs、同花面是否误判强弱、AK 是否全下过频、set mining 是否过松。每个信号都对应一个剥削方向。',
        },
      ],
      quiz: [
        {
          id: 't7sd-mistakes-q1',
          question: '短牌玩家最常见的认知偏差是：',
          options: [
            '用短牌 outs 表',
            '用标准德州惯性（outs 算错、低估同花、高估 AK）',
            '玩得太紧',
            '没有偏差',
          ],
          correctIndex: 1,
          explanation: '短牌玩家多从标准德州转来，带着满员桌惯性：outs 算错、低估同花、高估 AK 等。',
        },
        {
          id: 't7sd-mistakes-q2',
          question: '发现对手用满员桌 outs 表追听（同花当 9 outs），正确剥削是：',
          options: [
            '减少下注',
            '价值下注更大、跟注更紧，他追听成本高',
            '只玩坚果',
            '无脑全下',
          ],
          correctIndex: 1,
          explanation: '对手高估追听胜率、追听过松，你的价值下注可更大、跟注更紧，榨取他的错误。',
        },
        {
          id: 't7sd-mistakes-q3',
          question: '对手用标准德州排序以为葫芦 > 同花，你成同花时的剥削是：',
          options: [
            '过牌',
            '积极价值下注，对手会误判强度继续跟注',
            '弃牌',
            '无脑诈唬',
          ],
          correctIndex: 1,
          explanation: '对手误以为葫芦 > 同花，你成同花（实际 beats 葫芦）时可积极价值下注，他会误判强度继续跟。',
        },
        {
          id: 't7sd-mistakes-q4',
          question: '对手频繁全下 AK（高估其翻前价值），正确应对是：',
          options: [
            '弃牌',
            '用口袋对跟注，因为短牌对子 > AK',
            '用更差的非对子跟注',
            '无脑反加',
          ],
          correctIndex: 1,
          explanation: '短牌对子 > AK（43%-45%），对手高估 AK 时，用口袋对跟注其全下小幅领先。',
        },
        {
          id: 't7sd-mistakes-q5',
          question: '短牌剥削的基础是：',
          options: [
            '记住更多 GTO',
            '识别对手的"标准德州惯性"认知偏差',
            '更激进',
            '运气',
          ],
          correctIndex: 1,
          explanation: '识别对手的满员桌惯性偏差（outs/牌型/起手牌）比记住更多 GTO 更重要，是剥削前提。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
    {
      id: 't7sd-adjustment',
      level: 7,
      order: 2,
      title: '策略调整',
      subtitle: '从 NLHE 到短牌的思维转换',
      duration: '12 min',
      eloDimension: 'mental',
      objectives: [
        '理解从 NLHE 到短牌的关键思维转换点',
        '掌握短牌特有策略调整（范围、下注、追听）',
        '学会用"短牌思维"替代"满员桌思维"做决策',
      ],
      content: [
        { type: 'heading', content: '从 NLHE 到短牌：思维转换' },
        {
          type: 'text',
          content:
            '从标准德州（NLHE）转短牌，最大的障碍是思维惯性。短牌的关键思维转换：(1) 牌型——同花 > 葫芦、三条 > 顺子；(2) 起手——对子 > AK；(3) 追听——outs 按 36 张重算；(4) 波动——更高需更保守资金。完成这些转换，你才能用短牌思维而非满员桌思维决策。',
        },
        {
          type: 'key-point',
          content: '短牌思维铁律：每次决策前自问"这是短牌还是满员桌"——outs 重算了吗？牌型排序对吗？AK 高估了吗？波动承受够吗？五问全对，才是短牌思维。',
        },
        { type: 'heading', content: '关键策略调整' },
        {
          type: 'text',
          content:
            '短牌策略调整的核心：(1) 范围——对子与同花牌价值升、非同花高张降；(2) 下注——湿润面大尺度保护、干燥面小注；(3) 追听——outs 按 36 张重算、同花追注价值高；(4) 资金——更保守（≥150 买入）。这些调整让短牌策略与标准德州有本质区别。',
        },
        {
          type: 'example',
          content:
            '实例（思维转换）：你在标准德州习惯"AK 是强牌全下"。转短牌后，面对对手的全下，你要意识到 AK 对口袋对约 43%-45%（落后）。若底池赔率只需 40%，跟注；需 45%，弃牌。用短牌修正后的胜率而非满员桌直觉。',
        },
        {
          type: 'example',
          content:
            '实例二（追听转换）：标准德州同花听牌 9 outs，你习惯追。短牌同花 5 outs（单街 15%），看似不值得——但成同花是坚果（beats 葫芦），隐含赔率极佳。所以短牌追同花不是"outs 少就弃"，而是"outs 少但成牌价值高，看隐含赔率"。这是思维转换的典型。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌思维转换不是"记住新规则"，而是"每手牌重新评估"。同一手牌、同一个牌面，短牌与满员桌的决策可能完全相反——用满员桌记忆会自动犯错。短牌高手的标志是"时刻提醒自己在短牌"。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌思维转换五问（每手牌）：(1) 牌型排序对吗？(2) outs 按 36 张了吗？(3) AK 高估了吗？(4) 湿润面用大尺度了吗？(5) 波动资金够吗？五问全对，短牌思维已建立。',
        },
      ],
      quiz: [
        {
          id: 't7sd-adjustment-q1',
          question: '从 NLHE 到短牌最关键的思想转换是：',
          options: [
            '完全照搬标准德州',
            '牌型重排、outs 重算、起手重估、波动更保守',
            '只改下注尺度',
            '没有转换',
          ],
          correctIndex: 1,
          explanation: '短牌需完成牌型（同花>葫芦）、outs（36 张）、起手（对子>AK）、波动（更保守）的全面转换。',
        },
        {
          id: 't7sd-adjustment-q2',
          question: '短牌追同花（5 outs）的正确理解是：',
          options: [
            'outs 少就弃',
            'outs 少但成牌是坚果，看隐含赔率',
            '同花不值钱',
            '无脑追',
          ],
          correctIndex: 1,
          explanation: '短牌同花 outs 少（5 个）但成牌是坚果（beats 葫芦），隐含赔率极佳，看隐含赔率而非只看 outs 数。',
        },
        {
          id: 't7sd-adjustment-q3',
          question: '短牌中 AK 面对口袋对全下的正确判断是：',
          options: [
            'AK 领先',
            '约 43%-45% 落后，看底池赔率决定',
            'AK 完胜',
            '必输',
          ],
          correctIndex: 1,
          explanation: '短牌 AK 对口袋对约 43%-45% 落后，根据底池赔率（需 40% 跟、45% 弃）决定。',
        },
        {
          id: 't7sd-adjustment-q4',
          question: '短牌资金管理比标准德州更保守的原因是：',
          options: [
            '短牌更容易赢',
            '短牌波动更高，需更大缓冲',
            '短牌买入更贵',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '短牌标准差高（翻牌率/听牌/底池大），波动更高，资金门槛需更保守。',
        },
        {
          id: 't7sd-adjustment-q5',
          question: '短牌高手的标志是：',
          options: [
            '记住所有规则',
            '时刻提醒自己在短牌，每手牌重新评估',
            '用满员桌记忆',
            '更激进',
          ],
          correctIndex: 1,
          explanation: '短牌高手的标志是时刻提醒自己在短牌，每手牌按短牌规则重新评估，而非用满员桌记忆。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
  ],
};

// ========== T8: 扑克心理学（短牌版）==========
