/**
 * 导师角色人格化（P2-4）
 *
 * 在五级反馈（best/correct/inaccuracy/wrong/blunder）基础上，根据用户选择的教练风格
 * 渲染不同的反馈文案。颜色与图标仍由 GRADE_DISPLAY_CONFIG 统一控制，仅文案随风格变化。
 *
 * 三种风格：
 *  - strict-math：严谨数学派，GTO 导向，注重 EV 计算
 *  - old-school：老派牌手，经验导向，强调实战读牌
 *  - encouraging：鼓励型教练，正向激励，注重心理建设
 */

export type MentorStyle = 'strict-math' | 'old-school' | 'encouraging';

export interface MentorProfile {
  id: MentorStyle;
  name: string;              // 教练名称
  icon: string;              // emoji
  description: string;       // 风格描述
  voiceTone: string;         // 语气特点
}

export interface MentorFeedbackTemplate {
  best: string;              // 最优决策文案模板（含 {evLoss} {correctAction} 等占位符）
  correct: string;
  inaccuracy: string;
  wrong: string;
  blunder: string;
}

export const MENTOR_PROFILES: MentorProfile[] = [
  {
    id: 'strict-math',
    name: '严谨数学派',
    icon: '🧮',
    description: 'GTO 导向，注重 EV 计算',
    voiceTone: '冷静、客观、数据驱动',
  },
  {
    id: 'old-school',
    name: '老派牌手',
    icon: '🎩',
    description: '经验导向，强调实战读牌',
    voiceTone: '直接、犀利、有时粗鲁',
  },
  {
    id: 'encouraging',
    name: '鼓励型教练',
    icon: '🌟',
    description: '正向激励，注重心理建设',
    voiceTone: '温暖、鼓励、建设性',
  },
];

export const DEFAULT_MENTOR: MentorStyle = 'strict-math';
