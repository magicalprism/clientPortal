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
// Import kanban components
const ProjectKanbanBoard = dynamic(() => import('@/components/kanban/ProjectKanbanBoard').then(mod => mod.default || mod.ProjectKanbanBoard), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
        Loading kanban board...
      </Typography>
    </Box>
  ),
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

import * as collections from '@/collections';



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


    // Kanban state
  const [kanbanMode, setKanbanMode] = useState('milestone');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  // Check if this is a contract before calling the hook
  const isContract = config?.name === 'contract';

    // Check if kanban is enabled for this collection
  const hasKanbanTab = config?.showKanbanTab === true || config?.kanban?.enabled === true;
  const kanbanConfig = config?.kanban || {};
   // Get task configuration for kanban
  const taskConfig = kanbanConfig.taskConfig ? collections[kanbanConfig.taskConfig] : collections.task;



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
    // Only proceed if the contract builder has finished its initial load
    if (contractBuilderResult.loading) {
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
    // If we have contract parts but no initial state, set it now
    setInitialContractParts(JSON.parse(JSON.stringify(contractParts)));
  }
}, [contractBuilderResult, isContract, contractParts, initialContractParts.length]);

// Fix the contract parts comparison useEffect
useEffect(() => {
  if (!isContract) return;
  
  // Don't compare if we don't have initial state yet
  if (initialContractParts.length === 0 && contractParts.length > 0) {
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

// Initialize kanban mode from config
  useEffect(() => {
    if (hasKanbanTab && kanbanConfig.defaultMode) {
      setKanbanMode(kanbanConfig.defaultMode);
    }
    if (hasKanbanTab && kanbanConfig.defaultShowCompleted !== undefined) {
      setShowCompletedTasks(kanbanConfig.defaultShowCompleted);
    }
  }, [hasKanbanTab, kanbanConfig]);


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
  // ✅ FIX: Correct tab ordering logic
  const tabNames = [...baseTabs.tabNames];
  let currentTabIndex = baseTabs.tabNames.length;

  // Add tabs in this specific order: contract -> kanban -> timeline
  if (isContract) {
    tabNames.push('Contract Sections');
    currentTabIndex++;
  }
  
  if (hasKanbanTab) {
    tabNames.push('Kanban Board');
    currentTabIndex++;
  }
  
  if (showTimelineTab) {
    tabNames.push('Timeline');
    currentTabIndex++;
  }

  // Determine which tab we're on
  let tabIndex = baseTabs.tabNames.length;
  const contractTabIndex = isContract ? tabIndex++ : -1;
  const kanbanTabIndex = hasKanbanTab ? tabIndex++ : -1;
  const timelineTabIndex = showTimelineTab ? tabIndex++ : -1;
  
  const isContractTab = isContract && activeTab === contractTabIndex;
  const isKanbanTab = hasKanbanTab && activeTab === kanbanTabIndex;
  const isTimelineTab = showTimelineTab && activeTab === timelineTabIndex;
  const isRegularFormTab = !isContractTab && !isKanbanTab && !isTimelineTab;

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

  const result = await saveRecord();
  
  if (!result) {

    return;
  }



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

        // Don't return here - try to continue with insert
      } else {
 
      }

      // Create new relationships

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

        // You might want to show an error toast here
        alert('Contract saved but failed to save sections: ' + pivotError.message);
      } else {

      }

    } catch (error) {

      alert('Contract saved but failed to save sections: ' + error.message);
    }
  }

  // Handle other logic (Google Drive, etc.)
  if (config?.name === 'element') {

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

      
      const responseText = await response.text();

      
      let responseData;
      try {
        responseData = JSON.parse(responseText);

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

 // Kanban mode toggle handler
  const handleKanbanModeChange = (newMode) => {
    setKanbanMode(newMode);
  };

  const handleShowCompletedToggle = () => {
    setShowCompletedTasks(prev => !prev);
  };




    return (
    <>
      <Card elevation={0}>
        {/* ViewButtons - only show if we have a record with an ID */}
        {localRecord?.id && (
          <ViewButtons 
            config={config}
            id={localRecord.id}
            record={localRecord}
            onRefresh={() => {
              console.log('Record updated, refresh triggered');
              
              if (isModal && onClose) {
                onClose();
              }
              
              if (onRefresh) {
                setTimeout(() => {
                  onRefresh();
                }, 100);
              }
            }}
            showModal={!isModal}
            showFullView={true}
            isInModal={isModal}
          />
        )}
        
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
          
          {/* ✅ FIX: Render content based on correct tab logic */}
          
          {/* Contract Tab */}
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
                handleAddAllRequired={handleAddAllRequiredWithDirty}
              />
            </Box>
          )}

          {/* Kanban Tab */}
          {isKanbanTab && localRecord?.id && (
            <Box mt={2}>
              {/* Kanban Controls */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Typography variant="h6">
                  Task Board
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {/* Mode Toggle */}
                  {kanbanConfig.modes && kanbanConfig.modes.length > 1 && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {kanbanConfig.modes.map((mode) => (
                        <Button
                          key={mode}
                          size="small"
                          variant={kanbanMode === mode ? 'contained' : 'outlined'}
                          onClick={() => handleKanbanModeChange(mode)}
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {mode}
                        </Button>
                      ))}
                    </Box>
                  )}
                  
                  {/* Show Completed Toggle */}
                  <Button
                    size="small"
                    variant={showCompletedTasks ? 'contained' : 'outlined'}
                    onClick={handleShowCompletedToggle}
                  >
                    {showCompletedTasks ? 'Hide' : 'Show'} Completed
                  </Button>
                </Box>
              </Box>

              {/* Kanban Board */}
              <ProjectKanbanBoard
                projectId={localRecord.id}
                mode={kanbanMode}
                showCompleted={showCompletedTasks}
                embedded={false}
                config={taskConfig}
              />
            </Box>
          )}

          {/* Timeline Tab */}
          {isTimelineTab && (
            <Box mt={2}>
              <TimelineView projectId={localRecord?.id} config={config} />
            </Box>
          )}

          {/* Regular Form Tabs */}
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