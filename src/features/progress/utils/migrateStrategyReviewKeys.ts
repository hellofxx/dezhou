/**
 * v16 → v17 持久化迁移辅助（纯函数，无 store / i18n 依赖）。
 *
 * 背景：策略学院课程完成后向 SRS 队列入项时，复习项的可见文本必须**语言中立**
 * （存 i18n key，由渲染层 t() 解析；契约见 PRD §12.4.3「复习/回忆类状态必须存 key」）。
 * 早期实现（strategy-academy/utils/completeCourse.ts）把数据层**课时中文原文**
 * 直接写进 label，而 SpacedRepetitionPanel 走 t(item.label) —— i18next 未命中 key 时
 * 原样回显入参，故这些存量项在英文界面回显中文课名。本迁移一次性改写存量项，无需用户重学。
 *
 * 确定性来源：策略复习项的 id 就是 lessonId（completeCourse 以 lesson.id 入队），
 * 故 key 可从 id 无损反解，不需要猜测原文、不需要读题库数据。
 * 复习进度零丢失：interval / easeFactor / repetitions / nextReviewDate / lastReviewedAt /
 * category / metadata 等其余字段一律原样保留（未变更项连对象引用都不变）。
 */

/**
 * ⚠️ 镜像拷贝（单源归属已在每行标注）。
 * progress 不能 import strategy-academy：eslint.config.js 的 ALLOWED_CROSS_IMPORTS 中
 * `progress: []`，且该清单「收紧时只删不加」。故此处以字面量复刻，
 * 一致性由同目录 migrateStrategyReviewKeys.test.ts 的「key 镜像守卫」用例锁死
 * （守卫经 @/i18n/contentKeyEntries 取 strategy-academy 侧单源 key 生成结果比对）。
 *
 * NEEDS-DECISION: 与理论侧同款问题——建议把「课时标题 key 生成函数」上收到 shared 层
 * （如 shared/utils/lessonContentKeys.ts），由 strategy-academy 与 progress 共同引用，
 * 从而删除本文件的镜像拷贝。shared 层准入（≥2 模块使用）已满足，唯需 platform-dev 协调。
 */

/** 镜像自 strategy-academy/utils/titleKeys.ts 的 lessonTitleKey */
function lessonTitleKey(lessonId: string): string {
  return `academy.lessonTitle.${lessonId}`;
}

/** 课时 id 形态：小写字母/数字开头，仅含小写字母、数字与连字符（排除 `range:` / `gto:` 等带命名空间的 id） */
const LESSON_ID_RE = /^[a-z0-9][a-z0-9-]*$/;

/** 中文原文判定（与 i18n 守卫同一口径的 CJK 基本区） */
const HAN_RE = /[一-鿿]/;

/** 判定某复习项是否需要改写，需要则返回改写后的新对象，否则返回 undefined（保持原引用） */
function rewriteStrategyItem(item: unknown): Record<string, unknown> | undefined {
  if (typeof item !== 'object' || item === null) return undefined;
  const record = item as Record<string, unknown>;

  // 只处理策略学院复习项：theory / range / odds / gto 各有自己的 key 命名空间与来源
  if (record.category !== 'strategy') return undefined;

  const id = record.id;
  // 脏 id（缺失 / 非字符串 / 含命名空间分隔符 / 非课时 id 形态）无法反解 lessonId，
  // 保守跳过：不抛错、不把无法命中的 key 写进 label（那会比中文原文更糟）
  if (typeof id !== 'string' || id === '' || !LESSON_ID_RE.test(id)) return undefined;

  const expectedKey = lessonTitleKey(id);
  const labelField = record.label;
  // 仅改写「是字符串且含中文原文」的 label：
  // —— 已是 key 形态（新版实现产物）时无汉字，自动跳过 → 幂等；
  // —— 字段缺失 / 非字符串 / 纯拉丁其它值时不凭空改写，避免猜测语义。
  if (typeof labelField !== 'string' || !HAN_RE.test(labelField)) return undefined;
  if (labelField === expectedKey) return undefined;

  return { ...record, label: expectedKey };
}

/**
 * 把存量策略复习项的中文 label 改写为 `academy.lessonTitle.<lessonId>` key。
 *
 * 对任意输入安全（旧版本存档可能没有 reviewItems，或是脏数据）：
 * 非数组原样返回，未命中项保持原对象引用，全部未命中时连数组引用都不变
 * （不产生多余写入）。
 */
export function migrateStrategyReviewItems(items: unknown): unknown {
  if (!Array.isArray(items)) return items;
  let changed = false;
  const next = items.map((item) => {
    const rewritten = rewriteStrategyItem(item);
    if (rewritten === undefined) return item;
    changed = true;
    return rewritten;
  });
  return changed ? next : items;
}
