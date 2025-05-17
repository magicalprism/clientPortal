export const element = {
  name: 'element',
  label: 'Elements',
  editPathPrefix: '/dashboard/element',
  showEditButton: true, // ✅ just a UI toggle
  subtitleField: 'title',
      //Quickview
      quickView: {
        enabled: true,
        imageField: 'thumbnail_id',
        titleField: 'title',
        subtitleField: 'status',
        extraFields: []
      }, 
  defaultView: 'table',
  views: {
    table: {
      label: 'Table View',
      component: 'TaskTableView'
    },
  },
  fields: [   
    // Overview
    { 
      name: 'title', 
      label: 'Title', 
      group: 'Details', 
      clickable: true, 
      openMode: 'full', 
      tab: 'Overview', 
      showInTable: true,
      description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
    },



     {
      name: 'company_id',
      label: 'Company',
      group: 'Details',
      tab: 'Overview', 
      type: 'relationship',
      showInTable: true,
  
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company', // or dynamically derive from config
        filter: { is_client: 'true' }
      }
    },
   


    {
      name: 'tags',
      label: 'Tags',
      type: 'multiRelationship',
      displayMode: 'tags',
      group: 'General',
      tab: 'Meta',
      relation: {
        table: 'category',
        labelField: 'title',
        linkTo: '/dashboard/category',
        junctionTable: 'category_element',
        sourceKey: 'element_id',
        targetKey: 'category_id'
      }
    },
    
    { 
      name: 'url', 
      label: 'Live Url', 
      group: 'Page Info', 
      type: 'url', 
      type: 'link', 
      tab: 'Overview', 
    },

    { 
      name: 'staging_url', 
      label: 'Staging Url', 
      group: 'Page Info', 
      type: 'url', 
      type: 'link', 
      tab: 'Overview', 
    },

    {
      name: 'folder_id',
      is_folder: true,
      label: 'Primary Content Folder',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Details',
      tab: 'Overview'
    },

    {
      name: 'final_copy_id',
      label: 'Final Copy',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Details',
      tab: 'Overview'
    },

    {
      name: 'tasks',
      label: 'Tasks',
      type: 'multiRelationship',
      component: 'CollectionView',
      displayMode: 'table',
      relation: {
        table: 'task',
        labelField: 'title',
        linkTo: '/dashboard/task',
        sourceKey: 'element_id',
        tableFields: ['title']
    },
      filters: [
         {
      name: 'status',
      type: 'select',
      label: 'Status',
      options: [
        { value: 'not started', label: 'Not Started' },
        { value: 'todo', label: 'To do' },
        { value: 'complete', label: 'Complete' },
        { value: 'unavailable', label: 'Unavailable' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'archived', label: 'Archived' },       
      ],
      defaultValue: 'todo',
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      options: [
        { value: 'due_date:asc', label: 'Due date (oldest first)' },
        { value: 'due_date:desc', label: 'Due date (newest first)' },
      ],
      defaultValue: 'due_date:asc',
    }
      ],
       tab: 'Tasks',
      group: 'Upcoming'
    },
    


    

    
    
    //Meta
    {
      name: 'status',
      label: 'Stage',
      group: 'General',
      type: 'select',
      tab: 'Meta',
      showInTable: true,
      
      options:  [
        { label: 'Planning', value: 'plan' },
        { label: 'Copywriting', value: 'copy' },
        { label: 'Development', value: 'dev' },
        { label: 'Edits', value: 'edits' },
        { label: 'Done', value: 'complete' },
        { label: 'Archived', value: 'default' },
      ]
    },

    {
      name: 'type',
      label: 'Page Type',
      type: 'select',
      group: 'General', 
      tab: 'Meta',
      showInTable: true,
      options: [
        { label: 'General Page', value: 'page' },
        { label: 'Header', value: 'header' },
        { label: 'Footer', value: 'footer' },
        { label: 'Popup', value: 'popup' }
      ]
    },  

    {
      name: 'is_template',
      label: 'Is this a template?',
      type: 'boolean',
      group: 'General', 
      tab: 'Meta',
      options: [
        { label: 'Custom', value: true },
        { label: 'Template', value: false }
      ]
    }, 
    
    {
      name: 'parent_id',
      label: 'Parent Page',
      group: 'General', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'element', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/element', // or dynamically derive from config
      }
    },
    
    { 
      name: 'created_at', 
      label: 'Created', 
      type: 'timestamp',
      group: 'General', 
      tab: 'Meta'
    },
    { 
      name: 'updated_at', 
      label: 'Updated At', 
      type: 'timestamp' , 
      group: 'General', 
      tab: 'Meta'
    },
    { 
      name: 'author_id', 
      label: 'Author', 
      type: 'relationship',
      group: 'General',
      tab: 'Meta',
      relation: {
        table: 'contact',
        labelField: 'title',
        linkTo: '/dashboard/contact' // or dynamically derive from config
      }, 
    },

   

    {
      name: 'resource_id',
      label: 'Project',
      group: 'Help',
      tab: 'Meta', 
      type: 'relationship',
      showInTable: true,
      relation: {
        table: 'resource',
        labelField: 'title',
        linkTo: '/dashboard/resource', // or dynamically derive from config
      },
      
    },
  
  ],
  filters: [
    {
      name: 'status',
      type: 'select',
      label: 'Stage',
      options: [
        { label: 'Planning', value: 'plan' },
        { label: 'Copywriting', value: 'copy' },
        { label: 'Development', value: 'dev' },
        { label: 'Edits', value: 'edits' },
        { label: 'Done', value: 'complete' },
        { label: 'Archived', value: 'default' },
      ]
    },
    {
      name: 'company_id',
      type: 'relationship',
      label: 'Company',
      relation: {
        table: 'company',
        labelField: 'title',
        filter: { is_client: true } // optional: filters options
      }
    },
    {
      name: 'project_id',
      type: 'relationship',
      label: 'Project',
      relation: {
        table: 'project',
        labelField: 'title',

      }
    }
    
  ]
};
