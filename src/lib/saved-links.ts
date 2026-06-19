/**
 * Local Storage Manager for Saved Links
 * Persists generated carousel links locally (no auth required)
 */

const STORAGE_KEY = 'link2slide_saved_links';
const MAX_SAVED_LINKS = 20; // Limit to prevent localStorage bloat

export interface SavedLink {
  id: string;
  sourceUrl: string;
  title: string; // First slide headline
  createdAt: string;
}

export function getSavedLinks(): SavedLink[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedLink[];
  } catch {
    return [];
  }
}

export function saveLink(link: SavedLink): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getSavedLinks();

    // Check if already saved (avoid duplicates)
    const alreadyExists = existing.some((l) => l.id === link.id);
    if (alreadyExists) return;

    // Add new link at the beginning, limit total count
    const updated = [link, ...existing].slice(0, MAX_SAVED_LINKS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save link:', err);
  }
}

export function removeLink(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getSavedLinks();
    const updated = existing.filter((l) => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove link:', err);
  }
}

export function clearAllLinks(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear links:', err);
  }
}
