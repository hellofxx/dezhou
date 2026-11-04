import type { PokerVariant } from '@/shared/types/elo';
import { DAY_MS } from '@/shared/utils/toLocalDateKey';
import type {
  CertificationAttemptPayload,
  CertificationAttemptResult,
  CertificationState,
  LevelCertification,
} from '../types';
/** 认证通过基准正确率（%）：store 判定与 LevelCertification 展示的单一事实源。 */
export const REQUIRED_ACCURACY = 70;
/** 认证有效期：30 天。 */
export const CERT_VALIDITY_MS = 30 * DAY_MS;
/** 认证失败冷却：24h。 */
export const CERT_COOLDOWN_MS = DAY_MS;
/** 临期提示窗口：7 天。 */
export const CERT_EXPIRING_MS = 7 * DAY_MS;

/** 证书有效态：认证时间存在且未过有效期。 */
export function isCertificationValid(
  cert: LevelCertification | undefined,
  now = Date.now(),
): boolean {
  if (!cert?.certifiedAt) return false;
  return cert.validUntil === undefined || cert.validUntil > now;
}

/** 全部 Level 均持有有效证书。 */
export function areAllCertificationsValid(
  certifications: Readonly<Record<number, LevelCertification>>,
  levels: readonly number[],
  now = Date.now(),
): boolean {
  return levels.every((level) => isCertificationValid(certifications[level], now));
}

export interface CertificationStateInput {
  activeVariant: PokerVariant;
  isLevelCompleted: boolean;
  cert?: LevelCertification;
  now?: number;
}

/** 认证状态：锁定 / 可考 / 冷却 / 有效 / 临期 / 过期。 */
export function resolveCertificationState({
  activeVariant,
  isLevelCompleted,
  cert,
  now = Date.now(),
}: CertificationStateInput): CertificationState {
  if (activeVariant !== 'standard' || !isLevelCompleted) return { status: 'locked' };

  if (cert?.certifiedAt) {
    if (cert.validUntil === undefined) return { status: 'valid' };
    if (cert.validUntil > now) {
      const remaining = cert.validUntil - now;
      return {
        status: remaining <= CERT_EXPIRING_MS ? 'expiring' : 'valid',
        validUntil: cert.validUntil,
        daysLeft: Math.max(0, Math.ceil(remaining / DAY_MS)),
      };
    }
    return { status: 'expired', validUntil: cert.validUntil, daysLeft: 0 };
  }

  const lastAttemptAt = cert?.lastAttemptAt ?? 0;
  const nextAttemptAt = lastAttemptAt + CERT_COOLDOWN_MS;
  if (lastAttemptAt > 0 && nextAttemptAt > now) {
    return { status: 'cooldown', nextAttemptAt };
  }
  return { status: 'available' };
}

export interface EvaluateCertificationInput extends CertificationStateInput {
  level: number;
  payload: CertificationAttemptPayload;
}

/** 认证提交求值：纯函数，返回结果与下一份证书记录（由 store 落盘）。 */
export function evaluateCertificationAttempt({
  level,
  payload,
  activeVariant,
  isLevelCompleted,
  cert,
  now = Date.now(),
}: EvaluateCertificationInput): {
  result: CertificationAttemptResult;
  nextCert?: LevelCertification;
} {
  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > 8 ||
    !Number.isFinite(payload.score) ||
    payload.score < 0 ||
    payload.score > 100 ||
    !Number.isInteger(payload.totalQuestions) ||
    payload.totalQuestions <= 0
  ) {
    return { result: { accepted: false, reason: 'invalid' } };
  }
  if (activeVariant !== 'standard') {
    return { result: { accepted: false, reason: 'wrong-variant' } };
  }
  if (!isLevelCompleted) {
    return { result: { accepted: false, reason: 'not-completed' } };
  }

  const state = resolveCertificationState({ activeVariant, isLevelCompleted, cert, now });
  if (state.status === 'valid' || state.status === 'expiring') {
    return { result: { accepted: false, reason: 'already-certified' } };
  }
  if (state.status === 'cooldown') {
    return {
      result: { accepted: false, reason: 'cooldown', nextAttemptAt: state.nextAttemptAt },
    };
  }

  const passed = payload.score >= REQUIRED_ACCURACY;
  const nextCert: LevelCertification = {
    level,
    requiredAccuracy: REQUIRED_ACCURACY,
    cooldownPeriod: 24,
    lastAttemptAt: now,
    questionCount: payload.totalQuestions,
    timeLimit: 0,
    attempts: (cert?.attempts ?? 0) + 1,
    bestScore: Math.max(cert?.bestScore ?? 0, payload.score),
    certifiedAt: passed ? now : cert?.certifiedAt,
    validUntil: passed ? now + CERT_VALIDITY_MS : cert?.validUntil,
    variant: 'standard',
    totalQuestions: payload.totalQuestions,
    poolSize: payload.poolSize ?? payload.totalQuestions,
    questionIds: payload.questionIds,
  };
  return { result: { accepted: true }, nextCert };
}
