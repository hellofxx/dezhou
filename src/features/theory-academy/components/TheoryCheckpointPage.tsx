import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '@/shared/components/layout/BackLink';
import { TheoryCheckpoint } from './TheoryCheckpoint';

export default function TheoryCheckpointPage() {
  const { t } = useTranslation();
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  if (!levelId) return <Navigate to="/theory" replace />;
  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        <BackLink onClick={() => navigate('/theory')} label={t('theory.title')} variant="pill" />
        <TheoryCheckpoint levelId={levelId} onExit={() => navigate('/theory')} />
      </div>
    </div>
  );
}
