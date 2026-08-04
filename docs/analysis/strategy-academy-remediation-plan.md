# 策略学院修复计划（Remediation Plan）

**制定日期**: 2026-08-04  
**版本**: v1.0  
**状态**: Ready for Execution

---

## 🔍 一、问题清单与优先级排序

### P0 级 - 致命错误（立即修复）⭐⭐⭐

| ID | 问题描述 | 文件/位置 | 影响面 | 预计工作量 | 责任人 |
|----|---------|----------|--------|-----------|--------|
| P0-01 | quizShuffle.test.ts #4 "选项集合不变"测试失败 | utils/quizShuffle.test.ts:86 | 1/384 tests failed | 1 hour | code-reviewer |
| P0-02 | L5-short-deck JTs 价值夸大 | levels/level5.ts:592-647 | 误导性内容 | 1-2 days | strategy-academy-dev |
| P0-03 | sd-q5 双答案问题 | levels/level5.ts:647 | 题库有效性 | 2 hours | strategy-academy-dev |

### P1 级 - 重要问题（尽快修复）⭐⭐

| ID | 问题描述 | 文件/位置 | 影响面 | 预计工作量 | 责任人 |
|----|---------|----------|--------|-----------|--------|
| P1-01 | L1/L2 UTG KJo 弃牌矛盾 | levels/level1.ts + level2.ts | 跨课一致性 | 2 hours | strategy-academy-dev |
| P1-02 | L1/L2 BTN 范围数值冲突 | levels/level1-position.ts | 内容准确性 | 1 hour | strategy-academy-dev |
| P1-03 | L2 Drill 3-Bet 尺度不统一 | levels/level2.ts:970-1009 | 教学内容混淆 | 1 hour | strategy-academy-dev |
| P1-04 | ICM 公式推导缺失 | levels/level6.ts | 教学深度不足 | 半天 | progress-dev |
| P1-05 | 数值精度问题汇总 | 多文件 | 专业性能 | 半天 | strategy-academy-dev |

### P2 级 - 优化建议（可选）⭐

| ID | 问题描述 | 文件/位置 | 优先级 | 预计工作量 | 责任人 |
|----|---------|----------|--------|-----------|--------|
| P2-01 | 排版可读性增强 | 多课程 | ⭐⭐ | 1 week | ui-ux-dev |
| P2-02 | 国际化迁移准备 | i18n/locales | ⭐ | 1 week | platform-dev |
| P2-03 | 评测系统增强 | store.ts | ⭐⭐ | 3 days | progress-dev |
| P2-04 | TD-001 lessonId 重复治理 | data/levels | ⭐⭐ | 2 hours | platform-dev |

---

## 👥 二、子代理指派与职责分工

### A. 内容修复专家 (strategy-academy-dev)

**职责范围**: (根据 AGENTS.md 第 236 行)
- ✅ Strategy Academy 模块内全部课程/Drill/QuickDrill 修复
- ✅ 短牌/GTO/锦标赛等策略内容准确性
- ✅ 跨课程口径统一与数值精度校准

**当前任务列表**:
1. **P0-02**: L5-short-deck 整课重写（1-2 天）⭐优先级最高
2. **P0-03**: sd-q5 双答案修正（2 小时）
3. **P1-01~P1-03**: 跨课程口径统一（3 小时）
4. **P1-05**: 数值精度校准（半天）
   - 调研权威 6+资料（Upswing/PokerCoaching solver）
   - 修正 JTs/AK等高牌价值表述
   - 更新短牌起手牌范围标准
   - 验证修复后通过 curriculumIntegrity.test.ts

2. **P0-03**: sd-q5 双答案修正（2 小时）
   ```typescript
   // src/features/strategy-academy/data/levels/level5.ts:647
   { 
     id: 'sd-q5', 
     question: '短牌德州中同花 beats 什么？', // 改为"最接近的排名差异是？"
     options: ['同花 > 顺子', '葫芦 > 四条', '三条 > 两对', '一对 > 高牌'],
     correctIndex: 0, // 仅保留"同花 > 顺子"
     explanation: '短牌中同花 beats 葫芦...（修正说明）' 
   },
   ```

3. **P1-01~P1-03**: 跨课程口径统一（3 小时）
   - L1 hand-selection: UTG KJo 改为"可 open（边缘牌）"
   - L2 drill-l2-3bet: 统一尺度为 IP 7.5-8BB / OOP 9-10BB
   - L1 position: BTN 范围统一为"40-50%（现代 6-max 标准）"

4. **P1-05**: 数值精度校准（半天）
   - l6-icm-ex2: betSize=8→25（all-in）
   - l7-hu-p5: potSize=18.5→19
   - l7-deep-p4: call cost 3BB→2BB

**验收标准**:
- ✅ 修改后 curriculumIntegrity.test.ts 全部通过
- ✅ 数学计算经第三方验证器复核
- ✅ 无 new test failures introduced

---

### B. 跨模块集成专家 (platform-dev)

**职责范围**: (根据 AGENTS.md 第 227 行)
- ✅ Platform 基础层：脚手架/布局/路由/shared 层/跨模块集成
- ✅ TD-001 lessonId 命名空间治理
- ✅ Store persist version bumping + migrate

**当前任务列表**:
1. **TD-001**: lessonId 命名空间治理（2 小时）
2. **Store persist version bumping**（1 小时）
   ```typescript
   // src/features/strategy-academy/data/courses.ts
   export const LOCAL_LESSONS = [
     { id: 'local-limp-intro', ... }, // 加前缀避免冲突
     { id: 'local-limp-isolate', ... },
     // ... 所有 localLessons 添加 'local-' 前缀
   ];
   
   // 建立 ID 审计工具
   function checkDuplicateIds(): void {
     const allIds = new Set();
     [...LEVELS.flatMap(l=>l.lessons), ...LOCAL_LESSONS]
       .forEach(l => { if(allIds.has(l.id)) throw Error(`Dup: ${l.id}`); allIds.add(l.id); });
   }
   ```

2. **Store persist version bumping**（1 小时）
   - 修改 `src/features/strategy-academy/store.ts` version
   - 添加 migrate 处理逻辑
   - 编写 persist-shape.test.ts 守卫

**验收标准**:
- ✅ 无重复 lessonId 警告
- ✅ Store migrate 测试通过
- ✅ persist version 变更有 guard test

---

### C. 进度统计专家 (progress-dev)

**职责范围**: (根据 AGENTS.md 第 233 行)
- ✅ Progress 跨模块状态/Dashboard/统计图表
- ✅ ICM 公式推导补充
- ✅ 评测系统增强

**当前任务列表**:
1. **P1-04**: ICM 公式推导补充（半天）
2. **P2-03**: 评测系统增强（3 天）
   ```typescript
   // src/features/strategy-academy/utils/quizShuffle.test.ts:86
   it('④ 选项集合不变（仅顺序改变），且不修改原对象', () => {
     const textQuestionOptionsBefore = [...textQuestion.options];
     const numericQuestionOptionsBefore = [...numericQuestion.options];
     
     // 仅验证 QuizQuestion 类型（纯字符串数组）
     for (const q of [textQuestion, numericQuestion]) {
       const ordered = orderQuizQuestion(q);
       expect([...ordered.options].sort()).toEqual([...q.options].sort());
       expect(ordered.options.length).toBe(q.options.length);
     }
     
     // 验证原对象未修改
     expect(textQuestion.options).toEqual(textQuestionOptionsBefore);
     expect(numericQuestion.options).toEqual(numericQuestionOptionsBefore);
   });
   
   // DrillQuestion 验证分离到独立的 orderDrillOptions 测试
   ```

2. **新增守卫测试**（半天）
   - 数字精度守护（potSize/effectiveStack）
   - 卡牌格式合法性守护（正则校验）
   - EV 计算公式一致性守护

**验收标准**:
- ✅ 384/384 tests passed（目标）
- ✅ quizShuffle.test.ts 10/10 passed
- ✅ 新增 guard tests 覆盖核心业务规则

---

### D. UI/UX设计守护 (ui-ux-dev)

**职责范围**: (根据 AGENTS.md 第 228 行)
- ✅ 设计语言守护/全局视觉一致性/组件质感
- ✅ 排版可读性增强
- ✅ WCAG 2.1 AA无障碍标准

**当前任务列表**:
1. **P2-01**: 排版可读性增强（1 周）
2. 协助 i18n 国际化框架搭建（与 help-center-dev 协同）
   - L4A EV 章节：增加可视化图表
   - L4B MDF/Alpha：分步推导图示
   - 使用 Recharts/Framer-motion 辅助说明

2. **P2-02**: 国际化迁移准备（1 周）
   ```json
   // src/i18n/locales/zh.json
   {
     "academy": {
       "l5_short_deck": {
         "hand_value_changes": "手牌价值变化",
         "connected_cards": "连牌（如 JTs, 98s）在短牌中更容易组成顺子",
         "ace_king_value": "AK 等高牌在短牌中价值提升"
       }
     }
   }
   ```

**验收标准**:
- ✅ WCAG 2.1 AA 无障碍标准
- ✅ 双语切换功能正常
- ✅ 响应式布局完整

---

## 🚀 三、执行流程与时间表

### Phase 0: P0 紧急修复（Day 1-2）

```powershell
# Day 1
🕘 09:00 - 10:00: code-reviewer 修复 quizShuffle.test.ts #4
🕘 10:00 - 10:30: verify 验证（pnpm test --filter quizShuffle）
🕘 11:00 - 13:00: strategy-academy-dev 开始 P0-02 L5-short-deck 调研
🕒 14:00 - 17:00: strategy-academy-dev 完成 L5-short-deck 重写

# Day 2
🕘 09:00 - 11:00: strategy-academy-dev P0-03 sd-q5 双答案修正
🕘 11:00 - 12:00: verification pass-through（curriculumIntegrity + test）
🕔 14:00 - 16:00: 回归测试（全量 pnpm test）
🕔 16:00 - 17:00: bugfix logging & report generation
```

**Day 1 Deliverables**:
- ✅ quizShuffle.test.ts 10/10 passed
- ✅ L5-short-deck 内容准确率 100%
- ✅ 无 regression test failures

---

### Phase 1: P1 重要修复（Day 3-4）

```powershell
# Day 3
🕘 09:00 - 11:00: strategy-academy-dev P1-01 UTG 口径统一
🕘 11:00 - 13:00: strategy-academy-dev P1-02 BTN 范围数值
🕒 14:00 - 16:00: strategy-academy-dev P1-03 3-Bet 尺度统一

# Day 4
🕘 09:00 - 11:00: progress-dev P1-04 ICM 公式推导
🕘 11:00 - 13:00: strategy-academy-dev P1-05 数值精度校准
🕒 14:00 - 17:00: full regression testing + documentation
```

**Day 3-4 Deliverables**:
- ✅ L1/L2 跨课程内容一致
- ✅ ICM 教程包含完整算例
- ✅ 所有 potSize/effectiveStack 自洽

---

### Phase 2: P2 优化项（Week 2-3）

```powershell
# Week 2
🗓️ Mon-Tue: platform-dev TD-001 lessonId 治理
🗓️ Wed-Thu: code-reviewer 新增守卫测试
🗓️ Fri: verification & cleanup

# Week 3
🗓️ Mon-Fri: ui-ux-dev 排版优化 + 国际化框架
```

**Week 2-3 Deliverables**:
- ✅ 无 duplicate lessonId
- ✅ 测试覆盖率提升至 95%+
- ✅ i18n 框架 ready for zh/en switch

---

## 📊 四、质量门禁与验收标准

### 硬指标（必须 100% 满足）

| 项目 | 目标值 | 验收方式 |
|------|-------|---------|
| typecheck | exit 0 | `corepack pnpm typecheck` |
| lint | exit 0 | `corepack pnpm lint` |
| unit tests | 384/384 passed | `corepack pnpm test` |
| build | success | `corepack pnpm build` |
| curriculumIntegrity | 8/8 passed | 专项测试 |

### 软指标（推荐达成）

| 项目 | 目标值 | 测量方法 |
|------|-------|---------|
| 测试覆盖率 | ≥95% | nyc/istanbul |
| P0 遗留问题 | 0 | issue tracker |
| 内容准确性 | 100% | manual review |
| 跨课程一致性 | 100% | comparison matrix |

---

## 📝 五、交付物清单

### 必需交付物
1. ✅ **修复报告**: `docs/analysis/strategy-academy-remediation-report.md`
2. ✅ **测试证据**: 所有通过的 test suites 输出日志
3. ✅ **变更记录**: CHANGELOG.md 条目
4. ✅ **审计报告**: 更新后的 audit report

### 可选交付物
- 📄 修复前后对比矩阵
- 📄 数学计算验证器（独立脚本）
- 📄 跨课程一致性检查表

---

## 🔄 六、协作机制

### 每日站会（Daily Standup）
- **时间**: 每个工作日 09:00（本地）
- **形式**: GitHub issue comment / Slack thread
- **内容**: 昨日完成 / 今日计划 / 阻塞问题

### 代码审查流程
1. 子代理提交 PR → `feature/fix-{topic}`
2. 指定 reviewer（platform-dev 或 UI-UX dev）
3. CI 自动运行（typecheck + lint + test）
4. 人工审查（content accuracy + architecture alignment）
5. Merge to main

### 问题升级路径
```
Blocker → Subagent lead → Platform lead → Project owner
   ↓          ↓                  ↓              ↓
  2h        4h                 1 day          2 days
```

---

## 🎯 七、成功定义

### Minimum Viable Success（MVS）
- ✅ P0 问题全部修复（quizShuffle + L5-short-deck + sd-q5）
- ✅ 384/384 tests passed
- ✅ curriculumIntegrity 8/8 passed

### Full Success（理想状态）
- ✅ P0+P1 问题全部解决（46 条中的全部 P0/P1）
- ✅ 测试覆盖率 ≥95%
- ✅ 无技术债累积（TD-001 治理完成）
- ✅ 国际化框架 ready for production

---

## 📞 八、联系人与资源

| 角色 | 人员/代理 | 联系方式 | 职责 |
|------|---------|---------|------|
| Project Lead | Qoder | System | 总体协调 |
| Content Expert | strategy-academy-dev | `.claude/agents/strategy-academy-dev.md` | 内容修复 |
| Code Quality | platform-dev | `.claude/agents/platform-dev.md` | 架构修复 |
| Testing | code-reviewer | Built-in | 测试修复 |
| UX/UI | ui-ux-dev | `.claude/agents/ui-ux-dev.md` | 体验优化 |

**参考资源**:
- `docs/PRD.md` 5.16 策略学院规格
- `docs/TDD.md` 5.8 技术设计
- `docs/analysis/strategy-academy-audit-report.md` 审计报告
- `.claude/agents/` 子代理规范文档

---

## 📋 附录：修复任务跟踪表

| Task ID | 负责人 | 状态 | 开始日期 | 预计完成 | 实际完成 | 备注 |
|---------|--------|------|---------|---------|---------|------|
| P0-01 | code-reviewer | In Progress | 2026-08-04 | 2026-08-04 | TBD | quizShuffle |
| P0-02 | strategy-academy-dev | Not Started | TBD | TBD | TBD | Short deck rewrite |
| P0-03 | strategy-academy-dev | Not Started | TBD | TBD | TBD | Double answer fix |
| P1-01 | strategy-academy-dev | Not Started | TBD | TBD | TBD | UTG consistency |
| P1-02 | strategy-academy-dev | Not Started | TBD | TBD | TBD | BTN range |
| P1-03 | strategy-academy-dev | Not Started | TBD | TBD | TBD | 3-Bet scale |
| P1-04 | progress-dev | Not Started | TBD | TBD | TBD | ICM example |
| P1-05 | strategy-academy-dev | Not Started | TBD | TBD | TBD | Numerical accuracy |

**更新时间**: 2026-08-04 13:00  
**下次更新**: 每日站会后
