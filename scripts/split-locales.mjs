// scripts/split-locales.mjs
// 一次性拆分脚本：将 src/i18n/locales/zh.json / en.json 按顶层 key 拆为模块化文件。
// 产物：src/i18n/locales/{zh,en}/<topKey>.json（每语言一个模块文件，顶层 key 天然唯一，无命名空间冲突）。
// 安全措施：① 校验 zh/en 顶层 key 集合完全一致；② 校验顶层 key 无重复；③ 写出后逐一回读 JSON 解析校验；④ 全部通过后才删除原文件。
// 用法：node scripts/split-locales.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const LOCALES_DIR = resolve(process.cwd(), 'src/i18n/locales');
const LOCALES = ['zh', 'en'];

function fail(msg) {
  console.error(`[split-locales] ✗ ${msg}`);
  process.exit(1);
}

function load(lang) {
  const file = join(LOCALES_DIR, `${lang}.json`);
  if (!readdirSync(LOCALES_DIR).includes(`${lang}.json`)) fail(`缺少 ${file}`);
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    fail(`解析 ${file} 失败: ${err.message}`);
  }
}

const data = {};
for (const lang of LOCALES) data[lang] = load(lang);

// 1. 顶层 key 集合一致性校验
const keysZh = Object.keys(data.zh);
const keysEn = Object.keys(data.en);
const onlyZh = keysZh.filter((k) => !keysEn.includes(k));
const onlyEn = keysEn.filter((k) => !keysZh.includes(k));
if (onlyZh.length || onlyEn.length) {
  fail(`zh/en 顶层 key 不对称 —— 仅 zh: ${onlyZh.join(', ') || '(无)'}；仅 en: ${onlyEn.join(', ') || '(无)'}`);
}
if (new Set(keysZh).size !== keysZh.length) fail('zh 顶层 key 存在重复');
console.log(`[split-locales] 校验通过：${keysZh.length} 个顶层 key，zh/en 完全对称`);

// 2. 逐模块写出
let count = 0;
for (const key of keysZh) {
  for (const lang of LOCALES) {
    const dir = join(LOCALES_DIR, lang);
    mkdirSync(dir, { recursive: true });
    const content = `${JSON.stringify(data[lang][key], null, 2)}\n`;
    writeFileSync(join(dir, `${key}.json`), content, 'utf8');
    count++;
  }
}

// 3. 回读校验
for (const key of keysZh) {
  for (const lang of LOCALES) {
    try {
      JSON.parse(readFileSync(join(LOCALES_DIR, lang, `${key}.json`), 'utf8'));
    } catch (err) {
      fail(`回读校验失败 ${lang}/${key}.json: ${err.message}`);
    }
  }
}

// 4. 删除原大文件
for (const lang of LOCALES) {
  rmSync(join(LOCALES_DIR, `${lang}.json`));
}

console.log(`[split-locales] ✓ 完成：${keysZh.length} 个模块 × ${LOCALES.length} 语言 = ${count} 个文件写入并回读通过，原 zh.json / en.json 已删除`);
