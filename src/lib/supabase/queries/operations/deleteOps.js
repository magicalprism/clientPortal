import { createClient } from '@/lib/supabase/browser';

const supabase = createClient();

/**
 * Delete records from a pivot table by foreign key
 */
export const deleteFromPivotTable = async (pivotTable, foreignKey, ids) => {
  return await supabase
    .from(pivotTable)
    .delete()
    .in(foreignKey, ids);
};

/**
 * Delete records from a table by ID
 */
export const deleteFromTable = async (tableName, ids) => {
  return await supabase
    .from(tableName)
    .delete()
    .in('id', ids);
};

/**
 * Delete records with dependencies
 * @param {string} tableName - The name of the main table
 * @param {Array} ids - Array of IDs to delete
 * @param {Array} dependencies - Array of dependency objects { table, foreignKey }
 */
export const deleteWithDependencies = async (tableName, ids = [], dependencies = []) => {
  try {
    // Step 1: Delete from all pivot tables referencing this entity
    for (const dep of dependencies) {
      const { error: pivotError } = await deleteFromPivotTable(dep.table, dep.foreignKey, ids);
      if (pivotError) throw new Error(`Failed to delete from ${dep.table}: ${pivotError.message}`);
    }

    // Step 2: Delete from the main table
    const { error: deleteError } = await deleteFromTable(tableName, ids);
    if (deleteError) throw new Error(`Failed to delete from ${tableName}: ${deleteError.message}`);

    return { success: true };
  } catch (err) {
    console.error('[Cascade Delete Error]', err);
    return { success: false, error: err.message };
  }
};