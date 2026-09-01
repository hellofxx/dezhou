import { useTranslation } from 'react-i18next';
import type { HandStrategy } from '../types';
import type { HandNotation } from '@/shared/types/poker';
import { cn } from '@/shared/utils';
import { getOpponentProfile } from '@/shared/data/opponentProfiles';
import { GRADE_DISPLAY_CONFIG, type DecisionFeedback } from '@/shared/types/decisionFeedback';
import { renderMentorFeedback } from '@/shared/constants/mentorStyles';
import { DecisionAnalysis } from '@/shared/components/feedback/DecisionAnalysis';
import { TryAgainButton } from '@/shared/components/feedback/TryAgainButton';
import { useProgressStore } from '@/features/progress/store';
import { ActionType } from '@/shared/types/action';
import { actionTerm } from '../utils/actionTerms';

interface GTOFeedbackProps {
  isOptimal: boolean;
  evLoss: number;
  explanation: string;
  gtoStrategy: HandStrategy | null;
  handNotation?: HandNotation | null;
  userEV?: number;
  optimalEV?: number;
  heroEquity?: number;
  exploitMode?: boolean;
  exploitStrategy?: HandStrategy | null;
  selectedOpponent?: string | null;
  /** 五级反馈（可选）。提供时优先使用五级显示，否则降级为旧的二元显示 */
  feedback?: DecisionFeedback | null;
  /** 用户选择的动作（用于决策分析对比） */
  userAction?: { action: string; amount?: number } | null;
  /** 再做一题回调（wrong/blunder 反馈底部） */
  onTryAgain?: () => void;
}

export function GTOFeedback({
  isOptimal,
  evLoss,
  explanation,
  gtoStrategy,
  handNotation,
  userEV,
  optimalEV,
  heroEquity,
  exploitMode = false,
  exploitStrategy = null,
  selectedOpponent = null,
  feedback,
  userAction,
  onTryAgain,
}: GTOFeedbackProps) {
  const { t } = useTranslation();
  const opponent = selectedOpponent ? getOpponentProfile(selectedOpponent) : null;

  const raiseTerm = actionTerm(ActionType.Raise);
  const callTerm = actionTerm(ActionType.Call);
  const foldTerm = actionTerm(ActionType.Fold);

  // 五级反馈配置（feedback 提供时使用）
  const grade = feedback?.grade ?? null;
  const gradeConfig = grade ? GRADE_DISPLAY_CONFIG[grade] : null;

  // 旧二元显示的样式（feedback 缺省时使用）
  const legacyStatusColor = isOptimal
    ? 'text-[var(--sage)] border-[var(--sage)]/40 bg-[var(--sage)]/10'
    : evLoss > 3
      ? 'text-[var(--clay)] border-[var(--clay)]/40 bg-[var(--clay)]/10'
      : 'text-[var(--brass-bright)] border-[var(--brass)]/40 bg-[var(--brass)]/10';
  const legacyStatusIcon = isOptimal ? '✓' : evLoss > 3 ? '✗' : '△';
  const legacyStatusLabel = isOptimal
    ? t('gto.feedback.optimalLabel')
    : evLoss > 3
      ? t('gto.feedback.severeError')
      : t('gto.feedback.suboptimal');

  // P2-4：优先使用 mentorStyle 渲染人格化文案；缺省时降级到 i18n
  const mentorStyle = useProgressStore((s) => s.mentorStyle);
  const mentorMessage = feedback && grade
    ? renderMentorFeedback(mentorStyle, grade, {
        evLoss: Number((feedback.evLoss ?? 0).toFixed(2)),
        correctAction: feedback.correctAction,
      }, t)
    : '';
  const gradeMessage = mentorMessage || (feedback && grade
    ? t(`feedback.message.${grade}`, { evLoss: (feedback.evLoss ?? 0).toFixed(2) })
    : '');
  const gradeTitle = gradeConfig ? t(gradeConfig.titleKey) : '';

  const containerClass = gradeConfig && feedback
    ? cn('p-4 rounded-md border space-y-4', gradeConfig.color, gradeConfig.textColor)
    : cn('p-4 rounded-md border space-y-4', legacyStatusColor);

  return (
    <div className={containerClass}>
      {gradeConfig && feedback ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl">{gradeConfig.icon}</span>
            <div>
              <div className="font-display font-semibold">{gradeTitle}</div>
              {handNotation && <div className="text-xs opacity-80 font-numeric">{handNotation}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-80">{t('feedback.evLossLabel')}</div>
            <div className="text-lg font-bold font-numeric">{Math.max(0, feedback.evLoss).toFixed(2)} BB</div>
          </div>
          {grade !== 'best' && feedback.correctAction && (
            <div className="text-right">
              <div className="text-xs opacity-80">{t('feedback.correctAction')}</div>
              <div className="text-sm font-bold font-numeric">{feedback.correctAction}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl">{legacyStatusIcon}</span>
            <div>
              <div className="font-display font-semibold">{legacyStatusLabel}</div>
              {handNotation && <div className="text-xs opacity-80 font-numeric">{handNotation}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-80">{t('gto.evLoss')}</div>
            <div className="text-lg font-bold font-numeric">{Math.max(0, evLoss).toFixed(2)} BB</div>
          </div>
        </div>
      )}

      {(userEV !== undefined || optimalEV !== undefined) && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-black/20 p-2">
            <div className="text-[10px] text-[var(--ivory-muted)] mb-0.5">{t('gto.feedback.yourEV')}</div>
            <div className={cn('font-numeric font-bold text-sm', (userEV ?? 0) >= 0 ? 'text-[var(--sage)]' : 'text-[var(--clay)]')}>
              {(userEV ?? 0) >= 0 ? '+' : ''}{(userEV ?? 0).toFixed(2)} BB
            </div>
          </div>
          <div className="rounded-lg bg-black/20 p-2">
            <div className="text-[10px] text-[var(--ivory-muted)] mb-0.5">{t('gto.feedback.optimalEV')}</div>
            <div className="font-numeric font-bold text-sm text-[var(--brass-bright)]">
              {(optimalEV ?? 0) >= 0 ? '+' : ''}{(optimalEV ?? 0).toFixed(2)} BB
            </div>
          </div>
          <div className="rounded-lg bg-black/20 p-2">
            <div className="text-[10px] text-[var(--ivory-muted)] mb-0.5">{t('gto.feedback.heroEquity')}</div>
            <div className="font-numeric font-bold text-sm text-[var(--ivory)]">{Math.round((heroEquity ?? 0) * 100)}%</div>
          </div>
        </div>
      )}

      {!isOptimal && evLoss < 0.3 && !feedback && (
        <div className="text-xs text-[var(--sage)] font-display">{t('gto.feedback.nearOptimal')}</div>
      )}

      {exploitMode && opponent && (
        <div className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
          <span className="text-lg">{opponent.icon}</span>
          <div className="flex-1">
            <span className="text-xs font-display font-semibold" style={{ color: opponent.color }}>
              {t('gto.feedback.opponentPrefix')}{' '}
              {t(`gto.setup.opponentProfile.${opponent.id}.name`, { defaultValue: opponent.name })}
            </span>
            <div className="flex gap-2 text-[10px] font-numeric text-[var(--ivory-muted)]">
              <span>VPIP {opponent.stats.vpip}%</span>
              <span>PFR {opponent.stats.pfr}%</span>
              <span>3B {opponent.stats.threeBetPercent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 频率条形图 — Raise=brass, Call=sage, Fold=clay（术语源自 actionTerms，英文单源） */}
      {gtoStrategy && (
        <div className="space-y-2">
          <div className="text-xs font-medium opacity-80">{t('gto.feedback.frequencyDistribution')}</div>
          <div className="flex h-6 rounded overflow-hidden">
            {gtoStrategy.raise > 0 && (
              <div className="bg-[var(--brass)] flex items-center justify-center text-[10px] font-bold text-[var(--primary-foreground)] transition-all font-numeric" style={{ width: `${gtoStrategy.raise * 100}%` }}>
                {gtoStrategy.raise >= 0.15 && `${Math.round(gtoStrategy.raise * 100)}%`}
              </div>
            )}
            {gtoStrategy.call > 0 && (
              <div className="bg-[var(--sage)] flex items-center justify-center text-[10px] font-bold text-[var(--ivory)] transition-all font-numeric" style={{ width: `${gtoStrategy.call * 100}%` }}>
                {gtoStrategy.call >= 0.15 && `${Math.round(gtoStrategy.call * 100)}%`}
              </div>
            )}
            {gtoStrategy.fold > 0 && (
              <div className="bg-[var(--clay)]/70 flex items-center justify-center text-[10px] font-bold text-[var(--ivory)] transition-all font-numeric" style={{ width: `${gtoStrategy.fold * 100}%` }}>
                {gtoStrategy.fold >= 0.15 && `${Math.round(gtoStrategy.fold * 100)}%`}
              </div>
            )}
          </div>
          <div className="flex justify-between text-[10px] font-numeric">
            <span className="text-[var(--brass-bright)]">{raiseTerm} {Math.round(gtoStrategy.raise * 100)}%</span>
            <span className="text-[var(--sage)]">{callTerm} {Math.round(gtoStrategy.call * 100)}%</span>
            <span className="text-[var(--clay)]">{foldTerm} {Math.round(gtoStrategy.fold * 100)}%</span>
          </div>
          {gtoStrategy.raiseAmount && gtoStrategy.raise > 0 && (
            <div className="text-xs text-[var(--ivory-muted)] font-numeric">
              {t('gto.feedback.suggestedRaise', { amount: gtoStrategy.raiseAmount })}
            </div>
          )}
        </div>
      )}

      {exploitMode && exploitStrategy && gtoStrategy && (
        <div className="space-y-2">
          <div className="text-xs font-medium opacity-80">{t('gto.feedback.exploitSuggestion', { name: opponent?.shortName ?? t('gto.feedback.opponentPrefix') })}</div>
          <div className="flex h-6 rounded overflow-hidden">
            {exploitStrategy.raise > 0 && (
              <div className="bg-[var(--brass)] flex items-center justify-center text-[10px] font-bold text-[var(--primary-foreground)] transition-all font-numeric" style={{ width: `${exploitStrategy.raise * 100}%` }}>
                {exploitStrategy.raise >= 0.15 && `${Math.round(exploitStrategy.raise * 100)}%`}
              </div>
            )}
            {exploitStrategy.call > 0 && (
              <div className="bg-[var(--sage)] flex items-center justify-center text-[10px] font-bold text-[var(--ivory)] transition-all font-numeric" style={{ width: `${exploitStrategy.call * 100}%` }}>
                {exploitStrategy.call >= 0.15 && `${Math.round(exploitStrategy.call * 100)}%`}
              </div>
            )}
            {exploitStrategy.fold > 0 && (
              <div className="bg-[var(--clay)]/70 flex items-center justify-center text-[10px] font-bold text-[var(--ivory)] transition-all font-numeric" style={{ width: `${exploitStrategy.fold * 100}%` }}>
                {exploitStrategy.fold >= 0.15 && `${Math.round(exploitStrategy.fold * 100)}%`}
              </div>
            )}
          </div>
          <div className="flex justify-between text-[10px] font-numeric">
            <span className="text-[var(--brass-bright)]">{raiseTerm} {Math.round(exploitStrategy.raise * 100)}%</span>
            <span className="text-[var(--sage)]">{callTerm} {Math.round(exploitStrategy.call * 100)}%</span>
            <span className="text-[var(--clay)]">{foldTerm} {Math.round(exploitStrategy.fold * 100)}%</span>
          </div>
          <div className="text-[10px] text-[var(--ivory-muted)]">
            {t('gto.feedback.gtoRatio', { r: Math.round(gtoStrategy.raise * 100), c: Math.round(gtoStrategy.call * 100), f: Math.round(gtoStrategy.fold * 100) })}
            {' → '}
            {t('gto.feedback.exploitRatio', { r: Math.round(exploitStrategy.raise * 100), c: Math.round(exploitStrategy.call * 100), f: Math.round(exploitStrategy.fold * 100) })}
          </div>
        </div>
      )}

      {gradeConfig && feedback ? (
        <>
          <div className="text-sm opacity-95">{gradeMessage}</div>
          <DecisionAnalysis
            userAction={userAction ? `${userAction.action}${userAction.amount ? ` ${userAction.amount}BB` : ''}` : undefined}
            gtoAction={feedback.correctAction || undefined}
            difference={(grade === 'wrong' || grade === 'blunder') ? feedback.explanation : undefined}
            relatedLessonId={feedback.relatedLessonId}
            defaultOpen={grade === 'wrong' || grade === 'blunder'}
          />
          {(grade === 'wrong' || grade === 'blunder') && onTryAgain && (
            <TryAgainButton onTryAgain={onTryAgain} />
          )}
        </>
      ) : (
        <div className="text-sm opacity-90">{explanation}</div>
      )}
    </div>
  );
}
