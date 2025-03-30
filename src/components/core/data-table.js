"use client";

import * as React from "react";
import Checkbox from "@mui/material/Checkbox";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

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
  selectable,
  selected,
  uniqueRowId,
  ...props
}) {
  const selectedSome = (selected?.size ?? 0) > 0 && (selected?.size ?? 0) < rows.length;
  const selectedAll = rows.length > 0 && selected?.size === rows.length;

  return (
    <Table {...props}>
      <TableHead
        sx={{
          ...(hideHead && {
            visibility: "collapse",
            "--TableCell-borderWidth": 0,
          }),
        }}
      >
        <TableRow>
          {selectable && (
            <TableCell padding="checkbox" sx={{ width: "40px", minWidth: "40px", maxWidth: "40px" }}>
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
      <TableBody>
        {rows.map((row, rowIndex) => {
          const rowId = row.id ?? uniqueRowId?.(row) ?? `row-${rowIndex}`;
          const isSelected = rowId && selected?.has(rowId);

          return (
            <TableRow
              hover={hover}
              key={rowId}
              selected={isSelected}
              onClick={onClick ? (event) => onClick(event, row) : undefined}
              sx={onClick && { cursor: "pointer" }}
            >
              {selectable && (
                <TableCell padding="checkbox">
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
              {columns.map((column, colIndex) => (
                <TableCell key={`${rowId}-${column.name || column.field || colIndex}`} sx={column.align ? { textAlign: column.align } : {}}>
                  {column.formatter ? column.formatter(row, rowIndex) : column.field ? row[column.field] : null}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
