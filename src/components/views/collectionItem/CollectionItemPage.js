'use client';
import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';
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
import TimelineView from '@/components/fields/custom/timeline/TimelineView';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/browser';
import { CollectionItemForm } from '@/components/views/collectionItem/CollectionItemForm';
import { ContractSectionsTab } from '@/components/dashboard/contract/ContractSectionsTab';
import { useContractBuilder } from '@/components/dashboard/contract/useContractBuilder';

export const CollectionItemPage = ({ config, record, isModal = false }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [localRecord, setLocalRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const initialValues = useRef(null);

  // Check if this is a contract before calling the hook
  const isContract = config?.name === 'contract';

  // Always call useContractBuilder, but conditionally use its values
  const contractBuilderResult = useContractBuilder();
  
  // Only destructure the values we need if this is a contract
  const {
    contractParts = [],
    availableParts = [],
    handleDragEnd = () => {},
    handleAddExistingPart = () => {},
    handleAddCustomPart = () => {},
    handleRemovePart = () => {}
  } = isContract ? contractBuilderResult : {};

  const [activeId, setActiveId] = useState(null);

  // Sync localRecord with formData when localRecord changes
  useEffect(() => {
    if (localRecord) {
      setFormData(localRecord);
      initialValues.current = JSON.parse(JSON.stringify(localRecord));
    }
  }, [localRecord]);

  // Fetch elements for the project when it loads
  useEffect(() => {
    if (localRecord?.id) {
      const elementField = config?.fields?.find(f => 
        f.name === 'element_id' && 
        f.type === 'multiRelationship' &&
        f.relation?.table === 'element'
      );
      
      if (elementField) {
        const filterCondition = elementField.relation.targetKey || 'project_id';
        
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
              setLocalRecord(prev => ({
                ...prev,
                element_id: data.map(e => e.id),
                element_id_details: data
              }));
              
              setFormData(prev => ({
                ...prev,
                element_id: data.map(e => e.id),
                element_id_details: data
              }));
            }
          });
      }
    }
  }, [localRecord?.id, config?.fields]);

  // Set record once initialized
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
    record: localRecord || {},
    setRecord: setLocalRecord,
    mode: 'edit',
  });
  
  const [activeTab, setActiveTab] = useState(0);
  const baseTabs = useGroupedFields(config?.fields || [], activeTab);
  const showTimelineTab = config?.showTimelineTab === true;

  // Contract-specific drag handlers
  const handleDragStart = ({ active }) => {
    if (!isContract) return;
    setActiveId(active.id);
  };

  const handleDragEndWrapper = (event) => {
    if (!isContract) return;
    handleDragEnd(event);
    setActiveId(null);
  };

  // Build tab names
  const tabNames = [...baseTabs.tabNames];
  if (isContract) tabNames.push('Contract Sections');
  if (showTimelineTab) tabNames.push('Timeline');

  // Determine which tab we're on
  const contractTabIndex = isContract ? baseTabs.tabNames.length : -1;
  const timelineTabIndex = showTimelineTab ? tabNames.length - 1 : -1;
  
  const isContractTab = isContract && activeTab === contractTabIndex;
  const isTimelineTab = showTimelineTab && activeTab === timelineTabIndex;
  const isRegularFormTab = !isContractTab && !isTimelineTab;

  const handleSave = async () => {
    console.log('Saving record...');
    const result = await saveRecord();
    
    if (config?.name === 'element') {
      console.log('[Debug] Element localRecord:', JSON.stringify(localRecord, null, 2));
      console.log('[Debug] Element company_id:', localRecord?.company_id);
      console.log('[Debug] Element project_id:', localRecord?.project_id);
    }
    
    if (result && (localRecord?.create_folder === true || formData?.create_folder === true)) {
      try {
        const response = await fetch('/api/google-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: config?.name,
            payload: localRecord
          })
        });
        
        console.log('[Debug] Response status:', response.status);
        console.log('[Debug] Response headers:', response.headers);
        
        const responseText = await response.text();
        console.log('[Debug] Raw response:', responseText);
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('[Debug] Parsed JSON:', responseData);
        } catch (parseError) {
          console.error('[Debug] JSON parse failed:', parseError);
          console.log('[Debug] Response was probably HTML error page');
          return;
        }
        
      } catch (error) {
        console.error('[Google Drive] Error:', error);
      }
    }
    
    setIsDirty(false);
  };

  const handleFieldChange = (fieldOrName, value) => {
    const fieldName = typeof fieldOrName === 'object' ? fieldOrName.name : fieldOrName;
    const field = typeof fieldOrName === 'object' ? fieldOrName : 
      config?.fields?.find(f => f.name === fieldOrName) || { name: fieldOrName };
    
    console.log(`Field change: ${fieldName} = `, value);

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

      setIsDirty(true);
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
    if (field.type === 'multiRelationship') {
      console.log('MultiRelationship field change:', { fieldName, value });
      
      if (value?.ids) {
        setLocalRecord(prev => ({
          ...prev,
          [fieldName]: value.ids,
          [`${fieldName}_details`]: value.details,
        }));
        
        setFormData(prev => ({
          ...prev,
          [fieldName]: value.ids,
          [`${fieldName}_details`]: value.details,
        }));
        
        setIsDirty(true);
        console.log(`Explicitly setting isDirty=true for ${fieldName} change`);
      } else if (Array.isArray(value)) {
        setLocalRecord(prev => ({
          ...prev,
          [fieldName]: value,
        }));
        
        setFormData(prev => ({
          ...prev,
          [fieldName]: value,
        }));
        
        setIsDirty(true);
        console.log(`Explicitly setting isDirty=true for ${fieldName} change`);
      }
      
      return;
    }
    
    // Special handling for select/status fields
    if (field.type === 'select' || field.type === 'status') {
      updateLocalValue(fieldName, value);
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: value
      }));
      
      return;
    }
    
    // Special handling for relationship fields
    if (field.type === 'relationship' && value !== null && value !== undefined) {
      if (typeof value === 'object' && value.id !== undefined) {
        updateLocalValue(fieldName, value.id);
        
        setFormData(prev => ({
          ...prev,
          [fieldName]: value.id
        }));
      } else {
        updateLocalValue(fieldName, value);
        
        setFormData(prev => ({
          ...prev,
          [fieldName]: value
        }));
      }
      return;
    }
    
    // Default handling for other field types
    updateLocalValue(fieldName, value);
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    setIsDirty(true);
  };
    
  const startEdit = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setTempValue(currentValue ?? '');
  };

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
          
          {/* Render content based on active tab */}
          {isTimelineTab && (
            <Box mt={2}>
              <TimelineView projectId={localRecord?.id} config={config} />
            </Box>
          )}

          {isContractTab && (
            <Box mt={2}>
              <ContractSectionsTab
                contractParts={contractParts}
                availableParts={availableParts}
                activeId={activeId}
                handleDragStart={handleDragStart}
                handleDragEndWrapper={handleDragEndWrapper}
                handleRemovePart={handleRemovePart}
                handleAddExistingPart={handleAddExistingPart}
                handleAddCustomPart={handleAddCustomPart}
              />
            </Box>
          )}

          {isRegularFormTab && (
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
        <Button 
          disabled={!isDirty && !hasChanges}
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