import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { generateStreakShareCanvas, downloadBlob } from './shareCard';
import type { ShareCardTranslations } from './shareCard';

/**
 * Streak 分享卡片生成（jsdom + Canvas 2D stub）。
 *
 * 契约：
 * - 取不到 2D context 时抛错（调用方据此提示失败，不产出半张图）；
 * - Canvas 文案全部来自传入的 translations，缺省时回退中文；
 * - downloadBlob 创建 <a download> 触发下载并在 1s 后释放 objectURL。
 *
 * jsdom 未实现 canvas：统一 stub HTMLCanvasElement.prototype.getContext / toBlob
 * 与 URL.createObjectURL，避免依赖真实渲染。
 */

interface FakeCtx {
  fillText: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  createLinearGradient: ReturnType<typeof vi.fn>;
  addColorStop: ReturnType<typeof vi.fn>;
}

function installCanvasStub(): FakeCtx {
  const addColorStop = vi.fn();
  const ctx: FakeCtx = {
    fillText: vi.fn(),
    fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop })),
    addColorStop,
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => ctx as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    callback: BlobCallback,
  ) {
    callback(new Blob(['png'], { type: 'image/png' }));
  } as unknown as HTMLCanvasElement['toBlob']);
  return ctx;
}

const TRANSLATIONS: ShareCardTranslations = {
  title: 'STREAK TITLE',
  dayUnit: 'DAYS',
  statsLine: (accuracy, badges) => `ACC ${accuracy} BADGES ${badges}`,
  currentLine: (current, longest) => `CUR ${current} LONG ${longest}`,
  productName: 'PRODUCT NAME',
};

const STATS = { accuracy: 0.734, badges: ['a', 'b'], currentStreak: 12 };

function drawnTexts(ctx: FakeCtx): string[] {
  return ctx.fillText.mock.calls.map((call) => String(call[0]));
}

let clickedAnchor: HTMLAnchorElement | null = null;

beforeEach(() => {
  clickedAnchor = null;
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clickedAnchor = this;
  });
});

afterEach(() => {
  cleanupDom();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function cleanupDom() {
  for (const anchor of Array.from(document.querySelectorAll('a'))) {
    anchor.remove();
  }
}

describe('generateStreakShareCanvas', () => {
  it('取不到 Canvas 2D context 时抛错且不产出图片', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    await expect(generateStreakShareCanvas(7, STATS)).rejects.toThrow(
      'Canvas 2D context unavailable',
    );
  });

  it('文案全部来自 translations（含正确率取整与徽章数）', async () => {
    const ctx = installCanvasStub();

    const blob = await generateStreakShareCanvas(30, STATS, TRANSLATIONS);

    expect(blob.type).toBe('image/png');
    const texts = drawnTexts(ctx);
    expect(texts).toContain('STREAK TITLE');
    expect(texts).toContain('DAYS');
    expect(texts).toContain('30');
    expect(texts).toContain('ACC 73 BADGES 2');
    // 最长记录取 max(currentStreak, days) = 30
    expect(texts).toContain('CUR 12 LONG 30');
    expect(texts).toContain('PRODUCT NAME');
  });

  it('缺省 translations 时回退中文文案', async () => {
    const ctx = installCanvasStub();

    await generateStreakShareCanvas(3, { accuracy: 1, badges: [], currentStreak: 3 });

    const texts = drawnTexts(ctx);
    expect(texts).toContain('🔥 连续训练');
    expect(texts).toContain('天');
    expect(texts).toContain('正确率 100%  ·  获得 0 枚徽章');
    expect(texts).toContain('当前连续 3 天  ·  最长记录 3 天');
    expect(texts).toContain('德州扑克训练平台');
  });

  it('toBlob 返回 null 时 reject（不静默成功）', async () => {
    const ctx = installCanvasStub();
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      callback: BlobCallback,
    ) {
      callback(null);
    } as unknown as HTMLCanvasElement['toBlob']);
    expect(ctx.fillText).not.toHaveBeenCalled();

    await expect(generateStreakShareCanvas(7, STATS)).rejects.toThrow(
      'Canvas toBlob returned null',
    );
  });
});

describe('downloadBlob', () => {
  it('创建带 download 的 <a> 触发下载，并在 1s 后释放 objectURL', () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });

    downloadBlob(new Blob(['x'], { type: 'image/png' }), 'streak-30-days.png');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickedAnchor).toBeTruthy();
    expect(clickedAnchor!.getAttribute('download')).toBe('streak-30-days.png');
    expect(clickedAnchor!.getAttribute('href')).toBe('blob:mock-url');
    // 点击时节点在文档中，之后被摘除（不留孤儿节点）
    expect(document.contains(clickedAnchor!)).toBe(false);

    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
