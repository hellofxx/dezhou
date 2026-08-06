import type { Lesson, LessonSection } from '../../types';

// ===== l1-position 分段常量（引用相等契约：content 与手写 units.sections 共享同一批对象） =====
const L1_POSITION_U1_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '为什么位置如此重要？' },
  {
    type: 'text',
    content:
      '在德州扑克中，位置（Position）指的是你在牌桌上的座位相对于庄家按钮（Button）的位置。后位行动的玩家有巨大优势，因为他们可以看到前面玩家的行动后再做决策。',
  },
  {
    type: 'key-point',
    content: '黄金法则：按钮位（BTN）是最好的位置，你可以最后一个行动，拥有最多的信息。',
  },
];

const L1_POSITION_U2_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '位置分类' },
  {
    type: 'text',
    content:
      '前位（Early）：UTG, UTG+1 — 最先行动，信息最少，需要最强的牌\n中位（Middle）：MP, HJ — 中间位置，适度放宽范围\n后位（Late）：CO, BTN — 后行动，信息最多，范围最宽\n盲注位（Blinds）：SB, BB — 已投入筹码，但翻后最先行动',
  },
  {
    type: 'highlight',
    content:
      '同样的手牌，在 BTN 的价值远高于在 UTG。例如 KJo 在 BTN 是标准 open，在 UTG 通常应该弃牌（保守玩家约 15% 范围）。',
  },
  {
    type: 'pro-tip',
    content:
      '职业牌手会根据位置严格调整起手牌范围。“任何位置都能打”的手牌只有最顶端的几手（AA/KK/QQ/AKs），其余都需要根据位置调整。',
  },
];

const L1_POSITION_U3_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '位置优势的体现' },
  {
    type: 'text',
    content:
      '1. 翻前：后位可以偷盲（Steal Blinds），用更宽的范围开牌\n2. 翻后：后位可以控制底池大小，做出更精确的价值下注\n3. 信息优势：看到对手的行动后再决策，减少犯错概率',
  },
  {
    type: 'formula',
    content: '位置权益实现率：\nBTN 开牌范围约 40-50%（Sklansky-Murr 经典理论建议 35%，现代 solver 输出可达 50%）\nUTG 开牌范围约 10-15%，但由于翻后 OOP，权益实现率仅约 80-90%\n\n量化规律：后位每多一个位置，范围可放宽约 5-8 个百分点，翻后权益实现率提升约 5-10%。',
  },
  {
    type: 'theory-reference',
    content: '理论支撑：位置价值的量化分析见理论学院 T3 第 1 章“位置价值与权益实现率”，Gap Concept 的现代修正见 T3 第 2 章，Sklansky 基本定理见 T3 第 3 章。',
    data: { theoryLevelId: 't3', theoryChapterId: 't3-position' },
  },
  {
    type: 'counter-intuitive',
    content: '反直觉点：BTN 的位置优势主要在翻后而非翻前。翻前 BTN 只是最后行动，但翻后 BTN 在所有街道都是最后行动——这意味着你可以在看到对手的所有行动后再做决策，这是巨大的信息优势。',
  },
];

export const LEVEL_1_LESSONS: Lesson[] = [
      {
        id: 'l1-basics',
        level: 1,
        order: 1,
        title: '德州扑克规则与牌型',
        subtitle: '从零基础开始，理解游戏的基本运作',
        duration: '8 min',
        content: [
          { type: 'heading', content: '什么是德州扑克？' },
          {
            type: 'text',
            content:
              "德州扑克（Texas Hold'em）是世界上最流行的扑克变体。每位玩家获得2张底牌（Hole Cards），与5张公共牌（Community Cards）组合，选出最佳的5张牌来决出胜负。",
          },
          {
            type: 'key-point',
            content: '核心目标：不是每手牌都要赢，而是长期做出+EV（正期望值）的决策。',
          },
          { type: 'heading', content: '游戏流程' },
          {
            type: 'text',
            content:
              '1. 翻前（Preflop）：每人发2张底牌，盲注下注后开始行动\n2. 翻牌（Flop）：发出3张公共牌\n3. 转牌（Turn）：发出第4张公共牌\n4. 河牌（River）：发出第5张公共牌\n5. 摊牌（Showdown）：亮牌比大小',
          },
          { type: 'heading', content: '牌型排名（从强到弱）' },
          {
            type: 'text',
            content:
              '皇家同花顺 > 同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌',
          },
          {
            type: 'highlight',
            content: '记住：同花 beats 顺子！很多初学者会搞混这个顺序。',
          },
          {
            type: 'pro-tip',
            content:
              '职业牌手每手牌都在计算概率。养成"这手牌胜率多少"的思维习惯，是你走向职业化的第一步。',
          },
          {
            type: 'formula',
            content: '起手牌总组合数：C(52,2) = 52×51÷2 = 1326 种\n口袋对子（如 AA）：C(4,2) = 6 种\n同花牌（如 AKs）：4 种\n非同花牌（如 AKo）：12 种\n\n理解这些基本组合数是范围分析的基础——后续的赔率计算、Blocker效应都建立在此之上。',
          },
          {
            type: 'theory-reference',
            content: '理论支撑：组合计数与起手牌概率的完整推导见理论学院 T1 第 1 章"组合计数与起手牌概率"。详细介绍了 C(n,k) 通式推导、1326 种组合来源、6/4/12 原子单位等核心内容。',
            data: { theoryLevelId: 't1', theoryChapterId: 't1-combinatorics' },
          },
          {
            type: 'counter-intuitive',
            content: '反直觉点：169 类与 1326 种是两套计数。169 是"等价类别数"（对子/同花/非同花的类型），1326 才是"可区分的实际组合数"。概率计算必须用 1326——类别数会骗你：同花 AK 和 AA 各占"1 类"，但组合权重分别是 4 和 6。',
          },
        ],
        quiz: [
          {
            id: 'l1-basics-q1',
            question: '以下哪种牌型最强？',
            options: ['顺子', '同花', '葫芦', '四条'],
            correctIndex: 3,
            explanation: '四条（Four of a Kind）> 葫芦（Full House）> 同花（Flush）> 顺子（Straight）',
          },
          {
            id: 'l1-basics-q2',
            question: '德州扑克中，翻牌（Flop）发出几张公共牌？',
            options: ['1张', '2张', '3张', '5张'],
            correctIndex: 2,
            explanation: '翻牌发出3张公共牌，转牌1张，河牌1张，共5张。',
          },
          {
           id: 'l1-basics-q3',
            question: '德州扑克的核心目标是什么？',
            options: ['每手牌都赢', '拿到最大牌型', '长期做出+EV决策', 'bluff对手'],
            correctIndex: 2,
            explanation: '职业牌手关注的是长期期望值（EV），而不是单手牌的输赢。',
          },
        ],
        examples: [
          {
            id: 'l1-basics-ex1',
            title: '识别牌型：同花 vs 顺子',
            heroHand: ['8h', '9h'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2.5BB' },
              { player: 'SB', action: 'fold' },
            ],
            board: ['Th', 'Jh', '2h', '5c', 'Qd'],
            street: 'river',
            effectiveStack: 88,
            potSize: 12.5,
            correctDecision: {
              action: '赢（同花）',
              reasoning: [
                '你持有 8♥9♥，公共牌有 T♥J♥2♥',
                '你组成了 8-9-T-J-2 的同花（5张红心）',
                '同花 beats 顺子，即使对手有 AK 组成顺子你也赢',
              ],
            },
            commonMistake: {
              action: '误以为对手的顺子更强而弃牌',
              reasoning: '初学者常混淆同花和顺子的大小。记住：同花 > 顺子！',
              evLoss: '损失整个底池（约 8BB）',
            },
          },
          {
            id: 'l1-basics-ex2',
            title: '识别牌型：葫芦的组成',
            heroHand: ['Kd', 'Kc'],
            heroPosition: 'CO',
            previousActions: [
              { player: 'UTG', action: 'fold' },
              { player: 'MP', action: 'fold' },
            ],
            board: ['Kh', '7d', '7s', '2c', '9s'],
            street: 'river',
            effectiveStack: 85,
            potSize: 15,
            correctDecision: {
              action: '价值下注（葫芦）',
              amount: '75% pot',
              reasoning: [
                '你持有 K♦K♣，公共牌有 K♥7♦7♠',
                '你组成了 KKK77 的葫芦（三条K + 一对7）',
                '葫芦是非常强的牌型，只输给四条和同花顺',
                '应该下大注获取价值',
              ],
            },
            commonMistake: {
              action: 'Check 希望摊牌赢',
              reasoning: '持有葫芦时应该主动下注获取价值，而不是被动check。对手可能用更弱的牌跟注。',
              evLoss: '-3 BB/100',
            },
          },
        ],
        practice: {
          id: 'l1-basics-practice',
          questions: [
            {
              id: 'l1-basics-p1',
              scenario: {
                heroHand: ['Ah', 'Kh'],
                heroPosition: 'BTN',
                previousActions: [
                  { player: 'UTG', action: 'fold' },
                  { player: 'MP', action: 'fold' },
                  { player: 'CO', action: 'fold' },
                ],
                street: 'preflop',
                potSize: 1.5,
                effectiveStack: 100,
              },
              options: [
                { action: 'Fold', isCorrect: false, explanation: 'AKs 在BTN面对全fold是非常强的开牌机会，弃牌是严重错误。', evImpact: '-2.0 BB/100' },
                { action: 'Call', isCorrect: false, explanation: '这里没有前位加注需要跟注，应该主动加注开牌。', evImpact: '-0.5 BB/100' },
                { action: 'Raise', amount: '2.5BB', isCorrect: true, explanation: 'AKs 是顶级起手牌，在BTN面对全fold应该标准加注2.5BB开牌。', evImpact: '+2.5 BB/100' },
              ],
            },
            {
              id: 'l1-basics-p2',
              scenario: {
                heroHand: ['Qs', 'Qd'],
                heroPosition: 'BB',
                previousActions: [
                  { player: 'BTN', action: 'raise 2.5BB' },
                  { player: 'SB', action: 'fold' },
                ],
                board: ['Qh', '7c', '3s'],
                street: 'flop',
                potSize: 5.5,
                effectiveStack: 97,
              },
              options: [
                { action: 'Check', isCorrect: false, explanation: '你击中了顶三条（set），这是极强的牌。应该下注建立底池。', evImpact: '-1.5 BB/100' },
                { action: 'Bet', amount: '4BB (约 73% 底池)', isCorrect: true, explanation: '击中三条应该下注获取价值。4BB≈73% 底池是标准翻牌持续下注尺度，能让对手用更弱的牌跟注。', evImpact: '+3.0 BB/100' },
                { action: 'All-in', isCorrect: false, explanation: '翻牌就 All-in 太大了，会吓跑所有更弱的牌。应该循序渐进建立底池。', evImpact: '-0.5 BB/100' },
              ],
            },
            {
              id: 'l1-basics-p3',
              scenario: {
                heroHand: ['7c', '2d'],
                heroPosition: 'UTG',
                previousActions: [],
                street: 'preflop',
                potSize: 1.5,
                effectiveStack: 100,
              },
              options: [
                { action: 'Fold', isCorrect: true, explanation: '72o 是最差的起手牌之一，在任何位置都应该弃牌。没有高牌价值、没有连接性、没有同花潜力。', evImpact: '0 BB/100' },
                { action: 'Raise', amount: '2.5BB', isCorrect: false, explanation: '72o 太弱了，开牌加注只会让你用一手垃圾牌进入翻后，长期大量亏损。', evImpact: '-2.5 BB/100' },
                { action: 'Call', isCorrect: false, explanation: '在UTG没有加注可以跟注，而且72o不值得用任何方式入局。', evImpact: '-1.8 BB/100' },
              ],
            },
          ],
        },
      },
      {
        id: 'l1-position',
        level: 1,
        order: 2,
        title: '位置的力量',
        subtitle: '理解为什么位置是德州扑克最重要的概念',
        duration: '7 min',
        content: [
          ...L1_POSITION_U1_SECTIONS,
          ...L1_POSITION_U2_SECTIONS,
          ...L1_POSITION_U3_SECTIONS,
        ],
        quiz: [
          {
            id: 'l1-pos-q1',
            question: '以下哪个位置最好？',
            options: ['UTG', 'MP', 'BTN', 'SB'],
            correctIndex: 2,
            explanation: 'BTN（按钮位）是最佳位置，你几乎总是最后行动，拥有最多信息。',
          },
          {
            id: 'l1-pos-q2',
            question: 'KJo 在 UTG 位置应该？',
            options: ['加注开牌', '跟注', '弃牌', '全下'],
            correctIndex: 2,
            explanation: 'KJo 在 UTG 是边缘牌（约 15% 范围），现代策略中可以 open（但偏松）。更保守打法仍建议弃牌。',
          },
          {
            id: 'l1-pos-q3',
            question: '后位行动的最大优势是什么？',
            options: ['筹码更多', '牌更好', '信息更多', '运气更好'],
            correctIndex: 2,
            explanation: '后位最大的优势是信息——你可以看到前面所有玩家的行动后再做决策。',
          },
        ],
        examples: [
          {
            id: 'l1-position-ex1',
            title: '同一手牌不同位置：KJo 在 UTG vs BTN',
            heroHand: ['Kh', 'Jd'],
            heroPosition: 'UTG',
            previousActions: [],
            street: 'preflop',
            effectiveStack: 100,
            potSize: 1.5,
            correctDecision: {
              action: 'Fold',
              reasoning: [
                'KJo 在 UTG 是边缘牌（约 15% 范围），可以 open 但偏松。保守打法仍建议弃牌。',
                '前位行动意味着你信息最少，后面还有5个玩家可能加注',
                'KJo 容易被支配（对手可能有 AK、KQ、AJ）',
                '在前位只打最强约10%的手牌',
              ],
            },
            commonMistake: {
              action: '在UTG用KJo开牌加注',
              reasoning: 'KJo看起来不错，但在前位太弱。如果后位有人3-Bet，你将处于非常困难的境地。',
              evLoss: '-0.8 BB/100',
            },
          },
          {
            id: 'l1-position-ex2',
            title: 'BTN 位置偷盲成功',
            heroHand: ['Tc', '8c'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'UTG', action: 'fold' },
              { player: 'MP', action: 'fold' },
              { player: 'CO', action: 'fold' },
            ],
            street: 'preflop',
            effectiveStack: 100,
            potSize: 1.5,
            correctDecision: {
              action: 'Raise',
              amount: '2.5BB',
              reasoning: [
                'T8s 在 BTN 面对全 fold 是标准开牌',
                'BTN 位置可以最宽范围开牌（约 40-50% 手牌）',
                '同花连牌有很好的翻后可玩性',
                '只剩 SB 和 BB，很可能直接赢得盲注',
              ],
            },
            commonMistake: {
              action: 'Fold（打得太紧）',
              reasoning: '在BTN面对全fold弃掉T8s太紧了。这是位置优势最明显的场景，应该充分利用。',
              evLoss: '-0.6 BB/100',
            },
          },
        ],
        practice: {
          id: 'l1-position-practice',
          questions: [
            {
              id: 'l1-position-p1',
              scenario: {
                heroHand: ['Ad', '9d'],
                heroPosition: 'UTG',
                previousActions: [],
                street: 'preflop',
                potSize: 1.5,
                effectiveStack: 100,
              },
              options: [
                { action: 'Fold', isCorrect: true, explanation: 'A9s 在UTG属于边缘牌，前位应该弃牌。容易被支配（对手可能有AQ、AJ、AT）。', evImpact: '0 BB/100' },
                { action: 'Raise', amount: '2.5BB', isCorrect: false, explanation: 'A9s 在UTG开牌太松。前位只打最强的10-12%手牌，A9s不在此列。', evImpact: '-0.7 BB/100' },
                { action: 'Call', isCorrect: false, explanation: 'UTG没有加注可以跟注，而且A9s在前位不值得入局。', evImpact: '-0.5 BB/100' },
              ],
            },
            {
              id: 'l1-position-p2',
              scenario: {
                heroHand: ['Ad', '9d'],
                heroPosition: 'BTN',
                previousActions: [
                  { player: 'UTG', action: 'fold' },
                  { player: 'MP', action: 'fold' },
                  { player: 'CO', action: 'fold' },
                ],
                street: 'preflop',
                potSize: 1.5,
                effectiveStack: 100,
              },
              options: [
                { action: 'Fold', isCorrect: false, explanation: 'A9s 在BTN面对全fold是很好的开牌手牌，弃牌太紧了。', evImpact: '-0.8 BB/100' },
                { action: 'Raise', amount: '2.5BB', isCorrect: true, explanation: 'A9s 在BTN是标准开牌。同花Ace有很好的翻后潜力，BTN位置优势明显。', evImpact: '+1.2 BB/100' },
                { action: 'Call', isCorrect: false, explanation: '前位没有人加注，这里应该主动加注而不是“跟注”。', evImpact: '-0.3 BB/100' },
              ],
            },
            {
              id: 'l1-position-p3',
              scenario: {
                heroHand: ['Js', 'Ts', ],
                heroPosition: 'CO',
                previousActions: [
                  { player: 'UTG', action: 'fold' },
                  { player: 'MP', action: 'fold' },
                ],
                street: 'preflop',
                potSize: 1.5,
                effectiveStack: 100,
              },
              options: [
                { action: 'Fold', isCorrect: false, explanation: 'JTs 在CO面对全fold是很好的开牌手牌，弃牌太紧。', evImpact: '-1.0 BB/100' },
                { action: 'Raise', amount: '2.5BB', isCorrect: true, explanation: 'JTs 是同花连牌，在CO是标准开牌。有很好的顺子和同花潜力，位置也不错。', evImpact: '+1.5 BB/100' },
                { action: 'Call', isCorrect: false, explanation: '前位没有人加注，应该主动加注开牌。', evImpact: '-0.4 BB/100' },
              ],
            },
          ],
        },
        units: [
          {
            id: 'u1',
            title: '为什么位置如此重要？',
            sections: L1_POSITION_U1_SECTIONS,
          },
          {
            id: 'u2',
            title: '位置分类',
            sections: L1_POSITION_U2_SECTIONS,
            exampleId: 'l1-position-ex1',
            checkpoint: true,
          },
          {
            id: 'u3',
            title: '位置优势的体现',
            sections: L1_POSITION_U3_SECTIONS,
            exampleId: 'l1-position-ex2',
            checkpoint: true,
          },
        ],
      },
      {
        id: 'l1-hand-selection',
        level: 1,
        order: 3,
        title: '起手牌选择',
        subtitle: '学会在正确的时机打正确的牌',
        duration: '10 min',
        content: [
          { type: 'heading', content: '起手牌选择的重要性' },
          {
            type: 'text',
            content:
              '起手牌选择（Starting Hand Selection）是德州扑克最基础也最重要的技能。打得太多（太松）或太少（太紧）都会严重影响你的盈利。',
          },
          {
            type: 'key-point',
            content: '新手最常犯的错误：打太多手牌。在6人桌中，你应该只打约20-25%的手牌。',
          },
          { type: 'heading', content: '手牌分类' },
          {
            type: 'text',
            content:
              '第一梯队（任何位置可打）：AA, KK, QQ, AKs\n第二梯队（中位以后可打）：JJ, TT, AQs, AQo, AJs\n第三梯队（后位/盲注可打）：99-22, KQs, KJs, QJs, JTs, T9s, 98s\n垃圾牌（任何位置都应弃牌）：72o, 83o, 94o 等非同花小牌',
          },
          {
            type: 'highlight',
            content: 's = suited（同花），o = offsuit（非同花）。同花牌比非同花牌价值高约3-4%。',
          },
          { type: 'heading', content: '选择原则' },
          {
            type: 'text',
            content:
              '1. 高牌价值：A/K/Q/J 的高牌组合更强\n2. 连接性：连牌（如 JTs）有顺子潜力\n3. 同花性：同花牌有同花潜力\n4. 支配性：避免打容易被支配的牌（如 K3o vs KQo）',
          },
          {
            type: 'pro-tip',
            content:
              '职业牌手的起手牌范围远比休闲玩家紧。宁可少打好牌，也不要在边缘情况下损失大量筹码。纪律性（Discipline）是职业牌手最重要的素质之一。',
          },
          {
            type: 'formula',
            content: '起手牌组合数学（原子单位）：\n任意口袋对子（如 AA）= C(4,2) = 6 种组合\n任意同花牌（如 AKs）= 4 种组合\n任意非同花牌（如 AKo）= 4×4-4 = 12 种组合\n任意两张不同点数的牌 = 16 种组合\n\n拿到任意口袋对子的概率 = 78/1326 ≈ 5.9%（约每 17 手一次）\n拿到 AA 的概率 = 6/1326 ≈ 0.45%（约每 221 手一次）',
          },
          {
            type: 'theory-reference',
            content: '理论支撑：起手牌的概率计算与组合计数详见理论学院 T1 第 1 章。起手牌 EV 分层与位置选择的关系见 T3 第 1 章。',
            data: { theoryLevelId: 't1', theoryChapterId: 't1-combinatorics' },
          },
          {
            type: 'counter-intuitive',
            content: '反直觉点：AKs 只有 4 种组合，而 AA 有 6 种组合。虽然 AK 看起来"气势最足"，但它的组合数比重不如口袋对子。在范围分析中，对手 3Bet 范围里对子的组合权重往往远超 AK，这是很多初学者会忽略的定量偏差。',
          },
        ],
        quiz: [
          {
            id: 'l1-hand-q1',
            question: '6人桌中，理想的入局率大约是？',
            options: ['10%', '20-25%', '40%', '60%'],
            correctIndex: 1,
            explanation: '6人桌中你应该只打约20-25%的手牌。打太多手牌是初学者最常见的错误。',
          },
          {
            id: 'l1-hand-q2',
            question: '以下哪手牌在 UTG 可以加注开牌？',
            options: ['K8o', 'QJo', 'AJs', '76o'],
            correctIndex: 2,
            explanation: 'AJs（同花Ace+Jack）足够强，在UTG可以标准开牌。K8o和76o太弱，QJo在前位也不够强。',
          },
          {
            id: 'l1-hand-q3',
            question: '"s" 在 AKs 中代表什么？',
            options: ['small（小）', 'suited（同花）', 'strong（强）', 'straight（顺子）'],
            correctIndex: 1,
            explanation: 's = suited（同花），表示两张牌花色相同。AKs 表示同花的 Ace 和 King。',
          },
        ],
        examples: [
          {
            id: 'l1-hand-ex1',
            title: '边缘牌判断：A5o 在 MP',
            heroHand: ['Ah', '5c'],
            heroPosition: 'MP',
            previousActions: [
              { player: 'UTG', action: 'fold' },
            ],
            street: 'preflop',
            effectiveStack: 100,
            potSize: 1.5,
            correctDecision: {
              action: 'Fold',
              reasoning: [
                'A5o 在 MP 应该弃牌',
                '虽然有一张A，但 kicker 太弱（5）',
                '非同花没有同花潜力，连接性也很差',
                '容易被支配（对手可能有AQ、AJ、AT）',
              ],
            },
            commonMistake: {
              action: '因为有A就开牌加注',
              reasoning: '很多新手看到A就想打，但A5o的kicker太弱。如果对手也有A，你几乎总是输。',
              evLoss: '-0.9 BB/100',
            },
          },
          {
            id: 'l1-hand-ex2',
            title: '同花连牌的价值：98s 在 CO',
            heroHand: ['9s', '8s'],
            heroPosition: 'CO',
            previousActions: [
              { player: 'UTG', action: 'fold' },
              { player: 'MP', action: 'fold' },
            ],
            street: 'preflop',
            effectiveStack: 100,
            potSize: 1.5,
            correctDecision: {
              action: 'Raise',
              amount: '2.5BB',
              reasoning: [
                '98s 在 CO 是标准开牌',
                '同花连牌有很好的翻后可玩性',
                '可以组成顺子、同花、两对等多种强牌',
                'CO位置足够后，范围可以放宽',
              ],
            },
            commonMistake: {
              action: 'Fold（认为9和8太小）',
              reasoning: '同花连牌的价值不在于高牌，而在于连接性和同花性。98s在CO是+EV的开牌。',
              evLoss: '-0.5 BB/100',
            },
          },
        ],
        practice: {
          id: 'l1-hand-practice',
          questions: [
            {
              id: 'l1-hand-p1',
              scenario: {
                heroHand: ['Kc', '3d'],
                heroPosition: 'BTN',
                previousActions: [
                  { player: 'UTG', action: 'fold' },
                  { player: 'MP', action: 'fold' },
                  { player: 'CO', action: 'fold' },
                ],
                street: 'preflop',
                potSize: 1.5,
                effectiveStack: 100,
              },
              options: [
                { action: 'Fold', isCorrect: true, explanation: 'K3o 即使在BTN也太弱。kicker 3太弱，非同花没有额外价值，属于应该弃牌的范畴。', evImpact: '0 BB/100' },
                { action: 'Raise', amount: '2.5BB', isCorrect: false, explanation: 'K3o 太弱了，即使在最宽的BTN开牌范围中也不包含这手牌。', evImpact: '-0.8 BB/100' },
                { action: 'Call', isCorrect: false, explanation: '前位没有加注，而且K3o不值得用任何方式入局。', evImpact: '-0.5 BB/100' },
              ],
            },
            {
              id: 'l1-hand-p2',
              scenario: {
                heroHand: ['Qs', 'Js'],
                heroPosition: 'MP',
                previousActions: [
                  { player: 'UTG', action: 'fold' },
                ],
                street: 'preflop',
                potSize: 1.5,
                effectiveStack: 100,
              },
              options: [
                { action: 'Fold', isCorrect: false, explanation: 'QJs 在MP是很好的开牌手牌，弃牌太紧。同花高连牌有很强的翻后潜力。', evImpact: '-0.8 BB/100' },
                { action: 'Raise', amount: '2.5BB', isCorrect: true, explanation: 'QJs 是同花高连牌，在MP是标准开牌。有很好的顺子、同花和高牌潜力。', evImpact: '+1.3 BB/100' },
                { action: 'Call', isCorrect: false, explanation: '前位没有加注，应该主动加注开牌。', evImpact: '-0.4 BB/100' },
              ],
            },
            {
              id: 'l1-hand-p3',
              scenario: {
                heroHand: ['Ac', 'Qc'],
                heroPosition: 'UTG',
                previousActions: [],
                street: 'preflop',
                potSize: 1.5,
                effectiveStack: 100,
              },
              options: [
                { action: 'Fold', isCorrect: false, explanation: 'AQs 是第二梯队最强的手牌之一，在任何位置都可以开牌。', evImpact: '-1.5 BB/100' },
                { action: 'Raise', amount: '2.5BB', isCorrect: true, explanation: 'AQs 在UTG是标准开牌。同花AQ属于顶级起手牌，任何位置都可以加注。', evImpact: '+2.0 BB/100' },
                { action: 'Call', isCorrect: false, explanation: 'UTG没有加注可以跟注，应该主动加注。', evImpact: '-0.5 BB/100' },
              ],
            },
          ],
        },
      },
      {
        id: 'l1-bankroll',
        level: 1,
        order: 4,
        title: '资金管理入门',
        subtitle: '保护你的扑克资金，避免破产风险',
        duration: '7 min',
        content: [
          { type: 'heading', content: '为什么资金管理如此重要？' },
          { type: 'text', content: '资金管理（Bankroll Management）是所有成功牌手的基石。无论你的技术多好，如果没有合理的资金管理，方差（Variance）迟早会让你破产。' },
          { type: 'key-point', content: '黄金法则：永远不要用超过总资金 5% 的金额坐下一张牌桌。对于现金桌，建议有 20-30 个买入；对于锦标赛，建议有 50-100 个买入。' },
          { type: 'heading', content: '不同级别的资金要求' },
          { type: 'example', content: '现金桌 NL10（大盲 $0.10）：\n  最低资金：20 × $10 = $200\n  推荐资金：30 × $10 = $300\n\n现金桌 NL50（大盲 $0.50）：\n  最低资金：20 × $50 = $1,000\n  推荐资金：30 × $50 = $1,500\n\n锦标赛 $11 买入：\n  最低资金：50 × $11 = $550\n  推荐资金：100 × $11 = $1,100' },
          { type: 'heading', content: '升级与降级规则' },
          { type: 'text', content: '当你的资金增长到更高级别的标准线时，可以尝试升级：\n• 升级条件：资金达到高一级的 30 个买入\n• 降级条件：资金降到当前级别的 20 个买入以下\n• 降级不丢人——保护资金才是长期赢家的做法' },
          { type: 'pro-tip', content: '将扑克资金与生活费完全分开。永远不要用"不能输"的钱打牌，因为这会严重影响你的决策质量。' },
        {
          type: 'formula',
          content: 'Kelly 准则（资金管理中的最优下注比例）：\nf* = (bp - q) / b\n其中 f* = 最优资金比例，b = 赔率（净赔率），p = 胜率，q = 败率 = 1-p\n\n现金桌资金要求：20-30 个买入（最低-推荐）\n锦标赛资金要求：50-100 个买入（最低-推荐）\n\n例：NL10 桌，每个买入 $10，推荐资金 = 30 × $10 = $300',
        },
        {
          type: 'theory-reference',
          content: '理论支撑：资金管理的量化模型与 Kelly 准则在扑克中的应用详见理论学院 T8 第 2 章"资金心理与量化管理"。T8 全面覆盖了扑克心理学中的资金管理方法论。',
          data: { theoryLevelId: 't8', theoryChapterId: 't8-psychology' },
        },
        ],
        quiz: [
          { id: 'l1-bankroll-q1', question: '打 NL10 现金桌，推荐至少有多少资金？', options: ['$50', '$100', '$200', '$500'], correctIndex: 2, explanation: '20个买入 × $10/买入 = $200 是最低要求，推荐 $300（30个买入）。' },
          { id: 'l1-bankroll-q2', question: '什么时候应该降级？', options: ['连输3天', '心情不好时', '资金降到当前级别20个买入以下', '只要输了就降'], correctIndex: 2, explanation: '降级决策应基于客观的资金标准，而非情绪。资金不足时降级保护本金。' },
          { id: 'l1-bankroll-q3', question: '以下哪个做法是错误的？', options: ['扑克资金与生活费分开', '设置止损线', '输了借钱翻本', '记录每次打牌结果'], correctIndex: 2, explanation: '借钱翻本是最危险的做法，会导致倾斜和更大的损失。' },
        ],
      },
      {
        id: 'l1-leaks',
        level: 1,
        order: 5,
        title: '常见新手错误 Top 10',
        subtitle: '识别并修正初学者最常犯的十大致命错误',
        duration: '9 min',
        content: [
          { type: 'heading', content: '为什么识别错误比学习技巧更重要？' },
          { type: 'text', content: '修正一个错误带来的收益往往大于学习一个新技巧。以下是初学者最常犯的 10 个错误（Leaks），从最严重到最轻排列：' },
          { type: 'heading', content: 'Leak #1：打太多手牌（VPIP过高）' },
          { type: 'text', content: '新手通常参与 40-60% 的牌局，而赢利玩家通常只打 20-28%。\n\n修正方法：严格遵守翻前范围表，只打"值得打"的牌。' },
          { type: 'heading', content: 'Leak #2：位置意识缺失' },
          { type: 'text', content: '在不利位置打太多牌，忽视位置优势。\n\n修正方法：前位（UTG/HJ）只打最强的 15% 手牌，后位（CO/BTN）可以放宽到 25-35%。' },
          { type: 'heading', content: 'Leak #3：被动跟注（太多Call，太少Raise）' },
          { type: 'text', content: '"Call是最弱的行动"——大多数时候你应该选择加注或弃牌，而不是被动跟注。' },
          { type: 'heading', content: 'Leak #4：下注尺度不合理' },
          { type: 'text', content: '下注太小让对手轻松跟注；下注太大浪费了小注可以达到的效果。\n\n标准：翻牌 1/3-2/3 pot，转牌/河牌 2/3-full pot。' },
          { type: 'heading', content: 'Leak #5-10' },
          { type: 'text', content: '#5 不关注底池大小（无法计算赔率）\n#6 情绪失控后继续打（Tilt）\n#7 诈唬频率失衡（要么不bluff，要么bluff太多）\n#8 忽视对手行为模式\n#9 不做牌局复盘\n#10 不设止损和时间限制' },
          { type: 'key-point', content: '每修正一个 Leak，你的赢率可能提升 1-3 BB/100。修正前 5 个 Leak 就能让你从输家变成赢家。' },
          { type: 'pro-tip', content: '每周选一个 Leak 集中修正，比同时修正所有问题有效得多。用打卡日历追踪你的修正进度。' },
        {
          type: 'theory-reference',
          content: '理论支撑：常见 Leak 背后的数学本质是 EV 决策框架的缺失。期望值的完整定义与推导见理论学院 T2 第 1 章"期望值（EV）：所有决策的统一度量"。理解 EV 概念后，每个 Leak 都可以被量化为 -EV 行为的重复模式。',
          data: { theoryLevelId: 't2', theoryChapterId: 't2-ev' },
        },
        {
          type: 'counter-intuitive',
          content: '反直觉点：经常输的决策仍然可能是正确的决策。EV 只保证长期平均盈利，单次结果受方差支配。一个 +EV 的跟注可能连续输 10 次，但第 11 次的 EV 仍然是正的。职业牌手关注的是决策质量，而非单次结果。',
        },
        ],
        quiz: [
          { id: 'l1-leaks-q1', question: '赢利玩家的 VPIP 通常在什么范围？', options: ['40-60%', '30-40%', '20-28%', '10-15%'], correctIndex: 2, explanation: '6-max 赢利玩家通常 VPIP 在 20-28% 之间，具体取决于位置和打法风格。' },
          { id: 'l1-leaks-q2', question: '以下哪个不是常见的新手错误？', options: ['打太多手牌', '严格遵守范围表', '总是跟注不加注', '忽视位置'], correctIndex: 1, explanation: '严格遵守范围表是正确的做法，不是错误。' },
          { id: 'l1-leaks-q3', question: '翻牌的标准下注尺度是？', options: ['1/4 pot', '1/3 到 2/3 pot', '满池', '2倍池'], correctIndex: 1, explanation: '翻牌标准下注为 1/3 到 2/3 底池，根据牌面质地和范围优势调整。' },
        ],
      },
      // ===== P0-3.7: 注册 4 个 Drill 类型 lesson =====
      // 注：order 字段沿用 6-9（已有 lesson 1-5 不变），实际播放顺序由 learningTracks 控制
      {
        id: 'drill-hand-ranking',
        level: 1,
        order: 6,
        title: '牌力排名闪电战',
        subtitle: '10 道快题，秒判牌型与牌力大小',
        duration: '3 min',
        content: [],
        quiz: [],
        type: 'drill',
        drillComponent: 'HandRankingDrill',
      },
      {
        id: 'drill-position',
        level: 1,
        order: 7,
        title: '位置认知训练',
        subtitle: '8 道交互题，点击 6-max 桌位识别 UTG/MP/CO/BTN/SB/BB',
        duration: '2 min',
        content: [],
        quiz: [],
        type: 'drill',
        drillComponent: 'PositionDrill',
      },
      {
        id: 'drill-outs',
        level: 1,
        order: 8,
        title: 'Outs 速算',
        subtitle: '8 道题，覆盖同花/OESD/Gutshot/二四法则',
        duration: '3 min',
        content: [],
        quiz: [],
        type: 'drill',
        drillComponent: 'OutsDrill',
      },
      {
        id: 'drill-pot-odds',
        level: 1,
        order: 9,
        title: '底池赔率直觉',
        subtitle: '6 道图形化赔率计算与跟注/弃牌决策',
        duration: '3 min',
        content: [],
        quiz: [],
        type: 'drill',
        drillComponent: 'PotOddsDrill',
      },
];
