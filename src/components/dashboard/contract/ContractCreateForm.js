'use client';
import React, { useState } from 'react';
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

const ContractCreateForm = ({ config, onSave = () => {}, onCancel = () => {} }) => {
  const supabase = createClient();
  const [showPreview, setShowPreview] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize form data with default values
  const [formData, setFormData] = useState({
    title: '',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  // Fetch related data for template compilation
  const fetchRelatedData = async () => {
    const relatedData = {};
    
    try {
      console.log('[Fetch Debug] Starting to fetch related data...');
      
      // Fetch selectedMilestones if the field exists and has values
      const milestonesField = config?.fields?.find(f => f.name === 'selectedMilestones');
      if (milestonesField?.relation && formData.selectedMilestones?.length > 0) {
        const { data: milestones, error: milestonesError } = await supabase
          .from(milestonesField.relation.table)
          .select('id, title, description')
          .in('id', formData.selectedMilestones);
        
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
      
      console.log('[Fetch Debug] Final related data:', relatedData);
      return relatedData;
      
    } catch (error) {
      console.error('[Fetch Debug] Error in fetchRelatedData:', error);
      return relatedData;
    }
  };

  // Handle form field changes
  const handleChange = (fieldName, value) => {
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
  };

  // Handle multiRelationship changes
  const handleMultiRelationshipChange = (fieldName, value) => {
    console.log(`[ContractCreateForm] MultiRelationship field ${fieldName} changed:`, value);
    
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
    }
  };

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
                              value={typeof formData[field.name] !== 'undefined' ? formData[field.name] : ''}
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
              {/* Main Content */}
              <Grid item xs={12} md={8}>
                <Box>
                  {/* Preview Button */}
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

                  {/* Contract Sections */}
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
                          <Card
                            elevation={4}
                            sx={{
                              opacity: 0.9,
                              transform: 'rotate(3deg)',
                              backgroundColor: '#f5f5f5',
                              border: '2px dashed #1976d2'
                            }}
                          >
                            <CardContent sx={{ py: 2 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {activeItem.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Moving section...
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

              {/* Sidebar */}
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