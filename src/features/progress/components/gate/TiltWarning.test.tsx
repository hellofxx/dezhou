import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import TiltWarning from './TiltWarning';
import { useProgressStore } from '../../store';
import { DEFAULT_EMOTION_STATE } from '../../types';

/**
 * TiltWarning Tilt 前兆识别（jsdom）。
 *
 * 契约：
 * - 仅在 consecutiveWrongCount 从 <3 跨越到 >=3 时弹一次（挂载时已 >=3 不弹）；
 * - 三个动作：关闭 / 跳转情绪管理课程 / 休息一下回 Dashboard；
 * - 关闭后再次跨越阈值仍会重新触发（不是一次性）。
 */

function LocationProbe() {
  const location = useLocation();
  return <div data-probe>{location.pathname}</div>;
}

function setWrongCount(count: number) {
  act(() => {
    useProgressStore.setState({ emotion: { ...DEFAULT_EMOTION_STATE, consecutiveWrongCount: count } });
  });
}

/** 模拟连续答错：recordAnswer(false) 会累加计数，这里直接写状态以聚焦组件契约 */
function seedWrongCount(count: number) {
  useProgressStore.setState({ emotion: { ...DEFAULT_EMOTION_STATE, consecutiveWrongCount: count } });
}

function renderWarning() {
  return render(
    <MemoryRouter initialEntries={['/range']}>
      <TiltWarning />
      <LocationProbe />
    </MemoryRouter>,
  );
}

beforeEach(() => seedWrongCount(0));

afterEach(() => {
  cleanup();
  seedWrongCount(0);
});

describe('TiltWarning 阈值跨越', () => {
  it('挂载时未达阈值不弹窗，跨越到 3 时弹出提示', () => {
    const { baseElement } = renderWarning();

    expect(baseElement.textContent).not.toContain('要不要休息一下？');

    setWrongCount(3);

    expect(baseElement.textContent).toContain('要不要休息一下？');
    expect(baseElement.textContent).toContain('连续答错可能是疲劳的信号');
  });

  it('挂载时已 >=3 不弹窗（只认跨越，不认快照）', () => {
    seedWrongCount(3);

    const { baseElement } = renderWarning();

    expect(baseElement.textContent).not.toContain('要不要休息一下？');
  });

  it('答错累计到 2 仍不弹窗，从 2 跨到 3 才弹', () => {
    const { baseElement } = renderWarning();

    setWrongCount(2);
    expect(baseElement.textContent).not.toContain('要不要休息一下？');

    setWrongCount(3);
    expect(baseElement.textContent).toContain('要不要休息一下？');
  });
});

describe('TiltWarning 三个动作', () => {
  it('「我知道了」仅关闭弹窗，不跳转', () => {
    const { baseElement, getByText } = renderWarning();
    setWrongCount(3);

    fireEvent.click(getByText('我知道了'));

    expect(baseElement.textContent).not.toContain('要不要休息一下？');
    expect(baseElement.querySelector('[data-probe]')?.textContent).toBe('/range');
  });

  it('「学习情绪管理」跳转到情绪管理课程', () => {
    const { baseElement, getByText } = renderWarning();
    setWrongCount(3);

    fireEvent.click(getByText('学习情绪管理'));

    expect(baseElement.querySelector('[data-probe]')?.textContent).toBe(
      '/academy/lesson/local-mental-tilt-recognition',
    );
  });

  it('「休息一下」回到 Dashboard', () => {
    const { baseElement, getByText } = renderWarning();
    setWrongCount(3);

    fireEvent.click(getByText('休息一下'));

    expect(baseElement.querySelector('[data-probe]')?.textContent).toBe('/');
  });

  it('关闭后再次跨越阈值会重新触发（非一次性提示）', () => {
    const { baseElement, getByText } = renderWarning();

    setWrongCount(3);
    fireEvent.click(getByText('我知道了'));
    expect(baseElement.textContent).not.toContain('要不要休息一下？');

    // 答对一题计数归零，再次连错跨越阈值
    setWrongCount(0);
    setWrongCount(4);

    expect(baseElement.textContent).toContain('要不要休息一下？');
  });
});
