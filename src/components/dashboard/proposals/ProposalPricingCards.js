import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Card,
  Switch,
  Radio,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { Check as CheckIcon, CaretDown as CaretDownIcon } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/browser';
import { getCurrentContactId } from '@/lib/utils/getCurrentContactId';
import { useRouter } from 'next/navigation';

const ProposalPricingCards = ({ 
  products = [], 
  proposal = {}, 
  setActiveProductId, 
  activeProductId, 
  addOns = [],
  companyId = null,
  onProposalCreated = null // Callback for when proposal is created
}) => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [selectedAddOns, setSelectedAddOns] = useState(new Set());
  const [choosePlanDialog, setChoosePlanDialog] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const supabase = createClient();
  const router = useRouter();

  // Filter out addon products for main pricing
  const coreProducts = products.filter(p => p.type !== 'addon');
  
  // Set default active product if none selected
  useEffect(() => {
    if (!activeProductId && coreProducts.length > 0) {
      setActiveProductId(coreProducts[0].id);
    }
  }, [activeProductId, coreProducts, setActiveProductId]);

  const currentActiveId = activeProductId || coreProducts[0]?.id;
  const selectedProduct = coreProducts.find(product => product.id === currentActiveId) || coreProducts[0];

  const getCurrentPrice = (product) => {
    const basePrice = parseFloat(product.price) || 0;
    if (billingPeriod === 'yearly' && product.yearly_price) {
      return parseFloat(product.yearly_price) || basePrice;
    }
    return basePrice;
  };

  const getAddOnPrice = (addon) => {
    const basePrice = parseFloat(addon.price) || 0;
    if (billingPeriod === 'yearly' && addon.yearly_price) {
      return parseFloat(addon.yearly_price) || basePrice;
    }
    return basePrice;
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
  };

  const getTotalPrice = () => {
    const basePrice = selectedProduct ? getCurrentPrice(selectedProduct) : 0;
    const addOnsTotal = Array.from(selectedAddOns).reduce((total, addonId) => {
      const addon = addOns.find(a => a.id === addonId);
      return total + (addon ? getAddOnPrice(addon) : 0);
    }, 0);
    return basePrice + addOnsTotal;
  };

  const toggleAddOn = (addonId) => {
    setSelectedAddOns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(addonId)) {
        newSet.delete(addonId);
      } else {
        newSet.add(addonId);
      }
      return newSet;
    });
  };

  // Determine if we're creating a proposal or generating a contract
  const isExistingProposal = proposal && proposal.id;
  const actionText = isExistingProposal ? 'Generate Contract' : 'Choose Plan';
  const dialogTitle = isExistingProposal ? 'Generate Contract' : 'Create Proposal';

  // Handle Choose Plan button click
  const handleChoosePlan = () => {
    if (!selectedProduct) {
      setError('Please select a product first');
      return;
    }

    if (isExistingProposal) {
      // If we have an existing proposal, generate contract directly
      generateContract();
    } else {
      // Generate default proposal title
      const defaultTitle = `${selectedProduct.title} Proposal - ${new Date().toLocaleDateString()}`;
      setProposalTitle(defaultTitle);
      setChoosePlanDialog(true);
      setError('');
    }
  };

  // Generate contract from existing proposal
  const generateContract = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('[ProposalPricingCards] Generating contract from proposal:', proposal.id);

      // Call the workflow API to generate contract
      const response = await fetch('/api/proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_contract',

          billingPeriod,
          selectedProducts: [selectedProduct.id, ...Array.from(selectedAddOns)]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate contract');
      }

      console.log('[ProposalPricingCards] Contract generated:', result);

      // Success!
      setSuccessMessage('Contract generated successfully!');
      
      // Call callback if provided
      if (onProposalCreated) {
        onProposalCreated(result.contract);
      }

      // Navigate to contract details after a short delay
      setTimeout(() => {
        router.push(`/dashboard/contract/${result.contract.id}?modal=edit`);
      }, 2000);

    } catch (err) {
      console.error('[ProposalPricingCards] Error generating contract:', err);
      setError(err.message || 'Failed to generate contract');
    } finally {
      setLoading(false);
    }
  };

  // Create the proposal (for new proposals only)
  const createProposal = async () => {
    if (!proposalTitle.trim()) {
      setError('Please enter a proposal title');
      return;
    }

    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get current contact ID
      const contactId = await getCurrentContactId();
      if (!contactId) {
        throw new Error('Unable to identify current user');
      }

      // Calculate total price
      const totalPrice = getTotalPrice();

      // Create proposal record
      const proposalData = {
        title: proposalTitle.trim(),
        company_id: companyId,
        author_id: contactId,
        status: 'draft',
        billing_period: billingPeriod,
        total_amount: totalPrice,
        primary_product_id: selectedProduct.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[ProposalPricingCards] Creating proposal:', proposalData);

      const { data: newProposal, error: proposalError } = await supabase
        .from('proposal')
        .insert(proposalData)
        .select()
        .single();

      if (proposalError) {
        throw proposalError;
      }

      console.log('[ProposalPricingCards] Proposal created:', newProposal);

      // Add main product to proposal
      const { error: productError } = await supabase
        .from('proposal_product')
        .insert({
          proposal_id: newProposal.id,
          product_id: selectedProduct.id,
          price: getCurrentPrice(selectedProduct),
          billing_period: billingPeriod,
          is_addon: false
        });

      if (productError) {
        throw productError;
      }

      // Add selected add-ons
      if (selectedAddOns.size > 0) {
        const addonInserts = Array.from(selectedAddOns).map(addonId => {
          const addon = addOns.find(a => a.id === addonId);
          return {
            proposal_id: newProposal.id,
            product_id: addonId,
            price: getAddOnPrice(addon),
            billing_period: billingPeriod,
            is_addon: true
          };
        });

        const { error: addonsError } = await supabase
          .from('proposal_product')
          .insert(addonInserts);

        if (addonsError) {
          throw addonsError;
        }
      }

      // Success!
      setSuccessMessage('Proposal created successfully!');
      setChoosePlanDialog(false);
      
      // Call callback if provided
      if (onProposalCreated) {
        onProposalCreated(newProposal);
      }

      // Navigate to proposal details after a short delay
      setTimeout(() => {
        router.push(`/dashboard/proposal/${newProposal.id}?modal=edit`);
      }, 2000);

    } catch (err) {
      console.error('[ProposalPricingCards] Error creating proposal:', err);
      setError(err.message || 'Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  // Group features and deliverables by type for better organization
  const groupByType = (items = []) => {
    const groups = {};
    items.forEach(item => {
      const type = item.type || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    });
    return groups;
  };

  const selectedFeatures = selectedProduct?.features || [];
  const selectedDeliverables = selectedProduct?.deliverables || [];
  const groupedFeatures = groupByType(selectedFeatures);
  const groupedDeliverables = groupByType(selectedDeliverables);

  // Component for clickable items with descriptions
  const ClickableItem = ({ item, size = 10 }) => {
    const hasDescription = item.description && item.description.trim();
    
    if (hasDescription) {
      return (
        <Accordion 
          sx={{ 
            boxShadow: 'none',
            '&:before': { display: 'none' },
            '& .MuiAccordionSummary-root': {
              minHeight: 'auto',
              px: 0,
              py: 0.5,
              '& .MuiAccordionSummary-content': {
                margin: 0,
                alignItems: 'center'
              }
            }
          }}
        >
          <AccordionSummary
            expandIcon={<CaretDownIcon size={12} color="currentColor" />}
            sx={{ 
              '& .MuiAccordionSummary-expandIconWrapper': {
                transform: 'rotate(-90deg)',
                '&.Mui-expanded': {
                  transform: 'rotate(0deg)',
                }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: 'primary.500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckIcon size={size} color="white" />
              </Box>
              <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                {item.title}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, py: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', ml: 4 }}>
              {item.description}
            </Typography>
          </AccordionDetails>
        </Accordion>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: 'primary.500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CheckIcon size={size} color="white" />
        </Box>
        <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
          {item.title}
        </Typography>
      </Box>
    );
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#1a1a1a' }}>
            Simple, transparent pricing
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
            No contracts. No surprise fees.
          </Typography>

          {/* Billing Period Toggle - Only show if any product has yearly pricing */}
          {coreProducts.some(product => product.yearly_price) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 6 }}>
              <Typography sx={{ color: billingPeriod === 'monthly' ? 'primary.main' : 'text.secondary' }}>
                Monthly
              </Typography>
              <Switch
                checked={billingPeriod === 'yearly'}
                onChange={(e) => setBillingPeriod(e.target.checked ? 'yearly' : 'monthly')}
                sx={{
                  '& .MuiSwitch-thumb': {
                    backgroundColor: 'primary.500',
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: 'primary.500',
                  }
                }}
              />
              <Typography sx={{ color: billingPeriod === 'yearly' ? 'primary.main' : 'text.secondary' }}>
                Yearly
              </Typography>
            </Box>
          )}
        </Box>

        {/* Main Content Grid */}
        <Grid container spacing={6}>
          {/* Left Side - Pricing Cards */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {coreProducts.map((product) => {
                const isSelected = currentActiveId === product.id;
                const isPopular = product.title?.toLowerCase().includes('popular');
                
                return (
                  <Card
                    key={product.id}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      border: isSelected ? '2px solid' : '1px solid #e5e7eb',
                      borderColor: isSelected ? 'primary.500' : '#e5e7eb',
                      backgroundColor: isPopular ? 'primary.500' : 'white',
                      color: isPopular ? 'white' : 'inherit',
                      borderRadius: 3,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => setActiveProductId(product.id)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Radio
                          checked={isSelected}
                          value={product.id}
                          sx={{
                            color: isPopular ? 'white' : 'grey.400',
                            '&.Mui-checked': {
                              color: isPopular ? 'white' : 'primary.500',
                            }
                          }}
                        />
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {product.title}
                          </Typography>
                          {billingPeriod === 'yearly' && product.yearly_price && product.yearly_price < product.price && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: isPopular ? '#fecaca' : '#ef4444', 
                                fontWeight: 600 
                              }}
                            >
                              Save ${formatPrice(product.price - product.yearly_price)}{(billingPeriod === 'yearly' || product.frequency) ? `/${billingPeriod === 'yearly' ? 'annually' : product.frequency}` : ''}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          ${formatPrice(getCurrentPrice(product))}
                        </Typography>
                        {(billingPeriod === 'yearly' || product.frequency) && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: isPopular ? '#e0e7ff' : 'text.secondary'
                            }}
                          >
                            / {billingPeriod === 'yearly' ? 'annually' : product.frequency}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </Box>

            {/* Add-ons Section */}
            {addOns.length > 0 && (
              <>
                <Typography variant="h6" sx={{ fontWeight: 600, my: 3 }}>
                  Add-ons
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {addOns.map((addon) => (
                    <Box key={addon.id} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 2,
                      border: '1px solid #e5e7eb',
                      borderRadius: 2,
                      '&:hover': { backgroundColor: '#f9fafb' }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Switch 
                          size="small" 
                          checked={selectedAddOns.has(addon.id)}
                          onChange={() => toggleAddOn(addon.id)}
                        />
                        <Box>
                          <Typography fontWeight={500}>{addon.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {addon.description}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography fontWeight={600} color="primary.main">
                        +${formatPrice(getAddOnPrice(addon))}{(billingPeriod === 'yearly' || addon.frequency) ? `/${billingPeriod === 'yearly' ? 'annually' : addon.frequency}` : ''}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Divider sx={{ my: 3 }} />
              </>
            )}
          </Grid>

          {/* Right Side - Selected Plan Details */}
          <Grid item xs={12} md={6}>
            <Box sx={{ pr: 4 }}>
              {selectedProduct && (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {selectedProduct.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                    {selectedProduct.description}
                  </Typography>

                  {/* Deliverables Section */}
                  {Object.keys(groupedDeliverables).length > 0 && (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Deliverables
                      </Typography>
                      {Object.entries(groupedDeliverables).map(([type, deliverables]) => (
                        <Box key={type} sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                            {type}
                          </Typography>
                          <Grid container spacing={2}>
                            {deliverables.map((deliverable) => (
                              <Grid item xs={4} key={deliverable.id}>
                                <ClickableItem item={deliverable} />
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      ))}
                      <Divider sx={{ my: 3 }} />
                    </>
                  )}

                  {/* Features Section */}
                  {Object.keys(groupedFeatures).length > 0 && (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Features
                      </Typography>
                      {Object.entries(groupedFeatures).map(([type, features]) => (
                        <Box key={type} sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                            {type}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {features.map((feature) => (
                              <ClickableItem key={feature.id} item={feature} />
                            ))}
                          </Box>
                        </Box>
                      ))}
                      <Divider sx={{ my: 3 }} />
                    </>
                  )}

                  {/* Selected Add-ons Section */}
                  {selectedAddOns.size > 0 && (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Selected Add-ons
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                        {Array.from(selectedAddOns).map((addonId) => {
                          const addon = addOns.find(a => a.id === addonId);
                          if (!addon) return null;
                          return (
                            <Box key={addon.id} sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              p: 2,
                              border: '1px solid',
                              borderColor: 'primary.200',
                              backgroundColor: 'primary.50',
                              borderRadius: 2
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                  sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    backgroundColor: 'primary.500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <CheckIcon size={10} color="white" />
                                </Box>
                                <Box>
                                  <Typography fontWeight={500} sx={{ fontSize: '0.9rem' }}>
                                    {addon.title}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {addon.description}
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography fontWeight={600} color="primary.main" sx={{ fontSize: '0.875rem' }}>
                                +${formatPrice(getAddOnPrice(addon))}{(billingPeriod === 'yearly' || addon.frequency) ? `/${billingPeriod === 'yearly' ? 'annually' : addon.frequency}` : ''}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                      <Divider sx={{ my: 3 }} />
                    </>
                  )}
                </>
              )}

              {/* Choose Plan Button */}
              <Box sx={{ mb: 2 }}>
                {selectedAddOns.size > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Total Cost:
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      ${formatPrice(getTotalPrice())}{(billingPeriod === 'yearly' || selectedProduct?.frequency) ? `/${billingPeriod === 'yearly' ? 'annually' : selectedProduct?.frequency}` : ''}
                    </Typography>
                  </Box>
                )}
                
                {/* Error Display - Show for both contract generation and proposal errors */}
                {error && !choosePlanDialog && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={!currentActiveId || loading}
                  onClick={handleChoosePlan}
                  sx={{
                    backgroundColor: 'primary.500',
                    '&:hover': {
                      backgroundColor: 'primary.600',
                    },
                    py: 2,
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: '1.1rem'
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : actionText}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Choose Plan Dialog - Only show for new proposals */}
      {!isExistingProposal && (
        <Dialog 
          open={choosePlanDialog} 
          onClose={() => !loading && setChoosePlanDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {dialogTitle}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                autoFocus
                margin="dense"
                label="Proposal Title"
                fullWidth
                variant="outlined"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              
              {/* Summary */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Summary
              </Typography>
              <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Selected Product:</strong> {selectedProduct?.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Billing Period:</strong> {billingPeriod}
                </Typography>
                {selectedAddOns.size > 0 && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Add-ons:</strong> {Array.from(selectedAddOns).map(id => addOns.find(a => a.id === id)?.title).join(', ')}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  <strong>Total: ${formatPrice(getTotalPrice())}</strong>
                  {(billingPeriod === 'yearly' || selectedProduct?.frequency) ? `/${billingPeriod === 'yearly' ? 'annually' : selectedProduct?.frequency}` : ''}
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setChoosePlanDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={createProposal}
              variant="contained"
              disabled={loading || !proposalTitle.trim()}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Create Proposal'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProposalPricingCards;