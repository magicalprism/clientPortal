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
  useTheme,
  CircularProgress
} from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { createClient } from '@/lib/supabase/browser';
import { saveMultiRelationships } from '@/lib/utils/multirelationshipUtils';
import { parseStringArrayField } from '@/lib/utils/parseStringArrayField';

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

  const recordId = record?.id || defaultValues?.id;
  const isCreating = !recordId;
  const [fetchedRecord, setFetchedRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const parentId = defaultValues?.id;
  const refField = defaultValues?.refField;


 const fetchMultiRelationshipsForRecord = async (config, recordId) => {
  const multiRelFields = config.fields.filter(
    (f) => f.type === 'multiRelationship' && f.relation?.junctionTable
  );

  const result = {};

  for (const field of multiRelFields) {
    const {
      name,
      relation: {
        junctionTable,
        sourceKey = `${config.name}_id`,
        targetKey,
        table,
        labelField = 'title'
      }
    } = field;

    const { data: junctionData, error: junctionError } = await supabase
      .from(junctionTable)
      .select(targetKey)
      .eq(sourceKey, recordId);

    if (junctionError) continue;

    const relatedIds = junctionData.map(row => row[targetKey]).filter(Boolean);

    if (relatedIds.length === 0) {
      result[name] = [];
      result[`${name}_details`] = [];
      continue;
    }

    const { data: relatedDetails, error: detailsError } = await supabase
      .from(table)
      .select(`id, ${labelField}`)
      .in('id', relatedIds);

    if (detailsError) continue;

    result[name] = relatedIds.map(String);
    result[`${name}_details`] = relatedDetails;
  }

  return result;
};


  useEffect(() => {
    if (!isCreating && recordId) {
      const fetchRecordWithTags = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
          const { data, error } = await supabase
            .from(config.name)
            .select('*')
            .eq('id', recordId)
            .single();

          if (error) {
            setFetchError(error.message);
            setIsLoading(false);
            return;
          }

          const parsedRecord = parseStringArrayField(data);
          const multiRelData = await fetchMultiRelationshipsForRecord(config, recordId);
          setFetchedRecord({ ...parsedRecord, ...multiRelData });

        } catch (err) {
          setFetchError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchRecordWithTags();
    }
  }, [recordId, config.name, isCreating, record?.id]);

  const refreshRecord = async () => {
    if (!recordId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from(config.name)
        .select('*')
        .eq('id', recordId)
        .single();

      if (error) return;

      const parsedRecord = parseStringArrayField(data);
      const tagsData = await fetchTagsForRecord(recordId);
      setFetchedRecord(tagsData ? { ...parsedRecord, ...tagsData } : parsedRecord);
    } finally {
      setIsLoading(false);
    }
  };

const extendedRecord = useMemo(() => {
  const baseRecord = fetchedRecord || record || {};
  const parsedBaseRecord = parseStringArrayField(baseRecord);

  let withDefaults = parsedBaseRecord;

  if (isCreating && parentId && refField) {
    withDefaults = { ...parsedBaseRecord, [refField]: parentId };
  }

  // Only use defaultValues when creating a record,
  // and ONLY for values that don't already exist in the record
  const merged = isCreating
    ? {
        ...defaultValues,
        ...withDefaults // allow record to override default values
      }
    : withDefaults;

  return merged;
}, [fetchedRecord, record, isCreating, parentId, refField, defaultValues]);

  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
      sx={{
        '& .MuiDialog-container': { justifyContent: 'flex-end' },
        '& .MuiDialog-paper': { height: '100%', width: '100%' }
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, pl: 3 }}>
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
            initialRecord={extendedRecord}
            disableRedirect
            onSuccess={async (data) => {
              if (data && data.id) {
                await saveMultiRelationships({ config, record: data });
              }
              if (onRefresh) await onRefresh(data);
              onClose();
            }}
          />
        ) : (
          <>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, }}>
                <CircularProgress />
              </Box>
            ) : (
              <CollectionItemPage
                config={config}
                record={extendedRecord}
                isModal
                onClose={onClose}
                onUpdate={async (updatedRecord) => {
                  if (updatedRecord?.id) {
                    await saveMultiRelationships({ config, record: updatedRecord });
                  }
                  if (onUpdate) onUpdate(updatedRecord);
                }}
                onDelete={onDelete}
                onRefresh={onRefresh}
                singleColumn
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
