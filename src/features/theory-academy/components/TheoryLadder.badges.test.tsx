import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import type { TheoryChapterSummary, TheoryLevelNumber, TheoryLevelSummary } from '../types';
import { TheoryLadder } from './TheoryLadder';

/**
 * 阶梯本批新增标记契约（jsdom）：
 * - 定位免修 Level 显示「已免修」徽章（不改变解锁判定，只做标记）
 * - 核心章读完后出现本级检查点入口，有历史成绩时并列显示最佳分
 * - 章节 chip 的收藏按钮 aria-pressed 反映收藏态并回调；未传回调时不渲染
 *
 * 未覆盖：<768px 布局、发线脊柱视觉。
 */

MotionGlobalConfig.skipAnimations = true;

vi.mock('../data/levels/loaders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/levels/loaders')>();
  return { ...actual, loadTheoryLevelById: () => Promise.resolve(undefined) };
});

afterEach(() => cleanup());

function mkChapter(id: string, order: number): TheoryChapterSummary {
  return {
    id,
    level: 1,
    order,
    title: `${id} 标题`,
    subtitle: '',
    duration: '10 min',
    variant: 'standard',
  };
}

function mkLevel(levelNo: TheoryLevelNumber, chapters: TheoryChapterSummary[]): TheoryLevelSummary {
  return {
    id: `t${levelNo}`,
    level: levelNo,
    tier: 'basic',
    title: `T${levelNo} 标题`,
    description: `T${levelNo} 描述`,
    icon: '🎲',
    chapters,
    unlockRequirement: '无',
    practiceRecommendations: { lessons: [] },
    variant: 'standard',
  };
}

const a1 = mkChapter('badge-a1', 1);
const a2 = mkChapter('badge-a2', 2);
const b1 = mkChapter('badge-b1', 1);
const completedLevel = mkLevel(1, [a1, a2]);
const pendingLevel = mkLevel(2, [b1]);

function mount(extra: Partial<Parameters<typeof TheoryLadder>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <TheoryLadder
        levels={[completedLevel, pendingLevel]}
        completedChapters={[a1.id, a2.id]}
        quizScores={{ [a1.id]: 90, [a2.id]: 80 }}
        isUnlocked={() => true}
        {...extra}
      />
    </MemoryRouter>,
  );
}

/** 展开第 index 个 Level（未展开时点头部即展开） */
function expandLevel(index: number) {
  const heads = [...document.querySelectorAll<HTMLButtonElement>('button.level-row-head')];
  fireEvent.click(heads[index]!);
}

describe('TheoryLadder 定位免修徽章', () => {
  it('creditLevels 内的 Level 显示已免修徽章', () => {
    mount({ creditLevels: ['t1'] });
    expect(screen.getAllByText(i18n.t('theory.level.creditedBadge'))).toHaveLength(1);
  });

  it('无免修记录时不显示徽章', () => {
    mount();
    expect(screen.queryAllByText(i18n.t('theory.level.creditedBadge'))).toHaveLength(0);
  });
});

describe('TheoryLadder 检查点入口', () => {
  it('核心章读完后展开可见检查点入口与历史最佳', () => {
    mount({ checkpoints: { t1: { bestScore: 88 } } });
    expandLevel(0);
    const link = screen.getByRole('link', { name: new RegExp(i18n.t('theory.level.checkpointEntry')) });
    expect(link.getAttribute('href')).toBe('/theory/checkpoint/t1');
    expect(link.textContent).toContain(
      i18n.t('theory.checkpoint.bestScore', { score: 88 }),
    );
  });

  it('未读完本级核心章时不出现检查点入口', () => {
    mount();
    expandLevel(1);
    expect(
      screen.queryByRole('link', { name: new RegExp(i18n.t('theory.level.checkpointEntry')) }),
    ).toBeNull();
  });
});

describe('TheoryLadder 章节收藏', () => {
  it('展开后每个 chip 带收藏按钮，已收藏项 aria-pressed=true 并可回调', () => {
    const onToggleBookmark = vi.fn();
    mount({ bookmarkedChapters: [a1.id], onToggleBookmark });
    expandLevel(0);
    const pressed = screen
      .getAllByRole('button', { name: new RegExp(i18n.t('theory.bookmarks.remove')) })
      .find((button) => button.getAttribute('aria-pressed') === 'true');
    expect(pressed).toBeTruthy();
    fireEvent.click(pressed!);
    expect(onToggleBookmark).toHaveBeenCalledWith(a1.id);
  });

  it('未传回调时不渲染收藏按钮', () => {
    mount();
    expandLevel(0);
    expect(
      screen.queryByRole('button', { name: new RegExp(i18n.t('theory.bookmarks.add')) }),
    ).toBeNull();
  });
});
