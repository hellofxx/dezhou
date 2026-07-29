// ESLint flat config —— AGENTS.md 硬性规则的执行面（最小可行集）
// 仅启用两条规则：
//   1. no-restricted-imports：锁定 features 模块间直接引用（模块隔离）
//   2. @typescript-eslint/no-explicit-any：禁止 any
// i18n 双语键对称由 src/i18n/localeParity.test.ts 覆盖（pnpm test）。
import tseslint from 'typescript-eslint';

const FEATURES = [
  'gto-simulator',
  'hand-history',
  'onboarding',
  'pot-odds',
  'progress',
  'puzzle-trainer',
  'range-trainer',
  'strategy-academy',
];

// 模块间允许的直接引用边（当前依赖图快照，收紧时只删不加）。
// progress 是 AGENTS.md 定义的跨模块状态中枢，各模块引用它属于设计内；
// 其余 peer 边为存量债务（绕过 shared/ 层与事件总线），新增边一律变红。
// 快照守卫测试：src/eslintCrossImports.test.ts（新增边时 pnpm test 必然变红）。
export const ALLOWED_CROSS_IMPORTS = {
  'gto-simulator': ['progress', 'range-trainer', 'strategy-academy'],
  'hand-history': [],
  onboarding: ['progress', 'range-trainer'],
  'pot-odds': ['progress'],
  progress: ['puzzle-trainer', 'strategy-academy'],
  'puzzle-trainer': ['progress'],
  'range-trainer': ['progress'],
  'strategy-academy': ['progress', 'puzzle-trainer'],
};

const featureIsolationBlocks = FEATURES.map((feature) => {
  const allowed = [feature, ...ALLOWED_CROSS_IMPORTS[feature]];
  const forbidden = FEATURES.filter((f) => !allowed.includes(f));
  const message = `模块隔离（AGENTS.md）：features 模块间禁止直接引用，必须走 shared/ 层或 trainingEvents 事件总线；${feature} 当前允许的目标见 eslint.config.js 的 ALLOWED_CROSS_IMPORTS。`;
  return {
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            // 别名形式：@/features/<其它模块>
            { regex: `^@/features/(?!(?:${allowed.join('|')})(?:/|$))`, message },
            // 相对路径形式：../../<其它模块>（防止绕过别名）
            { regex: `^(?:\\.\\./)+(?:${forbidden.join('|')})(?:/|$)`, message },
          ],
        },
      ],
    },
  };
});

export default tseslint.config(
  { ignores: ['dist', 'poker-ui-demo', 'poker-teaching-system-analysis'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  ...featureIsolationBlocks,
);
