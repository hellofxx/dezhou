---
name: verify
description: 运行项目质量门禁 pnpm verify（typecheck && lint && test 串行）并在失败时按门禁顺序定位修复。当需要提交前验证、检查代码质量、或 typecheck / lint / test 失败排查时使用。
---

# Verify 质量门禁

## 运行

- 执行 `pnpm verify`（typecheck → lint → test 串行短路，任一失败即中止；唯一事实源为 package.json 的 `verify` script）
- 分步排查可单独运行 `pnpm typecheck` / `pnpm lint` / `pnpm test`

## 失败处理

1. **typecheck 失败**：直接运行 `node node_modules/typescript/bin/tsc --noEmit` 查看错误（勿用 `pnpm tsc`，devEngines 校验可能失败）
2. **lint 失败**：`pnpm lint`（eslint src），仅两条规则：`no-restricted-imports`（允许边清单以 eslint.config.js 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源，收紧时只删不加）与 `@typescript-eslint/no-explicit-any`
3. **test 失败**：`pnpm test`（vitest run）；unit 项目跑 Node 环境 `src/**/*.test.ts`，component 项目跑 jsdom 环境 `src/**/*.test.tsx`；i18n 双语键对称由 `src/i18n/localeParity.test.ts` 守卫，UI 颜色合规由 `src/designTokenGuard.test.ts` 守卫

## 完成标准

- typecheck / lint / test 三个命令全部 exit code 0
- 测试新增用例按内容选对后缀（Node 测 store migrate 需 stub `window.localStorage`）
