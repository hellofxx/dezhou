import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, RotateCcw, Trophy } from 'lucide-react';
import type { CertificationAttemptResult } from '../types';
import { formatRemainingTime } from '../utils/certificationStatus';

interface CertificationResultViewProps {
  level: number;
  score: number;
  correctCount: number;
  total: number;
  requiredAccuracy: number;
  /** store 提交返回值：accepted=false 时展示拒绝原因 */
  result: CertificationAttemptResult;
  /** 本 Level 理论锚点（T3 未填充时为空 → 隐藏回链区） */
  anchors: string[];
  /** 冷却中为 false（失败后 24h 冷却，按钮隐藏） */
  canRetry: boolean;
  now: number;
  onRetry: () => void;
  onBack: () => void;
  onOpenAnchor: (anchor: string) => void;
}

/** 认证结算页：成绩 + 受理/拒绝原因 + 理论锚点回链 */
export function CertificationResultView({
  level,
  score,
  correctCount,
  total,
  requiredAccuracy,
  result,
  anchors,
  canRetry,
  now,
  onRetry,
  onBack,
  onOpenAnchor,
}: CertificationResultViewProps) {
  const { t } = useTranslation();
  const passed = result.accepted && score >= requiredAccuracy;

  return (
    <div className="py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-8 text-center"
      >
        {passed ? (
          <Trophy size={52} className="mx-auto mb-4 text-[var(--brass-bright)]" aria-hidden="true" />
        ) : (
          <BookOpen size={52} className="mx-auto mb-4 text-[var(--ivory-muted)]" aria-hidden="true" />
        )}
        <h2 className="font-display text-2xl text-[var(--ivory)] mb-2">
          {passed
            ? t('academy.levelCertification.passedTitle', { level })
            : t('academy.levelCertification.keepGoing')}
        </h2>
        <p className="text-[var(--ivory-dim)] mb-1">
          {t('academy.quiz.answeredCount', { correct: correctCount, total })}
        </p>
        <p className="font-numeric text-4xl text-[var(--brass-bright)] mb-2">
          {t('academy.quiz.score', { score })}
        </p>
        <p className="text-xs text-[var(--ivory-muted)] mb-4">
          {passed
            ? t('academy.levelCertification.passedHint')
            : t('academy.levelCertification.needAccuracy', { required: requiredAccuracy })}
        </p>

        {!result.accepted && (
          <p className="mx-auto mb-4 max-w-md rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/30 p-3 text-xs text-[var(--warning)]">
            {result.reason === 'cooldown'
              ? t('academy.levelCertification.rejectCooldown', {
                  time: formatRemainingTime((result.nextAttemptAt ?? now) - now),
                  defaultValue: '本次成绩未记录：冷却中，{{time}} 后可再次参加',
                })
              : result.reason === 'already-certified'
                ? t('academy.levelCertification.rejectAlreadyCertified', {
                    defaultValue: '本次成绩未记录：当前认证仍在有效期内',
                  })
                : result.reason === 'not-completed'
                  ? t('academy.levelCertification.rejectNotCompleted', {
                      defaultValue: '本次成绩未记录：本级别课程尚未全部完成',
                    })
                  : result.reason === 'wrong-variant'
                    ? t('academy.levelCertification.rejectWrongVariant', {
                        defaultValue: '本次成绩未记录：认证仅在标准变体提供',
                      })
                    : t('academy.levelCertification.rejectInvalid', {
                        defaultValue: '本次成绩未记录：提交数据无效',
                      })}
          </p>
        )}

        {anchors.length > 0 && (
          <div className="mx-auto mb-6 max-w-md text-left">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--brass-text)] mb-2">
              {t('academy.levelCertification.theoryAnchors', {
                defaultValue: '回到理论学院补强推导',
              })}
            </p>
            <ul className="space-y-1.5">
              {anchors.map((anchor) => (
                <li key={anchor}>
                  <button
                    type="button"
                    onClick={() => onOpenAnchor(anchor)}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--brass-bright)] hover:underline"
                  >
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    {t('academy.levelCertification.theoryAnchorLink', {
                      id: anchor,
                      defaultValue: '理论章节 {{id}}',
                    })}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] text-sm hover:bg-[var(--walnut-raised)]/80"
          >
            {t('academy.levelCertification.backToAcademy')}
          </button>
          {canRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm hover:opacity-90"
            >
              <RotateCcw className="w-4 h-4" />
              {t('academy.levelCertification.retry')}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
