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
      name: 'page_folder_url',
      label: 'Page Folder',
      group: 'Page Info',
      tab: 'Overview', 
      type: 'link',
      description: 'Google drive folder containing copy, graphics, images & offer doc',
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
        { label: 'Template', value: 'single' }
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
        { label: 'Copywriting', value: 'copywriting' },
        { label: 'Development', value: 'development' },
        { label: 'Edits', value: 'edits' },
        { label: 'Done', value: 'done' },
        { label: 'Archived', value: 'archived' },
      ]
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
      options: [
        { label: 'Planning', value: 'planning' },
        { label: 'Copywriting', value: 'copywriting' },
        { label: 'Development', value: 'development' },
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
