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
        delete cleaned[field.name];
      }
      
      // Remove fields marked as non-database
      if (field.database === false) {
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
        delete cleaned[key];
      }
    });
  }
  
  // Ensure proper data types based on config
  if (config?.fields) {
    config.fields.forEach(field => {
      if (cleaned[field.name] !== undefined && cleaned[field.name] !== '') {
        // Extract value from select/status fields
        if (field.type === 'select' || field.type === 'status') {
          if (typeof cleaned[field.name] === 'object' && cleaned[field.name] !== null && 'value' in cleaned[field.name]) {
            cleaned[field.name] = cleaned[field.name].value;
          }
        }
        // Handle numeric fields
        else if (field.name.endsWith('_id') || field.type === 'integer') {
          const parsed = parseInt(cleaned[field.name], 10);
          if (!isNaN(parsed)) {
            cleaned[field.name] = parsed;
          }
        } 
        // Handle boolean fields
        else if (field.type === 'boolean') {
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
      pivotTable,
      sourceKey = `${config.name}_id`,
      targetKey
    } = relationConfig;
    
    // Use either junctionTable or pivotTable (junctionTable is the newer naming convention)
    const joinTable = junctionTable || pivotTable;
    
    if (!joinTable) {
      // If no junction table is specified, but there's a targetKey, assume it's a direct relationship
      if (targetKey) {
        try {
          // Get related table from relation config
          const relatedTable = relationConfig.table;
          
          if (!relatedTable) {
            return { success: false, error: 'No related table specified' };
          }
          
          // Clear existing relationships
          const { error: clearError } = await supabase
            .from(relatedTable)
            .update({ [targetKey]: null })
            .eq(targetKey, recordId);
            
          if (clearError) {
            return { success: false, error: clearError.message };
          }
          
          // Set new relationships
          if (relatedIds && relatedIds.length > 0) {
            const { error: updateError } = await supabase
              .from(relatedTable)
              .update({ [targetKey]: recordId })
              .in('id', relatedIds.map(id => parseInt(id, 10)));
              
            if (updateError) {
              return { success: false, error: updateError.message };
            }
          }
          
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      
      // If we get here, we couldn't handle the relationship
      return { success: true, warning: 'No junction table specified, relationship may not be saved correctly' };
    }
    
    // Delete existing relationships
    const { error: deleteError } = await supabase
      .from(joinTable)
      .delete()
      .eq(sourceKey, recordId);
    
    if (deleteError) {
      throw deleteError;
    }
    
    // Insert new relationships if any
    if (relatedIds && relatedIds.length > 0) {
      const junctionData = relatedIds.map(relatedId => ({
        [sourceKey]: recordId,
        [targetKey]: relatedId
      }));
      
      const { error: insertError } = await supabase
        .from(joinTable)
        .insert(junctionData);
      
      if (insertError) {
        throw insertError;
      }
    }
    
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
          await setBrandAsPrimary(brandId, project.company_id);
          // Don't fail the whole operation if this part fails
        }
      } catch (err) {
        // Don't fail the whole operation if this part fails
      }
    }
    
    return { success: true };
    
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Update a record in any table using standardized operations
 */
export const updateRecord = async (tableName, recordId, recordData, config) => {
  try {
    
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

    // Update main record
    const { data, error } = await supabase
      .from(tableName)
      .update(cleanPayload)
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
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

    // Note: We still return success even if some relationships failed

    return { success: true, error: null, data };

  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Create a record in any table using standardized operations
 */
export const createRecord = async (tableName, recordData, config) => {
  try {
    
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

    // Create main record
    const { data, error } = await supabase
      .from(tableName)
      .insert([cleanPayload])
      .select()
      .single();

    if (error) {
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

    // Note: We still return success even if some relationships failed

    return { success: true, error: null, data };

  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Delete a record (soft delete if is_deleted field exists)
 */
export const deleteRecord = async (tableName, recordId, config) => {
  try {
    
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
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data };
    } else {
      // Hard delete - also clean up multi-relationships
      if (config?.fields) {
        const multiRelFields = config.fields.filter(f => f.type === 'multiRelationship');
        for (const field of multiRelFields) {
          const sourceKey = field.relation.sourceKey || `${config.name}_id`;
          const joinTable = field.relation.junctionTable || field.relation.pivotTable;
          
          if (joinTable) {
            await supabase
              .from(joinTable)
              .delete()
              .eq(sourceKey, recordId);
          }
        }
      }
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) {
        return { success: false, error: error.message, data: null };
      }

      return { success: true, error: null, data: { id: recordId } };
    }

  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
};