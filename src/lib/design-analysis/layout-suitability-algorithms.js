// Decision tree for layout selection
function determineOptimalLayout(contentAnalysis) {
  const {
    wordCount,
    conceptCount,
    emotionalTone,
    technicalComplexity,
    userGoals,
    contentTypes
  } = contentAnalysis;
  
  // Multi-factor decision matrix
  const layoutScores = {
    single_column: calculateSingleColumnScore(),
    multi_column: calculateMultiColumnScore(),
    card_grid: calculateCardGridScore(),
    hero_focused: calculateHeroFocusedScore(),
    comparison_table: calculateComparisonScore(),
    timeline: calculateTimelineScore()
  };
  
  return getHighestScoringLayout(layoutScores);
}

// Content density → layout decisions
const DENSITY_TO_LAYOUT = {
  sparse_content: {
    word_count: [0, 200],
    layout: 'hero_centered_minimal',
    whitespace_ratio: 0.7 // 70% whitespace
  },
  moderate_content: {
    word_count: [200, 800],
    layout: 'structured_sections',
    whitespace_ratio: 0.5 // 50% whitespace
  },
  dense_content: {
    word_count: 800,
    layout: 'progressive_disclosure_tabs',
    whitespace_ratio: 0.3 // 30% whitespace
  }
}