# 策略学院 i18n 硬编码文案清点清单

**交付物**: P2-02 国际化迁移规划  
**盘点日期**: 2026-08-04  
**盘点范围**: `src/features/strategy-academy/components/` 全部 .tsx（含 `drills/` 子目录），**不含** `data/` 课程教学内容  
**内容数据决策**: 教学内容（课程正文、测验题目、Drill 题库等）的 i18n 迁移暂缓，需单独评估数据规模与翻译成本，**不在本清单覆盖范围内**。  
**文档用途**: 作为后续 i18n 迭代的 backlog，逐条迁移时由 strategy-academy-dev 子代理按本清单执行。

---

## 统计概览

| 类别 | 文件数 | 硬编码文案条数 |
|------|--------|---------------|
| 页面级组件 | 13 | ~160 |
| drills/ 子组件 | 7 | ~30 |
| content/ 子组件 | 1 | ~5 |
| **合计** | **21** | **~195** |

---

## 逐文件盘点表

### 1. AcademyHome.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 90 | "5分钟速训" | Quick Drill 入口按钮标题 | `academy.home.quickDrill` |
| 2 | 91 | "针弱点快速强化" | Quick Drill 入口副标题 | `academy.home.quickDrillDesc` |
| 3 | 100 | "学习轨道" | 学习轨道入口按钮标题 | `academy.home.learningTracks` |
| 4 | 101 | "选择目标路径" | 学习轨道入口副标题 | `academy.home.learningTracksDesc` |

> 注：AcademyHome 已使用 `useTranslation()` 和 `t()`，但上述 4 处文案为硬编码。

### 2. CourseView.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 129 | "课程未找到" | lesson 未找到时的空状态 | `academy.courseView.notFound` |
| 2 | 134 | "返回学院" | 空状态返回按钮 | `academy.courseView.backToAcademy` |
| 3 | 185-188 | "返回学院" | 顶部返回按钮（带 ArrowLeft 图标） | `academy.courseView.backToAcademy` |
| 4 | 196 | "第 {n}/{m} 课" | 课程进度指示（第X课/Y课） | `academy.courseView.lessonOf` |
| 5 | 218 | "本土课 · L7 扩展" | 本土课徽章标签 | `academy.courseView.localLessonBadge` |
| 6 | 221 | "第 {n} 课" | 本土课进度指示 | `academy.courseView.lessonOrder` |
| 7 | 237 | "{lesson.duration}" | 课时长（duration 字段值，属数据内容） | 暂缓 - 数据内容 |
| 8 | 247 | "{n} 题" | 测验题数 | `academy.courseView.quizCount` |
| 9 | 285 | "课后测验" | 测验阶段标题 | `academy.courseView.quizTitle` |

### 3. LessonContent.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 32 | "理论" (label) | Tab 按钮短词 | `academy.lessonContent.tabTheory` |
| 2 | 32 | "理论讲解" (fullLabel) | 底部 CTA 完整词 | `academy.lessonContent.tabTheoryFull` |
| 3 | 33 | "示例" (label) | Tab 按钮短词 | `academy.lessonContent.tabExamples` |
| 4 | 33 | "示例演示" (fullLabel) | 底部 CTA 完整词 | `academy.lessonContent.tabExamplesFull` |
| 5 | 34 | "实战" (label) | Tab 按钮短词 | `academy.lessonContent.tabPractice` |
| 6 | 34 | "实战练习" (fullLabel) | 底部 CTA 完整词 | `academy.lessonContent.tabPracticeFull` |
| 7 | 75 | "进入{nextTab.fullLabel}" | 进入下一 Tab 按钮 | `academy.lessonContent.enterTab` |
| 8 | 85 | "完成学习" | 完成学习按钮 | `academy.lessonContent.completeLearning` |
| 9 | 117 | "进入{nextTab.fullLabel}" | 示例 Tab 进入下一 Tab | `academy.lessonContent.enterTab` |
| 10 | 125 | "完成学习" | 示例 Tab 完成按钮 | `academy.lessonContent.completeLearning` |
| 11 | 165 | "本课仅有理论内容" | 无示例/实战时的提示 | `academy.lessonContent.theoryOnly` |

### 4. LessonQuiz.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 70 | "测验通过！" | 完成页通过标题（score ≥ 70） | `academy.quiz.passed` |
| 2 | 70 | "继续加油！" | 完成页未通过标题 | `academy.quiz.keepGoing` |
| 3 | 73 | "答对 {n}/{m} 题" | 完成页正确数统计 | `academy.quiz.correctCount` |
| 4 | 75 | "分" | 分数单位 | `academy.quiz.scoreUnit` |
| 5 | 82 | "重新测验" | 重试按钮 | `academy.quiz.retry` |
| 6 | 117 | "第 {n} / {m} 题" | 进度指示 | `academy.quiz.progress` |
| 7 | 178 | "✓ 正确！" | 答对反馈标签 | `academy.quiz.correctFeedback` |
| 8 | 178 | "✗ 错误" | 答错反馈标签 | `academy.quiz.wrongFeedback` |
| 9 | 189 | "下一题" | 下一题按钮 | `academy.quiz.next` |
| 10 | 189 | "查看结果" | 最后一题确认按钮 | `academy.quiz.viewResult` |

### 5. CourseDoneView.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 41 | "训练完成！" | Drill 完成标题 | `academy.courseView.drillComplete` |
| 2 | 41 | "课程完成！" | 课程完成标题 | `academy.courseView.courseComplete` |
| 3 | 45 | "训练成绩" | Drill 成绩标签 | `academy.courseView.drillScore` |
| 4 | 50 | "正确率 {n}% · 用时 {n}s" | Drill 成绩详情 | `academy.courseView.drillStats` |
| 5 | 55 | "测验得分" | 测验得分标签 | `academy.courseView.quizScoreLabel` |
| 6 | 56 | "分" | 分数单位 | `academy.courseView.scoreUnit` |
| 7 | 65 | "返回学院" | 返回按钮 | `academy.courseView.backToAcademy` |
| 8 | 72 | "重学本课" | 重学按钮 | `academy.courseView.restartLesson` |
| 9 | 79 | "下一课：{title}" | 下一课按钮 | `academy.courseView.nextLesson` |
| 10 | 90 | "推荐下一步" | 推荐轨道标题 | `academy.courseView.recommendedNext` |
| 11 | 115 | "{n} 节课 · {duration}" | 轨道信息 | `academy.courseView.trackInfo` |
| 12 | 118 | "{n}/{m} 课时" | 轨道进度标签 | `academy.courseView.trackProgress` |

### 6. CourseLockedView.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 57 | "该课程尚未解锁" | 锁定提示标题 | `academy.courseView.lockedTitle` |
| 2 | 62 | "请先完成以下前置课程，再来学习本课程。" | 前置课程提示 | `academy.courseView.prereqHint` |
| 3 | 85 | "已完成" | 前置条目进度标签 | `academy.courseView.completedLabel` |
| 4 | 86 | "课时" | 课时单位 | `academy.courseView.lessonUnit` |
| 5 | 99 | "已完成" | 全部完成标记 | `academy.courseView.completed` |
| 6 | 106 | "去完成" | 跳转按钮 | `academy.courseView.goComplete` |
| 7 | 121 | "请先完成该 Level 的所有课程" | Fallback 前置提示 | `academy.courseView.completeLevelFirst` |
| 8 | 138 | "去完成" | Fallback 跳转按钮 | `academy.courseView.goComplete` |
| 9 | 150 | "请先完成以下前置课程：" | 课程级前置缺失提示 | `academy.courseView.missingPrereqHint` |
| 10 | 173 | "返回学院" | 底部返回按钮 | `academy.courseView.backToAcademy` |

### 7. LevelCard.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 73 | "Level {level}" | Level 标签 | `academy.level.levelPrefix` |
| 2 | 86 | "{n}/{m} 课时完成" | 进度文案 | `academy.level.lessonsCompleted` |
| 3 | 103 | "参加 Level {level} 认证测验" | 认证入口 label | `academy.level.takeCertification` |
| 4 | 110 | `{level.unlockRequirement}` | 未解锁文案（数据内容） | 暂缓 - 数据内容 |

### 8. LevelCertification.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 43 | "级别未找到" | 空状态提示 | `academy.certification.levelNotFound` |
| 2 | 45 | "返回学院" | 空状态返回 | `academy.certification.backToAcademy` |
| 3 | 148 | "返回策略学院" | 页面返回按钮 | `academy.certification.backToAcademy` |
| 4 | 157 | "Level {n} 认证测验" | 认证标题 | `academy.certification.title` |
| 5 | 169 | "题目数量：{n} 题（从本级别所有课程测验中抽取）" | 题目数量说明 | `academy.certification.questionCount` |
| 6 | 173 | "通过标准：正确率 ≥ {n}%" | 通过标准说明 | `academy.certification.passStandard` |
| 7 | 178 | "历史尝试：{n} 次 · 最高分 {n}%" | 历史尝试信息 | `academy.certification.historyAttempts` |
| 8 | 184 | "已通过认证（{date}）" | 已通过标记 | `academy.certification.alreadyCertified` |
| 9 | 192 | "建议先完成本级别所有课程再参加认证测验（当前进度：{n}/{m}）" | 前置警告 | `academy.certification.suggestComplete` |
| 10 | 201 | "重新挑战" | 已通过后的按钮 | `academy.certification.retryChallenge` |
| 11 | 201 | "开始认证" | 开始认证按钮 | `academy.certification.startCertification` |
| 12 | 230 | "第 {n} / {m} 题" | 答题进度 | `academy.certification.progress` |
| 13 | 275 | "✓ 正确！" | 正确反馈 | `academy.certification.correctFeedback` |
| 14 | 275 | "✗ 错误" | 错误反馈 | `academy.certification.wrongFeedback` |
| 15 | 286 | "下一题" | 下一题按钮 | `academy.certification.next` |
| 16 | 286 | "查看结果" | 最后一题按钮 | `academy.certification.viewResult` |
| 17 | 99 | "Level {n} 认证通过！" | 完成页通过标题 | `academy.certification.passed` |
| 18 | 99 | "再接再厉！" | 完成页未通过标题 | `academy.certification.keepGoing` |
| 19 | 102 | "答对 {n}/{m} 题" | 完成页答对统计 | `academy.certification.correctCount` |
| 20 | 104 | "分" | 分数单位 | `academy.certification.scoreUnit` |
| 21 | 106 | "恭喜！你已掌握本级别核心知识" | 通过后提示 | `academy.certification.congratsPass` |
| 22 | 106 | "需要 {n}% 以上才能通过" | 未通过提示 | `academy.certification.needPassRate` |
| 23 | 113 | "返回学院" | 完成页返回 | `academy.certification.backToAcademy` |
| 24 | 121 | "重新挑战" | 未通过重试按钮 | `academy.certification.retryChallenge` |

### 9. LearningTracksView.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 44 | "返回策略学院" | 返回按钮 | `academy.tracks.backToAcademy` |
| 2 | 46 | "学习轨道" | 页面标题 | `academy.tracks.title` |
| 3 | 48 | "根据你的目标选择合适的学习路径，系统化提升特定方向的技能" | 页面副标题 | `academy.tracks.subtitle` |
| 4 | 108 | "已并入 Level 7 · 本土课" | 特定轨道标签 | `academy.tracks.mergedIntoLevel7` |
| 5 | 113 | "当前轨道" | 活跃轨道标签 | `academy.tracks.currentTrack` |
| 6 | 131 | "去学习 →" | 前置条件跳转链接 | `academy.tracks.goLearn` |
| 7 | 153 | "{n}/{m} 课时" | 轨道进度 | `academy.tracks.lessonCount` |
| 8 | 163 | "根据你的五维能力评分动态推荐" | 漏洞修复轨道说明 | `academy.tracks.leakFixDesc` |
| 9 | 181 | "取消选择" | 取消选择按钮 | `academy.tracks.deselect` |
| 10 | 181 | "选择此轨道" | 选择按钮 | `academy.tracks.selectTrack` |
| 11 | 193 | "继续学习" | 继续按钮 | `academy.tracks.continueLearning` |

### 10. ConceptGraph.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 316 | "适应屏幕" | 缩放重置按钮 | `academy.conceptGraph.fitScreen` |
| 2 | 549 | "已完成" | Tooltip 状态 | `academy.conceptGraph.statusCompleted` |
| 3 | 549 | "进行中" | Tooltip 状态 | `academy.conceptGraph.statusInProgress` |
| 4 | 549 | "未解锁" | Tooltip 状态 | `academy.conceptGraph.statusLocked` |
| 5 | 549 | "未开始" | Tooltip 状态 | `academy.conceptGraph.statusAvailable` |
| 6 | 563 | "已完成" | 图例 | `academy.conceptGraph.legendCompleted` |
| 7 | 567 | "进行中" | 图例 | `academy.conceptGraph.legendInProgress` |
| 8 | 571 | "未开始" | 图例 | `academy.conceptGraph.legendAvailable` |
| 9 | 575 | "未解锁" | 图例 | `academy.conceptGraph.legendLocked` |
| 10 | 579 | "已完成路径" | 图例 | `academy.conceptGraph.legendCompletedPath` |
| 11 | 583 | "前置依赖" | 图例 | `academy.conceptGraph.legendPrerequisite` |

### 11. ConceptGraphView.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 37 | "返回策略学院" | 返回按钮 | `academy.conceptGraph.backToAcademy` |
| 2 | 45 | "知识图谱" | 页面标题 | `academy.conceptGraph.title` |
| 3 | 47 | "可视化课程知识依赖关系，点击节点跳转到对应课程" | 页面副标题 | `academy.conceptGraph.subtitle` |
| 4 | 66 | "已学习" | 统计卡片标签 | `academy.conceptGraph.learned` |
| 5 | 73 | "未学习" | 统计卡片标签 | `academy.conceptGraph.notLearned` |
| 6 | 80 | "总课程" | 统计卡片标签 | `academy.conceptGraph.totalLessons` |
| 7 | 101 | "💡 提示：滚轮缩放 · 拖拽平移 · 悬停高亮依赖链 · 点击节点跳转课程" | 操作提示 | `academy.conceptGraph.tips` |
| 8 | 113 | "核心概念关联" | 概念关联区域标题 | `academy.conceptGraph.conceptLinks` |
| 9 | 116 | "点击概念查看关联课程和训练模块，实现跨模块知识联动" | 概念关联区域副标题 | `academy.conceptGraph.conceptLinksDesc` |
| 10 | 145 | "赔率" | 模块标签 | `academy.conceptGraph.modulePotOdds` |
| 11 | 145 | "范围" | 模块标签 | `academy.conceptGraph.moduleRange` |
| 12 | 145 | "GTO" | 模块标签 | `academy.conceptGraph.moduleGto` |
| 13 | 145 | "复盘" | 模块标签 | `academy.conceptGraph.moduleReview` |

### 12. HandExample.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 55 | "💰 现金桌" | 游戏类型标签 | `academy.handExample.gameTypeCash` |
| 2 | 55 | "🏆 锦标赛" | 游戏类型标签 | `academy.handExample.gameTypeMtt` |
| 3 | 55 | "🎰 SNG" | 游戏类型标签 | `academy.handExample.gameTypeSng` |
| 4 | 59 | "ICM压力: {level}" | ICM 压力标签 | `academy.handExample.icmPressure` |
| 5 | 59 | "高" | ICM 压力值 | `academy.handExample.icmHigh` |
| 6 | 59 | "中" | ICM 压力值 | `academy.handExample.icmMedium` |
| 7 | 63 | "🫧 泡沫期" | 泡沫期标签 | `academy.handExample.bubblePhase` |
| 8 | 83 | "Pot: " | 底池标签 | `academy.handExample.potLabel` |
| 9 | 89 | "公共牌" | 公共牌标签 | `academy.handExample.boardLabel` |
| 10 | 131 | "筹码: " | 筹码标签 | `academy.handExample.stackLabel` |
| 11 | 133 | "下注: " | 下注标签 | `academy.handExample.betLabel` |
| 12 | 139 | "翻前" | 街指示 | `academy.handExample.streetPreflop` |
| 13 | 139 | "翻牌" | 街指示 | `academy.handExample.streetFlop` |
| 14 | 139 | "转牌" | 街指示 | `academy.handExample.streetTurn` |
| 15 | 139 | "河牌" | 街指示 | `academy.handExample.streetRiver` |
| 16 | 150 | "正确决策" | 正确决策区域标题 | `academy.handExample.correctDecision` |
| 17 | 174 | "常见错误" | 常见错误区域标题 | `academy.handExample.commonMistake` |
| 18 | 183 | "EV: " | EV 标签 | `academy.handExample.evLabel` |
| 19 | 192 | "💡 面对 {opponent} 类型对手，{strat}" | 对手策略提示 | `academy.handExample.opponentTip` |

### 13. BasicsIntro.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 74 | "德州扑克基础入门" | 页面标题 | `academy.basics.title` |
| 2 | 87 | "Step {n} / {m}" | 步骤进度 | `academy.basics.stepProgress` |
| 3 | 155 | "上一步" | 上一步按钮 | `academy.basics.prevStep` |
| 4 | 167 | "完成入门" | 最后一步完成按钮 | `academy.basics.finishIntro` |
| 5 | 167 | "下一步" | 下一步按钮 | `academy.basics.nextStep` |
| 6 | 191 | "基础入门完成！" | 完成弹窗标题 | `academy.basics.completionTitle` |
| 7 | 194 | "即将跳转到第一课... {n}s" | 完成弹窗倒计时 | `academy.basics.redirectCountdown` |
| 8 | 278 | "搜索术语（中英文）..." | 搜索框 placeholder | `academy.basics.searchPlaceholder` |
| 9 | 11 | "基础" | 分类 Tab | `academy.basics.categoryBasic` |
| 10 | 12 | "手牌" | 分类 Tab | `academy.basics.categoryHand` |
| 11 | 13 | "行动" | 分类 Tab | `academy.basics.categoryAction` |
| 12 | 14 | "策略" | 分类 Tab | `academy.basics.categoryStrategy` |
| 13 | 310 | "未找到匹配的术语" | 搜索空状态 | `academy.basics.noTermsFound` |

### 14. PracticeDrill.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 46-48 | "基础"、"进阶"、"高级" | 难度等级标签 | `academy.practice.difficultyBeginner` / `intermediate` / `advanced` |
| 2 | 73-79 | "最优决策"、"正确"、"小幅偏差"、"错误"、"重大错误" | 五级反馈中文兜底 | `academy.practice.gradeBest` / `correct` / `inaccuracy` / `wrong` / `blunder` |
| 3 | 459 | "练习完成！" | 普通模式完成标题 | `academy.practice.practiceComplete` |
| 4 | 459 | "压力测试完成！" | 压力模式完成标题 | `academy.practice.pressureComplete` |
| 5 | 465 | "正确率" | 结果统计标签 | `academy.practice.accuracy` |
| 6 | 470 | "平均用时" | 结果统计标签 | `academy.practice.avgTime` |
| 7 | 476 | "答对" | 结果统计标签 | `academy.practice.correctCount` |
| 8 | 486 | "超时次数" | 压力模式统计 | `academy.practice.timeoutCount` |
| 9 | 490 | "最长连续" | 压力模式统计 | `academy.practice.maxStreak` |
| 10 | 496 | "压力评分" | 压力模式统计 | `academy.practice.pressureScore` |
| 11 | 504 | "难度变化：" | 难度变化标题 | `academy.practice.difficultyChange` |
| 12 | 506 | DIFFICULTY_LABELS 映射 | 难度变化值（复用 #1） | 同上 |
| 13 | 523 | "薄弱点：" | 薄弱点标题 | `academy.practice.weakPoints` |
| 14 | 572 | "快捷键：{keys}" | 快捷键提示 | `academy.practice.shortcutHint` |
| 15 | 586 | "🧊 冷静一下！连续答错 3 题，深呼吸，回顾一下策略要点再继续。" | 冷却提示 | `academy.practice.cooldownHint` |
| 16 | 606 | "正确率 {n}%" | 实时正确率 | `academy.practice.runningAccuracy` |
| 17 | 636 | "压力" | 压力模式标记 | `academy.practice.pressureLabel` |
| 18 | 667 | "⏰ 时间到！" | 超时闪光提示 | `academy.practice.timeoutFlash` |
| 19 | 724 | "底池" | 底池标签 | `academy.practice.potLabel` |
| 20 | 728 | "有效筹码" | 筹码标签 | `academy.practice.stackLabel` |
| 21 | 752 | "💰 现金桌" | 游戏类型 | `academy.practice.gameTypeCash` |
| 22 | 752 | "🏆 锦标赛" | 游戏类型 | `academy.practice.gameTypeMtt` |
| 23 | 752 | "🎰 SNG" | 游戏类型 | `academy.practice.gameTypeSng` |
| 24 | 756 | "ICM压力: {level}" | ICM 压力 | `academy.practice.icmPressure` |
| 25 | 756 | "高"、"中" | ICM 压力值 | `academy.practice.icmHigh` / `icmMedium` |
| 26 | 838 | "⏰ 超时！系统代选 {action}，本题计为答错" | 超时代选反馈 | `academy.practice.timeoutFeedback` |
| 27 | 842 | "正确答案：{action} {amount}" | 正确显示 | `academy.practice.correctAnswer` |
| 28 | 854 | "正确答案：{action} {amount}" | 正确显示 | `academy.practice.correctAnswer` |
| 29 | 866 | "{n} BB EV损失" | EV 损失徽章 | `academy.practice.evLossLabel` |
| 30 | 888 | "去复习 →" | 复习链接 | `academy.practice.goReview` |
| 31 | 895 | "📊 提示：面对{opponent}类型玩家，{msg}" | 对手策略提示 | `academy.practice.opponentHint` |
| 32 | 897 | "你的决策考虑了对手倾向，很好！" | 正确时的对手提示 | `academy.practice.opponentHintCorrect` |
| 33 | 898 | "此类对手{tendency}，需要相应调整策略。" | 错误时的对手提示 | `academy.practice.opponentHintWrong` |
| 34 | 910 | "查看成绩" | 最后一题下题按钮 | `academy.practice.viewResult` |
| 35 | 910 | "下一题" | 下题按钮 | `academy.practice.next` |

### 15. DrillLessonRouter.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 41 | "未知 Drill 组件：{name}" | 未知组件错误 | `academy.drills.unknownComponent` |
| 2 | 50 | "加载训练内容..." | 懒加载 fallback | `academy.drills.loadingFallback` |

### 16. ChoiceDrillRenderer.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 67 | "暂无题目数据" | 空状态 | `academy.drills.noQuestions` |
| 2 | 80 | "训练完成！" | 完成标题 | `academy.drills.complete` |
| 3 | 85 | "正确率" | 统计标签 | `academy.drills.accuracy` |
| 4 | 90 | "用时" | 统计标签 | `academy.drills.timeLabel` |
| 5 | 96 | "答对" | 统计标签 | `academy.drills.correctLabel` |
| 6 | 104 | "完成" | 完成按钮 | `academy.drills.finish` |
| 7 | 121 | "退出" | 退出按钮 | `academy.drills.exit` |
| 8 | 135 | "正确率 {n}%" | 实时正确率 | `academy.drills.runningAccuracy` |
| 9 | 234 | "✓ 正确" | 正确反馈 | `academy.drills.correctFeedback` |
| 10 | 239 | "✗ 不正确" | 错误反馈 | `academy.drills.wrongFeedback` |
| 11 | 243 | "正确答案：{text}" | 正确答案显示 | `academy.drills.correctAnswer` |
| 12 | 256 | "查看成绩" | 最后一题按钮 | `academy.drills.viewResult` |
| 13 | 256 | "下一题" | 下题按钮 | `academy.drills.next` |

### 17. content/ContentBlock.tsx

| # | 行号 | 硬编码文案 | 上下文 | 建议 i18n key |
|---|------|-----------|--------|---------------|
| 1 | 47 | "关键要点" | key-point 类型标签 | `academy.lessonContent.labelKeyPoint` |
| 2 | 59 | "职业牌手说" | pro-tip 类型标签 | `academy.lessonContent.labelProTip` |
| 3 | 71 | "反直觉点" | counter-intuitive 类型标签 | `academy.lessonContent.labelCounterIntuitive` |

> 注：ContentBlock 中的 "highlight"、"heading"、"text"、"formula"、"example"、"theory-reference"、"diagram"、"hand-example" 类型无固定标签文案，直接渲染 `section.content`（教学内容），暂缓迁移。

---

## 内容数据暂缓说明

以下文件/内容属于**教学内容数据**，数据量大且包含大量扑克专业知识，i18n 迁移策略需单独评估（翻译质量、双语一致性、维护成本等），**本次暂不盘点**：

- `data/courses.ts` 及 `data/level*.ts` — 课程正文、测验题目、Drill 题库
- `data/localLessons.ts` — 本土课内容
- `data/basicsContent.ts` — 基础入门教学内容（BasicsIntro 的 step.content 内容）
- `data/conceptNodes.ts` — 概念节点数据
- `data/learningTracks.ts` 中的 name/description 字段
- `data/opponentProfiles.ts` 中的场景/说明文字
- `drills/handRankingQuestions.ts` — 题库内容（prompt/explanation）
- `drills/outsQuestions.ts` — 题库内容
- `drills/positionQuestions.ts` — 题库内容
- `drills/potOddsQuestions.ts` — 题库内容
- `types.ts` 中的类型定义（非用户可见文案）

---

## 迁移优先级建议

| 优先级 | 范围 | 说明 |
|--------|------|------|
| **P0** | CourseView + LessonContent + LessonQuiz | 用户直接交互的核心学习路径 |
| **P1** | CourseDoneView + CourseLockedView + LevelCertification | 完成/锁定/认证页 |
| **P2** | LevelCard + LearningTracksView + ConceptGraph + ConceptGraphView | 浏览/导航页 |
| **P3** | PracticeDrill + ChoiceDrillRenderer | 实践练习（含大量文案） |
| **P4** | HandExample + BasicsIntro + content/ContentBlock | 教学展示组件 |
| **P5** | AcademyHome + DrillLessonRouter | 少量文案 |

---

## 变更日志

- **2026-08-04**: 初始版本，完成 P2-02 规划阶段硬编码文案清点