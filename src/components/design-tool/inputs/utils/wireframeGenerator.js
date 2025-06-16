// Wireframe Generator Utilities
// Handles wireframe creation, template selection, and content analysis

import { createEnhancedTextSections, forceContentSplit, determineSectionFromSemanticElement, shouldStartNewSection, shouldForceNewSectionBasedOnContent, mergeTinySections } from './contentAnalysis';
import { WIREFRAME_TEMPLATES, selectBestTemplate } from '../templates/wireframe-templates';

export const generateWireframeData = (value, htmlStructure) => {
  if (!value.trim()) return null;

  console.log('🎨 CREATING SEMANTIC WIREFRAMES WITH TEMPLATES');
  console.log('🔍 HTML Structure check:', htmlStructure);
  console.log('🔍 HTML Structure elements:', htmlStructure?.elements?.length || 0);
  
  let sections = [];
  
  // FIXED: Better HTML structure detection
  if (htmlStructure && htmlStructure.elements && htmlStructure.elements.length > 0) {
    console.log('🎯 Using HTML semantic structure with', htmlStructure.elements.length, 'elements');
    sections = createSectionsFromSemanticStructure(htmlStructure.elements);
  } else {
    console.log('📝 No HTML structure detected, using enhanced text sections');
    sections = createEnhancedTextSections(value);
  }

  // FALLBACK: If we only got 1-2 sections, force-split the content
  if (sections.length <= 2) {
    console.log(`⚠️ Only got ${sections.length} sections, trying force-split approach...`);
    const forcedSections = forceContentSplit(value);
    if (forcedSections.length > sections.length) {
      sections = forcedSections;
    }
  }

  // Filter out any empty sections
  sections = sections.filter(section => 
    section.elements && section.elements.length > 0 && 
    section.elements.some(el => el.content && el.content.trim().length > 5)
  );

  console.log(`✅ Created ${sections.length} clean semantic sections`);

  // Convert to wireframe format using templates
  const wireframeSections = sections.map((section, index) => {
    // Analyze section content for template selection
    const contentAnalysis = analyzeContentForTemplate(section);
    
    console.log(`📋 Section ${index + 1} (${section.type}): Analyzing template selection...`);
    console.log(`   - ${contentAnalysis.bulletCount} bullets, should use bullet list: ${contentAnalysis.shouldUseBulletList}`);
    
    // Select best template based on section type and content
    let template = selectBestTemplate(section.type, contentAnalysis);
    let selectedLayout = template.layout;
    
    // ENHANCED: Better template selection for bullet-heavy content
    if (contentAnalysis.shouldUseBulletList) {
      console.log(`🎯 Overriding template for bullet list (${contentAnalysis.bulletCount} bullets)`);
      selectedLayout = 'bullet_list';
      template = {
        ...template,
        layout: 'bullet_list',
        name: 'Bullet List',
        description: 'Structured list with check marks and proper spacing'
      };
    } else if (contentAnalysis.shouldUseIconGrid && section.type === 'features') {
      console.log(`🎯 Using icon grid for features (${contentAnalysis.bulletCount} items)`);
      selectedLayout = 'icon_grid';
      template = {
        ...template,
        layout: 'icon_grid',
        name: 'Icon Grid',
        description: 'Grid layout with icons for each feature'
      };
    }
    
    // OVERRIDE: Never use text_sidebar for landing pages - always use better alternatives
    if (template.layout === 'text_sidebar') {
      console.log(`🔄 Removing text_sidebar template for ${section.type} section`);
      
      // Force better templates based on section type
      if (section.type === 'hero') {
        template = WIREFRAME_TEMPLATES.hero_image_left || WIREFRAME_TEMPLATES.hero_centered;
        selectedLayout = template.layout;
      } else if (section.type === 'about') {
        template = WIREFRAME_TEMPLATES.about_image_right || WIREFRAME_TEMPLATES.about_centered;
        selectedLayout = template.layout;
      } else if (section.type === 'features') {
        template = WIREFRAME_TEMPLATES.features_grid || WIREFRAME_TEMPLATES.features_two_column;
        selectedLayout = template.layout;
      } else {
        // For content sections, use text_block instead
        template = WIREFRAME_TEMPLATES.text_block;
        selectedLayout = template.layout;
      }
    }
    
    console.log(`📋 Section ${index + 1} (${section.type}): Selected template "${template.name}" with layout "${selectedLayout}"`);

    return {
      id: `section-${index}`,
      type: section.type,
      templateName: template.name,
      templateKey: Object.keys(WIREFRAME_TEMPLATES).find(key => WIREFRAME_TEMPLATES[key] === template) || 'custom',
      elements: section.elements,
      fullContent: section.elements.map(e => e.content).join('\n'),
      wireframeLayout: {
        layout: selectedLayout,
        imagePos: template.imagePos,
        hasImage: template.hasImage,
        ...template.structure
      },
      template: template,
      index: index,
      hasSemanticStructure: !!htmlStructure,
      contentAnalysis
    };
  });

  return {
    sections: wireframeSections,
    totalSections: wireframeSections.length,
    hasSemanticStructure: !!htmlStructure
  };
};

export const createSectionsFromSemanticStructure = (elements) => {
  console.log('🔥 STARTING SECTION CREATION with', elements.length, 'elements');
  
  if (elements.length === 0) {
    console.log('❌ No elements to process, returning empty');
    return [];
  }
  
  const sections = [];
  let currentSection = null;
  let currentSectionType = null;
  
  elements.forEach((element, idx) => {
    // Skip list containers (they're just metadata)
    if (element.type === 'list_container') {
      console.log(`⏭️  Skipping list container at ${idx}`);
      return;
    }
    
    // Determine what section this element belongs to
    const sectionType = determineSectionFromSemanticElement(element, idx, elements.length);
    
    console.log(`🏷️  Element ${idx}: ${element.tag} "${element.content.substring(0, 40)}..." → ${sectionType}`);
    
    // IMPROVED: More intelligent section breaking
    const shouldBreak = shouldStartNewSection(element, currentSection, idx) || 
                       shouldForceNewSectionBasedOnContent(element, currentSection, idx) ||
                       (sectionType !== currentSectionType && currentSection && currentSection.elements.length >= 2);
    
    // Check if we should start a new section
    if (shouldBreak) {
      // Save current section if it has content
      if (currentSection && currentSection.elements.length > 0) {
        console.log(`💾 Saving ${currentSectionType} section with ${currentSection.elements.length} elements`);
        sections.push(currentSection);
      }
      
      // Start new section
      currentSection = {
        type: sectionType,
        elements: [],
        startIndex: idx
      };
      currentSectionType = sectionType;
      
      console.log(`🆕 Started new ${sectionType} section at element ${idx}`);
    }
    
    // Add element to current section
    if (currentSection) {
      currentSection.elements.push(element);
      console.log(`   ➕ Added ${element.tag} to ${currentSectionType}`);
    }
  });
  
  // Don't forget the last section
  if (currentSection && currentSection.elements.length > 0) {
    console.log(`💾 Saving final ${currentSectionType} section with ${currentSection.elements.length} elements`);
    sections.push(currentSection);
  }
  
  // IMPROVED: Merge tiny sections with similar types
  const mergedSections = mergeTinySections(sections);
  
  console.log(`🎯 Final sections: ${sections.length} → ${mergedSections.length} after merging`);
  mergedSections.forEach((section, idx) => {
    console.log(`   ${idx + 1}. ${section.type} (${section.elements.length} elements)`);
  });
  
  return mergedSections;
};

export const analyzeContentForTemplate = (section) => {
  const elements = section.elements || [];
  const allContent = elements.map(e => e.content).join(' ').toLowerCase();
  const listItemCount = elements.filter(e => e.type === 'list_item').length;
  
  console.log(`🔍 Analyzing section for template selection:`);
  console.log(`   - ${elements.length} total elements`);
  console.log(`   - ${listItemCount} list items`);
  console.log(`   - Has bullets: ${section.hasBullets || false}`);
  console.log(`   - Bullet count: ${section.bulletCount || 0}`);
  
  return {
    hasLists: elements.some(e => e.type === 'list_container' || e.type === 'list_item') || section.hasBullets,
    hasImages: true, // FORCE images for hero/about sections
    isLong: allContent.length > 500,
    hasNumbers: /\d+/.test(allContent),
    hasQuotes: allContent.includes('"') || allContent.includes("'"),
    elementCount: elements.length,
    hasHeadings: elements.some(e => e.type === 'heading'),
    hasParagraphs: elements.some(e => e.type === 'paragraph'),
    headingLevels: elements.filter(e => e.type === 'heading').map(e => e.level),
    listItemCount: listItemCount,
    // Enhanced bullet detection
    hasBullets: section.hasBullets || listItemCount > 0,
    bulletCount: section.bulletCount || listItemCount,
    // Force specific layouts for bullet-heavy content
    shouldUseBulletList: listItemCount >= 3,
    shouldUseIconGrid: listItemCount >= 2 && listItemCount <= 6 && section.type === 'features',
    // Force image templates for certain section types
    forceImageTemplate: section.type === 'hero' || section.type === 'about' || section.type === 'features'
  };
};