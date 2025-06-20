// /collections/brand.js 
//All primary should coordinate and secondary should be the reverse colors so we can utlize dark mode and light mode
export const brand = {
  name: 'brand',
  label: 'Brand',
   table:'brand',
  singularLabel: 'Brand',
  editPathPrefix: '/dashboard/brand',
  brandBoard: { enabled: true },
  showEditButton: true, // ✅ just a UI toggle
  subtitleField: 'title',
      //Quickview
    
  defaultView: 'table',
  views: {
    table: {
      label: 'Table View',
      component: 'TaskTableView'
    },
  },
  fields: [
        {
      name: 'brand_board_preview',
      label: 'Brand Board Preview',
      type: 'custom',
      component: 'BrandBoardPreview',
      tab: 'Overview', // You can place this in any tab or group you like

    },
            {
  name: 'color_tokens',
  label: 'Color Tokens',
  type: 'custom',
  tab: 'Colors', 
  group: 'Tokens',
  component: 'ColorTokenEditor'
},
    {
  name: 'typography_tokens',
  label: 'Typography Design Tokens',
  type: 'custom',
  component: 'TypographyTokenEditor',
  description: 'Manage typography design tokens for this brand',
  editable: true,
  group: 'Font Files',
      tab: 'Fonts',
  admin: true // Optional: only show to admins
},
    { 
      name: 'title', 
      label: 'Title', 
      group: 'Brand Details',
      tab: 'Fields',
      clickable: true, 
      openMode: 'full', 
      showInTable: true,
      width: 'auto',
      description: 'Use the pattern [Company/Project] [Branding Type] [Status]'
    },
    {
      name: 'company_id',
      label: 'Company',
      group: 'Brand Details',
      tab: 'Fields',
      showInTable: true,
      type: 'relationship',
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company', // or dynamically derive from config
        filter: { is_client: 'true' }
      }
    },
    //use manytomany for one to many to make life easier
  {
      name: 'projects',
      label: 'Projects',
      type: 'multiRelationship',
       group: 'Brand Details',
      tab: 'Fields', 
      displayMode: 'tags',
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project',
        junctionTable: 'brand_project',
        sourceKey: 'brand_id',
        targetKey: 'project_id',
        tableFields: ['title'],
        filter: {}
      }
    },



    
    {
      name: 'brand_board',
      label: 'Brand Board',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'alt_text',
        linkTo: 'url', // or dynamically derive from config
      },
      group: 'Primary Folders',
      tab: 'Folders'
    },
    {
      name: 'brand_folder',
      is_folder: true,
      label: 'Brand Folder',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Primary Folders',
      tab: 'Folders'
    },
    {
      name: 'images_folder',
      is_folder: true,
      label: 'Images Folder',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Primary Folders',
      tab: 'Folders'
    },
    {
      name: 'canva_folder',
      is_folder: true,
      label: 'Canva Folder',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Primary Folders',
      tab: 'Folders'
    },
   
    //Colors
    //Primary Colors

    {
      name: 'primary_color',
      label: 'Primary',
      description: '--primary-color-500',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },

   {
      name: 'secondary_color',
      label: 'Secondary',
      description: '--secondary-color-500',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },

       {
      name: 'neutral_color_100',
      label: 'Light Neutral',
      description: '--neutral-color-100',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },
           {
      name: 'neutral_color_900',
      label: 'Dark Neutral',
      description: '--neutral-color-900',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },
     {
      name: 'success_color',
      label: 'Success Color',
      description: '--success-color-500',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },
     {
      name: 'error_color',
      label: 'Error Color',
      description: '--error-color-500',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },
         {
      name: 'warning_color',
      label: 'Warning Color',
      description: '--warning-color-500',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },
         {
      name: 'info_color',
      label: 'Info Color',
      description: '--info-color-500',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },


    //Alt Brand Colors
    {
      name: 'alt_color_1',
      label: 'Alt Color #1',
      description: '--alt-color-1',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },
    {
      name: 'alt_color_2',
      label: 'Alt Color #2',
      description: '--alt-color-2',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },
    {
      name: 'alt_color_3',
      label: 'Alt Color #3',
      description: '--alt-color-3',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },
    {
      name: 'alt_color_4',
      label: 'Alt Color #4',
      description: '--alt-color-4',
      type: 'text',
      tab: 'Fields', 
      group: 'Colors',
    },


    //Fonts

    {
      name: 'primary_font',
      label: 'Primary Font',
      description: '--primary-font',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Font Files',
      tab: 'Fields', 
    },
    {
      name: 'italic_primary_font',
      label: 'Italic Primary Font',
      description: '--italic-primary-font',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Font Files',
      tab: 'Fields', 
    },
    {
      name: 'secondary_font',
      label: 'Secondary Font',
      description: '--secondary-font',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Font Files',
      tab: 'Fields', 
    },
    {
      name: 'italic_secondary_font',
      label: 'Italic Secondary Font',
      description: '--italic-secondary-font',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Font Files',
      tab: 'Fields', 
    },
    {
      name: 'body_font',
      label: 'Body Font',
      description: '--body-font',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Font Files',
      tab: 'Fields', 
    },
    {
      name: 'italic_body_font',
      label: 'Italic Body Font',
      description: '--italic-body-font',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Font Files',
      tab: 'Fields', 
    },
    {
      name: 'accent_font',
      label: 'Accent Font',
      description: '--accent-font',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Font Files',
      tab: 'Fields', 
    },
    {
      name: 'italic_accent_font',
      label: 'Italic Accent Font',
      description: '--italic-accent-font',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Font Files',
      tab: 'Fields', 
    },
    
    //Logos
    {
      name: 'primary_square_logo',
      label: 'Primary Square Logo',
      description: '--primary-square-logo',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'All Logos',
      tab: 'Logos'
    },
    {
      name: 'secondary_square_logo',
      label: 'Secondary Square Logo',
      description: '--secondary-square-logo',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'All Logos',
      tab: 'Logos'
    },
    {
      name: 'primary_horizontal_logo',
      label: 'Primary Horizontal Logo',
      description: '--primary-horizontal-logo',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'All Logos',
      tab: 'Logos'
    },
    {
      name: 'secondary_horizontal_logo',
      label: 'Secondary Horizontal Logo',
      description: '--secondary-horizontal-logo',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'All Logos',
      tab: 'Logos'
    },
    {
      name: 'favicon',
      label: 'Favicon',
      description: '--favicon',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'All Logos',
      tab: 'Logos'
    },

    //meta
    { 
      name: 'created_at', 
      label: 'Created', 
      type: 'timestamp',
      group: 'General', 
      tab: 'Meta',
      showInTable: true,
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
      name: 'is_deleted',
      type: 'boolean',
      label: 'Show Deleted',
      tab: 'Meta',
      group: 'General',
      defaultValue: false
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      group: 'Primary', 
      tab: 'Meta', 
      defaultValue: '',
      options: [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'project', label: 'Project Only' },
        { value: 'archived', label: 'Archived' },
      ]
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
        junctionTable: 'brand_category',
        sourceKey: 'brand_id',
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
    {
      name: 'parent_id',
      label: 'Parent',
      group: 'General',
      tab: 'Meta', 
      type: 'relationship',
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company', // or dynamically derive from config
        filter: { is_client: 'true' }
      }
    },
      {
  name: 'inspiration',
  label: 'Inspiration',
  type: 'galleryRelationship',
  database: false,
  tab: 'Inspiration',
  group: 'Website Inspiration',
  showAll: false,
  relation: {
    table: 'media',
    labelField: 'title',
    junctionTable: 'brand_media',
    sourceKey: 'brand_id',    // ✅ FIXED: Brand ID column in junction table
    targetKey: 'media_id', 
    filter: {
    }
  },
},
    /*

    */
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
      defaultValue: [],
      options: [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'project', label: 'Project Only' },
        { value: 'archived', label: 'Archived' },
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
      options: [
        { value: 'title:asc', label: 'Title (A–Z)' },
        { value: 'title:desc', label: 'Title (Z–A)' },
        { value: 'created_at:desc', label: 'Newest Created' },
        { value: 'created_at:asc', label: 'Oldest Created' }
      ]
    },
    {
      name: 'is_deleted',
      type: 'boolean',
      label: 'Show Deleted',
      defaultValue: false
    }
  ]
};
