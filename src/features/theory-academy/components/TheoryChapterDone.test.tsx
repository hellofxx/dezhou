/**
 * 章末完成态返回收敛回归（B1-1 来源感知返回）。
 *
 * 覆盖：① 双返回（「回到课程枢纽」直链 + 「返回目录」）收敛为单一来源感知返回按钮；
 * ② backLabel 覆盖文案、缺省回退章节目录文案；③ 重考 / 检查点入口仍保留。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { findChapterById, findLevelByChapterId } from '../utils/theoryProgress';
import { TheoryChapterDone } from './TheoryChapterDone';

MotionGlobalConfig.skipAnimations = true;

const CHAPTER_ID = 't1-combinatorics';
const chapter = findChapterById(CHAPTER_ID)!;
const level = findLevelByChapterId(CHAPTER_ID)!;

let container: HTMLDivElement;
let root: Root;

async function mount(overrides: { backLabel?: string; onRetry?: () => void } = {}) {
  await act(async () => {
    root.render(
      <MemoryRouter>
        <TheoryChapterDone
          result={{ score: 80, correct: 4, total: 5 }}
          chapter={chapter}
          level={level}
          levelCompleted
          nextChapter={undefined}
          nextChapterUnlocked={false}
          onRetry={overrides.onRetry ?? (() => {})}
          onBackToChapters={() => {}}
          {...(overrides.backLabel === undefined ? {} : { backLabel: overrides.backLabel })}
        />
      </MemoryRouter>,
    );
  });
}

function buttons(): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('button'));
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  void i18n.changeLanguage('zh');
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  void i18n.changeLanguage('zh');
});

describe('TheoryChapterDone 返回收敛', () => {
  it('只保留单一来源感知返回按钮，不再有 /lesson 直链', async () => {
    await mount({ backLabel: '返回课程目录' });
    // 原「回到课程枢纽」直链已删除（返回目标由来源 state 解析）
    const lessonLinks = Array.from(container.querySelectorAll('a')).filter(
      (a) => a.getAttribute('href') === '/lesson',
    );
    expect(lessonLinks).toHaveLength(0);
    const back = buttons().filter((b) => (b.textContent ?? '').includes('返回课程目录'));
    expect(back).toHaveLength(1);
  });

  it('缺省 backLabel 回退章节目录文案', async () => {
    await mount();
    expect(
      buttons().some((b) =>
        (b.textContent ?? '').includes(i18n.t('theory.chapterView.backToChapters')),
      ),
    ).toBe(true);
  });

  it('重考与检查点入口保留', async () => {
    let retried = 0;
    await mount({ backLabel: '返回课程目录', onRetry: () => { retried += 1; } });
    const retry = buttons().find((b) =>
      (b.textContent ?? '').includes(i18n.t('theory.retryQuiz')),
    );
    expect(retry).toBeDefined();
    await act(async () => {
      (retry as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(retried).toBe(1);
    const checkpoint = Array.from(container.querySelectorAll('a')).find((a) =>
      (a.getAttribute('href') ?? '').includes('/theory/checkpoint/'),
    );
    expect(checkpoint).toBeDefined();
  });
});