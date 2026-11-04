# 历史文档索引

> 状态：Historical。本目录保存已完成、已取代或一次性使用的评审、计划与诊断报告。
> 这些文档不随代码维护，不作为决策依据；当前事实以 `docs/README.md` 的 Current 文档与 `src/` 代码为准。
> 归档记录同步到 `docs/CHANGELOG.md`；更早版本可从 git 历史追溯。

## 归档清单

| 文档 | 原用途 | 归档日期 | 备注 |
|---|---|---|---|
| [`reports/agent-orchestration-optimization-2026-08-10.md`](./reports/agent-orchestration-optimization-2026-08-10.md) | 多智能体编排优化分析 | 2026-11-04 | 高 ROI 建议已落地；现行规范见 `AGENTS.md` |
| [`reports/design-optimization-plan-2026-08-17.md`](./reports/design-optimization-plan-2026-08-17.md) | 设计优化计划 v1.0 | 2026-11-04 | 已由 `DESIGN.md` 与 UI/UX Phase 2 取代 |
| [`reports/legacy-issue-workflow.md`](./reports/legacy-issue-workflow.md) | 遗留问题处理流程 | 2026-11-04 | 未纳入当前工作流 |
| [`reports/agent-file-standardization.md`](./reports/agent-file-standardization.md) | 子智能体文件标准化规范 | 2026-11-04 | 现行规则见 `AGENTS.md` §Agent 协作；模板见 `docs/agents/TEMPLATE-dev.md` |
| [`architecture/architecture-review-2026-08-30.md`](./architecture/architecture-review-2026-08-30.md) | R1–R11 架构评审 | 2026-11-04 | 由模块边界评审取代 |
| [`architecture/module-boundary-review-2026-09-21.md`](./architecture/module-boundary-review-2026-09-21.md) | 模块边界与依赖审查 | 2026-11-04 | A1/A2 等 P0 已修复 |
| [`architecture/module-boundary-violations-2026-09-21.csv`](./architecture/module-boundary-violations-2026-09-21.csv) | 上述评审的机器可读违规清单 | 2026-11-04 | 仅作证据快照 |
| [`architecture/remediation-plan-2026-09.md`](./architecture/remediation-plan-2026-09.md) | 补救切片 S1–S13 | 2026-11-04 | 部分已执行；不拆 progress/store 的决策仍有效 |
| [`architecture/risk-map-2026-08-30.dot`](./architecture/risk-map-2026-08-30.dot) | 风险簇与影响路径图 | 2026-11-04 | 与 architecture-review 配套 |
| [`architecture/ui-ux-phase2-plan-2026-11.md`](./architecture/ui-ux-phase2-plan-2026-11.md) | UI/UX Phase 2 计划与执行记录 | 2026-11-04 | 已实施；当前设计契约见 `DESIGN.md` |
| [`design/agent-tools-guard.md`](./design/agent-tools-guard.md) | Agent Tools Guard 设计规格 | 2026-11-04 | 已由 `scripts/validate-agent-tools.ts` 实现 |
| [`ops/github-actions-diagnosis-2026-09-24.md`](./ops/github-actions-diagnosis-2026-09-24.md) | GitHub Actions 部署失败诊断 | 2026-11-04 | 当前流程见 `docs/ops/DEPLOY_CHECKLIST.md` |

## 已删除的重复文档

- `docs/agents/behavior.md`：与 `AGENTS.md` §行为准则重复。摘要保留在 `AGENTS.md`，全文可从 git 历史追溯。
