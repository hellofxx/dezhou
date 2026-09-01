// ============================================================================
// PokerLab 德州扑克训练平台 · C4 当前态模型
// 产出：system-modeler（场景）+ c4model（格式源）
// 证据基线：工作树 @ HEAD c966912（含 85 项未提交改动），采集 2026-08-30
// 事实源：仓库代码与配置；docs/PRD.md、docs/TDD.md 仅作补充佐证
//
// 视图清单
//   Context     —— L1 系统边界：谁用它、它碰什么外部东西
//   Containers  —— L2 运行时单元：SPA / Service Worker / Web Worker / 两个浏览器存储
//   Components  —— L3 SPA 内部：10 个 feature 模块 + shared 层 + 装配层
//
// 置信度约定：description 中标 [inferred] / [low] 的元素不作为已证实事实；
//             配套证据索引见 00-evidence.md。
// 预览：在 Qoder 中打开本 .dsl 文件（Structurizr DSL viewer）。
// ============================================================================
workspace "PokerLab 德州扑克训练平台" "当前态 C4 模型（纯前端、零后端）。证据来自 src/ 代码、vite.config.ts、eslint.config.js、.github/workflows/deploy.yml。" {

    !identifiers hierarchical

    model {
        // ------------------------------------------------------------ 人
        learner = person "扑克学员" "使用交互式训练、课程学习与牌局复盘的系统性学习者；单人本地使用，无账号体系。"

        // ------------------------------------------------------------ 外部系统
        pokerRoomExport = softwareSystem "扑克室手牌历史文件" "学员从扑克室导出的文本牌局记录，是 hand-history 的唯一数据来源。" {
            tags "External,File"
        }
        githubPages = softwareSystem "GitHub Pages" "托管 dist/ 静态产物，子路径 /dezhou/。" {
            tags "External"
        }
        browserRuntime = softwareSystem "浏览器运行时" "提供 localStorage、IndexedDB、Service Worker、Web Worker、requestIdleCallback 等平台能力。" {
            tags "External"
        }

        // ------------------------------------------------------------ 被建模系统
        pokerlab = softwareSystem "PokerLab 训练平台" "Vite + React 19 + TypeScript 7 单页应用；纯前端零后端，离线可用，中英双语。" {

            spa = container "SPA 应用" "唯一交付的可执行前端单元；34 条路由、33 个懒加载页面；所有业务模块编译进同一 bundle。" "React 19 + TypeScript 7 strict + Zustand 5 persist + Tailwind 4" {

                // ---------- 装配层
                bootstrap = component "启动装配" "main.tsx：阻塞式 initProgressStore() 后渲染；requestIdleCallback 延迟加载三个 store.bootstrap；SW 注册。App.tsx：ErrorBoundary + Providers + RouterProvider + Toaster。" "TypeScript" "Platform"
                routing = component "路由与代码分割" "app/routes.tsx：lazyPage 并行加载页面 chunk 与 i18n 语言包；AppLayout（带导航 + OnboardingGate）/ BlankLayout（全屏训练与引导）。" "React Router 7" "Platform"
                i18n = component "国际化运行时" "i18n/moduleRegistry.ts 为契约源（31 模块、zh/en 各 32 文件）；preload.ts 做按路由分组注入与幂等去重。" "i18next 26" "Platform"
                theme = component "设计系统" "styles/globals.css 定义四层色彩 token（felt/ivory/brass/walnut，236 个 CSS 变量），暗色默认；designTokenGuard.test.ts 全量扫描防漂移。" "Tailwind 4 + shadcn/ui" "Platform"

                // ---------- 跨模块状态中枢
                hub = component "progress 状态中枢" "62 文件 / store.ts 995 行。集中 Streak · ELO · SRS · Emotion · Mentor 五大系统；persist 'poker-training-progress' v15（表驱动 MIGRATIONS 覆盖 v0→v15，partialize 排除 records 外迁 IndexedDB）；订阅 trainingEvents；26 条成就；Dashboard、统计图表、每日计划的读侧。自适应难度唯一入口 shouldDownshiftDifficulty():902。" "Zustand persist v15" "Hub"

                // ---------- 训练类模块
                rangeTrainer = component "range-trainer 范围训练" "13×13 手牌范围网格、17 个范围预设、位置渐进解锁阈值。会话态 store 不持久化。" "React + 共享 QuizCard" "Training"
                potOdds = component "pot-odds 赔率计算器" "底池赔率 / EV / 听牌胜率计算与 19 题测验；store 仅保存输入态。" "React" "Training"
                gtoSim = component "gto-simulator GTO 模拟器" "运行时生成场景（默认 20）比对 11 个翻前 spot 频率库与翻后 cbet/texture 策略；输出 EV 损失与策略矩阵。" "React" "Training"
                puzzle = component "puzzle-trainer 谜题训练" "205 题 / 10 主题 / 三模式（rush、daily、theme）；daily 用日期种子保证同题同序；persist v3。" "Zustand persist v3" "Training"

                // ---------- 学习类模块
                academy = component "strategy-academy 策略学院" "规模最大的模块（128 文件）。LevelInfo→Lesson→LessonSection/QuizQuestion/PracticeDrill 层级：CourseLevel 定义为 1|…|8，但 standard 变体有 9 个 LevelInfo 节点（L4 拆为 l4a/l4b），共 75 课；short-deck 与 heads-up 覆盖 L3-L8，L1/L2 回退 standard 共享基础层。另有 6 条学习轨道、17 门本土课、15 个概念节点、QuickDrill 与级别认证。persist 'strategy-academy-progress' v5（v0→v5 迁移）。" "Zustand persist v5" "Learning"
                theory  = component "theory-academy 理论学院" "TheoryLevelInfo(T1-T9，分 basic/intermediate/advanced 三段位) → TheoryChapter → TheorySection + TheoryQuizQuestion。standard 32 章 / 160 题（每章 5 题，题内嵌于章节对象）；short-deck 22 章 110 题；heads-up 22 章 101 题。持久化 'theory-academy-progress' v3。" "Zustand persist v3" "Learning"

                // ---------- 支撑类模块
                handHistory = component "hand-history 牌局复盘" "解析 pokerstars/ggpoker/partypoker/手动四种格式（parsers/），回放、统计、GTO 偏差标注；自管 IndexedDB hand-history-db；store.ts:7-10 明确记为训练事件豁免模块（非交互式答题，不产出 TrainingRecord）。" "解析器 + IndexedDB" "Support"
                onboarding = component "onboarding 新手引导" "5 个可见步骤（step 0-4，currentStep>=5 判完成并跳首页）；定位测试 5 题覆盖 4 个能力维度，写入 placementTestScore / initialAbility / dailyGoalMinutes；老手可一步跳过。OnboardingGate 拦截主布局。" "React" "Support"
                helpCenter = component "help-center 帮助中心" "纯静态内容模块，唯一豁免 store.ts：9 篇模块教程、6 步快速上手、6 张概念卡、8 条 FAQ，全部只存 i18n key。" "React" "Support"

                // ---------- 共享层
                shared = component "shared 共享层" "跨模块准入门槛 ≥2 使用方。types（poker/action/position/quiz/elo/mentor/training/decisionFeedback）、utils（pokerMath/deck/elo/seededShuffle/spacedRepetition）、components（poker/feedback/business/gate/ui/layout）、stores（trainingEvents 总线、debugMode、两个 registry）、hooks、constants、data。" "TypeScript" "Shared"

                // ---------- 共享内核（被所有训练模块复用）
                calculateGrade = component "五级反馈评级（共享内核）" "shared/types/decisionFeedback.ts：calculateGrade(evLoss)，阈值 0 / 0.5 / 2 / 5 BB；全部训练模块唯一评级入口。" "纯函数" "SharedKernel"
            }

            sw = container "Service Worker" "public/sw.js：app shell 与 assets 离线缓存；缓存键带 APP_VERSION，激活时清理旧版本；导航请求 network-first + index.html 兜底。" "原生 SW"
            gtoWorker = container "GTO 计算 Web Worker" "hand-history/workers/gtoWorker.ts：离线批量计算每手牌的 GTO 动作与 EV 损失，内嵌 GRADE_THRESHOLDS 隔离拷贝（由 gtoWorkerThresholds.test.ts 守护 parity）。" "Web Worker (module)"

            local = container "localStorage" "5 个 persist store：poker-training-progress(v15)、strategy-academy-progress(v5)、theory-academy-progress(v3)、puzzle-trainer-store(v3)、poker-debug-mode(v1)。禁止裸调 localStorage。" "Browser storage" {
                tags "Database"
            }
            indexeddb = container "IndexedDB" "3 个库：hand-history-db(v1, store hands，owner=hand-history，progress 的 handHistoryBackup 亦打开同库)、poker-training-records(v1，训练记录，cleanup 保留 1000 条)、poker-training(v1 [low] 仅经 progress/index.ts 导出，内部未见消费方)。" "Browser DB" {
                tags "Database"
            }
        }

        // ============================================================ L1 关系
        learner -> pokerlab "在浏览器中训练、学习与复盘" "HTTPS / 本地文件"
        pokerRoomExport -> pokerlab.spa "被导入并由 parsers 解析为结构化牌局" "文本上传"
        pokerlab -> browserRuntime "读写持久化状态、注册 SW 与 Web Worker、懒加载 chunk" "Web APIs"
        githubPages -> pokerlab "分发静态产物（base=/dezhou/）" "HTTPS"
        pokerlab.sw -> pokerlab.spa "离线缓存 app shell 与 assets" "Cache Storage"

        // ============================================================ L2 关系
        pokerlab.spa -> pokerlab.local "读写训练进度、课程进度、设置与调试态" "zustand persist"
        pokerlab.spa -> pokerlab.indexeddb "写入牌局与训练记录（大容量数据）" "IndexedDB API"
        pokerlab.sw -> pokerlab.local "缓存键带 APP_VERSION 以便版本失效" "Cache Storage" "Async"
        pokerlab.spa.handHistory -> pokerlab.gtoWorker "批量提交牌局做 GTO 偏差计算" "postMessage(type:module)"
        pokerlab.gtoWorker -> pokerlab.spa.shared "回传 gtoAction / evLoss / grade（需与共享评级阈值保持 parity）" "postMessage"

        // ============================================================ L3 组件关系
        // 装配与路由
        pokerlab.spa.bootstrap -> pokerlab.spa.hub "initProgressStore() 完成后才渲染，防丢早期训练事件"
        pokerlab.spa.bootstrap -> pokerlab.spa.academy "idle 时加载 store.bootstrap 注册数据源"
        pokerlab.spa.bootstrap -> pokerlab.spa.theory "idle 时加载 store.bootstrap"
        pokerlab.spa.bootstrap -> pokerlab.spa.puzzle "idle 时加载 store.bootstrap"
        pokerlab.spa.routing -> pokerlab.spa.i18n "lazyPage 并行加载页面 chunk 与语言包"
        pokerlab.spa.routing -> pokerlab.spa.hub "Dashboard / 统计 / 设置 页面归属"

        // 跨模块唯一允许边：训练与学习模块 → progress 中枢
        pokerlab.spa.rangeTrainer   -> pokerlab.spa.hub "updateElo / recordAnswer / addReviewItem / recordTrainingDay / shouldDownshiftDifficulty"
        pokerlab.spa.potOdds        -> pokerlab.spa.hub "updateElo / recordAnswer / SRS / recordTrainingDay"
        pokerlab.spa.gtoSim         -> pokerlab.spa.hub "updateElo(postflop) / recordAnswer / SRS"
        pokerlab.spa.puzzle         -> pokerlab.spa.hub "recordAnswer / recordTrainingDay"
        pokerlab.spa.academy        -> pokerlab.spa.hub "课程进度与 ELO/SRS 提交"
        pokerlab.spa.theory         -> pokerlab.spa.hub "理论进度与 ELO 提交"
        pokerlab.spa.onboarding     -> pokerlab.spa.hub "写入 settings 偏好"

        // 事件总线：训练完成 → 中枢订阅（异步反向通道）
        pokerlab.spa.rangeTrainer   -> pokerlab.spa.shared "emit TrainingRecord（quiz）"
        pokerlab.spa.potOdds        -> pokerlab.spa.shared "emit TrainingRecord（quiz）"
        pokerlab.spa.gtoSim         -> pokerlab.spa.shared "emit TrainingRecord（scenario）"
        pokerlab.spa.puzzle         -> pokerlab.spa.shared "emit TrainingRecord（rush/daily/theme）"
        pokerlab.spa.academy        -> pokerlab.spa.shared "emit TrainingRecord"
        pokerlab.spa.theory         -> pokerlab.spa.shared "emit TrainingRecord"
        pokerlab.spa.hub            -> pokerlab.spa.shared "subscribe 训练事件 + getAchievementSources()（store.ts:41，成就检查 checkCondition :1036-1105）"

        // 反馈闭环与每日计划：中枢经 registry 读取学院数据（不 import 学院模块）
        pokerlab.spa.hub            -> pokerlab.spa.academy "每日计划经 getAcademyDataSource().findNextLesson()\nprogress/utils/dailyTrainingPlan.ts:10,:93；ProgressReplay.tsx:7 亦消费；\n注册方 strategy-academy/store.bootstrap.ts:24-43"

        // 所有模块 → shared（聚合，避免 40+ 射线）
        pokerlab.spa.rangeTrainer   -> pokerlab.spa.shared "types / components / utils"
        pokerlab.spa.handHistory    -> pokerlab.spa.shared "types(action/poker/position) + 扑克组件"
        pokerlab.spa.helpCenter     -> pokerlab.spa.shared "ui/button + motion"
        pokerlab.spa.theme          -> pokerlab.spa.shared "组件复用 shadcn/ui 基元"

        // 共享内核
        pokerlab.spa.shared -> pokerlab.spa.calculateGrade "唯一评级入口（禁止各模块自定义）"
        pokerlab.spa.calculateGrade -> pokerlab.spa.hub "evLoss 与 grade 随训练记录汇入统计"
    }

    views {
        systemContext pokerlab "Context" "L1：学员、扑克室导出文件、GitHub Pages、浏览器运行时与系统边界。" {
            include *
            autoLayout tb
        }

        container pokerlab "Containers" "L2：SPA、Service Worker、Web Worker 与两个浏览器存储；无后端服务。" {
            include *
            autoLayout tb
        }

        component pokerlab.spa "Components" "L3：SPA 内部的 10 个 feature 模块、progress 中枢、shared 层与装配层。" {
            include *
            autoLayout tb
        }

        styles {
            element "Person" {
                shape person
                background #08427b
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "Database" {
                shape cylinder
                background #a83232
                color #ffffff
            }
            element "Hub" {
                background #b45309
                color #ffffff
            }
            element "SharedKernel" {
                background #0f766e
                color #ffffff
            }
            element "Shared" {
                background #31568f
                color #ffffff
            }
            element "Training" {
                background #2f6f6a
                color #ffffff
            }
            element "Learning" {
                background #6b4f8a
                color #ffffff
            }
            element "Support" {
                background #8a6a3f
                color #ffffff
            }
            element "Platform" {
                background #8a8377
                color #ffffff
            }
        }
    }
}
