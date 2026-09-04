import type { PracticeOption } from '../types';
import {
  calculateGrade,
  GRADE_DISPLAY_CONFIG,
  type DecisionGrade,
} from '@/shared/types/decisionFeedback';

/**
 * 五级反馈「三态诚实渲染」（呈现层，判分链路不受影响）。
 *
 * 背景：`PracticeOption.evLoss?: number` 在标准课时中的覆盖率为 0（覆盖率棘轮见
 * utils/evCalibration.test.ts）。旧实现 `calculateGrade(evLoss ?? (isCorrect ? 0 : 3))`
 * 会用兜底值把「答错」一律渲染成 wrong 档徽章 + 伪 EV 数值，属于伪造精度
 * （产品决策见 docs/PRD.md §5.3.6 严禁伪造策略数据展示给用户）。
 *
 * 三态：
 *  1. 数据侧提供有限数值 evLoss → 正常五级等级 + EV 损失（calibrated）
 *  2. 无 evLoss 且答对 → 仅「正确」（correct）
 *  3. 无 evLoss 且答错 → 仅「错误」+ 正确答案提示（incorrect）
 *
 * 硬性约束：不改 shared 层 GRADE_THRESHOLDS / calculateGrade / buildDecisionFeedback；
 * 对错、连击、SRS、ELO 的判分输入保持原样。
 */

export type PracticeFeedbackMode = 'calibrated' | 'correct' | 'incorrect';

export interface PracticeFeedbackView {
  mode: PracticeFeedbackMode;
  /** 仅 calibrated 非空：由真实 evLoss 经 calculateGrade 得出 */
  grade: DecisionGrade | null;
  /** 仅 calibrated 非空：等级 emoji 图标 */
  gradeIcon: string | null;
  /** 仅 calibrated 非空：等级标题 i18n key（feedback.grade.*） */
  gradeTitleKey: string | null;
  /** 仅 calibrated 非空：数据侧真实 EV 损失（BB） */
  evLoss: number | null;
  /** 反馈容器样式类：calibrated 沿用 .grade-* 语义色，未标定回退对/错二态 token 色 */
  containerClass: string;
}

const UNCALIBRATED_CORRECT_CLASS =
  'border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]';
const UNCALIBRATED_INCORRECT_CLASS =
  'border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]';

/**
 * 读取数据侧真实标定的数值型 evLoss。
 * undefined / NaN / Infinity 一律视为「未标定」，禁止用 isCorrect 兜底推断等级。
 */
export function readCalibratedEvLoss(option: PracticeOption | undefined | null): number | null {
  const evLoss = option?.evLoss;
  if (typeof evLoss !== 'number' || !Number.isFinite(evLoss)) return null;
  return evLoss;
}

/**
 * 解析选中项的反馈呈现视图。
 * @param option 用户选中的 PracticeOption（超时/未作答时由调用方传 null 并走各自的专用渲染）
 */
export function resolvePracticeFeedbackView(
  option: PracticeOption | undefined | null,
): PracticeFeedbackView | null {
  if (!option) return null;

  const evLoss = readCalibratedEvLoss(option);
  if (evLoss !== null) {
    const grade = calculateGrade(evLoss);
    const config = GRADE_DISPLAY_CONFIG[grade];
    return {
      mode: 'calibrated',
      grade,
      gradeIcon: config.icon,
      gradeTitleKey: config.titleKey,
      evLoss,
      containerClass: `${config.color} ${config.textColor}`,
    };
  }

  return option.isCorrect
    ? {
        mode: 'correct',
        grade: null,
        gradeIcon: null,
        gradeTitleKey: null,
        evLoss: null,
        containerClass: UNCALIBRATED_CORRECT_CLASS,
      }
    : {
        mode: 'incorrect',
        grade: null,
        gradeIcon: null,
        gradeTitleKey: null,
        evLoss: null,
        containerClass: UNCALIBRATED_INCORRECT_CLASS,
      };
}
