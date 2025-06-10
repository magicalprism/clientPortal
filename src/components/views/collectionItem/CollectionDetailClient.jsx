'use client';

import { Box, Container, Stack } from '@mui/material';
import { CollectionItemPage } from '@/components/views/collectionItem/CollectionItemPage';
import { QuickViewCard } from '@/components/views/quickview/QuickViewCard';

export default function CollectionDetailClient({ config, record }) {
  const showQuickView = Boolean(
    config?.quickView?.enabled && record?.id
  );

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl">
        <Stack spacing={4}>
          {showQuickView && (
            <QuickViewCard config={config} record={record} />
          )}
          <CollectionItemPage config={config} record={record} />
        </Stack>
      </Container>
    </Box>
  );
}
