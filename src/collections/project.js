export const project = {
  name: 'project',
  label: 'Projects',
  singularLabel: 'Project',
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
      kanban: {
         label: 'Kanban View', 
         component: 'KanbanView' 
        },
        checklist: {
          label: 'Checklist View',
          component: 'ChecklistView'
        },
        calendar: {
          label: 'Calendar',
          component: 'CalendarView', // Make sure this matches the export name of your dynamic calendar view
        },
        
  },
      //Quickview
      quickView: {
        enabled: true,
        imageField: 'thumbnail_id',
        titleField: 'title',
        subtitleField: 'status',
        descriptionField: 'site_tagline',
        extraFields: ['url', 'cloudflare_url', 'company_id', 'contacts'],
        relatedFields: ['contacts']
      }, 
  fields: [   
    // Overview
    { 
      name: 'title', 
      label: 'Title', 
      group: 'Project Info', 
      clickable: true, 
      openMode: 'full', 
      tab: 'Overview', 
      showInTable: true,
      width: 'auto',
      description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
    },
    {
      name: 'parent_id',
      label: 'Parent Project',
      group: 'Project Info',
      tab: 'Overview', 
      type: 'relationship',
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project', // or dynamically derive from config

      }
    },

    
    
    { name: 'url', label: 'URL', group: 'Project Info', type: 'link',  tab: 'Overview', },

    //Site Info
    { name: 'site_name', label: 'Site Name', group: 'Site Info', tab: 'Overview', },
    { name: 'site_tagline', label: 'Site Tagline', group: 'Site Info', tab: 'Overview', },
    { 
      name: 'site_timezone', 
      label: 'Site Timezone', 
      group: 'Site Info', 
      tab: 'Overview', 
      type: 'timezone',
    },
     { name: 'blog_public', label: 'Blog Public', group: 'Site Info', tab: 'Overview', type: 'boolean', },
    { name: 'admin_email', label: 'Admin Email', group: 'Site Info', tab: 'Overview', },

    //1 project has 1 company but a company has many projects
    {
      name: 'company_id',
      label: 'Company',
      group: 'Project Info',
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
      name: 'start_date', 
      label: 'Start Date', 
      type: 'date',
      group: 'Site Info', 
      tab: 'Overview', 
    },

     { 
      name: 'launch_date', 
      label: 'Projected Launch Date', 
      type: 'date',
      group: 'Site Info', 
      tab: 'Overview', 
    },


    // Media
    //Thumbnails
     {
      name: 'brand_board_preview',
      label: 'Brand Board Preview',
      type: 'custom',
      component: 'BrandBoardPreview',
      group: 'Media',
      tab: 'Brand'
    },
        {
      name: 'brand_id',
      label: 'Brand',
      group: 'Brand',
      tab: 'Brand',
      type: 'relationship',
      showInTable: true,
  
      relation: {
        table: 'brand',
        labelField: 'title',
        linkTo: '/dashboard/brand', // or dynamically derive from config
      }
    },
    //1 to many but not relationship or multi fields
    {
      name: 'thumbnail_id',
      label: 'Thumbnail',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Media',
      tab: 'Brand'
    },
    {
      name: 'screenshot_id',
      label: 'Screenshot',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Media',
      tab: 'Brand'
    },

    //media folders
    //Brand board


    //Backend
    //Hosting
    //1 project has 1 server
    {
      name: 'server_id',
      label: 'Server',
      tab: 'Backend',
      group: 'Hosting',
      type: 'relationship',

      relation: {
        table: 'server',
        labelField: 'title',
        linkTo: '/dashboard/server'
      }
    },
    { 
      name: 'domain_login_id', 
      label: 'Domain Login',
      group: 'Hosting',
      type: 'relationship',
      tab: 'Backend',
      relation: {
        table: 'link',
        labelField: 'title',
        linkTo: '/dashboard/link',
        filter: { type: 'domain' }
      }
    },
    // Cloudflare
    { name: 'cloudflare_url', label: 'Cloudflare URL', group: 'Cloudflare', type: 'link', displayLabel: 'https://dash.cloudflare.com...', tab: 'Backend' },
    { name: 'cloudflare_zone', label: 'Cloudflare Zone', group: 'Cloudflare', tab: 'Backend' },
    { name: 'cloudflare_account', label: 'Cloudflare Account', group: 'Cloudflare', tab: 'Backend' },

    
    //Deliverables

    //Services


  {
  name: 'file_deliverables',
  type: 'galleryRelationship',
  label: 'Files',
  showAll: false,
  relation: {
    table: 'media',
    labelField: 'title',
    junctionTable: 'media_project',
    sourceKey: 'project_id',
    targetKey: 'media_id',
    foreignKey: 'project_id',
    filter: {
      project_id: '{{record.id}}'
    }
  },
    group: 'Site Deliverables',
      tab: 'Deliverables',
},
//1 project has 1 care plan  but a care plan has many projects
    { 
      name: 'care_plan_id', 
      label: 'Care Plan', 
      group: 'Subscriptions',
      tab: 'Deliverables',
      type: 'relationship',
      relation: {
        table: 'product',
        labelField: 'title',
        linkTo: '/dashboard/product',
      } 
    },

    //Proposals
    //Contracts
    
    //Site Elements

    {
      name: 'element_map',
      label: 'Site Element Map',
      type: 'custom',
      component: 'ElementMap',
      tab: 'Site Structure',
      group: 'Elements'
    },
    //1 project has many elements but 1 element only has 1 project
{
  name: 'element_id',
  label: 'Elements',
  type: 'multiRelationship',
  displayMode: 'tags',
  group: 'General',
  tab: 'Meta',
  relation: {
    table: 'element',
    labelField: 'title',
    linkTo: '/dashboard/element',
    isOneToMany: true,
    sourceKey: 'project_id',  // this is on element table
    targetKey: 'project_id',  // ✅ add this
    filterFrom: 'project',
    filter: {
      project_id: '{{record.id}}'
    }
  }
},
    // Content


    //Team
    //don't worry because its component 
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
        sourceKey: 'project_id',
        
      },
      
       tab: 'Tasks',
      group: 'Upcoming'
    },

//different kind of field
{
  name: 'media_items',
  type: 'galleryRelationship',
  label: 'All Media',
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
    tab: 'Resources',
  group: 'Media',
},


    
    
    //Meta
    //a project has many contacts
   {
  name: 'contacts',
  label: 'Contact',
  type: 'multiRelationship',     
  group: 'General',
  tab: 'Meta',
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
      group: 'General',
      type: 'select',
      tab: 'Meta',
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
    //a project has 1 author
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
//a project has many tags and tags have many projects
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
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
  
  ],
  filters: [
    {
      name: 'status',
      type: 'select',
      label: 'Status',
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
