import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
} from '@mui/material';

export default function AddOnSummary({ selectedAddOns = [], onConfirm }) {
  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Summary of Selected Add-ons
      </Typography>

      {selectedAddOns.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No add-ons selected.
        </Typography>
      ) : (
        <Grid container spacing={4}>
          {selectedAddOns.map((addOn) => (
            <Grid item xs={12} md={6} key={addOn.id}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {addOn.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {addOn.description}
                </Typography>
                <Typography fontWeight="600">
                  {addOn.price ? `$${addOn.price}` : 'Pricing TBD'}
                </Typography>

                {addOn.deliverables?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography fontSize="0.8rem" fontWeight="600" sx={{ mb: 0.5 }}>
                      Deliverables:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {addOn.deliverables.map((d) => d.title).join(', ')}
                    </Typography>
                  </Box>
                )}

                {addOn.features?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography fontSize="0.8rem" fontWeight="600" sx={{ mb: 0.5 }}>
                      Features:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {addOn.features.map((f) => f.title).join(', ')}
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={onConfirm}
          disabled={selectedAddOns.length === 0}
        >
          Confirm & Continue
        </Button>
      </Box>
    </Box>
  );
}
