import type { TFunction } from 'i18next';
import { APP_NAME } from '@/shared/constants/app';

/** 壳层标题左侧的分组眉标：序号是分组位置的固定标识，不随语言变化（DESIGN.md §5.7） */
export interface NavSection {
  index: string;
  label: string;
}

const SECTION_PREFIXES: { index: string; labelKey: string; prefixes: string[] }[] = [
  { index: '01', labelKey: 'nav.training', prefixes: ['/range-trainer', '/pot-odds', '/gto-simulator', '/puzzle'] },
  { index: '02', labelKey: 'nav.study', prefixes: ['/academy', '/theory', '/hand-history'] },
  { index: '03', labelKey: 'nav.data', prefixes: ['/progress', '/leaderboard'] },
  { index: '04', labelKey: 'nav.settingsGroup', prefixes: ['/settings', '/help'] },
];

/** 路径 → 导航分组眉标；未命中（含首页）回退 00 号分组 */
export function resolveNavSection(pathname: string, t: TFunction): NavSection {
  const match = SECTION_PREFIXES.find((section) =>
    section.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
  return match
    ? { index: match.index, label: t(match.labelKey) }
    : { index: '00', label: t('nav.appSubtitle') };
}

/** 路径 → 页名（壳层 h1 与 document.title 共用），子路由回退到模块名避免断档到 APP_NAME */
export function resolvePageTitle(pathname: string, t: TFunction): string {
  const pageTitle: Record<string, string> = {
    '/': t('nav.dashboard'),
    '/academy': t('nav.academy'),
    '/academy/basics': t('nav.basics'),
    '/theory': t('nav.theory'),
    '/theory/review': t('nav.theoryReview'),
    '/range-trainer': t('nav.rangeTrainer'),
    '/pot-odds': t('nav.potOdds'),
    '/gto-simulator': t('nav.gtoSimulator'),
    '/hand-history': t('nav.handHistory'),
    '/progress': t('nav.progress'),
    '/settings': t('nav.settings'),
    '/leaderboard': t('nav.leaderboard'),
    '/puzzle': t('nav.puzzle'),
    '/help': t('nav.help'),
  };

  const prefixTitles: [string, string][] = [
    ['/academy', t('nav.academy')],
    ['/theory', t('nav.theory')],
    ['/puzzle', t('nav.puzzle')],
    ['/progress', t('nav.progress')],
    ['/range-trainer', t('nav.rangeTrainer')],
    ['/pot-odds', t('nav.potOdds')],
    ['/gto-simulator', t('nav.gtoSimulator')],
    ['/hand-history', t('nav.handHistory')],
    ['/help', t('nav.help')],
  ];

  return (
    pageTitle[pathname] ??
    prefixTitles.find(([prefix]) => pathname.startsWith(`${prefix}/`))?.[1] ??
    APP_NAME
  );
}
