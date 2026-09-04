import { describe, it, expect } from 'vitest';
import { lessonObjectivesKey, resolveLessonObjectives } from './contentKeys';
import { ALL_VARIANT_LESSONS } from '../data/lessons/variants';
import type { Lesson } from '../types';

/**
 * 学习目标（Lesson.objectives）key 单源与内容卫生守卫。
 *
 * 背景：objectives 为新增的**可选**索引型数组字段，渲染经
 * `t(lessonObjectivesKey(lessonId, i), { defaultValue: <数据层中文> })` 覆盖
 * （口径与 theory-academy 的 theory.chapterObjectives 一致）。
 * 本文件覆盖两类失效：
 * 1. key 形态漂移 —— 命名空间未在 contentKeyEntries.CONTENT_KEY_PREFIXES 登记时，
 *    contentI18n / contentAlignment 两个守卫会立即失覆盖（此处补形态断言）
 * 2. 目标文案不合规 —— PRD §6.7.1「学习目标对齐」要求可观察行为动词，
 *    禁止「掌握/理解/了解/建立」这类不可测动词（本轮实测大量既有 objectives 以此起头）
 */

/** 不可测动词起头（一律拒绝） */
const UNTESTABLE_HEAD = /^(掌握|理解|了解|熟悉|建立|体会|领会|知道|认识|领悟)/;
/** 可观察行为动词（至少命中一个） */
const OBSERVABLE_VERB =
  /(说明|计算|比较|识别|构建|判断|列举|列出|复述|区分|排列|说出|给出|推导|运用|应用)/;

const lessonsWithObjectives = ALL_VARIANT_LESSONS.filter(
  (l): l is Lesson & { objectives: string[] } =>
    l.objectives !== undefined && l.objectives.length > 0,
);

describe('lessonObjectivesKey（学习目标 key 单源）', () => {
  it('key 形态为 academy.lessonObjectives.<lessonId>.<index>', () => {
    expect(lessonObjectivesKey('l4-mdf', 0)).toBe('academy.lessonObjectives.l4-mdf.0');
    expect(lessonObjectivesKey('l1-basics', 3)).toBe('academy.lessonObjectives.l1-basics.3');
  });

  it('resolveLessonObjectives 逐条按索引取 key，并以数据层原文作 defaultValue 兜底', () => {
    const calls: { key: string; defaultValue?: string }[] = [];
    const fakeT = ((key: string, opts?: { defaultValue: string }) => {
      calls.push({ key, defaultValue: opts?.defaultValue });
      return `R:${key}`;
    }) as unknown as Parameters<typeof resolveLessonObjectives>[0];

    const objectives = ['计算 MDF', '区分 Alpha'];
    const resolved = resolveLessonObjectives(fakeT, 'l4-mdf', objectives);

    expect(resolved).toEqual([
      'R:academy.lessonObjectives.l4-mdf.0',
      'R:academy.lessonObjectives.l4-mdf.1',
    ]);
    expect(calls.map((c) => c.key)).toEqual([
      'academy.lessonObjectives.l4-mdf.0',
      'academy.lessonObjectives.l4-mdf.1',
    ]);
    expect(calls.map((c) => c.defaultValue)).toEqual(objectives);
  });

  it('空数组不产出任何 key（组件侧据此整块不渲染）', () => {
    const fakeT = (() => '') as unknown as Parameters<typeof resolveLessonObjectives>[0];
    expect(resolveLessonObjectives(fakeT, 'l1-basics', [])).toEqual([]);
  });
});

describe('Lesson.objectives 内容卫生（PRD §6.7.1 学习目标对齐）', () => {
  it('已落地的样例课时均声明 objectives', () => {
    const ids = new Set(lessonsWithObjectives.map((l) => l.id));
    expect(['l1-basics', 'l2-3bet-basics', 'l4-mdf'].every((id) => ids.has(id))).toBe(true);
  });

  it('每条 objective 非空、2-4 条、不用不可测动词起头且命中可观察行为动词', () => {
    const bad: string[] = [];
    for (const lesson of lessonsWithObjectives) {
      const list = lesson.objectives;
      if (list.length < 2 || list.length > 4) bad.push(`${lesson.id}: 条数=${list.length}`);
      list.forEach((obj, i) => {
        const where = `${lesson.id}[${i}]`;
        if (!obj.trim()) bad.push(`${where}: 空`);
        if (UNTESTABLE_HEAD.test(obj.trim())) bad.push(`${where}: 不可测动词起头 ${obj}`);
        if (!OBSERVABLE_VERB.test(obj)) bad.push(`${where}: 无可观察行为动词 ${obj}`);
      });
    }
    expect(bad).toEqual([]);
  });
});
