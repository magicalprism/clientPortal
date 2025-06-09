// src/components/dashboard/search/searchUtils.js

import * as collections from '@/collections';

/**
 * Get all available collections for search
 */
export function getAvailableCollections() {
  return Object.keys(collections).filter(key => 
    collections[key]?.fields && 
    collections[key]?.name
  );
}

/**
 * Get collection display info
 */
export function getCollectionInfo(collectionName) {
  const config = collections[collectionName];
  if (!config) return null;
  
  return {
    name: collectionName,
    label: config.label || collectionName,
    singularLabel: config.singularLabel || config.label || collectionName,
    icon: config.icon,
    color: config.color,
    fields: config.fields || []
  };
}

/**
 * Get searchable fields for a collection
 */
export function getSearchableFields(collectionName) {
  const config = collections[collectionName];
  if (!config?.fields) return [];
  
  return config.fields
    .filter(field => 
      ['text', 'richText'].includes(field.type) || 
      (!field.type && ['title', 'name', 'description', 'email'].includes(field.name))
    )
    .map(field => field.name);
}

/**
 * Get filterable fields for a collection
 */
export function getFilterableFields(collectionName) {
  const config = collections[collectionName];
  if (!config?.fields) return [];
  
  return config.fields.filter(field => 
    field.type === 'select' || 
    field.type === 'status' || 
    field.type === 'relationship'
  );
}

/**
 * Get thumbnail field for a collection
 */
export function getThumbnailField(collectionName) {
  const config = collections[collectionName];
  if (!config?.fields) return null;
  
  // Look for thumbnail_id field
  const thumbnailField = config.fields.find(field => 
    field.name === 'thumbnail_id' && field.type === 'media'
  );
  
  if (thumbnailField) return 'thumbnail_id';
  
  // Look for quickView imageField
  if (config.quickView?.imageField) {
    return config.quickView.imageField;
  }
  
  return null;
}

/**
 * Build thumbnail select query part
 */
export function buildThumbnailSelectQuery(collectionName) {
  const thumbnailField = getThumbnailField(collectionName);
  
  if (!thumbnailField) return null;
  
  return `${thumbnailField}_details:${thumbnailField}(id, url, alt_text)`;
}

/**
 * Get avatar/image source from a record
 */
export function getRecordAvatarSrc(record, collectionName) {
  const config = collections[collectionName];
  
  // Check for thumbnail_details first (from our improved query)
  if (record.thumbnail_details?.url) {
    return record.thumbnail_details.url;
  }
  
  // Check quickView imageField
  const imageField = config?.quickView?.imageField;
  if (imageField) {
    if (record[imageField]) return record[imageField];
    if (record[`${imageField}_details`]?.url) return record[`${imageField}_details`].url;
  }
  
  // Check for company thumbnail in relationship
  if (record.company_id_details?.thumbnail_details?.url) {
    return record.company_id_details.thumbnail_details.url;
  }
  
  // Other fallbacks
  if (record.url && collectionName === 'media') return record.url;
  
  return null;
}

/**
 * Get display title from a record
 */
export function getRecordDisplayTitle(record, collectionName) {
  const config = collections[collectionName];
  const quickView = config?.quickView || {};
  
  return record[quickView.titleField || 'title'] || 
         record.name || 
         record.title ||
         'Untitled';
}

/**
 * Get display subtitle from a record  
 */
export function getRecordDisplaySubtitle(record, collectionName) {
  const config = collections[collectionName];
  const quickView = config?.quickView || {};
  
  return record[quickView.subtitleField] || 
         record.status || 
         '';
}

/**
 * Get display description from a record
 */
export function getRecordDisplayDescription(record, collectionName) {
  const config = collections[collectionName];
  const quickView = config?.quickView || {};
  
  return record[quickView.descriptionField] || 
         record.description || 
         record.content ||
         '';
}

/**
 * Format field value for display
 */
export function formatFieldValueForDisplay(record, fieldName, fieldConfig) {
  // Direct field value
  if (record[fieldName] && typeof record[fieldName] === 'string') {
    return record[fieldName];
  }
  
  // Relationship field details
  if (record[`${fieldName}_details`]) {
    const details = record[`${fieldName}_details`];
    return details[fieldConfig?.relation?.labelField || 'title'] || 
           details.title || 
           details.name;
  }
  
  // Handle arrays (for multiRelationship fields)
  if (Array.isArray(record[fieldName]) && record[fieldName].length > 0) {
    return `${record[fieldName].length} item${record[fieldName].length !== 1 ? 's' : ''}`;
  }
  
  return null;
}

/**
 * Build search query for Supabase with proper joins
 */
export function buildSearchSelectFields(collectionName) {
  const config = collections[collectionName];
  if (!config?.fields) return '*';
  
  const fields = ['*'];
  
  try {
    // Add thumbnail select if available
    const thumbnailQuery = buildThumbnailSelectQuery(collectionName);
    if (thumbnailQuery) {
      fields.push(thumbnailQuery);
    }
    
    // Add relationship field details
    config.fields.forEach(field => {
      try {
        if (field.type === 'relationship' && field.relation?.table) {
          const relationTable = field.relation.table;
          const labelField = field.relation.labelField || 'title';
          
          // Handle company relationships with thumbnails
          if (relationTable === 'company') {
            fields.push(`${field.name}_details:${relationTable}(id, ${labelField}, thumbnail_details:thumbnail_id(id, url, alt_text))`);
          } else {
            fields.push(`${field.name}_details:${relationTable}(id, ${labelField})`);
          }
        }
        
        // Handle other media fields
        if (field.type === 'media' && field.relation?.table === 'media' && field.name !== 'thumbnail_id') {
          fields.push(`${field.name}_details:media(id, url, alt_text, title)`);
        }
      } catch (err) {
        console.warn(`Error processing field ${field.name}:`, err);
      }
    });
  } catch (err) {
    console.warn('Error building select fields:', err);
  }

  return fields.join(', ');
}

/**
 * Get default collections for search
 */
export function getDefaultSearchCollections() {
  const allCollections = getAvailableCollections();
  
  // Prioritize main collections
  const priorityCollections = ['company', 'contact', 'project', 'resource', 'media'];
  const otherCollections = allCollections.filter(c => !priorityCollections.includes(c));
  
  return [...priorityCollections.filter(c => allCollections.includes(c)), ...otherCollections];
}

/**
 * Group collections by category
 */
export function groupCollectionsByCategory() {
  const allCollections = getAvailableCollections();
  
  return {
    core: ['company', 'contact', 'project'].filter(c => allCollections.includes(c)),
    content: ['resource', 'media', 'brand'].filter(c => allCollections.includes(c)),
    business: ['contract', 'product', 'payment'].filter(c => allCollections.includes(c)),
    workflow: ['task', 'element', 'deliverable'].filter(c => allCollections.includes(c))
  };
}