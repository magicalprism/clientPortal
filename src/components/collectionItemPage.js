'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Tabs,
  Tab
} from '@mui/material';

export const CollectionItemPage = ({ config, record }) => {
  const [activeTab, setActiveTab] = useState(0);

  // Organize fields by tab and group
  const tabsWithGroups = config.fields.reduce((acc, field) => {
    const tab = field.tab || 'General';
    const group = field.group || 'Info';
    if (!acc[tab]) acc[tab] = {};
    if (!acc[tab][group]) acc[tab][group] = [];
    acc[tab][group].push(field);
    return acc;
  }, {});

  const tabNames = Object.keys(tabsWithGroups);

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="md">
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
          variant="scrollable"
        >
          {tabNames.map((tabName) => (
            <Tab key={tabName} label={tabName} />
          ))}
        </Tabs>

        <Grid container spacing={3}>
          {Object.entries(tabsWithGroups[tabNames[activeTab]]).map(
            ([groupName, fields]) => (
              <Grid item xs={12} key={groupName}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{groupName}</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {fields.map((field) => (
                        <Grid item xs={12} sm={6} key={field.name}>
                          <Typography variant="subtitle2">{field.label}</Typography>
                          <Typography>
                            {formatValue(record[field.name], field, record)}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )
          )}
        </Grid>
      </Container>
    </Box>
  );
};

const formatValue = (value, field, record) => {
  if (value == null) return '—';

  if (field.type === 'media') {
    return <img src={value} alt="" style={{ maxWidth: '100%', borderRadius: 8 }} />;
  }

  if (field.type === 'link') {
    const displayText = field.displayLabel || value;
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1976d2', wordBreak: 'break-word' }}
      >
        {displayText}
      </a>
    );
  }
  

  if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
    return value;
  }

  switch (field.type) {
    case 'relationship': {
      const { relation } = field;
      const label = record[`${field.name}_label`] || `ID: ${value}`;
      const href = `${relation?.linkTo || '#'}${value ? `/${value}` : ''}`;
      return (
        <a href={href} style={{ textDecoration: 'none', color: '#1976d2' }}>
          {label}
        </a>
      );
    }
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'status':
      return <span style={{ textTransform: 'capitalize' }}>{value}</span>;
    case 'json':
      return <pre style={{ fontSize: '0.85em', whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</pre>;
    default:
      return value.toString();
  }
};
