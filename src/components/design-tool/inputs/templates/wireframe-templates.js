// wireframe-templates.js
// Centralized wireframe layout templates for easy expansion

export const WIREFRAME_TEMPLATES = {
  // HERO SECTIONS
  hero_image_left: {
    name: 'Hero - Image Left',
    layout: 'image_text_split',
    imagePos: 'left',
    hasImage: true,
    description: 'Hero section with image on left, content on right',
    bestFor: ['hero', 'main_intro'],
    structure: {
      image: { width: '40%', height: '200px' },
      content: { width: '60%' }
    }
  },
  
  hero_image_right: {
    name: 'Hero - Image Right', 
    layout: 'image_text_split',
    imagePos: 'right',
    hasImage: true,
    description: 'Hero section with content on left, image on right',
    bestFor: ['hero', 'main_intro'],
    structure: {
      content: { width: '60%' },
      image: { width: '40%', height: '200px' }
    }
  },

  hero_centered: {
    name: 'Hero - Centered',
    layout: 'centered_hero',
    imagePos: null,
    hasImage: false,
    description: 'Centered hero text with optional background',
    bestFor: ['hero', 'main_intro'],
    structure: {
      content: { maxWidth: '600px', textAlign: 'center' }
    }
  },

  hero_full_width: {
    name: 'Hero - Full Width',
    layout: 'full_width_hero',
    imagePos: null,
    hasImage: true,
    description: 'Full width hero with background image and overlay text',
    bestFor: ['hero', 'landing'],
    structure: {
      background: true,
      overlay: true,
      content: { position: 'overlay' }
    }
  },

  // CONTENT SECTIONS
  text_block: {
    name: 'Text Block',
    layout: 'text_block',
    imagePos: null,
    hasImage: false,
    description: 'Simple text content block',
    bestFor: ['content', 'description'],
    structure: {
      content: { maxWidth: '800px' }
    }
  },

  text_with_sidebar: {
    name: 'Text with Sidebar',
    layout: 'text_sidebar',
    imagePos: 'right',
    hasImage: false,
    description: 'Main content with sidebar information',
    bestFor: ['content', 'article'],
    structure: {
      main: { width: '70%' },
      sidebar: { width: '30%' }
    }
  },

  // PROBLEM/PAIN POINT SECTIONS
  problem_centered: {
    name: 'Problem - Centered',
    layout: 'centered_emphasis',
    imagePos: null,
    hasImage: false,
    description: 'Centered problem statement with emphasis styling',
    bestFor: ['problem', 'pain_point'],
    structure: {
      content: { maxWidth: '600px', textAlign: 'center', emphasis: true }
    }
  },

  problem_split: {
    name: 'Problem - Before/After',
    layout: 'problem_split',
    imagePos: null,
    hasImage: false,
    description: 'Split layout showing before/after or problem/solution',
    bestFor: ['problem', 'comparison'],
    structure: {
      left: { width: '50%', title: 'Before' },
      right: { width: '50%', title: 'After' }
    }
  },

  // SOLUTION SECTIONS
  solution_callout: {
    name: 'Solution - Callout Box',
    layout: 'callout_box',
    imagePos: null,
    hasImage: false,
    description: 'Highlighted solution in bordered callout box',
    bestFor: ['solution', 'key_point'],
    structure: {
      content: { maxWidth: '500px', border: true, highlight: true }
    }
  },

  solution_steps: {
    name: 'Solution - Step by Step',
    layout: 'numbered_steps',
    imagePos: null,
    hasImage: false,
    description: 'Numbered steps or process flow',
    bestFor: ['solution', 'process', 'how_it_works'],
    structure: {
      content: { numbered: true, steps: true }
    }
  },

  // FEATURES/BENEFITS SECTIONS
  features_two_column: {
    name: 'Features - Two Column',
    layout: 'two_column_list',
    imagePos: null,
    hasImage: false,
    description: 'Feature list in two columns',
    bestFor: ['features', 'benefits', 'list'],
    structure: {
      columns: 2,
      items: 'list'
    }
  },

  features_three_column: {
    name: 'Features - Three Column',
    layout: 'three_column_list',
    imagePos: null,
    hasImage: false,
    description: 'Feature list in three columns',
    bestFor: ['features', 'benefits', 'list'],
    structure: {
      columns: 3,
      items: 'list'
    }
  },

  features_grid: {
    name: 'Features - Icon Grid',
    layout: 'icon_grid',
    imagePos: null,
    hasImage: true,
    description: 'Features with icons in grid layout',
    bestFor: ['features', 'services', 'benefits'],
    structure: {
      grid: true,
      icons: true,
      columns: 'auto'
    }
  },

  features_accordion: {
    name: 'Features - Accordion',
    layout: 'accordion',
    imagePos: null,
    hasImage: false,
    description: 'Expandable feature sections',
    bestFor: ['features', 'faq', 'details'],
    structure: {
      expandable: true,
      headers: 'clickable'
    }
  },

  // ABOUT/BIO SECTIONS
  about_image_right: {
    name: 'About - Image Right',
    layout: 'image_text_split',
    imagePos: 'right',
    hasImage: true,
    description: 'About section with profile image on right',
    bestFor: ['about', 'bio', 'team'],
    structure: {
      content: { width: '65%' },
      image: { width: '35%', height: '160px' }
    }
  },

  about_image_left: {
    name: 'About - Image Left',
    layout: 'image_text_split',
    imagePos: 'left',
    hasImage: true,
    description: 'About section with profile image on left',
    bestFor: ['about', 'bio', 'team'],
    structure: {
      image: { width: '35%', height: '160px' },
      content: { width: '65%' }
    }
  },

  about_centered: {
    name: 'About - Centered',
    layout: 'centered_bio',
    imagePos: null,
    hasImage: true,
    description: 'Centered bio with image above or below text',
    bestFor: ['about', 'bio'],
    structure: {
      image: { position: 'above', centered: true },
      content: { textAlign: 'center', maxWidth: '600px' }
    }
  },

  // TESTIMONIAL/SOCIAL PROOF
  testimonial_quote: {
    name: 'Testimonial - Quote',
    layout: 'testimonial_quote',
    imagePos: 'left',
    hasImage: true,
    description: 'Customer testimonial with photo and quote',
    bestFor: ['testimonial', 'social_proof'],
    structure: {
      quote: true,
      avatar: true,
      attribution: true
    }
  },

  testimonial_cards: {
    name: 'Testimonials - Cards',
    layout: 'testimonial_cards',
    imagePos: null,
    hasImage: true,
    description: 'Multiple testimonials in card format',
    bestFor: ['testimonials', 'reviews'],
    structure: {
      cards: true,
      multiple: true,
      avatars: true
    }
  },

  // CALL TO ACTION SECTIONS
  cta_centered: {
    name: 'CTA - Centered',
    layout: 'centered_cta',
    imagePos: null,
    hasImage: false,
    description: 'Centered call to action with button',
    bestFor: ['cta', 'conversion'],
    structure: {
      content: { textAlign: 'center', maxWidth: '400px' },
      button: { prominent: true }
    }
  },

  cta_banner: {
    name: 'CTA - Full Width Banner',
    layout: 'cta_banner',
    imagePos: null,
    hasImage: true,
    description: 'Full width CTA banner with background',
    bestFor: ['cta', 'conversion'],
    structure: {
      fullWidth: true,
      background: true,
      prominent: true
    }
  },

  cta_sidebar: {
    name: 'CTA - Sidebar',
    layout: 'cta_sidebar',
    imagePos: 'right',
    hasImage: false,
    description: 'CTA in sidebar format',
    bestFor: ['cta', 'secondary_action'],
    structure: {
      sticky: true,
      compact: true
    }
  },

  // CONTACT/FORM SECTIONS
  contact_form: {
    name: 'Contact - Form',
    layout: 'contact_form',
    imagePos: null,
    hasImage: false,
    description: 'Contact section with form fields',
    bestFor: ['contact', 'lead_gen'],
    structure: {
      form: true,
      fields: ['name', 'email', 'message']
    }
  },

  contact_split: {
    name: 'Contact - Info + Form',
    layout: 'contact_split',
    imagePos: 'left',
    hasImage: false,
    description: 'Contact info on left, form on right',
    bestFor: ['contact', 'lead_gen'],
    structure: {
      info: { width: '40%' },
      form: { width: '60%' }
    }
  },

  // PRICING SECTIONS
  pricing_table: {
    name: 'Pricing - Table',
    layout: 'pricing_table',
    imagePos: null,
    hasImage: false,
    description: 'Pricing comparison table',
    bestFor: ['pricing', 'plans'],
    structure: {
      table: true,
      comparison: true,
      highlighted: 'middle'
    }
  },

  pricing_cards: {
    name: 'Pricing - Cards',
    layout: 'pricing_cards',
    imagePos: null,
    hasImage: false,
    description: 'Pricing plans in card format',
    bestFor: ['pricing', 'plans'],
    structure: {
      cards: true,
      featured: true
    }
  }
};

// Template selection logic
export const selectBestTemplate = (sectionType, contentAnalysis = {}) => {
  const {
    hasLists = false,
    hasImages = false,
    isLong = false,
    hasNumbers = false,
    hasQuotes = false,
    elementCount = 0
  } = contentAnalysis;

  // Default templates by section type
  const defaults = {
    hero: hasImages ? 'hero_image_left' : 'hero_centered',
    problem: 'problem_centered',
    solution: hasNumbers ? 'solution_steps' : 'solution_callout',
    about: hasImages ? 'about_image_right' : 'about_centered',
    features: hasLists ? (elementCount > 6 ? 'features_three_column' : 'features_two_column') : 'features_grid',
    testimonial: hasQuotes ? 'testimonial_quote' : 'testimonial_cards',
    cta: 'cta_centered',
    contact: 'contact_form',
    pricing: 'pricing_cards',
    content: isLong ? 'text_with_sidebar' : 'text_block'
  };

  return WIREFRAME_TEMPLATES[defaults[sectionType]] || WIREFRAME_TEMPLATES.text_block;
};

// Get template by key
export const getTemplate = (templateKey) => {
  return WIREFRAME_TEMPLATES[templateKey] || WIREFRAME_TEMPLATES.text_block;
};

// Get all templates for a section type
export const getTemplatesForSection = (sectionType) => {
  return Object.entries(WIREFRAME_TEMPLATES)
    .filter(([key, template]) => template.bestFor.includes(sectionType))
    .map(([key, template]) => ({ key, ...template }));
};

// Get all available section types
export const getSectionTypes = () => {
  const types = new Set();
  Object.values(WIREFRAME_TEMPLATES).forEach(template => {
    template.bestFor.forEach(type => types.add(type));
  });
  return Array.from(types).sort();
};