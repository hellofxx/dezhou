import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Decision } from '@/shared/types/action';
import type { Card } from '@/shared/types/poker';
import { HandDisplay } from '@/shared/components/poker/HandDisplay';
import { PositionBadge } from '@/shared/components/poker/PositionBadge';
import { useScenarioEngine } from '../hooks/useScenarioEngine';
import { useGTOComparison, useGtoEloRecorder, useGtoSrsRecorder, useGtoEmotionRecorder, buildGtoFeedback } from '../hooks/useGTOComparison';
import { useGTOSimulatorStore } from '../store';
import { ActionSelector } from './ActionSelector';
import { GTOFeedback } from './GTOFeedback';
import { DecisionTree } from './DecisionTree';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import type { TrainingRecord } from '@/features/progress/types';
import { cn } from '@/shared/utils';
import { getOptimalAction } from '../utils/strategyCompare';
// P2-5.4: Session 止损守卫
import SessionLimitGuard, { useSessionLimitReached } from '@/features/progress/components/gate/SessionLimitGuard';
// P4 修复（4.5-P1-2）：自适应难度降级提示
import { useProgressStore } from '@/features/progress/store';

const SUIT_SYMBOL: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};
const RANK_CHAR: Record<number, string> = {
  14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T',
  9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2',
};

function BoardCard({ card }: { card: Card }) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-9 h-12 rounded-md border font-bold text-sm font-numeric',
        isRed
          ? 'text-[var(--suit-heart)] bg-[var(--walnut-raised)] border-[var(--walnut-border)]'
          : 'text-[var(--ivory)] bg-[var(--walnut-raised)] border-[var(--walnut-border)]'
      )}
    >
      <span>{RANK_CHAR[card.rank]}</span>
      <span className="text-xs leading-none">{SUIT_SYMBOL[card.suit]}</span>
    </div>
  );
}

export default function GTOSessionPage() {
  const navigate = useNavigate();
  const { getCurrentScenario, submitDecision, getProgress, session } = useScenarioEngine();
  const { showFeedback, feedback, currentNodeIndex, continueNext } = useGTOSimulatorStore();

  const scenario = getCurrentScenario();
  const progress = getProgress();

  // Streak 记账：训练完成时计入每日连续训练（recordTrainingDay 内部幂等并检查里程碑）
  const recordTrainingDay = useProgressStore((s) => s.recordTrainingDay);

  // P2-5.4: Session 止损 — 达到每日题量上限时禁止继续训练（早退在全部 hooks 之后，见下）
  const sessionLimitReached = useSessionLimitReached();

  // P4 修复（4.5-P1-2）：连续答错降级提示
  const shouldDownshiftDifficulty = useProgressStore((s) => s.shouldDownshiftDifficulty);

  const heroHand = scenario?.heroHand ?? null;
  const { handNotation } = useGTOComparison(heroHand, scenario?.position ?? null);

  // P1-2.4: GTO 训练 ELO 记录器（维度=postflop）
  const recordEloForAnswer = useGtoEloRecorder();
  // P1-3.2: GTO 训练 SRS 记录器
  const recordSrsForAnswer = useGtoSrsRecorder();
  // P2-5.2: GTO 训练情绪管理记录器
  const recordAnswerForEmotion = useGtoEmotionRecorder();
  // P1-3.2: 每个场景的开始时间戳（用于 SRS quality 评分），随场景切换重置
  const scenarioStartRef = useRef<number>(Date.now());
  useEffect(() => {
    if (scenario?.id) {
      scenarioStartRef.current = Date.now();
    }
  }, [scenario?.id]);

  const nodes = scenario?.decisionNodes;
  const currentNode = nodes?.[currentNodeIndex];

  const activeBoard = currentNode?.board ?? scenario?.board;
  const activePotSize = currentNode?.potSize ?? scenario?.potSize ?? 1.5;
  const activeStreet = currentNode?.street ?? scenario?.street ?? 'preflop';

  const flatBoard = useMemo(() => {
    if (!activeBoard) return [];
    const cards: Card[] = [...activeBoard.flop];
    if (activeBoard.turn) cards.push(activeBoard.turn);
    if (activeBoard.river) cards.push(activeBoard.river);
    return cards;
  }, [activeBoard]);

  // P1C-18: userDecisions 从结构化字段取值（不再从 explanation 解析）
  const userDecisions = useMemo(() => {
    if (!session || !scenario) return [];
    return session.decisions
      .filter((d) => d.scenarioId === scenario.id)
      .map((d, idx) => ({
        nodeIndex: idx,
        action: d.userAction?.action ?? '—',
      }));
  }, [session, scenario]);

  const handleDecision = useCallback(
    (decision: Decision) => {
      submitDecision(decision);
      const latestFeedback = useGTOSimulatorStore.getState().feedback;
      if (latestFeedback && scenario) {
        // P1C-06: ELO 仅在首决策节点记录（对齐 SRS/Emotion）
        if (currentNodeIndex === 0) {
          recordEloForAnswer(latestFeedback.isOptimal, scenario?.difficulty);
          const timeTakenMs = Date.now() - scenarioStartRef.current;
          recordSrsForAnswer(scenario, latestFeedback.isOptimal, timeTakenMs);
          recordAnswerForEmotion(latestFeedback.isOptimal);
        }
      }
    },
    [submitDecision, recordEloForAnswer, recordSrsForAnswer, recordAnswerForEmotion, scenario, currentNodeIndex]
  );

  const handleContinue = useCallback(() => {
    continueNext();
    const updatedSession = useGTOSimulatorStore.getState().session;
    if (updatedSession?.isComplete) {
      const result = useGTOSimulatorStore.getState().lastResult;
      if (result) {
        const record: TrainingRecord = {
          id: result.sessionId,
          module: 'gto-simulator',
          mode: 'scenario',
          result: {
            sessionId: result.sessionId,
            module: 'gto-simulator',
            totalQuestions: result.scenarios,
            correctAnswers: result.optimalDecisions,
            accuracy: result.accuracy,
            averageTime: result.totalTime / Math.max(result.scenarios, 1),
            timestamp: Date.now(),
            details: [],
          },
          createdAt: Date.now(),
        };
        trainingEvents.emit(record);
        // 计入每日连续训练（与 puzzle / theory 模块同模式：完成时同步调用，不走事件总线）
        recordTrainingDay();
        navigate(`/gto-simulator/result/${result.sessionId}`);
      }
    }
  }, [continueNext, navigate, recordTrainingDay]);

  // 止损早退必须位于全部 hooks 之后：守卫状态在挂载期间翻转（答题中达上限/
  // 调试开关切换）时，hooks 数量变化会触发 "Rendered fewer hooks" 崩溃
  if (sessionLimitReached) {
    return <SessionLimitGuard />;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-[var(--ivory-muted)] mb-4">没有活跃的训练会话</div>
        <button
          onClick={() => navigate('/gto-simulator')}
          className="px-4 py-2 rounded-lg bg-[var(--brass)] text-[var(--primary-foreground)] text-sm font-display font-semibold"
        >
          返回主页
        </button>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-[var(--ivory-muted)] font-display">训练完成！</div>
      </div>
    );
  }

  const isMultiStep = !!(nodes && nodes.length > 0);
  const isLastNode = !isMultiStep || currentNodeIndex >= (nodes?.length ?? 1) - 1;
  const isLastScenario = progress.current >= progress.total;

  const continueLabel = !isLastNode ? '下一步 →' : isLastScenario ? '查看结果' : '下一个场景 →';

  const streetLabel =
    activeStreet === 'preflop' ? '翻前'
    : activeStreet === 'flop' ? '翻牌圈'
    : activeStreet === 'turn' ? '转牌圈' : '河牌圈';

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 min-h-screen flex flex-col">
      {/* 进度条 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-[var(--ivory-muted)] font-numeric">
          <span>场景 {progress.current} / {progress.total}</span>
          <span>{Math.round(progress.percentage)}%</span>
        </div>
        <div className="h-1.5 bg-[var(--walnut-raised)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--brass)] to-[var(--sage)] rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* P4 修复（4.5-P1-2）：连续答错降级提示 */}
      {shouldDownshiftDifficulty() && (
        <div className="px-3 py-2 rounded-lg bg-[var(--clay)]/15 border border-[var(--clay)]/30 text-xs text-[var(--clay)]">
          检测到连续答错 3 次以上，建议返回场景设置选择更简单的难度，或先复习相关课程。
        </div>
      )}

      {/* 场景信息 */}
      <div className="p-4 rounded-xl bg-[var(--felt)] border border-[var(--walnut-border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PositionBadge position={scenario.position} active />
            <span className="text-sm text-[var(--ivory-dim)] font-numeric">
              {scenario.playerCount}-max {scenario.gameType}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--brass)]/20 text-[var(--brass-bright)] font-display font-bold">
              {streetLabel}
            </span>
          </div>
          <div className="text-xs text-[var(--ivory-muted)] font-numeric">
            {scenario.effectiveStack}BB · SPR {scenario.spr?.toFixed(1) ?? '—'}
          </div>
        </div>

        {/* Hero 手牌 */}
        <div className="flex items-center justify-center py-2">
          <HandDisplay cards={scenario.heroHand} size="lg" />
        </div>

        {handNotation && (
          <div className="text-center text-sm text-[var(--ivory-dim)] font-display tracking-wide">
            {handNotation}
          </div>
        )}

        {/* 公共牌 */}
        {flatBoard.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {flatBoard.map((card, i) => (
              <BoardCard key={i} card={card} />
            ))}
            {scenario.boardTexture && (
              <span className="ml-2 text-[10px] text-[var(--ivory-muted)] font-display">
                {scenario.boardTexture}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 决策树 / 行动历史 */}
      {isMultiStep ? (
        <DecisionTree nodes={nodes} currentNodeIndex={currentNodeIndex} userDecisions={userDecisions} />
      ) : (
        <DecisionTree
          actions={scenario.previousActions}
          heroPosition={scenario.position}
          potSize={activePotSize}
        />
      )}

      {/* 决策区 / 反馈区 */}
      {!showFeedback ? (
        <ActionSelector
          potSize={activePotSize}
          effectiveStack={scenario.effectiveStack}
          onDecision={handleDecision}
          callAmount={(() => {
            // P1C-12: 传入真实 callAmount
            const actions = currentNode?.previousActions ?? scenario.previousActions;
            if (activeStreet === 'preflop') {
              const raises = actions.filter((a) => a.action === 'raise');
              const lastRaise = raises[raises.length - 1];
              return lastRaise?.amount ?? 1;
            }
            return Math.round(activePotSize * 0.5 * 10) / 10;
          })()}
        />
      ) : (
        <div className="space-y-4">
          <GTOFeedback
            isOptimal={feedback?.isOptimal ?? false}
            evLoss={Math.max(0, feedback?.evLoss ?? 0)}
            explanation={feedback?.explanation ?? ''}
            gtoStrategy={feedback?.gtoStrategy ?? null}
            handNotation={handNotation}
            userEV={feedback?.userEV}
            optimalEV={feedback?.optimalEV}
            heroEquity={feedback?.heroEquity}
            exploitMode={useGTOSimulatorStore.getState().exploitMode}
            exploitStrategy={feedback?.exploitStrategy}
            selectedOpponent={useGTOSimulatorStore.getState().selectedOpponent}
            feedback={(() => {
              if (!feedback) return null;
              const gtoStrat = feedback.gtoStrategy;
              const optimal = gtoStrat ? getOptimalAction(gtoStrat) : null;
              const correctAction = optimal
                ? `${optimal.action}${optimal.amount ? ` ${optimal.amount}BB` : ''}`
                : '';
              // P1C-09: 用 activeStreet 而非 scenario.street
              const relatedLessonId = (() => {
                if (activeStreet === 'preflop') return 'l4-gto-basics';
                if (activeStreet === 'flop') return 'l3-cbet';
                return 'l3-multistreet';
              })();
              return buildGtoFeedback(feedback, correctAction, relatedLessonId);
            })()}
          />
          <button
            onClick={handleContinue}
            className="w-full py-3 rounded-xl bg-[var(--brass)] text-[var(--primary-foreground)] font-display font-bold text-sm hover:bg-[var(--brass-bright)] transition-all active:scale-[0.98]"
          >
            {continueLabel}
          </button>
        </div>
      )}
    </div>
  );
}
