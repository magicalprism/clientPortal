// lib/supabase/queries/table/checklist.js

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

/**
 * Get a single checklist by ID with all related data
 */
export const fetchChecklistById = async (id) => {
  const { data, error } = await supabase
    .from('checklist')
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title, status),
      event:event_id(id, title, start_time),
      author:author_id(id, title, email),
      parent:parent_id(id, title),
      tasks:task(
        id,
        title,
        status,
        due_date,
        assigned_id,
        order_index,
        created_at,
        updated_at,
        assigned_contact:contact!assigned_id(id, title, email)
      ),
      tags:category_resource(
        category:category_id(id, title)
      ),
      child_checklists:checklist!parent_id(id, title, status),
      contracts:checklist_contract(
        contract:contract_id(id, title)
      )
    `)
    .eq('id', id)
    .single();

  // Sort tasks by order_index
  if (data && data.tasks) {
    data.tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }

  // Transform tags and contracts data
  if (data && data.tags) {
    data.tags = data.tags.map(t => t.category);
  }
  
  if (data && data.contracts) {
    data.contracts = data.contracts.map(c => c.contract);
  }

  return { data, error };
};

/**
 * Get all checklists with optional filters
 */
export const fetchAllChecklists = async (filters = {}) => {
  let query = supabase
    .from('checklist')
    .select(`
      id,
      title,
      status,
      company_id,
      project_id,
      event_id,
      parent_id,
      order_index,
      created_at,
      updated_at,
      company:company_id(id, title),
      project:project_id(id, title),
      event:event_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title),
      task_count:task(count)
    `)
    .eq('is_deleted', false);

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }
  
  if (filters.project_id) {
    query = query.eq('project_id', filters.project_id);
  }
  
  if (filters.event_id) {
    query = query.eq('event_id', filters.event_id);
  }
  
  if (filters.parent_id) {
    query = query.eq('parent_id', filters.parent_id);
  }
  
  if (filters.author_id) {
    query = query.eq('author_id', filters.author_id);
  }

  // Apply sorting
  if (filters.sort) {
    const [field, direction] = filters.sort.split(':');
    query = query.order(field, { ascending: direction === 'asc' });
  } else {
    query = query.order('order_index', { ascending: true, nullsLast: true });
  }

  const { data, error } = await query;
  return { data, error };
};

/**
 * Create a new checklist
 */
export const createChecklist = async (checklistData) => {
  const { data, error } = await supabase
    .from('checklist')
    .insert([{
      ...checklistData,
      status: checklistData.status || 'todo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      event:event_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Update checklist
 */
export const updateChecklist = async (id, updates) => {
  const { data, error } = await supabase
    .from('checklist')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      company:company_id(id, title),
      project:project_id(id, title),
      event:event_id(id, title),
      author:author_id(id, title),
      parent:parent_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Delete checklist (soft delete)
 */
export const deleteChecklist = async (id, softDelete = true) => {
  if (softDelete) {
    const { error } = await supabase
      .from('checklist')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    return { success: !error, error };
  } else {
    const { error } = await supabase
      .from('checklist')
      .delete()
      .eq('id', id);
    return { success: !error, error };
  }
};

// ===== EVENT CHECKLIST FUNCTIONS (Direct FK) =====

/**
 * Get checklists by event ID
 */
export const fetchEventChecklists = async (eventId) => {
  const { data, error } = await supabase
    .from('checklist')
    .select(`
      id,
      title,
      status,
      type,
      order_index,
      author_id,
      created_at,
      updated_at,
      tasks:task(
        id,
        title,
        status,
        due_date,
        assigned_id,
        order_index,
        assigned_contact:contact!assigned_id(id, title, email)
      )
    `)
    .eq('event_id', eventId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsLast: true });

  // Sort tasks within each checklist
  if (data) {
    data.forEach(checklist => {
      if (checklist.tasks) {
        checklist.tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      }
    });
  }

  return { data, error };
};

/**
 * Create a checklist for an event
 */
export const createEventChecklist = async (eventId, title, authorId) => {
  // Get current max order_index for this event
  const { data: existingChecklists } = await supabase
    .from('checklist')
    .select('order_index')
    .eq('event_id', eventId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingChecklists?.[0]?.order_index || -1) + 1;

  const { data, error } = await supabase
    .from('checklist')
    .insert([{
      title,
      event_id: eventId,
      author_id: authorId,
      status: 'todo',
      order_index: nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      event:event_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Reorder checklists within an event
 */
export const reorderEventChecklists = async (eventId, checklistOrders) => {
  const updates = checklistOrders.map(({ id, order_index }) => 
    supabase
      .from('checklist')
      .update({ 
        order_index,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('event_id', eventId)
  );
  
  const results = await Promise.all(updates);
  const errors = results.filter(result => result.error);
  
  return { 
    success: errors.length === 0,
    errors: errors.map(result => result.error)
  };
};

// ===== PROJECT CHECKLIST FUNCTIONS (Direct FK) =====

/**
 * Get checklists by project ID  
 */
export const fetchProjectChecklists = async (projectId) => {
  const { data, error } = await supabase
    .from('checklist')
    .select(`
      id,
      title,
      status,
      type,
      order_index,
      author_id,
      created_at,
      updated_at,
      tasks:task(
        id,
        title,
        status,
        due_date,
        assigned_id,
        order_index,
        assigned_contact:contact!assigned_id(id, title, email)
      )
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsLast: true });

  // Sort tasks within each checklist
  if (data) {
    data.forEach(checklist => {
      if (checklist.tasks) {
        checklist.tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      }
    });
  }

  return { data, error };
};

/**
 * Create a checklist for a project
 */
export const createProjectChecklist = async (projectId, title, authorId) => {
  // Get current max order_index for this project
  const { data: existingChecklists } = await supabase
    .from('checklist')
    .select('order_index')
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingChecklists?.[0]?.order_index || -1) + 1;

  const { data, error } = await supabase
    .from('checklist')
    .insert([{
      title,
      project_id: projectId,
      author_id: authorId,
      status: 'todo',
      order_index: nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      project:project_id(id, title)
    `)
    .single();

  return { data, error };
};

/**
 * Reorder checklists within a project
 */
export const reorderProjectChecklists = async (projectId, checklistOrders) => {
  const updates = checklistOrders.map(({ id, order_index }) => 
    supabase
      .from('checklist')
      .update({ 
        order_index,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('project_id', projectId)
  );
  
  const results = await Promise.all(updates);
  const errors = results.filter(result => result.error);
  
  return { 
    success: errors.length === 0,
    errors: errors.map(result => result.error)
  };
};

// ===== CONTRACT CHECKLIST FUNCTIONS (Junction Table) =====

/**
 * Get checklists for a contract (via junction table)
 */
export const fetchContractChecklists = async (contractId) => {
  const { data, error } = await supabase
    .from('checklist_contract')
    .select(`
      checklist:checklist_id(
        id,
        title,
        status,
        type,
        order_index,
        author_id,
        created_at,
        updated_at,
        tasks:task(
          id,
          title,
          status,
          due_date,
          assigned_id,
          order_index,
          assigned_contact:contact!assigned_id(id, title, email)
        )
      )
    `)
    .eq('contract_id', contractId)
    .order('created_at', { ascending: true });

  // Extract checklists and sort tasks
  const checklists = data?.map(item => item.checklist).filter(Boolean) || [];
  
  checklists.forEach(checklist => {
    if (checklist.tasks) {
      checklist.tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }
  });

  return { data: checklists, error };
};

/**
 * Create a checklist for a contract
 */
export const createContractChecklist = async (contractId, title, authorId) => {
  // First create the checklist
  const { data: checklist, error: createError } = await supabase
    .from('checklist')
    .insert([{
      title,
      author_id: authorId,
      status: 'todo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select('*')
    .single();

  if (createError) {
    return { data: null, error: createError };
  }

  // Then link it to the contract
  const { error: linkError } = await supabase
    .from('checklist_contract')
    .insert([{
      checklist_id: checklist.id,
      contract_id: contractId,
      created_at: new Date().toISOString()
    }]);

  if (linkError) {
    // Cleanup: delete the checklist if linking failed
    await supabase.from('checklist').delete().eq('id', checklist.id);
    return { data: null, error: linkError };
  }

  return { data: checklist, error: null };
};

/**
 * Link a checklist to a contract
 */
export const linkChecklistToContract = async (checklistId, contractId) => {
  const { data, error } = await supabase
    .from('checklist_contract')
    .insert([{
      checklist_id: checklistId,
      contract_id: contractId,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  return { data, error };
};

/**
 * Unlink a checklist from a contract
 */
export const unlinkChecklistFromContract = async (checklistId, contractId) => {
  const { error } = await supabase
    .from('checklist_contract')
    .delete()
    .eq('checklist_id', checklistId)
    .eq('contract_id', contractId);

  return { success: !error, error };
};

/**
 * Reorder checklists for a contract
 */
export const reorderContractChecklists = async (contractId, checklistOrders) => {
  // Since this is a junction table, we'll update the checklist_contract records
  const updates = checklistOrders.map(({ id, order_index }) => 
    supabase
      .from('checklist_contract')
      .update({ 
        order_index,
        updated_at: new Date().toISOString()
      })
      .eq('checklist_id', id)
      .eq('contract_id', contractId)
  );
  
  const results = await Promise.all(updates);
  const errors = results.filter(result => result.error);
  
  return { 
    success: errors.length === 0,
    errors: errors.map(result => result.error)
  };
};

// ===== LEGACY/COMPATIBILITY FUNCTIONS =====

/**
 * Get checklists by company (kept for backward compatibility)
 */
export const fetchChecklistsByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('checklist')
    .select(`
      id,
      title,
      status,
      project:project_id(id, title),
      task_count:task(count),
      created_at
    `)
    .eq('company_id', companyId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  return { data, error };
};

/**
 * Get checklists by project (legacy - use fetchProjectChecklists instead)
 */
export const fetchChecklistsByProject = async (projectId) => {
  return await fetchProjectChecklists(projectId);
};

/**
 * Get checklists by event (legacy - use fetchEventChecklists instead)
 */
export const fetchChecklistsByEventId = async (eventId) => {
  return await fetchEventChecklists(eventId);
};

/**
 * Get checklists by project (legacy - use fetchProjectChecklists instead)
 */
export const fetchChecklistsByProjectId = async (projectId) => {
  return await fetchProjectChecklists(projectId);
};

/**
 * Get checklists by contract (legacy - use fetchContractChecklists instead)
 */
export const fetchChecklistsByContractId = async (contractId) => {
  return await fetchContractChecklists(contractId);
};

// ===== HIERARCHICAL FUNCTIONS =====

/**
 * Get child checklists (hierarchical)
 */
export const fetchChildChecklists = async (parentId) => {
  const { data, error } = await supabase
    .from('checklist')
    .select(`
      id,
      title,
      status,
      created_at,
      task_count:task(count)
    `)
    .eq('parent_id', parentId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true, nullsLast: true });

  return { data, error };
};

/**
 * Get checklist hierarchy (for parent-child relationships)
 */
export const fetchChecklistHierarchy = async (rootChecklistId) => {
  const buildHierarchy = async (parentId, level = 0) => {
    const { data: children, error } = await supabase
      .from('checklist')
      .select(`
        id,
        title,
        status,
        task_count:task(count)
      `)
      .eq('parent_id', parentId)
      .eq('is_deleted', false)
      .order('order_index', { ascending: true, nullsLast: true });

    if (error || !children) return [];

    const hierarchy = [];
    for (const child of children) {
      const subChildren = await buildHierarchy(child.id, level + 1);
      hierarchy.push({
        ...child,
        level,
        children: subChildren
      });
    }

    return hierarchy;
  };

  const hierarchy = await buildHierarchy(rootChecklistId);
  return { data: hierarchy, error: null };
};

// ===== UTILITY FUNCTIONS =====

/**
 * Link tags to checklist
 */
export const linkTagsToChecklist = async (checklistId, categoryIds) => {
  if (!Array.isArray(categoryIds)) {
    categoryIds = [categoryIds];
  }

  // Remove existing links first
  await supabase
    .from('category_resource')
    .delete()
    .eq('checklist_id', checklistId);

  // Add new links
  const insertData = categoryIds.map(categoryId => ({
    checklist_id: checklistId,
    category_id: categoryId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('category_resource')
    .insert(insertData)
    .select(`
      category:category_id(id, title)
    `);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

/**
 * Get checklist tags
 */
export const fetchChecklistTags = async (checklistId) => {
  const { data, error } = await supabase
    .from('category_resource')
    .select(`
      category:category_id(id, title)
    `)
    .eq('checklist_id', checklistId);

  return { 
    data: data?.map(item => item.category) || [], 
    error 
  };
};

/**
 * Create a task for a checklist
 */
export const createChecklistTask = async (checklistId, taskData) => {
  // Get current max order_index for this checklist
  const { data: existingTasks } = await supabase
    .from('task')
    .select('order_index')
    .eq('checklist_id', checklistId)
    .order('order_index', { ascending: false })
    .limit(1);
    
  const nextOrderIndex = (existingTasks?.[0]?.order_index || -1) + 1;

  const { data, error } = await supabase
    .from('task')
    .insert([{
      ...taskData,
      checklist_id: checklistId,
      status: taskData.status || 'todo',
      order_index: nextOrderIndex,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      assigned_contact:contact!assigned_id(id, title, email)
    `)
    .single();

  return { data, error };
};

/**
 * Get checklist statistics
 */
export const getChecklistStats = async (checklistId) => {
  const { data, error } = await supabase
    .from('task')
    .select('id, status, due_date')
    .eq('checklist_id', checklistId);

  if (error) {
    return { data: null, error };
  }

  const stats = {
    totalTasks: data.length,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    overdueTasks: 0
  };

  const today = new Date().toISOString().split('T')[0];

  data.forEach(task => {
    switch (task.status) {
      case 'complete':
        stats.completedTasks++;
        break;
      case 'in_progress':
        stats.inProgressTasks++;
        break;
      case 'todo':
        stats.todoTasks++;
        break;
    }
    
    // Check for overdue
    if (task.due_date && task.due_date < today && task.status !== 'complete') {
      stats.overdueTasks++;
    }
  });

  stats.completionRate = stats.totalTasks > 0 ? 
    Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return { data: stats, error: null };
};

/**
 * Archive completed checklist
 */
export const archiveChecklist = async (checklistId) => {
  const { data, error } = await supabase
    .from('checklist')
    .update({ 
      status: 'archived',
      updated_at: new Date().toISOString()
    })
    .eq('id', checklistId)
    .select('*')
    .single();

  return { data, error };
};

/**
 * Duplicate a checklist
 */
export const duplicateChecklist = async (checklistId, options = {}) => {
  const { includeTasks = false, newTitle, targetProjectId, targetEventId, targetCompanyId } = options;

  // Get the original checklist
  const { data: originalChecklist, error: fetchError } = await fetchChecklistById(checklistId);
  
  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Prepare new checklist data
  const { id, created_at, updated_at, tasks, tags, contracts, ...checklistData } = originalChecklist;
  
  const newChecklistData = {
    ...checklistData,
    title: newTitle || `${originalChecklist.title} (Copy)`,
    status: 'todo',
    project_id: targetProjectId || originalChecklist.project_id,
    event_id: targetEventId || originalChecklist.event_id,
    company_id: targetCompanyId || originalChecklist.company_id
  };

  // Create new checklist
  const { data: newChecklist, error: createError } = await createChecklist(newChecklistData);
  
  if (createError) {
    return { data: null, error: createError };
  }

  // Copy tags if they exist
  if (tags && tags.length > 0) {
    await linkTagsToChecklist(newChecklist.id, tags.map(t => t.id));
  }

  // Copy contract relationships if they exist
  if (contracts && contracts.length > 0) {
    const linkPromises = contracts.map(contract => 
      linkChecklistToContract(newChecklist.id, contract.id)
    );
    await Promise.all(linkPromises);
  }

  // Duplicate tasks if requested
  if (includeTasks && tasks && tasks.length > 0) {
    const taskCreationPromises = tasks.map(task => 
      createChecklistTask(newChecklist.id, {
        title: task.title,
        status: 'todo', // Reset status for duplicated tasks
        due_date: task.due_date,
        assigned_id: task.assigned_id
      })
    );

    await Promise.all(taskCreationPromises);
  }

  return { data: newChecklist, error: null };
};