'use client';
import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Eye, FloppyDisk } from '@phosphor-icons/react';
import { ContractPartCard } from '@/components/dashboard/contract/parts/ContractPartCard';
import { AvailablePartsSidebar } from '@/components/dashboard/contract/parts/AvailablePartsSidebar';
import { ContractPreviewModal } from '@/components/dashboard/contract/ContractPreviewModal';
import { useContractBuilder } from '@/components/dashboard/contract/useContractBuilder';
import { FieldRenderer } from '@/components/FieldRenderer';
import { ModalMultiRelationshipField } from '@/components/fields/relationships/multi/ModalMultiRelationshipField';
import { createClient } from '@/lib/supabase/browser';
import { extractSelectValue } from '@/components/fields/select/SelectField';
import { ContractSectionsTab } from '@/components/dashboard/contract/ContractSectionsTab';


const ContractCreateForm = ({ config, onSave = () => {}, onCancel = () => {} }) => {
  const supabase = createClient();
  const [showPreview, setShowPreview] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize form data with default values
  const [formData, setFormData] = useState(() => ({
    title: '',
    status: 'draft',
    products: [], // Initialize as empty array
    selectedMilestones: [], // Initialize as empty array
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

    console.log('[ContractCreateForm] Render - formData:', formData);
  console.log('[ContractCreateForm] Render - showPreview:', showPreview);

  const {
    contractParts,
    availableParts,
    loading: partsLoading,
    errors: partErrors,
    compiledContent,
    handleDragEnd,
    handleAddExistingPart,
    handleAddCustomPart,
    handleRemovePart,
    compileContentWithData
  } = useContractBuilder();

    // Add this debugging
  console.log('[ContractCreateForm] useContractBuilder returned:', {
    contractPartsLength: contractParts?.length,
    partsLoading
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  // Fetch related data for template compilation
// Fetch related data for template compilation
const fetchRelatedData = useCallback(async () => {
  console.log('[fetchRelatedData] Called with formData:', formData);
  
  const relatedData = {};
  
  try {
    console.log('[Fetch Debug] Starting to fetch related data...');
    
    // Fetch selectedMilestones if the field exists and has values
    const milestonesField = config?.fields?.find(f => f.name === 'selectedMilestones');
    if (milestonesField?.relation && formData.selectedMilestones?.length > 0) {
      const { data: milestones, error: milestonesError } = await supabase
        .from(milestonesField.relation.table)
        .select('id, title, description, sort_order') // Added sort_order
        .in('id', formData.selectedMilestones)
        .order('sort_order', { ascending: true }); // Added ordering
      
      if (!milestonesError && milestones) {
        relatedData.selectedMilestones = milestones;
      }
    }
    
    // Fetch products with deliverables if the field exists and has values
    const productsField = config?.fields?.find(f => f.name === 'products');
    if (productsField?.relation && formData.products?.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from(productsField.relation.table)
        .select('id, title, description, price')
        .in('id', formData.products);
      
      if (!productsError && products?.length > 0) {
        // Fetch deliverables for each product
        const productsWithDeliverables = await Promise.all(
          products.map(async (product) => {
            try {
              // Query the junction table (alphabetical naming: deliverable_product)
              const { data: junctionData, error: junctionError } = await supabase
                .from('deliverable_product')
                .select('deliverable_id')
                .eq('product_id', product.id);
              
              if (!junctionError && junctionData?.length > 0) {
                const deliverableIds = junctionData.map(item => item.deliverable_id);
                
                const { data: deliverables, error: deliverablesError } = await supabase
                  .from('deliverable')
                  .select('id, title')
                  .in('id', deliverableIds);
                
                if (!deliverablesError) {
                  return { ...product, deliverables: deliverables || [] };
                }
              }
              
              return { ...product, deliverables: [] };
            } catch (error) {
              console.error('[Fetch Debug] Error fetching deliverables for product', product.id, ':', error);
              return { ...product, deliverables: [] };
            }
          })
        );
        
        relatedData.products = productsWithDeliverables;
      }
    }
    
    // For new contracts being created, payments will be empty
    relatedData.payments = [];
    console.log('[Fetch Debug] New contract - no payments yet');
    
    console.log('[Fetch Debug] Final related data:', relatedData);
    return relatedData;
    
  } catch (error) {
    console.error('[Fetch Debug] Error in fetchRelatedData:', error);
    return relatedData;
  }
}, [formData, config, supabase]);




  // Handle form field changes
 const handleChange = useCallback((fieldName, value) => {
    console.log(`[ContractCreateForm] Field ${fieldName} changed:`, value);
    
    const fieldDef = config?.fields?.find(f => f.name === fieldName);
    
    if (!fieldDef) {
      console.warn(`[ContractCreateForm] No field definition found for ${fieldName}`);
      setFormData(prev => ({ ...prev, [fieldName]: value }));
      return;
    }
    
    // Handle different field types
    if (fieldDef.type === 'select' || fieldDef.type === 'status') {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    } else if (fieldDef.type === 'relationship') {
      if (value && typeof value === 'object' && value.id !== undefined) {
        setFormData(prev => ({ ...prev, [fieldName]: value.id }));
      } else {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
      }
    } else if (fieldDef.type === 'multiRelationship') {
      handleMultiRelationshipChange(fieldName, value);
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    }
  }, [config]); // Only recreate if config changes




  // Handle multiRelationship changes
    const handleMultiRelationshipChange = useCallback((fieldName, value) => {
    console.log(`[ContractCreateForm] MultiRelationship field ${fieldName} changed:`, value);
    
    setFormData(prev => {
      if (Array.isArray(value)) {
        return {
          ...prev,
          [fieldName]: value.map(String).filter(Boolean)
        };
      } else if (value && (value.ids || value.details)) {
        return {
          ...prev,
          [fieldName]: (value.ids || []).map(String).filter(Boolean),
          [`${fieldName}_details`]: value.details || []
        };
      }
      return prev;
    });
  }, []);

  // Handle save
  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare clean data for database
      const cleanData = {};
      const fields = config?.fields || [];
      
      fields.forEach(field => {
        const { name, type } = field;

        // Skip virtual fields
        if (type === 'multiRelationship' || type === 'custom') return;

        const value = formData[name];

        if ((type === 'select' || type === 'status') && value) {
          cleanData[name] = extractSelectValue(value);
        } else {
          cleanData[name] = value;
        }
      });

      // Fetch related data for template compilation
      const relatedData = await fetchRelatedData();
      
      // Compile content with template variables replaced
      const compiledContentWithData = compileContentWithData(formData, relatedData);
      cleanData.content = compiledContentWithData;
      
      console.log('[ContractCreateForm] Submitting clean data:', cleanData);
      
      // Save the main contract record
      const { data: contract, error: contractError } = await supabase
        .from(config.name)
        .insert([cleanData])
        .select()
        .single();
      
      if (contractError) {
        console.error('[ContractCreateForm] Error saving contract:', contractError);
        setError(contractError.message);
        setLoading(false);
        return;
      }
      
      console.log('[ContractCreateForm] Contract saved successfully:', contract);
      
      // Save contract parts relationships
      if (contractParts.length > 0 && contract?.id) {
        // Delete any existing relationships (shouldn't be any for new records)
        await supabase
          .from('contract_contractpart')
          .delete()
          .eq('contract_id', contract.id);

        // Create new relationships
        const pivotData = contractParts.map(part => ({
          contract_id: contract.id,
          contractpart_id: part.id,
          order_index: part.order_index
        }));

        const { error: pivotError } = await supabase
          .from('contract_contractpart')
          .insert(pivotData);

        if (pivotError) {
          console.error('[ContractCreateForm] Error saving contract parts:', pivotError);
          setError('Contract saved but failed to save sections');
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      onSave(contract);
      
    } catch (err) {
      console.error('Unexpected error saving contract:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragEndWrapper = (event) => {
    handleDragEnd(event);
    setActiveId(null);
  };

  const activeItem = activeId ? contractParts.find(part => `part-${part.id}` === activeId) : null;

  if (partsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const fields = config?.fields || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box mb={4}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Create New Contract
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Fill in contract details and organize sections
            </Typography>
          </Box>

          {/* Error Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {partErrors.parts && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {partErrors.parts}
            </Alert>
          )}

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Contract Details" />
            <Tab label="Contract Sections" />
          </Tabs>

          {/* Tab Content */}
          {activeTab === 0 ? (
            /* Contract Details Tab */
            <Box>
              <Grid container spacing={3}>
                {fields
                  .filter((field) => !['created_at', 'updated_at'].includes(field.name))
                  .map((field) => {
                    const isMultiRel = field.type === 'multiRelationship';

                    return (
                      <Grid item xs={12} key={field.name}>
                        <Box display="flex" flexDirection="column">
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {field.label}
                            </Typography>
                            {field.description && (
                              <Typography variant="caption" color="text.secondary">
                                {field.description}
                              </Typography>
                            )}
                          </Box>

                          {isMultiRel ? (
                            <ModalMultiRelationshipField
                              field={field}
                              record={formData}
                              setRecord={setFormData}
                              config={config}
                              onChange={handleChange}
                              hideLabel={true}
                            />
                          ) : (
                            <FieldRenderer
                              field={field}
                              value={formData[field.name] || (field.type === 'multiRelationship' ? [] : '')}
                              record={formData}
                              config={config}
                              mode="create"
                              editable
                              onChange={handleChange}
                              key={field.name} // Add key to prevent unnecessary re-renders
                            />
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
              </Grid>
            </Box>
          ) : (
            /* Contract Sections Tab */
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
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <FloppyDisk />}
              onClick={handleSave}
              disabled={loading || !formData.title}
            >
              {loading ? 'Saving...' : 'Save Contract'}
            </Button>
            <Button
                variant="outlined"
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const relatedData = await fetchRelatedData();
                    const regeneratedContent = compileContentWithData(formData, relatedData);
                    setFormData(prev => ({
                      ...prev,
                      content: regeneratedContent
                    }));
                  } catch (err) {
                    console.error('[Regenerate] Failed:', err);
                    setError('Failed to regenerate content. See console for details.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                Regenerate Content
              </Button>

          </Stack>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <ContractPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={formData.title}
        compiledContent={compileContentWithData(formData, {})}
      />
    </Container>
  );
};

export default ContractCreateForm;