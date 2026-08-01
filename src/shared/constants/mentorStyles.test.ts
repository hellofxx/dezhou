/**
 * P0B-06：renderMentorFeedback 防御回退纯函数测试。
 *
 * 场景：mentorStyle 来自 progress store 持久化数据，脏数据/旧版本异常值
 * 可能传入非法风格。防御要求：不 throw，回退到 'encouraging' 风格模板渲染。
 */
import { describe, it, expect } from 'vitest';
import { renderMentorFeedback, MENTOR_FEEDBACK_TEMPLATES } from './mentorStyles';
import type { MentorStyle } from '../types/mentor';
import type { DecisionGrade } from '../types/decisionFeedback';

const GRADES: DecisionGrade[] = ['best', 'correct', 'inaccuracy', 'wrong', 'blunder'];

/** 模拟 i18n t 函数：返回 key 对应文案（用于测试占位符替换与回退逻辑） */
function mockT(key: string): string {
  // 从 MENTOR_FEEDBACK_TEMPLATES 中查找对应文案，找不到返回 key 本身
  for (const style of Object.keys(MENTOR_FEEDBACK_TEMPLATES) as MentorStyle[]) {
    const templates = MENTOR_FEEDBACK_TEMPLATES[style];
    for (const grade of GRADES) {
      if (templates[grade] === key) {
        // 模拟翻译返回包含占位符的文案
        if (style === 'strict-math') {
          if (grade === 'best') return '最优决策。EV 损失 0 BB，符合 GTO 频率。';
          if (grade === 'correct') return '合理决策。EV 损失 {evLoss} BB，在可接受范围内。';
          if (grade === 'inaccuracy') return '不够精确。EV 损失 {evLoss} BB，最优动作是 {correctAction}。';
          if (grade === 'wrong') return '错误决策。EV 损失 {evLoss} BB，应选择 {correctAction}。建议复习相关课程。';
          if (grade === 'blunder') return '严重错误。EV 损失 {evLoss} BB，这一决策长期会显著亏损。最优动作是 {correctAction}。';
        }
        if (style === 'old-school') {
          if (grade === 'best') return '漂亮！这就是教科书式的打法。';
          if (grade === 'correct') return '不错，小子。这个决策能赚钱。';
          if (grade === 'inaccuracy') return '差强人意。我打了 20 年牌，告诉你这时候应该 {correctAction}。';
          if (grade === 'wrong') return '哎，这手打得不怎么样。损失了 {evLoss} BB，应该 {correctAction}。回去多练练。';
          if (grade === 'blunder') return '小伙子，这是大错！{evLoss} BB 的损失，实战中会被鲨鱼吃掉。记住，这种情况要 {correctAction}。';
        }
        if (style === 'encouraging') {
          if (grade === 'best') return '太棒了！你已经比 80% 的玩家厉害了！';
          if (grade === 'correct') return '很好！这个决策是合理的，继续保持！';
          if (grade === 'inaccuracy') return '差一点就对了！最优动作是 {correctAction}，下次试试看。';
          if (grade === 'wrong') return '没关系，每个高手都从这里开始。EV 损失 {evLoss} BB，最优是 {correctAction}。一起加油！';
          if (grade === 'blunder') return '别灰心！这次损失了 {evLoss} BB，但这是个宝贵的学习机会。记住 {correctAction}，下次一定行！';
        }
      }
    }
  }
  return key;
}

describe('renderMentorFeedback 防御回退（P0B-06）', () => {
  it('非法 mentorStyle 不 throw，且返回 encouraging 模板渲染结果', () => {
    const params = { evLoss: 2.5, correctAction: 'Fold' };
    for (const grade of GRADES) {
      const invalidStyle = 'not-a-style' as MentorStyle;
      expect(() => renderMentorFeedback(invalidStyle, grade, params, mockT)).not.toThrow();
      expect(renderMentorFeedback(invalidStyle, grade, params, mockT)).toBe(
        renderMentorFeedback('encouraging', grade, params, mockT),
      );
    }
  });

  it('undefined mentorStyle（脏持久化数据形态）同样回退 encouraging', () => {
    const style = undefined as unknown as MentorStyle;
    const result = renderMentorFeedback(style, 'wrong', { evLoss: 3, correctAction: 'Call' }, mockT);
    expect(typeof result).toBe('string');
    expect(result).toBe(renderMentorFeedback('encouraging', 'wrong', { evLoss: 3, correctAction: 'Call' }, mockT));
  });

  it('合法风格不受回退影响（三风格 × 五评级模板齐全且占位符被替换）', () => {
    const styles = Object.keys(MENTOR_FEEDBACK_TEMPLATES) as MentorStyle[];
    expect(styles).toHaveLength(3);
    for (const style of styles) {
      for (const grade of GRADES) {
        const text = renderMentorFeedback(style, grade, { evLoss: 1.2, correctAction: 'Raise' }, mockT);
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toContain('{evLoss}');
        expect(text).not.toContain('{correctAction}');
      }
    }
  });
});