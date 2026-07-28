import { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, Clock, Target, RotateCcw, Calculator } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { PotOddsQuizQuestion, PotOddsQuizOption } from '../types';
import { getEasyOddsQuestion, useOddsEloRecorder, useOddsSrsRecorder, useOddsEmotionRecorder, buildOddsFeedback } from '../hooks/useOddsCalculation';
// P2-5.4: Session 止损守卫
import SessionLimitGuard, { useSessionLimitReached } from '@/features/progress/components/SessionLimitGuard';
// P4 修复（4.5-P0）：自适应难度降级 + 五级反馈
import { useProgressStore } from '@/features/progress/store';
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';
import { Link } from 'react-router-dom';

// ─── Quiz Data (14 questions) ─────────────────────────────────────────────────

const QUIZ_QUESTIONS: PotOddsQuizQuestion[] = [
  {
    id: 1,
    category: 'odds-judgment',
    scenario: '底池 $100，对手下注 $50，你有同花听牌（9 outs）。Flop 发出，还有两张牌要来。',
    question: '底池赔率是否支持跟注？',
    options: [
      { text: '是，跟注有利可图', isCorrect: true, explanation: '底池赔率 = 50/(100+50+50) = 25%。同花听牌 flop 后 equity ≈ 35%（9 outs × 4）。35% > 25%，跟注是 +EV。' },
      { text: '否，应该弃牌', isCorrect: false, explanation: '赔率足够，不应弃牌。同花听牌在 flop 后有约 35% 的 equity，远超所需的 25%。' },
    ],
  },
  {
    id: 2,
    category: 'outs-calculation',
    scenario: '你持有 8♠9♠，翻牌是 T♠J♥2♠。',
    question: '你大约有多少个 outs？',
    options: [
      { text: '8 个（两头顺）', isCorrect: false, explanation: '你不仅有顺子听牌，还有同花听牌。' },
      { text: '9 个（同花听牌）', isCorrect: false, explanation: '你不仅有同花听牌，还有顺子听牌。' },
      { text: '约 15 个（组合听牌）', isCorrect: true, explanation: '同花听牌 9 outs + 两头顺子 8 outs - 重叠约 2 = 约 15 outs。这是强组合听牌，equity 约 54%。' },
      { text: '4 个（卡顺）', isCorrect: false, explanation: '你的听牌远强于卡顺，你有同花+两头顺的组合听牌。' },
    ],
  },
  {
    id: 3,
    category: 'implied-odds',
    scenario: '底池 $20，对手下注 $15。你持有小口袋对（set mine）。有效筹码 $200。',
    question: '直接底池赔率不支持跟注，但考虑隐含赔率呢？',
    options: [
      { text: '跟注，隐含赔率足够', isCorrect: true, explanation: '直接赔率 = 15/(20+15+15) = 30%，set mine 约 12% 不够。但隐含赔率：中 set 可赢取对手更多筹码，有效筹码/跟注 = 200/15 ≈ 13:1，远超所需的约 7.5:1。' },
      { text: '弃牌，赔率不够', isCorrect: false, explanation: '忽略了深筹码下的隐含赔率。Set mine 在深筹码情况下是经典的隐含赔率玩法。' },
    ],
  },
  {
    id: 4,
    category: 'reverse-implied',
    scenario: '你持有 K♠Q♠，翻牌是 K♥7♦3♣。对手在湿润面上大额下注。',
    question: '这里可能面临什么问题？',
    options: [
      { text: '反向隐含赔率 — 顶对可能被支配', isCorrect: true, explanation: 'KQ 中了顶对但 kicker 不是最强。如果对手有 AK 或 KK，你投入越多筹码损失越大。这就是反向隐含赔率的典型场景。' },
      { text: '没有风险，顶对很强', isCorrect: false, explanation: 'KQ 的 kicker 不是最强（AK 支配你），大额下注暗示超强范围，需要警惕。' },
    ],
  },
  {
    id: 5,
    category: 'odds-judgment',
    scenario: '底池 $80，对手下注 $80（满池下注）。你有两头顺子听牌（8 outs），Turn 发出，只剩一张牌。',
    question: '你应该跟注吗？',
    options: [
      { text: '跟注，赔率刚好够', isCorrect: false, explanation: '8 outs 在 turn 后只有约 17% equity。需要赔率 = 80/(80+80+80) = 33%。17% < 33%，直接赔率不够。' },
      { text: '弃牌，赔率不够', isCorrect: true, explanation: '底池赔率需要 33%，但 8 outs 在 turn 后只有约 17%（8×2+1）。除非有巨大隐含赔率，否则应该弃牌。' },
    ],
  },
  {
    id: 6,
    category: 'outs-calculation',
    scenario: '你持有 A♥K♥，翻牌是 2♥7♥9♣。你有坚果同花听牌 + 两张高牌。',
    question: '你大约有多少个 outs？',
    options: [
      { text: '9 个（仅同花）', isCorrect: false, explanation: '别忘了你还有两张高牌（A 和 K）可以配对。' },
      { text: '约 15 个', isCorrect: true, explanation: '同花听牌 9 outs + 高牌配对 6 outs（3张A + 3张K）= 15 outs。这是非常强的听牌，equity 约 54%。' },
      { text: '6 个（仅高牌）', isCorrect: false, explanation: '你还有坚果同花听牌，远不止高牌 outs。' },
      { text: '12 个', isCorrect: false, explanation: '同花 9 + 高牌 6 = 15，不是 12。' },
    ],
  },
  {
    id: 7,
    category: 'odds-judgment',
    scenario: '底池 $60，对手下注 $20（1/3 底池）。你有卡顺听牌（4 outs），Flop 发出。',
    question: '底池赔率是否支持跟注？',
    options: [
      { text: '是，小注给了好赔率', isCorrect: true, explanation: '底池赔率 = 20/(60+20+20) = 20%。卡顺 flop 后 equity ≈ 16%（4×4）。虽然接近，但加上隐含赔率（中顺子可赢更多），跟注是合理的。' },
      { text: '否，4 outs 太少', isCorrect: false, explanation: '虽然只有 4 outs，但对手给了很好的价格（只需 20% equity），加上隐含赔率，跟注是 +EV。' },
    ],
  },
  {
    id: 8,
    category: 'implied-odds',
    scenario: '你持有 5♦5♣，UTG open 到 $15，有效筹码 $300。你在 BTN。',
    question: 'Set mine 在这里是否有利可图？',
    options: [
      { text: '是，深筹码隐含赔率极佳', isCorrect: true, explanation: 'Set mine 需要约 15-20 倍跟注额的隐含筹码。$300/$15 = 20 倍，满足条件。中 set 后大概率能赢大底池。' },
      { text: '否，口袋对太弱', isCorrect: false, explanation: '小口袋对 set mine 在深筹码下是经典盈利玩法，20 倍隐含赔率足够。' },
    ],
  },
  {
    id: 9,
    category: 'reverse-implied',
    scenario: '你持有 A♣T♣，翻牌是 A♦8♣5♠。对手 check-raise 你的下注。',
    question: '为什么这里要小心？',
    options: [
      { text: '反向隐含赔率：AT 的顶对被更强 Ax 支配', isCorrect: true, explanation: 'Check-raise 通常代表强牌。对手可能有 AK、AQ、AJ 或 set。你的 AT 顶对中等 kicker 面临严重的反向隐含赔率——赢小输大。' },
      { text: '顶对顶踢脚，应该全下', isCorrect: false, explanation: 'AT 不是顶对顶踢脚（AK/AQ/AJ 都支配你），面对 check-raise 需要谨慎。' },
    ],
  },
  {
    id: 10,
    category: 'odds-judgment',
    scenario: '底池 $200，对手全下 $100。你有同花+卡顺组合听牌（约 12 outs），Turn 发出。',
    question: '你应该跟注吗？',
    options: [
      { text: '跟注，赔率足够', isCorrect: true, explanation: '底池赔率 = 100/(200+100+100) = 25%。12 outs 在 turn 后约 24%（12×2）。非常接近，加上可能的后门机会，跟注基本持平或微利。' },
      { text: '弃牌，不够', isCorrect: false, explanation: '12 outs 约 24% 非常接近所需的 25%，考虑到可能的额外 outs 和精确计算，这是一个边际跟注。' },
    ],
  },
  {
    id: 11,
    category: 'outs-calculation',
    scenario: '你持有 J♠T♠，翻牌是 Q♠9♠3♦。你有同花听牌 + 两头顺子听牌。',
    question: '注意重叠后，你大约有多少个有效 outs？',
    options: [
      { text: '17 个（直接相加）', isCorrect: false, explanation: '不能直接相加 9+8=17，因为有重叠的牌（如 K♠ 和 8♠ 同时完成同花和顺子）。' },
      { text: '约 15 个', isCorrect: true, explanation: '同花 9 + 顺子 8 - 重叠 2（K♠ 和 8♠）= 15 个有效 outs。这是极强的组合听牌。' },
      { text: '8 个', isCorrect: false, explanation: '你还有同花听牌的 outs，远不止 8 个。' },
      { text: '9 个', isCorrect: false, explanation: '你还有两头顺子听牌的 outs，远不止 9 个。' },
    ],
  },
  {
    id: 12,
    category: 'implied-odds',
    scenario: '你持有 7♣6♣，对手在 CO open 到 $10。有效筹码 $80。你在 BB。',
    question: '跟注 set mine / 投机牌的隐含赔率够吗？',
    options: [
      { text: '不够，筹码太浅', isCorrect: true, explanation: '隐含赔率需要约 15-20 倍：$80/$10 = 8 倍，远低于所需。同花顺子投机牌在浅筹码下很难盈利，应该弃牌或 3-bet。' },
      { text: '够，投机牌总是能赢大池', isCorrect: false, explanation: '8 倍隐含赔率远远不够。需要至少 15 倍以上才能让投机牌有利可图。' },
    ],
  },
  {
    id: 13,
    category: 'odds-judgment',
    scenario: '底池 $150，对手下注 $37.5（1/4 底池）。你有坚果同花听牌（9 outs），Flop 发出。',
    question: '面对这个小注，你应该？',
    options: [
      { text: '跟注，极好的赔率', isCorrect: true, explanation: '底池赔率 = 37.5/(150+37.5+37.5) = 16.7%。同花听牌 flop 后约 35% equity。35% >> 16.7%，这是极好的跟注机会。甚至可以考虑加注。' },
      { text: '弃牌，小注代表强牌', isCorrect: false, explanation: '无论对手牌力如何，你只需要 16.7% equity 就能跟注，而你有 35%。数学上必须跟注。' },
    ],
  },
  {
    id: 14,
    category: 'reverse-implied',
    scenario: '你持有 A♠J♠，翻牌是 A♥T♦4♣。对手持续下注，你 call。Turn 是 2♣，对手再次大额下注。',
    question: '连续两条街的大额下注暗示什么？',
    options: [
      { text: '反向隐含赔率加剧：对手可能有 AK/AQ/两对/set', isCorrect: true, explanation: '连续两条街大额下注（double barrel）通常代表强范围。AJ 的顶对中等 kicker 面临严重反向隐含赔率——你赢的时候对手牌弱，输的时候对手牌极强。' },
      { text: '对手在诈唬，应该加注', isCorrect: false, explanation: '虽然可能是诈唬，但连续两条街的大额下注更常代表价值牌。AJ 在这里是典型的抓诈牌，但反向隐含赔率风险很高。' },
    ],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  'odds-judgment': '赔率判断',
  'outs-calculation': 'Outs 计算',
  'implied-odds': '隐含赔率',
  'reverse-implied': '反向隐含赔率',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PotOddsQuizPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<PotOddsQuizOption | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [lastQuestionCorrect, setLastQuestionCorrect] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  // P2-5.4: Session 止损 — 达到每日题量上限时禁止继续训练
  const sessionLimitReached = useSessionLimitReached();
  if (sessionLimitReached) {
    return <SessionLimitGuard />;
  }

  // P1-2.4: pot-odds ELO 记录器（维度=math）
  const recordEloForAnswer = useOddsEloRecorder();
  // P1-3.2: pot-odds SRS 记录器
  const recordSrsForAnswer = useOddsSrsRecorder();
  // P2-5.2: pot-odds 情绪管理记录器
  const recordAnswerForEmotion = useOddsEmotionRecorder();
  // P4 修复（4.5-P0）：自适应难度降级信号
  const shouldDownshiftDifficulty = useProgressStore((s) => s.shouldDownshiftDifficulty);
  // P4 修复（4.2-P1-1）：五级反馈状态
  const [decisionFeedback, setDecisionFeedback] = useState<DecisionFeedback | null>(null);

  // "最后一题简单"策略：将末题替换为最简单的赔率题；
  // rescueUsed 用于避免无限追加补救题。
  const [rescueUsed, setRescueUsed] = useState(false);
  const [rescueQuestions, setRescueQuestions] = useState<PotOddsQuizQuestion[]>([]);

  // 实际生效的题目序列：原 14 题（最后一题被替换为简单题）+ 可选的补救题
  const effectiveQuestions = useMemo<PotOddsQuizQuestion[]>(() => {
    if (QUIZ_QUESTIONS.length === 0) return [];
    const base = QUIZ_QUESTIONS.slice(0, QUIZ_QUESTIONS.length - 1);
    const easyLast: PotOddsQuizQuestion = { ...getEasyOddsQuestion(), id: 9999 };
    return [...base, easyLast, ...rescueQuestions];
  }, [rescueQuestions]);

  const totalQuestions = effectiveQuestions.length;
  const currentQuestion = effectiveQuestions[currentIndex]!;

  const handleSelect = useCallback((option: PotOddsQuizOption) => {
    if (isAnswered) return;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const elapsedMs = elapsed * 1000;
    setTimes((prev) => [...prev, elapsed]);
    setSelectedOption(option);
    setIsAnswered(true);
    if (option.isCorrect) {
      setCorrectCount((c) => c + 1);
    }
    // P1-2.4: 答题后更新 math 维度 ELO
    recordEloForAnswer(option.isCorrect);
    // P1-3.2: 答题后更新 SRS 复习队列
    recordSrsForAnswer(currentQuestion, option.isCorrect, elapsedMs);
    // P2-5.2: 情绪管理 — 记录答题
    recordAnswerForEmotion(option.isCorrect);
    // P4 修复（4.2-P1-1）：生成五级 DecisionFeedback
    const correctOption = currentQuestion.options.find((o) => o.isCorrect);
    setDecisionFeedback(buildOddsFeedback(
      option.isCorrect,
      correctOption?.text ?? '',
      undefined, // evLoss 走默认值（答对=0，答错=3）
      correctOption?.explanation,
      'l1-basics', // pot-odds 基础对应 Level 1 入门
    ));
  }, [isAnswered, recordEloForAnswer, recordSrsForAnswer, recordAnswerForEmotion, currentQuestion]);

  const handleNext = useCallback(() => {
    const isLastQuestion = currentIndex + 1 >= totalQuestions;
    const lastAnswerCorrect = !!selectedOption?.isCorrect;

    // 最后一题已答完：若答错且未用过补救，追加一道简单题
    if (isLastQuestion) {
      if (!lastAnswerCorrect && !rescueUsed) {
        const rescue: PotOddsQuizQuestion = {
          ...getEasyOddsQuestion(),
          id: 10000 + Date.now(),
        };
        setRescueQuestions((prev) => [...prev, rescue]);
        setRescueUsed(true);
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        startTimeRef.current = Date.now();
        return;
      }
      // 否则结束
      setLastQuestionCorrect(lastAnswerCorrect);
      setFinished(true);
      return;
    }

    setCurrentIndex((i) => i + 1);
    setSelectedOption(null);
    setIsAnswered(false);
    setDecisionFeedback(null);
    startTimeRef.current = Date.now();
  }, [currentIndex, totalQuestions, selectedOption, rescueUsed]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setTimes([]);
    setFinished(false);
    setLastQuestionCorrect(false);
    setRescueUsed(false);
    setRescueQuestions([]);
    startTimeRef.current = Date.now();
  }, []);

  // ─── Results Panel ──────────────────────────────────────────────────────────
  if (finished) {
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const avgTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : '0';

    return (
      <div className="min-h-screen bg-[var(--felt-deep)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md text-center"
        >
          <Trophy className="w-16 h-16 text-[var(--brass-bright)] mx-auto mb-4" />
          <h2 className="font-display text-3xl text-[var(--ivory)] mb-2">训练完成！</h2>
          <p className="text-[var(--ivory-muted)] mb-8">赔率速算训练结果</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl bg-[var(--walnut-raised)] p-5">
              <p className="font-numeric text-3xl text-[var(--brass-bright)]">{accuracy}%</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">正确率</p>
            </div>
            <div className="rounded-xl bg-[var(--walnut-raised)] p-5">
              <p className="font-numeric text-3xl text-[var(--ivory)]">{avgTime}s</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> 平均用时
              </p>
            </div>
            <div className="rounded-xl bg-[var(--walnut-raised)] p-5">
              <p className="font-numeric text-3xl text-[var(--ivory)]">{correctCount}/{totalQuestions}</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
                <Target className="w-3 h-3" /> 答对
              </p>
            </div>
          </div>

          {/* Performance message */}
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4 mb-8">
            <p className="text-sm text-[var(--ivory-dim)]">
              {accuracy >= 90 ? '🎯 出色！你的赔率计算能力非常扎实！' :
               accuracy >= 70 ? '👍 不错！继续练习可以更加熟练。' :
               accuracy >= 50 ? '📚 还需要加强，建议复习赔率计算基础。' :
               '💡 建议先学习底池赔率和 Outs 计算的基础知识。'}
            </p>
            {lastQuestionCorrect && (
              <p className="text-xs text-[var(--sage)] mt-2 font-display">
                ✓ 最后一题答对，以成功收尾！
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-4 h-4" /> 再来一轮
            </button>
            <button
              onClick={() => navigate('/pot-odds')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--ivory-dim)]/30 text-[var(--ivory)] font-semibold text-sm hover:bg-[var(--walnut-raised)] transition-colors"
            >
              <Calculator className="w-4 h-4" /> 返回计算器
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Quiz View ──────────────────────────────────────────────────────────────
  const correctOption = currentQuestion.options.find((o) => o.isCorrect);

  return (
    <div className="min-h-screen bg-[var(--felt-deep)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/pot-odds')}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <h1 className="font-display text-xl text-[var(--ivory)]">赔率速算训练</h1>
          <span className="text-xs text-[var(--ivory-muted)]">
            {CATEGORY_LABELS[currentQuestion.category]}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--walnut-raised)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--brass-bright)]"
              initial={{ width: 0 }}
              animate={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-[var(--ivory-muted)] shrink-0">
            {currentIndex + 1} / {totalQuestions}
          </span>
          {currentIndex > 0 && (
            <span className="text-xs text-[var(--success)] shrink-0">
              ✓ {correctCount}
            </span>
          )}
        </div>

        {/* Scenario card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-xl bg-[var(--felt)] border border-[var(--felt-light)] p-6 mb-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
              <div className="relative z-10">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">🃏</span>
                  <p className="text-[var(--ivory)] text-base leading-relaxed font-medium">
                    {currentQuestion.scenario}
                  </p>
                </div>
                <p className="text-[var(--brass-bright)] font-semibold text-lg pl-10">
                  {currentQuestion.question}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-4">
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedOption === option;
                const showCorrect = isAnswered && option.isCorrect;
                const showWrong = isAnswered && isSelected && !option.isCorrect;

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleSelect(option)}
                    disabled={isAnswered}
                    className={cn(
                      'w-full text-left rounded-lg border px-5 py-4 text-sm transition-all',
                      'bg-[var(--walnut-raised)]/60 border-[var(--ivory-dim)]/20 text-[var(--ivory)]',
                      !isAnswered && 'hover:bg-[var(--walnut-raised)] hover:border-[var(--brass-bright)]/40 cursor-pointer',
                      showCorrect && 'border-[var(--success)]/60 bg-[var(--success)]/10 ring-1 ring-[var(--success)]/40',
                      showWrong && 'border-[var(--danger)]/60 bg-[var(--danger)]/10 ring-1 ring-[var(--danger)]/40',
                      isAnswered && !showCorrect && !showWrong && 'opacity-40',
                    )}
                    animate={
                      showWrong ? { x: [0, -4, 4, -4, 4, 0] } :
                      showCorrect ? { scale: [1, 1.01, 1] } : {}
                    }
                    transition={{ duration: 0.4 }}
                    whileHover={!isAnswered ? { scale: 1.01 } : {}}
                    whileTap={!isAnswered ? { scale: 0.99 } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0',
                        showCorrect ? 'border-[var(--success)] text-[var(--success)]' :
                        showWrong ? 'border-[var(--danger)] text-[var(--danger)]' :
                        'border-[var(--ivory-dim)]/40 text-[var(--ivory-muted)]'
                      )}>
                        {showCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                         showWrong ? <XCircle className="w-4 h-4" /> :
                         String.fromCharCode(65 + i)}
                      </span>
                      <span className="font-medium">{option.text}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {isAnswered && selectedOption && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className={cn(
                    'rounded-lg border p-4 mb-4',
                    selectedOption.isCorrect
                      ? 'border-[var(--success)]/40 bg-[var(--success)]/10'
                      : 'border-[var(--danger)]/40 bg-[var(--danger)]/10'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedOption.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                          <span className="text-sm font-bold text-[var(--success)]">正确！</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-[var(--danger)]" />
                          <span className="text-sm font-bold text-[var(--danger)]">不正确</span>
                          {correctOption && (
                            <span className="text-xs text-[var(--ivory-muted)] ml-2">
                              正确答案：{correctOption.text}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-[var(--ivory-dim)] leading-relaxed">
                      {selectedOption.isCorrect ? selectedOption.explanation : (correctOption?.explanation ?? selectedOption.explanation)}
                    </p>

                    {/* P4 修复（4.2-P1-1）：五级反馈显示 + 课程跳转 */}
                    {decisionFeedback && !selectedOption.isCorrect && decisionFeedback.relatedLessonId && (
                      <div className="mt-3 pt-3 border-t border-[var(--ivory-dim)]/20">
                        <span className="text-xs text-[var(--ivory-muted)] mr-2">
                          评级：{decisionFeedback.grade}
                        </span>
                        <Link
                          to={`/academy/lesson/${decisionFeedback.relatedLessonId}`}
                          className="text-xs text-[var(--brass-bright)] underline hover:text-[var(--brass)] transition-colors"
                        >
                          去复习相关课程 →
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* P4 修复（4.5-P0）：连续答错降级提示 */}
                  {shouldDownshiftDifficulty() && (
                    <div className="mb-4 px-4 py-2 rounded-lg bg-[var(--clay)]/15 border border-[var(--clay)]/30 text-xs text-[var(--clay)]">
                      检测到连续答错 3 次以上，建议放慢节奏，先复习基础课程再继续训练。
                    </div>
                  )}

                  {/* Next button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      {currentIndex + 1 >= totalQuestions ? '查看成绩' : '下一题'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
