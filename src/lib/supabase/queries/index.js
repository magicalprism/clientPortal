// lib/supabase/queries/index.js

// Table queries
export * as company from './table/company';
export * as contact from './table/contact';
export * as contract from './table/contract';
export * as event from './table/event'; // ✅ ADD THIS LINE
export * as media from './table/media';
export * as milestone from './table/milestone';
export * as project from './table/project';
export * as task from './table/task';

// Pivot queries  
export * as milestoneProject from './pivot/milestone_project';

// Organized imports for re-export
import * as companyQueries from './table/company';
import * as contactQueries from './table/contact';
import * as contractQueries from './table/contract';
import * as eventQueries from './table/event'; // ✅ ADD THIS LINE
import * as mediaQueries from './table/media';
import * as milestoneQueries from './table/milestone';
import * as taskQueries from './table/task';
import * as projectQueries from './table/project';
import * as milestoneProjectQueries from './pivot/milestone_project';

// Organized exports for easier importing
export const table = {
  company: companyQueries,
  contact: contactQueries,
  contract: contractQueries,
  event: eventQueries, // ✅ ADD THIS LINE
  media: mediaQueries,
  milestone: milestoneQueries,
  task: taskQueries,
  project: projectQueries,
};

export const pivot = {
  milestoneProject: milestoneProjectQueries,
};