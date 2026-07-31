import { describe, it, expect } from 'vitest';
import { isTrackPrerequisiteMet } from './learningTracks';
import { LOCAL_TRACK } from './localTrack';
import { LEVELS } from './levels';
import type { LearningTrack } from '../types';

describe('P1E-02: isTrackPrerequisiteMet — 课程完成口径', () => {
  const trackNoPrereq: LearningTrack = {
    id: 'test-no-prereq',
    name: 'Test Track',
    description: '',
    icon: '🧪',
    targetAudience: '',
    estimatedDuration: '',
    lessonIds: [],
    color: '#000',
  };

  it('无 prerequisiteLevelIds 时返回 true', () => {
    expect(isTrackPrerequisiteMet(trackNoPrereq, [])).toBe(true);
  });

  it('prerequisiteLevelIds 为空数组时返回 true', () => {
    expect(isTrackPrerequisiteMet({ ...trackNoPrereq, prerequisiteLevelIds: [] }, [])).toBe(true);
  });

  it('前置 Level 全部完成时返回 true', () => {
    // 取 l1 条目全部课程 ID 作为 completedLessons
    const l1 = LEVELS.find((l) => l.id === 'l1');
    expect(l1).toBeDefined();
    const completedLessons = l1!.lessons.map((l) => l.id);
    const track: LearningTrack = { ...trackNoPrereq, prerequisiteLevelIds: ['l1'] };
    expect(isTrackPrerequisiteMet(track, completedLessons)).toBe(true);
  });

  it('前置 Level 部分未完成时返回 false', () => {
    const l1 = LEVELS.find((l) => l.id === 'l1');
    expect(l1).toBeDefined();
    // 只完成第一课
    const completedLessons = [l1!.lessons[0]!.id];
    const track: LearningTrack = { ...trackNoPrereq, prerequisiteLevelIds: ['l1'] };
    expect(isTrackPrerequisiteMet(track, completedLessons)).toBe(false);
  });

  it('LOCAL_TRACK 前置为 l1/l2/l3（需全部完成）', () => {
    expect(LOCAL_TRACK.prerequisiteLevelIds).toEqual(['l1', 'l2', 'l3']);
    // 空完成列表 → false
    expect(isTrackPrerequisiteMet(LOCAL_TRACK, [])).toBe(false);
  });

  it('不存在的 Level id 返回 false', () => {
    const track: LearningTrack = { ...trackNoPrereq, prerequisiteLevelIds: ['l99'] };
    expect(isTrackPrerequisiteMet(track, [])).toBe(false);
  });
});
