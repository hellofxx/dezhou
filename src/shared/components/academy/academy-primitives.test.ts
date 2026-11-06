/**
 * shared academy 基础件 dogfooding 断言（Node 环境源码扫描）。
 *
 * 依据共享层计划 W1 / 原则 P5：`src/shared/components/**` 内不允许手写
 * `<button>` / `<input>` / `<textarea>` / `<select>` 与 primitive 等价样式，
 * 交互状态必须由 `ui/Button` / `ui/Input` / `ui/Textarea` 提供。
 *
 * 当前唯一豁免是 `ContentIssueReportDialog` 的「附带上下文」原生 checkbox
 * （单消费者场景，待第二个 checkbox 需求再抽 `ui/Checkbox`，G1 时会升级为
 * `src/guards/sharedPrimitiveUsage.guard.test.ts` 并登记 allowlist）。
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ACADEMY_DIR = path.dirname(fileURLToPath(import.meta.url));

/** 允许保留的原生控件（逐条带理由，禁止整文件豁免） */
const RAW_CONTROL_ALLOWLIST: ReadonlyArray<{ file: string; pattern: RegExp; reason: string }> = [
  {
    file: 'ContentIssueReportDialog.tsx',
    // 自闭合或多行 checkbox 均可命中：<input ... type="checkbox" ... />
    pattern: /<input\b(?:(?!"\/?>)[\s\S])*?type="checkbox"(?:(?!"\/?>)[\s\S])*?\/?>/g,
    reason: '「附带上下文」勾选框为单消费者场景，待第二个 checkbox 需求再抽 ui/Checkbox',
  },
];

const RAW_CONTROL = /<(button|input|textarea|select)\b/g;

/** 扫描面自检下限（防止路径解析失效后空洞通过） */
const MIN_SCANNED_FILES = 8;

type AllowlistHit = { file: string; reason: string };

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function listAcademySources(): string[] {
  return fs
    .readdirSync(ACADEMY_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .filter((entry) => !/\.test\.tsx?$/.test(entry.name))
    .map((entry) => entry.name);
}

function scan(fileName: string, content: string): string[] {
  let sanitized = content;
  for (const entry of RAW_CONTROL_ALLOWLIST) {
    if (entry.file === fileName) sanitized = sanitized.replace(entry.pattern, '');
  }

  const violations: string[] = [];
  for (const match of sanitized.matchAll(RAW_CONTROL)) {
    const index = match.index ?? 0;
    const line = sanitized.slice(0, index).split('\n').length;
    violations.push(`${fileName}:${line} → <${match[1]}>`);
  }
  return violations;
}

describe('shared academy 只使用 ui 基础件（无裸 button / input / textarea / select）', () => {
  const sources = listAcademySources();

  it('扫描面自检：覆盖全部 academy 源文件', () => {
    expect(sources.length).toBeGreaterThanOrEqual(MIN_SCANNED_FILES);
    expect(sources).toContain('AcademySearchShell.tsx');
    expect(sources).toContain('ContentIssueReportDialog.tsx');
  });

  it('academy 内不出现裸 <button> / <input> / <textarea> / <select>', () => {
    const violations = sources.flatMap((fileName) =>
      scan(fileName, fs.readFileSync(path.join(ACADEMY_DIR, fileName), 'utf8'))
    );

    expect(
      violations,
      [
        '学院组件必须走 ui/Button、ui/Input、ui/Textarea（计划 W1 / 原则 P5）。',
        ...violations,
      ].join('\n')
    ).toEqual([]);
  });

  it('allowlist 只登记仍真实存在的原生控件（条目失效即删除）', () => {
    const hits: AllowlistHit[] = [];

    for (const entry of RAW_CONTROL_ALLOWLIST) {
      const filePath = path.join(ACADEMY_DIR, entry.file);
      expect(fs.existsSync(filePath), `allowlist 指向不存在的文件：${entry.file}`).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      if (entry.pattern.test(content)) hits.push({ file: entry.file, reason: entry.reason });
      entry.pattern.lastIndex = 0;
    }

    expect(hits.map((hit) => toPosix(hit.file))).toEqual(['ContentIssueReportDialog.tsx']);
  });
});
