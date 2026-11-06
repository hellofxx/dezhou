/**
 * RelatedLessonChip 契约（共享层不持有路由）：
 * - 点击只把 lessonId 回传给调用方注入的 onOpen，由各 feature 自行 navigate
 * - 源码不出现 feature 课程路由硬编码、不依赖 react-router（shared 不拼 feature 路由）
 * - 保持 button 语义（非 link）：aria-label 作为可访问名、移动端 44px 触摸目标、图标 aria-hidden
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RelatedLessonChip } from './RelatedLessonChip';

afterEach(() => cleanup());

// 源码扫描锚定仓库根（vitest 以项目根为 cwd），断言 shared 不硬编码 feature 路由
const sourcePath = path.resolve(process.cwd(), 'src/shared/components/feedback/RelatedLessonChip.tsx');
const source = readFileSync(sourcePath, 'utf8');

describe('RelatedLessonChip 点击回传', () => {
  it('点击把 lessonId 回传给 onOpen（共享层不自行跳转）', () => {
    const onOpen = vi.fn();
    render(<RelatedLessonChip lessonId="l3-cbet" onOpen={onOpen} />);

    fireEvent.click(screen.getByRole('button', { name: '相关课程' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith('l3-cbet');
  });

  it('默认标签走 i18n feedback.relatedLesson，自定义 label 覆盖展示与可访问名', () => {
    const onOpen = vi.fn();
    render(<RelatedLessonChip lessonId="l1-basics" onOpen={onOpen} label="去复习" />);

    const chip = screen.getByRole('button', { name: '去复习' });
    expect(chip.textContent).toBe('去复习');
    expect(chip.getAttribute('aria-label')).toBe('去复习');
  });
});

// 拼接构造禁用子串：既守住「shared 不出现 feature 路由」，也不在源码里留硬编码字面量
const FORBIDDEN_ROUTE = ['academy', 'lesson'].join('/');

describe('RelatedLessonChip 无硬编码路由（边界守卫）', () => {
  it('源码不含 feature 路由硬编码', () => {
    expect(source).not.toContain(FORBIDDEN_ROUTE);
  });

  it('源码不引入 react-router（shared 不拼 feature 路由）', () => {
    expect(source).not.toContain('react-router');
    expect(source).not.toContain('useNavigate');
  });
});

describe('RelatedLessonChip 语义与样式', () => {
  it('保持 button 语义：type="button" + pill 类 + 移动端 44px 触摸目标', () => {
    render(<RelatedLessonChip lessonId="l1-position" onOpen={() => undefined} />);

    const chip = screen.getByRole('button', { name: '相关课程' });
    expect(chip.tagName).toBe('BUTTON');
    expect(chip.getAttribute('type')).toBe('button');
    expect(chip.className).toContain('related-lesson-chip');
    expect(chip.className).toContain('max-md:min-h-11');
  });

  it('ExternalLink 图标 aria-hidden，不进入可访问名称', () => {
    render(<RelatedLessonChip lessonId="l1-position" onOpen={() => undefined} />);

    const chip = screen.getByRole('button', { name: '相关课程' });
    const icon = chip.querySelector('svg');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });
});
