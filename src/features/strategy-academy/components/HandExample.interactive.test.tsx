import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  PredictionPrompt,
  buildActionChoices,
  formatActionLabel,
  parseEvLoss,
} from './PredictionPrompt';
import { HandExampleComponent } from './HandExample';
import type { HandExample, OpponentProfile } from '../types';

function makeExample(overrides: Partial<HandExample> = {}): HandExample {
  return {
    id: 'test-ex1',
    title: '测试示例',
    heroHand: ['As', 'Ah'],
    heroPosition: 'CO',
    previousActions: [],
    street: 'preflop',
    effectiveStack: 100,
    potSize: 1.5,
    correctDecision: {
      action: 'Raise',
      amount: '2.5BB',
      reasoning: ['统一加注大小隐藏牌力', '2.5BB 已足够建立底池'],
    },
    commonMistake: {
      action: '加注 4-5BB（因为牌强）',
      reasoning: '大注暴露牌力，对手会弃牌。',
      evLoss: '-8.0 BB/100',
    },
    ...overrides,
  };
}

const TAG_OPPONENT: OpponentProfile = {
  id: 'tag',
  name: 'TAG (紧凶)',
  shortName: 'TAG',
  description: '紧凶',
  color: '#4f8a5b',
  icon: '🎯',
  stats: { vpip: 18, pfr: 14, af: 3.2, threeBetPercent: 6, foldToCBet: 60, cbetFrequency: 62 },
  tendencies: ['翻前加注范围偏紧'],
  exploitableBy: ['用更宽的 3-Bet 频率施压'],
};

function findButton(container: HTMLElement, text: string): HTMLButtonElement {
  const btn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === text);
  if (!btn) throw new Error(`button not found: ${text}`);
  return btn as HTMLButtonElement;
}

describe('PredictionPrompt 纯函数', () => {
  it('formatActionLabel 含 amount 时拼接', () => {
    expect(formatActionLabel('Raise', '2.5BB')).toBe('Raise 2.5BB');
    expect(formatActionLabel('Fold')).toBe('Fold');
  });

  it('parseEvLoss 解析常见 evLoss 格式并取绝对值', () => {
    expect(parseEvLoss('-0.8 BB/100')).toBe(0.8);
    expect(parseEvLoss('-2BB（失去偷盲机会）')).toBe(2);
    expect(parseEvLoss('-1.5BB（失去偷盲机会）')).toBe(1.5);
  });

  it('parseEvLoss 缺失/解析失败兜底 3', () => {
    expect(parseEvLoss(undefined)).toBe(3);
    expect(parseEvLoss('')).toBe(3);
    expect(parseEvLoss('无数字')).toBe(3);
  });

  it('buildActionChoices 确定性：三选、唯一正确、干扰项与两者不同', () => {
    const example = makeExample();
    const choices = buildActionChoices(example);
    expect(choices).toHaveLength(3);
    expect(choices.filter((c) => c.isCorrect)).toHaveLength(1);
    expect(choices[0]).toEqual({ label: 'Raise 2.5BB', isCorrect: true });
    expect(choices[1]).toEqual({ label: '加注 4-5BB（因为牌强）', isCorrect: false });
    const distractor = choices[2]!;
    expect(distractor.label).not.toBe(choices[0]!.label);
    expect(distractor.label).not.toBe(choices[1]!.label);
    expect(distractor.label).toBe('Fold');
    // 确定性：重复调用结果一致
    expect(buildActionChoices(example)).toEqual(choices);
  });

  it('buildActionChoices 干扰项跳过与正确/错误标签相同的通用动作', () => {
    const example = makeExample({
      correctDecision: { action: 'Check', amount: undefined, reasoning: [] },
      commonMistake: { action: 'Call', reasoning: '', evLoss: '-1 BB/100' },
    });
    const labels = buildActionChoices(example).map((c) => c.label);
    expect(labels).toContain('Check');
    expect(labels).toContain('Call');
    expect(labels[2]).toBe('Fold');
  });
});

describe('PredictionPrompt 组件', () => {
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

  it('未答时渲染预测区：问题卡 + 3 个动作按钮', () => {
    act(() => {
      root.render(<PredictionPrompt example={makeExample()} answered={false} onAnswered={() => {}} />);
    });
    expect(container.textContent).toContain('面对这个局面，你的动作是？');
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
    expect(container.textContent).toContain('Raise 2.5BB');
    expect(container.textContent).toContain('加注 4-5BB（因为牌强）');
    expect(container.textContent).toContain('Fold');
    expect(container.textContent).not.toContain('重新预测');
  });

  it('选对 → 揭示区 best 徽章 + reasoning 列表 + 正确项高亮', () => {
    act(() => {
      root.render(<PredictionPrompt example={makeExample()} answered={false} onAnswered={() => {}} />);
    });
    act(() => {
      findButton(container, 'Raise 2.5BB').click();
    });
    expect(container.textContent).toContain('最优决策！');
    expect(container.textContent).toContain('正确决策');
    expect(container.textContent).toContain('统一加注大小隐藏牌力');
    expect(container.textContent).toContain('2.5BB 已足够建立底池');
    // 三个动作按钮全部禁用，正确项绿色高亮；重新预测按钮可用
    expect(findButton(container, 'Raise 2.5BB').disabled).toBe(true);
    expect(findButton(container, '加注 4-5BB（因为牌强）').disabled).toBe(true);
    expect(findButton(container, 'Fold').disabled).toBe(true);
    expect(findButton(container, '重新预测').disabled).toBe(false);
    expect(findButton(container, 'Raise 2.5BB').className).toContain('text-[var(--poker-success)]');
  });

  it('选错 → blunder 徽章 + 正确决策高亮 + 选中错误项红色', () => {
    act(() => {
      root.render(<PredictionPrompt example={makeExample()} answered={false} onAnswered={() => {}} />);
    });
    act(() => {
      findButton(container, 'Fold').click();
    });
    expect(container.textContent).toContain('严重错误');
    expect(container.textContent).toContain('正确决策');
    expect(findButton(container, 'Raise 2.5BB').className).toContain('text-[var(--poker-success)]');
    expect(findButton(container, 'Fold').className).toContain('text-[var(--poker-danger)]');
    expect(findButton(container, '加注 4-5BB（因为牌强）').className).toContain('opacity-40');
  });

  it('重新预测 → 重置回预测区并回调 onAnswered(false)', () => {
    act(() => {
      root.render(<PredictionPrompt example={makeExample()} answered={false} onAnswered={() => {}} />);
    });
    act(() => {
      findButton(container, 'Fold').click();
    });
    expect(container.textContent).toContain('严重错误');
    act(() => {
      findButton(container, '重新预测').click();
    });
    expect(container.textContent).toContain('面对这个局面，你的动作是？');
    expect(container.textContent).not.toContain('严重错误');
    expect(container.querySelectorAll('button')).toHaveLength(3);
  });

  it('对手存在时揭示区展示策略提示', () => {
    act(() => {
      root.render(
        <PredictionPrompt
          example={makeExample({ opponent: TAG_OPPONENT })}
          answered={false}
          onAnswered={() => {}}
        />,
      );
    });
    act(() => {
      findButton(container, 'Raise 2.5BB').click();
    });
    expect(container.textContent).toContain('面对 TAG 类型对手，用更宽的 3-Bet 频率施压');
  });
});

describe('HandExampleComponent 互动/静态模式', () => {
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

  it('interactive 渲染预测区（3 个按钮）', () => {
    act(() => {
      root.render(
        <HandExampleComponent example={makeExample()} index={0} interactive answered={false} onAnswered={() => {}} />,
      );
    });
    expect(container.textContent).toContain('面对这个局面，你的动作是？');
    expect(container.querySelectorAll('button')).toHaveLength(3);
  });

  it('interactive 已答（受控）时直接显示揭示区', () => {
    act(() => {
      root.render(
        <HandExampleComponent example={makeExample()} index={0} interactive answered onAnswered={() => {}} />,
      );
    });
    expect(container.textContent).not.toContain('面对这个局面，你的动作是？');
    expect(container.textContent).toContain('正确决策');
    expect(container.textContent).toContain('统一加注大小隐藏牌力');
  });

  it('静态模式（interactive 缺省）不渲染预测区（回归保护）', () => {
    act(() => {
      root.render(<HandExampleComponent example={makeExample()} index={0} />);
    });
    expect(container.textContent).not.toContain('面对这个局面，你的动作是？');
    expect(container.textContent).not.toContain('重新预测');
    // 静态双栏保留
    expect(container.textContent).toContain('正确决策');
    expect(container.textContent).toContain('常见错误');
    expect(container.textContent).toContain('EV: -8.0 BB/100');
  });

  it('静态模式点击课程内无交互按钮（无预测按钮）', () => {
    act(() => {
      root.render(<HandExampleComponent example={makeExample()} index={0} />);
    });
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
