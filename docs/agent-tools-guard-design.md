# Agent Tools Requirements - Automation Guard Design Specification

## Overview

本规范定义如何通过自动化脚本扫描 `.claude/agents/*.md`的 `tools`字段，校验是否为预设集合，作为 PR 前的告警级检查（非门禁级）。虽非必要，但可减少疏忽性漂移。

---

## 预设工具集定义

### Feature-dev 标准集（10 项）

```typescript
const FEATURE_DEV_TOOLS = [
  'Read',
  'Glob',
  'Grep',
  'LSP',
  'GetProblems',
  'SearchReplace',
  'Write',
  'DeleteFile',
  'Bash',
  'GetTerminalOutput',
];
```

**适用模块**：所有 `src/features/<module>-dev.md`代理（9 个 feature 模块 + help-center/onboarding 两个特殊 feature）

**职责特征**：模块内全量变更 + 运行 tsc/pnpm verify，需全部工具权限。

---

### UI/UX-design Dev 精简集（9 项）

```typescript
const UI_UX_DEV_TOOLS = [
  'Read',
  'Glob',
  'Grep',
  'LSP',
  'GetProblems',
  'SearchReplace',
  'Write',
  'Bash',
  'GetTerminalOutput',
];
```

**缺少项**：`DeleteFile`（删除需求转交 platform-dev 协调）

**职责特征**：视觉一致性复核 + 全局样式编辑，无需删除文件权限。

---

### Platform-dev 全功能集（同 Feature-dev 标准集）

```typescript
const PLATFORM_DEV_TOOLS = [...FEATURE_DEV_TOOLS];
```

**职责特征**：跨模块集成 + 脚手架 + shared 层维护，需全部工具权限。

---

## 校验逻辑伪代码

```python
def validate_agent_tools(agent_file_path: str) -> list[str]:
    """
    校验单个子智能体文件的 tools 字段是否合规
    
    返回：警告列表（空列表表示合规）
    """
    warnings = []
    
    # 读取 frontmatter
    content = read_file(agent_file_path)
    frontmatter_match = extract_frontmatter(content)
    tools_list = parse_yaml_list(frontmatter_match['tools'])
    
    # 确定预期工具集
    module_name = Path(agent_file_path).stem  # e.g. "gto-simulator-dev"
    expected_set = get_expected_tools_for_module(module_name)
    
    # 校验 1：通配符禁止
    if any('*' in tool for tool in tools_list):
        warnings.append("错误：禁止使用通配符或省略声明（等同继承全部工具）")
    
    # 校验 2：精确匹配
    missing = set(expected_set) - set(tools_list)
    extra = set(tools_list) - set(expected_set)
    
    if missing:
        warnings.append(f"警告：缺少必需工具 {missing}")
    
    if extra:
        warnings.append(f"注意：包含非必需工具 {extra}（可能增加攻击面）")
    
    return warnings


def get_expected_tools_for_module(module_name: str) -> list[str]:
    if module_name.endswith('-dev'):
        base_module = module_name.replace('-dev', '')
        if base_module == 'ui-ux':
            return UI_UX_DEV_TOOLS
        else:
            return FEATURE_DEV_TOOLS
    elif module_name == 'platform-dev':
        return PLATFORM_DEV_TOOLS
    else:
        raise ValueError(f"未知模块类型：{module_name}")
```

---

## CI/CD 集成方案（可选）

### GitHub Actions 示例

```yaml
name: Agent Tools Validation
on:
  pull_request:
    paths:
      - '.claude/agents/*.md'
      - 'AGENTS.md'
jobs:
  agent-tools-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install vitest
        run: npm i -g vitest
      
      - name: Run agent-tools validator
        run: |
          npx ts-node scripts/validate-agent-tools.ts || exit 0
          echo "Agent tools validation passed (non-blocking)"
```

### 本地 Pre-commit Hook（推荐）

添加 `.pre-commit-config.yaml` 或 `scripts/pre-commit.sh`：

```bash
#!/bin/bash
# 仅当 agents 目录有变更时触发

if git diff --name-only $BRANCH | grep -q '\.claude/agents/'; then
  echo "⚠️ Detecting changes to agent files..."
  npx ts-node scripts/validate-agent-tools.ts
fi
```

---

## 告警分级策略

| 级别 | 场景 | 处理方式 |
|---|---|---|
| **错误** | tools 字段缺失 / 通配符 / 与预设集不一致（feature→缺少 DeleteFile 等） | 阻止合并（可配置为 warning） |
| **警告** | 包含非必需工具（如 gto-simulator-dev 声明了不必要的 Web Fetch） | 提示开发者评估 |
| **提示** | tools 字段顺序不符合统一规范（建议按 Qoder 最佳实践排序） | 忽略不计 |

---

## 实施路线图

### P0（立即执行）- 静态检查脚本

- 开发 `scripts/validate-agent-tools.ts`（TypeScript 实现上述伪代码）
- 作为 PR 模板中的"自测项"而非强制门禁
- 在 AGENTS.md / AI_GUIDE.md 中引用此脚本的使用方式

### P1（后续优化）- IDE 插件集成

- VSCode/IntelliJ 扩展：检测到 agents/*.md保存时实时校验
- 问题标记：红色下划线（错误）、黄色波浪线（警告）

### P2（长期愿景）- 动态守护

- Vitest 测试文件守卫：`agentToolsGuard.test.ts`
- PR 自动评论：GitHub Bot 在 PR 描述中追加 validation summary

---

## 参考资源

- Qoder 官方文档 → Subagent Best Practices
- 本项目 AGENTS.md 《工具权限分配》章节
- ESLint 白名单守卫（eslintCrossImports.test.ts）模式复制

---

**维护者**：Platform team  
**最后更新**：2026-08-06（一次性投入工程改进）
