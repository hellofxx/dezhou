import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 浮层契约守卫（DESIGN.md §1.5 / §6.4 / §10.6）：
 *
 * 1. feature / layouts / shared 不得手写 `fixed inset-0` 裸遮罩：
 *    模态必须复用 shared Dialog（焦点陷阱 / Escape / 纸条材质由原语统一提供）。
 *    手写遮罩不产生编译错误，jsdom 冒烟也看不出焦点丢失，只能靠扫描面兜住。
 * 2. 浮层顶层层级统一 z-[100]：Dialog / Select / Tooltip 处于同一档；
 *    toast / 移动底栏的 z-50 是另一层语义，不在本守卫扫描范围。
 *
 * allowlist 只减不加；条目失效（文件不再命中）同样变红。
 */

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));

/** 扫描根目录（相对 src/） */
const SCAN_ROOTS = ['features', 'layouts', 'shared'];

/** 扫描面下限（棘轮）：实际约 252 个非测试 tsx 文件 */
const MIN_SCANNED_FILES = 200;

/** 裸遮罩判定：同一行出现 fixed … inset-0（`inset-x-0` 不含 `inset-0`，天然不命中） */
const OVERLAY_PATTERN = /fixed[^"'`]*\binset-0\b/;

/** 浮层顶层层级的单源文件（相对 src/） */
const OVERLAY_LAYER_FILES = [
  'shared/components/ui/dialog.tsx',
  'shared/components/ui/select.tsx',
  'shared/components/ui/tooltip.tsx',
];

const HANDWRITTEN_OVERLAY_ALLOWLIST: { file: string; reason: string }[] = [
  {
    file: 'shared/components/ui/dialog.tsx',
    reason: '遮罩单源：DialogOverlay 是唯一允许的 fixed inset-0 实现，其余浮层必须复用它',
  },
  {
    file: 'features/strategy-academy/components/BasicsIntro.tsx',
    reason: '完成态全屏遮罩：无可交互内容、3s 倒计时自动跳转，不构成可操作模态',
  },
];

interface ScannedFile {
  /** 相对 src/ 的 posix 路径 */
  relativePath: string;
  content: string;
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function walk(dirPath: string, collected: string[] = []): string[] {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, collected);
    } else if (/\.tsx$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name)) {
      collected.push(fullPath);
    }
  }
  return collected;
}

const SCANNED_FILES: ScannedFile[] = SCAN_ROOTS.flatMap((root) => walk(path.join(SRC_DIR, root)))
  .map((absolutePath) => ({
    relativePath: toPosix(path.relative(SRC_DIR, absolutePath)),
    content: fs.readFileSync(absolutePath, 'utf8'),
  }))
  .sort((a, b) => a.relativePath.localeCompare(b.relativePath));

/** 命中文件 → 行号列表，失败信息里直接给出可跳转的定位 */
const HITS = new Map<string, number[]>();
for (const file of SCANNED_FILES) {
  file.content.split(/\r?\n/).forEach((line, index) => {
    if (OVERLAY_PATTERN.test(line)) {
      const existing = HITS.get(file.relativePath) ?? [];
      existing.push(index + 1);
      HITS.set(file.relativePath, existing);
    }
  });
}

const ALLOWLISTED_FILES = HANDWRITTEN_OVERLAY_ALLOWLIST.map((entry) => entry.file).sort();
const HIT_FILES = [...HITS.keys()].sort();

describe('浮层契约守卫（裸遮罩 + 层级）', () => {
  it('扫描自检：非测试 tsx 文件数量达到下限', () => {
    expect(
      SCANNED_FILES.length,
      '扫描面文件数偏低，目录 / 后缀解析可能失效',
    ).toBeGreaterThanOrEqual(MIN_SCANNED_FILES);
  });

  it('allowlist 结构自检：理由非空、无重复且文件存在', () => {
    expect(new Set(ALLOWLISTED_FILES).size, 'allowlist 存在重复条目').toBe(
      ALLOWLISTED_FILES.length,
    );
    for (const entry of HANDWRITTEN_OVERLAY_ALLOWLIST) {
      expect(entry.reason.trim(), `allowlist 条目 ${entry.file} 缺少登记理由`).not.toBe('');
      expect(
        SCANNED_FILES.some((file) => file.relativePath === entry.file),
        `allowlist 登记的 ${entry.file} 不在扫描结果中（文件已删除 / 改名或扫描根漂移）`,
      ).toBe(true);
    }
  });

  it('未登记裸遮罩：模态必须复用 shared Dialog', () => {
    const unregistered = HIT_FILES.filter((file) => !ALLOWLISTED_FILES.includes(file)).map(
      (file) => `${file}:${(HITS.get(file) ?? []).join(',')}`,
    );
    expect(
      unregistered,
      '以下文件手写 fixed inset-0 遮罩：模态请用 @/shared/components/ui/dialog（焦点陷阱 / Escape / 纸条材质由 Dialog 提供）',
    ).toEqual([]);
  });

  it('失效条目：allowlist 里的文件必须仍然命中（只减不加）', () => {
    const stale = HANDWRITTEN_OVERLAY_ALLOWLIST.filter(
      (entry) => !HIT_FILES.includes(entry.file),
    ).map((entry) => entry.file);
    expect(stale, '以下文件已无裸遮罩，请从 HANDWRITTEN_OVERLAY_ALLOWLIST 删除对应条目').toEqual(
      [],
    );
  });

  it('命中集合与 allowlist 完全一致', () => {
    expect(HIT_FILES).toEqual(ALLOWLISTED_FILES);
  });

  it('浮层顶层统一 z-[100]：Dialog / Select / Tooltip 不得回落到 z-50', () => {
    for (const relativePath of OVERLAY_LAYER_FILES) {
      const content = fs.readFileSync(path.join(SRC_DIR, relativePath), 'utf8');
      expect(content, `${relativePath} 缺少 z-[100]（DESIGN.md §6.4）`).toContain('z-[100]');
      expect(content, `${relativePath} 仍含 z-50，浮层顶层层级需统一为 z-[100]`).not.toMatch(
        /\bz-50\b/,
      );
    }
  });
});