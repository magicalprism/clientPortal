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
import { createClient } from "@/lib/supabase/browser";

export const BrandBoardFullPage = () => {
  const [mode, setMode] = useState('light');
  const { brandId } = useParams();
  const navigate = useNavigate();
  
  // You'll need to fetch the brand data here based on brandId
  // For now, assuming you have a way to get brand data
  const [brand, setBrand] = useState(null);

  // Load brand data based on brandId
  useEffect(() => {
    const loadBrand = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('brand')
          .select('*')
          .eq('id', brandId)
          .single();

        if (error) throw error;
        setBrand(data);
      } catch (error) {
        console.error('Error loading brand:', error);
      }
    };

    if (brandId) {
      loadBrand();
    }
  }, [brandId]);

  const getBgColor = () => {
    if (!brand) {
      return mode === 'light' ? '#ffffff' : '#1a1a1a';
    }
    return mode === 'light'
      ? brand.neutral_color_100 || '#ffffff'
      : brand.neutral_color_900 || '#1a1a1a';
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
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ color: mode === 'light' ? 'text.primary' : 'white' }}
          >
            <ArrowLeft size={20} />
          </IconButton>

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
              sx={{ color: mode === 'light' ? 'text.secondary' : 'rgba(255,255,255,0.7)' }}
            >
              {mode === 'light' ? 'Light' : 'Dark'} Mode
            </Typography>
          </Box>

          {/* Print Button */}
          <IconButton
            onClick={() => window.print()}
            title="Print Brand Board"
            sx={{ color: mode === 'light' ? 'text.primary' : 'white' }}
          >
            <DownloadSimple size={20} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Brand Board Content - Full page with padding */}
      <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
          {brand ? (
          <BrandBoardContent
            brand={brand}
            mode={mode}
            editable={true}
            showControls={false}
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
              sx={{ color: mode === 'light' ? 'text.secondary' : 'rgba(255,255,255,0.7)' }}
            >
              Loading brand board...
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default BrandBoardFullPage;