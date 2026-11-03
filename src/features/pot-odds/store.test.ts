import { beforeEach, describe, expect, it } from 'vitest';
import { usePotOddsStore } from './store';
import { DEFAULT_EV_STATE, DEFAULT_ODDS_STATE } from './constants';

/**
 * pot-odds store 状态契约（L1）：
 * 计算器面板的所有输入都经此 store 驱动，且 odds / ev 两个面板状态必须互不干扰
 * （同页切 Tab 不能把另一面板的参数重置或污染）。
 */
function resetStore() {
  usePotOddsStore.setState({
    oddsState: { ...DEFAULT_ODDS_STATE },
    evState: { ...DEFAULT_EV_STATE },
  });
}

describe('usePotOddsStore 初始状态', () => {
  beforeEach(resetStore);

  it('oddsState / evState 等于模块默认值', () => {
    const { oddsState, evState } = usePotOddsStore.getState();
    expect(oddsState).toEqual(DEFAULT_ODDS_STATE);
    expect(evState).toEqual(DEFAULT_EV_STATE);
  });

  it('初始状态与默认常量是不同对象（setter 不得污染常量单源）', () => {
    const { oddsState, evState } = usePotOddsStore.getState();
    expect(oddsState).not.toBe(DEFAULT_ODDS_STATE);
    expect(evState).not.toBe(DEFAULT_EV_STATE);
  });
});

describe('oddsState setter', () => {
  beforeEach(resetStore);

  it('每个 setter 只更新自身字段，其余字段保持不变', () => {
    const store = usePotOddsStore.getState();

    store.setPotSize(250);
    expect(usePotOddsStore.getState().oddsState).toEqual({
      ...DEFAULT_ODDS_STATE,
      potSize: 250,
    });

    store.setBetSize(125);
    store.setOuts(15);
    store.setStreet('turn');
    store.setImpliedOddsGain(80);
    store.setGameVariant('short-deck');

    expect(usePotOddsStore.getState().oddsState).toEqual({
      potSize: 250,
      betSize: 125,
      outs: 15,
      street: 'turn',
      impliedOddsGain: 80,
      gameVariant: 'short-deck',
    });
  });

  it('outs 支持小数（后门同花 1.5 outs）', () => {
    usePotOddsStore.getState().setOuts(1.5);
    expect(usePotOddsStore.getState().oddsState.outs).toBe(1.5);
  });

  it('更新 oddsState 不改动 evState 的引用', () => {
    const evBefore = usePotOddsStore.getState().evState;
    usePotOddsStore.getState().setPotSize(999);
    expect(usePotOddsStore.getState().evState).toBe(evBefore);
  });

  it('setter 产生的 oddsState 是新对象（Zustand 订阅可感知变化）', () => {
    const before = usePotOddsStore.getState().oddsState;
    usePotOddsStore.getState().setPotSize(before.potSize);
    expect(usePotOddsStore.getState().oddsState).not.toBe(before);
  });
});

describe('evState setter', () => {
  beforeEach(resetStore);

  it('每个 setter 只更新自身字段，其余字段保持不变', () => {
    const store = usePotOddsStore.getState();

    store.setWinRate(62);
    store.setEVPotSize(400);
    store.setCallAmount(120);

    expect(usePotOddsStore.getState().evState).toEqual({
      winRate: 62,
      potSize: 400,
      callAmount: 120,
    });
  });

  it('更新 evState 不改动 oddsState 的引用', () => {
    const oddsBefore = usePotOddsStore.getState().oddsState;
    usePotOddsStore.getState().setWinRate(10);
    expect(usePotOddsStore.getState().oddsState).toBe(oddsBefore);
  });
});

describe('resetOdds / resetEV', () => {
  beforeEach(resetStore);

  it('resetOdds 恢复全部默认值，且不改动 evState', () => {
    const store = usePotOddsStore.getState();
    store.setPotSize(1);
    store.setBetSize(2);
    store.setOuts(3);
    store.setStreet('turn');
    store.setImpliedOddsGain(4);
    store.setGameVariant('short-deck');
    store.setWinRate(77);
    const evBefore = usePotOddsStore.getState().evState;

    usePotOddsStore.getState().resetOdds();

    expect(usePotOddsStore.getState().oddsState).toEqual(DEFAULT_ODDS_STATE);
    expect(usePotOddsStore.getState().evState).toBe(evBefore);
  });

  it('resetEV 恢复全部默认值，且不改动 oddsState', () => {
    const store = usePotOddsStore.getState();
    store.setWinRate(1);
    store.setEVPotSize(2);
    store.setCallAmount(3);
    store.setPotSize(888);
    const oddsBefore = usePotOddsStore.getState().oddsState;

    usePotOddsStore.getState().resetEV();

    expect(usePotOddsStore.getState().evState).toEqual(DEFAULT_EV_STATE);
    expect(usePotOddsStore.getState().oddsState).toBe(oddsBefore);
  });

  it('reset 后继续使用 setter 不污染 DEFAULT 常量（重置复用默认值副本）', () => {
    const store = usePotOddsStore.getState();
    store.setPotSize(1);
    usePotOddsStore.getState().resetOdds();
    usePotOddsStore.getState().setPotSize(12345);
    usePotOddsStore.getState().setOuts(0);

    expect(DEFAULT_ODDS_STATE.potSize).toBe(100);
    expect(DEFAULT_ODDS_STATE.outs).toBe(9);

    usePotOddsStore.getState().resetEV();
    usePotOddsStore.getState().setWinRate(0);
    expect(DEFAULT_EV_STATE.winRate).toBe(35);
  });
});
