/**
 * 重复字面量棘轮守卫（只降不升）。
 *
 * 依据：共享组件层修复计划 P4 / P11 / P12 / G1。
 * 监控四类高频样式字面量：
 * - focus ring（规范单源：ui/focusRing.ts）
 * - section label（规范单源：layout/SectionLabel.tsx）
 * - 平铺黄铜主 CTA（V1 视觉批次收敛到 Button default）
 * - 结果页 stat box（收敛到 StatCard）
 *
 * 基线为当前实测值；任一数字下降都必须同步下调常量，禁止用放宽阈值“修复”。
 * 扫描面排除测试与 test-utils，避免断言/辅助代码污染计数。
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));
const ROOT = path.resolve(SRC_DIR, '..');

interface LiteralGroup {
  name: string;
  pattern: RegExp;
  baseline: number;
  /** 单源定义文件：只允许这些文件保留该字面量 */
  singleSource?: ReadonlyArray<{ file: string; expected: number; reason: string }>;
  reason: string;
}

const GROUPS: readonly LiteralGroup[] = [
  {
    name: 'focus-ring',
    pattern: /focus-visible:ring-2 focus-visible:ring-\[var\(--brass\)\]\/60/g,
    baseline: 2,
    singleSource: [
      {
        file: 'src/shared/components/ui/focusRing.ts',
        expected: 2,
        reason: 'FOCUS_RING / FOCUS_RING_VISIBLE 单源定义',
      },
    ],
    reason: '焦点环必须走 FOCUS_RING / FOCUS_RING_VISIBLE 单源',
  },
  {
    name: 'section-label',
    pattern: /text-\[11px\] uppercase tracking-\[0\.22em\] text-\[var\(--brass-text\)\]/g,
    baseline: 1,
    singleSource: [
      {
        file: 'src/shared/components/layout/SectionLabel.tsx',
        expected: 1,
        reason: 'SectionLabel 单源定义',
      },
    ],
    reason: 'section label 必须走 SectionLabel',
  },
  {
    name: 'flat-cta',
    pattern: /px-5 py-2\.5 rounded-lg bg-\[var\(--brass-fill\)\]/g,
    baseline: 0,
    reason: '平铺主 CTA 已收敛到 Button default（V1）；新增即失败',
  },
  {
    name: 'stat-box',
    pattern: /rounded-lg bg-\[var\(--walnut-raised\)\] p-4/g,
    baseline: 1,
    singleSource: [
      {
        file: 'src/features/pot-odds/components/PotOddsResultView.tsx',
        expected: 1,
        reason: '成绩页性能评语块复用同 chrome，不是统计卡；统计卡必须用 StatCard',
      },
    ],
    reason: 'stat box 必须用 StatCard；仅允许 pot-odds 性能评语块的 1 处同 chrome',
  },
];

function walk(dirPath: string, collected: string[] = []): string[] {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'guards', 'test-utils'].includes(entry.name)) continue;
      walk(full, collected);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      collected.push(full);
    }
  }
  return collected;
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function countIn(file: string, pattern: RegExp): number {
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return (content.match(pattern) ?? []).length;
}

describe('重复样式字面量棘轮（只降不升）', () => {
  const files = walk(SRC_DIR);

  it('扫描面自检：覆盖源码文件', () => {
    expect(files.length).toBeGreaterThan(400);
  });

  for (const group of GROUPS) {
    it(`${group.name} 不超过基线 ${group.baseline}（${group.reason}）`, () => {
      let total = 0;
      const hits: string[] = [];

      for (const full of files) {
        const file = toPosix(path.relative(ROOT, full));
        const count = countIn(file, group.pattern);
        if (count > 0) {
          total += count;
          hits.push(`${file} (${count})`);
        }
        group.pattern.lastIndex = 0;
      }

      expect(
        total,
        [
          `[literal-ratchet:${group.name}] 基线 ${group.baseline}，当前 ${total}。`,
          group.reason,
          '若当前低于基线，请同步下调本守卫的 baseline；禁止上调。',
          ...hits,
        ].join('\n')
      ).toBeLessThanOrEqual(group.baseline);
    });
  }

  it('单源定义文件真实存在且计数与登记一致', () => {
    for (const group of GROUPS) {
      for (const source of group.singleSource ?? []) {
        const full = path.join(ROOT, source.file);
        expect(fs.existsSync(full), `单源文件不存在：${source.file}`).toBe(true);
        expect(countIn(source.file, group.pattern), `${source.file} 计数变化`).toBe(source.expected);
      }
    }
  });
});
