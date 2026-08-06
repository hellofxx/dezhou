# Pull Request 使用指南

## 📌 何时使用此模板

- **所有**Pull Request（PR）都必须使用此模板
- 即使是文档更新、小修复也要勾选对应 Checkpoints

## ✅ PR Checklist 解读

### Agent 协作规范章节

这是本项目特有的要求，用于确保 AI 代理体系的文档同步：

#### 场景 1：修改单个 feature 模块

如果你只改了 `src/features/range-trainer/`的代码：

```markdown
- [ ] 对应子智能体文件 `.claude/agents/range-trainer-dev.md`已同步更新
  - Key Files 章节与实际目录结构一致
  - Cross-Module Touchpoints 已刷新
  - Workflows 补充新增操作流程
- [ ] tools 字段合规（运行`node scripts/validate-agent-tools.ts`校验通过）
```

**操作步骤**：
1. 打开 `.claude/agents/range-trainer-dev.md`
2. 对比 `src/features/range-trainer/`的实际目录
3. 如有新增文件，在 Key Files 补充（如 utils/new-feature.ts）
4. 删除废弃文件引用（如有）
5. 运行`node scripts/validate-agent-tools.ts`确认 tools 声明未变红

#### 场景 2：涉及跨模块依赖

如果你改的模块需要引入其他 module 的功能：

```markdown
- [ ] 已在 platform-dev 评估影响范围
- [ ] `eslint.config.js`的 `ALLOWED_CROSS_IMPORTS`已登记（如需）
- [ ] progress store persist version 已递增并编写 migrate（如需）
- [ ] AGENTS.md/TDD.md已同步更新架构说明（如需）
```

**判断规则**：
- **直接 import** 其他 `features/<module>/` → 需登记 ESLint 白名单
- **持久化 schema 变更** → 需 bump persist version + migrate
- **架构设计变化** → 需更新 TDD.md

#### 场景 3：添加全新 feature 模块

如果项目要扩展新模块（如 `src/features/school-exam/`）：

```markdown
- [ ] 同名代理文件在同一逻辑单元内创建（1:1 绑定）
- [ ] `src/features/school-exam/` 结构符合最小约定
- [ ] `docs/PRD.md`产品规格已更新（如为正式需求）
- [ ] `docs/CHANGELOG.md`执行历史已登记
```

**强制要求**：
- feature 目录与 `.claude/agents/school-exam-dev.md` 必须**同时 commit**
- 保持 `.claude/agents/*.md`文件名与 frontmatter name 完全一致

---

## 🔧 快速自检流程

### Git Hooks 自动检测

启用 Hooks 后，提交时自动触发：

```powershell
git add .claude/agents/*
git commit
# ↓
🔍 Running agent tools validation...
✅ Validation PASSED
```

### 手动完整验证

PR 合并前必做：

```powershell
# 1. 代码门禁
pnpm verify

# 2. Agent tools 校验（仅当 agents 变更时）
node scripts/validate-agent-tools.ts

# 3. 子智能体文档同步检查
# 手动对照：src/features/<module>/ ←→ .claude/agents/<module>-dev.md
```

---

## 📎 示例 PR 标题格式

| 场景 | 推荐格式 |
|---|---|
| 功能开发 | `feat(range-trainer): 添加 4-BB 位置解锁逻辑` |
| Bug 修复 | `fix(gto-simulator): Web Worker fallback 异常` |
| 文档更新 | `docs(AI_GUIDE): 补充 Zustand 行数豁免说明` |
| Agent 维护 | `docs(agents): gtoWorker 实证归属修正` |

---

## 💡 Tips

1. **不要堆砌 Checkbox**：每个`[x]`都应真实完成，非必填项可不勾但需注释"N/A：无相关变更"
2. **截图必要性**：界面改动必须有前后对比图；纯逻辑修复可省略
3. **技术实现说明**：复杂算法/重构建议附架构图或伪代码

---

**维护者备注**：

- 此模板基于 `AGENTS.md` 《Feature PR Checklist》章节设计
- 定期审查 PR Checklist 覆盖率，持续优化条目
- 新成员首次开 PR 建议配对 Review（参考 AGENTs.md《Agent 协作》）
