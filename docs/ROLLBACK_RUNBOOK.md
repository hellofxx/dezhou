# 部署回滚 Runbook

> 目的：GitHub Pages 部署出现坏版本（站点白屏 / 资源 404 / 功能严重回退）时的最小恢复路径。
> 部署链路事实源：`.github/workflows/deploy.yml`（push main 与 `workflow_dispatch` 双触发器，构建门禁为 typecheck → lint → test → build）。

---

## 回滚 Owner

- **第一责任人**：仓库维护者（`hellofxx/dezhou` 的 admin，拥有 push main 与 Actions 触发权限）
- **协助角色**：`platform-dev` 代理（部署链路 / 跨模块问题定位），回滚动作本身不依赖任何子代理

---

## 入口 A：git revert 后 push main（首选）

适用：坏版本由某次已知提交引入，需要代码层面撤销。

```powershell
# 1. 确认当前 main 与远端一致
git fetch origin
git switch main
git status

# 2. 撤销引入问题的提交（保留历史，不改写已有提交）
git revert <bad-commit-sha>

# 3. 推送 main，自动触发 deploy.yml 完整门禁 + 部署
git push origin main
```

- 多个连续坏提交：`git revert <oldest-bad>^..<newest-bad>`
- 禁止使用 `git push --force` / `git reset --hard` 改写 main 历史（AGENTS.md 提交粒度约束：不重写已有历史）
- revert 提交信息遵循 `type(scope): description` 格式，如 `revert(deploy): 回滚 xxx 引入的构建产物问题`

## 入口 B：workflow_dispatch 重发（无需改代码）

适用：main 代码本身正常，仅部署产物 / Pages 发布过程异常（如 artifact 上传失败、Pages 服务抖动）。

1. 打开仓库 **Actions → Deploy to GitHub Pages**
2. 二选一：
   - 点击 **Run workflow**（`workflow_dispatch` 触发器，基于当前 main HEAD 重新构建部署）
   - 或在上一个成功 run 上点击 **Re-run all jobs**（重发该次成功构建对应的提交）
3. 等待 build + deploy 两个 job 全绿

> 注意：`workflow_dispatch` 构建的是当前 main HEAD。若 main HEAD 本身是坏版本，必须先走入口 A revert，再触发本入口。

---

## 后置条件：确认站点恢复

回滚部署完成后，逐项确认：

1. Actions 中最新 run 的 build 与 deploy job 均成功，deploy job 输出的 `page_url` 为 `https://hellofxx.github.io/dezhou/`
2. 浏览器访问 `https://hellofxx.github.io/dezhou/`（强制刷新 Ctrl+F5 绕过缓存），首页正常渲染、无资源 404
3. 直接访问任一深层路由（如 `https://hellofxx.github.io/dezhou/pot-odds`）并刷新，SPA 回退（404.html）生效，不出现 Pages 404 页
4. 如为入口 A 回滚，本地可先行验证：`pnpm build` 成功且 `pnpm preview` 下问题不复现

---

## 待用户授权的建议项（仅记录，不代为配置远端）

以下为降低再次引入坏版本概率的 GitHub 仓库设置建议，涉及远端配置变更，须仓库维护者本人在 GitHub 上操作：

- [ ] **main 分支保护**：Settings → Branches 启用 branch protection，禁止 force push 与直接删除
- [ ] **PR 强制**：要求变更经 Pull Request 合入 main，并将 Actions 构建门禁设为 required status check
