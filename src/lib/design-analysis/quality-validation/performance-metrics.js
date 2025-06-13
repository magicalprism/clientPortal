// Page performance benchmarks
const PERFORMANCE_BENCHMARKS = {
  load_times: {
    first_contentful_paint: 1.8, // seconds
    largest_contentful_paint: 2.5,
    time_to_interactive: 3.8,
    cumulative_layout_shift: 0.1
  },
  file_sizes: {
    html: 50, // KB
    css: 100, // KB
    javascript: 200, // KB
    images_total: 1000, // KB
    fonts_total: 100 // KB
  },
  optimization_ratios: {
    image_compression: 0.7, // 70% size reduction
    css_minification: 0.3, // 30% size reduction
    js_minification: 0.4 // 40% size reduction
  }
}