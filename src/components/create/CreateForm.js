'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Button, Grid, Typography, Tabs, Tab, Card, CardContent, Container, Paper } from '@mui/material';
import { createClient } from '@/lib/supabase/browser';
import { FieldRenderer } from '@/components/FieldRenderer';
import { useRouter } from 'next/navigation';
import { ModalMultiRelationshipField } from '@/components/fields/relationships/multi/ModalMultiRelationshipField';
import { saveMultiRelationships } from '@/lib/utils/multirelationshipUtils';
import { extractSelectValue } from '@/components/fields/select/SelectField';
import { Eye, FloppyDisk } from '@phosphor-icons/react';

// Contract-specific imports
import { ContractPartCard } from '@/components/dashboard/contract/parts/ContractPartCard';
import { AvailablePartsSidebar } from '@/components/dashboard/contract/parts/AvailablePartsSidebar';
import { ContractPreviewModal } from '@/components/dashboard/contract/ContractPreviewModal';
import { useContractBuilder } from '@/components/dashboard/contract/useContractBuilder';
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

const CreateForm = ({ 
  config, 
  initialRecord = {}, 
  onSuccess, 
  disableRedirect = false, 
  refreshRecord,
  onCancel
}) => {
  const supabase = createClient();
  const router = useRouter();

  const table = config?.name;
  const fields = config?.fields || [];
  const isContract = table === 'contract'; // Detect if this is a contract

  // Contract-specific state
  const [activeTab, setActiveTab] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [activeId, setActiveId] = useState(null);

  // Contract builder hook (only for contracts)
  const contractBuilder = isContract ? useContractBuilder() : null;
  const {
    contractParts = [],
    availableParts = [],
    loading: partsLoading = false,
    errors: partErrors = {},
    handleDragEnd,
    handleAddExistingPart,
    handleAddCustomPart,
    handleRemovePart,
    compileContentWithData
  } = contractBuilder || {};

  // DnD sensors for contract sections
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  if (!table || fields.length === 0) {
    return <Typography color="error">Invalid config: missing table name or fields</Typography>;
  }

  // Process initial record
  const processedInitialRecord = useMemo(() => {
    const processed = { ...initialRecord };
    
    if (!processed.created_at) {
      processed.created_at = new Date().toISOString();
    }
    if (!processed.updated_at) {
      processed.updated_at = new Date().toISOString();
    }
    
    fields.forEach(field => {
      if (field.type === 'multiRelationship' && !processed[field.name]) {
        processed[field.name] = [];
      }
      
      if ((field.type === 'select' || field.type === 'status') && !processed[field.name] && field.defaultValue) {
        processed[field.name] = field.defaultValue;
      }
    });

    return processed;
  }, [initialRecord, fields]);

  const [formData, setFormData] = useState(() => processedInitialRecord);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = useCallback((fieldName, value) => {
    console.log(`[CreateForm] Field ${fieldName} changed:`, value);
    
    const fieldDef = fields.find(f => f.name === fieldName);
    
    if (!fieldDef) {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
      return;
    }
    
    if (fieldDef.type === 'multiRelationship') {
      handleMultiRelationshipChange(fieldName, value);
    } else if (fieldDef.type === 'relationship') {
      if (value && typeof value === 'object' && value.id !== undefined) {
        setFormData(prev => ({ ...prev, [fieldName]: value.id }));
      } else {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    }
  }, [fields]);
  
  const handleMultiRelationshipChange = useCallback((fieldName, value) => {
    console.log(`[CreateForm] MultiRelationship ${fieldName}:`, value);
    
    if (Array.isArray(value)) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: value.map(String).filter(Boolean)
      }));
    } else if (value && (value.ids || value.details)) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: (value.ids || []).map(String).filter(Boolean),
        [`${fieldName}_details`]: value.details || []
      }));
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: [] }));
    }
  }, []);

  // Contract-specific handlers
  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragEndWrapper = (event) => {
    if (handleDragEnd) handleDragEnd(event);
    setActiveId(null);
  };

  // Fetch related data for contract template compilation
  const fetchRelatedData = async () => {
    const relatedData = {};
    
    try {
      // Fetch selectedMilestones
      const milestonesField = fields.find(f => f.name === 'selectedMilestones');
      if (milestonesField?.relation && formData.selectedMilestones?.length > 0) {
        const { data: milestones, error: milestonesError } = await supabase
          .from(milestonesField.relation.table)
          .select('id, title, description')
          .in('id', formData.selectedMilestones);
        
        if (!milestonesError && milestones) {
          relatedData.selectedMilestones = milestones;
        }
      }
      
      // Fetch products with deliverables
      const productsField = fields.find(f => f.name === 'products');
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
                console.error('Error fetching deliverables for product', product.id, ':', error);
                return { ...product, deliverables: [] };
              }
            })
          );
          
          relatedData.products = productsWithDeliverables;
        }
      }
      
      // For new contracts, payments will be empty
      relatedData.payments = [];
      
      return relatedData;
    } catch (error) {
      console.error('Error fetching related data:', error);
      return relatedData;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanData = {};
      
      fields.forEach(field => {
        const { name, type } = field;
        if (type === 'multiRelationship' || type === 'custom' || type === 'payments' || type === 'sections' || type === 'comments') return;

        const value = formData[name];
        if ((type === 'select' || type === 'status') && value) {
          cleanData[name] = extractSelectValue(value);
        } else {
          cleanData[name] = value;
        }
      });

      // For contracts, compile content with template variables
      if (isContract && compileContentWithData) {
        const relatedData = await fetchRelatedData();
        const compiledContentWithData = compileContentWithData(formData, relatedData);
        cleanData.content = compiledContentWithData;
      }
      
      console.log('[CreateForm] Submitting clean data:', cleanData);
      
      const insertResult = await supabase.from(table).insert([cleanData]).select().single();
      
      if (insertResult.error) {
        console.error('[CreateForm] Insert error:', insertResult.error);
        setError(insertResult.error.message);
        setLoading(false);
        return;
      }
      
      const newRecord = insertResult.data;
      
      // For contracts, save contract parts relationships
      if (isContract && contractParts.length > 0 && newRecord?.id) {
        const pivotData = contractParts.map(part => ({
          contract_id: newRecord.id,
          contractpart_id: part.id,
          order_index: part.order_index
        }));

        const { error: pivotError } = await supabase
          .from('contract_contractpart')
          .insert(pivotData);

        if (pivotError) {
          console.error('Error saving contract parts:', pivotError);
          setError('Contract saved but failed to save sections');
          setLoading(false);
          return;
        }
      }
      
      // Save multirelationship fields
      const multiRelFields = fields.filter(f => f.type === 'multiRelationship' && f.relation?.junctionTable);
      
      if (multiRelFields.length > 0 && newRecord?.id) {
        const recordWithId = { ...formData, id: newRecord.id };
        
        try {
          await saveMultiRelationships({ config, record: recordWithId });
        } catch (multiRelError) {
          console.error('Error saving multirelationships:', multiRelError);
        }
      }

      setLoading(false);

      if (onSuccess) {
        await onSuccess(newRecord);
        return;
      }

      if (disableRedirect) {
        if (refreshRecord) {
          refreshRecord();
        } else {
          window.location.reload();
        }
        return;
      }

      if (newRecord?.id) {
        if (config.paths && typeof config.paths.details === 'function') {
          const detailsPath = config.paths.details(newRecord.id);
          router.push(detailsPath);
        } else if (config.editPathPrefix) {
          router.push(`${config.editPathPrefix}/${newRecord.id}`);
        }
      }
      
    } catch (err) {
      console.error('Unexpected error creating record:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const renderableFields = fields.filter((field) => {
    if (['created_at', 'updated_at'].includes(field.name)) return false;
    if (field.type === 'custom' && ['comments', 'sections', 'payments'].includes(field.component)) return false;
    return true;
  });

  const activeItem = activeId ? contractParts.find(part => `part-${part.id}` === activeId) : null;

  // Contract-specific render
  if (isContract) {
    return (
      <Container maxWidth="xl">
  

            {error && (
              <Typography color="error" sx={{ mb: 3 }}>
                {error}
              </Typography>
            )}
            {partErrors.parts && (
              <Typography color="error" sx={{ mb: 3 }}>
                {partErrors.parts}
              </Typography>
            )}

            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Contract Details" />
              <Tab label="Contract Sections" />
            </Tabs>

            {activeTab === 0 ? (
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {renderableFields.map((field) => {
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
                              key={field.name}
                              field={field}
                              record={formData}
                              setRecord={setFormData}
                              config={config}
                              onChange={handleChange}
                              hideLabel={true}
                            />
                          ) : (
                            <FieldRenderer
                              key={field.name}
                              field={field}
                              value={formData[field.name] !== undefined ? formData[field.name] : ''}
                              record={formData}
                              config={config}
                              mode="create"
                              editable
                              onChange={(value) => handleChange(field.name, value)}
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
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box>
                    <Box mb={3}>
                      <Button
                        variant="outlined"
                        startIcon={<Eye />}
                        onClick={() => setShowPreview(true)}
                        disabled={!formData.title || contractParts.length === 0}
                      >
                        Preview Contract
                      </Button>
                    </Box>

                    <Box mb={4}>
                      <Typography variant="h6" gutterBottom>
                        Contract Sections ({contractParts.length})
                      </Typography>
                      
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEndWrapper}
                      >
                        <SortableContext
                          items={contractParts.map(part => `part-${part.id}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          {contractParts.map((part) => (
                            <ContractPartCard
                              key={part.id}
                              part={part}
                              onRemove={handleRemovePart}
                              showContent={true}
                            />
                          ))}
                        </SortableContext>

                        <DragOverlay>
                          {activeItem ? (
                            <Card elevation={4} sx={{ opacity: 0.9, transform: 'rotate(3deg)' }}>
                              <CardContent sx={{ py: 2 }}>
                                <Typography variant="body1" fontWeight="medium">
                                  {activeItem.title}
                                </Typography>
                              </CardContent>
                            </Card>
                          ) : null}
                        </DragOverlay>
                      </DndContext>

                      {contractParts.length === 0 && (
                        <Paper
                          variant="outlined"
                          sx={{
                            textAlign: 'center',
                            py: 8,
                            backgroundColor: '#f9f9f9',
                            border: '2px dashed #e0e0e0'
                          }}
                        >
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No sections added yet
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Add sections from the sidebar to build your contract
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <AvailablePartsSidebar
                    availableParts={availableParts.filter(part => 
                      !contractParts.find(cp => cp.id === part.id)
                    )}
                    onAddPart={handleAddExistingPart}
                    onAddCustomPart={handleAddCustomPart}
                  />
                </Grid>
              </Grid>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel} disabled={loading}>
                  Cancel
                </Button>
              )}
              <Button 
                onClick={handleSubmit}
                variant="contained" 
                startIcon={loading ? null : <FloppyDisk />}
                disabled={loading || !formData.title}
              >
                {loading ? 'Creating...' : 'Create Contract'}
              </Button>
            </Box>



        {showPreview && compileContentWithData && (
          <ContractPreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            title={formData.title}
            compiledContent={compileContentWithData(formData, {})}
          />
        )}
      </Container>
    );
  }

  // Standard form render for non-contracts (your existing code)
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mx: 'auto', px: 2 }}>
      {/* Your existing standard form JSX */}
    </Box>
  );
};

export default CreateForm;