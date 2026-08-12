import { beforeEach, describe, expect, it } from 'vitest';
import i18n from './config';

const probeKey = (key: string) => i18n.t(key, { defaultValue: 'FALLBACK_CN' });

beforeEach(async () => {
  await i18n.changeLanguage('zh');
  await i18n.changeLanguage('en');
});

describe('en 内容 key 解析实证', () => {
  it('课程正文', () => {
    expect(i18n.language).toBe('en');
    expect(probeKey('academy.lessonContent.l1-basics.0')).not.toBe('FALLBACK_CN');
    expect(probeKey('academy.lessonContent.l1-basics.0')).not.toContain('德州');
    // eslint-disable-next-line no-console
    console.log('lessonContent.l1-basics.0 =>', JSON.stringify(probeKey('academy.lessonContent.l1-basics.0')));
  });

  it('quiz 题目', () => {
    // eslint-disable-next-line no-console
    console.log('quiz =>', JSON.stringify(probeKey('academy.lessonQuiz.l1-basics-q1.question')));
    expect(probeKey('academy.lessonQuiz.l1-basics-q1.question')).not.toContain('中文');
  });

  it('theory 正文', () => {
    // eslint-disable-next-line no-console
    console.log('theory =>', JSON.stringify(probeKey('theory.content.t1-combinatorics.0')));
    expect(probeKey('theory.content.t1-combinatorics.0')).not.toContain('组合');
  });

  it('resource bundle 原始检查', () => {
    const enBundle = i18n.getResourceBundle('en', 'translation');
    const zhBundle = i18n.getResourceBundle('zh', 'translation');
    // eslint-disable-next-line no-console
    console.log(
      'en has lessonContent.l1-basics:',
      JSON.stringify((enBundle.academy as Record<string, unknown>)?.lessonContent)
        ?.slice(0, 80) ?? 'N/A',
    );
    // eslint-disable-next-line no-console
    console.log(
      'zh has lessonContent.l1-basics:',
      JSON.stringify((zhBundle.academy as Record<string, unknown>)?.lessonContent)
        ?.slice(0, 80) ?? 'N/A',
    );
    expect(true).toBe(true);
  });
});
