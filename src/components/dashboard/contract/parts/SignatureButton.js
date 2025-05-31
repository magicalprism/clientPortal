// /components/dashboard/contract/parts/SignatureButton.js - Enhanced with resend capability and validation
'use client';
import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  PaperPlaneTilt, 
  X, 
  Plus, 
  CheckCircle, 
  Clock, 
  WarningCircle,
  ArrowCounterClockwise
} from '@phosphor-icons/react';

const SignatureButton = ({ contractRecord, onStatusUpdate }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [signers, setSigners] = useState([{ name: '', email: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Get signature status info
  const getStatusInfo = () => {
    const status = contractRecord?.signature_status;
    
    switch (status) {
      case 'sent':
        return {
          label: 'Sent for Signature',
          color: 'warning',
          icon: <Clock size={16} />,
          canResend: true
        };
      case 'signed':
        return {
          label: 'Signed',
          color: 'success',
          icon: <CheckCircle size={16} />,
          canResend: false
        };
      case 'declined':
        return {
          label: 'Declined',
          color: 'error',
          icon: <WarningCircle size={16} />,
          canResend: true
        };
      case 'expired':
        return {
          label: 'Expired',
          color: 'error',
          icon: <WarningCircle size={16} />,
          canResend: true
        };
      default:
        return {
          label: 'Not Sent',
          color: 'default',
          icon: null,
          canResend: false
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleAddSigner = () => {
    setSigners([...signers, { name: '', email: '' }]);
  };

  const handleRemoveSigner = (index) => {
    if (signers.length > 1) {
      setSigners(signers.filter((_, i) => i !== index));
    }
  };

  const handleSignerChange = (index, field, value) => {
    const newSigners = [...signers];
    newSigners[index][field] = value;
    setSigners(newSigners);
  };

  const validateSigners = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    for (let signer of signers) {
      if (!signer.name.trim()) {
        return 'All signers must have a name';
      }
      if (!signer.email.trim()) {
        return 'All signers must have an email';
      }
      if (!emailRegex.test(signer.email)) {
        return `Invalid email format: ${signer.email}`;
      }
    }
    return null;
  };

  const handleSendForSignature = async (forceResend = false) => {
    const validationError = validateSigners();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('[SignatureButton] Sending contract for signature...', {
        contractId: contractRecord.id,
        signers: signers.map(s => ({ name: s.name, email: s.email })),
        forceResend
      });

      const response = await fetch('/api/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: contractRecord.id,
          platform: 'esignatures',
          signers: signers.map(s => ({ name: s.name.trim(), email: s.email.trim() })),
          forceResend
        }),
      });

      const result = await response.json();
      console.log('[SignatureButton] API Response:', result);

      if (response.ok && result.success) {
        setSuccess(`Contract sent for signature successfully! Document ID: ${result.documentId}`);
        setIsDialogOpen(false);
        
        // Call the status update callback
        if (onStatusUpdate) {
          onStatusUpdate('sent', {
            documentId: result.documentId,
            signUrl: result.signUrl,
            platform: result.platform
          });
        }
        
        // Optionally refresh the page or update local state
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } else if (!response.ok || !result.success) {
        // Handle different types of errors
        if (result.error === 'Contract is already sent for signature' && result.canResend) {
          setError(
            <Box>
              <Typography variant="body2" gutterBottom>
                {result.error}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleSendForSignature(true)}
                startIcon={<ArrowCounterClockwise size={16} />}
                sx={{ mt: 1 }}
              >
                Resend Contract
              </Button>
            </Box>
          );
        } else {
          setError(result.error || result.details || 'Failed to send contract for signature');
        }
      }

    } catch (err) {
      console.error('[SignatureButton] Network error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = () => {
    // Pre-populate with any existing signers from metadata
    const existingSigners = contractRecord?.signature_metadata?.signers;
    if (existingSigners && existingSigners.length > 0) {
      setSigners(existingSigners);
    }
    
    setIsDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      {/* Status Display and Action Button */}
      <Stack direction="row" spacing={2} alignItems="center">
        {contractRecord?.signature_status && (
          <Chip
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
            icon={statusInfo.icon}
          />
        )}
        
        {statusInfo.canResend ? (
          <Tooltip title="Resend contract for signature">
            <Button
              variant="outlined"
              size="small"
              onClick={openDialog}
              startIcon={<ArrowCounterClockwise size={16} />}
            >
              Resend
            </Button>
          </Tooltip>
        ) : (
          <Button
            variant="contained"
            onClick={openDialog}
            startIcon={<PaperPlaneTilt size={16} />}
            disabled={!contractRecord?.id || contractRecord?.signature_status === 'signed'}
          >
            Send for Signature
          </Button>
        )}
      </Stack>

      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      {/* Signature Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '400px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {statusInfo.canResend ? 'Resend Contract for Signature' : 'Send Contract for Signature'}
          <IconButton onClick={() => setIsDialogOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Contract: <strong>{contractRecord?.title || 'Untitled Contract'}</strong>
            </Typography>
            {contractRecord?.signature_status && (
              <Typography variant="body2" color="text.secondary">
                Current Status: <strong>{statusInfo.label}</strong>
              </Typography>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Signers
          </Typography>
          
          {signers.map((signer, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium">
                  Signer {index + 1}
                </Typography>
                {signers.length > 1 && (
                  <IconButton 
                    size="small" 
                    onClick={() => handleRemoveSigner(index)}
                    color="error"
                  >
                    <X size={16} />
                  </IconButton>
                )}
              </Stack>
              
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={signer.name}
                  onChange={(e) => handleSignerChange(index, 'name', e.target.value)}
                  placeholder="Enter signer's full name"
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={signer.email}
                  onChange={(e) => handleSignerChange(index, 'email', e.target.value)}
                  placeholder="Enter signer's email"
                  size="small"
                />
              </Stack>
            </Box>
          ))}
          
          <Button
            variant="outlined"
            onClick={handleAddSigner}
            startIcon={<Plus size={16} />}
            sx={{ mt: 1 }}
            fullWidth
          >
            Add Another Signer
          </Button>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Note:</strong> The contract will be sent via eSignatures.com. 
              Each signer will receive an email with a secure link to review and sign the document.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setIsDialogOpen(false)} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSendForSignature(false)}
            disabled={loading || signers.some(s => !s.name.trim() || !s.email.trim())}
            startIcon={loading ? <CircularProgress size={16} /> : <PaperPlaneTilt size={16} />}
          >
            {loading ? 'Sending...' : (statusInfo.canResend ? 'Resend Contract' : 'Send Contract')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SignatureButton;