import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import StreakCelebration from './StreakCelebration';
import { useProgressStore, DEFAULT_STREAK_STATE } from '../../store';
import { DEFAULT_EMOTION_STATE, MILESTONE_FREEZE_REWARDS } from '../../types';

/**
 * StreakCelebration 里程碑庆典（jsdom）。
 *
 * 契约：
 * - 3/7/30/100/365 各有一套徽章与标题文案；未知天数回退到 3 天里程碑；
 * - 冻结卡奖励数量来自 MILESTONE_FREEZE_REWARDS（展示语义，实际发放由 store 完成）；
 * - 仅 30 天及以上展示「分享给好友」；「继续训练」关闭弹窗。
 *
 * Radix Dialog 内容渲染在 portal（document.body），断言用 baseElement。
 */

function seedStore(currentStreak = 7) {
  useProgressStore.setState({
    records: [],
    streak: { ...DEFAULT_STREAK_STATE, currentStreak },
    emotion: { ...DEFAULT_EMOTION_STATE },
  });
}

beforeEach(() => seedStore());

afterEach(() => {
  cleanup();
  seedStore();
});

describe('StreakCelebration 里程碑庆典', () => {
  it('7 天里程碑展示火焰标题与冻结卡奖励，不展示分享按钮', () => {
    const { baseElement } = render(
      <StreakCelebration days={7} open onClose={() => {}} />,
    );
    const text = baseElement.textContent ?? '';

    expect(text).toContain('金色火焰！');
    expect(text).toContain('7 天连续训练，你已经进入状态');
    expect(text).toContain('恭喜！你已连续训练 7 天！');
    expect(text).toContain(`获得 ${MILESTONE_FREEZE_REWARDS[7]} 张冻结卡`);
    expect(text).not.toContain('分享给好友');
  });

  it('30 天里程碑展示奖杯标题与分享按钮', () => {
    const { baseElement } = render(
      <StreakCelebration days={30} open onClose={() => {}} />,
    );
    const text = baseElement.textContent ?? '';

    expect(text).toContain('奖杯到手！');
    expect(text).toContain(`获得 ${MILESTONE_FREEZE_REWARDS[30]} 张冻结卡`);
    expect(text).toContain('分享给好友');
  });

  it('100 天里程碑展示钻石标题', () => {
    const { baseElement } = render(
      <StreakCelebration days={100} open onClose={() => {}} />,
    );
    expect(baseElement.textContent).toContain('钻石徽章！');
  });

  it('未知天数回退到 3 天里程碑与 1 张冻结卡', () => {
    const { baseElement } = render(
      <StreakCelebration days={999} open onClose={() => {}} />,
    );
    const text = baseElement.textContent ?? '';

    expect(text).toContain('铜徽章达成！');
    expect(text).toContain('获得 1 张冻结卡');
  });

  it('关闭态不渲染庆典内容', () => {
    const { baseElement } = render(
      <StreakCelebration days={30} open={false} onClose={() => {}} />,
    );
    expect(baseElement.textContent ?? '').not.toContain('金色火焰');
  });

  it('生成分享卡片失败时按钮回到可用状态（不卡在「生成中」）', async () => {
    // jsdom 无 canvas 实现：getContext 返回 null → 生成函数抛错，走 catch 分支
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getByText, queryByText } = render(
      <StreakCelebration days={30} open onClose={() => {}} />,
    );

    fireEvent.click(getByText('分享给好友'));

    await waitFor(() => {
      expect(queryByText('分享给好友')).toBeTruthy();
    });
    expect(queryByText('生成中...')).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('点击「继续训练」关闭弹窗', () => {
    const onClose = vi.fn();
    const { getByText } = render(<StreakCelebration days={7} open onClose={onClose} />);

    fireEvent.click(getByText('继续训练'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
