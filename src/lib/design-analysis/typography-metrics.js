// Font size relationships (mathematical scales)
const TYPOGRAPHY_SCALES = {
  major_second: 1.125,
  minor_third: 1.2,
  major_third: 1.25,
  perfect_fourth: 1.333,
  golden_ratio: 1.618
}

// Line height calculations
const LINE_HEIGHT_RATIOS = {
  display: 1.1, // Large headlines
  heading: 1.25, // Section headers  
  body: 1.5, // Paragraph text
  caption: 1.4 // Small text
}

// Optimal reading measurements
const READABILITY_METRICS = {
  optimal_line_length: { min: 45, max: 75 }, // characters
  minimum_font_size: 16, // pixels
  contrast_ratio_aa: 4.5,
  contrast_ratio_aaa: 7.0
}