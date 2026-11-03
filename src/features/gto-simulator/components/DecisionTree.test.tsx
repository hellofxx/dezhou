/**
 * DecisionTree 测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - 单步模式：行动历史渲染、空历史「前面全 fold」提示、底池数值
 *  - 多步模式：已完成节点显示牌面与用户动作、当前节点等待决策、未来节点牌面隐藏为 ?
 *  - 节点描述优先取 descriptionKey（i18n），街名翻译
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Card, Board } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { ActionType } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import type { DecisionNode, PreviousAction } from '../types';
import { DecisionTree } from './DecisionTree';

afterEach(() => cleanup());

const FLOP: Board = {
  flop: [
    { suit: Suit.Hearts, rank: Rank.Ten },
    { suit: Suit.Clubs, rank: Rank.Five },
    { suit: Suit.Diamonds, rank: Rank.Two },
  ],
  turn: null,
  river: null,
};

const TURN_BOARD: Board = {
  ...FLOP,
  turn: { suit: Suit.Spades, rank: Rank.Nine },
};

const HERO_HAND: [Card, Card] = [
  { suit: Suit.Hearts, rank: Rank.Ace },
  { suit: Suit.Hearts, rank: Rank.King },
];

function makeNode(id: string, overrides: Partial<DecisionNode>): DecisionNode {
  return {
    id,
    street: 'flop',
    description: `desc-${id}`,
    potSize: 10,
    heroHand: HERO_HAND,
    gtoStrategy: { fold: 0, call: 1, raise: 0 },
    previousActions: [],
    ...overrides,
  };
}

describe('DecisionTree 单步模式', () => {
  const actions: PreviousAction[] = [
    { position: Position.UTG, action: ActionType.Fold },
    { position: Position.CO, action: ActionType.Raise, amount: 2.5 },
  ];

  it('渲染行动历史、动作金额与 Hero 标记', () => {
    render(<DecisionTree actions={actions} heroPosition={Position.BTN} potSize={6} />);

    expect(screen.getByText('行动历史')).toBeTruthy();
    expect(screen.getByText('6.0 BB')).toBeTruthy();
    expect(screen.getByText('Fold')).toBeTruthy();
    expect(screen.getByText('Raise 2.5BB')).toBeTruthy();
    expect(screen.getByText('Hero')).toBeTruthy();
    expect(screen.getAllByText('BTN').length).toBeGreaterThan(0);
  });

  it('不同动作按语义着色（check / call / all-in 均可渲染）', () => {
    const mixed: PreviousAction[] = [
      { position: Position.BTN, action: ActionType.Check },
      { position: Position.SB, action: ActionType.Call, amount: 3 },
      { position: Position.BB, action: ActionType.AllIn, amount: 100 },
    ];
    render(<DecisionTree actions={mixed} heroPosition={Position.BTN} potSize={10} />);

    expect(screen.getByText('Check')).toBeTruthy();
    expect(screen.getByText('Call 3BB')).toBeTruthy();
    expect(screen.getByText('All-In (100 BB)')).toBeTruthy();
  });

  it('空行动历史时提示前面全部 fold，且无 Hero 标记', () => {
    render(<DecisionTree actions={[]} heroPosition={Position.BTN} potSize={1.5} />);

    expect(screen.getByText('前面所有人都 fold，轮到 Hero')).toBeTruthy();
    expect(screen.queryByText('Hero')).toBeNull();
    expect(screen.getByText('1.5BB')).toBeTruthy();
  });
});

describe('DecisionTree 多步模式', () => {
  it('已完成节点展示牌面与用户动作，当前节点提示等待决策', () => {
    const nodes = [
      makeNode('n0', { street: 'flop', board: FLOP, potSize: 6 }),
      makeNode('n1', { street: 'turn', board: TURN_BOARD, potSize: 15 }),
    ];
    const { container } = render(
      <DecisionTree
        nodes={nodes}
        currentNodeIndex={1}
        userDecisions={[{ nodeIndex: 0, action: 'call' }]}
      />,
    );

    expect(screen.getByText('翻牌圈')).toBeTruthy();
    expect(screen.getByText('转牌圈')).toBeTruthy();
    expect(screen.getByText('6.0 BB')).toBeTruthy();
    expect(screen.getByText('15.0 BB')).toBeTruthy();
    // 已完成节点：牌面 + 用户选择（含 ✓ 标记）
    expect(container.textContent).toContain('T♥');
    expect(container.textContent).toContain('✓');
    expect(screen.getByText('call')).toBeTruthy();
    // 当前节点：等待决策提示（未来节点不渲染该提示）
    expect(screen.getAllByText(/等待决策/)).toHaveLength(1);
  });

  it('未来节点牌面隐藏为 ? 占位，当前节点显示真实牌面', () => {
    const nodes = [
      makeNode('n0', { street: 'flop', board: FLOP, potSize: 6 }),
      makeNode('n1', { street: 'turn', board: TURN_BOARD, potSize: 15 }),
    ];
    const { container } = render(<DecisionTree nodes={nodes} currentNodeIndex={0} />);

    const placeholders = Array.from(container.querySelectorAll('span')).filter(
      (span) => span.textContent === '?',
    );
    // turn 节点 4 张牌全部隐藏
    expect(placeholders).toHaveLength(4);
    // 当前 flop 节点展示真实牌面（T♥ 5♣ 2♦）
    expect(container.textContent).toContain('5♣');
    // 未来节点（turn）牌面完全隐藏：9♠ 不出现在文本中
    expect(container.textContent).not.toContain('9♠');
  });

  it('节点描述优先取 descriptionKey 并支持插值参数', () => {
    const nodes = [
      makeNode('n0', {
        street: 'preflop',
        board: undefined,
        description: 'fallback text',
        descriptionKey: 'gto.session.scenarioLabel',
        descriptionParams: { n: 3 },
      }),
    ];
    render(<DecisionTree nodes={nodes} currentNodeIndex={0} />);

    expect(screen.getByText('场景 3')).toBeTruthy();
    expect(screen.queryByText('fallback text')).toBeNull();
  });

  it('className 透传到根容器', () => {
    const { container } = render(
      <DecisionTree nodes={[makeNode('n0', { board: FLOP })]} className="tree-custom" />,
    );

    expect(container.querySelector('.tree-custom')).not.toBeNull();
  });
});
