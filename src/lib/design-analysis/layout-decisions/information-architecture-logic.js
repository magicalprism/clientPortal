// Content hierarchy detection
const HIERARCHY_DETECTION = {
  primary_message: {
    detection: 'first_sentence_or_largest_text',
    weight_score: 10,
    layout_impact: 'hero_positioning'
  },
  supporting_points: {
    detection: 'bullet_points_or_numbered_lists',
    weight_score: 7,
    layout_impact: 'feature_grid_or_cards'
  },
  evidence: {
    detection: 'testimonials_stats_case_studies',
    weight_score: 5,
    layout_impact: 'social_proof_section'
  },
  details: {
    detection: 'fine_print_specifications',
    weight_score: 2,
    layout_impact: 'accordion_or_footer'
  }
}

// Information flow optimization
const INFORMATION_FLOW = {
  attention_grabbing: {
    position: 'above_fold',
    size_multiplier: 2.0,
    color_prominence: 'high'
  },
  core_value_prop: {
    position: 'primary_viewport',
    size_multiplier: 1.5,
    color_prominence: 'medium'
  },
  supporting_details: {
    position: 'secondary_viewport',
    size_multiplier: 1.0,
    color_prominence: 'low'
  }
}