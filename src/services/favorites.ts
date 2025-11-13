/**
 * Favorites Service - Manage favorite files (client-side)
 */

const FAVORITES_KEY = 'walrusbox_favorites';
const RECENT_FILES_KEY = 'walrusbox_recent_files';

export const favoritesService = {
  /**
   * Get all favorite file IDs
   */
  getFavorites: (): string[] => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  },

  /**
   * Add file to favorites
   */
  addFavorite: (fileId: string): void => {
    try {
      const favorites = favoritesService.getFavorites();
      if (!favorites.includes(fileId)) {
        favorites.push(fileId);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  },

  /**
   * Remove file from favorites
   */
  removeFavorite: (fileId: string): void => {
    try {
      const favorites = favoritesService.getFavorites();
      const filtered = favorites.filter(id => id !== fileId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  },

  /**
   * Check if file is favorited
   */
  isFavorite: (fileId: string): boolean => {
    const favorites = favoritesService.getFavorites();
    return favorites.includes(fileId);
  },

  /**
   * Toggle favorite status
   */
  toggleFavorite: (fileId: string): boolean => {
    const isFav = favoritesService.isFavorite(fileId);
    if (isFav) {
      favoritesService.removeFavorite(fileId);
    } else {
      favoritesService.addFavorite(fileId);
    }
    return !isFav;
  },

  /**
   * Get recent files (last 10)
   */
  getRecentFiles: (): string[] => {
    try {
      const stored = localStorage.getItem(RECENT_FILES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting recent files:', error);
      return [];
    }
  },

  /**
   * Add file to recent files
   */
  addRecentFile: (fileId: string): void => {
    try {
      let recent = favoritesService.getRecentFiles();
      
      // Remove if already exists
      recent = recent.filter(id => id !== fileId);
      
      // Add to beginning
      recent.unshift(fileId);
      
      // Keep only last 10
      recent = recent.slice(0, 10);
      
      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recent));
    } catch (error) {
      console.error('Error adding recent file:', error);
    }
  },

  /**
   * Clear all favorites
   */
  clearFavorites: (): void => {
    localStorage.removeItem(FAVORITES_KEY);
  },

  /**
   * Clear recent files
   */
  clearRecentFiles: (): void => {
    localStorage.removeItem(RECENT_FILES_KEY);
  },
};
