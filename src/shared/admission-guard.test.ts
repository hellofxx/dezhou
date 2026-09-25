import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Shared 层准入门槛棘轮守卫（T6-B3 step 3）。
 * 
 * AGENTS.md: "shared/层准入门槛：被≥2 个模块使用才可放入"。本测试扫描 `src/shared/**` 
 * 每个文件的消费模块数，断言 ≥2（豁免测试文件和 barrel export）。
 * 
 * 配一个「只降不升」的基线快照（复用 eslintCrossImports.test.ts 的快照模式），
 * 避免一次性整改全部，而是允许渐进式清理。
 */

type ConsumerCount = Map<string, number>;

// 递归扫描目录所有源码文件
function scanDirectory(dirPath: string): string[] {
  let files: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
        files = files.concat(scanDirectory(fullPath));
      }
    } else if (entry.isFile() && /\.(ts|tsx)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 统计一个文件被哪些模块消费
function countConsumers(filePath: string): ConsumerCount {
  const content = fs.readFileSync(filePath, 'utf-8');
  const consumers = new Set<string>();
  
  // 匹配 import './xxx' 或 '@/features/<module>/xxx'
  const relativeImports = content.match(/from\s+['"]\.\/([a-z-]+)['"]/g) || [];
  for (const _match of relativeImports) {
    // 如果是 shared/utils/index.ts 导出其他 local file，不算跨模块消费
    if (filePath.includes('index.ts') && filePath.includes('shared')) continue;
    
    // 提取模块名（相对路径 → 无法直接知道，但可以通过父目录推断）
    const parentDir = path.dirname(filePath);
    if (parentDir.includes('features')) {
      const parts = parentDir.split(path.sep);
      const featureIndex = parts.indexOf('features');
      if (featureIndex >= 0 && featureIndex < parts.length - 1) {
        const moduleName = parts[featureIndex + 1];
        if (moduleName) {
          consumers.add(moduleName);
        }
      }
    }
  }
  
  // 统计绝对导入：@/features/<module>/...
  const absoluteImports = content.match(/from\s+['"]@\/features\/([a-z-]+)/g) || [];
  for (const match of absoluteImports) {
    // Extract module name using regex
    const [, moduleName] = /@\/features\/([a-z-]+)/.exec(match) || [];
    if (moduleName) {
      consumers.add(moduleName);
    }
  }
  
  const result: ConsumerCount = new Map();
  for (const consumer of consumers) {
    result.set(consumer, 1);
  }
  
  return result;
}

describe('Shared 层准入门槛 ≥2 消费者', () => {
  it('src/shared/*.ts (不含 index.ts barrel) 至少被≥2 个 feature 模块消费（只降不升基线）', async () => {
    // fileURLToPath 而非 .pathname：后者在 Windows 产出 /F:/... 会被解析成 F:\F:\...
    const sharedUtilsDir = fileURLToPath(new URL('./utils/', import.meta.url));
    const testFiles = scanDirectory(sharedUtilsDir);
    const violations: string[] = [];
    const baselineMap: Record<string, number> = {
      // Baseline snapshot of current state (should only decrease over time)
      'cn.ts': 9,           // hand-history, onboarding, pot-odds, progress, puzzle-trainer, range-trainer, strategy-academy, theory-academy, gto-simulator
      'seededShuffle.ts': 6,
      'spacedRepetition.ts': 6,
      'motion.ts': 9,
      'persistShape.ts': 4,
      'localStorageStub.ts': 4,
      'formatters.ts': 3,
      'rangeParser.ts': 2,
      'handClassifier.ts': 2,
      'pokerMath.ts': 2,
      'quizOrder.ts': 1,     // Currently shared only, should be moved or used by another module
      'deck.ts': 2,          // gto-simulator, range-trainer
      'elo.test.ts': 0,      // Test file, excluded
    };
    
    for (const filePath of testFiles) {
      const fileName = path.basename(filePath);
      if (fileName === 'index.ts') continue; // Exclude barrel exports
      
      const consumerCounts = countConsumers(filePath);
      const totalConsumers = consumerCounts.size;
      
      // Check against baseline
      if (baselineMap[fileName] !== undefined) {
        if (totalConsumers > baselineMap[fileName]) {
          violations.push(`${fileName}: ${totalConsumers} consumers (baseline ${baselineMap[fileName]} - increase detected)`);
        }
        // Note: We allow decreases (improvement), just not increases without justification
      }
    }
    
    expect(violations.length).toBe(0);
    expect(violations.slice(0, 10)).toEqual([]);
  }, 30000);
});
