import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { THEORY_GLOSSARY } from './glossary';
import { THEORY_BIBLIOGRAPHY } from './bibliography';
import { THEORY_CONTENT_OPS } from './contentOps';
import { standardLevels } from './levels/variants/standard';
import { headsUpLevels } from './levels/variants/heads-up';

/**
 * 发现层数据守卫：术语表 / 参考书目 / 内容运营元数据。
 *
 * 三类数据只被检索与展示消费，不进解锁与进度口径；但它们通过 i18n key 与章节 id
 * 跨文件引用，拼写错误不会在运行时抛错，只会静默显示原始 key 或跳转失效。
 */
const HAN_RE = /[一-鿿]/;
const chapterIds = new Set(
  [...standardLevels, ...headsUpLevels].flatMap((level) =>
    level.chapters.map((c) => c.id),
  ),
);
const LOCALE_DIR = fileURLToPath(new URL('../../../i18n/locales/', import.meta.url));

function flatten(node: unknown, prefix: string, out: Map<string, string>): void {
  if (typeof node === 'object' && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      flatten(value, prefix ? `${prefix}.${key}` : key, out);
    }
    return;
  }
  if (prefix && typeof node === 'string') out.set(prefix, node);
}

function loadDiscoveryCopy(lang: 'zh' | 'en'): Map<string, string> {
  const raw = JSON.parse(
    readFileSync(`${LOCALE_DIR}${lang}/theory-content/glossary.json`, 'utf-8'),
  ) as { glossary: unknown; bibliography: unknown };
  const out = new Map<string, string>();
  flatten({ glossary: raw.glossary, bibliography: raw.bibliography }, 'theory', out);
  return out;
}

const zhCopy = loadDiscoveryCopy('zh');
const enCopy = loadDiscoveryCopy('en');

describe('discovery data: 术语表', () => {
  it('40-60 条、id 唯一且为 stable kebab-case、关联章节真实存在', () => {
    expect(THEORY_GLOSSARY.length).toBeGreaterThanOrEqual(40);
    expect(THEORY_GLOSSARY.length).toBeLessThanOrEqual(60);
    const ids = THEORY_GLOSSARY.map((term) => term.id);
    expect(new Set(ids).size).toBe(ids.length);
    const bad: string[] = [];
    for (const term of THEORY_GLOSSARY) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(term.id)) bad.push(`${term.id}: id 非 kebab-case`);
      if (!term.termKey.startsWith('theory.glossary.')) bad.push(`${term.id}: termKey 前缀`);
      if (!term.definitionKey.startsWith('theory.glossary.')) bad.push(`${term.id}: definitionKey 前缀`);
      for (const alias of term.aliases ?? []) {
        if (!alias.startsWith('theory.glossary.')) bad.push(`${term.id}: alias 前缀`);
      }
      for (const chapterId of term.relatedChapterIds ?? []) {
        if (!chapterIds.has(chapterId)) bad.push(`${term.id}: 章节 ${chapterId} 不存在`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('术语 key 与别名 key 全局唯一', () => {
    const keys = THEORY_GLOSSARY.flatMap((term) => [
      term.termKey,
      term.definitionKey,
      ...(term.aliases ?? []),
    ]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('每条术语在 zh/en 文案包中都有非空译文，en 不含汉字', () => {
    const bad: string[] = [];
    for (const term of THEORY_GLOSSARY) {
      for (const key of [term.termKey, term.definitionKey, ...(term.aliases ?? [])]) {
        const zh = zhCopy.get(key);
        const en = enCopy.get(key);
        if (!zh?.trim()) bad.push(`zh 缺 ${key}`);
        if (!en?.trim()) bad.push(`en 缺 ${key}`);
        else if (HAN_RE.test(en)) bad.push(`en 含汉字 ${key}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('discovery data: 参考书目', () => {
  it('条目 id 唯一、年份合理、关联章节真实存在、文案 key 双语齐备', () => {
    const ids = THEORY_BIBLIOGRAPHY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(THEORY_BIBLIOGRAPHY.length).toBeGreaterThanOrEqual(8);
    const bad: string[] = [];
    for (const entry of THEORY_BIBLIOGRAPHY) {
      if (!entry.titleKey.startsWith('theory.bibliography.')) bad.push(`${entry.id}: titleKey 前缀`);
      if (entry.authorKey && !entry.authorKey.startsWith('theory.bibliography.')) {
        bad.push(`${entry.id}: authorKey 前缀`);
      }
      if (entry.noteKey && !entry.noteKey.startsWith('theory.bibliography.')) {
        bad.push(`${entry.id}: noteKey 前缀`);
      }
      if (entry.year !== undefined && (entry.year < 1900 || entry.year > 2100)) {
        bad.push(`${entry.id}: 年份异常`);
      }
      for (const chapterId of entry.relatedChapterIds ?? []) {
        if (!chapterIds.has(chapterId)) bad.push(`${entry.id}: 章节 ${chapterId} 不存在`);
      }
      for (const key of [entry.titleKey, entry.authorKey, entry.noteKey]) {
        if (!key) continue;
        if (!zhCopy.get(key)) bad.push(`zh 缺 ${key}`);
        const en = enCopy.get(key);
        if (!en) bad.push(`en 缺 ${key}`);
        else if (HAN_RE.test(en)) bad.push(`en 含汉字 ${key}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('discovery data: 内容运营元数据', () => {
  it('覆盖全部标准 + 单挑变体章节，且日期为合法 ISO 8601（YYYY-MM-DD）', () => {
    const reviewed = THEORY_CONTENT_OPS.lastReviewed;
    expect(Object.keys(reviewed).toSorted()).toEqual([...chapterIds].toSorted());
    const bad = Object.entries(reviewed)
      .filter(([, date]) => !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)))
      .map(([id, date]) => `${id}:${date}`);
    expect(bad).toEqual([]);
  });
});
