# ADR-0001: 纯前端、零后端、本地优先

- 状态：Accepted
- 日期：2026-11-04

## Context

PokerLab 是单人、长期使用的德州扑克训练工具，部署在 GitHub Pages 的 `/dezhou/` 子路径。核心价值是离线可用的训练与复盘，而不是账号、社交或多端同步；引入后端会带来运维、认证、隐私与成本负担，并破坏「打开即训练」的体验。

## Decision

- 不引入后端、数据库、认证或云同步；所有运行时逻辑在浏览器完成。
- 进度与偏好保存在 `localStorage`（zustand persist），牌局大数据保存在 IndexedDB。
- 通过 Service Worker 缓存静态资源，支持离线访问；构建产物是唯一交付物。
- 排行榜保持本地虚构角色 + 演示说明，真实排行榜后端不在当前范围。

## Consequences

- 无账号、无跨设备同步；用户数据只存在当前浏览器，清缓存会丢失本地进度（需通过导出/备份与 persist 错误可见化降低风险）。
- 所有功能必须离线可用，不能依赖服务端定时任务或远程配置。
- 首屏体积与缓存策略成为主要性能约束；新增依赖必须评估 bundle 影响。
- 若未来引入后端或云同步，必须新增 ADR 取代本决策，并同步 PRD / TDD / 部署文档。

## References

- `docs/PRD.md` — 产品定位与范围
- `docs/TDD.md` — 持久化与离线设计
- `docs/architecture/business-architecture.md` — 系统边界
- `README.md` — 部署形态
