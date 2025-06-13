// components/design-tool/shared/LayoutAdjustmentPanel.jsx
'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Alert
} from '@mui/material';
import {
  Sliders,
  X,
  Palette,
  Layout,
  ArrowsOut,
  TextAa,
  MagicWand
} from '@phosphor-icons/react';

export default function LayoutAdjustmentPanel({
  isOpen,
  onClose,
  currentLayout,
  onLayoutChange,
  brandTokens
}) {
  const [selectedSection, setSelectedSection] = useState(0);
  const [adjustments, setAdjustments] = useState({});

  if (!currentLayout || !currentLayout.sections) {
    return null;
  }

  const currentSection = currentLayout.sections[selectedSection];

  // Layout options for different section types
  const getLayoutOptions = (sectionType) => {
    const options = {
      hero: [
        { value: 'centered', label: 'Centered', icon: '◉' },
        { value: 'image-left', label: 'Image Left', icon: '⬅️🖼️' },
        { value: 'image-right', label: 'Image Right', icon: '🖼️➡️' },
        { value: 'image-background', label: 'Background Image', icon: '🖼️' }
      ],
      features: [
        { value: '3-col-grid', label: '3 Column Grid', icon: '⚏⚏⚏' },
        { value: '2-col-grid', label: '2 Column Grid', icon: '⚏⚏' },
        { value: 'stacked', label: 'Stacked', icon: '⚍' },
        { value: 'carousel', label: 'Carousel', icon: '⟲' }
      ],
      testimonial: [
        { value: 'centered', label: 'Centered Quote', icon: '💬' },
        { value: 'carousel', label: 'Carousel', icon: '⟲' },
        { value: '2-col-grid', label: '2 Column Grid', icon: '⚏⚏' }
      ],
      cta: [
        { value: 'centered', label: 'Centered', icon: '◉' },
        { value: 'split', label: 'Split Layout', icon: '⟷' },
        { value: 'banner', label: 'Full Banner', icon: '▬' }
      ]
    };
    
    return options[sectionType] || options.hero;
  };

  // Handle layout change for current section
  const handleLayoutChange = (newLayout) => {
    const updatedSections = [...currentLayout.sections];
    updatedSections[selectedSection] = {
      ...updatedSections[selectedSection],
      layout: newLayout
    };
    
    const updatedLayout = {
      ...currentLayout,
      sections: updatedSections
    };
    
    onLayoutChange(updatedLayout);
  };

  // Handle container type change
  const handleContainerChange = (containerType) => {
    const updatedSections = [...currentLayout.sections];
    updatedSections[selectedSection] = {
      ...updatedSections[selectedSection],
      container: containerType
    };
    
    const updatedLayout = {
      ...currentLayout,
      sections: updatedSections
    };
    
    onLayoutChange(updatedLayout);
  };

  // Handle style adjustments
  const handleStyleChange = (property, value) => {
    const updatedSections = [...currentLayout.sections];
    updatedSections[selectedSection] = {
      ...updatedSections[selectedSection],
      style: {
        ...updatedSections[selectedSection].style,
        [property]: value
      }
    };
    
    const updatedLayout = {
      ...currentLayout,
      sections: updatedSections
    };
    
    onLayoutChange(updatedLayout);
  };

  // Reset section to default
  const handleResetSection = () => {
    // Would reset the current section to its original generated state
    console.log('Reset section:', selectedSection);
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 360,
          p: 0
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          p: 3, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sliders size={20} weight="duotone" />
            <Typography variant="h6">Layout Adjustments</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        {/* Section Selector */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Select Section to Edit
          </Typography>
          <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
            {currentLayout.sections.map((section, index) => (
              <ListItem
                key={index}
                button
                selected={selectedSection === index}
                onClick={() => setSelectedSection(index)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  bgcolor: selectedSection === index ? 'primary.50' : 'transparent'
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={section.type} 
                        size="small"
                        color={selectedSection === index ? 'primary' : 'default'}
                      />
                      <Typography variant="body2">
                        {section.layout}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Current Section Adjustments */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Layout size={16} />
            {currentSection.type} Section
          </Typography>

          {/* Layout Type */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Layout Type</InputLabel>
            <Select
              value={currentSection.layout}
              onChange={(e) => handleLayoutChange(e.target.value)}
              label="Layout Type"
            >
              {getLayoutOptions(currentSection.type).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Container Type */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Container Width</InputLabel>
            <Select
              value={currentSection.container || 'contained'}
              onChange={(e) => handleContainerChange(e.target.value)}
              label="Container Width"
            >
              <MenuItem value="contained">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowsOut size={16} />
                  Contained (1200px max)
                </Box>
              </MenuItem>
              <MenuItem value="full-width">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowsOut size={16} />
                  Full Width
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          {/* Style Adjustments */}
          <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Palette size={16} />
            Style Options
          </Typography>

          {/* Background Color */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Background Color</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(brandTokens.colors || {}).map(([name, token]) => (
                <Tooltip key={name} title={`${name}: ${token.value}`}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: token.value,
                      borderRadius: 1,
                      border: currentSection.style?.backgroundColor === token.value ? 3 : 1,
                      borderColor: currentSection.style?.backgroundColor === token.value ? 'primary.main' : 'grey.300',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleStyleChange('backgroundColor', token.value)}
                  />
                </Tooltip>
              ))}
              {/* White option */}
              <Tooltip title="White">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: '#ffffff',
                    borderRadius: 1,
                    border: currentSection.style?.backgroundColor === '#ffffff' ? 3 : 1,
                    borderColor: currentSection.style?.backgroundColor === '#ffffff' ? 'primary.main' : 'grey.300',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleStyleChange('backgroundColor', '#ffffff')}
                />
              </Tooltip>
            </Box>
          </Box>

          {/* Text Color */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Text Color</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['#ffffff', '#000000', brandTokens.colors?.primary?.value, brandTokens.colors?.neutral?.value].filter(Boolean).map((color) => (
                <Tooltip key={color} title={color}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: color,
                      borderRadius: 1,
                      border: currentSection.style?.color === color ? 3 : 1,
                      borderColor: currentSection.style?.color === color ? 'primary.main' : 'grey.300',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleStyleChange('color', color)}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* Font Family */}
          {brandTokens.typography && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Font Family</InputLabel>
              <Select
                value={currentSection.style?.fontFamily || ''}
                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                label="Font Family"
              >
                {Object.entries(brandTokens.typography).map(([name, token]) => (
                  <MenuItem key={name} value={token.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextAa size={16} />
                      {name} ({token.value})
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Advanced Options */}
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Advanced Options
          </Typography>

          {/* Section metadata display */}
          {currentSection.metadata && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="caption">
                <strong>AI Confidence:</strong> {Math.round((currentSection.metadata.confidence || 0) * 100)}%
                <br />
                <strong>Reasoning:</strong> {currentSection.metadata.reasoning}
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Footer Actions */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<MagicWand size={16} />}
              onClick={handleResetSection}
              size="small"
            >
              Reset Section
            </Button>
            <Button
              variant="contained"
              onClick={onClose}
              size="small"
              sx={{ ml: 'auto' }}
            >
              Done
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}