export const contact = {
    name: 'contact',
    label: 'Contacts',
    singularLabel: 'Contact',
    editPathPrefix: '/dashboard/contact',
    subtitleField: 'title',
    defaultView: 'table',
        views: {
          table: {
            label: 'Table View',
            component: 'PrimaryTableView'
          },

        },
        //Quickview
        quickView: {
          enabled: true,
          imageField: 'thumbnail_id',
          titleField: 'title',
          subtitleField: 'status',

        }, 
    fields: [   
      // Overview
            { 
        name: 'title', 
        label: 'Full Name', 
        group: 'Details',
        tab: 'Overview', 
        clickable: true,  
        showInTable: true,
        editable: false,
      },
      { 
        name: 'first_name', 
        label: 'First Name', 
        group: 'Details',
        tab: 'Overview', 
      },
       { 
        name: 'last_name', 
        label: 'Last Name', 
        group: 'Details',
        tab: 'Overview', 
      },
      { 
      name: 'thumbnail_id', 
      label: 'Headshot', 
      type: 'media',
      group: 'General',
      tab: 'Meta',
      relation: {
        relation: {
        table: 'media',
        labelField: 'alt_text',
        linkTo: 'url', // or dynamically derive from config
      },
      }, 
    },
      { 
        name: 'email', 
        label: 'Email', 
        group: 'Details',
        tab: 'Overview', 
        showInTable: true,
      },
            { 
        name: 'is_assignable', 
        type: 'boolean',
        label: 'Can we assign them tasks?', 
        group: 'Details',
        tab: 'Overview', 

      },
      { 
        name: 'role', 
        label: 'Role', 
        type: 'select',
        group: 'Details',
        tab: 'Overview', 
      options: [
        { value: 'user', label: 'User' },
        { value: 'super-admin', label: 'Super Admin' },
        { value: 'staff', label: 'Archived' },
      ]
    },
     {
      name: 'status',
      type: 'select',
      label: 'Status',
      group: 'Primary', 
      tab: 'Meta', 
      defaultValue: 'todo',
      showInTable: true,
      options: [
        { value: 'client', label: 'Client' },
        { value: 'team', label: 'Team' },
        { value: 'archived', label: 'Archived' },
      ]
    },
    {
      name: 'parent_id',
      label: 'Parent',
      group: 'General', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'contact', //usually current collection or pivot table
        labelField: 'title',
        linkTo: '/dashboard/contact', // or dynamically derive from config
      }
    },

     {
      name: 'company_id',
      label: 'Company',
      type: 'multiRelationship',
      group: 'Details',
      tab: 'Overview', 
      displayMode: 'tags', 
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company', // or dynamically derive from config
        junctionTable: 'company_contact',
        sourceKey: 'contact_id',
        targetKey: 'company_id',
        filter: { is_client: 'true' }
      }
    },
     {
      name: 'project_id',
      label: 'Project',
      type: 'multiRelationship',     
      group: 'Details',
      tab: 'Overview', 
      displayMode: 'tags',
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project',
        junctionTable: 'contact_project',
        sourceKey: 'contact_id',
        targetKey: 'project_id'

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
        junctionTable: 'category_contact',
        sourceKey: 'contact_id',
        targetKey: 'category_id'
      }
    },
],

    filters: [
      {
        name: 'status',
        type: 'select',
        label: 'Status',
        options: [  
          { value: 'client', label: 'Client' },
          { value: 'team', label: 'Team' },
          { value: 'archived', label: 'Archived' },
      ],
      defaultValue: '',
      },
      {
        name: 'sort',
        type: 'select',
        label: 'Sort',
        
        options: [
          { value: 'title:asc', label: 'Title (A–Z)' },
          { value: 'title:desc', label: 'Title (Z–A)' },
          { value: 'created_at:desc', label: 'Newest Created' },
          { value: 'created_at:asc', label: 'Oldest Created' }
        ],
              defaultValue: 'due_date:asc',
              excludeFromViews: ['calendar', 'checklist']

      },
       {
      name: 'company_id',
      label: 'Company',
      type: 'relationship',
      relation: {
        table: 'company', //usually current collection or pivot table
        labelField: 'title',
        filter: { is_client: true } //temporary until I add all clients & contractors as users 
      }
    },
      
      
    ]
}
      