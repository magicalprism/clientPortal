// /lib/utils/conditionalFields.js

/**
 * Conditional field visibility utility for dynamic collection forms
 * Integrates with @collections config system
 */

/**
 * Evaluates a single condition against a record
 * @param {Object} condition - The condition to evaluate
 * @param {Object} record - The record to check against
 * @returns {boolean} - Whether the condition is met
 */
export const evaluateCondition = (condition, record = {}) => {
  if (!condition || !condition.field) return true;

  const { field, operator, value } = condition;
  const fieldValue = record[field];

  switch (operator) {
    case 'equals':
      return fieldValue === value;
    
    case 'not_equals':
      return fieldValue !== value;
    
    case 'in':
      return Array.isArray(value) ? value.includes(fieldValue) : false;
    
    case 'not_in':
      return Array.isArray(value) ? !value.includes(fieldValue) : true;
    
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    
    case 'less_than':
      return Number(fieldValue) < Number(value);
    
    case 'contains':
      return String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
    
    case 'not_contains':
      return !String(fieldValue || '').toLowerCase().includes(String(value).toLowerCase());
    
    case 'exists':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    
    case 'not_exists':
      return fieldValue === null || fieldValue === undefined || fieldValue === '';
    
    default:
      console.warn(`[conditionalFields] Unknown operator: ${operator}`);
      return true;
  }
};

/**
 * Evaluates complex conditions with AND/OR logic
 * @param {Object} conditionGroup - The condition group to evaluate
 * @param {Object} record - The record to check against
 * @returns {boolean} - Whether the condition group is met
 */
export const evaluateConditionGroup = (conditionGroup, record = {}) => {
  if (!conditionGroup) return true;

  // Simple condition (no operator means single condition)
  if (conditionGroup.field) {
    return evaluateCondition(conditionGroup, record);
  }

  // Complex condition group
  const { operator, conditions } = conditionGroup;
  
  if (!Array.isArray(conditions)) return true;

  switch (operator) {
    case 'and':
      return conditions.every(condition => evaluateConditionGroup(condition, record));
    
    case 'or':
      return conditions.some(condition => evaluateConditionGroup(condition, record));
    
    default:
      // Default to AND if no operator specified
      return conditions.every(condition => evaluateConditionGroup(condition, record));
  }
};

/**
 * Determines if a field should be visible based on its showWhen/hideWhen config
 * @param {Object} field - The field configuration
 * @param {Object} record - The current record
 * @returns {boolean} - Whether the field should be visible
 */
export const isFieldVisible = (field, record = {}) => {
  if (!field) return false;

  let visible = true;

  // Check showWhen condition
  if (field.showWhen) {
    visible = evaluateConditionGroup(field.showWhen, record);
  }

  // Check hideWhen condition (takes precedence)
  if (field.hideWhen && visible) {
    visible = !evaluateConditionGroup(field.hideWhen, record);
  }

  return visible;
};

/**
 * Gets all visible fields for a given tab/group
 * @param {Array} fields - Array of field configurations
 * @param {Object} record - The current record
 * @param {string} tab - Optional tab filter
 * @param {string} group - Optional group filter
 * @returns {Array} - Array of visible fields
 */
export const getVisibleFields = (fields = [], record = {}, tab = null, group = null) => {
  return fields.filter(field => {
    // Filter by tab if specified
    if (tab && field.tab !== tab) return false;
    
    // Filter by group if specified
    if (group && field.group !== group) return false;
    
    // Check conditional visibility
    return isFieldVisible(field, record);
  });
};

/**
 * Gets all visible tabs that have at least one visible field
 * @param {Array} fields - Array of field configurations
 * @param {Object} record - The current record
 * @returns {Array} - Array of tab names that should be visible
 */
export const getVisibleTabs = (fields = [], record = {}) => {
  const tabs = [...new Set(fields.map(f => f.tab).filter(Boolean))];
  
  return tabs.filter(tab => {
    const tabFields = getVisibleFields(fields, record, tab);
    return tabFields.length > 0;
  });
};

/**
 * Gets all visible groups within a tab that have at least one visible field
 * @param {Array} fields - Array of field configurations
 * @param {Object} record - The current record
 * @param {string} tab - The tab to check
 * @returns {Array} - Array of group names that should be visible
 */
export const getVisibleGroups = (fields = [], record = {}, tab = null) => {
  const tabFields = fields.filter(f => !tab || f.tab === tab);
  const groups = [...new Set(tabFields.map(f => f.group).filter(Boolean))];
  
  return groups.filter(group => {
    const groupFields = getVisibleFields(fields, record, tab, group);
    return groupFields.length > 0;
  });
};

/**
 * Gets field dependencies - which fields affect the visibility of other fields
 * Used for optimizing re-renders by only checking affected fields
 * @param {Array} fields - Array of field configurations
 * @returns {Object} - Map of field names to arrays of dependent field names
 */
export const getFieldDependencies = (fields = []) => {
  const dependencies = {};

  const extractDependentFields = (condition) => {
    if (!condition) return [];
    
    if (condition.field) {
      return [condition.field];
    }
    
    if (condition.conditions) {
      return condition.conditions.flatMap(extractDependentFields);
    }
    
    return [];
  };

  fields.forEach(field => {
    const dependentFields = [
      ...extractDependentFields(field.showWhen),
      ...extractDependentFields(field.hideWhen)
    ];

    dependentFields.forEach(depField => {
      if (!dependencies[depField]) {
        dependencies[depField] = [];
      }
      if (!dependencies[depField].includes(field.name)) {
        dependencies[depField].push(field.name);
      }
    });
  });

  return dependencies;
};