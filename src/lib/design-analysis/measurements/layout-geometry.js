export const GOLDEN_RATIO = 1.618;

export const LAYOUT_PROPORTIONS = {
  sidebar_to_main: 1 / GOLDEN_RATIO,
  header_to_content: 1 / (GOLDEN_RATIO * 2),
  image_to_text: GOLDEN_RATIO / 3
};

export const GRID_SYSTEMS = {
  columns_12: { gutters: 20, margins: 15 },
  columns_16: { gutters: 16, margins: 24 },
  breakpoints: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    wide: 1440
  }
};

export function calculateLayoutProportions(layout) {
  return LAYOUT_PROPORTIONS;
}
