// 临时脚本：strategy-academy 域 3bet 词形统一为 3-bet（用完即删）
// 两阶段：先保护引号内 ASCII id/key 与全大写变量名，再全局转换，最后还原。
// 转换规则：3-?(?:[Bb][Ee][Tt]|BET)([Tt]ing|[Tt]ed|[Ss])? -> 3-bet$1
import fs from 'node:fs';
import path from 'node:path';

const RE = /3-?(?:[Bb][Ee][Tt]|BET)([Tt]ing|[Tt]ed|[Ss])?/g;
const PROTECT = [
  /['"][A-Za-z0-9_.-]*\b3bet\b[A-Za-z0-9_.-]*['"]/g, // 引号内 id/key（l2-3bet-basics、term.t-3bet 等）
  /\b[A-Z][A-Z0-9_]*3BET[A-Z0-9_]*\b/g, // 变量名（L2_3BET_U1_SECTIONS 等）
];

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

const EXCLUDE = new Set([
  'src/features/strategy-academy/utils/practiceOptionOrder.ts', // 含匹配模式 key '3bet'，手工处理
]);

// 批次：node tmp-3bet-normalize.mjs data|locale|all
const batch = process.argv[2] ?? 'all';
const isData = (f) => f.replace(/\\/g, '/').startsWith('src/features/strategy-academy');
const filtered = targets.filter((f) => {
  if (batch === 'data') return isData(f);
  if (batch === 'locale') return !isData(f);
  return true;
});

let filesChanged = 0;
let totalChangedMatches = 0;
for (const file of filtered) {
  if (EXCLUDE.has(file.replace(/\\/g, '/'))) continue;
  let src = fs.readFileSync(file, 'utf8');

  // 阶段 1：保护 id/key/变量名
  const stash = [];
  src = src.replace(new RegExp(PROTECT.map((r) => r.source).join('|'), 'g'), (m) => {
    stash.push(m);
    return `\u0000P${stash.length - 1}\u0000`;
  });

  // 阶段 2：全局转换
  let count = 0;
  const out = src.replace(RE, (_m, suffix) => {
    count++;
    return `3-bet${suffix ?? ''}`;
  });

  // 阶段 3：还原保护
  const restored = out.replace(/\u0000P(\d+)\u0000/g, (_m, i) => stash[Number(i)]);

  if (restored !== src) {
    fs.writeFileSync(file, restored, 'utf8');
    filesChanged++;
    totalChangedMatches += count;
    console.log(`${file.replace(/\\/g, '/')}  changed=${count}`);
  }
}
console.log(`\nDONE batch=${batch} files_changed=${filesChanged} changed_matches=${totalChangedMatches}`);
