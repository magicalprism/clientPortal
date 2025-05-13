export const element = {
  name: 'element',
  label: 'Elements',
  singularLabel: 'Element',
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
      name: 'company_id',
      label: 'Company',
      group: 'Details',
      tab: 'Overview', 
      type: 'relationship',
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company', // or dynamically derive from config
        filter: { is_client: 'true' }
      }
    },

    {
      name: 'project_id',
      label: 'Project',
      group: 'Details',
      tab: 'Overview', 
      type: 'relationship',
      showInTable: true,
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project', // or dynamically derive from config
        filter: { company_id: '{{record.company_id}}' }
      },
      
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
      label: 'Is this a custom page or template?',
      type: 'boolean',
      group: 'General', 
      tab: 'Meta',
      options: [
        { label: 'Custom', value: 'custom' },
        { label: 'Template', value: 'single' }
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
        filter: { project_id: '{{record.project_id}}' }
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
      name: 'section',
      label: 'Sections',
      type: 'repeater',
      titleField: 'title',   // customizable title field
      contentField: 'content',  // customizable content field
      tab: 'Meta',
      relation: {
        table: 'section',
        labelField: 'title',
        sourceKey: 'id',            // 👈 element.id (the parent)
        targetKey: 'element_id',
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
        junctionTable: 'category_project',
        sourceKey: 'project_id',
        targetKey: 'category_id'
      }
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
        linkTo: '/dashboard/project', // or dynamically derive from config
        filter: { type: 'element' }
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
