import { describe, expect, it } from 'vitest';
import { WOOD_TILE_SIZE, renderWoodTile, type WoodTile } from './woodNoise';

const SIZE = 64;

function channelAt(tile: WoodTile, x: number, y: number, channel: number): number {
  return tile.data[(y * tile.width + x) * 4 + channel] ?? 0;
}

/** 相邻两列的逐行平均绝对差（R/G/B 三通道合计后平摊）。 */
function meanColumnDiff(tile: WoodTile, left: number, right: number): number {
  let sum = 0;
  for (let y = 0; y < tile.height; y += 1) {
    for (let c = 0; c < 3; c += 1) {
      sum += Math.abs(channelAt(tile, left, y, c) - channelAt(tile, right, y, c));
    }
  }
  return sum / (tile.height * 3);
}

describe('renderWoodTile', () => {
  it('暴露 512 的默认瓦片尺寸', () => {
    expect(WOOD_TILE_SIZE).toBe(512);
  });

  it('同参同输出（确定性，且与调用顺序无关）', () => {
    const first = renderWoodTile(SIZE, false);
    renderWoodTile(SIZE, true); // 中间插入另一种纹理，确保内部状态不共享
    const second = renderWoodTile(SIZE, false);
    expect(second.data).toEqual(first.data);
  });

  it('输出 RGBA 形状且 alpha 恒为 255', () => {
    const tile = renderWoodTile(SIZE, false);
    expect(tile.width).toBe(SIZE);
    expect(tile.height).toBe(SIZE);
    expect(tile.data).toHaveLength(SIZE * SIZE * 4);
    for (let i = 3; i < tile.data.length; i += 4) {
      if (tile.data[i] !== 255) {
        throw new Error(`alpha 非不透明：index ${i} = ${String(tile.data[i])}`);
      }
    }
  });

  it('非恒定：亮度存在方差', () => {
    const tile = renderWoodTile(SIZE, true);
    let sum = 0;
    for (let y = 0; y < tile.height; y += 1) {
      for (let x = 0; x < tile.width; x += 1) sum += channelAt(tile, x, y, 0);
    }
    const mean = sum / (SIZE * SIZE);
    let variance = 0;
    for (let y = 0; y < tile.height; y += 1) {
      for (let x = 0; x < tile.width; x += 1) {
        const d = channelAt(tile, x, y, 0) - mean;
        variance += d * d;
      }
    }
    expect(variance / (SIZE * SIZE)).toBeGreaterThan(0);
  });

  it('竖向与水平纹输出不同', () => {
    const horizontal = renderWoodTile(SIZE, false);
    const vertical = renderWoodTile(SIZE, true);
    let diff = 0;
    for (let i = 0; i < horizontal.data.length; i += 1) {
      if (horizontal.data[i] !== vertical.data[i]) diff += 1;
    }
    expect(diff).toBeGreaterThan(0);
  });

  it('接缝连续：首尾列平均差不显著高于内部相邻列', () => {
    const tile = renderWoodTile(64, false);
    const seam = meanColumnDiff(tile, tile.width - 1, 0);
    let inner = 0;
    for (let x = 1; x < tile.width; x += 1) inner += meanColumnDiff(tile, x - 1, x);
    inner /= tile.width - 1;
    expect(seam).toBeLessThanOrEqual(inner * 3);
  });

  it('size 越界抛 RangeError', () => {
    expect(() => renderWoodTile(15, false)).toThrow(RangeError);
    expect(() => renderWoodTile(2049, false)).toThrow(RangeError);
    expect(() => renderWoodTile(Number.NaN, false)).toThrow(RangeError);
  });

  it('整数化尺寸：小瓦片可用', () => {
    const tile = renderWoodTile(16.9, false);
    expect(tile.width).toBe(16);
    expect(tile.data).toHaveLength(16 * 16 * 4);
  });
});
