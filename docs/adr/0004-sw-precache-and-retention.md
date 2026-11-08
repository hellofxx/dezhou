# ADR-0004: Service Worker 全量预缓存与「当前 + 上一版」保留策略

- 状态：Accepted
- 日期：2026-11-07

## Context

原 `public/sw.js` 只预缓存 shell 三件套（站点根 / index.html / manifest.json），课程与页面 chunk 须访问后才进缓存：SW 安装完成后离线访问未访问过的路由仍然白屏。同时旧实现在 install 阶段跳过等待、activate 阶段立即删除全部旧缓存并接管所有标签页：每次部署后，保持打开的旧标签页懒加载旧 chunk 时本地缓存已删、GitHub Pages 上旧文件已 404，训练中断。用户已批准全量预缓存（构建产物估算 ~7MB），换取「首次打开后全路由离线可用」。

## Decision

- **构建期注入**：新增自研 Vite 插件 `scripts/sw-precache-plugin.ts`（零新依赖），在 `generateBundle`（post 顺序，确保收齐 index.html / CSS）收集全部构建产物与 public 文件，去重排序后取清单 JSON 的 sha256 前 8 位为 hash，替换 `public/sw.js` 模板的两个占位符并 emitFile 覆盖产出 `dist/sw.js`。
- **全量预缓存**：install 时 shell 三件套以 `cache:'reload'` 强制拉新，其余清单按 32 条/批串行 `addAll`，失败重试一次后抛出使 install 失败、下次导航重试（不容忍 404，容忍缺资源等于复现离线白屏）。
- **消除部署竞态**：新 SW 不跳过等待、不立即接管；旧标签页全部关闭后新 SW 才激活，期间旧标签页始终由旧 SW + 旧缓存服务。
- **缓存保留**：缓存名为 `poker-training-<版本号>-<清单hash>`（同版本重部署也会换名）；activate 经 `poker-training-meta` 缓存记录上一版，仅保留当前 + 上一版 + meta，删除其余 `poker-training-*` 缓存。
- **导航回写门槛**：network-first 导航仅在 `response.ok` 时回写 shell 缓存，防止把 Pages 404 响应缓存成离线首页。
- **资产匹配 `ignoreVary`**：模块脚本请求带 `Origin` 头而 `addAll` 预缓存请求没有，服务器响应带 `Vary: Origin`（vite preview / Pages CDN）时按默认 Vary 匹配会离线 miss；本分支只缓存同源 immutable 哈希资产，忽略 Vary 安全（浏览器实测发现的回归，由守卫锁定）。

## Consequences

- 正面：首次打开完成后台预缓存后，任何课程 / 训练路由离线可用；部署后旧标签页不再因 chunk 失效而中断；注入后的 sw.js 字节差异本身触发浏览器 SW 更新检测。
- 已接受代价：
  - 安装期后台下载全量产物（估算 ~7MB），弱网下首次安装耗时变长；install 失败由浏览器在下次导航时重试。
  - 新版生效延迟至该站点所有标签页关闭后重开（无需硬刷新或清缓存）。
  - 旧标签页在线刷新拿到新 HTML 后若断网，其懒加载 chunk 存在缺口（旧标签页不刷新、由旧缓存服务旧 HTML 时无此问题）；接受该残余窗口。
  - 当前 + 上一版双份缓存约占两倍空间（估算 ~14MB），CacheStorage 配额充足。
- 后续约束：模板不变式、注入确定性与插件钩子由 `src/guards/swPrecache.guard.test.ts` 守护；dev 直接服务模板时降级为空清单 + `dev` hash，不污染生产缓存。若未来 Vite 升级改变 public 拷贝时序导致 emitFile 覆盖失效，备选方案为 closeBundle 直接写 outDir。

## References

- `docs/PRD.md` §5.20.2 / §6.6 — 离线可用与可靠性规格
- `docs/TDD.md` §12.2 — 缓存策略实现口径
- `docs/ops/DEPLOY_CHECKLIST.md` §3 — 发布后验证
- `scripts/sw-precache-plugin.ts` / `public/sw.js` — 实现
- `src/guards/swPrecache.guard.test.ts` — 守卫