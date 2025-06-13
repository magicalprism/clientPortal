// Journey stage mapping
const JOURNEY_STAGE_LAYOUTS = {
  awareness: {
    content_focus: 'problem_identification',
    layout_style: 'educational_storytelling',
    visual_approach: 'relatable_imagery',
    pacing: 'gradual_revelation'
  },
  consideration: {
    content_focus: 'solution_comparison',
    layout_style: 'feature_comparison_grid',
    visual_approach: 'product_focused',
    pacing: 'systematic_evaluation'
  },
  decision: {
    content_focus: 'conversion_optimization',
    layout_style: 'streamlined_conversion_flow',
    visual_approach: 'trust_signals_prominent',
    pacing: 'urgency_driven'
  }
}

// Cognitive load management
const COGNITIVE_LOAD_RULES = {
  choice_overload: {
    max_options_visible: 7,
    solution: 'progressive_disclosure_or_filtering'
  },
  information_overload: {
    max_concepts_per_screen: 3,
    solution: 'chunking_with_clear_hierarchy'
  },
  decision_fatigue: {
    max_decision_points: 2,
    solution: 'guided_flow_with_defaults'
  }
}