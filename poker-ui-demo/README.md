# poker-ui-demo

本目录是**静态设计参考**，不是生产源码，不参与构建、不被 `src/` 引用。

- 设计权威为根目录 `DESIGN.md`；实现权威为 `src/styles/globals.css`（四层色彩 token 的唯一来源）。本目录内文件与两者冲突时，一律以它们为准。
- `pages/index.html` 仅用于视觉原型演示，不得作为产品页面来源。
- 生成物不入库：`.preflight/` 预检产物与 `runtime-orchestration-summary.json`、`validation-report.json` 两份报告均可再生成，已由 `scripts/check-repo-hygiene.mjs` 拦截。
