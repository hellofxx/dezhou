import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * CSS 文件规模守卫（平铺扫描 src/styles/*.css，非递归）。
 *
 * globals.css 是唯一入口：只允许 `@import` + `@theme`，不得承载组件规则
 * （Tailwind 会把 @import 内容提升到本地规则之前，入口写规则会改变级联顺序）。
 * 组件规则按序落在同目录分片中，单文件 ≤800 行。
 * 行数口径与 line-count-guard.test.ts 一致：content.split('\n').length。
 */

/** CSS 单文件上限 */
const CSS_MAX_LINES = 800;

/** 入口文件行数上限（imports + @theme + 头注释） */
const ENTRY_MAX_LINES = 120;

/** 扫描自检下限：路径失效或 glob 空跑时变红 */
const TOTAL_CSS_MIN_LINES = 3000;

const ENTRY_NAME = 'globals.css';

/** 守卫距 src/ 为一层 */
const STYLES_DIR = fileURLToPath(new URL('../styles/', import.meta.url));

/** 与 line-count-guard 同口径：按 \n 切分计数（不用 wc -l，末行无换行时会更少 1 行） */
function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function readEntryCss(): string {
  const entryPath = path.join(STYLES_DIR, ENTRY_NAME);
  return fs.readFileSync(entryPath, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
}

/** 仅平铺一层：样式分片必须落在 src/styles/ 根下（守卫不递归子目录） */
function listFlatCssFiles(): string[] {
  return fs
    .readdirSync(STYLES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.css$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

describe('CSS file line count guard', () => {
  it(`src/styles/globals.css 存在且为纯入口（≤ ${ENTRY_MAX_LINES} 行）`, () => {
    const entryPath = path.join(STYLES_DIR, ENTRY_NAME);
    expect(fs.existsSync(entryPath)).toBe(true);
    expect(countLines(entryPath)).toBeLessThanOrEqual(ENTRY_MAX_LINES);
  });

  it('globals.css 只含 @import 与 @theme，不承载组件规则', () => {
    const ruleLines = readEntryCss()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.includes('{'))
      .filter((line) => !line.startsWith('@'));

    expect(
      ruleLines,
      '入口文件出现本地规则：请移动到对应分片（@import 会被提升，入口规则会改变级联顺序）',
    ).toEqual([]);
  });

  it('入口 @import 与 src/styles 分片双向一致（无孤儿分片 / 无悬空 import）', () => {
    const imported = [
      ...readEntryCss().matchAll(/@import\s+["']\.\/([^"']+\.css)["']\s*;/g),
    ]
      .map((match) => match[1] ?? '')
      .sort();
    const partials = listFlatCssFiles().filter((name) => name !== ENTRY_NAME);

    expect(new Set(imported).size, '入口存在重复 @import').toBe(imported.length);
    expect(imported, '入口 @import 必须覆盖且仅覆盖 src/styles 下的全部分片').toEqual(partials);
  });

  it(`src/styles/*.css 单文件不超过 ${CSS_MAX_LINES} 行`, () => {
    const violations = listFlatCssFiles()
      .map((name) => ({ name, lineCount: countLines(path.join(STYLES_DIR, name)) }))
      .filter((file) => file.lineCount > CSS_MAX_LINES)
      .map((file) => `${file.name}: ${file.lineCount} lines > ${CSS_MAX_LINES}`);

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