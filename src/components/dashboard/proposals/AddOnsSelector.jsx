import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Button,
} from '@mui/material';

const sampleAddOns = [
  {
    id: 'seo_boost',
    title: 'SEO Boost Package',
    description: 'Advanced keyword optimization and on-page SEO setup.',
    price: 199,
  },
  {
    id: 'content_package',
    title: 'Content Package',
    description: 'Includes 3 blog posts, 1 lead magnet, and 5 social captions.',
    price: 350,
  },
  {
    id: 'custom_integrations',
    title: 'Custom Integrations',
    description: 'We’ll integrate your tools, from CRM to analytics.',
    price: 499,
  },
];

export default function AddOnsSelector({ selected = [], onChange }) {
  const [selectedAddOns, setSelectedAddOns] = useState(selected);

  const handleToggle = (id) => {
    const updated = selectedAddOns.includes(id)
      ? selectedAddOns.filter((item) => item !== id)
      : [...selectedAddOns, id];
    setSelectedAddOns(updated);
    onChange?.(updated);
  };

  return (
    <Box sx={{ py: 8 }}>
      <Typography variant="h4" align="center" fontWeight={700} sx={{ mb: 4 }}>
        Optional Add-ons
      </Typography>
      <Grid container spacing={4}>
        {sampleAddOns.map((addon) => (
          <Grid item xs={12} md={6} key={addon.id}>
            <Card
              variant="outlined"
              sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <CardContent>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedAddOns.includes(addon.id)}
                      onChange={() => handleToggle(addon.id)}
                      color="primary"
                    />
                  }
                  label={<Typography variant="h6">{addon.title}</Typography>}
                />
                <Typography variant="body2" sx={{ my: 1 }}>
                  {addon.description}
                </Typography>
                <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                  ${addon.price}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button variant="contained" color="primary" size="large">
          Finalize Selection
        </Button>
      </Box>
    </Box>
  );
}
