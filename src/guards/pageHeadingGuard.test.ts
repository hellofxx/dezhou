import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 页面级标题层级守卫（一页一个 h1）
 *
 * 设计语言只允许「整页视图」拥有一个 h1，模块内嵌内容页一律降为 h2，否则屏幕阅读器
 * 的文档大纲会被每张卡片重复的一级标题打散（WCAG 2.4.6 / 1.3.1）。h1 标签本身不产生
 * 编译错误、jsdom 冒烟测试也看不出来，只能靠扫描面兜住。
 *
 * 断言口径：
 * - 扫描 src/layouts / src/features / src/shared 的非测试 .ts(x)
 *   （含 .ts：标题也可能以 HTML 字符串形式留在数据 / 常量文件里）
 * - 含 `<h1` 的文件集合必须与 H1_ALLOWLIST 完全一致（双向：新增 / 失效都变红）
 * - 扫描面 ≥ 300 文件自检，路径解析失效时先红
 */

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));

/** `<h1` 开标签：后面必须是空白 / `>` / `/`（`</h1>` 不含 `<h1` 子串，天然不命中） */
const HEADING_PATTERN = /<h1(?=[\s>/])/;

/** 扫描根目录（相对 src/） */
const SCAN_ROOTS = ['layouts', 'features', 'shared'];

/** 扫描面下限（棘轮）：实际约 490 个非测试源文件 */
const MIN_SCANNED_FILES = 300;

/**
 * h1 allowlist（相对 src/ 的 posix 路径）—— 「一页一个 h1」的整页视图。
 * 口径：只减不加。新增条目必须在评审里说明「为何这是整页视图而不是内嵌内容页」。
 */
const H1_ALLOWLIST: { file: string; reason: string }[] = [
  { file: 'layouts/AppLayout.tsx', reason: '应用外壳的品牌标题（全站唯一）' },
  {
    file: 'layouts/BlankLayout.tsx',
    reason: '无侧边栏布局的 sr-only 页面标题（无可见导航时提供文档标题）',
  },
  {
    file: 'shared/components/system/ErrorBoundary.tsx',
    reason: '全局错误兜底整页视图（脱离布局渲染）',
  },
  {
    file: 'shared/components/feedback/ResultHeader.tsx',
    reason: '共享结果页标题：按 headingLevel 渲染 h1（整页结果）或 h2（嵌入页结果）',
  },
  { file: 'features/onboarding/components/WelcomeStep.tsx', reason: '新手引导首屏整页主标题' },
  {
    file: 'features/pot-odds/components/PotOddsQuizPage.tsx',
    reason: '赔率训练整页主标题',
  },
  {
    file: 'features/range-trainer/components/RangeLearnPage.tsx',
    reason: '范围学习整页主标题',
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

/** 递归收集非测试源文件（跳过 node_modules 等非源码目录） */
function walk(dirPath: string, collected: string[] = []): string[] {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, collected);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
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
    if (HEADING_PATTERN.test(line)) {
      const existing = HITS.get(file.relativePath) ?? [];
      existing.push(index + 1);
      HITS.set(file.relativePath, existing);
    }
  });
}

const ALLOWLISTED_FILES = H1_ALLOWLIST.map((entry) => entry.file).sort();
const HIT_FILES = [...HITS.keys()].sort();

describe('页面标题层级守卫（一页一个 h1）', () => {
  it('扫描自检：非测试源文件数量达到下限', () => {
    expect(
      SCANNED_FILES.length,
      '扫描面文件数偏低，目录 / 后缀解析可能失效',
    ).toBeGreaterThanOrEqual(MIN_SCANNED_FILES);
  });

  it('allowlist 结构自检：条目无重复且均存在于扫描结果中', () => {
    expect(new Set(ALLOWLISTED_FILES).size, 'allowlist 存在重复条目').toBe(
      ALLOWLISTED_FILES.length,
    );
    for (const entry of H1_ALLOWLIST) {
      expect(entry.reason.trim(), `allowlist 条目 ${entry.file} 缺少登记理由`).not.toBe('');
      expect(
        SCANNED_FILES.some((file) => file.relativePath === entry.file),
        `allowlist 登记的 ${entry.file} 不在扫描结果中（文件已删除 / 改名或扫描根漂移）`,
      ).toBe(true);
    }
  });

  it('未登记 h1：内容页必须用 h2，禁止新增 h1', () => {
    const unregistered = HIT_FILES.filter((file) => !ALLOWLISTED_FILES.includes(file)).map(
      (file) => `${file}:${(HITS.get(file) ?? []).join(',')}`,
    );
    expect(
      unregistered,
      '以下文件出现未登记的 <h1>：内嵌内容页请降为 h2；确属整页视图须在 H1_ALLOWLIST 显式登记',
    ).toEqual([]);
  });

  it('失效条目：allowlist 里的文件必须仍然含有 h1（只减不加）', () => {
    const stale = H1_ALLOWLIST.filter((entry) => !HIT_FILES.includes(entry.file)).map(
      (entry) => entry.file,
    );
    expect(stale, '以下文件的 h1 已移除，请从 H1_ALLOWLIST 删除对应条目').toEqual([]);
  });

  it('含 h1 的文件集合与 allowlist 完全一致', () => {
    expect(HIT_FILES).toEqual(ALLOWLISTED_FILES);
  });
});