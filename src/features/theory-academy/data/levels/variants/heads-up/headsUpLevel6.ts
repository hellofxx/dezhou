import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { headsUpRules } from '../variantRules';

const variant: PokerVariant = 'heads-up';

export const HEADS_UP_LEVEL_6: TheoryLevelInfo = {
  id: 't6hu',
  level: 6,
  tier: 'intermediate',
  title: '单挑下注工程',
description: '设计最优下注尺与街间协调',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T5HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l3hu-bn-aggression', title: '按钮位激进度' },
      { id: 'l3hu-sb-continuation', title: 'SB 持续下注' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't6hu-sizing-optimal',
      level: 6,
      order: 1,
      title: '最优下注尺',
      subtitle: '小尺度与大额下注的选择',
      duration: '15 min',
      eloDimension: 'postflop',
      objectives: [
        '理解下注尺度的三因素：牌力层级、范围优势与底池几何（SPR）',
        '掌握单挑中"小注控池、大注极化"的尺度逻辑与价值:诈唬比随尺度变化',
        '学会根据筹码深度（SPR）选择翻牌/转牌尺度，规划河牌全下',
      ],
      content: [
        { type: 'heading', content: '尺度：下注工程的第一个旋钮' },
        {
          type: 'text',
          content:
            '下注尺度（Bet Size）是单挑翻后最重要的决策之一。它同时传递三个信号：牌力（价值大注 vs 诈唬）、范围结构（极化 vs 线性）、控池意图（小注留对手、大注抢底池）。单挑中尺度选择的核心逻辑是"小注控池、大注极化"——这与满员桌类似，但单挑更极端：因为对手范围宽、决策密，小注的控池价值与超池的极化价值都被放大。',
        },
        {
          type: 'key-point',
          content:
            '尺度不决定你"有没有价值"，而决定你"怎么变现价值"。同花顺坚果可以用超池全下榨干对手，顶对弱踢脚只能用 1/3 池小注薄价值——选错尺度，等于选错变现方式。',
        },
        { type: 'heading', content: '价值:诈唬比随尺度的变化' },
        {
          type: 'formula',
          content:
            '下注尺度的价值:诈唬比（底池 P、下注 bP）：\n\n诈唬占比 f = b/(1+2b)\n\n例：\n1/3 池 b≈0.33 → f = 0.33/1.66 ≈ 20%（价值:诈唬 = 4:1）\n半池 b=0.5 → f = 0.25（3:1）\n满池 b=1 → f = 1/3（2:1）\n2 倍池 b=2 → f = 0.4（3:2）\n\n结论：尺度越大，允许携带的诈唬越多——"大注=极化"的数学根源。（概念源自：《Modern Poker Theory》Michael Acevedo Ch.2-3 GTO 下注结构）',
        },
        {
          type: 'text',
          content:
            '单挑中尺度选择的实际偏好：干燥高牌面用 1/3 池小注高频（对手宽范围难中牌，小注即可让他弃牌或给边缘牌定价）；湿润连牌面用 2/3 池以上大注或超池（保护权益、极化）。而翻牌圈单挑通常倾向小注（1/3 池）——因为底池小、对手宽、你的范围优势大，小注即可实现薄价值与偷池。',
        },
        {
          type: 'example',
          content:
            '实例：单挑翻牌 K♠7♦2♣（干燥），SB min-raise、BB 跟注，底池 2BB。SB 持 A♠K♣（顶对顶踢脚）。此面干燥，BB 范围极少中 K，SB 用 1/3 池小注（约 0.7BB）即可：顶对 K 的薄价值让宽范围的弱牌付费，同时不给 BB 的垃圾牌免费看牌。若用满池大注，BB 只会留下更强的 K 或 set 跟你，K 的薄价值被浪费。',
        },
        {
          type: 'example',
          content:
            '实例二（SPR 规划全下）：单挑 100BB 深，翻前 SB raise 2.5BB、BB 跟注，底池 5BB，SPR = 97.5/5 ≈ 19.5。翻牌 9♠8♥4♣，SB 持 6♠5♠（顺子听牌）。高 SPR 下，SB 可用大注（2/3 池约 3.3BB）下注建立底池——为转牌/河牌的全下铺路：底池 11.6BB → 转牌下注 7.7BB → 底池 27BB → 河牌全下剩余 86BB，筹码自然打光。若翻牌小注 1/3 池，底池增长太慢，深筹码无法在河牌完成全下。',
        },
        {
          type: 'example',
          content:
            '实例三（小注控池）：同一 9♠8♥4♣ 面，SB 持 J♣T♣（顶对 + 顺子听牌，但易被反超）。中等牌力不追求打光筹码，SB 用 1/3 池小注控制底池规模，避免被 BB 的强牌加注后陷入大底池。小注既是"让弱牌付费"，也是"控制风险敞口"。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：单挑中小注不是"软弱"，而是"精确"——1/3 池小注在干燥面高频使用是 GTO 常态，因为它最大化薄价值与偷池比。满员桌"下注要够大才有威胁"的直觉在单挑宽范围下会变成浪费。',
        },
        {
          type: 'pro-tip',
          content:
            '尺度速查：(1) 报 SPR——低 SPR 打光、高 SPR 需规划多街；(2) 看牌面——干燥高牌面小注高频、湿润低牌面大注保护；(3) 定牌力——坚果超池、顶对小注、听牌中注。三步走完，尺度就有结构而非感觉。',
        },
      ],
      quiz: [
        {
          id: 't6hu-sizing-optimal-q1',
          question: '下注尺度越大，均衡策略允许携带的诈唬占比会：',
          options: ['减少', '增加', '不变', '无规律'],
          correctIndex: 1,
          explanation: 'f = b/(1+2b) 随 b 单调上升：满池诈唬 33%、2 倍池 40%。尺度越大对手跟注价格越差，可容纳越高诈唬密度。',
        },
        {
          id: 't6hu-sizing-optimal-q2',
          question: '干燥高牌面（如 K♠7♦2♣），顶对的最优尺度倾向是：',
          options: [
            '满池大注施压',
            '1/3 池小注薄价值，避免宽范围只留强牌跟注',
            '过牌',
            '超池全下',
          ],
          correctIndex: 1,
          explanation: '干燥面对手难中牌，小注即可薄价值让弱牌付费、控池；大注只会让 BB 留下更强的牌，浪费 K 的薄价值。',
        },
        {
          id: 't6hu-sizing-optimal-q3',
          question: 'SPR ≈ 19.5（深筹码），翻牌持强听牌，正确的尺度策略是：',
          options: [
            '小注控池',
            '大注建立底池，为转牌/河牌全下铺路',
            '过牌',
            '直接全下',
          ],
          correctIndex: 1,
          explanation: '高 SPR 下需用大注让底池几何级增长，才能在河牌完成全下。小注底池增长太慢，深筹码无法打光。',
        },
        {
          id: 't6hu-sizing-optimal-q4',
          question: '中等牌力（如顶对带顺子听牌）在下注尺度上的倾向是：',
          options: [
            '超池极化',
            '小注控池，控制风险敞口',
            '满池大注',
            '总是过牌',
          ],
          correctIndex: 1,
          explanation: '中等牌力不追求打光，小注既能薄价值又能控制被反加的风险。超池/满池会把中等牌陷入大底池尴尬。',
        },
        {
          id: 't6hu-sizing-optimal-q5',
          question: '半池下注的均衡诈唬占比约为：',
          options: ['20%', '25%', '33%', '40%'],
          correctIndex: 1,
          explanation: 'f = 0.5/(1+1) = 0.25，价值:诈唬 = 3:1。33% 是满池、20% 是 1/3 池、40% 是 2 倍池。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't6hu-barrel',
      level: 6,
      order: 2,
      title: '多条 streets',
      subtitle: '连续下注的协调性',
      duration: '12 min',
      eloDimension: 'postflop',
      objectives: [
        '理解单挑多街下注（barrel）的协调逻辑：翻牌/转牌/河牌的尺度与频率联动',
        '掌握连开三枪（triple barrel）的适用条件与牌面易手（board change）调整',
        '学会根据对手范围收窄与底池增长，动态分配各街的下注组合',
      ],
      content: [
        { type: 'heading', content: '多街下注：一次决策，三条街收线' },
        {
          type: 'text',
          content:
            '单挑翻后不只是"这一街下不下注"，而是"这一手牌如何在三条街收线"。翻牌下注后，转牌、河牌是继续开火（barrel）还是过牌，取决于：你的牌力层级、对手范围如何随每一街收窄、底池如何随每一街几何增长。一个精心设计的下注线（Betting Line）让强牌榨取全程、诈唬在正确时机收网。',
        },
        {
          type: 'key-point',
          content:
            '多街下注的黄金法则：价值牌可以连开三枪、半诈唬转牌收、纯诈唬河牌收。但每条街都要重新评估——转牌或河牌完成对手听牌时（牌面易手），你的开火频率必须随之下调。',
        },
        { type: 'heading', content: '连开三枪的数学结构' },
        {
          type: 'formula',
          content:
            '单挑翻牌圈下注线的底池几何（起始底池 P）：\n\n三连注方案（每街 2/3 池）：\n翻牌 2/3P → 转牌 2/3 × 新底池 → 河牌 2/3 × 新底池\n\n以 P=5BB 为例：\n翻牌下注 3.3BB，底池 → 11.6BB\n转牌下注 7.7BB，底池 → 27BB\n河牌下注 18BB，底池 → 63BB\n\n若要河牌全下打光 97.5BB，需从翻牌开始用约 2/3 池让底池几何增长——小注（1/3 池）做不到。（概念源自：《Applications of No-Limit Hold’em》Matthew Janda Ch.9 街间底池管理与尺度）',
        },
        {
          type: 'text',
          content:
            '但连开三枪不是无脑每街下注。三条街的开火组合取决于牌面演化：干燥高牌面（如 K♠7♦2♣→5♥→9♣）对手范围难中牌，可高频 triple barrel 代表强牌；湿润连接面（如 9♠8♥4♣→7♦→6♣）则极易完成顺子/同花，转牌河牌要警惕牌面易手，开火频率大幅下降。',
        },
        {
          type: 'example',
          content:
            '实例：单挑翻牌 K♠7♦2♣，SB 持 A♠A♣ 下注 1/3 池，BB 跟注（底池 8BB）。转牌 5♥ 空白，AA 仍领先，SB 下注半池 4BB，BB 跟注（底池 16BB）。河牌 9♣ 空白，SB 下注 2/3 池约 10.7BB 收价值。三条街 AA 全部开火——因为牌面持续干燥，AA 的领先保持完整，价值最大化。',
        },
        {
          type: 'example',
          content:
            '实例二（牌面易手）：同样 SB 持 A♠A♣，翻牌 9♠8♥4♣ 下注，BB 跟注。转牌 7♦——完成 QT、T6、65 的顺子。AA 的领先被削弱：BB 的宽防守范围里有不少顺子组合。此时 SB 应下调转牌下注频率（混合 check），因为继续开火只会被更强的牌跟注或加注。AA 从"三条街价值"变成"两街价值+一街控池"。',
        },
        {
          type: 'example',
          content:
            '实例三（半诈唬转牌收）：翻牌 8♠6♣2♦，SB 持 7♦5♦（两头顺）下注 1/3 池，BB 跟注。转牌 A♠（阻断牌+牌面变干），75s 未中顺子。转牌继续下注半池代表 A——BB 若弃牌，SB 用一个"接近坚果的听牌"在转牌收网。这是半诈唬的标准路径：翻牌听牌、转牌牌面有利时转纯诈唬收池。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：转牌河牌的"牌面易手"比你的牌力更重要。AA 在干燥面是三条街价值，在湿润面变成两街价值——不是 AA 变弱了，是对手范围里能击败它的组合变多了。开火频率必须跟随"对手范围如何被新牌改进"，而不是你自己的牌。',
        },
        {
          type: 'pro-tip',
          content:
            '下注线规划三问：(1) 这张牌面会改进谁的听牌？(2) 底池还能撑几街下注？（SPR 与全下计划）(3) 对手跟注后范围还剩什么？三问走完，你的连开三枪就从"惯性"变成"计划"。',
        },
      ],
      quiz: [
        {
          id: 't6hu-barrel-q1',
          question: '干燥高牌面（如 K♠7♦2♣→5♥→9♣）上，顶对的正确下注线是：',
          options: [
            '只下注翻牌一街',
            '高频连开三枪，因为对手范围难中牌且牌面持续干燥',
            '全部过牌',
            '转牌河牌都大注',
          ],
          correctIndex: 1,
          explanation: '干燥面对手难中牌，牌面持续不改进听牌，顶对领先保持完整，可高频 triple barrel 收全程价值。',
        },
        {
          id: 't6hu-barrel-q2',
          question: '湿润连接面（9♠8♥4♣→7♦→6♣）上，转牌河牌的正确开火频率是：',
          options: [
            '保持高频连开',
            '大幅下调，因为牌面易手、对手范围顺子组合大增',
            '转牌必开、河牌必弃',
            '无规律',
          ],
          correctIndex: 1,
          explanation: '湿润面极易完成顺子/同花，转牌河牌牌面易手，AA 等成牌优势被削弱，开火频率必须随之下调。',
        },
        {
          id: 't6hu-barrel-q3',
          question: '底池 5BB、SPR 高，若要河牌全下打光筹码，翻牌尺度应选择：',
          options: [
            '1/3 池小注',
            '约 2/3 池大注让底池几何增长',
            '过牌',
            '超池全下',
          ],
          correctIndex: 1,
          explanation: '高 SPR 需约 2/3 池让底池逐街几何增长才能在河牌全下；1/3 池底池增长太慢，无法打光深筹码。',
        },
        {
          id: 't6hu-barrel-q4',
          question: 'AA 在翻牌 9♠8♥4♣ 下注、转牌 7♦ 时的正确调整是：',
          options: [
            '继续全下施压',
            '下调转牌下注频率，因对手范围被新牌改进',
            '河牌才下注',
            '完全弃牌',
          ],
          correctIndex: 1,
          explanation: '7♦ 完成 QT、65 等顺子，BB 宽范围含不少顺子组合，AA 领先被削弱，应控池而非继续开火。',
        },
        {
          id: 't6hu-barrel-q5',
          question: '"半诈唬转牌收"指的是：',
          options: [
            '翻牌听牌，转牌牌面有利时转纯诈唬收池',
            '转牌永远弃牌',
            '翻牌直接全下',
            '河牌才诈唬',
          ],
          correctIndex: 0,
          explanation: '半诈唬翻牌以听牌下注，转牌未中但牌面有利（如出 A 阻断牌）时转纯诈唬，让对手弃牌直接赢底池。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T7: 对手分析（单挑版）==========
