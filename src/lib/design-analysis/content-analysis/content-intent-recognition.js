// Intent-based layout selection
const INTENT_TO_LAYOUT_MAP = {
  persuasive_selling: {
    content_signals: ['buy', 'get', 'save', 'limited time', 'exclusive'],
    layout_pattern: 'hero_benefits_social_proof_cta',
    visual_hierarchy: 'aggressive', // Large CTAs, prominent pricing
    pacing: 'fast' // Quick progression to conversion
  },
  
  educational_informing: {
    content_signals: ['learn', 'understand', 'guide', 'how to', 'tutorial'],
    layout_pattern: 'structured_content_with_navigation',
    visual_hierarchy: 'methodical', // Clear headings, logical flow
    pacing: 'patient' // Allow for absorption
  },
  
  trust_building: {
    content_signals: ['secure', 'trusted', 'certified', 'proven'],
    layout_pattern: 'testimonials_credentials_guarantees',
    visual_hierarchy: 'authoritative', // Emphasis on credibility
    pacing: 'deliberate' // Build confidence gradually
  },
  
  problem_solving: {
    content_signals: ['problem', 'solution', 'challenge', 'fix'],
    layout_pattern: 'problem_agitation_solution',
    visual_hierarchy: 'empathetic', // Understanding then resolution
    pacing: 'narrative' // Story-like progression
  }
}