import { beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 文件规模守卫（逐文件棘轮）。
 *
 * docs/AI_GUIDE.md §编码规范「文件大小」：
 * - 课程内容数据文件：不做行数限制（正文 / 题库 / 章节块随内容量增长）
 * - 其余逻辑 / UI / 常量文件：≤ 300 行目标，300–400 灰区告警，> 400 硬失败
 *
 * 课程内容豁免只按精确路径形态匹配（策略 lessons/variants、localLessons、basicsContent；
 * 理论 levels/variants 的 Level / chapters / quizBank / blocks / 章节推荐），
 * 逻辑文件（composeVariantChapters / loaders / index 等）仍受通用行数约束。
 *
 * 既有非课程超大文件按「单文件」登记在 LEGACY_OVERSIZED_FILES，登记值即当前实测行数（上限，只减不增）：
 * - 文件继续增长 → 失败（不得增长）
 * - 文件拆分回到 400 行以内 → 条目必须删除，否则失败（allowlist 只减不增）
 * 禁止再引入目录 / 类别级宽泛豁免；课程内容豁免是唯一类别级例外，且有精确路径正则兜底。
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
  'features/puzzle-trainer/data/puzzleBank.ts': { maxLines: 3632, reason: '题库数据（非课程内容文件，仍受行数约束）' },
  'features/progress/store.ts': { maxLines: 1202, reason: 'Phase 2 拆分待执行（跨模块状态中枢）' },
  'features/strategy-academy/components/PracticeDrill.tsx': { maxLines: 1001, reason: 'Phase 2 拆分待执行' },
  'features/progress/components/settings/SettingsPage.tsx': { maxLines: 804, reason: '页面级组件' },
  'features/strategy-academy/components/ConceptGraph.tsx': { maxLines: 664, reason: 'Phase 2 拆分待执行' },
  'features/pot-odds/components/PotOddsQuizPage.tsx': { maxLines: 536, reason: '页面级组件' },
  'features/strategy-academy/store.ts': { maxLines: 520, reason: 'Phase 2 拆分待执行' },
  'features/progress/components/srs/ReviewSession.tsx': { maxLines: 516, reason: 'Phase 2 拆分待执行' },
  'features/range-trainer/constants.ts': { maxLines: 516, reason: 'Phase 2 拆分待执行（常量数据表）' },
  'features/strategy-academy/components/QuickDrill.tsx': { maxLines: 513, reason: 'Phase 2 拆分待执行' },
  'features/hand-history/store.ts': { maxLines: 477, reason: 'Phase 2 拆分待执行' },
  'features/progress/components/dashboard/Dashboard.tsx': { maxLines: 467, reason: '页面级组件' },
  'features/gto-simulator/utils/strategyCompare.ts': { maxLines: 452, reason: 'Phase 2 拆分待执行' },
  'shared/data/opponentProfiles.ts': { maxLines: 436, reason: 'Phase 2 拆分待执行（跨模块画像数据）' },
};

/**
 * 课程内容数据文件（不做行数限制）。
 *
 * 课程正文 / 题库 / 章节块是纯教学内容，体量随课程与题量增长，拆分只会在语义上
 * 切碎同一门课或同一章题库；因此按精确路径豁免，而非逐文件 allowlist。
 * 只匹配数据文件，逻辑文件（composeVariantChapters / loaders / index 等）仍受 ≤300 / >400 约束。
 */
const COURSE_CONTENT_PATH_RE = new RegExp(
  [
    '^features/strategy-academy/data/lessons/variants/.+\\.ts$',
    '^features/strategy-academy/data/localLessons/.+\\.ts$',
    '^features/strategy-academy/data/basicsContent\\.ts$',
    '^features/theory-academy/data/levels/variants/(?:[^/]+/)?(?:standardLevel\\d+|shortDeckLevel\\d+|headsUpLevel\\d+|chapterPracticeMap|chapterMeta)\\.ts$',
    '^features/theory-academy/data/levels/variants/.+/(?:chapters|quizBank|blocks)/.+\\.ts$',
  ].join('|'),
);


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
      .filter(
        (f) =>
          !COURSE_CONTENT_PATH_RE.test(f.relativePath) &&
          f.lineCount > WARN_LINES &&
          f.lineCount <= MAX_LINES,
      )
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
          !COURSE_CONTENT_PATH_RE.test(f.relativePath) &&
          LEGACY_OVERSIZED_FILES[f.relativePath] === undefined,
      )
      .map(
        (f) =>
          `${f.relativePath}: ${f.lineCount} lines（未登记，请拆分或登记 allowlist；课程内容文件不受此限制）`,
      );

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

  it('课程内容数据文件不做行数限制，且豁免路径精确', () => {
    const courseFiles = allFiles.filter((f) => COURSE_CONTENT_PATH_RE.test(f.relativePath));
    // 防路径失配导致豁免空转：至少覆盖策略 lesson / 题库与理论章节 / 题库
    expect(courseFiles.length).toBeGreaterThan(30);
    for (const relativePath of [
      'features/strategy-academy/data/lessons/variants/standard/standardLevel3.ts',
      'features/strategy-academy/data/lessons/variants/heads-up/lessons/l7hu-stakes.ts',
      'features/strategy-academy/data/lessons/variants/heads-up/quizBank/l8hu.ts',
      'features/theory-academy/data/levels/variants/heads-up/quizBank/t9hu.ts',
      'features/theory-academy/data/levels/variants/standard/chapters/t3-blind-battle.ts',
    ]) {
      expect(courseFiles.some((f) => f.relativePath === relativePath), relativePath).toBe(true);
    }

    // 课程豁免与 legacy allowlist 不得重叠（否则又会重新施加 maxLines）
    const overlap = courseFiles
      .filter((f) => LEGACY_OVERSIZED_FILES[f.relativePath] !== undefined)
      .map((f) => f.relativePath);
    expect(overlap).toEqual([]);

    // 逻辑 / 聚合 / UI 文件不得被课程豁免误匹配
    const shouldNotMatch = [
      'features/theory-academy/data/levels/variants/composeVariantChapters.ts',
      'features/theory-academy/data/levels/variants/applyQuizBank.ts',
      'features/theory-academy/data/levels/variants/standard/index.ts',
      'features/strategy-academy/data/lessons/loaders.ts',
      'features/strategy-academy/components/CourseView.tsx',
    ];
    expect(shouldNotMatch.filter((p) => COURSE_CONTENT_PATH_RE.test(p))).toEqual([]);
  });

  it('课程内容文件即使超过 400 行也不进入违规清单', () => {
    const oversizedCourseFiles = allFiles
      .filter((f) => COURSE_CONTENT_PATH_RE.test(f.relativePath) && f.lineCount > MAX_LINES)
      .map((f) => f.relativePath);
    expect(oversizedCourseFiles.length).toBeGreaterThan(0);
    const violations = new Set(
      allFiles
        .filter(
          (f) =>
            f.lineCount > MAX_LINES &&
            !COURSE_CONTENT_PATH_RE.test(f.relativePath) &&
            LEGACY_OVERSIZED_FILES[f.relativePath] === undefined,
        )
        .map((f) => f.relativePath),
    );
    expect(oversizedCourseFiles.filter((p) => violations.has(p))).toEqual([]);
  });
});
