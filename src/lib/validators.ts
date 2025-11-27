// Validation utilities for Zenon Explorer

/**
 * Check if a string is a valid Zenon address
 * Address format: z1 followed by 38 alphanumeric characters
 */
export function isValidAddress(query: string): boolean {
  return /^z1[a-z0-9]{38}$/.test(query);
}

/**
 * Check if a string is a valid Zenon token standard (ZTS)
 * ZTS format: zts1 followed by alphanumeric characters
 */
export function isValidTokenStandard(query: string): boolean {
  return /^zts1[a-z0-9]+$/.test(query);
}

/**
 * Check if a string is a valid hash (64 character hex string)
 * Used for momentum hashes and transaction hashes
 */
export function isValidHash(query: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(query);
}

/**
 * Check if a string is a valid momentum height (positive integer)
 */
export function isValidMomentumHeight(query: string): boolean {
  return /^\d+$/.test(query);
}

/**
 * Search type enum for identifying what the user is searching for
 */
export type SearchType = 'address' | 'token' | 'hash' | 'height' | null;

/**
 * Determine the type of search based on the query string
 */
export function getSearchType(query: string): SearchType {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (isValidAddress(trimmed)) return 'address';
  if (isValidTokenStandard(trimmed)) return 'token';
  if (isValidMomentumHeight(trimmed)) return 'height';
  if (isValidHash(trimmed)) return 'hash';

  return null;
}

/**
 * Get the URL path for a search query
 */
export function getSearchUrl(query: string): string | null {
  const type = getSearchType(query);
  const trimmed = query.trim();

  switch (type) {
    case 'address':
      return `/address/${trimmed}`;
    case 'token':
      return `/token/${trimmed}`;
    case 'height':
      return `/momentum/${trimmed}`;
    case 'hash':
      return `/hash/${trimmed}`;
    default:
      return null;
  }
}
