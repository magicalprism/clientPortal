export const project = {
  name: 'project',
  label: 'Projects',
  editPathPrefix: '/dashboard/project',
      //Quickview
      quickView: {
        enabled: true,
        imageField: 'thumbnail',
        titleField: 'title',
        subtitleField: 'status',
        descriptionField: 'site_tagline',
        extraFields: ['url', 'cloudflare_url']
      }, 
  fields: [   
    // Project Info
    { name: 'title', label: 'Title', group: 'Project Info', clickable: true, openMode: 'modal', tab: 'Overview', showInTable: true },
    { name: 'slug', label: 'Slug', group: 'Project Info' },
    { name: 'status', label: 'Status', group: 'Project Info', type: 'status', showInTable: true },
    { name: 'start_date', label: 'Start Date', group: 'Project Info', type: 'date' },
    { name: 'created', label: 'Created', group: 'Project Info', type: 'date' },
    { name: 'updated_at', label: 'Updated At', group: 'Project Info', type: 'date' },
    { name: 'author_id', label: 'Author ID', group: 'Project Info' },
    { name: 'parent_id', label: 'Parent ID', group: 'Project Info' },

    // Site Info
    { name: 'url', label: 'URL', group: 'Site Info', type: 'url', type: 'link' },
    { name: 'site_name', label: 'Site Name', group: 'Site Info' },
    { name: 'site_tagline', label: 'Site Tagline', group: 'Site Info' },
    { name: 'site_timezone', label: 'Site Timezone', group: 'Site Info' },
    { name: 'show_on_front', label: 'Show on Front', group: 'Site Info' },
    { name: 'admin_email', label: 'Admin Email', group: 'Site Info' },

    // Media
    { name: 'thumbnail', label: 'Thumbnail', group: 'Media', type: 'image', type: 'media' },
    { name: 'screenshot', label: 'Screenshot', group: 'Media', type: 'image', type: 'media' },

    // Cloudflare
    { name: 'cloudflare_url', label: 'Cloudflare URL', group: 'Cloudflare', type: 'link', displayLabel: 'Cloudflare Dashboard' },
    { name: 'cloudflare_zone', label: 'Cloudflare Zone', group: 'Cloudflare' },
    { name: 'cloudflare_account', label: 'Cloudflare Account', group: 'Cloudflare' },

    // Relationships
    {
      name: 'company_id',
      label: 'Company',
      group: 'Relationships',
      type: 'relationship',
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company' // or dynamically derive from config
      }
    },
    {
      name: 'server_id',
      label: 'Server',
      group: 'Relationships',
      type: 'relationship',
      tab: 'Hosting',
      relation: {
        table: 'server',
        labelField: 'title',
        linkTo: '/dashboard/server'
      }
    },
    
    { 
      name: 'care_plan_id', 
      label: 'Care Plan ID', 
      group: 'Relationships',
      tab: 'Hosting',
      type: 'relationship',
      relation: {
        table: 'product',
        labelField: 'title',
        linkTo: '/dashboard/product'
      } 
    },
    { 
      name: 'domain_login_id', 
      label: 'Domain Login ID',
      group: 'Relationships',
      type: 'relationship',
      tab: 'Hosting',
      relation: {
        table: 'link',
        labelField: 'title',
        linkTo: '/dashboard/link'
      }
    },

    // Content
    { name: 'content', label: 'Content', group: 'Content' },
    { name: 'categories', label: 'Categories', group: 'Content', type: 'json' },
    { name: 'blog_public', label: 'Blog Public', group: 'Content', type: 'boolean' },

    // Utility
    {
      name: 'edit',
      label: 'Edit',
      width: '100px',
      align: 'right',
      type: 'editButton',
      exclude: true,
      openMode: 'page', // or 'modal'
      showInTable: true
    },
    
  ],
  filters: [
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      options: ['draft', 'published', 'archived']
    },
    {
      name: 'company_id',
      type: 'number',
      label: 'Company ID'
    }
  ]
};
