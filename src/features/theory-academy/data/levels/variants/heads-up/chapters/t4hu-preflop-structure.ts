import type { TheoryChapter } from '../../../../../types';
import { headsUpRules } from '../../variantRules';

// T4 新章：翻前 3-bet 与 4-bet 结构（单挑）。
// 单挑翻前只有两个盲注位参与，但每个节点的价格都可精确计算；范围结构就是价格的推论。
export const HEADS_UP_CHAPTERS: TheoryChapter[] = [
  {
    id: 't4hu-preflop-structure',
    level: 4,
    order: 5,
    title: '翻前 3-bet 与 4-bet 结构',
    subtitle: '把翻前的每个节点算成一条价格线',
    duration: '15 min',
    eloDimension: 'preflop',
    objectives: [
      '把单挑翻前的四个节点各自折算成价格线，说明每条线的算法',
      '解释为什么低价格节点出手更宽、高价格节点必须收窄',
      '按价格与实现率把一手牌分配到 limp、加注、跟注、弃牌四层',
    ],
    content: [
      { type: 'heading', content: '单挑翻前的三层结构' },
      {
        type: 'text',
        content:
          '翻前 SB 先行动、BB 最后行动，决策点只有三个层次：SB 的弃牌、limp（补齐 0.5）或 min-raise（2BB）；BB 面对 min-raise 的弃牌、跟注或 3-bet；SB 被 3-bet 之后的弃牌、跟注或 4-bet。层数虽少，但每个节点都有自己的价格，而单挑的输赢大半在这些价格上决定。',
      },
      {
        type: 'formula',
        content:
          '以 100BB 深、盲注 0.5/1 计，四个节点的价格：\n\nBB 面对 min-raise 到 2BB：再投 1BB，跟注后底池 4BB → 所需权益 1 ÷ 4 = 25%\nBB 3-bet 到 6BB：多投 5BB 去赢 3BB（SB 的 2BB 加自己已投的 1BB）→ Alpha = 5 ÷ (5+3) = 62.5%，SB 最小防守 37.5%\nSB 4-bet 到 15BB：多投 13BB 去赢 8BB（BB 的 6BB 加 SB 已投的 2BB）→ Alpha = 13 ÷ 21 ≈ 61.9%，BB 最小防守 38.1%\nBB 跟 4-bet：再投 9BB，跟注后底池 30BB → 所需权益 9 ÷ 30 = 30%',
      },
      {
        type: 'key-point',
        content:
          '三个数记住：BB 面对 min-raise 要 25%，SB 面对 3-bet 要防 37.5%，BB 面对 4-bet 要 30%。价格先算清，后面所有范围结构都从这三条线长出来，不需要背牌表。',
      },
      {
        type: 'example',
        content:
          '数值：按无位置方 0.85 的实现率折算（示意口径），4-bet 节点的实际门槛是 30% ÷ 0.85 ≈ 35.3%。也就是说，一手在 3-bet 节点有 26% 权益的牌可以跟注（过了 25% 的线），但到了 4-bet 节点必须接近 35% 才值得继续——两个节点的门槛差了整整 10 个百分点。',
      },
      {
        type: 'example',
        content:
          '数值：BB 的 3-bet 若占全部起手牌组合的约 18%（1326 × 0.18 ≈ 239 个），把价值端按约 12%（约 159 个）拆出，诈唬端就只剩约 6%（约 80 个），价值:诈唬 ≈ 2:1。所以 3-bet 频率每上调一个点，诈唬段的绝对数量都必须同时跟上：239 个组合里有 80 个是空手，一旦对手弃牌率低于 62.5% 的保本线，这 80 个立刻从投资变成纯支出。',
      },
      {
        type: 'text',
        content:
          '价格越低，出手越宽。1BB 的跟注只买 4BB 的底池，任何对宽范围有四分之一权益的牌都值得进；到了 4-bet 节点，同样的牌要拿 30% 才有得赚，而 BB 在那个节点无位置、权益实现要打折，门槛还要更高。同一手牌在一个节点跟注、在另一个节点弃牌，不是风格不一致，而是价格不同。结构上的取舍同理：全部 min-raise 会让范围被 3-bet 反复修剪，加上 limp 段则用 0.5 保留最宽范围与翻后最后行动，代价是把主动权让出去。',
      },
      {
        type: 'highlight',
        content:
          '反直觉点：单挑里 limp 不是软弱。它是把"被 3-bet 修剪"的成本压到最低的一种结构选择；真正软弱的是用 100% 的牌 min-raise 又不肯在被 3-bet 后弃牌——那才是把钱直接送出去。',
      },
      {
        type: 'takeaway',
        content:
          '价格先行：先把四个节点算成 25% / 37.5% / 30% 三条线，再决定哪些牌进哪一层。翻前结构不是记忆量，而是三个数的推论；想知道这些线在均衡里如何变成频率，见 T5『单挑翻前均衡』章。',
      },
    ],
    quiz: [],
    variant: 'heads-up',
    variantRules: headsUpRules,
  },
];
