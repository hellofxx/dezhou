import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHandHistoryStore } from '../store';
import { HandReplayer } from '../components/HandReplayer';

export default function HandReplayPage() {
  const { t } = useTranslation();
  const { handId } = useParams<{ handId: string }>();
  const navigate = useNavigate();
  const { currentHand, setCurrentHand, loaded, loadFromDB } = useHandHistoryStore();

  useEffect(() => {
    // HH-10：hands / currentHand 均经 getState() 读取，避免把它们放进依赖导致
    // setCurrentHand 后 effect 重复执行（依赖仅保留稳定标识与动作引用）
    const { hands: allHands, currentHand: current } = useHandHistoryStore.getState();
    if (!loaded) {
      loadFromDB().then(() => {
        // After loading, try to find the hand
        const store = useHandHistoryStore.getState();
        const hand = store.hands.find(h => h.id === handId);
        if (hand) {
          setCurrentHand(hand);
        }
      });
    } else {
      const hand = allHands.find(h => h.id === handId);
      if (hand && (!current || current.id !== handId)) {
        setCurrentHand(hand);
      }
    }
    // hands / currentHand 经 getState() 读取，避免冗余依赖导致的重复执行
  }, [handId, loaded, loadFromDB, setCurrentHand]);

  if (!currentHand && loaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-sm text-[var(--ivory-muted)]">{t('handHistory.replayPage.notFound')}</p>
        <button
          onClick={() => navigate('/hand-history')}
          className="text-sm text-[var(--brass-bright)] hover:underline font-numeric"
        >
          {t('handHistory.replayPage.backToList')}
        </button>
      </div>
    );
  }

  if (!currentHand) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--ivory-muted)] text-sm font-display">
        {t('handHistory.replayPage.loading')}
      </div>
    );
  }

  return <HandReplayer />;
}
