/**
 * shared 组件基础件使用守卫。
 *
 * 依据：共享组件层修复计划 P5 / G1。
 * `src/shared/components/**` 内除 allowlist 的特化交互外，不得手写
 * `<button>/<input>/<textarea>/<select>`；交互状态必须由 ui/Button、
 * ui/Input、ui/Textarea 等基础件提供。
 *
 * allowlist 为逐文件、带理由登记；条目对应文件/控件消失即变红。
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const COMPONENTS_DIR = fileURLToPath(new URL('../shared/components/', import.meta.url));

/** 整文件豁免：特化交互（保持各自视觉/动效，不强行套基础件） */
const FILE_ALLOWLIST: Readonly<Record<string, string>> = {
  'layout/BackLink.tsx': '返回入口的 text/pill 形态是链接型控制，保留原生 button 以维持非 Router 嵌入能力',
  'feedback/RelatedLessonChip.tsx': 'chip 是全局 CSS 类驱动的专用 pill，保留原生 button 语义',
  'quiz/QuizCard.tsx': 'fold/call/raise 三平权动作按钮为专用色阶与 motion 交互',
  'system/ErrorBoundary.tsx': '整页错误兜底脱离布局渲染，保留原生按钮与既有 btn-brass 样式',
};

/** 目录豁免：扑克可视化组件包含专用可交互牌面/筹码控件 */
const DIR_ALLOWLIST: Readonly<Record<string, string>> = {
  'poker/': '牌面 / 筹码 / 变体切换是专用可视化交互，不属于通用表单控件',
};

/** 局部豁免：原生 checkbox（单消费者，待第二个需求再抽 ui/Checkbox） */
const CONTROL_ALLOWLIST: ReadonlyArray<{
  file: string;
  pattern: RegExp;
  expected: number;
  reason: string;
}> = [
  {
    file: 'academy/ContentIssueReportDialog.tsx',
    pattern: /<input\b(?:(?!"\/?>)[\s\S])*?type="checkbox"(?:(?!"\/?>)[\s\S])*?\/?>/g,
    expected: 1,
    reason: '「附带上下文」勾选框为单消费者场景，待第二个 checkbox 需求再抽 ui/Checkbox',
  },
];

const RAW_CONTROL = /<(button|input|textarea|select)\b/g;
const MIN_SCANNED_FILES = 30;

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function walk(dirPath: string, collected: string[] = []): string[] {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'ui') continue;
      walk(full, collected);
    } else if (/\.tsx$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name)) {
      collected.push(full);
    }
  }
  return collected;
}

function relative(filePath: string): string {
  return toPosix(path.relative(COMPONENTS_DIR, filePath));
}

function sanitize(file: string, content: string): string {
  let result = content;
  for (const entry of CONTROL_ALLOWLIST) {
    if (entry.file === file) result = result.replace(entry.pattern, '');
  }
  return result;
}

function violationsFor(file: string, content: string): string[] {
  const sanitized = sanitize(file, content);
  const violations: string[] = [];
  for (const match of sanitized.matchAll(RAW_CONTROL)) {
    const index = match.index ?? 0;
    const line = sanitized.slice(0, index).split('\n').length;
    violations.push(`${file}:${line} → <${match[1]}>`);
  }
  return violations;
}

describe('shared 组件只使用基础件（无裸 button / input / textarea / select）', () => {
  const files = walk(COMPONENTS_DIR);

  it('扫描面自检：覆盖 shared components 源文件', () => {
    expect(files.length).toBeGreaterThanOrEqual(MIN_SCANNED_FILES);
    expect(files.map(relative)).toContain('academy/AcademySearchShell.tsx');
    expect(files.map(relative)).toContain('academy/ContentIssueReportDialog.tsx');
  });

  it('allowlist 条目只指向真实存在的文件/控件', () => {
    for (const file of Object.keys(FILE_ALLOWLIST)) {
      expect(fs.existsSync(path.join(COMPONENTS_DIR, file)), `allowlist 文件不存在：${file}`).toBe(
        true
      );
    }

    for (const entry of CONTROL_ALLOWLIST) {
      const full = path.join(COMPONENTS_DIR, entry.file);
      expect(fs.existsSync(full), `控件 allowlist 文件不存在：${entry.file}`).toBe(true);
      const content = fs.readFileSync(full, 'utf8');
      const matches = content.match(entry.pattern) ?? [];
      expect(matches.length, `${entry.file} 的 allowlist 控件数量变化`).toBe(entry.expected);
      entry.pattern.lastIndex = 0;
    }
  });

  it('除 allowlist 特化交互外，不出现裸控件', () => {
    const violations = files.flatMap((full) => {
      const file = relative(full);
      if (FILE_ALLOWLIST[file]) return [];
      if (Object.keys(DIR_ALLOWLIST).some((prefix) => file.startsWith(prefix))) return [];
      return violationsFor(file, fs.readFileSync(full, 'utf8'));
    });

    expect(
      violations,
      [
        'shared 组件必须走 ui/Button、ui/Input、ui/Textarea（计划 P5 / G1）。',
        ...violations,
      ].join('\n')
    ).toEqual([]);
  });
});
