// app/brand-board/[brandId]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Switch, 
  Typography, 
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import { 
  Sun, 
  Moon, 
  DownloadSimple,
  ArrowLeft
} from '@phosphor-icons/react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { BrandBoardContent } from '@/components/fields/custom/brand/brandBoard/BrandBoardContent'; // Adjust this path

export default function BrandBoardFullPage() {
  const [mode, setMode] = useState('light');
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  
  const brandId = params.brandId;

  // Load brand data based on brandId
  useEffect(() => {
    const loadBrand = async () => {
      if (!brandId) return;
      
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
      } finally {
        setLoading(false);
      }
    };

    loadBrand();
  }, [brandId]);

  const getBgColor = () => {
    return mode === 'light' ? '#ffffff' : '#1a1a1a';
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: getBgColor(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6">Loading brand board...</Typography>
      </Box>
    );
  }

  if (!brand) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: getBgColor(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6">Brand not found</Typography>
      </Box>
    );
  }

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
            onClick={() => router.back()}
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
      <Box sx={{ py: 4, px: 4, maxWidth: '1400px', mx: 'auto' }}>
        <BrandBoardContent 
          brand={brand}
          mode={mode}
          editable={true}
        />
      </Box>
    </Box>
  );
}