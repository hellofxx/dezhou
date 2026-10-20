import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { ComponentSkeleton } from '@/shared/components/feedback/LoadingState';

const LazyModuleStatsPage = lazy(() => import('../dashboard/ModuleStatsPage'));

export default function GTOStatsPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<ComponentSkeleton />}>
      <LazyModuleStatsPage moduleName="gto-simulator" displayName={t('nav.gtoSimulator')} />
    </Suspense>
  );
}
