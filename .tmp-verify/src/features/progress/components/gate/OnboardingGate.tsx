import { Navigate, useLocation } from 'react-router-dom';
import { useProgressStore } from '../../store';

interface OnboardingGateProps {
  children: React.ReactNode;
}

/**
 * 新手引导门禁组件。
 *
 * 行为：
 * - 读取 progressStore.onboarding.completed
 * - 如果 completed === false 且当前不在 /onboarding 及其子路径，
 *   使用 <Navigate to="/onboarding" replace /> 重定向
 *
 * 用法：在 AppLayout 中包裹 <Outlet />
 */
export default function OnboardingGate({ children }: OnboardingGateProps) {
  const location = useLocation();
  const onboardingCompleted = useProgressStore((s) => s.onboarding.completed);

  // OB-06：精确路径 + 子路径双重判断，兼容 basename/子路由，避免误重定向
  const isOnboardingRoute =
    location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/');

  if (!onboardingCompleted && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
