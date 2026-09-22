# 模块边界与依赖架构审查（证据化）

| 项 | 内容 |
|---|---|
| 审查范围 | `src/features/**` 模块边界、跨模块导入合规性、分层方向、shared 层准入、启动期依赖时序 |
| 审查方法 | `dependency-impact-analyzer`：静态导入边采集 → 与 `eslint.config.js` 白名单逐条比对 → 分层方向核验 → 首屏消费链遍历 |
| 证据基线 | 工作树 @ HEAD `e6df584`（2026-09-04），157 项未提交改动，采集 2026-09-21 |
| 依赖粒度 | 文件级导入边，聚合到模块级（`src/features/<module>` / `src/shared` / `src/i18n` / `src/app`） |
| 严重度标尺 | **P0** 门禁已红或用户可见功能静默失效；**P1** 约束存在但无守卫，随时间放大；**P2** 维护成本 |
| 配套产物 | `module-boundary-violations.csv`（机器可读违规清单） |

> **与既有文档的关系**：`architecture-review.md:18` 结论为「跨模块 import 边与 eslint.config.js 白名单逐条相等、无 peer 债务边」。该结论的证据基线是 2026-08-30 @ `c966912`，落后当前 HEAD 两个提交。**本次审查实测该结论已不成立**（见 A1）。两份文档不冲突，是时间差导致的失效。

---

## 环境受限声明（先读，影响结论可采信范围）

本次审查**无法运行 `pnpm test` 与可信的 `pnpm typecheck`**，根因是本地依赖链接损坏，不是代码缺陷：

- `node_modules/vitest` 顶层链接**缺失**（`Test-Path` → `False`），而包实体存在于 `node_modules/.pnpm/vitest@4.1.10_@types+node@2_.../`。
- 直接调用 vitest 入口报 `ERR_MODULE_NOT_FOUND: Cannot find package 'vitest'`（从 `.vite-temp/vitest.config.ts.timestamp-*.mjs` 解析失败）。
- 因此 `tsc --noEmit` 输出的 60+ 条 `error TS2307: Cannot find module 'vitest'` **全部是该环境噪声**，不构成架构缺陷，已从本报告的发现中剔除。
- 与提交 `2322815 chore: 删除损坏的 node_modules 备份文件` 相互印证。

**可采信的证据**：ESLint（独立运行正常，exit 1 的 2 条错误与 vitest 无关）、全部静态代码证据、git 历史。
**不可采信**：`pnpm test` 结果、`tsc` 的 TS2307 类错误。

**复验前置动作**：`pnpm install` 修复链接后重跑 `pnpm verify`。B2/B4/C1 的测试类建议在修复后才可执行。

---

## 结论先说

模块隔离的**设计**是扎实的：白名单是精确快照、有守卫测试、依赖倒置注册表（`academyDataSourceRegistry` / `achievementRegistry`）干净地解开了「中枢反向读学院数据」这条最难的边。

问题不在设计，在**执行链条的三处断裂**：

1. **门禁已经红了但没人被拦住** —— `pnpm lint` 当前 exit 1，而 `.git-hooks/pre-commit` 只校验 agent 文件、完全不跑 verify。违规边已经推到 `origin/main`。
2. **守卫管错了方向** —— eslint 的隔离规则只覆盖 `src/features/**`，而实际的分层违规发生在 `src/shared/**`（shared 反向依赖 feature），那里**零守卫**。
3. **两个优化叠加出了时序竞态** —— 「依赖倒置注册」与「bootstrap 延迟加载」各自都对，合在一起让首屏 Dashboard 在注册完成前就挂载，且失联后**不会自愈**。

---

## P0 · 门禁已红 / 用户可见静默失效

### A1 `progress → theory-academy` 白名单外边，`pnpm lint` 当前 exit 1，CI 部署阻塞

**证据（high，已实测）**

ESLint 实跑输出：

```
F:\code\dezhou\src\features\progress\persistWrapperProbe.test.ts
  11:1  error  '@/features/theory-academy/utils/theorySrs' import is restricted...  no-restricted-imports
  12:1  error  '@/features/theory-academy/types' import is restricted...            no-restricted-imports
✖ 2 problems (2 errors, 0 warnings)      ExitCode: 1
```

- 违规位置：`src/features/progress/persistWrapperProbe.test.ts:11-12`
- 白名单事实源：`eslint.config.js:31` → `progress: []`（零出边）
- 该文件另在 `:59` 动态 import `@/features/theory-academy/utils/theoryProgress`（动态 import 同样构成依赖边，但 eslint 的 `no-restricted-imports` 对 `import()` 表达式的覆盖需单独确认）

**影响范围**

- `.github/workflows/deploy.yml` 触发器为 `on: push: branches: [main]`，步骤链为 `Typecheck → Lint → Test → Build`。**Lint 步骤必然失败** → GitHub Pages 部署阻塞。HEAD `e6df584` 已在 `origin/main`，即**当前线上部署流水线为红**。
- 违反 AGENTS.md §质量门禁「`pnpm lint` 必须 exit code 0」。

**契约分叉（这是比红本身更值得修的部分）**

- `src/eslintCrossImports.test.ts:20-22` 注释声称：「progress 的成就检查与学院课程数据源已全部依赖倒置（achievementRegistry + academyDataSourceRegistry），**不再静态 import 任何 trainer store**」。实测存在静态 import → 注释与代码分叉。
- `architecture-review.md:18`「无 peer 债务边」同样失效。

**修复建议**

按「边该不该存在」而非「怎么让 lint 变绿」来决策：

- **方案 A（推荐，治本）**：该测试是 P0 复验探针，需要 theory-academy 的**真实章节数据**来验证 SRS 入队。测试的语义归属是 theory-academy 侧的入队契约，应**移到 `src/features/theory-academy/`** 下（该模块 → progress 是白名单内边，`:22-23` 已有同类先例 `theoryReviewI18n.test.tsx` import progress 的 SRS 组件）。移动后 progress 出边归零，白名单无需放宽。
- **方案 B（次选）**：若坚持测试留在 progress，则补一个 `theoryDataSourceRegistry`（对称于既有 `academyDataSourceRegistry`），由 theory-academy 的 bootstrap 注册章节数据源，progress 侧经 registry 取数。**注意这会加重 A2 的时序面**，需同步处理。
- **不可接受**：把 `theory-academy` 加进 `ALLOWED_CROSS_IMPORTS['progress']`。白名单注释明写「收紧时只删不加」，且 progress 是中枢，一旦允许中枢反向依赖 trainer，依赖倒置的全部成果作废。

**验收标准**

- `pnpm lint` exit 0；`ALLOWED_CROSS_IMPORTS` 与 `EXPECTED_SNAPSHOT` 均**未被修改**（守卫测试原样通过）。
- `Get-ChildItem src\features\progress -Recurse | Select-String "@/features/(?!progress)"` 结果为空。
- `eslintCrossImports.test.ts:20-22` 的注释重新与代码一致。

---

### A2 启动时序竞态：registry 延迟注册 vs 首屏同步消费，且失联后不自愈

**证据（high 事实 + medium 触发概率）**

事实链：

1. `src/main.tsx`：三学院 bootstrap 放进 `requestIdleCallback` **异步**加载（P0-03 优化），而 `initProgressStore().then(() => createRoot(...).render(...))` 在其完成后**立即渲染**。两条链无同步点。
2. `src/app/routes.tsx:84`：首页 index 路由 = `<Dashboard />`，**首屏必经**。
3. Dashboard 的三个消费点全部读 registry：
   - `Dashboard.tsx:57` → `useAcademyProgressSnapshot()`
   - `Dashboard.tsx:18` 引入 `DailyChallenge`，其 `:87` → `getAchievementSources().some(...)`
   - `Dashboard.tsx:19` 引入 `DailyTrainingPlan`，经 `progress/utils/dailyTrainingPlan.ts:100` → `getAcademyDataSource()?.findNextLesson(...)`
4. `src/shared/hooks/useAcademyDataSource.ts:18-21`：`subscribeAcademy` 在**订阅时刻**读 registry，未注册则返回 `() => {}`（空取消函数）。
5. `subscribeAcademy` 是**模块级稳定引用** → `useSyncExternalStore` 不会重新订阅。

**失效机制**：若 Dashboard 挂载早于 idle callback 执行，则订阅被固化为空函数、快照固化为 `EMPTY_PROGRESS`（`:16`）。**即使 registry 随后注册成功，已挂载组件也收不到任何通知**，不会自愈，直到用户导航离开再回来（重新挂载）。

**影响范围**

- 首页「每日训练计划」的学院课程推荐**间歇性为空**。
- `progress/store.ts` 中 8 处成就判定（`:1087, 1112, 1125, 1131, 1135, 1139, 1147, 1156`）遍历 `getAchievementSources()`，空数组 → `.some()` 恒 false → **成就静默不解锁**。
- `ProgressReplay.tsx:23-24` 的首次/最近得分同理为空。
- 失败**完全静默**：无异常、无日志、UI 正常渲染，只是数据是空的。这与仓库既有的 R10「失败路径全部静默」是同一模式。

**触发概率（medium，需实测）**：`initProgressStore()` 内部 `await` 了 hydration 与 `recordDatabase.getAll()`（IndexedDB），耗时不确定；`requestIdleCallback` 触发时机同样不确定。**两条异步链竞速，结果依设备与缓存状态而变** —— 间歇性、难复现，正是最难排查的一类。

**零回归保护**：全仓测试文件中 grep `registerAcademyDataSource|registerAchievementSource|requestIdleCallback` **命中为空**。

**注释分叉**：`academyDataSourceRegistry.ts:5` 写「注册由应用入口 `import '@/features/strategy-academy/store.bootstrap'` 触发（见 src/main.tsx）」—— 描述的是**静态同步 import** 语义；实际实现已改为 idle 动态 import。`theory-academy/store.bootstrap.ts` 顶部注释同样写「由应用入口 import 本文件触发注册」。

**修复建议**

核心是**建立显式同步点**，不要靠两条异步链碰运气：

1. **让渲染等待注册完成**（推荐，改动最小）：把三学院 bootstrap 的 `await import(...)` 纳入 `initProgressStore()` 之前的同一条 async 链，渲染前 `await Promise.all([...])`。若担心首屏体积，则至少 `await` **成就/学院数据源注册**这一最小集，把其余初始化留在 idle。
2. **或让失联可自愈**：`academyDataSourceRegistry` 增加订阅能力（`onRegister(listener)`），`subscribeAcademy` 改为「未注册时订阅注册事件，注册后转发 listener」。这样即使晚注册，已挂载组件也能收到通知。
3. **补时序守卫测试**：模拟「Dashboard 先挂载、registry 后注册」，断言学院进度最终非空。这是唯一能防止回归的手段。

**验收标准**

- 新增测试覆盖「晚注册」路径并通过。
- `main.tsx` 中渲染与注册存在可验证的先后关系（`await` 链或订阅自愈），而非依赖 idle 时序。
- `academyDataSourceRegistry.ts` 与两个 `store.bootstrap.ts` 的注释与实际加载方式一致。

---

## P1 · 约束存在但无守卫

### B1 分层守卫覆盖面缺口：eslint 只管 features，`shared → features` 反向依赖零告警

**证据（high）**

- `eslint.config.js:43`：隔离规则的 `files` 为 `['src/features/${feature}/**/*.{ts,tsx}']` —— **只覆盖 features 目录**。`src/shared/**`、`src/i18n/**`、`src/layouts/**`、`src/app/**` 无任何方向性约束。
- 实证违规 1：`src/shared/components/gate/SessionLimitGuard.tsx:16` → `import { useProgressStore } from '@/features/progress/store'`。**shared 层反向依赖 feature 层**，lint 静默通过。
- 实证违规 2：`src/i18n/unitRef.test.ts:2-3` → import `@/features/strategy-academy/data/lessons/variants` 与 `data/localLessons`。

**为什么值得修（约束已在同一目录内自相矛盾）**

`src/shared/components/business/GameVariantSelector.tsx:7` 的注释明写：「解除对 `features/progress/store` 的直接依赖（**shared 不依赖 feature 的分层约束**）」。

即：同一条约束，`GameVariantSelector` 专门做了重构去遵守，`SessionLimitGuard` 直接违反且无人发现。这不是「规则不清楚」，是「规则没有执行面」。

**影响范围**

- shared 是所有模块的公共底座。一旦 shared 依赖 feature，依赖图出现**结构性环**：`strategy-academy → shared/SessionLimitGuard → progress`，而 progress 又被 strategy-academy 依赖。当前尚不构成编译期循环（因 progress 不反向 import 该 shared 文件），但边界已不可推理。
- 该缺口会**持续放大**：每次新增 shared 组件都可以无成本地 import 任意 feature。

**修复建议**

1. 在 `eslint.config.js` 增加一个分层块，对 `src/shared/**` 禁止 `@/features/*`（无例外，shared 是底座）。
2. `SessionLimitGuard` 的处置：它是「跨模块复用每日题量上限门禁」，状态持有方是 progress。两条路 —— (a) 改为 props/hook 注入（调用方把 `limit`/`answered` 传进来，shared 只负责渲染与判定），彻底去掉反向依赖；(b) 若认为「门禁组件天然属于 progress」，则把它移出 shared、归入 `progress/components/`，并更新 AGENTS.md §调试解锁的门禁点清单。**推荐 (a)**，因为消费方是四个 trainer 模块，留在 shared 符合准入门槛。
3. `src/i18n/unitRef.test.ts` 的处置：i18n 守卫测试需要遍历课程数据，属于「测试期的合理跨层」。建议在 eslint 分层块中为 `src/i18n/**/*.test.ts` 开一个**显式命名豁免**（写在配置里、有注释说明），而不是留一个无人知晓的空白。

**验收标准**

- `eslint.config.js` 存在 shared/i18n 层的分层规则块；对 `src/shared/**` grep `@/features/` 结果为空或有显式豁免登记。
- 故意在 `src/shared/utils/` 新建一个 import `@/features/progress/store` 的文件，`pnpm lint` 变红（守卫有效性自证）。

---

### B2 白名单快照守卫是「配置自证」，无法捕获代码越界；pre-commit 不跑 verify

**证据（high）**

- `src/eslintCrossImports.test.ts:41-44` 断言的是 `ALLOWED_CROSS_IMPORTS` **常量本身**等于硬编码的 `EXPECTED_SNAPSHOT`。它守卫「白名单不被偷偷放宽」，**不守卫「代码不产生白名单外的边」**。
- 后者只能由 eslint 承担，而 `.git-hooks/pre-commit`（`core.hooksPath` 已配置为 `.git-hooks`）全文只做一件事：当 `.claude/agents/*-dev.md` 有变更时跑 `node scripts/validate-agent-tools.ts`。**不含 typecheck / lint / test**。

**失效链条（A1 得以进入 main 的完整解释）**

```
开发者写测试 → 引入 progress → theory-academy 边
  ↓ pre-commit：只查 agent 文件 → 放行
  ↓ 快照守卫：只比配置常量 → 通过（配置确实没改）
  ↓ push origin/main
  ↓ CI deploy.yml：Lint 步骤 → 红（但已经推上去了）
```

三层「守卫」全部通过，唯一的拦截点在 push 之后。AGENTS.md §质量门禁写「每次代码变更后必须运行 `pnpm verify`」，这是一条**纯人工约定，无执行面**。

**影响范围**：任何越界边都能无阻力进入 main，并阻塞部署。A1 不是偶发，是该链条的必然产物。

**修复建议**

1. **pre-commit 接入 verify**（治本）：在 `.git-hooks/pre-commit` 增加 `pnpm verify`（或至少 `pnpm lint`，秒级）。注意 memory 中已记录的坑：hook 在 Unix 下缺执行位会被静默跳过，需同步处理 `chmod +x` 与文档。
2. **让快照守卫真正管代码边**：新增一条测试，静态扫描 `src/features/<m>/**` 的全部 import，聚合出**实际依赖图**，断言其为 `ALLOWED_CROSS_IMPORTS` 的子集。这样即使有人绕过 eslint（如动态 import、新目录未纳入 `files`），测试也会红。这正好补上 A1 中「动态 import 是否被 eslint 覆盖」的盲区。

**验收标准**

- 提交一个含越界边的改动，pre-commit 拦截。
- 新增的「实际依赖图 ⊆ 白名单」测试存在，且在 A1 未修复时会红。

---

### B3 shared 层归属违规：162 行文件逐字重复，shared 版本为死代码

**证据（high，已实测）**

```
shared 行数: 162 / progress 行数: 162
Compare-Object → 无差异
>>> 两份文件完全一致（逐字重复） <<<
```

- `src/shared/utils/shareCard.ts`（162 行）
- `src/features/progress/components/streak/shareCard.ts`（162 行）
- 引用实况：`src/features/progress/components/streak/StreakCelebration.tsx` 使用 **progress 内那份**；`src/shared/utils/shareCard.ts` 的引用方**只有它自己**（零外部消费）→ 死代码。

**其余准入违规**（AGENTS.md：「被 ≥2 个模块使用才可放入；单模块使用的代码留在模块内」）：

| shared 文件 | 实际消费模块 | 判定 |
|---|---|---|
| `utils/shareCard.ts` | 无（死代码） | 归属 progress，shared 版本应删 |
| `utils/soundManager.ts` | 仅 `strategy-academy`（`PracticeDrill.tsx`） | 单模块，违规 |
| `utils/elo.ts` | 仅 `progress` | 单模块，违规 |
| `utils/sanitizeReviewLabel.ts` | 仅 `progress` | 单模块，违规 |
| `utils/toLocalDateKey.ts` | 仅 `progress` | 单模块，违规 |

> 统计方法：按 `shared/utils/<name>` 字面匹配全仓 import，排除 root/shared 自身。经 `index.ts` barrel 的间接引用已单独核验（barrel 只导出 `cn`/`formatters`/`toLocalDateKey`/`sanitizeReviewLabel`/`handClassifier`/`rangeParser`），不影响上述结论。`toLocalDateKey` / `sanitizeReviewLabel` 虽经 barrel 暴露，但实际消费方仍只有 progress。

**影响范围**

- 重复的 162 行是**双倍维护面**：Canvas 绘制逻辑、颜色常量（`FELT_TOP = '#0a5c36'` 等硬编码 hex）改动时极易只改一份。
- 违反 AGENTS.md §文件语义归属登记「以实际消费方实证归属（唯一消费方所在模块即归属方）」。
- shared 层被单模块代码稀释，降低「shared = 真正公共」的信号价值。

**修复建议**

1. **立即**：删除 `src/shared/utils/shareCard.ts`（零引用死代码，删除零风险）。progress 内那份即归属方，无需移动。
2. **顺带**：`soundManager.ts` 移入 `strategy-academy/utils/`；`elo.ts` / `sanitizeReviewLabel.ts` / `toLocalDateKey.ts` 移入 `progress/utils/`，并同步从 `shared/utils/index.ts` barrel 移除导出。
3. **防回归**：加一条 shared 准入守卫测试 —— 扫描 `src/shared/**` 每个文件的消费模块数，断言 ≥2，配一个「只降不升」的基线快照（复用 `eslintCrossImports.test.ts` 的快照守卫模式），避免一次性整改全部。

**验收标准**

- `Get-ChildItem src\shared -Recurse | Select-String "@/features/"` 为空（与 B1 联动）。
- shared 准入守卫测试存在，新增单模块 shared 文件时变红。
- 全仓不存在两份内容相同的文件（可加一条重复文件检测）。

---

### B4 `achievementRegistry` 无幂等保护，重复注册会静默累积

**证据（high）**

`src/shared/stores/achievementRegistry.ts` 全文仅 13 行，核心是：

```ts
const registry: AchievementDataSource[] = [];
export function registerAchievementSource(source: AchievementDataSource): void {
  registry.push(source);   // 无去重、无 id、无幂等判定
}
```

对比：`progress/store.bootstrap.ts:22-25` 有 `let bootstrapped = false` 幂等标志。**注册侧没有对称保护**。

**影响范围**

- ESM 模块缓存保证正常生产路径下每个 bootstrap 只执行一次，故当前不必然出错。
- 但 **HMR / 模块重执行**场景下 `registerAchievementSource` 会重复 push，`getAchievementSources()` 返回重复源，`progress/store.ts` 的 8 处 `.some(...)` 遍历重复项。开发期成就判定行为与生产不一致，排查成本高。
- 与 AGENTS.md §状态管理「记录完成 action 必须幂等」的项目惯例不一致。

**修复建议**

给数据源加稳定 `id`（如 `'strategy-academy'` / `'theory-academy'` / `'puzzle-trainer'`），`registerAchievementSource` 改为按 id upsert（已存在则替换而非追加）。`academyDataSourceRegistry` 是单值 slot（`dataSource = source`）天然幂等，无需改动 —— 两者语义不对称，正说明 registry 侧漏了这一步。

**验收标准**：连续调用两次 `registerAchievementSource(同一 id)` 后 `getAchievementSources().length === 1`，有测试覆盖。

---

## P2 · 维护成本

| 编号 | 发现 | 证据 | 建议 | 验收 |
|---|---|---|---|---|
| C1 | `progress/store.ts` 已成上帝对象：**1099 行**单文件，被 **37 个** feature 文件依赖，内含五大系统 + 8 处成就判定 | 实测行数；fan-in 分布：onboarding 9 / puzzle-trainer 6 / strategy-academy 6 / theory-academy 6 / range-trainer 5 / gto-simulator 3 / pot-odds 2 | 虽属 AI_GUIDE 的 store 豁免类别，但 1099 行 + 最高 fan-in 意味着**任何改动的爆炸半径都是全应用**。建议按五大系统拆 slice（Zustand slices 模式），保持单一 persist 入口不变 | 单文件降至 ≤500 行且 persist version/迁移行为不变；`pnpm test` 全绿 |
| C2 | `architecture-review.md` 的核心结论已过期失效 | `:18`「无 peer 债务边」vs A1 实测 lint 红；证据基线 `c966912`(08-30) 落后 HEAD `e6df584`(09-04) | 在文档头部加「证据基线」失效标注并指向本报告；建立「架构结论必须绑定 commit + 采集日期」的惯例（该文档已有此字段，值得保留） | 读者不会据过期结论做决策 |
| C3 | `initProgressStore()` 若 hydration 回调永不触发 → Promise 永挂 → **应用永不渲染（白屏）**，无 timeout 兜底、`.then()` 无 `.catch()` | `main.tsx`：`void initProgressStore().then(() => createRoot(...).render(...))`；`store.bootstrap.ts:waitForHydrationAndMigrateLegacyRecords` 依赖 `hasHydrated()` 或 `onFinishHydration` 二者之一 | 加 `Promise.race` 超时兜底（如 3s 后仍渲染，降级为「无 records 模式」）+ `.catch()` 兜底渲染 + 可见错误提示。与 `architecture-review.md` R2 的 IndexedDB 永挂是**同一失效模式**，可一并处理 | 人为制造 hydration 不触发，应用仍能渲染并给出可诊断提示 |

---

## 依赖图现状（模块级实测）

**运行时边（白名单内，健康）**：7 个 trainer/学院模块 → `progress`，单向、无环。

```
onboarding ─┐
puzzle-trainer ─┤
strategy-academy ─┤
theory-academy ─┼──→ progress ──→ shared/{stores,hooks,types,utils}
range-trainer ─┤         ↑
gto-simulator ─┤         │ (依赖倒置：经 registry 反向查询，无静态边)
pot-odds ─┘         │
                    └── achievementRegistry / academyDataSourceRegistry
```

**违规边**：

| 边 | 位置 | 类型 | 守卫状态 |
|---|---|---|---|
| `progress → theory-academy` | `progress/persistWrapperProbe.test.ts:11,12,59` | 测试期静态+动态 import | eslint **已捕获（红）** |
| `shared → progress` | `shared/components/gate/SessionLimitGuard.tsx:16` | 运行时静态 import | **零守卫** |
| `i18n → strategy-academy` | `i18n/unitRef.test.ts:2,3` | 测试期静态 import | **零守卫** |

**环状结构**：`theory-academy → progress`（白名单内）+ `progress → theory-academy`（A1 违规）构成**测试层双向环**。修掉 A1 即消除。

---

## 修复优先级建议

按「投入产出比 × 阻塞程度」排序：

1. **A1**（30 分钟）：移动一个测试文件 → 解除 CI 部署阻塞。最高优先级，因为它是唯一正在**主动造成损害**的项。
2. **B2-1**（30 分钟）：pre-commit 接入 `pnpm lint`。防止 A1 复发，是 A1 的根因修复。
3. **B3-1**（5 分钟）：删除 `shared/utils/shareCard.ts` 死代码。零风险。
4. **A2**（2-4 小时）：建立渲染与注册的显式同步点 + 补时序测试。影响用户体验但间歇性，需在 A1 解除阻塞后处理。
5. **B1**（1-2 小时）：补 shared/i18n 分层守卫 + 重构 `SessionLimitGuard`。
6. **B2-2 / B3-3 / B4**（各 1 小时）：补守卫测试，把「约定」变成「执行面」。
7. **C1 / C3**（择期）：结构性改进，建议单独立项。

**共同主线**：本项目的架构约束**文档质量很高、执行面很薄**。AGENTS.md 把规则写得极细（白名单只删不加、shared ≥2 模块、幂等、归属登记），但除了 features 之间的 eslint 规则，其余全靠人工自觉。修复方向不是「加更多规则」，而是**给已有规则补上机器守卫** —— B2-2、B3-3、B4、A2-3 四条建议本质是同一件事。
