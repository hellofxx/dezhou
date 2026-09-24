// 临时：转换后词形统计（用完即删）。分文件统计变体残留与目标形。
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
  'src/shared/data/opponentProfiles.ts',
);
for (const f of fs.readdirSync('src/i18n/locales/zh/academy-course')) {
  targets.push(`src/i18n/locales/zh/academy-course/${f}`);
  targets.push(`src/i18n/locales/en/academy-course/${f}`);
}

const VARIANT = /3(?:-?(?:[Bb][Ee][Tt]|BET))(?:[Tt]ing|[Tt]ed|[Ss])?/g;
let variantTotal = 0;
let targetTotal = 0;
const rows = [];
for (const f of targets) {
  const src = fs.readFileSync(f, 'utf8');
  const p = f.replace(/\\/g, '/');
  const variantMatches = src.match(VARIANT) ?? [];
  const targetMatches = src.match(/3-bet(?:s|ting)?/g) ?? [];
  targetTotal += targetMatches.length;
  if (variantMatches.length) {
    // 区分 id/变量名 与 真变体
    const re = /3(?:-?(?:[Bb][Ee][Tt]|BET))(?:[Tt]ing|[Tt]ed|[Ss])?/g;
    let m;
    let idish = 0;
    const real = [];
    while ((m = re.exec(src))) {
      const before = src.slice(Math.max(0, m.index - 1), m.index);
      const after = src.slice(m.index + m[0].length, m.index + m[0].length + 1);
      const isId = /[A-Za-z0-9_.-]/.test(before) || /[A-Za-z0-9_.-]/.test(after);
      if (isId) idish++;
      else real.push(m[0]);
    }
    variantTotal += real.length;
    rows.push(`${p}  variants_total=${variantMatches.length} (id/ident=${idish}, REAL=${real.length}${real.length ? ' [' + real.join(',') + ']' : ''})  target=${targetMatches.length}`);
  } else {
    rows.push(`${p}  variants_total=0  target=${targetMatches.length}`);
  }
}
rows.sort();
rows.forEach((r) => console.log(r));
console.log(`\nSUMMARY real_variant_residual=${variantTotal} target_forms=${targetTotal}`);
