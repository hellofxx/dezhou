import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import SettingsNav from './SettingsNav';

/**
 * SettingsNav 设置页分区台卡导航（jsdom）。
 *
 * 契约：
 * - 只渲染 sectionIds 内的分区项，文案走 zh i18n；
 * - 点击分区立即标记激活 + 通知父组件（强制展开折叠分区）+ 平滑滚动到对应 section；
 * - 点击后的短窗口内忽略 scroll spy，避免 IO/滚动反馈把高亮改回初始项；
 * - scroll spy 用 getBoundingClientRect 找「越过 trigger 线」的最后分区，缺失 section 跳过；
 * - 内容溢出且滚到底部时强制激活最后一个分区（短内容/不可滚场景由点击兜底）。
 *
 * 环境：jsdom 无布局与 scrollIntoView 实现，故 requestAnimationFrame 换成微任务 stub、
 * 每个 section 覆写 getBoundingClientRect / scrollIntoView，main 的 scroll* 用 defineProperty 注入。
 */

const SECTION_IDS = ['appearance', 'coach', 'training'];

interface DomFixture {
  main: HTMLElement;
  /** 可变的 section 顶部坐标（px），修改后下一次 spy 重算生效 */
  tops: Record<string, number>;
  section: (id: string) => HTMLElement;
}

const EMPTY_RECT = {
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
};

/** 在 body 内构造 <main> + 各 settings-section-<id> 分区 */
function mountSections(sectionIds: string[]): DomFixture {
  const main = document.createElement('main');
  document.body.appendChild(main);
  const tops: Record<string, number> = {};
  const elements = new Map<string, HTMLElement>();

  for (const id of sectionIds) {
    tops[id] = 999; // 默认全部位于 trigger 线下方
    const el = document.createElement('div');
    el.id = `settings-section-${id}`;
    el.getBoundingClientRect = () =>
      ({ ...EMPTY_RECT, top: tops[id] ?? 999 } as unknown as DOMRect);
    el.scrollIntoView = vi.fn();
    main.appendChild(el);
    elements.set(id, el);
  }

  return {
    main,
    tops,
    section: (id: string) => {
      const el = elements.get(id);
      if (!el) throw new Error(`fixture 缺少 section ${id}`);
      return el;
    },
  };
}

/** 注入滚动几何（jsdom 不做布局，scroll* 恒为 0，必须自建） */
function setScrollGeometry(
  main: HTMLElement,
  geometry: { scrollHeight: number; clientHeight: number; scrollTop: number },
): void {
  for (const [key, value] of Object.entries(geometry)) {
    Object.defineProperty(main, key, { value, configurable: true });
  }
}

/** 触发一次 scroll 并让 rAF stub 排入的微任务完成（scroll spy 在 rAF 内重算） */
async function fireScroll(main: HTMLElement): Promise<void> {
  await act(async () => {
    fireEvent.scroll(main);
    await Promise.resolve();
    await Promise.resolve();
  });
}

function itemButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('nav button'));
}

function activeLabel(container: HTMLElement): string | null {
  const active = itemButtons(container).find((b) => b.getAttribute('aria-current') === 'true');
  return active?.textContent ?? null;
}

beforeEach(() => {
  // 组件在 rAF 内重算 spy；jsdom 的真 rAF 走定时器，测试内换成微任务以同步断言
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queueMicrotask(() => cb(0));
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('SettingsNav 分区项渲染', () => {
  it('只渲染 sectionIds 内的分区，导航带 zh 可访问名与激活态初始项', () => {
    mountSections(SECTION_IDS);

    const { container, getByLabelText } = render(
      <SettingsNav sectionIds={['appearance', 'data']} />,
    );

    const nav = getByLabelText('设置分区导航');
    expect(nav.tagName).toBe('NAV');
    expect(itemButtons(container).map((b) => b.textContent)).toEqual(['外观', '数据管理']);
    // 未在 sectionIds 内的分区（教练风格 / 训练偏好等）不渲染
    expect(container.textContent).not.toContain('教练风格');
    // 初始激活项 = sectionIds[0]
    expect(itemButtons(container)[0]?.getAttribute('aria-current')).toBe('true');
    expect(itemButtons(container)[0]?.className).toContain('active');
    expect(itemButtons(container)[1]?.getAttribute('aria-current')).toBeNull();
  });

  it('sectionIds 为空时不渲染任何分区项', () => {
    mountSections(SECTION_IDS);
    const { container } = render(<SettingsNav sectionIds={[]} />);

    expect(itemButtons(container)).toHaveLength(0);
  });

  it('页面没有 <main> 滚动容器时不挂载 spy 也不抛错，点击仍可激活', () => {
    const { container } = render(<SettingsNav sectionIds={SECTION_IDS} />);

    fireEvent.click(itemButtons(container)[1]!);

    expect(activeLabel(container)).toBe('教练风格');
  });
});

describe('SettingsNav 点击激活', () => {
  it('点击分区立即激活、通知父组件并平滑滚动到对应 section', () => {
    const fixture = mountSections(SECTION_IDS);
    const onActivate = vi.fn();
    const { container } = render(
      <SettingsNav sectionIds={SECTION_IDS} onActivate={onActivate} />,
    );

    fireEvent.click(itemButtons(container)[2]!); // 训练偏好

    expect(onActivate).toHaveBeenCalledWith('training');
    expect(fixture.section('training').scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    expect(itemButtons(container)[2]?.getAttribute('aria-current')).toBe('true');
    expect(itemButtons(container)[2]?.className).toContain('active');
    expect(itemButtons(container)[0]?.getAttribute('aria-current')).toBeNull();
  });

  it('未传 onActivate 时点击仍切换激活态且不抛错', () => {
    mountSections(SECTION_IDS);
    const { container } = render(<SettingsNav sectionIds={SECTION_IDS} />);

    fireEvent.click(itemButtons(container)[1]!);

    expect(activeLabel(container)).toBe('教练风格');
  });
});

describe('SettingsNav 滚动 spy', () => {
  it('越过 trigger 线的最后一个分区被激活，缺失 section 的 id 被跳过', async () => {
    const fixture = mountSections(['appearance', 'coach']);
    // 'about' 无对应 DOM 节点：覆盖 getElementById 返回 null 的分支
    const { container } = render(
      <SettingsNav sectionIds={['appearance', 'coach', 'about']} />,
    );

    expect(activeLabel(container)).toBe('外观');

    fixture.tops.coach = 60; // ≤ TRIGGER(120)，成为「已越过」的最后一项
    await fireScroll(fixture.main);

    expect(activeLabel(container)).toBe('教练风格');
  });

  it('没有任何分区越过触发线时保持初始激活项', async () => {
    const fixture = mountSections(['appearance', 'coach']);
    const { container } = render(<SettingsNav sectionIds={['appearance', 'coach']} />);

    await fireScroll(fixture.main); // 全部 top=999，均未越过

    expect(activeLabel(container)).toBe('外观');
  });

  it('内容溢出且滚到底部时强制激活最后一个分区', async () => {
    const fixture = mountSections(['appearance', 'coach']);
    const { container } = render(<SettingsNav sectionIds={['appearance', 'coach']} />);
    expect(activeLabel(container)).toBe('外观');

    // remaining = 1000 - 460 - 500 = 40 < 60 且 scrollTop > 80 → 强制最后一项
    setScrollGeometry(fixture.main, { scrollHeight: 1000, clientHeight: 500, scrollTop: 460 });
    await fireScroll(fixture.main);

    expect(activeLabel(container)).toBe('教练风格');
  });

  it('内容未溢出时不触发底部强制激活', async () => {
    const fixture = mountSections(['appearance', 'coach']);
    const { container } = render(<SettingsNav sectionIds={['appearance', 'coach']} />);

    // 无溢出（scrollHeight 未超过 clientHeight + 4），即使 scrollTop 很大也不强制最后一项
    setScrollGeometry(fixture.main, { scrollHeight: 500, clientHeight: 500, scrollTop: 400 });
    await fireScroll(fixture.main);

    expect(activeLabel(container)).toBe('外观');
  });

  it('点击后的短窗口内忽略 scroll spy，窗口结束后恢复跟随滚动', async () => {
    const BASE = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(BASE);
    const fixture = mountSections(SECTION_IDS);
    const { container } = render(<SettingsNav sectionIds={SECTION_IDS} />);

    fireEvent.click(itemButtons(container)[2]!); // 训练偏好
    expect(activeLabel(container)).toBe('训练偏好');

    fixture.tops.appearance = 0; // 若 spy 生效会切回「外观」
    await fireScroll(fixture.main);
    expect(activeLabel(container)).toBe('训练偏好');

    // 越过 600ms 忽略窗口后恢复 spy
    nowSpy.mockReturnValue(BASE + 1000);
    await fireScroll(fixture.main);
    expect(activeLabel(container)).toBe('外观');
  });
});
