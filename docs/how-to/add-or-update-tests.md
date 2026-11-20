# 新增或修改测试

> 状态：Current · 最后复核：2026-11-12
> 适用：新增 / 修改 unit、component 或 E2E 测试。规则源：`docs/testing/README.md`（§2 / §2.1 / §11）+ `src/guards/README.md`。

## 1. 选择测试项目

| 后缀 | 项目 | 环境 | 用途 |
|---|---|---|---|
| `.test.ts` | `unit` | Node | 纯函数、store、migrate、数据完整性 |
| `.test.tsx` | `component` | jsdom | 组件冒烟、交互、a11y |

禁止 `.spec.ts(x)` 与 `__tests__/`：`vitest.config.ts` 的双项目不会收集。测试文件与源码同目录放置。

E2E（L4）例外：Playwright 用例放仓库根 `e2e/`（同样 `*.test.ts`），由 `playwright.config.ts` 收集，不被 Vitest 收集。见 §5。

## 2. 按变更类型补测

- **纯函数 / utils**：边界值、空输入、确定性；表驱动优先。
- **store / persist**：必须有 `<store>.persist-shape.test.ts`；persist version > 1 还需 `<store>.migrate.test.ts`。Node 环境测 migrate 时 stub `window.localStorage`。
- **组件**：正常 / 空态 / 错误态；交互用 `@testing-library/react`；不要依赖真实网络或计时。
- **IndexedDB**：使用 `fake-indexeddb`，测试后清理数据库。
- **守卫**：见 `docs/how-to/add-a-guard.md`。

## 3. 编写约束

- 测试必须确定性、隔离、无网络；同一用例重复运行结果一致。
- 禁止 focused / skipped / todo / expected-failure 标记；`testSystem.guard.test.ts` 零容忍。
- 缺陷修复先写复现用例（修复前失败），再修到通过。
- 课程 / 题库 / 理论内容变更：完整性守卫、选项排序分布、EV 标定诚实性、zh/en 对齐同批通过。

## 4. 运行与验收

```powershell
pnpm test src/path/to/file.test.ts   # 单文件
pnpm test --project unit             # 仅 unit
pnpm test --project component        # 仅 component
pnpm test:guards                     # 全局守卫
pnpm verify                          # 完整门禁
```

- [ ] 后缀与目录正确，未被双项目漏收集
- [ ] persist store 的 shape / migrate 测试齐全
- [ ] 无 focused / skipped / todo
- [ ] 定向测试 + 全量 `pnpm verify` 通过

## 5. E2E（Playwright，L4）

只写「真实闭环 + 可观察断言」，跑的是**生产构建**而不是 dev server。

### 5.1 位置与配置

| 项 | 约定 |
|---|---|
| 用例 | `e2e/<场景>.test.ts`（配置 `testMatch: '**/*.test.ts'`，`testDir: './e2e'`） |
| 夹具 | `e2e/fixtures/*.ts`（不进收集面，避免「零用例」的伪文件） |
| 配置 | `playwright.config.ts`：`forbidOnly: true`、`retries: 0`、`trace: 'retain-on-failure'`、`screenshot: 'only-on-failure'` |
| 路径 | `baseURL` = `http://127.0.0.1:4173`，所有路径带 `/dezhou/` 前缀（vite `base`） |
| 类型 | `pnpm typecheck:e2e`（`tsconfig.e2e.json`，strict） |
| Lint | `pnpm exec eslint e2e playwright.config.ts` |

### 5.2 运行

```powershell
pnpm build                 # E2E 只跑生产构建；缺 dist 时 test:e2e 直接报错
pnpm exec playwright install chromium   # 首次（CI 用 --with-deps）
pnpm test:e2e              # = playwright test
pnpm verify:e2e            # verify → build → size:check → test:e2e
```

### 5.3 编写约束

- **走真实 UI**：真实引导（跳过引导按钮）、真实导航、真实答题；禁止直写 `localStorage` / IndexedDB、禁止调试解锁旁路（`testSystem.guard.test.ts` 的 E2E 段会红）。
- **不断言随机结果**：随机题目的对错不预设；用键盘 1/2/3 + Space 推进，断言题号推进与结果页真实题量。
- **断言真实契约**：真实标题 / 文案 / 题量 / 刷新后数据仍在；禁止「页面存在即通过」。
- **失败即证据**：禁止 `.only` / `.skip` / `.fixme` / `test.fail`，禁止调高 retries 变绿。
- **零噪声**：console error / pageerror / 失败请求 / 4xx-5xx 默认失败；确属场景注入的期望错误必须精确登记（`e2e/fixtures/browserErrors.ts`），禁止用宽泛正则一次性放行。
- **离线用例**：等 `navigator.serviceWorker.ready`（预缓存完成）→ 正常重载取得控制 → `context.setOffline(true)`；不得调用 `skipWaiting` / clients.claim，不得为首测改 SW 生命周期。

### 5.4 验收

- [ ] `pnpm typecheck:e2e` / `pnpm exec eslint e2e playwright.config.ts` exit 0
- [ ] `pnpm build && pnpm test:e2e` 真实跑通（新用例先红后绿，缺陷附回归锁）
- [ ] 未放宽断言、未 skip / only、未提高 retries
