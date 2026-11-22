import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LessonContent } from './LessonContent';
import { useAcademyStore } from '../store';
import type { Lesson, LessonUnit } from '../types';

/**
 * 渐进披露契约（Fix 4，仅标准分支；纯理论分支全量渲染见 LessonContent.test）：
 * - 未来小节渲染折叠头（id 锚点恒在），正文不可见
 * - 折叠头点击仅本地展开，不影响其他小节
 * - CTA 推进释放下一节（revealedUpTo 派生，无需手动展开）
 * - URL hash 直达与回访完成记录同样释放披露
 */

const originalScrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
  if (originalScrollIntoView) {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  } else {
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  }
});

const units: LessonUnit[] = [
  { id: 'u1', title: '第一节', sections: [{ type: 'text', content: '第一节正文' }] },
  { id: 'u2', title: '第二节', sections: [{ type: 'text', content: '第二节正文' }] },
  { id: 'u3', title: '第三节', sections: [{ type: 'text', content: '第三节正文' }] },
];

const practice = {
  id: 'disclosure-practice',
  questions: [
    {
      id: 'pq1',
      scenario: {
        heroHand: ['As', 'Ks'] as [string, string],
        heroPosition: 'BTN',
        previousActions: [],
        street: 'preflop' as const,
        potSize: 5,
        effectiveStack: 100,
      },
      options: [{ action: 'Call', isCorrect: true, explanation: '跟注。' }],
    },
  ],
};

function makeLesson(): Lesson {
  return {
    id: 'disclosure-fixture',
    level: 1,
    order: 1,
    title: '测试课程',
    subtitle: '',
    duration: '5 min',
    content: [],
    quiz: [],
    units,
    practice,
  };
}

function renderContent(initialEntry = '/lesson') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LessonContent lesson={makeLesson()} onComplete={() => {}} />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
});

describe('LessonContent：渐进披露', () => {
  it('未来小节折叠：正文不可见，折叠头保留 id 锚点与展开入口', () => {
    const { container } = renderContent();

    expect(screen.getByText('第一节正文')).toBeTruthy();
    expect(screen.queryByText('第二节正文')).toBeNull();
    expect(screen.queryByText('第三节正文')).toBeNull();
    expect(screen.getAllByText('展开本节')).toHaveLength(2);
    expect(container.querySelector('#u2')).not.toBeNull();
    expect(container.querySelector('#u3')).not.toBeNull();
  });

  it('点击折叠头仅本地展开该节，其余未来节保持折叠', () => {
    renderContent();

    fireEvent.click(screen.getAllByText('展开本节')[0]!);
    expect(screen.getByText('第二节正文')).toBeTruthy();
    expect(screen.queryByText('第三节正文')).toBeNull();
    expect(screen.getAllByText('展开本节')).toHaveLength(1);
  });

  it('CTA 推进释放下一节（无需手动展开）', () => {
    renderContent();

    fireEvent.click(screen.getByText('进入下一节：第二节'));
    expect(screen.getByText('第二节正文')).toBeTruthy();
    expect(screen.queryByText('第三节正文')).toBeNull();
    expect(screen.getAllByText('展开本节')).toHaveLength(1);
  });

  it('URL hash 直达小节时同步释放披露', () => {
    renderContent('/lesson#u3');

    expect(screen.getByText('第三节正文')).toBeTruthy();
    expect(screen.getByText('第一节正文')).toBeTruthy();
    expect(screen.queryByText('展开本节')).toBeNull();
  });

  it('回访已完成小节：披露水位覆盖完成记录，其后小节仍折叠', () => {
    useAcademyStore.getState().markUnitCompleted('disclosure-fixture', 'u2');
    renderContent();

    expect(screen.getByText('第一节正文')).toBeTruthy();
    expect(screen.getByText('第二节正文')).toBeTruthy();
    expect(screen.queryByText('第三节正文')).toBeNull();
    expect(screen.getAllByText('展开本节')).toHaveLength(1);
  });
});