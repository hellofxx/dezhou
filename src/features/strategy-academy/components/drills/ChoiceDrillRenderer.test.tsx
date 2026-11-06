import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ChoiceDrillRenderer from './ChoiceDrillRenderer';
import type { DrillQuestion, Lesson } from '../../types';

/**
 * ChoiceDrill 通用渲染器契约：
 * - 选项经 orderDrillOptions 重排（数值升序），选项对象自带 isCorrect 随对象移动
 * - 答对 / 答错反馈 + 正确项提示；逐题推进到结果页
 * - 进度头 / 结果页走 feature-local 模板（DrillProgressHeader / DrillResultView）
 * - 结果页「完成」回调 onComplete({correct,total,timeTaken})；无题数据走空态
 */

function makeLesson(questions: DrillQuestion[]): Lesson {
  return {
    id: 'choice-drill-lesson',
    level: 2,
    order: 1,
    title: '决策训练',
    subtitle: '选择最优动作',
    duration: '5 min',
    content: [],
    quiz: [],
    type: 'drill',
    drillComponent: 'ChoiceDrill',
    drillData: { questions },
  };
}

/** 结果页统计卡数值（DrillResultView 的 data-testid + font-numeric 数值节点） */
function statValue(testId: string): string {
  const card = screen.getByTestId(testId);
  return card.querySelector('.font-numeric')?.textContent ?? '';
}

const questions = [
  {
    id: 'cd-q1',
    scenario: '翻前 BTN 面对 CO open',
    hand: 'AKs',
    position: 'BTN',
    question: '最佳动作？',
    // 数值升序后：['20%', '30%']，正确项对象随排序移动
    options: [
      { id: 'a', text: '30%', isCorrect: false },
      { id: 'b', text: '20%', isCorrect: true },
    ],
    explanation: '20% 是本题正确尺度。',
    difficulty: 2,
  },
  {
    id: 'cd-q2',
    scenario: '翻后持续下注',
    question: '选择下注尺度',
    options: [
      { id: 'a', text: '小注', isCorrect: false },
      { id: 'b', text: '中注', isCorrect: true },
      { id: 'c', text: '大注', isCorrect: false },
    ],
    explanation: '中注最平衡。',
    difficulty: 1,
  },
];

afterEach(() => cleanup());

describe('ChoiceDrillRenderer', () => {
  it('无题目数据时展示空态', () => {
    render(
      <ChoiceDrillRenderer
        lesson={makeLesson([])}
        onComplete={() => {}}
        onExit={() => {}}
      />,
    );
    expect(screen.getByText('暂无题目数据')).toBeTruthy();
  });

  it('逐题作答并结算：答对 1 题后完成回调携带正确数与总题数', () => {
    const onComplete = vi.fn();
    render(
      <ChoiceDrillRenderer
        lesson={makeLesson(questions)}
        onComplete={onComplete}
        onExit={() => {}}
      />,
    );

    expect(screen.getByText('决策训练')).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();

    fireEvent.click(screen.getByText('20%'));
    expect(screen.getByText('正确')).toBeTruthy();
    expect(screen.getByText('20% 是本题正确尺度。')).toBeTruthy();

    fireEvent.click(screen.getByText('下一题'));
    expect(screen.getByText('2 / 2')).toBeTruthy();
    // 进度头当前正确率：模板插值后为「正确率 100%」（无裸占位符）
    expect(screen.getByText('正确率 100%')).toBeTruthy();
    expect(screen.queryByText(/\{\{/)).toBeNull();

    fireEvent.click(screen.getByText('小注'));
    expect(screen.getByText('错误')).toBeTruthy();
    expect(screen.getByText(/正确答案：中注/)).toBeTruthy();

    // 最后一题按钮为「查看成绩」（academy.drill.viewScore）
    fireEvent.click(screen.getByText('查看成绩'));
    // 结果页标题为 h3（结果内嵌视图，不出 h1）
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('训练完成！');
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(statValue('drill-result-accuracy')).toBe('50%');
    expect(statValue('drill-result-correct')).toBe('1/2');

    fireEvent.click(screen.getByText('完成'));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0]![0];
    expect(result).toMatchObject({ correct: 1, total: 2 });
    expect(result.timeTaken).toBeGreaterThanOrEqual(0);
  });

  it('退出按钮回调 onExit', () => {
    const onExit = vi.fn();
    render(
      <ChoiceDrillRenderer lesson={makeLesson(questions)} onComplete={() => {}} onExit={onExit} />,
    );
    fireEvent.click(screen.getByText('退出'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
