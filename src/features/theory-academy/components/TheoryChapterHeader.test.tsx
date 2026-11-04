import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import type { TheoryChapter, TheoryLevelInfo } from '../types';
import { TheoryChapterHeader } from './TheoryChapterHeader';

/**
 * 章节头部阅读工具契约（jsdom）：
 * - 收藏按钮存在时 aria-pressed 反映收藏态，点击回调上层
 * - 未提供回调时不渲染收藏按钮（纯展示场景）
 * - 最近校对日期按 contentOps 数据渲染，缺省不渲染
 * - 报告问题插槽原样挂载（评估侧组件后续批次接入）
 */

MotionGlobalConfig.skipAnimations = true;
afterEach(() => cleanup());

const chapter: TheoryChapter = {
  id: 't1-combinatorics',
  level: 1,
  order: 1,
  title: '组合计数与起手牌概率',
  subtitle: '52 张牌能组合出什么',
  duration: '10 min',
  variant: 'standard',
  eloDimension: 'math',
  objectives: ['说清组合数的乘除结构'],
  content: [{ type: 'text', content: '正文' }],
  quiz: [],
};

const level: TheoryLevelInfo = {
  id: 't1',
  level: 1,
  tier: 'basic',
  title: '概率论基础',
  description: '组合计数',
  icon: '🎲',
  chapters: [chapter],
  unlockRequirement: '无',
  practiceRecommendations: { lessons: [] },
  variant: 'standard',
};

function mount(extra: Partial<Parameters<typeof TheoryChapterHeader>[0]> = {}) {
  return render(
    <TheoryChapterHeader
      chapter={chapter}
      level={level}
      completedChapters={[]}
      chapterCompleted={false}
      {...extra}
    />,
  );
}

describe('TheoryChapterHeader 阅读工具行', () => {
  it('收藏按钮 aria-pressed 反映收藏态并回调', () => {
    const onToggleBookmark = vi.fn();
    mount({ bookmarked: false, onToggleBookmark });
    const button = screen.getByRole('button', { name: i18n.t('theory.bookmarks.add') });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(onToggleBookmark).toHaveBeenCalledTimes(1);
  });

  it('已收藏时文案与 aria-pressed 同步切换', () => {
    mount({ bookmarked: true, onToggleBookmark: vi.fn() });
    const button = screen.getByRole('button', { name: i18n.t('theory.bookmarks.remove') });
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('未提供回调时不渲染收藏按钮', () => {
    mount();
    expect(screen.queryByRole('button', { name: i18n.t('theory.bookmarks.add') })).toBeNull();
  });

  it('有校对日期时渲染标签，缺省不渲染', () => {
    const { unmount } = mount({ lastReviewed: '2026-05-01' });
    expect(
      screen.getByText(i18n.t('theory.contentMeta.lastReviewed', { date: '2026-05-01' })),
    ).toBeTruthy();
    unmount();
    mount();
    expect(screen.queryByText(/2026-05-01/)).toBeNull();
  });

  it('报告问题插槽原样挂载', () => {
    mount({ reportSlot: <button type="button">报错占位</button> });
    expect(screen.getByRole('button', { name: '报错占位' })).toBeTruthy();
  });
});
