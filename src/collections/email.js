// src/collections/email.js
export const email = {
  name: 'email',
  label: 'Emails',
  table: 'email',
  singularLabel: 'Email',
  editPathPrefix: '/dashboard/email',
  showEditButton: true,
  subtitleField: 'title',
  defaultView: 'table',
  views: {
    table: {
      label: 'Table View',
      component: 'PrimaryTableView',
    },
  },
  // QuickView configuration for preview cards
  quickView: {
    enabled: true,
    titleField: 'title',
    subtitleField: 'status',
    descriptionField: 'summary',
    extraFields: ['url', 'company_id', 'projects'],
  },
  fields: [
    { 
      name: 'title', 
      label: 'Subject', 
      tab: 'Overview', 
      clickable: true, 
      showInTable: true,
    },
    { 
      name: 'summary', 
      label: 'Summary', 
      tab: 'Overview',
      showInTable: true,
    },
    { 
      name: 'url', 
      label: 'URL', 
      type: 'link',
      tab: 'Overview',
      showInTable: true,
    },
    { 
      name: 'author_id', 
      label: 'Author', 
      type: 'relationship',
      tab: 'Meta',
      relation: {
        table: 'contact',
        labelField: 'title',
        linkTo: '/dashboard/contact'
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
      type: 'timestamp',
      tab: 'Meta',
    },
    {
      name: 'parent_id',
      label: 'Parent Email',
      tab: 'Overview', 
      type: 'relationship',
      relation: {
        table: 'email',
        labelField: 'title',
        linkTo: '/dashboard/email',
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
        { label: 'Processed', value: 'processed' },
        { label: 'Archived', value: 'archived' },
        { label: 'Spam', value: 'spam' },
        { label: 'Deleted', value: 'deleted' },
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
        junctionTable: 'category_email',
        sourceKey: 'email_id',
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
        linkTo: '/dashboard/company',
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
        junctionTable: 'email_project',
        sourceKey: 'email_id',
        targetKey: 'project_id',
        tableFields: ['title'],
        filter: {}
      }
    },
    {
      name: 'contacts',
      label: 'Contacts',
      type: 'multiRelationship',
      tab: 'Overview',
      displayMode: 'tags',
      relation: {
        table: 'contact',
        labelField: 'title',
        linkTo: '/dashboard/contact',
        junctionTable: 'contact_email',
        sourceKey: 'email_id',
        targetKey: 'contact_id',
        tableFields: ['title', 'email'],
        filter: {}
      }
    },
    {
      name: 'deleted_at',
      label: 'Deleted At',
      type: 'timestamp',
      tab: 'Meta',
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
      name: 'status',
      type: 'select',
      label: 'Status',
      options: [
        { label: 'Unsorted', value: 'unsorted' },
        { label: 'Pending', value: 'pending' },
        { label: 'Processed', value: 'processed' },
        { label: 'Archived', value: 'archived' },
        { label: 'Spam', value: 'spam' },
        { label: 'Deleted', value: 'deleted' },
      ]
    },
    {
      name: 'company_id',
      type: 'relationship',
      label: 'Company',
      relation: {
        table: 'company',
        labelField: 'title',
        filter: { is_client: true }
      }
    },
    {
      name: 'sort',
      type: 'select',
      label: 'Sort',
      defaultValue: 'created_at:desc',
      options: [
        { value: 'title:asc', label: 'Subject (A–Z)' },
        { value: 'title:desc', label: 'Subject (Z–A)' },
        { value: 'created_at:desc', label: 'Newest' },
        { value: 'created_at:asc', label: 'Oldest' }
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