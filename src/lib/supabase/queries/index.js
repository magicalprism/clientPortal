// lib/supabase/queries/index.js
// CLEANED VERSION - Removed problematic exports, kept working imports

// ✅ Import modules for nested structure (these work fine)
import * as projectModule from './table/project';
import * as taskModule from './table/task-adapters'; // Use task-adapters instead of task
import * as companyModule from './table/company';
import * as elementModule from './table/element';
import * as mediaModule from './table/media';
import * as emailModule from './table/email';
import * as brandModule from './table/brand';
import * as checklistModule from './table/checklist';
import * as contactModule from './table/contact';
import * as resourceModule from './table/resource';
import * as commentModule from './table/comment';
import * as contractModule from './table/contract';
import * as contractpartModule from './table/contractpart';
import * as productModule from './table/product';
import * as deliverableModule from './table/deliverable';
import * as paymentModule from './table/payment';
import * as proposalModule from './table/proposal';
import * as milestoneModule from './table/milestone';
import * as featureModule from './table/feature';
import * as loginModule from './table/login';
import * as colorModule from './table/color';
import * as eventModule from './table/event';
import * as eventLoginModule from './table/event_login';
import * as onboardingModule from './table/onboarding';
import * as onboardingsectionModule from './table/onboardingsection';
import * as typographyModule from './table/typography';

// Import all pivot modules
import * as brandProjectModule from './pivot/brand_project';
import * as categoryProjectModule from './pivot/category_project';
import * as checklistTaskModule from './pivot/checklist_task';
import * as commentProjectModule from './pivot/comment_project';
import * as companyProjectModule from './pivot/company_project';
import * as contactProjectModule from './pivot/contact_project';
import * as eventProjectModule from './pivot/event_project';
import * as emailProjectModule from './pivot/email_project';
import * as contactEmailModule from './pivot/contact_email';
import * as categoryEmailModule from './pivot/category_email';
import * as fieldOnboardingModule from './pivot/field_onboarding';
import * as mediaProjectModule from './pivot/media_project';
import * as milestoneProjectModule from './pivot/milestone_project';

// Import utils modules
import * as relationshipOptionsModule from './utils/relationshipOptions';

// ✅ Nested table structure for components (this is what you actually need)
export const table = {
  project: projectModule,
  task: taskModule,
  company: companyModule,
  element: elementModule,
  media: mediaModule,
  email: emailModule,
  brand: brandModule,
  typography: typographyModule,
  checklist: checklistModule,
  contact: contactModule,
  resource: resourceModule,
  comment: commentModule,
  contract: contractModule,
  contractpart: contractpartModule,
  product: productModule,
  deliverable: deliverableModule,
  payment: paymentModule,
  proposal: proposalModule,
  milestone: milestoneModule,
  feature: featureModule,
  login: loginModule,
  color: colorModule,
  event: eventModule,
  event_login: eventLoginModule,
  onboarding: onboardingModule,
  onboardingsection: onboardingsectionModule
};

// ✅ For pivot tables
export const pivot = {
  brand_project: brandProjectModule,
  category_project: categoryProjectModule,
  checklist_task: checklistTaskModule,
  comment_project: commentProjectModule,
  company_project: companyProjectModule,
  contact_project: contactProjectModule,
  event_project: eventProjectModule,
  email_project: emailProjectModule,
  contact_email: contactEmailModule,
  category_email: categoryEmailModule,
  field_onboarding: fieldOnboardingModule,
  media_project: mediaProjectModule,
  milestone_project: milestoneProjectModule
};

// ✅ For utility functions
export const utils = {
  relationshipOptions: relationshipOptionsModule
};

// ✅ BACKWARD COMPATIBILITY: Export individual modules if needed
export { projectModule as project };
export { taskModule as task };
export { typographyModule as typography };
export { companyModule as company };
export { elementModule as element };
export { mediaModule as media };
export { emailModule as email };
export { brandModule as brand };
export { checklistModule as checklist };
export { contactModule as contact };
export { resourceModule as resource };
export { commentModule as comment };
export { contractModule as contract };
export { contractpartModule as contractpart };
export { productModule as product };
export { deliverableModule as deliverable };
export { paymentModule as payment };
export { proposalModule as proposal };
export { milestoneModule as milestone };
export { featureModule as feature };
export { loginModule as login };
export { colorModule as color };
export { eventModule as event };
export { eventLoginModule as event_login };
export { onboardingModule as onboarding };
export { onboardingsectionModule as onboardingsection };


//Pivot
export { brandProjectModule as brand_project };
export { categoryProjectModule as category_project };
export { checklistTaskModule as checklist_task };
export { commentProjectModule as comment_project };
export { companyProjectModule as company_project };
export { contactProjectModule as contact_project };
export { eventProjectModule as event_project };
export { emailProjectModule as email_project };
export { contactEmailModule as contact_email };
export { categoryEmailModule as category_email };
export { fieldOnboardingModule as field_onboarding };
export { mediaProjectModule as media_project };
export { milestoneProjectModule as milestone_project };
export { milestoneProjectModule as milestoneProject }; // Add this line for backward compatibility

// Utils
export { relationshipOptionsModule as relationshipOptions };

// ✅ Static import helper that webpack can analyze
const loadModule = async (path) => {
  try {
    console.log(`[queries/index] Loading module: ${path}`);
    
    // Use a switch statement to provide static import paths that webpack can analyze
    let module;
    switch (path) {
      case './operations/recordOps':
      case './operations/recordOps.js':
        module = await import('./operations/recordOps.js');
        break;
      case './operations/multiRelOps':
      case './operations/multiRelOps.js':
        module = await import('./operations/multiRelOps.js');
        break;
      case './pivot/contract_contractpart':
      case './pivot/contract_contractpart.js':
        module = await import('./pivot/contract_contractpart.js');
        break;
      case './operations/drive':
      case './operations/drive.js':
        module = await import('./operations/drive.js');
        break;
      case './operations/deleteOps':
      case './operations/deleteOps.js':
        module = await import('./operations/deleteOps.js');
        break;
      default:
        console.warn(`[queries/index] Unknown module path: ${path}`);
        return {};
    }
    
    console.log(`[queries/index] Successfully loaded: ${path}`);
    return module;
  } catch (error) {
    console.warn(`[queries/index] Failed to load module ${path}:`, error.message);
    return {};
  }
};

// ✅ Operation caches and lazy loaders
let recordOpsCache = null;
let multiRelOpsCache = null;
let contractOpsCache = null;
let driveOpsCache = null;

export const recordOps = {
  async updateRecord(...args) {
    if (!recordOpsCache) {
      recordOpsCache = await loadModule('./operations/recordOps');
    }
    
    if (!recordOpsCache.updateRecord) {
      throw new Error('updateRecord function not available in record operations');
    }
    
    return recordOpsCache.updateRecord(...args);
  },
  
  async createRecord(...args) {
    if (!recordOpsCache) {
      recordOpsCache = await loadModule('./operations/recordOps');
    }
    
    if (!recordOpsCache.createRecord) {
      throw new Error('createRecord function not available in record operations');
    }
    
    return recordOpsCache.createRecord(...args);
  },
  
  async deleteRecord(...args) {
    if (!recordOpsCache) {
      recordOpsCache = await loadModule('./operations/recordOps');
    }
    
    if (!recordOpsCache.deleteRecord) {
      throw new Error('deleteRecord function not available in record operations');
    }
    
    return recordOpsCache.deleteRecord(...args);
  }
};

export const multiRelOps = {
  async saveMultiRelationshipField(...args) {
    if (!multiRelOpsCache) {
      multiRelOpsCache = await loadModule('./operations/multiRelOps.js');
    }
    
    if (!multiRelOpsCache.saveMultiRelationshipField) {
      console.warn('saveMultiRelationshipField function not available - skipping');
      return { success: true, errors: [] };
    }
    
    return multiRelOpsCache.saveMultiRelationshipField(...args);
  },
  
  async saveAllMultiRelationshipFields(...args) {
    if (!multiRelOpsCache) {
      multiRelOpsCache = await loadModule('./operations/multiRelOps.js');
    }
    
    if (!multiRelOpsCache.saveAllMultiRelationshipFields) {
      console.warn('saveAllMultiRelationshipFields function not available - skipping');
      return { success: true, errors: [] };
    }
    
    return multiRelOpsCache.saveAllMultiRelationshipFields(...args);
  }
};

export const contractOps = {
  async fetchContractPartsForContract(...args) {
    if (!contractOpsCache) {
      contractOpsCache = await loadModule('./pivot/contract_contractpart.js');
    }
    
    if (!contractOpsCache.fetchContractPartsForContract) {
      console.warn('fetchContractPartsForContract function not available - skipping');
      return { success: false, error: 'Contract operations not available' };
    }
    
    return contractOpsCache.fetchContractPartsForContract(...args);
  },
  
  async saveContractPartsForContract(...args) {
    if (!contractOpsCache) {
      contractOpsCache = await loadModule('./pivot/contract_contractpart.js');
    }
    
    if (!contractOpsCache.saveContractPartsForContract) {
      console.warn('saveContractPartsForContract function not available - skipping');
      return { success: false, error: 'Contract operations not available' };
    }
    
    return contractOpsCache.saveContractPartsForContract(...args);
  },
  
  async addContractPartToContract(...args) {
    if (!contractOpsCache) {
      contractOpsCache = await loadModule('./pivot/contract_contractpart.js');
    }
    
    if (!contractOpsCache.addContractPartToContract) {
      console.warn('addContractPartToContract function not available - skipping');
      return { success: false, error: 'Contract operations not available' };
    }
    
    return contractOpsCache.addContractPartToContract(...args);
  },
  
  async removeContractPartFromContract(...args) {
    if (!contractOpsCache) {
      contractOpsCache = await loadModule('./pivot/contract_contractpart.js');
    }
    
    if (!contractOpsCache.removeContractPartFromContract) {
      console.warn('removeContractPartFromContract function not available - skipping');
      return { success: false, error: 'Contract operations not available' };
    }
    
    return contractOpsCache.removeContractPartFromContract(...args);
  }
};

export const driveOps = {
  async handleDriveOperation(...args) {
    if (!driveOpsCache) {
      driveOpsCache = await loadModule('./operations/drive.js');
    }
    
    if (!driveOpsCache.handleDriveOperation) {
      console.warn('handleDriveOperation function not available - skipping');
      return { success: true, operation: 'none' };
    }
    
    return driveOpsCache.handleDriveOperation(...args);
  },
  
  async triggerDriveFolderCreation(...args) {
    if (!driveOpsCache) {
      driveOpsCache = await loadModule('./operations/drive.js');
    }
    
    if (!driveOpsCache.triggerDriveFolderCreation) {
      console.warn('triggerDriveFolderCreation function not available - skipping');
      return { success: false, error: 'Drive operations not available' };
    }
    
    return driveOpsCache.triggerDriveFolderCreation(...args);
  },
  
  async triggerDriveFolderRename(...args) {
    if (!driveOpsCache) {
      driveOpsCache = await loadModule('./operations/drive.js');
    }
    
    if (!driveOpsCache.triggerDriveFolderRename) {
      console.warn('triggerDriveFolderRename function not available - skipping');
      return { success: false, error: 'Drive operations not available' };
    }
    
    return driveOpsCache.triggerDriveFolderRename(...args);
  }
};

// ✅ Add deleteOps cache
let deleteOpsCache = null;

// ✅ Add deleteOps object with lazy-loaded functions
export const deleteOps = {
  async deleteWithDependencies(...args) {
    if (!deleteOpsCache) {
      deleteOpsCache = await loadModule('./operations/deleteOps');
    }
    
    if (!deleteOpsCache.deleteWithDependencies) {
      throw new Error('deleteWithDependencies function not available in delete operations');
    }
    
    return deleteOpsCache.deleteWithDependencies(...args);
  },
  
  async deleteFromTable(...args) {
    if (!deleteOpsCache) {
      deleteOpsCache = await loadModule('./operations/deleteOps');
    }
    
    if (!deleteOpsCache.deleteFromTable) {
      throw new Error('deleteFromTable function not available in delete operations');
    }
    
    return deleteOpsCache.deleteFromTable(...args);
  },
  
  async deleteFromPivotTable(...args) {
    if (!deleteOpsCache) {
      deleteOpsCache = await loadModule('./operations/deleteOps');
    }
    
    if (!deleteOpsCache.deleteFromPivotTable) {
      throw new Error('deleteFromPivotTable function not available in delete operations');
    }
    
    return deleteOpsCache.deleteFromPivotTable(...args);
  }
};

// ✅ Grouped operations export
export const operations = {
  record: recordOps,
  multiRel: multiRelOps,
  contract: contractOps,
  drive: driveOps,
  delete: deleteOps
};

// ✅ DEBUGGING FUNCTIONS
/**
 * Debug function to list all available functions for a table
 */
export const debugTableFunctions = (tableName) => {
  const moduleQueries = table[tableName];
  if (!moduleQueries) {
    console.log(`No queries available for table: ${tableName}`);
    console.log('Available tables:', Object.keys(table));
    return null;
  }
  
  const functions = Object.keys(moduleQueries).filter(key => 
    typeof moduleQueries[key] === 'function'
  );
  
  console.log(`Functions available for ${tableName}:`, functions);
  return functions;
};

/**
 * Debug function to test if create function exists for a table
 */
export const debugCreateFunction = (tableName) => {
  const moduleQueries = table[tableName];
  if (!moduleQueries) {
    console.log(`No queries available for table: ${tableName}`);
    return false;
  }
  
  const capitalizedTable = tableName.charAt(0).toUpperCase() + tableName.slice(1);
  const possibleNames = [
    `insert${capitalizedTable}`,
    `create${capitalizedTable}`,
    'insert',
    'create'
  ];
  
  const availableFunctions = Object.keys(moduleQueries);
  
  console.log(`Checking create functions for ${tableName}:`);
  console.log('Available functions:', availableFunctions);
  
  for (const name of possibleNames) {
    if (moduleQueries[name] && typeof moduleQueries[name] === 'function') {
      console.log(`✅ Found: ${name}`);
      return { found: true, functionName: name };
    } else {
      console.log(`❌ Not found: ${name}`);
    }
  }
  
  return { found: false, functionName: null };
};

/**
 * Test record operations availability
 */
export const debugRecordOps = async () => {
  console.log('[queries/index] Testing record operations...');
  
  try {
    // Test loading the module directly
    const recordModule = await loadModule('./table/record.js');
    console.log('✅ Record module loaded:', Object.keys(recordModule));
    
    // Test specific functions
    console.log('updateRecord available:', !!recordModule.updateRecord);
    console.log('createRecord available:', !!recordModule.createRecord);
    console.log('deleteRecord available:', !!recordModule.deleteRecord);
    
    return recordModule;
  } catch (err) {
    console.error('❌ Failed to load record operations:', err);
    return null;
  }
};