'use client';
import { useState, useEffect } from 'react';
import { 
  Button, 
  CircularProgress, 
  Chip, 
  Box, 
  Alert, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel
} from '@mui/material';
// More conservative icon imports
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye
} from '@phosphor-icons/react';
import SignerSelectionDialog from './SignerSelectionDialog';

const SignatureButton = ({ contractRecord, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [platform, setPlatform] = useState('esignatures');
  const [documentId, setDocumentId] = useState(null);
  const [showSignerDialog, setShowSignerDialog] = useState(false);

  // Available platforms
  const platforms = [
    { value: 'esignatures', label: 'eSignatures.com' },
    { value: 'docusign', label: 'DocuSign' },
    { value: 'hellosign', label: 'HelloSign/Dropbox Sign' },
  ];

  // Check status on component mount
  useEffect(() => {
    if (contractRecord?.id) {
      checkStatus();
    }
  }, [contractRecord?.id]);

  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/signature?contractId=${contractRecord.id}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
        setDocumentId(data.documentId);
        setPlatform(data.platform || 'esignatures');
      }
    } catch (error) {
      console.error('Failed to check signature status:', error);
    }
  };

  const handleSendForSignature = async (signers) => {
    setLoading(true);
    try {
      const response = await fetch('/api/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractId: contractRecord.id,
          platform: platform,
          signers: signers
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send for signature');
      }

      const data = await response.json();
      
      setStatus('sent');
      setDocumentId(data.documentId);
      setShowSignerDialog(false);
      
      // Optional: Open the signing URL
      if (data.signUrl) {
        window.open(data.signUrl, '_blank');
      }

      // Notify parent component
      if (onStatusUpdate) {
        onStatusUpdate('sent', data);
      }

      alert(`Contract sent via ${platforms.find(p => p.value === platform)?.label} successfully!`);

    } catch (error) {
      console.error('Failed to send for signature:', error);
      alert(`Failed to send contract: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'sent':
        return (
          <Chip 
            icon={<Clock />} 
            label="Pending Signature" 
            color="warning" 
            variant="outlined" 
          />
        );
      case 'viewed':
        return (
          <Chip 
            icon={<Eye />} 
            label="Viewed" 
            color="info" 
            variant="outlined" 
          />
        );
      case 'signed':
        return (
          <Chip 
            icon={<CheckCircle />} 
            label="Signed" 
            color="success" 
          />
        );
      case 'declined':
        return (
          <Chip 
            icon={<XCircle />} 
            label="Declined" 
            color="error" 
          />
        );
      case 'expired':
        return (
          <Chip 
            icon={<XCircle />} 
            label="Expired" 
            color="error" 
            variant="outlined" 
          />
        );
      default:
        return null;
    }
  };

  const getButtonContent = () => {
    if (status === 'signed') {
      return {
        text: 'Contract Signed',
        icon: <CheckCircle />,
        disabled: true,
        color: 'success'
      };
    } else if (status === 'sent' || status === 'viewed') {
      return {
        text: 'Check Status',
        icon: <Eye />,
        disabled: false,
        color: 'primary',
        onClick: checkStatus
      };
    } else {
      return {
        text: loading ? 'Sending...' : 'Send for Signature',
        icon: loading ? <CircularProgress size={20} /> : <FileText />, // Using FileText as fallback
        disabled: loading || !contractRecord?.id,
        color: 'primary',
        onClick: () => setShowSignerDialog(true)
      };
    }
  };

  const buttonProps = getButtonContent();

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', width: "100%"}}>
        {/* Platform selector (only show if not sent yet) */}
        {!status && (
          <FormControl size="small" sx={{ minWidth: "100%" }}>
            <InputLabel>Platform</InputLabel>
            <Select
              value={platform}
              label="Platform"
              onChange={(e) => setPlatform(e.target.value)}
            >
              {platforms.map(p => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Button
          sx={{ minWidth: "100%" }}
          variant="outlined"
          onClick={buttonProps.onClick}
          disabled={buttonProps.disabled}
          startIcon={buttonProps.icon}
          color={buttonProps.color}
        >
          {buttonProps.text}
        </Button>
        
        {getStatusDisplay()}
      </Box>

      {status === 'declined' && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Contract was declined. You may need to revise and resend.
        </Alert>
      )}

      {status === 'expired' && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Contract has expired. You can resend it to create a new signing session.
        </Alert>
      )}

      {/* Signer Selection Dialog */}
      <SignerSelectionDialog
        open={showSignerDialog}
        onClose={() => setShowSignerDialog(false)}
        contractRecord={contractRecord}
        onConfirm={handleSendForSignature}
      />
    </>
  );
};

export default SignatureButton;