const fs = require('fs');
for (const p of ['node_modules/react', 'node_modules/vitest', 'node_modules/.pnpm/vitest@4.1.10_@types+node@2_99aac78ab74fdae8b7c450ed565fd461/node_modules/vitest']) {
  try {
    console.log(p, '=> stat ok, isDir =', fs.statSync(p).isDirectory());
  } catch (e) {
    console.log(p, '=> ERR', e.message);
  }
}
