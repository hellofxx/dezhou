/**
 * GoalSettingStep 组件测试（L2 · jsdom）：
 * ① 未选时长时「确认目标」禁用且点击不提交（避免写入非法 dailyGoalMinutes）
 * ② 选 20 分钟后确认 → completeOnboardingStep(5, { dailyGoalMinutes, completedAt })
 *    step=5 即 onboarding 完成标记
 * ③ 切换选项后以最终选择为准（不残留首次点击值）
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import GoalSettingStep from './GoalSettingStep';
import { useProgressStore } from '@/features/progress/store';

const originalCompleteOnboardingStep = useProgressStore.getState().completeOnboardingStep;

function goalButton(minutes: number): HTMLButtonElement {
  return screen.getByRole('button', {
    name: new RegExp(`^${minutes}\\s*分钟$`),
  }) as HTMLButtonElement;
}

function confirmButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: '确认目标' }) as HTMLButtonElement;
}

describe('GoalSettingStep 目标设定', () => {
  const completeOnboardingStep = vi.fn();

  beforeEach(() => {
    completeOnboardingStep.mockClear();
    useProgressStore.setState({ completeOnboardingStep });
  });

  afterEach(() => {
    cleanup();
    useProgressStore.setState({ completeOnboardingStep: originalCompleteOnboardingStep });
  });

  it('未选择时长：确认按钮禁用，点击不提交', () => {
    render(<GoalSettingStep />);

    expect(confirmButton().disabled).toBe(true);
    fireEvent.click(confirmButton());

    expect(completeOnboardingStep).not.toHaveBeenCalled();
  });

  it('选择 20 分钟后确认 → completeOnboardingStep(5, 目标与完成时间)', () => {
    render(<GoalSettingStep />);

    fireEvent.click(goalButton(20));
    expect(confirmButton().disabled).toBe(false);
    fireEvent.click(confirmButton());

    expect(completeOnboardingStep).toHaveBeenCalledTimes(1);
    const [step, data] = completeOnboardingStep.mock.calls[0]!;
    expect(step).toBe(5);
    expect(data).toMatchObject({ dailyGoalMinutes: 20 });
    expect(typeof data.completedAt).toBe('number');
  });

  it('切换选项后以最终选择为准：先 5 后 10 → 提交 dailyGoalMinutes=10', () => {
    render(<GoalSettingStep />);

    fireEvent.click(goalButton(5));
    fireEvent.click(goalButton(10));
    fireEvent.click(confirmButton());

    expect(completeOnboardingStep).toHaveBeenCalledTimes(1);
    expect(completeOnboardingStep.mock.calls[0]![1]).toMatchObject({ dailyGoalMinutes: 10 });
  });

  it('三个目标选项（5 / 10 / 20 分钟）均渲染', () => {
    render(<GoalSettingStep />);

    expect(goalButton(5).textContent).toContain('分钟');
    expect(goalButton(10).textContent).toContain('分钟');
    expect(goalButton(20).textContent).toContain('分钟');
  });
});
