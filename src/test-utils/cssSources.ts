import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * CSS 源拼接读取（守卫专用）。
 *
 * globals.css 是样式入口：`@import "tailwindcss";` + 顺序 `@import './分片.css'` + `@theme`。
 * 守卫需要「按入口 import 顺序拼接后的完整 CSS」，否则 :root / .dealer-slip / light 选择器
 * 会散落在多个分片文件里。裸包名 import（如 tailwindcss）原样保留，由各解析器跳过。
 */

const RELATIVE_IMPORT = /@import\s+["'](\.\/[^"']+\.css)["']\s*;/g;

export interface CssSources {
  /** 实际读取的文件（入口在前，按 import 顺序展开） */
  files: string[];
  /** 入口文本，相对 import 已内联为被导入文件内容 */
  css: string;
}

export function readCssSources(entryPath: string): CssSources {
  const files: string[] = [];
  const css = expand(entryPath, files, new Set<string>());
  if (files.length === 0) throw new Error(`CSS 入口读取失败：${entryPath}`);
  return { files, css };
}

function expand(filePath: string, files: string[], visited: Set<string>): string {
  const resolved = path.resolve(filePath);
  if (visited.has(resolved)) {
    throw new Error(`CSS @import 出现循环引用：${resolved}`);
  }
  visited.add(resolved);
  files.push(resolved);

  const baseDir = path.dirname(resolved);
  const raw = fs.readFileSync(resolved, 'utf8');
  return raw.replace(RELATIVE_IMPORT, (_match, relativePath: string) =>
    expand(path.join(baseDir, relativePath), files, visited),
  );
}