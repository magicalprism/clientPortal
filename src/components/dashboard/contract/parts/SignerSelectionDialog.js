'use client';
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { createClient } from '@/lib/supabase/browser';

const SignerSelectionDialog = ({ 
  open, 
  onClose, 
  contractRecord, 
  onConfirm 
}) => {
  const [signerType, setSignerType] = useState('manual'); // 'company', 'contact', 'manual'
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedContact, setSelectedContact] = useState('');
  const [manualSigners, setManualSigners] = useState([{ name: '', email: '', role: 'Client' }]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load companies
      const { data: companiesData } = await supabase
        .from('company')
        .select('id, title, email, contact_person')
        .order('title');
      
      // Load contacts
      const { data: contactsData } = await supabase
        .from('contact')
        .select('id, title, email, company_id, company(title)')
        .order('title');
      
      setCompanies(companiesData || []);
      setContacts(contactsData || []);

      // Auto-select based on contract relationships
      if (contractRecord?.company_id) {
        setSelectedCompany(contractRecord.company_id);
        setSignerType('company');
      }

    } catch (error) {
      console.error('Failed to load signer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addManualSigner = () => {
    setManualSigners([...manualSigners, { name: '', email: '', role: 'Additional Signer' }]);
  };

  const removeManualSigner = (index) => {
    if (manualSigners.length > 1) {
      setManualSigners(manualSigners.filter((_, i) => i !== index));
    }
  };

  const updateManualSigner = (index, field, value) => {
    const newSigners = [...manualSigners];
    newSigners[index][field] = value;
    setManualSigners(newSigners);
  };

  const getSignersForSubmission = () => {
    switch (signerType) {
      case 'company':
        const company = companies.find(c => c.id === selectedCompany);
        if (!company) return [];
        return [{
          name: company.contact_person || company.title,
          email: company.email,
          role: 'Company Representative',
          source: 'company',
          sourceId: company.id
        }];

      case 'contact':
        const contact = contacts.find(c => c.id === selectedContact);
        if (!contact) return [];
        return [{
          name: contact.title,
          email: contact.email,
          role: 'Contact',
          source: 'contact',
          sourceId: contact.id
        }];

      case 'manual':
        return manualSigners
          .filter(s => s.name && s.email)
          .map(s => ({
            name: s.name,
            email: s.email,
            role: s.role || 'Signer',
            source: 'manual'
          }));

      default:
        return [];
    }
  };

  const handleConfirm = () => {
    const signers = getSignersForSubmission();
    if (signers.length === 0) {
      alert('Please select or enter at least one signer.');
      return;
    }
    onConfirm(signers);
  };

  const isValid = () => {
    const signers = getSignersForSubmission();
    return signers.length > 0;
  };

  const getSelectedCompanyInfo = () => {
    const company = companies.find(c => c.id === selectedCompany);
    return company;
  };

  const getSelectedContactInfo = () => {
    const contact = contacts.find(c => c.id === selectedContact);
    return contact;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        Select Contract Signers
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Choose how to specify who should sign this contract. You can use existing company/contact information or enter details manually.
        </Alert>

        {/* Signer Type Selection */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            How would you like to specify signers?
          </Typography>
          <RadioGroup
            value={signerType}
            onChange={(e) => setSignerType(e.target.value)}
            row
          >
            <FormControlLabel 
              value="company" 
              control={<Radio />} 
              label="Use Company Info" 
            />
            <FormControlLabel 
              value="contact" 
              control={<Radio />} 
              label="Use Contact Info" 
            />
            <FormControlLabel 
              value="manual" 
              control={<Radio />} 
              label="Enter Manually" 
            />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ mb: 3 }} />

        {/* Company Selection */}
        {signerType === 'company' && (
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Company</InputLabel>
              <Select
                value={selectedCompany}
                label="Select Company"
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                {companies.map(company => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedCompany && getSelectedCompanyInfo() && (
              <Alert severity="success">
                <Typography variant="subtitle2">Selected Company Details:</Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {getSelectedCompanyInfo().contact_person || getSelectedCompanyInfo().title}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {getSelectedCompanyInfo().email}
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Contact Selection */}
        {signerType === 'contact' && (
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Contact</InputLabel>
              <Select
                value={selectedContact}
                label="Select Contact"
                onChange={(e) => setSelectedContact(e.target.value)}
              >
                {contacts.map(contact => (
                  <MenuItem key={contact.id} value={contact.id}>
                    <Box>
                      <Typography variant="body2">
                        {contact.title}
                      </Typography>
                      {contact.company && (
                        <Typography variant="caption" color="text.secondary">
                          {contact.company.title}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedContact && getSelectedContactInfo() && (
              <Alert severity="success">
                <Typography variant="subtitle2">Selected Contact Details:</Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {getSelectedContactInfo().title}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {getSelectedContactInfo().email}
                </Typography>
                {getSelectedContactInfo().company && (
                  <Typography variant="body2">
                    <strong>Company:</strong> {getSelectedContactInfo().company.title}
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        )}

        {/* Manual Entry */}
        {signerType === 'manual' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Enter Signer Details
            </Typography>
            
            {manualSigners.map((signer, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={`Signer ${index + 1}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                  {manualSigners.length > 1 && (
                    <Button 
                      onClick={() => removeManualSigner(index)}
                      color="error"
                      size="small"
                    >
                      Remove
                    </Button>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Full Name"
                    value={signer.name}
                    onChange={(e) => updateManualSigner(index, 'name', e.target.value)}
                    sx={{ flex: 1 }}
                    required
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={signer.email}
                    onChange={(e) => updateManualSigner(index, 'email', e.target.value)}
                    sx={{ flex: 1 }}
                    required
                  />
                </Box>
                
                <TextField
                  label="Role/Title"
                  value={signer.role}
                  onChange={(e) => updateManualSigner(index, 'role', e.target.value)}
                  placeholder="e.g., CEO, Project Manager, Client"
                  fullWidth
                />
              </Box>
            ))}
            
            <Button 
              onClick={addManualSigner} 
              variant="outlined" 
              size="small"
            >
              Add Another Signer
            </Button>
          </Box>
        )}

        {/* Preview Selected Signers */}
        {isValid() && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Contract will be sent to:
            </Typography>
            {getSignersForSubmission().map((signer, index) => (
              <Typography key={index} variant="body2">
                • {signer.name} ({signer.email}) - {signer.role}
              </Typography>
            ))}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          disabled={!isValid() || loading}
        >
          Send for Signature
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignerSelectionDialog;