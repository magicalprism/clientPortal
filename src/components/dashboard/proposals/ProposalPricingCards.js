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
  AccordionDetails
} from '@mui/material';
import { Check as CheckIcon, CaretDown as CaretDownIcon } from '@phosphor-icons/react';

const ProposalPricingCards = ({ products = [], proposal = {}, setActiveProductId, activeProductId, addOns = [] }) => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [selectedAddOns, setSelectedAddOns] = useState(new Set());

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
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={!currentActiveId}
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
                Choose Plan
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProposalPricingCards;