# Theory Academy 全面排查与内容扩充执行方案（v2.0 细化版）

## 〇、方案文档落盘（执行第一步）

计划确认后，首先将本方案完整写入 **`docs/theory-academy-audit-plan.md`**（docs/ 根目录，作为本次任务的执行蓝本与审计档案），内容即本计划全文（含下述九章）。后续所有 Phase 的进展与偏差均以该文件为对照基准，最终验收时归档保留。

---

## 一、总体目标与范围确认

### 1.1 已确认需求
- **内容扩充**：T1-T9 全部 26 章系统性深度扩充
- **对照标准**：三者兼顾（概念一致性 + 数学推导完整性 + 实战案例覆盖度）
- **教材范围**：Harrington on Hold'em (Vol.1/2)、The Theory of Poker、MSSA、Modern Poker Theory、The Mathematics of Poker (MOP)、The Mental Game of Poker、Thinking in Bets、Applications of NLHE 全部纳入对照体系
- **文档同步**：PRD + TDD + CHANGELOG 三层全部更新
- **子代理协作**：方案明确 theory-academy-dev 任务清单、协作流程与质量门禁

### 1.2 事实源锚点
| 项目 | 位置 |
|------|------|
| 产品规格 | `docs/PRD.md` 5.27 理论学院（L1113-1158） |
| 技术设计 | `docs/TDD.md` 5.8b Theory Academy（L1089-1117） |
| 子代理职责 | `.claude/agents/theory-academy-dev.md` |
| 课程数据 | `src/features/theory-academy/data/levels/theoryLevel1~9.ts` + `index.ts` |
| 数据守卫 | `src/features/theory-academy/data/theoryIntegrity.test.ts` |
| 持久化事实源 | `src/features/theory-academy/store.ts`（persist `theory-academy-progress`，version 1） |
| 跨模块白名单 | `src/features/strategy-academy/data/curriculumIntegrity.test.ts` 的 `CROSS_MODULE_LESSON_IDS` |

### 1.3 执行阶段总览
```
Phase 1: 代码缺陷排查与修复（全量 verify 绿）
   ↓
Phase 2: 内容扩充实施（4 批：P0 中级 T4-T6 → P1 基础/对手 T2/T3/T7 → P2 概率 T1 → P3 高级 T8/T9）
   ↓
Phase 3: 功能测试 + 用户体验验证 + 性能检查
   ↓
Phase 4: 文档同步（PRD 5.27 / TDD 5.8b / CHANGELOG）+ 最终验收
```

---

## 二、Phase 1：代码缺陷排查与修复

### 2.1 theory-academy-dev 任务清单（P1-01 至 P1-18，逐项执行打勾）

| # | 任务 | 目标文件 | 验证方法 | 预期结果 |
|---|------|---------|---------|---------|
| P1-01 | URL 直达门禁验证 | `components/TheoryChapterView.tsx:49-53` | 模拟未解锁 Level 章节 URL（如未完成 T4 直接访问 `/theory/chapter/t5-game-theory`） | 重定向至 `/theory`，不渲染内容 |
| P1-02 | Level 解锁链条验证 | `store.ts:82-86` + `utils/theoryProgress.ts:45-52` | 构造 9 级解锁用例：完成 T(n-1) 全部章节 → Tn 解锁；缺 1 章 → 不解锁 | `isTheoryLevelUnlocked` 与 `isLevelUnlockedByCompleted` 口径一致 |
| P1-03 | debug 旁路短路验证 | `shared/stores/debugMode.ts` + `TheoryChapterView.tsx:51` | 激活调试解锁后访问任意 Level 章节 | 全部放行，无门禁拦截 |
| P1-04 | persist migrate 兼容验证 | `store.ts:105-114` + `store.migrate.test.ts` | 预置 v0 异常数据（progress 缺字段）触发 rehydrate | 缺失字段注入默认值、已有字段不被触碰（回归确认已有测试） |
| P1-05 | completeChapter 幂等验证 | `store.ts:46-78` | 同一 chapterId 连续调用 2 次 | completedChapters 无重复；quizScores 取历史最高分；事件仅 emit 一次 |
| P1-06 | StrictMode 双跑防护验证 | `components/TheoryQuiz.tsx:42-49` | 空题库 + StrictMode 渲染 | `onComplete(100,0,0)` 仅触发 1 次（TheoryQuiz.test.tsx 回归） |
| P1-07 | 下一章导航跨 Level 顺延 | `utils/theoryProgress.ts:20-25` + `components/NextChapterNav.tsx` | T1 末章 → T2 首章；T9 末章 → undefined | 顺延正确；T9 末章不渲染导航 |
| P1-08 | 未解锁降级文案 | `components/NextChapterNav.tsx:20-26` | 下一章所属 Level 未解锁 | 显示锁定提示文案而非可点击按钮 |
| P1-09 | 已完成章节回访复习 | `components/TheoryChapterList.tsx` + `TheoryChapterView.tsx:66-68` | 点击已完成章节 → 阅读页显示"已完成 + 最高分"，免重考导航 | 正常进入，无数据风险 |
| P1-10 | 小测状态机流转 | `components/TheoryQuiz.tsx:32-35,67-77` | 答题流程：选择 → 解析 → 下一题 → 末题结算 | 各阶段 UI 切换正常，score = round(correct/total*100) |
| P1-11 | ELO/情绪更新接线 | `components/TheoryQuiz.tsx:63-64` + progress store | 每题作答后检查 progress store | `updateElo(dimension, correct, difficulty)` 与 `recordAnswer(correct)` 均被调用，dimension 合法 |
| P1-12 | Session 止损拦截 | `TheoryChapterView.tsx:57` + `SessionLimitGuard` | 每日题量达上限后进入小测阶段 | 渲染 SessionLimitGuard，阅读仍可进行 |
| P1-13 | 实践桥接渲染条件 | `TheoryChapterView.tsx:169` + `PracticeBridgeCard.tsx` | Level 全部完成 → 显示推荐卡；未完成 → 不显示 | 条件正确 |
| P1-14 | 课程 ID 引用完整性 | `data/levels/index.ts` practiceRecommendations | 运行 `theoryIntegrity.test.ts` 镜像白名单守卫 | 23 个引用 ID 与白名单一致（回归确认） |
| P1-15 | trackId 跳转链路 | `PracticeBridgeCard.tsx:43-52` → `LearningTracksView.tsx` | 点击"进入推荐学习轨道" | 携带 `?track=` 跳转 `/academy/tracks`，目标轨道滚动高亮（P1E-01 链路） |
| P1-16 | 选项排序出口验证 | `components/TheoryQuiz.tsx:25-28` + `utils/quizOrder.ts` | 运行 `quizOrder.test.ts`（correctIndex 重映射 / 确定性 / 分布守卫 <50%） | 全部通过；源题库静态数据未被手改重排 |
| P1-17 | 数据完整性全量回归 | `data/theoryIntegrity.test.ts` | 运行 7 个测试用例 | ID 唯一/前缀/题数 3-5/选项合法/内容非空/eloDimension/白名单镜像全部通过 |
| P1-18 | 新增章节结构合规预检 | Phase 2 新扩充章节 | 每章编写后立即运行 integrity 测试 | 结构合法再进入下一章 |

### 2.2 修复优先级与判定标准
| 级别 | 问题类型 | 判定标准 | 处理时限 |
|------|---------|---------|---------|
| P0 | 门禁失效 / 进度丢失或重复计数 / 选项作弊风险 | 任一测试失败或手工验证不符 | 立即修复，阻断后续任务 |
| P1 | 导航错误跳转 / 小测交互异常 / 桥接悬空链接 | 功能可用但有瑕疵 | 当批内修复 |
| P2 | UI 细节 / i18n 文案 / 动画节奏 | 不影响功能 | 记录 issue，Phase 3 统一处理 |

### 2.3 质量门禁验证命令（每次代码变更后必跑）
```powershell
pnpm verify   # typecheck && lint && test 串行短路
pnpm test src/features/theory-academy
pnpm test src/features/strategy-academy/data/curriculumIntegrity.test.ts
pnpm build
```

---

## 三、Phase 2：内容扩充实施（4 批按优先级）

### 3.1 批次排序与分工

| 批次 | 优先级 | Level | 章节数 | 重点扩充方向 | 对照教材 |
|------|--------|-------|--------|-------------|---------|
| 批1 | P0 | T4 范围理论 | 3 | 范围构建方法论、Blockers 定量应用、范围/坚果优势牌面判定框架 | MSSA Ch.1-4、Applications of NLHE Range Construction |
| 批1 | P0 | T5 博弈论基础 | 4 | MDF/Alpha 代数推导、无差别原则证明、节点锁定实操 | MOP Ch.5-8、Modern Poker Theory Ch.1-3 |
| 批1 | P0 | T6 下注理论 | 3 | 极化/线性尺度数学依据、SPR 几何规划推导、阻塞注均衡 | MOP Ch.9-10、Modern Poker Theory Sizing |
| 批2 | P1 | T2 期望值与赔率 | 3 | EV 完整推导链、隐含赔率公式化、Set Mining 精确概率 | Harrington Vol.1 Ch.3-4、The Theory of Poker Ch.6 |
| 批2 | P1 | T3 位置与起手牌 | 3 | 权益实现率量化、Gap Concept 现代修正、起手牌 EV 分层 | Harrington Vol.1 Ch.5、The Theory of Poker Ch.2-3 |
| 批2 | P1 | T7 对手分析 | 4 | HUD 指标组合解读、类型学动态漂移、读牌四步法细化 | Applications of NLHE Ch.7、Poker HUDs 分析 |
| 批3 | P2 | T1 概率论基础 | 3 | 组合计数推导过程、2/4 法则误差分析、方差标准差公式 | MOP Ch.1-3、Harrington Vol.1 Ch.2 |
| 批4 | P3 | T8 扑克心理学 | 4 | Tendler 7 型 Tilt 扩展、认知偏差清单化、资金心理量化 | The Mental Game of Poker、Thinking in Bets |
| 批4 | P3 | T9 经典理论综合 | 4 | MOP 玩具博弈详解、ICM 递归算法、多人底池胜率表 | MOP Synthesis、ICM Theory、Multiway Theory |

### 3.2 每章扩充标准（theory-academy-dev 逐章检查清单）

#### 3.2.1 概念讲解（content 数组）
- [ ] 核心定义与经典教材术语一致（如 Sklansky 基本定理表述）
- [ ] 关键公式必须展示推导过程而非仅结论
  - 例 T1：`C(52,2) = 52×51/2 = 1326` 需说明为何除以 2（组合无序）
  - 例 T5：MDF 推导 `对手诈唬 EV = f×P − (1−f)×B = 0 → f = P/(P+B) = 1/(1+b)`
  - 例 T6：几何尺度三街公式推导
- [ ] 每章至少 2-3 个不同场景实战牌例（翻前/翻后、价值/诈唬、浅/深筹码）
- [ ] 标注反直觉点与认知误区（赌徒谬误、MDF 滥用、沉没成本）
- [ ] pro-tip 来自教材实战技巧（Harrington M 值法、Tendler Tilt 档案）
- [ ] 段落类型覆盖 text/heading/highlight/key-point/formula/example/pro-tip，禁止纯 text 堆砌

#### 3.2.2 章末小测（quiz 数组）
- [ ] 题型多样性：记忆型（定义）/ 理解型（公式应用）/ 分析型（牌例判断）三类覆盖
- [ ] 干扰项来自真实玩家常见误解
- [ ] explanation 说明"为何对"+"为何其他选项错"
- [ ] 题数保持 3-5 题（integrity 测试硬约束）

#### 3.2.3 数据文件硬性约束
- 章节 ID 前缀 `t<level>-` 全局唯一；quiz 题 ID 前缀 `t<chapter>-`
- 新增章节必须声明 `eloDimension`（preflop/postflop/math/handReading/mental）
- 不新增 i18n key（理论正文为内联中文，与策略学院口径一致）
- 版权规避：思想复述 + 通用数学表述，禁止逐字复制受版权教材原文；出处以"（概念源自：XXX 教材 YY 章）"脚注式标注

### 3.3 经典教材对照体系实施细节

#### 3.3.1 对照索引表（写入 PRD 附录）
| 教材 | 章节 | 核心概念 | 本项目落点 |
|------|------|---------|-----------|
| The Theory of Poker (Sklansky) | Ch.2-3 | Fundamental Theorem / Gap Concept | T3 第 3 章、T3 第 2 章 |
| Harrington on Hold'em Vol.1 | Ch.3-4 | EV / Pot Odds / Implied Odds | T2 全部 3 章 |
| The Mathematics of Poker | Ch.5-8 | MDF / Alpha / Indifference | T5 第 3-4 章 |
| Modern Poker Theory (Acevedo) | Ch.1-3 | GTO 基础 / 求解器 | T5 第 2 章 |
| MSSA | Ch.1-4 | 范围构建 / Blockers | T4 全部 3 章 |
| The Mental Game of Poker (Tendler) | 全册 | 7 型 Tilt / A-Game | T8 全部 4 章 |
| Thinking in Bets (Duke) | Ch.1-4 | 结果导向偏差 / 概率思维 | T8 第 4 章 |
| Applications of NLHE (Janda) | Ch.7 | HUD 指标 / 读牌流程 | T7 全部 4 章 |

#### 3.3.2 内容扩充工作流（每章 7 步）
```
Step 1  读取现有章节数据（theoryLevelN.ts 对应章节）
Step 2  对照教材清单逐段审核，输出差距清单（缺失/不准确/需推导）
Step 3  用 SearchReplace 增量修改，新增段落注释标记来源 /* 概念源自: MSSA Ch.2 */
Step 4  新增/修订小测题（3-5 题/章，三类题型覆盖）
Step 5  立即运行 integrity + quizOrder 测试（确保结构合法）
Step 6  人工复核数学准确性（抽算每个公式数值）
Step 7  运行 pnpm verify，通过后进入下一章
```

#### 3.3.3 批次内执行顺序与提交粒度
- 批内按章节 order 逐章执行；每完成一个 Level 做一次 `pnpm verify` + 独立 commit
- 提交格式：`feat(theory-academy): 扩充T4范围理论内容至经典教材标准`

---

## 四、Phase 3：功能测试、用户体验验证与性能优化

### 4.1 功能完整性测试（手动 + 自动化双轨）
| 测试类别 | 用例 | 执行方式 |
|---------|------|---------|
| 门禁 | 未解锁 URL 直达 → 重定向；debug 解锁旁路 | 浏览器手测 + 单测 |
| 进度 | 完成章节 → 刷新 → 进度保持；重考 → 最高分更新 | 浏览器手测（localStorage 检查） |
| 导航 | 首页 → 章节 → 下一章 → 跨 Level → T9 末章无下一章 | 浏览器手测 |
| 小测 | 全对/全错/混合得分计算；解释显示；末题结算 | 浏览器手测 + TheoryQuiz.test.tsx |
| 桥接 | Level 完成 → PracticeBridgeCard → 课程/轨道跳转（9 个 Level 推荐目标均可达） | 浏览器手测 |
| 排序 | 同题多次刷新选项顺序稳定（hash 种子）；数值题升序 | 浏览器手测 + quizOrder.test.ts |
| 成就 | 4 项理论成就（首章/基础段/中级段/全 9 级）解锁 | progress 成就检查验证 |
| 双语 | zh/en 切换后理论主页 chrome 正常 | 浏览器手测 |

### 4.2 用户体验验证方法
1. 桌面端（1280px+）：主页分段展示、Level 卡片展开、章节阅读排版（公式框/示例框视觉）
2. 平板（768-1024px）：两栏折行、进度环尺寸
3. 移动端（<768px）：底部导航"理论学院"入口、触摸目标 ≥44px、章节列表滚动
4. 键盘可达性：Tab 顺序、Enter/Space 触发卡片、aria-label 完整
5. 视觉一致性：对照 `poker-ui-demo/DESIGN_LANGUAGE.md`（四层色彩 token、暗色默认、禁霓虹），ui-ux-dev 复核
6. 公式渲染：formula 段落 font-mono 排版无溢出、换行正确

### 4.3 性能优化建议
| 检查点 | 现状 | 建议 |
|--------|------|------|
| 课程数据体积 | 9 个文件 ~2800 行静态数据 | 已 React.lazy 按路由分割，扩充后复查 bundle 增量 |
| 选项排序计算 | `useMemo` 依赖 `chapter.quiz` | 已缓存；扩充后确认依赖正确（quiz 引用不变则不重算） |
| 章节切换状态重置 | 渲染期同步重置（trackedChapterId 模式） | 已验证无 useEffect 迟滞；扩充后回归确认 |
| 首屏渲染 | TheoryHome 全量渲染 9 个 Level 卡片 | 量级小（9 卡片），无需虚拟化 |
| 测试性能 | vitest 双项目 10s | 新增数据测试在 unit 项目，无 jsdom 开销 |

性能结论：扩充仅增加静态数据体积（预估每 Level +30-50%），不引入运行时计算热点；对比 `pnpm build` 输出确认无 bundle 明显膨胀。

---

## 五、Phase 4：文档同步更新机制

### 5.1 PRD 更新（`docs/PRD.md`，产品规格层，只写 What/Why）
| 位置 | 更新内容 |
|------|---------|
| 5.27 理论学院（L1113 起） | 更新 9 级知识地图表格：每 Level 补充扩充后的知识点列表 |
| 5.27 新增小节"经典教材对照" | 写入 3.3.1 教材→概念→落点映射表（教学权威性说明） |
| 5.27 小测规则 | 补充"选项排序治理"产品规则 |
| 5.27 验收标准（L1158） | 若扩充改变验收口径则同步更新 |

PRD 原则：不写实现细节（文件路径/store actions/persist version 不进 PRD）。

### 5.2 TDD 更新（`docs/TDD.md`，技术设计层，只写 How）
| 位置 | 更新内容 |
|------|---------|
| 5.8b Theory Academy（L1089-1117） | 数据模型章节补充新扩充章节的结构示例、公式段落书写规范（如有变更） |
| 5.8b Store 章节 | 仅当 store schema 变更时更新（预期不变，version 保持 1；若新增字段则 bump + migrate + 更新 L1566 表格与 L1581 迁移记录） |
| 事件总线章节（L865） | 确认 theory-academy emit 合规状态描述与内容一致 |
| persist 表格（L1531/L1566/L1581） | 若 persist 形状变化则同步 |
| 测试矩阵（L1629） | 若新增测试文件则登记 |

TDD 原则：不写执行历史（版本演进归 CHANGELOG）。

### 5.3 CHANGELOG 更新（`docs/CHANGELOG.md`，执行历史层）
```markdown
## 2026-08

### 新增
- 理论学院内容系统性扩充（T1-T9 全部 26 章）
  - T4-T6 中级理论重点加深：范围构建方法论、MDF/Alpha 推导、SPR 几何规划
  - 每章新增数学推导过程与 2-3 个实战牌例
  - 建立 9 本经典德扑教材对照索引（详见 PRD 5.27）
  - 新增/修订章末小测题（保持每章 3-5 题）

### 修复
- （按 Phase 1 实际发现填写，如：门禁校验 XXX / 进度存储 XXX）

### 变更
- PRD 5.27 / TDD 5.8b 同步更新
- （若 persist 变更则记录 v1 → v2 迁移说明）
```

### 5.4 子代理文件更新（`.claude/agents/theory-academy-dev.md`）
- Workflows：补充"内容扩充标准工作流"（3.2/3.3 的 7 步法）
- Constraints：补充"教材对照与版权规避"约束
- Quality Checklist：补充"每章扩充后 integrity 测试"检查项

### 5.5 文档同步时序
```
Phase 2 每批完成 → 即时更新 CHANGELOG（批次记录）
Phase 4 开始 → PRD 5.27 更新（内容规格定稿后）
→ TDD 5.8b 更新（数据模型确认后）
→ 子代理文件更新
→ 最终 CHANGELOG 汇总（全量验证通过后）
```

---

## 六、子代理协作方案（细化）

### 6.1 职责矩阵与触发场景
| 子代理 | 职责 | 触发场景 | 交付物 |
|--------|------|---------|--------|
| theory-academy-dev（主导） | Phase 1 排查修复 + Phase 2 全部内容扩充 + Phase 4 本模块文档部分 | 本次任务全程 | 更新后的 9 个 Level 数据文件、修复后的组件、CHANGELOG 条目 |
| platform-dev | 评估 shared/ 层接口变更、协调跨模块白名单、复核 TDD 架构描述 | ① quizOrder 需改 seededShuffle 接口 ② practiceRecommendations 新增课程 ID ③ TDD 5.8b 结构性更新 | 接口变更评估、白名单同步、TDD 复核意见 |
| progress-dev | 验证 ELO/情绪/成就集成不受内容扩充影响 | Phase 1 完成时、Phase 2 每批完成时 | updateElo/recordAnswer/recordTrainingDay 调用链回归结论 |
| strategy-academy-dev | 验证 CROSS_MODULE_LESSON_IDS 白名单同步 | 仅当 practiceRecommendations 引用变更时（预期本次不变，回归确认） | 白名单一致性确认 |
| ui-ux-dev | 视觉一致性复核（新增内容渲染效果） | Phase 3 用户体验验证时 | 设计契约合规报告（对照 DESIGN_LANGUAGE.md） |

### 6.2 协作流程与接口规范
#### 接口 A：progress store（设计内中枢引用，无越界）
```
theory-academy → progress:
  调用 updateElo(dimension, isCorrect, difficulty)   // 每题作答时
  调用 recordAnswer(isCorrect)                        // 每题作答时
  调用 recordTrainingDay()                            // 章节完成时
约束：只消费公开 action，不写 progress persist schema
验证：progress-dev 回归 statsAggregator / 成就检查测试
```

#### 接口 B：strategy-academy 白名单（数据协调，须经 platform-dev）
```
理论 → 实践引用变更流程：
  1. theory-academy-dev 修改 data/levels/index.ts 的 practiceRecommendations
  2. platform-dev 通知 strategy-academy-dev 更新 curriculumIntegrity.test.ts 的 CROSS_MODULE_LESSON_IDS
  3. 运行双方 integrity 测试（theoryIntegrity 镜像守卫 fail-loud 提醒）
预期：本次仅内容扩充，引用不变，白名单无需改动（回归确认即可）
```

#### 接口 C：shared/ 层（变更归 platform-dev）
```
仅当需要修改 seededShuffle / debugMode / elo types 时才触发；
本次预期不触发（选项排序出口 quizOrder.ts 已封装，内容扩充不涉及算法变更）
```

#### 接口 D：文档同步（平台级复核）
```
theory-academy-dev 提交 PRD 5.27 / TDD 5.8b 草稿
→ platform-dev 复核架构描述一致性（与 AGENTS.md/其他模块文档无冲突）
→ 定稿后合入
```

### 6.3 质量门禁要求（所有子代理通用）
```powershell
pnpm verify   # 每次变更后必跑
pnpm test src/features/theory-academy
pnpm test src/features/strategy-academy/data/curriculumIntegrity.test.ts
pnpm test src/features/progress/utils/statsAggregator.test.ts
pnpm test src/features/progress/store.addRecord.test.ts
```
提交规范：每个逻辑单元独立 commit，格式 `type(theory-academy): description`，禁止多模块批量合并提交。

---

## 七、最终交付物与验收标准

### 7.1 交付物清单
- [ ] **`docs/theory-academy-audit-plan.md`**：本方案文档落盘（第〇章）
- [ ] 9 个 Level 数据文件全部扩充完成（theoryLevel1~9.ts）
- [ ] Phase 1 发现的全部 P0/P1 Bug 修复（附修复清单）
- [ ] `pnpm verify` 全绿（含新增测试）
- [ ] `pnpm build` 成功，bundle 无明显膨胀（对比扩充前后）
- [ ] PRD 5.27 更新（含经典教材对照表）
- [ ] TDD 5.8b 更新（含必要的数据模型补充）
- [ ] CHANGELOG 2026-08 记录
- [ ] theory-academy-dev.md 子代理文件更新

### 7.2 验收标准
| 维度 | 标准 |
|------|------|
| 功能 | URL 门禁/进度持久化/导航/小测/桥接/排序全部手工验证通过 |
| 内容 | 每章至少 2-3 个实战牌例 + 关键公式含推导 + 至少 1 个反直觉点 |
| 教材 | 9 本教材全部纳入对照索引，每 Level 引用 ≥2 本 |
| 测试 | 全量测试通过（预计 400+），integrity 守卫覆盖所有新内容 |
| 文档 | 三层文档同步完成，无事实源冲突 |
| 性能 | 首屏加载无劣化（lazy 已生效），无运行时性能热点 |

---

## 八、风险与应对
| 风险 | 可能性 | 影响 | 应对 |
|------|--------|------|------|
| 内容扩充工作量超预期（每章标准高） | 高 | 严重 | 4 批顺序执行、每 Level 独立验收；批间可暂停，先交付已完成批次 |
| 教材引用版权问题 | 中 | 严重 | 思想复述 + 通用数学表述，禁止原文复制；标注"概念源自"而非引用原文 |
| 扩充引入数学错误 | 中 | 中 | Step 6 人工复核 + 小测答案与正文公式交叉校验 |
| 跨模块协调阻塞 | 低 | 中 | 预期仅回归确认（引用不变）；若需变更白名单走 6.2 接口 B 流程 |
| 文档同步遗漏 | 中 | 低 | 交付物清单打勾制；最终 CHANGELOG 汇总前逐项核对 |

---

## 九、执行时间表
| 阶段 | 内容 | 交付节点 |
|------|------|---------|
| 第〇步 | 方案落盘 `docs/theory-academy-audit-plan.md` | 文件创建完成 |
| Phase 1 | 代码排查修复（P1-01 至 P1-18） | pnpm verify 全绿 |
| Phase 2-批1 | T4 + T5 + T6 内容扩充 | 3 个 Level 扩充完成 + 测试通过 |
| Phase 2-批2 | T2 + T3 + T7 内容扩充 | 3 个 Level 扩充完成 + 测试通过 |
| Phase 2-批3 | T1 内容扩充 | 1 个 Level 完成 + 测试通过 |
| Phase 2-批4 | T8 + T9 内容扩充 | 2 个 Level 完成 + 全量测试 |
| Phase 3 | 功能测试 + UX 验证 + 性能检查 | 验证报告 |
| Phase 4 | 文档同步 + 最终验收 | 三层文档更新 + 验收通过 |

---
*方案版本：v2.0（2026-08-03，细化版）*
*负责人：theory-academy-dev（主导）+ platform-dev（协调）+ progress-dev / strategy-academy-dev / ui-ux-dev（协作）*