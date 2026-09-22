// ESLint flat config —— AGENTS.md 硬性规则的执行面（最小可行集）
// 仅启用两条规则：
//   1. no-restricted-imports：锁定 features 模块间直接引用（模块隔离）
//   2. @typescript-eslint/no-explicit-any：禁止 any
// i18n 双语键对称由 src/i18n/localeParity.test.ts 覆盖（pnpm test）。
import tseslint from 'typescript-eslint';

const FEATURES = [
  'gto-simulator',
  'hand-history',
  'help-center',
  'onboarding',
  'pot-odds',
  'progress',
  'puzzle-trainer',
  'range-trainer',
  'strategy-academy',
  'theory-academy',
];

// 模块间允许的直接引用边（当前依赖图快照，收紧时只删不加）。
// progress 是 AGENTS.md 定义的跨模块状态中枢，各模块引用它属于设计内；
// 其余 peer 边为存量债务（绕过 shared/层与事件总线），新增边一律变红。
// 快照守卫测试：src/eslintCrossImports.test.ts（新增边时 pnpm test 必然变红）。
export const ALLOWED_CROSS_IMPORTS = {
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

// B1 - Layer guards for shared/ and i18n/:
// - shared/: 禁止 import @/features/* (共享层底座不应依赖 feature 业务逻辑)
// - i18n/**/*.test.ts: 需触达课程数据 → 开显式豁免并加注释说明
const sharedLayerBlock = {
  files: ['src/shared/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          { regex: '^@/features/', 'message': 'shared 层禁止导入 feature 模块（分层约束：shared 是底座，feature 是构建块）' },
        ],
      },
    ],
  },
};

const i18nTestBlock = {
  files: ['src/i18n/**/*.test.ts'],
  rules: {
    'no-restricted-imports': [
      'warn', // 非 error，仅警告提示
      {
        patterns: [
          { regex: '^@/features/', 'message': 'i18n 测试文件可以 import feature 数据以验证 key 引用，但需在代码中注明理由（本规则已登记为显式豁免）' },
        ],
      },
    ],
  },
};

export default tseslint.config(
  { ignores: ['dist', 'poker-ui-demo', 'docs/analysis'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  ...featureIsolationBlocks,
  sharedLayerBlock,
  i18nTestBlock,
);
