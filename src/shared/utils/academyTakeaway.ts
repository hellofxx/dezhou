/**
 * academyTakeaway — 章末要点卡自动装配纯函数（AcademyTakeawayCard 的计算层）。
 * 装配顺序：objectives 在前 + key-point 文本按换行拆分在后；
 * 归一化（trim + 折叠空白）后按「去尾部句号」的键去重，保留首次出现顺序与原文标点；
 * 上限 6 条截断（设计决策 D2），空入参返回 []。
 * 消费方须先经各自 i18n 解析单源取得 objectives / key-point 译文再传入。
 */

/** 要点卡条目上限（D2） */
const MAX_TAKEAWAY_ITEMS = 6;

/** 展示归一化：trim + 折叠连续空白为单空格 */
function normalizeItem(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** 去重键：在展示归一化基础上再去尾部句号（。/ .），使「同一要点带不带句号」视为重复 */
function dedupeKey(normalized: string): string {
  return normalized.replace(/[。.]+$/, '');
}

export function assembleTakeawayItems(objectives: string[], keyPointTexts: string[]): string[] {
  const candidates = [...objectives, ...keyPointTexts.flatMap((text) => text.split('\n'))];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const candidate of candidates) {
    const normalized = normalizeItem(candidate);
    if (normalized.length === 0) continue;
    const key = dedupeKey(normalized);
    if (key.length === 0 || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length >= MAX_TAKEAWAY_ITEMS) break;
  }
  return result;
}