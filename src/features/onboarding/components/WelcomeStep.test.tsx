/**
 * WelcomeStep 组件测试（L2 · jsdom）：
 * 入口分流的委派契约——新手 → completeOnboardingStep(1) 进定位测试；
 * 有基础 → completeOnboardingStep(2) 跳过定位直达微训练；跳过 → skipOnboarding。
 * 断言 progress store 公开 action 的调用参数，不复制组件内部实现。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import WelcomeStep from './WelcomeStep';
import { useProgressStore } from '@/features/progress/store';

const originalActions = {
  completeOnboardingStep: useProgressStore.getState().completeOnboardingStep,
  skipOnboarding: useProgressStore.getState().skipOnboarding,
};

describe('WelcomeStep 入口分流', () => {
  const completeOnboardingStep = vi.fn();
  const skipOnboarding = vi.fn();

  beforeEach(() => {
    completeOnboardingStep.mockClear();
    skipOnboarding.mockClear();
    useProgressStore.setState({ completeOnboardingStep, skipOnboarding });
  });

  afterEach(() => {
    cleanup();
    useProgressStore.setState({ ...originalActions });
  });

  it('点击「我是新手」→ completeOnboardingStep(1)，进入定位测试', () => {
    render(<WelcomeStep />);

    fireEvent.click(screen.getByRole('button', { name: /我是新手/ }));

    expect(completeOnboardingStep).toHaveBeenCalledTimes(1);
    expect(completeOnboardingStep).toHaveBeenCalledWith(1);
    expect(skipOnboarding).not.toHaveBeenCalled();
  });

  it('点击「我有基础」→ completeOnboardingStep(2)，跳过定位测试直达微训练', () => {
    render(<WelcomeStep />);

    fireEvent.click(screen.getByRole('button', { name: /我有基础/ }));

    expect(completeOnboardingStep).toHaveBeenCalledTimes(1);
    expect(completeOnboardingStep).toHaveBeenCalledWith(2);
  });

  it('点击「跳过引导」→ skipOnboarding，且不推进任何步骤', () => {
    render(<WelcomeStep />);

    fireEvent.click(screen.getByRole('button', { name: '跳过引导' }));

    expect(skipOnboarding).toHaveBeenCalledTimes(1);
    expect(completeOnboardingStep).not.toHaveBeenCalled();
  });

  it('渲染价值主张与两个入口 CTA 的真实中文文案', () => {
    render(<WelcomeStep />);

    expect(screen.getByText('系统性提升你的扑克决策能力')).toBeTruthy();
    expect(screen.getByText('从定位测试开始 →')).toBeTruthy();
    expect(screen.getByText('直接进入训练 →')).toBeTruthy();
  });
});
