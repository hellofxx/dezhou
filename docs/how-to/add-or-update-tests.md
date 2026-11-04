# 新增或修改测试

> 状态：Current · 最后复核：2026-11-04
> 适用：新增 / 修改 unit 或 component 测试。规则源：`docs/testing/README.md` + `src/guards/README.md`。

## 1. 选择测试项目

| 后缀 | 项目 | 环境 | 用途 |
|---|---|---|---|
| `.test.ts` | `unit` | Node | 纯函数、store、migrate、数据完整性 |
| `.test.tsx` | `component` | jsdom | 组件冒烟、交互、a11y |

禁止 `.spec.ts(x)` 与 `__tests__/`：`vitest.config.ts` 的双项目不会收集。测试文件与源码同目录放置。

## 2. 按变更类型补测

- **纯函数 / utils**：边界值、空输入、确定性；表驱动优先。
- **store / persist**：必须有 `<store>.persist-shape.test.ts`；persist version > 1 还需 `<store>.migrate.test.ts`。Node 环境测 migrate 时 stub `window.localStorage`。
- **组件**：正常 / 空态 / 错误态；交互用 `@testing-library/react`；不要依赖真实网络或计时。
- **IndexedDB**：使用 `fake-indexeddb`，测试后清理数据库。
- **守卫**：见 `docs/how-to/add-a-guard.md`。

## 3. 编写约束

- 测试必须确定性、隔离、无网络；同一用例重复运行结果一致。
- 禁止 focused / skipped / todo / expected-failure 标记；`testSystem.guard.test.ts` 零容忍。
- 缺陷修复先写复现用例（修复前失败），再修到通过。
- 课程 / 题库 / 理论内容变更：完整性守卫、选项排序分布、EV 标定诚实性、zh/en 对齐同批通过。

## 4. 运行与验收

```powershell
pnpm test src/path/to/file.test.ts   # 单文件
pnpm test --project unit             # 仅 unit
pnpm test --project component        # 仅 component
pnpm test:guards                     # 全局守卫
pnpm verify                          # 完整门禁
```

- [ ] 后缀与目录正确，未被双项目漏收集
- [ ] persist store 的 shape / migrate 测试齐全
- [ ] 无 focused / skipped / todo
- [ ] 定向测试 + 全量 `pnpm verify` 通过
