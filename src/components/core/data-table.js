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
  rowSx
} from '@mui/material';
import { CaretRight, CaretDown } from '@phosphor-icons/react';


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

  return (
    <Table
  {...props}
  sx={{
    tableLayout: 'fixed',
    width: '100%',
    ...props.sx
  }}
>

      {!hideHead && (
        <TableHead>
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

          return (
            <React.Fragment key={rowId}>
              <TableRow
                hover={hover}
                selected={isSelected}
                onClick={onClick ? (event) => onClick(event, row) : undefined}
                sx={{
                  cursor: onClick ? 'pointer' : 'default',
                  ...(rowSx || {}) // ← add this line
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
                    sx={{ p: 0, border: 0, }}
                  >
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ pl: 2, pt: 0, pb: 0, pr: 0, bgcolor: 'var(--mui-palette-background-level1)' }}>

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
