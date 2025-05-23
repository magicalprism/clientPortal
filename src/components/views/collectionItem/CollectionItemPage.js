'use client';
import dynamic from 'next/dynamic';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  useMediaQuery, Card, CardContent, Tabs, Tab, Grid, Divider,
  Typography, TextField, CircularProgress, Box, IconButton, Button
} from '@mui/material';
const CollectionView = dynamic(() => import('@/components/views/CollectionView'), {
  ssr: false,
  loading: () => <div>Loading collection...</div>,
});
import { useGroupedFields } from '@/components/fields/useGroupedFields';
import { useCollectionSave } from '@/hooks/useCollectionSave';
import { FieldRenderer } from '@/components/FieldRenderer';
import { BrandBoardPreview } from '@/components/fields/custom/BrandBoardPreview';
import { ElementMap } from '@/components/fields/custom/ElementMap';
import TimelineView from '@/components/fields/custom/timeline/TimelineView';
import { useRouter } from 'next/navigation';
import { Plus } from '@phosphor-icons/react';
import CollectionGridView from '@/components/views/grid/CollectionGridView';
import { RelatedTagsField } from '@/components/fields/relationships/multi/RelatedTagsField';
import * as collections from '@/collections';
import { createClient } from '@/lib/supabase/browser';
import { CollectionItemForm } from '@/components/views/collectionItem/CollectionItemForm';

export const CollectionItemPage = ({ config, record, isModal = false }) => {
  // Add this ref and counter to track renders
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [localRecord, setLocalRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const initialValues = useRef(null); // Initialize to null, not formData

  

  // Sync localRecord with formData when localRecord changes
  useEffect(() => {
    if (localRecord) {
      // Initialize formData with localRecord when it becomes available
      setFormData(localRecord);
      initialValues.current = JSON.parse(JSON.stringify(localRecord)); // Create deep copy for comparison
    }
  }, [localRecord]);

  // Add this to fetch elements for the project when it loads
useEffect(() => {
  // Only run this if we have a valid record with an ID
  if (localRecord?.id) {
    // Check if we have the element_id field in config
    const elementField = config?.fields?.find(f => 
      f.name === 'element_id' && 
      f.type === 'multiRelationship' &&
      f.relation?.table === 'element'
    );
    
    if (elementField) {

      
      // Create the correct filter condition
      const filterCondition = elementField.relation.targetKey || 'project_id';
      
      // Fetch elements from Supabase
      const supabase = createClient();
      supabase
        .from('element')
        .select('*')
        .eq(filterCondition, localRecord.id)
        .then(({ data, error }) => {
          if (error) {
            console.error('Failed to fetch elements:', error);
            return;
          }
          

          if (data.length > 0) {
            // Update the localRecord with the fetched elements
            setLocalRecord(prev => ({
              ...prev,
              element_id: data.map(e => e.id),
              element_id_details: data
            }));
            
            // Also update formData
            setFormData(prev => ({
              ...prev,
              element_id: data.map(e => e.id),
              element_id_details: data
            }));
          }
        });
    }
  }
}, [localRecord?.id]);

  // Only set once record is initialized
const lastRecordId = useRef(null);

useEffect(() => {
  if (!record) return;

  setLocalRecord(prev => {
    if (!prev || prev.id !== record.id) {
      lastRecordId.current = record.id;

      return { ...record };
    }
    return prev;
  });
}, [record?.id]);
  
  // Always call the hook, but guard its usage with a default empty object
  const {
    updateLocalValue,
    saveRecord,
    editingField,
    setEditingField,
    tempValue,
    setTempValue,
    loadingField,
    hasChanges,
  } = useCollectionSave({
    config,
    record: localRecord || {}, // ✅ prevent crash on first render
    setRecord: setLocalRecord,
    mode: 'edit',
  });
  
  const [activeTab, setActiveTab] = useState(0);
  const baseTabs = useGroupedFields(config?.fields || [], activeTab);
  const showTimelineTab = config?.showTimelineTab === true;

  const tabNames = showTimelineTab ? [...baseTabs.tabNames, 'Timeline'] : baseTabs.tabNames;
  const isTimelineTab = showTimelineTab && activeTab === baseTabs.tabNames.length;
  const currentTabGroups = isTimelineTab ? null : baseTabs.currentTabGroups;

  // FIXED: handleMultifieldChange to use newValue parameter
  const handleMultifieldChange = (fieldName, newValue) => {
    // Update formData state
    setFormData(prev => ({
      ...prev,
      [fieldName]: newValue // FIXED: Use newValue instead of value
    }));
    
    // Update localRecord state to keep them in sync
    updateLocalValue(fieldName, newValue);
    
    // Explicitly set form as dirty
    setIsDirty(true);
  };




  // FIXED: Add handleSave function
  const handleSave = () => {
    console.log('Saving record...');
    saveRecord(); // Use the saveRecord function from useCollectionSave
    
    // After successful save, reset dirty flags
    setIsDirty(false);
  };

  /**
   * Handles field value changes in the collection item page
   */
  const handleFieldChange = (fieldOrName, value) => {
    // Normalize field input - handle both field object and field name string
    const fieldName = typeof fieldOrName === 'object' ? fieldOrName.name : fieldOrName;
    const field = typeof fieldOrName === 'object' ? fieldOrName : 
      config?.fields?.find(f => f.name === fieldOrName) || { name: fieldOrName };
    
    console.log(`Field change: ${fieldName} = `, value); // Add debug log

    if (field.type === 'media') {
  console.log(`Media field change detected: ${fieldName}`, value);

  setLocalRecord(prev => ({
    ...prev,
    [fieldName]: value
  }));

  setFormData(prev => ({
    ...prev,
    [fieldName]: value
  }));

  setIsDirty(true); // ✅ mark form dirty
  return;
}

    
    if (field.type === 'date') {
      updateLocalValue(fieldName, value);
      return;
    }

    if (formData[fieldName] === value) {
  return;
}

    // Special handling for multiRelationship fields
// Special handling for multiRelationship fields
if (field.type === 'multiRelationship') {
  console.log('MultiRelationship field change:', { fieldName, value }); // Add debug log
  
  if (value?.ids) {
    // Handle object format with ids and details
    setLocalRecord(prev => ({
      ...prev,
      [fieldName]: value.ids,
      [`${fieldName}_details`]: value.details,
    }));
    
    // IMPORTANT: Update formData to trigger isDirty
    setFormData(prev => ({
      ...prev,
      [fieldName]: value.ids,
      [`${fieldName}_details`]: value.details,
    }));
    
    // ALWAYS FORCE isDirty to true for multirelationship changes
    setIsDirty(true);
    console.log(`Explicitly setting isDirty=true for ${fieldName} change`);
  } else if (Array.isArray(value)) {
    // Handle array format with just IDs
    setLocalRecord(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // IMPORTANT: Update formData to trigger isDirty
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // ALWAYS FORCE isDirty to true for multirelationship changes
    setIsDirty(true);
    console.log(`Explicitly setting isDirty=true for ${fieldName} change`);
  }
  
  return;
}
if (field.type === 'media') {


  setLocalRecord(prev => ({
    ...prev,
    [fieldName]: value
  }));

  setFormData(prev => ({
    ...prev,
    [fieldName]: value
  }));

  setIsDirty(true);
  return;
}
    
    // Special handling for select/status fields
    if (field.type === 'select' || field.type === 'status') {
      updateLocalValue(fieldName, value);
      
      // Update formData too
      setFormData(prev => ({
        ...prev,
        [fieldName]: value
      }));
      
      return;
    }
    
    // Special handling for relationship fields
    if (field.type === 'relationship' && value !== null && value !== undefined) {
      // If it's an object with id property, extract just the id
      if (typeof value === 'object' && value.id !== undefined) {
        updateLocalValue(fieldName, value.id);
        
        // Update formData too
        setFormData(prev => ({
          ...prev,
          [fieldName]: value.id
        }));
      } else {
        // It's already a simple value (likely an ID)
        updateLocalValue(fieldName, value);
        
        // Update formData too
        setFormData(prev => ({
          ...prev,
          [fieldName]: value
        }));
      }
      return;
    }
    
    // Default handling for other field types
    updateLocalValue(fieldName, value);
    
    // Update formData too
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Any change should set isDirty
    setIsDirty(true);
  };
    
  const startEdit = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setTempValue(currentValue ?? '');
  };

  const tableRelationships = (config?.fields || [])
    .filter(f => f.type === 'multiRelationship' && f.displayMode === 'table');



  return (
    <>
      <Card elevation={0}>
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
            variant="scrollable"
          >
            {tabNames.map((tabName, index) => (
              <Tab key={index} label={tabName} />
            ))}
          </Tabs>
          
          {/* Show timeline when on timeline tab */}
          {isTimelineTab ? (
            showTimelineTab && localRecord?.id && (
              <Box mt={2}>
                <TimelineView projectId={localRecord.id} config={config} />
              </Box>
            )
          ) : (
            /* Show regular form when not on timeline tab */
            <CollectionItemForm
              config={config}
              record={localRecord}
              onFieldChange={handleFieldChange}
              editable
              isEditingField={editingField}
              setEditingField={setEditingField}
              loadingField={loadingField}
              activeTab={activeTab}
              isModal={isModal}
              isSmallScreen={isSmallScreen}
              tempValue={tempValue}
              setTempValue={setTempValue}
            />
          )}
        </CardContent>
      </Card>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        {/* REMOVED: MultifieldComponent that was causing errors */}
        
        {/* Save button that uses isDirty state */}
        <Button 
          disabled={!isDirty && !hasChanges} // Use both flags
          onClick={handleSave}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
      </Box>
    </>
  );
};