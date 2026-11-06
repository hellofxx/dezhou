# shared 文件级 fan-in 附录（88 个生产文件）

> 状态：Snapshot · 证据基线 2026-11-06 · 工作树（HEAD d3419ad + 未提交改动）。
> 由 `.archive/arch-model-2026-11-06/scan.mjs` 扫描 `src` 生成；口径与 `src/test-utils/admissionGraph.ts` 对齐。

## 读表说明

- **直接外部消费者**：直接 import 该文件的 feature 模块 / shell 组数量，不含 shared 内部 importer。
- **传递生产消费者**：沿 shared 内部 import 反向闭包累计后的模块数（准入守卫口径）；因此可能大于直接数。
- **测试消费者数**：有多少个测试消费者组（feature / test:shared 等）触达该文件；不等于测试文件数。
- 测试桩 `utils/localStorageStub.ts` / `utils/persistShape.ts` 按设计只被测试使用。
- 数值为采集时点快照，代码为唯一事实源。

## types（15 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `types/common.ts` | 6 | 8 | `feature:gto-simulator`, `feature:hand-history`, `feature:pot-odds`, `feature:progress`, `feature:puzzle-trainer`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 7 |
| `types/poker.ts` | 6 | 8 | `feature:gto-simulator`, `feature:hand-history`, `feature:onboarding`, `feature:pot-odds`, `feature:progress`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 6 |
| `types/decisionFeedback.ts` | 6 | 7 | `feature:gto-simulator`, `feature:hand-history`, `feature:onboarding`, `feature:pot-odds`, `feature:puzzle-trainer`, `feature:range-trainer`, `feature:strategy-academy` | 4 |
| `types/position.ts` | 5 | 5 | `feature:gto-simulator`, `feature:hand-history`, `feature:onboarding`, `feature:range-trainer`, `feature:strategy-academy` | 4 |
| `types/elo.ts` | 3 | 3 | `feature:progress`, `feature:strategy-academy`, `feature:theory-academy` | 6 |
| `types/academy.ts` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 3 |
| `types/academyDataSource.ts` | 2 | 2 | `feature:progress`, `feature:strategy-academy` | 2 |
| `types/action.ts` | 2 | 2 | `feature:gto-simulator`, `feature:hand-history` | 2 |
| `types/quiz.ts` | 2 | 2 | `feature:onboarding`, `feature:range-trainer` | 0 |
| `types/theoryDataSource.ts` | 2 | 2 | `feature:progress`, `feature:theory-academy` | 3 |
| `types/training.ts` | 1 | 7 | `feature:gto-simulator`, `feature:pot-odds`, `feature:progress`, `feature:puzzle-trainer`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 7 |
| `types/mentor.ts` | 1 | 4 | `feature:gto-simulator`, `feature:onboarding`, `feature:progress`, `feature:range-trainer` | 2 |
| `types/opponent.ts` | 1 | 2 | `feature:gto-simulator`, `feature:strategy-academy` | 0 |
| `types/variantRules.ts` | 1 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |
| `types/achievementDataSource.ts` | 0 | 4 | `feature:progress`, `feature:puzzle-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 4 |

## constants（4 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `constants/app.ts` | 6 | 6 | `feature:progress`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy`, `shell:layouts`, `shell:main` | 4 |
| `constants/poker.ts` | 4 | 7 | `feature:gto-simulator`, `feature:hand-history`, `feature:onboarding`, `feature:progress`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 1 |
| `constants/headsUpRules.ts` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |
| `constants/mentorStyles.ts` | 1 | 3 | `feature:gto-simulator`, `feature:onboarding`, `feature:range-trainer` | 1 |

## utils（17 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `utils/cn.ts` | 10 | 11 | `feature:gto-simulator`, `feature:hand-history`, `feature:help-center`, `feature:onboarding`, `feature:pot-odds`, `feature:progress`, `feature:puzzle-trainer`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy`, `shell:layouts` | 2 |
| `utils/motion.ts` | 10 | 11 | `feature:gto-simulator`, `feature:hand-history`, `feature:help-center`, `feature:onboarding`, `feature:pot-odds`, `feature:progress`, `feature:puzzle-trainer`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy`, `shell:layouts` | 2 |
| `utils/spacedRepetition.ts` | 6 | 6 | `feature:gto-simulator`, `feature:pot-odds`, `feature:progress`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 8 |
| `utils/optionOrder.ts` | 5 | 5 | `feature:onboarding`, `feature:pot-odds`, `feature:puzzle-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 0 |
| `utils/seededShuffle.ts` | 4 | 6 | `feature:gto-simulator`, `feature:onboarding`, `feature:pot-odds`, `feature:puzzle-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 4 |
| `utils/formatters.ts` | 3 | 3 | `feature:hand-history`, `feature:pot-odds`, `feature:strategy-academy` | 1 |
| `utils/rangeParser.ts` | 3 | 3 | `feature:gto-simulator`, `feature:range-trainer`, `feature:theory-academy` | 1 |
| `utils/toLocalDateKey.ts` | 2 | 6 | `feature:gto-simulator`, `feature:pot-odds`, `feature:progress`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 8 |
| `utils/academyMastery.ts` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |
| `utils/academyQuizBank.ts` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 1 |
| `utils/academyQuizDraw.ts` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |
| `utils/academySrs.ts` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 1 |
| `utils/academyVariantRules.ts` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 1 |
| `utils/deck.ts` | 2 | 2 | `feature:range-trainer`, `feature:strategy-academy` | 1 |
| `utils/handClassifier.ts` | 2 | 2 | `feature:gto-simulator`, `feature:range-trainer` | 1 |
| `utils/localStorageStub.ts`（测试桩） | 0 | 0 | — | 5 |
| `utils/persistShape.ts`（测试桩） | 0 | 0 | — | 5 |

## hooks（2 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `hooks/useIsMobile.ts` | 3 | 5 | `feature:gto-simulator`, `feature:onboarding`, `feature:pot-odds`, `feature:puzzle-trainer`, `feature:range-trainer` | 0 |
| `hooks/useRovingGridNav.ts` | 3 | 3 | `feature:gto-simulator`, `feature:range-trainer`, `feature:strategy-academy` | 1 |

## data（1 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `data/opponentProfiles.ts` | 2 | 2 | `feature:gto-simulator`, `feature:strategy-academy` | 0 |

## stores（5 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `stores/trainingEvents.ts` | 7 | 7 | `feature:gto-simulator`, `feature:pot-odds`, `feature:progress`, `feature:puzzle-trainer`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 7 |
| `stores/achievementRegistry.ts` | 4 | 4 | `feature:progress`, `feature:puzzle-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 4 |
| `stores/debugMode.ts` | 4 | 4 | `feature:progress`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy` | 6 |
| `stores/academyDataSourceRegistry.ts` | 2 | 2 | `feature:progress`, `feature:strategy-academy` | 2 |
| `stores/theoryDataSourceRegistry.ts` | 2 | 2 | `feature:progress`, `feature:theory-academy` | 3 |

## components/ui（8 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `components/ui/button.tsx` | 6 | 11 | `feature:gto-simulator`, `feature:hand-history`, `feature:help-center`, `feature:onboarding`, `feature:pot-odds`, `feature:progress`, `feature:puzzle-trainer`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy`, `shell:layouts` | 1 |
| `components/ui/card.tsx` | 5 | 6 | `feature:gto-simulator`, `feature:hand-history`, `feature:pot-odds`, `feature:progress`, `feature:puzzle-trainer`, `feature:range-trainer` | 1 |
| `components/ui/dialog.tsx` | 3 | 4 | `feature:progress`, `feature:strategy-academy`, `feature:theory-academy`, `shell:layouts` | 2 |
| `components/ui/toast.tsx` | 3 | 3 | `feature:strategy-academy`, `feature:theory-academy`, `shell:main` | 1 |
| `components/ui/input.tsx` | 2 | 2 | `feature:pot-odds`, `feature:theory-academy` | 0 |
| `components/ui/progress.tsx` | 2 | 2 | `feature:puzzle-trainer`, `feature:range-trainer` | 1 |
| `components/ui/select.tsx` | 2 | 2 | `feature:progress`, `feature:range-trainer` | 0 |
| `components/ui/tooltip.tsx` | 1 | 1 | `shell:layouts` | 0 |

## components/feedback（10 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `components/feedback/LoadingState.tsx` | 6 | 6 | `feature:hand-history`, `feature:pot-odds`, `feature:progress`, `feature:strategy-academy`, `feature:theory-academy`, `shell:app` | 1 |
| `components/feedback/GradeIcon.tsx` | 4 | 6 | `feature:gto-simulator`, `feature:onboarding`, `feature:pot-odds`, `feature:puzzle-trainer`, `feature:range-trainer`, `feature:strategy-academy` | 0 |
| `components/feedback/MobileFeedbackSheet.tsx` | 4 | 6 | `feature:gto-simulator`, `feature:onboarding`, `feature:pot-odds`, `feature:puzzle-trainer`, `feature:range-trainer`, `shell:layouts` | 1 |
| `components/feedback/EmptyState.tsx` | 4 | 4 | `feature:hand-history`, `feature:help-center`, `feature:progress`, `feature:theory-academy` | 0 |
| `components/feedback/DecisionAnalysis.tsx` | 3 | 5 | `feature:gto-simulator`, `feature:onboarding`, `feature:pot-odds`, `feature:puzzle-trainer`, `feature:range-trainer` | 0 |
| `components/feedback/ResultActions.tsx` | 3 | 3 | `feature:gto-simulator`, `feature:puzzle-trainer`, `feature:range-trainer` | 1 |
| `components/feedback/ResultHeader.tsx` | 3 | 3 | `feature:gto-simulator`, `feature:puzzle-trainer`, `feature:range-trainer` | 1 |
| `components/feedback/TryAgainButton.tsx` | 3 | 3 | `feature:gto-simulator`, `feature:pot-odds`, `feature:puzzle-trainer` | 0 |
| `components/feedback/RelatedLessonChip.tsx` | 1 | 5 | `feature:gto-simulator`, `feature:onboarding`, `feature:pot-odds`, `feature:puzzle-trainer`, `feature:range-trainer` | 0 |
| `components/feedback/ComparisonView.tsx` | 0 | 5 | `feature:gto-simulator`, `feature:onboarding`, `feature:pot-odds`, `feature:puzzle-trainer`, `feature:range-trainer` | 0 |

## components/poker（9 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `components/poker/PositionBadge.tsx` | 3 | 5 | `feature:gto-simulator`, `feature:hand-history`, `feature:onboarding`, `feature:range-trainer`, `feature:strategy-academy` | 0 |
| `components/poker/Card.tsx` | 2 | 5 | `feature:gto-simulator`, `feature:hand-history`, `feature:onboarding`, `feature:range-trainer`, `feature:strategy-academy` | 1 |
| `components/poker/Chip.tsx` | 2 | 2 | `feature:progress`, `feature:strategy-academy` | 1 |
| `components/poker/HandDisplay.tsx` | 2 | 2 | `feature:gto-simulator`, `feature:hand-history` | 0 |
| `components/poker/OpponentGlyph.tsx` | 2 | 2 | `feature:gto-simulator`, `feature:strategy-academy` | 0 |
| `components/poker/VariantToggle.tsx` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 0 |
| `components/poker/CardBack.tsx` | 1 | 6 | `feature:gto-simulator`, `feature:hand-history`, `feature:onboarding`, `feature:progress`, `feature:range-trainer`, `feature:strategy-academy` | 1 |
| `components/poker/VariantGlyph.tsx` | 1 | 3 | `feature:progress`, `feature:strategy-academy`, `feature:theory-academy` | 0 |
| `components/poker/CardSVG.tsx` | 0 | 5 | `feature:gto-simulator`, `feature:hand-history`, `feature:onboarding`, `feature:range-trainer`, `feature:strategy-academy` | 1 |

## components/academy（9 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `components/academy/ContentBlocks.tsx` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |
| `components/academy/index.ts` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 1 |
| `components/academy/AcademyBookmarksPanel.tsx` | 0 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |
| `components/academy/AcademyBridgeCard.tsx` | 0 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |
| `components/academy/AcademyMasteryCard.tsx` | 0 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |
| `components/academy/AcademyNotesPanel.tsx` | 0 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |
| `components/academy/AcademySearchShell.tsx` | 0 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |
| `components/academy/AcademyVariantRuleCard.tsx` | 0 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |
| `components/academy/ContentIssueReportDialog.tsx` | 0 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 2 |

## components/quiz（2 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `components/quiz/QuizCard.tsx` | 2 | 2 | `feature:onboarding`, `feature:range-trainer` | 0 |
| `components/quiz/quizCardModel.ts` | 0 | 2 | `feature:onboarding`, `feature:range-trainer` | 0 |

## components/data-display（4 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `components/data-display/StatCard.tsx` | 4 | 4 | `feature:hand-history`, `feature:progress`, `feature:puzzle-trainer`, `feature:range-trainer` | 1 |
| `components/data-display/ProgressBar.tsx` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 1 |
| `components/data-display/ProgressRing.tsx` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 1 |
| `components/data-display/StatPair.tsx` | 2 | 2 | `feature:strategy-academy`, `feature:theory-academy` | 1 |

## components/layout（1 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `components/layout/BackLink.tsx` | 8 | 8 | `feature:help-center`, `feature:pot-odds`, `feature:progress`, `feature:puzzle-trainer`, `feature:range-trainer`, `feature:strategy-academy`, `feature:theory-academy`, `shell:layouts` | 1 |

## components/system（1 个）

| 文件 | 直接外部消费者 | 传递生产消费者 | 消费者（模块 / shell） | 测试消费者数 |
|---|---:|---:|---|---:|
| `components/system/ErrorBoundary.tsx` | 3 | 3 | `shell:app`, `shell:layouts`, `shell:main` | 1 |

---

合计：88 个生产文件。
