import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import { useProgressStore, DEFAULT_STREAK_STATE, DEFAULT_ONBOARDING } from '../../store';
import { DEFAULT_EMOTION_STATE } from '../../types';
import { useDebugModeStore, DEBUG_UNLOCK_CODE } from '@/shared/stores/debugMode';
import { MENTOR_PROFILES } from '@/shared/types/mentor';
import type { TrainingRecord } from '../../types';
import { toLocalDateKey } from '../../utils/toLocalDateKey';

/**
 * SettingsPage 设置页（jsdom 冒烟 + 关键分支）。
 *
 * 契约：
 * - 七个分区恒渲染；单栏折叠手风琴，仅首组（外观）默认展开，页面不再有分区导航；
 * - 教练风格按钮写入 store.mentorStyle，头像为 Lucide 图标（iconId 映射，尺寸与旧 emoji 一致）；
 * - 音效开关直接落到 settings.soundEnabled；
 * - 冻结卡按钮在「已训 / 已用 / 无卡」时禁用，可用时点击写入 streak 并给出成功反馈；
 * - 清除数据需二次确认，确认后 records 清空；
 * - 开发者选项默认折叠，错误调试码报错、正确调试码解锁并可关闭；
 * - 数据管理展示当前记录数，导入合法 JSON 后追加记录并提示条数。
 */

const DAY = 24 * 60 * 60 * 1000;
const TODAY = toLocalDateKey(Date.now());
const YESTERDAY = toLocalDateKey(Date.now() - DAY);

function buildRecord(id: string): TrainingRecord {
  return {
    id,
    module: 'range-trainer',
    mode: 'quiz',
    createdAt: Date.now(),
    result: {
      sessionId: id,
      module: 'range-trainer',
      totalQuestions: 10,
      correctAnswers: 7,
      accuracy: 0.7,
      averageTime: 4000,
      timestamp: Date.now(),
      details: [],
    },
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-probe>{location.pathname}</div>;
}

function seedStore(overrides: Record<string, unknown> = {}) {
  useProgressStore.setState({
    records: [],
    streak: { ...DEFAULT_STREAK_STATE },
    emotion: { ...DEFAULT_EMOTION_STATE },
    onboarding: { ...DEFAULT_ONBOARDING },
    settings: {
      theme: 'dark',
      soundEnabled: true,
      defaultQuizTime: 15,
      defaultQuestionCount: 20,
      language: 'zh',
    },
    mentorStyle: 'strict-math',
    ...overrides,
  });
  useDebugModeStore.setState({ unlockAll: false });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <SettingsPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

/** 折叠态分区：点击标题按钮展开（手风琴默认只开首组） */
function openSection(container: HTMLElement, title: string): void {
  const toggle = Array.from(container.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'))
    .find((b) => (b.textContent ?? '').includes(title) && b.getAttribute('aria-expanded') === 'false');
  if (!toggle) throw new Error(`未找到可展开的分区：${title}`);
  fireEvent.click(toggle);
}

beforeEach(() => seedStore());

afterEach(() => {
  cleanup();
  seedStore();
  vi.restoreAllMocks();
});

describe('SettingsPage 分区与偏好', () => {
  it('渲染七个分区、自动保存铭牌与版本信息，且仅首组默认展开', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';

    expect(text).toContain('牌室设置 · ROOM SETUP');
    expect(text).toContain('设置');
    expect(text).toContain('自动保存');
    for (const section of ['外观', '教练风格', '训练偏好', '游戏变体', '数据管理', '开发者选项', '关于']) {
      expect(text).toContain(section);
    }
    // 单栏手风琴：只有首组「外观」默认展开
    const expanded = Array.from(container.querySelectorAll('button[aria-expanded="true"]'));
    expect(expanded).toHaveLength(1);
    expect(expanded[0]!.textContent).toContain('外观');
    // 分区导航已移除（不再有 nav 侧栏）
    expect(container.querySelector('nav')).toBeNull();
  });

  it('教练风格按钮写入 store 并切换 aria-pressed，头像走 Lucide 图标', () => {
    const { container, getByText } = renderPage();
    openSection(container, '教练风格');

    // 三位教练各一枚 Lucide 图标（无 emoji 文本节点）
    const profileButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button[aria-pressed]'),
    );
    expect(profileButtons).toHaveLength(MENTOR_PROFILES.length);
    for (const button of profileButtons) {
      expect(button.querySelector('svg.lucide')).toBeTruthy();
    }

    const encouraging = getByText('鼓励型教练').closest('button');
    expect(encouraging).toBeTruthy();
    expect(encouraging!.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(encouraging!);

    expect(useProgressStore.getState().mentorStyle).toBe('encouraging');
    expect(encouraging!.getAttribute('aria-pressed')).toBe('true');
    expect(container.textContent).toContain('已选中');
  });

  it('音效开关切换 settings.soundEnabled', () => {
    const { container, getByRole } = renderPage();
    openSection(container, '训练偏好');

    const toggle = getByRole('switch');
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(toggle);

    expect(useProgressStore.getState().settings.soundEnabled).toBe(false);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('帮助中心按钮跳转 /help', () => {
    const { container, getByText } = renderPage();
    openSection(container, '关于');

    fireEvent.click(getByText('帮助中心'));

    expect(container.querySelector('[data-probe]')?.textContent).toBe('/help');
  });
});

describe('SettingsPage 冻结卡请假', () => {
  it('今日已训练时按钮禁用', () => {
    seedStore({
      streak: { ...DEFAULT_STREAK_STATE, lastTrainingDate: TODAY, currentStreak: 5, streakFreezes: 2 },
    });
    const { container, getByText } = renderPage();
    openSection(container, '游戏变体');

    expect((getByText('使用冻结卡').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('昨日已训且有卡时可请假成功，写入 streak 并提示成功', () => {
    seedStore({
      streak: {
        ...DEFAULT_STREAK_STATE,
        lastTrainingDate: YESTERDAY,
        currentStreak: 5,
        streakFreezes: 2,
        streakFreezeUsedToday: false,
      },
    });
    const { getByText, container } = renderPage();
    openSection(container, '游戏变体');

    const button = getByText('使用冻结卡').closest('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);

    const streak = useProgressStore.getState().streak;
    expect(streak.lastTrainingDate).toBe(TODAY);
    expect(streak.streakFreezes).toBe(1);
    expect(streak.streakFreezeUsedToday).toBe(true);
    expect(container.textContent).toContain('今日连续性已保护');
  });

  it('无可保护连续时点击给出失败提示', () => {
    // lastTrainingDate 距今 5 天：断签已不可救，按钮仍可点（禁用条件不含此项）
    seedStore({
      streak: {
        ...DEFAULT_STREAK_STATE,
        lastTrainingDate: toLocalDateKey(Date.now() - 5 * DAY),
        currentStreak: 3,
        streakFreezes: 2,
        streakFreezeUsedToday: false,
      },
    });
    const { getByText, container } = renderPage();
    openSection(container, '游戏变体');

    fireEvent.click(getByText('使用冻结卡').closest('button')!);

    expect(container.textContent).toContain('不可用');
    expect(useProgressStore.getState().streak.streakFreezes).toBe(2);
  });
});

describe('SettingsPage 数据管理', () => {
  it('展示当前训练记录数，清除数据需二次确认', () => {
    seedStore({ records: [buildRecord('r1'), buildRecord('r2')] });
    const { container, getByText, baseElement, getAllByText } = renderPage();
    openSection(container, '数据管理');

    expect(container.textContent).toContain('当前共 2 条训练记录');

    fireEvent.click(getByText('清除所有数据'));
    expect(baseElement.textContent).toContain('此操作将永久删除所有训练记录');

    // 标题与确认按钮同名，取按钮（最后出现的那个）
    const confirmButtons = getAllByText('确认清除');
    fireEvent.click(confirmButtons.at(-1)!);

    expect(useProgressStore.getState().records).toHaveLength(0);
  });

  it('导入合法 JSON 后追加记录并提示导入条数', async () => {
    const { container } = renderPage();
    openSection(container, '数据管理');
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).toBeTruthy();

    const payload = { records: [buildRecord('imported-1')], settings: { soundEnabled: false } };
    const file = new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' });
    fireEvent.change(input!, { target: { files: [file] } });

    await waitFor(() => {
      expect(container.textContent).toContain('成功导入 1 条记录');
    });
    expect(useProgressStore.getState().records.map((r) => r.id)).toEqual(['imported-1']);
    expect(useProgressStore.getState().settings.soundEnabled).toBe(false);
  });

  it('导入格式不正确的文件给出错误提示且不写入记录', async () => {
    const { container } = renderPage();
    openSection(container, '数据管理');
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');

    const file = new File(['{"foo":1}'], 'bad.json', { type: 'application/json' });
    fireEvent.change(input!, { target: { files: [file] } });

    await waitFor(() => {
      expect(container.textContent).toContain('文件格式不正确');
    });
    expect(useProgressStore.getState().records).toHaveLength(0);
  });
});

describe('SettingsPage 开发者选项', () => {
  it('默认折叠，错误调试码提示错误，正确调试码解锁并可关闭', () => {
    const { container, getByText, getByLabelText } = renderPage();
    // 折叠态：调试码输入框未挂载
    expect(container.querySelector('input[type="number"]')).toBeNull();

    // 分区标题与折叠按钮同名，取分区折叠按钮（带 aria-expanded）
    const sectionToggle = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'),
    ).find((b) => (b.textContent ?? '').includes('开发者选项'));
    expect(sectionToggle).toBeTruthy();
    fireEvent.click(sectionToggle!);
    const codeInput = getByLabelText('输入调试码');
    fireEvent.change(codeInput, { target: { value: '0000' } });
    fireEvent.click(getByText('激活'));
    expect(container.textContent).toContain('调试码不正确');
    expect(useDebugModeStore.getState().unlockAll).toBe(false);

    fireEvent.change(codeInput, { target: { value: DEBUG_UNLOCK_CODE } });
    fireEvent.click(getByText('激活'));
    expect(useDebugModeStore.getState().unlockAll).toBe(true);
    expect(container.textContent).toContain('调试解锁已开启');

    fireEvent.click(getByText('关闭调试解锁'));
    expect(useDebugModeStore.getState().unlockAll).toBe(false);
  });
});
