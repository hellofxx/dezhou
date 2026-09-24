// 临时：扫描保护正则将命中的 token（用完即删）
import fs from 'node:fs';
import path from 'node:path';

const targets = [];
function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(tsx?|json)$/.test(p)) targets.push(p);
  }
}
walk('src/features/strategy-academy');
targets.push(
  'src/i18n/locales/zh/academy.json',
  'src/i18n/locales/en/academy.json',
  'src/i18n/locales/zh/drills.json',
  'src/i18n/locales/en/drills.json',
);
for (const f of fs.readdirSync('src/i18n/locales/zh/academy-course')) {
  targets.push(`src/i18n/locales/zh/academy-course/${f}`);
  targets.push(`src/i18n/locales/en/academy-course/${f}`);
}

const PROT = [
  /['"][A-Za-z0-9_.-]*\b3bet\b[A-Za-z0-9_.-]*['"]/g, // 引号内 ASCII id/key 形态
  /\b[A-Z][A-Z0-9_]*3BET[A-Z0-9_]*\b/g, // 全大写变量名
];

const seen = new Map();
for (const f of targets) {
  if (f.replace(/\\/g, '/').includes('practiceOptionOrder')) continue;
  const src = fs.readFileSync(f, 'utf8');
  for (const re of PROT) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      const tok = m[0].replace(/^['"]|['"]$/g, '');
      if (!seen.has(tok)) seen.set(tok, new Set());
      seen.get(tok).add(path.basename(f));
    }
  }
}
for (const [tok, fs2] of [...seen.entries()].sort()) {
  console.log(`${tok}  <-- ${[...fs2].join(',')}`);
}
