export function normalizeHelpQuery(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase();
}

export function filterHelpItems<T>(
  items: readonly T[],
  query: string,
  getSearchText: (item: T) => string,
): T[] {
  const normalized = normalizeHelpQuery(query);
  if (!normalized) return [...items];

  const terms = normalized.split(/\s+/u);
  return items.filter((item) => {
    const searchText = normalizeHelpQuery(getSearchText(item));
    return terms.every((term) => searchText.includes(term));
  });
}
