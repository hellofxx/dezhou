// 临时：残留终检（用完即删）。列出所有非目标词形且非受保护 id/变量名的匹配。
import fs from 'node:fs';
import path from 'node:path';

const roots = process.argv[2] === 'locale'
  ? ['src/i18n/locales/zh', 'src/i18n/locales/en']
  : ['src/features/strategy-academy'];

const IDOK = /['"][A-Za-z0-9_.-]*3bet[A-Za-z0-9_-]*['"]|L2_3BET_U\d_SECTIONS|['"]3bet['"]/;
const bad = [];
function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(tsx?|json)$/.test(p)) {
      const src = fs.readFileSync(p, 'utf8');
      const re = /3-?(?:[Bb][Ee][Tt]|BET)(?:[Tt]ing|[Tt]ed|[Ss])?/g;
      let m;
      while ((m = re.exec(src))) {
        if (m[0] === '3-bet' || m[0] === '3-bets' || m[0] === '3-betting') continue;
        const before = src.slice(Math.max(0, m.index - 40), m.index);
        const after = src.slice(m.index + m[0].length, m.index + m[0].length + 40);
        const ctx = `${before}<<${m[0]}>>${after}`;
        if (!IDOK.test(ctx)) {
          bad.push(`${p.replace(/\\/g, '/')} :: ${ctx.replace(/\n/g, ' ')}`);
        }
      }
    }
  }
}
roots.forEach(walk);
console.log(bad.length ? bad.join('\n') : 'CLEAN: only protected ids/vars/target forms remain');
