import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/shared/components/layout/BackLink';
import { Award, CheckCircle2, XCircle, Lock } from 'lucide-react';
import type { CertificationState } from '../types';
import { formatRemainingTime } from '../utils/certificationStatus';

interface CertificationIntroViewProps {
  level: number;
  levelTitles: string;
  /** 本次实考题量（min(题池, 20)） */
  questionCount: number;
  /** 本级别全部已应用题目数 */
  poolSize: number;
  requiredAccuracy: number;
  attempts?: number;
  bestScore?: number;
  state: CertificationState;
  now: number;
  onStart: () => void;
  onBack: () => void;
}

/**
 * 认证开始页：题量/题池/通过标准 + 有效期内剩余天数 + 冷却倒计时 + 过期续期。
 * 冷却中禁用开始按钮（store 侧同样会拒绝，UI 只做可见性），过期可立即续期。
 */
export function CertificationIntroView({
  level,
  levelTitles,
  questionCount,
  poolSize,
  requiredAccuracy,
  attempts,
  bestScore,
  state,
  now,
  onStart,
  onBack,
}: CertificationIntroViewProps) {
  const { t } = useTranslation();
  const canStart = (state.status === 'available' || state.status === 'expired') && questionCount > 0;
  const validDate = new Date(state.validUntil ?? now).toLocaleDateString();
  const startLabel =
    state.status === 'expired'
      ? t('academy.levelCertification.renew', { defaultValue: '续期' })
      : t('academy.levelCertification.start');

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-6">
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-5 md:p-6"
        >
          <BackLink
            onClick={onBack}
            label={t('academy.conceptGraph.backToAcademy')}
            className="mb-4"
          />

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-lg bg-[var(--brass-bright)]/10 flex items-center justify-center">
              <Award className="w-7 h-7 text-[var(--brass-bright)]" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-[var(--ivory)]">
                {t('academy.levelCertification.title', { level })}
              </h2>
              <p className="text-sm text-[var(--ivory-dim)] mt-0.5">{levelTitles}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-xs text-[var(--ivory-dim)]">
              <span className="w-2 h-2 rounded-full bg-[var(--brass-bright)]" />
              {t('academy.levelCertification.questionCount', { count: questionCount })}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--ivory-dim)]">
              <span className="w-2 h-2 rounded-full bg-[var(--brass-bright)]" />
              {t('academy.levelCertification.poolSize', {
                pool: poolSize,
                defaultValue: '本级别题池：{{pool}} 题',
              })}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--ivory-dim)]">
              <span className="w-2 h-2 rounded-full bg-[var(--brass-bright)]" />
              {t('academy.levelCertification.passStandard', { required: requiredAccuracy })}
            </div>
            {attempts !== undefined && (
              <div className="flex items-center gap-2 text-xs text-[var(--ivory-dim)]">
                <span className="w-2 h-2 rounded-full bg-[var(--info)]" />
                {t('academy.levelCertification.attemptHistory', { attempts, best: bestScore ?? 0 })}
              </div>
            )}
            {(state.status === 'valid' || state.status === 'expiring') && (
              <div className="flex items-center gap-2 text-xs text-[var(--poker-success)]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('academy.levelCertification.validUntil', {
                  date: validDate,
                  days: state.daysLeft ?? 0,
                  defaultValue: '认证有效期至 {{date}}（剩余 {{days}} 天）',
                })}
              </div>
            )}
            {state.status === 'expired' && (
              <div className="flex items-center gap-2 text-xs text-[var(--warning)]">
                <XCircle className="w-3.5 h-3.5" />
                {t('academy.levelCertification.expired', {
                  date: validDate,
                  defaultValue: '认证已过期（原有效期至 {{date}}），可立即续期',
                })}
              </div>
            )}
            {state.status === 'cooldown' && (
              <div className="flex items-center gap-2 text-xs text-[var(--warning)]">
                <Lock className="w-3.5 h-3.5" />
                {t('academy.levelCertification.cooldown', {
                  time: formatRemainingTime((state.nextAttemptAt ?? now) - now),
                  defaultValue: '冷却中：需等待 {{time}} 后才能再次参加（失败后 24 小时冷却）',
                })}
              </div>
            )}
          </div>

          {/* 有效期内不可重考（store 同样拒绝）：只展示有效期，不渲染重考入口 */}
          {state.status !== 'valid' && state.status !== 'expiring' && (
            <button
              onClick={onStart}
              disabled={!canStart}
              className="w-full py-3 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {startLabel}
            </button>
          )}
        </motion.section>
      </div>
    </div>
  );
}
