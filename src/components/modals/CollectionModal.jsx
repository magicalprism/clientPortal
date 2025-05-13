'use client';

import React, { useEffect, useState, useMemo } from 'react';
import * as collections from '@/collections';
import CreateForm from '@/components/CreateForm';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { X as XIcon } from '@phosphor-icons/react';
import { CollectionItemPage } from '@/components/collectionItemPage';
import { createClient } from '@/lib/supabase/browser';
import { saveMultiRelationships } from '@/lib/utils/multirelationshipUtils'; // Add this import

export default function CollectionModal({
  open,
  onClose,
  onUpdate,
  onDelete,
  config,
  defaultValues = {},
  record = {},
  onRefresh,
  edit: forceEdit = false
}) {
  const theme = useTheme();
  const supabase = createClient();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const type = config?.name;
  const recordId = record?.id || defaultValues?.id;
  const isCreating = !recordId;
  const [fetchedRecord, setFetchedRecord] = useState(null);
  const parentId = defaultValues?.id;
  const refField = defaultValues?.refField;
  
  useEffect(() => {
    if (!isCreating && recordId && !record?.id) {
      const fetchRecord = async () => {
        const { data, error } = await supabase
          .from(config.name)
          .select('*')
          .eq('id', recordId)
          .single();

        if (error) {
          console.error(`[CollectionModal] Failed to fetch record ${recordId}`, error);
        } else {
          // Add this block to fetch multirelationship data
          const multiRelFields = config.fields.filter(
            f => f.type === 'multiRelationship' && f.relation?.junctionTable
          );
          
          // Fetch multirelationship data for each field
          if (multiRelFields.length > 0) {
            console.log(`[CollectionModal] Fetching multirelationship data for ${multiRelFields.length} fields`);
            
            for (const field of multiRelFields) {
              const { junctionTable, sourceKey, targetKey, table, labelField } = field.relation;
              const sourceKeyName = sourceKey || `${config.name}_id`;
              const targetKeyName = targetKey || `${table}_id`;
              const displayField = labelField || 'title';
              
              try {
                // First, get relationships from junction table
                const { data: junctionData, error: junctionError } = await supabase
                  .from(junctionTable)
                  .select(`${targetKeyName}`)
                  .eq(sourceKeyName, recordId);
                  
                if (junctionError) {
                  console.error(`[CollectionModal] Error fetching ${field.name} relationships:`, junctionError);
                  continue;
                }
                
                // Extract related IDs
                const relatedIds = junctionData.map(item => item[targetKeyName]);
                
                if (relatedIds.length > 0) {
                  // Get details for these IDs
                  const { data: detailsData, error: detailsError } = await supabase
                    .from(table)
                    .select(`id, ${displayField}`)
                    .in('id', relatedIds);
                    
                  if (detailsError) {
                    console.error(`[CollectionModal] Error fetching ${field.name} details:`, detailsError);
                    continue;
                  }
                  
                  // Add to record data
                  data[field.name] = relatedIds.map(String);
                  data[`${field.name}_details`] = detailsData;
                  
                  console.log(`[CollectionModal] Loaded ${relatedIds.length} items for ${field.name}:`, 
                    relatedIds, detailsData);
                } else {
                  // No related records
                  data[field.name] = [];
                  data[`${field.name}_details`] = [];
                }
              } catch (err) {
                console.error(`[CollectionModal] Unexpected error loading ${field.name}:`, err);
              }
            }
          }
          
          setFetchedRecord(data);
        }
      };
      
      fetchRecord();
    }
  }, [recordId, config.name, isCreating, record?.id]);
  
  const extendedRecord = {
    ...(fetchedRecord || record || {}),
    ...(isCreating && parentId && refField ? { [refField]: parentId } : {}),
    ...(isCreating ? defaultValues : {}) // 👈 Add this line
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      maxWidth="sm"
      onClose={onClose}
      open={open}
      sx={{
        '& .MuiDialog-container': { justifyContent: 'flex-end' },
        '& .MuiDialog-paper': { height: '100%', width: '100%' }
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6">
              {config.label || config.name}
            </Typography>
            {config.subtitleField && extendedRecord?.[config.subtitleField] && (
              <Typography variant="body2" color="text.secondary">
                {extendedRecord[config.subtitleField]}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose}>
            <XIcon />
          </IconButton>
        </Box>

        {isCreating ? (
          <CreateForm
            config={config}
            initialRecord={extendedRecord} // ✅ pass prefilled values
            disableRedirect
            onSuccess={async (data) => {
              // After creating the record, save multirelationship fields
              if (data && data.id) {
                await saveMultiRelationships({
                  config,
                  record: data
                });
              }
              
              if (onRefresh) await onRefresh(data); // ⬅️ Make sure this finishes first
              onClose(); // ⬅️ Only close after
            }}
          />
        ) : (
          <CollectionItemPage
            config={config}
            record={extendedRecord}
            isModal
            onClose={onClose}
            onUpdate={async (updatedRecord) => {
              // Add this to handle saving multirelationships
              if (updatedRecord && updatedRecord.id) {
                await saveMultiRelationships({
                  config,
                  record: updatedRecord
                });
              }
              
              // Then call the original onUpdate
              if (onUpdate) onUpdate(updatedRecord);
            }}
            onDelete={onDelete}
            onRefresh={onRefresh}
            singleColumn
          />
        )}
      </DialogContent>
    </Dialog>
  );
}