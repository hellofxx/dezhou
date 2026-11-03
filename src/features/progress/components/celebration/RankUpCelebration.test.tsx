import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import RankUpCelebration, { detectRankUp } from './RankUpCelebration';
import { getRankForScore } from '../../utils/elo';
import type { RankUpEvent } from '@/shared/types/elo';

/**
 * RankUpCelebration 段位升级庆祝（jsdom）。
 *
 * 契约：
 * - rankUp 为 null 时不渲染内容；非 null 时展示「旧段位 → 新段位」与段位描述；
 * - 段位名 / 描述必须是 i18n 译文（progress.rank.<key>.*），不得把 Rank.name 的
 *   语义 key（rookie / entry / …）当文案直接渲染；
 * - 5 秒后自动关闭；「继续训练」按钮立即关闭。
 *
 * Radix Dialog 内容渲染在 portal（document.body），故断言用 baseElement 而非 container。
 */

function makeRankUp(fromScore: number, toScore: number): RankUpEvent {
  return { from: getRankForScore(fromScore), to: getRankForScore(toScore) };
}

afterEach(cleanup);

describe('RankUpCelebration 段位升级庆祝', () => {
  it('rankUp 为 null 时不渲染庆祝内容', () => {
    const { baseElement } = render(<RankUpCelebration rankUp={null} onClose={() => {}} />);

    expect(baseElement.textContent ?? '').not.toContain('段位升级');
  });

  it('展示旧段位与新段位的本地化名称与描述，不渲染语义 key', () => {
    // 400 → rookie（新手）；900 → intermediate（进阶）
    const rankUp = makeRankUp(400, 900);
    const { baseElement } = render(<RankUpCelebration rankUp={rankUp} onClose={() => {}} />);
    const text = baseElement.textContent ?? '';

    expect(text).toContain('段位升级！');
    expect(text).toContain('你的能力达到了新的高度');
    expect(text).toContain('新手');
    expect(text).toContain('进阶');
    expect(text).toContain('理解位置与范围');

    // 回归锁：语义 key 不得作为文案泄漏到 DOM
    expect(text).not.toContain('rookie');
    expect(text).not.toContain('intermediate');
  });

  it('点击「继续训练」立即关闭', () => {
    const onClose = vi.fn();
    const { getByText } = render(<RankUpCelebration rankUp={makeRankUp(400, 900)} onClose={onClose} />);

    fireEvent.click(getByText('继续训练'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('5 秒后自动关闭，避免弹窗长期驻留', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onClose = vi.fn();
    try {
      render(<RankUpCelebration rankUp={makeRankUp(400, 900)} onClose={onClose} />);

      expect(onClose).not.toHaveBeenCalled();
      vi.advanceTimersByTime(5000);
      expect(onClose).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('detectRankUp 工具函数', () => {
  it('跨段位向上返回 from/to；段位内或降级返回 null', () => {
    expect(detectRankUp(400, 900)).toEqual({ from: getRankForScore(400), to: getRankForScore(900) });
    expect(detectRankUp(400, 450)).toBeNull();
    expect(detectRankUp(900, 400)).toBeNull();
  });
});
