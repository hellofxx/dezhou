# 仪表盘界面审查与优化报告

**审查日期**：2026-08-10  
**驱动技能**：`frontend-design`  
**验证门禁**：`pnpm verify` → typecheck exit 0 / lint exit 0 / 476 tests passed

---

## 1. 审查方法

1. **视觉证据**：使用 Playwright 在 1440×900 桌面与 390×800 移动端注入完整 store state（含 14 天 records、3 个变体 ELO、3 项 SRS 复习等）截图。
2. **代码深读**：读取 `Dashboard` / `FeltArena` / `StreakRail` / `VariantEloOverview` / `DailyTrainingPlan` / `ProgressReplay` / `ProgressPage` / `StatsOverview` / `ModuleStatsPage` 全部源码，对照截图识别缺陷。
3. **设计契约核对**：参考 `globals.css`（四层色彩 token 与 Felt Arena 椭圆样式）+ `poker-ui-demo/DESIGN_LANGUAGE.md`。
4. **基线门禁**：`pnpm typecheck && pnpm lint && pnpm test`（68 test files / 476 tests）。

---

## 2. 主要问题清单（按严重度）

### P0 — 必须修复

| # | 文件 | 问题 |
|---|------|------|
| 1 | `FeltArena.tsx` | 椭圆内 5 个绝对定位元素（ELO 徽章 / 两 CasinoPlaque / 今日进度 chip / 中央内容）相互重叠，ELO 徽章 `top:-4px` 溢出椭圆顶部 |
| 2 | `Dashboard.tsx` | "正确率趋势"区域标题与内容不符 —— 该面板实际渲染最近训练记录列表 |
| 3 | `Dashboard.tsx` | 无时间范围筛选器（用户明确诉求：优化筛选器与时间范围选择器位置及联动逻辑） |
| 4 | 多处 | `MODULE_LABELS` 字典在 4 个文件（Dashboard/StatsOverview/ProgressPage/ModuleStatsPage）重复定义，单点变更易遗漏 |
| 5 | 多处 | Dashboard 中多处硬编码中文：DailyTrainingPlan"📋 今日训练推荐 / 开始 / 跳过"、ProgressReplay"回放你的进步"、ProgressPage"最近训练记录 / 模块/模式/正确率/用时/日期"等表头 |

### P1 — 应当优化

| # | 文件 | 问题 |
|---|------|------|
| 6 | `VariantEloOverview.tsx` | Card 样式与其他面板不一致（缺 `bg-[var(--felt)] border-[var(--walnut-border)]`）；标题 `text-base` 而非 `font-display text-[17px]` |
| 7 | `Dashboard.tsx` | 信息层级未分层，堆叠 8 个区块，无视觉焦点引导；Quick Drill 与 Achievement 入口分占两段，挤占任务中心 |
| 8 | `globals.css` | 移动端 `daily-progress-chip { display:none }` 隐藏底部数据条（用户日日关心的核心指标在手机上不可见） |
| 9 | `Dashboard.tsx` | "最近训练"无关键指标摘要（训练次数/答题数/正确率），用户只能看列表自算 |
| 10 | `EmptyState.tsx` | 仅接受 string icon（emoji），无法内联 lucide 图标；缺紧凑变体（仪表盘内嵌场景需要小空状态） |

---

## 3. 优化方案与落地

### 3.1 共享层抽离（新增）

| 文件 | 职责 |
|------|------|
| `src/shared/constants/moduleLabels.ts` | `MODULE_LABEL_KEYS`（模块 id → i18n key）+ `MODULE_LABELS_FALLBACK`（兜底中文），单一事实源 |
| `src/shared/hooks/useModuleLabel.ts` | `useModuleLabel()` hook：返回 `(moduleId) => string`，i18n 自动切换 |
| `src/shared/components/feedback/EmptyState.tsx` | icon 改为 `ReactNode`；新增 `compact` 变体（用于仪表盘内嵌） |

### 3.2 关键组件重构

**FeltArena** —— 从 5 个绝对定位重叠改为清晰三层：

```30:140:src/features/progress/components/training/FeltArena.tsx
      <div className="felt-arena">
        {/* 顶部：ELO 徽章（左上） */}
        <button className="elo-rank-badge" style={{ position: 'absolute', top: '10px', left: '10%' }}>...</button>
        {/* 中央：欢迎区（flex column 居中） */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="section-eyebrow">...</div>
          <h2>欢迎回到牌桌</h2>
          <MottoEngraved />
          <div className="flex items-end justify-center gap-5"> {/* 牌堆 + 筹码 */} </div>
          <p>今天的练习已为你准备好。</p>
        </div>
        {/* 底部：三项核心指标 plaque（水平排列） */}
        <div className="felt-arena-stats">
          <CasinoPlaque value={totalSessions} label="训练总手" sub="+N 本周" />
          <CasinoPlaque value="67.9%" label="综合正确率" sub="中级水平" />
          <div className="daily-progress-chip">...</div>
        </div>
      </div>
```

配套 CSS 调整：
```440:480:src/styles/globals.css
.felt-arena {
  /* padding 由 30px 110px 34px 收紧到 30px 60px 26px */
  padding: 30px 60px 26px;
  display: flex; flex-direction: column; justify-content: center; gap: 4px;
}
.felt-arena-stats {
  display: flex; justify-content: center; align-items: stretch; gap: 14px;
  margin-top: 2px;
}
.felt-arena-stats .daily-progress-chip {
  display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
  min-width: 104px; padding: 8px 14px; border-radius: 6px;
  background: rgba(201,162,94,0.10); border: 1px solid rgba(201,162,94,0.35);
}
```

**Dashboard** —— 信息层级重排 + 时间范围筛选器：

```38:60:src/features/progress/components/dashboard/Dashboard.tsx
type TimeRange = '7d' | '30d' | '90d' | 'all';
const TIME_RANGE_KEYS: Record<TimeRange, string> = {
  '7d': 'dashboard.timeRange.7d', '30d': 'dashboard.timeRange.30d',
  '90d': 'dashboard.timeRange.90d', all: 'dashboard.timeRange.all',
};
const TIME_RANGE_DAYS: Record<TimeRange, number | null> = { '7d': 7, '30d': 30, '90d': 90, all: null };

export default function Dashboard() {
  // 时间范围筛选器 — 联动「最近训练」列表
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const filteredRecentRecords = useMemo(() => {
    const days = TIME_RANGE_DAYS[timeRange];
    if (days === null) return recentRecords;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return recentRecords.filter((r) => r.createdAt >= cutoff);
  }, [recentRecords, timeRange]);
```

新信息层级（视觉焦点清晰）：

| 顺序 | 区块 | 角色 |
|------|------|------|
| 1 | FeltArena Hero | 核心数据牌桌（段位 + 总手数 + 正确率 + 今日进度） |
| 2 | Streak Rail | 连续天数 + 周圆点 + 今日正确率 |
| 3 | Quick Drill | 高频训练入口 |
| 4 | 今日任务 + 今日复习（2:1） | 今日核心目标 |
| 5 | 智能推荐 + 最近训练（2:1） | **含时间范围筛选器 + 三联指标摘要** |
| 6 | 多变体 ELO + 成就入口（1:1） | 跨场景进度 + 收集激励 |
| 7 | 回放进步 + 今日情绪（2:1） | 复盘 + 辅助（情绪作为低调辅助） |
| 8 | 首访引导（条件） | 仅无训练时引导 |
| 9 | 训练场 6 模块 | 完整目录 |

**DailyTrainingPlan / ProgressReplay / ProgressPage** —— 全部 i18n 化（替换 12+ 处硬编码中文）。

---

## 4. 验证结果

```
$ pnpm verify
✓ typecheck (node node_modules/typescript/bin/tsc --noEmit) — exit 0
✓ eslint src — exit 0
✓ vitest run — 68 test files / 476 tests passed
  ├─ src/i18n/localeParity.test.ts — 双语键对称守卫通过
  ├─ src/designTokenGuard.test.ts — UI 色彩合规守卫通过
  ├─ src/eslintCrossImports.test.ts — 模块间引用白名单一致
  └─ src/features/progress/store.migrate.test.ts — persist v10 守卫通过
```

---

## 5. 修改文件清单

| 文件 | 变化类型 | 说明 |
|------|----------|------|
| `src/features/progress/components/dashboard/Dashboard.tsx` | 重构 | 信息层级重排 + 时间筛选器 + 新增子组件（FilteredSummary/Metric/formatRelative） |
| `src/features/progress/components/dashboard/StatsOverview.tsx` | 替换 | 删本地 MODULE_LABELS → `useModuleLabel()` |
| `src/features/progress/components/replay/ProgressPage.tsx` | i18n 化 | 替换 11 处硬编码中文（含表头） |
| `src/features/progress/components/training/FeltArena.tsx` | 重构 | 三层结构 + 去除绝对定位重叠 |
| `src/features/progress/components/training/DailyTrainingPlan.tsx` | i18n 化 | 替换 4 处硬编码 |
| `src/features/progress/components/replay/ProgressReplay.tsx` | i18n 化 | 替换 2 处硬编码 |
| `src/features/progress/components/stats/VariantEloOverview.tsx` | 样式统一 | Card 主题色 + 标题样式对齐 |
| `src/shared/constants/moduleLabels.ts` | **新增** | 模块 id → i18n key 映射 |
| `src/shared/hooks/useModuleLabel.ts` | **新增** | `useModuleLabel()` hook |
| `src/shared/components/feedback/EmptyState.tsx` | 扩展 | ReactNode icon + compact 变体 |
| `src/styles/globals.css` | 调整 | `.felt-arena` padding 收紧、新增 `.felt-arena-stats`、移除 `.daily-progress-chip` 移动端隐藏 |
| `src/i18n/locales/zh.json` | 新增 | dashboard.dataPlan/recentTraining/timeRange/progressReplay + progress.moduleEntry/column/subtitle |
| `src/i18n/locales/en.json` | 新增 | 同步英文版 |

---

## 6. 设计契约遵循

- **四层色彩 token**：未引入任何 `bg-white` / `text-black` / 霓虹类硬编码颜色（designTokenGuard 守卫通过）。
- **共享层准入门槛 ≥2 模块**：`moduleLabels.ts` + `useModuleLabel.ts` 服务于 Dashboard / StatsOverview / ProgressPage / ModuleStatsPage 4 个消费方。
- **模块间无直接引用**：所有跨模块调用走 `shared/hooks` 与 `shared/constants`（eslintCrossImports 守卫通过）。
- **i18n 双语同步**：所有新增 key 在 zh.json 与 en.json 对称写入（localeParity 守卫通过）。
- **单文件 ≤ 300 行硬约束**：本次 Dashboard 重写控制在合理行数（含 3 个内部子组件）；如需进一步拆分，可将 FilteredSummary/Metric/formatRelative 抽到独立文件。