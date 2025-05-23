'use client';

/**
 * Utility functions for handling select/status fields
 * This centralizes the logic for consistent handling across components
 */

/**
 * Normalizes a select field value for display
 * @param {any} value - The value to normalize (can be object, string, or null)
 * @param {Array} options - Array of options with value/label properties
 * @returns {Object} - Normalized representation with value and label
 */
export const normalizeSelectValue = (value, options = []) => {
  // Handle null/undefined case
  if (value === null || value === undefined) {
    return { value: '', label: '' };
  }
  
  // Handle object case (already has value/label)
  if (typeof value === 'object' && value !== null) {
    if ('value' in value) {
      // It's already in the right format
      return {
        value: value.value,
        label: value.label || findLabelForValue(value.value, options) || value.value
      };
    }
    
    // It's some other kind of object - convert to string
    return {
      value: String(value),
      label: String(value)
    };
  }
  
  // Handle simple value case (string/number)
  const label = findLabelForValue(value, options) || value;
  return {
    value,
    label
  };
};

/**
 * Finds the label for a value in an options array
 * @param {string|number} value - The value to find
 * @param {Array} options - Array of options with value/label properties
 * @returns {string} - The found label or empty string
 */
export const findLabelForValue = (value, options = []) => {
  if (!value || !options || !Array.isArray(options)) return '';
  
  const option = options.find(opt => opt.value === value);
  return option ? option.label : '';
};

/**
 * Extracts the raw value from a select field value
 * @param {any} value - The value to process
 * @returns {string|number} - The extracted raw value
 */
export const extractSelectValue = (value) => {
  if (value === null || value === undefined) return '';
  
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return value.value;
  }
  
  return value;
};

/**
 * Creates a formatted object for select field change events
 * @param {string|number} value - The selected value
 * @param {Array} options - Array of options with value/label properties
 * @returns {Object} - Formatted object with value and label
 */
export const createSelectChangeValue = (value, options = []) => {
  const label = findLabelForValue(value, options) || value;
  return { value, label };
};

/**
 * Processes a select field change based on the mode
 * In create mode, we need to preserve the value/label pair
 * This function always returns the proper format for each context
 * 
 * @param {string} mode - The mode ('create' or 'edit')
 * @param {string|number} value - The selected value
 * @param {Array} options - Array of options with value/label properties
 * @returns {Object} - Processed value with correct format
 */
export const processSelectChange = (mode, value, options = []) => {
  // Always return a proper value/label pair object
  // This is necessary for UI consistency and proper validation
  return createSelectChangeValue(value, options);
};