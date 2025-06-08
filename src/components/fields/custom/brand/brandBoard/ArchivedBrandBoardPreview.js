// BrandBoardPreview.jsx - Updated inline version for collection pages
import { Box, Button, Typography, Alert } from '@mui/material';
import { ExternalLink } from '@phosphor-icons/react';
import { BrandBoardContent } from '@/components/fields/custom/brandBoard/BrandBoardContent'; // Make sure this path is correct

export const BrandBoardPreview = (props) => {
  // Handle different ways props might be passed
  const directBrand = props.brand || props.value || props.data;
  const record = props.record || {};
  const editable = props.editable !== false;
  
  // Determine brand data
  let brandToUse = null;
  if (directBrand && directBrand.id) {
    brandToUse = directBrand;
  } else if (record?.brands_details && record.brands_details.length > 0) {
    const primaryBrand = record.brands_details.find(b => b.brand?.status === 'primary');
    brandToUse = primaryBrand?.brand || record.brands_details[0].brand;
  } else if (record?.brands && record.brands.length > 0) {
    const primaryBrand = record.brands.find(b => b.status === 'primary');
    brandToUse = primaryBrand || record.brands[0];
  } else if (record?.id) {
    brandToUse = record;
  }

  const openFullPageView = () => {
    if (!brandToUse?.id) return;
    // This creates the URL: /brand-board/[brandId]
    const url = `/brand-board/${brandToUse.id}`;
    window.open(url, '_blank');
  };

  if (!brandToUse?.id) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        <Typography variant="body2">
          No brand data available to preview.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Full Page View Button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        mb: 2 
      }}>
        <Button
          variant="outlined"
          startIcon={<ExternalLink size={16} />}
          onClick={openFullPageView}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none'
          }}
        >
          Open Full View
        </Button>
      </Box>

      {/* Inline Brand Board Content - Transparent background */}
      <BrandBoardContent 
        brand={brandToUse}
        mode="light" // Fixed to light mode for inline version
        editable={editable}
      />
    </Box>
  );
};

export default BrandBoardPreview;