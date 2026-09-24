import { useTranslation } from 'react-i18next';
import ModuleStatsPage from '../dashboard/ModuleStatsPage';

export default function GTOStatsPage() {
  const { t } = useTranslation();
  return <ModuleStatsPage moduleName="gto-simulator" displayName={t('nav.gtoSimulator')} />;
}
