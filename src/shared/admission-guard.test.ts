import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeAdmission, buildGraph, isTestPath } from '@/test-utils/admissionGraph';

/**
 * shared 层准入门槛守卫（T6-B3 step 3 重写）。
 *
 * 规则（AGENTS.md）：shared 只放被 ≥2 个 feature 模块使用的代码。
 * 旧实现只扫 `shared/utils`，且统计的是 shared 文件自身 import 了谁，不是谁 import 它；
 * 未登记 baseline 的文件直接跳过，导致单消费者文件长期漏检。
 *
 * 新实现基于 `@/test-utils/admissionGraph` 的 import 图 + 传递闭包：
 * - 0 生产消费者 → 失败（测试桩豁免）；
 * - 1 生产消费者 → 失败（ui 基础件豁免 ≥2 要求，但仍禁止 0 消费）；
 * - baseline 只降不升，且双向校验（文件消失 / 已达标未删条目都失败）。
 */

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));
const ROOT = path.resolve(SRC_DIR, '..');
const SHARED_PREFIX = 'src/shared/';
const UI_PREFIX = 'src/shared/components/ui/';

/** 测试桩：docs 明确要求保留在 shared/utils，按测试消费者计数 */
const TEST_STUBS = new Set([
  'src/shared/utils/localStorageStub.ts',
  'src/shared/utils/persistShape.ts',
]);

/** 0 生产消费者 baseline（Batch 1 已清空；只降不升，后续新增违规直接失败） */
const ZERO_CONSUMER_BASELINE: Record<string, string> = {};

/** 1 生产消费者 baseline（Batch 4 已清 ProgressRing；ResultSummary 待 Batch 5 回迁） */
const ONE_CONSUMER_BASELINE: Record<string, string> = {
  'src/shared/components/feedback/ResultSummary.tsx': '仅 gto，Batch 5 回迁 gto',
};

function walk(dirPath: string, collected: string[] = []): string[] {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, collected);
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      collected.push(path.relative(ROOT, fullPath).split(path.sep).join('/'));
    }
  }
  return collected;
}

function formatViolations(violations: string[]): string {
  return [
    '[shared admission] 共享层准入违规：',
    ...violations.map((item) => `  - ${item}`),
    '',
    '规则：shared 只放 ≥2 个 feature 模块使用的代码；0 消费直接失败；1 消费须登记 baseline。',
    '处理：删除死代码 / 回迁单消费代码 / 合并到已有 shared 单源；baseline 只降不升。',
  ].join('\n');
}

describe('Shared 层准入门槛 ≥2 消费者', () => {
  it('shared 源文件的消费者数满足准入规则（只降不升 baseline）', { timeout: 30000 }, () => {
    expect(
      Object.keys(ZERO_CONSUMER_BASELINE).filter((file) => file in ONE_CONSUMER_BASELINE),
    ).toEqual([]);

    const files = walk(SRC_DIR);
    expect(files.length).toBeGreaterThan(300);

    const graph = buildGraph(files, (file) => fs.readFileSync(path.join(ROOT, file), 'utf8'));
    const admissions = analyzeAdmission(graph);
    const sharedFiles = graph.files.filter(
      (file) =>
        file.startsWith(SHARED_PREFIX) &&
        !isTestPath(file) &&
        !/\/index\.tsx?$/.test(file),
    );
    expect(sharedFiles.length).toBeGreaterThan(80);

    const violations: string[] = [];
    const seen = new Set<string>();

    for (const file of sharedFiles) {
      seen.add(file);
      const admission = admissions.get(file) ?? { prodConsumers: [], testConsumers: [] };
      const count = admission.prodConsumers.length;
      const isUi = file.startsWith(UI_PREFIX);
      const isTestStub = TEST_STUBS.has(file);
      const zeroBaseline = file in ZERO_CONSUMER_BASELINE;
      const oneBaseline = file in ONE_CONSUMER_BASELINE;

      if (isTestStub) {
        if (admission.testConsumers.length === 0) {
          violations.push(`${file}: 测试桩没有任何测试消费者`);
        }
        if (count > 0) {
          violations.push(`${file}: 测试桩不应被生产代码引用`);
        }
        continue;
      }

      if (isUi) {
        if (count === 0 && !zeroBaseline) {
          violations.push(`${file}: ui 基础件 0 生产消费者（删除或接入）`);
        }
        if (count >= 2 && (zeroBaseline || oneBaseline)) {
          violations.push(`${file}: 已达到 ≥2 消费者，请删除 baseline 条目`);
        }
        continue;
      }

      if (count >= 2) {
        if (zeroBaseline || oneBaseline) {
          violations.push(`${file}: 已达到 ≥2 消费者，请删除 baseline 条目`);
        }
        continue;
      }

      if (count === 0) {
        if (oneBaseline) {
          violations.push(`${file}: 已降为 0 消费者，请把条目移到 ZERO baseline`);
        } else if (!zeroBaseline) {
          violations.push(`${file}: 0 生产消费者（删除或登记 baseline）`);
        }
      } else if (zeroBaseline) {
        violations.push(`${file}: 已升为 1 消费者，请把条目移到 ONE baseline`);
      } else if (!oneBaseline) {
        violations.push(`${file}: 仅 1 个消费者 (${admission.prodConsumers[0]})`);
      }
    }

    for (const file of [
      ...Object.keys(ZERO_CONSUMER_BASELINE),
      ...Object.keys(ONE_CONSUMER_BASELINE),
    ]) {
      if (!seen.has(file)) {
        violations.push(`${file}: baseline 条目对应的 shared 文件不存在（请删除）`);
      }
      if (TEST_STUBS.has(file)) {
        violations.push(`${file}: 测试桩不应登记 baseline`);
      }
    }

    expect(violations, formatViolations(violations)).toEqual([]);
  });
});
