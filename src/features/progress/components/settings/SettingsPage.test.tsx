import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import { useProgressStore, DEFAULT_STREAK_STATE, DEFAULT_ONBOARDING } from '../../store';
import { DEFAULT_EMOTION_STATE } from '../../types';
import { __resetPersistenceStatus } from '../../persistenceStatus';
import { useDebugModeStore, DEBUG_UNLOCK_CODE } from '@/shared/stores/debugMode';
import { MENTOR_PROFILES } from '@/shared/types/mentor';
import type { TrainingRecord } from '../../types';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';

/**
 * SettingsPage 设置页（jsdom 冒烟 + 关键分支）。
 *
 * 契约：
 * - 七个分区恒渲染；单栏折叠手风琴，仅首组（外观）默认展开，折叠态显示当前取值摘要；
 *   页面不再有分区导航（不再有 nav 侧栏）；
 * - 主题 / 语言 / 时间 / 题量使用分段控件，选中态通过 aria-pressed 暴露；
 * - 教练风格按钮写入 store.mentorStyle，头像为 Lucide 图标（iconId 映射，尺寸与旧 emoji 一致）；
 * - 音效开关直接落到 settings.soundEnabled；
 * - 冻结卡按钮在「已训 / 已用 / 无卡」时禁用，可用时点击写入 streak 并给出成功反馈；
 * - 数据管理：导入按 submitRecord 实际结果分别统计新增 / 重复 / 无效 / 未保存；
 *   牌局恢复失败不影响记录统计；导出在 hands 读取失败时仍下载部分备份并明确标注；
 *   v3 备份额外包含个人偏好（教练风格 / 游戏变体 / 每日题量上限）并按白名单恢复；
 *   清除只针对训练记录，失败时按持久化上报回滚（不假装成功）；
 * - 开发者选项默认折叠，错误调试码报错、正确调试码解锁并可关闭。
 */

const DAY = 24 * 60 * 60 * 1000;
const TODAY = toLocalDateKey(Date.now());
const YESTERDAY = toLocalDateKey(Date.now() - DAY);

// 存储边界与牌局备份拆成替身：本文件只验证「按实际结果统计 / 反馈」，不依赖真实 IndexedDB
const dbMock = vi.hoisted(() => ({
  add: vi.fn(async (_records: unknown[]): Promise<void> => {}),
  addIfAbsent: vi.fn(async (_record: unknown): Promise<'inserted' | 'exists'> => 'inserted'),
  delete: vi.fn(async (_id: string): Promise<void> => {}),
  clear: vi.fn(async (): Promise<void> => {}),
  cleanup: vi.fn(async (_limit: number): Promise<number> => 0),
  getAll: vi.fn(async (): Promise<unknown[]> => []),
}));

const handsMock = vi.hoisted(() => ({
  loadAllHands: vi.fn(async (): Promise<Array<Record<string, unknown>>> => []),
  saveAllHands: vi.fn(async (_hands: Array<Record<string, unknown>>): Promise<void> => {}),
}));

vi.mock('../../utils/recordDatabase', () => ({ recordDatabase: dbMock }));
vi.mock('../../utils/handHistoryBackup', () => handsMock);

function buildRecord(id: string, overrides: Partial<TrainingRecord> = {}): TrainingRecord {
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
    ...overrides,
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
    currentGameVariant: 'standard',
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

/** jsdom 未实现 createObjectURL / download 点击：替身并在测试内读回 blob 文本 */
const downloadCalls = vi.hoisted(() => ({ blobs: [] as Blob[] }));

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

function importJson(container: HTMLElement, payload: unknown): void {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).toBeTruthy();
  const file = new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' });
  fireEvent.change(input!, { target: { files: [file] } });
}

/** 数据管理分区内的动作按钮（导出 / 导入 / 清除，按渲染顺序） */
function dataActionButton(container: HTMLElement, index: number): HTMLButtonElement {
  const section = container.querySelector('#settings-data');
  expect(section).toBeTruthy();
  const buttons = Array.from(section!.querySelectorAll<HTMLButtonElement>('button'))
    .filter((b) => b.type !== 'button' || b.getAttribute('aria-expanded') === null);
  return buttons[index]!;
}

beforeEach(() => {
  seedStore();
  dbMock.addIfAbsent.mockReset();
  dbMock.addIfAbsent.mockResolvedValue('inserted');
  dbMock.clear.mockReset();
  dbMock.clear.mockResolvedValue(undefined);
  handsMock.loadAllHands.mockReset();
  handsMock.loadAllHands.mockResolvedValue([]);
  handsMock.saveAllHands.mockReset();
  handsMock.saveAllHands.mockResolvedValue(undefined);
  downloadCalls.blobs = [];
  Object.defineProperty(globalThis.URL, 'createObjectURL', {
    configurable: true,
    value: (blob: Blob) => {
      downloadCalls.blobs.push(blob);
      return 'blob:mock';
    },
  });
  Object.defineProperty(globalThis.URL, 'revokeObjectURL', { configurable: true, value: () => {} });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  seedStore();
  __resetPersistenceStatus();
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

  it('折叠态显示当前取值摘要，展开后让位给分区 hint', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';

    // 未展开的分区直接给出当前值，免去逐个打开
    expect(text).toContain('15 秒 · 20 题');
    expect(text).toContain('标准德州 · 冻结卡 ×2');
    expect(text).toContain('当前共 0 条训练记录');
    // 首组展开时显示 hint
    expect(text).toContain('主题与界面语言');

    // 折叠「外观」后显示主题 / 语言摘要
    const expanded = container.querySelector<HTMLButtonElement>('button[aria-expanded="true"]');
    expect(expanded).toBeTruthy();
    fireEvent.click(expanded!);
    expect(container.textContent).toContain('暗色 · 中文');
  });

  it('主题分段控件写入 settings.theme 并切换选中态', () => {
    const { container, getByRole } = renderPage();

    const light = getByRole('button', { name: '亮色' });
    expect(light.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(light);

    expect(useProgressStore.getState().settings.theme).toBe('light');
    expect(light.getAttribute('aria-pressed')).toBe('true');
    expect(getByRole('button', { name: '暗色' }).getAttribute('aria-pressed')).toBe('false');
    expect(container.textContent).toContain('设置');
  });

  it('教练风格按钮写入 store 并切换 aria-pressed，头像走 Lucide 图标', () => {
    const { container, getByText } = renderPage();
    openSection(container, '教练风格');

    // 三位教练各一枚 Lucide 图标（无 emoji 文本节点）；只在教练分区内取 aria-pressed，
    // 避免把外观分区的主题 / 语言分段控件算进来
    const coach = container.querySelector('#settings-coach');
    expect(coach).toBeTruthy();
    const profileButtons = Array.from(
      coach!.querySelectorAll<HTMLButtonElement>('button[aria-pressed]'),
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

describe('SettingsPage 数据管理 · 清除训练记录', () => {
  it('展示当前训练记录数，确认文案说明不清 ELO / SRS / 设置 / 学院 / 牌局', () => {
    seedStore({ records: [buildRecord('r1'), buildRecord('r2')] });
    const { container, getByText, baseElement, getAllByText } = renderPage();
    openSection(container, '数据管理');

    expect(container.textContent).toContain('当前共 2 条训练记录');
    // 按钮语义收窄为「训练记录」，不再暗示清除全部数据
    expect(container.textContent).toContain('清除训练记录');

    fireEvent.click(getByText('清除训练记录'));

    const dialogText = baseElement.textContent ?? '';
    expect(dialogText).toContain('只删除训练记录');
    expect(dialogText).toContain('ELO 段位');
    expect(dialogText).toContain('复习队列');
    expect(dialogText).toContain('个人设置');
    expect(dialogText).toContain('学院进度');
    expect(dialogText).toContain('牌局复盘数据都会保留');
    expect(dialogText).toContain('不可撤销');

    const confirmButtons = getAllByText('确认清除');
    fireEvent.click(confirmButtons.at(-1)!);

    expect(useProgressStore.getState().records).toHaveLength(0);
  });

  it('清库失败时按实际上报反馈（内存回滚，不假装成功）', async () => {
    seedStore({ records: [buildRecord('r1'), buildRecord('r2')] });
    dbMock.clear.mockRejectedValue(new DOMException('quota', 'QuotaExceededError'));
    const { container, getByText, getAllByText, baseElement } = renderPage();
    openSection(container, '数据管理');

    fireEvent.click(getByText('清除训练记录'));
    fireEvent.click(getAllByText('确认清除').at(-1)!);

    await waitFor(() => {
      expect(baseElement.textContent).toContain('清除失败：训练记录仍在本地');
    });
    // 持久化切片回滚：记录仍在内存（库内仍在），不丢数据
    expect(useProgressStore.getState().records).toHaveLength(2);
  });
});

describe('SettingsPage 数据管理 · 导入', () => {
  it('按 submitRecord 实际结果区分新增 / 重复 / 无效 / 未保存', async () => {
    seedStore({ records: [buildRecord('dup-1')] });
    dbMock.addIfAbsent.mockImplementation(async (record: unknown) => {
      const id = (record as { id: string }).id;
      if (id === 'fail-1') throw new DOMException('quota', 'QuotaExceededError');
      return 'inserted';
    });

    const { container } = renderPage();
    openSection(container, '数据管理');

    importJson(container, {
      records: [
        buildRecord('new-1'),
        buildRecord('dup-1'),
        // 无效：totalQuestions 越界（空会话不允许入库）
        buildRecord('bad-1', {
          result: {
            sessionId: 'bad-1',
            module: 'range-trainer',
            totalQuestions: 0,
            correctAnswers: 0,
            accuracy: 0,
            averageTime: 0,
            timestamp: Date.now(),
            details: [],
          },
        }),
        buildRecord('fail-1'),
      ],
      settings: { soundEnabled: false, theme: 'light', defaultQuizTime: 9999, hacker: true },
    });

    await waitFor(() => {
      expect(container.textContent).toContain('导入完成：新增 1 条，重复 1 条，无效 1 条，未保存 1 条');
    });

    const records = useProgressStore.getState().records;
    expect(records.map((r) => r.id).toSorted()).toEqual(['dup-1', 'fail-1', 'new-1']);
    // 白名单：非法 defaultQuizTime 与未知字段被丢弃，合法字段生效
    const settings = useProgressStore.getState().settings;
    expect(settings.soundEnabled).toBe(false);
    expect(settings.theme).toBe('light');
    expect(settings.defaultQuizTime).toBe(15);
    expect(settings).not.toHaveProperty('hacker');
  });

  it('无可导入内容时提示格式不正确且不写入', async () => {
    const { container } = renderPage();
    openSection(container, '数据管理');

    importJson(container, { foo: 1 });

    await waitFor(() => {
      expect(container.textContent).toContain('文件格式不正确');
    });
    expect(useProgressStore.getState().records).toHaveLength(0);
  });

  it('牌局复盘恢复失败不影响记录导入统计（独立报告）', async () => {
    handsMock.saveAllHands.mockRejectedValue(new Error('IDB_WRITE_FAILED'));
    const { container } = renderPage();
    openSection(container, '数据管理');

    importJson(container, {
      records: [buildRecord('h-rec-1')],
      hands: [{ id: 'hand-1', pot: 100 }],
    });

    await waitFor(() => {
      expect(container.textContent).toContain('导入完成：新增 1 条，重复 0 条，无效 0 条，未保存 0 条');
    });
    expect(container.textContent).toContain('但牌局复盘数据恢复失败');
    // 记录侧不受 hands 失败影响
    expect(useProgressStore.getState().records.map((r) => r.id)).toEqual(['h-rec-1']);
    expect(handsMock.saveAllHands).toHaveBeenCalledTimes(1);
  });

  it('牌局恢复成功时单独提示恢复条数', async () => {
    const { container } = renderPage();
    openSection(container, '数据管理');

    importJson(container, {
      records: [buildRecord('h-rec-2')],
      hands: [{ id: 'hand-1' }, { id: 'hand-2' }],
    });

    await waitFor(() => {
      expect(container.textContent).toContain('已恢复 2 条牌局复盘数据');
    });
  });
});

describe('SettingsPage 数据管理 · 偏好备份（v3）', () => {
  it('导入 preferences 恢复教练风格 / 游戏变体 / 每日题量上限，白名单外字段丢弃', async () => {
    const { container } = renderPage();
    openSection(container, '数据管理');

    importJson(container, {
      preferences: {
        mentorStyle: 'encouraging',
        currentGameVariant: 'short-deck',
        dailyQuestionLimit: 100,
        unknownField: true,
      },
    });

    await waitFor(() => {
      expect(container.textContent).toContain('已恢复个人偏好');
    });

    const state = useProgressStore.getState();
    expect(state.mentorStyle).toBe('encouraging');
    expect(state.currentGameVariant).toBe('short-deck');
    expect(state.emotion.dailyQuestionLimit).toBe(100);
  });

  it('非法偏好值被忽略，不写入 store 也不提示已恢复', async () => {
    const { container } = renderPage();
    openSection(container, '数据管理');

    importJson(container, {
      preferences: {
        mentorStyle: 'not-a-mentor',
        currentGameVariant: 'omaha',
        dailyQuestionLimit: 9999,
      },
    });

    await waitFor(() => {
      expect(container.textContent).toContain('导入完成');
    });

    const state = useProgressStore.getState();
    expect(state.mentorStyle).toBe('strict-math');
    expect(state.currentGameVariant).toBe('standard');
    expect(state.emotion.dailyQuestionLimit).toBe(0);
    expect(container.textContent).not.toContain('已恢复个人偏好');
  });
});

describe('SettingsPage 数据管理 · 导出', () => {
  it('hands 读取失败仍导出 records+settings，并明确标注为部分导出', async () => {
    seedStore({ records: [buildRecord('exp-1')] });
    handsMock.loadAllHands.mockRejectedValue(new Error('IDB_BLOCKED'));

    const { container } = renderPage();
    openSection(container, '数据管理');

    fireEvent.click(dataActionButton(container, 0));

    await waitFor(() => {
      expect(container.textContent).toContain('已导出部分备份');
    });

    expect(downloadCalls.blobs).toHaveLength(1);
    const payload = JSON.parse(await readBlobText(downloadCalls.blobs[0]!)) as Record<string, unknown>;
    expect(payload.partial).toBe(true);
    // 不得用 hands: [] 冒充完整备份
    expect(payload).not.toHaveProperty('hands');
    expect((payload.records as TrainingRecord[]).map((r) => r.id)).toEqual(['exp-1']);
    expect(payload.settings).toMatchObject({ soundEnabled: true });
    expect(payload.dataVersion).toBe(3);
    expect(payload.preferences).toMatchObject({
      mentorStyle: 'strict-math',
      currentGameVariant: 'standard',
      dailyQuestionLimit: 0,
    });
  });

  it('hands 读取成功时导出完整备份（含 hands 分区）', async () => {
    handsMock.loadAllHands.mockResolvedValue([{ id: 'hand-1' }]);
    const { container } = renderPage();
    openSection(container, '数据管理');

    fireEvent.click(dataActionButton(container, 0));

    await waitFor(() => {
      expect(container.textContent).toContain('已导出 0 条训练记录与个人设置');
    });

    const payload = JSON.parse(await readBlobText(downloadCalls.blobs[0]!)) as Record<string, unknown>;
    expect(payload.partial).toBe(false);
    expect(payload.hands).toEqual([{ id: 'hand-1' }]);
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
