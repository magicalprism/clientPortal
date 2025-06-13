// app/api/ai/generate-layout/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('🎨 === GENERATE LAYOUT API CALLED ===');
    
    const { copyClassification, layoutAnalysis, brandTokens, brandId } = await request.json();

    // Input validation
    console.log('🎨 Input validation:');
    console.log('🎨 - Copy classification:', !!copyClassification);
    console.log('🎨 - Layout analysis:', !!layoutAnalysis);
    console.log('🎨 - Brand tokens:', !!brandTokens);
    console.log('🎨 - Brand ID:', brandId);

    if (!copyClassification || !layoutAnalysis) {
      return NextResponse.json({ 
        success: false, 
        error: 'Copy classification and layout analysis are required' 
      }, { status: 400 });
    }

    let finalBrandTokens = brandTokens;

    // If no brand tokens but we have brandId, fetch from database
    if (!brandTokens && brandId) {
      console.log('🎨 Fetching brand tokens from database...');
      finalBrandTokens = await fetchBrandTokensFromDB(brandId);
    }

    // Generate layout using the intelligent system
    console.log('🎨 Starting intelligent layout generation...');
    const generatedLayout = await generateIntelligentLayout(
      copyClassification,
      layoutAnalysis,
      finalBrandTokens
    );

    console.log('🎨 Layout generation complete!');
    console.log('🎨 Generated sections:', generatedLayout.sections?.length || 0);

    return NextResponse.json({
      success: true,
      data: generatedLayout
    });

  } catch (error) {
    console.error('🎨 Layout generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate layout: ' + error.message
    }, { status: 500 });
  }
}

// Fetch brand tokens from color and typography tables
async function fetchBrandTokensFromDB(brandId) {
  try {
    console.log('🎨 Fetching brand tokens for brand:', brandId);
    
    const { fetchColorsByBrandId } = await import('@/lib/supabase/queries/table/color');
    const { fetchTypographyByBrandId } = await import('@/lib/supabase/queries/table/typography');

    const [colorsResult, typographyResult] = await Promise.all([
      fetchColorsByBrandId(brandId),
      fetchTypographyByBrandId(brandId)
    ]);

    if (colorsResult.error) {
      console.error('🎨 Error fetching colors:', colorsResult.error);
    }

    if (typographyResult.error) {
      console.error('🎨 Error fetching typography:', typographyResult.error);
    }

    const groupedColors = (colorsResult.data || []).reduce((acc, color) => {
      const group = color.group || 'other';
      if (!acc[group]) {
        acc[group] = {};
      }
      
      acc[group][color.token] = {
        id: color.id,
        value: color.resolved || color.value,
        type: color.type,
        mode: color.mode,
        description: color.description,
        title: color.title
      };
      
      return acc;
    }, {});

    const groupedTypography = (typographyResult.data || []).reduce((acc, typo) => {
      const group = typo.category || typo.group_name || 'other';
      if (!acc[group]) {
        acc[group] = {};
      }
      
      acc[group][typo.token] = {
        id: typo.id,
        value: typo.font_family,
        fontSize: typo.font_size,
        fontWeight: typo.font_weight,
        lineHeight: typo.line_height,
        letterSpacing: typo.letter_spacing,
        type: typo.type,
        category: typo.category,
        description: typo.description,
        title: typo.title
      };
      
      return acc;
    }, {});

    const combinedTokens = {
      colors: groupedColors,
      typography: groupedTypography,
      spacing: {
        xs: { value: '8px', type: 'spacing' },
        sm: { value: '16px', type: 'spacing' },
        md: { value: '24px', type: 'spacing' },
        lg: { value: '48px', type: 'spacing' },
        xl: { value: '96px', type: 'spacing' }
      },
      borderRadius: {
        sm: { value: '4px', type: 'borderRadius' },
        md: { value: '8px', type: 'borderRadius' },
        lg: { value: '16px', type: 'borderRadius' }
      }
    };

    console.log('🎨 Brand tokens fetched successfully from database');
    return combinedTokens;

  } catch (error) {
    console.error('🎨 Error in fetchBrandTokens:', error);
    console.log('🎨 Using fallback brand tokens...');
    return generateFallbackBrandTokens();
  }
}

// Generate fallback brand tokens
function generateFallbackBrandTokens() {
  console.log('🎨 Generating fallback brand tokens...');
  
  return {
    colors: {
      primary: {
        primary: { value: '#3B82F6', type: 'color' },
        secondary: { value: '#10B981', type: 'color' },
        neutral: { value: '#6B7280', type: 'color' }
      },
      semantic: {
        success: { value: '#10B981', type: 'color' },
        error: { value: '#EF4444', type: 'color' },
        warning: { value: '#F59E0B', type: 'color' }
      }
    },
    typography: {
      heading: {
        heading: { value: 'Inter', type: 'fontFamily' },
        display: { value: 'Inter', type: 'fontFamily' }
      },
      body: {
        body: { value: 'Inter', type: 'fontFamily' },
        caption: { value: 'Inter', type: 'fontFamily' }
      }
    },
    spacing: {
      xs: { value: '8px', type: 'spacing' },
      sm: { value: '16px', type: 'spacing' },
      md: { value: '24px', type: 'spacing' },
      lg: { value: '48px', type: 'spacing' },
      xl: { value: '96px', type: 'spacing' }
    },
    borderRadius: {
      sm: { value: '4px', type: 'borderRadius' },
      md: { value: '8px', type: 'borderRadius' },
      lg: { value: '16px', type: 'borderRadius' }
    }
  };
}

// Advanced content analysis and mapping
function analyzeAndMapContent(copyClassification) {
  console.log('🎨 === ADVANCED CONTENT ANALYSIS ===');
  console.log('🎨 Raw copy classification:', JSON.stringify(copyClassification, null, 2));
  
  if (!copyClassification || !Array.isArray(copyClassification)) {
    console.log('🎨 No valid copy classification, creating smart defaults');
    return createAdvancedDefaultSections();
  }

  const analyzedSections = [];
  let hasHero = false;
  let hasFeatures = false;
  let hasCTA = false;
  let hasTestimonial = false;

  copyClassification.forEach((section, index) => {
    console.log(`🎨 Analyzing section ${index}:`, section);
    
    const textContent = extractFullTextContent(section);
    const contentAnalysis = analyzeContentType(textContent, section.type, index);
    const layoutPattern = determineLayoutPattern(textContent, contentAnalysis.sectionType);
    
    console.log(`🎨 Content analysis result:`, contentAnalysis);
    console.log(`🎨 Layout pattern:`, layoutPattern);
    
    let structuredContent = {};
    
    switch (contentAnalysis.sectionType) {
      case 'hero':
        if (!hasHero) {
          structuredContent = createAdvancedHeroContent(textContent, layoutPattern);
          hasHero = true;
        } else {
          // Convert to features if we already have a hero
          structuredContent = createAdvancedFeatureContent(textContent, layoutPattern);
          contentAnalysis.sectionType = 'features';
          hasFeatures = true;
        }
        break;
        
      case 'features':
        structuredContent = createAdvancedFeatureContent(textContent, layoutPattern);
        hasFeatures = true;
        break;
        
      case 'testimonial':
        structuredContent = createAdvancedTestimonialContent(textContent, layoutPattern);
        hasTestimonial = true;
        break;
        
      case 'cta':
        structuredContent = createAdvancedCTAContent(textContent, layoutPattern);
        hasCTA = true;
        break;
        
      case 'about':
        structuredContent = createAdvancedAboutContent(textContent, layoutPattern);
        break;
        
      case 'stats':
        structuredContent = createAdvancedStatsContent(textContent, layoutPattern);
        break;
        
      default:
        // Convert unknown to features with smart content detection
        structuredContent = createAdvancedFeatureContent(textContent, layoutPattern);
        contentAnalysis.sectionType = 'features';
        hasFeatures = true;
    }
    
    const mappedSection = {
      type: contentAnalysis.sectionType,
      content: structuredContent,
      layout: layoutPattern.layout,
      structure: layoutPattern.structure,
      gridTemplate: layoutPattern.gridTemplate,
      id: `section-${index}`,
      priority: index + 1,
      contentType: contentAnalysis.contentType,
      visualStyle: layoutPattern.visualStyle
    };
    
    console.log(`🎨 Final mapped section:`, mappedSection);
    analyzedSections.push(mappedSection);
  });

  // Ensure essential sections exist
  if (!hasHero) {
    analyzedSections.unshift(createDefaultHeroSection());
  }
  
  if (!hasCTA) {
    analyzedSections.push(createDefaultCTASection());
  }

  console.log('🎨 Total analyzed sections:', analyzedSections.length);
  return analyzedSections;
}

// Advanced content type analysis
function analyzeContentType(textContent, originalType, index) {
  const content = textContent?.toLowerCase() || '';
  const words = content.split(' ');
  
  console.log(`🎨 Analyzing content type for: "${content.substring(0, 100)}..."`);
  
  // Keyword analysis
  const heroKeywords = ['welcome', 'transform', 'discover', 'revolutionary', 'leading', 'premier', 'introducing'];
  const featureKeywords = ['features', 'benefits', 'why', 'how', 'what', 'capabilities', 'solutions', 'tools'];
  const testimonialKeywords = ['testimonial', 'review', 'customer', 'client', 'said', 'experience', 'love', 'amazing'];
  const ctaKeywords = ['get started', 'sign up', 'contact', 'ready', 'try', 'start', 'join', 'subscribe'];
  const aboutKeywords = ['about', 'story', 'mission', 'vision', 'founded', 'company', 'team', 'history'];
  const statsKeywords = ['million', 'billion', 'thousand', '%', 'percent', 'customers', 'users', 'growth'];
  
  // Calculate keyword scores
  const scores = {
    hero: heroKeywords.filter(kw => content.includes(kw)).length + (index === 0 ? 2 : 0),
    features: featureKeywords.filter(kw => content.includes(kw)).length,
    testimonial: testimonialKeywords.filter(kw => content.includes(kw)).length + (content.includes('"') ? 2 : 0),
    cta: ctaKeywords.filter(kw => content.includes(kw)).length + (index > 2 ? 1 : 0),
    about: aboutKeywords.filter(kw => content.includes(kw)).length,
    stats: statsKeywords.filter(kw => content.includes(kw)).length
  };
  
  console.log(`🎨 Keyword scores:`, scores);
  
  // Determine best section type
  const bestType = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
  
  // Content type analysis (for layout decisions)
  const contentType = analyzeContentStructure(textContent);
  
  return {
    sectionType: bestType,
    contentType: contentType,
    confidence: scores[bestType] / Math.max(words.length / 10, 1)
  };
}

// Analyze content structure for layout decisions
function analyzeContentStructure(textContent) {
  const content = textContent || '';
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length >= 3) {
    return 'list'; // Multiple points = list/grid layout
  } else if (sentences.length === 2) {
    return 'split'; // Two parts = split layout
  } else if (content.length > 200) {
    return 'detailed'; // Long content = detailed layout
  } else {
    return 'simple'; // Short content = simple layout
  }
}

// Determine specific layout pattern
function determineLayoutPattern(textContent, sectionType) {
  const contentType = analyzeContentStructure(textContent);
  
  const patterns = {
    hero: {
      simple: { layout: 'centered', structure: 'flex-column', visualStyle: 'minimal' },
      split: { layout: 'split-content', structure: 'grid', gridTemplate: '1fr 1fr', visualStyle: 'split' },
      detailed: { layout: 'centered-detailed', structure: 'flex-column', visualStyle: 'rich' }
    },
    features: {
      list: { layout: 'icon-grid', structure: 'grid', gridTemplate: 'repeat(3, 1fr)', visualStyle: 'cards' },
      split: { layout: 'alternating', structure: 'grid', gridTemplate: '1fr 1fr', visualStyle: 'alternating' },
      simple: { layout: 'simple-grid', structure: 'grid', gridTemplate: 'repeat(2, 1fr)', visualStyle: 'simple' }
    },
    testimonial: {
      simple: { layout: 'centered-quote', structure: 'flex-column', visualStyle: 'quote' },
      split: { layout: 'testimonial-card', structure: 'flex-row', visualStyle: 'card' },
      list: { layout: 'testimonial-grid', structure: 'grid', gridTemplate: 'repeat(2, 1fr)', visualStyle: 'grid' }
    },
    cta: {
      simple: { layout: 'centered-cta', structure: 'flex-column', visualStyle: 'bold' },
      split: { layout: 'split-cta', structure: 'grid', gridTemplate: '1fr 1fr', visualStyle: 'split' }
    },
    about: {
      split: { layout: 'image-text', structure: 'grid', gridTemplate: '1fr 1fr', visualStyle: 'storytelling' },
      detailed: { layout: 'story-layout', structure: 'flex-column', visualStyle: 'narrative' }
    },
    stats: {
      list: { layout: 'stats-grid', structure: 'grid', gridTemplate: 'repeat(4, 1fr)', visualStyle: 'metrics' }
    }
  };
  
  return patterns[sectionType]?.[contentType] || patterns[sectionType]?.simple || 
         { layout: 'default', structure: 'flex-column', visualStyle: 'standard' };
}

// Create advanced hero content
function createAdvancedHeroContent(textContent, layoutPattern) {
  const sentences = (textContent || '').split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let headline = sentences[0]?.trim() || 'Transform Your Business Today';
  let subheadline = sentences[1]?.trim() || 'Discover powerful solutions that drive real results';
  
  // Optimize headline length
  if (headline.length > 60) {
    const words = headline.split(' ');
    headline = words.slice(0, 8).join(' ');
    if (words.length > 8) {
      subheadline = words.slice(8, 20).join(' ') + '. ' + subheadline;
    }
  }
  
  const content = {
    headline: headline,
    subheadline: subheadline,
    cta: 'Get Started'
  };
  
  // Add image for split layouts
  if (layoutPattern.layout === 'split-content') {
    content.image = {
      src: '/hero-image.jpg',
      alt: 'Hero Image',
      position: 'right'
    };
  }
  
  return content;
}

// Create advanced feature content
function createAdvancedFeatureContent(textContent, layoutPattern) {
  const text = textContent || '';
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  let title = 'Key Features';
  if (sentences[0] && sentences[0].length < 50) {
    title = sentences[0].trim();
    sentences.shift();
  }
  
  const features = [];
  const icons = ['⚡', '🚀', '🎯', '💡', '🔒', '🎨', '📈', '⭐', '🛡️', '🔧'];
  
  if (sentences.length >= 3) {
    // Create features from actual content
    sentences.slice(0, 6).forEach((sentence, index) => {
      const words = sentence.trim().split(' ');
      const featureTitle = words.slice(0, 3).join(' ');
      const featureDescription = sentence.trim();
      
      features.push({
        title: featureTitle || `Feature ${index + 1}`,
        description: featureDescription,
        icon: icons[index % icons.length]
      });
    });
  } else {
    // Create smart default features
    features.push(
      {
        title: 'Powerful Performance',
        description: sentences[0]?.trim() || 'Lightning-fast performance that scales with your business needs',
        icon: '⚡'
      },
      {
        title: 'Advanced Security',
        description: sentences[1]?.trim() || 'Enterprise-grade security with end-to-end encryption',
        icon: '🔒'
      },
      {
        title: 'Intuitive Design',
        description: sentences[2]?.trim() || 'Beautiful, user-friendly interface that your team will love',
        icon: '🎨'
      }
    );
  }
  
  return {
    title: title,
    features: features.slice(0, layoutPattern.gridTemplate?.includes('4') ? 4 : 3)
  };
}

// Create advanced testimonial content
function createAdvancedTestimonialContent(textContent, layoutPattern) {
  const text = textContent || '';
  let quote = text.replace(/"/g, '').trim();
  
  // Extract quote if it exists
  const quoteMatch = text.match(/"([^"]+)"/);
  if (quoteMatch) {
    quote = quoteMatch[1];
  } else {
    // Take first sentence as quote
    const sentences = text.split(/[.!?]+/);
    if (sentences[0] && sentences[0].length > 20) {
      quote = sentences[0].trim();
    }
  }
  
  // Limit quote length
  if (quote.length > 150) {
    quote = quote.substring(0, 147) + '...';
  }
  
  return {
    quote: quote || 'This product has completely transformed how we work. The results speak for themselves.',
    author: 'Sarah Johnson',
    company: 'TechCorp Inc.',
    title: 'CEO',
    avatar: '/avatars/customer-1.jpg'
  };
}

// Create advanced CTA content
function createAdvancedCTAContent(textContent, layoutPattern) {
  const sentences = (textContent || '').split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let headline = sentences[0]?.trim() || 'Ready to Get Started?';
  let description = sentences[1]?.trim() || 'Join thousands of companies already seeing incredible results';
  
  // Clean up headline
  if (headline.length > 60) {
    headline = headline.substring(0, 57) + '...';
  }
  
  return {
    headline: headline,
    description: description,
    primaryCTA: 'Start Free Trial',
    secondaryCTA: 'Schedule Demo'
  };
}

// Create advanced about content
function createAdvancedAboutContent(textContent, layoutPattern) {
  const sentences = (textContent || '').split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return {
    title: 'About Our Company',
    story: sentences.join('. ') || 'We are dedicated to providing innovative solutions that help businesses thrive in the digital age.',
    image: {
      src: '/about-image.jpg',
      alt: 'About Us',
      position: 'left'
    },
    stats: [
      { number: '10K+', label: 'Happy Customers' },
      { number: '99.9%', label: 'Uptime' },
      { number: '5★', label: 'Rating' }
    ]
  };
}

// Create advanced stats content
function createAdvancedStatsContent(textContent, layoutPattern) {
  const text = textContent || '';
  const numbers = text.match(/\d+[,\d]*(?:\.\d+)?[%]?/g) || [];
  
  const stats = [
    { number: numbers[0] || '10K+', label: 'Customers', icon: '👥' },
    { number: numbers[1] || '99.9%', label: 'Uptime', icon: '⚡' },
    { number: numbers[2] || '5M+', label: 'Transactions', icon: '📊' },
    { number: numbers[3] || '24/7', label: 'Support', icon: '🛟' }
  ];
  
  return {
    title: 'Our Impact in Numbers',
    stats: stats
  };
}

// Create default sections
function createDefaultHeroSection() {
  return {
    type: 'hero',
    content: {
      headline: 'Transform Your Business with AI',
      subheadline: 'Powerful tools and insights that drive real results for modern companies',
      cta: 'Get Started'
    },
    layout: 'centered',
    structure: 'flex-column',
    id: 'hero-default',
    priority: 0
  };
}

function createDefaultCTASection() {
  return {
    type: 'cta',
    content: {
      headline: 'Ready to Transform Your Business?',
      description: 'Join thousands of companies already seeing incredible results',
      primaryCTA: 'Start Free Trial',
      secondaryCTA: 'Schedule Demo'
    },
    layout: 'centered-cta',
    structure: 'flex-column',
    id: 'cta-default',
    priority: 999
  };
}

// Create advanced default sections
function createAdvancedDefaultSections() {
  return [
    createDefaultHeroSection(),
    {
      type: 'features',
      content: {
        title: 'Powerful Features That Drive Results',
        features: [
          { 
            title: 'Lightning Fast Performance', 
            description: 'Experience blazing fast speed with our optimized infrastructure that scales with your business', 
            icon: '⚡' 
          },
          { 
            title: 'Enterprise Security', 
            description: 'Bank-level security with end-to-end encryption to keep your data safe and compliant', 
            icon: '🔒' 
          },
          { 
            title: 'Intuitive Design', 
            description: 'Beautiful, user-friendly interface that your team will love to use every day', 
            icon: '🎨' 
          }
        ]
      },
      layout: 'icon-grid',
      structure: 'grid',
      gridTemplate: 'repeat(3, 1fr)',
      priority: 2,
      id: 'features-default'
    },
    {
      type: 'testimonial',
      content: {
        quote: 'This platform has completely transformed how we work. The results speak for themselves.',
        author: 'Sarah Johnson',
        company: 'TechCorp Inc.',
        title: 'CEO'
      },
      layout: 'centered-quote',
      structure: 'flex-column',
      priority: 3,
      id: 'testimonial-default'
    },
    createDefaultCTASection()
  ];
}

// Extract full text content from section
function extractFullTextContent(section) {
  const possiblePaths = [
    section.content?.headline,
    section.content?.title,
    section.content?.text,
    section.content?.content,
    section.content,
    section.headline,
    section.title,
    section.text,
    section.description
  ];
  
  for (const path of possiblePaths) {
    if (typeof path === 'string' && path.trim().length > 0) {
      return path.trim();
    }
  }
  
  return null;
}

// Extract Stripe-specific design patterns
function extractStripePatterns(layoutAnalysis) {
  console.log('🎨 Extracting Stripe patterns from layout analysis...');
  
  const patterns = {
    typography: {},
    colors: {},
    spacing: {},
    buttons: {},
    borderRadius: '8px'
  };

  if (!layoutAnalysis?.data) {
    console.log('🎨 No layout analysis data, using Stripe defaults');
    return getStripeDefaults();
  }

  // Extract typography patterns
  if (layoutAnalysis.data.typography) {
    patterns.typography = {
      hero: { fontSize: '56px', fontWeight: '700', lineHeight: '1.1' },
      sectionTitle: { fontSize: '40px', fontWeight: '600', lineHeight: '1.2' },
      featureTitle: { fontSize: '24px', fontWeight: '600', lineHeight: '1.3' },
      body: { fontSize: '16px', fontWeight: '400', lineHeight: '1.5' },
      quote: { fontSize: '28px', fontWeight: '400', lineHeight: '1.4' }
    };

    if (layoutAnalysis.data.typography.headings) {
      layoutAnalysis.data.typography.headings.forEach(heading => {
        if (heading.element === 'h1') {
          patterns.typography.hero.fontSize = heading.size;
          patterns.typography.hero.fontWeight = heading.weight;
          patterns.typography.hero.lineHeight = heading.lineHeight;
        }
        if (heading.element === 'h2') {
          patterns.typography.sectionTitle.fontSize = heading.size;
          patterns.typography.sectionTitle.fontWeight = heading.weight;
        }
      });
    }
  }

  // Extract color patterns
  if (layoutAnalysis.data.colors) {
    if (layoutAnalysis.data.colors.primary) {
      patterns.colors.primary = layoutAnalysis.data.colors.primary[0]?.hex || '#635bff';
      patterns.colors.accent = layoutAnalysis.data.colors.primary[1]?.hex || '#00d924';
    }
    
    if (layoutAnalysis.data.colors.neutral) {
      patterns.colors.backgroundSecondary = '#fafbfc';
      patterns.colors.text = layoutAnalysis.data.colors.neutral[0]?.hex || '#1a1f36';
    }
  }

  // Extract spacing patterns
  if (layoutAnalysis.data.spacing?.common) {
    const spacingValues = layoutAnalysis.data.spacing.common;
    patterns.spacing = {
      hero: spacingValues.find(s => s.usage?.includes('hero'))?.value || '80px 0',
      section: spacingValues.find(s => s.usage?.includes('section'))?.value || '96px 0',
      grid: spacingValues.find(s => s.usage?.includes('gap'))?.value || '48px',
      card: '32px'
    };
  }

  patterns.buttons = {
    padding: '16px 32px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px'
  };

  if (layoutAnalysis.data.designSystem?.borderRadius) {
    patterns.borderRadius = layoutAnalysis.data.designSystem.borderRadius[0] || '8px';
  }

  console.log('🎨 Final extracted patterns:', patterns);
  return patterns;
}

// Stripe default patterns
function getStripeDefaults() {
  return {
    typography: {
      hero: { fontSize: '56px', fontWeight: '700', lineHeight: '1.1' },
      sectionTitle: { fontSize: '40px', fontWeight: '600', lineHeight: '1.2' },
      featureTitle: { fontSize: '24px', fontWeight: '600', lineHeight: '1.3' },
      body: { fontSize: '16px', fontWeight: '400', lineHeight: '1.5' },
      quote: { fontSize: '28px', fontWeight: '400', lineHeight: '1.4' }
    },
    colors: {
      primary: '#635bff',
      accent: '#00d924',
      backgroundSecondary: '#fafbfc',
      text: '#1a1f36'
    },
    spacing: {
      hero: '80px 0',
      section: '96px 0',
      grid: '48px',
      card: '32px'
    },
    buttons: {
      padding: '16px 32px',
      borderRadius: '8px',
      fontWeight: '600'
    },
    borderRadius: '8px'
  };
}

// Generate intelligent layout
async function generateIntelligentLayout(copyClassification, layoutAnalysis, brandTokens) {
  console.log('🎨 === INTELLIGENT LAYOUT GENERATION ===');
  
  // Debug layout analysis
  console.log('🎨 Layout analysis source:', layoutAnalysis?.source);
  console.log('🎨 Layout analysis data keys:', layoutAnalysis?.data ? Object.keys(layoutAnalysis.data) : 'none');
  
  // Advanced content analysis and mapping
  let sections = analyzeAndMapContent(copyClassification);
  
  console.log('🎨 Analyzed sections:', sections.length);
  console.log('🎨 Layout patterns available:', !!layoutAnalysis);
  console.log('🎨 Brand tokens available:', !!brandTokens);

  // Apply layout patterns and brand styling
  const styledSections = sections.map((section, index) => {
    const baseSection = {
      ...section,
      id: section.id || `section-${index}`,
      styling: applyAdvancedBrandStyling(section, brandTokens, layoutAnalysis)
    };

    console.log(`🎨 Styled section ${index} (${section.type}):`, baseSection.layout, baseSection.structure);
    return baseSection;
  });

  console.log('🎨 Generated sections:', styledSections.length);

  return {
    sections: styledSections,
    generation: {
      timestamp: new Date().toISOString(),
      layoutSource: layoutAnalysis?.source || 'default',
      brandSource: brandTokens ? 'database' : 'fallback',
      sectionsCount: styledSections.length,
      analysisMethod: 'advanced'
    }
  };
}

// Apply advanced brand styling
function applyAdvancedBrandStyling(section, brandTokens, layoutAnalysis) {
  console.log(`🎨 Applying advanced styling for ${section.type} with layout ${section.layout}`);
  
  const defaultStyling = {
    padding: '48px 0',
    containerMaxWidth: '1200px'
  };

  // Extract brand colors
  const primaryColor = extractTokenValue(brandTokens, 'colors.primary.primary') || '#3B82F6';
  const secondaryColor = extractTokenValue(brandTokens, 'colors.primary.secondary') || '#10B981';
  const textColor = extractTokenValue(brandTokens, 'colors.neutral.text') || '#333333';

  // Extract typography
  const headingFont = extractTokenValue(brandTokens, 'typography.heading.heading') || 'Inter';
  const bodyFont = extractTokenValue(brandTokens, 'typography.body.body') || 'Inter';

  // Get Stripe-like styling
  const stripePatterns = extractStripePatterns(layoutAnalysis);
  
  // Layout-specific styling
  const layoutStyling = getLayoutSpecificStyling(section.layout, stripePatterns);
  
  // Section-specific styling
  const sectionStyling = {
    hero: {
      ...defaultStyling,
      backgroundColor: primaryColor,
      textColor: '#ffffff',
      headlineFont: headingFont,
      headlineSize: stripePatterns.typography?.hero?.fontSize || '56px',
      headlineWeight: stripePatterns.typography?.hero?.fontWeight || '700',
      headlineLineHeight: stripePatterns.typography?.hero?.lineHeight || '1.1',
      subheadlineSize: '20px',
      subheadlineWeight: '400',
      ctaBackgroundColor: '#ffffff',
      ctaTextColor: primaryColor,
      ctaPadding: stripePatterns.buttons?.padding || '16px 32px',
      ctaBorderRadius: stripePatterns.buttons?.borderRadius || '8px',
      ctaFontWeight: stripePatterns.buttons?.fontWeight || '600',
      padding: stripePatterns.spacing?.hero || '80px 0',
      textAlign: 'center',
      ...layoutStyling
    },
    features: {
      ...defaultStyling,
      backgroundColor: stripePatterns.colors?.backgroundSecondary || '#fafbfc',
      textColor: textColor,
      titleFont: headingFont,
      titleSize: stripePatterns.typography?.sectionTitle?.fontSize || '40px',
      titleWeight: stripePatterns.typography?.sectionTitle?.fontWeight || '600',
      titleLineHeight: stripePatterns.typography?.sectionTitle?.lineHeight || '1.2',
      featureTitleSize: stripePatterns.typography?.featureTitle?.fontSize || '24px',
      featureTitleWeight: stripePatterns.typography?.featureTitle?.fontWeight || '600',
      featureTextSize: stripePatterns.typography?.body?.fontSize || '16px',
      featureTextLineHeight: stripePatterns.typography?.body?.lineHeight || '1.5',
      gridGap: stripePatterns.spacing?.grid || '48px',
      padding: stripePatterns.spacing?.section || '96px 0',
      featurePadding: stripePatterns.spacing?.card || '32px',
      borderRadius: stripePatterns.borderRadius || '12px',
      ...layoutStyling
    },
    testimonial: {
      ...defaultStyling,
      backgroundColor: '#ffffff',
      textColor: textColor,
      quoteFont: bodyFont,
      quoteSize: stripePatterns.typography?.quote?.fontSize || '28px',
      quoteWeight: stripePatterns.typography?.quote?.fontWeight || '400',
      quoteLineHeight: stripePatterns.typography?.quote?.lineHeight || '1.4',
      authorSize: '16px',
      authorWeight: '500',
      padding: stripePatterns.spacing?.section || '80px 0',
      borderRadius: stripePatterns.borderRadius || '12px',
      ...layoutStyling
    },
    cta: {
      ...defaultStyling,
      backgroundColor: stripePatterns.colors?.accent || secondaryColor,
      textColor: '#ffffff',
      headlineFont: headingFont,
      headlineSize: stripePatterns.typography?.sectionTitle?.fontSize || '48px',
      headlineWeight: stripePatterns.typography?.sectionTitle?.fontWeight || '600',
      headlineLineHeight: stripePatterns.typography?.sectionTitle?.lineHeight || '1.2',
      descriptionSize: '18px',
      descriptionWeight: '400',
      primaryCTABg: '#ffffff',
      primaryCTAText: stripePatterns.colors?.accent || secondaryColor,
      primaryCTAPadding: stripePatterns.buttons?.padding || '16px 32px',
      primaryCTABorderRadius: stripePatterns.buttons?.borderRadius || '8px',
      primaryCTAFontWeight: stripePatterns.buttons?.fontWeight || '600',
      padding: stripePatterns.spacing?.section || '96px 0',
      ...layoutStyling
    },
    about: {
      ...defaultStyling,
      backgroundColor: '#ffffff',
      textColor: textColor,
      titleSize: '36px',
      titleWeight: '600',
      textSize: '18px',
      textLineHeight: '1.6',
      padding: '96px 0',
      ...layoutStyling
    },
    stats: {
      ...defaultStyling,
      backgroundColor: primaryColor,
      textColor: '#ffffff',
      statNumberSize: '48px',
      statNumberWeight: '700',
      statLabelSize: '16px',
      statLabelWeight: '400',
      gridGap: '40px',
      padding: '80px 0',
      ...layoutStyling
    }
  };

  return sectionStyling[section.type] || { ...defaultStyling, ...layoutStyling };
}

// Get layout-specific styling adjustments
function getLayoutSpecificStyling(layout, stripePatterns) {
  const layoutStyles = {
    'split-content': {
      gridTemplate: '1fr 1fr',
      gridGap: '64px',
      alignItems: 'center'
    },
    'icon-grid': {
      gridTemplate: 'repeat(auto-fit, minmax(300px, 1fr))',
      gridGap: stripePatterns.spacing?.grid || '48px'
    },
    'centered': {
      textAlign: 'center',
      maxWidth: '800px',
      margin: '0 auto'
    },
    'image-text': {
      gridTemplate: '1fr 1fr',
      gridGap: '80px',
      alignItems: 'center'
    },
    'stats-grid': {
      gridTemplate: 'repeat(auto-fit, minmax(200px, 1fr))',
      gridGap: '40px',
      textAlign: 'center'
    }
  };
  
  return layoutStyles[layout] || {};
}

// Helper to extract token values
function extractTokenValue(brandTokens, path) {
  const keys = path.split('.');
  let value = brandTokens;
  
  for (const key of keys) {
    value = value?.[key];
    if (!value) return null;
  }
  
  return value?.value || value;
}