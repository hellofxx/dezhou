# 架构决策记录（ADR）

> 状态：Current · 最后复核：2026-11-07
> ADR 记录「为什么这样设计」，不替代 PRD / TDD。状态：Proposed / Accepted / Superseded / Deprecated。

## 索引

| ADR | 决策 | 状态 |
|---|---|---|
| [ADR-0001](./0001-pure-frontend-local-first.md) | 纯前端、零后端、本地优先 | Accepted |
| [ADR-0002](./0002-feature-first-module-boundaries.md) | Feature-first + 单向跨模块边界 | Accepted |
| [ADR-0003](./0003-progress-single-hub.md) | progress store 单中枢，不拆分持久化写路径 | Accepted |
| [ADR-0004](./0004-sw-precache-and-retention.md) | Service Worker 全量预缓存与「当前 + 上一版」保留策略 | Accepted |

## 什么时候写 ADR

- 跨模块边界、持久化 schema、依赖选型、部署形态、安全与隐私等**难以回退**的决策。
- 取代旧决策时新增 ADR，并把旧 ADR 标为 `Superseded`，不直接改写历史。
- 一次性分析、评审与计划仍放 `docs/history/`；ADR 只保留最终决策与后果。

## 模板

```md
# ADR-XXXX: <决策标题>

- 状态：Proposed | Accepted | Superseded | Deprecated
- 日期：YYYY-MM-DD
- 取代 / 被取代：<ADR 链接，可选>

## Context
为什么需要做这个决策？约束是什么？

## Decision
我们决定做什么？

## Consequences
正面 / 负面后果、后续约束、需要同步的文档与门禁。

## References
PRD / TDD / 代码 / 守卫 / 历史评审。
```
