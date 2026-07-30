# 德州扑克训练平台 — 产品需求文档（PRD）

## 文档信息

| 项目 | 内容 |
|---|---|
| 文档版本 | v2.1 |
| 作者 | 产品团队 |
| 创建日期 | 2026-07-20 |
| 最后更新 | 2026-07-28 |
| 文档目的 | 全面描述德州扑克训练平台的产品定位、用户需求、功能规格与非功能需求，作为设计、开发与测试的基准参考文档 |

> **文档职责**：本文件仅描述产品规格（What / Why），不涉及技术实现细节（How）。技术设计见 `TDD.md`，版本演进与执行历史见 `CHANGELOG.md`。

---

## 目录

1. [产品概述](#1-产品概述)
2. [产品目标与成功指标](#2-产品目标与成功指标)
3. [用户调研](#3-用户调研)
4. [竞品分析](#4-竞品分析)
5. [功能需求](#5-功能需求)
6. [非功能需求](#6-非功能需求)
7. [用户旅程](#7-用户旅程)
8. [设计约束](#8-设计约束)
9. [版本规划](#9-版本规划)

---

## 1. 产品概述

### 1.1 产品名称

**德州扑克训练平台**（Poker Training Platform）

### 1.2 产品定位

一款纯前端、零后端依赖的德州扑克系统性训练工具，通过交互式练习、即时反馈与数据可视化，帮助各层级扑克玩家以结构化方式提升决策能力与策略水平。

### 1.3 目标用户画像

| 用户类型 | 描述 | 核心诉求 |
|---|---|---|
| 初学者 | 刚接触德州扑克，对基本规则和概念尚不熟悉 | 快速记忆起手牌范围、理解底池赔率等基础概念 |
| 进阶玩家 | 有一定实战经验，希望系统提升策略水平 | 学习 GTO 决策、复盘历史牌局、发现并修补弱点 |
| 职业选手 | 以扑克为主要收入来源的高水平玩家 | 精细化训练特定场景、保持竞技状态、追踪长期数据趋势 |

### 1.4 核心价值主张

1. **系统化训练**：将碎片化的扑克知识整合为结构化训练模块，覆盖范围记忆、赔率计算、GTO 决策、牌局复盘四大核心领域
2. **即时反馈闭环**：每次操作实时给出正确性反馈与 EV 分析，加速学习效率
3. **数据驱动进步**：完整的学习进度追踪与能力可视化，让进步可量化
4. **零门槛访问**：纯前端架构 + PWA 支持，无需注册、无需付费、离线可用
5. **中文优先**：原生中文界面与国际化支持，降低中文用户的学习门槛

---

## 2. 产品目标与成功指标

### 2.1 用户学习目标

1. 掌握 6-max 各位置的标准翻前开牌范围（UTG/HJ/CO/BTN/SB）
2. 熟练计算底池赔率与期望值（EV），做出 +EV 的跟注/弃牌决策
3. 理解 GTO（博弈论最优）策略的基本原则并应用于实战场景
4. 能够独立复盘历史牌局，识别关键决策点的失误

### 2.2 产品关键指标

| 指标类别 | 指标名称 | 目标值 |
|---|---|---|
| 训练完成度 | 单次训练完成率 | ≥ 80% |
| 学习效果 | 首次训练到第 10 次训练的正确率提升 | ≥ 15 个百分点 |
| 用户留存 | 7 日留存率 | ≥ 40% |
| 用户留存 | 30 日留存率 | ≥ 20% |
| 使用频率 | 周活跃训练次数 | ≥ 3 次/用户 |
| 功能覆盖 | 使用 ≥ 2 个训练模块的用户占比 | ≥ 50% |
| 成就解锁 | 至少解锁 1 个成就徽章的用户占比 | ≥ 60% |

---

## 3. 用户调研

### 3.1 扑克玩家画像

根据行业调研数据，扑克玩家群体具有以下特征：

- **年龄分布**：线上扑克玩家平均年龄约 29 岁，超 75% 的玩家年龄在 35 岁以下；18-25 岁群体占比超 40%，是最活跃的年龄段
- **性别比例**：男性玩家占约 90%，女性约 10%；线上环境女性比例略高于线下锦标赛（线下女性参赛率通常低于 5%）
- **地域分布**：美国、德国、法国为全球前三大扑克市场；中国、巴西等新兴市场增长迅速
- **游戏偏好**：无限注德州扑克（NLHE）为绝对主流，其次是底池限注奥马哈（PLO）

### 3.2 用户痛点调研

通过社区访谈与论坛调研，扑克学习者普遍面临以下痛点：

| 痛点类型 | 具体描述 | 严重程度 |
|---|---|---|
| 学习路径缺失 | "我不知道应该从哪里开始学，应该先学什么" | ★★★★★ |
| 工具门槛高 | PioSolver 等专业工具配置复杂、价格昂贵、学习曲线陡峭 | ★★★★★ |
| 知识碎片化 | 论坛帖子、YouTube 视频、书籍中的知识分散，难以体系化 | ★★★★ |
| 缺乏反馈机制 | 实战中无法即时知道某个决策是否正确 | ★★★★ |
| 复盘效率低 | 手动记录和分析牌局耗时费力，难以坚持 | ★★★★ |
| 练习不持续 | 缺乏系统性的训练计划和激励机制，容易半途而废 | ★★★ |
| 中文资源匮乏 | 高质量中文扑克教学内容稀少，翻译质量参差不齐 | ★★★ |
| 费用门槛 | 主流训练工具价格从 $65-$49/月不等，对休闲玩家负担较重 | ★★★ |

### 3.3 市场需求分析

- **全球线上扑克市场**：2024 年市场规模约 38.6 亿美元，预计 2030 年达 69 亿美元，年复合增长率 10.2%（Grand View Research）
- **训练工具需求增长**：随着 GTO 理论普及，玩家对系统化训练工具的需求持续攀升；德国等市场玩家尤其偏好策略分析型工具
- **移动端趋势**：移动优先策略成为吸引多元化用户群体的关键；NTPoker 等移动端 GTO 训练器快速崛起
- **免费增值模式主流化**：GTO Wizard 等头部产品采用免费层 + 付费订阅模式（Pro $29/月、Elite $49/月），验证了 Freemium 模式的可行性

---

## 4. 竞品分析

### 4.1 主要竞品概览

| 维度 | PokerTracker 4 | Flopzilla | GTO Wizard |
|---|---|---|---|
| 产品类型 | 桌面端 HUD + 数据分析 | 桌面端范围分析计算器 | 云端 GTO 训练平台 |
| 核心定位 | 实战数据追踪与对手分析 | 范围 vs 牌面交互分析 | 博弈论最优策略学习与训练 |
| 定价模式 | 一次性购买 $64.99-$159.99 | 一次性购买（含 Pro 免费版升级） | 免费层 + 订阅制（Pro $29/月，Elite $49/月） |
| 平台支持 | Windows / macOS | Windows | Web（全平台浏览器） |
| 目标用户 | 线上多桌现金/锦标赛玩家 | 进阶玩家、策略研究者 | 进阶到职业级 NLHE 玩家 |
| 中文支持 | 无 | 无 | 无 |

### 4.2 功能对比矩阵

| 功能 | 本产品 | PokerTracker 4 | Flopzilla | GTO Wizard |
|---|:---:|:---:|:---:|:---:|
| 手牌范围记忆训练 | ✅ | ❌ | ❌ | 部分 |
| 13×13 范围矩阵可视化 | ✅ | ❌ | ✅ | ✅ |
| 底池赔率计算器 | ✅ | ❌ | ❌ | ❌ |
| EV 分析工具 | ✅ | ❌ | ❌ | ✅ |
| Outs 速查表 | ✅ | ❌ | ❌ | ❌ |
| GTO 决策模拟训练 | ✅ | ❌ | ❌ | ✅ |
| Spot 练习 | ✅ | ❌ | ❌ | ✅ |
| 历史牌局导入与回放 | ✅ | ✅ | ❌ | ✅（Leak Finder） |
| 多平台牌局解析 | ✅（PokerStars/GGPoker） | ✅（多平台） | ❌ | ✅ |
| 实时 HUD 显示 | ❌ | ✅ | ❌ | ❌ |
| 训练进度追踪 | ✅ | ✅（资金追踪） | ❌ | 部分 |
| 正确率趋势图表 | ✅ | ✅ | ❌ | ❌ |
| 打卡日历/连续天数 | ✅ | ❌ | ❌ | ❌ |
| 成就系统 | ✅ | ❌ | ❌ | 部分（排行榜） |
| 每日挑战 | ✅ | ❌ | ❌ | ✅ |
| 排行榜 | ✅ | ❌ | ❌ | ✅ |
| PWA 离线支持 | ✅ | ❌ | ❌ | ❌ |
| 国际化（中/英） | ✅ | ❌ | ❌ | ❌ |
| 键盘快捷操作 | ✅ | 部分 | ❌ | ❌ |
| 纯前端零后端 | ✅ | ❌ | ❌ | ❌ |
| 免费使用 | ✅ | ❌ | ❌ | 部分 |

### 4.3 竞品详细分析

#### 4.3.1 PokerTracker 4

**产品简介**：运营超 15 年的老牌扑克分析软件，以实时 HUD（抬头显示器）和详尽的数据报告闻名，是线上职业牌手的标配工具。

**核心功能**：
1. 实时 HUD：在牌桌上即时显示对手数据（VPIP、PFR、AGG 等数百项指标）
2. 牌局数据追踪：自动记录所有牌局数据，支持多维度筛选
3. 多样化分析报表：胜率曲线、位置分析、摊牌分析等
4. 内置牌局重播：逐步回顾历史牌局决策
5. NoteTracker：自动记录对手行为笔记

**定价**：
- Hold'em 小注额版：$64.99
- Hold'em 全注额版：$99.99
- Hold'em + Omaha 全注额版：$159.99
- 一次购买终身使用，首年免费更新，之后可选年费 $29.99 维护

**优势**：数据深度业界领先、实时 HUD 独一无二、长期口碑积累强
**劣势**：纯分析工具不含训练功能、学习曲线陡峭、不支持中文、价格较高

#### 4.3.2 Flopzilla

**产品简介**：专注于范围 vs 牌面交互分析的计算工具，帮助玩家快速理解特定范围在不同翻牌面上的击中分布。

**核心功能**：
1. 范围输入与可视化：13×13 矩阵选择起手牌范围
2. 翻牌面分析：输入翻牌后自动计算范围击中分布（顶对、中对、听牌等）
3. 赢率计算：单挑与多路底池赢率计算
4. 过滤器：按牌型过滤查看范围子集
5. FlopzillaPro 升级版：支持分组模式、多人模式、GTO+ 导入导出

**定价**：一次性购买，已注册用户免费升级至 Pro 版

**优势**：计算速度极快（几乎实时）、界面直观、价格亲民
**劣势**：不提供 EV 或策略建议、无法建立决策树、翻前实用性有限、仅 Windows

#### 4.3.3 GTO Wizard

**产品简介**：当前最先进的云端 GTO 训练平台，被誉为"PioSolver 的大众化入口"，将专业求解器结果以交互式训练形式呈现。

**核心功能**：
1. 云端 GTO 求解：基于 PioSolver 精度的预计算方案，秒级加载
2. 交互式训练：模拟真实牌局，即时反馈决策正确性与 EV 损失
3. 动态范围查看器：实时显示 GTO 推荐频率与范围构成
4. Leak Finder：上传 Hand History，AI 自动对比 GTO 偏差
5. 每日挑战 + 积分排行榜
6. 单街训练：专注 Flop/Turn/River 特定街道

**定价**：
- Free：每日 10 次查询 + 基础训练
- Pro：$29/月 或 $249/年（全功能 + 无限训练 + Leak Finder）
- Elite：$49/月（高级测验 + 教练笔记 + 优先支持）

**优势**：功能最全面的 GTO 学习平台、界面现代、社区活跃
**劣势**：仅支持 NLHE、纯 GTO 导向无剥削策略、依赖网络、高级功能价格较高

### 4.4 竞品启示与差异化策略

| 竞品启示 | 本产品应对策略 |
|---|---|
| PokerTracker 的数据深度受用户认可 | 在进度追踪模块提供多维度统计（正确率趋势、五维能力雷达图、薄弱点分析） |
| Flopzilla 的范围可视化体验优秀 | 提供交互式 13×13 矩阵，悬停即时显示手牌详情与范围信息 |
| GTO Wizard 的交互式训练模式高效 | 场景训练 + Spot 练习双模式，即时反馈 GTO 最优决策与 EV 损失 |
| 主流竞品均不支持中文 | 原生中文界面 + 完整国际化框架，填补中文市场空白 |
| 主流竞品均需付费 | 完全免费、零后端依赖、PWA 离线可用，降低准入门槛 |
| 竞品间功能割裂（分析/训练/追踪分离） | 一站式整合训练 + 分析 + 追踪，形成完整学习闭环 |
| 竞品缺乏游戏化激励 | 成就系统 + 每日挑战 + 排行榜 + 打卡日历，提升用户粘性 |

---

## 5. 功能需求

平台功能按职责划分为 **训练核心**、**学习路径**、**留存激励**、**反馈教练**、**平台能力** 五大类，共计 25 个功能模块（产品视角拆分，对应代码层面的 8 个 feature 目录，跨模块系统集中在 progress store）。

| 类别 | 模块 | 节 |
|---|---|---|
| 训练核心 | 手牌范围记忆训练 | 5.1 |
| 训练核心 | 底池赔率与 EV 计算器 | 5.2 |
| 训练核心 | GTO 决策情景模拟 | 5.3 |
| 训练核心 | 历史牌局复盘分析 | 5.4 |
| 留存激励 | 进度追踪与数据统计 | 5.5 |
| 平台能力 | 高级功能（成就 / 每日挑战 / 排行榜） | 5.6 |
| 学习路径 | 新手引导流程（Onboarding） | 5.7 |
| 留存激励 | Streak 深度机制 | 5.8 |
| 反馈教练 | 反馈机制五级分类与成功收尾 | 5.9 |
| 学习路径 | 基础 Drill 内容建设 | 5.10 |
| 学习路径 | 3 分钟快速训练 | 5.11 |
| 训练核心 | 扑克谜题（Puzzle）模式 | 5.12 |
| 留存激励 | ELO 能力分级体系 | 5.13 |
| 留存激励 | 间隔重复系统（SRS） | 5.14 |
| 学习路径 | 3 分钟快速训练扩展 | 5.15 |
| 学习路径 | 策略学院（Strategy Academy） | 5.16 |
| 学习路径 | 本土低级别盈利路径 | 5.17 |
| 反馈教练 | 导师角色人格化 | 5.18 |
| 反馈教练 | 情绪管理模块 | 5.19 |
| 平台能力 | PWA 离线与国际化 | 5.20 |
| 留存激励 | 冻结卡碎片系统 | 5.21 |
| 留存激励 | 进步回放 | 5.22 |
| 反馈教练 | GTO 偏差检测 | 5.23 |
| 学习路径 | 学习路径横向推荐 | 5.24 |
| 学习路径 | 本土化路径前置条件 | 5.25 |

> **说明**：各模块的验收标准聚焦产品行为，不涉及技术实现细节（文件路径、store actions、persist version 等），这些见 `TDD.md`。

### 5.1 手牌范围记忆训练

**功能描述**：通过交互式 13×13 网格和分步练习，帮助用户记忆各位置的标准翻前开牌范围，建立扎实的 GTO 基础。

**用户故事**：
- 作为一名初学者，我希望通过可视化网格学习各位置的开牌范围，以便在实战中快速做出正确决策
- 作为一名进阶玩家，我希望通过计时测验检验自己对范围的记忆程度，以便发现薄弱点并针对性强化
- 作为一名教练，我希望快速查看和切换不同位置/动作类型的标准范围，以便准备教学材料

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 范围网格 | 13×13 矩阵展示，对角线=对子，上三角=同花，下三角=非同花 |
| 位置选择 | 支持 6-max 全部位置：UTG、HJ、CO、BTN、SB、BB |
| 动作类型 | Open Raise、3-Bet、4-Bet、Call vs Raise |
| 范围预设 | 基于近似 GTO 策略的预设范围数据（`preflop-ranges.json`） |
| 学习模式 | 浏览范围网格，高亮显示范围内手牌，悬停查看详情 |
| 测验模式 | 随机发牌判断是否在范围内，计时统计正确率与平均用时 |
| 范围信息面板 | 显示当前范围的统计信息（手牌数量、占比等） |
| 训练结果 | 记录每次训练的正确率、用时，保存至进度系统 |
| 位置渐进解锁 | 基于 preflop ELO 阈值逐步开放位置训练：UTG(0) → HJ(800) → CO(1000) → BTN(1200) → SB(1500) → BB(1800)，未解锁位置在 RangeSelector 中以锁定状态展示 |
| 自适应难度 | 连续答错 ≥3 次时显示降级提示，引导用户回退到更易难度 |
| 反馈闭环 | 答题反馈携带 `relatedLessonId`，wrong/blunder 级别显示"去复习"链接跳转相关课程 |

**交互细节**：
1. 悬停网格格子查看手牌详情与当前状态（范围内/范围外）
2. 键盘快捷键支持快速操作（空格确认、数字键选择动作）
3. 测验模式内置计时器，实时显示答题进度
4. 正确/错误操作时显示绿色/红色反馈动画
5. 未解锁位置以锁定图标显示，悬停提示解锁所需的 ELO 阈值

**验收标准**：
1. 用户可以在 6 个位置间切换，网格正确显示对应范围
2. 学习模式下悬停任意格子可看到手牌名称与范围状态
3. 测验模式完成后正确展示正确率、用时统计
4. 训练结果自动保存并可在进度页面查看
5. 未达 ELO 阈值的位置以锁定状态显示，无法进入训练
6. 连续答错 3 次时显示降级提示 banner

### 5.2 底池赔率与 EV 计算器

**功能描述**：提供底池赔率实时计算、期望值（EV）分析和 Outs 速查功能，帮助用户在决策点快速评估跟注/弃牌的数学合理性。

**用户故事**：
- 作为一名初学者，我希望输入底池和下注金额后自动计算所需赔率，以便理解跟注是否合理
- 作为一名进阶玩家，我希望使用 EV 计算器分析不同行动的期望值差异，以便选择最优策略
- 作为一名玩家，我希望快速查阅常见听牌的 Outs 数量和对应运率，以便在实战中快速心算

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 底池赔率计算 | 输入底池大小和下注金额，计算底池赔率与所需最低胜率 |
| EV 分析 | 输入胜率、底池、下注等参数，计算各行动的期望值 |
| Outs 速查表 | 常见听牌（同花听牌、顺子听牌等）的 Outs 数与近似概率 |
| 胜率图表 | 可视化展示底池赔率 vs 估算胜率的对比关系 |
| Tab 切换 | "底池赔率"与"EV 分析"两个标签页组织 |
| 实时计算 | 参数变化时即时更新计算结果，无需手动触发 |
| Quiz 五级反馈 | 测验模式接入五级反馈系统（best/correct/inaccuracy/wrong/blunder），显示 EV 损失与对应评级 |
| 自适应难度 | 连续答错 ≥3 次时显示降级提示 |

**验收标准**：
1. 输入有效参数后底池赔率和所需胜率即时正确显示
2. EV 计算器输出结果与手动计算一致
3. Outs 速查表覆盖至少 8 种常见听牌场景
4. 胜率图表可交互展示底池赔率与估算胜率的对比
5. Quiz 模式反馈以五级评级显示（非二态正确/错误）

### 5.3 GTO 决策情景模拟

**功能描述**：通过预设场景和 Spot 练习，让用户在模拟实战环境中练习 GTO 最优决策，获取即时反馈与 EV 损失分析。

**用户故事**：
- 作为一名进阶玩家，我希望在配置好的场景中练习翻前/翻后决策，以便学习 GTO 标准打法
- 作为一名职业选手，我希望针对特定 Spot（如 BTN vs BB 3-Bet）反复练习，以便固化正确决策模式
- 作为一名玩家，我希望训练结束后查看每个决策的 EV 损失，以便识别最大的策略漏洞

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 场景训练 | 配置场景参数（位置、筹码深度、动作历史），生成训练场景 |
| Spot 练习 | 针对特定局面的反复练习模式 |
| 决策选择 | 提供 Fold/Call/Raise 等动作选项，用户选择后即时反馈 |
| GTO 反馈 | 显示 GTO 最优决策、EV 差异、决策正确性评判 |
| 策略矩阵 | 可视化展示不同手牌在不同场景下的推荐动作 |
| 训练会话 | 多场景连续训练，结束后生成综合结果报告 |
| 结果页面 | 展示正确率、EV 损失（BB/100）、逐场景分析 |
| 上次训练摘要 | 首页展示最近一次训练的关键数据 |
| 课程联动反馈 | 决策反馈携带 `relatedLessonId`（preflop→l4-gto-basics, flop→l3-cbet, turn/river→l3-multistreet），wrong/blunder 显示"去复习"链接 |
| 自适应难度 | 连续答错 ≥3 次时显示降级提示 banner |
| EV 公式标准化 | 使用标准 EV 公式 `eq×(pot+r) - (1-eq)×r`，不引入硬编码 fold equity |

**验收标准**：
1. 场景配置后可正确生成训练场景并进入会话
2. 每次决策后即时显示 GTO 反馈（最优动作、EV 损失）
3. Spot 练习模式可反复练习同一场景
4. 训练结束后结果页面正确展示统计数据
5. 答错时反馈卡片显示"去复习"链接，点击跳转对应课程

### 5.4 历史牌局复盘分析

**功能描述**：支持从主流扑克平台导入历史牌局文件，通过逐步回放和街道时间轴进行结构化复盘分析。

**用户故事**：
- 作为一名线上玩家，我希望导入 PokerStars/GGPoker 的牌局记录，以便系统化回顾自己的实战表现
- 作为一名进阶玩家，我希望通过逐步回放功能检视每个决策点，以便发现实战中的思维盲点
- 作为一名玩家，我希望在关键牌局上添加标注笔记，以便日后回顾时快速定位重要决策

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 多平台导入 | 支持 PokerStars、GGPoker 牌局文件格式解析 |
| 牌局列表 | 按日期/底池/平台筛选和排序已导入牌局 |
| 逐步回放 | 按决策点逐步播放牌局过程，展示每个街道的行动 |
| 街道时间轴 | 可视化展示 Pre-Flop → Flop → Turn → River 的进程 |
| 玩家座位 | 可视化牌桌布局，展示各位置玩家信息 |
| 标注系统 | 在任意决策点添加文字标注和评价 |
| 搜索功能 | 按牌局号、玩家名、平台搜索历史牌局 |
| 数据持久化 | 使用 IndexedDB 存储导入的牌局数据 |
| 批量管理 | 支持单条删除和清空全部操作 |

**验收标准**：
1. 可成功导入 PokerStars 和 GGPoker 格式的牌局文件
2. 导入后牌局列表正确显示牌局号、盲注级别、玩家数等元信息
3. 逐步回放可正确展示每个街道的行动序列
4. 标注内容可保存并在后续查看时显示
5. 筛选和搜索功能响应迅速、结果准确

### 5.5 进度追踪与数据统计

**功能描述**：提供全面的训练数据统计与可视化，帮助用户追踪学习进度、发现薄弱环节并保持训练动力。

**用户故事**：
- 作为一名用户，我希望在 Dashboard 上看到训练总览数据，以便快速了解自己的学习状态
- 作为一名进阶玩家，我希望查看正确率随时间的变化趋势，以便评估训练效果
- 作为一名自律的玩家，我希望通过打卡日历和连续天数追踪保持训练习惯
- 作为一名追求进步的玩家，我希望通过能力雷达图发现薄弱环节，以便调整训练重点

**功能规格**：

| 规格项 | 描述 |
|---|---|
| Dashboard | 首页总览：训练总次数、综合正确率、连续天数、本周训练数 |
| 快速入口 | 各训练模块的快捷导航卡片 |
| 最近训练记录 | 展示最近 5 条训练记录（模块、模式、正确率、用时、日期） |
| 正确率趋势图 | 14 天正确率折线图，按日聚合 |
| 打卡日历 | 月度训练日历，可视化每日训练状态 |
| 连续天数追踪 | 当前连续天数与最长连续天数 |
| 难度指示器 | 基于正确率自动评估当前水平（初级/中级/高级） |
| 统计总览 | 各模块独立统计数据（训练次数、正确率、平均用时） |
| 五维能力雷达图 | 综合评估范围记忆、赔率计算、GTO 决策等多维能力 |
| 薄弱点分析 | 基于数据自动识别用户最需改进的领域 |
| 模块详情入口 | 跳转至范围训练/GTO 模拟器的详细统计页 |
| 训练记录表格 | 完整的历史训练记录列表，支持排序查看 |

**验收标准**：
1. Dashboard 正确显示 4 项快速统计数据
2. 正确率趋势图按日聚合数据并正确绘制折线
3. 打卡日历高亮显示有训练记录的日期
4. 难度指示器根据正确率阈值（55%/80%）正确分级
5. 所有数据从本地存储读取，无网络请求

### 5.6 高级功能

#### 5.6.1 成就系统

共 **22 个成就**，分 **4 个类别**，每个成就 **4 个等级**（bronze / silver / gold / diamond）。

| 类别 | 成就数 | 示例成就 |
|------|--------|----------|
| 学习（Learning） | 6 | 初出茅庐、百炼成钢、全能选手、神射手、速度之王、完美主义 |
| 连续（Streak） | 6 | 连续 7 天、连续 30 天、连续 100 天、连续 365 天、冻结卡首次使用、Earn Back 成功 |
| 技能（Skill） | 5 | GTO 大师、赔率达人、范围专家、谜题达人、学院毕业生 |
| 里程碑（Milestone） | 5 | 首次训练、100 次训练、500 次训练、1000 次训练、全模块完成 |

成就展示组件：`AchievementWall` 成就墙，已解锁成就高亮显示解锁日期，未解锁成就显示解锁条件与进度。

成就定义数据存储在 `src/features/progress/data/achievements.ts`。

#### 5.6.2 每日挑战

- 基于日期种子算法生成每日挑战任务（每天一种模块类型轮换）
- 挑战目标：完成指定数量的训练题目并达到目标准确率
- 连续完成天数追踪与展示
- 完成后跳转对应训练模块

#### 5.6.3 排行榜

- 展示训练积分排名
- 基于训练次数、正确率等维度排序

#### 5.6.4 PWA 离线模式

- Service Worker 缓存核心资源，支持离线访问
- Web App Manifest 配置，支持"添加到主屏幕"
- 离线时训练数据本地保存，联网后自动同步

#### 5.6.5 国际化

- 支持中文（zh）和英文（en）双语界面
- 基于 i18next + react-i18next 实现
- 默认语言为中文，可在设置中切换

#### 5.6.6 开发者选项（调试解锁）

- 设置页提供“开发者选项”分区，输入调试码即可一键解锁全部功能（所有课程等级、range 位置、学习轨道前置、每日题量上限），供开发调试与功能演示使用
- 可随时关闭；不影响真实学习进度、成就与统计数据；新手引导不在解锁范围内

### 5.7 新手引导流程（Onboarding）

**功能描述**：首次访问的新用户自动进入 5 步引导流程，通过定位测试、首次微训练、首胜庆祝与目标设定，建立学习路径基线并启动 Day 1 Streak，降低首次使用门槛。

**用户故事**：
- 作为一名新用户，我希望系统引导我完成第一次训练，以便快速理解平台核心价值
- 作为一名有基础的玩家，我希望跳过基础测试直接体验训练，避免冗余流程
- 作为一名新用户，我希望第一次训练以成功收尾，以便建立信心

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 首次访问检测 | `OnboardingGate` 组件在 `AppLayout` 中包裹 `<Outlet />`，未完成 onboarding 时自动重定向到 `/onboarding` |
| 路由设计 | `/onboarding` 路由放在 `BlankLayout` 下，使用 `LazyWrapper` 懒加载，不渲染主导航 |
| 5 步流程 | 步骤0 欢迎页 → 步骤1 定位测试 → 步骤2 首次微训练 → 步骤3 首胜庆祝 → 步骤4 目标设定 → 完成 |
| 欢迎页选择 | "我是新手" 进入定位测试；"我有基础" 跳过定位直接进入首次微训练；可点击"跳过引导"立即结束 |
| 定位测试 | 5 道单选题覆盖 4 个维度：handRanking(2题) / position(1题) / odds(1题) / range(1题)，每题含解析 |
| 能力评估 | 答题正确率映射到 30-70 区间写入 `onboarding.initialAbility`（rangeKnowledge / oddsCalculation / positionalPlay），gtoUnderstanding 默认 50 |
| 首次微训练 | 3-5 道简单范围题复用 `QuizCard` 组件，最后一题必须是简单题（如 AA in CO 应开池）确保成功收尾 |
| 补救机制 | 最后一题答错时追加一道更简单的补救题（如 AA in BTN 应开池） |
| 首胜庆祝 | CSS 动画（撒花粒子+弹出+脉冲）展示"恭喜完成首次训练！"，调用 `progressStore.recordTrainingDay()` 启动 Day 1 Streak |
| 目标设定 | 5 / 10 / 20 分钟三档可选，确认后写入 `onboarding.dailyGoalMinutes` 与 `completedAt` |
| 状态持久化 | 状态通过 progress store 持久化（技术细节见 TDD） |
| 跳过引导 | `skipOnboarding` action 直接标记 `completed=true`，不再被门禁拦截 |

**验收标准**：
1. 新用户首次访问任意非 `/onboarding` 路由时被重定向到 `/onboarding`
2. OnboardingFlow 包含 5 步：Welcome / PlacementTest / FirstDrill / Celebration / GoalSetting
3. 定位测试 5 道题覆盖 4 个维度，每题含 explanation
4. 定位测试完成后 `progress.onboarding.initialAbility` 被写入
5. 首次微训练最后一题从简单题库抽取，答错追加补救题
6. 首胜庆祝动画展示，Day 1 Streak 启动
7. Onboarding 完成后 `onboarding.completed = true`，不再被重定向
8. 老用户数据自动迁移，不丢失（技术细节见 TDD）

### 5.8 Streak 深度机制（冻结卡 / 里程碑 / Earn Back / 分享卡片）

**功能描述**：在 P0-1 的 Day 1 Streak 基础上扩展为完整的连续训练机制，引入冻结卡保护、里程碑庆典、Earn Back 恢复窗口与社交分享卡片，提升用户长期留存与训练动力。

**用户故事**：
- 作为一名连续训练 6 天的玩家，我希望偶尔漏练一天不会丢失 streak，避免因偶发中断而气馁
- 作为一名达成 30 天连续训练的玩家，我希望获得视觉化的庆典反馈与可分享的成就卡片，增强成就感
- 作为一名因出差断 streak 的玩家，我希望有 24 小时的恢复窗口，让"补救一次训练"即可挽回 streak
- 作为新用户，我希望获得初始冻结卡，降低早期断 streak 的心理压力

**功能规格**：

| 规格项 | 描述 |
|---|---|
| Streak 状态 | `progress.streak: StreakState` 包含 currentStreak / longestStreak / lastTrainingDate(YYYY-MM-DD) / streakFreezes / streakFreezeUsedToday / milestones / lastMilestoneCelebrated / streakStartDate / streakBrokenAt |
| 初始赠送 | 新用户初始化时获得 2 张冻结卡；老用户首次升级到 v2 migrate 时同样补发 2 张 |
| 冻结卡保护 | gap=2 天（前天训练昨日未训）且冻结卡 >0 且今日未用过 → 自动扣减 1 张，streak 继续 +1；同一天仅生效一次（`streakFreezeUsedToday`） |
| 手动使用冻结卡 | `useStreakFreeze()` action 供用户主动操作（如设置页一键使用），返回是否成功 |
| 里程碑奖励 | 达成 3/7/30/100/365 天分别奖励 1/2/3/5/10 张冻结卡（`MILESTONE_FREEZE_REWARDS` 映射） |
| 里程碑庆典 | `StreakCelebration.tsx` 全屏 Dialog，不同天数对应徽章（🥉/🔥/🏆/💎/👑）+ CSS keyframes 动画（彩屑/烟花/光晕），关闭时调用 `awardStreakFreeze` 奖励对应数量 |
| 分享卡片 | 30 天及以上的庆典显示"分享"按钮，调用 `generateStreakShareCanvas` 生成 1080x1080 PNG（牌桌绿呢面背景）并下载 |
| Earn Back 机制 | streak 断裂时记录 `streakBrokenAt` 时间戳（保留旧 currentStreak 不立即重置）；24 小时内完成训练 → `currentStreak + 1` 恢复并清除 streakBrokenAt；超过 24 小时则重置为 1 |
| 晚间紧迫感 | `StreakTracker` 在 20:00 后且今日未训练时，火焰图标与 streak 数字变红闪烁，显示"你的 Streak 即将熄灭，快来训练保住它！" |
| Earn Back 提示 | `canEarnBack()` 返回 true 时，`StreakTracker` 顶部显示"⚡ Earn Back 窗口期"标记 |
| 数据迁移 | 老用户数据自动迁移（技术细节见 TDD） |

**核心 Actions**：

| Action | 描述 |
|---|---|
| `recordTrainingDay()` | 调用 `updateStreak` 更新 streak（含 Earn Back / 冻结卡自动扣减），今日成功记录时触发 `checkMilestone` |
| `useStreakFreeze()` | 手动使用一张冻结卡，返回布尔值 |
| `checkMilestone()` | 检查并标记新达成的里程碑，返回里程碑天数或 null |
| `awardStreakFreeze(count?)` | 奖励指定数量冻结卡（默认 1） |
| `canEarnBack()` | 判断是否处于 Earn Back 24 小时窗口期 |
| `earnBackStreak(previousStreak)` | 恢复 streak 为 previousStreak + 1，清除 streakBrokenAt |

**验收标准**：
1. `StreakState` 包含 streakFreezes / milestones / streakBrokenAt 等新字段
2. 新用户初始赠送 2 张冻结卡
3. 昨天训练今日未训练且冻结卡 > 0 时自动扣减冻结卡，streak 不重置
4. streak 达到 3/7/30/100/365 天时弹出全屏庆典 Dialog 并奖励对应冻结卡
5. StreakTracker 显示冻结卡数量
6. 晚间 20:00 后未训练时 StreakTracker 火焰变红并显示"即将熄灭"提示
7. Earn Back 机制：streak 断裂 24 小时内完成训练可恢复 streak
8. `shareCard.ts` 的 `generateStreakShareCanvas` 返回 Blob
9. 老用户数据自动迁移，不丢失（技术细节见 TDD）

### 5.9 反馈机制五级分类与"最后一题简单"成功收尾

**功能描述**：将训练决策反馈从二元对错升级为五级分类（best / correct / inaccuracy / wrong / blunder，对标 GTO Wizard），并实现"最后一题简单 + 补救机制"的成功收尾策略，让用户以正确结束训练，提升信心与留存。P0-4 阶段先实现三级（optimal / acceptable / error），P2-2 阶段升级为五级（新增 best / inaccuracy / blunder，重命名 optimal→best、acceptable→correct、error→wrong），并保留 `migrateGrade` 函数向后兼容旧三级值。

**用户故事**：
- 作为一名 GTO 训练用户，我希望反馈不仅告诉我对错，还能区分"次优可接受"和"明显错误"，以便我合理分配学习精力
- 作为一名初学者，我希望训练最后一题是简单题，避免以挫败感结束，保持训练动力
- 作为一名答错最后一题的用户，我希望系统再给一次简单题机会，让我以成功收尾

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 五级评级类型 | `DecisionGrade = 'best' \| 'correct' \| 'inaccuracy' \| 'wrong' \| 'blunder'`，定义于 `src/shared/types/decisionFeedback.ts` |
| 评级阈值 | `GRADE_THRESHOLDS`：best = 0 EV 损失、correct = 0.5BB、inaccuracy = 2BB、wrong = 5BB、blunder = Infinity；`calculateGrade` 边界归入更严重等级（`≤2` 为 inaccuracy，`≤5` 为 wrong，`>5` 为 blunder） |
| 反馈接口 | `DecisionFeedback { grade; evLoss; correctAction; explanation; relatedLessonId? }`，wrong / blunder 级别建议填写 relatedLessonId |
| 显示配置 | `GRADE_DISPLAY_CONFIG`：best 深绿 🌟、correct 浅绿 ✅、inaccuracy 黄 🟡、wrong 橙 🟠、blunder 红 🔴，每级对应 i18n titleKey |
| 向后兼容 | `migrateGrade(oldGrade)` 将旧三级 'optimal' / 'acceptable' / 'error' 映射为 'best' / 'correct' / 'wrong'；旧 i18n key 保留并标记 deprecated |
| 构造助手 | `buildDecisionFeedback({ isCorrect, evLoss?, correctAction, explanation?, relatedLessonId? })` 用于不持有 evLoss 的调用方 |
| GTO 反馈 | `GTOFeedback.tsx` 新增 `feedback?: DecisionFeedback \| null` 可选 props；提供时优先使用五级显示，否则降级为旧二元显示 |
| Range 反馈 | `QuizCard.tsx` 新增 `decisionFeedback?: DecisionFeedback \| null` 可选 props；五级反馈样式与 GTOFeedback 一致 |
| 最后一题简单 | range-trainer / pot-odds / gto-simulator 三个模块均在题目序列生成时将末题替换为最简单题（AA@BTN open / 0 注免费看牌 / BTN AA open 场景） |
| 补救机制 | 末题答错且未用过补救时追加一道简单题；通过 `rescueUsed: boolean` 状态避免无限循环 |
| 结果记录 | `TrainingResult.lastQuestionCorrect` 记录最终题是否答对（含补救题） |
| i18n 文案 | `feedback.grade.*` / `feedback.message.*` / `feedback.evLossLabel` / `feedback.correctAction` / `feedback.goReview`，zh/en 双语 |

**模块实现**：

| 模块 | 最后一题简单辅助函数 | 调用方 |
|---|---|---|
| range-trainer | `getEasyQuestion()` → QuizQuestion（AA@BTN raise） | `useQuizEngine` / `store.ts` 的 `startQuiz` + `nextQuestion` |
| pot-odds | `getEasyOddsQuestion()` → PotOddsQuizQuestion（底池 100 / 下注 0 / 跟注 +EV） | `PotOddsQuizPage.tsx` 的 `effectiveQuestions` memo + `handleNext` |
| gto-simulator | `getEasyGTOScenario(index)` → Scenario（BTN AA open，GTO 100% raise） | `useScenarioEngine.generateScenarios` + `useGTOSimulatorStore.nextScenario` |

**验收标准**：
1. `decisionFeedback.ts` 定义 `DecisionGrade` / `DecisionFeedback` / `GRADE_THRESHOLDS` / `calculateGrade` / `GRADE_DISPLAY_CONFIG` / `migrateGrade` / `buildDecisionFeedback`
2. `GTOFeedback` 根据 grade 显示五套样式（深绿 best / 浅绿 correct / 黄 inaccuracy / 橙 wrong / 红 blunder）
3. wrong / blunder 级反馈附带 EV 损失数值与"去复习"链接（指向 `relatedLessonId`）
4. `QuizCard` 同步五级反馈样式，与 GTOFeedback 视觉一致
5. range-trainer / pot-odds / gto-simulator 三个模块均实现"末题替换为简单题"
6. 末题答错时三个模块均能追加一道简单题作为补救，且补救只触发一次
7. `TrainingResult.lastQuestionCorrect` 正确反映最终题答题状态
8. i18n zh.json / en.json 包含 `feedback.grade.{best,correct,inaccuracy,wrong,blunder}` 与 `feedback.message.*` 全部 key；旧 `optimal/acceptable/error` key 保留并标记 deprecated，缺失时回退到 `defaultValue`
9. 旧的二元反馈接口（`isOptimal` / `feedback?: QuestionFeedback`）仍可正常使用，保证向后兼容
10. `migrateGrade` 函数将旧三级值正确映射到新五级，老代码过渡期可用

---

### 5.10 基础 Drill 内容建设（牌力排名 / 位置认知 / Outs 速算 / 底池赔率 / ChoiceDrill 通用组件）

**功能描述**：在策略学院中新增 4 个零基础交互式 Drill，覆盖牌力识别、位置认知、Outs 速算、底池赔率四大基础维度，并引入 ChoiceDrillRenderer 通用选择题渲染器，为 L2-L8 每级提供 2 个新 Drill（共 16 个），接入零基础学习路径，让新用户通过“做中学”快速建立基本功。

**用户故事**：
- 作为一名零基础用户，我希望有交互式训练（而非纯阅读）来强化我对牌型等级的记忆
- 作为一名新手，我希望在 6-max 牌桌上点击各个位置以建立位置直觉
- 作为一名刚学 Outs 概念的用户，我希望用图形化题库练习同花听牌 / OESD / Gutshot 的 Outs 计数与二四法则
- 作为一名刚学底池赔率的用户，我希望看到图形化的底池/跟注比例，直观理解 +EV 跟注决策

**功能规格**：

| 规格项 | 描述 |
|---|---|
| Drill 目录 | `src/features/strategy-academy/components/drills/`，包含 4 个组件 + 4 个题库 + `types.ts` + `DrillLessonRouter.tsx` + `ChoiceDrillRenderer.tsx` |
| 统一接口 | `DrillProps { onComplete(result: DrillResult); onExit() }`；`DrillResult { correct; total; timeTaken }` |
| 牌力排名闪电战 | `HandRankingDrill.tsx`，10 题，3 种题型（compare-hands / identify-rank / simple-compare），最后 2 题为简单起手牌比较 |
| 位置认知训练 | `PositionDrill.tsx`，8 题，交互式 6-max 椭圆牌桌点击，`SEAT_LAYOUT` 百分比坐标定位 |
| Outs 速算 | `OutsDrill.tsx`，8 题，覆盖同花听牌 9 outs / OESD 8 outs / Gutshot 4 outs / 二四法则 / 高牌听顶对 6 outs |
| 底池赔率直觉 | `PotOddsDrill.tsx`，6 题，含 `PotVisualization` 图形化 progress bar 可视化底池/跟注比例 |
| 题库 i18n 驱动 | 4 个题库文件均使用 `promptKey` / `optionsKeys` / `explanationKey` 引用 i18n key，便于多语言切换 |
| 路由集成 | `DrillLessonRouter.tsx` 使用 `React.lazy` 懒加载 4 个 Drill 组件，依据 `lesson.drillComponent` 路由 |
| 课程集成 | `courses.ts` 在 Level 1 注册 4 个 `type: 'drill'` lesson（`drill-hand-ranking` / `drill-position` / `drill-outs` / `drill-pot-odds`），扩展 `Lesson` 类型新增 `drillComponent?` 字段 |
| ChoiceDrillRenderer | 通用选择题 Drill 渲染器，接受题库数据与配置参数，支持自定义题目数量、随机抽取、五级反馈接入；L2-L8 每级新增的 2 个 Drill 均通过此组件渲染 |
| L2-L8 新增 Drill | 每级 2 个新 Drill（共 16 个），通过 ChoiceDrillRenderer 渲染，覆盖各级课程核心概念 |
| 学习路径集成 | `learningTracks.ts` 在零基础快速入门 track 中按顺序插入 4 个 drill，保留原有课程顺序 |
| CourseView 集成 | `CourseView.tsx` 处理 `type === 'drill'` 的 phase 流程：跳过 quiz，drill 完成后直接进入 done 阶段并展示训练成绩（正确数 / 用时 / 正确率） |
| i18n 文案 | `drills.common.*` / `drills.handRanking.*` / `drills.position.*` / `drills.outs.*` / `drills.potOdds.*`，zh/en 双语 |

**模块实现**：

| Drill | 题库文件 | 题量 | 题型分布 |
|---|---|---|---|
| 牌力排名 | `handRankingQuestions.ts` | 10 | q1-3 compare-hands / q4-8 identify-rank / q9-10 simple-compare（简单题） |
| 位置认知 | `positionQuestions.ts` | 8 | q1-8 点击 6-max 牌桌上的指定位置（BTN/UTG/MP/CO/SB/BB） |
| Outs 速算 | `outsQuestions.ts` | 8 | q1-2 同花听牌 9 / q3-4 OESD 8 / q5-6 Gutshot 4 / q7 二四法则 / q8 高牌听顶对 6（简单题） |
| 底池赔率 | `potOddsQuestions.ts` | 6 | q1-2 基础赔率 / q3-4 胜率 vs 赔率决策 / q5 图形化 / q6 简单题 |

**验收标准**：
1. `drills/` 目录下存在 4 个 Drill 组件，全部实现 `DrillProps` 接口（`onComplete` / `onExit`）
2. HandRankingDrill 10 题，最后 2 题为简单起手牌比较
3. PositionDrill 8 题，含交互式 6-max 牌桌点击
4. OutsDrill 8 题，覆盖同花 / OESD / Gutshot / 二四法则 / 高牌
5. PotOddsDrill 6 题，含图形化 progress bar 可视化
6. `courses.ts` 注册 4 个 drill 类型 lesson，`Lesson` 类型新增 `drillComponent` 字段
7. `learningTracks.ts` 零基础快速入门 track 已按顺序插入 4 个 drill
8. `CourseView.tsx` 正确处理 drill 类型 lesson（跳过 quiz，直接进入 done 阶段）
9. `DrillLessonRouter.tsx` 使用 `React.lazy` 懒加载 4 个 Drill 组件
10. i18n zh.json / en.json 包含 `drills.*` 全部 key
11. 复用现有 `CardSVG` 组件，未引入新依赖
12. ChoiceDrillRenderer 通用组件可渲染任意选择题题库，L2-L8 共 16 个新 Drill 均通过此组件渲染

---

### 5.11 首页"3 分钟快速训练"入口

**功能描述**：在 Dashboard 首页顶部欢迎区下方新增一张显著的 CTA 卡片，提供"3 分钟快速训练"入口，支持范围练习 / 赔率速算 / 混合训练三种模式一键启动，固定 5 题、自适应难度、完成后自动计入 Streak，降低每日训练启动门槛。

**用户故事**：
- 作为一名繁忙的玩家，我希望在首页一眼看到"3 分钟快速训练"入口，无需导航即可开始今日训练
- 作为一名想保持牌感的玩家，我希望每天只需 5 题就能完成最低训练量，并自动延续 Streak
- 作为一名希望针对性练习的用户，我希望可以选择"范围练习"或"赔率速算"模式，集中训练某一维度
- 作为一名完成今日训练的玩家，我希望首页卡片显示"✓ 今日已完成"标记，给我即时正反馈

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 卡片位置 | Dashboard 顶部欢迎区下方、首次访问引导上方 |
| 卡片视觉 | 渐变背景（brass-dark → brass → brass-bright），felt-deep 深色文字，复用 shadcn/ui Card 组件 |
| 三个入口 | 范围练习（range）/ 赔率速算（odds）/ 混合训练（mixed）三个 Button，点击跳转 `/academy/quick-drill?mode=${mode}&quick=true` |
| 今日已完成判断 | `progress.streak.lastTrainingDate === getTodayString()` 时显示 "✓ 今日已完成" 徽章 |
| 快速模式题量 | 固定 5 题（普通模式为 8 题） |
| 难度自适应 | 根据 `progress.onboarding.initialAbility` 平均值与 `streak.currentStreak` 自动选择：avg < 50 或 streak < 3 → beginner；avg ≥ 70 且 streak ≥ 7 → advanced；否则 intermediate |
| 模式映射 | range → 筛选 preflop 题目（rangeKnowledge 维度）；odds → 筛选 flop/turn 题目（oddsCalculation 维度）；mixed → 不限维度 |
| 结果展示 | 完成后显示简洁结果面板：正确率 / 平均用时 / XP 获得，全对额外 +20 XP 提示，"已计入连续训练 ✓" 提示 |
| XP 计算 | 每题答对 +10 XP，全对额外 +20 XP 奖励（显示用，未持久化为独立 XP 字段） |
| Streak 计入 | 快速模式完成时调用 `progressStore.recordTrainingDay()`，内部已自动调用 `checkMilestone`，无需重复调用 |
| i18n 文案 | `dashboard.quickStart.*`（title / subtitle / range / odds / mixed / completedToday）与 `quickDrill.*`（quickTitle / quickSubtitle / mode.* / result.* / adaptiveDifficulty 等），zh/en 双语 |

**模块实现**：

| 文件 | 改动 |
|---|---|
| `src/features/progress/components/Dashboard.tsx` | 新增 streak state、startQuickDrill(mode) 函数、todayCompleted 判断、渐变 CTA 卡片（含 3 个 Button + 完成标记） |
| `src/features/strategy-academy/components/QuickDrill.tsx` | 新增 useSearchParams 读取 mode/quick 参数、autoDifficulty 自适应难度、modeWeakAreas 模式过滤、questionCount 快速 5 题、XP 计算与结果面板、recordTrainingDay 调用 |
| `src/i18n/locales/zh.json` / `en.json` | 新增 `dashboard.quickStart.*` 与 `quickDrill.*` 全部 i18n key |

**验收标准**：
1. Dashboard 顶部欢迎区下方存在"3 分钟快速训练"渐变卡片
2. 卡片含范围练习 / 赔率速算 / 混合训练三个 Button，点击跳转对应 URL
3. 今日已完成训练时卡片显示 "✓ 今日已完成" 徽章
4. QuickDrill 接收 `quick=true` 参数进入快速模式，固定 5 题
5. 快速模式难度根据 onboarding.initialAbility 与 streak 自适应，隐藏难度选择器
6. 支持 `mode=range|odds|mixed` 三种模式，按维度过滤题目
7. 完成后显示正确率 + 用时 + XP 结果面板
8. 全对时显示 +20 XP 奖励提示
9. 快速模式完成时调用 `recordTrainingDay` 计入 Streak
10. 所有用户可见文案通过 useTranslation 引用 i18n key，zh/en 双语齐全

### 5.12 扑克谜题（Puzzle）模式

**功能描述**：新增独立的"扑克谜题"训练模块，提供三种趣味训练模式——Puzzle Rush 限时冲刺、每日谜题、主题训练。通过场景化的单题决策与详细解析，帮助用户在轻松的趣味中训练翻前 RFI、大盲防守、3Bet、C-Bet、同花听牌、河牌价值下注、诈唬时机、短筹码策略、ICM 基础、多人底池等 10 大核心主题（P2-3 扩展）。

**用户故事**：
- 作为一名希望快速训练的用户，我希望在 3-5 分钟内通过限时冲刺模式训练决策反应，连对奖励 +10 秒
- 作为一名每日打卡的用户，我希望每天有固定 8 题可做，且当天题目与所有人相同，便于讨论
- 作为一名想针对单一弱点的用户，我希望按主题（如"大盲防守"）选择 15-30 题专攻
- 作为一名追求进步的用户，我希望看到自己的 Best Record，破纪录时有明显正反馈

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 模块位置 | 独立 feature 模块 `src/features/puzzle-trainer/`，路由 `/puzzle` 系列 |
| 三种模式 | Rush（限时冲刺）/ Daily（每日谜题）/ Theme（主题训练） |
| Rush 时长 | 3 分钟（180s）或 5 分钟（300s）可选，URL 参数 `?duration=3\|5` |
| Rush 规则 | 3 条命，答错扣 1 命，连对 5 题奖励 +10 秒，命耗尽或时间到结束 |
| Rush 难度递增 | 前 5 题 difficulty=1，中间 difficulty=2，后面 difficulty=3 |
| Rush 分数 | 答对 × 100 + 剩余时间(秒) × 10 + 剩余命 × 200 |
| Daily 题目 | 基于日期种子（YYYYMMDD）从全题库抽取 8 题，所有人当天看到相同 |
| Daily 完成状态 | `dailyCompleted[dateKey] = true` 持久化，幂等，当日重复做不改变状态 |
| Daily 完成人数 | 基于日期种子生成 100-999 之间的固定数字（本地模拟） |
| Theme 主题 | P1 阶段实现 5 主题（每主题 15 题），P2-3 扩展至 10 主题（共 205 题） |
| 主题分类 | PuzzleHome 按 4 类分组展示：翻前 / 翻后 / 河牌 / 锦标赛 |
| 主题列表 | 翻前 RFI(30) / 大盲防守(25) / 3Bet 策略(20) / C-Bet 持续下注(20) / 同花听牌(20) / 河牌价值下注(20) / 诈唬时机(15) / 短筹码策略(20) / ICM 基础(15) / 多人底池(20) |
| 主题分组映射 | 翻前：preflop-rfi / big-blind-defense / three-bet；翻后：c-bet / flush-draw / multiway；河牌：river-value / bluff；锦标赛：short-stack / icm |
| 难度标识 | 每个主题卡片基于题目难度分布显示初级 / 中级 / 高级标识 |
| 五级反馈 | 复用 `DecisionFeedback` 与 `GRADE_DISPLAY_CONFIG`，根据 EV 损失自动评级（best/correct/inaccuracy/wrong/blunder） |
| 课程联动反馈 | PuzzleCard 显示"去复习"链接，`inferPuzzleLessonId` 将 10 个主题映射到对应课程 ID |
| Best Record | 在 puzzle-trainer 自己的 store 中持久化（不触碰 progress store 的 elo 字段） |
| 计入 Streak | 任一模式完成时调用 `recordTrainingDay` 计入每日训练 |
| 路由 | `/puzzle`、`/puzzle/rush`、`/puzzle/daily`、`/puzzle/theme/:themeId`，均用 LazyWrapper 包裹 |
| 入口位置 | 侧边栏训练区、移动端底部导航、Dashboard 快速入口卡片网格 |
| i18n | `puzzle.*` 完整 i18n 树，zh/en 双语齐全 |
| 不引入新依赖 | 仅复用 framer-motion（已在项目内）+ shadcn/ui + 现有工具 |

### 5.13 ELO 能力分级体系

**功能描述**：引入基于 ELO 算法的五维能力评分体系，将训练答题表现映射到 0-3000 分的连续量表，并定义六段位（新手 / 入门 / 进阶 / 中级 / 高级 / 专家）徽章。每次答题后实时更新对应维度的 ELO 分数，段位升级时触发全屏庆祝动画，让用户的能力成长可视化、可量化、可激励。

**用户故事**：
- 作为一名希望量化成长的用户，我希望每次答题后我的能力分数能即时更新，让我清楚知道自己的水平
- 作为一名刚达到新段位的用户，我希望看到庆祝动画并了解新段位对应的描述，获得清晰的成长反馈
- 作为一名想发现自己弱项的用户，我希望看到五维能力雷达图（翻前 / 翻后 / 赔率数学 / 牌局阅读 / 心态一致性）让我知道下一步该练什么
- 作为一名 Dashboard 访客，我希望顶部能看到当前段位徽章 + 名称 + 分数，一眼了解自己的能力定位

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 类型定义 | `src/shared/types/elo.ts` 定义 `EloRating`（overall / preflop / postflop / math / handReading / mental / kFactor / gamesPlayed / lastUpdated）、`Rank` 接口、`RANKS` 六段位常量、`DEFAULT_ELO`（500 起始分）、`RankUpEvent` |
| 六段位 | 新手 🌱 (0-500) / 入门 🎯 (500-800) / 进阶 ♠️ (800-1200) / 中级 ♥️ (1200-1600) / 高级 ♦️ (1600-2000) / 专家 ♣️ (2000-3000) |
| ELO 算法 | `src/shared/utils/elo.ts` 实现简化 ELO 公式 `E = 1 / (1 + 10^((diff*800 - rating + 400) / 400))`，`delta = K * (S - E)` |
| 动态 K 因子 | 新手 (<50 局) K=48 / 默认 K=32 / 高分 (>200 局且 overall>1600) K=24 |
| 维度对应 | preflop ← range-trainer；math ← pot-odds；postflop ← gto-simulator；handReading / mental 暂用映射占位（P2 阶段补足数据源） |
| 状态集成 | 集成到 progress store，包含 ELO 五维评分与段位升级事件（技术细节见 TDD） |
| 数据迁移 | 老用户数据自动迁移，首次加载时从 strategy-academy 同步初始 ELO（技术细节见 TDD） |
| 训练集成 | range-trainer / pot-odds / gto-simulator 三个 quiz hook 分别暴露 `recordEloForAnswer` 记录器，对应答题后更新 preflop / math / postflop 维度 |
| Dashboard 显示 | 欢迎区下方新增段位徽章按钮（icon + 名称 + overall 分数 + Trophy 图标），边框色随段位变化，点击跳转 `/progress` 查看五维雷达图 |
| 五维雷达图升级 | `WeaknessAnalysis.tsx` 数据源从训练记录（0-100 正确率）切换为 ELO 五维分数（0-3000）；维度标签更新为翻前 / 翻后 / 赔率数学 / 牌局阅读 / 心态一致性；雷达图边框/填充色随当前段位颜色变化；右上角同步展示段位徽章；`gamesPlayed===0` 时显示空状态 |
| 段位升级庆祝 | `RankUpCelebration.tsx` 全屏 Dialog，含 emoji 大徽章 + 旧段位→新段位过渡展示 + CSS 彩纸粒子动画（framer-motion，已在项目内）；5 秒后自动关闭，关闭时调用 `clearEloRankUp` |
| i18n | `elo.*`（unit / rankBadge.aria / radar.*）与 `rankUp.*`（title / subtitle / continue）键，zh/en 双语齐全 |
| 不引入新依赖 | 仅复用 framer-motion（已在项目内）+ recharts（已在项目内）+ shadcn/ui Dialog |

**核心 Actions**：

| Action | 描述 |
|---|---|
| `updateElo(dimension, isCorrect, difficulty)` | 应用 ELO 变化到指定维度，重算 overall/kFactor/gamesPlayed，自动检测段位升级并设置 `eloRankUp` |
| `resetElo()` | 重置 ELO 为默认值（gamesPlayed 清零），用于设置页"重置能力评分" |
| `clearEloRankUp()` | 关闭庆祝 Dialog 后清空 `eloRankUp` 状态 |
| `syncEloFromAcademyAbility(aa)` | 从 strategy-academy 的 abilityAssessment 同步初始 ELO，仅当 `gamesPlayed===0` 时生效（避免覆盖已累积进度） |

**验收标准**：
1. `elo.ts` 定义 `EloRating` / `Rank` / `RANKS`（六段位）/ `DEFAULT_ELO` / `RankUpEvent`
2. `calculateEloChange` 含动态 K 因子（新手 48 / 默认 32 / 高分 24）
3. `getRankForScore` 正确返回对应段位
4. progress store 添加 `elo` 字段（技术细节见 TDD）
5. 老用户数据自动迁移，不丢失（技术细节见 TDD）
6. range-trainer / pot-odds / gto-simulator 训练答题后对应维度 ELO 更新
7. Dashboard 顶部显示段位徽章 + 名称 + overall 分数
8. 五维雷达图使用 ELO 分数（0-3000 量纲），维度标签为翻前 / 翻后 / 赔率数学 / 牌局阅读 / 心态一致性
9. 段位升级触发庆祝动画（全屏 Dialog，含旧段位→新段位过渡）
10. 所有用户可见文案通过 useTranslation 引用 i18n key，zh/en 双语齐全

### 5.14 间隔重复系统（SRS）落地

**功能描述**：将既有的 SM-2 间隔重复算法与实际训练题打通——range-trainer / pot-odds / gto-simulator 三个训练模块的答题结果自动注册/更新 ReviewItem；Dashboard 的 SpacedRepetitionPanel 升级为带"开始复习"主 CTA、今日进度条与"已完成"状态的入口；新增 Dialog-based 复习模式组件 ReviewSession，按类别混合渲染今日待复习项（多选题 / 自评 / 退化自评三种模式），完成后显示"今日复习已完成 ✓"总结页。同时实现每日训练题目组成逻辑：30% SRS 复习 + 70% 新题，用户正确率低时动态增加复习比例（< 0.6 → 50%，< 0.4 → 70%）。

**用户故事**：
- 作为一名希望长期记忆训练内容的用户，我希望系统在我即将遗忘时自动把旧题推回训练队列，而不是只让我做新题
- 作为一名复习意愿强的用户，我希望在 Dashboard 一眼看到"今日待复习 N 题"，并能直接点击"开始复习"进入复习模式，而不必跳转到其他页面
- 作为一名正确率低的用户，我希望系统自动增加复习比例（多复习、少新题），帮我巩固薄弱点
- 作为一名完成今日复习的用户，我希望看到明显的"已完成 ✓"反馈与本次复习的正确率/用时总结

**功能规格**：

| 规格项 | 描述 |
|---|---|
| SRS 算法 | 复用 `features/progress/utils/spacedRepetition.ts` 的 SM-2 简化实现（间隔序列 1→3→7→14→30 天，easeFactor 动态调整） |
| ReviewItem 元数据扩展 | 新增 `ReviewItemMetadata` 接口（front / back / options / source / scenario），复习模式据此渲染原题内容 |
| 训练模块集成 | range-trainer `useQuizEngine.recordSrsForAnswer` / pot-odds `useOddsSrsRecorder` / gto-simulator `useGtoSrsRecorder` 三个 hook 暴露记录器，答题后调用 `processReview` 更新复习项 |
| 题目 ID 规范 | `range:{position}:{hand}` / `odds:{questionId}` / `gto:{scenarioId}`，确保跨模块唯一 |
| Quality 评分 | 答对+用时<5秒→5；答对→4；答错→1（自评"记得"→5；"不记得"→1） |
| 每日混合比例 | `composeDailyMix(newQuestions, reviewItems, totalCount, userAccuracy)`：默认 30% 复习 + 70% 新题；正确率 < 0.6 → 50% / 0.4 → 70%；今日复习队列为空 → 全部用新题 |
| SpacedRepetitionPanel 升级 | 新增"开始复习"主 CTA（brass 色，含 PlayCircle 图标 + 剩余数量徽章）、今日进度条（已复习/总数）、"已完成" / "今天没有待复习的内容"双状态、底部统计保留 |
| ReviewSession 组件 | Dialog-based，支持三种渲染模式：多选题（metadata.options 存在）/ 自评（metadata.front/back 存在）/ 退化自评（无 metadata）；每题答完调用 `processReview`；完成后显示总结页（总题数 / 答对 / 正确率 / 用时） |
| 复习完成检测 | "今日已复习数"基于 `lastReviewedAt` 落在今日的项数；"今日待复习总数" = 已复习数 + 当前仍待复习数；用户完成所有复习后显示 "✅ 今日复习已完成" |
| Dashboard 集成 | 新增 `reviewSessionOpen` 本地状态，通过 `onStartReview` 回调传递给 SpacedRepetitionPanel，渲染 `<ReviewSession>` Dialog |
| i18n | `spacedRepetition.*` 扩展 9 个新键（title / allDone / allDoneMessage / emptyToday / progressLabel / lastReview / moreItems / totalItems / review）；新增 `review.*` 命名空间（title / subtitle / showAnswer / remembered / forgot / next / finish / complete.* / empty.* 等 16 个键），zh/en 双语齐全 |
| 计入 Streak | 复习完成不直接调用 `recordTrainingDay`（复习属于巩固而非首次训练，Streak 由训练模块自身记录） |

**API 与组件**：

| 组件 / 函数 | 路径 | 职责 |
|---|---|---|
| `ReviewItemMetadata` | `features/progress/utils/spacedRepetition.ts` | 复习项附加元数据接口（front / back / options / source / scenario） |
| `createReviewItem(id, label, category, metadata?)` | `features/progress/utils/spacedRepetition.ts` | 创建新复习项，支持可选 metadata |
| `recordSrsForAnswer` | `features/range-trainer/hooks/useQuizEngine.ts` | range-trainer 答题后注册/更新 SRS |
| `useOddsSrsRecorder` | `features/pot-odds/hooks/useOddsCalculation.ts` | pot-odds 答题后注册/更新 SRS |
| `useGtoSrsRecorder` | `features/gto-simulator/hooks/useGTOComparison.ts` | gto-simulator 决策后注册/更新 SRS |
| `composeDailyMix` / `getReviewRatio` | `features/progress/utils/dailyTrainingMix.ts` | 每日训练题目组成逻辑（30%/50%/70% 动态复习比例） |
| `SpacedRepetitionPanel` | `features/progress/components/SpacedRepetitionPanel.tsx` | 升级后的复习面板（CTA + 进度 + 列表 + 统计） |
| `ReviewSession` | `features/progress/components/ReviewSession.tsx` | Dialog-based 复习模式（多选 / 自评 / 退化自评三模式 + 总结页） |

**验收标准**：

1. range-trainer / pot-odds / gto-simulator 答题后自动调用对应 SRS 记录器
2. ReviewItem.metadata 包含 front / back / options / source / scenario 等字段
3. 每日训练混合比例：默认 30% 复习 + 70% 新题；正确率 < 0.6 → 50%；< 0.4 → 70%
4. SpacedRepetitionPanel 显示"今日待复习 N 题"，含主 CTA"开始复习"按钮
5. 点击"开始复习"打开 ReviewSession Dialog，按类别混合渲染今日待复习项
6. ReviewSession 支持 metadata.options 多选题模式（自动判分）、metadata.front/back 自评模式（用户自评"记得/不记得"）、无 metadata 退化自评模式
7. 复习完成后显示"今日复习已完成 ✓"总结页（总题数 / 答对 / 正确率 / 用时）
8. 进度条根据 `lastReviewedAt` 落在今日的项数动态更新
9. 所有用户可见文案通过 useTranslation 引用 i18n key，zh/en 双语齐全

### 5.15 3 分钟快速训练扩展（P1-4）

**功能描述**：在 P0-5 首页"3 分钟快速训练"入口的基础上扩展三大能力——快速训练完成后将综合分数计入 Puzzle Rush 风格的 Best Record（独立于 puzzle-trainer 既有的 rushBest / dailyBest / themeBest，避免污染既有指标）；快速训练题目与 SRS 复习队列打通，复用 P1-3 的 `composeDailyMix` 与 `getTodayReviewItems`，按 30% 比例将今日待复习的选择题混合进入本次训练（复习题前置作为热身）；连续 7 天完成快速训练额外奖励 1 张冻结卡（与 `streak` 子计数器独立，触发 7 / 14 / 21 … 倍数时调用 `awardStreakFreeze(1)`）。

**用户故事**：
- 作为一名希望快速训练有积累感的用户，我希望每次完成 3 分钟训练后，综合分数（正确率 + 时间奖励）能保留 Best Record，下次打破纪录时有醒目提示
- 作为一名需要长期记忆训练内容的用户，我希望快速训练也自动混合今日的 SRS 复习题，而不是只做新题
- 作为一名坚持每天训练的用户，我希望连续 7 天完成快速训练能额外奖励 1 张冻结卡，为长 streak 兜底
- 作为一名同日多次训练的用户，我希望"今日已计入"幂等，不会因为重复训练刷掉连续天数

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 综合分数公式 | `accuracy * 100 + 时间奖励`；时间奖励 = `max(0, round((10 - averageTime) * 3))`，每比 10s/题 快 1s 得 3 分，最高 30 分 |
| Best Record 存储 | puzzle-trainer store 新增 `quickDrillBest: QuickDrillBestRecord \| null`（bestScore / bestAccuracy / bestTime / achievedAt），与 `rushBest / dailyBest / themeBest` 解耦（技术细节见 TDD） |
| 提交动作 | `submitQuickDrillResult({ score, accuracy, timeTaken })` 返回 `{ isNewRecord, previousBest }`，仅当 `score > previousBest.bestScore` 时更新 |
| SRS 复习混合 | 仅在 quick 模式下：调用 `composeDailyMix(newQuestions, todayReviewItems, questionCount, userAccuracy)` 决定复习题/新题比例；复习题通过 `reviewItemToPracticeQuestion` 转换（仅保留 `metadata.options` 选择题，占位场景 `BTN / preflop`），放在新题之前作为热身 |
| 入口提示 | Dashboard 速训卡片下方显示"今日有 N 道待复习题，将自动混合 30% 进入本次训练"（仅 `todayReviewItems.length > 0` 时显示） |
| 连续打卡 | progress store 新增 `quickDrillStreak: number` 与 `lastQuickDrillDate: string \| null`，与 `streak` 子计数器独立（技术细节见 TDD） |
| 幂等性 | `recordQuickDrillCompletion()` 在 `lastQuickDrillDate === today` 时直接返回当前状态，不重复 +1 |
| 连续判断 | `lastQuickDrillDate === yesterday` → `quickDrillStreak + 1`；否则重置为 1（首次或断签） |
| 冻结卡奖励 | `newStreak % 7 === 0` 时调用 `awardStreakFreeze(1)`，返回 `newBadge: true`；UI 在结果面板显示"🎁 连续 7 天快速训练奖励 1 张冻结卡！" |
| 结果面板扩展 | 在原有"正确率 / 用时 / XP"基础上，按状态显示：复习题数量（Sparkles 蓝色）→ 新纪录（Trophy 金色，仅 isNewRecord）→ 冻结卡奖励（Gift 绿色，仅 freezeRewarded）→ 当前连续天数（Zap 灰色，非奖励轮次显示）→ Streak 计入 ✓ |
| i18n | zh/en 双语：`quickDrill.result.reviewIncluded` / `quickDrill.reviewQueueHint` / `quickDrill.newRecord` / `quickDrill.freezeReward` / `quickDrill.streak.{current, rewarded, broken}` |

**验收要点**：

1. 快速训练完成时调用 `submitQuickDrillResult`，Best Record 写入 puzzle-trainer store（与 progress store 的 elo 字段解耦）
2. 同一用户多次打破纪录时只更新最高分；同分不更新
3. 快速模式下 `todayReviewItems.length > 0` 时按 `composeDailyMix` 比例混合复习题；为 0 时全用新题（保持原有行为）
4. 仅 `metadata.options` 选择题复习项会进入快速训练（自评/退化自评项被过滤）
5. 同日多次完成快速训练：`quickDrillStreak` 与 `lastQuickDrillDate` 不变，幂等返回
6. 连续第 7 / 14 / 21 … 天触发 `awardStreakFreeze(1)`，并显示绿色 Gift 提示
7. 第 1 天或断签后第一天完成：`quickDrillStreak` 重置为 1，不触发奖励
8. 结果面板四类提示按状态优先级正确显示（新纪录 → 冻结卡奖励 → 当前连续天数）
9. 所有用户可见文案通过 useTranslation 引用 i18n key，zh/en 双语齐全

### 5.16 策略学院（Strategy Academy）

**功能描述**：系统化学习中心，提供三段式互动教学（概念讲解 → 实例演示 → 实践测验），覆盖德扑基础入门、GTO 决策思维、对手阅读等核心课程，配套知识图谱可视化与等级解锁机制，帮助用户建立完整的策略知识体系。自理论学院（5.27）上线后，本模块在学习链条中的定位调整为“理论知识的实践应用、复习巩固与技能训练”，与理论学院共同构成“理论学习 → 实践应用 → 复习巩固”的完整闭环。

课程体系共 **9 个 Level 节点**（8 个等级，其中 L4 拆分为两个子节点）：

| Level | 主题 | 备注 |
|-------|------|------|
| L1 | 德扑基础入门 | 规则、牌型、位置、术语 |
| L2 | 翻前基础 | RFI、位置意识、3Bet 基础 |
| L3 | 翻后基础 | C-Bet、持续下注、多街玩法、3Bet 翻后策略 |
| L4A | 范围与EV思维 | 翻前范围构造、EV 计算与应用 |
| L4B | GTO与博弈论 | Nash 均衡、MDF、最小防御频率 |
| L5 | 中级策略 | 对手阅读、工具使用、线上 vs 线下 |
| L6 | 高级翻后 | 复杂翻后场景、剥削策略 |
| L7 | 高级策略 | 单挑(Heads-Up)策略、高级场景 |
| L8 | 综合实战 | 综合应用、实战模拟 |

**解锁规则**：
- 默认顺序解锁：完成当前 Level 后解锁下一个
- **L7** 需完成 L3 + L5（跨级前置条件）
- **L8** 需完成 L4B（GTO 与博弈论）
- 本土低级别盈利路径需完成 L1-L3

**用户故事**：
- 作为一名零基础用户，我希望有结构化的课程引导我从基础规则学起，避免盲目刷题
- 作为一名进阶玩家，我希望系统讲解 GTO 决策思维，让我理解最优策略背后的逻辑
- 作为一名想提升对手阅读能力的用户，我希望学习对手形象分类与范围推断方法
- 作为一名视觉学习者，我希望通过知识图谱看到课程间的依赖关系，规划学习路径

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 三段式互动教学 | 每课时包含概念讲解 → 实例演示 → 实践测验的完整学习闭环 |
| 德扑基础入门 | 面向零基础用户的前置引导页，覆盖规则、牌型、位置、术语 |
| GTO 课程 | 系统讲解 GTO 决策思维，包含翻前范围、下注尺度、频率控制 |
| 对手阅读课程 | 教授对手形象分类（TAG/LAG/NIT/Calling Station）、范围推断、策略调整方法 |
| 对手形象系统 | 四种典型对手形象分类，含 VPIP/PFR/AF 等核心统计指标可视化与针对性策略建议 |
| 知识图谱 | 可视化课程知识依赖关系（DAG），节点状态：已掌握 / 学习中 / 未解锁，支持点击跳转 |
| 等级解锁 | 完成当前等级课程后自动解锁下一等级内容 |
| 课程双层门禁 | CourseView 同时检查 Level 解锁与 prerequisite 解锁，防止 URL 绕过；`mental-tilt-recognition` 例外（无前置依赖） |
| 每日训练计划 | 基于用户进度和弱项智能推荐每日训练任务 |
| 难度自适应 | 根据正确率动态调整训练难度，保持最佳学习区间；QuickDrill 连续答错 ≥3 次自动降级（不低于 beginner） |
| 筹码量与下注尺度 | 支持不同有效筹码量（20BB/50BB/100BB）的场景训练，覆盖 1/3 pot、1/2 pot、3/4 pot、pot、overbet 等常见尺度 |
| 学习路径横向推荐 | 完成课程路径后推荐关联学习路径（relatedTrackIds），形成学习网络 |
| L4 拆分 | 原 L4（GTO 与博弈论基础）拆分为 L4A（范围与EV思维）和 L4B（GTO与博弈论），降低单级内容负荷 |
| 4 门新课程 | l3-3bet-postflop（3Bet翻后策略）、l7-hu（单挑策略）、l5-tools（扑克工具指南）、l5-online-vs-live（线上vs线下差异） |

**验收标准**：
1. 学院主页展示 9 个 Level 节点（8 级，L4 拆为 L4A/L4B 两个子节点）的等级列表与进度环
2. 每个课时支持三段式学习流程（讲解 → 演示 → 测验）
3. 知识图谱正确渲染课程依赖关系，支持点击跳转
4. 完成当前等级课程后自动解锁下一等级（L7 需完成 L3+L5，L8 需完成 L4B）
5. 对手形象系统展示四种典型分类及对应策略建议
6. 每日训练计划基于用户进度生成推荐
7. 未达 Level 或未完成 prerequisite 的课程以锁定状态显示，无法通过 URL 直接访问（`mental-tilt-recognition` 除外）
8. QuickDrill 连续答错 3 次后自动降级到更低难度
9. 4 门新课程（l3-3bet-postflop / l7-hu / l5-tools / l5-online-vs-live）可正常访问
10. 完成课程路径后显示关联学习路径推荐

### 5.17 本土低级别盈利路径

**功能描述**：面向活跃在国内低级别局（NL2-NL200、线下俱乐部）的玩家，提供针对本土常见场景的系统化学习路径，覆盖 Limp 局应对、Ante/Straddle、深筹码调整、玩家剥削、GTO 与剥削平衡、情绪管理六大模块。

**用户故事**：
- 作为一名国内低级别局玩家，我希望学习针对 Limp 局和跟注站的剥削策略
- 作为一名俱乐部常客，我希望了解 Straddle 结构下的翻前范围调整
- 作为一名想稳定盈利的玩家，我希望系统学习情绪管理与 Session 止损纪律

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 学习轨道 | 本土低级别盈利路径，6 模块 16 课，预计 8-10 小时 |
| 前置条件 | 需完成 L1-L3（德扑基础入门、翻前基础、翻后基础）方可解锁本路径 |
| 模块 1 Limp 局应对 | 国内最常见桌型：Limp 局特点、隔离加注、多人底池翻后应对（3 课） |
| 模块 2 Ante/Straddle | BTN Straddle、UTG Straddle、Ante 结构的翻前范围调整（2 课） |
| 模块 3 深筹码调整 | 500BB+ 深筹的隐含赔率、同花连牌策略、反向隐含赔率陷阱（2 课） |
| 模块 4 玩家剥削 | 跟注站/Maniac/Nit/LAG 四类对手的针对性剥削策略（4 课） |
| 模块 5 GTO 与剥削平衡 | 何时坚守 GTO、何时偏离、基于统计偏差的具体偏离策略（2 课） |
| 模块 6 情绪管理 | Tilt 识别、止损纪律、Session 管理与长期盈利心态（3 课） |
| 对手画像训练 Drill | 8 道判断题，根据 VPIP/PFR/AF 等统计判断对手类型并选择应对策略 |
| 本土化内容 | 所有文案使用中文，结合国内实战场景（Limp 局、跟注站众多、抽水高、俱乐部 Straddle） |

**验收标准**：
1. 学习轨道包含 6 个模块共 16 课
2. 所有课程内容使用中文，结合国内实战场景
3. 对手画像训练 Drill 包含 8 道判断题
4. 完成路径后用户应掌握本土低级别局的核心盈利策略

### 5.18 导师角色人格化

**功能描述**：在五级反馈基础上，引入"教练风格"概念。用户在设置中选择一位专属教练后，反馈文案将根据教练风格动态渲染，颜色与图标仍由统一的评级配置控制，仅文案随风格变化，增强反馈的人格化与陪伴感。

**用户故事**：
- 作为一名偏好数学分析的用户，我希望教练以 GTO/EV 视角给出反馈，强化理性决策
- 作为一名有实战经验的用户，我希望教练以老派牌手口吻犀利直接地指出问题
- 作为一名容易气馁的用户，我希望教练以鼓励为主，保持训练动力

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 三种教练风格 | 严谨数学派（GTO/EV 导向）/ 老派牌手（经验导向，犀利直接）/ 鼓励型教练（正向激励） |
| 教练风格切换 | 设置页"教练风格"卡片，3 张教练卡片可点击切换，当前选中项高亮（黄铜金边框 + ring） |
| 文案模板 | 每种风格 × 5 个评级（best/correct/inaccuracy/wrong/blunder）的文案模板，支持 EV 损失与正确动作占位符替换 |
| 反馈组件联动 | GTO 反馈与范围训练答题卡优先使用教练风格文案，缺省时降级到通用 i18n 文案 |
| 偏好持久化 | 教练风格选择持久化保存，老用户迁移时注入默认值（严谨数学派） |

**验收标准**：
1. 设置页展示 3 张教练卡片，可点击切换
2. 切换教练后，后续训练反馈文案立即采用新风格
3. 三种风格 × 五个评级共 15 套文案模板齐全
4. 反馈颜色与图标不随教练风格变化（统一由评级配置控制）
5. 教练风格选择持久化，应用刷新后保留
6. 老用户升级后默认采用严谨数学派，无感知迁移

### 5.19 情绪管理模块

**功能描述**：通过 Tilt 前兆识别、Session 止损、下风期检测、情绪标记四个子功能，帮助用户在疲劳或心态波动时主动休息，避免"越打越差"的恶性循环，培养长期稳定盈利所需的情绪纪律。

**用户故事**：
- 作为一名连续答错的用户，我希望系统及时提醒我休息，避免情绪化决策
- 作为一名自律的玩家，我希望设置每日题量上限，强制自己适时停止
- 作为一名遭遇下风期的用户，我希望系统识别并提示正确率下降趋势，给出应对建议
- 作为一名想了解情绪与表现关系的用户，我希望记录每日情绪并看到与正确率的关联

**功能规格**：

| 规格项 | 描述 |
|---|---|
| Tilt 前兆识别 | 连续答错 ≥3 题时弹出 Dialog "要不要休息一下？"，提供三选项："我知道了"（仅关闭）/ "学习情绪管理"（跳转 `mental-tilt-recognition` 课程）/ "休息一下"（返回 Dashboard）；全局渲染覆盖所有训练页面 |
| Session 止损 | 达到每日题量上限（0/50/100/200 四档，0=无限）时禁止继续训练并显示提示卡片；在所有训练页面开头检查；上限可在设置页调整 |
| 下风期检测 | 检测最近 3 天正确率严格递减时标记下风期，展示 3 天数据下降趋势与"查看应对指南"按钮（跳转情绪管理课程） |
| 情绪记录 | 提供"好 / 一般 / 差"三档情绪标记按钮，同步展示今日正确率与情绪关联文案（4 种情境） |
| 数据采集 | 答题时自动记录，更新连续答错数、今日答题数、正确率历史（仅保留最近 7 天） |
| 跨日重置 | 新的一天自动重置每日计数器（今日答题数、连续答错数） |

**验收标准**：
1. 连续答错 3 题时弹出 Tilt 提醒 Dialog，提供三选项（"我知道了" / "学习情绪管理" / "休息一下"）
2. 达到每日题量上限时训练页面显示止损提示，无法继续答题
3. 设置页可调整每日题量上限（0/50/100/200 四档）
4. 连续 3 天正确率下降时首页显示下风期提示卡片
5. 下风期提示卡片"查看应对指南"按钮跳转情绪管理课程
6. 用户可标记今日情绪（好/一般/差），并看到与正确率的关联文案
7. 新的一天自动重置每日计数器
8. 所有文案支持中英双语

### 5.20 PWA 离线与国际化

**功能描述**：平台级能力，支持离线访问与中英双语切换，确保用户在任何网络环境下都能使用，并降低中文用户的学习门槛。

**功能规格**：

| 规格项 | 描述 |
|---|---|
| PWA 离线模式 | Service Worker 缓存核心资源，支持离线访问；Web App Manifest 配置，支持"添加到主屏幕"；离线时训练数据本地保存 |
| 国际化 | 支持中文（zh）和英文（en）双语界面，默认中文，可在设置中切换 |
| 跨模块一致性 | 全局 Toast 提示系统（success/error/info/warning）、统一空状态组件、统一加载骨架屏、统一训练结果页布局、键盘快捷键面板 |

**验收标准**：
1. 应用可安装到主屏幕，离线状态下可正常访问训练模块
2. 切换语言后所有界面文案立即更新
3. 各模块空数据时显示一致的引导界面
4. 页面懒加载时显示统一的骨架屏
5. 训练模式下按 `?` 显示快捷键面板

### 5.21 冻结卡碎片系统

**功能描述**：引入碎片掉落机制，用户在训练过程中有概率获得冻结卡碎片，集齐 5 片碎片可合成 1 张冻结卡，为 Streak 保护提供额外获取途径，增强训练动力。

**用户故事**：
- 作为一名希望积累冻结卡的用户，我希望每次训练都有机会获得碎片，让我更有动力坚持训练
- 作为一名冻结卡不足的用户，我希望通过日常训练积累碎片而非仅依赖里程碑奖励

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 碎片掉落概率 | 训练模式（范围/GTO/赔率等常规训练）30%、速训模式（QuickDrill）20% |
| 碎片合成 | 5 片碎片合成 1 张冻结卡，调用 `synthesizeFreezeCard()` 扣减 5 碎片、增加 1 张冻结卡 |
| 每日上限 | 每日最多获得 3 片碎片，避免刷碎片行为 |
| 掉落提示 | 获得碎片时显示动画提示“🧩 获得 1 片冻结卡碎片！(N/5)” |
| 合成提示 | 碎片满 5 片时自动弹出合成确认，合成成功后显示“✅ 合成 1 张冻结卡！” |
| Store 字段 | `freezeCardFragments` / `lastFragmentDate` / `fragmentsEarnedToday` |

**验收标准**：
1. 训练模式完成时有 30% 概率掉落碎片，速训模式 20%
2. 5 片碎片可合成 1 张冻结卡
3. 每日最多获得 3 片碎片
4. 获得碎片时显示动画提示
5. 老用户数据自动迁移（`freezeCardFragments: 0`）

### 5.22 进步回放

**功能描述**：通过 `ProgressReplay` 组件对比用户首次尝试与最近一次的表现，可视化展示各维度进步幅度，让用户直观看到自己的成长轨迹。

**用户故事**：
- 作为一名持续训练的用户，我希望看到自己从首次训练到现在的进步幅度，增强训练动力
- 作为一名回归用户，我希望快速了解自己离开后哪些能力有提升、哪些需要巩固

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 对比数据 | `firstAttemptScores`（首次尝试分数）vs `lastAttemptScores`（最近一次分数） |
| 展示维度 | 各训练模块的正确率、用时、ELO 分数变化 |
| 可视化 | 柱状图/折线图对比首次 vs 最近表现，进步用绿色、退步用红色 |
| 入口 | 进度追踪页面顶部“查看我的进步”卡片 |

**验收标准**：
1. ProgressReplay 组件正确对比首次与最近表现
2. 各维度进步幅度可视化展示
3. 进步用绿色、退步用红色区分

### 5.23 GTO 偏差检测

**功能描述**：在 hand-history 模块集成 GTO 偏差分析面板，对导入的历史牌局进行自动 GTO 对比，识别关键决策点的偏差，帮助用户发现实战中的策略漏洞。

**用户故事**：
- 作为一名进阶玩家，我希望在复盘牌局时能看到每个决策点与 GTO 的偏差，快速定位策略漏洞
- 作为一名教练，我希望用 GTO 偏差分析帮助学生理解实战中的错误

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 偏差分析面板 | 在牌局回放页面侧边栏显示 GTO 偏差分析结果 |
| 偏差指标 | EV 损失（BB/100）、动作频率偏差、范围偏离度 |
| 偏差标记 | 每个决策点标记偏差等级（best / correct / inaccuracy / wrong / blunder） |
| 汇总报告 | 整手牌局的总 EV 损失、最大偏差决策点、改进建议 |

**验收标准**：
1. 导入牌局后可查看 GTO 偏差分析面板
2. 每个决策点显示偏差等级与 EV 损失
3. 汇总报告展示整手牌局的 GTO 偏差概况

### 5.24 学习路径横向推荐

**功能描述**：用户完成某个学习路径后，系统根据 `relatedTrackIds` 推荐关联的学习路径，形成学习网络，帮助用户发现相关但不一定直接依赖的课程内容。

**用户故事**：
- 作为一名完成某路径的用户，我希望系统推荐相关路径，继续扩展知识面
- 作为一名有明确目标的用户，我希望看到路径之间的关联关系，规划最优学习顺序

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 推荐时机 | 完成学习路径全部课程后显示推荐卡片 |
| 推荐数据 | 每个 LearningTrack 的 `relatedTrackIds` 字段定义关联路径 |
| 推荐展示 | 卡片式展示关联路径名称、简介、课程数、难度等级 |

**验收标准**：
1. 完成学习路径后显示关联路径推荐
2. 推荐卡片展示路径名称、简介、课程数
3. 点击推荐卡片可跳转对应学习路径

### 5.25 本土化路径前置条件

**功能描述**：本土低级别盈利路径（5.17）设置前置条件，用户需完成 L1-L3（德扑基础入门、翻前基础、翻后基础）方可解锁该路径，确保用户具备足够的基础知识再学习本土策略。

**用户故事**：
- 作为一名已完成基础课程的用户，我希望直接进入本土化路径学习，无需重复基础内容
- 作为一名新用户，我希望了解需要先完成哪些基础课程才能学习本土策略

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 前置条件 | 需完成 L1 + L2 + L3 全部课程 |
| 未解锁提示 | 路径卡片显示锁定状态，提示“需完成 L1-L3 基础课程” |
| 进度跳转 | 锁定提示中提供快捷链接跳转到未完成的最低等级课程 |

**验收标准**：
1. 未完成 L1-L3 时本土化路径显示锁定状态
2. 锁定提示正确显示“需完成 L1-L3 基础课程”
3. 完成 L1-L3 后路径自动解锁

---

### 5.26 答题选项呈现策略（防位置作弊）

**功能描述**：全平台所有选择题型训练（谜题 / 课程测验 / Drill / 赔率测验）统一答题选项的呈现顺序策略，消除"正确答案总在固定位置"的可作弊模式，同时让选项顺序本身服务教学。

**背景**：题库数据的书写习惯导致正确答案高度集中于特定位置（治理前最高 87% 集中于第一项），用户无需思考即可通过"总选同一位置"获得高正确率，训练价值失效。

**策略规格**：

| 选项类型 | 呈现顺序 | 教学依据 |
|---|---|---|
| 动作类（Fold/Check/Call/Bet/Raise/全下） | 按"消极→激进"固定语义排序，同类动作按尺度从小到大 | 与真实扑克客户端一致，选项布局本身成为"动作光谱"教具 |
| 纯数值类（outs 数 / 胜率 / 赔率） | 数值单调排列（课后测验一律升序；Drill 升/降序方向按题目固定随机） | 便于扫读与心算对比；方向变化防止"背第几个" |
| 文字陈述类 | 每题独立随机顺序，同一题跨会话稳定 | 打破位置模式；复习时顺序不变利于巩固 |
| 认证考试 | 每次进入考试重新随机 | 评估场景，防止重考背位置 |

**验收标准**：
1. 任一题库中，正确答案落在单一位置的占比不超过 60%
2. 每日谜题保持"同一天所有用户看到相同题目与相同选项顺序"
3. 课程测验/复习场景下，同一题的选项顺序跨会话保持一致
4. 中英文界面下同一题的选项顺序一致

---

### 5.27 理论学院（Theory Academy）

**功能描述**：独立的理论学习模块，承载业界公认的权威德扑理论体系（概率论、期望值与赔率、位置与起手牌理论、范围理论、博弈论/GTO/MDF、下注理论、对手分析、扑克心理学、经典著作综合），与策略学院（5.16）并列存在：理论学院负责“理论学习与知识构建”，策略学院负责“实践应用与技能训练”，形成完整学习闭环。

理论体系共 **9 个 Level**，按三段分级（基础 T1-T3 / 中级 T4-T6 / 高级 T7-T9）：

| Level | 主题 | 核心内容 |
|-------|------|------|
| T1 | 概率论基础 | 组合计数、Outs 与 2/4 法则、方差与长期视角 |
| T2 | 期望值与赔率体系 | EV 计算、底池赔率、隐含/反向隐含赔率 |
| T3 | 位置与起手牌理论 | 位置价值、Gap Concept、Sklansky 基本定理、主动权 |
| T4 | 范围理论 | 范围思维、组合数学与 Blockers、范围/坚果优势 |
| T5 | 博弈论基础 | 纳什均衡、GTO 概念、MDF 与 Alpha、混合策略与节点锁定 |
| T6 | 下注理论 | 下注目的、极化与线性尺度、SPR 与几何尺度、频率控制 |
| T7 | 对手分析理论 | VPIP/PFR/AF/WTSD 指标、玩家类型学、读牌流程、剥削调整 |
| T8 | 扑克心理学 | Tilt 识别、Session 管理、资金心理、认知偏差与长期心态 |
| T9 | 经典理论综合 | MOP 要义、ICM 理论、多人底池、GTO-剥削统一框架 |

**用户故事**：
- 作为一名想系统学习的玩家，我希望有一处集中、分级的理论知识库，而不是碎片化地从各训练模块里拼凑概念
- 作为一名进阶玩家，我希望深入理解 GTO/MDF/范围等概念背后的数学原理，而不止于会用
- 作为一名完成理论学习的用户，我希望系统推荐对应的实践课程，把知识转化为决策能力

**功能规格**：

| 规格项 | 描述 |
|---|---|
| 章节式学习 | 每 Level 含 3-4 章，每章 = 概念讲解（含公式与实例分析段落）+ 章末小测（3-5 题） |
| 顺序解锁 | T1 默认解锁，Tn 需完成 T(n-1) 全部章节；章节页防 URL 绕过；调试解锁（5.6.6）可旁路 |
| 章末小测驱动进度 | 小测提交即完成该章（幂等），得分记录历史最高分 |
| 能力评分集成 | 每章声明 ELO 维度（数学/翻前/翻后/读牌/心态），答题实时影响对应维度 ELO 与情绪计数 |
| 进度追踪集成 | 小测完成发射训练事件计入统计；计入 Streak 每日训练 |
| 成就集成 | 4 项理论成就：首章完成 / 基础段完成 / 中级段完成 / 全部 9 Level 完成（奖励冻结卡） |
| 理论→实践桥接 | 每个 Level 完成后展示“去实践”推荐卡（对应策略学院课程/轨道）；策略学院新增“理论到实践”学习轨道承接 |
| 选项排序治理 | 章末小测遵循 5.26 策略：文字选项按题目 id 哈希种子洗牌，数值选项单调排列 |
| 双语与响应式 | 导航入口与主页 chrome 支持 zh/en；章节页/小测等模块内 chrome 与理论正文均为中文（与策略学院课程口径一致）；支持桌面/平板/移动布局 |

**验收标准**：
1. 侧边栏“训练”分组展示“理论学院”入口，紧邻“策略学院”并列可达；移动端底部导航亦含“理论学院”项
2. 主页按三段分级展示 9 个 Level 卡片，含进度环与锁定态
3. 未解锁 Level 的章节无法通过 URL 直接访问（调试解锁除外）
4. 每章支持“阅读 → 章末小测 → 完成”流程，小测选项经统一排序处理
5. 小测答题实时更新对应维度 ELO，完成后训练记录出现在进度统计中
6. 完成整个 Level 后展示“去实践”推荐卡，链接可跳转策略学院对应课程
7. 4 项理论成就可正常解锁
8. 重复完成同一章不重复计数（幂等）

---

## 6. 非功能需求

### 6.1 性能要求

| 指标 | 目标值 |
|---|---|
| 首屏加载时间（FCP） | < 1.5 秒（4G 网络） |
| 最大内容绘制（LCP） | < 2.5 秒 |
| 交互响应延迟 | < 100 毫秒 |
| 路由切换时间 | < 300 毫秒（懒加载 + Suspense） |
| 本地存储读写 | < 50 毫秒 |

### 6.2 浏览器兼容性

| 浏览器 | 最低版本 |
|---|---|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |
| 移动端 Safari | iOS 15+ |
| 移动端 Chrome | Android 10+ |

### 6.3 响应式设计要求

1. 支持桌面端（≥1024px）、平板端（768px-1023px）、移动端（<768px）三种布局
2. 13×13 范围网格在移动端支持横向滚动或自适应缩放
3. 底部导航栏在移动端替代侧边栏导航
4. 图表组件在不同屏幕尺寸下自适应高度和宽度

### 6.4 无障碍（A11Y）

1. 所有交互元素可通过键盘访问（Tab 导航、Enter/Space 激活）
2. 颜色对比度满足 WCAG 2.1 AA 标准（正文 ≥ 4.5:1，大文字 ≥ 3:1）
3. 图标和图形元素提供 `aria-label` 文本替代
4. 动态内容变化使用 `aria-live` 区域通知屏幕阅读器

### 6.5 数据持久化

1. 所有训练记录使用 IndexedDB 本地存储
2. 用户设置（语言、主题）使用 localStorage 存储
3. 导入的牌局历史使用 IndexedDB 存储，支持大数据量
4. 数据结构设计支持未来导出为 JSON/CSV 格式

---

## 7. 用户旅程

### 7.1 新用户首次使用流程

```
打开应用 → Dashboard 首页（欢迎提示 + 功能总览）
    → 浏览每日挑战卡片（了解训练形式）
    → 点击"手牌范围训练"入口卡片
    → 查看 13×13 范围网格（学习模式）
    → 选择位置和动作类型，浏览标准范围
    → 进入测验模式，完成首次训练
    → 查看训练结果（正确率 + 用时）
    → 解锁"初出茅庐"成就徽章
```

### 7.2 日常训练流程

```
打开应用 → Dashboard 查看今日挑战
    → 完成每日挑战任务（轮换模块）
    → 进入特定模块深入训练（如 GTO Spot 练习）
    → 训练后查看进度统计页
    → 观察正确率趋势和能力雷达图变化
    → 根据薄弱点分析选择下次训练重点
```

### 7.3 进阶学习路径

```
阶段一：基础建设（1-2 周）
    → 手牌范围学习模式：熟悉各位置开牌范围
    → 底池赔率计算器：掌握赔率与胜率的关系
    → 每日挑战保持训练习惯

阶段二：策略提升（3-6 周）
    → 手牌范围测验模式：强化记忆，目标正确率 > 80%
    → GTO 场景训练：学习标准决策模式
    → EV 计算器练习：量化分析不同行动

阶段三：实战应用（7 周+）
    → 导入实战牌局进行复盘分析
    → 标注关键决策点，识别思维盲点
    → GTO Spot 练习针对性强化弱点
    → 追踪五维能力雷达图，持续均衡发展
```

---

## 8. 设计约束

### 8.1 UI/UX 设计规范

#### 设计语言

经典德州扑克主题——以实体牌桌为灵感，营造沉浸式的扑克训练环境。

#### 色彩体系

采用四层色彩架构（私人牌室风格）：

| 层级 | 变量名 | 色值 | 用途 |
|------|--------|------|------|
| 牌桌绿呢面 | --felt-deep / --felt / --felt-raised | #0e1a14 / #15301f / #1d4029 | 页面背景、主表面、悬停抬升 |
| 象牙白 | --ivory / --ivory-dim / --ivory-muted | #f3ebd9 / #cabf9f / #8a8068 | 文字层级（主/次/弱） |
| 黄铜金 | --brass / --brass-bright / --brass-deep | #c9a25e / #e0bd75 / #a07d3d | 唯一强调色、发丝线、激活态 |
| 胡桃木 | --walnut / --walnut-raised / --walnut-border | #241a10 / #3a2a18 / #4a3825 | 侧边栏、面板、边框结构 |

#### 语义色

| 变量 | 色值 | 用途 |
|------|------|------|
| --success / --success-bg | #7fb883 / rgba(127,184,131,0.12) | 正确反馈、盈利指标 |
| --danger / --danger-bg | #c25a4c / rgba(194,90,76,0.12) | 错误反馈、亏损指标 |
| --warning / --warning-bg | #c9a25e / rgba(201,162,94,0.14) | 警告提示、倒计时 |
| --info / --info-bg | #8ba59b / rgba(139,165,155,0.12) | 中性信息提示 |

#### 花色颜色

- 红心 ♥ / 方块 ♦：#d04545（深红，深色背景上清晰可辨）
- 梅花 ♣ / 黑桃 ♠：#f3ebd9（象牙白，深色呢面背景上高可见度）

#### 字体规范

| 用途 | 字体 | 权重 |
|------|------|------|
| 标题（Display） | Fraunces (serif) | 600-700 |
| 正文（Body） | Inter Tight (sans-serif) | 400-600 |
| 数字/数据（Mono） | JetBrains Mono | 400-700 |

#### 设计原则

1. 沉浸感：通过绿呢面背景和木质边框营造牌桌氛围
2. 信息层级：象牙白文字四级明度区分主/次/弱/亮
3. 克制装饰：扑克元素点缀但不喧宾夺主
4. 对比度保障：所有文字满足 WCAG AA 标准（4.5:1 对比度）
5. 响应优先：桌面优先设计，平板折叠侧边栏，移动端底部Tab导航

### 8.2 键盘优先交互

1. 全局支持 Tab 键导航，焦点状态清晰可见
2. 训练模式下支持数字键快速选择动作（1=Fold, 2=Call, 3=Raise）
3. 空格键用于确认/提交操作
4. Escape 键退出当前模式或关闭弹窗

### 8.3 纯前端架构（零后端依赖）

1. 技术栈：React 19 + Vite 8 + TypeScript 7 + Zustand 5 + Tailwind CSS 4
2. 状态管理：Zustand 管理全局状态（含 persist 中间件持久化）
3. 路由：React Router v7，页面级懒加载
4. 数据存储：IndexedDB + localStorage，无服务端通信
5. 构建部署：静态文件输出，可部署至任意 CDN 或静态托管服务
6. UI 组件：基于 shadcn/ui 组件库定制

---

## 9. 版本规划

### 9.1 当前版本（v2.1）

平台已完成全部核心功能模块的开发，覆盖训练核心、学习路径、留存激励、反馈教练、平台能力五大类共 25 个功能模块。v2.1 在 v2.0 基础上完成排组打法逻辑系统性排查与修复（详见 `CHANGELOG.md` v1.8），建立规范的初学者入门训练体系，新增位置渐进解锁、反馈闭环（relatedLessonId）、自适应难度、课程双层门禁、冻结卡碎片系统、进步回放、GTO 偏差检测、学习路径横向推荐等能力。

| 类别 | 已交付模块 |
|---|---|
| 训练核心 | 手牌范围训练 / 底池赔率计算器 / GTO 决策模拟器 / 历史牌局复盘 / 扑克谜题 |
| 学习路径 | 策略学院 / 新手引导 / 3 分钟快速训练 / 基础 Drill / 本土低级别盈利路径 / 学习路径横向推荐 / 本土化路径前置条件 |
| 留存激励 | 进度追踪 / Streak 深度机制 / ELO 能力分级 / 间隔重复系统 / 冻结卡碎片系统 / 进步回放 |
| 反馈教练 | 五级反馈分类 / 导师角色人格化 / 情绪管理 / GTO 偏差检测 |
| 平台能力 | 成就系统 / 每日挑战 / 排行榜 / PWA 离线 / 国际化（中/英） |

### 9.2 后续规划

后续版本迭代规划（如翻后策略训练深化、多语言扩展、社区功能、在线排行榜等）将在 `CHANGELOG.md` 中记录，不包含在本 PRD 范围内。

> **文档关系**：
> - **PRD.md**（本文件）：产品规格，描述 What 与 Why
> - **TDD.md**：技术设计，描述 How
> - **CHANGELOG.md**：版本演进与执行历史

