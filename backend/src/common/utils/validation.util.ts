export const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const trimToUpper = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export const escapeLike = (term: string): string =>
  term.replace(/[\\%_]/g, (ch) => `\\${ch}`);
