'use client';
import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { contractOps } from '@/lib/supabase/queries';
import {
  useMediaQuery, Card, CardContent, Tabs, Tab, Grid, Divider,
  Typography, TextField, CircularProgress, Box, IconButton, Button
} from '@mui/material';

const CollectionView = dynamic(() => import('@/components/views/CollectionView'), {
  ssr: false,
  loading: () => <div>Loading collection...</div>,
});

const ProjectKanbanBoard = dynamic(() => import('@/components/views/kanban/ProjectKanbanBoard').then(mod => mod.default || mod.ProjectKanbanBoard), {
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
import { useConditionalFields } from '@/hooks/fields/useConditionalFields';
import { useCollectionSave } from '@/hooks/useCollectionSave';
import TimelineView from '@/components/fields/custom/timeline/TimelineView';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { CollectionItemForm } from '@/components/views/collectionItem/CollectionItemForm';
import { ContractSectionsTab } from '@/components/dashboard/contract/ContractSectionsTab';
import { useContractBuilder } from '@/components/dashboard/contract/useContractBuilder';
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
  
  // Check if this is a contract
  const isContract = config?.name === 'contract';

  // Check if kanban is enabled for this collection
  const hasKanbanTab = config?.showKanbanTab === true || config?.kanban?.enabled === true;
  const kanbanConfig = config?.kanban || {};
  const taskConfig = kanbanConfig.taskConfig ? collections[kanbanConfig.taskConfig] : collections.task;

  // Contract builder hook
  const contractBuilderResult = useContractBuilder(localRecord?.id);

  // Conditional fields hook for tab-level filtering
  const { 
    isTabVisible, 
    visibleTabs 
  } = useConditionalFields(config, formData || localRecord || {});
  
  // Destructure contract builder values only if this is a contract
  const {
    contractParts = [],
    availableParts = [],
    handleDragEnd = () => {},
    handleAddExistingPart = () => {},
    handleAddCustomPart = () => {},
    handleRemovePart = () => {},
    handleAddAllRequired = () => {}
  } = isContract ? contractBuilderResult : {};

  const [activeId, setActiveId] = useState(null);

  // Sync localRecord with formData when localRecord changes
  useEffect(() => {
    if (localRecord) {
      setFormData(localRecord);
      initialValues.current = JSON.parse(JSON.stringify(localRecord));
    }
  }, [localRecord]);

  // Fetch elements for the project when it loads (if applicable)
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

  // Load contract parts when editing (using extracted operation)
  useEffect(() => {
    if (isContract && localRecord?.id && contractBuilderResult && !contractBuilderResult.loading) {
      const loadContractParts = async () => {
        console.log('[CollectionItemPage] Loading contract parts using extracted operation...');
        
        const result = await contractOps.fetchContractPartsForContract(localRecord.id);
        
        if (!result.success) {
          console.error('[CollectionItemPage] Error loading contract parts:', result.error);
          setInitialContractParts([]);
          return;
        }

        const parts = result.data || [];
        console.log(`[CollectionItemPage] Loaded ${parts.length} contract parts`);
        
        // Set the contract parts in the builder
        if (contractBuilderResult?.setContractParts) {
          console.log('[CollectionItemPage] Setting contract parts via builder');
          contractBuilderResult.setContractParts(parts);
        }
        
        // Store initial state for comparison
        setInitialContractParts(JSON.parse(JSON.stringify(parts)));
      };
      
      loadContractParts();
    } else if (isContract && !localRecord?.id) {
      // Reset states when no record ID
      setInitialContractParts([]);
    }
  }, [isContract, localRecord?.id, contractBuilderResult?.loading]);

  // Sync initial contract parts when builder becomes available
  useEffect(() => {
    if (isContract && contractParts.length > 0 && initialContractParts.length === 0) {
      setInitialContractParts(JSON.parse(JSON.stringify(contractParts)));
    }
  }, [isContract, contractParts, initialContractParts.length]);

  // Track contract parts changes for dirty state
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
    }
  }, [contractParts, initialContractParts, isDirty, isContract]);

  // Initialize kanban mode from config
  useEffect(() => {
    if (hasKanbanTab && kanbanConfig.defaultMode) {
      setKanbanMode(kanbanConfig.defaultMode);
    }
    if (hasKanbanTab && kanbanConfig.defaultShowCompleted !== undefined) {
      setShowCompletedTasks(kanbanConfig.defaultShowCompleted);
    }
  }, [hasKanbanTab, kanbanConfig]);

  // Collection save hook
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

  // Contract-specific drag handlers with dirty state tracking
  const handleDragStart = ({ active }) => {
    if (!isContract) return;
    setActiveId(active.id);
  };

  const handleDragEndWrapper = (event) => {
    if (!isContract) return;
    
    console.log('[CollectionItemPage] Drag ended - setting dirty state');
    handleDragEnd(event);
    setActiveId(null);
    
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

  const handleAddAllRequiredWithDirty = () => {
    if (!isContract) return;
    
    console.log('[CollectionItemPage] Adding all required parts - setting dirty state');
    handleAddAllRequired();
    setIsDirty(true);
  };

  // Build filtered tab names with conditional visibility
  const buildVisibleTabs = () => {
    // Start with base tabs - only filter if they have conditional rules
    const filteredBaseTabs = baseTabs.tabNames.filter(tabName => {
      const tabConfig = config?.tabs?.[tabName];
      if (!tabConfig?.showWhen && !tabConfig?.hideWhen) {
        return true; // Always show tabs without conditions
      }
      return isTabVisible(tabName);
    });
    
    let allTabs = [...filteredBaseTabs];
    
    // Add special tabs if they should be visible
    if (isContract) {
      if (!config?.contractTab?.showWhen && !config?.contractTab?.hideWhen) {
        allTabs.push('Contract Sections');
      } else if (isTabVisible('Contract Sections')) {
        allTabs.push('Contract Sections');
      }
    }
    
    if (hasKanbanTab) {
      if (!config?.kanbanTab?.showWhen && !config?.kanbanTab?.hideWhen) {
        allTabs.push('Kanban Board');
      } else if (isTabVisible('Kanban Board')) {
        allTabs.push('Kanban Board');
      }
    }
    
    if (showTimelineTab) {
      if (!config?.timelineTab?.showWhen && !config?.timelineTab?.hideWhen) {
        allTabs.push('Timeline');
      } else if (isTabVisible('Timeline')) {
        allTabs.push('Timeline');
      }
    }
    
    return allTabs;
  };

  const visibleTabNames = buildVisibleTabs();

  // Handle active tab validation and auto-switching
  useEffect(() => {
    if (activeTab >= visibleTabNames.length && visibleTabNames.length > 0) {
      setActiveTab(0);
    }
  }, [visibleTabNames.length, activeTab]);

  // Tab determination logic
  const getTabType = (tabIndex) => {
    if (tabIndex >= visibleTabNames.length) return 'none';
    
    const tabName = visibleTabNames[tabIndex];
    
    if (tabName === 'Contract Sections') return 'contract';
    if (tabName === 'Kanban Board') return 'kanban';  
    if (tabName === 'Timeline') return 'timeline';
    return 'form';
  };

  const currentTabType = getTabType(activeTab);
  const isContractTab = currentTabType === 'contract';
  const isKanbanTab = currentTabType === 'kanban';
  const isTimelineTab = currentTabType === 'timeline';
  const isRegularFormTab = currentTabType === 'form';

  // Simplified save handler using extracted operations
  const handleSave = async () => {
    console.log('[CollectionItemPage] ========== SAVE PROCESS STARTING ==========');
    console.log('[CollectionItemPage] Is contract?', isContract);

    // Save the main record first (this includes Drive operations via the hook)
    const result = await saveRecord();
    
    if (!result) {
      console.error('[CollectionItemPage] Main record save failed');
      return;
    }

    // If this is a contract, save the contract parts using extracted operation
    if (isContract && localRecord?.id) {
      console.log('[CollectionItemPage] Saving contract parts for contract ID:', localRecord.id);
      
      const contractSaveResult = await contractOps.saveContractPartsForContract(
        localRecord.id, 
        contractParts
      );

      if (!contractSaveResult.success) {
        console.error('[CollectionItemPage] Failed to save contract parts:', contractSaveResult.error);
        alert('Contract saved but failed to save sections: ' + contractSaveResult.error);
      } else {
        console.log('[CollectionItemPage] Contract parts saved successfully');
        // Update initial state after successful save
        setInitialContractParts(JSON.parse(JSON.stringify(contractParts)));
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

  // Kanban mode handlers
  const handleKanbanModeChange = (newMode) => {
    setKanbanMode(newMode);
  };

  const handleShowCompletedToggle = () => {
    setShowCompletedTasks(prev => !prev);
  };

  // Show message if no tabs are visible
  if (visibleTabNames.length === 0) {
    return (
      <Card elevation={0}>
        <CardContent>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No tabs are available based on current field values.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card elevation={0}>
        {/* ViewButtons - only show if we have a record with an ID */}
        {isModal && localRecord?.id && (
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
          {/* Only render tabs if there are multiple visible tabs */}
          {visibleTabNames.length > 1 && (
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ mb: 3 }}
              variant="scrollable"
            >
              {visibleTabNames.map((tabName, index) => (
                <Tab key={index} label={tabName} />
              ))}
            </Tabs>
          )}
          
          {/* Contract Tab */}
          {isContractTab && (
            <Box mt={2}>
              <ContractSectionsTab
                contractParts={contractParts}
                availableParts={availableParts}
                activeId={activeId}
                handleDragStart={handleDragStart}
                handleDragEndWrapper={handleDragEndWrapper}
                handleRemovePart={handleRemovePartWithDirty}
                handleAddExistingPart={handleAddExistingPartWithDirty}
                handleAddCustomPart={handleAddCustomPartWithDirty}
                handleAddAllRequired={handleAddAllRequiredWithDirty}
              />
            </Box>
          )}

          {/* Kanban Tab */}
          {isKanbanTab && localRecord?.id && (
            <Box mt={2}>
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
              activeTab={baseTabs.tabNames.indexOf(visibleTabNames[activeTab])}
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