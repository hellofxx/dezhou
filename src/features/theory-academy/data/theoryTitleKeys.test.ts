import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { standardLevels } from './levels/variants/standard';

/**
 * 标准变体章节标题/副标题的双语 key 守卫。
 *
 * 章节标题与副标题走 UI chrome 通道（theory.chapterTitle / theory.chapterSubtitle），
 * 与正文/小测的按 level 分包（theory-content/）不同——它们随 theory.json 一起加载。
 * 因此这里有三种失效模式需要拦：
 * 1. 漏登记：新章有 title 但 theory.json 没有对应 key，界面退化成显示 undefined 或 id；
 * 2. 陈旧：zh 侧是数据原文的镜像副本，落后即出现两套文案；
 * 3. 未翻译：en 侧残留汉字。
 * 正文层的逐字一致性由 contentAlignment 负责，本文件只管目录 chrome 这两个字段。
 */

const SIDES = ['zh', 'en'] as const;
const CJK = /[\u4e00-\u9fff]/;

interface TheoryChrome {
  chapterTitle?: Record<string, string>;
  chapterSubtitle?: Record<string, string>;
}

const CHROME: Record<(typeof SIDES)[number], TheoryChrome> = {
  zh: JSON.parse(readFileSync('src/i18n/locales/zh/theory.json', 'utf8')) as TheoryChrome,
  en: JSON.parse(readFileSync('src/i18n/locales/en/theory.json', 'utf8')) as TheoryChrome,
};

const chapters = standardLevels.flatMap((level) => level.chapters);

describe('theory 章节标题双语 key', () => {
  for (const side of SIDES) {
    it(`${side}：每个标准章节都有非空 chapterTitle 与 chapterSubtitle`, () => {
      const missing = chapters.flatMap((chapter) => {
        const title = CHROME[side].chapterTitle?.[chapter.id] ?? '';
        const subtitle = CHROME[side].chapterSubtitle?.[chapter.id] ?? '';
        const bad: string[] = [];
        if (!title.trim()) bad.push(`${chapter.id}: 缺 theory.chapterTitle`);
        if (!subtitle.trim()) bad.push(`${chapter.id}: 缺 theory.chapterSubtitle`);
        return bad;
      });
      expect(missing).toEqual([]);
    });
  }

  it('zh：标题与副标题与数据层原文逐字一致', () => {
    const mismatched = chapters.flatMap((chapter) => {
      const bad: string[] = [];
      if (CHROME.zh.chapterTitle?.[chapter.id] !== chapter.title) {
        bad.push(`${chapter.id}: chapterTitle 与数据 title 不一致`);
      }
      if (CHROME.zh.chapterSubtitle?.[chapter.id] !== chapter.subtitle) {
        bad.push(`${chapter.id}: chapterSubtitle 与数据 subtitle 不一致`);
      }
      return bad;
    });
    expect(mismatched).toEqual([]);
  });

  it('en：标题与副标题不含汉字', () => {
    const cjk = chapters.flatMap((chapter) => {
      const title = CHROME.en.chapterTitle?.[chapter.id] ?? '';
      const subtitle = CHROME.en.chapterSubtitle?.[chapter.id] ?? '';
      const bad: string[] = [];
      if (CJK.test(title)) bad.push(`${chapter.id}: en chapterTitle 含汉字`);
      if (CJK.test(subtitle)) bad.push(`${chapter.id}: en chapterSubtitle 含汉字`);
      return bad;
    });
    expect(cjk).toEqual([]);
  });
});
