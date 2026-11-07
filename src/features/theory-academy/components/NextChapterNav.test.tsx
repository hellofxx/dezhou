/**
 * NextChapterNav 主 CTA 收口回归（V1 视觉批次）。
 *
 * 覆盖：① 解锁态走 `Button variant="default"`（btn-brass 金属件 + min-h-11），
 * 不再使用平铺黄铜底（bg-[var(--brass-fill)] / hover:opacity-90）；
 * ② onClick 逻辑未变：点击跳转 `/theory/chapter/<下一章 id>`；
 * ③ 未解锁态仍是不可点击的提示文案（不渲染任何 button）。
 * 不引入 testing-library，沿用仓库既有 react-dom/client + act 模式。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '@/i18n/config';
import { NextChapterNav } from './NextChapterNav';
import type { TheoryChapterSummary } from '../types';

const t = i18n.t.bind(i18n);

const NEXT_CHAPTER: TheoryChapterSummary = {
  id: 't1-nav-next-sample',
  level: 1,
  order: 2,
  title: '测试下一章',
  subtitle: '下一章导航回归',
  duration: '8 min',
  variant: 'standard',
};

/** 路由探针：把当前 pathname 渲染成文本，供断言跳转结果 */
function LocationProbe() {
  const location = useLocation();
  return <span>{location.pathname}</span>;
}

let container: HTMLDivElement | undefined;
let root: Root | undefined;

function mount(unlocked: boolean) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(
      <MemoryRouter initialEntries={['/theory/start']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <NextChapterNav nextChapter={NEXT_CHAPTER} unlocked={unlocked} />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
  });
  return container;
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('NextChapterNav 主 CTA', () => {
  it('解锁态：按钮走 Button 金属件（btn-brass + min-h-11），文案含章节标题', () => {
    const el = mount(true);
    const cta = el.querySelector('button');
    expect(cta, '解锁态必须渲染下一章按钮').not.toBeNull();
    expect(cta!.className).toContain('btn-brass');
    expect(cta!.className).toContain('min-h-11');
    expect(cta!.className).not.toContain('bg-[var(--brass-fill)]');
    expect(cta!.className).not.toContain('hover:opacity-90');
    expect(cta!.textContent).toContain('下一章');
    expect(cta!.textContent).toContain(NEXT_CHAPTER.title);
  });

  it('解锁态：点击跳转到下一章路由（onClick 逻辑保留）', () => {
    const el = mount(true);
    const cta = el.querySelector('button');
    act(() => {
      cta!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(el.textContent).toContain(`/theory/chapter/${NEXT_CHAPTER.id}`);
  });

  it('未解锁态：不渲染按钮，只显示解锁提示文案', () => {
    const el = mount(false);
    expect(el.querySelector('button')).toBeNull();
    expect(el.textContent).toContain(
      t('theory.bridge.lockedHint', { title: NEXT_CHAPTER.title }),
    );
  });
});
