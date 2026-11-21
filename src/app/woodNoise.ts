/**
 * 程序化胡桃木纹理（移植自 prototype/assets/wood.js）：整数频率 value-noise fbm，
 * 各向异性频率产生连续导管纹，无斜条纹。纯函数，无 DOM 依赖。
 */

export const WOOD_TILE_SIZE = 512;

export interface WoodTile {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

const LATTICE = 64;
const SEED = 20261121;
const MIN_SIZE = 16;
const MAX_SIZE = 2048;

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** 每次调用重建 lattice，保证同参同输出、不受调用顺序影响。 */
function createLattice(): Float32Array {
  const lat = new Float32Array(LATTICE * LATTICE);
  let seed = SEED;
  for (let i = 0; i < lat.length; i += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    lat[i] = seed / 4294967296;
  }
  return lat;
}

// 逐轴周期回绕（而非单一 Math.max 周期）：两轴周期不同，否则对角方向出现接缝。
function sampleLattice(lat: Float32Array, ix: number, iy: number, px: number, py: number): number {
  const x = ((ix % px) + px) % px;
  const y = ((iy % py) + py) % py;
  return lat[y * LATTICE + x] ?? 0;
}

function valueNoise(lat: Float32Array, u: number, v: number, px: number, py: number): number {
  const ix = Math.floor(u);
  const iy = Math.floor(v);
  const fx = smooth(u - ix);
  const fy = smooth(v - iy);
  const a = sampleLattice(lat, ix, iy, px, py);
  const b = sampleLattice(lat, ix + 1, iy, px, py);
  const c = sampleLattice(lat, ix, iy + 1, px, py);
  const d = sampleLattice(lat, ix + 1, iy + 1, px, py);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function fbm(
  lat: Float32Array,
  u: number,
  v: number,
  fx: number,
  fy: number,
  octaves: number,
): number {
  let sum = 0;
  let amp = 0.5;
  let mul = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o += 1) {
    const px = fx * mul;
    const py = fy * mul;
    if (px > LATTICE || py > LATTICE) break;
    sum += amp * valueNoise(lat, u * px, v * py, px, py);
    norm += amp;
    amp *= 0.5;
    mul *= 2;
  }
  return sum / norm;
}

/**
 * 生成方形胡桃木贴图。vertical=true 为竖向导管纹。
 * size 取整后限制在 [16, 2048]，越界抛 RangeError。
 */
export function renderWoodTile(size: number, vertical: boolean): WoodTile {
  const span = Math.trunc(size);
  if (!Number.isFinite(span) || span < MIN_SIZE || span > MAX_SIZE) {
    throw new RangeError(`renderWoodTile: size 需在 [${MIN_SIZE}, ${MAX_SIZE}] 内`);
  }

  const lat = createLattice();
  const data = new Uint8ClampedArray(span * span * 4);
  const gx = vertical ? 32 : 2;
  const gy = vertical ? 2 : 32;
  const fx = vertical ? 2 : 1;
  const fy = vertical ? 1 : 2;

  for (let y = 0; y < span; y += 1) {
    const v = y / span;
    for (let x = 0; x < span; x += 1) {
      const u = x / span;
      const fig = fbm(lat, u + 0.37, v + 0.11, fx, fy, 2);
      const g = fbm(lat, u, v + 0.025 * fig, gx, gy, 2);
      const pore = valueNoise(lat, u * 64 + 31.7, v * 64 + 17.3, 64, 64);

      let r = 62;
      let gg = 43;
      let b = 27;

      let da = clamp01((g - 0.5) / 0.22);
      da = da * da * 0.5;
      r += (24 - r) * da;
      gg += (15 - gg) * da;
      b += (9 - b) * da;

      let la = clamp01((0.47 - g) / 0.2);
      la = la * la * 0.3;
      r += (138 - r) * la;
      gg += (104 - gg) * la;
      b += (60 - b) * la;

      const fa = (fig - 0.5) * 0.12;
      r *= 1 + fa;
      gg *= 1 + fa;
      b *= 1 + fa;

      const pa = (pore - 0.5) * 0.05;
      const idx = (y * span + x) * 4;
      data[idx] = r * (1 + pa);
      data[idx + 1] = gg * (1 + pa);
      data[idx + 2] = b * (1 + pa);
      data[idx + 3] = 255;
    }
  }

  return { width: span, height: span, data };
}
