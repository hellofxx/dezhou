/**
 * 单挑规则卡（策略学院薄包装）契约：
 * - 仅 `lesson.variant === 'heads-up'` 渲染；标准 / 短牌课时整块不渲染（规则不误标）
 * - 基础行来自 shared `headsUpRules`（人数 / 牌数 / 各街先行动 / 盲注 / Ante，方向由数据派生）
 * - `lesson.variantContext` 有值时另起「本课上下文」卡（筹码深度 / Ante 结构 / 按钮位），
 *   只有部分值时只补对应行，无值时上下文卡不出现
 * - 文案走 `variant.headsUpRules.*` 字面量 key，断言真实 zh 文案且不渲染裸 key
 * - `LessonContent` 阅读态把规则卡放在课程路线图（LessonIntroCard）之前
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import type { Lesson } from '../types';
import { LessonContent } from './LessonContent';
import { StrategyVariantRuleCard } from './StrategyVariantRuleCard';

MotionGlobalConfig.skipAnimations = true;

afterEach(cleanup);

const TITLE = i18n.t('variant.headsUpRules.title');
const SUBTITLE = i18n.t('variant.headsUpRules.subtitle');
const CONTEXT_TITLE = i18n.t('variant.headsUpRules.contextTitle');
const PREFLOP_VALUE = i18n.t('variant.headsUpRules.preflopFirstValue');
const POSTFLOP_VALUE = i18n.t('variant.headsUpRules.postflopFirstValue');
const ANTE_YES = i18n.t('variant.headsUpRules.anteYes');
const INTRO_TITLE = i18n.t('academy.lessonUnit.introTitle');

/** 读取某行的整行文本（标签 + 值），行 id 由共享纯函数固定 */
function rowText(container: HTMLElement, id: string): string {
  const row = container.querySelector(`[data-variant-rule="${id}"]`);
  if (!row) throw new Error(`缺少规则行：${id}`);
  return row.textContent ?? '';
}

function makeHuLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'fixture-hu-lesson',
    level: 3,
    order: 1,
    title: '单挑 C-Bet',
    subtitle: '',
    duration: '5 min',
    variant: 'heads-up',
    content: [{ type: 'text', content: '单挑正文' }],
    quiz: [],
    units: [{ id: 'u1', title: '第一节', sections: [{ type: 'text', content: '第一节正文' }] }],
    ...overrides,
  };
}

describe('StrategyVariantRuleCard（策略学院单挑规则卡）', () => {
  it('单挑课时渲染规则卡与「本课上下文」行', () => {
    const { container } = render(
      <StrategyVariantRuleCard
        lesson={{
          variant: 'heads-up',
          variantContext: {
            dealerButtonPosition: 'HU_SB',
            anteStructure: 'sb_ante',
            stackDepth: 100,
          },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: TITLE })).toBeTruthy();
    expect(screen.getByText(SUBTITLE)).toBeTruthy();

    // 基础规则行：人数 / 牌数 / 各街先行动 / 盲注 / Ante
    expect(rowText(container, 'players')).toContain('2');
    expect(rowText(container, 'deckSize')).toContain('52');
    expect(rowText(container, 'preflopFirst')).toContain(PREFLOP_VALUE);
    expect(rowText(container, 'postflopFirst')).toContain(POSTFLOP_VALUE);
    expect(rowText(container, 'blinds')).toContain('0.5 / 1');
    expect(rowText(container, 'ante')).toContain(ANTE_YES);

    // 本课上下文三行（值与 variantContext 一致）
    expect(screen.getByRole('heading', { name: CONTEXT_TITLE })).toBeTruthy();
    expect(rowText(container, 'stackDepth')).toContain('100');
    expect(rowText(container, 'anteStructure')).toContain(ANTE_YES);
    expect(rowText(container, 'dealerButtonPosition')).toContain('HU_SB');
  });

  it('无 variantContext 时只显示基础规则，不出现上下文卡', () => {
    const { container } = render(<StrategyVariantRuleCard lesson={{ variant: 'heads-up' }} />);

    expect(screen.getByRole('heading', { name: TITLE })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: CONTEXT_TITLE })).toBeNull();
    for (const id of ['stackDepth', 'anteStructure', 'dealerButtonPosition']) {
      expect(container.querySelector(`[data-variant-rule="${id}"]`)).toBeNull();
    }
    expect(rowText(container, 'postflopFirst')).toContain(POSTFLOP_VALUE);
  });

  it('上下文只有部分值时只补对应行', () => {
    const { container } = render(
      <StrategyVariantRuleCard
        lesson={{ variant: 'heads-up', variantContext: { stackDepth: 40 } }}
      />,
    );

    expect(screen.getByRole('heading', { name: CONTEXT_TITLE })).toBeTruthy();
    expect(rowText(container, 'stackDepth')).toContain('40');
    expect(container.querySelector('[data-variant-rule="anteStructure"]')).toBeNull();
    expect(container.querySelector('[data-variant-rule="dealerButtonPosition"]')).toBeNull();
  });

  it.each(['standard', 'short-deck'] as const)('%s 课时整块不渲染', (variant) => {
    const { container } = render(
      <StrategyVariantRuleCard
        lesson={{ variant, variantContext: { anteStructure: 'sb_ante', stackDepth: 100 } }}
      />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('不渲染裸 i18n key', () => {
    const { container } = render(
      <StrategyVariantRuleCard
        lesson={{ variant: 'heads-up', variantContext: { dealerButtonPosition: 'HU_SB' } }}
      />,
    );

    const text = container.textContent ?? '';
    expect(text).not.toMatch(/variant\./);
    expect(text).not.toContain('headsUpRules');
    expect(text).not.toContain('undefined');
  });

  it('LessonContent 阅读态把规则卡放在课程路线图之前', () => {
    const { container } = render(
      <MemoryRouter>
        <LessonContent
          lesson={makeHuLesson({ variantContext: { anteStructure: 'sb_ante', stackDepth: 60 } })}
          onComplete={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: TITLE })).toBeTruthy();
    expect(screen.getByRole('heading', { name: CONTEXT_TITLE })).toBeTruthy();

    const text = container.textContent ?? '';
    expect(text).toContain(INTRO_TITLE);
    expect(text.indexOf(TITLE)).toBeGreaterThanOrEqual(0);
    expect(text.indexOf(TITLE)).toBeLessThan(text.indexOf(INTRO_TITLE));
  });

  it('标准课时在 LessonContent 里不出现规则卡', () => {
    const { container } = render(
      <MemoryRouter>
        <LessonContent lesson={makeHuLesson({ variant: 'standard' })} onComplete={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('heading', { name: TITLE })).toBeNull();
    expect(container.querySelector('[data-variant-rule]')).toBeNull();
  });
});
