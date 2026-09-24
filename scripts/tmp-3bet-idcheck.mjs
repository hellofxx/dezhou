// 临时：验证 id/变量名 token 清单与转换前一致（用完即删）
import fs from 'node:fs';
import path from 'node:path';

const root = 'src/features/strategy-academy';
const out = new Map();
function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f.name) && !/\.test\./.test(f.name)) {
      const src = fs.readFileSync(p, 'utf8');
      const re = /['"`]([A-Za-z0-9_-]*3bet[A-Za-z0-9_-]*)['"`]/gi;
      let m;
      while ((m = re.exec(src))) {
        const k = m[1];
        if (!out.has(k)) out.set(k, new Set());
        out.get(k).add(p.replace(/\\/g, '/'));
      }
    }
  }
}
walk(root);
for (const [k, ps] of [...out.entries()].sort()) {
  console.log(`${k}  <--  ${[...ps].map((x) => x.replace(/\\/g, '/')).join(', ')}`);
}
