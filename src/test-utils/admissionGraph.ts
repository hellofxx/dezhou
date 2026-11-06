/**
 * shared 准入分析器（纯函数，无 fs）。
 *
 * 背景：旧守卫只扫描 `shared/utils`，且统计的是 shared 文件自身 import 了谁，
 * 不是谁 import 它；未登记 baseline 的文件直接跳过，导致单消费者文件长期漏检。
 *
 * 本模块把「源码 → import 图 → 消费者集合」拆成可单测的纯函数：
 * - 路径统一为 repo-root 相对的 posix 路径（如 `src/shared/utils/cn.ts`）；
 * - 支持 `@/` 别名、相对路径、`index.ts` barrel、静态/动态 import；
 * - shared 内部边不产生消费者，沿 import 反向边传递到不动点。
 */

export interface AdmissionGraph {
  /** 参与分析的源码文件（repo-root 相对 posix 路径） */
  files: string[];
  /** importer → imported 的已解析边 */
  edges: Map<string, string[]>;
}

export interface FileAdmission {
  /** 生产消费者：`feature:<name>` / `shell:<top>` */
  prodConsumers: string[];
  /** 测试消费者：`feature:<name>` / `test:<top>` */
  testConsumers: string[];
}

export interface BuildGraphOptions {
  /** `@/` 别名对应的源码根目录，默认 `src` */
  srcRoot?: string;
}

const TEST_FILE_RE = /(?:\.test|\.spec)\.[jt]sx?$/;
const SHARED_PREFIX = 'src/shared/';

/** 源码扫描用：静态 import / export-from / side-effect import */
const STATIC_IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
/** 源码扫描用：动态 import('...') */
const DYNAMIC_IMPORT_RE = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

export function normalizePath(filePath: string): string {
  return filePath.split('\\').join('/').replace(/^\.\//, '');
}

export function isTestPath(filePath: string): boolean {
  const p = normalizePath(filePath);
  return TEST_FILE_RE.test(p) || /\/__tests__\//.test(p);
}

/** 去掉注释但保留字符串内容；`//` / `/*` 在正则字面量中不会原样出现，足够安全。 */
export function stripComments(source: string): string {
  let out = '';
  let quote: '"' | "'" | '`' | null = null;
  let index = 0;

  while (index < source.length) {
    const char = source[index]!;
    const next = source[index + 1];

    if (quote) {
      out += char;
      if (char === '\\') {
        out += next ?? '';
        index += 2;
        continue;
      }
      if (char === quote) quote = null;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      out += char;
      index += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') {
        out += ' ';
        index += 1;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      out += '  ';
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        out += source[index] === '\n' ? '\n' : ' ';
        index += 1;
      }
      if (index < source.length) {
        out += '  ';
        index += 2;
      }
      continue;
    }

    out += char;
    index += 1;
  }

  return out;
}

function dirnameOf(filePath: string): string {
  const index = filePath.lastIndexOf('/');
  return index === -1 ? '' : filePath.slice(0, index);
}

/** 把 `base` 与 `relative` 拼成规范化 posix 路径（处理 `.` / `..`） */
export function joinPath(base: string, relative: string): string {
  const parts = `${base}/${relative}`.split('/');
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
}

/**
 * 解析一个 import specifier 到 fileSet 中的真实文件。
 * 只处理 `@/` 与相对路径；裸包名返回 null。
 */
export function resolveSpecifier(
  fromFile: string,
  specifier: string,
  fileSet: ReadonlySet<string>,
  srcRoot = 'src',
): string | null {
  let base: string;
  if (specifier.startsWith('@/')) {
    base = joinPath(srcRoot, specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    base = joinPath(dirnameOf(fromFile), specifier);
  } else {
    return null;
  }

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ];
  for (const candidate of candidates) {
    if (fileSet.has(candidate)) return candidate;
  }
  return null;
}

/** 生产消费者 ID；shared / 测试 / 工具路径返回 null（由调用方另行处理） */
export function consumerId(filePath: string): string | null {
  const p = normalizePath(filePath);
  if (p.startsWith(SHARED_PREFIX)) return null;

  const feature = /^src\/features\/([^/]+)\//.exec(p);
  if (feature) return `feature:${feature[1]}`;

  if (p.startsWith('src/app/')) return 'shell:app';
  if (p.startsWith('src/layouts/')) return 'shell:layouts';
  if (p.startsWith('src/i18n/')) return 'shell:i18n';
  if (p === 'src/main.ts' || p === 'src/main.tsx' || p === 'src/App.tsx') return 'shell:main';

  const top = /^src\/([^/]+)\//.exec(p);
  return top ? `shell:${top[1]}` : null;
}

function testConsumerId(filePath: string): string {
  const p = normalizePath(filePath);
  const feature = /^src\/features\/([^/]+)\//.exec(p);
  if (feature) return `feature:${feature[1]}`;
  const top = /^src\/([^/]+)\//.exec(p);
  return top ? `test:${top[1]}` : 'test:root';
}

function isToolingPath(filePath: string): boolean {
  return filePath.startsWith('src/test-utils/') || filePath.startsWith('src/guards/');
}

export function buildGraph(
  files: readonly string[],
  read: (filePath: string) => string,
  options: BuildGraphOptions = {},
): AdmissionGraph {
  const normalized = [...new Set(files.map(normalizePath))];
  const fileSet = new Set(normalized);
  const srcRoot = options.srcRoot ?? 'src';
  const edges = new Map<string, string[]>();

  for (const file of normalized) {
    const source = stripComments(read(file));
    const specifiers = new Set<string>();

    STATIC_IMPORT_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = STATIC_IMPORT_RE.exec(source))) {
      specifiers.add(match[1]!);
    }

    DYNAMIC_IMPORT_RE.lastIndex = 0;
    while ((match = DYNAMIC_IMPORT_RE.exec(source))) {
      specifiers.add(match[1]!);
    }

    const targets: string[] = [];
    for (const specifier of specifiers) {
      const resolved = resolveSpecifier(file, specifier, fileSet, srcRoot);
      if (resolved) targets.push(resolved);
    }
    edges.set(file, [...new Set(targets)]);
  }

  return { files: normalized, edges };
}

/**
 * 统计每个 shared 文件的生产 / 测试消费者。
 * shared 内部 importer 不直接算消费者，而是递归汇总其消费者（传递闭包）。
 */
export function analyzeAdmission(graph: AdmissionGraph): Map<string, FileAdmission> {
  const reverse = new Map<string, string[]>();
  for (const [from, targets] of graph.edges) {
    for (const target of targets) {
      const list = reverse.get(target);
      if (list) list.push(from);
      else reverse.set(target, [from]);
    }
  }

  const memo = new Map<string, FileAdmission>();
  const visiting = new Set<string>();

  function collect(file: string): FileAdmission {
    const cached = memo.get(file);
    if (cached) return cached;

    const prod = new Set<string>();
    const test = new Set<string>();
    if (visiting.has(file)) {
      // 循环兜底：跳过当前环，环外消费者仍会从其他 importer 汇入
      return { prodConsumers: [], testConsumers: [] };
    }
    visiting.add(file);

    for (const importer of reverse.get(file) ?? []) {
      if (isTestPath(importer) || isToolingPath(importer)) {
        // 测试/工具文件即使在 shared 内，也只算测试消费者，不参与生产传递闭包
        test.add(testConsumerId(importer));
      } else if (importer.startsWith(SHARED_PREFIX)) {
        const inner = collect(importer);
        for (const id of inner.prodConsumers) prod.add(id);
        for (const id of inner.testConsumers) test.add(id);
      } else {
        const id = consumerId(importer);
        if (id) prod.add(id);
      }
    }

    visiting.delete(file);
    const result: FileAdmission = {
      prodConsumers: [...prod].sort(),
      testConsumers: [...test].sort(),
    };
    memo.set(file, result);
    return result;
  }

  const result = new Map<string, FileAdmission>();
  for (const file of graph.files) {
    if (file.startsWith(SHARED_PREFIX)) result.set(file, collect(file));
  }
  return result;
}
