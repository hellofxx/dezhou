/** 把 woodNoise 生成的瓦片写成 CSS 自定义属性（--wood-h 水平纹 / --wood-v 竖向纹）。 */

import { WOOD_TILE_SIZE, renderWoodTile, type WoodTile } from './woodNoise';

const INSTALLED_FLAG = '1';

export function applyWoodTiles(
  style: Pick<CSSStyleDeclaration, 'setProperty'>,
  horizontalUrl: string,
  verticalUrl: string,
): void {
  style.setProperty('--wood-h', `url("${horizontalUrl}")`);
  style.setProperty('--wood-v', `url("${verticalUrl}")`);
}

/** 瓦片 → canvas → data URL；无 2d context 返回 null。 */
function paintTile(doc: Document, tile: WoodTile): string | null {
  const canvas = doc.createElement('canvas');
  canvas.width = tile.width;
  canvas.height = tile.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const image = ctx.createImageData(tile.width, tile.height);
  image.data.set(tile.data);
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * 幂等安装：已标记则直接成功；无 2d context 时不写任何变量并返回 false。
 * 同步执行（512² × 2 约数十毫秒），失败时保留 CSS 里的渐变回退。
 */
export function installWoodTexture(doc: Document = document): boolean {
  const root = doc.documentElement;
  if (root.dataset.woodTexture === INSTALLED_FLAG) return true;

  const horizontal = paintTile(doc, renderWoodTile(WOOD_TILE_SIZE, false));
  const vertical = paintTile(doc, renderWoodTile(WOOD_TILE_SIZE, true));
  if (horizontal === null || vertical === null) return false;

  applyWoodTiles(root.style, horizontal, vertical);
  root.dataset.woodTexture = INSTALLED_FLAG;
  return true;
}
