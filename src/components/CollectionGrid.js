// src/components/CollectionGrid.js
import { Card, Typography, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import { FieldRenderer } from './FieldRenderer';

export const CollectionGrid = ({ data, config }) => {
  const router = useRouter();

  return (
    <Grid container spacing={3}>
      {data.map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item.id}>
          <Card
            onClick={() => router.push(config.editRoute(item.id))}
            sx={{ cursor: 'pointer', p: 2 }}
          >
            {config.fields.map((field) => (
              <Typography key={field.name} variant="body2" color="textSecondary">
                <strong>{field.label}:</strong>{' '}
                <FieldRenderer value={item[field.name]} field={field} />
              </Typography>
            ))}
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
