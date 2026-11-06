import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BackLink } from '@/shared/components/layout/BackLink';
import { TheoryPlacementTest } from './TheoryPlacementTest';

export default function TheoryPlacementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        <BackLink onClick={() => navigate('/theory')} label={t('theory.title')} variant="pill" />
        <TheoryPlacementTest onExit={() => navigate('/theory')} />
      </div>
    </div>
  );
}
