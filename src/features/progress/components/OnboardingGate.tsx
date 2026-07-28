import { Navigate, useLocation } from 'react-router-dom';
import { useProgressStore } from '../store';

interface OnboardingGateProps {
  children: React.ReactNode;
}

/**
 * 新手引导门禁组件。
 *
 * 行为：
 * - 读取 progressStore.onboarding.completed
 * - 如果 completed === false 且当前路径不是 /onboarding，
 *   使用 <Navigate to="/onboarding" replace /> 重定向
 *
 * 用法：在 AppLayout 中包裹 <Outlet />
 */
export default function OnboardingGate({ children }: OnboardingGateProps) {
  const location = useLocation();
  const onboardingCompleted = useProgressStore((s) => s.onboarding.completed);

  if (!onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
