import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'f:/code/dezhou';
const scan = JSON.parse(fs.readFileSync(path.join(ROOT, '.qgraphflow-tmp/out.json'), 'utf8'));

const SRC_FILES = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts')) {
      SRC_FILES.push(path.relative(ROOT, p).split(path.sep).join('/'));
    }
  }
}
walk(path.join(ROOT, 'src'));
const FILE_SET = new Set(SRC_FILES);

function resolveSpecifier(fromFile, specifier) {
  let base;
  if (specifier.startsWith('@/')) base = 'src/' + specifier.slice(2);
  else if (specifier.startsWith('.')) base = path.posix.join(path.posix.dirname(fromFile), specifier);
  else return null;
  for (const c of [base, base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx']) {
    if (FILE_SET.has(c)) return c;
  }
  return null;
}

function findImportSite(importer, target) {
  const src = fs.readFileSync(path.join(ROOT, importer), 'utf8');
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = [
      ...line.matchAll(/(?:from\s+)?['"]([^'"]+)['"]/g),
      ...line.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
    ];
    for (const m of matches) {
      if (resolveSpecifier(importer, m[1]) !== target) continue;
      let start = i;
      for (let back = i; back >= Math.max(0, i - 12); back--) {
        if (/^\s*(import|export)\b/.test(lines[back])) { start = back; break; }
      }
      const statement = lines.slice(start, i + 1).join('\n');
      let symbol;
      const named = /(?:import|export)\s+(?:type\s+)?(?:\*\s+as\s+[\w$]+\s*,\s*)?\{([^}]*)\}/.exec(statement);
      if (named) {
        const first = named[1].split(',')[0].trim().replace(/^type\s+/, '');
        symbol = first.split(/\s+as\s+/)[0].trim() || undefined;
      }
      if (!symbol) {
        const def = /import\s+([A-Za-z_$][\w$]*)\s*(?:,|from)/.exec(statement);
        if (def) symbol = def[1];
      }
      if (!symbol) {
        const ns = /import\s+\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(statement);
        if (ns) symbol = ns[1];
      }
      if (symbol && !new RegExp(`\\b${symbol}\\b`).test(statement)) symbol = undefined;
      return {
        file: importer,
        lineStart: start + 1,
        lineEnd: i + 1,
        ...(symbol ? { symbol } : {}),
      };
    }
  }
  return null;
}

const source = (file, lineStart, lineEnd, symbol) => ({ file, lineStart, lineEnd, symbol, kind: 'source' });
const edge = (id, from, to, label, site) => ({
  id,
  source: from,
  target: to,
  kind: 'depends',
  label,
  evidence: 'source',
  site,
});
const node = (id, label, kind, moduleName, subtitle, sourceAnchor, facts) => ({
  id,
  label,
  kind,
  module: moduleName,
  subtitle,
  source: sourceAnchor,
  facts,
});

const sharedNode = (id, label, subtitle, sourceAnchor, facts) =>
  node(id, label, 'component', 'shared', subtitle, sourceAnchor, facts);

const ui = sharedNode(
  'shared-ui',
  'components/ui',
  'vendored shadcn 基础件',
  source('src/shared/components/ui/button.tsx', 43, 43, 'Button'),
  [
    'button / card / dialog / input / progress / select / toast / tooltip 共 8 个文件',
    '12 个消费方，71 个 import 位点',
    'ui 族豁免 ≥2 消费者，但禁止 0 消费',
  ],
);
const poker = sharedNode(
  'shared-poker',
  'components/poker',
  '牌面、筹码与变体可视化',
  source('src/shared/components/poker/Card.tsx', 32, 32, 'PokerCard'),
  [
    '9 个牌面与变体组件',
    '7 个消费方，25 个 import 位点',
    'CardSVG / CardBack / VariantGlyph 存在域内组合',
  ],
);
const quiz = sharedNode(
  'shared-quiz',
  'components/quiz',
  '测验卡与答题模型',
  source('src/shared/components/quiz/QuizCard.tsx', 45, 45, 'QuizCard'),
  [
    'QuizCard + quizCardModel 共 2 个文件',
    'onboarding 与 range-trainer 两个消费方',
    'QuizCard 域内复用 quizCardModel',
  ],
);
const feedback = sharedNode(
  'shared-feedback',
  'components/feedback',
  '结果页、五级反馈与空/载状态',
  source('src/shared/components/feedback/DecisionAnalysis.tsx', 33, 33, 'DecisionAnalysis'),
  [
    '10 个反馈与结果页组件',
    '12 个消费方，45 个 import 位点',
    'DecisionAnalysis 域内组合 GradeIcon 等组件',
  ],
);
const academy = sharedNode(
  'shared-academy',
  'components/academy',
  '学院共享组件与内容块',
  source('src/shared/components/academy/AcademyBridgeCard.tsx', 37, 37, 'AcademyBridgeCard'),
  [
    '7 个学院组件 + ContentBlocks + index.ts facade',
    'strategy-academy 与 theory-academy 共 17 个 import 位点',
    '唯一保留的目录级 barrel',
  ],
);
const display = sharedNode(
  'shared-data-display',
  'components/data-display',
  '进度与统计展示组件',
  source('src/shared/components/data-display/ProgressRing.tsx', 38, 38, 'ProgressRing'),
  [
    'ProgressBar / ProgressRing / StatCard / StatPair 共 4 个',
    '6 个消费方，14 个 import 位点',
  ],
);
const system = sharedNode(
  'shared-system',
  'components/system',
  '全局错误兜底',
  source('src/shared/components/system/ErrorBoundary.tsx', 14, 14, 'ErrorBoundary'),
  ['ErrorBoundary 单文件', 'app / layouts / main 三个外壳消费'],
);
const layout = sharedNode(
  'shared-layout',
  'components/layout',
  '返回入口统一件',
  source('src/shared/components/layout/BackLink.tsx', 124, 124, 'BackLink'),
  ['BackLink 单文件', '8 个消费方，29 个 import 位点'],
);
const constants = sharedNode(
  'shared-constants',
  'constants',
  '全局常量与规则模板',
  source('src/shared/constants/app.ts', 1, 1, 'APP_VERSION'),
  [
    'app / headsUpRules / mentorStyles / poker 共 4 个文件',
    '9 个消费方，19 个 import 位点',
  ],
);
const data = sharedNode(
  'shared-data',
  'data',
  '对手画像与题库',
  source('src/shared/data/opponentProfiles.ts', 3, 3, 'OPPONENT_PROFILES'),
  ['opponentProfiles 单文件', 'gto-simulator 与 strategy-academy 消费'],
);
const hooks = sharedNode(
  'shared-hooks',
  'hooks',
  '跨模块 React Hook',
  source('src/shared/hooks/useIsMobile.ts', 25, 25, 'useIsMobile'),
  ['useIsMobile / useRovingGridNav 共 2 个', '6 个消费方，6 个 import 位点'],
);
const stores = sharedNode(
  'shared-stores',
  'stores',
  '事件总线、调试开关与注册表',
  source('src/shared/stores/trainingEvents.ts', 12, 12, 'trainingEvents'),
  [
    'trainingEvents / debugMode / 3 个数据源注册表',
    '7 个消费方，31 个 import 位点',
    'debugMode 是 shared 唯一独立 persist store',
  ],
);
const types = sharedNode(
  'shared-types',
  'types',
  '跨模块领域类型',
  source('src/shared/types/poker.ts', 46, 46, 'HandNotation'),
  [
    '15 个类型模块',
    '9 个消费方，189 个 import 位点',
    '类型文件之间存在组合引用',
  ],
);
const utils = sharedNode(
  'shared-utils',
  'utils',
  '共享纯函数工具',
  source('src/shared/utils/cn.ts', 4, 4, 'cn'),
  [
    '17 个纯函数工具文件',
    '11 个消费方，195 个 import 位点',
    'seededShuffle / spacedRepetition 等存在域内复用',
  ],
);

const sharedNodes = [ui, poker, quiz, feedback, academy, display, system, layout, constants, data, hooks, stores, types, utils];

function pickSite(pairs, from, to) {
  const pair = pairs.find(([f, t]) => f === from && t === to);
  if (!pair) throw new Error(`missing site ${from} -> ${to}`);
  const site = findImportSite(pair[0], pair[1]);
  if (!site) throw new Error(`site not found ${from} -> ${to}`);
  return site;
}

const internalPairs = [
  ['academy-ui', 'components/academy', 'components/ui', '引用基础件', 'src/shared/components/academy', 'src/shared/components/ui'],
  ['academy-types', 'components/academy', 'types', '依赖类型', 'src/shared/components/academy', 'src/shared/types'],
  ['academy-utils', 'components/academy', 'utils', '复用纯函数', 'src/shared/components/academy', 'src/shared/utils'],
  ['display-ui', 'components/data-display', 'components/ui', '引用基础件', 'src/shared/components/data-display', 'src/shared/components/ui'],
  ['display-utils', 'components/data-display', 'utils', '复用纯函数', 'src/shared/components/data-display', 'src/shared/utils'],
  ['feedback-ui', 'components/feedback', 'components/ui', '引用基础件', 'src/shared/components/feedback', 'src/shared/components/ui'],
  ['feedback-types', 'components/feedback', 'types', '依赖类型', 'src/shared/components/feedback', 'src/shared/types'],
  ['feedback-utils', 'components/feedback', 'utils', '复用纯函数', 'src/shared/components/feedback', 'src/shared/utils'],
  ['layout-ui', 'components/layout', 'components/ui', '引用基础件', 'src/shared/components/layout', 'src/shared/components/ui'],
  ['layout-utils', 'components/layout', 'utils', '复用 cn', 'src/shared/components/layout', 'src/shared/utils'],
  ['poker-constants', 'components/poker', 'constants', '读取牌面常量', 'src/shared/components/poker', 'src/shared/constants'],
  ['poker-types', 'components/poker', 'types', '依赖牌型', 'src/shared/components/poker', 'src/shared/types'],
  ['poker-utils', 'components/poker', 'utils', '复用牌面工具', 'src/shared/components/poker', 'src/shared/utils'],
  ['quiz-feedback', 'components/quiz', 'components/feedback', '组合反馈组件', 'src/shared/components/quiz', 'src/shared/components/feedback'],
  ['quiz-poker', 'components/quiz', 'components/poker', '嵌入牌面', 'src/shared/components/quiz', 'src/shared/components/poker'],
  ['quiz-constants', 'components/quiz', 'constants', '读取常量', 'src/shared/components/quiz', 'src/shared/constants'],
  ['quiz-hooks', 'components/quiz', 'hooks', '键盘导航', 'src/shared/components/quiz', 'src/shared/hooks'],
  ['quiz-types', 'components/quiz', 'types', '依赖类型', 'src/shared/components/quiz', 'src/shared/types'],
  ['quiz-utils', 'components/quiz', 'utils', '复用纯函数', 'src/shared/components/quiz', 'src/shared/utils'],
  ['ui-utils', 'components/ui', 'utils', '复用 cn', 'src/shared/components/ui', 'src/shared/utils'],
  ['constants-types', 'constants', 'types', '依赖类型', 'src/shared/constants', 'src/shared/types'],
  ['data-types', 'data', 'types', '依赖类型', 'src/shared/data', 'src/shared/types'],
  ['stores-types', 'stores', 'types', '依赖类型', 'src/shared/stores', 'src/shared/types'],
  ['utils-constants', 'utils', 'constants', '读取常量', 'src/shared/utils', 'src/shared/constants'],
  ['utils-types', 'utils', 'types', '依赖类型', 'src/shared/utils', 'src/shared/types'],
];

function domainMatches(file, domain) {
  if (domain.startsWith('components/')) return file.startsWith(`src/shared/${domain}/`);
  return file.startsWith(`src/shared/${domain}/`);
}

const internalEdges = internalPairs.map(([id, from, to, label, fromPrefix, toPrefix]) => {
  const pair = scan.internal.find(([f, t]) => domainMatches(f, from) && domainMatches(t, to));
  if (!pair) throw new Error(`missing internal pair ${from} -> ${to}`);
  const site = findImportSite(pair[0], pair[1]);
  if (!site) throw new Error(`missing internal site ${from} -> ${to}`);
  const nodeId = (domain) =>
    domain === 'types' ? 'shared-types'
      : domain === 'utils' ? 'shared-utils'
      : domain === 'constants' ? 'shared-constants'
      : domain === 'data' ? 'shared-data'
      : domain === 'hooks' ? 'shared-hooks'
      : domain === 'stores' ? 'shared-stores'
      : domain === 'components/ui' ? 'shared-ui'
      : domain === 'components/poker' ? 'shared-poker'
      : domain === 'components/quiz' ? 'shared-quiz'
      : domain === 'components/feedback' ? 'shared-feedback'
      : domain === 'components/academy' ? 'shared-academy'
      : domain === 'components/data-display' ? 'shared-data-display'
      : domain === 'components/system' ? 'shared-system'
      : domain === 'components/layout' ? 'shared-layout'
      : (() => { throw new Error(domain); })();
  return edge(id, nodeId(from), nodeId(to), label, site);
});

const consumerDefs = [
  ['gto-simulator', 'gto-simulator', 'GTO 场景模拟与策略对比', source('src/features/gto-simulator/index.ts', 1, 12, 'Scenario'), '组件族导入 13 处：反馈 6 / 牌面 6 / 基础件 1', '支撑域导入 69 处：类型 44 / 工具 15 / 常量 4 / 画像 3 / Hook 2 / store 1'],
  ['hand-history', 'hand-history', '牌局导入、回放与偏差标注', source('src/features/hand-history/index.ts', 1, 9, 'useHandHistoryStore'), '组件族导入 6 处：牌面 3 / 反馈 2 / 展示 1', '支撑域导入 33 处：类型 28 / 工具 5'],
  ['help-center', 'help-center', '教程、概念卡片与 FAQ', source('src/features/help-center/index.ts', 7, 9, 'HelpHome'), '组件族导入 3 处：反馈 1 / 返回 1 / 基础件 1', '支撑域导入 2 处：工具 2'],
  ['onboarding', 'onboarding', '新手引导与偏好采集', source('src/features/onboarding/index.ts', 1, 8, 'OnboardingFlow'), '组件族导入 6 处：基础件 5 / 测验 1', '支撑域导入 9 处：类型 5 / 工具 4'],
  ['pot-odds', 'pot-odds', '底池赔率与 EV 训练', source('src/features/pot-odds/index.ts', 1, 12, 'OddsCalculator'), '组件族导入 14 处：基础件 8 / 反馈 5 / 返回 1', '支撑域导入 15 处：工具 7 / 类型 6 / Hook 1 / store 1'],
  ['progress', 'progress', '训练记录中枢与五大系统', source('src/features/progress/index.ts', 1, 5, 'useProgressStore'), '组件族导入 40 处：基础件 30 / 反馈 4 / 牌面 4 / 展示 1 / 返回 1', '支撑域导入 71 处：工具 43 / 类型 16 / store 10 / 常量 2'],
  ['puzzle-trainer', 'puzzle-trainer', '谜题训练与每日谜题', source('src/features/puzzle-trainer/index.ts', 1, 11, 'PuzzleCard'), '组件族导入 18 处：反馈 7 / 基础件 7 / 返回 3 / 展示 1', '支撑域导入 19 处：工具 12 / 类型 4 / store 2 / Hook 1'],
  ['range-trainer', 'range-trainer', '翻前范围学习与测验', source('src/features/range-trainer/index.ts', 1, 8, 'RangeGrid'), '组件族导入 15 处：基础件 10 / 反馈 2 / 展示 1 / 返回 1 / 测验 1', '支撑域导入 45 处：类型 27 / 工具 10 / 常量 4 / store 3 / Hook 1'],
  ['strategy-academy', 'strategy-academy', '策略课程、Drill 与认证', source('src/features/strategy-academy/index.ts', 1, 12, 'AcademyHome'), '组件族导入 53 处：返回 16 / 牌面 11 / 学院 9 / 反馈 8 / 展示 7 / 基础件 2', '支撑域导入 92 处：工具 56 / 类型 24 / store 8 / 常量 2 / 画像 1 / Hook 1'],
  ['theory-academy', 'theory-academy', '理论课程与章末小测', source('src/features/theory-academy/index.ts', 1, 6, 'TheoryHome'), '组件族导入 29 处：学院 8 / 反馈 8 / 返回 5 / 基础件 4 / 展示 3 / 牌面 1', '支撑域导入 82 处：工具 37 / 类型 35 / store 6 / 常量 4'],
  ['shell-app', 'app', '应用外壳与路由', source('src/app/routes.tsx', 17, 32, 'lazyPage'), '组件族导入 2 处：反馈 1 / 错误边界 1', '无支撑域引用'],
  ['shell-layouts', 'layouts', '应用布局与移动导航', source('src/layouts/AppLayout.tsx', 63, 63, 'AppLayout'), '组件族导入 5 处：基础件 2 / 反馈 1 / 返回 1 / 错误边界 1', '支撑域导入 6 处：工具 4 / 常量 2'],
  ['shell-main', 'main', '启动引导与根渲染', source('src/main.tsx', 16, 16, 'bootstrapAndRender'), '组件族导入 2 处：错误边界 1 / 基础件 1', '支撑域导入 1 处：常量 1'],
];

const consumerNodes = consumerDefs.map(([id, moduleName, subtitle, sourceAnchor, componentFact, supportFact]) =>
  node(id, id === 'shell-app' ? 'app 外壳' : id === 'shell-layouts' ? 'layouts' : id === 'shell-main' ? 'main' : id, 'component', moduleName, subtitle, sourceAnchor, [componentFact, supportFact]),
);

const consumerByModule = {
  'gto-simulator': 'gto-simulator',
  'hand-history': 'hand-history',
  'help-center': 'help-center',
  onboarding: 'onboarding',
  'pot-odds': 'pot-odds',
  progress: 'progress',
  'puzzle-trainer': 'puzzle-trainer',
  'range-trainer': 'range-trainer',
  'strategy-academy': 'strategy-academy',
  'theory-academy': 'theory-academy',
  app: 'shell-app',
  layouts: 'shell-layouts',
  main: 'shell-main',
};

function consumerOf(file) {
  if (file.startsWith('src/features/')) return file.split('/')[2];
  if (file.startsWith('src/app/')) return 'app';
  if (file.startsWith('src/layouts/')) return 'layouts';
  if (file === 'src/main.tsx' || file === 'src/App.tsx') return 'main';
  return null;
}

const familyNode = {
  feedback: 'shared-feedback',
  poker: 'shared-poker',
  ui: 'shared-ui',
  quiz: 'shared-quiz',
  academy: 'shared-academy',
  'data-display': 'shared-data-display',
  system: 'shared-system',
  layout: 'shared-layout',
};

const familyLabel = {
  feedback: '引用反馈组件',
  poker: '引用牌面组件',
  ui: '引用基础件',
  quiz: '引用测验组件',
  academy: '引用学院组件',
  'data-display': '引用展示组件',
  system: '引用错误边界',
  layout: '使用返回入口',
};

function domainOfShared(file) {
  const m = /^src\/shared\/(components\/([^/]+)|[^/]+)\//.exec(file);
  if (!m) return null;
  return m[1].startsWith('components/') ? m[1].split('/')[1] : m[1];
}

const view2Edges = [];
for (const [fromFile, toFile] of scan.projectToShared) {
  const consumer = consumerOf(fromFile);
  const family = domainOfShared(toFile);
  if (!consumer || !family || !familyNode[family]) continue;
  const site = findImportSite(fromFile, toFile);
  if (!site) continue;
  const key = `${consumer}-${family}`;
  if (view2Edges.some((e) => e.id === `v2-${key}`)) continue;
  view2Edges.push(edge(`v2-${key}`, consumerByModule[consumer], familyNode[family], familyLabel[family], site));
}

// Ensure every consumer/family pair has an edge by scanning all file pairs.
for (const [consumer, moduleName] of Object.entries(consumerByModule)) {
  for (const [family, nodeId] of Object.entries(familyNode)) {
    const id = `v2-${consumer}-${family}`;
    if (view2Edges.some((e) => e.id === id)) continue;
    const pair = scan.projectToShared.find(([f, t]) => consumerOf(f) === consumer && domainOfShared(t) === family);
    if (!pair) continue;
    const site = findImportSite(pair[0], pair[1]);
    if (site) view2Edges.push(edge(id, moduleName, nodeId, familyLabel[family], site));
  }
}

const supportNode = {
  types: 'shared-types',
  utils: 'shared-utils',
  constants: 'shared-constants',
  stores: 'shared-stores',
  data: 'shared-data',
  hooks: 'shared-hooks',
};

const supportLabel = {
  types: '依赖类型',
  utils: '复用纯函数',
  constants: '读取常量',
  stores: '订阅事件',
  data: '读取对手画像',
  hooks: '使用 Hook',
};

const view3Edges = [];
for (const [consumer, moduleName] of Object.entries(consumerByModule)) {
  for (const [domain, nodeId] of Object.entries(supportNode)) {
    const pair = scan.projectToShared.find(([f, t]) => consumerOf(f) === consumer && domainOfShared(t) === domain);
    if (!pair) continue;
    const site = findImportSite(pair[0], pair[1]);
    if (site) view3Edges.push(edge(`v3-${consumer}-${domain}`, moduleName, nodeId, supportLabel[domain], site));
  }
}

const view2ConsumerIds = new Set(view2Edges.map((e) => e.source));
const view3ConsumerIds = new Set(view3Edges.map((e) => e.source));

const trainerIds = ['gto-simulator', 'hand-history', 'onboarding', 'pot-odds', 'progress', 'puzzle-trainer', 'range-trainer'];
const academyIds = ['strategy-academy', 'theory-academy', 'help-center', 'shell-app', 'shell-layouts', 'shell-main'];

const componentFamilyNodes = [ui, poker, quiz, feedback, academy, display, system, layout];
const supportDomainNodes = Object.values(supportNode).map((id) => sharedNodes.find((n) => n.id === id));

const diagrams = [
  {
    meta: {
      title: 'shared 层内部依赖（组件族与支撑域）',
      diagramType: 'architecture',
      viewId: 'shared-internal',
      sourceRef: 'working tree @ 32b4bf8（2026-11-06）',
      locale: 'zh-CN',
      scope: '共享层内部依赖（域级）：14 个节点覆盖 src/shared 的 8 个组件族与 6 个支撑域；25 条跨域依赖边，域内自引用见 facts。',
      notes: [
        '域级聚合：节点代表一个组件族或支撑域，不展开到单文件。',
        'feedback / poker / quiz / types / utils 的域内自引用写入 facts，不画自环。',
        '引用位点统计来自工作树 import 图，仅计生产代码，不含测试。',
        '准入守卫通过：0 生产消费者仅 2 个测试桩豁免，ui/tooltip 单消费者按 ui 规则豁免。',
      ],
    },
    nodes: sharedNodes,
    edges: internalEdges,
  },
  {
    meta: {
      title: '训练模块 → shared 组件族',
      diagramType: 'architecture',
      viewId: 'trainers-to-shared-components',
      sourceRef: 'working tree @ 32b4bf8（2026-11-06）',
      locale: 'zh-CN',
      scope: '训练类 feature 模块对 shared 组件族的引用：gto-simulator / hand-history / onboarding / pot-odds / progress / puzzle-trainer / range-trainer，聚合边 25 条。',
      notes: [
        '边按实际 import 聚合，统计口径为 import 位点，非去重文件数。',
        '学院、帮助中心与外壳层引用见另一视图，二者合计覆盖全项目。',
        '组件族引用次数见各消费方节点 facts。',
      ],
    },
    nodes: [...consumerNodes.filter((n) => trainerIds.includes(n.id)), ...componentFamilyNodes],
    edges: view2Edges.filter((e) => trainerIds.includes(e.source)),
  },
  {
    meta: {
      title: '学院、帮助与外壳 → shared 组件族',
      diagramType: 'architecture',
      viewId: 'academies-to-shared-components',
      sourceRef: 'working tree @ 32b4bf8（2026-11-06）',
      locale: 'zh-CN',
      scope: '学院、帮助与外壳层对 shared 组件族的引用：strategy-academy / theory-academy / help-center / app / layouts / main，聚合边 23 条。',
      notes: [
        '边按实际 import 聚合，统计口径为 import 位点，非去重文件数。',
        '训练模块引用见另一视图，二者合计覆盖全项目。',
        'academy facade 的 import 位点计入 components/academy。',
      ],
    },
    nodes: [...consumerNodes.filter((n) => academyIds.includes(n.id)), ...componentFamilyNodes],
    edges: view2Edges.filter((e) => academyIds.includes(e.source)),
  },
  {
    meta: {
      title: '训练模块 → shared 支撑域',
      diagramType: 'architecture',
      viewId: 'trainers-to-shared-support',
      sourceRef: 'working tree @ 32b4bf8（2026-11-06）',
      locale: 'zh-CN',
      scope: '训练类 feature 模块对 shared 支撑域的引用：types / utils / constants / stores / data / hooks，聚合边 27 条。',
      notes: [
        '边按实际 import 聚合，统计口径为 import 位点，非去重文件数。',
        '学院、帮助中心与外壳层引用见另一视图，二者合计覆盖全项目。',
        '支撑域引用次数见各消费方节点 facts。',
      ],
    },
    nodes: [...consumerNodes.filter((n) => trainerIds.includes(n.id)), ...supportDomainNodes],
    edges: view3Edges.filter((e) => trainerIds.includes(e.source)),
  },
  {
    meta: {
      title: '学院、帮助与外壳 → shared 支撑域',
      diagramType: 'architecture',
      viewId: 'academies-to-shared-support',
      sourceRef: 'working tree @ 32b4bf8（2026-11-06）',
      locale: 'zh-CN',
      scope: '学院、帮助与外壳层对 shared 支撑域的引用：strategy-academy / theory-academy / help-center / layouts / main，聚合边 14 条；app 无支撑域引用。',
      notes: [
        '边按实际 import 聚合，统计口径为 import 位点，非去重文件数。',
        'app 外壳无支撑域引用，未列入本视图。',
        '训练模块引用见另一视图，二者合计覆盖全项目。',
      ],
    },
    nodes: [...consumerNodes.filter((n) => academyIds.includes(n.id) && n.id !== 'shell-app'), ...supportDomainNodes],
    edges: view3Edges.filter((e) => academyIds.includes(e.source) && e.source !== 'shell-app'),
  },
];

const out = { diagrams };
const outPath = path.join(ROOT, 'docs/qgraphflow/shared-references-architecture/graph.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify({
  outPath,
  views: diagrams.map((d) => ({
    viewId: d.meta.viewId,
    nodes: d.nodes.length,
    edges: d.edges.length,
  })),
}, null, 2));
