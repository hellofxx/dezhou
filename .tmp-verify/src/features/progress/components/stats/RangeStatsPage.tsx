import { useTranslation } from 'react-i18next';
import ModuleStatsPage from '../dashboard/ModuleStatsPage';

export default function RangeStatsPage() {
  const { t } = useTranslation();
  return <ModuleStatsPage moduleName="range-trainer" displayName={t('nav.rangeTrainer')} />;
}
