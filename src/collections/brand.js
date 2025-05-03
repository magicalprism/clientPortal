// /collections/brand.js 
//All primary should coordinate and secondary should be the reverse colors so we can utlize dark mode and light mode
export const brand = {
  name: 'brand',
  label: 'Brand',
  editPathPrefix: '/dashboard/brand',
  showEditButton: true, // ✅ just a UI toggle
  subtitleField: 'title',
      //Quickview
      quickView: {
        enabled: true,

        titleField: 'title',
      }, 
  fields: [
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
      type: 'media',
      relation: {
        table: 'media',
        labelField: 'url'  // or 'alt' if you want something different
      },
      group: 'Font Files',
      tab: 'Fonts'
    },
  ]
};
