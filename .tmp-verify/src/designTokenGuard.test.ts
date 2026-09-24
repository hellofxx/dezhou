import { describe, expect, it } from 'vitest';

/**
 * 设计 token 守卫（DESIGN_LANGUAGE §1.2 三不原则 / §1.3 反 SaaS 饱和色禁令）：
 * 1. 禁止 Tailwind 霓虹调色板类（red/green/blue/... -\d{2,3}），语义色必须用 --poker-* token；
 * 2. 禁止纯白/纯黑文字与实底类（text-white / bg-white / text-black / bg-black 实底）；
 *    半透明压暗层 bg-black/NN 属 §4.2「阴影黑调」豁免；
 * 3. 禁止纯黑/纯白十六进制字面量（#000 / #fff 系）。
 * 白名单遵循「只删不加」：新增豁免必须先在 DESIGN_LANGUAGE.md 登记设计依据。
 */

// 通过 Vite raw glob 载入全部业务源码（排除测试文件本身在下方过滤）
const SOURCE_FILES = import.meta.glob<string>('./**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** 豁免文件（相对 src/ 的 ./ 路径）。当前为空 —— 收紧时只删不加。 */
const EXEMPT_FILES: string[] = [];

const NEON_PALETTE =
  /(?:bg|text|border|from|to|ring)-(?:red|green|blue|yellow|purple|pink|cyan|emerald|sky|indigo|violet|amber|lime|teal|rose|fuchsia|orange)-\d{2,3}/g;
const PURE_WHITE_BLACK_CLASS = /\btext-white\b|\btext-black\b|\bbg-white\b(?!\/)|\bbg-black\b(?!\/)/g;
const PURE_HEX = /#(?:ffffff|fff|000000|000)\b/gi;
// UI-08 增强：任意值槽中直接写纯黑/纯白 hex（bg-[#fff]、text-[#000] 等），绕过 token 体系
const ARBITRARY_PURE_HEX =
  /(?:bg|text|border|ring|from|to)-(?:\[#(?:fff|ffffff|000|000000)\])/gi;

function findViolations(pattern: RegExp): string[] {
  const violations: string[] = [];
  for (const [path, content] of Object.entries(SOURCE_FILES)) {
    if (/\.test\.(ts|tsx)$/.test(path) || EXEMPT_FILES.includes(path)) continue;
    content.split('\n').forEach((line, i) => {
      const matches = line.match(pattern);
      if (matches) {
        violations.push(`${path}:${i + 1} → ${matches.join(', ')}`);
      }
    });
  }
  return violations;
}

describe('设计 token 守卫（防霓虹色板回流）', () => {
  it('扫描范围有效（应覆盖全部 src 源码文件）', () => {
    expect(Object.keys(SOURCE_FILES).length).toBeGreaterThan(100);
  });

  it('src 内不得出现 Tailwind 霓虹调色板类（§1.3），语义色用 --poker-* token', () => {
    expect(findViolations(NEON_PALETTE)).toEqual([]);
  });

  it('src 内不得出现纯白/纯黑文字与实底类（§1.2；bg-black/NN 压暗层豁免）', () => {
    expect(findViolations(PURE_WHITE_BLACK_CLASS)).toEqual([]);
  });

  it('src 内不得出现纯黑/纯白 hex 字面量（§1.2 三不原则）', () => {
    expect(findViolations(PURE_HEX)).toEqual([]);
  });

  it('src 内不得在任意值槽写纯黑/纯白 hex（UI-08 增强，绕过 token 体系）', () => {
    expect(findViolations(ARBITRARY_PURE_HEX)).toEqual([]);
  });
});
