// Alternative: Use the hook directly in this component
'use client';
import { useSearchParams } from 'next/navigation';
import * as collections from '@/collections';
import { useCollectionCreate } from '@/hooks/useCollectionCreate'; // Adjust import path
import { CollectionItemPage } from '@/components/views/collectionItem/CollectionItemPage';
import { Dialog, DialogContent, CircularProgress, Box } from '@mui/material';

export function CollectionCreateLayout({ collectionKey }) {
  const config = collections[collectionKey];
  const searchParams = useSearchParams();
  
  // Force the modal to be in create mode
  const modifiedSearchParams = new URLSearchParams();
  modifiedSearchParams.set('modal', 'create');
  
  // Add any initial values from the URL
  searchParams.forEach((value, key) => {
    if (!['modal', 'id'].includes(key)) {
      modifiedSearchParams.set(key, value);
    }
  });

  const {
    modalOpen,
    handleCloseModal,
    localRecord,
    setLocalRecord,
    isCreatingRecord
  } = useCollectionCreate({ 
    config, 
    initialRecord: {} 
  });

  if (!config) {
    return <div>Collection not found</div>;
  }

  return (
    <Dialog 
      open={true}
      onClose={handleCloseModal}
      maxWidth="lg"
      fullWidth
    >
      <DialogContent sx={{ p: 0 }}>
        {isCreatingRecord ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
            <span style={{ marginLeft: 16 }}>Creating {config.singularLabel || config.label}...</span>
          </Box>
        ) : localRecord?.id ? (
          <CollectionItemPage
            config={config}
            record={localRecord}
            isModal={true}
          />
        ) : (
          <Box sx={{ p: 4 }}>
            <span>Initializing...</span>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}