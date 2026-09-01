# 补救计划（按优先级与顺序）

配套 `architecture-review.md`（发现编号 R1–R11）。排序依据：不可再生数据风险 > 潜伏可用性风险 > 契约漂移 > 维护成本。所有切片都以 `pnpm verify` 为出口门禁。

## 波次 1 · 本周就做（半天量级，各自独立可交付）

| 切片 | 内容 | 归属代理 | 依赖 | 出口 |
|---|---|---|---|---|
| **S1 persist 失败可见化** | `createJSONStorage` 包一层捕获 `QuotaExceededError`，置 `persistError` 状态并 `Toaster` 提示引导导出备份 | `progress-dev`（+ `platform-dev` 若 storage 工具下沉 shared） | 无 | R1-2 的 quota 抛错测试通过 |
| **S2 IndexedDB open 加固** | 两处 `open()` 补 `onblocked` reject + `onversionchange → db.close()` + 失败时清 `_dbPromise` | `hand-history-dev` 与 `progress-dev` 各改自己那份 | 无 | 双开版本升级测试不超时 |
| **S3 300 行约束收口** | 二选一：加"只降不升"的非豁免文件长度守卫，或把 `AI_GUIDE.md:28` 的豁免类别改成可枚举路径清单 | `platform-dev`（守卫）/ 文档 | 无 | `pnpm test` 有守卫，或文档口径与执行一致 |
| **S4 契约噪声清理** | 决定 `TrainingRecord.module` 是否保留 `'hand-history'`；同步 PRD 一句话口径 | `platform-dev` + `hand-history-dev` | 无 | 联合成员与 emit 集合一致 |

S1 与 S2 是本次评审唯二涉及"用户数据可能丢失/功能可能永久卡死"的项，且互不依赖，可并行。

## 波次 2 · 下个迭代（1–2 天，需要设计决策）

| 切片 | 内容 | 归属 | 前置决策 |
|---|---|---|---|
| **S5 `reviewItems` 设界 + v16 迁移** | 上限 + 淘汰策略（建议按 `nextReviewDate` 与 SRS 权重），`MIGRATIONS` 增 v16 一次性裁剪老数据 | `progress-dev` | 保留多少条？淘汰是删除还是归档到 IndexedDB？—— **需要用户/产品确认**，因为会动到真实复习队列 |
| **S6 `hand-history-db` 单一 owner** | 库定义只留在 hand-history，progress 侧经公开 API 读写 | `platform-dev` 协调跨模块接口 | 走 shared 层新接口还是复用 registry 模式？（registry 更贴合既有惯例） |
| **S7 接线矩阵测试** | 断言每个训练模块应当调用的 progress API 集合（把 R5 的不对称固化成契约） | `progress-dev` | 是否同时引入 `submitTrainingResult()` 统一入口？统一入口更好但会碰所有 trainer，风险高，建议先测试固化、后评估入口 |

S5 依赖 S1（先有失败可见化，裁剪出问题能被看见）。S6 依赖 S2（先加固再合并，避免整改过程中踩到 pending）。

## 波次 3 · 顺手项与长期习惯

- **S8** 诊断面板（Settings 内本地显示 persist 错误 / IndexedDB 状态 / SW 版本）—— 与 S1 同一套错误上报机制，复用即可（R10）。
- **S9** `useGateBypass()` 统一调试旁路接法，替换 9 处两种写法（R9）。
- **S10** CI 打印全量 chunk 清单并为惰性 chunk 设软预算；**先重跑 `pnpm build` 取真实数字**（R8，当前 `dist/` 是 8 月 15 日旧产物）。
- **S11** `docs/adr/` 起步 3 篇：纯前端零后端与数据落客户端、records 外迁 IndexedDB、hand-history 豁免事件总线（R11）。
- **S12** 确认自适应难度是否刻意只降不升，写进 PRD 或补双向路径（R6）。
- **S13** 超长非豁免文件的实际拆分（`strategyCompare.ts` 451、`contentKeys.ts` 376、`ConceptGraph.tsx` 651 等）—— **放在 S3 之后**，因为先定口径再动刀，否则可能拆了又发现按新口径本来就豁免。

## 建议不要做的事

- **不要**为了"架构更干净"去拆 `progress/store.ts`（1144 行）。它是被 AGENTS.md 明确要求的跨模块状态单一中枢，且 `AI_GUIDE.md:28` 已豁免 store；拆分会把一次写入路径切成多处，反而威胁 R1/R5 这类一致性不变量。
- **不要**引入外部遥测/云同步来"解决"失败可见性 —— 与零后端、离线可用的产品定位冲突。S1 + S8 的本地机制已足够。
- **不要**现在做模块合并或目录重组。实测跨模块边与白名单逐条相等、无 peer 债务，这部分已经没有收益。
- **不要**在波次 1 之前动 `reviewItems` 的裁剪逻辑 —— 未设 `persistError` 可见化就改复习队列，出问题不可观测。

## 复核节奏

- 每个切片独立 commit（仓库既有粒度约定，`type(scope): description`），互不混装。
- 每切片结束跑 `pnpm verify`；涉及 persist schema 的（S1/S5/S6）额外核对：version 递增 + migrate 防御性合并 + CHANGELOG 记录。
- 全部完成后重跑 `docs/architecture/00-evidence.md` §5 的采集命令，更新模型（R1/S5 会改变存储画像，S6 会改变依赖图）。
