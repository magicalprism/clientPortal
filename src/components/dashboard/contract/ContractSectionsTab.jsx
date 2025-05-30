'use client';
import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent
} from '@mui/material';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { ContractPartCard } from './parts/ContractPartCard';
import { AvailablePartsSidebar } from './parts/AvailablePartsSidebar';

export const ContractSectionsTab = ({
  contractParts,
  availableParts,
  activeId,
  handleDragStart,
  handleDragEndWrapper,
  handleRemovePart,
  handleAddExistingPart,
  handleAddCustomPart
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const activeItem = activeId
    ? contractParts.find(part => `part-${part.id}` === activeId)
    : null;

  return (
    <Grid container spacing={3}>
      {/* Main Content */}
      <Grid item xs={12} md={8}>
        <Box>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Contract Sections ({contractParts.length})
            </Typography>
          </Box>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEndWrapper}
          >
            <SortableContext
              items={contractParts.map(part => `part-${part.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {contractParts.map(part => (
                <ContractPartCard
                  key={part.id}
                  part={part}
                  onRemove={handleRemovePart}
                  showContent={true}
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeItem ? (
                <Card
                  elevation={4}
                  sx={{
                    opacity: 0.9,
                    transform: 'rotate(3deg)',
                    backgroundColor: '#f5f5f5',
                    border: '2px dashed #1976d2'
                  }}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {activeItem.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Moving section...
                    </Typography>
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>

          {contractParts.length === 0 && (
            <Paper
              variant="outlined"
              sx={{
                textAlign: 'center',
                py: 8,
                backgroundColor: '#f9f9f9',
                border: '2px dashed #e0e0e0',
                mt: 4
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No sections added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add sections from the sidebar to build your contract
              </Typography>
            </Paper>
          )}
        </Box>
      </Grid>

      {/* Sidebar */}
      <Grid item xs={12} md={4}>
        <AvailablePartsSidebar
          availableParts={availableParts.filter(part =>
            !contractParts.find(cp => cp.id === part.id)
          )}
          onAddPart={handleAddExistingPart}
          onAddCustomPart={handleAddCustomPart}
        />
      </Grid>
    </Grid>
  );
};
