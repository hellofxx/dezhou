import { describe, expect, it } from 'vitest';
import { ALL_VARIANT_LESSONS } from '@/features/strategy-academy/data/lessons/variants';
import { LOCAL_LESSONS } from '@/features/strategy-academy/data/localLessons';

function flattenLessons(lessons: readonly { content: unknown[]; units?: { sections: unknown[] }[]; id: string }[]): {
  id: string;
  mismatches: number;
}[] {
  const out: { id: string; mismatches: number }[] = [];
  for (const lesson of lessons) {
    const content = lesson.content;
    let mismatches = 0;
    for (const unit of lesson.units ?? []) {
      for (const s of unit.sections) {
        if (content.indexOf(s) === -1) mismatches += 1;
      }
    }
    if (mismatches > 0) out.push({ id: lesson.id, mismatches });
  }
  return out;
}

describe('units.sections 与 lesson.content 引用一致性', () => {
  it('ALL_VARIANT_LESSONS 无引用不一致', () => {
    const problems = flattenLessons(ALL_VARIANT_LESSONS);
    // eslint-disable-next-line no-console
    console.log('variant 引用不一致课程:', JSON.stringify(problems));
    expect(problems.length).toBe(0);
  });
  it('LOCAL_LESSONS 无引用不一致', () => {
    const problems = flattenLessons(LOCAL_LESSONS);
    // eslint-disable-next-line no-console
    console.log('local 引用不一致课程:', JSON.stringify(problems));
    expect(problems.length).toBe(0);
  });
});
