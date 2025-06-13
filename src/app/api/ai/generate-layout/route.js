// app/api/ai/generate-layout/route.js
import { generateIntelligentLayout } from '@/lib/ai/layout-generator';

export async function POST(request) {
  try {
    console.log('🎨 === GENERATE LAYOUT API CALLED ===');
    
    const { 
      copyClassification, 
      layoutAnalysis, 
      brandTokens, 
      brandId 
    } = await request.json();

    console.log('🎨 Input validation:');
    console.log('🎨 - Copy classification:', !!copyClassification);
    console.log('🎨 - Layout analysis:', !!layoutAnalysis);
    console.log('🎨 - Brand tokens:', !!brandTokens);
    console.log('🎨 - Brand ID:', brandId);

    // Validate required inputs
    if (!copyClassification) {
      return Response.json({
        success: false,
        error: 'Copy classification is required'
      }, { status: 400 });
    }

    if (!layoutAnalysis) {
      return Response.json({
        success: false,
        error: 'Layout analysis is required'
      }, { status: 400 });
    }

    // If no brand tokens provided, fetch from database
    let finalBrandTokens = brandTokens;
    if (!finalBrandTokens && brandId) {
      console.log('🎨 Fetching brand tokens from database...');
      finalBrandTokens = await fetchBrandTokens(brandId);
    }

    // Generate fallback brand tokens if none available
    if (!finalBrandTokens) {
      console.log('🎨 Using fallback brand tokens...');
      finalBrandTokens = generateFallbackBrandTokens();
    }

    console.log('🎨 Starting intelligent layout generation...');
    
    // Generate the combined layout
    const generatedLayout = generateIntelligentLayout(
      copyClassification,
      layoutAnalysis,
      finalBrandTokens
    );

    console.log('🎨 Layout generation complete!');
    console.log('🎨 Generated sections:', generatedLayout?.sections?.length || 0);

    // Add generation metadata
    const response = {
      success: true,
      data: {
        ...generatedLayout,
        generation: {
          timestamp: new Date().toISOString(),
          copySource: copyClassification?.source || 'user-input',
          layoutSource: layoutAnalysis?.source || 'url-analysis',
          brandSource: brandTokens ? 'provided' : brandId ? 'database' : 'fallback',
          version: '1.0'
        }
      }
    };

    return Response.json(response);

  } catch (error) {
    console.error('🎨 Layout generation error:', error);
    
    return Response.json({
      success: false,
      error: 'Layout generation failed',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Fetch brand tokens from Supabase
 */
async function fetchBrandTokens(brandId) {
  try {
    console.log('🎨 Fetching brand tokens for brand:', brandId);
    
    // Import Supabase queries
    const { fetchDesignTokensByBrandId } = await import('@/lib/supabase/queries/table/design-token');
    
    const { data: tokens, error } = await fetchDesignTokensByBrandId(brandId);
    
    if (error) {
      console.error('🎨 Error fetching brand tokens:', error);
      return null;
    }

    if (!tokens || tokens.length === 0) {
      console.log('🎨 No brand tokens found for brand:', brandId);
      return null;
    }

    console.log('🎨 Found brand tokens:', tokens.length);
    
    // Transform Supabase tokens into the format expected by the generator
    return transformSupabaseTokens(tokens);

  } catch (error) {
    console.error('🎨 Error in fetchBrandTokens:', error);
    return null;
  }
}

/**
 * Transform Supabase design tokens into the format expected by the generator
 */
function transformSupabaseTokens(tokens) {
  console.log('🎨 Transforming Supabase tokens...');
  
  const transformedTokens = {
    colors: {},
    typography: {},
    spacing: {}
  };

  tokens.forEach(token => {
    const { group, name, value, type } = token;
    
    if (group === 'colors') {
      transformedTokens.colors[name] = value;
    } else if (group === 'typography') {
      if (!transformedTokens.typography[type]) {
        transformedTokens.typography[type] = {};
      }
      transformedTokens.typography[type][name] = value;
    } else if (group === 'spacing') {
      transformedTokens.spacing[name] = value;
    }
  });

  console.log('🎨 Transformed tokens:', transformedTokens);
  return transformedTokens;
}

/**
 * Generate fallback brand tokens when none are available
 */
function generateFallbackBrandTokens() {
  console.log('🎨 Generating fallback brand tokens...');
  
  return {
    colors: {
      primary: '#0070f3',
      background: '#ffffff',
      backgroundSecondary: '#f8fafc',
      text: '#000000',
      textSecondary: '#64748b',
      onPrimary: '#ffffff',
      border: '#e5e7eb'
    },
    typography: {
      primary: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      },
      h1: {
        size: '48px',
        weight: '600',
        lineHeight: '1.1'
      },
      h2: {
        size: '36px',
        weight: '600',
        lineHeight: '1.2'
      },
      h3: {
        size: '24px',
        weight: '500',
        lineHeight: '1.3'
      },
      body: {
        size: '16px',
        weight: '400',
        lineHeight: '1.6'
      },
      small: {
        size: '14px',
        weight: '400',
        lineHeight: '1.5'
      },
      large: {
        size: '18px',
        weight: '400',
        lineHeight: '1.5'
      }
    },
    spacing: {
      xs: '8px',
      small: '16px',
      medium: '24px',
      large: '32px',
      xl: '48px',
      xxl: '64px'
    }
  };
}