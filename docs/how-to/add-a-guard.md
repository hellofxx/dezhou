# 新增守卫测试

> 状态：Current · 最后复核：2026-11-04
> 适用：新增全局不变式或模块级数据完整性守卫。规则源：`src/guards/README.md` + `docs/testing/README.md`。

## 先判断归属

| 判定对象 | 放置位置 |
|---|---|
| 跨模块 / 全仓契约（依赖边、颜色 token、行数、i18n 对称等） | `src/guards/<name>.guard.test.ts` |
| 单个 feature 的课程结构 / 题库 id / 选项分布等 | 该模块内 `*.test.ts` |
| i18n 资源结构 | `src/i18n/` 下与资源同处 |

## 步骤

1. **写守卫**：在 `src/guards/` 新建 `<name>.guard.test.ts`（Node 环境，`.test.ts`）。断言必须带可定位信息（`file:line` 或具体条目）。
2. **自检扫描面**：断言扫描到的文件数 / 条目数达到最低值，防止 glob 或路径失效时「空跑通过」。
3. **登记清单**：在 `src/guards/README.md` 的守卫表中新增一行，写清保护的不变式与运行命令。`testSystem.guard.test.ts` 会双向校验文件与 README 清单。
4. **白名单 / 棘轮**：确需豁免时，先在设计文档登记依据，再改守卫白名单；白名单只减不加，文件恢复合规后必须删除条目。禁止跳过、放宽断言或静默 catch。
5. **失败信息**：确保失败时能直接指出违规文件、行号与修复方向；不要只输出布尔断言。
6. **补文档**：必要时在 `docs/AI_GUIDE.md` 或相关 Current 文档补充规则；一次性分析放 `docs/history/`。

## 运行与验收

```powershell
pnpm test src/guards/<name>.guard.test.ts
pnpm test:guards
pnpm verify
```

- [ ] 守卫有扫描面自检，不是空洞通过
- [ ] 已登记 `src/guards/README.md`
- [ ] 失败信息包含文件 / 行号 / 条目
- [ ] 白名单只减不加；无 skip / focused / todo
- [ ] `pnpm verify` 全绿
