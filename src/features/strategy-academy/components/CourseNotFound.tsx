import { FOCUS_RING } from '@/shared/components/ui/focusRing';

interface CourseNotFoundProps {
  message: string;
  backLabel: string;
  onBack: () => void;
}

export default function CourseNotFound({ message, backLabel, onBack }: CourseNotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-[var(--ivory-muted)]">{message}</p>
      <button
        onClick={onBack}
        className={`min-h-11 px-2 rounded text-sm text-[var(--brass-bright)] hover:underline ${FOCUS_RING}`}
      >
        {backLabel}
      </button>
    </div>
  );
}