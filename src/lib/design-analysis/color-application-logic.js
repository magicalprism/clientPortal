// Color application hierarchy
const COLOR_HIERARCHY_RULES = {
  primary_brand_color: {
    usage_percentage: 10, // Max 10% of interface
    components: ['primary_buttons', 'links', 'key_highlights'],
    avoid_on: ['large_backgrounds', 'body_text']
  },
  secondary_brand_color: {
    usage_percentage: 20, // Max 20% of interface
    components: ['secondary_buttons', 'icons', 'accents'],
    pair_with: 'primary_color'
  },
  neutral_grays: {
    usage_percentage: 60, // 60% of interface
    components: ['text', 'borders', 'backgrounds'],
    hierarchy: {
      900: 'primary_text',
      700: 'secondary_text',
      500: 'placeholder_text',
      300: 'borders',
      100: 'light_backgrounds',
      50: 'page_background'
    }
  }
}

// Context-based color decisions
const COMPONENT_COLOR_CONTEXT = {
  success_actions: {
    color: 'green_600',
    background: 'green_50',
    border: 'green_200'
  },
  warning_actions: {
    color: 'yellow_700',
    background: 'yellow_50',
    border: 'yellow_200'
  },
  error_actions: {
    color: 'red_600',
    background: 'red_50',
    border: 'red_200'
  },
  info_actions: {
    color: 'blue_600',
    background: 'blue_50',
    border: 'blue_200'
  }
}