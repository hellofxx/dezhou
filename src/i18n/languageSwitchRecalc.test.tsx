import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import i18n from './config';
import { preloadI18n, loadAcademyCourses } from './preload';

// 复现用户场景：useMemo([t]) 模式（LessonQuiz/PracticeDrill/TheoryQuiz 同款）
function QuizProbe() {
  const { t } = useTranslation();
  const resolved = useMemo(
    () => ({
      q: t('academy.lessonQuiz.l1-basics-q1.question', { defaultValue: '默认中文题干' }),
      o0: t('academy.lessonQuiz.l1-basics-q1.options.0', { defaultValue: '默认中文选项' }),
    }),
    [t],
  );
  return (
    <span>
      {resolved.q} | {resolved.o0}
    </span>
  );
}

function ContentProbe() {
  const { t } = useTranslation();
  const resolved = useMemo(
    () => t('academy.lessonContent.l1-basics.0', { defaultValue: '默认中文正文' }),
    [t],
  );
  return <span>{resolved}</span>;
}

describe('语言切换后 useMemo([t]) 内容重算复现', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    // P0-02：预加载 academy-course 内容，避免 lazy 导致的内容缺失
    await loadAcademyCourses('zh');
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    // P0-02：恢复中文环境
    await act(async () => {
      await i18n.changeLanguage('zh');
      await loadAcademyCourses('zh');
    });
  });

  it('答题 (useMemo([t]))：切换 en 后应显示英文', async () => {
    await act(async () => {
      await i18n.changeLanguage('zh');
      root.render(<QuizProbe />);
    });
    expect(container.textContent).toContain('以下哪种牌型最强？');
  
    // P0-02：切换到英文时需要重新加载 academy-course
    await act(async () => {
      await i18n.changeLanguage('en');
      await loadAcademyCourses('en');
    });
    console.log('quiz after en switch =>', container.textContent);
    expect(container.textContent).toContain('Which hand is the strongest?');
  });
  
  it('正文 (useMemo([t]))：切换 en 后应显示英文', async () => {
    await act(async () => {
      await i18n.changeLanguage('zh');
      root.render(<ContentProbe />);
    });
    expect(container.textContent).toContain('什么是德州扑克？');
  
    // P0-02：切换到英文时需要重新加载 academy-course
    await act(async () => {
      await i18n.changeLanguage('en');
      await loadAcademyCourses('en');
    });
    console.log('content after en switch =>', container.textContent);
    expect(container.textContent).toContain("What is Texas Hold'em?");
  });

  it('浏览器懒加载 preloadI18n(academy) 后 en 课程内容仍可解析', async () => {
    await act(async () => {
      await i18n.changeLanguage('zh');
      // 预加载 academy 模块（core，启动已注入）
      await preloadI18n(['academy', 'drills'], 'zh');
      // 显式触发 academy-course 课程内容合并注入
      console.log('[TEST] loading zh academy courses...');
      await loadAcademyCourses('zh');
      const zhContent = i18n.t('academy.lessonContent.l1-basics.0', { defaultValue: 'MISS' });
      console.log('[TEST] zh lessonContent.l1-basics.0 =>', zhContent);
    });
    await act(async () => {
      await i18n.changeLanguage('en');
      // 语言切换时自动补加载目标语言（preloadI18n 会遍历 touchedKeys）
      await preloadI18n(['academy', 'drills'], 'en');
      // 显式触发英文 academy-course 内容注入（p0-02：课程内容为独立 chunk）
      console.log('[TEST] loading en academy courses...');
      await loadAcademyCourses('en');
    });
    console.log('after preload en =>', i18n.t('academy.lessonContent.l1-basics.0', { defaultValue: 'MISS' }));
    expect(i18n.t('academy.lessonContent.l1-basics.0', { defaultValue: 'MISS' })).toBe("What is Texas Hold'em?");
    expect(i18n.t('academy.lessonQuiz.l1-basics-q1.question', { defaultValue: 'MISS' })).toBe(
      'Which hand is the strongest?',
    );
  });
});
