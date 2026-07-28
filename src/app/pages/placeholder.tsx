export function createPlaceholder(name: string) {
  return function PlaceholderPage() {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{name}</h1>
          <p className="text-[var(--text-muted)] mt-2">功能开发中...</p>
        </div>
      </div>
    );
  };
}
