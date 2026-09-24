/**
 * v15 → v16 持久化迁移辅助（纯函数，无 store / i18n 依赖）。
 *
 * 背景：理论学院章末错题入队 SRS 时，复习项的可见文本必须**语言中立**
 * （存 i18n key，由渲染层 t() 解析；契约见 theory-academy/utils/theorySrs.ts 顶部说明）。
 * 早期实现把数据层**中文原文**直接写进 label / metadata.front / metadata.back，
 * 而 i18next 未命中 key 时原样回显入参 —— 这些存量项因此在英文界面显示中文题干/解析，
 * 且要等用户重考该题才被新版实现覆盖。本迁移一次性改写存量项，无需用户重考。
 *
 * 确定性来源：复习项 id 形如 `theory:<questionId>`（theoryReviewItemId() 产出），
 * questionId 可从 id 无损反解，故不需要猜测原文、不需要读题库数据。
 * 复习进度零丢失：interval / easeFactor / repetitions / nextReviewDate / lastReviewedAt /
 * category / metadata.route 等其余字段一律原样保留（未变更项连对象引用都不变）。
 */

/**
 * ⚠️ 镜像拷贝（单源归属已在每行标注）。
 * progress 不能 import theory-academy：eslint.config.js 的 ALLOWED_CROSS_IMPORTS 中
 * `progress: []`，且该清单「收紧时只删不加」。故此处以字面量复刻，
 * 一致性由同目录 migrateTheoryReviewKeys.test.ts 的「key 镜像守卫」用例锁死
 * （守卫经 @/i18n/contentKeyEntries 取 theory-academy 侧单源 key 生成结果比对）。
 *
 * NEEDS-DECISION: 建议把「理论复习项 id 前缀 + quiz key 生成函数」上收到 shared 层
 * （如 shared/utils/theoryContentKeys.ts），由 theory-academy 与 progress 共同引用，
 * 从而删除本文件的镜像拷贝。shared 层准入（≥2 模块使用）已满足，唯需 platform-dev 协调。
 */

/** 镜像自 theory-academy/utils/theorySrs.ts 的 THEORY_REVIEW_ID_PREFIX */
const THEORY_REVIEW_ID_PREFIX = 'theory:';

/** 镜像自 theory-academy/utils/contentKeys.ts 的 theoryQuizQuestionKey */
function theoryQuizQuestionKey(questionId: string): string {
  return `theory.quiz.${questionId}.question`;
}

/** 镜像自 theory-academy/utils/contentKeys.ts 的 theoryQuizExplanationKey */
function theoryQuizExplanationKey(questionId: string): string {
  return `theory.quiz.${questionId}.explanation`;
}

/** 判定某复习项是否需要改写，需要则返回改写后的新对象，否则返回 undefined（保持原引用） */
function rewriteTheoryItem(item: unknown): Record<string, unknown> | undefined {
  if (typeof item !== 'object' || item === null) return undefined;
  const record = item as Record<string, unknown>;

  const id = record.id;
  if (typeof id !== 'string' || !id.startsWith(THEORY_REVIEW_ID_PREFIX)) return undefined;
  const questionId = id.slice(THEORY_REVIEW_ID_PREFIX.length);
  // 脏 id（`theory:` 后为空）无法反解题 id，保守跳过：不抛错、不写入空 key
  if (questionId === '') return undefined;

  const expectedQuestionKey = theoryQuizQuestionKey(questionId);
  const expectedExplanationKey = theoryQuizExplanationKey(questionId);

  const rawMetadata = record.metadata;
  const metadata =
    typeof rawMetadata === 'object' && rawMetadata !== null
      ? (rawMetadata as Record<string, unknown>)
      : undefined;

  // 逐字段幂等判定：仅改写「已存在、为字符串、且不等于派生 key」的值。
  // —— 已是 key 形态（新版实现产物）时跳过，重复执行结果不变；
  // —— 字段缺失 / 非字符串时不凭空创建，避免改变持久化形状（见 store.persist-shape.test.ts）。
  const labelField = record.label;
  const frontField = metadata?.front;
  const backField = metadata?.back;
  const rewriteLabel = typeof labelField === 'string' && labelField !== expectedQuestionKey;
  const rewriteFront = typeof frontField === 'string' && frontField !== expectedQuestionKey;
  const rewriteBack = typeof backField === 'string' && backField !== expectedExplanationKey;

  if (!rewriteLabel && !rewriteFront && !rewriteBack) return undefined;

  const nextMetadata =
    metadata && (rewriteFront || rewriteBack)
      ? {
          ...metadata,
          ...(rewriteFront ? { front: expectedQuestionKey } : {}),
          ...(rewriteBack ? { back: expectedExplanationKey } : {}),
        }
      : metadata;

  return {
    ...record,
    ...(rewriteLabel ? { label: expectedQuestionKey } : {}),
    ...(nextMetadata !== metadata ? { metadata: nextMetadata } : {}),
  };
}

/**
 * 把存量理论复习项改写为 i18n key。
 *
 * 对任意输入安全（旧版本存档可能没有 reviewItems，或是脏数据）：
 * 非数组原样返回，未命中项保持原对象引用，全部未命中时连数组引用都不变
 * （不产生多余写入）。
 */
export function migrateTheoryReviewItems(items: unknown): unknown {
  if (!Array.isArray(items)) return items;
  let changed = false;
  const next = items.map((item) => {
    const rewritten = rewriteTheoryItem(item);
    if (rewritten === undefined) return item;
    changed = true;
    return rewritten;
  });
  return changed ? next : items;
}
