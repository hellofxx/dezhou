/**
 * 导师风格反馈文案模板（P2-4）
 *
 * 模板使用 i18n key 引用，实际文案在 zh.json / en.json 的 mentor.feedback.* 下。
 * 占位符（简单字符串替换，不引入模板引擎）：
 *  - {evLoss}        EV 损失（BB）
 *  - {correctAction} 最优动作描述
 *
 * 颜色与图标仍由 GRADE_DISPLAY_CONFIG 控制；此处仅负责文案。
 */
import type { MentorStyle, MentorFeedbackTemplate } from '../types/mentor';
import type { DecisionGrade } from '../types/decisionFeedback';

export const MENTOR_FEEDBACK_TEMPLATES: Record<MentorStyle, MentorFeedbackTemplate> = {
  'strict-math': {
    best: 'mentor.feedback.strict-math.best',
    correct: 'mentor.feedback.strict-math.correct',
    inaccuracy: 'mentor.feedback.strict-math.inaccuracy',
    wrong: 'mentor.feedback.strict-math.wrong',
    blunder: 'mentor.feedback.strict-math.blunder',
  },
  'old-school': {
    best: 'mentor.feedback.old-school.best',
    correct: 'mentor.feedback.old-school.correct',
    inaccuracy: 'mentor.feedback.old-school.inaccuracy',
    wrong: 'mentor.feedback.old-school.wrong',
    blunder: 'mentor.feedback.old-school.blunder',
  },
  'encouraging': {
    best: 'mentor.feedback.encouraging.best',
    correct: 'mentor.feedback.encouraging.correct',
    inaccuracy: 'mentor.feedback.encouraging.inaccuracy',
    wrong: 'mentor.feedback.encouraging.wrong',
    blunder: 'mentor.feedback.encouraging.blunder',
  },
};

/**
 * 根据教练风格与 grade 渲染反馈文案
 * @param mentorStyle 教练风格（P0B-06：非法/未知值防御性回退到 'encouraging'，
 *                    避免持久化脏数据/调用方传入异常值时读取 undefined 模板抛错）
 * @param grade 反馈等级（非法/未知值防御性回退到 'wrong' 档模板，
 *              避免脏数据触发 t(undefined).replace TypeError）
 * @param params 替换参数 { evLoss, correctAction }
 * @param t i18n 翻译函数，用于解析 i18n key 为实际文案
 */
export function renderMentorFeedback(
  mentorStyle: MentorStyle,
  grade: DecisionGrade,
  params: { evLoss?: number; correctAction?: string },
  t: (key: string) => string,
): string {
  const styleTemplates =
    MENTOR_FEEDBACK_TEMPLATES[mentorStyle] ?? MENTOR_FEEDBACK_TEMPLATES['encouraging'];
  // 防御：非法 grade（脏持久化数据/调用方异常值）回退 'wrong' 档模板，
  // 避免 styleTemplates[grade] 为 undefined 时 t(undefined).replace 抛 TypeError
  const templateKey = styleTemplates[grade] ?? styleTemplates['wrong'];
  let template = t(templateKey);
  template = template.replace(/\{evLoss\}/g, String(params.evLoss ?? ''));
  template = template.replace(/\{correctAction\}/g, params.correctAction ?? '');
  return template;
}