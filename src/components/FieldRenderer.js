'use client';

import { useEffect, useState } from 'react';
import { Chip } from '@mui/material';
import { isIncludedInView } from '@/lib/utils/isIncludedInView';
import { getRendererForField } from '@/components/fields/index';

// Helper function to determine if text should be white or black based on background color
function getContrastColor(hexColor) {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white text for dark backgrounds, black for light
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Function to render company fields as colored chips
function renderCompanyChip(value, field, record, config) {
  // Check if this is a company relationship field
  if (field.type === 'relationship' && 
      field.relation?.table === 'company' && 
      field.name === 'company_id') {
    
    // Get the company data from the record
    const companyData = record.company; // This comes from the relationship join
    
    if (companyData) {
      const companyName = companyData[field.relation.labelField] || companyData.title || companyData.name || 'Unknown Company';
      const chipColor = companyData.chip_color || '#1976d2'; // Default to blue if no color
      const textColor = getContrastColor(chipColor);
      
      console.log('[Company Chip]', { companyName, chipColor, companyData });
      
      return (
        <Chip
          label={companyName}
          size="small"
          sx={{
            backgroundColor: chipColor,
            color: textColor,
            fontWeight: 'medium',
            '& .MuiChip-label': {
              fontSize: '0.75rem'
            },
            '&:hover': {
              backgroundColor: chipColor,
              color: '#ffffff', // Always use white text on hover
              opacity: 0.8, // Slightly fade the background on hover
            },
            '&.MuiChip-clickable:hover': {
              backgroundColor: chipColor,
              color: '#ffffff',
              opacity: 0.8,
            }
          }}
          clickable={field.relation?.linkTo ? true : false}
          onClick={field.relation?.linkTo ? () => {
            window.location.href = `${field.relation.linkTo}/${companyData.id}`;
          } : undefined}
        />
      );
    }
  }
  
  return null; // Not a company field or no data
}

export const FieldRenderer = ({
  value,
  field,
  record,
  config,
  view = 'default',
  mode = 'view',
  editable = false,
  isEditing = false,
  onChange = () => {},
}) => {
  const [localValue, setLocalValue] = useState(value);
  const isEditMode = editable || mode === 'create';

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  if (!isIncludedInView(field, view)) return null;
  if (field.format) return field.format(localValue, field, record);

  // Check for company chip rendering first
  const companyChip = renderCompanyChip(value, field, record, config);
  if (companyChip) {
    return companyChip;
  }

  const handleUpdate = (newValue) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const RendererComponent = getRendererForField(field.type);
  
  if (!RendererComponent) return null;

  return (
    <RendererComponent
      value={localValue}
      field={field}
      record={record}
      config={config}
      editable={editable}
      isEditing={isEditing}
      mode={mode}
      onChange={handleUpdate}
    />
  );
};