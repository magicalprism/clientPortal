export const project = {
  name: 'project',
  label: 'Projects',
  singularLabel: 'Project',
  table: 'project',
  editPathPrefix: '/dashboard/project',
  showTimelineTab: true,
  showEditButton: true, // ✅ just a UI toggle
  subtitleField: 'title',
  brandBoard: { enabled: true },
  defaultView: 'table',
  views: {
    table: {
      label: 'Table View',
      component: 'PrimaryTableView',

    },
      page: { 
        label: 'Page View', 
        component: 'PageView' 
      },

        
  },
      //Quickview
      quickView: {
        enabled: true,
        imageField: 'thumbnail_id',
        titleField: 'title',
        subtitleField: 'status',
        descriptionField: 'site_tagline',
        extraFields: ['url', 'logins', 'cloudflare_url', 'company_id', 'contacts'],
        relatedFields: ['contacts']
      }, 
  fields: [   
    // Overview
{ 
      name: 'title', 
      label: 'Title', 
      tab: 'Overview', 
      group: 'Project Info', 
      clickable: true, 
      showInTable: true,
    
    },
    { 
      name: 'url', 
      label: 'URL', 
      type: 'link',
      tab: 'Overview',   
      group: 'Project Info',
      
      },
    {
      name: 'content',
      label: 'General Description',
      type: 'richText',
      tab: 'Overview',
      fullWidth: true,

    },
    {
      name: 'company_id',
      label: 'Company',
      type: 'relationship',
      tab: 'Overview',
      group: 'Project Info', 
      showInTable: true,
  
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company', // or dynamically derive from config
        filter: { is_client: 'true' }
      }
    },
        // Google Drive integration
    {
      name: 'create_folder',
      type: 'boolean',
      label: 'Google Drive Project Folders',
      group: 'Details',
      tab: 'Overview', 
      variant: 'full',
      description: 'Automatically creates and manages Google Drive folders for this project. Folders will be organized as: Company > Projects > [Project Name]'
    },
    
    // Hidden database fields for Drive integration
    {
      name: 'drive_folder_id',
      type: 'text',
      database: true,
      includeInViews: ['none'] // Hidden from all UI views
    },
    {
      name: 'drive_original_name',
      type: 'text', 
      database: true,
      includeInViews: ['none'] // Hidden from all UI views
    },
    {
      name: 'tasks',
      label: 'Tasks',
      type: 'multiRelationship',
      tab: 'Tasks',
      component: 'CollectionView',
      displayMode: 'table',
      relation: {
        table: 'task',
        labelField: 'title',
        linkTo: '/dashboard/task',
        sourceKey: 'project_id',
        
      },
       
    },
    {
      name: 'element_map',
      label: 'Site Element Map',
      type: 'custom',
      tab: 'Site Structure',
      component: 'ElementMap',
    },
{
  name: 'element_id',
  label: 'Elements',
  type: 'multiRelationship',
  tab: 'Site Structure',
  group: 'General',
  displayMode: 'tags',
  relation: {
    table: 'element',
    labelField: 'title',
    linkTo: '/dashboard/element',
    isOneToMany: true,
    sourceKey: 'project_id',
    filterFrom: 'project',
    filter: {
      project_id: '{{record.id}}'
    }
  }
},
     {
      name: 'brand_board_preview',
      label: 'Brand Board Preview',
      type: 'custom',
      component: 'BrandBoardPreview',
      tab: 'Brand',
    },
    { 
      name: 'care_plan_id', 
      label: 'Care Plan', 
      tab: 'Deliverables',
      group: 'Subscriptions',
      type: 'relationship',
      relation: {
        table: 'product',
        labelField: 'title',
        linkTo: '/dashboard/product',
      } 
    },
 { 
      name: 'cloudflare_url', 
      label: 'Cloudflare URL', 
      type: 'link',      
      tab: 'Backend',
      group: 'Cloudflare', 
      displayLabel: 'https://dash.cloudflare.com...',   
    },
    { 
      name: 'domain_login_id', 
      label: 'Domain Login',
      type: 'relationship',
      tab: 'Backend',
      group: 'Hosting',   
      relation: {
        table: 'login',
        labelField: 'title',
        linkTo: '/dashboard/login',
        filter: { type: 'domain' }
      }
    },
    { 
      name: 'cloudflare_zone', 
      label: 'Cloudflare Zone', 
      tab: 'Backend',
      group: 'Cloudflare', 

    },
{ 
      name: 'cloudflare_account', 
      label: 'Cloudflare Account', 
      tab: 'Backend',
      group: 'Cloudflare', 
      
    },
{
      name: 'server_id',
      label: 'Server',
      type: 'relationship',
      tab: 'Backend',
      group: 'Hosting',
      relation: {
        table: 'server',
        labelField: 'title',
        linkTo: '/dashboard/server'
      }
    },

    {
      name: 'project_folder',
      label: 'Project Folder',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'title',
        linkTo: 'url', // or dynamically derive from config
      },
      tab: 'Files',
    },
{
  name: 'media_items',
  label: 'All Media',
  type: 'galleryRelationship',
  tab: 'Files',
  database: false,
  showAll: true,
  filters: [
    { name: 'mime_type', label: 'File Type' },
    { name: 'element_id', label: 'Page or Element'  },
], // 👈 multiple fields used in dropdowns
  sortOptions: [ // ✅ Add this here
      { value: 'title:asc', label: 'Title (A–Z)' },
      { value: 'title:desc', label: 'Title (Z–A)' },
      { value: 'created_at:desc', label: 'Newest Created' },
      { value: 'created_at:asc', label: 'Oldest Created' }
    ],
  relation: {
    table: 'media',
    labelField: 'title',
    junctionTable: 'media_project',
    sourceKey: 'project_id',
    targetKey: 'media_id',
    foreignKey: 'project_id',
    filter: {
      project_id: 'record.id'
    }
  }, 
},
{
      name: 'logins',
      label: 'Logins',
      type: 'multiRelationship',
      tab: 'Links',
      group: 'Logins',
      displayMode: 'tags',
      relation: {
        table: 'login',
        labelField: 'title',
        linkTo: '/dashboard/login',
        junctionTable: 'login_project',
        sourceKey: 'project_id',
        targetKey: 'login_id',
        tableFields: ['title'],
        filter: {}
      }
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
        junctionTable: 'category_project',
        sourceKey: 'project_id',
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
    { 
      name: 'author_id', 
      label: 'Author', 
      type: 'relationship',
      tab: 'Meta',
      group: 'General',
      relation: {
        table: 'contact',
        labelField: 'title',
        linkTo: '/dashboard/contact' // or dynamically derive from config
      }, 
    },
    { 
      name: 'created_at', 
      label: 'Created', 
      type: 'timestamp',
       tab: 'Meta',
      group: 'General', 
    },
    { 
      name: 'updated_at', 
      label: 'Updated At', 
      type: 'timestamp' , 
      tab: 'Meta',
      group: 'General', 
    },
 { 
      name: 'site_timezone', 
      label: 'Site Timezone', 
      group: 'Site', 
      tab: 'Meta', 
      type: 'timezone',
    },

    {
      name: 'parent_id',
      label: 'Parent Project',
      group: 'General',
      tab: 'Meta', 
      type: 'relationship',
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project', // or dynamically derive from config

      }
    },
    { 
      name: 'start_date', 
      label: 'Start Date', 
      type: 'date',
      tab: 'Meta', 
      group: 'Dates', 
      
    },
     { 
      name: 'launch_date', 
      label: 'Projected Launch Date', 
      type: 'date',
      tab: 'Meta', 
      group: 'Dates',
    },

{ 
      name: 'blog_public', 
      label: 'Blog Public', 
      type: 'boolean', 
      group: 'Site', 
      tab: 'Meta', 
    },
 { 
      name: 'site_tagline', 
      label: 'Site Tagline', 
      group: 'Site', 
      tab: 'Meta', 
    },
    { 
      name: 'site_name', 
      label: 'Site Name', 
      group: 'Site', 
      tab: 'Meta', 
    },
    { 
      name: 'admin_email', 
      label: 'Admin Email', 
      group: 'Site', 
      tab: 'Meta', 
    },
   {
  name: 'contacts',
  label: 'Contact',
  type: 'multiRelationship',  
  tab: 'Meta',   
  group: 'General',
  displayMode: 'tags',
  relation: {
    table: 'contact',
    labelField: 'title',
    linkTo: '/dashboard/contact',
    junctionTable: 'contact_project', //must keep or it breaks
    sourceKey: 'project_id',
    targetKey: 'contact_id',
    filterFrom: 'contact_project',
    filter: {
      is_assignable: true
    }
  }
},
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      tab: 'Meta',
      group: 'General',
      showInTable: true,
      width: 'auto',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Maintained', value: 'maintained' },
        { label: 'Archived', value: 'archived' }
      ]
    },
    {
      name: 'notes',
      type: 'comments',
      label: 'Notes',
      tab: 'Notes',
      group: 'General',
      props: {
        entity: 'project',
      }
    }
  
  ],
  filters: [
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: [],
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Maintained', value: 'maintained' },
        { label: 'Archived', value: 'archived' }
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
      name: 'sort',
      type: 'select',
      label: 'Sort',
      defaultValue: 'title:asc',
      options: [
        { value: 'title:asc', label: 'Title (A–Z)' },
        { value: 'title:desc', label: 'Title (Z–A)' },
        { value: 'created_at:desc', label: 'Newest Created' },
        { value: 'created_at:asc', label: 'Oldest Created' }
      ]
    }
    
  ]
};
