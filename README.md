This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

Template documentation https://material-kit-pro-react-docs-bslicwx3m-devias.vercel.app/environment-variables


## Config Files
How to Configure Fields for FieldRenderer
Each field in your config (config.fields) can support different types, display logic, and view-specific behavior. Here's how to set it all up correctly.

✅ Basic Field Structure
Each field should follow this format:

js
Copy
Edit
{
  name: 'field_name',
  label: 'Field Label',
  type: 'text', // optional if it's a plain value
  showInTable: true, // optional: if you want it in the table
  includeInViews: ['modal', 'edit'], // optional
  editable: true, // optional
  clickable: true, // optional (for linking to modal/page)
  openMode: 'modal' // or 'page'
}
🧠 type Reference
type	Behavior in Renderer
'date'	Formats value as a local date string
'currency'	Formats value as $0.00
'media'	Renders as an image tag
'link'	Renders a clickable link (auto-detected if value starts with http)
'relationship'	Shows a label and link based on record[field.name + '_label'] and relation.linkTo
'boolean'	Renders as "Yes" or "No"
'status'	Capitalizes value
'json'	Renders as formatted JSON block
'editButton'	Renders a ✏️ icon that links to the edit page or modal (uses openMode)
(default)	Renders plain text, or clickable text if clickable: true
📌 includeInViews
Control where a field should show up:

js
Copy
Edit
includeInViews: ['modal', 'edit'] // ✅ Show in modal and edit mode
includeInViews: ['table'] // ✅ Only show in table
includeInViews: ['none'] // 🚫 Hide everywhere
If includeInViews is omitted, the field is shown in all views by default.

✅ showInTable
js
Copy
Edit
showInTable: true // Only renders in the table view when true
This is especially useful to hide non-critical fields from tables but still show them in modals or edit pages.

✏️ Example: Editable Title Field
js
Copy
Edit
{
  name: 'title',
  label: 'Title',
  clickable: true,
  openMode: 'modal', // Opens modal on click in table
  showInTable: true,
  includeInViews: ['modal', 'edit']
}
✏️ Example: Edit Button Column
js
Copy
Edit
{
  name: 'edit',
  label: 'Edit',
  type: 'editButton',
  openMode: 'page', // or 'modal'
  width: '80px',
  align: 'right',
  exclude: true, // don’t send to Supabase on save
  showInTable: true,
  includeInViews: ['table']
}
✏️ Example: Relationship Field
js
Copy
Edit
{
  name: 'company_id',
  label: 'Company',
  type: 'relationship',
  relation: {
    linkTo: '/dashboard/company'
  },
  showInTable: true,
  includeInViews: ['modal', 'edit']
}
✅ Tips
Use showInTable: true to explicitly control table columns

Use includeInViews: ['modal'] to hide fields from the edit form

Use exclude: true to skip the field when saving to Supabase (useful for editButton)