import { useTranslation } from 'react-i18next';
import { HandImporter } from '../components/HandImporter';

export default function HandImportPage() {
  const { t } = useTranslation();
  return (
    <div className="py-8">
      <h1 className="font-display text-[28px] tracking-wide text-[var(--ivory)] mb-2">{t('handHistory.importer.pageTitle')}</h1>
      <p className="text-sm text-[var(--ivory-muted)] mb-6">
        {t('handHistory.importer.pageDesc')}
      </p>
      <HandImporter />
    </div>
  );
}
