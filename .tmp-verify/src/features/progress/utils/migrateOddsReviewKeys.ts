/**
 * v17 → v18 持久化迁移辅助（纯函数，无 store / i18n 依赖）。
 *
 * 背景：pot-odds 题库虽早已全量 i18n key 化（`potOdds.quizBank.qN.*`），但历史入队实现
 * 对 label 做了 `scenario.slice(0, 40)` 摘要，产出形如 `potOdds.quizBank.q1.scenar…`
 * 的**残缺 key**——i18next 未命中时原样回显入参，复习卡片显示裸 key 片段（zh / en 皆然，
 * 详见 pot-odds/utils/oddsSrs.ts 顶部说明）；更早期的入队版本则可能写入中文原文。
 *
 * 确定性来源：复习项 id 形如 `odds:<questionId>`（题库 id 为正整数），
 * `scenario` / `question` 两个 key 可从 id 无损反解，不需要读题库数据；
 * `metadata.back`（正确选项 key）无法从 id 推导，按如下优先级修复：
 *   1) `metadata.options` 中 `isCorrect` 项的 `text`（key 形态时）；
 *   2) 现有 back 本身已是 key 形态 → 保留；
 *   3) 否则清空（渲染层对空 back 显示空白，不再裸显中文原文）。
 * `options[].text / explanation` 若存在非 key 形态（早期原文），整体移除 options：
 * 复习模式退化为 front/back 自评，避免英文界面渲染中文选项——宁可降级也不裸显。
 *
 * 复习进度零丢失：interval / easeFactor / repetitions / nextReviewDate / lastReviewedAt /
 * category / metadata.route 等其余字段一律原样保留；幂等：已是 key 形态的项不产生任何改写。
 */

/**
 * ⚠️ 镜像拷贝（单源归属：pot-odds/utils/oddsSrs.ts 的 ODDS_REVIEW_ID_PREFIX）。
 * progress 不能 import pot-odds：eslint.config.js 的 ALLOWED_CROSS_IMPORTS 中
 * `progress: []`，且该清单「收紧时只删不加」。故此处以字面量复刻，
 * 一致性由同目录 migrateOddsReviewKeys.test.ts 的守卫用例锁死。
 */

const ODDS_REVIEW_ID_PREFIX = 'odds:';
const ODDS_KEY_PREFIX = 'potOdds.';

/** 镜像自 pot-odds/utils/oddsSrs.ts（buildOddsReviewItemInput 的 label / front 形态） */
function oddsScenarioKey(questionId: string): string {
  return `potOdds.quizBank.q${questionId}.scenario`;
}

function oddsQuestionKey(questionId: string): string {
  return `potOdds.quizBank.q${questionId}.question`;
}

/** key 形态判定：以 potOdds. 开头且不以摘要省略号结尾（残缺 key 视为非法） */
function isPotOddsKey(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(ODDS_KEY_PREFIX) && !value.endsWith('…');
}

/** 判定某复习项是否需要改写，需要则返回改写后的新对象，否则返回 undefined（保持原引用） */
function rewriteOddsItem(item: unknown): Record<string, unknown> | undefined {
  if (typeof item !== 'object' || item === null) return undefined;
  const record = item as Record<string, unknown>;

  const id = record.id;
  if (typeof id !== 'string' || !id.startsWith(ODDS_REVIEW_ID_PREFIX)) return undefined;
  const questionId = id.slice(ODDS_REVIEW_ID_PREFIX.length);
  // 题库 id 为正整数；占位 id（0）与补救题等非正整数 id 无法反解，保守跳过
  if (!/^[1-9]\d*$/.test(questionId)) return undefined;

  const expectedScenarioKey = oddsScenarioKey(questionId);
  const expectedQuestionKey = oddsQuestionKey(questionId);

  const rawMetadata = record.metadata;
  const metadata =
    typeof rawMetadata === 'object' && rawMetadata !== null
      ? { ...(rawMetadata as Record<string, unknown>) }
      : undefined;

  // --- options 治理：任一 text / explanation 非 key 形态 → 整体移除（退化为自评模式） ---
  let optionsDropped = false;
  const rawOptions = metadata?.options;
  if (Array.isArray(rawOptions)) {
    const allKeys = rawOptions.every((o) => {
      if (typeof o !== 'object' || o === null) return false;
      const rec = o as Record<string, unknown>;
      return (
        isPotOddsKey(rec.text) &&
        (rec.explanation === undefined || isPotOddsKey(rec.explanation))
      );
    });
    if (!allKeys && metadata) {
      delete metadata.options;
      optionsDropped = true;
    }
  }

  // --- back 修复：优先取 options 中正确项的 key；其次保留已是 key 的现值；否则清空 ---
  let backRewrite: string | undefined;
  if (metadata) {
    const rawBack = metadata.back;
    const correctOption = Array.isArray(metadata.options)
      ? (metadata.options as Array<Record<string, unknown>>).find((o) => o.isCorrect === true)
      : undefined;
    const correctCandidate = isPotOddsKey(correctOption?.text)
      ? (correctOption!.text as string)
      : undefined;
    if (typeof rawBack === 'string') {
      if (correctCandidate !== undefined && correctCandidate !== rawBack) {
        backRewrite = correctCandidate;
      } else if (correctCandidate === undefined && !isPotOddsKey(rawBack) && rawBack !== '') {
        backRewrite = '';
      }
    }
  }

  // --- label / front / scenario 逐字段归一为派生 key（幂等：已是 key 则不动） ---
  const labelRewrite =
    typeof record.label === 'string' && record.label !== expectedScenarioKey
      ? expectedScenarioKey
      : undefined;
  const frontRewrite =
    metadata && typeof metadata.front === 'string' && metadata.front !== expectedQuestionKey
      ? expectedQuestionKey
      : undefined;
  const scenarioRewrite =
    metadata && typeof metadata.scenario === 'string' && metadata.scenario !== expectedScenarioKey
      ? expectedScenarioKey
      : undefined;

  const changed =
    labelRewrite !== undefined ||
    frontRewrite !== undefined ||
    scenarioRewrite !== undefined ||
    backRewrite !== undefined ||
    optionsDropped;
  if (!changed) return undefined;

  const nextMetadata = metadata
    ? {
        ...metadata,
        ...(frontRewrite !== undefined ? { front: frontRewrite } : {}),
        ...(scenarioRewrite !== undefined ? { scenario: scenarioRewrite } : {}),
        ...(backRewrite !== undefined ? { back: backRewrite } : {}),
      }
    : metadata;

  return {
    ...record,
    ...(labelRewrite !== undefined ? { label: labelRewrite } : {}),
    ...(nextMetadata !== metadata ? { metadata: nextMetadata } : {}),
  };
}

/**
 * 把存量赔率复习项归一为完整 i18n key。
 *
 * 对任意输入安全（旧版本存档可能没有 reviewItems，或是脏数据）：
 * 非数组原样返回，未命中项保持原对象引用，全部未命中时连数组引用都不变
 * （不产生多余写入）。
 */
export function migrateOddsReviewItems(items: unknown): unknown {
  if (!Array.isArray(items)) return items;
  let changed = false;
  const next = items.map((item) => {
    const rewritten = rewriteOddsItem(item);
    if (rewritten === undefined) return item;
    changed = true;
    return rewritten;
  });
  return changed ? next : items;
}
