# React 最佳实践审查报告

> 基于 **Vercel React Best Practices v1.0.0**（70 条规则 / 8 大类）对当前德州扑克训练平台进行对照审查。
> 项目栈：React 19.2 + Vite 8 + TS 7 + Zustand 5 + React Router v7 + framer-motion 12 + Recharts 3
> **未启用 React Compiler**（package.json 无 `babel-plugin-react-compiler`）→ 手动 memo 仍有意义

---

## 一、总体评分

| 维度 | 评级 | 说明 |
|---|---|---|
| 路由级代码分割 | ✅ 优秀 | 全部页面 `React.lazy()` + `<Suspense>` + i18n 并行预加载 |
| Vendor 分包 | ✅ 优秀 | `vite.config.ts` manualChunks 合理拆分 recharts/framer/react-dom |
| 状态持久化 | ✅ 优秀 | localStorage 全走 zustand persist（versioned），0 处裸 `localStorage.getItem` |
| 事件监听器 passive | ✅ 合格 | 唯一 scroll 监听已用 `{ passive: true }` |
| 条件渲染 | ⚠️ 中等 | 47 处 `&&` 条件渲染，部分可能渲染 `0`/`NaN` |
| 数组不可变性 | ⚠️ 中等 | 多处 `.sort()` 原地排序，应改 `.toSorted()` |
| Effect 依赖治理 | ⚠️ 中等 | 个别文件 Effect 过密（8 个），存在派生 state 用 Effect 的嫌疑 |
| Barrel 导入 | ⚠️ 低风险 | `lucide-react` 104 处具名导入（库本身支持 tree-shaking，影响有限） |

---

## 二、做得好的地方 ✅

### 1. 路由级懒加载 + i18n 并行预加载（对应 `bundle-dynamic-imports` + `async-parallel`）

`src/app/routes.tsx:17-20`
```typescript
function lazyPage(loader: PageLoader, group: keyof typeof FEATURE_GROUPS) {
  const keys = FEATURE_GROUPS[group];
  return lazy(() => Promise.all([loader(), preloadI18n(keys)]).then(([mod]) => mod));
}
```
页面 chunk 与该路由所需翻译模块**并行加载**，core 模块幂等跳过。这是规则 1.5（Promise.all）与 2.4（dynamic imports）的优秀组合实践。

### 2. Vendor 与数据分包（对应 `bundle-barrel-imports` + `bundle-conditional`）

`vite.config.ts:25-51` 的 `manualChunks` 把 recharts/d3、framer-motion、react-dom 分别拆分，并把 `strategy-academy/data/levels/` 按 early/late 拆分（避免一次性加载全部课程数据）。符合规则 2.2（条件模块加载）的思路。

### 3. localStorage 全部走 zustand persist（对应 `client-localstorage-schema`）

全项目 0 处裸 `localStorage.getItem/setItem` 调用，所有持久化通过 zustand `persist` 中间件，且每个 store 都有 `name` + `version`（见 AGENTS.md 约束）。完美符合规则 4.4（版本化 + 最小化 localStorage）。

### 4. scroll 监听使用 passive（对应 `client-passive-event-listeners`）

`src/features/progress/components/settings/SettingsNav.tsx:96`
```typescript
main.addEventListener('scroll', schedule, { passive: true });
```
唯一一处 scroll 监听已正确使用 `{ passive: true }` 并配合 `requestAnimationFrame` 节流。

### 5. 键盘事件监听器统一在 useEffect 中注册/清理

`BlankLayout.tsx:39-42`、`PracticeDrill.tsx:469-472` 等均遵循 `addEventListener` + cleanup 模式，未发现泄漏。

---

## 三、需要改进的地方 ⚠️

### 🔴 P1：数组原地 `.sort()` 应改为 `.toSorted()`（规则 7.14 `js-tosorted-immutable`）

**影响**：MEDIUM — 原地排序会突变源数组，在 React 中可能导致不可预期的副作用与重渲染问题。

**违规位置**：

| 文件 | 行号 | 代码 |
|---|---|---|
| `src/features/range-trainer/components/SessionResult.tsx` | 36 | `.sort((a, b) => b.wrongCount - a.wrongCount)` |
| `src/features/progress/components/achievement/AchievementBadges.tsx` | 35 | `[...records].sort((a, b) => a.createdAt - b.createdAt)` |
| `src/features/progress/components/achievement/AchievementBadges.tsx` | 39 | `[...new Set(...)].sort()` |
| `src/features/progress/components/achievement/AchievementBadges.tsx` | 184 | `[...dates].sort()` |
| `src/features/progress/components/achievement/Leaderboard.tsx` | 60/65/70 | `[...MOCK_PLAYERS, userEntry].sort(...)` |
| `src/features/strategy-academy/components/ConceptGraph.tsx` | 57/85/98/105/371/431 | 多处 `.sort()` |

**说明**：
- `AchievementBadges.tsx:35` `[...records].sort(...)` 已先用展开运算符创建副本，**功能上无 bug**，但 `.toSorted()` 语义更清晰且避免副本开销感知歧义。
- `Leaderboard.tsx:60` 同样在副本上排序，无 bug，但建议统一改 `.toSorted()`。
- `SessionResult.tsx:36` 在 `Object.entries().filter().map()` 链末尾接 `.sort()`，返回新数组，无突变风险，但仍建议 `.toSorted()` 保持一致性。

**修复示例**（`AchievementBadges.tsx:35`）：
```typescript
// 修改前
const sorted = [...records].sort((a, b) => a.createdAt - b.createdAt);
// 修改后
const sorted = records.toSorted((a, b) => a.createdAt - b.createdAt);
```

> **优先级**：低-中。功能无 bug，但应统一为 `.toSorted()` 以符合不可变性约定。TS 7 + ES2023 target 已支持。

---

### 🟡 P2：`&&` 条件渲染可能渲染 `0`（规则 6.9 `rendering-conditional-render`）

**影响**：LOW — 当条件为 `0`/`NaN` 等 falsy 值时会渲染出字面量。

**违规示例**（共 47 处 `&&` 条件渲染，需逐个甄别）：

`src/features/onboarding/components/OnboardingFlow.tsx:68-72`：
```tsx
{currentStep === 0 && <WelcomeStep />}
{currentStep === 1 && <ProfileStep />}
```
✅ 安全（`===` 比较返回 boolean）

`src/features/progress/components/replay/ProgressHero.tsx:62`：
```tsx
{hasEloData && <Chart>...}
```
✅ 安全（boolean）

**真正需关注的场景**（数值型条件）：
```tsx
// 危险模式：count 为 0 时会渲染 "0"
{count && <Badge>{count}</Badge>}
// 正确模式
{count > 0 ? <Badge>{count}</Badge> : null}
```

**建议**：对项目内 47 处 `&&` 逐个甄别，凡条件可能是数值/字符串的位置改为三元。本次审查未发现明确的 `0` 渲染 bug，但建议加入 ESLint 自定义规则预防。

---

### 🟡 P3：`PracticeDrill.tsx` Effect 过密，存在派生 state 用 Effect 嫌疑（规则 5.1 `rerender-derived-state-no-effect`）

**影响**：MEDIUM — 该文件 8 个 `useEffect`，部分可用派生值替代。

**具体位置**：

`src/features/strategy-academy/components/PracticeDrill.tsx:253-260`：
```typescript
// 压力模式：每 5 题难度递增
useEffect(() => {
  if (!isPressure) return;
  const level = Math.min(Math.floor(currentIndex / 5), 2);
  const newDiff = DIFFICULTY_ORDER[level]!;
  if (newDiff !== currentDifficulty) {
    setCurrentDifficulty(newDiff);
  }
}, [currentIndex, isPressure, currentDifficulty]);
```
**问题**：压力模式下难度完全由 `currentIndex` 派生，可在渲染时直接计算：
```typescript
const currentDifficulty = isPressure
  ? DIFFICULTY_ORDER[Math.min(Math.floor(currentIndex / 5), 2)]!
  : /* 自适应模式另算 */;
```
但该组件同时有自适应模式（`adaptive`）需要根据答题历史动态调整难度，两者交织，重构需谨慎。

`PracticeDrill.tsx:290-303`（超时处理 Effect）：
```typescript
useEffect(() => {
  if (timeRemaining === 0 && timeLimit > 0 && !isAnswered && !finished && currentQuestion) {
    // ... 调用 handleSelect(fallbackOption, true)
  }
}, [timeRemaining, timeLimit, isAnswered, finished, currentQuestion]);
```
**问题**：Effect 内调用 `handleSelect`（含 `setState`），属于"用 Effect 响应 state 变化"模式（规则 5.8 `rerender-move-effect-to-event`）。更佳做法是在倒计时归零的 `setTimeRemaining` 回调内直接触发超时处理，而非用另一个 Effect 监听 `timeRemaining`。

**建议**：标记为技术债，后续重构时优先处理这两个 Effect。

---

### 🟡 P4：`Leaderboard.tsx` useMemo 中用 `.sort()` 链（规则 7.14 + 5.9）

`src/features/progress/components/achievement/Leaderboard.tsx:54-75`：
```typescript
const leaderboard = useMemo(() => {
  let all: LeaderboardEntry[];
  switch (activeTab) {
    case 'accuracy':
      all = [...MOCK_PLAYERS, userEntry]
        .sort((a, b) => b.accuracy - a.accuracy)
        .map((p, i) => ({ ...p, rank: i + 1 }));
      break;
    // ...
  }
  return all;
}, [activeTab, userEntry]);
```
**问题**：
1. `.sort()` 应改 `.toSorted()`（虽在副本上，语义一致性）
2. `userEntry` 依赖 `t`（i18n），`t` 函数引用在语言切换时可能变化导致重算，可接受。

**修复**：
```typescript
all = [...MOCK_PLAYERS, userEntry]
  .toSorted((a, b) => b.accuracy - a.accuracy)
  .map((p, i) => ({ ...p, rank: i + 1 }));
```

---

### 🟢 P5：`lucide-react` barrel 导入（规则 2.1 `bundle-barrel-imports`）

**影响**：LOW — `lucide-react` 104 处具名导入（如 `import { Trophy, Medal } from 'lucide-react'`）。

**说明**：`lucide-react` 本身支持 tree-shaking（每个图标独立 ESM 子路径），Vite/Rollup 能正确摇树。**实际 bundle 体积无影响**。规则 2.1 主要针对 `lodash`/`@mui/material` 等非 tree-shakable barrel。此条**可不改**，若想极致优化可改子路径导入：
```typescript
import Trophy from 'lucide-react/dist/esm/icons/trophy'
```
但会牺牲可读性，**不推荐**。

---

### 🟢 P6：`ConceptGraph.tsx` resize 监听未用 passive（规则 4.2）

`src/features/strategy-academy/components/ConceptGraph.tsx:314`：
```typescript
window.addEventListener('resize', check);
```
**说明**：`resize` 事件不像 `scroll`/`touchmove` 那样高频触发布局抖动，passive 收益有限。但建议统一加 `{ passive: true }` 习惯。`check` 函数仅 `setIsMobile`，无 `preventDefault`，加 passive 安全。

---

## 四、未涉及但需关注的规则

以下规则因项目特性（纯前端 SPA、无 SSR、无 server actions）**不适用**，无需检查：

| 规则类别 | 不适用原因 |
|---|---|
| 1.1-1.4 消除瀑布流（async-cheap-condition / async-defer / async-api-routes） | 纯前端无 API routes，无 server-side await 链 |
| 3.1-3.10 Server-Side Performance 全部 | 无 SSR / RSC / server actions |
| 4.3 SWR 去重 | 项目无远程数据请求，全本地 zustand + IndexedDB |
| 6.5-6.6 Hydration Mismatch | 纯 CSR（`createRoot`），无 hydration |
| 6.8 Script defer/async | 无第三方 script 注入 |
| 6.10 React DOM Resource Hints | `prefetchDNS`/`preconnect` 对纯本地 SPA 无意义 |
| 8.1-8.4 Advanced Patterns | `useEffectEvent` 仍是实验性 API，React 19.2 未稳定 |

---

## 五、建议的改进清单（按优先级）

| 优先级 | 改进项 | 涉及文件 | 工作量 |
|---|---|---|---|
| P1 | `.sort()` → `.toSorted()` 统一 | 6 个文件（见上表） | 小（机械替换） |
| P2 | 甄别 47 处 `&&` 条件渲染，数值型改三元 | 全项目 tsx | 小（加 ESLint 规则预防） |
| P3 | 重构 `PracticeDrill.tsx` 压力模式难度 Effect 为派生值 | PracticeDrill.tsx | 中（需测试） |
| P3 | 超时处理 Effect 改为在倒计时回调内直接触发 | PracticeDrill.tsx | 中（需测试） |
| P5 | （可选）加 ESLint 规则禁止 `lucide-react` barrel 导入 | eslint.config.js | 小（不推荐改子路径） |
| P6 | resize 监听加 `{ passive: true }` | ConceptGraph.tsx | 极小 |

---

## 六、结论

项目整体**较好地遵循了 React 最佳实践**，尤其在路由懒加载、i18n 并行预加载、vendor 分包、localStorage 版本化持久化、scroll passive 监听等方面表现优秀。

主要改进空间集中在：
1. **数组不可变性**：统一使用 `.toSorted()` 替代 `.sort()`（功能无 bug，但语义一致性）
2. **条件渲染健壮性**：甄别 `&&` 条件渲染，预防数值型 `0` 渲染
3. **Effect 治理**：`PracticeDrill.tsx` 部分 Effect 可改为派生值或事件处理

未发现严重的性能反模式（如组件内定义组件、未清理的事件监听器、SSR 瀑布流等）。建议优先处理 P1（机械替换，低风险高收益）。
