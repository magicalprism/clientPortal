// /collections/brand.js 
//All primary should coordinate and secondary should be the reverse colors so we can utlize dark mode and light mode
export const brand = {
  name: 'brand',
  label: 'Brand',
  editPathPrefix: '/dashboard/brand',
  brandBoard: { enabled: true },
  showEditButton: true, // ✅ just a UI toggle
  subtitleField: 'title',
      //Quickview
      quickView: {
        enabled: true,
        imageField: 'thumbnail_id',
        titleField: 'title',
        subtitleField: 'status',
        extraFields: ['brand_board', 'brand_folder', 'images_folder']
      }, 
  fields: [
    { 
      name: 'title', 
      label: 'Title', 
      group: 'Brand Details',
      tab: 'Details',
      clickable: true, 
      openMode: 'full', 
      showInTable: true,
      width: 'auto',
      description: 'Please use a unique name so it can be easily recognized when a client has multiple sites.'
    },
    {
      name: 'company_id',
      label: 'Company',
      group: 'Brand Details',
      tab: 'Details', 
      type: 'relationship',
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company', // or dynamically derive from config
        filter: { is_client: 'true' }
      }
    },
    {
      name: 'brand_board_preview',
      label: 'Brand Board Preview',
      type: 'custom',
      component: 'BrandBoardPreview',
      tab: 'Details', // You can place this in any tab or group you like
      group: 'Brand Details'
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
      label: 'Images Folder',
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Primary Folders',
      tab: 'Folders'
    },
   
    //Colors
    //Primary Light
    {
      name: 'primary_color',
      label: 'Primary',
      description: '--foreground-primary',
      type: 'color',
      tab: 'Colors', 
      group: 'Foreground Colors', 
    },
    //Secondary Dark
   {
      name: 'secondary_color',
      label: 'Secondary',
      description: '--foreground-secondary',
      type: 'color',
      tab: 'Colors', 
      group: 'Foreground Colors', 
    },
    //Accent
    {
      name: 'primary_accent_color',
      label: 'Primary Accent',
      description: '--foreground-primary-accent',
      type: 'color',
      tab: 'Colors', 
      group: 'Foreground Colors', 
    },
    {
      name: 'secondary_accent_color',
      label: 'Secondary Accent',
      description: '--foreground-secondary-accent',
      type: 'color',
      tab: 'Colors', 
      group: 'Foreground Colors',  
    },
    //Borders
    {
      name: 'border_primary_color',
      label: 'Primary Border',
      description: '--foreground-primary-border',
      type: 'color',
      tab: 'Colors', 
      group: 'Foreground Colors', 
    },
    {
      name: 'border_secondary_color',
      label: 'Secondary Border',
      description: '--foreground-secondary-border',
      type: 'color',
      tab: 'Colors', 
      group: 'Foreground Colors', 
    },

    //Backgrounds
    {
      name: 'background_primary_color',
      label: 'Primary Background color',
      description: '--background-primary',
      type: 'color',
      tab: 'Colors', 
      group: 'Background Colors',
    },
    {
      name: 'background_secondary_color',
      label: 'Secondary Background Color',
      description: '--background-secondary',
      type: 'color',
      tab: 'Colors', 
      group: 'Background Colors',
    },

    //Alt Brand Colors
    {
      name: 'alt_color_1',
      label: 'Alt Color #1',
      description: '--alt-color-1',
      type: 'color',
      tab: 'Colors', 
      group: 'Alternative Colors',
    },
    {
      name: 'alt_color_2',
      label: 'Alt Color #2',
      description: '--alt-color-2',
      type: 'color',
      tab: 'Colors', 
      group: 'Alternative Colors',
    },
    {
      name: 'alt_color_3',
      label: 'Alt Color #3',
      description: '--alt-color-3',
      type: 'color',
      tab: 'Colors', 
      group: 'Alternative Colors',
    },
    {
      name: 'alt_color_4',
      label: 'Alt Color #4',
      description: '--alt-color-4',
      type: 'color',
      tab: 'Colors', 
      group: 'Alternative Colors',
    },
    {
      name: 'alt_color_5',
      label: 'Alt Color #5',
      description: '--alt-color-5',
      type: 'color',
      tab: 'Colors', 
      group: 'Alternative Colors',
    },
    {
      name: 'alt_color_6',
      label: 'Alt Color #6',
      description: '--alt-color-6',
      type: 'color',
      tab: 'Colors', 
      group: 'Alternative Colors',
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
      tab: 'Fonts'
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
      tab: 'Fonts'
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
      tab: 'Fonts'
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
      tab: 'Fonts'
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
      tab: 'Fonts'
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
      tab: 'Fonts'
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
      tab: 'Fonts'
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
      tab: 'Fonts'
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
    /*

    */
  ]
};
