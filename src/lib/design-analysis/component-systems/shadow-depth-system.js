// Elevation system (Material Design inspired but measurable)
const SHADOW_ELEVATION_SYSTEM = {
  level_0: { // Flat elements
    box_shadow: 'none',
    use_cases: ['text', 'backgrounds', 'dividers']
  },
  level_1: { // Slightly raised
    box_shadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    use_cases: ['cards', 'list_items', 'search_bars']
  },
  level_2: { // Raised elements
    box_shadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    use_cases: ['buttons', 'floating_action_buttons']
  },
  level_3: { // Floating elements
    box_shadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    use_cases: ['dropdowns', 'tooltips', 'popovers']
  },
  level_4: { // Modal/overlay elements
    box_shadow: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
    use_cases: ['modals', 'dialogs', 'drawers']
  },
  level_5: { // Highest elevation
    box_shadow: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
    use_cases: ['navigation_drawers', 'picker_sheets']
  }
}

// Context-based shadow decisions
const SHADOW_USAGE_RULES = {
  interactive_elements: 'level_1_minimum', // Buttons, links
  content_containers: 'level_1_or_2', // Cards, panels
  overlays: 'level_3_or_4', // Dropdowns, modals
  navigation: 'level_2_or_3', // Navbars, sidebars
  decorative_only: 'level_0_or_1' // Images, backgrounds
}

// Brand personality shadow mapping
const PERSONALITY_SHADOW_INTENSITY = {
  minimal_clean: 0.05, // Very subtle shadows
  modern_standard: 0.15, // Standard shadow opacity
  dramatic_bold: 0.25, // Strong shadow presence
  premium_subtle: 0.08 // Refined, elegant shadows
}