// Create a specialized contract action bar
// /components/contract/ContractActionBar.jsx

'use client';
import { Box, Paper } from '@mui/material';
import SignatureButton from './parts/SignatureButton';

const ContractActionBar = ({ contractRecord }) => {
  if (!contractRecord?.id) return null;

  return (
    <Paper 
      elevation={2}
      sx={{ 
        position: 'sticky', 
        bottom: 16, 
        mx: 2,
        p: 2,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        zIndex: 10
      }}
    >
      <SignatureButton 
        contractRecord={contractRecord}
        onStatusUpdate={(status, data) => {
          console.log('Contract signature status:', status);
          // Could show a toast notification here
        }}
      />
    </Paper>
  );
};

export default ContractActionBar;

