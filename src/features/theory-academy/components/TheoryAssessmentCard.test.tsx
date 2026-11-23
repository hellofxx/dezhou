/**
 * 地图评估区聚合卡冒烟（jsdom）。
 * 覆盖：section 语义标签、「定位测评 / 检查点」两条入口的落点、levelId 为空时不渲染检查点入口、
 * 英文界面不回显 key 字面量。
 * 未覆盖（jsdom 无法判定）：真实浏览器排版、<768px 布局、检查点页面自身的锁定 / 未读完态。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { preloadI18n } from '@/i18n/preload';
import { TheoryAssessmentCard } from './TheoryAssessmentCard';

MotionGlobalConfig.skipAnimations = true;

function mount(levelId: string | null) {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <TheoryAssessmentCard levelId={levelId} />
    </MemoryRouter>,
  );
}

function assessmentRegion(): HTMLElement {
  return screen.getByRole('region', { name: i18n.t('nav.assessment') });
}

beforeEach(() => {
  void i18n.changeLanguage('zh');
});

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage('zh');
});

describe('TheoryAssessmentCard', () => {
  it('以共享 section label 渲染评估区，并给出定位测评入口', () => {
    mount('t3');
    const region = assessmentRegion();
    expect(within(region).getByRole('heading', { name: i18n.t('nav.assessment') })).toBeTruthy();
    const placement = within(region).getByRole('link', { name: i18n.t('nav.theoryPlacement') });
    expect(placement.getAttribute('href')).toBe('/theory/placement');
  });

  it('有进行中 Level 时给出检查点入口并指向该 Level', () => {
    mount('t3');
    const checkpoint = within(assessmentRegion()).getByRole('link', {
      name: i18n.t('nav.theoryCheckpoint'),
    });
    expect(checkpoint.getAttribute('href')).toBe('/theory/checkpoint/t3');
  });

  it('levelId 为空时不渲染检查点入口（评估区只剩定位测评）', () => {
    const { container } = mount(null);
    expect(assessmentRegion()).toBeTruthy();
    expect(screen.queryByRole('link', { name: i18n.t('nav.theoryCheckpoint') })).toBeNull();
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(container.querySelector('a[href^="/theory/checkpoint/"]')).toBeNull();
  });

  it('英文界面渲染英文入口文案，不回显 key 字面量', async () => {
    await preloadI18n(['nav'], 'en');
    await i18n.changeLanguage('en');
    mount('t3');
    const region = assessmentRegion();
    expect(
      within(region).getByRole('link', { name: i18n.t('nav.theoryPlacement') }),
    ).toBeTruthy();
    expect(
      within(region).getByRole('link', { name: i18n.t('nav.theoryCheckpoint') }),
    ).toBeTruthy();
    expect(region.textContent).not.toContain('nav.');
  });
});