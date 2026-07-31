import { useProgressStore } from '../store';
import StreakCelebration from './StreakCelebration';

/**
 * 里程碑庆典全局 Host。
 *
 * 监听 `progressStore.pendingMilestone`（由 checkMilestone 达成时设置），
 * 非 null 时弹出 StreakCelebration 全屏庆典；关闭后清除。
 *
 * 渲染位置：AppLayout 与 BlankLayout 各挂一次（与 TiltWarning 同策略），
 * 保证在任意训练页完成训练触发里程碑时都能立即展示庆典，
 * 修复"recordTrainingDay 消费里程碑但无人展示弹窗"的不可达问题。
 */
export default function MilestoneCelebrationHost() {
  const pendingMilestone = useProgressStore((s) => s.pendingMilestone);
  const clearPendingMilestone = useProgressStore((s) => s.clearPendingMilestone);

  if (pendingMilestone === null) return null;

  return (
    <StreakCelebration
      days={pendingMilestone}
      open
      onClose={clearPendingMilestone}
    />
  );
}
