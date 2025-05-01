export const project = {
  name: 'project',
  label: 'Projects',
  editPathPrefix: '/dashboard/project',
  showEditButton: true, // ✅ just a UI toggle
  subtitleField: 'title',
      //Quickview
      quickView: {
        enabled: true,
        imageField: 'thumbnail_id',
        titleField: 'title',
        subtitleField: 'status',
        descriptionField: 'site_tagline',
        extraFields: ['url', 'cloudflare_url']
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
        filter: { company_id: '{{record.company_id}}' }
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
    { name: 'show_on_front', label: 'Show on Front', group: 'Site Info', tab: 'Overview', },
    { name: 'admin_email', label: 'Admin Email', group: 'Site Info', tab: 'Overview', },

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
  
    
    //TImeline
    { 
      name: 'start_date', 
      label: 'Start Date', 
      type: 'date',
      group: 'Overview', 
      tab: 'Timeline'
    },

    // Media
    //Thumbnails
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
    {
      name: 'server_id',
      label: 'Server',
      group: 'Hosting',
      type: 'relationship',
      tab: 'Backend',
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
      name: 'care_plan_id', 
      label: 'Care Plan', 
      group: 'Subscriptions',
      tab: 'Deliverables',
      type: 'relationship',
      relation: {
        table: 'product',
        labelField: 'title',
        linkTo: '/dashboard/product'
      } 
    },

    //Proposals
    //Contracts
    

    // Content
    { name: 'content', label: 'Content', group: 'Content', tab: 'Content' },
    { name: 'categories', label: 'Categories', group: 'Content', type: 'json', tab: 'Content' },
    { name: 'blog_public', label: 'Blog Public', group: 'Content', type: 'boolean', tab: 'Content' },

    //Team
    //Tasks
    {
      name: 'tasks',
      label: 'Tasks',
      type: 'multiRelationship',
      displayMode: 'table',
      relation: {
        table: 'task',
        labelField: 'title',
        linkTo: '/dashboard/task',
        junctionTable: 'project_task',
        sourceKey: 'project_id',
        targetKey: 'task_id',
        tableFields: ['title', 'status', 'assigned_id'],
        filters: [
          {
            name: 'status',
            type: 'select',
            label: 'Status',
            options: ['todo', 'in-progress', 'done']
          },
          {
            name: 'assigned_id',
            type: 'relationship',
            label: 'Assigned To',
            relation: {
              table: 'contact',
              labelField: 'title'
            }
          }
        ]
      }
    },
    
    
    
    //Meta
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
    }
    
  ]
};
