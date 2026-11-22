/**
 * academyTakeaway 契约（Node 纯函数）：
 * objectives 在前 + key-point 按换行拆分在后；归一化去重（trim + 折叠空白 + 去尾句号比对）；
 * 上限 6 条截断；空入参返回 []。
 */
import { describe, expect, it } from 'vitest';
import { assembleTakeawayItems } from './academyTakeaway';

describe('assembleTakeawayItems', () => {
  it('objectives 在前，key-point 按换行拆分在后', () => {
    const result = assembleTakeawayItems(
      ['理解 EV 的定义', '掌握底池赔率'],
      ['EV 只看未来分支\n沉没成本不是成本'],
    );
    expect(result).toEqual([
      '理解 EV 的定义',
      '掌握底池赔率',
      'EV 只看未来分支',
      '沉没成本不是成本',
    ]);
  });

  it('归一化去重：trim + 折叠空白后重复项只保留首次出现（展示为归一化文本）', () => {
    const result = assembleTakeawayItems(
      ['理解 EV  的定义', ' 理解 EV 的定义 '],
      ['理解 EV 的定义\n新的要点'],
    );
    expect(result).toEqual(['理解 EV 的定义', '新的要点']);
  });

  it('去尾部句号后比对：带不带句号视为同一要点（保留首条原文标点）', () => {
    const result = assembleTakeawayItems(
      ['EV 只看未来分支。'],
      ['EV 只看未来分支\n底池赔率决定跟注门槛.'],
    );
    expect(result).toEqual(['EV 只看未来分支。', '底池赔率决定跟注门槛.']);
  });

  it('上限 6 条截断', () => {
    const objectives = ['目标一', '目标二', '目标三', '目标四'];
    const keyPoints = ['要点一\n要点二\n要点三\n要点四'];
    const result = assembleTakeawayItems(objectives, keyPoints);
    expect(result).toHaveLength(6);
    expect(result).toEqual(['目标一', '目标二', '目标三', '目标四', '要点一', '要点二']);
  });

  it('空入参返回 []，空白条目被过滤', () => {
    expect(assembleTakeawayItems([], [])).toEqual([]);
    expect(assembleTakeawayItems(['', '  '], ['\n \n'])).toEqual([]);
  });

  it('不修改入参数组（纯函数）', () => {
    const objectives = ['目标一'];
    const keyPoints = ['要点一\n要点二'];
    assembleTakeawayItems(objectives, keyPoints);
    expect(objectives).toEqual(['目标一']);
    expect(keyPoints).toEqual(['要点一\n要点二']);
  });
});