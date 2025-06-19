// /collections/media.js (or wherever your media config is)
export const media = {
  name: 'media',
  label: 'Media',
  table:'media',
  singularLabel: 'Media',
  editPathPrefix: '/dashboard/media',
  showEditButton: true, // ✅ just a UI toggle
  subtitleField: 'title',
  defaultView: 'table',
  views: {
    table: {
      label: 'Table View',
      component: 'PrimaryTableView',

    },

        
  },
      //Quickview
      quickView: {
        enabled: true,
        imageField: 'url',
        titleField: 'title',
        subtitleField: 'status',
        descriptionField: 'description',
        extraFields: ['url', 'company_id', 'projects'],
      }, 
  fields: [
            { 
      name: 'url', 
      label: 'URL', 
      type: 'media',
      tab: 'Overview', 
      
      },
      
    { 
      name: 'title', 
      label: 'Title', 
      tab: 'Overview', 
      clickable: true, 
      showInTable: true,
    
    },
{ 
      name: 'is_folder', 
      label: 'Is Folder', 
      type: 'boolean',
      tab: 'Overview', 
    
    },
    { 
      name: 'is_external', 
      label: 'External File or Folder', 
      type: 'boolean',
      tab: 'Overview', 
    
    },
{ 
      name: 'description', 
      label: 'Description', 
      tab: 'Overview', 
    
    },
{ 
      name: 'alt_text', 
      label: 'Alt Text', 
      tab: 'Overview', 
    
    },
    { 
      name: 'copyright', 
      label: 'Copyright', 
      tab: 'Overview', 
    }, 
{ 
      name: 'original_title', 
      label: 'Original Title', 
      tab: 'Overview', 
    
    },
    { 
      name: 'author_id', 
      label: 'Author', 
      type: 'relationship',
      tab: 'Meta',
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
    },
    { 
      name: 'updated_at', 
      label: 'Updated At', 
      type: 'timestamp' , 
      tab: 'Meta',
    },
    {
      name: 'parent_id',
      label: 'Parent Media Item',
      tab: 'Overview', 
      type: 'relationship',
      relation: {
        table: 'media',
        labelField: 'title',
        linkTo: '/dashboard/media', // or dynamically derive from config

      }
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      tab: 'Meta',
      width: 'auto',
      showInTable: true,
      options: [
        { label: 'Unsorted', value: 'unsorted' },
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Uploaded', value: 'uploaded' },
        { label: 'Linked', value: 'linked' },
      ]
    },
  {
      name: 'tags',
      label: 'Tags',
      type: 'multiRelationship',
      tab: 'Overview',
      displayMode: 'tags',
      relation: {
        table: 'category',
        labelField: 'title',
        linkTo: '/dashboard/category',
        junctionTable: 'category_media',
        sourceKey: 'media_id',
        targetKey: 'category_id',
        tableFields: ['title'],
        filter: {}
      }
    },
    {
      name: 'company_id',
      label: 'Company',
      type: 'relationship',
      tab: 'Overview',
      showInTable: true,  
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company', // or dynamically derive from config
        filter: { is_client: 'true' }
      }
    },
{
  name: 'projects',
  label: 'Projects',
  type: 'multiRelationship',
  tab: 'Overview',
  displayMode: 'tags',
  relation: {
    table: 'project',
    labelField: 'title',
    linkTo: '/dashboard/project',
    junctionTable: 'media_project', // Junction table name
    sourceKey: 'media_id',          // ✅ FIXED: Media ID column in junction table
    targetKey: 'project_id',        // ✅ FIXED: Project ID column in junction table
    tableFields: ['title'],
    filter: {
    
    }
  }
},


    {
      name: 'mime_type',
      label: 'File type',
      type: 'select',
      tab: 'Meta',
      width: 'auto',
      showInTable: true, 
      options: [
          { label: 'Images', heading: true },
          { label: 'JPG', value: 'image/jpeg' },
          { label: 'PNG', value: 'image/png' },
          { label: 'GIF', value: 'image/gif' },
          { label: 'WEBP', value: 'image/webp' },
          { label: 'SVG', value: 'image/svg+xml' },
          { label: 'BMP', value: 'image/bmp' },
          { label: 'ICO', value: 'image/x-icon' },
          { label: 'TIFF', value: 'image/tiff' },

          { label: 'Fonts', heading: true },
          { label: 'WOFF', value: 'font/woff' },
          { label: 'WOFF2', value: 'font/woff2' },
          { label: 'TTF', value: 'font/ttf' },
          { label: 'OTF', value: 'font/otf' },
          { label: 'EOT', value: 'application/vnd.ms-fontobject' },

          { label: 'Videos', heading: true },
          { label: 'MP4', value: 'video/mp4' },
          { label: 'WEBM', value: 'video/webm' },
          { label: 'MOV', value: 'video/quicktime' },
          { label: 'AVI', value: 'video/x-msvideo' },
          { label: 'MKV', value: 'video/x-matroska' },

          { label: 'Audio', heading: true },
          { label: 'MP3', value: 'audio/mpeg' },
          { label: 'WAV', value: 'audio/wav' },
          { label: 'OGG', value: 'audio/ogg' },
          { label: 'M4A', value: 'audio/mp4' },

          { label: 'Documents', heading: true },
          { label: 'PDF', value: 'application/pdf' },
          { label: 'DOC', value: 'application/msword' },
          { label: 'DOCX', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          { label: 'XLS', value: 'application/vnd.ms-excel' },
          { label: 'XLSX', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          { label: 'PPT', value: 'application/vnd.ms-powerpoint' },
          { label: 'PPTX', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
          { label: 'TXT', value: 'text/plain' },
          { label: 'CSV', value: 'text/csv' },
          { label: 'JSON', value: 'application/json' },
          { label: 'XML', value: 'application/xml' },

          { label: 'Archives', heading: true },
          { label: 'ZIP', value: 'application/zip' },
          { label: 'RAR', value: 'application/vnd.rar' },
          { label: 'TAR', value: 'application/x-tar' },
          { label: 'GZ', value: 'application/gzip' },
          { label: '7Z', value: 'application/x-7z-compressed' },

          { label: 'Other', heading: true },
          { label: 'External Link', value: 'external/url' },
          { label: 'Folder', value: 'folder' }
      ]
    },
    {
      name: 'is_deleted',
      type: 'boolean',
      label: 'Show Deleted',
      tab: 'Meta',
      showInTable: true,
      defaultValue: false
    },
  ],
  filters: [
    {
      name: 'mime_type',
      type: 'select',
      label: 'File Type',
      options: [
          { label: 'Images', heading: true },
          { label: 'JPG', value: 'image/jpeg' },
          { label: 'PNG', value: 'image/png' },
          { label: 'GIF', value: 'image/gif' },
          { label: 'WEBP', value: 'image/webp' },
          { label: 'SVG', value: 'image/svg+xml' },
          { label: 'BMP', value: 'image/bmp' },
          { label: 'ICO', value: 'image/x-icon' },
          { label: 'TIFF', value: 'image/tiff' },

          { label: 'Fonts', heading: true },
          { label: 'WOFF', value: 'font/woff' },
          { label: 'WOFF2', value: 'font/woff2' },
          { label: 'TTF', value: 'font/ttf' },
          { label: 'OTF', value: 'font/otf' },
          { label: 'EOT', value: 'application/vnd.ms-fontobject' },

          { label: 'Videos', heading: true },
          { label: 'MP4', value: 'video/mp4' },
          { label: 'WEBM', value: 'video/webm' },
          { label: 'MOV', value: 'video/quicktime' },
          { label: 'AVI', value: 'video/x-msvideo' },
          { label: 'MKV', value: 'video/x-matroska' },

          { label: 'Audio', heading: true },
          { label: 'MP3', value: 'audio/mpeg' },
          { label: 'WAV', value: 'audio/wav' },
          { label: 'OGG', value: 'audio/ogg' },
          { label: 'M4A', value: 'audio/mp4' },

          { label: 'Documents', heading: true },
          { label: 'PDF', value: 'application/pdf' },
          { label: 'DOC', value: 'application/msword' },
          { label: 'DOCX', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          { label: 'XLS', value: 'application/vnd.ms-excel' },
          { label: 'XLSX', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          { label: 'PPT', value: 'application/vnd.ms-powerpoint' },
          { label: 'PPTX', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
          { label: 'TXT', value: 'text/plain' },
          { label: 'CSV', value: 'text/csv' },
          { label: 'JSON', value: 'application/json' },
          { label: 'XML', value: 'application/xml' },

          { label: 'Archives', heading: true },
          { label: 'ZIP', value: 'application/zip' },
          { label: 'RAR', value: 'application/vnd.rar' },
          { label: 'TAR', value: 'application/x-tar' },
          { label: 'GZ', value: 'application/gzip' },
          { label: '7Z', value: 'application/x-7z-compressed' },

          { label: 'Other', heading: true },
          { label: 'External Link', value: 'external/url' },
          { label: 'Folder', value: 'folder' }
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
        { value: 'created_at:desc', label: 'Newest Created' },
        { value: 'created_at:asc', label: 'Oldest Created' }
      ]
    },
    {
      name: 'is_deleted',
      type: 'select',
      label: 'Show Deleted',
      multiple: false,
      defaultValue: false,
      options: [
        { value: false, label: 'Hide Deleted' },
        { value: true, label: 'Show Deleted' }
      ]
    }
    
  ]
};