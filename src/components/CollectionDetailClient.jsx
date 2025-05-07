'use client';

import { Box, Container, Grid } from '@mui/material';
import { CollectionItemPage } from '@/components/CollectionItemPage';
import { QuickViewCard } from '@/components/QuickViewCard';

export default function CollectionDetailClient({ config, record }) {
  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={9}>
            <CollectionItemPage config={config} record={record} />
          </Grid>
          <Grid item xs={12} md={3}>
            <QuickViewCard config={config} record={record} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
