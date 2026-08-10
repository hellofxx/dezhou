/**
 * Agent Tools & Code-Reference Validation Script (Native FS, No Dependencies)
 *
 * 1. 校验 .claude/agents/*.md 的 tools 字段是否合规
 * 2. 校验 agent 文件声明的 src/features/<module> 路径是否真实存在（防止描述漂移）
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

type ToolSet = string[];

const FEATURE_DEV_TOOLS: ToolSet = [
  'Read', 'Glob', 'Grep', 'LSP', 'GetProblems',
  'SearchReplace', 'Write', 'DeleteFile',
  'Bash', 'GetTerminalOutput',
];

const UI_UX_DEV_TOOLS: ToolSet = [
  'Read', 'Glob', 'Grep', 'LSP', 'GetProblems',
  'SearchReplace', 'Write',
  'Bash', 'GetTerminalOutput',
]; // 缺少 DeleteFile

function getExpectedTools(moduleName: string): ToolSet {
  const base = moduleName.replace(/-dev\.md$/, '');
  return base === 'ui-ux' ? UI_UX_DEV_TOOLS : FEATURE_DEV_TOOLS;
}

function extractTools(filePath: string): string[] | null {
  const content = readFileSync(filePath, 'utf-8');
  // 宽松的正则匹配 frontmatter
  const match = content.match(/---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm = match[1];
  const toolsSection = fm.match(/tools:\s*\n([\s\S]*?)(?:\n[a-z]|$)/);
  if (!toolsSection) return null;

  const toolsLines = toolsSection[1].trim().split('\n');
  return toolsLines
    .map(t => t.trim())
    .filter(t => t.startsWith('-'))
    .map(t => t.slice(1).trim());
}

// Native fs implementation (no external dependencies)
const AGENTS_DIR = join(process.cwd(), '.claude', 'agents');
const REPO_ROOT = process.cwd();

function listAgentFiles(): string[] {
  try {
    const entries = readdirSync(AGENTS_DIR);
    return entries
      .filter(f => f.endsWith('-dev.md'))
      .map(f => join('.claude', 'agents', f));
  } catch (error) {
    console.error(`❌ Error reading agents directory: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * agent↔code 一致性校验（报告 P2-8）。
 * 扫描每个 agent 文件声明的 src/features/<module> 路径，检查对应目录是否真实存在。
 * 仅产生 warning（不阻断），用于自动发现 agent 描述已漂移的模块路径。
 */
function checkAgentCodeReferences(): boolean {
  let warnings = false;
  const files = listAgentFiles();
  const moduleRe = /src\/features\/([a-z][a-z0-9-]*)/g;

  for (const filePath of files) {
    const content = readFileSync(join(REPO_ROOT, filePath), 'utf-8');
    const refs = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = moduleRe.exec(content)) !== null) {
      refs.add(m[1]);
    }
    for (const mod of refs) {
      const dir = join(REPO_ROOT, 'src', 'features', mod);
      if (!existsSync(dir)) {
        console.log(`⚠️  ${filePath}`);
        console.log(`   └─ Warning: 引用的模块路径 src/features/${mod} 不存在（描述可能已漂移）`);
        warnings = true;
      }
    }
  }
  return warnings;
}

function main() {
  console.log('🔍 Starting agent tools validation...\n');

  const files = readdirSync(AGENTS_DIR)
    .filter(f => f.endsWith('-dev.md'))
    .map(f => join('.claude', 'agents', f));

  if (files.length === 0) {
    console.log('⚠️  No agent files found.');
    process.exit(0);
  }

  console.log(`Found ${files.length} agent files.\n`);

  let hasErrors = false;
  let hasWarnings = false;

  for (const filePath of files) {
    const tools = extractTools(join(process.cwd(), filePath));

    if (!tools) {
      console.log(`❌ ${filePath}`);
      console.log(`   └─ Error: Cannot parse frontmatter`);
      hasErrors = true;
      continue;
    }

    const expected = getExpectedTools(basename(filePath));
    const missing = expected.filter(t => !tools.includes(t));
    const extra = tools.filter(t => !expected.includes(t));

    if (missing.length > 0) {
      console.log(`❌ ${filePath}`);
      console.log(`   └─ Error: Missing required tools ${missing.join(', ')}`);
      hasErrors = true;
    } else if (extra.length > 0) {
      console.log(`⚠️  ${filePath}`);
      console.log(`   └─ Warning: Extra tools ${extra.join(', ')}`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${filePath}`);
    }
  }

  console.log('\n📎 Checking agent↔code references...');
  if (checkAgentCodeReferences()) {
    hasWarnings = true;
  }

  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ Validation FAILED');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Validation passed with warnings');
    process.exit(0);
  } else {
    console.log('✅ Validation PASSED');
    process.exit(0);
  }
}

main();
