import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

export default function useAutoSave({
  data,
  onSave,
  delay = 2000, // Auto-save delay in milliseconds
  storageKey, // localStorage key for persistence
  enabled = true,
}) {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);
  const isInitialMount = useRef(true);

  // Save to localStorage
  const saveToStorage = useCallback((dataToSave) => {
    if (!storageKey) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        data: dataToSave,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [storageKey]);

  // Load from localStorage
  const loadFromStorage = useCallback(() => {
    if (!storageKey) return null;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  }, [storageKey]);

  // Clear storage
  const clearStorage = useCallback(() => {
    if (!storageKey) return;
    
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }, [storageKey]);

  // Trigger save
  const triggerSave = useCallback(async () => {
    if (!enabled || !onSave) return;

    try {
      await onSave(data);
      lastSavedRef.current = JSON.stringify(data);
      saveToStorage(data);
      
      // Show subtle notification
      toast.success('Draft saved', {
        duration: 1500,
        icon: '💾',
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Failed to save draft');
    }
  }, [data, enabled, onSave, saveToStorage]);

  // Auto-save effect
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!enabled || !data) return;

    // Check if data has changed
    const currentData = JSON.stringify(data);
    if (currentData === lastSavedRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      triggerSave();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, triggerSave]);

  // Manual save
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    triggerSave();
  }, [triggerSave]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const currentData = JSON.stringify(data);
    return currentData !== lastSavedRef.current;
  }, [data]);

  return {
    saveNow,
    loadFromStorage,
    clearStorage,
    hasUnsavedChanges,
  };
}

// Auto-save indicator component
export function AutoSaveIndicator({ isSaving, lastSaved }) {
  if (isSaving) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Saved {getTimeAgo(lastSaved)}</span>
      </div>
    );
  }

  return null;
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Utility to warn about unsaved changes
export function useUnsavedChangesWarning(hasUnsavedChanges) {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
}
