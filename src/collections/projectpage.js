export const projectpage = {
  name: 'projectpage',
  label: 'Project Pages',
  editPathPrefix: '/dashboard/projectpage',
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
      group: 'Page Info', 
      clickable: true, 
      openMode: 'full', 
      tab: 'Overview', 
      showInTable: true,
      description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
    },
    {
      name: 'parent_id',
      label: 'Parent Page',
      group: 'Page Info',
      tab: 'Overview', 
      type: 'relationship',
      relation: {
        table: 'projectpage',
        labelField: 'title',
        linkTo: '/dashboard/projectpage', // or dynamically derive from config
        filter: { project_id: '{{record.project_id}}' }
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
      name: 'company_id',
      label: 'Company',
      group: 'Page Info',
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
      group: 'Page Info',
      tab: 'Overview', 
      type: 'relationship',
      showInTable: true,
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project', // or dynamically derive from config
        filters: [
          {
            name: 'company_id',
            type: 'relationship',
            label: 'Company',
            relation: {
              table: 'company',
              labelField: 'title'
            }
          }
        ]
      },
      
    },

    {
      name: 'content_id',
      label: 'Page Folder',
      group: 'Page Info',
      tab: 'Overview', 
      type: 'relationship',
      relation: {
        table: 'link',
        labelField: 'title',
        linkTo: '/dashboard/link', // or dynamically derive from config
      }
    },

    

    {
      name: 'page_type',
      label: 'Page Type',
      group: 'Page Info',
      type: 'select',
      tab: 'Overview',
      showInTable: true,
      options: [
        { label: 'Custom', value: 'custom' },
        { label: 'Single Template', value: 'single' },
        { label: 'Archive Template', value: 'archive' },
        { label: 'Legal', value: 'legal' },
        { label: 'Header Template', value: 'header' },
        { label: 'Footer Template', value: 'footer' },
        { label: 'Loop Template', value: 'loop' }
      ]
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
        { label: 'Planning', value: 'planning' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Copywriting', value: 'copywriting' },
        { label: 'Design', value: 'design' },
        { label: 'Edits', value: 'edits' },
        { label: 'Done', value: 'done' },
        { label: 'Archived', value: 'archived' },
      ]
    },
    
    { 
      name: 'created_on', 
      label: 'Created', 
      type: 'timestamp',
      group: 'General', 
      tab: 'Meta'
    },
    { 
      name: 'updated_on', 
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
      name: 'tags',
      label: 'Tags',
      type: 'multiRelationship',
      displayMode: 'tags',
      relation: {
        table: 'category',
        labelField: 'title',
        linkTo: '/dashboard/category',
        junctionTable: 'category_project',
        sourceKey: 'project_id',
        targetKey: 'category_id'
      }
    },
  
  ],
  filters: [
    {
      name: 'status',
      type: 'select',
      label: 'Stage',
      defaultValue: 'in_progress',
      options: [
        { label: 'Planning', value: 'planning' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Copywriting', value: 'copywriting' },
        { label: 'Design', value: 'design' },
        { label: 'Edits', value: 'edits' },
        { label: 'Done', value: 'done' },
        { label: 'Archived', value: 'archived' },
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
