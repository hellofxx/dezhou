# src/guards — 全局不变式守卫

本目录存放**跨模块 / 全仓范围**的不变式测试。判定对象是「整个 src 或全仓契约」，不属于任何单个 feature 模块，因此放在 feature 目录之外：

- 归属 feature 模块的数据完整性守卫（课程结构 / 题库 id / 选项排序分布等）留在各自模块内，不进本目录。
- i18n 相关全局守卫（`localeParity` / `staticKeyGuard` / `contentAlignment` 等）与 i18n 资源同处 `src/i18n/`，便于就近读取 locale 结构。
- 其他位置已存在的守卫（如 `src/shared/admission-guard.test.ts`）保持原位，不做迁移。

## 守卫清单

| 文件 | 保护的不变式 | 运行命令 |
|---|---|---|
| `dealerSlip.contrast.test.ts` | 发牌员纸条（`.dealer-slip`）文字的 WCAG AA 对比度：`--paper-ink` 于 `--paper` ≥ 7:1，次级/语义色 ≥ 4.5:1；暗色与 light 两套主题同样达标；`.dealer-slip` 把 canonical 与 alias token 重锚到 paper 深阶 | `pnpm test src/guards/dealerSlip.contrast.test.ts` |
| `designTokenGuard.test.ts` | 全仓源码（`src/**/*.{ts,tsx}`）无 Tailwind 霓虹调色板类、无纯白/纯黑文字与实底类、无纯黑/纯白 hex 字面量（含任意值槽） | `pnpm test src/guards/designTokenGuard.test.ts` |
| `designTokenCssGuard.test.ts` | `src/styles/*.css` 的 `background` 声明无超阈白透面填充、无纯黑实底；豁免项必须成对登记 DESIGN.md 依据；help 段 44px 触摸目标与 transition 引用动效 token | `pnpm test src/guards/designTokenCssGuard.test.ts` |
| `eslintCrossImports.test.ts` | `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 与精确快照一致（新增跨模块边必然变红，收紧时只删不加） | `pnpm test src/guards/eslintCrossImports.test.ts` |
| `huPositionOrderGuard.test.ts` | 单挑（heads-up）位置方向零容忍：以 `theory-academy` 的 `variantRules.headsUpRules` 为单源，四份 HU locale 与单源本身不得出现「谁先行动 / 谁有位置」倒置 | `pnpm test src/guards/huPositionOrderGuard.test.ts` |
| `rangePresetGtoConsistency.test.ts` | range-trainer preset 与 gto-simulator `preflop-ranges.json` 频率 ≥ 0.5 的手牌完全一致；预设名称的 `(~N%)` 标注与组合占比偏差 ≤ 1pp | `pnpm test src/guards/rangePresetGtoConsistency.test.ts` |
| `line-count-guard.test.ts` | 单文件行数硬约束：`src/**/*.ts(x)` 非测试文件不超过 400 行（豁免类别除外） | `pnpm test src/guards/line-count-guard.test.ts` |

## 约定

- **新增全局不变式应放在本目录**：判定对象跨模块或覆盖全仓时，新建 `src/guards/<不变量名>.guard.test.ts` 风格的文件（后缀 `.test.ts` → unit 项目，Node 环境）。
- 守卫必须**自检扫描面**：路径解析或 glob 失效时以「扫描文件数 / 扫描字段数偏低」的断言变红，禁止空洞通过。移动本目录文件后须重跑对应守卫确认自检未失效。
- 目录层级变化时同步修正相对路径（守卫距 `src/` 为一层，故读 `src/styles` 用 `../styles`，读仓库根用 `../../`）。
- 守卫失败即 `pnpm test` 变红，禁止用跳过/放宽断言来"修复"；确需豁免时先在设计文档登记依据（白名单只删不加）。
