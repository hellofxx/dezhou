import { describe, expect, it } from 'vitest';
import {
  getChapterLastReviewed,
  getTheoryBibliographyEntries,
  getTheoryContentOps,
  getTheoryGlossaryTerms,
} from './theoryOptionalSources';

/**
 * 内容运营数据读取层（结构与就绪态守卫）。
 *
 * 本层用 Vite glob + 结构判定读取内容侧维护的三份数据文件，不依赖导出名：
 * - 数据文件已落地 → 必须解析出非空集合（本文件即「接线是否生效」的回归锁）
 * - 数据文件缺失 → 各 getter 返回安全空值（由组件空态承接，不抛错）
 *
 * 若内容侧调整了文件路径或字段命名，这里会先红，避免首页工具区静默变空。
 */
describe('theoryOptionalSources', () => {
  it('术语表数据可被解析（至少一条，且字段完整）', () => {
    const terms = getTheoryGlossaryTerms();
    expect(terms.length).toBeGreaterThan(0);
    for (const term of terms.slice(0, 5)) {
      expect(typeof term.id).toBe('string');
      expect(typeof term.termKey).toBe('string');
      expect(typeof term.definitionKey).toBe('string');
    }
  });

  it('参考书目数据可被解析（至少一条）', () => {
    const entries = getTheoryBibliographyEntries();
    expect(entries.length).toBeGreaterThan(0);
    expect(typeof entries[0]!.titleKey).toBe('string');
  });

  it('内容运营元数据可被解析（lastReviewed 为对象）', () => {
    const ops = getTheoryContentOps();
    expect(typeof ops.lastReviewed).toBe('object');
    expect(Object.keys(ops.lastReviewed).length).toBeGreaterThan(0);
  });

  it('最近校对查询：已知章节有日期，未知章节返回 undefined', () => {
    const ops = getTheoryContentOps();
    const known = Object.keys(ops.lastReviewed)[0]!;
    expect(getChapterLastReviewed(known)).toBe(ops.lastReviewed[known]);
    expect(getChapterLastReviewed('nope-not-a-chapter')).toBeUndefined();
  });
});
