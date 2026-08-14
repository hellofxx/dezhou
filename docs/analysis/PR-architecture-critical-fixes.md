# refactor(architecture): 架构深度审查修复批次（Critical×3 + Important×5 全量销项）

## 背景

基于对全项目架构的深度审查（审查范围：10 个 feature 模块边界、shared 层准入、跨模块状态中枢、路由与代码分割、i18n 架构、质量保障、构建与性能），识别出 **3 项 Critical** 与 **5 项 Important** 问题。本 PR 按 P0→P1→P2 优先级分 **8 个独立逻辑单元提交**完成全量修复，严格遵循「外科式改动」原则与 `docs/legacy-issue-workflow.md` 两阶段流程。

## 量化成果

| 指标 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| 首屏 JS（未压缩） | ~4.5MB | 1.06MB | **-76%** |
| modulepreload chunks | 68 个 | 38 个 | **-44%** |
| IndexedDB >200 条挂死 | 必现 | 已消除 | **Critical 修复** |
| localStorage 写入量 | 全量 records 序列化 | partialize 排除 records | **-95%+** |
| shared 层违规文件 | 4 个 | 0 个 | **清零** |
| peer 依赖边（ESLint 白名单例外） | 1 个 | 0 个 | **清零** |
| records 存储上限 | 无 | IndexedDB + 1000 条自动裁剪 | **受控** |

## 提交清单（8 个逻辑单元）

| Commit | 任务 | 说明 |
|--------|------|------|
| `5fb12d9` | P0-01 | `fix(hand-history)`: IndexedDB 游标事务失效修复（setTimeout macrotask → await microtask） |
| `0b823af` | P0-02 | `perf(i18n)`: academy-course 去 eager glob + theory 移出 CORE_MODULES |
| `359f4bb` | P0-03 | `perf(bootstrap)`: 三学院 bootstrap 延迟加载 + progress barrel 瘦身 |
| `a82a9ab` | P1-01+02 | `refactor(shared)`: 单模块文件下沉 + trainingEvents 错误隔离 |
| `619cca3` | P2-03 | `feat(ci)`: 构建体积预算门禁（scripts/check-bundle-size.mjs + CI 集成） |
| `c3375b0` | P2-02 | `refactor(academy)`: 经 progress store 解除 puzzle-trainer peer 依赖 |
| `f62db9f` | P2-01A | `refactor(progress)`: records 外迁 IndexedDB + elo 双写退役（persist v13） |
| `805b810` | docs | `docs(changelog)`: 记录本批次版本演进 |

## 关键技术决策

1. **IndexedDB 事务生命周期**：批量游标读取分批让出必须用 microtask（`await Promise.resolve()`），macrotask（setTimeout）会导致事务在回调返回时 auto-commit，`cursor.continue()` 抛 `TransactionInactiveError` 且 Promise 永久 pending。
2. **i18n 懒加载边界**：academy-course 课程内容经 `preloadFeature('/academy/lesson/:lessonId')` 按需合并注入 `academy.lessonContent.*`；theory 经既有 FEATURE_GROUPS 机制加载，复用 `bindI18nStore: 'added removed'` 重渲染保证语言切换无闪烁。
3. **Zustand persist 陷阱规避**：`set(partial, second)` 第二参数是 replace 布尔值，异步 side-effect 必须用独立 IIFE；persist hydration 与 IndexedDB 迁移存在竞态，需 `hasHydrated` + `onFinishHydration` 双保险。
4. **persist version 链**：progress store v11 → v12（quickDrillBest 注入）→ v13（records 外迁 + elo 字段退役），每步均编写防御性 migrate 并同步 persist-shape 快照测试。
5. **模块归属对齐**：quickDrillBest 迁至 progress store，对齐 AGENTS.md「跨模块能力归属登记表」（QuickDrill owner 为 progress-dev）。

## 验证证据

- [x] 全部 8 个提交逐一通过 pre-commit hooks（typecheck + lint）
- [x] `pnpm verify` 全绿（82 files / 558 tests）
- [x] `pnpm build` 生产构建成功
- [x] `pnpm size:check` 体积门禁通过（1.06MB / 38 preload chunks）
- [x] i18n 双语键对称守卫（localeParity）未变红
- [x] ESLint 白名单变更已登记（删除 strategy-academy → puzzle-trainer 边，快照守卫同步）
- [x] persist schema 变更：version 递增（v12/v13）+ migrate 函数 + 快照测试同步

## 评审清单（按 AGENTS.md Feature PR Checklist）

- [x] 涉及跨模块引用的变更已登记 `eslint.config.js` ALLOWED_CROSS_IMPORTS（本批为收紧：只删不加）
- [x] 数据模型/持久化 schema 变更：persist version 已递增并编写 migrate
- [x] 文档采用「以代码为准」单源引用策略，无硬编码数值漂移
- [x] `docs/CHANGELOG.md` 已记录执行历史
- [x] 子智能体文档同步状态：本批未修改 `.claude/agents/*.md`（N/A：无 Key Files 结构性变化，shared 层文件移动属归属纠正，各模块 agent 文件描述仍有效；如评审认为需同步 progress-dev 的 recordDatabase.ts 登记，请指出）
- [x] tools 字段校验：N/A（无 agent 文件变更）

## 遗留事项（非阻塞，建议后续迭代）

1. ~~**8 处 `s.elo` 内存镜像读取点**（pot-odds / gto-simulator / range-trainer 等）待迁移至 `eloByVariant`，迁移完成后可整体移除 elo 内存兼容层（需跨模块协调）。~~ ✅ 已完成（2026-08-14，progress persist v14，详见 CHANGELOG「elo 兼容层退役收尾」）。
2. **P2-01 阶段 B/C**（progress store slices 拆分）已有详细设计文档，建议排入后续独立迭代周期。
3. 体积门禁严格版预算（1MB / 30 chunks）可在后续优化达成后收紧。
