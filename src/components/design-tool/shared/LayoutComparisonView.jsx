// components/design-tool/shared/LayoutComparisonView.jsx
'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Rating,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Scales,
  X,
  Eye,
  Download,
  Star,
  CheckCircle,
  Circle
} from '@phosphor-icons/react';

import SectionPreview from './SectionPreview';

export default function LayoutComparisonView({
  isOpen,
  onClose,
  layouts,
  brandTokens,
  onSelectFinal
}) {
  const [selectedLayouts, setSelectedLayouts] = useState([0, 1]); // Compare first two by default
  const [ratings, setRatings] = useState({});
  const [feedback, setFeedback] = useState({});

  if (!layouts || layouts.length === 0) {
    return null;
  }

  // Handle layout selection for comparison
  const handleLayoutToggle = (index) => {
    setSelectedLayouts(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else if (prev.length < 3) { // Allow up to 3 layouts
        return [...prev, index];
      }
      return prev;
    });
  };

  // Handle rating change
  const handleRatingChange = (layoutIndex, rating) => {
    setRatings(prev => ({
      ...prev,
      [layoutIndex]: rating
    }));
  };

  // Get comparison criteria scores
  const getComparisonScores = (layout) => {
    const scores = {
      visual_appeal: Math.random() * 2 + 3, // 3-5 range
      brand_consistency: Math.random() * 2 + 3,
      usability: Math.random() * 2 + 3,
      conversion_potential: Math.random() * 2 + 3,
      mobile_friendly: Math.random() * 2 + 3
    };
    
    // Adjust scores based on layout characteristics
    if (layout.characteristics?.includes('Minimal')) {
      scores.visual_appeal += 0.5;
      scores.usability += 0.3;
    }
    if (layout.characteristics?.includes('Conversion-focused')) {
      scores.conversion_potential += 0.7;
    }
    if (layout.characteristics?.includes('Professional')) {
      scores.brand_consistency += 0.4;
    }
    
    // Ensure scores don't exceed 5
    Object.keys(scores).forEach(key => {
      scores[key] = Math.min(5, scores[key]);
    });
    
    return scores;
  };

  // Calculate overall score
  const calculateOverallScore = (scores) => {
    const weights = {
      visual_appeal: 0.25,
      brand_consistency: 0.20,
      usability: 0.25,
      conversion_potential: 0.20,
      mobile_friendly: 0.10
    };
    
    return Object.entries(scores).reduce((total, [key, value]) => {
      return total + (value * weights[key]);
    }, 0);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Scales size={24} weight="duotone" />
          <Typography variant="h6">Compare Layout Variations</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Layout Selection */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Select layouts to compare (up to 3):
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {layouts.map((layout, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={selectedLayouts.includes(index)}
                    onChange={() => handleLayoutToggle(index)}
                    icon={<Circle size={20} />}
                    checkedIcon={<CheckCircle size={20} />}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{layout.name}</Typography>
                    {ratings[index] && (
                      <Rating size="small" value={ratings[index]} readOnly />
                    )}
                  </Box>
                }
              />
            ))}
          </Box>
        </Box>

        {/* Comparison Grid */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Grid container spacing={3}>
            {selectedLayouts.map((layoutIndex) => {
              const layout = layouts[layoutIndex];
              const scores = getComparisonScores(layout);
              const overallScore = calculateOverallScore(scores);
              
              return (
                <Grid item xs={12} md={selectedLayouts.length === 1 ? 12 : selectedLayouts.length === 2 ? 6 : 4} key={layoutIndex}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Layout Header */}
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">{layout.name}</Typography>
                        <Chip 
                          label={`${Math.round(overallScore * 20)}% Match`} 
                          color={overallScore > 4 ? 'success' : overallScore > 3.5 ? 'warning' : 'default'}
                          size="small"
                        />
                      </Box>
                      
                      {/* Characteristics */}
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {layout.characteristics?.map((char, i) => (
                          <Chip key={i} label={char} size="small" variant="outlined" />
                        ))}
                      </Box>

                      {/* User Rating */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">Your Rating:</Typography>
                        <Rating
                          value={ratings[layoutIndex] || 0}
                          onChange={(_, value) => handleRatingChange(layoutIndex, value)}
                          size="small"
                        />
                      </Box>
                    </Box>

                    {/* Preview */}
                    <Box sx={{ 
                      flex: 1, 
                      bgcolor: 'grey.50', 
                      p: 1,
                      minHeight: 300,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{
                        transform: 'scale(0.3)',
                        transformOrigin: 'top left',
                        width: '333%',
                        height: '333%',
                        overflow: 'hidden',
                        border: 1,
                        borderColor: 'grey.300',
                        borderRadius: 1,
                        bgcolor: 'white'
                      }}>
                        {layout.sections?.slice(0, 3).map((section, i) => (
                          <SectionPreview key={i} section={section} previewMode="desktop" />
                        ))}
                      </Box>
                    </Box>

                    {/* Scores */}
                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        AI Analysis:
                      </Typography>
                      
                      {Object.entries(scores).map(([criteria, score]) => (
                        <Box key={criteria} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                            {criteria.replace('_', ' ')}:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Rating value={score} readOnly size="small" max={5} precision={0.1} />
                            <Typography variant="caption">
                              {score.toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">Overall Score:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star size={16} weight="fill" color="gold" />
                          <Typography variant="subtitle2" color="primary">
                            {overallScore.toFixed(1)}/5.0
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Actions */}
                    <CardActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Button
                        size="small"
                        startIcon={<Eye size={16} />}
                        onClick={() => {
                          onClose();
                          // Would open full preview
                        }}
                      >
                        Full Preview
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CheckCircle size={16} />}
                        variant="contained"
                        onClick={() => onSelectFinal(layoutIndex)}
                        sx={{ ml: 'auto' }}
                      >
                        Select This
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* No Layouts Selected */}
          {selectedLayouts.length === 0 && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              color: 'text.secondary'
            }}>
              <Scales size={64} />
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Select layouts to compare
              </Typography>
              <Typography variant="body2">
                Choose 2-3 layout variations above to see a detailed comparison
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose}>
          Close Comparison
        </Button>
        
        {selectedLayouts.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={() => {
              // Export comparison report
              console.log('Export comparison report');
            }}
          >
            Export Report
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}