import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { TheoryRecommendationCard } from './TheoryRecommendationCard';

/**
 * 推荐卡契约（jsdom）：
 * - recommendation 为 null（全读完）→ 整卡不渲染
 * - 有效推荐 → 章节标题 + 原因文案 + CTA 链接
 * - 指向不存在章节时静默降级为不渲染（不产生断链）
 * 推荐算法本身在 data/theoryRecommendations.test.ts 覆盖。
 */

MotionGlobalConfig.skipAnimations = true;
afterEach(() => cleanup());

function mount(recommendation: Parameters<typeof TheoryRecommendationCard>[0]['recommendation']) {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <TheoryRecommendationCard recommendation={recommendation} />
    </MemoryRouter>,
  );
}

describe('TheoryRecommendationCard', () => {
  it('null 推荐不渲染任何内容', () => {
    const { container } = mount(null);
    expect(container.textContent).toBe('');
  });

  it('渲染章节标题、原因文案与 CTA 链接', () => {
    mount({ chapterId: 't1-combinatorics', reason: 'math', dimension: 'math' });
    const link = screen.getByRole('link', { name: new RegExp(i18n.t('theory.recommendation.cta')) });
    expect(link.getAttribute('href')).toBe('/theory/chapter/t1-combinatorics');
    expect(screen.getByText(i18n.t('theory.recommendation.reason.math'))).toBeTruthy();
    expect(screen.getByText(i18n.t('theory.recommendation.title'))).toBeTruthy();
  });

  it('fallback 原因走 fallback 文案', () => {
    mount({ chapterId: 't2-ev', reason: 'fallback' });
    expect(screen.getByText(i18n.t('theory.recommendation.reason.fallback'))).toBeTruthy();
  });

  it('章节 id 不在 manifest 内时整卡不渲染', () => {
    const { container } = mount({ chapterId: 'nope', reason: 'math' });
    expect(container.textContent).toBe('');
  });
});
