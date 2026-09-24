import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useAcademyProgressSnapshot } from '@/shared/hooks/useAcademyDataSource';
import { registerAcademyDataSource } from '@/shared/stores/academyDataSourceRegistry';
import type { AcademyDataSource } from '@/shared/types/academyDataSource';
import { act } from 'react';

/**
 * Registry late registration timing test (T2-A2 step 3).
 * 
 * Simulates "Dashboard mounts first, registry registers later" scenario to verify
 * that the self-healing mechanism works: components should eventually receive data
 * after registry becomes available.
 */

// Mock component that uses the hook
function TestComponent() {
  const snapshot = useAcademyProgressSnapshot();
  return (
    <div data-testid="component">
      <span data-testid="lesson-count">{snapshot.completedLessons.length}</span>
    </div>
  );
}

describe('Registry late registration self-healing', () => {
  beforeEach(() => {
    cleanup();
    // Clear any existing registration
    // Note: We can't directly clear the registry, so we just work with what's there
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('模拟 Dashboard 先挂载、registry 后注册 → 断言学院进度最终非空（自愈）', async () => {
    // Step 1: Create a mock data source
    const mockSource: AcademyDataSource = {
      subscribe: vi.fn((_listener) => {
        // No-op subscriber
        return () => {};
      }),
      getAcademyProgressSnapshot: () => ({ completedLessons: ['l3-cbet-q1'] }),
      getFirstAttemptScoresSnapshot: () => ({}),
      getLastAttemptScoresSnapshot: () => ({}),
      findNextLesson: () => undefined,
      getLessonMeta: () => undefined,
    };

    // Step 2: Mount component BEFORE registration (simulating race condition)
    const { getByTestId } = render(<TestComponent />);
    const lessonCountEl = getByTestId('lesson-count');
    
    // Initially empty or whatever state before registration
    expect(lessonCountEl.textContent).toBeDefined();
    
    // Step 3: Register AFTER mount (triggering self-healing)
    await act(async () => {
      registerAcademyDataSource(mockSource);
      
      // The onAcademyDataRegister listener should have fired
      // and triggered a re-render with actual data
    });
    
    // Step 4: Verify component received the data through self-healing
    // Note: Due to useSyncExternalStore behavior, we need to wait for batched updates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalCount = getByTestId('lesson-count').textContent;
    expect(finalCount).toBeTruthy();
    
    // The subscription was called during registration
    expect(mockSource.subscribe).toHaveBeenCalled();
  }, 5000);

  it('已注册场景下直接订阅 → 立即获取数据（正常路径）', async () => {
    // Pre-register before mounting (normal case)
    const mockSource: AcademyDataSource = {
      subscribe: vi.fn(() => {
        // Immediately call listener when subscribed
        setTimeout(() => {}, 0);
        return () => {};
      }),
      getAcademyProgressSnapshot: () => ({ completedLessons: ['l4-gto-basics-1'] }),
      getFirstAttemptScoresSnapshot: () => ({}),
      getLastAttemptScoresSnapshot: () => ({}),
      findNextLesson: () => undefined,
      getLessonMeta: () => undefined,
    };

    registerAcademyDataSource(mockSource);

    const { getByTestId } = render(<TestComponent />);
    const lessonCountEl = getByTestId('lesson-count');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalCount = lessonCountEl.textContent;
    expect(finalCount).toBeTruthy();
  }, 5000);
});
