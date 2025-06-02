'use client';

import React, { useState } from 'react';
import {
  Box, Button, Card, Container, Grid, Typography, Radio, RadioGroup, FormControlLabel, Paper,
} from '@mui/material';

const samplePlans = [
  {
    id: 1,
    title: 'Intro',
    price: 19,
    description: 'Perfect for startups or simple needs.',
    deliverables: ['Basic Website', '1 Landing Page', 'Email Setup'],
  },
  {
    id: 2,
    title: 'Base',
    price: 39,
    description: 'Covers all your marketing needs.',
    deliverables: ['3 Pages', 'Contact Form', 'SEO Basics'],
  },
  {
    id: 3,
    title: 'Popular',
    price: 99,
    description: 'Our most loved plan with powerful tools.',
    deliverables: ['5 Pages', 'CMS', 'Basic Automations'],
  },
  {
    id: 4,
    title: 'Enterprise',
    price: 119,
    description: 'Custom enterprise-grade services.',
    deliverables: ['Custom Integrations', 'Priority Support', 'Full Branding'],
  }
];

export default function PricingPlansSection() {
  const [selectedPlan, setSelectedPlan] = useState(samplePlans[0].id);

  return (
    <Box sx={{ py: 10, bgcolor: '#fafafa' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" align="center" fontWeight={700} gutterBottom>
          Simple, transparent pricing
        </Typography>
        <Typography variant="subtitle1" align="center" sx={{ mb: 6 }}>
          No contracts. No surprise fees. Choose your plan, then customize with add-ons.
        </Typography>

        <Grid container spacing={4}>
          {/* Feature labels (left) */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>What’s Included:</Typography>
              {samplePlans[0].deliverables.map((_, idx) => (
                <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                  • {samplePlans.find(p => p.id === selectedPlan)?.deliverables[idx] ?? ''}
                </Typography>
              ))}
            </Paper>
          </Grid>

          {/* Plan selector (right) */}
          <Grid item xs={12} md={7}>
            <RadioGroup
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(Number(e.target.value))}
            >
              {samplePlans.map((plan) => (
                <Card
                  key={plan.id}
                  variant="outlined"
                  sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 3,
                    borderColor: plan.id === selectedPlan ? 'primary.main' : 'grey.300',
                    bgcolor: plan.id === selectedPlan ? 'primary.50' : 'white',
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <FormControlLabel
                    value={plan.id}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="h6" fontWeight={600}>{plan.title}</Typography>
                        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                          {plan.description}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          ${plan.price} <Typography variant="caption" component="span">/project</Typography>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                          Includes: {plan.deliverables.join(', ')}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Card>
              ))}
            </RadioGroup>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button variant="contained" color="primary" size="large">
                Continue with Selected Plan
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
