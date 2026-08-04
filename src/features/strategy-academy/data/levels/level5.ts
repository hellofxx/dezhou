import type { Lesson } from '../../types';

export const LEVEL_5_LESSONS: Lesson[] = [
      {
        id: 'l5-bankroll',
        level: 5,
        order: 1,
        title: '资金管理',
        subtitle: '没有资金管理，技术再好也会破产',
        duration: '7 min',
        content: [
          { type: 'heading', content: '为什么资金管理如此重要？' },
          {
            type: 'text',
            content:
              '即使你是世界级水平的牌手，没有足够的资金管理（Bankroll Management），一次倒霉的下风期就可能让你破产。资金管理是保护你免受方差影响的安全网。',
          },
          {
            type: 'key-point',
            content: '黄金法则：现金局至少需要 20-30 个买入（Buy-in）的资金。锦标赛至少需要 50-100 个买入。',
          },
          { type: 'heading', content: '资金管理规则' },
          {
            type: 'text',
            content:
              '现金局（NLH）：\n- 最低要求：20个买入\n- 推荐：30-50个买入\n- 职业标准：50+个买入\n\n例：打$1/$2（买入$200），你需要至少 $4,000-$10,000 的专用资金。',
          },
          {
            type: 'highlight',
            content: '永远不要把生活费和扑克资金混在一起！专款专用是资金管理的第一原则。',
          },
          { type: 'heading', content: '升级和降级' },
          {
            type: 'text',
            content:
              '升级条件：在当前级别积累到下一级30个买入\n降级条件：资金降至当前级别20个买入以下时果断降级\n\n降级不丢人！很多世界顶级牌手都曾因下风而降级，然后又打回来。',
          },
          {
            type: 'pro-tip',
            content: '资金管理是职业牌手和娱乐玩家最大的区别之一。没有资金管理纪律的人，即使技术再好，也只是在赌博。',
          },
          {
            type: 'formula',
            content: 'Kelly 准则公式：\nf* = (bp - q) / b\n\n其中 f* = 最优资金比例\nb = 净赔率（赢时获得 b 倍下注）\np = 胜率\nq = 败率 = 1-p\n\n扑克场景应用：\n假设你有 60% 胜率优势，赔率 1:1\nf* = (1×0.6 - 0.4) / 1 = 0.2 = 20%\n即每次下注不超过总资金的 20%\n\n保守策略（Half Kelly）：f = f*/2 = 10%，进一步降低破产风险',
          },
          {
            type: 'theory-reference',
            content: '理论支撑：Kelly 准则在扑克资金管理中的量化应用详见理论学院 T8 第 2 章"资金心理与量化管理"。T8 全面覆盖了扑克心理学中的资金管理方法论。',
            data: { theoryLevelId: 't8', theoryChapterId: 't8-psychology' },
          },
          {
            type: 'counter-intuitive',
            content: '反直觉点：Kelly 准则下最优下注比例远低于直觉。即使你有 60% 的胜率优势，Kelly 准则也只建议投入 20% 的资金。大多数玩家在实际中投入的比例远高于 Kelly 推荐的合理值，这是导致破产的主要原因之一。',
          },
        ],
        quiz: [
          {
            id: 'l5-br-q1',
            question: '打$1/$2现金局（买入$200），最低需要多少资金？',
            options: ['$400', '$2,000', '$4,000-$6,000', '$100'],
            correctIndex: 2,
            explanation: '最低需要20个买入 = 20 × $200 = $4,000。推荐30个 = $6,000。',
          },
          {
            id: 'l5-br-q2',
            question: '什么时候应该降级？',
            options: ['连输3手牌', '资金降至20个买入以下', '不想打了', '对手太强'],
            correctIndex: 1,
            explanation: '当你的资金降至当前级别20个买入以下时，应该果断降级以保护资金安全。',
          },
        
          { id: 'l5-br-q3', question: '推荐的现金局资金管理是多少个买入？', options: ['10个', '20个', '30-50个', '100个'], correctIndex: 2, explanation: '推荐30-50个买入的资金管理，这能让你承受正常的波动。' },
          { id: 'l5-br-q4', question: '升级的条件是？', options: ['想升级就升级', '在当前级别积累到下一级30个买入', '赢了10手牌', '对手太弱'], correctIndex: 1, explanation: '升级条件是在当前级别积累到下一级30个买入，确保有足够的安全边际。' },
          { id: 'l5-br-q5', question: '为什么不能把生活费和扑克资金混在一起？', options: ['方便计算', '专款专用是资金管理第一原则', '没有原因', '法律规定'], correctIndex: 1, explanation: '专款专用是资金管理的第一原则，混合使用会导致在有压力时做出非理性决策。' },],
        examples: [
          {
            id: 'l5-bankroll-ex1',
            title: '升级时机判断',
            heroHand: ['As', 'Kh'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'CO', action: 'fold' },
            ],
            street: 'preflop',
            effectiveStack: 100,
            potSize: 1.5,
            correctDecision: {
              action: '升级条件判断',
              reasoning: [
                '你当前打 NL10（买入 $10），资金 $450',
                'NL25 的 30 个买入 = $750，你还没达到',
                '应该继续在 NL10 积累资金',
                '不要因为是“好日子”就冲动升级',
              ],
            },
            commonMistake: {
              action: '资金不够就升级（“我先试试”）',
              reasoning: '没有足够资金就升级是赌博行为。一旦遇到下风期，你会很快破产。',
              evLoss: '破产风险增加 300%',
            },
          },
          {
            id: 'l5-bankroll-ex2',
            title: '降级不丢人',
            heroHand: ['Qd', 'Qc'],
            heroPosition: 'CO',
            previousActions: [
              { player: 'UTG', action: 'fold' },
              { player: 'MP', action: 'fold' },
            ],
            street: 'preflop',
            effectiveStack: 100,
            potSize: 1.5,
            correctDecision: {
              action: '降级决策',
              reasoning: [
                '你当前打 NL50（买入 $50），资金从 $2000 降到 $900',
                'NL50 的 20 个买入 = $1000，你已经低于这个线',
                '应该果断降级到 NL25',
                '降级不是失败，是保护资金的聪明做法',
              ],
            },
            commonMistake: {
              action: '“我不降级，我要打回来”',
              reasoning: '拒绝降级是典型的 ego 问题。很多世界级牌手都曾降级再打回来。保护资金永远是第一位。',
              evLoss: '破产风险 > 50%',
            },
          },
        ],
        practice: {
          id: 'l5-bankroll-practice',
          questions: [
            {
              id: 'l5-bankroll-p1',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['Ah', 'Kd'],
                heroPosition: 'BTN',
                previousActions: [
                  { player: 'CO', action: 'fold' },
                ],
                street: 'preflop',
                potSize: 1.5,
                effectiveStack: 100,
              },
              options: [
                { action: '继续打当前级别', isCorrect: true, explanation: '你打NL10，资金$350 = 35个买入。资金充足，应该继续在当前级别积累。', evImpact: '0' },
                { action: '升级到NL25', isCorrect: false, explanation: 'NL25需要30个买入=$750，你只有$350。资金不足就升级是赌博行为。', evImpact: '破产风险+200%' },
                { action: '降级到NL5', isCorrect: false, explanation: '你有35个买入，资金充足，不需要降级。过度保守会减慢进步速度。', evImpact: '-学习速度' },
              ],
              relatedLessonId: 'l5-bankroll',
            },
            {
              id: 'l5-bankroll-p2',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['Js', 'Jc'],
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
                { action: '继续打NL50', isCorrect: false, explanation: '你打NL50，资金$800 = 16个买入。已经低于20个买入的最低线，应该降级。', evImpact: '破产风险+150%' },
                { action: '降级到NL25', isCorrect: true, explanation: '资金降至20个买入以下，应该果断降级。NL25的买入$25，你有32个买入，更安全。', evImpact: '保护资金安全' },
                { action: 'All-in 赢回来', isCorrect: false, explanation: '“赢回来”心态是典型的 tilt + 没有资金管理。这会让你更快破产。', evImpact: '破产风险+500%' },
              ],
              relatedLessonId: 'l5-bankroll',
            },
            {
              id: 'l5-bankroll-p3',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['Ts', '9s'],
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
                { action: '用扑克资金交房租', isCorrect: false, explanation: '绝对不要把扑克资金和生活费混在一起！专款专用是资金管理的第一原则。', evImpact: '破产风险+100%' },
                { action: '保持资金分离，继续打', isCorrect: true, explanation: '扑克资金和生活费必须完全分离。只用专门的扑克资金打牌。', evImpact: '0' },
                { action: '借钱打牌', isCorrect: false, explanation: '永远不要借钱打牌！这会让你在有压力时做出非理性决策。', evImpact: '破产风险+300%' },
              ],
              relatedLessonId: 'l5-bankroll',
            },
          
            { id: 'l5-bankroll-p4', difficulty: 'intermediate', scenario: { heroHand: ['Ks', 'Qs'], heroPosition: 'BTN', previousActions: [{ player: 'CO', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: '用扑克资金支付日常开销', isCorrect: false, explanation: '扑克资金只能用于打牌，混用会破坏资金管理。', evImpact: '破产风险+200%' }, { action: '保持资金完全分离', isCorrect: true, explanation: '扑克资金和生活费必须完全分离，这是资金管理的基本原则。', evImpact: '0' }, { action: '偶尔借用扑克资金', isCorrect: false, explanation: '借用扑克资金会破坏资金管理的完整性。', evImpact: '破产风险+150%' }], relatedLessonId: 'l5-bankroll' },
            { id: 'l5-bankroll-p5', difficulty: 'advanced', scenario: { heroHand: ['Ad', 'Kd'], heroPosition: 'CO', previousActions: [{ player: 'UTG', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: '资金$1800，继续打NL50', isCorrect: true, explanation: 'NL50的20个买入=$1000，你还有$1800=36个买入。资金充足，可以继续。', evImpact: '0' }, { action: '资金$900，果断降级到NL25', isCorrect: false, explanation: '当前$1800=36个买入，资金充足不需要降级。', evImpact: '-学习速度' }, { action: '借钱继续打NL50', isCorrect: false, explanation: '永远不要借钱打牌！', evImpact: '破产风险+500%' }], relatedLessonId: 'l5-bankroll' },],
        },
      },
      {
        id: 'l5-tilt',
        level: 5,
        order: 2,
        title: '情绪管理（Tilt Control）',
        subtitle: '控制情绪是长期盈利的关键',
        duration: '8 min',
        content: [
          { type: 'heading', content: '什么是 Tilt？' },
          {
            type: 'text',
            content:
              'Tilt（情绪失控）是指因为负面事件（被bad beat、连续输牌、对手挑衅等）导致情绪波动，做出非理性决策的状态。Tilt 是扑克玩家最大的敌人，比技术差距造成的伤害大得多。',
          },
          {
            type: 'key-point',
            content: 'Tilt 的成本往往超过技术差距的成本。一个$10/hr 的赢家，一次严重的 tilt session 可能损失$500+。',
          },
          { type: 'heading', content: 'Tilt 的类型' },
          {
            type: 'text',
            content:
              '1. 愤怒型 Tilt：被bad beat后愤怒加注、bluff\n2. 恐惧型 Tilt：连输后不敢下注、过度弃牌\n3. 报复型 Tilt：针对某个对手做出非理性行动\n4. 绝望型 Tilt：想快速赢回损失，打太多手牌',
          },
          { type: 'heading', content: '防 Tilt 策略' },
          {
            type: 'text',
            content:
              '1. 止损线：设定每次session的最大亏损（如2个买入），到了就停\n2. 休息规则：每打1小时休息5-10分钟\n3. 自我觉察：定期检查自己的情绪状态\n4. 长期视角：提醒自己这是一手牌，不是整个人生\n5. 停止信号：发现自己在做"不像自己"的行动时，立即停止',
          },
          {
            type: 'pro-tip',
            content:
              '职业牌手不是不会 tilt，而是他们更快地意识到自己在 tilt 并采取措施。学会"止损"是情绪管理最重要的一步。记住：明天还有牌可以打，但钱输完了就没有了。',
          },
          {
            type: 'formula',
            content: 'Tendler 7 型 Tilt 档案速查：\n1. 愤怒型 Tilt — 被 bad beat 后情绪失控\n2. 沮丧型 Tilt — 长期下风期积累的负面情绪\n3. 恐惧型 Tilt — 害怕输钱导致决策过于保守\n4. 自毁型 Tilt — 潜意识里想惩罚自己\n5. 厌倦型 Tilt — 长时间 session 导致注意力下降\n6. 傲慢型 Tilt — 连续赢钱后过度自信\n7. 急迫型 Tilt — 因时间压力或资金压力而仓促决策\n\n识别信号：连续答错 3 题时，正确率下降 >15% 时，应暂停训练',
          },
          {
            type: 'theory-reference',
            content: '理论支撑：Tendler 7 型 Tilt 档案的完整分析见理论学院 T8 第 1 章"Tilt 识别与分类"。包括各型 Tilt 的识别信号、触发场景与应对策略。',
            data: { theoryLevelId: 't8', theoryChapterId: 't8-tilt' },
          },
          {
            type: 'counter-intuitive',
            content: '反直觉点：正确率下降时最需要停止，而非继续。很多玩家在情绪波动时选择"再打一手翻本"，但这是最危险的错误——Tilt 状态下的决策质量显著下降，继续游戏只会扩大损失。',
          },
        ],
        quiz: [
          {
            id: 'l5-tilt-q1',
            question: '被bad beat后最好的做法是？',
            options: ['立即加注报复', '继续打更多手牌赢回来', '停下来检查自己的情绪', '骂对手'],
            correctIndex: 2,
            explanation: '最好的做法是暂停，检查自己的情绪状态。如果感到愤怒或沮丧，应该停止当前的session。',
          },
          {
            id: 'l5-tilt-q2',
            question: '什么是“止损线”？',
            options: ['停止打牌的时间', '设定的最大亏损额度', '下注的上限', '休息时间'],
            correctIndex: 1,
            explanation: '止损线是你提前设定的每次session的最大亏损额度（如2个买入），达到后立即停止，防止tilt造成更大损失。',
          },
        
          { id: 'l5-tilt-q3', question: 'Tilt的类型不包括？', options: ['愤怒型', '恐惧型', '开心型', '报复型'], correctIndex: 2, explanation: 'Tilt类型包括愤怒型、恐惧型、报复型和绝望型，不包括"开心型"。' },
          { id: 'l5-tilt-q4', question: '发现自己在做"不像自己"的行动时应该？', options: ['继续打', '立即停止', '加注更多', '换桌子'], correctIndex: 1, explanation: '发现自己在做不像自己的行动时，这是tilt的停止信号，应该立即停止。' },
          { id: 'l5-tilt-q5', question: '每打多久应该休息5-10分钟？', options: ['30分钟', '1小时', '2小时', '3小时'], correctIndex: 1, explanation: '建议每打1小时休息5-10分钟，保持清醒的头脑和稳定的情绪。' },],
        examples: [
          {
            id: 'l5-tilt-ex1',
            title: '识别 Tilt 状态：被 Bad Beat 后',
            heroHand: ['As', 'Ah'],
            heroPosition: 'CO',
            previousActions: [
              { player: 'UTG', action: 'fold' },
              { player: 'MP', action: 'fold' },
            ],
            board: ['Ac', 'Kd', '7h', '2s', 'Ks'],
            street: 'river',
            effectiveStack: 80,
            potSize: 20,
            correctDecision: {
              action: '停下来，检查情绪',
              reasoning: [
                '你的 AA 被对手的 Kx 在河牌击中两对反超',
                '这是典型的 bad beat，你做了所有正确的决策',
                '如果感到愤怒、想“赢回来”，说明你在 tilt',
                '正确做法：深呼吸，离开桌子 5 分钟，评估情绪',
              ],
            },
            commonMistake: {
              action: '立即开下一手牌，加大注“赢回来”',
              reasoning: 'Bad beat 后立即打牌是 tilt 的典型表现。你会打得太松、太激进，损失更多。',
              evLoss: '-5 到 -20 BB（tilt session）',
            },
          },
          {
            id: 'l5-tilt-ex2',
            title: '止损线的应用',
            heroHand: ['Kd', 'Qd'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'CO', action: 'raise 2.5BB' },
            ],
            street: 'preflop',
            effectiveStack: 97,
            potSize: 4,
            correctDecision: {
              action: '停止今天的 session',
              reasoning: [
                '你今天已经输了 2 个买入（达到止损线）',
                '你发现自己开始打太多手牌、加注太大',
                '这是 tilt 的早期信号',
                '正确做法：立即停止，明天再打',
              ],
            },
            commonMistake: {
              action: '“再打一手就停”（然后继续打 2 小时）',
              reasoning: '“再打一手”是 tilt 时最危险的自我欺骗。一旦超过止损线，你的决策质量会急剧下降。',
              evLoss: '-10 到 -50 BB（继续 tilt）',
            },
          },
        ],
        practice: {
          id: 'l5-tilt-practice',
          questions: [
            {
              id: 'l5-tilt-p1',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['Kh', 'Kc'],
                heroPosition: 'BTN',
                previousActions: [
                  { player: 'CO', action: 'raise 2.5BB' },
                ],
                board: ['Ad', '9s', '3h', '2c', 'Ac'],
                street: 'river',
                potSize: 20,
                effectiveStack: 80,
              },
              options: [
                { action: '立即开下一手，加大注赢回来', isCorrect: false, explanation: '这是典型的 tilt 行为。被 bad beat 后情绪化打牌会让你损失更多。', evImpact: '-10 BB/session' },
                { action: '停下来，深呼吸，检查情绪', isCorrect: true, explanation: '被 bad beat 后最好的做法是暂停。检查自己是否在 tilt，如果情绪波动就停止。', evImpact: '保护资金' },
                { action: '在聊天室骂对手', isCorrect: false, explanation: '骂对手没有任何好处，只会让你更情绪化，影响后续决策。', evImpact: '-5 BB/session' },
              ],
              relatedLessonId: 'l5-tilt',
            },
            {
              id: 'l5-tilt-p2',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['Qs', 'Jd'],
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
                { action: '用 QJo 在 UTG 后面开牌（正常打法）', isCorrect: false, explanation: '你今天的止损线是 2 个买入，你已经亏了 2 个买入。应该停止，不是继续打。', evImpact: '-5 BB/session' },
                { action: '停止今天的 session', isCorrect: true, explanation: '达到止损线就应该停止。明天还有牌可以打，但钱输完了就没有了。', evImpact: '保护资金' },
                { action: '加大买入继续打', isCorrect: false, explanation: '加大买入“赢回来”是绝望型 tilt 的典型表现。这会让你损失更多。', evImpact: '-20 BB/session' },
              ],
              relatedLessonId: 'l5-tilt',
            },
            {
              id: 'l5-tilt-p3',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['9h', '8h'],
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
                { action: '正常打（如果情绪稳定）', isCorrect: true, explanation: '如果你检查后情绪稳定，没有 tilt 迹象，可以继续正常打。定期自我检查是好习惯。', evImpact: '+1.0 BB/100' },
                { action: '打任何手牌（“无所谓了”）', isCorrect: false, explanation: '“无所谓”心态是 tilt 的信号。如果你不在乎输赢，说明你的决策已经不是理性的。', evImpact: '-5 BB/session' },
                { action: '针对之前赢你的对手加注', isCorrect: false, explanation: '报复型 tilt：针对特定对手做出非理性行动。应该对所有人用同样的策略。', evImpact: '-3 BB/session' },
              ],
              relatedLessonId: 'l5-tilt',
            },
          
            { id: 'l5-tilt-p4', difficulty: 'intermediate', scenario: { heroHand: ['Ah', 'Kh'], heroPosition: 'BTN', previousActions: [{ player: 'CO', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: '连输3手后加大加注', isCorrect: false, explanation: '连输后加大加注是tilt的表现。', evImpact: '-5 BB/session' }, { action: '检查情绪状态，正常打', isCorrect: true, explanation: '定期检查情绪状态，如果稳定就继续正常打。', evImpact: '0' }, { action: '弃掉所有手牌', isCorrect: false, explanation: '过度弃牌也是tilt（恐惧型）的表现。', evImpact: '-3 BB/session' }], relatedLessonId: 'l5-tilt' },
            { id: 'l5-tilt-p5', difficulty: 'advanced', scenario: { heroHand: ['Js', 'Jc'], heroPosition: 'CO', previousActions: [{ player: 'UTG', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: '设定session止损线为2个买入', isCorrect: true, explanation: '提前设定止损线是防tilt的关键措施。', evImpact: '保护资金' }, { action: '不设止损线', isCorrect: false, explanation: '没有止损线很容易在tilt时继续打。', evImpact: '-10 BB/session' }, { action: '止损线设为10个买入', isCorrect: false, explanation: '10个买入太多了。2个买入是合理的止损线。', evImpact: '-5 BB/session' }], relatedLessonId: 'l5-tilt' },],
        },
      },
      {
        id: 'l5-game-selection',
        level: 5,
        order: 3,
        title: '游戏选择与长期思维',
        subtitle: '选择正确的战场，用长期视角看待扑克',
        duration: '6 min',
        content: [
          { type: 'heading', content: '游戏选择' },
          {
            type: 'text',
            content:
              '好的游戏选择可以让你的小时赢率翻倍。寻找以下特征的桌子：\n- 有高比例的休闲玩家（VPIP > 30%）\n- 平均底池较大\n- 翻牌率较高（多玩家看flop）\n- 玩家之间互动多（加注频繁）',
          },
          {
            type: 'key-point',
            content: '你是桌上第6好的玩家还是第1好的玩家，比你打哪个级别更重要。',
          },
          { type: 'heading', content: '长期思维' },
          {
            type: 'text',
            content:
              '扑克是一个长期游戏。短期结果（1天、1周甚至1个月）很大程度上受运气影响。只有在足够大的样本量下（10,000+手牌），技术差距才会显现。\n\n不要因为短期的好运气升级到超出自己资金的级别，也不要因为短期的坏运气放弃正确的策略。',
          },
          {
            type: 'pro-tip',
            content:
              '职业牌手的思维方式："这一手牌的结果不重要，重要的是我的决策是否是+EV的。如果我持续做出+EV决策，长期来看我一定会盈利。" 这种心态是区分职业和业余的根本。',
          },
        ],
        quiz: [
          {
            id: 'l5-game-q1',
            question: '好桌子的特征之一是？',
            options: ['全是职业牌手', '底池很小', '有很多休闲玩家', '没人加注'],
            correctIndex: 2,
            explanation: '理想的桌子有很多休闲玩家（高VPIP），这让你的技术优势最大化。',
          },
          {
            id: 'l5-game-q2',
            question: '至少需要多少手牌的样本量才能准确评估你的水平？',
            options: ['100手', '1,000手', '10,000手以上', '10手'],
            correctIndex: 2,
            explanation: '至少需要10,000+手牌，短期的结果受方差影响太大，无法准确评估技术水平。',
          },
        
          { id: 'l5-game-q3', question: '你是桌上第几好的玩家最理想？', options: ['第1好', '第3好', '第6好', '无所谓'], correctIndex: 0, explanation: '理想情况是你是桌上最好的玩家，技术优势最大化。' },
          { id: 'l5-game-q4', question: '短期（1周）的输赢能说明什么？', options: ['你的真实水平', '策略有问题', '受方差影响太大', '应该换策略'], correctIndex: 2, explanation: '短期结果受方差影响太大，需要10,000+手牌才能评估。' },
          { id: 'l5-game-q5', question: '关注什么比关注结果更重要？', options: ['单手输赢', '决策质量', '对手的表情', '运气'], correctIndex: 1, explanation: '关注决策质量而非结果。错误决策可能偶尔赢钱，但长期必亏。' },],
        examples: [
          {
            id: 'l5-game-ex1',
            title: '好桌子 vs 坏桌子识别',
            heroHand: ['Ah', 'Qh'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'UTG', action: 'call 1BB' },
              { player: 'MP', action: 'call 1BB' },
              { player: 'CO', action: 'call 1BB' },
            ],
            street: 'preflop',
            effectiveStack: 100,
            potSize: 4.5,
            gameContext: { gameType: 'cash', tableDescription: '多人limp入池，典型的休闲玩家桌' },
            correctDecision: {
              action: '这是一张好桌子！',
              reasoning: [
                '多人 limp 入池 = 休闲玩家多',
                '平均底池较大，翻牌率高',
                '玩家被动（limp 而不是 raise）',
                '你的技术优势可以最大化',
              ],
            },
            commonMistake: {
              action: '离开这张桌子（“太松了”）',
              reasoning: '松被动的桌子是最好的赚钱机会。休闲玩家多意味着你的技术优势最大化。',
              evLoss: '错失高赢率机会',
            },
          },
          {
            id: 'l5-game-ex2',
            title: '长期思维：不要因短期结果改变策略',
            heroHand: ['Ks', 'Kd'],
            heroPosition: 'CO',
            previousActions: [
              { player: 'UTG', action: 'fold' },
              { player: 'MP', action: 'fold' },
            ],
            street: 'preflop',
            effectiveStack: 100,
            potSize: 1.5,
            correctDecision: {
              action: '继续执行正确策略',
              reasoning: [
                '你这周输了 5 个买入，但你的策略是正确的',
                '5 个买入 = 500BB，在正常方差范围内',
                '10,000 手牌后才能准确评估水平',
                '不要因短期下风就改变正确策略',
              ],
            },
            commonMistake: {
              action: '“我的策略不行，我要换打法”',
              reasoning: '短期下风不代表策略有问题。方差是扑克的一部分，只有足够大的样本才能证明策略是否+EV。',
              evLoss: '频繁换策略导致长期-EV',
            },
          },
        ],
        practice: {
          id: 'l5-game-practice',
          questions: [
            {
              id: 'l5-game-p1',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['As', 'Ts'],
                heroPosition: 'BTN',
                previousActions: [
                  { player: 'UTG', action: 'raise 3BB' },
                  { player: 'MP', action: 'raise 9BB' },
                  { player: 'CO', action: 'call 9BB' },
                ],
                street: 'preflop',
                potSize: 22.5,
                effectiveStack: 91,
                gameContext: { gameType: 'cash', tableDescription: '多人激进加注，可能是职业牌手桌' },
              },
              options: [
                { action: '这是一张好桌子，留下来', isCorrect: false, explanation: '多人加注、3-Bet、大底池 = 可能是职业牌手桌。这种桌子很难打，技术优势小。', evImpact: '-2 BB/100' },
                { action: '考虑换桌子（对手太强）', isCorrect: true, explanation: '多人激进加注说明对手水平较高。寻找更被动的桌子（多人limp）更有利可图。', evImpact: '+3 BB/100' },
                { action: 'All-in（“我不怕”）', isCorrect: false, explanation: 'ATs 面对 3-Bet 和多人跟注应该弃牌。这不是勇气问题，是数学问题。', evImpact: '-15 BB/100' },
              ],
              relatedLessonId: 'l5-game-selection',
            },
            {
              id: 'l5-game-p2',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['Qh', 'Qd'],
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
                { action: '“我这周输了，我打法有问题”', isCorrect: false, explanation: '一周的结果受方差影响太大，不能证明策略有问题。需要 10,000+ 手牌才能评估。', evImpact: '-信心' },
                { action: '继续执行正确策略，关注长期', isCorrect: true, explanation: '短期下风是正常的。只要你持续做+EV决策，长期一定会盈利。关注决策质量而非结果。', evImpact: '+长期盈利' },
                { action: '升级到更高级别“赢回来”', isCorrect: false, explanation: '因下风而升级是极其危险的行为。这会让你在更高级别遇到更强的对手，损失更大。', evImpact: '破产风险+200%' },
              ],
              relatedLessonId: 'l5-game-selection',
            },
            {
              id: 'l5-game-p3',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['Jh', 'Th'],
                heroPosition: 'BTN',
                previousActions: [
                  { player: 'UTG', action: 'call 1BB' },
                  { player: 'MP', action: 'call 1BB' },
                  { player: 'CO', action: 'call 1BB' },
                ],
                street: 'preflop',
                potSize: 4.5,
                effectiveStack: 100,
                gameContext: { gameType: 'cash', tableDescription: '多人被动limp，休闲玩家桌' },
              },
              options: [
                { action: 'Raise', amount: '6BB', isCorrect: true, explanation: '多人 limp 的桌子是好桌子！用强牌加注隔离休闲玩家，建立大底池。', evImpact: '+2.5 BB/100' },
                { action: 'Limp along', isCorrect: false, explanation: 'JTs 在多人底池有很好潜力，但应该加注而不是 limp。加注可以建立底池并获取主动权。', evImpact: '+0.5 BB/100' },
                { action: 'Fold（“太多人了”）', isCorrect: false, explanation: 'JTs 在多人底池有极好的隐含赔率。而且这是好桌子的标志，应该留下而不是离开。', evImpact: '-1.0 BB/100' },
              ],
              relatedLessonId: 'l5-game-selection',
            },
          
            { id: 'l5-game-p4', difficulty: 'intermediate', scenario: { heroHand: ['Kd', 'Qd'], heroPosition: 'BTN', previousActions: [{ player: 'UTG', action: 'call 1BB' }, { player: 'MP', action: 'call 1BB' }], street: 'preflop', potSize: 3.5, effectiveStack: 100, gameContext: { gameType: 'cash', tableDescription: '多人limp，休闲玩家桌' } }, options: [{ action: '离开这张太松的桌子', isCorrect: false, explanation: '松被动的桌子是最好的赚钱机会。', evImpact: '-2 BB/100' }, { action: 'Raise 6BB，隔离休闲玩家', isCorrect: true, explanation: '多人limp是好桌子！用强牌加注隔离休闲玩家。', evImpact: '+2.5 BB/100' }, { action: 'Limp along', isCorrect: false, explanation: 'KQs应该加注而不是limp。', evImpact: '+0.5 BB/100' }], relatedLessonId: 'l5-game-selection' },
            { id: 'l5-game-p5', difficulty: 'advanced', scenario: { heroHand: ['Ts', '9s'], heroPosition: 'CO', previousActions: [{ player: 'UTG', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: '打了500手就评估水平', isCorrect: false, explanation: '500手远远不够，至少需要10,000+手牌。', evImpact: '-信心' }, { action: '关注决策质量，不关注短期结果', isCorrect: true, explanation: '关注决策质量是长期成功的关键。', evImpact: '+长期盈利' }, { action: '因连输而改变策略', isCorrect: false, explanation: '短期下风不代表策略有问题。频繁换策略导致长期-EV。', evImpact: '-2 BB/100' }], relatedLessonId: 'l5-game-selection' },],
        },
      },
      {
        id: 'l5-short-deck',
        level: 5,
        order: 4,
        title: '短牌德州入门 (6+ Hold\'em)',
        subtitle: '掌握36张牌组的规则变化和策略调整',
        duration: '12 min',
        content: [
          { type: 'heading', content: '什么是短牌德州？' },
          {
            type: 'text',
            content:
              '短牌德州（Short Deck / 6+ Hold\'em）是德州扑克的流行变体，使用36张牌（6-A），移除了2、3、4、5。这导致了游戏动态的显著变化：更多翻牌率、更多听牌、更多行动。',
          },
          {
            type: 'key-point',
            content:
              '短牌德州在亚洲高额桌和 Triton 系列赛中非常流行。相比标准德州，它的波动更大但行动更多。',
          },
          { type: 'heading', content: '核心规则差异' },
          {
            type: 'text',
            content:
              '1. 牌组：36张牌（6-A），移除2-5\n2. 牌型等级变化：\n   - 顺子 > 三条（标准德州中三条 > 顺子）\n   - 同花 > 葫芦（标准德州中葫芦 > 同花）\n3. 最小顺子：A-6-7-8-9（A 可以作为 5 使用组成最小顺子）\n4. 前注（Ante）制：通常没有盲注，改用所有人投前注 + BTN 投额外 ante',
          },
          {
            type: 'example',
            content:
              '短牌牌型等级（从弱到强）：\n\n1. 高牌\n2. 一对\n3. 两对\n4. 顺子 ← 注意：在标准德州中这里应该是三条\n5. 三条 ← 注意：在标准德州中这里应该是顺子\n6. 同花 ← 注意：在标准德州中这里应该是葫芦\n7. 葫芦 ← 注意：在标准德州中这里应该是同花\n8. 四条\n9. 同花顺\n10. 皇家同花顺',
          },
          {
            type: 'highlight',
            content:
              '最容易犯的错误：在短牌中用三条下重注以为自己是坚果，但对手可能有更便宜的顺子！记住短牌中顺子 beats 三条。',
          },
          { type: 'heading', content: '短牌策略调整要点' },
          {
            type: 'text',
            content:
              '1. 手牌价值变化:\n' +
              '• 连牌（如 JTs, 98s）在短牌中相对价值下降——虽然更容易中顺子，但被同花/葫芦压制的风险也增加\n' +
              '• 同花牌价值提升——短牌中同花 beats 葫芦\n' +
              '• 小口袋对价值下降——set 被顺子 beats，set mine 的隐含赔率降低\n' +
              '• AK 等高牌在短牌中价值提升——牌组只剩 9 个等级后，顶对踢脚更值钱，AK 是除 AA/KK 外最强的非对子牌\n\n' +
              '2. 翻牌率更高：\n' +
              '• 36 张牌意味着更容易翻牌击中\n' +
              '• 约 45% 的概率翻牌中至少一对（标准德州约 33%）\n\n' +
              '3. 更多听牌和 action：\n' +
              '• 顺子听牌更常见\n' +
              '• 底池通常更大（前注制 + 更多跟注）\n' +
              '• 波动更大，资金管理需要更保守',
          },
          { type: 'heading', content: '短牌起手牌范围调整' },
          {
            type: 'text',
            content:
              '短牌范围与标准德州有显著差异：\n\n- JTs 等连牌在短牌中仍有一定价值，但不像传统说法那样“相当于 AKs”\n- 所有同花连牌价值有所提升（同花 > 葫芦的牌型变化）\n- 小口袋对（66-88）价值下降（set 容易被顺子压制）\n- AK 等高牌价值显著提升，是除 AA/KK 外最强起手牌\n- KQo 等非花大牌价值相对标准德州略有下降\n- 范围整体偏紧——短牌中位置和后手筹码深度更重要',
          },
          {
            type: 'pro-tip',
            content:
              '短牌德州的关键是理解“等值手牌”的变化。标准德州中的“标准打法”在短牌中可能是严重错误。建议在低额短牌桌上先练习，适应牌型等级变化和范围调整后再升级。',
          },
        ],
        quiz: [
          {
            id: 'sd-q1',
            question: '短牌德州使用多少张牌？',
            options: ['40张', '36张', '32张', '48张'],
            correctIndex: 1,
            explanation: '短牌德州移除 2-5，使用 36 张牌（6-A，每个花色9张）。',
          },
          {
            id: 'sd-q2',
            question: '短牌中，以下哪个牌型排名正确？',
            options: ['三条 > 顺子', '顺子 > 三条', '葫芦 > 同花', '两者相同'],
            correctIndex: 1,
            explanation: '短牌中顺子 beats 三条（与标准德州相反），因为顺子更难组成。',
          },
          {
            id: 'sd-q3',
            question: '短牌中最小的合法顺子是？',
            options: ['A-2-3-4-5', 'A-6-7-8-9', '6-7-8-9-T', '2-3-4-5-6'],
            correctIndex: 1,
            explanation: 'A-6-7-8-9 是短牌中最小的顺子（A 作为 5 使用）。A-2-3-4-5 不合法因为 2-5 被移除了。',
          },
          { id: 'sd-q4', question: '短牌德州中，以下哪类牌价值相对提升？', options: ['同花连牌', 'AK 等高牌', '小口袋对', '非同花大牌'], correctIndex: 1, explanation: 'AK 等高牌在短牌中价值显著提升。由于牌组只有 9 个等级（6-A），顶对踢脚的胜率提高，AK 成为除 AA/KK 外最强的非对子牌。JTs 等连牌虽然翻牌可塑性增强，但也面临被同花/葫芦压制的风险，整体价值相对标准德州有所下降或持平。' },
        
          { id: 'sd-q5', question: '短牌德州中同花beats什么？', options: ['顺子', '三条', '葫芦', '高牌'], correctIndex: 2, explanation: '短牌中同花beats葫芦（与标准德州不同）。' },],
        examples: [
          {
            id: 'sd-ex1',
            title: '短牌中同花听牌的价值',
            heroHand: ['9h', '8h'],
            heroPosition: 'BTN',
            previousActions: [{ player: 'CO', action: 'raise 2 ante' }],
            street: 'flop',
            board: ['Ah', '7h', '6c'],
            effectiveStack: 100,
            potSize: 8,
            correctDecision: {
              action: 'Raise',
              amount: '12 ante',
              reasoning: [
                '你持有同花听牌（9h8h）+ 卡顺听牌（需要T组成6-7-8-9-T）',
                '短牌中同花 beats 葫芦，同花听牌价值极高',
                '翻牌 Ah7h6c 你有 9 个同花 outs + 可能的顺子 outs',
                '半诈唬加注可以迫使对手弃牌或建立大底池',
              ],
            },
            commonMistake: {
              action: '仅跟注',
              reasoning:
                '在标准德州中仅跟注可能合理，但短牌中同花价值更高（beats葫芦），应该更积极地玩同花听牌。',
              evLoss: '-2.0 ante',
            },
          },
          {
            id: 'sd-ex2',
            title: '短牌中小口袋对的处理',
            heroHand: ['7s', '7c'],
            heroPosition: 'CO',
            previousActions: [{ player: 'UTG', action: 'raise 2 ante' }],
            street: 'preflop',
            effectiveStack: 100,
            potSize: 5,
            correctDecision: {
              action: 'Fold',
              reasoning: [
                '77 在短牌中价值大幅下降',
                '短牌中顺子 beats 三条，set mine 的价值降低',
                '对手 UTG open 范围在短牌中仍然偏强',
                '翻牌后即使中 set，也可能输给顺子',
              ],
            },
            commonMistake: {
              action: 'Call（set mine）',
              reasoning:
                '在标准德州中 77 call UTG open 是标准 set mine。但短牌中 set 不再是最强牌型之一（顺子和同花都 beats 它），set mine 的隐含赔率大幅下降。',
              evLoss: '-0.8 ante',
            },
          },
        ],
        practice: {
          id: 'sd-practice',
          questions: [
            {
              id: 'sd-p1',
              scenario: {
                heroHand: ['Jh', 'Th'],
                heroPosition: 'BTN',
                previousActions: [{ player: 'CO', action: 'raise 2 ante' }],
                street: 'preflop',
                potSize: 5,
                effectiveStack: 100,
              },
              options: [
                {
                  action: 'Fold',
                  isCorrect: false,
                  explanation: 'JTs 在短牌中是顶级起手牌，绝对不能弃牌。',
                  evImpact: '-2.0 ante',
                },
                {
                  action: 'Call',
                  isCorrect: false,
                  explanation: 'Call 不够激进。JTs 在短牌中足够强做 3-Bet。',
                  evImpact: '+0.5 ante',
                },
                {
                  action: 'Raise',
                  amount: '6 ante',
                  isCorrect: true,
                  explanation:
                    'JTs 在短牌中的价值相当于标准德州的 AKs。3-Bet 建立大底池并利用翻后可玩性。',
                  evImpact: '+2.5 ante',
                },
              ],
              relatedLessonId: 'l5-short-deck',
            },
            {
              id: 'sd-p2',
              scenario: {
                heroHand: ['Ac', 'Kc'],
                heroPosition: 'BB',
                previousActions: [{ player: 'BTN', action: 'raise 2 ante' }],
                street: 'flop',
                board: ['Qc', '8c', '6h'],
                potSize: 6,
                effectiveStack: 98,
              },
              options: [
                {
                  action: 'Check',
                  isCorrect: false,
                  explanation:
                    '你有同花听牌 + 两个高牌，应该主动下注。短牌中同花价值极高。',
                  evImpact: '-1.0 ante',
                },
                {
                  action: 'Raise',
                  amount: '5 ante',
                  isCorrect: true,
                  explanation:
                    'AK 同花听牌 + 两张高牌在短牌翻牌上是强力半诈唬。同花 beats 葫芦使你的听牌价值极高。',
                  evImpact: '+3.0 ante',
                },
                {
                  action: 'Call',
                  isCorrect: false,
                  explanation: 'Call 太被动。你的牌有足够的 equity 做加注。',
                  evImpact: '+0.5 ante',
                },
              ],
              relatedLessonId: 'l5-short-deck',
            },
            {
              id: 'sd-p3',
              scenario: {
                heroHand: ['As', '6d'],
                heroPosition: 'BTN',
                previousActions: [],
                street: 'flop',
                board: ['7s', '8h', '9c'],
                potSize: 4,
                effectiveStack: 96,
              },
              options: [
                {
                  action: 'Check',
                  isCorrect: false,
                  explanation:
                    '你有 A-6-7-8-9 顺子！这是短牌中的合法最小顺子，应该价值下注。',
                  evImpact: '-2.0 ante',
                },
                {
                  action: 'Raise',
                  amount: '3 ante',
                  isCorrect: true,
                  explanation:
                    'A-6-7-8-9 是短牌中的合法顺子！下注获取价值。注意这不是坚果顺子（T-high 顺子更大），但仍值得价值下注。',
                  evImpact: '+2.0 ante',
                },
                {
                  action: 'Fold',
                  isCorrect: false,
                  explanation: '你有顺子！绝对不要弃牌。',
                  evImpact: '-4.0 ante',
                },
              ],
              relatedLessonId: 'l5-short-deck',
            },
          
            { id: 'sd-p4', scenario: { heroHand: ['Ks', 'Kc'], heroPosition: 'BTN', previousActions: [{ player: 'CO', action: 'raise 2 ante' }], street: 'preflop', potSize: 5, effectiveStack: 100 }, options: [{ action: 'Fold', isCorrect: false, explanation: 'KK在短牌中是顶级强牌，不能弃牌。', evImpact: '-3.0 ante' }, { action: 'Raise 6 ante', isCorrect: true, explanation: 'KK在短牌中是顶级强牌，3-Bet获取价值。', evImpact: '+2.5 ante' }, { action: 'Call', isCorrect: false, explanation: 'KK足够强做3-Bet，Call太被动。', evImpact: '+1.0 ante' }], relatedLessonId: 'l5-short-deck' },
            { id: 'sd-p5', scenario: { heroHand: ['6s', '6c'], heroPosition: 'CO', previousActions: [{ player: 'UTG', action: 'raise 2 ante' }], street: 'flop', board: ['6h', '9h', 'Th'], potSize: 8, effectiveStack: 96 }, options: [{ action: 'Check', isCorrect: false, explanation: '中了set应该下注保护，听牌很多。', evImpact: '-1.5 ante' }, { action: 'Raise 5 ante', isCorrect: true, explanation: 'Set需要下注保护。短牌中顺子beats三条，但对手有听牌。', evImpact: '+2.0 ante' }, { action: 'Fold', isCorrect: false, explanation: '中了set绝不能弃牌。', evImpact: '-4.0 ante' }], relatedLessonId: 'l5-short-deck' },],
        },
      },
      {
        id: 'l5-session-review',
        level: 5,
        order: 5,
        title: 'Session Review 方法论',
        subtitle: '学会系统化复盘每次打牌，从实战中学习',
        duration: '9 min',
        content: [
          { type: 'heading', content: '为什么复盘比打牌更重要？' },
          { type: 'text', content: '许多玩家花大量时间打牌却很少复盘。研究表明，每小时打牌 + 30分钟复盘的进步速度，远超 2 小时纯打牌。' },
          { type: 'key-point', content: '标准 Session Review 流程：1) 标记关键手牌 → 2) 分析决策点 → 3) 对比 GTO → 4) 记录得失 → 5) 制定改进计划' },
          { type: 'heading', content: '复盘五步法' },
          { type: 'text', content: 'Step 1：标记关键手牌\n• 每次 Session 结束后立即标记 3-5 手“不确定”的牌\n• 不只看输的大底池，也看赢的大底池\n\nStep 2：分析决策点\n• 在每个街的关键点问“还有其他选择吗？”\n\nStep 3：对比 GTO\n• 用本平台的 GTO 模拟器检查最优策略\n\nStep 4：记录得失\n• 写下“我做了什么”和“应该做什么”\n\nStep 5：制定改进计划\n• 将最常见的错误列为下次 Session 的重点' },
          { type: 'pro-tip', content: '复盘时不要被结果迷惑（"我赢了所以做得对"）。关注的是决策质量，不是结果。一个错误的决策可能偶尔赢钱，但长期必定亏损。' },
          {
            type: 'formula',
            content: 'Session A/B/C 档分析框架：\nA 档（最佳状态）：专注、冷静、每个决策经过分析 → 适合复杂决策\nB 档（正常状态）：有一定疲劳但能维持基本决策质量 → 适合常规训练\nC 档（疲劳状态）：注意力下降、直觉代替分析 → 应立即停止\n\nSession 管理原则：\n- 单次训练不超过 60 分钟\n- 每 30 分钟休息 5 分钟\n- 出现 C 档信号时强制结束\n- 每日题量上限：0/50/100/200 四档',
          },
          {
            type: 'theory-reference',
            content: '理论支撑：Session A/B/C 档管理方法详见理论学院 T8 第 3 章"Session 管理与长期心态"。包括 Session 规划、止损纪律与长期盈利心态的量化框架。',
            data: { theoryLevelId: 't8', theoryChapterId: 't8-session' },
          },
          {
            type: 'counter-intuitive',
            content: '反直觉点：赢钱的 session 可能是最差的学习机会。当你连续赢钱时，容易产生"我打得很好"的错觉，即使实际上是在靠运气赢钱。真正的学习发生在输钱的 session 中——那是你发现并修正错误的机会。',
          },
        ],
        quiz: [
          { id: 'l5-sr-q1', question: 'Session Review 的第一步是？', options: ['计算赢输', '标记关键手牌', '兘开GTO求解器', '发朋友圈'], correctIndex: 1, explanation: '复盘首先要标记出需要分析的关键牌局，然后再深入分析。' },
          { id: 'l5-sr-q2', question: '复盘时应该关注什么？', options: ['单手牌的输赢结果', '决策质量而非结果', '只看大底池', '对手的表情'], correctIndex: 1, explanation: '质量复盘关注的是决策过程是否正确，而非单次结果。' },
        
          { id: 'l5-sr-q3', question: '复盘应该关注什么？', options: ['单手输赢', '决策质量', '对手运气', '牌桌风水'], correctIndex: 1, explanation: '复盘关注决策质量而非结果。' },
          { id: 'l5-sr-q4', question: '每次Session应标记几手关键牌？', options: ['所有手牌', '3-5手', '1手', '不标记'], correctIndex: 1, explanation: '每次Session结束后标记3-5手"不确定"的牌。' },
          { id: 'l5-sr-q5', question: '复盘的第5步是？', options: ['计算赢输', '标记手牌', '制定改进计划', '对比GTO'], correctIndex: 2, explanation: '复盘第5步是制定改进计划。' },],
        practice: {
          id: 'l5-sr-practice',
          questions: [
            { id: 'l5-sr-p1', difficulty: 'intermediate', scenario: { heroHand: ['Ah', 'Kd'], heroPosition: 'BTN', previousActions: [{ player: 'CO', action: 'fold' }], street: 'flop', board: ['Ac', '9d', '4h'], potSize: 6.5, effectiveStack: 95 }, options: [{ action: '赢了所以做得对', isCorrect: false, explanation: '结果导向思维。', evImpact: '-1 BB/100' }, { action: '分析每个决策点是否+EV', isCorrect: true, explanation: '复盘应关注决策质量。', evImpact: '+1 BB/100' }, { action: '只看输的大底池', isCorrect: false, explanation: '赢的牌也可能有决策错误。', evImpact: '-0.5 BB/100' }], relatedLessonId: 'l5-session-review' },
            { id: 'l5-sr-p2', difficulty: 'intermediate', scenario: { heroHand: ['Qs', 'Qd'], heroPosition: 'CO', previousActions: [{ player: 'UTG', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: 'Session后立即标记3-5手关键牌', isCorrect: true, explanation: '趁记忆新鲜立即标记。', evImpact: '+0.5 BB/100' }, { action: '等一周后再复盘', isCorrect: false, explanation: '等太久会忘记关键细节。', evImpact: '-0.5 BB/100' }, { action: '不复盘', isCorrect: false, explanation: '不复盘就失去最重要的学习机会。', evImpact: '-2 BB/100' }], relatedLessonId: 'l5-session-review' },
            { id: 'l5-sr-p3', difficulty: 'advanced', scenario: { heroHand: ['Jh', 'Th'], heroPosition: 'BTN', previousActions: [{ player: 'CO', action: 'raise 3BB' }], street: 'flop', board: ['Kd', '8c', '3h'], potSize: 7.5, effectiveStack: 92 }, options: [{ action: '用GTO求解器检查每个标记的牌局', isCorrect: true, explanation: '用GTO求解器对比是复盘的重要步骤。', evImpact: '+1 BB/100' }, { action: '只凭感觉判断', isCorrect: false, explanation: '凭感觉不够客观。', evImpact: '-0.5 BB/100' }, { action: '只看对手的错误', isCorrect: false, explanation: '复盘重点是自己的决策。', evImpact: '-0.5 BB/100' }], relatedLessonId: 'l5-session-review' },
            { id: 'l5-sr-p4', difficulty: 'advanced', scenario: { heroHand: ['As', 'Ts'], heroPosition: 'BTN', previousActions: [{ player: 'CO', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: '记录"做了什么"和"应该做什么"', isCorrect: true, explanation: '记录得失是复盘的核心步骤。', evImpact: '+1 BB/100' }, { action: '只计算输赢金额', isCorrect: false, explanation: '只计算输赢是结果导向。', evImpact: '-0.5 BB/100' }, { action: '不记录', isCorrect: false, explanation: '不记录容易遗忘和自欺。', evImpact: '-1 BB/100' }], relatedLessonId: 'l5-session-review' },
            { id: 'l5-sr-p5', difficulty: 'advanced', scenario: { heroHand: ['Kd', 'Qd'], heroPosition: 'CO', previousActions: [{ player: 'UTG', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: '将最常见的错误列为下次重点', isCorrect: true, explanation: '制定改进计划是复盘最后一步。', evImpact: '+1.5 BB/100' }, { action: '同时修复所有漏洞', isCorrect: false, explanation: '同时修所有漏洞效率低。', evImpact: '-0.5 BB/100' }, { action: '靠直觉进步', isCorrect: false, explanation: '不系统复盘无法发现重复错误。', evImpact: '-2 BB/100' }], relatedLessonId: 'l5-session-review' },
          ],
        },
      },
      {
        id: 'l5-data-driven',
        level: 5,
        order: 6,
        title: '数据驱动的漏洞修补',
        subtitle: '用统计数据识别并修复你最大的策略漏洞',
        duration: '10 min',
        content: [
          { type: 'heading', content: '用数据找到你的漏洞' },
          { type: 'text', content: '属于自己的统计数据是最客观的镜子。通过分析你的 VPIP、PFR、C-Bet %、各位置赢率等数据，可以精确定位藄弱点。' },
          { type: 'heading', content: '关键指标解读' },
          { type: 'text', content: 'VPIP/PFR 差距过大（>8）：跟注太多、加注太少\nC-Bet % < 50%：翻后不够激进\n各位置赢率差异大：某些位置的策略有问题\nShowdown % > 35%：跟注太多到河牌' },
          { type: 'key-point', content: '修复漏洞的优先级：先修频率最高的场景（如翻前范围），再修低频场景。一个翻前 Leak 每手都影响你，一个河牌 Leak 可能很少发生。' },
          { type: 'pro-tip', content: '每月做一次“数据体检”：导出你的各项统计，对比上月和目标值。进步就是漏洞不断缩小的过程。' },
        ],
        quiz: [
          { id: 'l5-dd-q1', question: 'VPIP/PFR 差距过大说明什么？', options: ['打得太紧', '跟注太多、加注太少', '打得很好', 'bluff太多'], correctIndex: 1, explanation: 'VPIP远大于PFR说明你被动跟注太多，应该要么加注要么弃牌。' },
          { id: 'l5-dd-q2', question: '修复漏洞应优先关注哪类？', options: ['河牌场景', '翻前场景（频率最高）', '锦标赛场景', '全部同时修'], correctIndex: 1, explanation: '翻前决策每手牌都会发生，修复翻前漏洞的收益最大。' },
        
          { id: 'l5-dd-q3', question: 'C-Bet % < 50% 说明什么？', options: ['打得太松', '翻后不够激进', '打得很好', 'bluff太多'], correctIndex: 1, explanation: 'C-Bet低于50%说明翻后不够激进。' },
          { id: 'l5-dd-q4', question: 'Showdown % > 35% 说明什么？', options: ['打得太紧', '跟注太多到河牌', 'bluff太多', '打得很好'], correctIndex: 1, explanation: 'Showdown%过高说明跟注太多到河牌。' },
          { id: 'l5-dd-q5', question: '每月应该做什么来追踪进步？', options: ['换级别', '做数据体检', '换平台', '不需要追踪'], correctIndex: 1, explanation: '每月做数据体检，导出各项统计对比目标值。' },],
        practice: {
          id: 'l5-dd-practice',
          questions: [
            { id: 'l5-dd-p1', difficulty: 'intermediate', scenario: { heroHand: ['Ah', 'Qh'], heroPosition: 'BTN', previousActions: [{ player: 'CO', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: 'VPIP 45%, PFR 25%', isCorrect: false, explanation: '差距20%过大，需要调整。', evImpact: '-1 BB/100' }, { action: '检查VPIP/PFR差距是否>8', isCorrect: true, explanation: 'VPIP/PFR差距是最基础的指标。', evImpact: '+0.5 BB/100' }, { action: '只看赢输金额', isCorrect: false, explanation: '赢输金额不能反映决策质量。', evImpact: '-0.5 BB/100' }], relatedLessonId: 'l5-data-driven' },
            { id: 'l5-dd-p2', difficulty: 'intermediate', scenario: { heroHand: ['Ks', 'Qs'], heroPosition: 'CO', previousActions: [{ player: 'UTG', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: '先修低频场景', isCorrect: false, explanation: '应该先修高频场景。', evImpact: '-0.5 BB/100' }, { action: '先修翻前漏洞（频率最高）', isCorrect: true, explanation: '翻前决策每手牌都发生，收益最大。', evImpact: '+1 BB/100' }, { action: '全部同时修', isCorrect: false, explanation: '同时修效率低。', evImpact: '-0.5 BB/100' }], relatedLessonId: 'l5-data-driven' },
            { id: 'l5-dd-p3', difficulty: 'advanced', scenario: { heroHand: ['Jd', 'Td'], heroPosition: 'BTN', previousActions: [{ player: 'CO', action: 'fold' }], street: 'flop', board: ['Ac', '8h', '3d'], potSize: 6.5, effectiveStack: 95 }, options: [{ action: '导出本月数据对比目标值', isCorrect: true, explanation: '每月数据体检可以发现趋势和漏洞。', evImpact: '+1 BB/100' }, { action: '只看最近100手', isCorrect: false, explanation: '100手样本太小。', evImpact: '-0.5 BB/100' }, { action: '不需要追踪', isCorrect: false, explanation: '不追踪就无法发现漏洞。', evImpact: '-2 BB/100' }], relatedLessonId: 'l5-data-driven' },
            { id: 'l5-dd-p4', difficulty: 'advanced', scenario: { heroHand: ['Qh', 'Jh'], heroPosition: 'CO', previousActions: [{ player: 'UTG', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: '各位置赢率差异大说明运气不好', isCorrect: false, explanation: '通常说明某些位置策略有问题。', evImpact: '-0.5 BB/100' }, { action: '分析各位置赢率找出薄弱位置', isCorrect: true, explanation: '各位置赢率是重要诊断指标。', evImpact: '+1.5 BB/100' }, { action: '只关注总体赢率', isCorrect: false, explanation: '总体赢率掩盖位置差异。', evImpact: '-0.5 BB/100' }], relatedLessonId: 'l5-data-driven' },
            { id: 'l5-dd-p5', difficulty: 'advanced', scenario: { heroHand: ['As', 'Ks'], heroPosition: 'BTN', previousActions: [{ player: 'CO', action: 'fold' }], street: 'preflop', potSize: 1.5, effectiveStack: 100 }, options: [{ action: '进步就是漏洞不断缩小的过程', isCorrect: true, explanation: '进步的本质是不断发现和修复漏洞。', evImpact: '+1 BB/100' }, { action: '进步就是赢钱越来越多', isCorrect: false, explanation: '短期赢钱受方差影响。', evImpact: '-0.5 BB/100' }, { action: '不需要刻意修补漏洞', isCorrect: false, explanation: '不修补就会停滞不前。', evImpact: '-2 BB/100' }], relatedLessonId: 'l5-data-driven' },
          ],
        },
      },
      // ===== Drill 课程 =====
      {
        id: 'drill-l5-tilt',
        level: 5,
        order: 7,
        title: '情绪识别 Drill',
        subtitle: '识别 Tilt 前兆',
        duration: '3分钟',
        content: [],
        quiz: [],
        type: 'drill',
        drillComponent: 'ChoiceDrill',
        drillData: {
          questions: [
            {
              id: 'd-l5-tilt-q1',
              scenario: '你刚被一个bad beat输了大底池',
              question: '接下来你应该怎么做？',
              options: [
                { id: 'a', text: '立即开始下一手', isCorrect: false },
                { id: 'b', text: '休息5-10分钟，调整情绪', isCorrect: true },
                { id: 'c', text: '加大下注级别打回来', isCorrect: false },
              ],
              explanation: 'Bad beat后容易tilt。休息几分钟让情绪平复，避免在情绪化状态下做决策。',
              difficulty: 1,
            },
            {
              id: 'd-l5-tilt-q2',
              scenario: '你发现自己连续3次用弱牌跟注大注',
              question: '这是什么信号？',
              options: [
                { id: 'a', text: '正常波动', isCorrect: false },
                { id: 'b', text: 'Tilt前兆，需要停下来', isCorrect: true },
                { id: 'c', text: '策略调整', isCorrect: false },
              ],
              explanation: '连续用弱牌跟注大注是典型的tilt表现。应该立即停下来，检查自己的情绪状态。',
              difficulty: 1,
            },
            {
              id: 'd-l5-tilt-q3',
              scenario: '你刚输了一个大底池，现在想“报仇”',
              question: '这种想法属于什么？',
              options: [
                { id: 'a', text: '正常的竞争心态', isCorrect: false },
                { id: 'b', text: 'Tilt的典型表现', isCorrect: true },
                { id: 'c', text: '策略调整', isCorrect: false },
              ],
              explanation: '“报仇”心态是tilt的典型表现。这会导致你用错误的理由做决策，而不是基于EV。',
              difficulty: 1,
            },
            {
              id: 'd-l5-tilt-q4',
              scenario: '你发现自己心跳加速、呼吸变快',
              question: '这是什么的生理信号？',
              options: [
                { id: 'a', text: '专注', isCorrect: false },
                { id: 'b', text: '情绪激动/tilt前兆', isCorrect: true },
                { id: 'c', text: '疲劳', isCorrect: false },
              ],
              explanation: '心跳加速、呼吸变快是情绪激动的生理信号。这是tilt的前兆，应该停下来深呼吸。',
              difficulty: 2,
            },
            {
              id: 'd-l5-tilt-q5',
              scenario: '你连续输了3个session',
              question: '你应该怎么做？',
              options: [
                { id: 'a', text: '继续打，总会赢回来', isCorrect: false },
                { id: 'b', text: '停止打牌，休息一天', isCorrect: true },
                { id: 'c', text: '加大下注级别追回损失', isCorrect: false },
              ],
              explanation: '连续输session后继续打容易tilt。休息一天让情绪平复，避免在情绪化状态下做决策。',
              difficulty: 1,
            },
            {
              id: 'd-l5-tilt-q6',
              scenario: '你发现自己在骂对手或发牢骚',
              question: '这是什么的信号？',
              options: [
                { id: 'a', text: '正常的情绪释放', isCorrect: false },
                { id: 'b', text: 'Tilt的表现，需要停下来', isCorrect: true },
                { id: 'c', text: '专注的表现', isCorrect: false },
              ],
              explanation: '骂对手或发牢骚是tilt的表现。这说明你的情绪已经影响到决策，应该立即停下来。',
              difficulty: 2,
            },
            {
              id: 'd-l5-tilt-q7',
              scenario: '你刚被对手连续3次bluff成功',
              question: '接下来你应该怎么做？',
              options: [
                { id: 'a', text: '下次他用宽的范围跟注', isCorrect: false },
                { id: 'b', text: '检查自己的情绪，必要时休息', isCorrect: true },
                { id: 'c', text: '立即反击，下次加注他', isCorrect: false },
              ],
              explanation: '被连续bluff容易激发tilt。先检查自己的情绪状态，如果被激怒就休息。不要因为情绪做决策。',
              difficulty: 2,
            },
            {
              id: 'd-l5-tilt-q8',
              scenario: '你发现自己玩得比平时更松',
              question: '这是什么原因？',
              options: [
                { id: 'a', text: '策略调整', isCorrect: false },
                { id: 'b', text: '可能是tilt导致的', isCorrect: true },
                { id: 'c', text: '运气不好', isCorrect: false },
              ],
              explanation: '玩得比平时更松是tilt的典型表现。情绪化会导致你放松起手牌标准，用弱牌入池。',
              difficulty: 1,
            },
          ],
        },
      },
      // ===== 扑克分析工具入门 =====
      {
        id: 'l5-tools',
        level: 5,
        order: 8,
        title: '扑克分析工具入门',
        subtitle: '善用工具加速学习，但不要被工具绑架',
        duration: '8分钟',
        content: [
          { type: 'heading', content: '为什么需要使用工具？' },
          {
            type: 'text',
            content:
              '现代扑克已经进入数据化时代。分析工具可以帮助你：\n\n1. 验证直觉：用数学验证你的打法是否正确\n2. 发现漏洞：通过数据发现自己的策略漏洞\n3. 学习GTO：了解理论最优策略作为参考基准\n4. 追踪进步：记录和分析你的长期表现',
          },
          {
            type: 'key-point',
            content: '工具是辅助学习的利器，但过度依赖工具会阻碍直觉培养。正确使用工具的姿势：先理解原理，再用工具验证。',
          },
          { type: 'heading', content: '核心工具介绍' },
          {
            type: 'text',
            content:
              'PioSOLVER / GTO+：\n- 用途：求解特定场景的GTO策略\n- 适用：翻后策略分析、频率平衡研究\n- 学习建议：从简单场景开始（如单挑翻牌圈），逐步增加复杂度\n\nEquilab（免费）：\n- 用途：计算手牌对阵范围的胜率\n- 适用：翻前范围分析、底池赔率计算\n- 学习建议：熟悉常用范围的胜率，培养直觉\n\nHand2Note / Holdem Resource Manager：\n- 用途：追踪和分析你的历史数据\n- 适用：发现策略漏洞、监控表现\n- 学习建议：关注关键指标（VPIP/PFR/3-Bet%），不要过度分析',
          },
          {
            type: 'pro-tip',
            content: '最有效的学习方式：先用工具分析你的问题手牌，理解正确打法，然后在实战中刻意练习。不要只是看结果，要理解背后的逻辑。',
          },
          {
            type: 'highlight',
            content: '警告：不要在学习时同时开多个工具。专注理解一个场景，比快速浏览100个场景更有效。',
          },
        ],
        quiz: [
          {
            id: 'l5-tools-q1',
            question: 'PioSOLVER / GTO+ 的主要用途是？',
            options: ['追踪历史数据', '求解特定场景的GTO策略', '计算胜率', '管理资金'],
            correctIndex: 1,
            explanation: 'PioSOLVER/GTO+ 是求解器，用于分析特定场景的GTO策略。',
          },
          {
            id: 'l5-tools-q2',
            question: 'Equilab 的主要功能是？',
            options: ['分析翻后策略', '追踪历史数据', '计算手牌对阵范围的胜率', '管理资金'],
            correctIndex: 2,
            explanation: 'Equilab 是免费的胜率计算器，用于分析手牌对阵范围的胜率。',
          },
          {
            id: 'l5-tools-q3',
            question: '使用分析工具的正确姿势是？',
            options: ['完全依赖工具做决策', '先理解原理，再用工具验证', '只看结果不理解逻辑', '同时开多个工具快速浏览'],
            correctIndex: 1,
            explanation: '工具是辅助学习的，应该先理解原理，再用工具验证。',
          },
          {
            id: 'l5-tools-q4',
            question: 'Hand2Note / Holdem Resource Manager 的主要用途是？',
            options: ['求解GTO策略', '计算胜率', '追踪和分析历史数据', '训练翻后技术'],
            correctIndex: 2,
            explanation: 'Hand2Note/Holdem Resource Manager 是数据追踪工具，用于分析历史数据。',
          },
          {
            id: 'l5-tools-q5',
            question: '关于工具使用的建议，以下哪项是错误的？',
            options: ['从简单场景开始学习', '专注理解一个场景比快速浏览100个更有效', '同时开多个工具提高效率', '先理解原理再验证'],
            correctIndex: 2,
            explanation: '同时开多个工具会降低学习效率。应该专注理解一个场景，深入分析。',
          },
        ],
        examples: [
          {
            id: 'l5-tools-ex1',
            title: '使用 PioSOLVER 分析 C-Bet 策略',
            heroHand: ['As', 'Kh'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2.5BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Kd', '8c', '3h'],
            street: 'flop',
            effectiveStack: 97,
            potSize: 5.5,
            correctDecision: {
              action: '使用 PioSOLVER 分析',
              reasoning: [
                '设置场景：BTN open vs BB call，K-8-3 彩虹面',
                '运行求解器，查看GTO推荐的 C-Bet 频率和尺度',
                '观察不同手牌的 C-Bet 策略分布',
                '对比你的实战打法与GTO的差异，发现漏洞',
              ],
            },
            commonMistake: {
              action: '只看结果不分析过程',
              reasoning: '不要只关注"应该下注多少"，要理解为什么这个尺度是最优的。',
              evLoss: '学习效率降低',
            },
          },
        ],
        practice: {
          id: 'l5-tools-practice',
          questions: [
            {
              id: 'l5-tools-p1',
              difficulty: 'beginner',
              scenario: {
                heroHand: ['As', 'Ks'],
                heroPosition: 'BTN',
                previousActions: [
                  { player: 'BTN', action: 'raise 2.5BB' },
                  { player: 'BB', action: 'call' },
                ],
                board: ['Ad', '8c', '3h'],
                street: 'flop',
                potSize: 5.5,
                effectiveStack: 97,
              },
              options: [
                { action: '打开 Equilab 计算胜率', isCorrect: false, explanation: 'Equilab 用于翻前范围分析，翻后场景应该用 PioSOLVER。', evImpact: '0 BB/100' },
                { action: '打开 PioSOLVER 分析这个场景', isCorrect: true, explanation: 'PioSOLVER 适合分析翻后特定场景的GTO策略。', evImpact: '+0.5 BB/100' },
                { action: '打开 Hand2Note 追踪数据', isCorrect: false, explanation: 'Hand2Note 用于追踪历史数据，不是分析当前场景。', evImpact: '0 BB/100' },
              ],
              relatedLessonId: 'l5-tools',
            },
            {
              id: 'l5-tools-p2',
              difficulty: 'beginner',
              scenario: {
                heroHand: ['Qh', 'Jh'],
                heroPosition: 'CO',
                previousActions: [
                  { player: 'CO', action: 'raise 2.5BB' },
                  { player: 'BTN', action: 'call' },
                ],
                street: 'preflop',
                potSize: 6.5,
                effectiveStack: 95,
              },
              options: [
                { action: '使用 Equilab 计算 QJ 对阵 BTN call 范围的胜率', isCorrect: true, explanation: 'Equilab 适合计算翻前手牌对阵范围的胜率。', evImpact: '+0.5 BB/100' },
                { action: '使用 PioSOLVER 分析', isCorrect: false, explanation: '翻前场景用 Equilab 更合适，PioSOLVER 主要用于翻后。', evImpact: '0 BB/100' },
                { action: '不需要工具分析', isCorrect: false, explanation: '使用工具可以帮助你理解 QJ 在不同位置的强度。', evImpact: '-0.3 BB/100' },
              ],
              relatedLessonId: 'l5-tools',
            },
            {
              id: 'l5-tools-p3',
              difficulty: 'intermediate',
              scenario: {
                heroHand: ['9s', '8s'],
                heroPosition: 'BB',
                previousActions: [
                  { player: 'BTN', action: 'raise 2.5BB' },
                  { player: 'BB', action: 'call' },
                ],
                board: ['Kd', '7c', '2h'],
                street: 'flop',
                potSize: 5.5,
                effectiveStack: 95,
              },
              options: [
                { action: '使用 Hand2Note 查看对手数据', isCorrect: false, explanation: 'Hand2Note 用于追踪自己的历史数据，不是分析当前场景。', evImpact: '0 BB/100' },
                { action: '使用 PioSOLVER 分析 BB 防守范围的策略', isCorrect: true, explanation: 'PioSOLVER 可以分析 BB 防守范围在这个牌面的GTO策略。', evImpact: '+0.5 BB/100' },
                { action: '使用 Equilab 计算胜率', isCorrect: false, explanation: '翻后场景应该用 PioSOLVER，Equilab 主要用于翻前。', evImpact: '0 BB/100' },
              ],
              relatedLessonId: 'l5-tools',
            },
            {
              id: 'l5-tools-p4',
              difficulty: 'intermediate',
              scenario: {
                heroHand: ['As', 'Ah'],
                heroPosition: 'BTN',
                previousActions: [],
                street: 'preflop',
                potSize: 1.5,
                effectiveStack: 100,
              },
              options: [
                { action: '使用 Hand2Note 分析自己的 VPIP/PFR', isCorrect: true, explanation: 'Hand2Note 可以追踪你的翻前数据，发现策略漏洞。', evImpact: '+0.5 BB/100' },
                { action: '使用 PioSOLVER 分析', isCorrect: false, explanation: '翻前场景用 Equilab 或数据追踪工具更合适。', evImpact: '0 BB/100' },
                { action: '不需要工具', isCorrect: false, explanation: '数据追踪可以帮助你发现自己的策略漏洞。', evImpact: '-0.3 BB/100' },
              ],
              relatedLessonId: 'l5-tools',
            },
            {
              id: 'l5-tools-p5',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['Kd', 'Qd'],
                heroPosition: 'BTN',
                previousActions: [
                  { player: 'BTN', action: 'raise 2.5BB' },
                  { player: 'BB', action: 'call' },
                  { player: 'BB', action: 'check' },
                ],
                board: ['Qh', '8c', '3h', '2d'],
                street: 'turn',
                potSize: 5.5,
                effectiveStack: 95,
              },
              options: [
                { action: '使用 PioSOLVER 分析 Turn 策略', isCorrect: true, explanation: 'PioSOLVER 可以分析 Turn 的多街策略。', evImpact: '+0.5 BB/100' },
                { action: '使用 Equilab 计算胜率', isCorrect: false, explanation: '翻后多街场景应该用 PioSOLVER。', evImpact: '0 BB/100' },
                { action: '不需要工具分析', isCorrect: false, explanation: 'Turn 策略比较复杂，使用工具可以帮助你理解正确打法。', evImpact: '-0.3 BB/100' },
              ],
              relatedLessonId: 'l5-tools',
            },
          ],
        },
      },
      // ===== 线上与线下扑克差异 =====
      {
        id: 'l5-online-vs-live',
        level: 5,
        order: 9,
        title: '线上与线下扑克差异',
        subtitle: '适应不同环境，成为全能型牌手',
        duration: '8分钟',
        content: [
          { type: 'heading', content: '节奏差异' },
          {
            type: 'text',
            content:
              '线上扑克：\n- 节奏快，每手牌约 10-15 秒\n- 每小时约 60-80 手牌\n- 需要快速决策能力\n- 可以使用多表（MTT）提高效率\n\n线下扑克：\n- 节奏慢，每手牌约 1-2 分钟\n- 每小时约 25-35 手牌\n- 有更多时间思考\n- 需要耐心和心理素质',
          },
          {
            type: 'key-point',
            content: '核心差异：线上靠速度和数量盈利，线下靠质量和耐心盈利。两种环境需要不同的技能和心态。',
          },
          { type: 'heading', content: '多桌管理（MTT）' },
          {
            type: 'text',
            content:
              '线上多桌技巧：\n- 从 2-4 桌开始，逐步增加\n- 选择不同位置的桌子（避免都在同一时间行动）\n- 使用快捷决策，减少思考时间\n- 注意：多桌会降低每桌的专注度，适合打标准牌\n\n线下单桌技巧：\n- 可以专注观察每个对手\n- 有更多时间阅读 Tell 和形象\n- 适合打剥削策略',
          },
          { type: 'heading', content: 'HUD 数据利用与反 HUD' },
          {
            type: 'text',
            content:
              'HUD（Heads-Up Display）是线上特有的工具：\n\n利用 HUD：\n- 快速识别对手类型（VPIP/PFR/3-Bet%）\n- 发现对手的漏洞（如面对 C-Bet 弃牌率过高）\n- 做出数据驱动的决策\n\n反 HUD 策略：\n- 平衡你的数据（不要让数据过于极端）\n- 利用对手依赖 HUD 的弱点（如频繁 3-Bet 对付 HUD 显示紧的玩家）\n- 定期改变打法，让数据失效',
          },
          { type: 'heading', content: '速度扑克（Zoom/Blitz）' },
          {
            type: 'text',
            content:
              '速度扑克的特点：\n- 每手牌立即换桌，节奏极快\n- 无法针对特定对手调整\n- 适合打 GTO 策略\n- 需要快速决策能力\n\n适应策略：\n- 简化决策流程\n- 依赖标准打法\n- 不要试图在速度扑克中过度剥削',
          },
          { type: 'heading', content: '线下 Tell 阅读与形象管理' },
          {
            type: 'text',
            content:
              '线下特有的技能：\n\nTell 阅读：\n- 观察对手的下注动作、表情、姿态\n- 常见 Tell：手抖（通常是强牌）、犹豫（通常是弱牌）\n- 注意：不要过度解读，结合数据判断\n\n形象管理：\n- 建立稳定的形象（紧/松/激进/被动）\n- 利用形象剥削对手（如紧形象时多 bluff）\n- 保持一致性，不要让对手读出你的模式',
          },
          {
            type: 'pro-tip',
            content: '最好的牌手能够在线上和线下都保持盈利。建议两种环境都尝试，培养全面的技能。',
          },
        ],
        quiz: [
          {
            id: 'l5-online-vs-live-q1',
            question: '线上扑克每小时约多少手牌？',
            options: ['25-35手', '60-80手', '100-120手', '150+手'],
            correctIndex: 1,
            explanation: '线上扑克节奏快，每小时约 60-80 手牌。',
          },
          {
            id: 'l5-online-vs-live-q2',
            question: 'HUD 的主要用途是？',
            options: ['计算胜率', '快速识别对手类型和数据', '分析翻后策略', '管理资金'],
            correctIndex: 1,
            explanation: 'HUD 可以快速显示对手的 VPIP/PFR/3-Bet% 等数据，帮助识别对手类型。',
          },
          {
            id: 'l5-online-vs-live-q3',
            question: '速度扑克（Zoom/Blitz）适合打什么策略？',
            options: ['剥削策略', 'GTO 策略', 'Tell 阅读', '形象管理'],
            correctIndex: 1,
            explanation: '速度扑克每手牌换桌，无法针对特定对手调整，适合打 GTO 策略。',
          },
          {
            id: 'l5-online-vs-live-q4',
            question: '线下扑克的优势是？',
            options: ['节奏快', '可以观察 Tell 和形象', '可以多桌', '每小时手牌多'],
            correctIndex: 1,
            explanation: '线下扑克节奏慢，有更多时间观察对手的 Tell 和建立形象。',
          },
          {
            id: 'l5-online-vs-live-q5',
            question: '反 HUD 策略的核心是？',
            options: ['不使用 HUD', '平衡数据，让对手无法利用', '只打紧凶', '只打松凶'],
            correctIndex: 1,
            explanation: '反 HUD 策略的核心是平衡你的数据，不要让数据过于极端，让对手无法利用。',
          },
        ],
        examples: [
          {
            id: 'l5-online-vs-live-ex1',
            title: '线上多桌管理',
            heroHand: ['As', 'Ks'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            effectiveStack: 100,
            potSize: 1.5,
            correctDecision: {
              action: '多桌标准打法',
              reasoning: [
                '同时打 4 桌，每桌都需要快速决策',
                'AK 在 BTN 是标准加注，不需要深度思考',
                '使用快捷决策，减少每桌的思考时间',
                '多桌适合打标准牌，不要过度复杂化',
              ],
            },
            commonMistake: {
              action: '在多桌中过度分析每手牌',
              reasoning: '多桌时过度分析会降低效率。标准牌用标准打法，复杂牌再深度思考。',
              evLoss: '效率降低',
            },
          },
        ],
        practice: {
          id: 'l5-online-vs-live-practice',
          questions: [
            {
              id: 'l5-online-vs-live-p1',
              difficulty: 'beginner',
              scenario: {
                heroHand: ['Qd', 'Jd'],
                heroPosition: 'CO',
                previousActions: [
                  { player: 'CO', action: 'raise 2.5BB' },
                  { player: 'BTN', action: 'call' },
                ],
                street: 'preflop',
                potSize: 6.5,
                effectiveStack: 100,
                gameContext: { gameType: 'cash', tableDescription: '线上速度扑克（Zoom）' },
              },
              options: [
                { action: '使用标准 GTO 策略 C-Bet', isCorrect: true, explanation: '速度扑克无法针对特定对手，适合打标准 GTO 策略。', evImpact: '+0.5 BB/100' },
                { action: '根据对手 Tell 调整', isCorrect: false, explanation: '速度扑克每手牌换桌，无法观察 Tell。', evImpact: '0 BB/100' },
                { action: '建立形象剥削对手', isCorrect: false, explanation: '速度扑克无法建立形象，每手牌都是新对手。', evImpact: '0 BB/100' },
              ],
              relatedLessonId: 'l5-online-vs-live',
            },
            {
              id: 'l5-online-vs-live-p2',
              difficulty: 'intermediate',
              scenario: {
                heroHand: ['As', 'Ah'],
                heroPosition: 'BTN',
                previousActions: [
                  { player: 'BTN', action: 'raise 2.5BB' },
                  { player: 'BB', action: 'call' },
                ],
                board: ['Kd', '8c', '3h'],
                street: 'flop',
                potSize: 5.5,
                effectiveStack: 97,
                gameContext: { gameType: 'cash', tableDescription: '线下现金桌，对手有明显 Tell' },
              },
              options: [
                { action: '观察对手 Tell，结合数据决策', isCorrect: true, explanation: '线下扑克可以利用 Tell 阅读辅助决策。', evImpact: '+1.0 BB/100' },
                { action: '只看 HUD 数据', isCorrect: false, explanation: '线下没有 HUD，需要结合 Tell 和形象判断。', evImpact: '-0.5 BB/100' },
                { action: '忽略 Tell，只打 GTO', isCorrect: false, explanation: '线下 Tell 是重要信息来源，不应该忽略。', evImpact: '-0.5 BB/100' },
              ],
              relatedLessonId: 'l5-online-vs-live',
            },
            {
              id: 'l5-online-vs-live-p3',
              difficulty: 'intermediate',
              scenario: {
                heroHand: ['9s', '8s'],
                heroPosition: 'BB',
                previousActions: [
                  { player: 'BTN', action: 'raise 2.5BB' },
                  { player: 'BB', action: 'call' },
                ],
                board: ['Kd', '7c', '2h'],
                street: 'flop',
                potSize: 5.5,
                effectiveStack: 95,
                gameContext: { gameType: 'cash', tableDescription: '线上现金桌，同时打 4 桌' },
              },
              options: [
                { action: '使用标准打法，快速决策', isCorrect: true, explanation: '多桌时标准牌用标准打法，快速决策提高效率。', evImpact: '+0.5 BB/100' },
                { action: '深度分析对手范围', isCorrect: false, explanation: '多桌时过度分析会降低效率。标准牌用标准打法。', evImpact: '-0.3 BB/100' },
                { action: '弃牌，减少思考', isCorrect: false, explanation: '98s 在 BB 有足够赔率跟注，不应该因为多桌就弃牌。', evImpact: '-1.0 BB/100' },
              ],
              relatedLessonId: 'l5-online-vs-live',
            },
            {
              id: 'l5-online-vs-live-p4',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['Js', 'Ts'],
                heroPosition: 'BTN',
                previousActions: [
                  { player: 'BTN', action: 'raise 2.5BB' },
                  { player: 'BB', action: 'call' },
                ],
                board: ['Qh', '9c', '3h'],
                street: 'flop',
                potSize: 5.5,
                effectiveStack: 95,
                gameContext: { gameType: 'cash', tableDescription: '线上现金桌，HUD 显示对手 VPIP 45%，面对 C-Bet 弃牌率 20%' },
              },
              options: [
                { action: '利用 HUD 数据，对 Calling Station 减少 bluff', isCorrect: true, explanation: 'HUD 显示对手是 Calling Station（VPIP 45%，弃牌率 20%），应该减少 bluff，多价值下注。', evImpact: '+1.5 BB/100' },
                { action: '忽略 HUD，打 GTO', isCorrect: false, explanation: 'HUD 数据可以帮助你做出剥削调整，不应该忽略。', evImpact: '-0.5 BB/100' },
                { action: '频繁 bluff', isCorrect: false, explanation: '面对 Calling Station bluff 是-EV，他们不会弃牌。', evImpact: '-2.0 BB/100' },
              ],
              relatedLessonId: 'l5-online-vs-live',
            },
            {
              id: 'l5-online-vs-live-p5',
              difficulty: 'advanced',
              scenario: {
                heroHand: ['Ad', 'Kd'],
                heroPosition: 'CO',
                previousActions: [
                  { player: 'CO', action: 'raise 2.5BB' },
                  { player: 'BTN', action: 'call' },
                ],
                board: ['Kh', '8c', '3h'],
                street: 'flop',
                potSize: 6.5,
                effectiveStack: 95,
                gameContext: { gameType: 'cash', tableDescription: '线下现金桌，你建立了紧凶形象' },
              },
              options: [
                { action: '利用紧凶形象，在 Turn  bluff', isCorrect: true, explanation: '紧凶形象会让对手更尊重你的下注，可以适当 bluff。', evImpact: '+1.0 BB/100' },
                { action: '忽略形象，打 GTO', isCorrect: false, explanation: '线下形象是重要信息来源，可以利用形象剥削对手。', evImpact: '-0.5 BB/100' },
                { action: '总是价值下注', isCorrect: false, explanation: '紧凶形象也可以 bluff，不要总是价值下注。', evImpact: '-0.3 BB/100' },
              ],
              relatedLessonId: 'l5-online-vs-live',
            },
          ],
        },
      },
      // ===== Drill: Session 管理 =====
      {
        id: 'drill-l5-session',
        level: 5,
        order: 10,
        title: 'Session 管理 Drill',
        subtitle: '游戏选择、止损与 Session 规划',
        duration: '3分钟',
        content: [],
        quiz: [],
        type: 'drill',
        drillComponent: 'ChoiceDrill',
        drillData: {
          questions: [
            {
              id: 'd-l5-session-q1',
              scenario: '你连续输了 3 个大底池，情绪开始波动',
              question: '此时你应该怎么做？',
              options: [
                { id: 'a', text: '继续打，运气总会回来', isCorrect: false },
                { id: 'b', text: '立即执行止损，结束当前 Session', isCorrect: true },
                { id: 'c', text: '加大下注级别追回损失', isCorrect: false },
              ],
              explanation: '连续输大底池后情绪波动是 tilt 前兆。止损是保护资金和心理健康的关键纪律。立即结束 Session，改天再打。',
              difficulty: 1,
            },
            {
              id: 'd-l5-session-q2',
              scenario: '你来到一个牌桌，发现全是 TAG 玩家',
              question: '面对满桌 TAG，你应该怎么选择？',
              options: [
                { id: 'a', text: '坐下来打，证明自己', isCorrect: false },
                { id: 'b', text: '换桌，寻找有 Calling Station 的牌桌', isCorrect: true },
                { id: 'c', text: '加大级别打', isCorrect: false },
              ],
              explanation: '满桌 TAG 利润极薄（edge 很小）。游戏选择的核心是找到弱玩家多的牌桌。换桌是+EV 的决策。',
              difficulty: 1,
            },
            {
              id: 'd-l5-session-q3',
              scenario: '你计划打 4 小时 Session，已打了 3 小时感觉疲劳',
              question: '感觉疲劳时你应该怎么做？',
              options: [
                { id: 'a', text: '坚持打完计划时间', isCorrect: false },
                { id: 'b', text: '立即结束 Session 或至少休息 15 分钟', isCorrect: true },
                { id: 'c', text: '喝能量饮料继续打', isCorrect: false },
              ],
              explanation: '疲劳会导致注意力下降、决策质量降低。疲劳时继续打是-EV 的。应该结束 Session 或至少休息恢复。',
              difficulty: 1,
            },
            {
              id: 'd-l5-session-q4',
              scenario: '你的 bankroll 是 $2000，当前在 NL100（$100 buy-in）',
              question: '你的 bankroll 管理是否合理？',
              options: [
                { id: 'a', text: '合理，20BB 足够了', isCorrect: false },
                { id: 'b', text: '不合理，应该降至 NL50 或更低，保持至少 30-50 个 buy-in', isCorrect: true },
                { id: 'c', text: '应该升级到 NL200', isCorrect: false },
              ],
              explanation: '$2000 在 NL100 只有 20 个 buy-in，低于标准的 30-50 个 buy-in 要求。应该降级到 NL50（40 个 buy-in）以抵御方差。',
              difficulty: 2,
            },
            {
              id: 'd-l5-session-q5',
              scenario: '你赢了一个大 Session（+10 个 buy-in），感觉很兴奋',
              question: '赢了一个大 Session 后你应该怎么做？',
              options: [
                { id: 'a', text: '趁手热继续打下一个 Session', isCorrect: false },
                { id: 'b', text: '结束打牌，记录笔记，正常休息', isCorrect: true },
                { id: 'c', text: '加大级别打，赢了钱就该冒险', isCorrect: false },
              ],
              explanation: '赢大 Session 后容易过度自信（"赌徒谬误"的正向版本）。正确做法是结束、记录经验、正常休息。不要因赢钱而改变计划。',
              difficulty: 2,
            },
            {
              id: 'd-l5-session-q6',
              scenario: '线上有 2 个牌桌可选：A 桌平均 pot $15，B 桌平均 pot $8',
              question: '你是 NL25 的赢家，应该选哪个牌桌？',
              options: [
                { id: 'a', text: '选 A 桌（大 pot），利润更高', isCorrect: false },
                { id: 'b', text: '先观察两桌玩家类型，选择弱玩家多的那桌', isCorrect: true },
                { id: 'c', text: '随便选一个', isCorrect: false },
              ],
              explanation: '平均 pot 大不一定利润高。关键是看玩家类型——弱玩家多的牌桌利润更高。先观察再做选择。',
              difficulty: 2,
            },
            {
              id: 'd-l5-session-q7',
              scenario: '你设定了 Session 止损线为 3 个 buy-in',
              question: '为什么需要设定止损线？',
              options: [
                { id: 'a', text: '防止在状态不好时输更多', isCorrect: true },
                { id: 'b', text: '限制赢钱的速度', isCorrect: false },
                { id: 'c', text: '没有实际意义', isCorrect: false },
              ],
              explanation: '止损线是 bankroll 管理的核心纪律。它防止你在状态不佳（tilt/疲劳）时输掉超过预期的资金。',
              difficulty: 1,
            },
            {
              id: 'd-l5-session-q8',
              scenario: '你刚打完一个 -5 个 buy-in 的 Session，朋友叫你去打家庭局',
              question: '刚输了大 Session 后应该去打家庭局吗？',
              options: [
                { id: 'a', text: '去，家庭局很轻松能赢回来', isCorrect: false },
                { id: 'b', text: '不去，应该休息并复盘', isCorrect: true },
                { id: 'c', text: '去，但要加大级别', isCorrect: false },
              ],
              explanation: '输了大 Session 后不应该立即再打。应该休息、复盘、调整心态。带着负面情绪去打家庭局容易 tilt。',
              difficulty: 1,
            },
            {
              id: 'd-l5-session-q9',
              scenario: '你每周打 20 小时扑克，最近发现赢率下降',
              question: '赢率下降可能是什么原因？应该如何调整？',
              options: [
                { id: 'a', text: '运气不好，不需要调整', isCorrect: false },
                { id: 'b', text: '可能过度疲劳，减少打牌时间并增加学习/休息时间', isCorrect: true },
                { id: 'c', text: '加大级别弥补损失', isCorrect: false },
              ],
              explanation: '赢率下降通常说明疲劳或游戏质量下降。减少打牌时间、增加学习和休息是正确调整。不要通过加级别来弥补。',
              difficulty: 2,
            },
          ],
        },
      },
];
