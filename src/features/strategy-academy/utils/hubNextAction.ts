import type { HubStage } from './hubStages';
import { selectNextConceptInStage, selectWeakConceptInStage } from './hubConcepts';

export type HubNextActionKind = 'review' | 'concept' | 'practice' | 'basics' | 'done' | 'blocked';

export interface HubNextAction {
  kind: HubNextActionKind;
  id: string;
  route: string;
  reasonKey: string;
  dueCount?: number;
  stageTitleKey?: string;
  chapterId?: string;
  targetId?: string;
}

export interface BuildHubNextActionInput {
  stages: readonly HubStage[];
  completedLessons: readonly string[];
  completedChapters: readonly string[];
  conceptScores: Readonly<Record<string, number | undefined>>;
  dueReviewCounts: { theory: number; generic: number };
  theoryReady: boolean;
  basicsCompleted: boolean;
}

/**
 * 课程枢纽唯一“下一步”：
 * 基础入门 > 理论 SRS > 通用 SRS > 段内弱概念 > 段内下一实战 > 段内未读概念 > 全部完成。
 */
export function buildHubNextAction({
  stages,
  completedLessons,
  completedChapters,
  conceptScores,
  dueReviewCounts,
  theoryReady,
  basicsCompleted,
}: BuildHubNextActionInput): HubNextAction {
  if (!basicsCompleted) {
    return {
      kind: 'basics',
      id: 'hub-basics',
      route: '/academy/basics',
      reasonKey: 'academy.courseHub.reason.basics',
    };
  }

  if (stages.length === 0) {
    return {
      kind: 'blocked',
      id: 'hub-blocked',
      route: '/academy',
      reasonKey: 'academy.courseHub.reason.blocked',
    };
  }

  if (dueReviewCounts.theory > 0) {
    return {
      kind: 'review',
      id: 'hub-review-theory',
      route: '/theory/review',
      reasonKey: 'academy.courseHub.reason.reviewTheory',
      dueCount: dueReviewCounts.theory,
    };
  }

  if (dueReviewCounts.generic > 0) {
    return {
      kind: 'review',
      id: 'hub-review-generic',
      route: '/',
      reasonKey: 'academy.courseHub.reason.reviewGeneric',
      dueCount: dueReviewCounts.generic,
    };
  }

  const current = stages.find((stage) => stage.current) ?? stages.find((stage) => stage.unlocked && !stage.complete);
  if (!current) {
    // 实战全完成但仍有概念未读：继续收尾概念，再进入 done。
    if (theoryReady) {
      for (const stage of stages) {
        if (!stage.unlocked) continue;
        const nextConcept = selectNextConceptInStage(stage.theoryChapterIds, completedChapters);
        if (nextConcept) {
          return {
            kind: 'concept',
            id: `hub-concept-next-${nextConcept}`,
            route: `/theory/chapter/${nextConcept}`,
            reasonKey: 'academy.courseHub.reason.nextConcept',
            stageTitleKey: stage.titleKey,
            chapterId: nextConcept,
            targetId: nextConcept,
          };
        }
      }
    }
    return {
      kind: 'done',
      id: 'hub-done',
      route: '/academy/tracks',
      reasonKey: 'academy.courseHub.reason.allDone',
    };
  }

  if (theoryReady) {
    const weakConcept = selectWeakConceptInStage(current.theoryChapterIds, conceptScores);
    if (weakConcept) {
      return {
        kind: 'concept',
        id: `hub-concept-weak-${weakConcept}`,
        route: `/theory/chapter/${weakConcept}`,
        reasonKey: 'academy.courseHub.reason.weakConcept',
        stageTitleKey: current.titleKey,
        chapterId: weakConcept,
        targetId: weakConcept,
      };
    }
  }

  const completedLessonSet = new Set(completedLessons);
  const nextLesson = current.lessonIds.find((id) => !completedLessonSet.has(id));
  if (nextLesson) {
    return {
      kind: 'practice',
      id: `hub-practice-${nextLesson}`,
      route: `/lesson/${nextLesson}`,
      reasonKey: 'academy.courseHub.reason.nextPractice',
      stageTitleKey: current.titleKey,
      targetId: nextLesson,
    };
  }

  if (theoryReady) {
    const nextConcept = selectNextConceptInStage(current.theoryChapterIds, completedChapters);
    if (nextConcept) {
      return {
        kind: 'concept',
        id: `hub-concept-next-${nextConcept}`,
        route: `/theory/chapter/${nextConcept}`,
        reasonKey: 'academy.courseHub.reason.nextConcept',
        stageTitleKey: current.titleKey,
        chapterId: nextConcept,
        targetId: nextConcept,
      };
    }
  }

  return {
    kind: 'done',
    id: 'hub-done',
    route: '/academy/tracks',
    reasonKey: 'academy.courseHub.reason.allDone',
  };
}