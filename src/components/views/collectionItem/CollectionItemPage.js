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
import { generateSupabaseSelect } from '@/lib/supabase/generateSupabaseSelect';
import { ViewButtons } from '@/components/buttons/ViewButtons';



export const CollectionItemPage = ({ 
  config, 
  record, 
  isModal = false, 
  onRefresh,
  onClose
 }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [localRecord, setLocalRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const initialValues = useRef(null);
  const [initialContractParts, setInitialContractParts] = useState([]);

  // Check if this is a contract before calling the hook
  const isContract = config?.name === 'contract';

  // Always call useContractBuilder, but conditionally use its values
const contractBuilderResult = useContractBuilder(localRecord?.id);


  
  // Only destructure the values we need if this is a contract
  // Add the handler from contractBuilderResult
const {
  contractParts = [],
  availableParts = [],
  handleDragEnd = () => {},
  handleAddExistingPart = () => {},
  handleAddCustomPart = () => {},
  handleRemovePart = () => {},
  handleAddAllRequired = () => {} // Add this line
} = isContract ? contractBuilderResult : {};

// Add a wrapper for the new handler
const handleAddAllRequiredWithDirty = () => {
  if (!isContract) return;
  
  console.log('[CollectionItemPage] Adding all required parts - setting dirty state');
  handleAddAllRequired();
  setIsDirty(true);
};

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

  // Add this useEffect to CollectionItemPage.js to load contract parts when editing
// Place this after your existing useEffects

useEffect(() => {
  // Load contract parts if this is a contract and we have a record ID
  if (isContract && localRecord?.id && contractBuilderResult) {
    console.log('[CollectionItemPage] Loading contract parts for contract ID:', localRecord.id);
    console.log('[CollectionItemPage] Builder loading state:', contractBuilderResult.loading);
    
    // Only proceed if the contract builder has finished its initial load
    if (contractBuilderResult.loading) {
      console.log('[CollectionItemPage] Contract builder still loading, waiting...');
      return;
    }
    
    const loadContractParts = async () => {
      try {
        const supabase = createClient();
        
        // Fetch contract parts with their order from pivot table
        console.log('[CollectionItemPage] Fetching contract parts from pivot table...');
        const { data: contractPartsData, error } = await supabase
          .from('contract_contractpart')
          .select(`
            order_index,
            contractpart (
              id,
              title,
              content,
              is_required,
              sort_order,
              created_at,
              updated_at
            )
          `)
          .eq('contract_id', localRecord.id)
          .order('order_index'); // This is the correct order!

        if (error) {
          console.error('[CollectionItemPage] Error loading contract parts:', error);
          setInitialContractParts([]);
          return;
        }

        console.log('[CollectionItemPage] Raw contract parts data from pivot:', contractPartsData);

        if (contractPartsData && contractPartsData.length > 0) {
          // Transform the data - USE the order_index from pivot table, NOT sort_order
          const parts = contractPartsData.map(cp => ({
            ...cp.contractpart,
            order_index: cp.order_index // This comes from pivot table!
          }));
          
          console.log('[CollectionItemPage] Transformed parts with pivot order:', parts.map(p => ({ 
            id: p.id, 
            title: p.title, 
            order_index: p.order_index,
            original_sort_order: p.sort_order
          })));
          
          // Set the contract parts in the builder
          if (contractBuilderResult && contractBuilderResult.setContractParts) {
            console.log('[CollectionItemPage] Setting contract parts via builder (ordered by pivot table)');
            contractBuilderResult.setContractParts(parts);
          }
          
          // Store initial state for comparison
          console.log('[CollectionItemPage] Setting initial contract parts state');
          setInitialContractParts(JSON.parse(JSON.stringify(parts)));
        } else {
          console.log('[CollectionItemPage] No contract parts found for this contract');
          setInitialContractParts([]);
          if (contractBuilderResult && contractBuilderResult.setContractParts) {
            contractBuilderResult.setContractParts([]);
          }
        }
        
      } catch (error) {
        console.error('[CollectionItemPage] Error loading contract parts:', error);
        setInitialContractParts([]);
      }
    };
    
    loadContractParts();
  }
}, [isContract, localRecord?.id, contractBuilderResult?.loading]); // Fixed dependency array



// 3. Add useEffect to track contract parts changes
useEffect(() => {
  // Load contract parts if this is a contract and we have a record ID
  if (isContract && localRecord?.id) {
    console.log('[CollectionItemPage] Loading contract parts for contract ID:', localRecord.id);
    console.log('[CollectionItemPage] contractBuilderResult available?', !!contractBuilderResult);
    console.log('[CollectionItemPage] setContractParts available?', !!contractBuilderResult.setContractParts);
    
    const loadContractParts = async () => {
      try {
        const supabase = createClient();
        
        // Fetch contract parts with their order
        const { data: contractPartsData, error } = await supabase
          .from('contract_contractpart')
          .select(`
            order_index,
            contractpart (
              id,
              title,
              content,
              is_required,
              sort_order,
              created_at,
              updated_at
            )
          `)
          .eq('contract_id', localRecord.id)
          .order('order_index');

        if (error) {
          console.error('[CollectionItemPage] Error loading contract parts:', error);
          setInitialContractParts([]); // Set empty array so we have a proper initial state
          return;
        }

        console.log('[CollectionItemPage] Raw contract parts data:', contractPartsData);

        if (contractPartsData && contractPartsData.length > 0) {
          // Transform the data to match the expected structure
          const parts = contractPartsData.map(cp => ({
            ...cp.contractpart,
            order_index: cp.order_index
          }));
          
          console.log('[CollectionItemPage] Loaded contract parts:', parts.map(p => ({ 
            id: p.id, 
            title: p.title, 
            order_index: p.order_index 
          })));
          
          // Set the contract parts in the builder - use direct state setter if available
          if (contractBuilderResult && contractBuilderResult.setContractParts) {
            console.log('[CollectionItemPage] Setting contract parts via builder');
            contractBuilderResult.setContractParts(parts);
          } else {
            console.warn('[CollectionItemPage] contractBuilderResult.setContractParts not available');
          }
          
          // Store initial state for comparison - this is crucial!
          console.log('[CollectionItemPage] Setting initial contract parts state');
          setInitialContractParts(JSON.parse(JSON.stringify(parts)));
        } else {
          console.log('[CollectionItemPage] No contract parts found for this contract');
          // Important: Set empty arrays for both states
          setInitialContractParts([]);
          if (contractBuilderResult && contractBuilderResult.setContractParts) {
            contractBuilderResult.setContractParts([]);
          }
        }
        
      } catch (error) {
        console.error('[CollectionItemPage] Error loading contract parts:', error);
        setInitialContractParts([]); // Ensure we always have an initial state
      }
    };
    
    loadContractParts();
  } else if (isContract && !localRecord?.id) {
    console.log('[CollectionItemPage] Contract detected but no record ID yet');
    // Reset states when no record ID
    setInitialContractParts([]);
  }
}, [isContract, localRecord?.id]); // Remove the dependency on contractBuilderResult.setContractParts

// Also add a separate useEffect to sync when contractBuilderResult becomes available
useEffect(() => {
  if (isContract && contractParts.length > 0 && initialContractParts.length === 0) {
    console.log('[CollectionItemPage] ContractBuilder result changed, syncing initial state');
    console.log('[CollectionItemPage] Current contractParts:', contractParts.length);
    
    // If we have contract parts but no initial state, set it now
    setInitialContractParts(JSON.parse(JSON.stringify(contractParts)));
  }
}, [contractBuilderResult, isContract, contractParts, initialContractParts.length]);

// Fix the contract parts comparison useEffect
useEffect(() => {
  if (!isContract) return;
  
  console.log('[CollectionItemPage] === CONTRACT PARTS COMPARISON ===');
  console.log('[CollectionItemPage] Current parts count:', contractParts.length);
  console.log('[CollectionItemPage] Initial parts count:', initialContractParts.length);
  
  // Don't compare if we don't have initial state yet
  if (initialContractParts.length === 0 && contractParts.length > 0) {
    console.log('[CollectionItemPage] Still loading initial state, skipping comparison');
    return;
  }
  
  // Compare current contract parts with initial state
  const currentPartsString = JSON.stringify(contractParts.map(p => ({
    id: p.id,
    title: p.title,
    content: p.content,
    order_index: p.order_index
  })));
  
  const initialPartsString = JSON.stringify(initialContractParts.map(p => ({
    id: p.id,
    title: p.title,
    content: p.content,
    order_index: p.order_index
  })));
  
  const contractPartsChanged = currentPartsString !== initialPartsString;
  
  console.log('[CollectionItemPage] Contract parts changed?', contractPartsChanged);
  console.log('[CollectionItemPage] Current hash:', currentPartsString.substring(0, 100) + '...');
  console.log('[CollectionItemPage] Initial hash:', initialPartsString.substring(0, 100) + '...');
  
  if (contractPartsChanged && !isDirty) {
    console.log('[CollectionItemPage] Setting isDirty=true due to contract parts changes');
    setIsDirty(true);
  } else if (!contractPartsChanged && isDirty) {
    console.log('[CollectionItemPage] Parts match initial state, but isDirty is still true');
  }
  
}, [contractParts, initialContractParts, isDirty, isContract]);

// 4. Wrap the contract-specific drag handlers to also set dirty state
const handleDragStartWithDirty = ({ active }) => {
  if (!isContract) return;
  setActiveId(active.id);
  handleDragStart({ active });
};

const handleDragEndWrapperWithDirty = (event) => {
  if (!isContract) return;
  
  console.log('[CollectionItemPage] Drag ended - setting dirty state');
  handleDragEnd(event);
  setActiveId(null);
  
  // Set dirty after a brief delay to allow state to update
  setTimeout(() => {
    setIsDirty(true);
  }, 100);
};

const handleAddExistingPartWithDirty = (part) => {
  if (!isContract) return;
  
  console.log('[CollectionItemPage] Adding existing part - setting dirty state');
  handleAddExistingPart(part);
  setIsDirty(true);
};

const handleAddCustomPartWithDirty = () => {
  if (!isContract) return;
  
  console.log('[CollectionItemPage] Adding custom part - setting dirty state');
  handleAddCustomPart();
  setIsDirty(true);
};

const handleRemovePartWithDirty = (partId) => {
  if (!isContract) return;
  
  console.log('[CollectionItemPage] Removing part - setting dirty state');
  handleRemovePart(partId);
  setIsDirty(true);
};


// Make sure to import createClient at the top if not already imported:
// import { createClient } from '@/lib/supabase/browser';
  
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
  console.log('[CollectionItemPage] ========== SAVE PROCESS STARTING ==========');
  console.log('[CollectionItemPage] Is contract?', isContract);
  console.log('[CollectionItemPage] Contract parts count:', contractParts.length);
  console.log('[CollectionItemPage] Contract parts:', contractParts.map(p => ({ 
    id: p.id, 
    title: p.title, 
    order_index: p.order_index 
  })));

  // Save the main record first
  console.log('[CollectionItemPage] Saving main record...');
  const result = await saveRecord();
  
  if (!result) {
    console.error('[CollectionItemPage] Main record save failed');
    return;
  }

  console.log('[CollectionItemPage] Main record saved successfully:', result);

  // If this is a contract, also save the contract parts
  if (isContract && contractParts.length > 0 && localRecord?.id) {
    console.log('[CollectionItemPage] Saving contract parts for contract ID:', localRecord.id);
    
    try {
      const supabase = createClient();
      
      // Delete existing relationships
      console.log('[CollectionItemPage] Deleting existing contract parts relationships...');
      const { error: deleteError } = await supabase
        .from('contract_contractpart')
        .delete()
        .eq('contract_id', localRecord.id);

      if (deleteError) {
        console.error('[CollectionItemPage] Error deleting existing relationships:', deleteError);
        // Don't return here - try to continue with insert
      } else {
        console.log('[CollectionItemPage] Existing relationships deleted successfully');
      }

      // Create new relationships
      console.log('[CollectionItemPage] Creating new contract parts relationships...');
      const pivotData = contractParts.map(part => {
        const pivotRecord = {
          contract_id: localRecord.id,
          contractpart_id: part.id,
          order_index: part.order_index
        };
        console.log('[CollectionItemPage] Pivot record for part:', part.title, pivotRecord);
        return pivotRecord;
      });

      console.log('[CollectionItemPage] All pivot data:', pivotData);

      const { error: pivotError, data: pivotResult } = await supabase
        .from('contract_contractpart')
        .insert(pivotData)
        .select();

      if (pivotError) {
        console.error('[CollectionItemPage] Error saving contract parts:', pivotError);
        console.error('[CollectionItemPage] Pivot error details:', JSON.stringify(pivotError, null, 2));
        // You might want to show an error toast here
        alert('Contract saved but failed to save sections: ' + pivotError.message);
      } else {
        console.log('[CollectionItemPage] Contract parts saved successfully:', pivotResult);
        console.log('[CollectionItemPage] Saved', pivotResult.length, 'contract part relationships');
      }

    } catch (error) {
      console.error('[CollectionItemPage] Unexpected error saving contract parts:', error);
      alert('Contract saved but failed to save sections: ' + error.message);
    }
  }

  // Handle other logic (Google Drive, etc.)
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
  console.log('[CollectionItemPage] ========== SAVE PROCESS COMPLETED ==========');
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
                handleDragStart={handleDragStartWithDirty}
                handleDragEndWrapper={handleDragEndWrapperWithDirty}
                handleRemovePart={handleRemovePartWithDirty}
                handleAddExistingPart={handleAddExistingPartWithDirty}
                handleAddCustomPart={handleAddCustomPartWithDirty}
                handleAddAllRequired={handleAddAllRequiredWithDirty}
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

      <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', mt: 2 }}>
        {/* ViewButtons - only show if we have a record with an ID */}
        {localRecord?.id && (
          <ViewButtons 
            config={config}
            id={localRecord.id}
            record={localRecord}
            onRefresh={() => {
              console.log('Record updated, refresh triggered');
              
              // If in modal, close it first (if onClose callback provided)
              if (isModal && onClose) {
                onClose();
              }
              
              // Then trigger parent refresh
              if (onRefresh) {
                // Small delay to ensure modal closes first
                setTimeout(() => {
                  onRefresh();
                }, 100);
              }
            }}
            showModal={!isModal} // Hide modal button if already in modal
            showFullView={true} // Always show full view option
            isInModal={isModal} // Pass modal context to ViewButtons
          />
        )}
                
        {/* Save button on the right */}
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