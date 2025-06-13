// Button and interactive element specs
const INTERACTIVE_SPECS = {
  button_dimensions: {
    height_range: [32, 56],
    padding_horizontal: [16, 32],
    padding_vertical: [8, 16],
    border_radius: [4, 8, 12]
  },
  state_variations: {
    hover_opacity_change: 0.1,
    active_scale: 0.95,
    disabled_opacity: 0.5,
    focus_outline_width: 2
  },
  loading_states: {
    spinner_size: [16, 24, 32],
    progress_bar_height: [4, 8],
    skeleton_animation_duration: 1500 // milliseconds
  }
}

// Touch and click targets
const INTERACTION_TARGETS = {
  minimum_size: 44, // pixels (accessibility standard)
  comfortable_size: 48,
  generous_size: 56,
  spacing_between: 8,
  edge_buffer: 16 // distance from screen edges
}