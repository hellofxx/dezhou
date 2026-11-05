/** 两院共用的学院展示组件（理论 / 策略薄包装的共享底座，禁止反向 import feature）。 */
export { AcademyBridgeCard } from './AcademyBridgeCard';
export type { AcademyBridgeCardProps } from './AcademyBridgeCard';

export { AcademyMasteryCard } from './AcademyMasteryCard';
export type {
  AcademyMasteryCardProps,
  AcademyMasteryLabels,
  AcademyMasteryWeakest,
} from './AcademyMasteryCard';

export { AcademyVariantRuleCard } from './AcademyVariantRuleCard';
export type {
  AcademyVariantRuleCardProps,
  AcademyVariantRuleItem,
} from './AcademyVariantRuleCard';

export { AcademySearchShell } from './AcademySearchShell';
export type { AcademySearchShellProps } from './AcademySearchShell';

export { AcademyBookmarksPanel } from './AcademyBookmarksPanel';
export type {
  AcademyBookmarksPanelProps,
  AcademyBookmarksLabels,
  AcademyBookmarkItem,
} from './AcademyBookmarksPanel';

export { AcademyNotesPanel } from './AcademyNotesPanel';
export type { AcademyNotesPanelProps, AcademyNotesLabels } from './AcademyNotesPanel';

export { ContentIssueReportDialog } from './ContentIssueReportDialog';
export type {
  ContentIssueReportDialogProps,
  ContentIssueReportDialogLabels,
} from './ContentIssueReportDialog';
