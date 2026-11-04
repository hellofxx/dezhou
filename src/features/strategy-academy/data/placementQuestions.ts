/**
 * 策略定位测评题库（P1）。
 *
 * 定位测评的目的只有一个：决定用户从哪个 Level 进入标准课程体系，
 * 结果只写 `placement.creditLevels`（放宽条目访问），**绝不写 completedLessons**。
 *
 * 题库口径：
 * - 固定 16 题，覆盖 L1-L4 核心概念（牌型 / 位置 / 赔率 / 翻前范围 / C-bet / EV / GTO-MDF / ICM-心理）
 * - 全部为概念与决策判断题，不编造 EV 金额等无法标定的数值
 * - `options` 与 `correctIndex` 的书写顺序不代表展示顺序：渲染前经
 *   `orderResolvedOptions`（utils/placement.ts → utils/quizShuffle.ts）重排，
 *   判分以重排后对象为唯一事实源
 * - 文案为数据层中文（唯一事实源），渲染层经 `academy.placement.question.<id>.*`
 *   i18n key 覆盖，key 形态见 utils/placement.ts
 */

/** 考核主题（用于结果页与题量分布展示；排序稳定） */
export const PLACEMENT_TOPICS = [
  'handRanking',
  'position',
  'potOdds',
  'preflopRange',
  'cbet',
  'ev',
  'gto',
  'icm',
] as const;

export type PlacementTopic = (typeof PLACEMENT_TOPICS)[number];

export interface PlacementQuestion {
  id: string;
  topic: PlacementTopic;
  /** 概念所属层级标签（1=L1，2=L2，3=L3，4=L4A/L4B），仅作展示与分布统计 */
  level: 1 | 2 | 3 | 4;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const PLACEMENT_QUESTIONS: readonly PlacementQuestion[] = [
  {
    id: 'pq-hand-ranking-flush',
    topic: 'handRanking',
    level: 1,
    question: '标准德州扑克牌型中，下面哪个牌型最大？',
    options: ['两对', '顺子', '同花', '三条'],
    correctIndex: 2,
    explanation:
      '牌型从高到低：同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌。同花高于顺子，这是最容易被记反的一对。',
  },
  {
    id: 'pq-kicker-compare',
    topic: 'handRanking',
    level: 1,
    question: '公共牌 K♦ 7♣ 2♠，你持 K♣ Q♠，对手持 K♥ J♦，摊牌结果如何？',
    options: ['平分底池', '对手赢（J 作踢脚）', '你赢（Q 作踢脚）', '无法判断，需看转牌'],
    correctIndex: 2,
    explanation:
      '双方都是一对 K，比较踢脚：你的 Q 大于对手的 J，因此你赢下底池。踢脚决定同一牌型下的胜负。',
  },
  {
    id: 'pq-position-postflop-last',
    topic: 'position',
    level: 1,
    question: '6 人桌（6-max）中，翻牌后最后一个行动的位置是？',
    options: ['小盲（SB）', '大盲（BB）', '枪口位（UTG）', '按钮位（BTN）'],
    correctIndex: 3,
    explanation:
      '翻后行动顺序自小盲开始，按钮位（BTN）最后行动，能看到所有对手的决定后再做选择，是全场最有利的位置。',
  },
  {
    id: 'pq-position-range-width',
    topic: 'position',
    level: 2,
    question: '翻前从 UTG 到 BTN 位置逐渐靠后，开池范围应该怎样变化？',
    options: ['越靠后越宽', '越靠后越紧', '保持不变，全桌统一', '只取决于当天手感'],
    correctIndex: 0,
    explanation:
      '位置越靠后，翻后拥有位置优势，可以用更宽的范围开池；越靠前则应收紧范围，弥补翻后位置劣势。',
  },
  {
    id: 'pq-pot-odds-quarter',
    topic: 'potOdds',
    level: 2,
    question: '底池 100，对手下注 50，你需要跟注 50。按底池赔率，跟注所需的最低权益约为？',
    options: ['约 25%', '约 33%', '约 40%', '约 50%'],
    correctIndex: 0,
    explanation:
      '跟注 50 后底池总额为 100 + 50 + 50 = 200，所需权益 = 50 / 200 = 25%。权益高于该比例时跟注才有正期望。',
  },
  {
    id: 'pq-mdf-half-pot',
    topic: 'potOdds',
    level: 3,
    question: '底池 100，对手下注 50。按最小防守频率（MDF），你应继续游戏约多少比例的范围？',
    options: ['约 50%', '约 67%', '约 75%', '约 85%'],
    correctIndex: 1,
    explanation:
      'MDF = 底池 /（底池 + 下注）= 100 / 150 ≈ 67%。低于该频率弃牌过多，对手用任意两张牌下注即可获利。',
  },
  {
    id: 'pq-utg-open-tightest',
    topic: 'preflopRange',
    level: 2,
    question: '6-max 桌翻前，开池范围通常最紧的位置是？',
    options: ['UTG（枪口位）', 'CO（劫位）', 'BTN（按钮位）', 'SB（小盲位）'],
    correctIndex: 0,
    explanation:
      'UTG 之后仍有最多对手未行动，且翻后位置最差，因此开池范围最紧；越往后越宽，BTN 最宽。',
  },
  {
    id: 'pq-ip-after-3bet',
    topic: 'preflopRange',
    level: 3,
    question: 'BTN 开池后被 BB 3-bet，BTN 跟注。翻牌后 BTN 在 BB 之后行动，这说明？',
    options: ['BB 拥有位置优势', '双方位置完全对等', 'BTN 拥有位置优势', '位置由筹码量决定'],
    correctIndex: 2,
    explanation:
      '翻后最后行动即拥有位置优势：BTN 看到 BB 的动作后再决策，信息更多、权益实现更容易。位置优势由行动顺序决定，与筹码量无关。',
  },
  {
    id: 'pq-cbet-dry-board',
    topic: 'cbet',
    level: 3,
    question: '作为翻前加注者，在 K♣ 7♦ 2♠ 这类干燥面上，持续下注频率通常应？',
    options: ['低于同花听牌密集的湿面', '高于同花听牌密集的湿面', '与牌面无关，保持固定', '必须先看转牌再决定'],
    correctIndex: 1,
    explanation:
      '干燥面对手很难组成强牌或听牌，持续下注更容易直接拿下底池，因此频率更高；湿面则要更谨慎地挑选下注牌。',
  },
  {
    id: 'pq-range-bet-board',
    topic: 'cbet',
    level: 3,
    question: '用整个范围做小尺度持续下注（范围下注）最适合哪种牌面？',
    options: ['对手范围高度集中的牌面', '听牌密集的多路底池', '对你范围有利的干燥牌面', '任意牌面都适用'],
    correctIndex: 2,
    explanation:
      '范围下注依赖牌面对你整体范围更有利、对手难以反击；牌面越干燥、越偏向你的范围，越适合用整个范围做小尺度下注。',
  },
  {
    id: 'pq-ev-meaning',
    topic: 'ev',
    level: 3,
    question: '一个决策是「正 EV」的，意味着？',
    options: ['这一次一定会赢', '胜率必然超过一半', '长期重复该决策平均能够盈利', '与底池赔率毫无关系'],
    correctIndex: 2,
    explanation:
      'EV 是长期平均值：单次结果可能输，但只要重复执行正 EV 决策，长期平均收益为正。胜负结果不能反推决策质量。',
  },
  {
    id: 'pq-equity-vs-price',
    topic: 'ev',
    level: 3,
    question: '判断是否值得跟注时，最核心的比较是什么？',
    options: ['手牌牌力与对手形象', '你的权益与底池赔率', '筹码量与位置', '下注次数与下注尺度'],
    correctIndex: 1,
    explanation:
      '跟注的收益取决于权益能否覆盖底池赔率：权益高于所需赔率时跟注为正 EV，低于则应弃牌。牌力强弱本身不是判据。',
  },
  {
    id: 'pq-gto-unexploitable',
    topic: 'gto',
    level: 4,
    question: 'GTO（博弈论最优）策略的核心特征是？',
    options: ['让每一手牌都实现最大价值', '让对手无论怎样偏离都无法稳定获利', '永远使用最大尺度下注', '只针对弱玩家做调整'],
    correctIndex: 1,
    explanation:
      'GTO 是不可被剥削的策略：对手任何单方面偏离都无法稳定获利。它是防守基准，不等于针对具体对手的最优解。',
  },
  {
    id: 'pq-gto-frequency-mix',
    topic: 'gto',
    level: 4,
    question: '在 GTO 框架里，同一手牌为什么要按频率混合不同动作？',
    options: ['为了让对手难以从你的范围推断牌力', '因为随机在数学上更公平', '为了减少思考时间', '因为规则要求必须混合'],
    correctIndex: 0,
    explanation:
      '混合频率让范围保持无漏洞：如果某手牌永远只做一种动作，对手就能据此刻画你的范围并加以剥削。',
  },
  {
    id: 'pq-icm-bubble',
    topic: 'icm',
    level: 4,
    question: '锦标赛泡沫期（临近钱圈）持有中等筹码时，与现金桌相比通常应该？',
    options: ['更愿意接受与大筹码的翻前赌博', '更回避与大筹码的翻前掷硬币局面', '与现金桌完全一样', '更频繁地用任意两张牌全下'],
    correctIndex: 1,
    explanation:
      'ICM 下筹码价值是非线性的：出局意味着失去全部奖金机会，因此应更回避与大筹码的高波动对抗，泡沫期尤其明显。',
  },
  {
    id: 'pq-tilt-chase',
    topic: 'icm',
    level: 4,
    question: '连续输掉几个底池后，为了「追回损失」而放宽跟注范围，这属于？',
    options: ['情绪化倾斜（tilt）决策', '精准的剥削调整', '标准的范围平衡', '正常的价值下注'],
    correctIndex: 0,
    explanation:
      '以挽回损失为目的改变策略是典型的 tilt 表现：决策依据从牌面与赔率变成了情绪，长期会显著降低期望收益。',
  },
];
