import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * CSS 文件规模守卫（平铺扫描 src/styles/*.css，非递归）。
 *
 * 单文件上限 800 行；既有超出者按文件登记在 CSS_ALLOWLIST 并锁定当前行数（只减不增）。
 * Phase 2 会把 globals.css 拆分为同目录下的多个平铺文件，因此不递归子目录。
 * 行数口径与 line-count-guard.test.ts 一致：content.split('\n').length。
 */

/** CSS 单文件上限 */
const CSS_MAX_LINES = 800;

/** 扫描自检下限：路径失效或 glob 空跑时变红 */
const TOTAL_CSS_MIN_LINES = 3000;

/** allowlist 条目：maxLines 为登记时的实测行数，仅允许下调 */
type CssAllowlistEntry = {
  maxLines: number;
  reason: string;
};

/** 逐文件 allowlist（Phase 2 拆分前临时豁免） */
const CSS_ALLOWLIST: Record<string, CssAllowlistEntry> = {
  'globals.css': { maxLines: 3398, reason: 'Phase 2 拆分待执行' },
};

/** 守卫距 src/ 为一层 */
const STYLES_DIR = fileURLToPath(new URL('../styles/', import.meta.url));

/** 与 line-count-guard 同口径：按 \n 切分计数（不用 wc -l，末行无换行时会更少 1 行） */
function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

/** 仅平铺一层：Phase 2 拆分后的样式分片同样落在 src/styles/ 根下 */
function listFlatCssFiles(): string[] {
  return fs
    .readdirSync(STYLES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.css$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

describe('CSS file line count guard', () => {
  it('src/styles/globals.css 存在', () => {
    expect(fs.existsSync(path.join(STYLES_DIR, 'globals.css'))).toBe(true);
  });

  it('globals.css 不超过 allowlist 登记行数（棘轮：只减不增）', () => {
    const entry = CSS_ALLOWLIST['globals.css'];

    if (!entry) throw new Error('CSS_ALLOWLIST 缺少 globals.css 条目');

    const lineCount = countLines(path.join(STYLES_DIR, 'globals.css'));
    expect(lineCount).toBeLessThanOrEqual(entry.maxLines);
  });

  it(`src/styles/*.css 单文件不超过 ${CSS_MAX_LINES} 行（globals.css 按 allowlist 上限）`, () => {
    const violations = listFlatCssFiles()
      .map((name) => {
        const entry = CSS_ALLOWLIST[name];
        const limit = entry ? entry.maxLines : CSS_MAX_LINES;
        return { name, limit, lineCount: countLines(path.join(STYLES_DIR, name)) };
      })
      .filter((f) => f.lineCount > f.limit)
      .map((f) => `${f.name}: ${f.lineCount} lines > ${f.limit}`);

    // 直接断言数组，失败时 diff 即输出违规文件名与行数
    expect(violations).toEqual([]);
  });

  it('扫描自检：CSS 总行数足够多（防止路径失效空跑）', () => {
    const total = listFlatCssFiles().reduce(
      (sum, name) => sum + countLines(path.join(STYLES_DIR, name)),
      0,
    );

    expect(total).toBeGreaterThan(TOTAL_CSS_MIN_LINES);
  });
});
