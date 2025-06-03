'use client';

import * as React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  IconButton,
  Collapse,
  Box,
} from '@mui/material';
import { CaretRight, CaretDown } from '@phosphor-icons/react';
import { getStatusRowColor, getStatusRowTextColor } from '@/styles/theme/status/statusRowColors';

export function DataTable({
  columns,
  hideHead,
  hover,
  onClick,
  onDeselectAll,
  onDeselectOne,
  onSelectOne,
  onSelectAll,
  rows,
  rowSx,
  selectable,
  selected,
  uniqueRowId,
  childRenderer,
  indentLevel = 0,
  statusField = 'status', // Field name to use for row coloring
  enableRowColors = true, // Toggle to enable/disable row coloring
  ...props
}) {
  const [expandedRows, setExpandedRows] = React.useState(new Set());

  const toggleRow = (rowId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const selectedSome = (selected?.size ?? 0) > 0 && (selected?.size ?? 0) < rows.length;
  const selectedAll = rows.length > 0 && selected?.size === rows.length;

  // Helper function to get row styling including status colors
  const getRowStyling = (row) => {
    let styling = { ...(rowSx || {}) };
    
    if (enableRowColors && statusField && row[statusField]) {
      const backgroundColor = getStatusRowColor(row[statusField]);
      const textColor = getStatusRowTextColor(backgroundColor);

      
      styling = {
        ...styling,
        backgroundColor: `${backgroundColor} !important`,
        color: `${textColor} !important`,
        // Apply text color to ALL cells and their children with high specificity
        '& .MuiTableCell-root': {
          color: `${textColor} !important`,
          backgroundColor: 'transparent !important',
          // Target all possible text elements, but exclude company chips
          '& *:not(.MuiChip-root):not(.MuiChip-label)': {
            color: `${textColor} !important`,
          },
          // Specifically target common elements, but exclude chips
          '& span:not(.MuiChip-label)': {
            color: `${textColor} !important`,
          },
          '& div:not(.MuiChip-root)': {
            color: `${textColor} !important`,
          },
          '& p': {
            color: `${textColor} !important`,
          },
          '& a': {
            color: `${textColor} !important`,
          },
          // Let company chips keep their own text color logic
          '& .MuiChip-root': {
            // Don't override chip colors - let them handle their own contrast
          },
          '& .MuiTypography-root': {
            color: `${textColor} !important`,
          },
        },
        '&:hover': {
          backgroundColor: `${backgroundColor} !important`,
          opacity: 0.8,
          '& .MuiTableCell-root': {
            color: `${textColor} !important`,
            '& *:not(.MuiChip-root):not(.MuiChip-label)': {
              color: `${textColor} !important`,
            },
          },
          ...styling['&:hover'],
        },
        '&.Mui-selected': {
          backgroundColor: `${backgroundColor} !important`,
          opacity: 0.9,
          '& .MuiTableCell-root': {
            color: `${textColor} !important`,
            '& *:not(.MuiChip-root):not(.MuiChip-label)': {
              color: `${textColor} !important`,
            },
          },
          ...styling['&.Mui-selected'],
        },
      };
    }
    
    return styling;
  };

  return (
    <Table
      {...props}
      sx={{
        tableLayout: 'fixed',
        width: '100%',
        ...props.sx,
      }}
    >
      {!hideHead && (
        <TableHead >
          <TableRow>
            {/* Caret spacer cell — aligns with toggle icon in body */}
            <TableCell
              padding="checkbox"
              sx={{ width: '32px', minWidth: '32px', maxWidth: '32px', p: 0 }}
            />
        
            {selectable && (
              <TableCell
                padding="checkbox"
                sx={{ width: '40px', minWidth: '40px', maxWidth: '40px', p: 0 }}
              >
                <Checkbox
                  checked={selectedAll}
                  indeterminate={selectedSome}
                  onChange={(event) => {
                    if (selectedAll) {
                      onDeselectAll?.(event);
                    } else {
                      onSelectAll?.(event);
                    }
                  }}
                />
              </TableCell>
            )}
        
            {columns.map((column, idx) => (
              <TableCell
                key={column.name || column.field || `column-${idx}`}
                sx={{
                  width: column.width,
                  minWidth: column.width,
                  maxWidth: column.width,
                  ...(column.align && { textAlign: column.align }),
                }}
              >
                {column.hideName ? null : column.title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
      )}

      <TableBody>
        {rows.map((row, rowIndex) => {
          const rowId = row.id ?? uniqueRowId?.(row) ?? `row-${rowIndex}`;
          const isSelected = rowId && selected?.has(rowId);
          const isExpandable = typeof childRenderer === 'function' && row.children?.length > 0;
          const isExpanded = expandedRows.has(rowId);
          const rowStyling = getRowStyling(row);

          return (
            <React.Fragment key={rowId}>
              <TableRow
                hover={hover}
                selected={isSelected}
                onClick={onClick ? (event) => onClick(event, row) : undefined}
                sx={{
                  cursor: onClick ? 'pointer' : 'default',
                  ...rowStyling,
                }}
              >
                {/* Expand/collapse toggle button */}
                <TableCell
                  padding="checkbox"
                  sx={{ width: '32px', minWidth: '32px', maxWidth: '32px', p: 0 }}
                >
                  {isExpandable && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(rowId);
                      }}
                      sx={{ p: 0 }}
                    >
                      {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
                    </IconButton>
                  )}
                </TableCell>

                {selectable && (
                  <TableCell
                    padding="checkbox"
                    sx={{ pl: 0, pr: 1, width: '40px', minWidth: '40px', maxWidth: '40px' }}
                  >
                    <Checkbox
                      checked={!!isSelected}
                      onChange={(event) => {
                        if (isSelected) {
                          onDeselectOne?.(event, row);
                        } else {
                          onSelectOne?.(event, row);
                        }
                      }}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                )}

                {columns.map((column, colIndex) => {
                  const value = column.formatter
                    ? column.formatter(row, rowIndex)
                    : column.field
                    ? row[column.field]
                    : null;

                  return (
                    <TableCell
                      key={`${rowId}-${column.name || column.field || colIndex}`}
                      sx={{
                        width: column.width,
                        minWidth: column.width,
                        maxWidth: column.width,
                        ...(column.align && { textAlign: column.align }),
                      }}
                    >
                      {value}
                    </TableCell>
                  );
                })}
              </TableRow>
              
              {isExpandable && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 2 : 1)}
                    sx={{ p: 0, border: 0 }}
                  >
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ pl: 2, pt: 0, pb: 0, pr: 0, bgcolor: 'white' }}>
                        {childRenderer(row, rowIndex)}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}