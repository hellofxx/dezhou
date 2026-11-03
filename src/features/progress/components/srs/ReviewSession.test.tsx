import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import ReviewSession from './ReviewSession';
import { useProgressStore } from '../../store';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';

/**
 * ReviewSession 复习会话（jsdom）。
 *
 * 契约：
 * - 今日无到期项 → 空态弹窗；
 * - 三种渲染模式由 metadata 决定：options → 多选题、front/back → 自评、缺失 → 退化自评；
 * - 作答即经 processReview 写入 SRS（答对 repetitions+1，答错 repetitions 归零且 easeFactor 下降）；
 * - 队列推进到末题给出「完成复习」，总结页展示总题数 / 答对 / 正确率；
 * - 关闭走 onOpenChange(false)。
 *
 * 复习项 label / front / back / options 存的是 i18n key（语言中立载荷）；测试直接用
 * 中文原文充当 key，t() 未命中时原样回显，断言与渲染路径一致。
 */

function mcItem(id: string): ReviewItem {
  return {
    id,
    label: '翻前位置的力量',
    category: 'range',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: '2026-01-01',
    metadata: {
      front: 'BTN 面对 UTG 开池，AKs 该如何行动？',
      options: [
        { text: '加注', isCorrect: true, explanation: 'AKs 有强阻断牌，适合再加注' },
        { text: '弃牌', isCorrect: false, explanation: '面对 UTG 开池弃掉 AKs 会损失大量权益' },
      ],
    },
  };
}

function selfEvalItem(id: string): ReviewItem {
  return {
    id,
    label: '再加注的定义',
    category: 'strategy',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: '2026-01-01',
    metadata: { front: '什么是 3-bet？', back: '面对开池再加注' },
  };
}

function minimalItem(id: string): ReviewItem {
  return {
    id,
    label: '底池赔率基本功',
    category: 'odds',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: '2026-01-01',
  };
}

function storedItem(id: string): ReviewItem | undefined {
  return useProgressStore.getState().reviewItems.find((item) => item.id === id);
}

function renderSession(items: ReviewItem[]) {
  const onOpenChange = vi.fn();
  useProgressStore.setState({ reviewItems: items });
  const view = render(
    <ReviewSession open onOpenChange={onOpenChange} initialItems={items} />,
  );
  return { ...view, onOpenChange };
}

afterEach(() => {
  cleanup();
  useProgressStore.setState({ reviewItems: [] });
  vi.restoreAllMocks();
});

describe('ReviewSession 空态', () => {
  it('今日无待复习项时展示空态并可通过确认关闭', () => {
    const { baseElement, getByText, onOpenChange } = renderSession([]);

    expect(baseElement.textContent).toContain('今日复习已完成 ✓');
    expect(baseElement.textContent).toContain('今天没有待复习的内容，下次训练后再来吧！');

    fireEvent.click(getByText('确认'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('ReviewSession 多选题模式', () => {
  it('答对后展示选项解析，并把 SRS 推进一次', () => {
    const item = mcItem('mc-1');
    const { baseElement, getByText } = renderSession([item]);

    expect(baseElement.textContent).toContain('1 / 1');
    expect(baseElement.textContent).toContain('BTN 面对 UTG 开池，AKs 该如何行动？');

    fireEvent.click(getByText('加注'));

    // 作答后给出解析与推进按钮
    expect(baseElement.textContent).toContain('AKs 有强阻断牌，适合再加注');
    expect(baseElement.textContent).toContain('完成复习');

    const updated = storedItem('mc-1');
    expect(updated?.repetitions).toBe(1);
    expect(updated?.nextReviewDate).not.toBe('2026-01-01');
  });

  it('答错后 SRS 重置连续正确次数并下调难度因子', () => {
    const { getByText, baseElement } = renderSession([mcItem('mc-wrong')]);

    fireEvent.click(getByText('弃牌'));

    const updated = storedItem('mc-wrong');
    expect(updated?.repetitions).toBe(0);
    expect(updated?.easeFactor).toBeLessThan(2.5);
    // 作答后展示「所选项」的解析
    expect(baseElement.textContent).toContain('面对 UTG 开池弃掉 AKs 会损失大量权益');
  });
});

describe('ReviewSession 自评模式', () => {
  it('先显示答案再自评，「记得」写入 SRS', () => {
    const { baseElement, getByText } = renderSession([selfEvalItem('self-1')]);

    // 未显示答案：只有「显示答案」，没有自评按钮
    expect(baseElement.textContent).not.toContain('面对开池再加注');
    expect(baseElement.textContent).not.toContain('记得');

    fireEvent.click(getByText('显示答案'));

    expect(baseElement.textContent).toContain('面对开池再加注');
    expect(baseElement.textContent).toContain('答案');

    fireEvent.click(getByText('记得'));

    expect(storedItem('self-1')?.repetitions).toBe(1);
    expect(baseElement.textContent).toContain('完成复习');
  });

  it('「不记得」同样写入 SRS 并保留 easeFactor 下降', () => {
    const { getByText } = renderSession([selfEvalItem('self-2')]);

    fireEvent.click(getByText('显示答案'));
    fireEvent.click(getByText('不记得'));

    const updated = storedItem('self-2');
    expect(updated?.repetitions).toBe(0);
    expect(updated?.easeFactor).toBeLessThan(2.5);
  });
});

describe('ReviewSession 退化自评与队列推进', () => {
  it('metadata 缺失时退化为自评模式，仍可完成复习', () => {
    const { baseElement, getByText } = renderSession([minimalItem('min-1')]);

    expect(baseElement.textContent).toContain('请回忆该知识点的关键内容，自评是否记得。');

    fireEvent.click(getByText('显示答案'));
    fireEvent.click(getByText('记得'));

    expect(storedItem('min-1')?.repetitions).toBe(1);
    expect(baseElement.textContent).toContain('完成复习');
  });

  it('两题队列答完一题出现「下一题」，末题「完成复习」进入总结页', () => {
    // 两题同为自评模式：AnimatePresence mode="wait" 的退出动画在 jsdom 无帧推进，
    // 跨模式切换会留下空窗，故队列推进用同模式题目
    const items = [selfEvalItem('q1'), { ...selfEvalItem('q2'), metadata: { front: '什么是冷跟注？', back: '不开池直接跟注' } }];
    const { baseElement, getByText, onOpenChange } = renderSession(items);

    fireEvent.click(getByText('显示答案'));
    fireEvent.click(getByText('记得'));
    fireEvent.click(getByText('下一题'));

    expect(baseElement.textContent).toContain('2 / 2');
    expect(baseElement.textContent).toContain('什么是冷跟注？');

    fireEvent.click(getByText('显示答案'));
    fireEvent.click(getByText('不记得')); // 第二题答错 → 总结页正确率 50%
    fireEvent.click(getByText('完成复习'));

    // 总结页：2 题、答对 1 题、正确率 50%
    expect(baseElement.textContent).toContain('总题数2');
    expect(baseElement.textContent).toContain('答对1');
    expect(baseElement.textContent).toContain('正确率50%');

    fireEvent.click(getByText('确认'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
