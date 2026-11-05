/**
 * AcademyVariantRuleCard 契约（jsdom）：
 * - 空 items 整卡不渲染（各院包装层判定「无规则可说」时不必分支）
 * - 标题 / 副标题 / 规则行（顺序敏感）/ 脚注全量渲染
 * - 行语义是 <dl> + 成对 dt/dd，标签在左、值在右
 * - section 可访问名缺省回落到标题，可用 ariaLabel 覆盖
 * - 共享层不持有 router / store / i18n / feature 依赖（只吃 props）
 * - 与 buildHeadsUpRuleRows 的固定行顺序一致（纯函数产出的行可直接渲染）
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { headsUpRules } from '@/shared/constants/headsUpRules';
import { buildHeadsUpRuleRows, type VariantRuleRow } from '@/shared/utils/academyVariantRules';
import { AcademyVariantRuleCard, type AcademyVariantRuleItem } from './AcademyVariantRuleCard';

MotionGlobalConfig.skipAnimations = true;

/** 共享层源码（raw glob 而非 node:fs：component 项目跑在 jsdom，import.meta.url 非 file scheme） */
const SOURCES = import.meta.glob<string>(
  ['./AcademyVariantRuleCard.tsx', '../../utils/academyVariantRules.ts'],
  { query: '?raw', import: 'default', eager: true }
);

const items: AcademyVariantRuleItem[] = [
  { id: 'players', label: '人数', value: '2' },
  { id: 'deckSize', label: '牌数', value: '52' },
  { id: 'preflopFirst', label: '翻前先行动', value: 'SB（按钮位）' },
  { id: 'postflopFirst', label: '翻后先行动', value: 'BB' },
  { id: 'blinds', label: '盲注（SB / BB）', value: '0.5 / 1' },
  { id: 'ante', label: 'Ante', value: '有 Ante' },
];

/** 把纯函数产出的行按 i18n key 原样落成显示值（包装层真实做法的替身） */
const toItem = (row: VariantRuleRow): AcademyVariantRuleItem => ({
  id: row.id,
  label: row.labelKey,
  value: row.value ?? row.valueKey ?? '',
});

afterEach(cleanup);

describe('AcademyVariantRuleCard', () => {
  it('items 为空时整卡不渲染', () => {
    const { container } = render(<AcademyVariantRuleCard title="单挑规则" items={[]} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('渲染标题、副标题、全部规则行与脚注', () => {
    render(
      <AcademyVariantRuleCard
        title="单挑规则"
        subtitle="牌数、盲注结构与各街行动顺序"
        items={items}
        footnote="翻后位置优势属于最后行动的一方"
      />
    );

    expect(screen.getByRole('heading', { level: 3, name: '单挑规则' })).toBeTruthy();
    expect(screen.getByText('牌数、盲注结构与各街行动顺序')).toBeTruthy();
    expect(screen.getByText('翻后位置优势属于最后行动的一方')).toBeTruthy();
    for (const item of items) {
      expect(screen.getByText(item.label)).toBeTruthy();
      expect(screen.getByText(item.value)).toBeTruthy();
    }
  });

  it('行使用 dl/dt/dd 语义，且顺序与 items 一致', () => {
    const { container } = render(<AcademyVariantRuleCard title="单挑规则" items={items} />);

    const list = container.querySelector('dl');
    expect(list).toBeTruthy();
    expect(container.querySelectorAll('dl + dl, ul')).toHaveLength(0);
    const terms = Array.from(container.querySelectorAll('dt')).map((node) => node.textContent);
    const values = Array.from(container.querySelectorAll('dd')).map((node) => node.textContent);
    expect(terms).toEqual(items.map((item) => item.label));
    expect(values).toEqual(items.map((item) => item.value));
    const rowIds = Array.from(container.querySelectorAll('[data-variant-rule]')).map((node) =>
      node.getAttribute('data-variant-rule')
    );
    expect(rowIds).toEqual(items.map((item) => item.id));
  });

  it('footnote 缺省时不渲染脚注区', () => {
    const { container } = render(<AcademyVariantRuleCard title="单挑规则" items={items} />);

    expect(container.textContent).not.toContain('翻后位置优势');
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });

  it('section 可访问名缺省回落到标题，可用 ariaLabel 覆盖', () => {
    const { unmount } = render(<AcademyVariantRuleCard title="单挑规则" items={items} />);
    expect(screen.getByRole('region', { name: '单挑规则' })).toBeTruthy();
    unmount();

    render(<AcademyVariantRuleCard title="单挑规则" ariaLabel="变体规则" items={items} />);
    expect(screen.getByRole('region', { name: '变体规则' })).toBeTruthy();
  });

  it('可渲染 buildHeadsUpRuleRows 的固定行顺序（含课时上下文行）', () => {
    const base = buildHeadsUpRuleRows(headsUpRules);
    expect(base.map((row) => row.id)).toEqual([
      'players',
      'deckSize',
      'preflopFirst',
      'postflopFirst',
      'blinds',
      'ante',
    ]);
    expect(base.map((row) => row.value ?? row.valueKey)).toEqual([
      '2',
      '52',
      'variant.headsUpRules.preflopFirstValue',
      'variant.headsUpRules.postflopFirstValue',
      '0.5 / 1',
      'variant.headsUpRules.anteYes',
    ]);

    const withContext = buildHeadsUpRuleRows(headsUpRules, {
      stackDepth: 40,
      anteStructure: 'no_ante',
      dealerButtonPosition: 'SB',
    });
    expect(withContext.map((row) => row.id).slice(6)).toEqual([
      'stackDepth',
      'anteStructure',
      'dealerButtonPosition',
    ]);
    expect(withContext.map((row) => row.id)).toHaveLength(9);

    const { container } = render(
      <AcademyVariantRuleCard title="单挑规则" items={withContext.map(toItem)} />
    );
    expect(container.querySelectorAll('dt')).toHaveLength(9);
  });

  it('共享层组件与纯函数不 import router / store / i18n / feature', () => {
    const entries = Object.entries(SOURCES);
    // 扫描面自检：raw glob 失效时不得空洞通过
    expect(entries).toHaveLength(2);

    const forbidden = ['react-router', '@/features/', 'i18next', 'useTranslation', 'zustand', '/store'];
    for (const [file, source] of entries) {
      const importLines = source
        .split('\n')
        .filter((line) => line.startsWith('import') || line.includes("from '"));
      expect(importLines.length, `${file} 未提取到 import 行`).toBeGreaterThan(0);
      for (const line of importLines) {
        for (const needle of forbidden) {
          expect(line.includes(needle), `${file} 出现受限依赖：${line.trim()}`).toBe(false);
        }
      }
    }
  });
});
