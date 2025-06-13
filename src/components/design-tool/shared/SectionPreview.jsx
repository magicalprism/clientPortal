// components/design-tool/shared/SectionPreview.jsx
'use client';

import { Box, Typography, Button, Grid, Avatar, Rating } from '@mui/material';
import { ArrowRight, Star, Quote } from '@phosphor-icons/react';

export default function SectionPreview({ section, previewMode = 'desktop' }) {
  // Get responsive styles based on preview mode
  const getResponsiveStyles = () => {
    const baseStyles = {
      padding: '3rem 1.5rem',
      minHeight: '200px'
    };

    switch (previewMode) {
      case 'mobile':
        return {
          ...baseStyles,
          padding: '2rem 1rem',
          fontSize: '0.9rem'
        };
      case 'tablet':
        return {
          ...baseStyles,
          padding: '2.5rem 1.25rem'
        };
      default:
        return baseStyles;
    }
  };

  // Apply section styling from brand tokens
  const sectionStyle = {
    backgroundColor: section.style?.backgroundColor || '#ffffff',
    color: section.style?.color || '#000000',
    fontFamily: section.style?.fontFamily || 'Arial, sans-serif',
    ...getResponsiveStyles(),
    ...getLayoutStyles(section.layout),
    transition: 'all 0.3s ease'
  };

  return (
    <Box sx={sectionStyle} data-section-type={section.type}>
      {renderSectionContent(section, previewMode)}
    </Box>
  );
}

// Get layout-specific styles
function getLayoutStyles(layout) {
  const layoutMap = {
    'image-left': { 
      display: 'flex', 
      alignItems: 'center',
      flexDirection: 'row',
      gap: '3rem'
    },
    'image-right': { 
      display: 'flex', 
      alignItems: 'center',
      flexDirection: 'row-reverse',
      gap: '3rem'
    },
    'image-background': {
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 1
      },
      '& > *': {
        position: 'relative',
        zIndex: 2
      }
    },
    '3-col-grid': { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '2rem',
      alignItems: 'start'
    },
    '2-col-grid': { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
      gap: '2rem',
      alignItems: 'start'
    },
    'carousel': { 
      display: 'flex', 
      overflowX: 'auto',
      gap: '1.5rem',
      scrollSnapType: 'x mandatory',
      '& > *': {
        scrollSnapAlign: 'start',
        flexShrink: 0
      }
    },
    'centered': { 
      textAlign: 'center', 
      maxWidth: '800px', 
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    'stacked': {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    },
    'masonry': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1rem',
      alignItems: 'start'
    }
  };
  
  return layoutMap[layout] || {};
}

// Render section content based on type
function renderSectionContent(section, previewMode) {
  switch (section.type) {
    case 'hero':
      return renderHeroSection(section, previewMode);
    case 'features':
      return renderFeaturesSection(section, previewMode);
    case 'testimonial':
      return renderTestimonialSection(section, previewMode);
    case 'cta':
      return renderCTASection(section, previewMode);
    case 'about':
      return renderAboutSection(section, previewMode);
    case 'gallery':
      return renderGallerySection(section, previewMode);
    default:
      return renderContentSection(section, previewMode);
  }
}

// Hero Section
function renderHeroSection(section, previewMode) {
  const isMobile = previewMode === 'mobile';
  
  return (
    <>
      {/* Content */}
      <Box sx={{ flex: 1, minWidth: isMobile ? '100%' : '400px' }}>
        <Typography 
          variant={isMobile ? 'h4' : 'h2'} 
          sx={{ 
            fontWeight: 700, 
            mb: 2,
            lineHeight: 1.2
          }}
        >
          {section.content?.split('.')[0] || 'Transform Your Business'}
        </Typography>
        
        <Typography 
          variant={isMobile ? 'body2' : 'h6'} 
          sx={{ 
            mb: 3, 
            opacity: 0.8,
            lineHeight: 1.6
          }}
        >
          {section.content?.split('.').slice(1, 3).join('. ') || 'Discover powerful solutions that help you achieve your goals faster and more efficiently than ever before.'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
          <Button 
            variant="contained" 
            size={isMobile ? 'medium' : 'large'}
            endIcon={<ArrowRight />}
            sx={{ borderRadius: 2 }}
          >
            Get Started
          </Button>
          <Button 
            variant="outlined" 
            size={isMobile ? 'medium' : 'large'}
            sx={{ borderRadius: 2 }}
          >
            Learn More
          </Button>
        </Box>
      </Box>
      
      {/* Image placeholder */}
      {(section.layout?.includes('image') || section.layout === 'image-background') && !isMobile && (
        <Box
          sx={{
            flex: 1,
            minHeight: '300px',
            bgcolor: 'grey.200',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px'
          }}
        >
          <Typography color="text.secondary">Hero Image</Typography>
        </Box>
      )}
    </>
  );
}

// Features Section
function renderFeaturesSection(section, previewMode) {
  const features = [
    { icon: '⚡', title: 'Fast Performance', description: 'Lightning-fast loading times and smooth interactions' },
    { icon: '🔒', title: 'Secure & Reliable', description: 'Enterprise-grade security with 99.9% uptime guarantee' },
    { icon: '🎨', title: 'Beautiful Design', description: 'Stunning interfaces that users love to interact with' }
  ];

  if (section.layout === 'stacked') {
    return (
      <>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 600, mb: 2 }}>
            Powerful Features
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Everything you need to succeed
          </Typography>
        </Box>
        
        {features.map((feature, index) => (
          <Box 
            key={index}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              p: 3,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.5)'
            }}
          >
            <Typography variant="h2">{feature.icon}</Typography>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {feature.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {feature.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </>
    );
  }

  return (
    <>
      <Box sx={{ textAlign: 'center', mb: 4, gridColumn: '1 / -1' }}>
        <Typography variant="h3" sx={{ fontWeight: 600, mb: 2 }}>
          Powerful Features
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Everything you need to succeed
        </Typography>
      </Box>
      
      {features.map((feature, index) => (
        <Box 
          key={index}
          sx={{ 
            textAlign: 'center',
            p: 3,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.5)',
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'translateY(-4px)'
            }
          }}
        >
          <Typography variant="h2" sx={{ mb: 2 }}>{feature.icon}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            {feature.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {feature.description}
          </Typography>
        </Box>
      ))}
    </>
  );
}

// Testimonial Section
function renderTestimonialSection(section, previewMode) {
  const testimonial = {
    quote: section.content?.split('.')[0] || "This product has completely transformed how we work. The results speak for themselves.",
    author: "Sarah Johnson",
    role: "CEO, TechCorp",
    avatar: null,
    rating: 5
  };

  if (section.layout === 'carousel') {
    return (
      <>
        <Box sx={{ textAlign: 'center', mb: 4, width: '100%' }}>
          <Typography variant="h3" sx={{ fontWeight: 600, mb: 2 }}>
            What Our Customers Say
          </Typography>
        </Box>
        
        {[testimonial, testimonial, testimonial].map((item, index) => (
          <Box 
            key={index}
            sx={{ 
              minWidth: '350px',
              p: 4,
              bgcolor: 'rgba(255,255,255,0.9)',
              borderRadius: 3,
              boxShadow: 2
            }}
          >
            <Rating value={item.rating} readOnly sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic' }}>
              <Quote size={20} style={{ verticalAlign: 'top', marginRight: 8 }} />
              {item.quote}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar>{item.author[0]}</Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {item.author}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.role}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </>
    );
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h3" sx={{ fontWeight: 600, mb: 4 }}>
        What Our Customers Say
      </Typography>
      
      <Box sx={{ maxWidth: '600px', margin: '0 auto' }}>
        <Rating value={testimonial.rating} readOnly sx={{ mb: 3 }} />
        <Typography variant="h5" sx={{ mb: 3, fontStyle: 'italic', lineHeight: 1.6 }}>
          <Quote size={24} style={{ verticalAlign: 'top', marginRight: 8 }} />
          {testimonial.quote}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Avatar sx={{ width: 60, height: 60 }}>{testimonial.author[0]}</Avatar>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {testimonial.author}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {testimonial.role}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// CTA Section
function renderCTASection(section, previewMode) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h3" sx={{ fontWeight: 600, mb: 2 }}>
        Ready to Get Started?
      </Typography>
      <Typography variant="h6" sx={{ mb: 4, opacity: 0.8 }}>
        {section.content?.substring(0, 100) || 'Join thousands of satisfied customers today'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: previewMode === 'mobile' ? 'column' : 'row' }}>
        <Button 
          variant="contained" 
          size="large"
          sx={{ borderRadius: 2, px: 4 }}
        >
          Start Free Trial
        </Button>
        <Button 
          variant="outlined" 
          size="large"
          sx={{ borderRadius: 2, px: 4 }}
        >
          Contact Sales
        </Button>
      </Box>
    </Box>
  );
}

// About Section
function renderAboutSection(section, previewMode) {
  return (
    <Box sx={{ maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h3" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
        About Our Company
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
        {section.content || 'We are a team of passionate individuals dedicated to creating innovative solutions that make a difference. Our mission is to empower businesses and individuals to achieve their full potential through cutting-edge technology and exceptional service.'}
      </Typography>
      <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
        Since our founding, we have helped countless organizations transform their operations and achieve remarkable results. We believe in the power of collaboration, innovation, and putting our customers first.
      </Typography>
    </Box>
  );
}

// Gallery Section
function renderGallerySection(section, previewMode) {
  const images = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    title: `Gallery Image ${i + 1}`,
    height: Math.floor(Math.random() * 200) + 200
  }));

  return (
    <>
      <Box sx={{ textAlign: 'center', mb: 4, gridColumn: '1 / -1' }}>
        <Typography variant="h3" sx={{ fontWeight: 600, mb: 2 }}>
          Our Work
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Take a look at some of our recent projects
        </Typography>
      </Box>
      
      {images.map((image) => (
        <Box
          key={image.id}
          sx={{
            height: image.height,
            bgcolor: 'grey.200',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px',
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'scale(1.02)'
            }
          }}
        >
          <Typography color="text.secondary">{image.title}</Typography>
        </Box>
      ))}
    </>
  );
}

// Generic Content Section
function renderContentSection(section, previewMode) {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Content Section
      </Typography>
      <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
        {section.content || 'This is a generic content section that can be used for various types of content.'}
      </Typography>
    </Box>
  );
}