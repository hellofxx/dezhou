/**
 * Agent Tools Validation Script (Native FS, No Dependencies)
 * 
 * 校验 .claude/agents/*.md 的 tools 字段是否合规
 */

import { readFileSync, readdirSync } from 'fs';
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

function main() {
  console.log('🔍 Starting agent tools validation...\n');
  
  const files = readdirSync(AGENTS_DIR)
    .filter(f => f.endsWith('-dev.md'))
    .map(f => join('.claude', 'agents', f));
  
  if (files.length === 0) {
    console.log('⚠️ No agent files found.');
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
      console.log(`⚠️ ${filePath}`);
      console.log(`   └─ Warning: Extra tools ${extra.join(', ')}`);
      hasWarnings = true;
    } else {
      console.log(`✅ ${filePath}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ Validation FAILED');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️ Validation passed with warnings');
    process.exit(0);
  } else {
    console.log('✅ Validation PASSED');
    process.exit(0);
  }
}

main();
