import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Lesson } from '../types';
import {
  SEARCH_SNIPPET_LENGTH,
  buildLessonSearchIndex,
  createSnippet,
  getCachedLessonSearchIndex,
  loadLessonSearchIndex,
  resetLessonSearchIndexCache,
  searchLessonIndex,
} from './searchIndex';

vi.mock('../data/lessons/loaders', () => ({
  loadAcademyLessonsForQuickDrill: vi.fn(),
}));

import { loadAcademyLessonsForQuickDrill } from '../data/lessons/loaders';

const loadMock = vi.mocked(loadAcademyLessonsForQuickDrill);

function makeLesson(id: string, overrides: Partial<Lesson> = {}): Lesson {
  return {
    id,
    level: 1,
    order: 1,
    title: '位置的力量',
    subtitle: '理解位置为什么重要',
    duration: '8 分钟',
    content: [{ type: 'text', content: '按钮位最后一个行动，拥有最多信息。' }],
    quiz: [
      {
        id: `${id}-q1`,
        question: 'BTN 的优势来自哪里？',
        options: ['最后行动', '盲注最少', '牌力最强', '筹码最深'],
        correctIndex: 0,
        explanation: 'BTN 翻后最后行动，信息最多。',
      },
    ],
    ...overrides,
  };
}

const lessons: Lesson[] = [
  makeLesson('l1-position', {
    objectives: ['能用位置调整起手牌范围'],
    content: [
      { type: 'heading', content: '为什么位置重要' },
      {
        type: 'text',
        content: `前位信息最少，需要更强的牌。${'冗余填充'.repeat(60)}BluffCatchToken 之后再补一段冗余文本。`,
      },
    ],
  }),
  makeLesson('l2-raise-sizing', {
    title: '加注大小',
    subtitle: '标准翻前加注',
    objectives: [],
    content: [{ type: 'text', content: '开池加注通常 2.5BB。' }],
    quiz: [
      {
        id: 'l2-raise-sizing-q1',
        question: '标准开池加注尺度是？',
        options: ['2-2.5BB', '5BB', '10BB', '全下'],
        correctIndex: 0,
        explanation: '2-2.5BB 是主流开池尺度。',
      },
    ],
  }),
];

describe('buildLessonSearchIndex', () => {
  it('拍平标题 / 学习目标 / 正文 / 小测题干与解析，不含选项', () => {
    const index = buildLessonSearchIndex(lessons);
    expect(index.map((entry) => entry.lessonId)).toEqual(['l1-position', 'l2-raise-sizing']);

    const first = index[0]!;
    const texts = first.segments.map((segment) => segment.text);
    expect(texts[0]).toBe('位置的力量');
    expect(texts).toContain('能用位置调整起手牌范围');
    expect(texts.some((text) => text.includes('BluffCatchToken'))).toBe(true);
    expect(texts).toContain('BTN 的优势来自哪里？');
    expect(texts).toContain('BTN 翻后最后行动，信息最多。');
    // 选项文本不进入索引，避免把干扰项当成命中内容
    expect(texts).not.toContain('盲注最少');
  });

  it('空内容行不产生空片段', () => {
    const index = buildLessonSearchIndex([
      makeLesson('l1-empty', {
        subtitle: '   ',
        objectives: ['', '  '],
        content: [{ type: 'heading', content: '   ' }],
        quiz: [],
      }),
    ]);
    const texts = index[0]!.segments.map((segment) => segment.text);
    expect(texts).toEqual(['位置的力量']);
  });
});

describe('searchLessonIndex', () => {
  const index = buildLessonSearchIndex(lessons);

  it('空查询返回空数组', () => {
    expect(searchLessonIndex(index, '')).toEqual([]);
    expect(searchLessonIndex(index, '   ')).toEqual([]);
  });

  it('标题命中并标注来源', () => {
    const hits = searchLessonIndex(index, '加注大小');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ lessonId: 'l2-raise-sizing', source: 'title' });
  });

  it('副标题与学习目标命中归为 overview', () => {
    expect(searchLessonIndex(index, '标准翻前加注')[0]).toMatchObject({
      lessonId: 'l2-raise-sizing',
      source: 'overview',
    });
    expect(searchLessonIndex(index, '起手牌范围')[0]).toMatchObject({
      lessonId: 'l1-position',
      source: 'overview',
    });
  });

  it('正文命中归为 content，且摘要围绕命中位置', () => {
    const [hit] = searchLessonIndex(index, 'BluffCatchToken');
    expect(hit).toMatchObject({ lessonId: 'l1-position', source: 'content' });
    expect(hit!.snippet).toContain('BluffCatchToken');
    expect(hit!.snippet.length).toBeLessThanOrEqual(SEARCH_SNIPPET_LENGTH + 2);
    expect(hit!.snippet.startsWith('…')).toBe(true);
  });

  it('小测题干与解析命中归为 quiz', () => {
    expect(searchLessonIndex(index, '优势来自哪里')[0]).toMatchObject({
      lessonId: 'l1-position',
      source: 'quiz',
    });
    expect(searchLessonIndex(index, '主流开池尺度')[0]).toMatchObject({
      lessonId: 'l2-raise-sizing',
      source: 'quiz',
    });
  });

  it('英文大小写不敏感，中文原样匹配', () => {
    expect(searchLessonIndex(index, 'bluffcatchtoken')).toHaveLength(1);
    expect(searchLessonIndex(index, 'BTN')).toHaveLength(1);
    expect(searchLessonIndex(index, '前位信息最少')).toHaveLength(1);
    expect(searchLessonIndex(index, '前位信息最少BTN')).toHaveLength(0);
  });

  it('每个课时只返回首个命中片段', () => {
    const hits = searchLessonIndex(index, 'BTN');
    expect(hits).toHaveLength(1);
  });

  it('无命中返回空数组', () => {
    expect(searchLessonIndex(index, 'zzz-not-exist')).toEqual([]);
  });
});

describe('createSnippet', () => {
  it('短文本原样返回（压平空白）', () => {
    expect(createSnippet('第一行\n第二行', '第二')).toBe('第一行 第二行');
  });

  it('长文本按命中居中截取并补省略号', () => {
    const text = `${'前置内容'.repeat(20)}命中关键字${'后续内容'.repeat(20)}`;
    const snippet = createSnippet(text, '命中关键字', 40);
    expect(snippet).toContain('命中关键字');
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet.length).toBeLessThanOrEqual(42);
  });

  it('命中在开头时不补前置省略号', () => {
    const snippet = createSnippet(`命中关键字${'后续内容'.repeat(40)}`, '命中关键字', 40);
    expect(snippet.startsWith('命中关键字')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
  });
});

describe('loadLessonSearchIndex 缓存', () => {
  beforeEach(() => {
    resetLessonSearchIndexCache();
    loadMock.mockReset();
  });

  afterEach(() => {
    resetLessonSearchIndexCache();
  });

  it('首次调用加载并构建索引，再次调用不再触发加载', async () => {
    loadMock.mockResolvedValue(lessons);

    const first = await loadLessonSearchIndex();
    const second = await loadLessonSearchIndex();

    expect(loadMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(getCachedLessonSearchIndex()).toBe(first);
  });

  it('并发调用共用同一个 in-flight 请求', async () => {
    loadMock.mockResolvedValue(lessons);

    const [a, b] = await Promise.all([loadLessonSearchIndex(), loadLessonSearchIndex()]);

    expect(loadMock).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it('加载失败不缓存，允许重试', async () => {
    loadMock.mockRejectedValueOnce(new Error('chunk load failed'));
    await expect(loadLessonSearchIndex()).rejects.toThrow('chunk load failed');
    expect(getCachedLessonSearchIndex()).toBeNull();

    loadMock.mockResolvedValueOnce(lessons);
    const retried = await loadLessonSearchIndex();
    expect(loadMock).toHaveBeenCalledTimes(2);
    expect(retried).toHaveLength(2);
  });
});
