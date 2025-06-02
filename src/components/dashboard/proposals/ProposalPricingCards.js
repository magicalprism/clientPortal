import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Grid,
  Chip
} from '@mui/material';

export default function ProposalPricingCards({ products = [], activeProductId, setActiveProductId }) {
  return (
    <Box sx={{ py: 8, backgroundColor: 'grey.50' }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center' }}>
        Choose Your Plan
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {products.map((product) => {
          const isActive = product.id === activeProductId;
          const groupedDeliverables = groupByType(product.deliverables);
          const groupedFeatures = groupByType(product.features);

          return (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: isActive ? 6 : 2,
                  border: isActive ? '2px solid' : '1px solid',
                  borderColor: isActive ? 'primary.main' : 'grey.300',
                  backgroundColor: isActive ? 'primary.50' : 'white',
                  transition: '0.3s ease'
                }}
              >
                <CardActionArea onClick={() => setActiveProductId(product.id)}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.600' }}>
                      {product.title}
                    </Typography>

                    <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>
                      {product.price ? `$${product.price}` : 'Pricing TBD'}
                    </Typography>

                    {Object.keys(groupedDeliverables).length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="600">
                          Deliverables
                        </Typography>
                        {Object.entries(groupedDeliverables).map(([type, items]) => (
                          <Typography key={type} variant="body2" color="text.secondary">
                            <strong>{type}:</strong> {items.map(i => i.title).join(', ')}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {Object.keys(groupedFeatures).length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600">
                          Features
                        </Typography>
                        {Object.entries(groupedFeatures).map(([type, items]) => (
                          <Typography key={type} variant="body2" color="text.secondary">
                            <strong>{type}:</strong> {items.map(i => i.title).join(', ')}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

function groupByType(items = []) {
  const groups = {};
  items.forEach(item => {
    const type = item.type || 'Other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(item);
  });
  return groups;
}
