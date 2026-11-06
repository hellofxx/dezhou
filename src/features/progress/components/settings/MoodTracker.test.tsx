import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import MoodTracker from './MoodTracker';
import { useProgressStore } from '../../store';
import { DEFAULT_EMOTION_STATE, type EmotionState } from '../../types';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';

/**
 * MoodTracker 今日情绪（jsdom）。
 *
 * 契约：
 * - 三档情绪按钮写入 store 的 emotion.todayMood + moodDate（今日才回显选中）；
 * - 今日正确率只在 dailyQuestionsDate 是今天时展示，否则「暂无数据」；
 * - 情绪与正确率的关联文案按四支渲染（好+高 / 差+低 / 差+高 / 其他）。
 */

const TODAY = toLocalDateKey(Date.now());

function seedEmotion(partial: Partial<EmotionState>) {
  useProgressStore.setState({ emotion: { ...DEFAULT_EMOTION_STATE, ...partial } });
}

beforeEach(() => seedEmotion({}));

afterEach(() => {
  cleanup();
  seedEmotion({});
});

describe('MoodTracker 今日情绪', () => {
  it('无答题数据时展示三档按钮与「暂无数据」', () => {
    const { container } = render(<MoodTracker />);
    const text = container.textContent ?? '';

    expect(text).toContain('今日情绪');
    expect(text).toContain('好');
    expect(text).toContain('一般');
    expect(text).toContain('差');
    expect(text).toContain('今日正确率');
    expect(text).toContain('暂无数据');
  });

  it('点击情绪按钮写入 store 并回显 aria-pressed', () => {
    const { container } = render(<MoodTracker />);
    const goodButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('好'),
    );
    expect(goodButton).toBeTruthy();
    expect(goodButton!.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(goodButton!);

    const emotion = useProgressStore.getState().emotion;
    expect(emotion.todayMood).toBe('good');
    expect(emotion.moodDate).toBe(TODAY);
    expect(goodButton!.getAttribute('aria-pressed')).toBe('true');
  });

  it('昨日情绪标记不当作今日选中', () => {
    seedEmotion({ todayMood: 'bad', moodDate: '2020-01-01' });

    const { container } = render(<MoodTracker />);
    const pressed = Array.from(container.querySelectorAll('button')).filter(
      (b) => b.getAttribute('aria-pressed') === 'true',
    );

    expect(pressed).toHaveLength(0);
  });

  it('今日正确率按 dailyCorrect / dailyTotal 计算', () => {
    seedEmotion({ dailyQuestionsDate: TODAY, dailyCorrect: 8, dailyTotal: 10 });

    const { container } = render(<MoodTracker />);

    expect(container.textContent).toContain('80% (8/10)');
  });

  it('情绪为「好」且正确率 ≥70% 时给出正面关联文案', () => {
    seedEmotion({ todayMood: 'good', moodDate: TODAY, dailyQuestionsDate: TODAY, dailyCorrect: 9, dailyTotal: 10 });

    const { container } = render(<MoodTracker />);

    expect(container.textContent).toContain('状态不错，正确率也高');
  });

  it('情绪为「差」且正确率 <50% 时建议休息', () => {
    seedEmotion({ todayMood: 'bad', moodDate: TODAY, dailyQuestionsDate: TODAY, dailyCorrect: 2, dailyTotal: 10 });

    const { container } = render(<MoodTracker />);

    expect(container.textContent).toContain('建议休息一下');
  });

  it('情绪为「差」但正确率尚可时提示疲劳累积', () => {
    seedEmotion({ todayMood: 'bad', moodDate: TODAY, dailyQuestionsDate: TODAY, dailyCorrect: 7, dailyTotal: 10 });

    const { container } = render(<MoodTracker />);

    expect(container.textContent).toContain('注意疲劳累积');
  });

  it('情绪为「一般」时给出中性关联文案', () => {
    seedEmotion({ todayMood: 'neutral', moodDate: TODAY, dailyQuestionsDate: TODAY, dailyCorrect: 5, dailyTotal: 10 });

    const { container } = render(<MoodTracker />);

    expect(container.textContent).toContain('记录持续累积后可发现情绪与正确率的关联');
  });
});
