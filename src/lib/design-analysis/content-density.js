// Reading time calculations
const READING_SPEEDS = {
  average_wpm: 200,
  slow_wpm: 150,
  fast_wpm: 300
}

// Content chunk optimal sizes
const CONTENT_CHUNKS = {
  hero_headline: { words: 6, chars: 60 },
  hero_subtext: { words: 15, chars: 120 },
  feature_title: { words: 4, chars: 40 },
  feature_description: { words: 20, chars: 150 },
  paragraph_optimal: { words: 50, chars: 400 },
  paragraph_max: { words: 75, chars: 600 }
}

// Information density scoring
const DENSITY_THRESHOLDS = {
  too_sparse: 0.3, // Less than 30% of available space used
  optimal: 0.5, // 50% of available space used
  too_dense: 0.8 // More than 80% of available space used
}