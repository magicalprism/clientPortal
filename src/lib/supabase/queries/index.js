// lib/supabase/queries/index.js

// Table queries
export * as company from './table/company';
export * as contract from './table/contract';
export * as media from './table/media';
export * as milestone from './table/milestone';
export * as task from './table/task';

// Pivot queries  
export * as milestoneProject from './pivot/milestone_project';

// Organized imports for re-export
import * as milestoneQueries from './table/milestone';
import * as taskQueries from './table/task';
import * as milestoneProjectQueries from './pivot/milestone_project';
import * as company from './table/company';
import * as media from './table/media';
import * as contract from './table/contract';

// Organized exports for easier importing
export const table = {
  milestone: milestoneQueries,
  task: taskQueries,
  company,
  media,
  contract,
};

export const pivot = {
  milestoneProject: milestoneProjectQueries,
};