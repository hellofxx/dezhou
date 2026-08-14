import { describe, expect, it } from 'vitest';

/**
 * 模块隔离白名单快照守卫（AGENTS.md 硬性规则：收紧时只删不加）：
 * eslint.config.js 的 ALLOWED_CROSS_IMPORTS 新增任何边都会使本测试失败（pnpm test 变红）；
 * 删除边（收紧依赖图）时同步更新下方 EXPECTED_SNAPSHOT 即可。
 */
type CrossImportMap = Record<string, string[]>;

// tsconfig 未开 allowJs 且 include 仅 src，改用运行时 URL 动态导入根目录 JS 配置，
// 避免静态引用破坏 pnpm typecheck。
async function loadAllowedCrossImports(): Promise<CrossImportMap> {
  const configUrl = new URL('../eslint.config.js', import.meta.url).href;
  const mod = (await import(configUrl)) as { ALLOWED_CROSS_IMPORTS: CrossImportMap };
  return mod.ALLOWED_CROSS_IMPORTS;
}

// 当前依赖图精确快照（10 个模块键）：
// progress 边为 AGENTS.md 设计内的跨模块状态中枢引用，其余 peer 边为存量债务。
// theory-academy 引用 progress（中枢）；
// progress 的成就检查与学院课程数据源已全部依赖倒置
// （achievementRegistry + academyDataSourceRegistry），不再静态 import 任何 trainer store。
// help-center 为纯静态教程模块，无任何 feature 引用（纳入守卫防未来漂移）。
const EXPECTED_SNAPSHOT: CrossImportMap = {
  'gto-simulator': ['progress'],
  'hand-history': [],
  'help-center': [],
  onboarding: ['progress'],
  'pot-odds': ['progress'],
  progress: [],
  'puzzle-trainer': ['progress'],
  'range-trainer': ['progress'],
  'strategy-academy': ['progress'],
  'theory-academy': ['progress'],
};

describe('eslint ALLOWED_CROSS_IMPORTS 快照守卫', () => {
  // 专批 A（2026-07-31）：动态 import eslint.config.js 会连带加载 eslint 插件链，
  // 全量 pnpm test 并发下与其他测试竞争资源偶发超过默认 5000ms（单跑 1.4s 稳定通过）。
  // 仅本测试放宽 timeout，不动全局默认值。
  it('白名单与精确快照完全一致（新增边必然变红，删除边需同步更新快照）', { timeout: 30000 }, async () => {
    const actual = await loadAllowedCrossImports();
    expect(actual).toEqual(EXPECTED_SNAPSHOT);
  });
});
