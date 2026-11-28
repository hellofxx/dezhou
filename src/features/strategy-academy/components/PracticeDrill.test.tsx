import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { cleanup, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PracticeDrillComponent } from './PracticeDrill';
import { useProgressStore } from '@/features/progress/store';
import { getLessonMeta } from '../data/lessonMeta';
import type { PracticeDrill, PracticeQuestion } from '../types';

/**
 * 实战练习契约（含 QuickDrill 复用路径）：
 * - 选项经 orderPracticeOptions 重排（动作类 canonical：Fold→Call→Raise→All-in）
 * - 答对/答错反馈、薄弱点收集、正确答案提示
 * - 最后一题 next 结算 onComplete（accuracy / answers 明细）
 * - 键盘 1-4 选项 + 空格/Enter 进入下一题
 */

function makeQuestion(
  id: string,
  actions: Array<{ action: string; isCorrect: boolean; explanation: string }>,
): PracticeQuestion {
  return {
    id,
    scenario: {
      heroHand: ['As', 'Ks'],
      heroPosition: 'BTN',
      previousActions: [{ player: 'CO', action: 'Raise 2.5BB' }],
      street: 'preflop',
      potSize: 5.5,
      effectiveStack: 100,
    },
    options: actions,
  };
}

const drill: PracticeDrill = {
  id: 'fixture-drill',
  questions: [
    makeQuestion('q1', [
      { action: 'Call', isCorrect: true, explanation: '跟注保持范围优势。' },
      { action: 'Fold', isCorrect: false, explanation: '弃牌过于保守。' },
    ]),
    makeQuestion('q2', [
      { action: 'All-in', isCorrect: false, explanation: '过度激进。' },
      { action: 'Raise 2BB', isCorrect: true, explanation: '小尺寸加注更优。' },
    ]),
  ],
};

function renderDrill(onComplete = vi.fn(), children?: ReactNode) {
  render(
    <MemoryRouter>
      <PracticeDrillComponent
        drill={drill}
        lessonId="l1-basics"
        onComplete={onComplete}
        adaptive={false}
      />
      {children}
    </MemoryRouter>,
  );
  return onComplete;
}

afterEach(() => cleanup());

describe('PracticeDrill：答题与结算', () => {
  it('动作类选项按消极→激进排序，全对结算 accuracy=1 并携带逐题明细', () => {
    const onComplete = renderDrill();

    expect(screen.getByText('1 / 2')).toBeTruthy();
    const firstOptions = screen.getAllByRole('button');
    // 含快捷键提示的第 1 题选项（Fold 在前，Call 在后）
    expect(firstOptions[0]!.textContent).toContain('Fold');
    expect(firstOptions[1]!.textContent).toContain('Call');

    fireEvent.click(screen.getByText('Call'));
    expect(screen.getByText('正确')).toBeTruthy();
    expect(screen.getByText('跟注保持范围优势。')).toBeTruthy();
    fireEvent.click(screen.getByText('下一题'));

    expect(screen.getByText('2 / 2')).toBeTruthy();
    fireEvent.click(screen.getByText('Raise 2BB'));
    fireEvent.click(screen.getByText('查看成绩'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0]![0];
    expect(result.lessonId).toBe('l1-basics');
    expect(result.totalQuestions).toBe(2);
    expect(result.correctAnswers).toBe(2);
    expect(result.accuracy).toBe(1);
    expect(result.answers.map((a: { questionId: string; isCorrect: boolean }) => [a.questionId, a.isCorrect])).toEqual([
      ['q1', true],
      ['q2', true],
    ]);

    // 结算面板
    expect(screen.getByText('实战练习完成！')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('2/2')).toBeTruthy();
  });

  it('答错时展示正确答案与解析，并在结果中收集薄弱点', () => {
    const onComplete = renderDrill();

    fireEvent.click(screen.getByText('Fold'));
    expect(screen.getByText('错误')).toBeTruthy();
    expect(screen.getByText(/正确答案：Call/)).toBeTruthy();
    expect(screen.getByText('弃牌过于保守。')).toBeTruthy();
    fireEvent.click(screen.getByText('下一题'));

    fireEvent.click(screen.getByText('Raise 2BB'));
    fireEvent.click(screen.getByText('查看成绩'));

    const result = onComplete.mock.calls[0]![0];
    expect(result.correctAnswers).toBe(1);
    expect(result.accuracy).toBe(0.5);
    expect(result.weakPoints).toHaveLength(1);
    expect(result.weakPoints[0]).toContain('BTN preflop');
    expect(result.weakPoints[0]).toContain('Fold');
    // 结果页展示薄弱点区块
    expect(screen.getByText('薄弱点')).toBeTruthy();
  });

  it('window 键盘 1 选择选项，空格进入下一题', () => {
    const onComplete = renderDrill();

    fireEvent.keyDown(window, { key: '1' }); // Q1 第一项 Fold（错误）
    expect(screen.getByText('错误')).toBeTruthy();

    fireEvent.keyDown(window, { key: ' ' });
    expect(screen.getByText('2 / 2')).toBeTruthy();

    fireEvent.keyDown(window, { key: '1' }); // Q2 第一项 Raise 2BB（正确）
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]![0].correctAnswers).toBe(1);
  });

  it.each([' ', 'Enter'])('body 接收反馈态快捷键 %j 时仍推进', (key) => {
    renderDrill();

    fireEvent.click(screen.getByText('Call'));
    fireEvent.keyDown(document.body, { key });

    expect(screen.getByText('2 / 2')).toBeTruthy();
  });

  it.each([' ', 'Enter'])('反馈态快捷键 %j 不劫持 button/a/表单或 dialog 内目标', (key) => {
    renderDrill(vi.fn(), (
      <>
        <input aria-label="快捷键测试输入框" />
        <textarea aria-label="快捷键测试文本域" />
        <select aria-label="快捷键测试选择框">
          <option>测试选项</option>
        </select>
        <a href="#shortcut-target">快捷键测试链接</a>
        <div role="dialog" aria-label="快捷键测试弹窗">
          <span tabIndex={0}>弹窗内非控件内容</span>
        </div>
      </>
    ));

    fireEvent.click(screen.getByText('Call'));
    const dialog = screen.getByRole('dialog', { name: '快捷键测试弹窗' });
    const targets = [
      screen.getByRole('button', { name: /^下一题/ }),
      screen.getByRole('link', { name: '快捷键测试链接' }),
      screen.getByRole('textbox', { name: '快捷键测试输入框' }),
      screen.getByRole('textbox', { name: '快捷键测试文本域' }),
      screen.getByRole('combobox', { name: '快捷键测试选择框' }),
      within(dialog).getByText('弹窗内非控件内容'),
    ];

    for (const target of targets) {
      target.focus();
      expect(document.activeElement).toBe(target);
      const event = createEvent.keyDown(target, { key, cancelable: true });
      fireEvent(target, event);

      expect(event.defaultPrevented).toBe(false);
      expect(screen.getByText('1 / 2')).toBeTruthy();
    }
  });
});

describe('PracticeDrill：ELO 写入口径（P0）', () => {
  it('每题按 relatedLessonId → lessonMeta 维度写 ELO，情绪计数只记一次', () => {
    const relatedDrill: PracticeDrill = {
      id: 'elo-drill',
      questions: [
        {
          ...makeQuestion('e1', [
            { action: 'Call', isCorrect: true, explanation: '跟注。' },
            { action: 'Fold', isCorrect: false, explanation: '弃牌。' },
          ]),
          relatedLessonId: 'l3-cbet',
        },
      ],
    };
    const before = useProgressStore.getState().eloByVariant.standard;
    const beforeEmotion = useProgressStore.getState().emotion.dailyQuestionsAnswered;
    const dimension = getLessonMeta('l3-cbet').eloDimension;

    render(
      <MemoryRouter>
        <PracticeDrillComponent
          drill={relatedDrill}
          lessonId="l1-basics"
          onComplete={vi.fn()}
          adaptive={false}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Call'));

    const after = useProgressStore.getState().eloByVariant.standard;
    expect(after.gamesPlayed).toBe(before.gamesPlayed + 1);
    expect(after[dimension]).toBeGreaterThan(before[dimension]);
    // 关联课程维度生效（l3-cbet → postflop，而非 lessonId 的 handReading）
    expect(dimension).not.toBe(getLessonMeta('l1-basics').eloDimension);
    // recordAnswer 每题只调一次
    expect(useProgressStore.getState().emotion.dailyQuestionsAnswered).toBe(beforeEmotion + 1);
  });

  it('无关联课程且课时未登记 lessonMeta 时回退 postflop', () => {
    const quickDrill: PracticeDrill = {
      id: 'elo-fallback',
      questions: [
        makeQuestion('f1', [
          { action: 'Call', isCorrect: true, explanation: '跟注。' },
          { action: 'Fold', isCorrect: false, explanation: '弃牌。' },
        ]),
      ],
    };
    const before = useProgressStore.getState().eloByVariant.standard;

    render(
      <MemoryRouter>
        <PracticeDrillComponent
          drill={quickDrill}
          lessonId="quick-drill"
          onComplete={vi.fn()}
          adaptive={false}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Call'));
    const after = useProgressStore.getState().eloByVariant.standard;
    expect(after.gamesPlayed).toBe(before.gamesPlayed + 1);
    expect(after.postflop).toBeGreaterThan(before.postflop);
  });
});
