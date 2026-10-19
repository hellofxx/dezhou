#!/usr/bin/env node
/**
 * 生成 docs/agents/MODULE_MAP.md（模块 / lazy 路由 / i18n 分组的事实地图）。
 *
 * 数据源（本脚本只读，不写除输出文件外的任何路径）：
 * - src/features/*            模块清单、store.ts、components/、测试数量
 * - src/app/routes.tsx        lazyPage / lazyPageWithFeature 声明、router 的 path 字符串
 * - eslint.config.js          ALLOWED_CROSS_IMPORTS（跨模块允许边唯一事实源）
 * - src/i18n/moduleRegistry.ts CORE_MODULES / FEATURE_GROUPS
 * - .claude/agents/*-dev.md   模块 owner 代理是否存在
 *
 * 解析方式说明（为什么不是 AST）：仓库 typescript 为 7.x 原生编译器，其包仅导出
 * version 元数据，不提供 createSourceFile 等 JS 编译器 API（.pnpmfile.cjs 已因此为
 * lint 工具链侧载 TS 6）。为保持「零新依赖」并避免依赖 pnpm store 内部路径，本脚本
 * 使用自带的结构扫描器（先去注释 + 字符串感知的括号配平），只做确定性文本结构提取。
 *
 * 用法：
 *   node scripts/generate-agent-map.mjs          写入文件
 *   node scripts/generate-agent-map.mjs --check  与现有文件按 LF 归一比较，不一致 exit 1
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = 'docs/agents/MODULE_MAP.md';
const HEADER = '<!-- 由 scripts/generate-agent-map.mjs 生成；pnpm agents:map 重新生成；不要手改 -->';
const EXPECTED_MODULE_COUNT = 10;
const MIN_LAZY_DECLARATIONS = 21;
const MIN_AGENT_FILES = 10;

/** 读源码并把注释替换为空格（保留换行），字符串字面量原样保留。 */
function readSource(relPath) {
  const src = readFileSync(join(ROOT, relPath), 'utf8');
  const out = src.split('');
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === '"' || ch === "'" || ch === '`') {
      i += 1;
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        const isEnd = src[i] === ch;
        i += 1;
        if (isEnd) break;
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') { out[i] = ' '; i += 1; }
      continue;
    }
    if (ch === '/' && next === '*') {
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] !== '\n') out[i] = ' ';
        i += 1;
      }
      if (i < src.length) { out[i] = ' '; out[i + 1] = ' '; i += 2; }
      continue;
    }
    i += 1;
  }
  return out.join('');
}

/** 标记「代码位」：字符串 / 模板串内部置 0，避免结构字符在文本里误命中。 */
function codeMask(src) {
  const mask = new Uint8Array(src.length);
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i += 1;
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        const isEnd = src[i] === ch;
        i += 1;
        if (isEnd) break;
      }
      continue;
    }
    mask[i] = 1;
    i += 1;
  }
  return mask;
}

/** 从 openIndex（`(` / `{` / `[`）找到配平的闭合位置，找不到返回 -1。 */
function findBalanced(src, mask, openIndex) {
  const open = src[openIndex];
  const close = open === '(' ? ')' : open === '{' ? '}' : ']';
  let depth = 0;
  for (let i = openIndex; i < src.length; i += 1) {
    if (!mask[i]) continue;
    if (src[i] === open) depth += 1;
    else if (src[i] === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** 按顶层逗号切分 [start, end) 区间，返回区间数组。 */
function splitTopLevel(src, mask, start, end) {
  const parts = [];
  let depth = 0;
  let segStart = start;
  for (let i = start; i < end; i += 1) {
    if (!mask[i]) continue;
    const ch = src[i];
    if (ch === '(' || ch === '{' || ch === '[') depth += 1;
    else if (ch === ')' || ch === '}' || ch === ']') depth -= 1;
    else if (ch === ',' && depth === 0) {
      parts.push([segStart, i]);
      segStart = i + 1;
    }
  }
  if (segStart < end) parts.push([segStart, end]);
  return parts;
}

/** 在 [from, to) 内取首个 openChar 容器的内容区间（不含括号），找不到返回 null。 */
function containerRange(src, mask, from, to, openChar) {
  for (let i = from; i < to; i += 1) {
    if (!mask[i] || src[i] !== openChar) continue;
    const close = findBalanced(src, mask, i);
    if (close < 0) return null;
    return [i + 1, close];
  }
  return null;
}

/** 定位 `export const NAME = ` 右值起点（代码位上的首个匹配），找不到返回 -1。 */
function findDeclarationValueStart(src, mask, name) {
  const re = new RegExp(`\\bexport\\s+const\\s+${name}\\b[^=]*=`, 'g');
  let m;
  while ((m = re.exec(src)) !== null) {
    if (mask[m.index]) return m.index + m[0].length;
  }
  return -1;
}

const unquote = (raw) => raw.trim().replace(/^['"]|['"]$/g, '');

/** 解析字符串字面量数组（`['a', 'b']`），保持源码顺序。 */
function parseStringArray(src, mask, name) {
  const valueStart = findDeclarationValueStart(src, mask, name);
  if (valueStart < 0) return [];
  const range = containerRange(src, mask, valueStart, src.length, '[');
  if (!range) return [];
  return splitTopLevel(src, mask, range[0], range[1]).map(([s, e]) => unquote(src.slice(s, e))).filter(Boolean);
}

/** 解析 `{ key: ['a', 'b'] }` 形式的映射，返回 [key, values] 数组（源码顺序）。 */
function parseStringArrayMap(src, mask, name) {
  const valueStart = findDeclarationValueStart(src, mask, name);
  if (valueStart < 0) return [];
  const range = containerRange(src, mask, valueStart, src.length, '{');
  if (!range) return [];
  const entries = [];
  for (const [s, e] of splitTopLevel(src, mask, range[0], range[1])) {
    const seg = src.slice(s, e);
    const keyMatch = seg.match(/^\s*(?:['"]([^'"]+)['"]|([A-Za-z_$][\w$]*))\s*:/);
    if (!keyMatch) continue;
    const key = keyMatch[1] ?? keyMatch[2];
    const colonAt = s + seg.indexOf(':');
    const arrRange = containerRange(src, mask, colonAt, e, '[');
    const values = arrRange
      ? splitTopLevel(src, mask, arrRange[0], arrRange[1]).map(([vs, ve]) => unquote(src.slice(vs, ve))).filter(Boolean)
      : [];
    entries.push([key, values]);
  }
  return entries;
}

/** 提取 `const NAME = lazyPage(() => import('...'), '/group')` 声明（源码顺序）。 */
function parseLazyDeclarations(src) {
  const mask = codeMask(src);
  const decls = [];
  const re = /\b(lazyPageWithFeature|lazyPage)\s*\(/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (!mask[m.index]) continue;
    const openParen = m.index + m[0].length - 1;
    const closeParen = findBalanced(src, mask, openParen);
    if (closeParen < 0) continue;
    const args = splitTopLevel(src, mask, openParen + 1, closeParen).map(([s, e]) => src.slice(s, e));
    const importPath = args[0]?.match(/import\(\s*['"]([^'"]+)['"]\s*\)/)?.[1] ?? '';
    const group = args[1]?.match(/['"]([^'"]+)['"]/)?.[1] ?? '';
    const component = src.slice(0, m.index).match(/const\s+([A-Za-z_$][\w$]*)\s*=\s*$/)?.[1] ?? '';
    // 函数自身定义（function lazyPage(loader, group)）不是路由声明
    if (!component || !importPath || !group) continue;
    decls.push({ component, importPath, group });
  }
  return decls;
}

/** 提取 router 配置中声明的 URL（`path:` 字符串与 `index: true`），源码顺序去重。 */
function parseUrlPaths(src) {
  const mask = codeMask(src);
  const found = [];
  const re = /\b(path|index)\s*:\s*(?:['"]([^'"]*)['"]|true)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (!mask[m.index]) continue;
    const value = m[1] === 'index' ? '/' : `/${m[2] ?? ''}`;
    found.push(value.replace(/\/{2,}/g, '/'));
  }
  return [...new Set(found)];
}

function listDirectories(relPath) {
  return readdirSync(join(ROOT, relPath), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/** 递归统计匹配文件数。 */
function countFiles(relPath, predicate) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) return 0;
  let total = 0;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const childRel = `${relPath}/${entry.name}`;
    if (entry.isDirectory()) total += countFiles(childRel, predicate);
    else if (predicate(entry.name)) total += 1;
  }
  return total;
}

function persistVersionOf(relPath) {
  if (!existsSync(join(ROOT, relPath))) return null;
  return readFileSync(join(ROOT, relPath), 'utf8').match(/version:\s*(\d+)/)?.[1] ?? null;
}

function buildData() {
  const routesSrc = readSource('src/app/routes.tsx');
  const eslintSrc = readSource('eslint.config.js');
  const registrySrc = readSource('src/i18n/moduleRegistry.ts');

  const lazyDeclarations = parseLazyDeclarations(routesSrc);
  const urlPaths = parseUrlPaths(routesSrc);
  const allowedMap = new Map(parseStringArrayMap(eslintSrc, codeMask(eslintSrc), 'ALLOWED_CROSS_IMPORTS'));
  const coreModules = parseStringArray(registrySrc, codeMask(registrySrc), 'CORE_MODULES');
  const groupToModules = new Map(parseStringArrayMap(registrySrc, codeMask(registrySrc), 'FEATURE_GROUPS'));
  const agentFiles = readdirSync(join(ROOT, '.claude/agents'))
    .filter((name) => name.endsWith('-dev.md'))
    .sort();

  const modules = listDirectories('src/features').map((name) => {
    const moduleDir = `src/features/${name}`;
    const ownDecls = lazyDeclarations.filter((decl) => decl.importPath.includes(`/features/${name}/`));
    const i18nModules = [...new Set(ownDecls.flatMap((decl) => groupToModules.get(decl.group) ?? []))].sort();
    const hasStore = existsSync(join(ROOT, moduleDir, 'store.ts'));
    const storeVersion = hasStore ? persistVersionOf(`${moduleDir}/store.ts`) : null;
    const store = !hasStore ? '—' : storeVersion ? `store.ts（persist v${storeVersion}）` : 'store.ts（无 persist）';
    return {
      name,
      owner: agentFiles.includes(`${name}-dev.md`) ? `${name}-dev` : '—',
      entry: ownDecls[0]?.component ?? '—',
      store,
      i18nModules,
      tests: countFiles(moduleDir, (file) => file.endsWith('.test.ts') || file.endsWith('.test.tsx')),
      allowed: (allowedMap.get(name) ?? []).join(', ') || '—',
      components: countFiles(`${moduleDir}/components`, (file) => file.endsWith('.tsx')),
    };
  });

  return { modules, lazyDeclarations, urlPaths, coreModules, groupToModules, agentCount: agentFiles.length };
}

const inlineCode = (value) => (value === '—' ? '—' : `\`${value}\``);
const inlineCodeList = (values) => (values.length === 0 ? '—' : values.map((v) => `\`${v}\``).join(', '));

function renderModuleTable(modules) {
  const lines = [
    '| 模块 | 负责代理 | 入口组件 | store | i18n 模块 | 测试数 | 允许跨模块引用 | 组件数 |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const m of modules) {
    const allowed = inlineCodeList(m.allowed === '—' ? [] : m.allowed.split(', '));
    lines.push(
      `| ${inlineCode(m.name)} | ${inlineCode(m.owner)} | ${inlineCode(m.entry)} | ${inlineCode(m.store)} | ${inlineCodeList(m.i18nModules)} | ${m.tests} | ${allowed} | ${m.components} |`,
    );
  }
  return lines;
}

function renderLazyTable(declarations) {
  const lines = ['| # | 组件 | import 路径 | i18n 分组 key |', '|---|---|---|---|'];
  declarations.forEach((decl, index) => {
    lines.push(`| ${index + 1} | \`${decl.component}\` | \`${decl.importPath}\` | \`${decl.group}\` |`);
  });
  return lines;
}

function renderI18nTable(coreModules, groupToModules) {
  const lines = ['| 分组 key | 类型 | i18n 模块 |', '|---|---|---|'];
  lines.push(`| \`CORE_MODULES\` | core（启动静态注入） | ${inlineCodeList(coreModules)} |`);
  for (const [group, modules] of groupToModules) {
    lines.push(`| \`${group}\` | feature（随路由并行加载） | ${inlineCodeList(modules)} |`);
  }
  return lines;
}

function buildDocument(data) {
  const { modules, lazyDeclarations, urlPaths, coreModules, groupToModules, agentCount } = data;
  return [
    HEADER,
    '',
    '# 模块地图（MODULE_MAP）',
    '',
    '> 由脚本从代码事实生成，内容随代码自动漂移校正：改完路由 / 模块 / i18n 注册表后运行 `pnpm agents:map`。',
    '> 手改本文件会被 `pnpm agents:map:check`（CI `Agent Map Check` 与 pre-commit）判为不一致。',
    '',
    '## 口径',
    '',
    '- **负责代理**：`.claude/agents/<module>-dev.md` 是否存在（缺失记为 —）',
    '- **入口组件**：`src/app/routes.tsx` 中首个 import 该模块的 lazy 声明组件',
    '- **store**：模块 `store.ts` 是否存在及其 persist `version`（正则 `version:\\s*(\\d+)` 首个匹配）',
    '- **i18n 模块**：由该模块各 lazy 声明所用的 `FEATURE_GROUPS` 分组 key 反查并集（去重排序）',
    '- **测试数 / 组件数**：模块内 `*.test.ts(x)` 递归计数 / `components/` 下 `*.tsx` 递归计数',
    '- **允许跨模块引用**：`eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS`（唯一事实源）',
    '',
    '## 模块表',
    '',
    ...renderModuleTable(modules),
    '',
    '## Lazy 路由表',
    '',
    '> `lazyPage` / `lazyPageWithFeature` 声明，按源码顺序。组件与 URL 的配对以 router 配置为准，',
    '> 本表只列声明本身，不做推断（URL 清单见下节）。',
    '',
    ...renderLazyTable(lazyDeclarations),
    '',
    '## 已声明的 URL 路径',
    '',
    `> 从 router 配置提取的 \`path:\` 字符串与 \`index\` 路由（源码顺序去重，含 AppLayout 与 BlankLayout 两个分支），共 ${urlPaths.length} 条。`,
    '',
    ...urlPaths.map((p) => `- \`${p}\``),
    '',
    '## i18n 分组表',
    '',
    '> `CORE_MODULES`（启动静态注入）与 `FEATURE_GROUPS`（路由→模块分组）的 key→模块映射，',
    '> 事实源为 `src/i18n/moduleRegistry.ts`。',
    '',
    ...renderI18nTable(coreModules, groupToModules),
    '',
    '## 生成统计',
    '',
    `- 模块数：${modules.length}（自检阈值 = ${EXPECTED_MODULE_COUNT}）`,
    `- lazy 声明数：${lazyDeclarations.length}（自检阈值 >= ${MIN_LAZY_DECLARATIONS}）`,
    `- agent 文件数：${agentCount}（自检阈值 >= ${MIN_AGENT_FILES}）`,
    `- 已声明 URL 数：${urlPaths.length}`,
    '',
  ].join('\n');
}

function fail(message) {
  console.error(`[agents:map] ${message}`);
  process.exit(1);
}

function selfCheck(data) {
  if (data.modules.length !== EXPECTED_MODULE_COUNT) {
    fail(`模块数自检失败：期望 ${EXPECTED_MODULE_COUNT}，实际 ${data.modules.length}（src/features/ 结构变动后请同步本脚本阈值）`);
  }
  if (data.lazyDeclarations.length < MIN_LAZY_DECLARATIONS) {
    fail(`lazy 声明数自检失败：期望 >= ${MIN_LAZY_DECLARATIONS}，实际 ${data.lazyDeclarations.length}（解析面可能失效）`);
  }
  if (data.agentCount < MIN_AGENT_FILES) {
    fail(`agent 文件数自检失败：期望 >= ${MIN_AGENT_FILES}，实际 ${data.agentCount}`);
  }
  const missingEntry = data.modules.filter((m) => m.entry === '—').map((m) => m.name);
  if (missingEntry.length > 0) {
    fail(`以下模块在 routes.tsx 中找不到入口组件：${missingEntry.join(', ')}`);
  }
  const missingI18n = data.modules.filter((m) => m.i18nModules.length === 0).map((m) => m.name);
  if (missingI18n.length > 0) {
    fail(`以下模块无法从 FEATURE_GROUPS 可靠映射 i18n 模块：${missingI18n.join(', ')}`);
  }
}

const normalize = (text) => text.replace(/\r\n/g, '\n');

function main() {
  const isCheck = process.argv.includes('--check');
  const data = buildData();
  selfCheck(data);
  const content = buildDocument(data);
  const absOutput = join(ROOT, OUTPUT);

  if (isCheck) {
    if (!existsSync(absOutput)) {
      fail(`${OUTPUT} 不存在。运行 pnpm agents:map 重新生成`);
    }
    if (normalize(readFileSync(absOutput, 'utf8')) !== normalize(content)) {
      fail(`${OUTPUT} 与代码事实不一致。运行 pnpm agents:map 重新生成`);
    }
    console.log(`[agents:map] 通过：${OUTPUT} 与代码事实一致（${data.modules.length} 模块 / ${data.lazyDeclarations.length} lazy 声明）`);
    return;
  }

  writeFileSync(absOutput, content, 'utf8');
  console.log(`[agents:map] 已生成 ${OUTPUT}（${data.modules.length} 模块 / ${data.lazyDeclarations.length} lazy 声明 / ${data.agentCount} agent 文件）`);
}

main();
