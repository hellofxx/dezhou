/**
 * navSections 契约（壳层眉标与页名的纯函数出口，批次 3 冻结导航）：
 * - 路径 → 分组序号（01 课程 / 02 训练·速训 / 03 进度 / 04 设置·帮助），未命中回退 00 + 应用名
 * - 前缀匹配必须按路径段边界（`/help` 命中，`/helpfoo` 不命中）
 * - 路径 → 页名：精确表优先，子路由回退到模块名（避免子页断档成应用名）
 */
import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { resolveNavSection, resolvePageTitle } from './navSections';

/** 测试用 t：直接回传 key，便于断言「解析到了哪个 key」 */
const t = ((key: string) => key) as unknown as TFunction;

describe('resolveNavSection', () => {
  it('四个分组前缀分别映射到 01/02/03/04 序号', () => {
    expect(resolveNavSection('/lesson', t)).toEqual({ index: '01', label: 'nav.study' });
    expect(resolveNavSection('/lesson/l1-b', t)).toEqual({ index: '01', label: 'nav.study' });
    expect(resolveNavSection('/drill', t)).toEqual({ index: '02', label: 'nav.training' });
    expect(resolveNavSection('/drill/range', t)).toEqual({ index: '02', label: 'nav.training' });
    expect(resolveNavSection('/quick', t)).toEqual({ index: '02', label: 'nav.training' });
    expect(resolveNavSection('/range-trainer/quiz', t)).toEqual({ index: '02', label: 'nav.training' });
    expect(resolveNavSection('/pot-odds/quiz', t)).toEqual({ index: '02', label: 'nav.training' });
    expect(resolveNavSection('/gto-simulator/session/x', t)).toEqual({ index: '02', label: 'nav.training' });
    expect(resolveNavSection('/academy/tracks', t)).toEqual({ index: '01', label: 'nav.study' });
    expect(resolveNavSection('/theory/placement', t)).toEqual({ index: '01', label: 'nav.study' });
    expect(resolveNavSection('/progress/range', t)).toEqual({ index: '03', label: 'nav.data' });
    expect(resolveNavSection('/leaderboard', t)).toEqual({ index: '03', label: 'nav.data' });
    expect(resolveNavSection('/hand-history', t)).toEqual({ index: '03', label: 'nav.data' });
    expect(resolveNavSection('/settings', t)).toEqual({ index: '04', label: 'nav.settingsGroup' });
    expect(resolveNavSection('/help/article/a1', t)).toEqual({ index: '04', label: 'nav.settingsGroup' });
  });

  it('首页与未知路径回退 00 号分组 + 应用名', () => {
    expect(resolveNavSection('/', t)).toEqual({ index: '00', label: 'nav.appSubtitle' });
    expect(resolveNavSection('/unknown-path', t)).toEqual({ index: '00', label: 'nav.appSubtitle' });
  });

  it('前缀按路径段边界匹配，不吞掉同名开头路径', () => {
    expect(resolveNavSection('/helpfoo', t)).toEqual({ index: '00', label: 'nav.appSubtitle' });
    expect(resolveNavSection('/settingsx', t)).toEqual({ index: '00', label: 'nav.appSubtitle' });
  });
});

describe('resolvePageTitle', () => {
  it('精确路径命中专属页名', () => {
    expect(resolvePageTitle('/', t)).toBe('nav.path');
    expect(resolvePageTitle('/lesson', t)).toBe('nav.course');
    expect(resolvePageTitle('/drill', t)).toBe('nav.drillHub');
    expect(resolvePageTitle('/drill/range', t)).toBe('nav.drillRange');
    expect(resolvePageTitle('/drill/odds', t)).toBe('nav.drillOdds');
    expect(resolvePageTitle('/drill/puzzle', t)).toBe('nav.drillPuzzle');
    expect(resolvePageTitle('/quick', t)).toBe('nav.quick');
    expect(resolvePageTitle('/progress', t)).toBe('nav.progressCenter');
    expect(resolvePageTitle('/help', t)).toBe('nav.help');
    expect(resolvePageTitle('/settings', t)).toBe('nav.settings');
    expect(resolvePageTitle('/academy/tracks', t)).toBe('nav.academyTracks');
    expect(resolvePageTitle('/theory/glossary', t)).toBe('nav.theoryGlossary');
  });

  it('子路由回退到所属模块名（不断档成应用名）', () => {
    expect(resolvePageTitle('/lesson/l1-b', t)).toBe('nav.course');
    expect(resolvePageTitle('/theory/chapter/l1', t)).toBe('nav.theory');
    expect(resolvePageTitle('/academy/lesson/local-x', t)).toBe('nav.academy');
    expect(resolvePageTitle('/academy/checkpoint/3', t)).toBe('nav.academyCheckpoint');
    expect(resolvePageTitle('/academy/certification/3', t)).toBe('nav.academyCertification');
    expect(resolvePageTitle('/theory/checkpoint/3', t)).toBe('nav.theoryCheckpoint');
    expect(resolvePageTitle('/help/article/a1', t)).toBe('nav.help');
    expect(resolvePageTitle('/range-trainer/quiz', t)).toBe('nav.drillRange');
    expect(resolvePageTitle('/pot-odds/quiz', t)).toBe('nav.drillOdds');
    expect(resolvePageTitle('/puzzle/theme/x', t)).toBe('nav.drillPuzzle');
  });

  it('未注册路径回退应用名', () => {
    expect(resolvePageTitle('/nowhere', t)).toBe('nav.appSubtitle');
  });
});
