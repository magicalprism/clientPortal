import { createClient } from '@/lib/supabase/browser';
import { getPostgresTimestamp } from '@/lib/utils/getPostgresTimestamp';
import { setBrandAsPrimary } from '@/lib/supabase/queries/table/brand';

const supabase = createClient();

/**
 * Clean payload by removing virtual/computed fields that don't exist in database
 */
const cleanPayloadForDatabase = (payload, config) => {
  const cleaned = { ...payload };
  
  // Remove system fields that shouldn't be updated directly
  delete cleaned.id;
  delete cleaned.created_at;
  
  // Remove all _details fields (hydrated relationship data)
  Object.keys(cleaned).forEach(key => {
    if (key.endsWith('_details')) {
      delete cleaned[key];
    }
  });
  
  // Remove fields based on config field types that shouldn't be saved to main table
  if (config?.fields) {
    config.fields.forEach(field => {
      // Remove multi-relationship fields (stored in junction tables)
      if (field.type === 'multiRelationship') {
        console.log(`[recordOps] Removing multiRelationship field: ${field.name}`);
        delete cleaned[field.name];
      }
      
      // Remove fields marked as non-database
      if (field.database === false) {
        console.log(`[recordOps] Removing non-database field: ${field.name}`);
        delete cleaned[field.name];
      }
    });
    
    // Get list of valid field names for main table
    const validFieldNames = config.fields
      .filter(f => f.database !== false && f.type !== 'multiRelationship')
      .map(f => f.name);
    
    // Add standard system fields that are always valid
    validFieldNames.push('created_at', 'updated_at', 'author_id', 'status', 'parent_id', 'is_deleted', 'deleted_at');
    
    // Remove any fields not in the valid list
    Object.keys(cleaned).forEach(key => {
      if (!validFieldNames.includes(key)) {
        console.log(`[recordOps] Removing invalid field for database: ${key}`);
        delete cleaned[key];
      }
    });
  }
  
  // Ensure proper data types based on config
  if (config?.fields) {
    config.fields.forEach(field => {
      if (cleaned[field.name] !== undefined && cleaned[field.name] !== '') {
        if (field.name.endsWith('_id') || field.type === 'integer') {
          const parsed = parseInt(cleaned[field.name], 10);
          if (!isNaN(parsed)) {
            cleaned[field.name] = parsed;
          }
        } else if (field.type === 'boolean') {
          cleaned[field.name] = Boolean(cleaned[field.name]);
        }
      }
    });
  }
  
  return cleaned;
};

/**
 * Save multi-relationship data to junction table
 */
const saveMultiRelationship = async (tableName, recordId, fieldName, relatedIds, relationConfig, config) => {
  try {
    const {
      junctionTable,
      sourceKey = `${config.name}_id`,
      targetKey
    } = relationConfig;
    
    console.log(`[recordOps] Saving multiRelationship ${fieldName} for ${tableName} record ${recordId}`);
    
    // Delete existing relationships
    const { error: deleteError } = await supabase
      .from(junctionTable)
      .delete()
      .eq(sourceKey, recordId);
    
    if (deleteError) {
      console.error(`[recordOps] Error deleting existing relationships:`, deleteError);
      throw deleteError;
    }
    
    // Insert new relationships if any
    if (relatedIds && relatedIds.length > 0) {
      const junctionData = relatedIds.map(relatedId => ({
        [sourceKey]: recordId,
        [targetKey]: relatedId
      }));
      
      const { error: insertError } = await supabase
        .from(junctionTable)
        .insert(junctionData);
      
      if (insertError) {
        console.error(`[recordOps] Error inserting new relationships:`, insertError);
        throw insertError;
      }
    }
    
    console.log(`[recordOps] Successfully saved multiRelationship ${fieldName}`);
    
    // Special handling for project-brand relationship
    // If this is a project's brands field and we have at least one brand, set the first one as primary
    if (tableName === 'project' && fieldName === 'brands' && relatedIds && relatedIds.length > 0) {
      try {
        // Get the project to find its company_id
        const { data: project } = await supabase
          .from('project')
          .select('company_id')
          .eq('id', recordId)
          .single();
        
        if (project?.company_id) {
          // Set the first brand as primary for this company
          const brandId = relatedIds[0];
          console.log(`[recordOps] Setting brand ${brandId} as primary for company ${project.company_id}`);
          
          const result = await setBrandAsPrimary(brandId, project.company_id);
          if (result.error) {
            console.warn(`[recordOps] Error setting primary brand: ${result.error.message}`);
          } else {
            console.log(`[recordOps] Successfully set brand ${brandId} as primary`);
          }
        }
      } catch (err) {
        console.warn(`[recordOps] Error in primary brand handling: ${err.message}`);
        // Don't fail the whole operation if this part fails
      }
    }
    
    return { success: true };
    
  } catch (err) {
    console.error(`[recordOps] Error saving multiRelationship ${fieldName}:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Update a record in any table using standardized operations
 */
export const updateRecord = async (tableName, recordId, recordData, config) => {
  try {
    console.log(`[recordOps.updateRecord] Updating ${tableName} record ${recordId}`);
    
    // Extract multi-relationship fields before cleaning
    const multiRelationshipData = {};
    if (config?.fields) {
      config.fields.forEach(field => {
        if (field.type === 'multiRelationship' && recordData[field.name] !== undefined) {
          multiRelationshipData[field.name] = {
            ids: recordData[field.name],
            relation: field.relation
          };
        }
      });
    }
    
    // Clean the payload for main table
    const cleanPayload = cleanPayloadForDatabase({
      ...recordData,
      updated_at: getPostgresTimestamp()
    }, config);

    console.log(`[recordOps.updateRecord] Clean payload fields:`, Object.keys(cleanPayload));

    // Update main record
    const { data, error } = await supabase
      .from(tableName)
      .update(cleanPayload)
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      console.error(`[recordOps.updateRecord] Error updating ${tableName}:`, error);
      return { success: false, error: error.message, data: null };
    }

    // Handle multi-relationship fields
    const relationshipErrors = [];
    for (const [fieldName, { ids, relation }] of Object.entries(multiRelationshipData)) {
      const result = await saveMultiRelationship(tableName, recordId, fieldName, ids, relation, config);
      if (!result.success) {
        relationshipErrors.push(`${fieldName}: ${result.error}`);
      }
    }

    if (relationshipErrors.length > 0) {
      console.warn(`[recordOps.updateRecord] Some relationships failed to save:`, relationshipErrors);
      // Note: Main record was saved successfully, but some relationships failed
    }

    console.log(`[recordOps.updateRecord] Successfully updated ${tableName} record`);
    return { success: true, error: null, data };

  } catch (err) {
    console.error(`[recordOps.updateRecord] Unexpected error:`, err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Create a record in any table using standardized operations
 */
export const createRecord = async (tableName, recordData, config) => {
  try {
    console.log(`[recordOps.createRecord] Creating ${tableName} record`);
    
    const now = getPostgresTimestamp();
    
    // Extract multi-relationship fields before cleaning
    const multiRelationshipData = {};
    if (config?.fields) {
      config.fields.forEach(field => {
        if (field.type === 'multiRelationship' && recordData[field.name] !== undefined) {
          multiRelationshipData[field.name] = {
            ids: recordData[field.name],
            relation: field.relation
          };
        }
      });
    }
    
    // Clean the payload for main table
    const cleanPayload = cleanPayloadForDatabase({
      ...recordData,
      created_at: now,
      updated_at: now
    }, config);

    console.log(`[recordOps.createRecord] Clean payload fields:`, Object.keys(cleanPayload));

    // Create main record
    const { data, error } = await supabase
      .from(tableName)
      .insert([cleanPayload])
      .select()
      .single();

    if (error) {
      console.error(`[recordOps.createRecord] Error creating ${tableName}:`, error);
      return { success: false, error: error.message, data: null };
    }

    // Handle multi-relationship fields
    const relationshipErrors = [];
    for (const [fieldName, { ids, relation }] of Object.entries(multiRelationshipData)) {
      const result = await saveMultiRelationship(tableName, data.id, fieldName, ids, relation, config);
      if (!result.success) {
        relationshipErrors.push(`${fieldName}: ${result.error}`);
      }
    }

    if (relationshipErrors.length > 0) {
      console.warn(`[recordOps.createRecord] Some relationships failed to save:`, relationshipErrors);
      // Note: Main record was created successfully, but some relationships failed
    }

    console.log(`[recordOps.createRecord] Successfully created ${tableName} record`);
    return { success: true, error: null, data };

  } catch (err) {
    console.error(`[recordOps.createRecord] Unexpected error:`, err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Delete a record (soft delete if is_deleted field exists)
 */
export const deleteRecord = async (tableName, recordId, config) => {
  try {
    console.log(`[recordOps.deleteRecord] Deleting ${tableName} record ${recordId}`);
    
    // Check if table supports soft delete
    const hasIsDeleted = config?.fields?.some(f => f.name === 'is_deleted');
    
    if (hasIsDeleted) {
      // Soft delete
      const { data, error } = await supabase
        .from(tableName)
        .update({
          is_deleted: true,
          deleted_at: getPostgresTimestamp(),
          updated_at: getPostgresTimestamp()
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        console.error(`[recordOps.deleteRecord] Error soft deleting ${tableName}:`, error);
        return { success: false, error: error.message, data: null };
      }

      console.log(`[recordOps.deleteRecord] Successfully soft deleted ${tableName} record`);
      return { success: true, error: null, data };
    } else {
      // Hard delete - also clean up multi-relationships
      if (config?.fields) {
        const multiRelFields = config.fields.filter(f => f.type === 'multiRelationship');
        for (const field of multiRelFields) {
          const sourceKey = field.relation.sourceKey || `${config.name}_id`;
          await supabase
            .from(field.relation.junctionTable)
            .delete()
            .eq(sourceKey, recordId);
        }
      }
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error(`[recordOps.deleteRecord] Error hard deleting ${tableName}:`, error);
        return { success: false, error: error.message, data: null };
      }

      console.log(`[recordOps.deleteRecord] Successfully hard deleted ${tableName} record`);
      return { success: true, error: null, data: { id: recordId } };
    }

  } catch (err) {
    console.error(`[recordOps.deleteRecord] Unexpected error:`, err);
    return { success: false, error: err.message, data: null };
  }
};