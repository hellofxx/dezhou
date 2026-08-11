// scripts/merge-locales.mjs
// 合并回退脚本：将拆分后的 src/i18n/locales/{zh,en}/<topKey>.json 重建为合并 JSON，
// 输出到 locales/{zh,en}.merged.json，供 CI 对照 / 调试使用（非运行时路径）。
// 用法：node scripts/merge-locales.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const LOCALES_DIR = resolve(process.cwd(), 'src/i18n/locales');
const LOCALES = ['zh', 'en'];

for (const lang of LOCALES) {
  const dir = join(LOCALES_DIR, lang);
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const merged = {};
  for (const file of files) {
    const key = file.replace(/\.json$/, '');
    merged[key] = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  }
  const out = join(LOCALES_DIR, `${lang}.merged.json`);
  writeFileSync(out, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`[merge-locales] ${lang}: ${files.length} 个模块 → ${out}`);
}
