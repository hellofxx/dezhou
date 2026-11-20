/**
 * WelcomeStep 组件测试（L2 · jsdom）：
 * 入口分流的委派契约——新手 → completeOnboardingStep(1) 进定位测试；
 * 有基础 → completeOnboardingStep(2) 跳过定位直达微训练；跳过 → skipOnboarding。
 * 生产侧只依赖 progress 公共入口（@/features/progress/api），故契约断言打在
 * progressCommands 上（不再替换 progress store 内部 action）。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import WelcomeStep from './WelcomeStep';
import { progressCommands } from '@/features/progress/api';

describe('WelcomeStep 入口分流', () => {
  const commands = {
    completeOnboardingStep: vi.fn(),
    skipOnboarding: vi.fn(),
  };

  beforeEach(() => {
    commands.completeOnboardingStep.mockClear();
    commands.skipOnboarding.mockClear();
    vi.spyOn(progressCommands, 'completeOnboardingStep').mockImplementation(
      commands.completeOnboardingStep,
    );
    vi.spyOn(progressCommands, 'skipOnboarding').mockImplementation(commands.skipOnboarding);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('点击「我是新手」→ completeOnboardingStep(1)，进入定位测试', () => {
    render(<WelcomeStep />);

    fireEvent.click(screen.getByRole('button', { name: /我是新手/ }));

    expect(commands.completeOnboardingStep).toHaveBeenCalledTimes(1);
    expect(commands.completeOnboardingStep).toHaveBeenCalledWith(1);
    expect(commands.skipOnboarding).not.toHaveBeenCalled();
  });

  it('点击「我有基础」→ completeOnboardingStep(2)，跳过定位测试直达微训练', () => {
    render(<WelcomeStep />);

    fireEvent.click(screen.getByRole('button', { name: /我有基础/ }));

    expect(commands.completeOnboardingStep).toHaveBeenCalledTimes(1);
    expect(commands.completeOnboardingStep).toHaveBeenCalledWith(2);
  });

  it('点击「跳过引导」→ skipOnboarding，且不推进任何步骤', () => {
    render(<WelcomeStep />);

    fireEvent.click(screen.getByRole('button', { name: '跳过引导' }));

    expect(commands.skipOnboarding).toHaveBeenCalledTimes(1);
    expect(commands.completeOnboardingStep).not.toHaveBeenCalled();
  });

  it('渲染价值主张与两个入口 CTA 的真实中文文案', () => {
    render(<WelcomeStep />);

    expect(screen.getByText('系统性提升你的扑克决策能力')).toBeTruthy();
    expect(screen.getByText('从定位测试开始 →')).toBeTruthy();
    expect(screen.getByText('直接进入训练 →')).toBeTruthy();
  });
});
