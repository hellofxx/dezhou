# 德州扑克训练平台 — 设计优化方案

## 文档信息
| 项目 | 内容 |
|---|---|
| 文档版本 | v1.0 |
| 创建日期 | 2026-08-17 |
| 基于审阅 | 2026-08-17 设计审阅报告 |
| 关联文档 | DESIGN_LANGUAGE.md v1.7.0 / PRD.md v2.4 / AI_GUIDE.md |

## 1. 优化目标
在保持现有 "Private Card Room" 棋牌美学的基础上，增强教育学习场景的视觉语言，让用户从"感觉在牌室"升级为"感觉在进步"。

## 2. 审阅结论摘要
- 棋牌风格一致性：9/10 — 四层色彩体系、物理隐喻、动效系统、反模式守卫均达到专业水准
- 教育学习适配度：7/10 — 学习进度可视化、课程阅读体验、反馈教学深度、模块教育区分度存在明确的优化空间

## 3. 优化方案（按优先级排序）

### 3.1 P0 — 学习进度可视化（Dashboard 增强）
**现状**：仪表盘以"牌室落座"叙事为主，学习目标不在首屏
**目标**：首屏即可感知学习目标与进度
**实施内容**：
- FeltArena 区域增加每日目标卡（象牙铭牌样式，显示"今日目标：掌握 CO 位置 3-Bet 范围 / 已完成 3/5"）
- StreakRail 右侧增加正确率趋势微图（sparkline，8px 高）
- 知识图谱节点增加进度环（progress-ring，三色：未开始/进行中/已完成）
**负责代理**：progress-dev（组件）+ ui-ux-dev（视觉复核）
**设计规范**：DESIGN_LANGUAGE.md §13.2

### 3.2 P0 — 课程阅读体验增强
**现状**：课程正文缺乏教育特有的排版层次，9 种 content-block 视觉区分度不够
**目标**：支持快速扫读与深度阅读双模式
**实施内容**：
- content-block 的 key-point 和 pro-tip 增加左侧 3px 语义色竖线
- 新增 lesson-takeaway 要点总结卡（walnut 底 + brass 边 + 3px brass 竖线）
- 新增 formula-display 公式展示块（淡黄铜底纹 + 等宽字体）
- 课程标题增加编号系统（§2.1 格式，eyebrow 样式）
**负责代理**：strategy-academy-dev + theory-academy-dev（组件）+ ui-ux-dev（视觉复核）
**设计规范**：DESIGN_LANGUAGE.md §13.3

### 3.3 P1 — 反馈系统教育脚手架
**现状**：反馈侧重评级和 EV 数字，缺少决策逻辑解释
**目标**：反馈不仅是"对错"，更要解释"为什么"
**实施内容**：
- 反馈卡片增加可折叠 decision-analysis 区域（GTO 推荐 vs 你的动作 + 差异原因）
- wrong/blunder 级别增加 comparison-view 对比视图
- 反馈卡片底部增加 try-again 按钮（同类型题目巩固）
- 反馈卡片底部增加 related-lesson-chip（相关课程链接）
**负责代理**：全部训练模块子代理（range-trainer-dev / pot-odds-dev / gto-simulator-dev / puzzle-trainer-dev）+ ui-ux-dev（反馈组件视觉复核）
**设计规范**：DESIGN_LANGUAGE.md §13.4

### 3.4 P1 — 模块间教育目的视觉区分
**现状**：6 大模块主题色同色系低饱和，暗底上区分度有限
**目标**：帮助用户快速识别不同学习能力类型
**实施内容**：
- 模块卡图标方块增加微纹理（CSS repeating-linear-gradient，不透明度 5-8%）
- 模块卡右下角增加 last-training-badge（"X 天前"或"今日已练"）
- 模块卡增加教育目的描述标签（如"记忆训练"/"计算训练"/"决策训练"）
**负责代理**：progress-dev（Dashboard 模块卡）+ ui-ux-dev（视觉复核）
**设计规范**：DESIGN_LANGUAGE.md §13.5

### 3.5 P2 — 新手引导教育叙事
**现状**：Onboarding 收集用户水平，但首屏价值主张不够明确
**目标**：第一印象明确传达"这是学习工具，而非游戏"
**实施内容**：
- Onboarding 首屏增加明确的价值主张（Fraunces 大标题："系统性提升你的扑克决策能力"）
- 引导步骤增加进度指示器（底部 3-4 个圆点）
- 完成引导后首次 Dashboard 展示"你的学习路径"时间线（未来 7 天推荐内容）
**负责代理**：onboarding-dev + platform-dev（协调）
**设计规范**：PRD.md §8.4.5

### 3.6 P2 — 渐进式信息披露
**现状**：Dashboard 信息密度高，新手可能选择困难
**目标**：信息密度随用户熟练度逐步释放
**实施内容**：
- 新手（totalSessions < 5）Dashboard 隐藏训练场模块网格，仅展示推荐路径
- 训练场模块入口按训练次数逐步解锁
- 增加 learning-focus-mode：用户锁定模块后 Dashboard 自动聚焦
**负责代理**：progress-dev（Dashboard 逻辑）+ platform-dev（路由门禁）
**设计规范**：DESIGN_LANGUAGE.md §13.6

### 3.7 P3 — 移动端教育体验微调
**现状**：移动端适配已有基础（§6.3），但缺少教育场景专属优化
**目标**：移动端学习体验与桌面端一致流畅
**实施内容**：
- 移动端课程阅读增加顶部 reading-progress-bar（2px brass 细线）
- 移动端答题反馈改为底部 Sheet（替代 Modal）
- 移动端概念图改为纵向列表
**负责代理**：各模块子代理 + ui-ux-dev（移动端复核）
**设计规范**：DESIGN_LANGUAGE.md §13.7

## 4. 实施计划

### 4.1 阶段一：教育设计基础设施（预计 3-5 天）
| 任务 | 负责代理 | 依赖 |
|---|---|---|
| DESIGN_LANGUAGE.md §13 落地 | ui-ux-dev | 无 |
| globals.css 新增教育 token | ui-ux-dev | §13 定稿 |
| progress-ring / sparkline / daily-goal-card 组件 | progress-dev | token 就绪 |
| lesson-takeaway / formula-display 组件 | strategy-academy-dev | token 就绪 |

### 4.2 阶段二：Dashboard 教育改造（预计 2-3 天）
| 任务 | 负责代理 | 依赖 |
|---|---|---|
| Dashboard 增加每日目标卡 | progress-dev | 阶段一组件 |
| StreakRail 增加正确率趋势微图 | progress-dev | sparkline 组件 |
| 渐进式信息披露（新手过滤） | progress-dev | 阶段一 |
| 视觉一致性复核 | ui-ux-dev | 以上完成 |

### 4.3 阶段三：反馈系统升级（预计 3-4 天）
| 任务 | 负责代理 | 依赖 |
|---|---|---|
| decision-analysis 折叠区组件 | platform-dev（shared 层） | §13.4 定稿 |
| comparison-view 对比视图 | platform-dev（shared 层） | 同上 |
| 各训练模块接入新反馈组件 | 各 feature-dev | shared 组件就绪 |
| 视觉一致性复核 | ui-ux-dev | 以上完成 |

### 4.4 阶段四：课程体验 + 移动端（预计 2-3 天）
| 任务 | 负责代理 | 依赖 |
|---|---|---|
| strategy-academy 课程排版增强 | strategy-academy-dev | 阶段一组件 |
| theory-academy 课程排版增强 | theory-academy-dev | 阶段一组件 |
| 移动端 reading-progress-bar | platform-dev | 无 |
| 移动端底部 Sheet 反馈 | platform-dev | 无 |
| 移动端视觉一致性复核 | ui-ux-dev | 以上完成 |

### 4.5 阶段五：新手引导 + 模块区分（预计 2 天）
| 任务 | 负责代理 | 依赖 |
|---|---|---|
| Onboarding 教育叙事增强 | onboarding-dev | 无 |
| 模块卡微纹理 + last-training-badge | progress-dev | 无 |
| learning-focus-mode | progress-dev | 阶段二 |
| 视觉一致性复核 | ui-ux-dev | 以上完成 |

## 5. 验收标准
- [ ] Dashboard 首屏可见每日学习目标与进度（目标卡 + 趋势微图）
- [ ] 课程内容排版支持快速扫读（要点总结卡 + 公式块 + 标题编号）
- [ ] wrong/blunder 反馈包含决策分析（对比视图 + 原因 + 课程链接）
- [ ] 6 大模块卡在视觉上可区分（纹理 + 时间标签 + 教育目的描述）
- [ ] 新手用户 Dashboard 信息密度适合（渐进式披露）
- [ ] 移动端课程阅读有进度条
- [ ] 移动端答题反馈使用底部 Sheet
- [ ] `pnpm verify` 全部通过
- [ ] designTokenGuard 无新增违规
- [ ] 所有新增文案 i18n 双语齐备

## 6. 风险与注意事项
- 所有新增视觉元素必须遵守 DESIGN_LANGUAGE.md §1.2 三不原则和 §1.3 反 SaaS 饱和色禁令
- 新增 CSS 类必须走 globals.css 定义，禁止在组件内写内联大段样式
- 教育场景的 brass 使用量需克制，避免与主 CTA 争夺视觉焦点
- Dashboard 渐进式披露的 totalSessions 阈值需产品确认（当前建议 5/10/20）
- 移动端底部 Sheet 需确认与现有 MobileNav 的 z-index 层级关系