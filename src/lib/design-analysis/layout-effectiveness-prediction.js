// Layout performance predictors
const LAYOUT_EFFECTIVENESS_FACTORS = {
  content_comprehension: {
    scannable_hierarchy: 0.3,
    logical_flow: 0.25,
    visual_clarity: 0.2,
    progressive_disclosure: 0.15,
    whitespace_utilization: 0.1
  },
  
  conversion_probability: {
    trust_signal_placement: 0.25,
    friction_reduction: 0.2,
    value_prop_prominence: 0.2,
    social_proof_integration: 0.15,
    urgency_creation: 0.1,
    cognitive_ease: 0.1
  },
  
  brand_alignment: {
    tone_consistency: 0.4,
    visual_style_match: 0.3,
    target_audience_appeal: 0.2,
    industry_appropriateness: 0.1
  }
}

// A/B testing recommendations
const LAYOUT_VARIANTS = {
  high_trust_needed: ['testimonials_first', 'credentials_prominent'],
  high_urgency: ['cta_above_fold', 'scarcity_indicators'],
  complex_product: ['progressive_disclosure', 'feature_comparison'],
  simple_offering: ['hero_focused', 'minimal_distraction']
}