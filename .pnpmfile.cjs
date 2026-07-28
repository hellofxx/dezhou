// pnpm readPackage hook —— lint 工具链侧载 TS 6（官方推荐的 TS7 并行方案）
// 背景：项目 typescript 为 7.x（原生编译器），typescript-eslint 8.x 尚不支持 TS 7.0，
// 官方方案是让 lint 工具链使用 TS 6 API 并行运行（不影响 typecheck/build 用的 TS 7）。
// typescript 是这些包的 peerDependency（会解析到根目录的 TS 7），
// 此处将其转为各自的直接依赖并钉在 6.0.3，使 require('typescript') 命中嵌套的 TS 6。
const LINT_TS_VERSION = '6.0.3';

function needsTs6(pkg) {
  return (
    pkg.name === 'typescript-eslint' ||
    (pkg.name && pkg.name.startsWith('@typescript-eslint/')) ||
    pkg.name === 'ts-api-utils'
  );
}

function readPackage(pkg) {
  if (needsTs6(pkg) && pkg.peerDependencies && pkg.peerDependencies.typescript) {
    delete pkg.peerDependencies.typescript;
    pkg.dependencies = { ...pkg.dependencies, typescript: LINT_TS_VERSION };
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
