export const hydrateRecord = async (record, config, supabase) => {
  if (!record || !config?.fields) return record;

  const hydrated = { ...record };
  
  // Early return if no fields to process
  if (!config.fields.length) return hydrated;

  // Group fields by type for batch processing
  const fieldGroups = {
    tags: [],
    select: [],
    media: [],
    relationship: [],
    multiRelationship: []
  };

  // Categorize fields in a single pass
  for (const field of config.fields) {
    const { name, type } = field;
    
    if (name === 'tags' && typeof record[name] === 'string') {
      fieldGroups.tags.push(field);
    } else if ((type === 'select' || type === 'status') && record[name]) {
      fieldGroups.select.push(field);
    } else if (type === 'media' && field.relation?.table && record[name]) {
      fieldGroups.media.push(field);
    } else if (type === 'relationship' && field.relation?.table && record[name]) {
      fieldGroups.relationship.push(field);
    } else if (type === 'multiRelationship' && field.relation?.junctionTable) {
      fieldGroups.multiRelationship.push(field);
    }
  }

  // Process all field types in parallel
  const [
    tagsResults,
    selectResults,
    mediaResults,
    relationshipResults,
    multiRelationshipResults
  ] = await Promise.all([
    processTags(fieldGroups.tags, record),
    processSelect(fieldGroups.select, record),
    processMedia(fieldGroups.media, record, supabase),
    processRelationships(fieldGroups.relationship, record, supabase),
    processMultiRelationships(fieldGroups.multiRelationship, record, config, supabase)
  ]);

  // Merge all results
  Object.assign(hydrated, tagsResults, selectResults, mediaResults, relationshipResults, multiRelationshipResults);

  return hydrated;
};

// Process tags fields (synchronous)
const processTags = (tagFields, record) => {
  const results = {};
  
  for (const field of tagFields) {
    const { name } = field;
    try {
      results[name] = JSON.parse(record[name]);
    } catch {
      results[name] = record[name]
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
    }
  }
  
  return results;
};

// Process select/status fields (synchronous)
const processSelect = (selectFields, record) => {
  const results = {};
  
  for (const field of selectFields) {
    const { name } = field;
    const value = record[name];
    const label = field.options?.find(opt => opt.value === value)?.label || value;
    results[name] = { value, label };
  }
  
  return results;
};

// Process media fields with batching
const processMedia = async (mediaFields, record, supabase) => {
  if (!mediaFields.length) return {};
  
  // Get unique media IDs to fetch
  const mediaIds = [...new Set(
    mediaFields
      .map(field => record[field.name])
      .filter(Boolean)
  )];
  
  if (!mediaIds.length) return {};
  
  // Batch fetch all media records
  const { data: mediaRecords } = await supabase
    .from('media')
    .select('*')
    .in('id', mediaIds);
  
  // Create lookup map
  const mediaMap = new Map();
  if (mediaRecords) {
    mediaRecords.forEach(media => mediaMap.set(media.id, media));
  }
  
  // Apply results to fields
  const results = {};
  for (const field of mediaFields) {
    const mediaId = record[field.name];
    const mediaRecord = mediaMap.get(mediaId);
    if (mediaRecord) {
      results[`${field.name}_details`] = mediaRecord;
    }
  }
  
  return results;
};

// Process relationship fields with batching by table
const processRelationships = async (relationshipFields, record, supabase) => {
  if (!relationshipFields.length) return {};
  
  // Group fields by target table
  const tableGroups = new Map();
  
  for (const field of relationshipFields) {
    const { table } = field.relation;
    if (!tableGroups.has(table)) {
      tableGroups.set(table, []);
    }
    tableGroups.get(table).push(field);
  }
  
  // Process each table group in parallel
  const tablePromises = Array.from(tableGroups.entries()).map(async ([table, fields]) => {
    // Get unique IDs for this table
    const ids = [...new Set(
      fields
        .map(field => record[field.name])
        .filter(Boolean)
    )];
    
    if (!ids.length) return {};
    
    // Batch fetch records from this table
    const { data: records } = await supabase
      .from(table)
      .select('*')
      .in('id', ids);
    
    // Create lookup map
    const recordMap = new Map();
    if (records) {
      records.forEach(rec => recordMap.set(rec.id, rec));
    }
    
    // Apply results to fields
    const tableResults = {};
    for (const field of fields) {
      const relatedId = record[field.name];
      const relatedRecord = recordMap.get(relatedId);
      tableResults[`${field.name}_details`] = relatedRecord || null;
    }
    
    return tableResults;
  });
  
  const tableResults = await Promise.all(tablePromises);
  
  // Merge all table results
  return Object.assign({}, ...tableResults);
};

// Process multiRelationship fields with optimized batching
const processMultiRelationships = async (multiRelFields, record, config, supabase) => {
  if (!multiRelFields.length) return {};
  
  // Group by junction table for batching
  const junctionGroups = new Map();
  
  for (const field of multiRelFields) {
    const { junctionTable } = field.relation;
    if (!junctionGroups.has(junctionTable)) {
      junctionGroups.set(junctionTable, []);
    }
    junctionGroups.get(junctionTable).push(field);
  }
  
  // Process each junction table group
  const junctionPromises = Array.from(junctionGroups.entries()).map(async ([junctionTable, fields]) => {
    // Batch fetch junction data for all fields using this table
    const junctionPromises = fields.map(async (field) => {
      const {
        sourceKey = `${config.name}_id`,
        targetKey,
        table,
        labelField = 'title'
      } = field.relation;
      
      // Get junction data
      const { data: junctionData } = await supabase
        .from(junctionTable)
        .select(targetKey)
        .eq(sourceKey, record.id);
      
      const ids = junctionData?.map(row => row[targetKey]) || [];
      
      return {
        field,
        ids,
        table,
        labelField,
        targetKey
      };
    });
    
    const junctionResults = await Promise.all(junctionPromises);
    
    // Group by target table for efficient fetching
    const targetTableGroups = new Map();
    
    for (const { field, ids, table, labelField } of junctionResults) {
      if (ids.length > 0) {
        if (!targetTableGroups.has(table)) {
          targetTableGroups.set(table, { ids: new Set(), fields: [] });
        }
        const group = targetTableGroups.get(table);
        ids.forEach(id => group.ids.add(id));
        group.fields.push({ field, ids, labelField });
      }
    }
    
    // Fetch all records for each target table
    const detailsPromises = Array.from(targetTableGroups.entries()).map(async ([table, { ids, fields }]) => {
      const { data: details } = await supabase
        .from(table)
        .select('*')
        .in('id', Array.from(ids));
      
      // Create lookup map
      const detailsMap = new Map();
      if (details) {
        details.forEach(detail => detailsMap.set(detail.id, detail));
      }
      
      // Apply to fields
      const fieldResults = {};
      for (const { field, ids: fieldIds } of fields) {
        fieldResults[field.name] = fieldIds;
        fieldResults[`${field.name}_details`] = fieldIds
          .map(id => detailsMap.get(id))
          .filter(Boolean);
      }
      
      return fieldResults;
    });
    
    // Handle fields with no IDs
    const emptyResults = {};
    for (const { field, ids } of junctionResults) {
      if (ids.length === 0) {
        emptyResults[field.name] = [];
        emptyResults[`${field.name}_details`] = [];
      }
    }
    
    const detailsResults = await Promise.all(detailsPromises);
    
    return Object.assign(emptyResults, ...detailsResults);
  });
  
  const allJunctionResults = await Promise.all(junctionPromises);
  
  // Merge all junction results
  return Object.assign({}, ...allJunctionResults);
};