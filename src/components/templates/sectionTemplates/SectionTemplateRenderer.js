import { sectionTemplates } from './index';

export async function renderSectionTemplate(section) {
  const templateKey =
    section.template?.layout_key ||
    section.template?.id ||
    section.template_id;

  const template = sectionTemplates.find(t => t.id === templateKey);

  if (!template) {
    console.warn(`[SectionTemplateRenderer] Unknown template: ${templateKey}`);
    return null;
  }

  try {
    // Dynamic import (adjust depending on bundler)
    const { fetchData } = await import(`./${template.id}/query.js`);
    const data = await fetchData(section.id);
    return template.render({ ...data, ...section });
  } catch (err) {
    console.error(`[SectionTemplateRenderer] Error loading template '${template.id}':`, err);
    return null;
  }
}
