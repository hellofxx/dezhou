/**
 * orderPlacementOptions 定级测试排序出口守卫：
 * ① 纯函数性质（集合不变 / isCorrect 随选项移动 / 不改源数据）
 * ② 数值选项集（pq-4）按数值升序
 * ③ 确定性：同题同文本多次调用顺序相同
 * ④ zh/en 双语顺序一致（i18n-key 型题库，顺序不随语言变化）
 * ⑤ 真实题库分布守卫：正确答案索引任一占比 <60%（口径与 drillOptionOrder 一致）
 */
import { describe, it, expect } from 'vitest';
import { placementQuestions } from '../data/placementQuestions';
import { orderPlacementOptions } from './optionOrder';

// zh/en 真实文案样本（i18n key 的解析结果快照，按 optA→optD 即 id a→d 顺序），
// 硬编码以避免纯函数测试依赖 i18n 资源加载
const ZH_TEXTS: Record<string, string[]> = {
  'pq-1': ['AA（口袋火箭）', 'KK（口袋国王）', 'QQ（口袋王后）', 'JJ（口袋杰克）'],
  'pq-2': ['同花顺（Straight Flush）', '四条（Four of a Kind）', '葫芦（Full House）', '同花（Flush）'],
  'pq-3': ['UTG（枪口位）', 'HJ（劫持位）', 'CO（截断位）', 'BTN（按钮位）'],
  'pq-4': ['20%', '25%', '33%', '50%'],
  'pq-5': ['72o（非同花 72）', 'K2s（同花 K2）', '92o（非同花 92）', 'AQo（非同花 AQ）'],
};
const EN_TEXTS: Record<string, string[]> = {
  'pq-1': ['AA (Pocket Rockets)', 'KK (Pocket Kings)', 'QQ (Pocket Queens)', 'JJ (Pocket Jacks)'],
  'pq-2': ['Straight Flush', 'Four of a Kind', 'Full House', 'Flush'],
  'pq-3': ['UTG', 'HJ', 'CO', 'BTN'],
  'pq-4': ['20%', '25%', '33%', '50%'],
  'pq-5': ['72o (off-suit 72)', 'K2s (suited K2)', '92o (off-suit 92)', 'AQo (off-suit AQ)'],
};

/** 按选项 id（a/b/c/d → 数组序）返回指定语言解析文本 */
function getTextFor(texts: Record<string, string[]>) {
  return (qId: string) => {
    const list = texts[qId]!;
    return (option: { id: string }) => list['abcd'.indexOf(option.id)]!;
  };
}

describe('orderPlacementOptions 排序出口', () => {
  const zhText = getTextFor(ZH_TEXTS);
  const enText = getTextFor(EN_TEXTS);

  it('① 集合不变：重排后选项 id 集合与源一致、恰一个正确项、不修改源数组', () => {
    for (const q of placementQuestions) {
      const sourceSnapshot = q.options.map((o) => ({ ...o }));
      const ordered = orderPlacementOptions(q, (o) => o.id);
      expect(ordered.map((o) => o.id).sort()).toEqual(sourceSnapshot.map((o) => o.id).sort());
      expect(ordered.filter((o) => o.isCorrect)).toHaveLength(1);
      expect(q.options).toEqual(sourceSnapshot); // 源数据未被修改
    }
  });

  it('② 数值选项集（pq-4）按数值升序展示', () => {
    const q4 = placementQuestions.find((q) => q.id === 'pq-4')!;
    const ordered = orderPlacementOptions(q4, zhText('pq-4'));
    expect(ordered.map((o) => zhText('pq-4')(o))).toEqual(['20%', '25%', '33%', '50%']);
  });

  it('③ 确定性：同题同文本多次调用顺序相同', () => {
    for (const q of placementQuestions) {
      const first = orderPlacementOptions(q, zhText(q.id)).map((o) => o.id);
      const second = orderPlacementOptions(q, zhText(q.id)).map((o) => o.id);
      expect(first).toEqual(second);
    }
  });

  it('④ zh/en 双语顺序一致（顺序不随语言变化）', () => {
    for (const q of placementQuestions) {
      const zhOrder = orderPlacementOptions(q, zhText(q.id)).map((o) => o.id);
      const enOrder = orderPlacementOptions(q, enText(q.id)).map((o) => o.id);
      expect(zhOrder).toEqual(enOrder);
    }
  });

  it('⑤ 分布守卫：全题库重排后正确答案索引任一占比 <60%', () => {
    const counts = new Map<number, number>();
    for (const q of placementQuestions) {
      const ordered = orderPlacementOptions(q, zhText(q.id));
      const correctIdx = ordered.findIndex((o) => o.isCorrect);
      counts.set(correctIdx, (counts.get(correctIdx) ?? 0) + 1);
    }
    const readable = [...counts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([idx, n]) => `索引${idx}:${n}次`)
      .join(' ');
    console.log(`[onboarding optionOrder 分布守卫] 共 ${placementQuestions.length} 题 → ${readable}`);
    for (const [idx, n] of counts) {
      expect(n / placementQuestions.length, `索引 ${idx} 占比过高`).toBeLessThan(0.6);
    }
  });
});
