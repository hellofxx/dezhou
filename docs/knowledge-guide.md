# 项目知识库使用指南

本文档详细说明如何使用 Qoder Knowledge Engine 管理和利用项目知识库。

## 📚 一、Qoder 平台自动化（推荐）

### 1.1 知识库位置与结构

```
.qoder/repowiki/
├── knowledge/          # Knowledge Card 知识卡片
│   └── zh/
│       ├── 前端错误处理体系：ErrorBoundary + Toast + 解析器抛错/
│       ├── PokerLab 德州扑克训练平台根工程/
│       └── ...
├── zh/                 # Repo Wiki 结构化文档
│   └── content/
│       ├── 项目概述/
│       ├── 范围训练器模块/
│       ├── 策略学院模块/
│       └── ...
└── meta/
    └── repowiki-metadata.json
```

### 1.2 Qoder 命令速查

#### `/knowledge` - 知识库管理主命令

**功能**：生成、修改、补充、重写项目知识库

**使用场景**：
- 首次打开项目时一键生成知识库
- 代码变更后检测并更新过时内容
- 手动触发特定模块的知识卡片更新

**典型用法**：
```markdown
/knowledge update strategy-academy
# → 仅更新策略学院模块的知识库

/knowledge full-refresh
# → 全量重新生成整个项目知识库
```

#### `/knowledge-plan` - 预生成配置

**功能**：编辑 `wiki_plan.yaml` 控制知识库生成策略

**配置示例**（`.qoder/repowiki/wiki_plan.yaml`）：
```yaml
modules:
  include:
    - range-trainer
    - strategy-academy
    - pot-odds
    # ... 只生成核心模块
  exclude:
    - help-center    # 纯静态模块，可跳过
    - onboarding     # 简单模块，可跳过

templates:
  default: module-comprehensive
  custom-templates:
    - cross-module-summary
```

#### `/init` - 初始化项目指令

**功能**：在项目根目录分析并生成初始 `AGENTS.md`

**执行方式**：
```powershell
/init
# → 自动扫描代码结构
# → 识别模块边界
# → 生成初步的 AGENTS.md 草案
# → 同步生成对应的知识库基础结构
```

### 1.3 工作流程示例

#### 场景 1：新增 feature 模块后的知识库更新

```markdown
# 开发者操作流程
1. 完成 src/features/new-module/ 的开发
2. 运行 pnpm verify 验证无错误
3. 在 Qoder 中输入：/knowledge update new-module
4. 等待 Auto-generated knowledge card 完成生成
5. 检查生成的知识库是否与代码一致
6. Commit 代码变更时同步 Commit .qoder/repowiki/ 目录
```

#### 场景 2：代码重构后的知识库同步

```markdown
# 重构后同步流程
1. 完成类型定义修改（types.ts / store.ts 等）
2. 在 Qoder 中查询该模块："查看新模块的架构"
3. Qoder 自动检索 .qoder/repowiki/ 发现版本不匹配
4. 提示用户触发 `/knowledge incremental`
5. 增量更新仅涉及变更部分，速度快
```

### 1.4 最佳实践

| 时机 | 操作 | 说明 |
|------|------|-----|
| **每日开发** | 无需手动干预 | Agent 会自动加载相关上下文 |
| **模块重大变更** | `/knowledge update <module>` | 确保知识库与代码一致 |
| **每周例行** | `/knowledge health-check` | 运行 Better Harness 评估 |
| **每月清理** | `/knowledge prune` | 删除过期知识条目 |

---

## 🔧 二、通用环境替代方案（可选）

如在使用非 Qoder 的 AI 开发工具，可参考以下手工方案。

### 2.1 轻量级知识库结构

```markdown
docs/knowledge/
├── cross-module.md           # 跨模块交互矩阵（ALLOWED_CROSS_IMPORTS）
├── architecture-overview.md   # 系统架构图与模块关系
└── modules/                  # 每个 feature 模块对应一个文件
    ├── range-trainer.md
    ├── strategy-academy.md
    ├── pot-odds.md
    ├── gto-simulator.md
    ├── hand-history.md
    ├── progress.md
    ├── puzzle-trainer.md
    ├── theory-academy.md
    ├── onboarding.md
    └── help-center.md
```

### 2.2 模块知识卡片模板

```markdown
# <Module Name> 模块知识库

## 模块职责
<一句话概括核心功能和业务价值>

## 核心文件清单
- `types.ts`: <主要类型定义>
- `store.ts`: <状态管理，persist version: X>
- `components/<component>.tsx`: <关键 UI 组件>
- `utils/<util>.ts`: <核心工具函数>
- `data/<data>.ts`: <静态数据源>

## 外部依赖（只读消费）
- ✅ `shared/types/poker.ts`: 扑克基础类型
- ✅ `shared/stores/trainingEvents.ts`: 事件总线 emit
- ❌ 其他 feature 模块：禁止直接引用

## 跨模块交互点
- **progress store**: 
  - ELO（preflop 维度）+ SRS + Emotion + Streak
  - 调用方式：通过 useQuizEngine 记录器
- **trainingEvents**: 
  - emit 时机：会话完成时
  - 数据结构：`{ module: '<name>', mode: '<mode>', result, createdAt }`

## 重要约束
- **模块隔离**：禁止 import 其他 features/
- **单文件限制**：≤300 行
- **选项排序**：必须经过 quizOrder.ts 出口处理
- **i18n 双语**：zh.json 和 en.json 必须同步更新
```

### 2.3 手工维护流程

```powershell
# 伪代码脚本：模块变更后知识库更新
Step 1: git diff src/features/<module>/

Step 2: 判断变更类型并更新知识卡片
type src\features\<module>\types.ts | Select-String "export" → 更新"类型定义"部分

Step 3: 运行验证
pnpm verify

Step 4: Commit
git commit -m "feat(<module>): update knowledge card" --include="docs/knowledge/modules/<module>.md"
```

---

## 🎯 三、子代理文件规范

### 3.1 禁止复制知识库内容

**错误做法**：
```markdown
# ❌ 不应在 agent 文件中写入
- **对手形象系统**：TAG / LAG / NIT / Calling Station / Maniac / Unknown 六类，VPIP / PFR / AF 等统计可视化
```

**正确做法**：
```markdown
# ✅ 应改为行为指导
- **对手形象系统开发**：六类对手数据与统计可视化（分类详见模块知识卡片）
```

### 3.2 引用权威源原则

所有**事实性信息**（数值、枚举、算法公式、类名列表）应遵循：
- ✅ 引用代码：`以 <file.ts> 为唯一事实源`
- ✅ 引用专用文档：`详见 docs/<doc-name>.md`
- ✅ 引用 Qoder 自动知识：`详见 .qoder/repowiki/`
- ❌ **禁止**在本文件中硬编码副本

---

## 📊 四、知识库质量门禁

### 4.1 一致性检查清单

每次 PR 提交前，确保：

- [ ] `.qoder/repowiki/` 目录已通过 `/knowledge` 命令更新至最新
- [ ] 模块知识卡片中的 Key Files 列表与实际代码一致
- [ ] Cross-Module Touchpoints 已补充新交互点
- [ ] ESLint ALLOWED_CROSS_IMPORTS 已登记新增引用
- [ ] Store persist version 升级已同步知识卡片

### 4.2 Better Harness 评估

定期运行 `/better-harness` 命令，检查五维评分：

1. **任务理解** - Agent 对需求背景的把握准确度
2. **受控执行** - 变更范围是否最小化
3. **变更验证** - 测试覆盖率和质量门禁
4. **可靠交付** - 代码质量与文档完备性
5. **学习捕获** - 知识库是否及时更新

---

## 🔍 五、FAQ

### Q1: 如何知道哪些模块需要生成知识库？

**A**: 所有 `src/features/*/` 下的模块都应自动生成，排除纯静态模块（如 help-center）。

### Q2: 代码变更后未触发知识库更新怎么办？

**A**: 手动运行 `/knowledge update <module-name>` 强制更新。

### Q3: Qoder 不在运行时，能否使用知识库？

**A**: 
- **推荐**：优先使用 Qoder 平台自带自动化
- **备选**：本指南第二节提供的手工方案可作为临时替代

### Q4: 如何在 VSCode Copilot 中使用知识库？

**A**: 在 `.claude.md` 中添加如下配置：

```markdown
## Reference Knowledge
When developing any module, consult:
- AGENTS.md (global constraints)
- docs/knowledge/modules/<module>.md (module details)
- src/features/<module>/index.ts (public API)
```

---

## 📝 附录

### A. 相关文件索引

| 文件 | 用途 | 维护者 |
|------|------|--------|
| `.qoder/repowiki/` | 自动生成的知识库 | Qoder 引擎 |
| `.claude/agents/*.md` | 子智能体行为约束 | 开发者 |
| `docs/PRD.md` | 产品规格 | PM / Tech Lead |
| `docs/TDD.md` | 技术设计 | Tech Lead |
| `AGENTS.md` | 项目顶层指令 | Tech Lead |
| `eslint.config.js` | 跨模块白名单 | Tech Lead |

### B. 参考资料

- **Qoder 官方文档**：https://docs.qoder.com/user-guide/knowledge-engine/overview
- **Better Harness 介绍**：https://docs.qoder.com/user-guide/knowledge-engine/better-harness
- **Repo Wiki 使用指南**：https://docs.qoder.com/user-guide/repo-wiki

---

**最后更新时间**：2026-08-07  
**适用版本**：Qoder Platform vLatest | 本项目 vX.X
