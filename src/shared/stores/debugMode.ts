import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 调试解锁模式（开发者选项）。
 *
 * 在设置页「开发者选项」输入激活码后 `unlockAll` 置真，全局解除以下门禁：
 *   - 策略学院 Level 解锁（isLevelUnlocked / isLevelEntryUnlocked）
 *   - range-trainer 位置渐进解锁（RangeSelector）
 *   - 学习轨道前置（LearningTracksView）
 *   - 课程 URL 直达门禁（CourseView）
 *   - 每日题量上限（SessionLimitGuard）
 *
 * 状态独立持久化于自身 store，不并入 progress store（避免 persist 形状/版本连带变更）。
 * 属跨模块共享状态（≥2 模块消费），故置于 shared/stores。
 */

/** 调试解锁激活码（唯一事实源，如需变更仅改此常量） */
export const DEBUG_UNLOCK_CODE = '1337';

interface DebugModeStore {
  /** 是否已激活「解锁所有功能」 */
  unlockAll: boolean;
  /** 用激活码尝试开启；码正确返回 true 并置 unlockAll，否则返回 false 不改状态 */
  activateWithCode: (code: string) => boolean;
  /** 关闭调试解锁 */
  deactivate: () => void;
}

export const useDebugModeStore = create<DebugModeStore>()(
  persist(
    (set) => ({
      unlockAll: false,
      activateWithCode: (code) => {
        if (code.trim() === DEBUG_UNLOCK_CODE) {
          set({ unlockAll: true });
          return true;
        }
        return false;
      },
      deactivate: () => set({ unlockAll: false }),
    }),
    {
      name: 'poker-debug-mode',
      version: 1,
    }
  )
);

/**
 * 非响应式读取调试解锁状态（供 store 方法 / 纯逻辑短路使用）。
 * 组件内需要响应式更新时请改用 `useDebugModeStore((s) => s.unlockAll)`。
 */
export function isDebugUnlockActive(): boolean {
  return useDebugModeStore.getState().unlockAll;
}
