import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { shortDeckRules } from '../variantRules';

const variant: PokerVariant = 'short-deck';

export const SHORT_DECK_LEVEL_5: TheoryLevelInfo = {
  id: 't5sd',
  level: 5,
  tier: 'intermediate',
  title: '短牌博弈平衡',
  description: '应用 GTO 思想于短牌场景',
  icon: '♦️',
  variant,
  unlockRequirement: '完成 T4SD 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l4sd-gto-fundamentals', title: '短牌 GTO 基础' },
      { id: 'l4sd-solver-readout', title: 'Solver 结果解读' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't5sd-gto-short',
      level: 5,
      order: 1,
      title: 'GTO 适配',
      subtitle: '短牌中的不可被剥削策略',
      duration: '18 min',
      eloDimension: 'postflop',
      objectives: [
        '理解短牌均衡策略（GTO）与标准德州的结构差异',
        '掌握短牌中价值:诈唬比、MDF 等频率基准的调整',
        '学会以 GTO 为基线识别对手偏离并做最小必要偏离',
      ],
      content: [
        { type: 'heading', content: '短牌 GTO：不可被剥削的适配' },
        {
          type: 'text',
          content:
            '短牌扑克（忽略抽水）是多人非零和博弈的近似，但单挑短牌仍是二人零和博弈，纳什均衡"不可剥削"的保证适用。短牌 GTO 与标准德州的核心差异在于范围与成牌结构：对子密度高、同花价值大、听牌常见，导致均衡的下注频率与诈唬密度更高、极化更明显。',
        },
        {
          type: 'key-point',
          content: '短牌 GTO 的定位是"防弹背心"：保证你不被剥削，但不承诺赚最多。面对漏洞百出的对手，针对性剥削赚更多——代价是打开漏洞。短牌高手在"穿背心"与"换刀"之间切换。',
        },
        { type: 'heading', content: '短牌频率基准的调整' },
        {
          type: 'formula',
          content:
            '短牌价值:诈唬比与 MDF（公式不变，输入调整）：\n\n价值:诈唬比 = b/(1+2b)（b 为下注/底池比例）\n满池：1/3 诈唬（2:1 价值）\n半池：1/4 诈唬（3:1）\n\nMDF = 1/(1+b)：半池防 67%、满池防 50%\n\n短牌调整点：\n1. 成牌价值更高（同花/顺子）→ 价值下注可以更大尺度\n2. 听牌更常见 → 诈唬密度可略高（用强听牌半诈唬）\n3. 对子密度高 → 防守范围含更多对子，MDF 可支撑更高\n\n概念源自：《Short Deck Poker》GTO 频率与 6+ 结构',
        },
        {
          type: 'text',
          content:
            '短牌 GTO 的实践：因为同花/顺子成牌价值高、听牌常见，短牌的下注范围更极化（强成牌 + 半诈唬听牌），且下注尺度可以更大（大注榨取成牌价值）。但频率平衡仍是核心——诈唬与价值的比例、防守的 MDF 都要合理，否则被对手反制。',
        },
        {
          type: 'example',
          content:
            '实例：短牌河牌满池下注，均衡价值:诈唬比 2:1。你持同花（价值）与顺子听牌未中（诈唬）混合下注。若你只用同花下注（诈唬 0%），对手对你的满池全弃即可剥削你；若诈唬过半，对手全跟剥削你。均衡比例让对手左右为难。',
        },
        {
          type: 'example',
          content:
            '实例二（最小必要偏离）：你观察到短牌对手河牌面对大注只跟注 25%（均衡约 50%）。据此你可整体上调河牌超池诈唬频率——但幅度以"他若修正到 40% 你仍不亏"为限。这就是"以 GTO 为基线、按可观测偏差做有纪律的偏离"。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌 GTO 不是"打得紧"，而是"让一切保持在对手无法反制的比例上"。短牌 GTO 充满高频下注、超池全下与半诈唬——只是因为成牌价值高、听牌常见，均衡频率看起来更"激进"。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌 GTO 学习路径：先用求解器理解均衡"形状"（为什么这样打），再用节点锁定研究"对手常见漏洞的收割方案"，最后实战验证。基线给你不败之地，偏离给你利润空间。',
        },
      ],
      quiz: [
        {
          id: 't5sd-gto-short-q1',
          question: '单挑短牌是否适用纳什均衡"不可剥削"保证？',
          options: [
            '不适用',
            '适用（单挑短牌是二人零和博弈）',
            '只在翻前',
            '只在锦标赛',
          ],
          correctIndex: 1,
          explanation: '单挑短牌（忽略抽水）是二人零和博弈，纳什均衡不可剥削保证适用。',
        },
        {
          id: 't5sd-gto-short-q2',
          question: '短牌河牌满池下注的均衡价值:诈唬比约为：',
          options: ['1:1', '2:1', '3:1', '4:1'],
          correctIndex: 1,
          explanation: '诈唬占比 b/(1+2b) = 1/3，价值:诈唬 = 2:1。',
        },
        {
          id: 't5sd-gto-short-q3',
          question: '短牌 GTO 与标准德州的主要差异是：',
          options: [
            '短牌更紧',
            '成牌价值更高、听牌常见，下注范围更极化、尺度可更大',
            '完全相同',
            '短牌无 GTO',
          ],
          correctIndex: 1,
          explanation: '短牌同花/顺子价值高、听牌常见，下注范围更极化、尺度可更大，频率基准调整。',
        },
        {
          id: 't5sd-gto-short-q4',
          question: '你观察到短牌对手河牌面对大注只跟注 25%（均衡 50%），正确反制是：',
          options: [
            '无脑加诈唬',
            '上调诈唬频率，但以"对手修正到 40% 你仍不亏"为限',
            '减少下注',
            '完全停手',
          ],
          correctIndex: 1,
          explanation: '对手弃牌过多，上调诈唬频率，但幅度有纪律上限，保留回基线空间。',
        },
        {
          id: 't5sd-gto-short-q5',
          question: '"短牌 GTO 不是打得紧"的含义是：',
          options: [
            'GTO 就是紧',
            '均衡包含高频下注与半诈唬，只是让一切保持对手无法反制的比例',
            'GTO 就是松',
            'GTO 无意义',
          ],
          correctIndex: 1,
          explanation: '短牌 GTO 充满高频下注、超池与半诈唬，关键是比例平衡，不是"打得紧"。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
    {
      id: 't5sd-bluff',
      level: 5,
      order: 2,
      title: '诈唬频率',
      subtitle: '短牌更高的诈唬收益',
      duration: '12 min',
      eloDimension: 'postflop',
      objectives: [
        '理解短牌诈唬收益提升的原因（成牌价值高、弃牌收益大）',
        '掌握短牌半诈唬的运用（强听牌诈唬价值高）',
        '学会用挡牌与弃牌率判断短牌诈唬频率',
      ],
      content: [
        { type: 'heading', content: '短牌诈唬：收益更高，风险也高' },
        {
          type: 'text',
          content:
            '短牌诈唬的收益潜力更高：因为成牌（同花/顺子）价值大、底池通常大，成功偷池的收益高；同时对手因听牌密度高、弃牌率可能更高。但风险也高——对手跟注范围宽、听牌易成，你的诈唬更容易被"意外跟中"。短牌诈唬的关键是用强听牌半诈唬，降低风险。',
        },
        {
          type: 'key-point',
          content: '短牌诈唬铁律：优先用强听牌半诈唬（同花/顺子听牌），而非纯空气。半诈唬即使被跟注也有改进空间，把诈唬风险转化为投资。',
        },
        { type: 'heading', content: '半诈唬与诈唬频率的数学' },
        {
          type: 'formula',
          content:
            '短牌半诈唬 EV（翻牌，强听牌）：\n\nEV(bluff) = f×P − (1−f)×(1−E_win)×Bet + (1−f)×E_win×(P+Bet)\n（f = 对手弃牌率，E_win = 被跟注后的胜率）\n\n对比纯空气诈唬（E_win ≈ 0）：\n纯空气：EV = f×P − (1−f)×Bet\n半诈唬：EV 更高，因为有 E_win 的改进空间\n\n实例：底池 8，下注 4，对手弃牌率 50%，你的顺子听牌被跟注后胜率 35%：\nEV(bluff) = 0.5×8 − 0.5×(0.65)×4 + 0.5×0.35×12 = 4 − 1.3 + 2.1 = 4.8\n\n半诈唬 EV 4.8，明显高于纯空气的 EV = 0.5×8 − 0.5×4 = 2。（概念源自：《Short Deck Poker》半诈唬与 6+ 博弈）',
        },
        {
          type: 'text',
          content:
            '短牌诈唬频率的实战：因为同花/顺子听牌常见且成牌价值高，短牌的诈唬范围应以半诈唬为主。纯空气诈唬在短牌风险大（对手跟注范围宽、易被意外跟中）。同时用挡牌优化——持 A♠ 阻断对手坚果同花时，诈唬成功率上升。',
        },
        {
          type: 'example',
          content:
            '实例：短牌你持 A♥9♥，翻牌 K♥8♦3♣。你听同花（6 outs）+ A 高。对手下注，你加注半诈唬：对手若弃牌你直接赢底池，若跟注你有同花/高张改进空间。短牌同花价值极高，这个半诈唬的 EV 远高于纯空气。',
        },
        {
          type: 'example',
          content:
            '实例二（挡牌诈唬）：短牌翻牌三张黑桃 K♠9♠4♠，你持 A♠5♦（单张 A♠，无同花）。你阻断了坚果同花 A♠X♠ 全部组合——对手"最强牌"被证伪。此时你加注诈唬代表同花，成功率显著上升。挡牌让同一手"空气"变成不同强度的诈唬。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌纯空气诈唬是高风险行为。因为对手听牌密度高、跟注范围宽，你的空气诈唬容易被"意外跟中"甚至被听牌反超。短牌诈唬应以半诈唬为主——用强听牌把风险转化为投资。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌诈唬速记：优先半诈唬（同花/顺子听牌），EV 比纯空气高 2-3 倍；持 A 高阻断坚果时诈唬加分；面对弃牌率高的对手提高诈唬频率。避免纯空气在短牌无脑诈唬。',
        },
      ],
      quiz: [
        {
          id: 't5sd-bluff-q1',
          question: '短牌诈唬收益提升的主要原因是：',
          options: [
            '底池更大',
            '成牌价值高、底池通常大，成功偷池收益高',
            '牌发得慢',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '短牌成牌（同花/顺子）价值高、底池大，成功偷池的收益高。',
        },
        {
          id: 't5sd-bluff-q2',
          question: '短牌诈唬的核心策略是：',
          options: [
            '纯空气诈唬',
            '优先用强听牌半诈唬，降低风险',
            '从不诈唬',
            '无脑全下',
          ],
          correctIndex: 1,
          explanation: '短牌半诈唬（同花/顺子听牌）即使被跟注也有改进空间，把风险转化为投资。',
        },
        {
          id: 't5sd-bluff-q3',
          question: '半诈唬比纯空气诈唬 EV 高的原因是：',
          options: [
            '半诈唬更吓人',
            '半诈唬被跟注后有改进空间（胜率 E_win > 0）',
            '纯空气更好',
            '没有区别',
          ],
          correctIndex: 1,
          explanation: '半诈唬被跟注后有胜率（同花/顺子改进），EV 更高。',
        },
        {
          id: 't5sd-bluff-q4',
          question: '持 A♠ 在三张黑桃面对诈唬的意义是：',
          options: [
            '没有意义',
            '阻断坚果同花，诈唬成功率上升',
            '必须弃牌',
            '对手一定有同花',
          ],
          correctIndex: 1,
          explanation: '持 A♠ 使对手坚果同花 A♠X♠ 组合为 0，最强的跟注牌被削减，诈唬成功率上升。',
        },
        {
          id: 't5sd-bluff-q5',
          question: '短牌纯空气诈唬风险高的原因是：',
          options: [
            '对手更紧',
            '对手听牌密度高、跟注范围宽，易被意外跟中',
            '底池更小',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '短牌对手听牌密度高、跟注范围宽，纯空气诈唬容易被意外跟中甚至被听牌反超。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
  ],
};

// ========== T6: 下注理论（短牌版）==========
