import { textOnly } from '@/components/templates/sectionTemplates/textOnly';
import { imageBlock } from '@/components/templates/sectionTemplates/imageBlock'; // unified left/right
import { imageTop } from '@/components/templates/sectionTemplates/imageTop';
import { featureGrid } from '@/components/templates/sectionTemplates/featureGrid';
import { centeredCTA } from '@/components/templates/sectionTemplates/centeredCTA';
import { testimonialGrid } from '@/components/templates/sectionTemplates/testimonialGrid';
import { logoBar } from '@/components/templates/sectionTemplates/logoBar';
import { contactSection, statsCounter, faqAccordion } from '@/components/templates/sectionTemplates/contactStatsFaqs';
import { pricingTable, teamGrid } from '@/components/templates/sectionTemplates/pricingAbout';
import { servicesGrid, processSteps } from '@/components/templates/sectionTemplates/services';

export const sectionTemplates = [
  textOnly,
  imageBlock,   // was imageLeft
  imageTop,
  featureGrid,
  centeredCTA,
  testimonialGrid,
  logoBar,
  contactSection,
  statsCounter,
  faqAccordion,
  pricingTable,
  teamGrid,
  servicesGrid,
  processSteps
];

export const sectionTemplateMap = Object.fromEntries(
  sectionTemplates.map(t => [t.id, t])
);