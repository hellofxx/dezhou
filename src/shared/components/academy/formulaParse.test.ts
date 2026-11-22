/**
 * formulaParse 契约（Node 纯函数）：行分类启发式逐类 fixture。
 * 覆盖：中文变量方程 / 长中文散文（为何÷2）/ ｜对照行 / Step 前缀强制开步 /
 * 尾部引文剥离 / 空行分组 / 编号阈值（≥3 步或 ≥2 组）/ 单双行不编号。
 */
import { describe, expect, it } from 'vitest';
import { parseFormulaContent } from './formulaParse';

describe('parseFormulaContent · 编号阈值（D9）', () => {
  it('单行简单公式不编号', () => {
    const parsed = parseFormulaContent('EV = P(win) × Pot');
    expect(parsed.numbered).toBe(false);
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0]?.steps).toHaveLength(1);
    expect(parsed.groups[0]?.steps[0]?.formula).toBe('EV = P(win) × Pot');
  });

  it('双行简单公式（1 组 2 步）仍不编号', () => {
    const parsed = parseFormulaContent('EV = P(win) × Pot\nP(win) = 0.35');
    expect(parsed.numbered).toBe(false);
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0]?.steps).toHaveLength(2);
  });

  it('单组 ≥3 步触发编号', () => {
    const parsed = parseFormulaContent('A = 1\nB = 2\nC = 3');
    expect(parsed.numbered).toBe(true);
    expect(parsed.groups[0]?.steps.map((s) => s.index)).toEqual([1, 2, 3]);
  });

  it('≥2 组触发编号（即使每组仅 1 步），编号跨组连续', () => {
    const parsed = parseFormulaContent('A = 1\n\nB = 2');
    expect(parsed.numbered).toBe(true);
    expect(parsed.groups).toHaveLength(2);
    expect(parsed.groups[0]?.steps[0]?.index).toBe(1);
    expect(parsed.groups[1]?.steps[0]?.index).toBe(2);
  });

  it('空内容返回空 groups 且不编号', () => {
    const parsed = parseFormulaContent('');
    expect(parsed.groups).toEqual([]);
    expect(parsed.numbered).toBe(false);
    expect(parsed.sourceNote).toBeUndefined();
  });
});

describe('parseFormulaContent · 行分类', () => {
  it('中文变量方程 P(胜)/P(负) 识别为公式行并开步', () => {
    const content =
      'EV 完整推导链（含弃牌权益分支）：\n' +
      '跟注 EV = P(胜) × (当前底池 + 对手下注) - P(负) × 跟注额\n' +
      '弃牌 EV = 0（基准）\n' +
      '下注 EV = 弃牌率 × 底池 + (1-弃牌率) × [胜率 × (底池+下注) - 败率 × 下注额]\n\n' +
      '常用盈亏平衡点：\n' +
      '纯诈唬所需弃牌率 = 下注额 ÷ (底池 + 下注额)\n' +
      '下注 2/3 池时，弃牌率 > 40% 即可盈利';
    const parsed = parseFormulaContent(content);
    expect(parsed.numbered).toBe(true);
    expect(parsed.groups).toHaveLength(2);
    expect(parsed.groups[0]?.title).toBe('EV 完整推导链（含弃牌权益分支）：');
    expect(parsed.groups[0]?.steps).toHaveLength(3);
    expect(parsed.groups[0]?.steps[0]?.formula).toContain('P(胜)');
    expect(parsed.groups[1]?.title).toBe('常用盈亏平衡点：');
    // 「下注 2/3 池时…」无公式符号 → 散文，挂到前一步
    expect(parsed.groups[1]?.steps[0]?.prose).toContain('下注 2/3 池时，弃牌率 > 40% 即可盈利');
  });

  it('长中文散文（为何÷2）判为散文而非公式行', () => {
    const longProse =
      '为何÷2：因为组合不计顺序先算有序排列再除以排列数才能得到正确组合数目所以这里需要除以二这个步骤非常关键一定要理解透彻否则后续计算都会出错';
    const parsed = parseFormulaContent(`C(n,k) = n! ÷ [k! × (n−k)!]\n${longProse}`);
    const step = parsed.groups[0]?.steps[0];
    expect(step?.formula).toBe('C(n,k) = n! ÷ [k! × (n−k)!]');
    expect(step?.prose).toContain(longProse);
  });

  it('｜ 对照行识别为公式行', () => {
    const line = '4 Outs：×4 估 16% ｜ 精确 16.5% ｜ 误差 −0.5';
    const parsed = parseFormulaContent(line);
    expect(parsed.groups[0]?.steps[0]?.formula).toBe(line);
  });

  it('Step N 前缀剥离并强制开新步（即使无公式符号）', () => {
    const content =
      '读牌四步法公式化流程：\n' +
      'Step 1: 构建初始范围（基于位置 + 翻前动作）\n' +
      'Step 2: 逐街过滤（每个动作排除一部分组合）\n' +
      'Step 3: 计算价值:诈唬比（组合数 ÷ 组合数）\n' +
      'Step 4: 比较所需胜率与诈唬占比';
    const parsed = parseFormulaContent(content);
    expect(parsed.groups[0]?.title).toBe('读牌四步法公式化流程：');
    expect(parsed.groups[0]?.steps).toHaveLength(4);
    expect(parsed.groups[0]?.steps[0]?.formula).toBe('构建初始范围（基于位置 + 翻前动作）');
    expect(parsed.groups[0]?.steps[2]?.formula).toBe('计算价值:诈唬比（组合数 ÷ 组合数）');
    expect(parsed.numbered).toBe(true);
  });

  it('标题行须以冒号结尾且冒号后无 =/≈', () => {
    const parsed = parseFormulaContent('推导：\nEV = 1');
    expect(parsed.groups[0]?.title).toBe('推导：');
    expect(parsed.groups[0]?.steps[0]?.formula).toBe('EV = 1');
  });

  it('step 前散文进 intro，纯散文组进 loose', () => {
    const parsed = parseFormulaContent('这是开场说明\nEV = 1\n这是收尾说明');
    const group = parsed.groups[0];
    expect(group?.intro).toContain('这是开场说明');
    expect(group?.steps[0]?.prose).toContain('这是收尾说明');

    const proseOnly = parseFormulaContent('纯散文一\n纯散文二');
    expect(proseOnly.groups[0]?.steps).toHaveLength(0);
    expect(proseOnly.groups[0]?.loose).toEqual(['纯散文一', '纯散文二']);
    expect(proseOnly.numbered).toBe(false);
  });
});

describe('parseFormulaContent · 引文剥离与分组', () => {
  it('尾部引文剥离为 sourceNote（不编号）', () => {
    const content = 'C(4,2) = 4×3 ÷ 2 = 6\n（概念源自：The Mathematics of Poker Ch.1-3）';
    const parsed = parseFormulaContent(content);
    expect(parsed.sourceNote).toBe('（概念源自：The Mathematics of Poker Ch.1-3）');
    expect(parsed.groups[0]?.steps[0]?.formula).toBe('C(4,2) = 4×3 ÷ 2 = 6');
    // 引文不进入任何 step / prose
    const allText = parsed.groups.flatMap((g) => [
      ...(g.title ? [g.title] : []),
      ...g.intro,
      ...g.loose,
      ...g.steps.flatMap((s) => [s.formula, ...s.prose]),
    ]);
    expect(allText.some((t) => t.includes('概念源自'))).toBe(false);
  });

  it('引文紧贴公式行尾（无换行）也能剥离', () => {
    const parsed = parseFormulaContent('同理 C(4,2) = 6（概念源自：Harrington Vol.1 Ch.2）');
    expect(parsed.sourceNote).toBe('（概念源自：Harrington Vol.1 Ch.2）');
    expect(parsed.groups[0]?.steps[0]?.formula).toBe('同理 C(4,2) = 6');
  });

  it('按空行切 group，组内换行切行并 trim 滤空', () => {
    const parsed = parseFormulaContent('A = 1\n  \nB = 2\n\n\nC = 3');
    expect(parsed.groups).toHaveLength(3);
    expect(parsed.groups.map((g) => g.steps[0]?.formula)).toEqual(['A = 1', 'B = 2', 'C = 3']);
  });
});

describe('parseFormulaContent · 英文内容（语言无关启发式）', () => {
  const EN_T1_FORMULA =
    'Combination formula and derivation:\n' +
    'C(n,k) = n! ÷ [k! × (n−k)!]\n' +
    'Deriving C(52,2): first count "ordered picks of two" = 52×51; since order doesn\'t matter, A♠K♥ and K♥A♠ are the same hand, so divide by 2! (the permutations of two cards) → 52×51 ÷ 2 = 1326\n' +
    "Similarly C(4,2) = 4×3 ÷ 2 = 6: order within the pair doesn't count either. (Concepts from: The Mathematics of Poker Ch.1-3 combinatorics; Harrington on Hold'em Vol.1 Ch.2)";

  it('英文长推导句判为散文（运算符密度低），不居中成公式行', () => {
    const parsed = parseFormulaContent(EN_T1_FORMULA);
    const step = parsed.groups[0]?.steps[0];
    expect(step?.formula).toBe('C(n,k) = n! ÷ [k! × (n−k)!]');
    expect(step?.prose.some((p) => p.startsWith('Deriving C(52,2)'))).toBe(true);
    // 长英文推导句不得成为公式行
    const allFormulas = parsed.groups.flatMap((g) => g.steps.map((s) => s.formula));
    expect(allFormulas.some((f) => f.startsWith('Deriving'))).toBe(false);
  });

  it('英文引文 (Concepts from: …) 半角括号剥离为 sourceNote', () => {
    const parsed = parseFormulaContent(EN_T1_FORMULA);
    expect(parsed.sourceNote).toContain('Concepts from: The Mathematics of Poker');
    const allText = parsed.groups.flatMap((g) => [
      ...(g.title ? [g.title] : []),
      ...g.intro,
      ...g.loose,
      ...g.steps.flatMap((s) => [s.formula, ...s.prose]),
    ]);
    expect(allText.some((t) => t.includes('Concepts from'))).toBe(false);
  });

  it('英文纯公式（运算符密集）仍判公式行，不误判散文', () => {
    const line = 'Bet EV = fold% × pot + (1-fold%) × [win% × (pot+bet) - lose% × bet]';
    const parsed = parseFormulaContent(line);
    expect(parsed.groups[0]?.steps[0]?.formula).toBe(line);
    expect(parsed.groups[0]?.steps[0]?.prose).toEqual([]);
  });
});