'use client';

import { Box, Container, Grid } from '@mui/material';
import { CollectionItemPage } from '@/components/views/collectionItem/CollectionItemPage';
import { QuickViewCard } from '@/components/views/quickview/QuickViewCard';

export default function CollectionDetailClient({ config, record }) {
  // Determine if QuickView should be shown based on config
  const showQuickView = Boolean(
    config?.quickView?.enabled && // Check if QuickView is enabled in config
    record?.id // Make sure we have a record
  );

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} xl={showQuickView ? 9 : 12}>
            <CollectionItemPage config={config} record={record} />
          </Grid>
          {showQuickView && (
            <Grid item xs={12} xl={3}>
              <QuickViewCard config={config} record={record} />
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}