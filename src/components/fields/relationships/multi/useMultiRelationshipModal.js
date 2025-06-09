// Update your useMultiRelationshipModal hook to respect autoSave parameter

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';

export const useMultiRelationshipModal = ({
  field,
  record,
  autoSave = true, // NEW: Allow disabling auto-save
  onSuccess
}) => {
  const supabase = createClient();
  const [selectedItems, setSelectedItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    relation: {
      table,
      labelField = 'title',
      junctionTable,
      sourceKey,
      targetKey
    }
  } = field;

  // Load available items
  useEffect(() => {
    const loadAvailableItems = async () => {
      if (!table) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order(labelField);

        if (error) throw error;
        setAvailableItems(data || []);
      } catch (err) {
        console.error('Error loading available items:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAvailableItems();
  }, [table, labelField, supabase]);

  // Load current selection (only if we have a record ID)
  useEffect(() => {
    const loadCurrentSelection = async () => {
      // CRITICAL FIX: Only load if we have a record ID and autoSave is enabled
      if (!record?.id || !autoSave || !junctionTable) {
        console.log('[useMultiRelationshipModal] Skipping selection load - no record ID or autoSave disabled');
        setSelectedItems([]);
        return;
      }

      try {
        let query = supabase
          .from(junctionTable)
          .select(`${targetKey}(*)`)
          .eq(sourceKey, record.id);

        // Apply junctionFilter if defined
        if (field?.relation?.junctionFilter) {
          Object.entries(field.relation.junctionFilter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        const { data, error } = await query;


        if (error) throw error;
        
        const items = data?.map(item => item[targetKey]).filter(Boolean) || [];
        setSelectedItems(items);
      } catch (err) {
        console.error('Error loading current selection:', err);
        setError(err.message);
      }
    };

    loadCurrentSelection();
  }, [record?.id, autoSave, junctionTable, sourceKey, targetKey, supabase]);

  const toggleItem = useCallback((item) => {
    setSelectedItems(prev => {
      const exists = prev.find(s => s.id === item.id);
      if (exists) {
        return prev.filter(s => s.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    // CRITICAL FIX: Only auto-save to database if autoSave is enabled and we have a record ID
    if (!autoSave || !record?.id) {
      console.log('[useMultiRelationshipModal] Skipping database save - autoSave disabled or no record ID');
      return; // Let the parent component handle the save
    }

    if (!junctionTable) {
      console.error('No junction table specified');
      return;
    }

    try {
      // Delete existing relationships
      await supabase
        .from(junctionTable)
        .delete()
        .eq(sourceKey, record.id);

      // Insert new relationships
      if (selectedItems.length > 0) {
        const insertData = selectedItems.map(item => ({
          [sourceKey]: record.id,
          [targetKey]: item.id
        }));

        const { error } = await supabase
          .from(junctionTable)
          .insert(insertData);

        if (error) throw error;
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error saving relationships:', err);
      setError(err.message);
    }
  }, [autoSave, record?.id, junctionTable, sourceKey, targetKey, selectedItems, onSuccess, supabase]);

  const handleCancel = useCallback(() => {
    // Reset to original selection if we're in auto-save mode
    if (autoSave && record?.id) {
      // Reload original selection
      // This would require re-fetching, for now just clear error
      setError(null);
    }
  }, [autoSave, record?.id]);

  const filteredItems = availableItems.filter(item =>
    item[labelField]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    selectedItems,
    availableItems: filteredItems,
    loading,
    error,
    handleSave,
    handleCancel,
    searchTerm,
    setSearchTerm,
    toggleItem
  };
};