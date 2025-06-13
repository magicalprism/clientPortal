// Breakpoint behavior measurements
const RESPONSIVE_BREAKPOINTS = {
  mobile: { max: 767, cols: 1, margins: 16 },
  tablet: { min: 768, max: 1023, cols: 2, margins: 24 },
  desktop: { min: 1024, max: 1439, cols: 3, margins: 32 },
  wide: { min: 1440, cols: 4, margins: 40 }
}

// Scaling ratios across devices
const SCALING_RATIOS = {
  typography: {
    mobile_to_desktop: 0.875, // 87.5% of desktop size
    line_height_adjustment: 1.1
  },
  spacing: {
    mobile_to_desktop: 0.75, // 75% of desktop spacing
    padding_reduction: 0.5
  },
  images: {
    mobile_compression: 0.8, // 80% quality on mobile
    retina_scaling: 2
  }
}