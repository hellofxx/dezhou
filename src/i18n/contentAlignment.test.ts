import { describe, expect, it } from 'vitest';
import { generateContentEntries, CONTENT_KEY_PREFIXES } from './contentKeyEntries';
import { DRIFT_BASELINE } from './contentAlignment.baseline';

/**
 * 课程内容 ↔ i18n 陈旧守卫（数据为源，locale 为其镜像）。
 *
 * 背景：渲染层 i18n key 分两类失效模式——
 * 1. **下标型**（正文段落 / 选项数组）：`academy.lessonContent.<id>.<i>`、
 *    `theory.quiz.<qid>.options.<i>`。原地改文案、中间插删或重排会让界面静默错位。
 * 2. **id 型单值**（题干 / 解析 / 例题与实战各行列 / Drill / 对手画像 / 术语 / 小节标题）：
 *    下标不会错位，但会**陈旧**——改了数据原文忘了改 locale，界面继续显示旧文本。
 *    实证缺陷：`l1-leaks-q1` 数据侧已改 20-25%，locale 仍是 20-28%，
 *    同一课内正文与考题口径分裂，用户被按过期答案判分。
 *
 * 本守卫消费 contentKeyEntries 的单源 key↔原文映射，对**全部**内容 key 断言：
 * 1. zh 逐字镜像 —— locale 值 === 数据原文（PRD §12.4.3：数据层中文为唯一事实源）
 * 2. en 健康度 —— 非空且不含汉字（术语卡的 `chinese` 字段例外，其值本就是中文词名）
 * 3. 索引族长度对齐 —— 数据删段后 locale 残留的下标（orphan）视为错位
 *
 * 历史漂移以棘轮基线 DRIFT_BASELINE（独立文件）冻结：只允许减少，清零一条删一条。
 */

const zhModules = import.meta.glob<Record<string, unknown>>('./locales/zh/*.json', {
  import: 'default',
  eager: true,
});
const enModules = import.meta.glob<Record<string, unknown>>('./locales/en/*.json', {
  import: 'default',
  eager: true,
});
const zhCourseModules = import.meta.glob<Record<string, unknown>>(
  './locales/zh/academy-course/*.json',
  { import: 'default', eager: true },
);
const enCourseModules = import.meta.glob<Record<string, unknown>>(
  './locales/en/academy-course/*.json',
  { import: 'default', eager: true },
);

const HAN_RE = /[一-鿿]/;

function flatten(node: unknown, prefix: string, out: Map<string, string>): void {
  if (typeof node === 'object' && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      flatten(value, prefix ? `${prefix}.${key}` : key, out);
    }
    return;
  }
  if (prefix && typeof node === 'string') out.set(prefix, node);
}

/**
 * 收集 locale 侧全部字符串叶子（不做命名空间过滤）：
 * 镜像断言按数据推导的 key 精确取值，orphan 检查也需按完整 key 探测残留。
 */
function collectValues(
  main: Record<string, Record<string, unknown>>,
  courseSubdir: Record<string, Record<string, unknown>>,
): Map<string, string> {
  const out = new Map<string, string>();
  for (const file of Object.keys(main)) {
    const moduleName = file.split('/').pop()?.replace(/\.json$/, '');
    if (moduleName !== 'academy' && moduleName !== 'theory') continue;
    flatten(main[file], moduleName, out);
  }
  // academy-course/ 子目录注入 i18n 后才带 academy. 前缀，须补齐再合并
  for (const file of Object.keys(courseSubdir)) flatten(courseSubdir[file], 'academy', out);
  return out;
}

const zhValues = collectValues(zhModules, zhCourseModules);
const enValues = collectValues(enModules, enCourseModules);
const ENTRIES = generateContentEntries();

/** 弯/直引号归一化：区分「排版差异」与「内容错位」两类性质不同的漂移 */
const QUOTE_MAP: Record<string, string> = { '“': '"', '”': '"', '‘': "'", '’': "'" };
function normalizeQuotes(s: string): string {
  return s.replace(/[“”‘’]/g, (ch) => QUOTE_MAP[ch] ?? ch);
}

/** 首个不一致处的可读诊断：位置 + 两侧上下文（区分真内容错位 vs 引号/空白规范化） */
function firstDiffDetail(expected: string, actual: string): string {
  const n = Math.min(expected.length, actual.length);
  let i = 0;
  while (i < n && expected[i] === actual[i]) i += 1;
  // 先转义反斜杠再转义换行，使「真换行」与「字面 \n 两字符」在输出中可辨
  const ctx = (s: string) =>
    JSON.stringify(
      s.slice(Math.max(0, i - 12), i + 14).replace(/\\/g, '\\\\').replace(/\n/g, '\\n'),
    );
  const lenNote =
    expected.length === actual.length
      ? ''
      : ` [len data=${expected.length} locale=${actual.length}]`;
  return `@${i}${lenNote}\n      data   ${ctx(expected)}\n      locale ${ctx(actual)}`;
}

/**
 * 索引族：以 `<prefix>.<数字>` 结尾的 key 归并为同一数组（正文段落、选项、术语条目…）。
 * 值 = 该族在数据侧的最大下标，用于探测 locale 侧多出的尾部下标。
 */
function indexFamilies(entries: Map<string, string>): Map<string, number> {
  const families = new Map<string, number>();
  for (const key of entries.keys()) {
    const m = /^(.*)\.(\d+)$/.exec(key);
    if (!m) continue;
    const prefix = m[1]!;
    families.set(prefix, Math.max(families.get(prefix) ?? -1, Number(m[2])));
  }
  return families;
}

const FAMILIES = indexFamilies(ENTRIES);

function collectDrift(): { ids: string[]; details: Map<string, string> } {
  const ids: string[] = [];
  const details = new Map<string, string>();

  for (const [key, text] of ENTRIES) {
    const zh = zhValues.get(key);
    const en = enValues.get(key);

    if (typeof zh !== 'string') ids.push(`zh-missing:${key}`);
    else if (zh !== text) {
      // 引号排版差异单列：可安全机械归一，不与内容错位混为一谈
      const kind = normalizeQuotes(zh) === normalizeQuotes(text) ? 'zh-quotes' : 'zh-mirror';
      const id = `${kind}:${key}`;
      ids.push(id);
      details.set(id, firstDiffDetail(text, zh));
    }

    const enCjkExempt = key.startsWith('academy.term.') && key.endsWith('.chinese');
    if (typeof en !== 'string' || en.trim() === '') ids.push(`en-missing:${key}`);
    else if (!enCjkExempt && HAN_RE.test(en)) ids.push(`en-cjk:${key}`);
  }

  // 数据删段后 locale 残留的下标：只比 key 存在性的守卫完全查不出这类 orphan
  for (const [prefix, maxIndex] of FAMILIES) {
    for (let i = maxIndex + 1; zhValues.has(`${prefix}.${i}`) || enValues.has(`${prefix}.${i}`);) {
      ids.push(`orphan:${prefix}.${i}`);
      i += 1;
    }
  }

  return { ids, details };
}

const { ids: DRIFT, details: DRIFT_DETAILS } = collectDrift();

describe('课程内容 ↔ i18n 陈旧对齐（下标型 + id 型全量 key）', () => {
  it('守卫确实覆盖到全部内容 key（防空转）', () => {
    expect(ENTRIES.size).toBeGreaterThan(5000);
    expect(FAMILIES.size).toBeGreaterThan(500);
    // id 型单值（解析 / 题干 / 小节标题等）必须在扫描范围内 —— 本次扩展的目标
    const idType = [...ENTRIES.keys()].filter((k) => !/\.\d+$/.test(k));
    expect(idType.length).toBeGreaterThan(3000);
    expect(
      [...ENTRIES.keys()].filter((k) => k.endsWith('.explanation') || k.endsWith('.question'))
        .length,
    ).toBeGreaterThan(1500);
    // 每条推导 key 都落在已登记命名空间内（新增命名空间须同步 CONTENT_KEY_PREFIXES）
    const unregistered = [...ENTRIES.keys()].filter(
      (k) => !CONTENT_KEY_PREFIXES.some((p) => k.startsWith(p)),
    );
    expect(unregistered).toEqual([]);
  });

  it('无新增错位：zh 逐字镜像 + en 非空非汉字 + 无 orphan 下标', () => {
    const unexpected = DRIFT.filter((d) => !DRIFT_BASELINE.includes(d));
    if (unexpected.length > 0) {
      const byKind = new Map<string, number>();
      for (const d of unexpected) {
        const kind = d.slice(0, d.indexOf(':'));
        byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
      }
      console.warn(
        `[contentAlignment] ${unexpected.length} 条错位 ${JSON.stringify(Object.fromEntries(byKind))}\n` +
          unexpected.map((d) => `${d}  ${DRIFT_DETAILS.get(d) ?? ''}`.trimEnd()).join('\n'),
      );
    }
    expect({ unexpectedCount: unexpected.length }).toEqual({ unexpectedCount: 0 });
  });

  it('棘轮基线卫生：已清零的条目须从 DRIFT_BASELINE 删除', () => {
    const staleBaseline = DRIFT_BASELINE.filter((d) => !DRIFT.includes(d));
    expect(DRIFT.length).toBeLessThanOrEqual(DRIFT_BASELINE.length);
    expect({ fixed: staleBaseline.slice(0, 20), fixedCount: staleBaseline.length }).toEqual({
      fixed: [],
      fixedCount: 0,
    });
  });
});
