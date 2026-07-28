import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHandHistoryStore } from '../store';
import { HandReplayer } from '../components/HandReplayer';

export default function HandReplayPage() {
  const { handId } = useParams<{ handId: string }>();
  const navigate = useNavigate();
  const { hands, currentHand, setCurrentHand, loaded, loadFromDB } = useHandHistoryStore();

  useEffect(() => {
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
      const hand = hands.find(h => h.id === handId);
      if (hand && (!currentHand || currentHand.id !== handId)) {
        setCurrentHand(hand);
      }
    }
  }, [handId, hands, loaded, loadFromDB, setCurrentHand, currentHand]);

  if (!currentHand && loaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-sm text-[var(--ivory-muted)]">Hand not found</p>
        <button
          onClick={() => navigate('/hand-history')}
          className="text-sm text-[var(--brass-bright)] hover:underline font-numeric"
        >
          Back to hand history
        </button>
      </div>
    );
  }

  if (!currentHand) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--ivory-muted)] text-sm font-display">
        Loading...
      </div>
    );
  }

  return <HandReplayer />;
}
