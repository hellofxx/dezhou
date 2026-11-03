import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import DifficultyIndicator from './DifficultyIndicator';
import { DIFFICULTY_THRESHOLDS } from '../../constants';

/**
 * DifficultyIndicator 难度阶梯（jsdom 冒烟 + 分支）。
 *
 * 契约：
 * - 三档（基础/进阶/高级）恒渲染，当前档位带 aria-current="step"；
 * - 建议文案按 DIFFICULTY_THRESHOLDS 单源分四支：样本不足 / 建议升档 / 建议降档 / 适合。
 */
afterEach(cleanup);

describe('DifficultyIndicator 难度阶梯', () => {
  it('渲染三档并标记当前档位', () => {
    const { container } = render(
      <DifficultyIndicator currentDifficulty="intermediate" accuracy={0.7} sessionsCount={30} />,
    );

    const text = container.textContent ?? '';
    expect(text).toContain('当前难度');
    expect(text).toContain('基础');
    expect(text).toContain('进阶');
    expect(text).toContain('高级');

    const active = container.querySelector('[aria-current="step"]');
    expect(active).toBeTruthy();
    expect(active?.textContent).toContain('进阶');
    // 仅一个档位处于激活态
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  });

  it('会话数不足阈值时提示先完成更多训练', () => {
    const { container } = render(
      <DifficultyIndicator currentDifficulty="beginner" accuracy={0.99} sessionsCount={4} />,
    );
    expect(container.textContent).toContain('完成更多训练以获取建议');
  });

  it('高正确率且会话数达阈值时建议升档', () => {
    const { container } = render(
      <DifficultyIndicator
        currentDifficulty="advanced"
        accuracy={DIFFICULTY_THRESHOLDS.advanced + 0.05}
        sessionsCount={DIFFICULTY_THRESHOLDS.upgradeMinSessions + 1}
      />,
    );
    expect(container.textContent).toContain('建议升级难度');
  });

  it('低正确率时建议降档', () => {
    const { container } = render(
      <DifficultyIndicator
        currentDifficulty="advanced"
        accuracy={DIFFICULTY_THRESHOLDS.downshift - 0.1}
        sessionsCount={30}
      />,
    );
    expect(container.textContent).toContain('建议降低难度');
  });

  it('正确率处于中间区间时提示难度适合', () => {
    const { container } = render(
      <DifficultyIndicator currentDifficulty="intermediate" accuracy={0.7} sessionsCount={30} />,
    );
    expect(container.textContent).toContain('当前难度适合你');
  });
});
