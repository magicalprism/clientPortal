// Golden ratio applications
const GOLDEN_RATIO = 1.618;
const LAYOUT_PROPORTIONS = {
  sidebar_to_main: 1 / GOLDEN_RATIO, // ~0.618
  header_to_content: 1 / (GOLDEN_RATIO * 2), // ~0.309
  image_to_text: GOLDEN_RATIO / 3 // ~0.539
}

// Grid system measurements
const GRID_SYSTEMS = {
  columns_12: { gutters: 20, margins: 15 },
  columns_16: { gutters: 16, margins: 24 },
  breakpoints: {
    mobile: 320,
    tablet: 768, 
    desktop: 1024,
    wide: 1440
  }
}

// Visual weight distribution
const WEIGHT_DISTRIBUTION = {
  focal_point_max: 0.3, // 30% of visual weight
  supporting_elements: 0.5, // 50% of visual weight
  background_elements: 0.2 // 20% of visual weight
}