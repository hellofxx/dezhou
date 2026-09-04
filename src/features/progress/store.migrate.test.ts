import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub, buildPersistPayload } from '@/shared/utils/localStorageStub';

/**
 * progress store persist migrate 冒烟测试（v0 → v9 全链路）。
 * migrate 内联在 persist 配置中，通过预置旧版本 localStorage 数据
 * 触发 rehydrate 来验证迁移结果（老用户数据零丢失）。
 */
describe('progress store migrate (v0 → v9)', () => {
  it('老版本数据自动注入全部默认字段，顶层 lastTrainingDate 迁入 streak', async () => {
    // 用本地时间构造时间戳，保证断言与运行环境时区无关
    const oldTimestamp = new Date(2024, 0, 15, 12).getTime();
    const storageStub = createLocalStorageStub({
      'poker-training-progress': buildPersistPayload(
        { records: [], lastTrainingDate: oldTimestamp },
        0
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useProgressStore } = await import('./store');
    const state = useProgressStore.getState();

    // v1: onboarding
    expect(state.onboarding).toBeDefined();
    // v2: streak 注入且老 lastTrainingDate 转为 YYYY-MM-DD
    expect(state.streak.lastTrainingDate).toBe('2024-01-15');
    expect(state.streak.streakStartDate).toBe('2024-01-15');
    // 顶层 lastTrainingDate 已删除
    expect('lastTrainingDate' in state).toBe(false);
    // v3: ELO 默认值（经 v10 迁入 eloByVariant.standard；v13/v14 删除顶层 elo）
    expect(state.eloByVariant.standard.overall).toBe(500);
    expect('elo' in state).toBe(false);
    expect(state.eloRankUp).toBeNull();
    // v4: 快速训练打卡
    expect(state.quickDrillStreak).toBe(0);
    expect(state.lastQuickDrillDate).toBeNull();
    // v5: 导师风格
    expect(state.mentorStyle).toBeDefined();
    // v6: 情绪管理
    expect(state.emotion).toBeDefined();
    // v7: 成就系统
    expect(state.unlockedAchievements).toEqual([]);
    expect(state.achievementUnlockDates).toEqual({});
    // v8: 冻结卡碎片
    expect(state.freezeCardFragments).toBe(0);
    expect(state.lastFragmentDate).toBeNull();
    expect(state.fragmentsEarnedToday).toBe(0);
    // v9: 待展示里程碑庆典
    expect(state.pendingMilestone).toBeNull();
    // 已有字段不被触碰
    expect(state.records).toEqual([]);

    // 等待模块底部 setTimeout 副作用执行完毕，避免 teardown 后悬挂 timer
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});

/**
 * PRG-011 补盲：v10~v15 各步迁移专项用例（原测试仅覆盖 v0→v9 全链路冒烟）。
 * 直接调用 persist 配置的 migrate(seed, fromVersion) 逐段驱动，断言迁移结果形状与数据保全。
 */
describe('progress store migrate 分步（v10→v15）', () => {
  const loadMigrate = async (seed: Record<string, unknown>, fromVersion: number) => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
    const { useProgressStore } = await import('./store');
    const migrate = useProgressStore.persist.getOptions().migrate!;
    return migrate(seed as never, fromVersion) as unknown as {
      eloByVariant?: Record<string, { overall: number; gamesPlayed: number; variant: string }>;
      activeVariant?: string;
      reviewItems?: Array<{ label?: string }>;
      quickDrillBest?: unknown;
      focusModule?: unknown;
      elo?: unknown;
    };
  };

  it('v10：top-level elo → eloByVariant.standard 克隆，short-deck/heads-up 继承，activeVariant=standard', async () => {
    const result = await loadMigrate(
      { elo: { overall: 1234, gamesPlayed: 20, variant: 'standard' as never } },
      9,
    );
    expect(result.eloByVariant!.standard!.overall).toBe(1234);
    expect(result.eloByVariant!.standard!.gamesPlayed).toBe(20);
    expect(result.eloByVariant!['short-deck']!.gamesPlayed).toBe(0);
    expect(result.eloByVariant!['heads-up']!.gamesPlayed).toBe(0);
    expect(result.activeVariant).toBe('standard');
    // v12 后 top-level elo 已被退役，快速验证最终态无残留
    expect('elo' in (result as object)).toBe(false);
  });

  it('v11：GTO 标签尾部" 决策"清洗 → label 被 sanitize', async () => {
    const result = await loadMigrate(
      { reviewItems: [{ label: 'BTN Turn 决策' }, { label: 'clean' }] },
      10,
    );
    expect(result.reviewItems![0]!.label).toBe('BTN Turn');
    expect(result.reviewItems![1]!.label).toBe('clean');
  });

  it('v12：quickDrillBest 缺失 → 注入 null（P2-02 迁入）', async () => {
    const result = await loadMigrate({}, 11);
    expect(result.quickDrillBest).toBeNull();
  });

  it('v13：退役顶层 elo，统一 eloByVariant.standard（数据保全分点）', async () => {
    const result = await loadMigrate(
      {
        elo: { overall: 900, gamesPlayed: 5, variant: 'standard' as never },
        eloByVariant: {
          standard: { overall: 900, gamesPlayed: 5, variant: 'standard' as never },
          'short-deck': { overall: 500, gamesPlayed: 0, variant: 'short-deck' as never },
          'heads-up': { overall: 500, gamesPlayed: 0, variant: 'heads-up' as never },
        },
      },
      12,
    );
    expect('elo' in (result as object)).toBe(false);
    expect(result.eloByVariant!.standard!.overall).toBe(900); // 变体数据保全
  });

  it('v14：清理 elo 内存兼容层残留键（防御性删除）', async () => {
    const result = await loadMigrate(
      {
        elo: { overall: 888, gamesPlayed: 1, variant: 'standard' as never },
        eloByVariant: { standard: { overall: 888, gamesPlayed: 1, variant: 'standard' as never }, 'short-deck': {}, 'heads-up': {} } as never,
      },
      13,
    );
    expect('elo' in (result as object)).toBe(false);
  });

  it('v15：focusModule 缺失 → 注入 null（学习焦点模式 §13.6.2）', async () => {
    const result = await loadMigrate({}, 14);
    expect(result.focusModule).toBeNull();
  });
});

/**
 * v15 → v16 接线用例：只验证 persist 迁移链**确实调用**了理论复习项 key 化辅助，
 * 以及回写的防御性边界（不得写入 undefined 键）。
 * 改写规则本身（幂等 / 进度保全 / 脏数据容错 / key 镜像与 theory-academy 单源一致）
 * 由纯函数侧用例覆盖，见 utils/migrateTheoryReviewKeys.test.ts。
 */
describe('progress store migrate 分步（v15→v16 理论复习项 key 化接线）', () => {
  const runMigrate = async (
    seed: Record<string, unknown>,
    fromVersion: number,
  ): Promise<Record<string, unknown>> => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
    const { useProgressStore } = await import('./store');
    const migrate = useProgressStore.persist.getOptions().migrate!;
    const result = migrate(seed as never, fromVersion) as unknown as Record<string, unknown>;
    // 等待模块底部副作用执行完毕，避免 teardown 后悬挂 timer
    await new Promise((resolve) => setTimeout(resolve, 20));
    return result;
  };

  const legacyItem = () => ({
    id: 'theory:t1-combinatorics-q1',
    label: '从 5 张牌中任选 2 张的组合数是多少？',
    category: 'theory',
    easeFactor: 2.3,
    interval: 7,
    repetitions: 3,
    nextReviewDate: '2026-01-01',
    metadata: {
      source: 'theory',
      route: '/theory/chapter/t1-combinatorics',
      front: '从 5 张牌中任选 2 张的组合数是多少？',
      back: 'C(5,2) = 10。',
    },
  });

  it('v16：迁移链调用生效 → 中文原文 label/front/back 改写为 i18n key', async () => {
    const result = await runMigrate({ reviewItems: [legacyItem()] }, 15);
    const item = (result.reviewItems as Array<Record<string, unknown>>)[0]!;
    expect(item.label).toBe('theory.quiz.t1-combinatorics-q1.question');
    expect(item.metadata).toEqual({
      source: 'theory',
      route: '/theory/chapter/t1-combinatorics',
      front: 'theory.quiz.t1-combinatorics-q1.question',
      back: 'theory.quiz.t1-combinatorics-q1.explanation',
    });
    // 复习进度原样穿过 store 的迁移调度
    expect(item.interval).toBe(7);
    expect(item.easeFactor).toBe(2.3);
    expect(item.repetitions).toBe(3);
    expect(item.nextReviewDate).toBe('2026-01-01');
  });

  it('v16：老存档无 reviewItems 键时不得凭空写入（undefined 会在 merge 时覆盖默认 []）', async () => {
    const result = await runMigrate({}, 15);
    expect('reviewItems' in result).toBe(false);
  });

  it('全链路（v0 → v16）脏理论项穿越全部迁移步骤：改写生效且早期注入字段齐备', async () => {
    const result = await runMigrate(
      {
        records: [],
        lastTrainingDate: new Date(2024, 0, 15, 12).getTime(),
        reviewItems: [legacyItem()],
      },
      0,
    );
    const item = (result.reviewItems as Array<Record<string, unknown>>)[0]!;
    expect(item.label).toBe('theory.quiz.t1-combinatorics-q1.question');
    expect(item.nextReviewDate).toBe('2026-01-01');
    // v2 / v15 等其余步骤照常生效
    expect((result.streak as { lastTrainingDate?: string }).lastTrainingDate).toBe('2024-01-15');
    expect(result.focusModule).toBeNull();
  });
});

/**
 * v16 → v17 接线用例：只验证 persist 迁移链**确实调用**了策略复习项 key 化辅助，
 * 以及回写的防御性边界（不得写入 undefined 键）。
 * 改写规则本身（幂等 / 进度保全 / 脏数据容错 / key 镜像与 strategy-academy 单源一致）
 * 由纯函数侧用例覆盖，见 utils/migrateStrategyReviewKeys.test.ts。
 */
describe('progress store migrate 分步（v16→v17 策略复习项 key 化接线）', () => {
  const runMigrate = async (
    seed: Record<string, unknown>,
    fromVersion: number,
  ): Promise<Record<string, unknown>> => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
    const { useProgressStore } = await import('./store');
    const migrate = useProgressStore.persist.getOptions().migrate!;
    const result = migrate(seed as never, fromVersion) as unknown as Record<string, unknown>;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return result;
  };

  const legacyItem = () => ({
    id: 'l3-cbet',
    label: '持续下注（C-Bet）',
    category: 'strategy',
    easeFactor: 2.3,
    interval: 7,
    repetitions: 3,
    nextReviewDate: '2026-01-01',
  });

  it('v17：迁移链调用生效 → 中文课名 label 改写为 academy.lessonTitle key，复习进度不变', async () => {
    const result = await runMigrate({ reviewItems: [legacyItem()] }, 16);
    const item = (result.reviewItems as Array<Record<string, unknown>>)[0]!;
    expect(item.label).toBe('academy.lessonTitle.l3-cbet');
    expect(item.interval).toBe(7);
    expect(item.easeFactor).toBe(2.3);
    expect(item.repetitions).toBe(3);
    expect(item.nextReviewDate).toBe('2026-01-01');
  });

  it('v17：已是 key 形态与非 strategy 项原样穿过；老存档无 reviewItems 键时不凭空写入', async () => {
    const keyed = { id: 'l4-mdf', label: 'academy.lessonTitle.l4-mdf', category: 'strategy' };
    const theory = { id: 'theory:x-q1', label: '题干中文', category: 'theory' };
    const result = await runMigrate({ reviewItems: [keyed, theory] }, 16);
    expect(result.reviewItems).toEqual([keyed, theory]);
    expect('reviewItems' in (await runMigrate({}, 16))).toBe(false);
  });

  it('全链路（v0 → v17）脏策略项穿越全部迁移步骤：改写生效且早期注入字段齐备', async () => {
    const result = await runMigrate(
      {
        records: [],
        lastTrainingDate: new Date(2024, 0, 15, 12).getTime(),
        reviewItems: [legacyItem()],
      },
      0,
    );
    const item = (result.reviewItems as Array<Record<string, unknown>>)[0]!;
    expect(item.label).toBe('academy.lessonTitle.l3-cbet');
    expect(item.nextReviewDate).toBe('2026-01-01');
    expect((result.streak as { lastTrainingDate?: string }).lastTrainingDate).toBe('2024-01-15');
    expect(result.focusModule).toBeNull();
  });
});
