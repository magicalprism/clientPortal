export const contact = {
    name: 'contact',
    label: 'Contacts',
     table:'contact',
    singularLabel: 'Contact',
    showEditButton: true,
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
        labelField: 'title',
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
        { value: 'none', label: 'None' },
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
      showInTable: true,
      options: [
        { value: 'active', label: 'Active' },
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
      name: 'companies',
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
        filter: { is_client: 'true' },
        filterFrom: 'company'
      }
    },

   {
  name: 'project_id',
  label: 'Project',
  type: 'multiRelationship',     
  group: 'General',
  tab: 'Overview',
  displayMode: 'tags',
  relation: {
    table: 'project',
    labelField: 'title',
    isOneToMany: true,
    linkTo: '/dashboard/project',
    junctionTable: 'contact_project',
    sourceKey: 'contact_id',
    targetKey: 'project_id',
    filterFrom: 'contact',
    filterFrom: 'company_contact',
    filter: {

    }
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
      tab: 'Meta',
      group: 'General',
      displayMode: 'tags',
      relation: {
        table: 'category',
        labelField: 'title',
        linkTo: '/dashboard/category',
        junctionTable: 'category_contact',
        sourceKey: 'contact_id',
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
],

    filters: [
            {
        name: 'search',
        label: 'Search',
        type: 'text',
        multiple: false
      },
      {
        name: 'status',
        type: 'select',
        label: 'Status',
        defaultValue: ['active'],
        options: [  
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
      ],
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
              defaultValue: 'title:asc',
              excludeFromViews: ['calendar', 'checklist']

      },
    
      
      
    ]
}
      