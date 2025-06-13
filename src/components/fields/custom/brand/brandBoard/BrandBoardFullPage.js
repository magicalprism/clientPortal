// BrandBoardFullPage.jsx - Full page version (for separate route)
import { useState, useEffect } from 'react';
import { 
  Box, 
  Switch, 
  Typography, 
  IconButton,
  Container,
  AppBar,
  Toolbar,
  Paper
} from '@mui/material';
import { 
  Sun, 
  Moon, 
  DownloadSimple,
  ArrowLeft
} from '@phosphor-icons/react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrandBoardContent } from '@/components/fields/custom/brand/brandBoard/BrandBoardContent';
import { table } from '@/lib/supabase/queries';

export const BrandBoardFullPage = () => {
  const [mode, setMode] = useState('light');
  const { brandId } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load brand data using standardized queries
  useEffect(() => {
    const loadBrand = async () => {
      if (!brandId) {
        setError('No brand ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await table.brand.fetchBrandById(brandId);

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Brand not found');
        }

        setBrand(data);
      } catch (error) {
        console.error('Error loading brand:', error);
        setError(error.message || 'Failed to load brand');
      } finally {
        setLoading(false);
      }
    };

    loadBrand();
  }, [brandId]);

  const getBgColor = () => {
    if (!brand) {
      return mode === 'light' ? '#ffffff' : '#1a1a1a';
    }
    return mode === 'light'
      ? brand.neutral_color_100 || '#ffffff'
      : brand.neutral_color_900 || '#1a1a1a';
  };

  const getTextColor = () => {
    return mode === 'light' ? 'text.primary' : 'white';
  };

  const getSecondaryTextColor = () => {
    return mode === 'light' ? 'text.secondary' : 'rgba(255,255,255,0.7)';
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: getBgColor(),
        transition: 'background-color 0.3s ease'
      }}
    >
      {/* Top Navigation Bar */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: 'transparent',
          borderBottom: '1px solid',
          borderColor: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Back Button */}
        

          {/* Center Controls */}
          <Box display="flex" alignItems="center" gap={2}>
            <Switch
              checked={mode === 'light'}
              onChange={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              icon={
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.9)', 
                  border: '2px solid rgba(0,0,0,0.1)',
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Moon size={14} color="#424242" />
                </Box>
              }
              checkedIcon={
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.9)', 
                  border: '2px solid rgba(255,152,0,0.3)',
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Sun size={14} color="#ff9800" />
                </Box>
              }
              sx={{
                width: 56,
                height: 32,
                '& .MuiSwitch-switchBase': {
                  padding: '4px',
                  '&.Mui-checked': {
                    color: '#ffa726',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#ffcc80',
                    }
                  },
                },
                '& .MuiSwitch-track': {
                  backgroundColor: '#424242',
                  borderRadius: 16,
                }
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ color: getSecondaryTextColor() }}
            >
              {mode === 'light' ? 'Light' : 'Dark'} Mode
            </Typography>
          </Box>

          {/* Print Button */}
          <IconButton
            onClick={() => window.print()}
            title="Print Brand Board"
            sx={{ color: getTextColor() }}
          >
            <DownloadSimple size={20} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Brand Board Content - Full page with padding */}
      <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '50vh',
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography 
              variant="h6" 
              sx={{ color: getSecondaryTextColor() }}
            >
              Loading brand board...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '50vh',
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography 
              variant="h6" 
              sx={{ color: 'error.main' }}
            >
              Error Loading Brand
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ color: getSecondaryTextColor() }}
            >
              {error}
            </Typography>
           
          </Box>
        ) : brand ? (
          <BrandBoardContent
            brand={brand}
            mode={mode}
            editable={true}
            useBrandBackground={true}
          />
        ) : (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '50vh' 
          }}>
            <Typography 
              variant="h6" 
              sx={{ color: getSecondaryTextColor() }}
            >
              Brand not found
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default BrandBoardFullPage;