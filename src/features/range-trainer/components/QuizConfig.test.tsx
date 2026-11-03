/**
 * QuizConfig（测验配置卡）组件测试（L2 · jsdom）
 *
 * 覆盖契约（纯 helper `getQuizPositionOptions` 的用例见同目录 QuizConfig.test.ts，此处不重复）：
 *  - 四个配置项标签 + 当前选中值渲染，点击「开始训练」触发 onStart
 *  - 位置渐进解锁：preflop ELO 未达阈值时开始按钮禁用，达阈值后恢复；调试解锁旁路
 *  - 变体/人数切换后当前位置不在有效选项中 → 自动回退到首个可用位置
 *  - 当前（位置, 动作类型）组合无题库 → 动作类型自动回退到首个可用值
 *  - 位置下拉中锁定位置以 disabled + 阈值提示呈现
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { Position } from '@/shared/types/position';
import { DEFAULT_ELO } from '@/shared/types/elo';
import type { EloRating } from '@/shared/types/elo';
import type { PokerVariant } from '@/shared/types/elo';
import { useProgressStore } from '@/features/progress/store';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { useRangeTrainerStore } from '../store';
import { PRESET_RANGES, ADVANCED_PRESET_RANGES } from '../constants';
import type { RangePreset } from '../types';
import { QuizConfig } from './QuizConfig';

const STANDARD_PRESETS: RangePreset[] = [...PRESET_RANGES, ...ADVANCED_PRESET_RANGES];

const elo = (variant: PokerVariant, preflop: number): EloRating => ({
  ...DEFAULT_ELO,
  variant,
  preflop,
  overall: preflop,
});

/** 构造 store 夹具：range-trainer 变体/人数/预置 + progress preflop ELO + 调试开关 */
function setupStores(options: { preflopElo?: number; playerCount?: number } = {}) {
  const { preflopElo = 500, playerCount = 6 } = options;
  useRangeTrainerStore.setState({
    gameVariant: 'standard',
    playerCount,
    presets: STANDARD_PRESETS,
  });
  useProgressStore.setState({
    activeVariant: 'standard',
    eloByVariant: {
      standard: elo('standard', preflopElo),
      'short-deck': elo('short-deck', preflopElo),
      'heads-up': elo('heads-up', preflopElo),
    },
  });
  useDebugModeStore.setState({ unlockAll: false });
}

interface Props {
  position: Position;
  actionType: string;
  timeLimit: number;
  questionCount: number;
  onPositionChange: (p: Position) => void;
  onActionTypeChange: (a: string) => void;
  onTimeLimitChange: (t: number) => void;
  onQuestionCountChange: (c: number) => void;
  onStart: () => void;
}

function makeProps(over: Partial<Props> = {}): Props {
  return {
    position: Position.UTG,
    actionType: 'open',
    timeLimit: 10,
    questionCount: 20,
    onPositionChange: vi.fn(),
    onActionTypeChange: vi.fn(),
    onTimeLimitChange: vi.fn(),
    onQuestionCountChange: vi.fn(),
    onStart: vi.fn(),
    ...over,
  };
}

const startButton = () => screen.getByRole('button', { name: '开始训练' }) as HTMLButtonElement;

// jsdom 未实现 Pointer Capture API，Radix Select 打开下拉时会调用（测试环境桩）
let restorePointerCapture: () => void = () => {};
beforeAll(() => {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  const hadHas = 'hasPointerCapture' in proto;
  const hadSet = 'setPointerCapture' in proto;
  proto.hasPointerCapture = () => false;
  proto.setPointerCapture = () => undefined;
  proto.releasePointerCapture = () => undefined;
  restorePointerCapture = () => {
    if (!hadHas) delete proto.hasPointerCapture;
    if (!hadSet) delete proto.setPointerCapture;
    delete proto.releasePointerCapture;
  };
});
afterAll(() => restorePointerCapture());

beforeEach(() => setupStores());
afterEach(() => cleanup());

describe('QuizConfig 基础渲染与开始', () => {
  it('渲染四个配置项与当前值，点击开始触发 onStart', () => {
    const props = makeProps();
    render(<QuizConfig {...props} />);

    for (const label of ['位置', '动作类型', '每题限时', '题目数量']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText('UTG')).toBeTruthy();
    expect(screen.getByText('Open Raise')).toBeTruthy();
    expect(screen.getByText('10 秒')).toBeTruthy();
    expect(screen.getByText('20 题')).toBeTruthy();
    expect(startButton().disabled).toBe(false);

    fireEvent.click(startButton());
    expect(props.onStart).toHaveBeenCalledTimes(1);
  });

  it('时间与题量选项值透传：0 秒渲染为「无限时」', () => {
    render(<QuizConfig {...makeProps({ timeLimit: 0, questionCount: 50 })} />);

    expect(screen.getByText('无限时')).toBeTruthy();
    expect(screen.getByText('50 题')).toBeTruthy();
  });
});

describe('QuizConfig 位置渐进解锁', () => {
  it('preflop ELO 未达阈值时锁定位置禁用开始按钮，达阈值后恢复', () => {
    // BTN + 3-bet 有题库（btn-3bet-vs-co），BTN 阈值 1200
    const props = makeProps({ position: Position.BTN, actionType: '3bet' });
    const { rerender } = render(<QuizConfig {...props} />);

    expect(startButton().disabled).toBe(true);

    act(() => setupStores({ preflopElo: 2000 }));
    rerender(<QuizConfig {...props} />);
    expect(startButton().disabled).toBe(false);
  });

  it('调试解锁激活时跳过位置门禁', () => {
    const props = makeProps({ position: Position.BTN, actionType: '3bet' });
    const { rerender } = render(<QuizConfig {...props} />);
    expect(startButton().disabled).toBe(true);

    act(() => useDebugModeStore.setState({ unlockAll: true }));
    rerender(<QuizConfig {...props} />);
    expect(startButton().disabled).toBe(false);
  });

  it('位置下拉中锁定位置以 disabled + 阈值提示呈现', () => {
    render(<QuizConfig {...makeProps({ position: Position.UTG })} />);

    // 第一个 combobox = 位置下拉
    const trigger = screen.getAllByRole('combobox')[0]!;
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });

    const options = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
    expect(options.length).toBe(6);

    const btnOption = options.find((option) => (option.textContent ?? '').includes('BTN'));
    const utgOption = options.find((option) => (option.textContent ?? '').includes('UTG'));
    // BTN（阈值 1200）在 ELO 500 下锁定：disabled + 阈值提示；UTG 始终解锁
    expect(btnOption?.getAttribute('aria-disabled')).toBe('true');
    expect(btnOption?.textContent).toContain('需 preflop ELO ≥ 1200 解锁');
    expect(utgOption?.getAttribute('aria-disabled')).toBeNull();
  });
});

describe('QuizConfig 组合自动回退', () => {
  it('人数切到 2 人桌后 UTG 不在有效位置内 → 回退到首个可用位置 BTN', () => {
    setupStores({ playerCount: 2 });
    const props = makeProps({ position: Position.UTG });

    render(<QuizConfig {...props} />);

    expect(props.onPositionChange).toHaveBeenCalledWith(Position.BTN);
  });

  it('当前（位置, 动作类型）无题库时动作类型回退到首个可用值', () => {
    // UTG 只有 open 预置，无 3-bet
    const props = makeProps({ position: Position.UTG, actionType: '3bet' });

    render(<QuizConfig {...props} />);

    expect(props.onActionTypeChange).toHaveBeenCalledWith('open');
  });

  it('（位置, 动作类型）无题库时展示兜底提示且禁用开始按钮', () => {
    // BB 只有 3-bet / call-vs-raise 预置，无 open
    const props = makeProps({ position: Position.BB, actionType: 'open' });
    render(<QuizConfig {...props} />);

    // 动作类型回退由上层 state 承担（此处 props 未变），渲染层走「无题库」兜底分支
    expect(screen.getByText('该组合暂无题库')).toBeTruthy();
    expect(startButton().disabled).toBe(true);
    expect(props.onActionTypeChange).toHaveBeenCalledWith('3bet');
  });
});
