import { useTranslation } from 'react-i18next';
import { ProgressRing } from '@/shared/components/data-display/ProgressRing';

/** 双泳道迷你环：理论 / 实战各自播报；理论不可用或未就绪时占位，不伪造数据 */
export default function StageRing({
  lane,
  done,
  total,
  known,
  unavailable,
  icon,
}: {
  lane: string;
  done: number;
  total: number;
  known: boolean;
  unavailable?: boolean;
  icon: React.ReactNode;
}) {
  const { t } = useTranslation();

  if (!known || unavailable) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <ProgressRing
          value={0}
          size={40}
          variant="academy"
          status="idle"
          ariaLabel={t('academy.courseHub.loop.ringUnknown', { lane })}
        />
        <span
          className="inline-flex items-center gap-0.5 text-[11px] text-[var(--ivory-dim)]"
          aria-hidden="true"
        >
          {icon}—
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <ProgressRing
        value={total > 0 ? done / total : 0}
        size={40}
        variant="academy"
        ariaLabel={t('academy.courseHub.loop.ringAria', { lane, done, total })}
        center={
          <span className="font-numeric text-[11px] text-[var(--ivory)]">
            {done}/{total}
          </span>
        }
      />
      <span className="text-[var(--brass-text)]" aria-hidden="true">
        {icon}
      </span>
    </div>
  );
}