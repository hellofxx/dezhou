import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { TheoryCheckpoint } from './TheoryCheckpoint';

export default function TheoryCheckpointPage() {
  const { t } = useTranslation();
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  if (!levelId) return <Navigate to="/theory" replace />;
  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        <button
          onClick={() => navigate('/theory')}
          aria-label={t('theory.title')}
          className="inline-flex min-h-11 items-center gap-1.5 px-2 rounded text-xs text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('theory.title')}
        </button>
        <TheoryCheckpoint levelId={levelId} onExit={() => navigate('/theory')} />
      </div>
    </div>
  );
}
