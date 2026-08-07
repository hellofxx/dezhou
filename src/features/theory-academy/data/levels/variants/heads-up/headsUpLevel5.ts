import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { headsUpRules } from '../variantRules';

const variant: PokerVariant = 'heads-up';

export const HEADS_UP_LEVEL_5: TheoryLevelInfo = {
  id: 't5hu',
  level: 5,
  tier: 'intermediate',
  title: '单挑 GTO 基础',
  description: '应用博弈论于单挑场景',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T4HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l4hu-gto-basics', title: '单挑 GTO 基础' },
      { id: 'l4hu-counter-strategies', title: '反制策略' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't5hu-gto-he',
      level: 5,
      order: 1,
      title: 'GTO 核心思想',
      subtitle: '不可被剥削的单挑策略',
      duration: '18 min',
      eloDimension: 'postflop',
      objectives: [
        '理解单挑是纯二人零和博弈，纳什均衡的"不可剥削"保证在此严格成立',
        '掌握 GTO 不是"最赚钱"而是"不被剥削"的策略定位，及其与剥削的关系',
        '学会在单挑中以 GTO 为基线，识别对手偏离并做最小必要偏离',
      ],
      content: [
        { type: 'heading', content: '单挑：博弈论的最纯净实验室' },
        {
          type: 'text',
          content:
            '单挑扑克（忽略抽水）是教科书级的二人零和博弈：一方的盈利恰为另一方所失。约翰·纳什证明，这类博弈存在均衡策略组合——双方各自采用均衡策略时，任何一方单方面偏离都无法让自己更好。这意味着：单挑存在一套"不可被剥削"的策略（GTO），对手无论怎么打，你的长期期望都不低于博弈值。这是单挑独有的理论优势，多人底池的均衡保证会因联合效应而弱化。',
        },
        {
          type: 'key-point',
          content:
            'GTO 的定位是"防弹背心"不是"武器"：它保证你不被剥削，但不承诺赚得最多。面对漏洞百出的对手，针对性剥削策略赚得更多——代价是打开自己的漏洞。单挑高手在"穿背心"与"换刀"之间切换。',
        },
        { type: 'heading', content: '均衡的数学直觉' },
        {
          type: 'formula',
          content:
            '极小极大定理（冯·诺依曼 1928）：\n存在博弈值 v，使 max_a min_b U₁(a,b) = min_b max_a U₁(a,b) = v\n\n含义：均衡策略保证你的期望 ≥ v，对手无法单方面压低。\n\n石头剪刀布的均衡：各 1/3 随机。对手总出石头时，均衡策略仍不输不赢（期望 0），但"总出布"的剥削策略每局都赢；然而一旦你总出布，自己也变得可被剥削（对手改出剪刀）。扑克完全同构。（概念源自：《The Mathematics of Poker》Bill Chen / Jeremie Ankenman Ch.2 博弈论基本概念）',
        },
        {
          type: 'text',
          content:
            '单挑中 GTO 与满员桌的差异：单挑范围极宽（SB 开池 80%、BB 防守 60%+），均衡策略意味着极高的下注频率与诈唬密度；而满员桌均衡下多数玩家只能打紧。求解器在单挑中会输出大量"激进的下注"与"极化的范围"——GTO 不是"打得紧"，而是"让一切保持在对手无法反制的比例上"。',
        },
        {
          type: 'example',
          content:
            '实例：单挑 SB 面对 BB，求解器会告诉你 SB 用约 80% 范围开池、BB 用约 60%+ 防守，翻后 OOP 的 SB 高频过牌、IP 的 BB 高频下注。这些频率看起来"松"，但都是均衡的一部分——任何一方偏离（如 SB 只开池 50%），另一方都能通过加宽防守或提高偷盲频率来剥削。',
        },
        {
          type: 'example',
          content:
            '实例二（最小必要偏离）：你观察到某单挑对手河牌面对大注只跟注 25%（均衡约 50%）。据此你可整体上调河牌超池诈唬频率——但幅度以"他若修正到 40% 你仍不亏"为限。这就是"以 GTO 为基线、按可观测偏差做有方向、有纪律的偏离"，而非盲目加码。',
        },
        {
          type: 'example',
          content:
            '实例三（单挑 GTO 的进攻性）：求解器中的单挑 BB 面对 SB 开池，会在很多牌面过牌加注（Check-Raise）——用听牌与强牌构成两极化范围施压。这源于 IP 的位置优势与宽范围。若你面对强势 BB 只会跟注从不加注，你的防守频率虽高却毫无威胁，对手的 C-Bet 频率可以无限上调剥削你。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点："GTO 就是打得紧"是最大误读。单挑 GTO 充满高频下注、超池全下与薄价值——它只是让这一切保持在对手无法反制的比例上。学习求解器别背频率，问三个为什么：为什么这个牌面用这个尺度？为什么这手牌进下注范围？为什么转牌后频率变了？',
        },
        {
          type: 'pro-tip',
          content:
            '单挑学习路径：先用求解器理解均衡"形状"（为什么这样打），再用节点锁定研究"对手常见漏洞的收割方案"，最后实战验证。基线给你不败之地，偏离给你利润空间——完全不懂 GTO 的剥削是裸奔，完全不敢偏离的 GTO 是自缚。',
        },
      ],
      quiz: [
        {
          id: 't5hu-gto-he-q1',
          question: '纳什均衡"不可剥削"的保证在什么场景下严格成立？',
          options: [
            '任意人数的底池',
            '单挑（二人零和博弈）',
            '只有锦标赛',
            '只有翻前',
          ],
          correctIndex: 1,
          explanation: '三人以上博弈中均衡的保底性质会因联合效应弱化。单挑才是纳什均衡"不可剥削"保证的严格适用域。',
        },
        {
          id: 't5hu-gto-he-q2',
          question: '面对一个漏洞百出的弱对手，单挑 GTO 策略的表现是：',
          options: [
            '赚得最多',
            '不输，但赚得少于针对性剥削策略',
            '会输给弱对手',
            '和剥削策略完全一样',
          ],
          correctIndex: 1,
          explanation: 'GTO 保证期望不低于博弈值（保底），但不主动利用对手错误；剥削策略榨取更多，代价是自己也打开漏洞。',
        },
        {
          id: 't5hu-gto-he-q3',
          question: '单挑 GTO 与满员桌 GTO 的主要差异是：',
          options: [
            '单挑 GTO 更紧',
            '单挑范围极宽，GTO 意味着极高下注频率与诈唬密度',
            '两者完全相同',
            '单挑不存在 GTO',
          ],
          correctIndex: 1,
          explanation: '单挑范围宽（SB 80%、BB 60%+），均衡策略伴随高下注频率与极化范围，而非"打得紧"。',
        },
        {
          id: 't5hu-gto-he-q4',
          question: '"最小必要偏离"的含义是：',
          options: [
            '完全照抄 GTO 频率',
            '以 GTO 为基线，按可观测偏差做有方向、有幅度上限的偏离',
            '随意加大诈唬频率',
            '永远偏离 GTO',
          ],
          correctIndex: 1,
          explanation: '偏离要有方向（针对对手漏洞）与幅度纪律（对手修正后仍不亏），保留随时回到基线的转身空间。',
        },
        {
          id: 't5hu-gto-he-q5',
          question: '学习求解器输出时，更应关注的是：',
          options: [
            '死记每个频率数字',
            '理解频率背后的"为什么"（尺度/范围/街间逻辑）',
            '只抄下注尺度',
            '忽略所有频率',
          ],
          correctIndex: 1,
          explanation: '背频率不如理解结构：为什么这个尺度、为什么进下注范围、为什么转牌频率变。理解结构频率自然记住。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't5hu-frequency',
      level: 5,
      order: 2,
      title: '频率平衡',
      subtitle: '下注与 check 的最优混合',
      duration: '15 min',
      eloDimension: 'postflop',
      objectives: [
        '理解混合策略与无差别原则：同一手牌按频率分配动作的条件',
        '掌握 MDF 与 Alpha 在单挑防守进攻中的临界频率计算',
        '学会在单挑宽范围下执行频率平衡，避免可被剥削的确定性倾向',
      ],
      content: [
        { type: 'heading', content: '频率：均衡的语言' },
        {
          type: 'text',
          content:
            '均衡策略不是"这手牌永远这么打"，而是"这手牌在特定节点按某种频率分配动作"。单挑中，范围宽、决策密，频率平衡尤为重要：若你的 C-Bet 频率恒定、3Bet 范围可预测，观察力强的对手会用节点锁定你的模式并反制。混合策略（Mixed Strategy）与无差别原则（Indifference Principle）共同构成频率平衡的数学基础。',
        },
        {
          type: 'key-point',
          content:
            '无差别原则：均衡中一手牌被混合使用，当且仅当它的各动作 EV 完全相等。混合的目的不是"迷惑"，而是让对手的边缘牌（如跟注站）在跟注与弃牌之间也恰好无差别——对手无从反制。',
        },
        { type: 'heading', content: 'MDF：防守的临界频率' },
        {
          type: 'formula',
          content:
            'MDF（最小防御频率）= 1 − 弃牌率 = 1/(1+b)（b = 下注额/底池）\n\n例：半池 b=0.5 → 防 67%；满池 b=1 → 防 50%；2 倍池 b=2 → 防 33%\n\nAlpha（诈唬盈亏平衡弃牌率）= b/(1+b) = 1 − MDF\n\n单挑半池下注：对手需防 67%，你的纯诈唬需要他弃牌 ≥33% 才保本。（概念源自：《The Mathematics of Poker》Bill Chen / Jeremie Ankenman Ch.5-6 下注-弃牌子博弈）',
        },
        {
          type: 'text',
          content:
            '单挑中防守不只等于跟注：加注同样计入防守频率。面对高频诈唬者，用加注替代部分跟注既防守又收价值；面对紧弱价值型下注，超额弃牌（低于 MDF）才是剥削。先算总量，再定分配——单挑 BB 的 60%+ 防守由跟注、3Bet 价值、3Bet 诈唬三部分构成，每一部分都随 SB 倾向移动。',
        },
        {
          type: 'example',
          content:
            '实例：单挑翻牌底池 2BB，SB（OOP）持强牌+诈唬混合范围，下注半池 1BB。你是 BB（IP），需用约 67% 范围继续。选择继续的牌按牌力+改进潜力排序：顶对、好听牌优先，纯垃圾进入弃牌的 33%。若你只防 40%，SB 每次诈唬平均立赚：0.60×2 − 0.40×1 = 0.8BB——你就在喂对手自动利润。',
        },
        {
          type: 'example',
          content:
            '实例二（混合执行）：河牌你持跟注站面对满池下注，均衡中对手诈唬占 1/3，你跟注所需胜率恰为 33%——跟与弃 EV 相同。求解器可能输出"跟 50%/弃 50%"。实战含义：这类决策单次做错的代价约等于零，不必纠结；真正的大 EV 差异在更早街的范围构建里。',
        },
        {
          type: 'example',
          content:
            '实例三（单挑频率剥削）：你观察到某单挑对手在翻牌面对 C-Bet 弃牌 60%（均衡约 45%）。这是明确的 MDF 漏洞——你的翻牌 C-Bet 频率与诈唬密度可以整体上调，因为对手在过度弃牌。但幅度以"他若收紧到 50% 你仍不亏"为限，保留修正空间。频率平衡不仅是防守，也是识别对手失衡并收割的显微镜。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：单挑中"该不该混合"不是哲学问题，是数学问题。混合节点两边 EV 相等，单次选错代价≈0；纯策略节点（明显最优动作唯一）才贡献绝大部分 EV。把精力投给高 EV 差异的决策，比纠结 50% 混合的精确执行更有价值。',
        },
        {
          type: 'pro-tip',
          content:
            '频率平衡三锚点背熟：面对半池防 67%、满池防 50%、2 倍池防 33%；半池下注诈唬 25%、满池诈唬 33%。复盘统计你面对转牌/河牌大注的实际弃牌率——绝大多数玩家远超均衡，这就是对手大注总"恰好"让你弃牌的原因。',
        },
      ],
      quiz: [
        {
          id: 't5hu-frequency-q1',
          question: '面对半池下注，MDF（最小防御频率）约为：',
          options: ['50%', '67%', '75%', '33%'],
          correctIndex: 1,
          explanation: 'MDF = 1/(1+0.5) = 2/3 ≈ 67%。需用最强约三分之二范围继续，否则对手任意诈唬有利可图。',
        },
        {
          id: 't5hu-frequency-q2',
          question: '均衡中一手牌被混合分配多个动作的前提是：',
          options: [
            '这手牌太难决定',
            '各动作的 EV 完全相等',
            '求解器精度不足',
            '为了迷惑对手随便选的',
          ],
          correctIndex: 1,
          explanation: '无差别原则：EV 不等时理性策略必选更高者。混合只发生在 EV 相等的临界牌上。',
        },
        {
          id: 't5hu-frequency-q3',
          question: '你面对满池下注实际只防守 30%（MDF 应为 50%），对手的正确剥削是：',
          options: [
            '只用坚果下注',
            '提高任意两张牌的诈唬频率',
            '降低下注尺度',
            '不再下注',
          ],
          correctIndex: 1,
          explanation: '弃牌率 70% 远超满池诈唬保本所需 50%，对手用任意两张牌下注都自动盈利，应疯狂增加诈唬。',
        },
        {
          id: 't5hu-frequency-q4',
          question: '单挑中"防守不只等于跟注"的含义是：',
          options: [
            '弃牌也算防守',
            '加注同样计入防守频率，先算总量再定分配',
            '防守只靠下注',
            '防守越紧越好',
          ],
          correctIndex: 1,
          explanation: '防守可由跟注+加注共同构成，BB 的 60%+ 防守含 3Bet 价值与诈唬。面对高频诈唬者用加注替代部分跟注。',
        },
        {
          id: 't5hu-frequency-q5',
          question: '对实战玩家，处理混合策略节点最务实的态度是：',
          options: [
            '必须精确执行每个频率',
            '认识到选哪边损失都极小，把精力投给高 EV 差异的决策',
            '永远选下注那一边',
            '避开所有混合局面',
          ],
          correctIndex: 1,
          explanation: '混合节点两边 EV 相等，单次"选错"代价≈0；真正拉开差距的是纯策略节点与更早街的范围构建质量。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T6: 下注理论（单挑版）==========
