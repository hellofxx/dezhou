# 架构决策记录（DECISIONS）

> 状态：Current · 最后复核：2026-11-25
> 本文件合并自原 adr 目录（已归档到本地 .archive，历史见 git），是架构决策的唯一事实源。
> 规则：只追加，不改写历史；新决策加在末尾；取代旧决策时把旧条目标为 `Superseded` 并链接到新条目。

状态取值：`Proposed` / `Accepted` / `Superseded` / `Deprecated`。

## ADR-0001：纯前端、零后端、本地优先

- 状态：Accepted
- 日期：2026-11-04

### Context

PokerLab 是单人、长期使用的德州扑克训练工具，部署在 GitHub Pages 的 `/dezhou/` 子路径。核心价值是离线可用的训练与复盘，而不是账号、社交或多端同步；引入后端会带来运维、认证、隐私与成本负担，并破坏「打开即训练」的体验。

### Decision

- 不引入后端、数据库、认证或云同步；所有运行时逻辑在浏览器完成。
- 进度与偏好保存在 `localStorage`（zustand persist），牌局大数据保存在 IndexedDB。
- 通过 Service Worker 缓存静态资源，支持离线访问；构建产物是唯一交付物。
- 排行榜保持本地虚构角色 + 演示说明，真实排行榜后端不在当前范围。

### Consequences

- 无账号、无跨设备同步；用户数据只存在当前浏览器，清缓存会丢失本地进度（需通过导出/备份与 persist 错误可见化降低风险）。
- 所有功能必须离线可用，不能依赖服务端定时任务或远程配置。
- 首屏体积与缓存策略成为主要性能约束；新增依赖必须评估 bundle 影响。
- 若未来引入后端或云同步，必须新增 ADR 取代本决策，并同步 PRD / TDD / 部署文档。

### References

- `docs/PRD.md` — 产品定位与范围
- `docs/TDD.md` — 持久化与离线设计（§2 / §9 / §12）
- `README.md` — 部署形态

## ADR-0002：Feature-first + 单向跨模块边界

- 状态：Accepted
- 日期：2026-11-04

### Context

项目有 10 个业务模块，课程与题库内容量大，且由多个 AI 代理并行维护。若允许模块间自由引用，内容改动、状态写入与 UI 复用会迅速形成环形依赖，AI 也难以判断文件归属。

### Decision

- 每个 feature 自包含：`components/` / `hooks/` / `utils/` / `data/` / `store.ts` / `types.ts` / `index.ts`（纯静态模块可豁免 store）。
- `shared/` 只接收被 ≥2 个模块使用的代码；单模块代码留在模块内。
- 跨模块只允许两种通道：引用 `progress` 的公开 API，或经 `trainingEvents` 事件总线；允许边清单以 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源，收紧时只删不加。
- 数据源采用注册表倒置（`academyDataSourceRegistry` / `achievementRegistry`），避免 progress 反向依赖学院模块。
- 每个 feature 与模块 `AGENTS.md`（或 `index.ts` 头注释）1:1 绑定职责说明；模块增删同步 `docs/agents/MODULE_MAP.md`。

> 注记（2026-11-23）：原「与 `.claude/agents/<module>-dev.md` 1:1 绑定」已废止——项目自带子代理退场，执行层改为全栈开发组插件代理 + 文件所有权；本 ADR 的模块边界结论不变。

### Consequences

- 模块边界清晰，AI 可按目录归属判断改动范围；`progress` 成为跨模块状态中枢。
- 新增跨模块边必须改白名单并更新守卫快照，成本高，能有效阻止随意耦合。
- `shared/` 的准入门槛需要持续守卫；单消费者组件应下沉回模块。
- 新增模块的完整步骤见 `AGENTS.md` §操作指南。

### References

- `AGENTS.md` — 代码组织、关键约束、Agent 协作（插件代理 + 文件所有权）
- `eslint.config.js` — `ALLOWED_CROSS_IMPORTS`
- `src/guards/eslintCrossImports.test.ts` / `src/features/eslint-guard-dependency-graph.test.ts`
- `docs/agents/MODULE_MAP.md`

## ADR-0003：progress store 单中枢，不拆分持久化写路径

- 状态：Accepted
- 日期：2026-11-04

### Context

`src/features/progress/store.ts` 同时承载 Streak / ELO / SRS / Emotion / Mentor 五大系统、QuickDrill 状态、训练记录索引与成就判定。历史上曾讨论按行数拆分该 store；但它同时是多个模块的写入汇合点，拆分持久化写路径会引入跨 store 一致性与迁移风险。

### Decision

- 保留单个 progress persist store 作为跨模块状态中枢；允许拆分 selector、hook、纯函数与展示组件，但**不拆分持久化写路径**。
- 任何持久化 schema 变更必须递增 `version` + 编写 `migrate`，并更新 `store.persist-shape.test.ts` / `store.migrate.test.ts`。
- 行数守卫将 `progress/store.ts` 登记为长期豁免（而非「Phase 2 拆分待执行」）；文件继续增长仍受 `maxLines` 棘轮约束。
- 若未来确需拆分 store，必须新增 ADR 取代本决策，并给出跨 store 一致性、迁移与回滚方案。

### Consequences

- 单文件较大，但一致性优先于行数；代码评审应关注写入路径是否仍唯一。
- 新增跨模块状态必须经 progress 公开 API，不得在 feature store 中复制。
- 「不拆分」是显式决策，不再与历史补救计划中的「待拆分」表述冲突。

### References

- `AGENTS.md` — 跨模块状态集中管理
- `docs/TDD.md` §16 — 状态管理与 persist version 规则
- `src/guards/line-count-guard.test.ts` — 长期豁免登记
- 早期补救计划的讨论见 git 历史

## ADR-0004：Service Worker 全量预缓存与「当前 + 上一版」保留策略

- 状态：Accepted
- 日期：2026-11-07

### Context

原 `public/sw.js` 只预缓存 shell 三件套（站点根 / index.html / manifest.json），课程与页面 chunk 须访问后才进缓存：SW 安装完成后离线访问未访问过的路由仍然白屏。同时旧实现在 install 阶段跳过等待、activate 阶段立即删除全部旧缓存并接管所有标签页：每次部署后，保持打开的旧标签页懒加载旧 chunk 时本地缓存已删、GitHub Pages 上旧文件已 404，训练中断。用户已批准全量预缓存（构建产物估算 ~7MB），换取「首次打开后全路由离线可用」。

### Decision

- **构建期注入**：新增自研 Vite 插件 `scripts/sw-precache-plugin.ts`（零新依赖），在 `generateBundle`（post 顺序，确保收齐 index.html / CSS）收集全部构建产物与 public 文件，去重排序后取清单 JSON 的 sha256 前 8 位为 hash，替换 `public/sw.js` 模板的两个占位符并 emitFile 覆盖产出 `dist/sw.js`。
- **全量预缓存**：install 时 shell 三件套以 `cache:'reload'` 强制拉新，其余清单按 32 条/批串行 `addAll`，失败重试一次后抛出使 install 失败、下次导航重试（不容忍 404，容忍缺资源等于复现离线白屏）。
- **消除部署竞态**：新 SW 不跳过等待、不立即接管；旧标签页全部关闭后新 SW 才激活，期间旧标签页始终由旧 SW + 旧缓存服务。
- **缓存保留**：缓存名为 `poker-training-<版本号>-<清单hash>`（同版本重部署也会换名）；activate 经 `poker-training-meta` 缓存记录上一版，仅保留当前 + 上一版 + meta，删除其余 `poker-training-*` 缓存。
- **导航回写门槛**：network-first 导航仅在 `response.ok` 时回写 shell 缓存，防止把 Pages 404 响应缓存成离线首页。
- **资产匹配 `ignoreVary`**：模块脚本请求带 `Origin` 头而 `addAll` 预缓存请求没有，服务器响应带 `Vary: Origin`（vite preview / Pages CDN）时按默认 Vary 匹配会离线 miss；本分支只缓存同源 immutable 哈希资产，忽略 Vary 安全（浏览器实测发现的回归，由守卫锁定）。

### Consequences

- 正面：首次打开完成后台预缓存后，任何课程 / 训练路由离线可用；部署后旧标签页不再因 chunk 失效而中断；注入后的 sw.js 字节差异本身触发浏览器 SW 更新检测。
- 已接受代价：
  - 安装期后台下载全量产物（估算 ~7MB），弱网下首次安装耗时变长；install 失败由浏览器在下次导航时重试。
  - 新版生效延迟至该站点所有标签页关闭后重开（无需硬刷新或清缓存）。
  - 旧标签页在线刷新拿到新 HTML 后若断网，其懒加载 chunk 存在缺口（旧标签页不刷新、由旧缓存服务旧 HTML 时无此问题）；接受该残余窗口。
  - 当前 + 上一版双份缓存约占两倍空间（估算 ~14MB），CacheStorage 配额充足。
- 后续约束：模板不变式、注入确定性与插件钩子由 `src/guards/swPrecache.guard.test.ts` 守护；dev 直接服务模板时降级为空清单 + `dev` hash，不污染生产缓存。若未来 Vite 升级改变 public 拷贝时序导致 emitFile 覆盖失效，备选方案为 closeBundle 直接写 outDir。

### References

- `docs/PRD.md` §5.20.2 / §6.6 — 离线可用与可靠性规格
- `docs/TDD.md` §12.2 — 缓存策略实现口径
- `README.md` §部署与回滚 — 发布后验证
- `scripts/sw-precache-plugin.ts` / `public/sw.js` — 实现
- `src/guards/swPrecache.guard.test.ts` — 守卫

## 新增决策模板

```md
## ADR-XXXX：<决策标题>

- 状态：Proposed | Accepted | Superseded | Deprecated
- 日期：YYYY-MM-DD
- 取代 / 被取代：<ADR 编号，可选>

### Context
为什么需要做这个决策？约束是什么？

### Decision
我们决定做什么？

### Consequences
正面 / 负面后果、后续约束、需要同步的文档与门禁。

### References
PRD / TDD / 代码 / 守卫 / 历史评审。
```