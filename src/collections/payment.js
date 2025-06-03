export const payment = {
  name: 'payment',
  label: 'Payments',
  table: 'payment',
  singularLabel: 'Payment',
  editPathPrefix: '/dashboard/payment',
  showEditButton: true,
  subtitleField: 'title',
  defaultView: 'table',
  views: {
    table: {
      label: 'Table View',
      component: 'PrimaryTableView'
    },
    page: { 
      label: 'Page View', 
      component: 'PageView' 
    },
    kanban: {
      label: 'Kanban View', 
      component: 'KanbanView' 
    },
    calendar: {
      label: 'Calendar',
      component: 'CalendarView',
    },
  },
  quickView: {
    enabled: true,
    imageField: 'thumbnail_id',
    titleField: 'title',
    subtitleField: 'status',
  }, 

  fields: [   
    { 
      name: 'title', 
      label: 'Payment Name', 
      group: 'Primary', 
      tab: 'Details',
      clickable: true, 
      openMode: 'modal',  
      showInTable: true,
      description: 'Descriptive name for this payment'
    },
    {
      name: 'contract_id',
      label: 'Contract',
      group: 'Primary',
      tab: 'Details',
      type: 'relationship',
      showInTable: true,
      relation: {
        table: 'contract',
        labelField: 'title',
        linkTo: '/dashboard/contract',
        filter: {}
      }
    },
    { 
      name: 'amount', 
      label: 'Amount', 
      group: 'Payment Details', 
      tab: 'Details',
      type: 'number',
      showInTable: true,
      description: 'Payment amount in USD'
    },
    {
      name: 'frequency',
      type: 'select',
      label: 'Frequency',
      group: 'Payment Details',
      tab: 'Details',
      showInTable: true,
      options: [
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
        { value: null, label: 'One-time' },
      ],
      description: 'Payment frequency (null = one-time payment)'
    },
    {
      name: 'is_recurring',
      label: 'Is Recurring',
      type: 'boolean',
      group: 'Payment Details',
      tab: 'Details',
      editable: false,
      description: 'Automatically calculated from frequency'
    },
    { 
      name: 'due_date', 
      label: 'Due Date', 
      group: 'Schedule', 
      tab: 'Details',
      type: 'date',
      showInTable: true,
    },
    { 
      name: 'alt_due_date', 
      label: 'Alternative Due Date', 
      group: 'Schedule', 
      tab: 'Details',
      type: 'text',
      description: 'Text-based due date (e.g., "Upon project completion")'
    },
    {
      name: 'payment_url',
      label: 'Payment URL',
      type: 'link',
      group: 'Payment Processing',
      tab: 'Details',
      description: 'Stripe checkout or invoice URL (typically set on first payment only)'
    },
    {
      name: 'stripe_invoice_id',
      label: 'Stripe Invoice ID',
      group: 'Payment Processing',
      tab: 'Processing',
      editable: false,
      description: 'Stripe invoice identifier'
    },
    {
      name: 'stripe_subscription_id',
      label: 'Stripe Subscription ID',
      group: 'Payment Processing',
      tab: 'Processing',
      editable: false,
      description: 'Stripe subscription identifier for recurring payments'
    },
    {
      name: 'status',
      type: 'select',
      label: 'Payment Status',
      group: 'Status', 
      tab: 'Status',
      defaultValue: 'pending',
      showInTable: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'sent', label: 'Invoice Sent' },
        { value: 'paid', label: 'Paid' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
      ]
    },
    {
      name: 'paid_at',
      label: 'Paid At',
      type: 'timestamp',
      group: 'Status',
      tab: 'Status',
      editable: false,
    },
    { 
      name: 'order_index', 
      label: 'Order Index', 
      group: 'Organization', 
      tab: 'Meta',
      type: 'number',
      description: 'Order for payment scheduling'
    },
    {
      name: 'company_id',
      label: 'Company',
      group: 'Reference',
      tab: 'Meta', 
      type: 'relationship',
      relation: {
        table: 'company',
        labelField: 'title',
        linkTo: '/dashboard/company',
        filter: { is_client: 'true' }
      }
    },
    {
      name: 'project_id',
      type: 'relationship',
      label: 'Project',
      group: 'Reference',
      tab: 'Meta', 
      relation: {
        table: 'project',
        labelField: 'title',
        linkTo: '/dashboard/project',
      }
    },
    {
      name: 'parent_id',
      label: 'Parent Payment',
      group: 'Hierarchy', 
      tab: 'Meta',
      type: 'relationship',
      relation: {
        table: 'payment',
        labelField: 'title',
        linkTo: '/dashboard/payment',
      }
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
      type: 'timestamp', 
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
        linkTo: '/dashboard/contact'
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
        junctionTable: 'category_payment',
        sourceKey: 'payment_id',
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
      label: 'Payment Status',
      multiple: true,
      defaultValue: ['pending', 'sent'],
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'sent', label: 'Invoice Sent' },
        { value: 'paid', label: 'Paid' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
      ]
    },
    {
      name: 'frequency',
      type: 'select',
      label: 'Frequency',
      options: [
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
        { value: null, label: 'One-time' },
      ]
    },
    {
      name: 'is_recurring',
      type: 'select',
      label: 'Payment Type',
      options: [
        { value: true, label: 'Recurring' },
        { value: false, label: 'One-time' },
      ]
    },
    {
      name: 'contract_id',
      type: 'relationship',
      label: 'Contract',
      relation: {
        table: 'contract',
        labelField: 'title'
      }
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
      options: [
        { value: 'due_date:asc', label: 'Due Date (Oldest First)' },
        { value: 'due_date:desc', label: 'Due Date (Newest First)' },
        { value: 'amount:desc', label: 'Amount (High to Low)' },
        { value: 'amount:asc', label: 'Amount (Low to High)' },
        { value: 'created_at:desc', label: 'Newest Created' },
        { value: 'created_at:asc', label: 'Oldest Created' }
      ],
      defaultValue: 'due_date:asc',
      excludeFromViews: ['calendar']
    }
  ]
};