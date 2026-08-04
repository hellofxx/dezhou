import type { Lesson, LessonUnit, LessonSection } from '../types';

/**
 * 综合示例尾节标题标识符（DEBT-1：渲染层用 i18n 键 academy.lessonUnit.comprehensiveExamples 翻译）。
 * 派生函数只产出标识符，不产出硬编码中文文案。
 */
export const COMPREHENSIVE_UNIT_IDENTIFIER = '__COMPREHENSIVE__';

/** 判断 unit 是否为派生函数生成的"综合示例"尾节（标题为标识符而非展示文案） */
export function isComprehensiveUnit(unit: LessonUnit): boolean {
  return unit.title === COMPREHENSIVE_UNIT_IDENTIFIER;
}

/**
 * 解析 unit 展示标题：综合示例标识符 → i18n 文案；其余标题原样返回。
 * @param translate i18n t 函数的窄化签名（仅按 key 取文案）
 */
export function resolveUnitTitle(unit: LessonUnit, translate: (key: string) => string): string {
  return isComprehensiveUnit(unit)
    ? translate('academy.lessonUnit.comprehensiveExamples')
    : unit.title;
}

/**
 * 从课程数据派生 LessonUnit 列表（微观闭环视图层派生）。
 *
 * 规则（严格按序）：
 * 1. lesson.units 已声明且非空 → 直接返回
 * 2. 否则按 lesson.content 中的 'heading' 类型分节：每个 heading 开启新 unit
 * 3. 无任何 heading → 兜底单 unit
 * 4. examples 按序分配到各 unit；多余 example 聚为"综合示例"尾节（标题用标识符，渲染层翻译）
 * 5. checkpoint 默认值：含 exampleId 且 lesson.practice 存在 → true
 * 6. 返回的 unit.id 从 'u1' 开始递增
 */
export function deriveLessonUnits(lesson: Lesson): LessonUnit[] {
  // 规则 1：显式 units 优先
  if (lesson.units && lesson.units.length > 0) {
    return lesson.units;
  }

  const { content, examples, practice, title } = lesson;

  // 规则 2、3：按 heading 分节
  const units: { title: string; sections: LessonSection[] }[] = [];
  let currentUnit: { title: string; sections: LessonSection[] } | null = null;

  for (const section of content) {
    if (section.type === 'heading') {
      currentUnit = { title: section.content, sections: [] };
      units.push(currentUnit);
    } else if (currentUnit) {
      currentUnit.sections.push(section);
    } else {
      // heading 之前的 section 归入第一个 unit（若存在）
      // 无 heading 时走兜底
    }
  }

  // 规则 3：无 heading 兜底单 unit
  if (units.length === 0) {
    units.push({ title, sections: [...content] });
  }

  // 规则 4：examples 分配
  const exampleIds = examples?.map((ex) => ex.id) ?? [];
  const result: LessonUnit[] = units.map((u, i) => {
    const exampleId = i < exampleIds.length ? exampleIds[i] : undefined;
    return {
      id: `u${i + 1}`,
      title: u.title,
      sections: u.sections,
      exampleId,
      // 规则 5：checkpoint 默认值
      checkpoint: !!(exampleId && practice),
    };
  });

  // 规则 4 续：examples 数 > units 数时，多余 example 聚为"综合示例"尾节
  if (exampleIds.length > units.length) {
    const remainingIds = exampleIds.slice(units.length);
    // 多个示例时取第一个，其余丢弃（P1 每个 unit 只支持一个 exampleId）
    result.push({
      id: `u${result.length + 1}`,
      title: COMPREHENSIVE_UNIT_IDENTIFIER,
      sections: [],
      exampleId: remainingIds[0],
      checkpoint: !!practice,
    });
  }

  return result;
}