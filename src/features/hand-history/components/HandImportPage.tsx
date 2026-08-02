import { HandImporter } from '../components/HandImporter';

export default function HandImportPage() {
  return (
    <div className="py-8">
      <h1 className="font-display text-[28px] tracking-wide text-[var(--ivory)] mb-2">Import Hand History</h1>
      <p className="text-sm text-[var(--ivory-muted)] mb-6">
        Paste hand history text or upload a .txt file. Supports PokerStars and GGPoker formats.
      </p>
      <HandImporter />
    </div>
  );
}
