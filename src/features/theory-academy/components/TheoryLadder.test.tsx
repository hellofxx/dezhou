import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import type {
  PracticeRecommendation,
  TheoryChapterSummary,
  TheoryLevelNumber,
  TheoryLevelSummary,
} from '../types';
import { TheoryLadder, findActiveTheoryLevelId } from './TheoryLadder';

/**
 * 理论进阶阶梯契约（jsdom）。
 * - 锁定等级：头部禁用、显示解锁要求、不展开章节
 * - 解锁等级：核心章进度条、活跃等级自动展开并标「你在这里」
 * - 章节 chip：四态标签（已读/下一章/未解锁/可选）、小测分三档徽章、点击进章节页
 * - 头部点击落点：首个未完成核心章 → 未完成增补章 → 核心首章
 * - 全完成：实践推荐 CTA 优先轨道，其次首个推荐课时，无推荐则不渲染
 * - findActiveTheoryLevelId：首个解锁且仍有未读核心章的等级（增补章不参与）
 *
 * 未覆盖（jsdom 无法判定）：发线脊柱视觉、<768px 布局、预取的真实收益。
 */

MotionGlobalConfig.skipAnimations = true;

const loadSpy = vi.hoisted(() => vi.fn());

// 懒加载边界：记录预取调用，其余行为保持真实实现
vi.mock('../data/levels/loaders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/levels/loaders')>();
  return {
    ...actual,
    loadTheoryLevelById: (levelId: string) => {
      loadSpy(levelId);
      return actual.loadTheoryLevelById(levelId);
    },
  };
});

function mkChapter(
  id: string,
  order: number,
  extra: Partial<TheoryChapterSummary> = {},
): TheoryChapterSummary {
  return {
    id,
    level: 1,
    order,
    title: `${id} 标题`,
    subtitle: '',
    duration: '12 min',
    variant: 'standard',
    ...extra,
  };
}

function mkLevel(
  levelNo: TheoryLevelNumber,
  chapters: TheoryChapterSummary[],
  recommendation: PracticeRecommendation = { lessons: [] },
): TheoryLevelSummary {
  return {
    id: `tl${levelNo}`,
    level: levelNo,
    tier: 'basic',
    title: `T${levelNo} 标题`,
    description: `T${levelNo} 描述`,
    icon: '🎲',
    chapters,
    unlockRequirement: '完成前一级所有章节',
    practiceRecommendations: recommendation,
    variant: 'standard',
  };
}

const [c1, c2, c3, s1] = [
  mkChapter('lad-c1', 1),
  mkChapter('lad-c2', 2),
  mkChapter('lad-c3', 3),
  mkChapter('lad-s1', 4, { supplemental: true }),
];
const c4 = mkChapter('lad-c4', 1);
const c5 = mkChapter('lad-c5', 1);

const lv1 = mkLevel(1, [c1!, c2!, c3!, s1!], { lessons: [], trackId: 'track-theory-bridge' });
const lv2 = mkLevel(2, [c4], { lessons: [{ id: 'l2-lesson', title: '推荐课时' }] });
const lv3 = mkLevel(3, [c5], { lessons: [] });

function LocationProbe() {
  const routerLocation = useLocation();
  return <div data-testid="location">{`${routerLocation.pathname}${routerLocation.search}`}</div>;
}

function renderLadder(
  levels: TheoryLevelSummary[],
  completedChapters: string[],
  quizScores: Record<string, number> = {},
  isUnlocked: (levelId: string) => boolean = () => true,
) {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <TheoryLadder
        levels={levels}
        completedChapters={completedChapters}
        quizScores={quizScores}
        isUnlocked={isUnlocked}
      />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

function heads(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll<HTMLButtonElement>('button.level-row-head')];
}

function chips(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll<HTMLButtonElement>('button.lesson-chip')];
}

function applyPracticeButtons(container: HTMLElement): HTMLButtonElement[] {
  const label = i18n.t('theory.ladder.applyPractice');
  return [...container.querySelectorAll<HTMLButtonElement>('button')].filter((button) =>
    (button.textContent ?? '').includes(label),
  );
}

function location(): string {
  return screen.getByTestId('location').textContent ?? '';
}

beforeEach(() => {
  loadSpy.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('TheoryLadder 锁定与解锁', () => {
  it('未解锁等级：头部禁用、显示解锁要求、不展开章节', () => {
    const { container } = renderLadder([lv1, lv2], [], {}, (levelId) => levelId === 'tl1');

    const [unlockedHead, lockedHead] = heads(container);
    expect(lockedHead!.disabled).toBe(true);
    expect(lockedHead!.getAttribute('aria-expanded')).toBeNull();
    expect(lockedHead!.textContent).toContain(lv2.unlockRequirement);
    expect(lockedHead!.textContent).not.toContain(lv2.description);
    // 只有已解锁且活跃的 tl1 展开
    expect(unlockedHead!.disabled).toBe(false);
    expect(chips(container).map((chip) => chip.getAttribute('aria-label'))).toEqual(
      expect.arrayContaining([expect.stringContaining('lad-c1 标题')]),
    );
    expect(chips(container)).toHaveLength(4);
  });

  it('活跃等级核心章进度与「你在这里」标记按核心章口径', () => {
    const { container } = renderLadder([lv1, lv2], ['lad-c1']);

    expect(screen.getByText(i18n.t('theory.ladder.youAreHere'))).toBeTruthy();
    expect(
      screen.getAllByText(i18n.t('theory.ladder.chapterDone', { done: 1, total: 3 })).length,
    ).toBeGreaterThan(0);
    const bars = [...container.querySelectorAll<HTMLElement>('[style]')].filter(
      (node) => node.style.width === '33%',
    );
    expect(bars.length, '缺少 1/3 进度条').toBe(1);
  });

  it('章节 chip 四态标签与阅读时长', () => {
    const { container } = renderLadder([lv1], ['lad-c1']);
    const states = i18n.t('theory.ladder.chapterStates', { returnObjects: true }) as Record<
      string,
      string
    >;

    const labels = chips(container).map((chip) => chip.getAttribute('aria-label') ?? '');
    expect(labels[0]).toBe(`${states['done']} · lad-c1 标题`);
    expect(labels[1]).toBe(`${states['current']} · lad-c2 标题`);
    expect(labels[2]).toBe(`${states['locked']} · lad-c3 标题`);
    expect(labels[3]).toBe(`${states['optional']} · lad-s1 标题`);
    // 增补章未读时带「可选」徽章，时长去掉单位后缀
    expect(chips(container)[3]!.textContent).toContain(states['optional']);
    expect(chips(container)[0]!.textContent).toContain('12');
    expect(chips(container)[0]!.textContent).not.toContain('min');
  });

  it('已读章节按小测分渲染三档徽章，点击 chip 进入章节页', () => {
    const { container } = renderLadder([lv1], ['lad-c1', 'lad-c2', 'lad-c3'], {
      'lad-c1': 90,
      'lad-c2': 70,
      'lad-c3': 50,
    });
    // 核心章读完后该等级不再是活跃等级，需点击头部展开
    fireEvent.click(heads(container)[0]!);

    const badges = [...container.querySelectorAll<HTMLElement>('.quiz-score-badge')];
    expect(badges).toHaveLength(3);
    expect(badges[0]!.className).toContain('pass');
    expect(badges[1]!.className).toContain('mid');
    expect(badges[2]!.className).toContain('low');
    expect(badges[0]!.textContent).toContain(i18n.t('theory.ladder.quizScore', { score: 90 }));

    fireEvent.click(chips(container)[0]!);
    expect(location()).toBe('/theory/chapter/lad-c1');
  });
});

describe('TheoryLadder 头部点击落点', () => {
  it('已展开且有未读核心章时进入首个未读核心章', () => {
    const { container } = renderLadder([lv1], ['lad-c1']);
    fireEvent.click(heads(container)[0]!);
    expect(location()).toBe('/theory/chapter/lad-c2');
  });

  it('核心章读完后回退到未读增补章，全部读完则回核心首章', () => {
    const { container } = renderLadder([lv1], ['lad-c1', 'lad-c2', 'lad-c3']);
    // 核心章读完 → 不再是活跃等级 → 首次点击仅展开，再次点击才跳转
    fireEvent.click(heads(container)[0]!);
    expect(location()).toBe('/theory');
    fireEvent.click(heads(container)[0]!);
    expect(location()).toBe('/theory/chapter/lad-s1');
    cleanup();

    const second = renderLadder([lv1], ['lad-c1', 'lad-c2', 'lad-c3', 'lad-s1']);
    fireEvent.click(heads(second.container)[0]!);
    fireEvent.click(heads(second.container)[0]!);
    expect(location()).toBe('/theory/chapter/lad-c1');
  });

  it('折叠的解锁等级点击头部只展开，且同时只展开一个等级', () => {
    const { container } = renderLadder([lv1, lv2], ['lad-c1']);
    expect(chips(container)).toHaveLength(4);

    fireEvent.click(heads(container)[1]!);
    // 展开 lv2 会收起 lv1（单展开），不产生跳转
    expect(chips(container)).toHaveLength(1);
    expect(chips(container)[0]!.getAttribute('aria-label')).toContain('lad-c4 标题');
    expect(location()).toBe('/theory');
  });
});

describe('TheoryLadder 全完成后的实践推荐', () => {
  it('优先推荐学习轨道', () => {
    const { container } = renderLadder([lv1], ['lad-c1', 'lad-c2', 'lad-c3']);
    // 全完成等级默认折叠，展开后才渲染实践 CTA
    fireEvent.click(heads(container)[0]!);
    const cta = applyPracticeButtons(container);
    expect(cta).toHaveLength(1);

    fireEvent.click(cta[0]!);
    expect(location()).toBe('/academy/tracks?track=track-theory-bridge');
  });

  it('无轨道时指向首个推荐课时；无任何推荐则不渲染 CTA', () => {
    const completed = ['lad-c1', 'lad-c2', 'lad-c3', 'lad-s1', 'lad-c4', 'lad-c5'];
    const { container } = renderLadder([lv1, lv2, lv3], completed);
    // 全部核心章已读完 → 无活跃等级 → 默认不展开任何行
    expect(applyPracticeButtons(container)).toHaveLength(0);

    fireEvent.click(heads(container)[1]!);
    const cta = applyPracticeButtons(container);
    expect(cta).toHaveLength(1);
    fireEvent.click(cta[0]!);
    expect(location()).toBe('/academy/lesson/l2-lesson');
    cleanup();

    const third = renderLadder([lv3], ['lad-c5']);
    fireEvent.click(heads(third.container)[0]!);
    expect(applyPracticeButtons(third.container)).toHaveLength(0);
  });

  it('悬停阶梯或章节列表时预取对应等级', () => {
    const { container } = renderLadder([lv1, lv2], ['lad-c1']);
    fireEvent.pointerOver(container.querySelector('section')!);
    expect(loadSpy).toHaveBeenCalledWith('tl1');

    loadSpy.mockClear();
    fireEvent.pointerOver(container.querySelector('.lesson-chip-grid')!);
    expect(loadSpy).toHaveBeenCalledWith('tl1');
  });
});

describe('findActiveTheoryLevelId', () => {
  it('返回首个解锁且仍有未读核心章的等级，增补章不参与', () => {
    expect(findActiveTheoryLevelId([lv1, lv2], [], () => false)).toBeNull();
    expect(findActiveTheoryLevelId([lv1, lv2], [], () => true)).toBe('tl1');
    expect(findActiveTheoryLevelId([lv1, lv2], ['lad-c1'], () => true)).toBe('tl1');
    expect(
      findActiveTheoryLevelId([lv1, lv2], ['lad-c1', 'lad-c2', 'lad-c3'], () => true),
    ).toBe('tl2');
    // 核心章读完即视为本等级读完（增补章未读不影响）
    expect(findActiveTheoryLevelId([lv1], ['lad-c1', 'lad-c2', 'lad-c3'], () => true)).toBeNull();
  });
});
