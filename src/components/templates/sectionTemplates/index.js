import { textOnly } from '@/components/templates/sectionTemplates/textOnly';
import { imageBlock } from '@/components/templates/sectionTemplates/imageBlock'; // unified left/right
import { imageTop } from '@/components/templates/sectionTemplates/imageTop';
import { featureGrid } from '@/components/templates/sectionTemplates/featureGrid';
import { centeredCTA } from '@/components/templates/sectionTemplates/centeredCTA';
import { testimonialGrid } from '@/components/templates/sectionTemplates/testimonialGrid';
import { logoBar } from '@/components/templates/sectionTemplates/logoBar';

export const sectionTemplates = [
  textOnly,
  imageBlock,   // was imageLeft
  imageTop,
  featureGrid,
  centeredCTA,
  testimonialGrid,
  logoBar
];

export const sectionTemplateMap = Object.fromEntries(
  sectionTemplates.map(t => [t.id, t])
);