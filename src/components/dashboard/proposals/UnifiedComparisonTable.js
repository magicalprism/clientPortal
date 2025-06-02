import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Container
} from '@mui/material';
import { Check as CheckIcon } from '@phosphor-icons/react';

const UnifiedComparisonTable = ({ 
  label, 
  data, 
  products, 
  itemKey, 
  isGrouped = false 
}) => {
  if (!data || (isGrouped && Object.keys(data).length === 0) || (!isGrouped && data.length === 0)) {
    return null;
  }

  const renderTable = (items, tableKey = null) => (
    <Paper 
      sx={{ 
        borderRadius: 2, 
        overflow: 'hidden', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f9fafb' }}>
            <TableCell 
              sx={{ 
                border: 'none', 
                py: 2, 
                px: 3,
                fontWeight: 500,
                color: '#9ca3af',
                fontSize: '0.875rem',
                letterSpacing: '0.05em',
                width: '40%'
              }}
            >
              Item
            </TableCell>
            {products.map(p => (
              <TableCell 
                key={p.id} 
                align="center" 
                sx={{ 
                  border: 'none', 
                  py: 2, 
                  px: 3,
                  fontWeight: 400,
                  color: '#9ca3af',
                  fontSize: '1rem',
                  width: `${60 / products.length}%`
                }}
              >
                {p.title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        
        <TableBody>
          {items.map((item, index) => (
            <TableRow 
              key={item.id}
              sx={{
                '&:hover': {
                  backgroundColor: '#f9fafb',
                },
                borderBottom: index === items.length - 1 ? 'none' : '1px solid #f3f4f6'
              }}
            >
              <TableCell 
                sx={{ 
                  border: 'none', 
                  py: 2.5, 
                  px: 3,
                  fontWeight: 500,
                  color: '#374151',
                  fontSize: '0.875rem'
                }}
              >
                {item.title}
              </TableCell>
              {products.map((product) => {
                const included = (product[itemKey] || []).some(i => i.id === item.id);
                return (
                  <TableCell 
                    key={`cell-${item.id}-${product.id}`} 
                    align="center" 
                    sx={{ 
                      border: 'none', 
                      py: 2.5, 
                      px: 3 
                    }}
                  >
                    {included ? (
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: 'primary.500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto'
                        }}
                      >
                        <CheckIcon size={12} color="white" />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: '1px solid #d1d5db',
                          mx: 'auto'
                        }}
                      />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );

  return (
    <Box sx={{ mb: 8 }}>
      {/* Standalone Section Heading */}
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          {label}
        </Typography>
      </Container>
      
      {isGrouped ? (
        // Render sub-tables for each type
        Object.entries(data).map(([type, items]) => (
          <Container key={type} maxWidth="lg" sx={{ mb: 4 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 500, color: '#6b7280', mb: 1 }}>
                {type}
              </Typography>
            </Box>
            {renderTable(items, type)}
          </Container>
        ))
      ) : (
        // Render single table
        <Container maxWidth="lg">
          {renderTable(data)}
        </Container>
      )}
    </Box>
  );
};

export default UnifiedComparisonTable;