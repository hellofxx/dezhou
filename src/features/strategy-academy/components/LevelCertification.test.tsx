import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import LevelCertification from './LevelCertification';
import { useAcademyStore } from '../store';
import { loadAcademyLessonsForLevel } from '../data/lessons/loaders';
import { getLevelSummariesByNumber } from '../utils/academyMeta';
import { CERTIFICATION_MAX_QUESTIONS } from '../utils/certificationExam';
import { DAY_MS } from '@/shared/utils/toLocalDateKey';
import type { LevelCertification as LevelCertRecord } from '../types';

// 理论锚点由 T3 的 lessonMeta 提供；本轨只消费 getLessonMeta（不 import 理论模块），
// 测试用桩数据验证"最多 3 条回链 + 路由拼接"
vi.mock('../data/lessonMeta', () => ({
  getLessonMeta: (lessonId: string) => ({
    eloDimension: 'postflop',
    theoryAnchors: [`t-${lessonId}`, 't-shared'],
  }),
  getLessonMetaMap: () => ({}),
}));

/**
 * 级别认证契约（T2）：
 * - URL 直达门禁：本级别未全部完成 / 非标准变体 → 只显示锁定原因，无开始按钮
 * - 冷却中展示倒计时并禁用开始；过期显示「续期」可立即重考
 * - 有效认证展示有效期，隐藏重考入口
 * - 实考题量 = min(题池, 20)，提交记录题量与实考一致
 * - 结算页展示 2–3 条理论锚点回链
 */

const PATH = '/academy/certification/:level';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderAt(level: string) {
  return render(
    <MemoryRouter initialEntries={[`/academy/certification/${level}`]}>
      <Routes>
        <Route path={PATH} element={<LevelCertification />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** 当前作答页的选项按钮（字母前缀 A-D） */
function optionButtons(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll('button')].filter((button) =>
    /^[A-D]/.test(button.textContent?.trim() ?? ''),
  );
}

/** 按 store 口径把某 level 数字的全部课程标记完成 */
function completeLevel(level: number) {
  const store = useAcademyStore.getState();
  for (const entry of getLevelSummariesByNumber(level)) {
    for (const lesson of entry.lessons) store.completeLesson(lesson.id);
  }
}

/** 直接落一份证书记录（模拟历史尝试/有效期，避免依赖时钟推进） */
function seedCertification(level: number, cert: Partial<LevelCertRecord>) {
  const state = useAcademyStore.getState();
  useAcademyStore.setState({
    certifications: {
      ...state.certifications,
      [level]: {
        level,
        requiredAccuracy: 70,
        cooldownPeriod: 24,
        lastAttemptAt: Date.now(),
        questionCount: 20,
        timeLimit: 0,
        attempts: 1,
        bestScore: 80,
        variant: 'standard',
        ...cert,
      },
    },
  });
}

/** 作答到结算（每题选 A），返回实际作答题数 */
function answerAll(container: HTMLElement, level = 1): number {
  let asked = 0;
  while (useAcademyStore.getState().certifications[level] === undefined && asked < 40) {
    asked += 1;
    const options = optionButtons(container);
    expect(options.length).toBeGreaterThan(0);
    fireEvent.click(options[0]!);
    const next = screen.queryByText('下一题') ?? screen.queryByText('查看结果');
    expect(next).not.toBeNull();
    fireEvent.click(next!);
  }
  return asked;
}

beforeAll(async () => {
  await loadAcademyLessonsForLevel(1);
});

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
  useAcademyStore.getState().switchVariant('standard');
});

describe('LevelCertification：URL 直达门禁', () => {
  it('未知 Level 显示「级别未找到」', () => {
    renderAt('99');
    expect(screen.getByText('级别未找到')).toBeTruthy();
  });

  it('本级别课程未全部完成：显示锁定原因（含进度），无开始按钮', async () => {
    const { container } = renderAt('1');
    await waitFor(() =>
      expect(container.textContent).toContain('需完成本级别全部课程才能参加认证'),
    );
    expect(container.textContent).toContain('当前进度：0/');
    expect(screen.queryByText('开始认证')).toBeNull();
  });

  it('非标准变体：显示变体限制，无开始按钮', async () => {
    completeLevel(1);
    useAcademyStore.getState().switchVariant('short-deck');
    const { container } = renderAt('1');
    await waitFor(() => expect(container.textContent).toContain('认证测验仅在标准变体提供'));
    expect(container.textContent).toContain('short-deck');
    expect(screen.queryByText('开始认证')).toBeNull();
  });
});

describe('LevelCertification：冷却与有效期', () => {
  it('冷却中：展示倒计时并禁用开始按钮，store 拒绝提交', async () => {
    completeLevel(1);
    seedCertification(1, {
      lastAttemptAt: Date.now() - 60_000,
      certifiedAt: undefined,
      validUntil: undefined,
    });
    const { container } = renderAt('1');
    await waitFor(() => expect(container.textContent).toContain('冷却中：需等待'));
    expect(container.textContent).toMatch(/冷却中：需等待 \d+:\d{2}/);
    expect((screen.getByText('开始认证') as HTMLButtonElement).disabled).toBe(true);

    const rejected = useAcademyStore
      .getState()
      .submitCertificationAttempt(1, { score: 95, totalQuestions: 20 });
    expect(rejected.accepted).toBe(false);
    expect(rejected).toMatchObject({ reason: 'cooldown' });
  });

  it('认证过期：显示续期入口并可开始新一次考试', async () => {
    completeLevel(1);
    const now = Date.now();
    seedCertification(1, {
      certifiedAt: now - 40 * DAY_MS,
      validUntil: now - DAY_MS,
      lastAttemptAt: now - 40 * DAY_MS,
      attempts: 1,
    });
    const { container } = renderAt('1');
    await waitFor(() => expect(container.textContent).toContain('认证已过期'));
    const renew = screen.getByText('续期') as HTMLButtonElement;
    expect(renew.disabled).toBe(false);
    fireEvent.click(renew);
    await waitFor(() => expect(container.textContent).toContain(`第 1 / ${CERTIFICATION_MAX_QUESTIONS}`));
  });

  it('认证有效：展示有效期剩余天数，隐藏重考入口', async () => {
    completeLevel(1);
    const now = Date.now();
    seedCertification(1, {
      certifiedAt: now,
      validUntil: now + 20 * DAY_MS,
      lastAttemptAt: now,
      attempts: 2,
      bestScore: 90,
    });
    const { container } = renderAt('1');
    await waitFor(() => expect(container.textContent).toContain('认证有效期至'));
    expect(container.textContent).toContain('剩余 20 天');
    expect(container.textContent).toContain('历史尝试：2 次 · 最高分 90%');
    expect(screen.queryByText('开始认证')).toBeNull();
    expect(screen.queryByText('续期')).toBeNull();
    expect(screen.queryByText('重新挑战')).toBeNull();
  });
});

describe('LevelCertification：实考与提交', () => {
  it('实考题量为 20，提交记录题量与实考一致', async () => {
    completeLevel(1);
    const { container } = renderAt('1');
    await waitFor(() => expect(screen.getByText('开始认证')).toBeTruthy());
    expect(container.textContent).toContain(`题目数量：${CERTIFICATION_MAX_QUESTIONS} 题`);

    fireEvent.click(screen.getByText('开始认证'));
    expect(container.textContent).toContain(`第 1 / ${CERTIFICATION_MAX_QUESTIONS}`);

    const asked = answerAll(container);
    expect(asked).toBe(CERTIFICATION_MAX_QUESTIONS);

    const cert = useAcademyStore.getState().certifications[1]!;
    expect(cert.totalQuestions).toBe(CERTIFICATION_MAX_QUESTIONS);
    expect(cert.questionCount).toBe(CERTIFICATION_MAX_QUESTIONS);
    expect(cert.questionIds).toHaveLength(CERTIFICATION_MAX_QUESTIONS);
    expect(new Set(cert.questionIds).size).toBe(CERTIFICATION_MAX_QUESTIONS);
    expect(cert.variant).toBe('standard');
    expect(cert.poolSize).toBeGreaterThanOrEqual(CERTIFICATION_MAX_QUESTIONS);
  });

  it('结算页展示 3 条理论锚点回链，可跳转 /theory/chapter/<id>', async () => {
    completeLevel(1);
    const { container } = renderAt('1');
    await waitFor(() => expect(screen.getByText('开始认证')).toBeTruthy());
    fireEvent.click(screen.getByText('开始认证'));
    answerAll(container);

    expect(container.textContent).toContain('回到理论学院补强推导');
    const anchors = screen.getAllByRole('button', { name: /理论章节/ });
    expect(anchors).toHaveLength(3);
    fireEvent.click(anchors[0]!);
    expect(screen.getByTestId('location').textContent).toMatch(/^\/theory\/chapter\/t-/);
  });

  it('换会话种子重新抽题（题序重洗）', async () => {
    completeLevel(1);
    const randomSpy = vi.spyOn(Math, 'random');

    randomSpy.mockReturnValue(0.25);
    const first = renderAt('1');
    await waitFor(() => expect(screen.getByText('开始认证')).toBeTruthy());
    fireEvent.click(screen.getByText('开始认证'));
    const firstQuestion = first.container.querySelector('h3')?.textContent ?? '';
    first.unmount();

    randomSpy.mockReturnValue(0.75);
    const second = renderAt('1');
    await waitFor(() => expect(screen.getByText('开始认证')).toBeTruthy());
    fireEvent.click(screen.getByText('开始认证'));
    const secondQuestion = second.container.querySelector('h3')?.textContent ?? '';

    randomSpy.mockRestore();
    expect(firstQuestion).not.toBe('');
    expect(secondQuestion).not.toBe(firstQuestion);
  });
});
