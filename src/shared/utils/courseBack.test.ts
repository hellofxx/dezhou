import { describe, expect, it } from 'vitest';
import {
  COURSE_FROM_KEY,
  academyMapFrom,
  hubFrom,
  resolveCourseBack,
  theoryMapFrom,
} from './courseBack';

describe('resolveCourseBack：来源感知返回', () => {
  it('无 state / 非法 state 兜底课程主线', () => {
    const hub = { to: '/lesson', labelKey: 'nav.backToCourseHub' };
    expect(resolveCourseBack(undefined)).toEqual(hub);
    expect(resolveCourseBack(null)).toEqual(hub);
    expect(resolveCourseBack({})).toEqual(hub);
    expect(resolveCourseBack({ courseFrom: { source: 'bogus' } })).toEqual(hub);
    expect(resolveCourseBack({ courseFrom: { source: 'hub', stageIndex: 0 } })).toEqual(hub);
    expect(resolveCourseBack({ courseFrom: { source: 'hub', stageIndex: 1.5 } })).toEqual(hub);
    expect(resolveCourseBack({ courseFrom: { source: 'hub', stageIndex: '3' } })).toEqual(hub);
  });

  it('hub 来源带阶段锚点，缺省序号回主线根', () => {
    expect(resolveCourseBack(hubFrom(3))).toEqual({
      to: '/lesson#hub-stage-3',
      labelKey: 'nav.backToCourseHub',
    });
    expect(resolveCourseBack(hubFrom())).toEqual({
      to: '/lesson',
      labelKey: 'nav.backToCourseHub',
    });
  });

  it('理论地图来源回理论地图', () => {
    expect(resolveCourseBack(theoryMapFrom())).toEqual({
      to: '/theory',
      labelKey: 'nav.backToTheoryMap',
    });
  });

  it('实战地图来源回实战地图', () => {
    expect(resolveCourseBack(academyMapFrom())).toEqual({
      to: '/academy',
      labelKey: 'nav.backToAcademyMap',
    });
  });

  it('前进侧 state 构造器契约', () => {
    expect(COURSE_FROM_KEY).toBe('courseFrom');
    expect(hubFrom(2)).toEqual({ courseFrom: { source: 'hub', stageIndex: 2 } });
    expect(theoryMapFrom()).toEqual({ courseFrom: { source: 'theory-map' } });
    expect(academyMapFrom()).toEqual({ courseFrom: { source: 'academy-map' } });
  });
});