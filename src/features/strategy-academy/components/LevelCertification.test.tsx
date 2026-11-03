import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LevelCertification from './LevelCertification';
import { useAcademyStore } from '../store';
import { loadAcademyLessonsForLevel } from '../data/lessons/loaders';

/**
 * 级别认证契约：
 * - 未知 Level 渲染「级别未找到」
 * - 开始页展示合并题量 / 通过标准（REQUIRED_ACCURACY 单源）/ 前置提示
 * - 答题 → 结算写入 store 认证记录（attempts / bestScore），结果页可重试
 * - 已通过认证展示通过日期，按钮变为「重新挑战」
 */

const PATH = '/academy/certification/:level';

function renderAt(level: string) {
  return render(
    <MemoryRouter initialEntries={[`/academy/certification/${level}`]}>
      <Routes>
        <Route path={PATH} element={<LevelCertification />} />
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

beforeAll(async () => {
  await loadAcademyLessonsForLevel(1);
});

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
});

afterAll(() => {
  useAcademyStore.getState().resetProgress();
});

describe('LevelCertification：入口与门禁', () => {
  it('未知 Level 显示「级别未找到」', () => {
    renderAt('99');
    expect(screen.getByText('级别未找到')).toBeTruthy();
  });

  it('开始页展示通过标准 70% 与合并题量，并提示未完成课程', async () => {
    const { container } = renderAt('1');
    await waitFor(() => expect(screen.getByText('Level 1 认证测验')).toBeTruthy());

    expect(screen.getByText('通过标准：正确率 ≥ 70%')).toBeTruthy();
    expect(container.textContent).toContain('题目数量：');
    expect(container.textContent).toContain('建议先完成本级别所有课程');
    expect(screen.getByText('开始认证')).toBeTruthy();
  });

  it('已通过认证展示通过日期，按钮变为重新挑战', async () => {
    useAcademyStore.getState().attemptCertification(1, 90);
    const { container } = renderAt('1');
    await waitFor(() => expect(screen.getByText('Level 1 认证测验')).toBeTruthy());

    expect(container.textContent).toContain('已通过认证');
    expect(screen.getByText('重新挑战')).toBeTruthy();
    expect(container.textContent).toContain('历史尝试：1 次 · 最高分 90%');
  });
});

describe('LevelCertification：答题与结算', () => {
  it('开始后逐题作答，结算写入认证记录并展示结果页', async () => {
    const { container } = renderAt('1');
    await waitFor(() => expect(screen.getByText('开始认证')).toBeTruthy());
    fireEvent.click(screen.getByText('开始认证'));

    expect(container.textContent).toContain('第 1 /');

    let guard = 0;
    while (!useAcademyStore.getState().certifications[1] && guard < 30) {
      guard += 1;
      const options = optionButtons(container);
      expect(options.length).toBeGreaterThan(0);
      fireEvent.click(options[0]!);
      const next = screen.queryByText('下一题') ?? screen.queryByText('查看结果');
      expect(next).not.toBeNull();
      fireEvent.click(next!);
    }

    expect(guard).toBeLessThan(30);
    const cert = useAcademyStore.getState().certifications[1];
    expect(cert).toBeDefined();
    expect(cert?.attempts).toBe(1);
    expect(cert?.bestScore).toBeGreaterThanOrEqual(0);
    expect(cert?.requiredAccuracy).toBe(70);

    // 结果页：通过 / 未通过二态之一
    const passed = (cert?.bestScore ?? 0) >= 70;
    expect(
      screen.queryByText('Level 1 认证通过！') ?? screen.queryByText('再接再厉！'),
    ).not.toBeNull();
    expect(passed).toBe(Boolean(cert?.certifiedAt));
    expect(screen.getByText('返回学院')).toBeTruthy();
  });

  it('未通过时「重新挑战」回到开始页并重置作答进度', async () => {
    const { container } = renderAt('1');
    await waitFor(() => expect(screen.getByText('开始认证')).toBeTruthy());
    fireEvent.click(screen.getByText('开始认证'));

    let guard = 0;
    while (!useAcademyStore.getState().certifications[1] && guard < 30) {
      guard += 1;
      fireEvent.click(optionButtons(container)[0]!);
      fireEvent.click((screen.queryByText('下一题') ?? screen.queryByText('查看结果'))!);
    }

    if (useAcademyStore.getState().isCertified(1)) {
      // 随机题序可能首项全对；已通过分支无重试按钮，契约由上一用例覆盖
      expect(screen.queryByText('重新挑战')).toBeNull();
      return;
    }

    fireEvent.click(screen.getByText('重新挑战'));
    await waitFor(() => expect(screen.getByText('开始认证')).toBeTruthy());
    expect(useAcademyStore.getState().certifications[1]?.attempts).toBe(1);
  });
});
