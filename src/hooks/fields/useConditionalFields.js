// /hooks/fields/useConditionalFields.js

import { useMemo, useCallback } from 'react';
import { 
  isFieldVisible, 
  getVisibleFields, 
  getVisibleTabs, 
  getVisibleGroups,
  getFieldDependencies 
} from '@/lib/utils/conditionalFields';

/**
 * Hook for managing conditional field visibility in collection forms
 * Integrates with existing @collections config system
 * 
 * @param {Object} config - Collection configuration from @collections
 * @param {Object} record - Current record/form data
 * @returns {Object} - Visibility utilities and helpers
 */
export const useConditionalFields = (config, record = {}) => {
  const fields = config?.fields || [];

  // Memoize field dependencies to avoid recalculation
  const fieldDependencies = useMemo(() => 
    getFieldDependencies(fields), 
    [fields]
  );

  // Check if a specific field should be visible
  const checkFieldVisibility = useCallback((fieldName) => {
    const field = fields.find(f => f.name === fieldName);
    return field ? isFieldVisible(field, record) : false;
  }, [fields, record]);

  // Get visible fields for a specific context
  const getVisibleFieldsForContext = useCallback((tab = null, group = null) => {
    return getVisibleFields(fields, record, tab, group);
  }, [fields, record]);

  // Get visible tabs
  const visibleTabs = useMemo(() => 
    getVisibleTabs(fields, record), 
    [fields, record]
  );

  // Get visible groups for a tab
  const getVisibleGroupsForTab = useCallback((tab) => {
    return getVisibleGroups(fields, record, tab);
  }, [fields, record]);

  // Check if a tab should be visible
  const isTabVisible = useCallback((tab) => {
    return visibleTabs.includes(tab);
  }, [visibleTabs]);

  // Check if a group should be visible
  const isGroupVisible = useCallback((group, tab = null) => {
    const visibleGroups = getVisibleGroups(fields, record, tab);
    return visibleGroups.includes(group);
  }, [fields, record]);

  // Get fields that depend on a specific field change
  const getDependentFields = useCallback((fieldName) => {
    return fieldDependencies[fieldName] || [];
  }, [fieldDependencies]);

  // Check if any fields in a group are visible
  const hasVisibleFieldsInGroup = useCallback((group, tab = null) => {
    const groupFields = getVisibleFields(fields, record, tab, group);
    return groupFields.length > 0;
  }, [fields, record]);

  // Check if any fields in a tab are visible
  const hasVisibleFieldsInTab = useCallback((tab) => {
    const tabFields = getVisibleFields(fields, record, tab);
    return tabFields.length > 0;
  }, [fields, record]);

  // Filter fields by visibility for rendering
  const filterVisibleFields = useCallback((fieldsToFilter, tab = null, group = null) => {
    return fieldsToFilter.filter(field => {
      // Check tab match if specified
      if (tab && field.tab !== tab) return false;
      
      // Check group match if specified  
      if (group && field.group !== group) return false;
      
      // Check conditional visibility
      return isFieldVisible(field, record);
    });
  }, [record]);

  return {
    // Core visibility checks
    checkFieldVisibility,
    isTabVisible,
    isGroupVisible,
    
    // Field getters
    getVisibleFieldsForContext,
    getVisibleGroupsForTab,
    filterVisibleFields,
    
    // Computed arrays
    visibleTabs,
    
    // Utility helpers
    getDependentFields,
    hasVisibleFieldsInGroup,
    hasVisibleFieldsInTab,
    
    // Raw dependencies for advanced usage
    fieldDependencies
  };
};