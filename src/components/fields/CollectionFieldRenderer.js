'use client';

import {
  Grid,
  Typography,
  Divider,
  Box,
  TextField,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Plus } from '@phosphor-icons/react';

import { SimpleEditor } from '@/components/tiptap/components/tiptap-templates/simple/simple-editor';
import { FieldRenderer } from '@/components/FieldRenderer';
import { MiniCollectionTable } from '@/components/tables/MiniCollectionTable';
import { BrandBoardPreview } from '@/components/BrandBoardPreview';
import { ElementMap } from '@/components/ElementMap';
import * as collections from '@/collections';

export const CollectionFieldRenderer = ({
  fields,
  groupName,
  localRecord,
  isModal,
  isSmallScreen,
  editingField,
  tempValue,
  loadingField,
  startEdit,
  setTempValue,
  saveChange,
  router,
  record
}) => {
  return (
    <Grid item xs={12} spacing={5}>
      <Typography variant="h6" fontWeight="bold" gutterBottom pb={1}>
        {groupName}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={4}>
        {fields.map((field) => {
          const excludedSystemFields = ['updated_at', 'created_at', 'id'];
          if (excludedSystemFields.includes(field.name)) return null;

          const isSystemReadOnly = ['updated_at', 'created_at'].includes(field.name);
          const editable = !isSystemReadOnly && field.editable !== false;
          const isEditing = editingField === field.name;
          const isLoading = loadingField === field.name;
          const value = localRecord[field.name];
          const isBasicTextField = ![
            'relationship',
            'multiRelationship',
            'boolean',
            'status',
            'json',
            'editButton',
            'media',
            'link',
            'date',
            'richText',
            'timezone',
            'select',
            'color',
            'repeater',
          ].includes(field.type);

          const isTwoColumn = !isModal && !isSmallScreen;

          if (field.type === 'custom') {
            return (
              <Grid item xs={12} key={field.name}>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography variant="subtitle2" fontWeight={500}>
                    {field.label}
                  </Typography>
                  {field.description && (
                    <Typography variant="caption" color="text.secondary">
                      {field.description}
                    </Typography>
                  )}
                  {field.component === 'BrandBoardPreview' && (
                    <BrandBoardPreview brand={localRecord} />
                  )}
                  {field.component === 'ElementMap' && localRecord?.id ? (
                    <ElementMap projectId={localRecord.id} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Loading map...
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          }

          if (field.type === 'multiRelationship' && field.displayMode === 'table') {
            const relatedRows = localRecord?.[field.name + '_details'] ?? [];
            return (
              <Grid item xs={12} key={field.name}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">{field.label}</Typography>
                  <IconButton
                    onClick={() =>
                      router.push(
                        `${window.location.pathname}?modal=create&refField=${field.name}&id=${record.id}`
                      )
                    }
                  >
                    <Plus />
                  </IconButton>
                </Box>
                <MiniCollectionTable
                  field={field}
                  config={collections[field.relation.table]}
                  rows={relatedRows}
                  parentId={record.id}
                />
              </Grid>
            );
          }

          return (
            <Grid
              item
              xs={12}
              sm={
                field.type === 'richText'
                  ? 12
                  : isTwoColumn || ['media', 'repeater'].includes(field.type)
                  ? 6
                  : 12
              }
              md={field.type === 'color' ? 6 : 6}
              lg={field.type === 'color' ? 3 : 6}
              xl={field.type === 'color' ? 3 : 6}
              key={field.name}
            >
              <Box display="flex" flexDirection="column" gap={1} height="100%">
                <Box>
                  <Typography variant="subtitle2" fontWeight={500}>
                    {field.label}
                  </Typography>
                  {field.description && (
                    <Typography variant="caption" color="text.secondary">
                      {field.description}
                    </Typography>
                  )}
                </Box>
          
                {/* Skip inline editing for media and repeater */}
                {['media', 'repeater'].includes(field.type) ? (
                  <FieldRenderer
                    value={
                      localRecord[`${field.name}_details`] || localRecord[field.name]
                    }
                    field={field}
                    record={localRecord}
                    config={collections[field.relation?.table] || {}}
                    view="detail"
                    onChange={(value) => {
                      if (isSystemReadOnly) return;
                      else if (field.type === 'repeater' && value?.ids) {
                        saveChange(field.name, value.ids); // save only the ids
                        localRecord[`${field.name}_details`] = value.details; // keep details for rendering
                      } else {
                        saveChange(field.name, value);
                      }
                      
                    }}
                  />
                ) : isEditing && isBasicTextField ? (
                  <TextField
                    fullWidth
                    size="medium"
                    sx={{ mb: 2 }}
                    value={tempValue}
                    autoFocus
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => saveChange(field)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveChange(field);
                      }
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      cursor: editable && isBasicTextField ? 'pointer' : 'default',
                      color: editable && isBasicTextField ? 'primary.main' : 'text.primary',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '35px',
                      justifyContent: 'space-between'
                    }}
                    onClick={
                      editable && isBasicTextField && !['media', 'repeater'].includes(field.type)
                        ? () => startEdit(field.name, value)
                        : undefined
                    }
                    
                  >
                    {isLoading ? (
                      <CircularProgress size={16} />
                    ) : field.type === 'richText' ? (
                      <SimpleEditor
                        content={value}
                        editable
                        onChange={(html) => saveChange(field.name, html)}
                      />
                    ) : (
                      <FieldRenderer
                        value={localRecord[field.name]}
                        field={field}
                        record={localRecord}
                        config={collections[field.relation?.table] || {}}
                        view="detail"
                        editable={editable}
                        isEditing={isEditing}
                        onChange={(value) => {
                          if (isSystemReadOnly) return;
                          else if (field.type === 'repeater' && value?.ids) {
                            saveChange(field.name, value.ids); // save only the ids
                            localRecord[`${field.name}_details`] = value.details; // keep details for rendering
                          } else {
                            saveChange(field.name, value);
                          }
                          
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
          );
          
          
        })}
      </Grid>
    </Grid>
  );
};
