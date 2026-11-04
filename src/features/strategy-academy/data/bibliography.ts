/**
 * 策略学院参考书目（唯一事实源）。
 *
 * 只登记直接支撑策略课时结论的公开教材：站内不复制原文，页面上只列出处与适用 Level，
 * 供读者自行延伸阅读。`title` / `author` 保留出版物原名（专有名词，不做逐语翻译）；
 * `noteKey` 经 `academy.bibliography.<id>.note` 解析（文案由 P8 汇总进 academy.json）。
 *
 * 与理论学院 `data/bibliography.ts` 相互独立：条目、注释文案都不共享、不复制。
 * `levels` 标注该著作主要对应的课程 Level（一本可跨多级），页面按 Level 聚合展示。
 */

export interface StrategyBibliographyEntry {
  id: string;
  title: string;
  author: string;
  /** 适用 Level（1-8），可跨级 */
  levels: number[];
  /** 书目注释的 i18n key（academy.bibliography.<id>.note） */
  noteKey: string;
}

export const STRATEGY_BIBLIOGRAPHY: readonly StrategyBibliographyEntry[] = [
  {
    id: 'theory-of-poker',
    title: 'The Theory of Poker',
    author: 'David Sklansky',
    levels: [1, 2, 3],
    noteKey: 'academy.bibliography.theory-of-poker.note',
  },
  {
    id: 'harrington-on-holdem',
    title: "Harrington on Hold'em: Expert Strategy for No-Limit Tournaments, Volume I",
    author: 'Dan Harrington & Bill Robertie',
    levels: [1, 6],
    noteKey: 'academy.bibliography.harrington-on-holdem.note',
  },
  {
    id: 'mathematics-of-poker',
    title: 'The Mathematics of Poker',
    author: 'Bill Chen & Jerrod Ankenman',
    levels: [3, 4, 6],
    noteKey: 'academy.bibliography.mathematics-of-poker.note',
  },
  {
    id: 'no-limit-holdem-advanced-players',
    title: "No-Limit Hold'em for Advanced Players",
    author: 'Matthew Janda',
    levels: [2, 3, 4],
    noteKey: 'academy.bibliography.no-limit-holdem-advanced-players.note',
  },
  {
    id: 'applications-of-nlhe',
    title: "Applications of No-Limit Hold'em",
    author: 'Matthew Janda',
    levels: [3, 4, 5],
    noteKey: 'academy.bibliography.applications-of-nlhe.note',
  },
  {
    id: 'modern-poker-theory',
    title: 'Modern Poker Theory',
    author: 'Michael Acevedo',
    levels: [4, 5, 8],
    noteKey: 'academy.bibliography.modern-poker-theory.note',
  },
  {
    id: 'play-optimal-poker',
    title: 'Play Optimal Poker',
    author: 'Andrew Brokos',
    levels: [4, 5],
    noteKey: 'academy.bibliography.play-optimal-poker.note',
  },
  {
    id: 'grinders-manual',
    title: "The Grinder's Manual",
    author: 'Peter Clarke',
    levels: [4, 8],
    noteKey: 'academy.bibliography.grinders-manual.note',
  },
  {
    id: 'how-to-read-hands',
    title: "How to Read Hands at No-Limit Hold'em",
    author: 'Ed Miller',
    levels: [3, 7],
    noteKey: 'academy.bibliography.how-to-read-hands.note',
  },
  {
    id: 'mental-game-of-poker',
    title: 'The Mental Game of Poker',
    author: 'Jared Tendler',
    levels: [5, 7],
    noteKey: 'academy.bibliography.mental-game-of-poker.note',
  },
  {
    id: 'exploitative-play-live-poker',
    title: 'Exploitative Play in Live Poker',
    author: 'Alexander Fitzgerald',
    levels: [7, 8],
    noteKey: 'academy.bibliography.exploitative-play-live-poker.note',
  },
];

export interface StrategyBibliographyGroup {
  level: number;
  entries: StrategyBibliographyEntry[];
}

/**
 * 按 Level 聚合（只含实际有书目的 Level，升序）。
 * 纯函数，页面与测试共用；不读取任何 store / 网络数据。
 */
export function groupStrategyBibliographyByLevel(
  entries: readonly StrategyBibliographyEntry[] = STRATEGY_BIBLIOGRAPHY,
): StrategyBibliographyGroup[] {
  const byLevel = new Map<number, StrategyBibliographyEntry[]>();
  for (const entry of entries) {
    for (const level of entry.levels) {
      const bucket = byLevel.get(level);
      if (bucket) {
        bucket.push(entry);
      } else {
        byLevel.set(level, [entry]);
      }
    }
  }
  return [...byLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, levelEntries]) => ({ level, entries: levelEntries }));
}
