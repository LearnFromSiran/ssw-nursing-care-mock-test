/**
 * Storage Module - Handles all localStorage persistence for the app
 * Manages: progress, settings, vocabulary tracking, quiz history, exports
 */

const Storage = (() => {
  const STORAGE_KEYS = {
    PROGRESS: 'ssw_progress',
    SETTINGS: 'ssw_settings',
    VOCAB_KNOWN: 'ssw_vocab_known',
    QUIZ_HISTORY: 'ssw_quiz_history',
    USER_PROFILE: 'ssw_user_profile',
    LAST_SESSION: 'ssw_last_session',
  };

  const DEFAULT_SETTINGS = {
    language: 'en',
    darkMode: false,
    soundEnabled: true,
    fontSize: 'normal',
    vibrationEnabled: true,
    autoSave: true,
  };

  /**
   * Initialize storage with defaults if empty
   */
  const init = () => {
    if (!get(STORAGE_KEYS.SETTINGS)) {
      set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!get(STORAGE_KEYS.QUIZ_HISTORY)) {
      set(STORAGE_KEYS.QUIZ_HISTORY, []);
    }
    if (!get(STORAGE_KEYS.VOCAB_KNOWN)) {
      set(STORAGE_KEYS.VOCAB_KNOWN, []);
    }
    if (!get(STORAGE_KEYS.USER_PROFILE)) {
      set(STORAGE_KEYS.USER_PROFILE, {
        name: 'Student',
        joinDate: new Date().toISOString(),
        totalQuizzes: 0,
        totalCorrect: 0,
        totalTime: 0,
      });
    }
  };

  /**
   * Get item from localStorage
   */
  const get = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return defaultValue;
    }
  };

  /**
   * Set item in localStorage
   */
  const set = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      if (error.name === 'QuotaExceededError') {
        // Storage full - clear old history
        const history = get(STORAGE_KEYS.QUIZ_HISTORY, []);
        if (history.length > 100) {
          set(STORAGE_KEYS.QUIZ_HISTORY, history.slice(-50));
          set(key, value);
        }
      }
      return false;
    }
  };

  /**
   * Save quiz result to history
   */
  const saveQuizResult = (result) => {
    const history = get(STORAGE_KEYS.QUIZ_HISTORY, []);
    history.push({
      ...result,
      timestamp: new Date().toISOString(),
    });
    
    // Keep only last 200 quizzes
    if (history.length > 200) {
      history.shift();
    }
    
    set(STORAGE_KEYS.QUIZ_HISTORY, history);
    updateUserStats(result);
  };

  /**
   * Update user statistics after quiz
   */
  const updateUserStats = (result) => {
    const profile = get(STORAGE_KEYS.USER_PROFILE, {});
    profile.totalQuizzes = (profile.totalQuizzes || 0) + 1;
    profile.totalCorrect = (profile.totalCorrect || 0) + (result.score || 0);
    profile.totalTime = (profile.totalTime || 0) + (result.duration || 0);
    set(STORAGE_KEYS.USER_PROFILE, profile);
  };

  /**
   * Mark vocabulary as known
   */
  const markVocabKnown = (vocabId) => {
    const known = get(STORAGE_KEYS.VOCAB_KNOWN, []);
    if (!known.includes(vocabId)) {
      known.push(vocabId);
      set(STORAGE_KEYS.VOCAB_KNOWN, known);
    }
  };

  /**
   * Get known vocabulary
   */
  const getKnownVocab = () => {
    return new Set(get(STORAGE_KEYS.VOCAB_KNOWN, []));
  };

  /**
   * Save progress on specific chapter/section
   */
  const saveProgress = (sectionId, progress) => {
    const allProgress = get(STORAGE_KEYS.PROGRESS, {});
    allProgress[sectionId] = {
      ...allProgress[sectionId],
      ...progress,
      lastUpdated: new Date().toISOString(),
    };
    set(STORAGE_KEYS.PROGRESS, allProgress);
  };

  /**
   * Get progress for section
   */
  const getProgress = (sectionId) => {
    const allProgress = get(STORAGE_KEYS.PROGRESS, {});
    return allProgress[sectionId] || {};
  };

  /**
   * Export all data as JSON
   */
  const exportData = () => {
    return {
      exportDate: new Date().toISOString(),
      progress: get(STORAGE_KEYS.PROGRESS, {}),
      settings: get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
      vocabKnown: get(STORAGE_KEYS.VOCAB_KNOWN, []),
      quizHistory: get(STORAGE_KEYS.QUIZ_HISTORY, []),
      userProfile: get(STORAGE_KEYS.USER_PROFILE, {}),
    };
  };

  /**
   * Import data from JSON
   */
  const importData = (data) => {
    try {
      if (data.progress) set(STORAGE_KEYS.PROGRESS, data.progress);
      if (data.settings) set(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.vocabKnown) set(STORAGE_KEYS.VOCAB_KNOWN, data.vocabKnown);
      if (data.quizHistory) set(STORAGE_KEYS.QUIZ_HISTORY, data.quizHistory);
      if (data.userProfile) set(STORAGE_KEYS.USER_PROFILE, data.userProfile);
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  };

  /**
   * Download exported data as file
   */
  const downloadExport = () => {
    const data = exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ssw-nursing-care-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Clear all data (with confirmation)
   */
  const clearAll = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    init();
  };

  /**
   * Get storage statistics
   */
  const getStats = () => {
    const history = get(STORAGE_KEYS.QUIZ_HISTORY, []);
    const profile = get(STORAGE_KEYS.USER_PROFILE, {});
    return {
      totalQuizzes: profile.totalQuizzes || 0,
      averageScore: profile.totalQuizzes > 0 
        ? ((profile.totalCorrect || 0) / profile.totalQuizzes * 100).toFixed(1)
        : 0,
      vocabLearned: get(STORAGE_KEYS.VOCAB_KNOWN, []).length,
      storageUsed: new Blob(Object.values(localStorage)).size,
    };
  };

  return {
    init,
    get,
    set,
    KEYS: STORAGE_KEYS,
    saveQuizResult,
    markVocabKnown,
    getKnownVocab,
    saveProgress,
    getProgress,
    exportData,
    importData,
    downloadExport,
    clearAll,
    getStats,
  };
})();

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Storage.init());
} else {
  Storage.init();
}
