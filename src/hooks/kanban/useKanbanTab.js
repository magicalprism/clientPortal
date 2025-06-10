'use client';
import { useState, useEffect, useCallback } from 'react';
import * as collections from '@/collections';

/**
 * Hook for managing kanban tab state and configuration
 * @param {Object} config - Collection configuration
 * @param {Object} record - Current record
 * @param {Object} options - Optional configuration overrides
 */
export const useKanbanTab = (config, record, options = {}) => {
  const kanbanConfig = config?.kanban || {};
  
  // State
  const [mode, setMode] = useState(options.initialMode || kanbanConfig.defaultMode || 'milestone');
  const [showCompleted, setShowCompleted] = useState(
    options.initialShowCompleted ?? kanbanConfig.defaultShowCompleted ?? false
  );
  const [loading, setLoading] = useState(false);

  // Configuration
  const availableModes = kanbanConfig.modes || ['milestone', 'support'];
  const taskConfigName = kanbanConfig.taskConfig || 'task';
  const taskConfig = collections[taskConfigName];
  const isEnabled = config?.showKanbanTab === true || kanbanConfig.enabled === true;

  // Validation
  const isValid = !!(record?.id && taskConfig && isEnabled);
  const error = !record?.id ? 'Record ID required' :
               !taskConfig ? 'Task configuration not found' :
               !isEnabled ? 'Kanban not enabled for this collection' :
               null;

  // Handlers
  const handleModeChange = useCallback((newMode) => {
    if (availableModes.includes(newMode)) {
      setLoading(true);
      setMode(newMode);
      
      // Brief loading state for visual feedback
      setTimeout(() => setLoading(false), 300);
    }
  }, [availableModes]);

  const handleShowCompletedToggle = useCallback(() => {
    setLoading(true);
    setShowCompleted(prev => !prev);
    
    // Brief loading state for visual feedback
    setTimeout(() => setLoading(false), 300);
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    // Force re-render of kanban board
    setTimeout(() => setLoading(false), 500);
  }, []);

  // Update state when config changes
  useEffect(() => {
    if (kanbanConfig.defaultMode && kanbanConfig.defaultMode !== mode) {
      setMode(kanbanConfig.defaultMode);
    }
  }, [kanbanConfig.defaultMode]);

  useEffect(() => {
    if (kanbanConfig.defaultShowCompleted !== undefined && 
        kanbanConfig.defaultShowCompleted !== showCompleted) {
      setShowCompleted(kanbanConfig.defaultShowCompleted);
    }
  }, [kanbanConfig.defaultShowCompleted]);

  return {
    // State
    mode,
    showCompleted,
    loading,
    
    // Configuration
    availableModes,
    taskConfig,
    isEnabled,
    isValid,
    error,
    kanbanConfig,
    
    // Handlers
    handleModeChange,
    handleShowCompletedToggle,
    handleRefresh,
    
    // Direct setters (for advanced use)
    setMode,
    setShowCompleted,
    setLoading
  };
};