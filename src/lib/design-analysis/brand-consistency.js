// Logo usage specifications
const LOGO_SPECIFICATIONS = {
  clear_space_ratio: 2, // 2x logo height around logo
  minimum_sizes: {
    print: 16, // mm
    digital: 24, // pixels
    favicon: 16 // pixels
  },
  color_variations: {
    primary: true,
    white: true,
    black: true,
    single_color: true
  },
  placement_zones: ['top-left', 'top-center', 'center']
}

// Brand color consistency
const BRAND_COLOR_USAGE = {
  primary_color_percentage: [5, 15], // 5-15% of page
  secondary_color_percentage: [10, 25], // 10-25% of page
  neutral_color_percentage: [60, 85], // 60-85% of page
  color_deviation_tolerance: 5 // Delta E color difference
}