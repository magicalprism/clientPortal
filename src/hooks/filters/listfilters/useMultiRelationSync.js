'use client';

import { createClient } from '@/lib/supabase/browser';
import { normalizeMultiRelationshipValue } from '@/lib/utils/filters/listfilters/normalizeMultiRelationshipValue';

/**
 * Hook for syncing multirelationship values with the database
 * Handles junction tables for many-to-many relationships
 */
export const useMultiRelationSync = () => {
  const supabase = createClient();

  /**
   * Synchronizes selected IDs with the database via junction table
   * Used to update many-to-many relationships
   * 
   * @param {Object} params - Parameters
   * @param {Object} params.field - Field configuration
   * @param {string|number} params.parentId - ID of the parent record
   * @param {Array} params.selectedIds - Array of selected IDs
   * @param {Array} params.options - Available options
   * @param {Function} params.onChange - Callback for state updates
   * @returns {Promise<Array>} - Updated linked data
   */
  const syncMultiRelation = async ({ field, parentId, selectedIds, options, onChange }) => {
    if (!field?.relation) {
      console.warn('[useMultiRelationSync] Missing field relation configuration');
      return null;
    }
    
    // Extract configuration with defaults
    const { 
      table, 
      junctionTable, 
      sourceKey: configSourceKey, 
      targetKey: configTargetKey,
      labelField = 'title'
    } = field.relation;
    
    // Determine sourceKey and targetKey with fallbacks
    const sourceKey = configSourceKey || `${field.parentTable || 'parent'}_id`;
    const targetKey = configTargetKey || `${table || 'child'}_id`;
    
    // Validate required parameters
    if (!parentId || !junctionTable || !table) {
      console.warn('[useMultiRelationSync] Missing required parameters:', {
        parentId, junctionTable, table
      });
      return null;
    }
    
    // Log operation
    console.log(`[useMultiRelationSync] Syncing ${selectedIds.length} selected IDs for ${field.name}`, {
      parentId,
      junctionTable, 
      sourceKey,
      targetKey,
      selectedIds: selectedIds.slice(0, 5).join(', ') + (selectedIds.length > 5 ? '...' : '')
    });

    try {
      // Normalize selected IDs
      const normalizedIds = normalizeMultiRelationshipValue(selectedIds);
      
      // Get existing relationships
      const { data: existingRels, error: fetchError } = await supabase
        .from(junctionTable)
        .select(targetKey)
        .eq(sourceKey, parentId);
        
      if (fetchError) {
        console.error('[useMultiRelationSync] Error fetching existing relationships:', fetchError);
        return null;
      }
      
      // Extract existing IDs
      const existingIds = (existingRels || []).map(r => String(r[targetKey]));
      
      // Check if anything actually changed
      const sortedExisting = [...existingIds].sort();
      const sortedNew = [...normalizedIds].sort();
      
      // Compare as strings for more reliable comparison
      const existingStr = sortedExisting.join(',');
      const newStr = sortedNew.join(',');
      const hasChanges = existingStr !== newStr;
      
      console.log(`[useMultiRelationSync] Comparing changes for ${field.name}:`, {
        existingCount: existingIds.length,
        newCount: normalizedIds.length,
        hasChanges
      });
      
      // Skip if no changes needed
      if (!hasChanges) {
        console.log(`[useMultiRelationSync] No changes needed for ${field.name}`);
        
        // Retrieve existing data for consistency
        const { data: linkedData } = await supabase
          .from(table)
          .select(`id, ${labelField}`)
          .in('id', normalizedIds.length > 0 ? normalizedIds : ['0']);
          
        return linkedData || [];
      }
      
      // Calculate additions and removals
      const toAdd = normalizedIds.filter(id => !existingIds.includes(id));
      const toRemove = existingIds.filter(id => !normalizedIds.includes(id));
      
      // Add new relationships
      if (toAdd.length > 0) {
        const insertData = toAdd.map(id => ({
          [sourceKey]: parentId,
          [targetKey]: id
        }));

        const { error: insertError } = await supabase
          .from(junctionTable)
          .insert(insertData);

        if (insertError) {
          console.error('[useMultiRelationSync] Error inserting new relationships:', insertError);
          return null;
        }

        console.log(`[useMultiRelationSync] Inserted ${toAdd.length} new relationships for ${field.name}`);
      }

      // Remove deselected relationships
      if (toRemove.length > 0) {
        for (const id of toRemove) {
          const { error: deleteError } = await supabase
            .from(junctionTable)
            .delete()
            .match({
              [sourceKey]: parentId,
              [targetKey]: id
            });

          if (deleteError) {
            console.error(`[useMultiRelationSync] Error removing relationship for ${id}:`, deleteError);
          }
        }

        console.log(`[useMultiRelationSync] Removed ${toRemove.length} relationships for ${field.name}`);
      }

      // Fetch updated data
      const { data: linkedData, error } = await supabase
        .from(table)
        .select(`id, ${labelField}`)
        .in('id', normalizedIds.length > 0 ? normalizedIds : ['0']);

      if (error) {
        console.error('[useMultiRelationSync] Fetching updated records failed:', error);
        return null;
      }

      // Call the onChange callback if provided
      if (onChange && typeof onChange === 'function') {
        onChange(field, {
          ids: normalizedIds,
          details: linkedData || []
        });
      }
      
      return linkedData || [];
    } catch (err) {
      console.error('[useMultiRelationSync] Sync error:', err);
      return null;
    }
  };

  /**
   * Saves all multirelationship fields for a record in a single operation
   * Useful for forms and modals
   * 
   * @param {Object} params - Parameters
   * @param {Object} params.config - Collection configuration
   * @param {Object} params.record - Record to save
   * @returns {Promise<boolean>} - Success status
   */
  const saveAllMultiRelationships = async ({ config, record }) => {
    if (!record?.id || !config?.fields) {
      console.warn('[saveAllMultiRelationships] Missing record ID or config fields');
      return false;
    }
    
    // Find all multirelationship fields in the config
    const multiRelationshipFields = config.fields.filter(
      field => field.type === 'multiRelationship' && field.relation?.junctionTable
    );
    
    if (multiRelationshipFields.length === 0) {
      // No multirelationship fields to save
      return true;
    }
    
    console.log(`[saveAllMultiRelationships] Processing ${multiRelationshipFields.length} multirelationship fields for record ${record.id}`);
    
    try {
      // Process each field sequentially
      const results = await Promise.all(
        multiRelationshipFields.map(async field => {
          // Prepare parameters for syncMultiRelation
          const selectedIds = normalizeMultiRelationshipValue(record[field.name]);
          
          // Sync this field
          const result = await syncMultiRelation({
            field,
            parentId: record.id,
            selectedIds,
            options: record[`${field.name}_details`] || [],
            onChange: () => {} // No callback needed here
          });
          
          return result !== null; // success if not null
        })
      );
      
      // Check if all operations succeeded
      const success = results.every(Boolean);
      
      console.log(`[saveAllMultiRelationships] Completed with status: ${success ? 'success' : 'failure'}`);
      
      return success;
    } catch (error) {
      console.error('[saveAllMultiRelationships] Error saving multirelationships:', error);
      return false;
    }
  };

  return { 
    syncMultiRelation,
    saveAllMultiRelationships
  };
};

export default useMultiRelationSync;