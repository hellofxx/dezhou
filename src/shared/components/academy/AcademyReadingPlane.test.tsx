/**
 * AcademyReadingPlane 契约（jsdom）：
 * - 主阅读列与导轨同时渲染
 * - 导轨是带可访问名的 complementary landmark（读屏可跳过 / 定位）
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AcademyReadingPlane } from './AcademyReadingPlane';

afterEach(cleanup);

describe('AcademyReadingPlane', () => {
  it('渲染主列与导轨，导轨带可访问名', () => {
    render(
      <AcademyReadingPlane railLabel="本级章节目录" rail={<nav>目录条目</nav>}>
        <p>正文内容</p>
      </AcademyReadingPlane>,
    );

    expect(screen.getByText('正文内容')).toBeTruthy();
    expect(screen.getByRole('complementary', { name: '本级章节目录' })).toBeTruthy();
    expect(screen.getByText('目录条目')).toBeTruthy();
  });
});
