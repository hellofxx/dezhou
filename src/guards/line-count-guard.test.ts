import { beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 文件规模守卫（逐文件棘轮）。
 *
 * docs/AI_GUIDE.md §编码规范「文件大小」：
 * - ≤ 300 行：目标线
 * - 300–400 行：灰区，仅 console.warn 输出清单，不阻断
 * - > 400 行：硬失败
 *
 * 既有超大文件按「单文件」登记在 LEGACY_OVERSIZED_FILES，登记值即当前实测行数（上限，只减不增）：
 * - 文件继续增长 → 失败（不得增长）
 * - 文件拆分回到 400 行以内 → 条目必须删除，否则失败（allowlist 只减不增）
 * 禁止再引入目录 / 类别级豁免：历史的 /data/、/utils/、store.ts、页面组件名枚举等宽泛豁免
 * 使 39 个 >400 行文件全部绕过守卫（逐文件登记后每个文件都被独立约束）。
 */

/** 硬失败线，对齐 docs/AI_GUIDE.md「超过 400 行需拆分」 */
const MAX_LINES = 400;

/** 灰区下限：300–400 行仅告警 */
const WARN_LINES = 300;

/** allowlist 条目：maxLines 为登记时的实测行数（countLines 口径），仅允许下调 */
type OversizedEntry = {
  maxLines: number;
  reason: string;
};

/**
 * 逐文件 allowlist（Phase 2 拆分前临时豁免）。
 * maxLines 必须用与守卫相同的 countLines 逻辑（content.split('\n').length）登记，禁止用 wc -l 口径。
 */
const LEGACY_OVERSIZED_FILES: Record<string, OversizedEntry> = {
  'features/puzzle-trainer/data/puzzleBank.ts': { maxLines: 3632, reason: '课程内容数据（题库）' },
  'features/strategy-academy/data/lessons/variants/standard/standardLevel3.ts': { maxLines: 1819, reason: '课程内容数据' },
  'features/strategy-academy/data/lessons/variants/standard/standardLevel5.ts': { maxLines: 1385, reason: '课程内容数据' },
  'features/strategy-academy/data/lessons/variants/standard/standardLevel6.ts': { maxLines: 1385, reason: '课程内容数据' },
  'features/strategy-academy/data/lessons/variants/standard/standardLevel4b.ts': { maxLines: 1272, reason: '课程内容数据' },
  'features/strategy-academy/data/lessons/variants/standard/standardLevel2.ts': { maxLines: 1253, reason: '课程内容数据' },
  'features/progress/store.ts': { maxLines: 1202, reason: 'Phase 2 拆分待执行（跨模块状态中枢）' },
  'features/strategy-academy/data/lessons/variants/standard/standardLevel4a.ts': { maxLines: 1184, reason: '课程内容数据' },
  'features/strategy-academy/data/lessons/variants/short-deck/shortDeckLevel4.ts': { maxLines: 1060, reason: '课程内容数据' },
  'features/strategy-academy/components/PracticeDrill.tsx': { maxLines: 1001, reason: 'Phase 2 拆分待执行' },
  'features/strategy-academy/data/lessons/variants/short-deck/shortDeckLevel3.ts': { maxLines: 976, reason: '课程内容数据' },
  'features/strategy-academy/data/lessons/variants/standard/standardLevel7.ts': { maxLines: 928, reason: '课程内容数据' },
  'features/strategy-academy/data/lessons/variants/heads-up/headsUpLevel4.ts': { maxLines: 852, reason: '课程内容数据' },
  'features/progress/components/settings/SettingsPage.tsx': { maxLines: 804, reason: '页面级组件' },
  'features/strategy-academy/data/lessons/variants/standard/standardLevel1.ts': { maxLines: 790, reason: '课程内容数据' },
  'features/theory-academy/data/levels/variants/standard/standardLevel9.ts': { maxLines: 415, reason: '课程内容数据' },
  'features/strategy-academy/components/ConceptGraph.tsx': { maxLines: 664, reason: 'Phase 2 拆分待执行' },
  'features/strategy-academy/data/lessons/variants/heads-up/headsUpLevel3.ts': { maxLines: 630, reason: '课程内容数据' },
  'features/pot-odds/components/PotOddsQuizPage.tsx': { maxLines: 536, reason: '页面级组件' },
  'features/strategy-academy/store.ts': { maxLines: 520, reason: 'Phase 2 拆分待执行' },
  'features/progress/components/srs/ReviewSession.tsx': { maxLines: 516, reason: 'Phase 2 拆分待执行' },
  'features/range-trainer/constants.ts': { maxLines: 516, reason: 'Phase 2 拆分待执行（常量数据表）' },
  'features/strategy-academy/components/QuickDrill.tsx': { maxLines: 513, reason: 'Phase 2 拆分待执行' },
  'features/hand-history/store.ts': { maxLines: 477, reason: 'Phase 2 拆分待执行' },
  'features/progress/components/dashboard/Dashboard.tsx': { maxLines: 467, reason: '页面级组件' },
  'features/gto-simulator/utils/strategyCompare.ts': { maxLines: 452, reason: 'Phase 2 拆分待执行' },
  'features/strategy-academy/data/lessons/variants/short-deck/shortDeckLevel8.ts': { maxLines: 440, reason: '课程内容数据' },
  'shared/data/opponentProfiles.ts': { maxLines: 436, reason: 'Phase 2 拆分待执行（跨模块画像数据）' },
  'features/strategy-academy/data/lessons/variants/short-deck/shortDeckLevel7.ts': { maxLines: 430, reason: '课程内容数据' },
  'features/strategy-academy/data/lessons/variants/heads-up/headsUpLevel5.ts': { maxLines: 429, reason: '课程内容数据' },
  'features/strategy-academy/data/lessons/variants/short-deck/shortDeckLevel6.ts': { maxLines: 419, reason: '课程内容数据' },
  'features/strategy-academy/data/lessons/variants/short-deck/shortDeckLevel5.ts': { maxLines: 415, reason: '课程内容数据' },
  'features/theory-academy/data/levels/variants/short-deck/shortDeckLevel5.ts': { maxLines: 404, reason: '课程内容数据' },
};

/**
 * 章节题库数据文件豁免（窄口径）。
 *
 * theory-academy 的章末题库按 Level 单文件维护（standard `quizBank/t1..t9.ts`、
 * heads-up `quizBank/t1hu..t9hu.ts`），本质是纯数据：
 * 每条记录是 6 行结构化字面量，拆分只能按题号切文件，反而破坏「按章节 id 注入」的契约。
 * 因此只对上述精确路径登记逐文件上限（只减不增），并从通用 >400 行扫描中排除；
 * 禁止扩大到块数据、level 文件或任何目录级豁免。
 * 专属断言见「QUIZ_BANK_ALLOWLIST 只允许题库路径且不得超过登记行数」。
 */
const QUIZ_BANK_ALLOWLIST: Record<string, OversizedEntry> = {
  'features/theory-academy/data/levels/variants/standard/quizBank/t1.ts': { maxLines: 239, reason: '章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/standard/quizBank/t2.ts': { maxLines: 181, reason: '章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/standard/quizBank/t3.ts': { maxLines: 239, reason: '章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/standard/quizBank/t4.ts': { maxLines: 355, reason: '章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/standard/quizBank/t5.ts': { maxLines: 297, reason: '章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/standard/quizBank/t6.ts': { maxLines: 413, reason: '章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/standard/quizBank/t7.ts': { maxLines: 239, reason: '章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/standard/quizBank/t8.ts': { maxLines: 239, reason: '章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/standard/quizBank/t9.ts': { maxLines: 427, reason: '章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/heads-up/quizBank/t1hu.ts': { maxLines: 600, reason: '单挑章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/heads-up/quizBank/t2hu.ts': { maxLines: 600, reason: '单挑章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/heads-up/quizBank/t3hu.ts': { maxLines: 600, reason: '单挑章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/heads-up/quizBank/t4hu.ts': { maxLines: 600, reason: '单挑章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/heads-up/quizBank/t5hu.ts': { maxLines: 600, reason: '单挑章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/heads-up/quizBank/t6hu.ts': { maxLines: 600, reason: '单挑章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/heads-up/quizBank/t7hu.ts': { maxLines: 600, reason: '单挑章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/heads-up/quizBank/t8hu.ts': { maxLines: 600, reason: '单挑章末题库数据（按 Level 拆分）' },
  'features/theory-academy/data/levels/variants/heads-up/quizBank/t9hu.ts': { maxLines: 600, reason: '单挑章末题库数据（按 Level 拆分）' },
  'features/strategy-academy/data/lessons/variants/standard/quizBank/level1.ts': { maxLines: 800, reason: '策略 L1 题库数据（按 Level 拆分）' },
  'features/strategy-academy/data/lessons/variants/standard/quizBank/level2.ts': { maxLines: 900, reason: '策略 L2 题库数据（按 Level 拆分）' },
  'features/strategy-academy/data/lessons/variants/standard/quizBank/level3.ts': { maxLines: 1200, reason: '策略 L3 题库数据（按 Level 拆分）' },
  'features/strategy-academy/data/lessons/variants/standard/quizBank/level4.ts': { maxLines: 1400, reason: '策略 L4A/L4B 共用题库数据' },
  'features/strategy-academy/data/lessons/variants/standard/quizBank/level5.ts': { maxLines: 900, reason: '策略 L5 题库数据（按 Level 拆分）' },
  'features/strategy-academy/data/lessons/variants/standard/quizBank/level6.ts': { maxLines: 800, reason: '策略 L6 题库数据（按 Level 拆分）' },
  'features/strategy-academy/data/lessons/variants/standard/quizBank/level7.ts': { maxLines: 2000, reason: '策略 L7 题库数据（含本土课拆出后的标准课）' },
  'features/strategy-academy/data/lessons/variants/standard/quizBank/level8.ts': { maxLines: 600, reason: '策略 L8 题库数据（按 Level 拆分）' },
  'features/strategy-academy/data/lessons/variants/standard/quizBank/local.ts': { maxLines: 1800, reason: '策略本土课题库数据（16 课）' },
};

/** 题库路径的精确形态：理论 standard t1-t9 + heads-up t1hu-t9hu + 策略 level1-8/local，不接受子目录或其他命名 */
const QUIZ_BANK_PATH_RE =
  /^features\/(?:theory|strategy)-academy\/data\/(?:levels|lessons)\/variants\/(?:standard\/quizBank\/(?:t[1-9]|level[1-8]|local)|heads-up\/quizBank\/t[1-9]hu)\.ts$/;

type FileInfo = {
  filePath: string;
  relativePath: string;
  lineCount: number;
};

/** fileURLToPath 是唯一跨平台正确的解码方式；.pathname 在 Windows 下产出 /F:/... 会被解析成 F:\F:\... */
const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));

/** 与 allowlist 登记口径一致：按 \n 切分计数（不用 wc -l，避免末行无换行时差 1 行） */
function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function scanDirectory(dirPath: string, baseDir: string): FileInfo[] {
  const files: FileInfo[] = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
      files.push(...scanDirectory(fullPath, baseDir));
      continue;
    }

    if (!entry.isFile() || !/\.(ts|tsx)$/i.test(entry.name)) continue;
    // Exclude test files
    if (entry.name.includes('.test.') || entry.name.includes('.spec.')) continue;

    files.push({
      filePath: fullPath,
      relativePath: toPosix(path.relative(baseDir, fullPath)),
      lineCount: countLines(fullPath),
    });
  }

  return files;
}

describe('File line count hard constraint（逐文件棘轮）', () => {
  let allFiles: FileInfo[] = [];

  beforeAll(() => {
    allFiles = scanDirectory(SRC_DIR, SRC_DIR);
  });

  it('扫描自检：解析到足够多的源文件', () => {
    // 路径解析失效时 allFiles 为空会让下方断言空洞通过
    // （历史上 .pathname 在 Windows 下产出 F:\F:\... 即为此类静默失效）
    expect(allFiles.length).toBeGreaterThan(300);
  });

  it(`src/**/*.ts(x) 非测试文件不超过 ${MAX_LINES} 行（未登记即失败）`, () => {
    const grayZone = allFiles
      .filter((f) => f.lineCount > WARN_LINES && f.lineCount <= MAX_LINES)
      .map((f) => `${f.relativePath}: ${f.lineCount} lines`);

    // 灰区只告警不阻断：输出清单便于纳入拆分排期
    if (grayZone.length > 0) {
      console.warn(
        `[line-count-guard] ${grayZone.length} 个文件处于 ${WARN_LINES}-${MAX_LINES} 行灰区（不阻断，纳入拆分计划）：\n  ${grayZone.join('\n  ')}`,
      );
    }

    const violations = allFiles
      .filter(
        (f) =>
          f.lineCount > MAX_LINES &&
          LEGACY_OVERSIZED_FILES[f.relativePath] === undefined &&
          QUIZ_BANK_ALLOWLIST[f.relativePath] === undefined,
      )
      .map((f) => `${f.relativePath}: ${f.lineCount} lines（未登记，请拆分或登记 allowlist）`);

    // 直接断言数组，失败时 diff 即输出违规文件路径，无需二次排查
    expect(violations).toEqual([]);
  }, 60000); // Larger timeout for full scan

  it('已登记的既有超大文件不得超过登记行数（棘轮：只减不增）', () => {
    const byPath = new Map(allFiles.map((f) => [f.relativePath, f]));
    const violations: string[] = [];

    for (const [relativePath, entry] of Object.entries(LEGACY_OVERSIZED_FILES)) {
      const file = byPath.get(relativePath);

      if (!file) {
        violations.push(`${relativePath}: 文件不存在（请删除该 allowlist 条目）`);
        continue;
      }

      if (file.lineCount > entry.maxLines) {
        violations.push(
          `${relativePath}: ${file.lineCount} lines > maxLines ${entry.maxLines}（棘轮：不得增长；拆分后同步下调 maxLines）`,
        );
        continue;
      }

      if (file.lineCount <= MAX_LINES) {
        violations.push(
          `${relativePath}: ${file.lineCount} lines 已回到 ${MAX_LINES} 行以内（请删除条目，allowlist 只减不增）`,
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it('QUIZ_BANK_ALLOWLIST 只允许题库路径，且每个题库文件都登记、都不得超过 maxLines', () => {
    const byPath = new Map(allFiles.map((f) => [f.relativePath, f]));
    const bad: string[] = [];

    for (const [relativePath, entry] of Object.entries(QUIZ_BANK_ALLOWLIST)) {
      if (!QUIZ_BANK_PATH_RE.test(relativePath)) {
        bad.push(`${relativePath}: 非题库路径，禁止使用题库豁免`);
        continue;
      }
      if (!entry.reason.trim()) bad.push(`${relativePath}: reason 为空`);
      const file = byPath.get(relativePath);
      if (!file) {
        bad.push(`${relativePath}: 文件不存在（请删除该 allowlist 条目）`);
        continue;
      }
      if (file.lineCount > entry.maxLines) {
        bad.push(`${relativePath}: ${file.lineCount} > maxLines ${entry.maxLines}（棘轮：只减不增）`);
      }
    }

    // 反向覆盖：磁盘上的题库文件必须与 allowlist 精确一致，防止新增题库文件绕过豁免口径
    const scanned = allFiles
      .filter((f) => QUIZ_BANK_PATH_RE.test(f.relativePath))
      .map((f) => f.relativePath)
      .toSorted();
    expect(scanned).toEqual(Object.keys(QUIZ_BANK_ALLOWLIST).toSorted());
    expect(bad).toEqual([]);
  });
});
