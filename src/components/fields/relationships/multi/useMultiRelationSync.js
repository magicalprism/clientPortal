'use client';

import { createClient } from '@/lib/supabase/browser';

export const useMultiRelationSync = () => {
  const supabase = createClient();

  const syncMultiRelation = async ({ field, parentId, selectedIds, options, onChange }) => {
    if (!field?.relation) {
      console.warn('[useMultiRelationSync] Missing field relation configuration');
      return;
    }
    
    const { table, junctionTable, sourceKey, targetKey, labelField } = {
      ...field.relation,
      sourceKey: field.relation?.sourceKey || `${field.parentTable || 'parent'}_id`,
      targetKey: field.relation?.targetKey || `${field.relation?.table || 'child'}_id`,
      labelField: field.relation?.labelField || 'title'
    };

    if (!parentId || !junctionTable || !table) {
      console.warn('[useMultiRelationSync] Missing required parameters:', {
        parentId, junctionTable, table
      });
      return;
    }
    
    // Log what we're about to do
    console.log(`[useMultiRelationSync] Syncing ${selectedIds.length} selected IDs for ${field.name}`, {
      parentId,
      junctionTable, 
      sourceKey,
      targetKey,
      selectedIds
    });

    try {
      // Normalize selected IDs to ensure they're all strings
      const normalizedIds = selectedIds.map(String).filter(Boolean);
      
      // First, get existing relationships
      const { data: existingRels, error: fetchError } = await supabase
        .from(junctionTable)
        .select(targetKey)
        .eq(sourceKey, parentId);
        
      if (fetchError) {
        console.error('[useMultiRelationSync] Error fetching existing relationships:', fetchError);
      }
      
      const existingIds = (existingRels || []).map(r => String(r[targetKey]));
      
      // Check if anything actually changed - avoid unnecessary DB operations
      const hasChanges = 
        existingIds.length !== normalizedIds.length ||
        normalizedIds.some(id => !existingIds.includes(id)) ||
        existingIds.some(id => !normalizedIds.includes(id));
        
      if (!hasChanges) {
        console.log(`[useMultiRelationSync] No changes needed for ${field.name}`);
        
        // Retrieve the existing data for consistency
        const { data: linkedData } = await supabase
          .from(table)
          .select(`id, ${labelField}`)
          .in('id', normalizedIds);
          
        return linkedData;
      }
      
      // Now remove all existing relationships
      await supabase
        .from(junctionTable)
        .delete()
        .eq(sourceKey, parentId);

      // Add new relationships
      if (normalizedIds.length > 0) {
        const newLinks = normalizedIds.map(id => ({ 
          [sourceKey]: parentId, 
          [targetKey]: id 
        }));
        
        const { error: insertError } = await supabase
          .from(junctionTable)
          .insert(newLinks);
          
        if (insertError) {
          console.error('[useMultiRelationSync] Error inserting new relationships:', insertError);
        }
      }

      // Fetch the updated data
      const { data: linkedData, error } = await supabase
        .from(table)
        .select(`id, ${labelField}`)
        .in('id', normalizedIds);

      if (error) {
        console.error('[useMultiRelationSync] Fetching updated records failed:', error);
      }

      // Call the onChange callback if provided
      if (onChange && typeof onChange === 'function') {
        onChange(field, {
          ids: normalizedIds,
          details: linkedData || []
        });
      }
      
      return linkedData;
    } catch (err) {
      console.error('[useMultiRelationSync] Sync error:', err);
      return null;
    }
  };

  return { syncMultiRelation };
};