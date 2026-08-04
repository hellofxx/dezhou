import { describe, it, expect } from 'vitest';
import {
  deriveLessonUnits,
  COMPREHENSIVE_UNIT_IDENTIFIER,
  isComprehensiveUnit,
  resolveUnitTitle,
} from './lessonUnits';
import type { Lesson, LessonSection, HandExample, PracticeDrill } from '../types';

function makeSection(type: LessonSection['type'], content: string): LessonSection {
  return { type, content };
}

function makeExample(id: string): HandExample {
  return {
    id,
    title: `示例 ${id}`,
    heroHand: ['Ah', 'Kd'],
    heroPosition: 'BTN',
    previousActions: [],
    street: 'preflop',
    effectiveStack: 100,
    potSize: 5.5,
    correctDecision: { action: 'raise', reasoning: [] },
    commonMistake: { action: 'fold', reasoning: '', evLoss: '0' },
  };
}

function makePractice(): PracticeDrill {
  return { id: 'p1', questions: [] };
}

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'test-lesson',
    level: 1,
    order: 1,
    title: '测试课程',
    subtitle: '测试副标题',
    duration: '10 min',
    content: [],
    quiz: [],
    ...overrides,
  };
}

describe('deriveLessonUnits', () => {
  it('heading 分节：3 个 heading → 3 units，title 正确，heading 不在 sections 中', () => {
    const lesson = makeLesson({
      content: [
        makeSection('heading', '第一节'),
        makeSection('text', '这是第一段文字'),
        makeSection('heading', '第二节'),
        makeSection('text', '这是第二段文字'),
        makeSection('highlight', '重点提示'),
        makeSection('heading', '第三节'),
        makeSection('text', '这是第三段文字'),
      ],
    });

    const units = deriveLessonUnits(lesson);

    expect(units).toHaveLength(3);
    expect(units[0]!.id).toBe('u1');
    expect(units[0]!.title).toBe('第一节');
    expect(units[0]!.sections).toHaveLength(1);
    expect(units[0]!.sections[0]!.type).toBe('text');
    expect(units[0]!.sections[0]!.content).toBe('这是第一段文字');

    expect(units[1]!.id).toBe('u2');
    expect(units[1]!.title).toBe('第二节');
    expect(units[1]!.sections).toHaveLength(2);
    expect(units[1]!.sections[0]!.type).toBe('text');
    expect(units[1]!.sections[1]!.type).toBe('highlight');

    expect(units[2]!.id).toBe('u3');
    expect(units[2]!.title).toBe('第三节');
    expect(units[2]!.sections).toHaveLength(1);
  });

  it('example 分配：2 examples + 3 units → 前 2 unit 各 1 exampleId，第 3 无', () => {
    const lesson = makeLesson({
      content: [
        makeSection('heading', '第一部分'),
        makeSection('text', '文字'),
        makeSection('heading', '第二部分'),
        makeSection('text', '文字'),
        makeSection('heading', '第三部分'),
        makeSection('text', '文字'),
      ],
      examples: [makeExample('ex1'), makeExample('ex2')],
    });

    const units = deriveLessonUnits(lesson);

    expect(units).toHaveLength(3);
    expect(units[0]!.exampleId).toBe('ex1');
    expect(units[1]!.exampleId).toBe('ex2');
    expect(units[2]!.exampleId).toBeUndefined();
  });

  it('examples 多于 units：3 examples + 2 units → 第 3 个进"综合示例"尾节（标题为标识符，非硬编码文案）', () => {
    const lesson = makeLesson({
      content: [
        makeSection('heading', '第一部分'),
        makeSection('text', '文字'),
        makeSection('heading', '第二部分'),
        makeSection('text', '文字'),
      ],
      examples: [makeExample('ex1'), makeExample('ex2'), makeExample('ex3')],
    });

    const units = deriveLessonUnits(lesson);

    expect(units).toHaveLength(3);
    expect(units[0]!.exampleId).toBe('ex1');
    expect(units[1]!.exampleId).toBe('ex2');
    expect(units[2]!.id).toBe('u3');
    expect(units[2]!.title).toBe(COMPREHENSIVE_UNIT_IDENTIFIER);
    expect(units[2]!.sections).toHaveLength(0);
    expect(units[2]!.exampleId).toBe('ex3');
  });

  it('无 heading 兜底：单 unit', () => {
    const lesson = makeLesson({
      content: [
        makeSection('text', '纯文字段落'),
        makeSection('highlight', '重点'),
      ],
    });

    const units = deriveLessonUnits(lesson);

    expect(units).toHaveLength(1);
    expect(units[0]!.id).toBe('u1');
    expect(units[0]!.title).toBe('测试课程');
    expect(units[0]!.sections).toHaveLength(2);
  });

  it('显式 units 优先：lesson.units 声明时直接返回', () => {
    const explicitUnits = [
      { id: 'u1', title: '自定义单元', sections: [makeSection('text', '自定义内容')] },
    ];
    const lesson = makeLesson({
      content: [makeSection('heading', '标题'), makeSection('text', '内容')],
      units: explicitUnits,
    });

    const units = deriveLessonUnits(lesson);

    expect(units).toBe(explicitUnits);
    expect(units).toHaveLength(1);
    expect(units[0]!.title).toBe('自定义单元');
  });

  it('checkpoint 规则：含 example + 有 practice → true', () => {
    const lesson = makeLesson({
      content: [makeSection('heading', '单元'), makeSection('text', '内容')],
      examples: [makeExample('ex1')],
      practice: makePractice(),
    });

    const units = deriveLessonUnits(lesson);

    expect(units[0]!.checkpoint).toBe(true);
  });

  it('checkpoint 规则：含 example + 无 practice → false', () => {
    const lesson = makeLesson({
      content: [makeSection('heading', '单元'), makeSection('text', '内容')],
      examples: [makeExample('ex1')],
    });

    const units = deriveLessonUnits(lesson);

    expect(units[0]!.checkpoint).toBe(false);
  });

  it('checkpoint 规则：无 example → false', () => {
    const lesson = makeLesson({
      content: [makeSection('heading', '单元'), makeSection('text', '内容')],
      practice: makePractice(),
    });

    const units = deriveLessonUnits(lesson);

    expect(units[0]!.checkpoint).toBe(false);
  });

  it('resolveUnitTitle：综合示例标识符翻译为 i18n 文案，普通标题原样返回', () => {
    const lesson = makeLesson({
      content: [makeSection('heading', '正常小节'), makeSection('text', '内容')],
      examples: [makeExample('ex1'), makeExample('ex2'), makeExample('ex3')],
    });

    const units2 = deriveLessonUnits(lesson);
    const normal = units2.find((u) => u.title === '正常小节')!;
    const comprehensive = units2.find((u) => u.id === 'u2')!;

    const translate = (key: string) =>
      key === 'academy.lessonUnit.comprehensiveExamples' ? '综合示例' : key;

    expect(isComprehensiveUnit(normal)).toBe(false);
    expect(resolveUnitTitle(normal, translate)).toBe('正常小节');
    expect(isComprehensiveUnit(comprehensive)).toBe(true);
    expect(resolveUnitTitle(comprehensive, translate)).toBe('综合示例');
  });

  it('确定性：同输入两次调用 deepEqual', () => {
    const lesson = makeLesson({
      content: [
        makeSection('heading', '一'),
        makeSection('text', '内容1'),
        makeSection('heading', '二'),
        makeSection('text', '内容2'),
      ],
      examples: [makeExample('ex1')],
    });

    const a = deriveLessonUnits(lesson);
    const b = deriveLessonUnits(lesson);

    expect(a).toEqual(b);
  });
});