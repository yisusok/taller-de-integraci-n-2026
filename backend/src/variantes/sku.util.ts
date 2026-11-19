const toSlug = (raw: string): string =>
  raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function buildVariantSku(
  baseSku: string,
  color: string,
  talle: string,
): string {
  const parts = [toSlug(baseSku), toSlug(color), toSlug(talle)].filter(
    (part) => part.length > 0,
  );
  return parts.join('-').slice(0, 80);
}

export function normalizeTags(tags?: string[]): string[] {
  if (!tags || tags.length === 0) {
    return [];
  }
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of tags) {
    const clean = raw.trim().toLowerCase();
    if (clean.length > 0 && !seen.has(clean)) {
      seen.add(clean);
      normalized.push(clean);
    }
  }
  return normalized;
}
