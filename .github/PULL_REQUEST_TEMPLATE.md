# Pull Request

## 变更摘要

- 关联 Issue：
- 类型：feat / fix / refactor / test / docs / chore

### What changed

<!-- 简述核心变更 -->

### Why change

<!-- 业务问题或技术动机 -->

### How it works

<!-- 关键实现、边界与取舍；复杂逻辑附伪代码或图 -->

## 验证

- [ ] `pnpm verify` 通过（typecheck → lint → repo:check → docs:check → agents:map:check → test）
- [ ] 涉及构建/发布：`pnpm build` + `pnpm size:check` 通过
- [ ] 涉及路由/布局/持久化/离线：`pnpm verify:e2e` 已在真实浏览器通过
- [ ] 缺陷修复附回归测试；新增/修改测试按 `docs/TDD.md` §18「测试体系」选后缀
- [ ] persist schema 变更：已递增 version + 编写 migrate，并补齐 `store.persist-shape.test.ts` / `store.migrate.test.ts`

## 所有权与边界

- [ ] 写域限于目标模块及其双语 locale，未越界修改其他模块
- [ ] 跨模块 import 已登记 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS`
- [ ] progress 只经公共入口（`api` / `ui` / 只读快照），未深引 store / components / utils / types / data
- [ ] 新增 shared 代码满足 ≥2 模块准入，且未引入 feature 依赖

## 文档与内容

- [ ] 行为/架构变更已同步 PRD / TDD / DESIGN / AGENTS 中对应事实源
- [ ] 新增/修改文档有状态与最后复核日期，`pnpm docs:check` 通过
- [ ] 路由/模块/i18n 注册表变更已运行 `pnpm agents:map`
- [ ] 课程/题库变更通过内容守卫；zh/en 内容同批更新
- [ ] 发布相关变更已登记 `docs/CHANGELOG.md`

## UI/UX（如涉及）

- [ ] 使用 token 与共享 ui 基础件，无硬编码颜色与裸交互控件
- [ ] 已在浏览器验证正常/空/错误/加载状态与移动端断点
- [ ] WCAG 2.1 AA：对比度、焦点、键盘、触摸目标 ≥44px

## 截图 / 录屏（如涉及界面变更）

<!-- 附前后对比；纯逻辑修复可省略 -->

## 风险与回滚

- 风险：
- 回滚：