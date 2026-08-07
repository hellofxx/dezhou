---
name: improve-agents-guide
overview: 鉴于根目录已存在一份非常详尽的 AGENTS.md，按指引不新建 CODEBUDDY.md，而是为现有 AGENTS.md 提出针对性改进建议，使其更好地服务于 CodeBuddy 实例在本仓库内的操作。
design:
  styleKeywords:
    - 文档
    - Markdown
  fontSystem:
    fontFamily: Noto-Sans
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 18px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#1F2937"
    background:
      - "#FFFFFF"
    text:
      - "#111827"
    functional:
      - "#111827"
      - "#FFFFFF"
todos:
  - id: verify-repowiki-structure
    content: 使用 [subagent:code-explorer] 核实 .qoder/repowiki/zh/content/ 与 knowledge/zh/ 的目录清单，确认与开发相关的映射（架构设计/样式系统/开发指南/数据存储/共享组件库及各 feature 模块目录）
    status: completed
  - id: add-repowiki-guide
    content: 在 AGENTS.md 项目概述后新增"知识库（repowiki）"章节，指引 CodeBuddy 何时及如何查阅 .qoder/repowiki 深度知识
    status: completed
    dependencies:
      - verify-repowiki-structure
  - id: add-architecture-notes
    content: 增强 AGENTS.md 的共享层与质量门禁小节，补充 shared/components 子目录划分、ALLOWED_CROSS_IMPORTS、vite manualChunks、Service Worker 缓存等需跨文件理解的架构要点
    status: completed
  - id: review-doc-consistency
    content: 复核 AGENTS.md 改动：遵循单点事实源、不硬编码数值、中文表述与既有章节风格一致，运行 pnpm verify 确认仓库健康
    status: completed
    dependencies:
      - add-repowiki-guide
      - add-architecture-notes
---

## 需求概述

用户要求 AI 助手深入理解项目全貌（repowiki、PRD/TDD、agent 配置），并交付一份供 CodeBuddy 未来实例在该仓库工作的指导文件。

## 关键判断

根据系统指令的使用说明：**当前目录已存在 `AGENTS.md`，因此不新建 `CODEBUDDY.md`，而是对现有 `AGENTS.md` 提出改进建议**。

现有 `AGENTS.md` 已极其详尽，覆盖环境命令、Feature-First 模块化架构、跨模块系统、质量门禁、文档维护、Agent 协作等。经探索发现的主要缺口：

1. **`.qoder/repowiki/` 知识库未被引用**——该目录下 `zh/content/` 有 233 个 md（架构设计/47、样式系统/24、手牌历史/27、策略学院/25、GTO模拟器/17、谜题训练/17 等），`knowledge/zh/` 有 43 个文件。这是对 CodeBuddy 极有价值但当前对 AI 不可见的深度知识资源。
2. **部分"需跨多文件理解"的架构要点较薄弱**：shared/components 的 business/feedback/ui 子目录划分、eslint 模块隔离 ALLOWED_CROSS_IMPORTS、vite manualChunks 分包、Service Worker 离线与版本缓存。
3. **repowiki 中 `开发指南/`（含测试指南、调试工具、开发工作流）、`数据存储/`（IndexedDB/LocalStorage/Zustand 迁移）等内容**与 CodeBuddy 开发高度相关，宜纳入指引。

改进遵循 AGENTS.md 既有风格：保持"以代码为唯一事实源"、避免硬编码数值、以"增强指引"而非"重构"方式补充。

## 技术方案

### 实现策略

在不改动 AGENTS.md 既有章节结构的前提下，以"增量增强"方式补充三块内容，使 CodeBuddy 实例能利用既有 repowiki 知识库并更快理解需跨文件阅读的架构要点。

### 修改目标

仅修改根目录 `AGENTS.md` 一个文件（不新建 CODEBUDDY.md）。

### 增强内容设计

**1. 顶部知识库指引（新增小节，置于"项目概述"后）**

- 新增 `## 知识库（repowiki）` 章节，说明 `.qoder/repowiki/` 为 CodeBuddy 深度知识来源，列出 `zh/content/` 下与开发强相关的目录映射（架构设计、样式系统、开发指南、数据存储、共享组件库及各 feature 模块目录）。
- 指引何时查阅：任务涉及模块内部细节 / 设计系统 / 数据持久化 / 测试指南时，优先查阅对应 repowiki 目录而非从零探索。
- 遵循单点事实源：标注 repowiki 内容可能随代码演进滞后，实际代码仍为唯一事实源；目录清单采用"以 `.qoder/repowiki/zh/content/` 实际内容为准"的动态引用，不硬编码数值。

**2. 补充"需跨多文件理解"的架构要点（增强既有"代码组织/共享层"与"质量门禁"小节）**

- shared/components 的子目录结构：`business/`（业务组件）、`feedback/`（LoadingState/EmptyState 等）、`ui/`（shadcn 基础组件），以目录实际内容为准。
- eslint.config.js 的 `ALLOWED_CROSS_IMPORTS` 为模块隔离允许边清单的唯一事实源（收紧时只删不加）。
- vite.config.ts 的 manualChunks 分包策略（大型数据文件与 vendor 库分离）。
- Service Worker（sw.js?v=APP_VERSION）离线缓存与版本清理机制。

**3. 命令细节微调（按需）**

- AGENTS.md 已覆盖大部分命令；仅确认补充 `node scripts/validate-agent-tools.ts`（修改 `.claude/agents/*.md` 时可选校验，AGENTS.md 已提及，无需重复）。
- 不新增冗余命令清单。

### 约束与验证

- 遵循 AGENTS.md 既有单点事实源风格，新增内容不硬编码数值/版本号，指向代码与 repowiki 实际路径。
- 文档改动不影响构建与测试，但修改后建议运行 `pnpm verify` 确认仓库仍健康（文档层面无需通过，仅作完整性确认）。
- 保持"Surgical Changes"，不重写既有章节、不改动任何源码。

本任务为文档增强（修改现有 AGENTS.md 指导文件），不涉及新建或改造 UI，因此不输出设计系统方案。仅需遵循 AGENTS.md 既有的 Markdown 排版规范（表格、代码块、章节层级），保持中文表述与"单点事实源"引用风格一致。

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 在计划执行阶段，用于核实 repowiki 各目录的实际内容（如 `zh/content/架构设计`、`开发指南/测试指南.md`、`数据存储/` 的文件清单），确保 AGENTS.md 中新增的知识库指引目录映射与实际目录一致，避免引用不存在的路径。
- Expected outcome: 确认 AGENTS.md 新增"知识库（repowiki）"章节所列目录映射全部真实存在且可访问，避免产生虚假引用。