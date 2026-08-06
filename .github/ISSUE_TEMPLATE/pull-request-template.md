# Pull Request Template

## 🎯 相关 Issue（可选）

- Fixes #<issue-number>

## 📝 PR 类型

- [ ] ✨ New feature (新功能)
- [ ] 🐛 Bug fix (修复 bug)
- [ ] 🔥 Performance optimization (性能优化)
- [ ] 📝 Documentation update (文档更新)
- [ ] 🧪 Test update (测试更新)
- [ ] 🤖 Agent/Docs maintenance (子智能体/文档维护)

## ✅ PR Checklist（必须全部勾选）

### 代码质量

- [ ] `pnpm typecheck` 通过（无类型错误）
- [ ] `pnpm lint` 通过（无 ESLint 警告）
- [ ] `pnpm test` 通过（所有单元测试）
- [ ] `pnpm verify` 通过（完整门禁：typecheck + lint + test）
- [ ] 单文件 ≤ 300 行（已豁免项见 AGENTS.md）

### 功能正确性

- [ ] 新/修改的功能已编写对应测试
- [ ] 边界条件已处理（null/undefined/空数组等）
- [ ] i18n key 同步 zh.json 与 en.json（新增键名）
- [ ] 中文文案符合品牌调性（参考 DESIGN_LANGUAGE.md）

### Agent 协作规范

#### 如果修改了 feature 模块：

- [ ] 对应子智能体文件 `.claude/agents/<module>-dev.md`已同步更新
  - Key Files 章节与实际目录结构一致
  - Cross-Module Touchpoints 已刷新
  - Workflows 补充新增操作流程
- [ ] tools 字段合规（运行`node scripts/validate-agent-tools.ts`校验通过）
- [ ] 未越界修改其他 module 的业务逻辑

#### 如果涉及跨模块变更：

- [ ] 已在 platform-dev 评估影响范围
- [ ] `eslint.config.js`的 `ALLOWED_CROSS_IMPORTS`已登记（如需）
- [ ] progress store persist version 已递增并编写 migrate（如需）
- [ ] AGENTS.md/TDD.md已同步更新架构说明（如需）

#### 如果添加新的 feature 模块：

- [ ] 同名代理文件在同一逻辑单元内创建（1:1 绑定）
- [ ] `src/features/<module>/` 结构符合最小约定
- [ ] `docs/PRD.md`产品规格已更新（如为正式需求）
- [ ] `docs/CHANGELOG.md`执行历史已登记

### UI/UX 规范（如涉及页面改造）

- [ ] 使用 CSS 变量而非硬编码 hex（globals.css 唯一权威）
- [ ] WCAG 2.1 AA 对比度达标（4.5:1 文本 / 3:1 大文本）
- [ ] 触摸目标 ≥ 44×44px（移动端）
- [ ] 反霓虹硬约束已通过（designTokenGuard.test.ts守卫）
- [ ] ui-ux-dev已复核视觉一致性（重大 UI 变更时）

### 国际化

- [ ] 所有用户可见文案走 i18n（`t()`函数）
- [ ] i18n key 命名 `<module>.<context>.<field>`格式
- [ ] zh/en 双语键集对称（localeParity.test.ts验证）

### 测试覆盖

- [ ] 新增测试文件放在原模块同级目录
- [ ] 纯逻辑工具函数用 `.test.ts`（unit 项目）
- [ ] 组件冒烟用 `.test.tsx`（component 项目）
- [ ] Vitest 双项目划分明确

## 🔄 变更摘要

### What changed?

<!-- 简述本次 PR 的核心变更 -->

### Why change?

<!-- 说明变更原因或解决的业务问题 -->

### How it works?

<!-- 关键技术实现说明（如需要复杂逻辑解释） -->

## 📸 截图/录屏（如界面变更）

<!-- 附前后对比图或交互演示 -->

---

**开发者注意**：

- **提交粒度**：按"单一逻辑单元独立提交"原则拆分
- **Commit Message**：遵循 `type(scope): description`格式（scope 为模块名如 strategy-academy）
- **PR 标题**：使用英文或中英双语，清晰表达变更内容
