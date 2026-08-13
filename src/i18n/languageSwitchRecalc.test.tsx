import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import i18n from './config';
import { preloadI18n } from './preload';

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

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    await act(async () => {
      await i18n.changeLanguage('zh');
    });
  });

  it('答题(useMemo([t]))：切换 en 后应显示英文', async () => {
    await act(async () => {
      await i18n.changeLanguage('zh');
    });
    await act(async () => {
      root.render(<QuizProbe />);
    });
    expect(container.textContent).toContain('以下哪种牌型最强？');

    await act(async () => {
      await i18n.changeLanguage('en');
    });
    console.log('quiz after en switch =>', container.textContent);
    expect(container.textContent).toContain('Which hand is the strongest?');
  });

  it('正文(useMemo([t]))：切换 en 后应显示英文', async () => {
    await act(async () => {
      await i18n.changeLanguage('zh');
    });
    await act(async () => {
      root.render(<ContentProbe />);
    });
    expect(container.textContent).toContain('什么是德州扑克？');

    await act(async () => {
      await i18n.changeLanguage('en');
    });
    console.log('content after en switch =>', container.textContent);
    expect(container.textContent).toContain("What is Texas Hold'em?");
  });

  it('浏览器懒加载 preloadI18n(academy) 后 en 课程内容仍可解析', async () => {
    await act(async () => {
      await i18n.changeLanguage('zh');
      // 模拟路由 lazyPage 的 preloadI18n（academy 属 core，但 FEATURE_GROUPS 含 academy，浏览器会触发 loadOne）
      await preloadI18n(['academy', 'drills'], 'zh');
    });
    await act(async () => {
      await i18n.changeLanguage('en');
      await preloadI18n(['academy', 'drills'], 'en');
    });
    console.log('after preload en =>', i18n.t('academy.lessonContent.l1-basics.0', { defaultValue: 'MISS' }));
    expect(i18n.t('academy.lessonContent.l1-basics.0', { defaultValue: 'MISS' })).toBe("What is Texas Hold'em?");
    expect(i18n.t('academy.lessonQuiz.l1-basics-q1.question', { defaultValue: 'MISS' })).toBe(
      'Which hand is the strongest?',
    );
  });
});
