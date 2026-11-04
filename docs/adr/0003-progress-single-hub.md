# ADR-0003: progress store 单中枢，不拆分持久化写路径

- 状态：Accepted
- 日期：2026-11-04

## Context

`src/features/progress/store.ts` 同时承载 Streak / ELO / SRS / Emotion / Mentor 五大系统、QuickDrill 状态、训练记录索引与成就判定。历史上曾讨论按行数拆分该 store；但它同时是多个模块的写入汇合点，拆分持久化写路径会引入跨 store 一致性与迁移风险。

## Decision

- 保留单个 progress persist store 作为跨模块状态中枢；允许拆分 selector、hook、纯函数与展示组件，但**不拆分持久化写路径**。
- 任何持久化 schema 变更必须递增 `version` + 编写 `migrate`，并更新 `store.persist-shape.test.ts` / `store.migrate.test.ts`。
- 行数守卫将 `progress/store.ts` 登记为长期豁免（而非「Phase 2 拆分待执行」）；文件继续增长仍受 `maxLines` 棘轮约束。
- 若未来确需拆分 store，必须新增 ADR 取代本决策，并给出跨 store 一致性、迁移与回滚方案。

## Consequences

- 单文件较大，但一致性优先于行数；代码评审应关注写入路径是否仍唯一。
- 新增跨模块状态必须经 progress 公开 API，不得在 feature store 中复制。
- 「不拆分」是显式决策，不再与历史补救计划中的「待拆分」表述冲突。

## References

- `AGENTS.md` — 跨模块状态集中管理
- `docs/AI_GUIDE.md` — 状态管理与 persist version 规则
- `src/guards/line-count-guard.test.ts` — 长期豁免登记
- `docs/history/architecture/remediation-plan-2026-09.md` — 历史讨论
