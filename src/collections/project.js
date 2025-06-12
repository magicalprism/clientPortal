export const project = {
  name: 'project',
  label: 'Projects',
  singularLabel: 'Project',
  table: 'project',
  editPathPrefix: '/dashboard/project',
  showKanbanTab: true,
  showTimelineTab: true,
  showEditButton: true, // ✅ just a UI toggle
  subtitleField: 'title',
  brandBoard: { enabled: true },
  defaultView: 'dashboard',
  kanban: {
    enabled: true,
    modes: ['milestone', 'support'], // Available modes
    defaultMode: 'milestone',
    defaultShowCompleted: false,
    taskConfig: 'task' // References @collections/task
  },
  views: {
     dashboard: { // ✅ Add dashboard view
      label: 'Dashboard',
      component: 'ProjectDashboard'
    },
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
        relatedFields: ['contacts'],
         linkOverrides: {
            logins: 'link_id_details.url',        // In QuickView only, use project.url field for links
    },
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
      name: 'staging_url', 
      label: 'Staging URL', 
      type: 'link',
      tab: 'Overview',   
      group: 'Project Info',
      
      },
              // Google Drive integration
    {
      name: 'create_folder',
      type: 'boolean',
      label: 'Google Drive Project Folders',
      group: 'Details',
      tab: 'Overview', 
      variant: 'full',
      description: 'Automatically creates and manages Google Drive folders for this project.'
    },
        {
      name: 'project_folder',
      label: 'Primary Content Folder',
      type: 'link',
      description: 'Location of project folder',
      group: 'Details',
      tab: 'Overview'
    },
    {
      name: 'content',
      label: 'Strategy',
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
        { 
      name: 'care_plan_id', 
      label: 'Care Plan', 
      tab: 'Overview',
      group: 'Deliverables', 
      type: 'relationship',
      relation: {
        table: 'product',
        labelField: 'title',
        linkTo: '/dashboard/product',
      } 
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
// In the Brand tab section:
{
  name: 'brands',
  label: 'Primary Brand',
  type: 'multiRelationship',
  tab: 'Brand',
  group: 'Brand Details',
  displayMode: 'tags',
  relation: {
    table: 'brand',
    labelField: 'title',
    linkTo: '/dashboard/brand',
    junctionTable: 'brand_project',
    sourceKey: 'project_id',
    targetKey: 'brand_id',
    filter: {

    }
  }
},
{
  name: 'brand_board_preview',
  label: 'Brand Board Preview',
  type: 'custom',
  component: 'BrandBoardPreview',
  tab: 'Brand',
  group: 'Brand Details',
  fullWidth: true,
  description: 'Live preview of the brand board. Data is automatically pulled from the selected brand or company\'s primary brand.'
},
    {
      name: 'logins',
      label: 'Logins',
      type: 'multiRelationship',
      tab: 'Backend',
      group: 'Logins',
      displayMode: 'tags',
      relation: {
        table: 'login',
        labelField: 'title',
        linkTo: '/dashboard/login',
        junctionTable: 'login_project',
        sourceKey: 'project_id',
        targetKey: 'login_id',
        tableFields: ['title', 'link_id', 'link_id_details.url'],
        filter: {}
      }
    },
        {
      name: 'platform',
      label: 'Site Platform',
      type: 'select',
      tab: 'Meta',
      group: 'General',
      options: [
        { label: 'WordPress', value: 'wordpress' },
        { label: 'React', value: 'react' },
        { label: 'Web Studio', value: 'webstudio' },
        { label: 'Cloudflare', value: 'cloudflare' },
      ]
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
      type: 'link',
      tab: 'Content',
    },
{
  name: 'media_items',
  label: 'All Media',
  type: 'galleryRelationship',
  tab: 'Content',
  database: false,
  showAll: true,
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
        { label: 'Onboarding', value: 'onboarding' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Maintained', value: 'maintained' },
        { label: 'Delayed', value: 'delayed' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Abandonded', value: 'abandonded' },
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
    },
        // Hidden database fields for Drive integration
    {
      name: 'drive_folder_id',
      type: 'text',
      tab: 'Meta', 
      group: 'General',
      database: true,
      editable: false,
      includeInViews: ['none'] // Hidden from all UI views
    },
    {
      name: 'drive_original_name',
      type: 'text', 
      tab: 'Meta', 
      group: 'General',
      database: true,
      editable: false,
      includeInViews: ['none'] // Hidden from all UI views
    },
  
  ],
  filters: [
          {
        name: 'search',
        label: 'Search',
        type: 'text',
        multiple: false,
        excludeFromViews: ['dashboard']
      },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      multiple: false,
      defaultValue: [],
      options: [
       { label: 'Onboarding', value: 'onboarding' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Maintained', value: 'maintained' },
        { label: 'Delayed', value: 'delayed' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Abandonded', value: 'abandonded' },
        { label: 'Archived', value: 'archived' }
      ],
      excludeFromViews: ['dashboard']
    },
    {
      name: 'company_id',
      type: 'relationship',
      label: 'Company',
      multiple: false,
      relation: {
        table: 'company',
        labelField: 'title',
        filter: { is_client: true } // optional: filters options
      },
      excludeFromViews: ['dashboard']
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
      ],
      excludeFromViews: ['dashboard']
    }
    
  ]
};
