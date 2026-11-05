/**
 * 内容运营元数据（纯前端静态数据，无后端）。
 *
 * - `lastReviewed`：课时级「最近一次人工校对」日期（ISO 8601，YYYY-MM-DD）。课时页据此展示内容
 *   新鲜度（components/LessonReviewMeta），不参与门禁 / 解锁 / 计分。
 * - `sources`：校对依据的公开资料，取值是 `data/bibliography.ts` 的条目 id；未登记表示该课时
 *   以站内自研推导为主，不虚构出处。
 *
 * 维护规则：
 * - 修改课时正文 / 题库后，在同一批改动里刷新对应内容轨的日期（`LAST_REVIEWED_BY_GROUP`，
 *   局部返修只改该轨，其余沿用批量基准 `DEFAULT_LAST_REVIEWED`）。
 * - 新增 / 改名课时必须同步 `LESSON_IDS_BY_GROUP`；`contentOps.test.ts` 会与 manifest 全集做
 *   双向集合断言（缺一条或残留一条即红）。
 */

export interface LessonContentMeta {
  /** 最近一次人工校对日期（YYYY-MM-DD） */
  lastReviewed: string;
  /** 校对依据（bibliography 条目 id） */
  sources?: readonly string[];
}

/** 批量校对基准日期：2026-11 标准课时全量复核 */
export const DEFAULT_LAST_REVIEWED = '2026-11-04';

/** 单挑变体批量深对齐校对日期 */
export const HEADS_UP_LAST_REVIEWED = '2026-11-05';

/** 内容轨 → 校对日期（局部返修时只改本表对应项） */
const LAST_REVIEWED_BY_GROUP: Readonly<Record<string, string>> = {
  l1: DEFAULT_LAST_REVIEWED,
  l2: DEFAULT_LAST_REVIEWED,
  l3: DEFAULT_LAST_REVIEWED,
  l4: DEFAULT_LAST_REVIEWED,
  l5: DEFAULT_LAST_REVIEWED,
  l6: DEFAULT_LAST_REVIEWED,
  l7: DEFAULT_LAST_REVIEWED,
  l8: DEFAULT_LAST_REVIEWED,
  // 本土低级别盈利路径（manifest 中归入 Level 7 条目，此处按内容轨独立维护）
  local: DEFAULT_LAST_REVIEWED,
  // 单挑变体（L3-L8 共 12 课，2026-11 深对齐）
  'heads-up': HEADS_UP_LAST_REVIEWED,
};

/** 各内容轨课时 id（标准变体全集 92 门，含 Drill 与本土课） */
const LESSON_IDS_BY_GROUP: Readonly<Record<string, readonly string[]>> = {
  l1: [
    'l1-basics',
    'l1-position',
    'l1-hand-selection',
    'l1-bankroll',
    'l1-leaks',
    'drill-hand-ranking',
    'drill-position',
    'drill-outs',
    'drill-pot-odds',
  ],
  l2: [
    'l2-raise-sizing',
    'l2-3bet-basics',
    'l2-4bet-strategy',
    'l2-squeeze',
    'l2-bb-defense',
    'l2-blind-war',
    'l2-short-stack',
    'drill-l2-3bet',
    'drill-l2-position-range',
  ],
  l3: [
    'l3-cbet',
    'l3-draws',
    'l3-multistreet',
    'l3-checkraise',
    'l3-float-probe',
    'l3-bet-sizing',
    'l3-bluffing',
    'l3-texture',
    'l3-check-range',
    'drill-l3-cbet',
    'drill-l3-odds',
    'l3-3bet-postflop',
  ],
  l4: [
    'l4-range-thinking',
    'l4-ev-thinking',
    'l4-ev-real-cases',
    'l4-opponent-reading',
    'l4-blockers',
    'drill-l4-range-id',
    'drill-l4-ev',
    'l4-gto-basics',
    'l4-game-tree',
    'l4-frequency-balance',
    'l4-mdf',
    'l4-mdf-real-cases',
    'l4-overbet',
    'l4-range-construction',
    'l4-bluffcatching',
    'drill-l4-gto',
    'drill-l4b-frequency',
  ],
  l5: [
    'l5-bankroll',
    'l5-tilt',
    'l5-game-selection',
    'l5-session-review',
    'l5-data-driven',
    'drill-l5-tilt',
    'l5-tools',
    'l5-online-vs-live',
    'drill-l5-session',
  ],
  l6: [
    'l6-icm',
    'l6-pushfold',
    'l6-bubble',
    'l6-finaltable',
    'l6-bounty',
    'drill-l6-icm',
    'drill-l6-pushfold',
  ],
  l7: [
    'l7-deepstack',
    'l7-multiway',
    'l7-straddle',
    'l7-rake',
    'l7-table-selection',
    'drill-l7-deepstack',
    'drill-l7-multiway',
  ],
  l8: [
    'l8-pool-tendencies',
    'l8-population-analysis',
    'l8-exploitative-adjustments',
    'drill-l8-exploit',
    'drill-l8-pool',
  ],
  local: [
    'local-limp-intro',
    'local-limp-isolate',
    'local-limp-multiway',
    'local-straddle',
    'local-ante',
    'local-deep-implied-odds',
    'local-deep-suited-connectors',
    'local-exploit-calling-station',
    'local-exploit-maniac',
    'local-exploit-nit',
    'local-exploit-lag',
    'opp-drill',
    'local-gto-vs-exploit',
    'local-when-to-deviate',
    'local-mental-tilt-recognition',
    'local-mental-stop-loss',
    'local-mental-session-management',
  ],
  'heads-up': [
    'l3hu-bn-aggression',
    'l3hu-sb-continuation',
    'l3hu-bb-defense',
    'l4hu-bn-opening',
    'l4hu-ev-adjustments',
    'l4hu-gto-basics',
    'l4hu-counter-strategies',
    'l5hu-focus',
    'l5hu-opponent-psychology',
    'l6hu-tourney',
    'l7hu-stakes',
    'l8hu-exploitative',
  ],
};

/** 课时 → 校对依据（bibliography id；只登记有明确出处的课时） */
const LESSON_SOURCES: Readonly<Record<string, readonly string[]>> = {
  'l2-3bet-basics': ['applications-of-nlhe'],
  'l2-bb-defense': ['no-limit-holdem-advanced-players'],
  'l3-bet-sizing': ['mathematics-of-poker', 'applications-of-nlhe'],
  'l4-gto-basics': ['modern-poker-theory', 'play-optimal-poker'],
  'l4-mdf': ['modern-poker-theory', 'mathematics-of-poker'],
  'l5-tilt': ['mental-game-of-poker'],
  'l6-icm': ['mathematics-of-poker'],
  'l7-multiway': ['no-limit-holdem-advanced-players'],
  'l8-population-analysis': ['grinders-manual', 'exploitative-play-live-poker'],
};

function buildLessonContentMeta(): Record<string, LessonContentMeta> {
  const meta: Record<string, LessonContentMeta> = {};
  for (const [group, lessonIds] of Object.entries(LESSON_IDS_BY_GROUP)) {
    const lastReviewed = LAST_REVIEWED_BY_GROUP[group] ?? DEFAULT_LAST_REVIEWED;
    for (const lessonId of lessonIds) {
      const sources = LESSON_SOURCES[lessonId];
      meta[lessonId] = sources ? { lastReviewed, sources } : { lastReviewed };
    }
  }
  return meta;
}

/** 课时 → 内容运营元数据（标准 + 单挑变体全集） */
export const LESSON_CONTENT_META: Readonly<Record<string, LessonContentMeta>> =
  buildLessonContentMeta();

/**
 * 查询课时的内容运营元数据；未知课时（含短牌变体、无效 id）返回 undefined，
 * 由调用方决定不渲染（避免凭空显示「最近校对」）。
 */
export function getLessonContentMeta(lessonId: string): LessonContentMeta | undefined {
  return LESSON_CONTENT_META[lessonId];
}
