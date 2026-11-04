# 贡献者操作指南（How-to）

> 状态：Current · 最后复核：2026-11-04
> 面向人类与 AI 的短操作指南。规则源仍是 `AGENTS.md` / `docs/AI_GUIDE.md` / `docs/testing/README.md`；本目录只给步骤与出口。

## 指南

| 指南 | 适用场景 |
|---|---|
| [`add-a-feature-module.md`](./add-a-feature-module.md) | 新增一个 `src/features/<module>/` 业务模块 |
| [`add-a-guard.md`](./add-a-guard.md) | 新增全局 / 模块级不变式守卫测试 |
| [`add-or-update-tests.md`](./add-or-update-tests.md) | 新增或修改 unit / component 测试 |

## 通用出口

```powershell
pnpm docs:check   # 文档链接 / 索引 / 状态
pnpm verify       # typecheck → lint → repo:check → docs:check → agents:map:check → test
```

提交粒度与信息格式见 `AGENTS.md` §提交粒度。
