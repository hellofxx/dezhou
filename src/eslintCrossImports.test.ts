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

// 当前依赖图精确快照（9 个模块键）：
// progress 边为 AGENTS.md 设计内的跨模块状态中枢引用，其余 peer 边为存量债务。
// theory-academy 为 2026-07 新增模块：它引用 progress（中枢）；
// progress → theory-academy 为成就检查的动态 import（与 strategy-academy 同模式）。
const EXPECTED_SNAPSHOT: CrossImportMap = {
  'gto-simulator': ['progress', 'range-trainer', 'strategy-academy'],
  'hand-history': [],
  onboarding: ['progress', 'range-trainer'],
  'pot-odds': ['progress'],
  progress: ['puzzle-trainer', 'strategy-academy', 'theory-academy'],
  'puzzle-trainer': ['progress'],
  'range-trainer': ['progress'],
  'strategy-academy': ['progress', 'puzzle-trainer'],
  'theory-academy': ['progress'],
};

describe('eslint ALLOWED_CROSS_IMPORTS 快照守卫', () => {
  it('白名单与精确快照完全一致（新增边必然变红，删除边需同步更新快照）', async () => {
    const actual = await loadAllowedCrossImports();
    expect(actual).toEqual(EXPECTED_SNAPSHOT);
  });
});
