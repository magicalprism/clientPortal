// Content complexity scoring
const CONTENT_COMPLEXITY_ANALYSIS = {
  simple: {
    concept_count: 1,
    reading_time: 30, // seconds
    decision_points: 0,
    layout_recommendation: 'single_column_centered'
  },
  moderate: {
    concept_count: [2, 4],
    reading_time: [30, 120],
    decision_points: [1, 3],
    layout_recommendation: 'two_column_or_cards'
  },
  complex: {
    concept_count: 5,
    reading_time: 120,
    decision_points: 3,
    layout_recommendation: 'progressive_disclosure'
  }
}

// Content relationship analysis
const CONTENT_RELATIONSHIPS = {
  sequential: {
    indicators: ['step', 'then', 'next', 'first', 'finally'],
    layout: 'timeline_or_numbered_sections'
  },
  comparative: {
    indicators: ['vs', 'compared to', 'versus', 'difference'],
    layout: 'side_by_side_comparison'
  },
  hierarchical: {
    indicators: ['includes', 'contains', 'such as', 'for example'],
    layout: 'nested_sections_or_tabs'
  }
}