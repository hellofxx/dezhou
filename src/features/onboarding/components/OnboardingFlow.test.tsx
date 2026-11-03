/**
 * OnboardingFlow 组件测试（L2 · jsdom）：
 * 步骤状态机契约——currentStep 0-4 各渲染对应步骤组件；底部步骤标题随步骤切换；
 * 完成（currentStep>=5）渲染完成占位并由 effect replace 跳转首页；
 * 目标提交 / 跳过引导走真实 progress store action，落库 dailyGoalMinutes / completed。
 * 路由用 MemoryRouter + LocationProbe 断言，不依赖真实计时器。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import OnboardingFlow from './OnboardingFlow';
import { useProgressStore } from '@/features/progress/store';

// 步骤 2 挂载 FirstDrillStep（QuizCard 的 AnimatePresence 依赖动画帧）
MotionGlobalConfig.skipAnimations = true;

const originalOnboarding = useProgressStore.getState().onboarding;

function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="location">{pathname}</div>;
}

/** 用 progress store 构造 onboarding 当前步骤（不触发真实逐题流程） */
function setStep(step: number) {
  act(() => {
    useProgressStore.setState((s) => ({
      onboarding: { ...s.onboarding, currentStep: step, completed: step >= 5 },
    }));
  });
}

function renderFlow(step: number) {
  setStep(step);
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <OnboardingFlow />
      <LocationProbe />
    </MemoryRouter>,
  );
}

const store = () => useProgressStore.getState();

describe('OnboardingFlow 步骤状态机', () => {
  beforeEach(() => {
    setStep(0);
  });

  afterEach(() => {
    cleanup();
    act(() => {
      useProgressStore.setState({ onboarding: { ...originalOnboarding } });
    });
  });

  it('currentStep=0 渲染欢迎页，点击「我是新手」推进到定位测试', () => {
    renderFlow(0);

    expect(screen.getByText('系统性提升你的扑克决策能力')).toBeTruthy();
    expect(screen.getByText('欢迎')).toBeTruthy(); // 底部步骤标题

    fireEvent.click(screen.getByRole('button', { name: /我是新手/ }));

    expect(store().onboarding.currentStep).toBe(1);
    expect(screen.getByText('以下哪手起手牌的牌力最强？')).toBeTruthy();
    expect(screen.getByText('定位测试')).toBeTruthy();
  });

  it('点击「跳过引导」→ onboarding 标记完成并直接跳转首页', () => {
    renderFlow(0);

    fireEvent.click(screen.getByRole('button', { name: '跳过引导' }));

    expect(store().onboarding.completed).toBe(true);
    expect(store().onboarding.currentStep).toBe(5);
    expect(screen.getByTestId('location').textContent).toBe('/');
  });

  it('currentStep=2 渲染首次微训练步骤', () => {
    renderFlow(2);

    expect(screen.getByText('首次微训练')).toBeTruthy();
    expect(screen.getByText('首次训练')).toBeTruthy(); // 底部步骤标题
  });

  it('currentStep=3 渲染首胜庆祝步骤', () => {
    renderFlow(3);

    expect(screen.getByText('恭喜完成首次训练！')).toBeTruthy();
    expect(screen.getByText('首胜庆祝')).toBeTruthy();
  });

  it('currentStep=4 提交目标 → onboarding 完成、dailyGoalMinutes 落库并跳转首页', () => {
    renderFlow(4);

    expect(screen.getByText('设定每日训练目标')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('/onboarding');

    fireEvent.click(screen.getByRole('button', { name: /^20\s*分钟$/ }));
    fireEvent.click(screen.getByRole('button', { name: '确认目标' }));

    const onboarding = store().onboarding;
    expect(onboarding.completed).toBe(true);
    expect(onboarding.currentStep).toBe(5);
    expect(onboarding.dailyGoalMinutes).toBe(20);
    expect(onboarding.completedAt).toBeTypeOf('number');
    // 完成态过渡帧 + effect replace 跳转首页
    expect(screen.getByText('引导完成')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('/');
  });

  it('已完成（currentStep=5）直接进入完成占位并跳转首页', () => {
    renderFlow(5);

    expect(store().onboarding.currentStep).toBe(5);
    expect(screen.getByText('引导完成')).toBeTruthy();
    expect(screen.getByText('即将进入训练平台...')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('/');
  });
});
