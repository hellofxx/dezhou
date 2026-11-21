import type { TFunction } from 'i18next';

/** 壳层标题左侧的分组眉标：序号是分组位置的固定标识，不随语言变化（DESIGN.md §5.7） */
export interface NavSection {
  index: string;
  label: string;
}

/**
 * 批次 3 冻结路由表的四段分组（侧栏六项 → 分组眉标）：
 * 00 学习路径（首页回退）/ 01 课程 / 02 训练（训练场 · 速训）/ 03 进度 / 04 设置 · 帮助
 */
const SECTION_PREFIXES: { index: string; labelKey: string; prefixes: string[] }[] = [
  { index: '01', labelKey: 'nav.study', prefixes: ['/lesson', '/academy', '/theory'] },
  {
    index: '02',
    labelKey: 'nav.training',
    prefixes: ['/drill', '/quick', '/puzzle', '/range-trainer', '/pot-odds', '/gto-simulator'],
  },
  { index: '03', labelKey: 'nav.data', prefixes: ['/progress', '/leaderboard', '/hand-history'] },
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

/** 路径 → 页名（壳层 h1 与 document.title 共用），子路由回退到模块名避免断档到应用名 */
export function resolvePageTitle(pathname: string, t: TFunction): string {
  const pageTitle: Record<string, string> = {
    '/': t('nav.path'),
    '/lesson': t('nav.course'),
    '/drill': t('nav.drillHub'),
    '/drill/range': t('nav.drillRange'),
    '/drill/odds': t('nav.drillOdds'),
    '/drill/puzzle': t('nav.drillPuzzle'),
    '/quick': t('nav.quick'),
    '/progress': t('nav.progressCenter'),
    '/help': t('nav.help'),
    '/settings': t('nav.settings'),
    '/academy': t('nav.academy'),
    '/academy/basics': t('nav.course'),
    '/academy/tracks': t('nav.academyTracks'),
    '/academy/concept-graph': t('nav.academyGraph'),
    '/academy/search': t('nav.academySearch'),
    '/academy/placement': t('nav.academyPlacement'),
    '/academy/bookmarks': t('nav.academyBookmarks'),
    '/academy/bibliography': t('nav.academyBibliography'),
    '/theory': t('nav.theory'),
    '/theory/review': t('nav.theoryReview'),
    '/theory/placement': t('nav.theoryPlacement'),
    '/theory/glossary': t('nav.theoryGlossary'),
    '/theory/search': t('nav.theorySearch'),
    '/theory/bibliography': t('nav.theoryBibliography'),
    '/leaderboard': t('nav.leaderboard'),
    '/gto-simulator': t('nav.gtoSimulator'),
    '/hand-history': t('nav.handHistory'),
  };

  const prefixTitles: [string, string][] = [
    ['/lesson', t('nav.course')],
    // 训练二级站必须先于 /drill 与旧模块前缀匹配
    ['/drill/range', t('nav.drillRange')],
    ['/drill/odds', t('nav.drillOdds')],
    ['/drill/puzzle', t('nav.drillPuzzle')],
    ['/drill', t('nav.drillHub')],
    ['/quick', t('nav.quick')],
    ['/range-trainer', t('nav.drillRange')],
    ['/pot-odds', t('nav.drillOdds')],
    ['/puzzle', t('nav.drillPuzzle')],
    // 学院/理论工具页须先于模块根前缀匹配
    ['/academy/tracks', t('nav.academyTracks')],
    ['/academy/concept-graph', t('nav.academyGraph')],
    ['/academy/search', t('nav.academySearch')],
    ['/academy/placement', t('nav.academyPlacement')],
    ['/academy/checkpoint', t('nav.academyCheckpoint')],
    ['/academy/certification', t('nav.academyCertification')],
    ['/academy/bookmarks', t('nav.academyBookmarks')],
    ['/academy/bibliography', t('nav.academyBibliography')],
    ['/academy', t('nav.academy')],
    ['/theory/placement', t('nav.theoryPlacement')],
    ['/theory/checkpoint', t('nav.theoryCheckpoint')],
    ['/theory/glossary', t('nav.theoryGlossary')],
    ['/theory/search', t('nav.theorySearch')],
    ['/theory/bibliography', t('nav.theoryBibliography')],
    ['/theory', t('nav.theory')],
    ['/progress', t('nav.progressCenter')],
    ['/leaderboard', t('nav.leaderboard')],
    ['/gto-simulator', t('nav.gtoSimulator')],
    ['/hand-history', t('nav.handHistory')],
    ['/help', t('nav.help')],
  ];

  return (
    pageTitle[pathname] ??
    prefixTitles.find(([prefix]) => pathname.startsWith(`${prefix}/`))?.[1] ??
    t('nav.appSubtitle')
  );
}
