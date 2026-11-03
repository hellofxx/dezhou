/**
 * FeedbackGrade 契约（五级决策反馈展示）：
 * - .grade-<grade> 类 + role="status" 供样式与读屏共用同一等级语义
 * - 标签走 i18n feedback.grade.*（zh 真实文案）
 * - EV 损失只在提供 evLoss 时呈现，且以"损失"方向展示负号
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import FeedbackGrade from './FeedbackGrade';
import type { DecisionGrade } from '@/shared/types/decisionFeedback';

const GRADES: DecisionGrade[] = ['best', 'correct', 'inaccuracy', 'wrong', 'blunder'];

const ZH_LABELS: Record<DecisionGrade, string> = {
  best: '最优决策！',
  correct: '正确决策',
  inaccuracy: '不够精确',
  wrong: '决策错误',
  blunder: '严重错误',
};

describe('FeedbackGrade', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (node: ReactElement) => {
    act(() => {
      root.render(node);
    });
  };

  it('五个等级各自渲染 .grade-* 类、状态语义与本地化标签', () => {
    for (const grade of GRADES) {
      render(<FeedbackGrade grade={grade} />);

      const root_ = container.querySelector(`.feedback-grade.grade-${grade}`);
      expect(root_, `缺少 .grade-${grade}`).not.toBeNull();
      expect(root_?.getAttribute('role')).toBe('status');
      expect(root_?.querySelector('.grade-label')?.textContent).toBe(ZH_LABELS[grade]);
    }
  });

  it('未提供 evLoss 时不呈现 EV 数值（不伪造 EV 标定）', () => {
    render(<FeedbackGrade grade="correct" />);
    expect(container.querySelector('.grade-ev')).toBeNull();
  });

  it('提供 evLoss 时以 BB 为单位、1 位小数呈现，正数带损失负号', () => {
    render(<FeedbackGrade grade="wrong" evLoss={1.5} />);
    expect(container.querySelector('.grade-ev')?.textContent).toBe('EV -1.5 BB');

    render(<FeedbackGrade grade="best" evLoss={0} />);
    expect(container.querySelector('.grade-ev')?.textContent).toBe('EV 0.0 BB');
  });

  it('description 呈现为补充说明', () => {
    render(<FeedbackGrade grade="inaccuracy" description="可以考虑更小尺度下注" />);
    expect(container.querySelector('.grade-desc')?.textContent).toBe('可以考虑更小尺度下注');
  });

  it('className 透传以便调用方追加布局样式', () => {
    render(<FeedbackGrade grade="best" className="mt-2" />);
    expect(container.querySelector('.feedback-grade')?.classList.contains('mt-2')).toBe(true);
  });
});
