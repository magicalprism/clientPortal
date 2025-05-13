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

  const parseTagsField = (record) => {
    if (!record) return record;
    const result = { ...record };
    if ('tags' in result) {
      if (typeof result.tags === 'string') {
        try {
          const parsedTags = JSON.parse(result.tags);
          if (Array.isArray(parsedTags)) {
            result.tags = parsedTags.map(String);
          }
        } catch {
          if (result.tags.includes(',')) {
            result.tags = result.tags.split(',').map(tag => tag.trim()).filter(Boolean);
          }
        }
      }
      if (!Array.isArray(result.tags)) {
        result.tags = result.tags ? [String(result.tags)] : [];
      }
    }
    return result;
  };

  const fetchTagsForRecord = async (recordId) => {
    if (!recordId) return null;
    const tagsField = config.fields.find(f =>
      f.type === 'multiRelationship' &&
      f.name === 'tags' &&
      f.relation?.junctionTable
    );
    if (!tagsField) return null;

    const {
      junctionTable = 'category_task',
      sourceKey = `${config.name}_id`,
      targetKey = 'category_id',
      table = 'category',
      labelField = 'title'
    } = tagsField.relation;

    const { data: junctionData, error: junctionError } = await supabase
      .from(junctionTable)
      .select(targetKey)
      .eq(sourceKey, recordId);

    if (junctionError) return null;

    const tagIds = junctionData.map(row => row[targetKey]).filter(Boolean);
    if (tagIds.length === 0) {
      return { tags: [], tags_details: [] };
    }

    const { data: tagDetails, error: detailsError } = await supabase
      .from(table)
      .select(`id, ${labelField}`)
      .in('id', tagIds);

    if (detailsError) return null;

    return {
      tags: tagIds.map(String),
      tags_details: tagDetails
    };
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

          const parsedRecord = parseTagsField(data);
          const tagsData = await fetchTagsForRecord(recordId);
          setFetchedRecord(tagsData ? { ...parsedRecord, ...tagsData } : parsedRecord);
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

      const parsedRecord = parseTagsField(data);
      const tagsData = await fetchTagsForRecord(recordId);
      setFetchedRecord(tagsData ? { ...parsedRecord, ...tagsData } : parsedRecord);
    } finally {
      setIsLoading(false);
    }
  };

  const extendedRecord = useMemo(() => {
    const baseRecord = fetchedRecord || record || {};
    const parsedBaseRecord = parseTagsField(baseRecord);
    const withDefaults = isCreating && parentId && refField
      ? { ...parsedBaseRecord, [refField]: parentId }
      : parsedBaseRecord;

    return {
      ...withDefaults,
      ...(isCreating ? defaultValues : {})
    };
  }, [fetchedRecord, record, isCreating, parentId, refField, defaultValues]);

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
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
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
