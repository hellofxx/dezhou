import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DifficultyStairChart, type DifficultyChange } from './DifficultyStairChart';

/**
 * 难度阶梯图契约：
 * - 阶梯点序列 = 起点 + 每次变化（水平延伸 + 垂直跳变）+ 终点
 * - 段终点圆点按到达难度着色（变化落点 + 终点）
 * - 三档图例与可访问名称齐备
 */

const changes: DifficultyChange[] = [
  { from: 'beginner', to: 'intermediate', questionIndex: 5 },
  { from: 'intermediate', to: 'advanced', questionIndex: 10 },
];

afterEach(() => cleanup());

describe('DifficultyStairChart', () => {
  it('渲染阶梯折线、段终点圆点与三档图例', () => {
    const { container } = render(
      <DifficultyStairChart changes={changes} totalQuestions={20} />,
    );

    expect(screen.getByText('难度变化：')).toBeTruthy();
    expect(screen.getByRole('img', { name: '难度变化阶梯图' })).toBeTruthy();

    // 2 次变化 + 终点 = 3 个段终点圆点
    expect(container.querySelectorAll('circle')).toHaveLength(3);
    const polyline = container.querySelector('polyline');
    expect(polyline).not.toBeNull();
    // 起点 + 每次变化 2 点 + 终点 = 6 个坐标
    expect(polyline!.getAttribute('points')!.trim().split(/\s+/)).toHaveLength(6);

    expect(screen.getByText('基础')).toBeTruthy();
    expect(screen.getByText('进阶')).toBeTruthy();
    expect(screen.getByText('高级')).toBeTruthy();
  });

  it('单次升级：圆点数量为 2（变化落点 + 终点）', () => {
    const { container } = render(
      <DifficultyStairChart
        changes={[{ from: 'beginner', to: 'intermediate', questionIndex: 3 }]}
        totalQuestions={10}
      />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });
});
