/**
 * Streak 分享卡片生成（P0-2.7）
 *
 * 使用 Canvas 2D API 绘制 1080x1080 的分享图片：
 * - 背景：牌桌绿呢面深绿渐变
 * - 标题："我在德州扑克训练平台已连续训练 N 天！"
 * - 副标题：正确率 X% · 获得徽章 N 枚
 * - 底部：产品名"德州扑克训练平台"
 *
 * 不依赖外部库，仅使用浏览器原生 Canvas API。
 */

export interface ShareCardStats {
  /** 综合正确率 0-1 */
  accuracy: number;
  /** 已获得的徽章 id 列表 */
  badges: string[];
  /** 当前连续训练天数 */
  currentStreak: number;
}

/** 牌桌绿呢面渐变色 */
const FELT_TOP = '#0a5c36';
const FELT_BOTTOM = '#064426';
/** 黄铜金（数字与边框装饰） */
const BRASS = '#d4a84b';

/**
 * 生成 Streak 分享图片
 *
 * @param days 连续训练天数（显示为大数字）
 * @param stats 用户统计（正确率 / 徽章 / 当前 streak）
 * @returns PNG Blob，可用于下载或 navigator.share
 */
export async function generateStreakShareCanvas(
  days: number,
  stats: ShareCardStats,
): Promise<Blob> {
  const W = 1080;
  const H = 1080;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // 1. 背景渐变（牌桌绿呢面）
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, FELT_TOP);
  bg.addColorStop(1, FELT_BOTTOM);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 2. 顶/底黄铜装饰条
  ctx.fillStyle = BRASS;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(0, 0, W, 12);
  ctx.fillRect(0, H - 12, W, 12);
  ctx.globalAlpha = 1;

  // 3. 顶部小标签
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '600 28px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillText('POKER TRAINING STREAK', W / 2, 120);

  // 4. 火焰 emoji + "连续训练"
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#f3ebd9';
  ctx.font = 'bold 64px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillText('🔥 连续训练', W / 2, 260);

  // 5. 大数字（天数）
  ctx.fillStyle = BRASS;
  ctx.font = 'bold 260px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillText(`${days}`, W / 2, 560);

  // 6. "天" 单位
  ctx.fillStyle = '#f3ebd9';
  ctx.font = 'bold 56px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillText('天', W / 2, 620);

  // 7. 副标题：正确率 · 徽章数
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.font = '36px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const accuracyPct = Math.round(stats.accuracy * 100);
  ctx.fillText(
    `正确率 ${accuracyPct}%  ·  获得 ${stats.badges.length} 枚徽章`,
    W / 2,
    720,
  );

  // 8. 当前 streak 文案
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.font = '28px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(
    `当前连续 ${stats.currentStreak} 天  ·  最长记录 ${Math.max(stats.currentStreak, days)} 天`,
    W / 2,
    780,
  );

  // 9. 底部产品名
  ctx.font = '600 32px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = BRASS;
  ctx.globalAlpha = 0.9;
  ctx.fillText('德州扑克训练平台', W / 2, 980);
  ctx.globalAlpha = 1;

  // 10. 转 Blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/png',
      0.92,
    );
  });
}

/**
 * 触发浏览器下载 Blob（用于分享卡片保存到本地）
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 释放 URL，避免内存泄漏
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
