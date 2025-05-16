// /lib/utils/isIncludedInView.js

/**
 * Determines if a field should be included in a specific view
 * @param {Object} field - The field configuration object
 * @param {string} view - The current view context (e.g. "table", "detail", "form")
 * @returns {boolean}
 */
export const isIncludedInView = (field, view = 'table') => {
  if (!field || typeof field !== 'object') return false;
  if (!field.includeInViews) return true; // Default to visible everywhere
  if (field.includeInViews.length === 1 && field.includeInViews[0] === 'none') return false;
  return field.includeInViews.includes(view);
};
