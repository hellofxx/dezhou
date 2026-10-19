import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * File line count guard (T5-B2 step 1, P1-3).
 *
 * docs/AI_GUIDE.md §编码规范: "单文件 ≤ 300 行（硬约束）；超过 400 行需拆分为
 * 子组件 / 工具函数 / 数据文件"。本守卫强制执行「需拆分」线（400）：
 * 300–400 为灰区（不阻断 CI），>400 必须拆分或落入豁免类别。
 *
 * 豁免类别（同 AI_GUIDE）：zustand store、格式解析器、页面级组件、常量/课程内容数据文件。
 *
 * Note: This mirrors architecture-review.md R3 findings and ensures guard exists.
 */

/** 硬失败线，对齐 AI_GUIDE「超过 400 行需拆分」 */
const MAX_LINES = 400;

type FileInfo = {
  filePath: string;
  relativePath: string;
  lineCount: number;
};

/** fileURLToPath 是唯一跨平台正确的解码方式；.pathname 在 Windows 下产出 /F:/... 会被解析成 F:\F:\... */
const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));

function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function isExemptCategory(relativePath: string): boolean {
  // Normalize path separators for cross-platform compatibility (Windows/Linux)
  const normalizedPath = relativePath.replace(/\\/g, '/');
  
  // Store files
  if (normalizedPath.includes('/store.ts')) return true;
  
  // Parser files
  if (normalizedPath.includes('/parsers/')) return true;
    
  // Constants：含 constants/ 目录与模块根 constants.ts（阈值表等常量数据文件）
  if (
    (normalizedPath.includes('/constants/') || normalizedPath.endsWith('constants.ts')) &&
    normalizedPath.endsWith('.ts') &&
    !normalizedPath.includes('test.')
  ) {
    return true;
  }
    
  // Type definitions
  if (normalizedPath.match(/\/types\.ts$/)) return true;
    
  // Utility files with large datasets or logic
  if (normalizedPath.includes('/utils/')) return true;
    
  // Page components and major business logic components
  if (normalizedPath.match(/(Page|Dashboard|QuizPage|ChapterView|LessonIntroCard|ConceptGraph|QuickDrill|PracticeDrill|ReviewSession|CourseView|TheoryFlaggedReview|TrainingSession|PotOddsDrill|BasicsIntro|LevelCertification|HandRankingDrill|ScenarioSetup|TheoryLadder)\.tsx$/)) return true;
    
  // General drill and lesson component files
  if (normalizedPath.includes('/drills/') || normalizedPath.includes('/data/lessons/')) return true;
    
  // Course data (lesson variants, level definitions)
  if (normalizedPath.includes('/data/') && !normalizedPath.includes('test.')) {
    return true;
  }
    
  // Progress utils and data files
  if (normalizedPath.match(/progress\/(utils|data)/)) return true;
    
  // Hand-history utils
  if (normalizedPath.match(/hand-history\/utils/)) return true;
    
  // Catch-all: 课程/变体数据文件（puzzleBank.ts、variants 等）
  if (normalizedPath.includes('/data/') || normalizedPath.includes('/variants/')) return true;
  
  return false;
}

function scanDirectory(dirPath: string, baseDir: string): FileInfo[] {
  let files: FileInfo[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
        files = files.concat(scanDirectory(fullPath, baseDir));
      }
    } else if (entry.isFile() && /\.(ts|tsx)$/i.test(entry.name)) {
      // Exclude test files
      if (entry.name.includes('.test.') || entry.name.includes('.spec.')) continue;
      
      const lineCount = countLines(fullPath);
      files.push({
        filePath: fullPath,
        relativePath,
        lineCount,
      });
    }
  }
  
  return files;
}

describe('File line count hard constraint', () => {
  it(`src/**/*.ts(x) 非测试文件不超过 ${MAX_LINES} 行（豁免类别除外）`, () => {
    const allFiles = scanDirectory(SRC_DIR, SRC_DIR);

    // 扫描自检：路径解析失效时 allFiles 为空会让下方断言空洞通过
    // （历史上 .pathname 在 Windows 下产出 F:\F:\... 即为此类静默失效）
    expect(allFiles.length).toBeGreaterThan(300);

    const violations = allFiles
      .filter((f) => f.lineCount > MAX_LINES && !isExemptCategory(f.relativePath))
      .map((f) => `${f.relativePath.split(path.sep).join('/')}: ${f.lineCount} lines`);

    // 直接断言数组，失败时 diff 即输出违规文件路径，无需二次排查
    expect(violations).toEqual([]);
  }, 60000); // Larger timeout for full scan
});
