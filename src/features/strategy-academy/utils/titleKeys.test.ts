import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import {
  basicsStepTitleKey,
  conceptDescriptionKey,
  conceptNameKey,
  lessonSubtitleKey,
  lessonTitleKey,
  levelDescriptionKey,
  levelTitleKey,
  levelUnlockKey,
  resolveBasicsStepTitle,
  resolveConceptDescription,
  resolveConceptName,
  resolveLessonSubtitle,
  resolveLessonTitle,
  resolveLevelDescription,
  resolveLevelTitle,
  resolveLevelUnlock,
  resolveTrackAudience,
  resolveTrackDescription,
  resolveTrackDuration,
  resolveTrackName,
  trackAudienceKey,
  trackDescriptionKey,
  trackDurationKey,
  trackNameKey,
} from './titleKeys';
import type {
  BasicsStep,
  ConceptNode,
  LearningTrack,
  LevelSummary,
  LessonSummary,
} from '../types';

/**
 * 渲染层标题 key 解析（单源）契约：
 * - key 命名固定为 `<module>.<context>.<id>`，供 i18n 双语文件消费
 * - t() 命中 key 时返回译文；缺 key 时回退数据层中文 defaultValue
 * - Level 类 key 优先使用 LevelSummary.id（区分 l4a/l4b），缺省回退 level 数字
 */

type Lookup = Record<string, string>;

function makeT(lookup: Lookup = {}): TFunction {
  return ((key: string, options?: { defaultValue?: string }) =>
    lookup[key] ?? options?.defaultValue ?? key) as unknown as TFunction;
}

function makeLesson(overrides: Partial<LessonSummary> = {}): LessonSummary {
  return {
    id: 'l1-basics',
    level: 1,
    order: 1,
    title: '德州扑克规则与牌型',
    subtitle: '从零基础开始',
    duration: '8 min',
    ...overrides,
  };
}

function makeLevel(overrides: Partial<LevelSummary> = {}): LevelSummary {
  return {
    id: 'l4a',
    level: 4,
    title: '进阶思维',
    description: '范围与 EV',
    icon: '🎯',
    lessons: [],
    unlockRequirement: '完成 L3',
    ...overrides,
  };
}

function makeTrack(overrides: Partial<LearningTrack> = {}): LearningTrack {
  return {
    id: 'track-beginner',
    name: '零基础快速入门',
    description: '最短时间掌握核心规则',
    icon: '🌱',
    targetAudience: '零基础新玩家',
    estimatedDuration: '2-3 小时',
    lessonIds: ['l1-basics'],
    color: '#7fb883',
    ...overrides,
  };
}

function makeConcept(overrides: Partial<ConceptNode> = {}): ConceptNode {
  return {
    id: 'pot-odds',
    name: '底池赔率',
    description: '跟注所需胜率',
    relatedLessons: ['l1-basics'],
    relatedModules: ['pot-odds'],
    prerequisites: [],
    category: 'mathematical',
    ...overrides,
  };
}

function makeBasicsStep(overrides: Partial<BasicsStep> = {}): BasicsStep {
  return {
    id: 'basics-goal',
    title: '游戏目标',
    icon: 'target',
    content: [],
    ...overrides,
  };
}

describe('titleKeys：key 命名', () => {
  it('课程/等级/轨道/概念/基础入门 key 前缀固定', () => {
    expect(lessonTitleKey('l1-basics')).toBe('academy.lessonTitle.l1-basics');
    expect(lessonSubtitleKey('l1-basics')).toBe('academy.lessonSubtitle.l1-basics');
    expect(levelTitleKey('l4a')).toBe('academy.levelTitle.l4a');
    expect(levelDescriptionKey('l4b')).toBe('academy.levelDescription.l4b');
    expect(levelUnlockKey('l7')).toBe('academy.levelUnlock.l7');
    expect(trackNameKey('track-gto')).toBe('academy.trackName.track-gto');
    expect(trackDescriptionKey('track-gto')).toBe('academy.trackDescription.track-gto');
    expect(trackAudienceKey('track-gto')).toBe('academy.trackAudience.track-gto');
    expect(trackDurationKey('track-gto')).toBe('academy.trackDuration.track-gto');
    expect(conceptNameKey('pot-odds')).toBe('academy.conceptName.pot-odds');
    expect(conceptDescriptionKey('pot-odds')).toBe('academy.conceptDescription.pot-odds');
    expect(basicsStepTitleKey('basics-goal')).toBe('academy.basicsStepTitle.basics-goal');
  });
});

describe('titleKeys：课程文案解析', () => {
  it('命中 i18n key 时返回译文（英文环境覆盖中文原文）', () => {
    const lesson = makeLesson();
    const t = makeT({
      'academy.lessonTitle.l1-basics': 'Texas Hold’em Rules & Hand Rankings',
      'academy.lessonSubtitle.l1-basics': 'Start from zero',
    });

    expect(resolveLessonTitle(t, lesson)).toBe('Texas Hold’em Rules & Hand Rankings');
    expect(resolveLessonSubtitle(t, lesson)).toBe('Start from zero');
  });

  it('缺 key 时回退数据层中文 defaultValue', () => {
    const lesson = makeLesson();
    const t = makeT();

    expect(resolveLessonTitle(t, lesson)).toBe('德州扑克规则与牌型');
    expect(resolveLessonSubtitle(t, lesson)).toBe('从零基础开始');
  });
});

describe('titleKeys：Level 文案解析', () => {
  it('优先使用 LevelSummary.id 作为 key（区分 l4a / l4b）', () => {
    const t = makeT({ 'academy.levelTitle.l4b': 'Level 4B Title' });
    expect(resolveLevelTitle(t, makeLevel({ id: 'l4b' }))).toBe('Level 4B Title');
  });

  it('id 缺省时回退 level 数字作为 key', () => {
    const t = makeT({ 'academy.levelDescription.4': 'Level 4 desc (numeric key)' });
    expect(resolveLevelDescription(t, makeLevel({ id: undefined }))).toBe(
      'Level 4 desc (numeric key)',
    );
  });

  it('解锁条件与描述缺 key 时回退数据层原文', () => {
    const t = makeT();
    const level = makeLevel();
    expect(resolveLevelTitle(t, level)).toBe('进阶思维');
    expect(resolveLevelDescription(t, level)).toBe('范围与 EV');
    expect(resolveLevelUnlock(t, level)).toBe('完成 L3');
  });
});

describe('titleKeys：学习轨道 / 概念 / 基础入门', () => {
  it('轨道四项元数据均可被 i18n 覆盖', () => {
    const track = makeTrack();
    const t = makeT({
      'academy.trackName.track-beginner': 'Beginner Fast Track',
      'academy.trackDescription.track-beginner': 'Core rules in minimal time',
      'academy.trackAudience.track-beginner': 'Complete beginners',
      'academy.trackDuration.track-beginner': '2-3 hours',
    });

    expect(resolveTrackName(t, track)).toBe('Beginner Fast Track');
    expect(resolveTrackDescription(t, track)).toBe('Core rules in minimal time');
    expect(resolveTrackAudience(t, track)).toBe('Complete beginners');
    expect(resolveTrackDuration(t, track)).toBe('2-3 hours');
  });

  it('轨道缺 key 时回退数据层中文', () => {
    const t = makeT();
    const track = makeTrack();
    expect(resolveTrackName(t, track)).toBe('零基础快速入门');
    expect(resolveTrackDescription(t, track)).toBe('最短时间掌握核心规则');
    expect(resolveTrackAudience(t, track)).toBe('零基础新玩家');
    expect(resolveTrackDuration(t, track)).toBe('2-3 小时');
  });

  it('概念名称/描述与基础入门步骤标题回退数据层原文', () => {
    const t = makeT();
    expect(resolveConceptName(t, makeConcept())).toBe('底池赔率');
    expect(resolveConceptDescription(t, makeConcept())).toBe('跟注所需胜率');
    expect(resolveBasicsStepTitle(t, makeBasicsStep())).toBe('游戏目标');
  });

  it('概念/步骤命中 key 时使用译文', () => {
    const t = makeT({
      'academy.conceptName.pot-odds': 'Pot Odds',
      'academy.basicsStepTitle.basics-goal': 'Goal of the Game',
    });
    expect(resolveConceptName(t, makeConcept())).toBe('Pot Odds');
    expect(resolveBasicsStepTitle(t, makeBasicsStep())).toBe('Goal of the Game');
  });
});
