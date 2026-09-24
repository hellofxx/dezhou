import { describe, expect, it } from 'vitest';

/**
 * 实际依赖图 ⊆ 白名单守卫（T5-B2 step 2）。
 * 
 * eslintCrossImports.test.ts:41-44 只校验 `ALLOWED_CROSS_IMPORTS` 常量等于硬编码快照，
 * 不管代码里是否产生了新边。本测试静态扫描 `src/features/**` 全部 import（含动态 import()），
 * 聚合实际依赖图，断言其为白名单子集。
 * 
 * 这补齐了 eslintGuard 的盲区：动态 import 同样构成编译期依赖边。
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

type CrossImportMap = Record<string, string[]>;
type ActualEdges = Map<string, Set<string>>;

// tsconfig 未开 allowJs，改用运行时 URL 导入 JS 配置
async function loadAllowedCrossImports(): Promise<CrossImportMap> {
  const configUrl = new URL('../../eslint.config.js', import.meta.url).href;
  const mod = await import(configUrl) as { ALLOWED_CROSS_IMPORTS: CrossImportMap };
  return mod.ALLOWED_CROSS_IMPORTS;
}

// 静态扫描一个模块文件的全部 import 语句
function scanModuleImports(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const imports: string[] = [];
  
  // 匹配两种 import 模式：
  // 1. import xxx from '@/features/xxx' 或 '@/features/xxx/...'
  // 2. import() 动态 import
  for (const line of lines) {
    // 别名形式：@/features/<module>
    const aliasMatch = line.match(/from\s+['"]@\/features\/([a-z-]+)/);
    if (aliasMatch) {
      const moduleName = aliasMatch[1];
      if (moduleName) {
        imports.push(moduleName);
      }
      continue;
    }
    
    // 相对路径形式：../../<module> 或 ../../../<module>
    const relativeMatch = line.match(/(\.\/|\.\.\/)+([a-z-]+)(?:\/|$)/);
    if (relativeMatch && relativeMatch[0].includes('features')) {
      // 提取最后的文件夹名作为模块名
      const parts = relativeMatch[0].split('/');
      const moduleName = parts[parts.length - 1];
      if (moduleName && /^[a-z-]+$/.test(moduleName)) {
        imports.push(moduleName);
      }
    }
    
    // 动态 import: import('@/features/xxx')
    const dynamicMatch = line.match(/import\(['"]@\/features\/([a-z-]+)/);
    if (dynamicMatch) {
      const moduleName = dynamicMatch[1];
      if (moduleName) {
        imports.push(moduleName);
      }
    }
  }
  
  return imports;
}

// 递归扫描模块目录的所有源码文件
function scanModuleDirectory(dirPath: string): string[] {
  let files: string[] = [];
  
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
        files = files.concat(scanModuleDirectory(fullPath));
      }
    } else if (entry.isFile() && /\.(ts|tsx)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 聚合实际依赖边
async function aggregateActualEdges(): Promise<ActualEdges> {
  const edges = new Map<string, Set<string>>();
  // 从当前目录（src/features/）往上两级的 parentDir 得到 src/features/
  import.meta.url 在 CI 中是 file:///home/runner/work/dezhou/dezhou/src/features/xxx.test.ts
  // 需要解析出 src/features/ 目录
  const currentPath = import.meta.url.replace('/src/features/eslint-guard-dependency-graph.test.ts', '');
  const featuresDir = join(currentPath, '..').replace(/file:\/\//, '').replace(/\\/g, '/');
  
  const modules = readdirSync(featuresDir);
  
  for (const moduleName of modules) {
    const moduleDir = join(featuresDir, moduleName);
    if (!statSync(moduleDir).isDirectory()) continue;
    
    edges.set(moduleName, new Set());
    
    const files = scanModuleDirectory(moduleDir);
    for (const filePath of files) {
      const importedModules = scanModuleImports(filePath);
      for (const target of importedModules) {
        if (target !== moduleName) { // 不记录 self-import
          edges.get(moduleName)!.add(target);
        }
      }
    }
  }
  
  return edges;
}

describe('实际依赖图 ⊆ 白名单守卫', () => {
  it('所有 feature 模块的实际跨模块导入边必须在 ALLOWED_CROSS_IMPORTS 允许范围内', async () => {
    const allowed = await loadAllowedCrossImports();
    const actual = await aggregateActualEdges();
    const failures: string[] = [];
    
    for (const [source, targets] of actual.entries()) {
      const allowedTargets = new Set(allowed[source] || []);
      for (const target of targets) {
        if (!allowedTargets.has(target)) {
          failures.push(`${source} → ${target} (expected in whitelist)`);
        }
      }
    }
    
    expect(failures.length).toBe(0);
    expect(failures.slice(0, 10)).toEqual([]);
  }, 30000); // 长超时因为要扫描全仓
});
