/**
 * 导师风格反馈文案模板（P2-4）
 *
 * 模板占位符（简单字符串替换，不引入模板引擎）：
 *  - {evLoss}        EV 损失（BB）
 *  - {correctAction} 最优动作描述
 *
 * 颜色与图标仍由 GRADE_DISPLAY_CONFIG 控制；此处仅负责文案。
 */
import type { MentorStyle, MentorFeedbackTemplate } from '../types/mentor';
import type { DecisionGrade } from '../types/decisionFeedback';

export const MENTOR_FEEDBACK_TEMPLATES: Record<MentorStyle, MentorFeedbackTemplate> = {
  'strict-math': {
    best: '最优决策。EV 损失 0 BB，符合 GTO 频率。',
    correct: '合理决策。EV 损失 {evLoss} BB，在可接受范围内。',
    inaccuracy: '不够精确。EV 损失 {evLoss} BB，最优动作是 {correctAction}。',
    wrong: '错误决策。EV 损失 {evLoss} BB，应选择 {correctAction}。建议复习相关课程。',
    blunder: '严重错误。EV 损失 {evLoss} BB，这一决策长期会显著亏损。最优动作是 {correctAction}。',
  },
  'old-school': {
    best: '漂亮！这就是教科书式的打法。',
    correct: '不错，小子。这个决策能赚钱。',
    inaccuracy: '差强人意。我打了 20 年牌，告诉你这时候应该 {correctAction}。',
    wrong: '哎，这手打得不怎么样。损失了 {evLoss} BB，应该 {correctAction}。回去多练练。',
    blunder: '小伙子，这是大错！{evLoss} BB 的损失，实战中会被鲨鱼吃掉。记住，这种情况要 {correctAction}。',
  },
  'encouraging': {
    best: '太棒了！你已经比 80% 的玩家厉害了！🌟',
    correct: '很好！这个决策是合理的，继续保持！',
    inaccuracy: '差一点就对了！最优动作是 {correctAction}，下次试试看。',
    wrong: '没关系，每个高手都从这里开始。EV 损失 {evLoss} BB，最优是 {correctAction}。一起加油！',
    blunder: '别灰心！这次损失了 {evLoss} BB，但这是个宝贵的学习机会。记住 {correctAction}，下次一定行！',
  },
};

/**
 * 根据教练风格与 grade 渲染反馈文案
 * @param mentorStyle 教练风格（P0B-06：非法/未知值防御性回退到 'encouraging'，
 *                    避免持久化脏数据/调用方传入异常值时读取 undefined 模板抛错）
 * @param grade 反馈等级
 * @param params 替换参数 { evLoss, correctAction }
 */
export function renderMentorFeedback(
  mentorStyle: MentorStyle,
  grade: DecisionGrade,
  params: { evLoss?: number; correctAction?: string }
): string {
  const styleTemplates =
    MENTOR_FEEDBACK_TEMPLATES[mentorStyle] ?? MENTOR_FEEDBACK_TEMPLATES['encouraging'];
  const template = styleTemplates[grade];
  return template
    .replace(/\{evLoss\}/g, String(params.evLoss ?? ''))
    .replace(/\{correctAction\}/g, params.correctAction ?? '');
}
