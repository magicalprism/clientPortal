'use client';

import React from 'react';
import { Box, Button, IconButton, Menu, MenuItem } from '@mui/material';
import { Plus, CaretDown, DownloadSimple, LinkSimple } from '@phosphor-icons/react';

/**
 * Handles action buttons and menus for media field
 */
export const MediaActions = ({
  canEdit,
  isMulti,
  canAddMore,
  localSelectedItems,
  maxItems,
  menuOptions,
  menuAnchor,
  onMenuClick,
  onMenuClose
}) => {
  if (!canEdit) return null;

  return (
    <Box display="flex" gap={1}>
      {menuOptions.length > 1 ? (
        <>
          <Button
            variant="outlined"
            onClick={onMenuClick}
            startIcon={isMulti ? <Plus size={16} /> : null}
            endIcon={<CaretDown size={16} />}
            fullWidth
          >
            {isMulti ? 
              (canAddMore ? 'Add Media' : `Add More (${localSelectedItems.length}/${maxItems})`) : 
              (localSelectedItems.length > 0 ? 'Change Media' : 'Add Media')
            }
          </Button>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={onMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >
            {menuOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <MenuItem key={index} onClick={option.onClick}>
                  <IconComponent size={16} style={{ marginRight: 8 }} />
                  {option.label}
                </MenuItem>
              );
            })}
          </Menu>
        </>
      ) : menuOptions.length > 0 ? (
        <Button
          variant="outlined"
          onClick={menuOptions[0]?.onClick}
          startIcon={menuOptions[0]?.icon ? React.createElement(menuOptions[0].icon, { size: 16 }) : null}
          fullWidth
        >
          {isMulti ? 
            (canAddMore ? menuOptions[0]?.label : `Add More (${localSelectedItems.length}/${maxItems})`) :
            (localSelectedItems.length > 0 ? 'Change Media' : menuOptions[0]?.label)
          }
        </Button>
      ) : null}
      
      {/* Additional quick action button for single media with existing item */}
      {!isMulti && localSelectedItems.length > 0 && (
        <IconButton
          component="a"
          href={localSelectedItems[0]?.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            color: 'white',
            backgroundColor: 'primary.main',
          }}
        >
          {localSelectedItems[0]?.is_folder || localSelectedItems[0]?.is_external ? 
            <LinkSimple size={20} /> : <DownloadSimple size={20} />}
        </IconButton>
      )}
    </Box>
  );
};