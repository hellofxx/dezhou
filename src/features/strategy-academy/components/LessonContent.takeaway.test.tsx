import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n/config';
import { switchLanguage } from '@/i18n/preload';
import { LessonContent } from './LessonContent';
import { useAcademyStore } from '../store';
import type { Lesson } from '../types';

/**
 * 章末要点卡自动装配契约（Fix 2）：
 * - 无显式 takeaway 块时，两条阅读分支末尾自动出卡（objectives 在前 + key-point 在后）
 * - 有显式 takeaway 块时短路，不出现双卡
 * - en 环境 objectives / key-point 均走 i18n key 解析，卡内不泄漏数据层中文
 */

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'takeaway-fixture',
    level: 1,
    order: 1,
    title: '测试课程',
    subtitle: '',
    duration: '5 min',
    content: [
      { type: 'heading', content: '第一节' },
      { type: 'key-point', content: '要点一\n要点二' },
    ],
    quiz: [],
    objectives: ['识别底池赔率'],
    ...overrides,
  };
}

const practice = {
  id: 'takeaway-practice',
  questions: [
    {
      id: 'pq1',
      scenario: {
        heroHand: ['As', 'Ks'] as [string, string],
        heroPosition: 'BTN',
        previousActions: [],
        street: 'preflop' as const,
        potSize: 5,
        effectiveStack: 100,
      },
      options: [{ action: 'Call', isCorrect: true, explanation: '跟注。' }],
    },
  ],
};

function renderContent(lesson: Lesson) {
  return render(
    <MemoryRouter>
      <LessonContent lesson={lesson} onComplete={() => {}} />
    </MemoryRouter>,
  );
}

afterEach(async () => {
  cleanup();
  useAcademyStore.getState().resetProgress();
  if (i18n.language !== 'zh') await switchLanguage('zh');
});

describe('LessonContent：章末要点卡自动装配', () => {
  it('纯理论分支：无显式 takeaway 时自动出卡，objectives 在前 key-point 在后', () => {
    const { container } = renderContent(makeLesson());

    const cards = container.querySelectorAll('.lesson-takeaway');
    expect(cards).toHaveLength(1);
    const items = [...cards[0]!.querySelectorAll('li')].map((li) => li.textContent?.trim());
    expect(items).toEqual(['识别底池赔率', '要点一', '要点二']);
  });

  it('标准分支（含实战）：CTA 之前同样自动出卡', () => {
    const { container } = renderContent(makeLesson({ practice }));

    const cards = container.querySelectorAll('.lesson-takeaway');
    expect(cards).toHaveLength(1);
    expect(cards[0]!.textContent).toContain('识别底池赔率');
    expect(cards[0]!.textContent).toContain('要点一');
  });

  it('有显式 takeaway 块时短路：只渲染显式卡，不双卡', () => {
    const lesson = makeLesson({
      content: [
        { type: 'heading', content: '第一节' },
        { type: 'key-point', content: '要点一' },
        { type: 'takeaway', content: '显式要点甲\n显式要点乙' },
      ],
    });
    const { container } = renderContent(lesson);

    const cards = container.querySelectorAll('.lesson-takeaway');
    expect(cards).toHaveLength(1);
    expect(cards[0]!.textContent).toContain('显式要点甲');
    expect(cards[0]!.textContent).toContain('显式要点乙');
    // 自动装配被短路：objectives 不进入要点卡（路线图区域不受影响）
    expect(cards[0]!.textContent).not.toContain('识别底池赔率');
  });

  it('无 objectives 且无 key-point 时不渲染空卡', () => {
    const lesson = makeLesson({
      objectives: undefined,
      content: [{ type: 'heading', content: '第一节' }, { type: 'text', content: '正文' }],
    });
    const { container } = renderContent(lesson);
    expect(container.querySelectorAll('.lesson-takeaway')).toHaveLength(0);
  });

  it('en 环境：objectives 与 key-point 走 i18n key，卡内无汉字', async () => {
    i18n.addResourceBundle(
      'en',
      'translation',
      {
        academy: {
          lessonObjectives: { 'takeaway-fixture': { 0: 'Identify pot odds' } },
          lessonContent: { 'takeaway-fixture': { 1: 'Key point one\nKey point two' } },
        },
      },
      true,
      true,
    );
    // switchLanguage 先补加载 en 模块再切换，保证卡标题（academy.content.takeaway）就绪
    await switchLanguage('en');

    const { container } = renderContent(makeLesson());
    const card = container.querySelector('.lesson-takeaway');
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain('Identify pot odds');
    expect(card!.textContent).toContain('Key point one');
    expect(card!.textContent).toContain('Key point two');
    expect(card!.textContent).not.toMatch(/[\u4e00-\u9fff]/);
  });
});