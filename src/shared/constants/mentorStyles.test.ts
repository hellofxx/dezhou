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

describe('renderMentorFeedback 防御回退（P0B-06）', () => {
  it('非法 mentorStyle 不 throw，且返回 encouraging 模板渲染结果', () => {
    const params = { evLoss: 2.5, correctAction: 'Fold' };
    for (const grade of GRADES) {
      const invalidStyle = 'not-a-style' as MentorStyle;
      expect(() => renderMentorFeedback(invalidStyle, grade, params)).not.toThrow();
      expect(renderMentorFeedback(invalidStyle, grade, params)).toBe(
        renderMentorFeedback('encouraging', grade, params),
      );
    }
  });

  it('undefined mentorStyle（脏持久化数据形态）同样回退 encouraging', () => {
    const style = undefined as unknown as MentorStyle;
    const result = renderMentorFeedback(style, 'wrong', { evLoss: 3, correctAction: 'Call' });
    expect(typeof result).toBe('string');
    expect(result).toBe(renderMentorFeedback('encouraging', 'wrong', { evLoss: 3, correctAction: 'Call' }));
  });

  it('合法风格不受回退影响（三风格 × 五评级模板齐全且占位符被替换）', () => {
    const styles = Object.keys(MENTOR_FEEDBACK_TEMPLATES) as MentorStyle[];
    expect(styles).toHaveLength(3);
    for (const style of styles) {
      for (const grade of GRADES) {
        const text = renderMentorFeedback(style, grade, { evLoss: 1.2, correctAction: 'Raise' });
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toContain('{evLoss}');
        expect(text).not.toContain('{correctAction}');
      }
    }
  });
});
