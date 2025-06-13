// Border radius based on brand personality
const BRAND_PERSONALITY_RADIUS = {
  corporate_serious: {
    buttons: 4,
    cards: 6,
    inputs: 4,
    images: 0,
    personality_indicators: ['professional', 'trustworthy', 'established']
  },
  modern_friendly: {
    buttons: 8,
    cards: 12,
    inputs: 8,
    images: 8,
    personality_indicators: ['approachable', 'modern', 'user-friendly']
  },
  playful_creative: {
    buttons: 16,
    cards: 20,
    inputs: 12,
    images: 16,
    personality_indicators: ['fun', 'creative', 'innovative']
  },
  premium_luxury: {
    buttons: 0,
    cards: 2,
    inputs: 2,
    images: 0,
    personality_indicators: ['elegant', 'sophisticated', 'premium']
  }
}

// Component-specific radius rules
const COMPONENT_RADIUS_LOGIC = {
  small_components: 'base_radius * 0.5', // Icons, badges
  medium_components: 'base_radius', // Buttons, inputs
  large_components: 'base_radius * 1.5', // Cards, modals
  container_components: 'base_radius * 2' // Page sections
}

// Industry-appropriate radius selection
const INDUSTRY_RADIUS_STANDARDS = {
  fintech: { safe: 4, modern: 6, personality: 'trustworthy' },
  healthcare: { safe: 6, modern: 8, personality: 'caring' },
  ecommerce: { safe: 8, modern: 12, personality: 'friendly' },
  saas: { safe: 6, modern: 8, personality: 'professional' },
  creative: { safe: 12, modern: 16, personality: 'expressive' }
}